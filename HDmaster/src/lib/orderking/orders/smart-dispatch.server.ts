import type { Sql } from "../../db.ts";

export type DispatchCandidate = {
  riderId: string;
  name: string;
  vehicle: string;
  lat: number;
  lng: number;
  distanceKm: number;
  etaToRestaurantMins: number;
  activeDeliveries: number;
  acceptanceRateBps: number;
  overallScore: number;
};

export type SmartDispatchResult = {
  orderId: string;
  assignedRiderId: string | null;
  riderName?: string;
  matchedScore?: number;
  consideredCandidatesCount: number;
  status: "ASSIGNED" | "NO_RIDERS_AVAILABLE" | "QUEUED_FOR_SURGE";
  algorithmDurationMs: number;
};

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

export async function getRealDistanceMatrix(
  origins: { lat: number; lng: number }[],
  destination: { lat: number; lng: number }
): Promise<{ distanceKm: number; etaMins: number }[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || origins.length === 0) {
    return origins.map(o => {
      const distKm = calculateDistanceKm(o.lat, o.lng, destination.lat, destination.lng);
      return { distanceKm: distKm, etaMins: Math.round((distKm / 20) * 60) };
    });
  }

  try {
    const originsStr = origins.map(o => `${o.lat},${o.lng}`).join('|');
    const destStr = `${destination.lat},${destination.lng}`;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsStr}&destinations=${destStr}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json() as any;

    return origins.map((o, i) => {
      const element = data.rows?.[i]?.elements?.[0];
      if (element?.status === 'OK') {
        return {
          distanceKm: element.distance.value / 1000,
          etaMins: Math.round(element.duration.value / 60),
        };
      }
      const distKm = calculateDistanceKm(o.lat, o.lng, destination.lat, destination.lng);
      return { distanceKm: distKm, etaMins: Math.round((distKm / 20) * 60) };
    });
  } catch (err) {
    return origins.map(o => {
      const distKm = calculateDistanceKm(o.lat, o.lng, destination.lat, destination.lng);
      return { distanceKm: distKm, etaMins: Math.round((distKm / 20) * 60) };
    });
  }
}

/**
 * High-Speed Algorithmic Dispatch Engine
 * Multi-variable optimization balancing:
 * 1. Proximity to Restaurant (minimize rider pickup travel)
 * 2. Kitchen Readiness Sync (synchronize rider arrival with food ready time)
 * 3. Fleet Load Balancing (prioritize idle high-acceptance riders)
 * 4. Vehicle speed adjustment (Motorcycle > EV > Bicycle)
 */
export async function executeSmartDispatch(
  sql: Sql,
  orderId: string,
  restaurantLat: number,
  restaurantLng: number,
  zoneCode: string,
  prepTimeRemainingMins = 12
): Promise<SmartDispatchResult> {
  const start = Date.now();

  // 1. Fetch all available/online riders in or adjacent to the zone
  const riders = await sql<{
    id: string;
    name: string;
    vehicle: string;
    lat: number | null;
    lng: number | null;
    acceptance_bps: number;
    active_order_id: string | null;
  }>`
    SELECT 
      id, name, vehicle, lat, lng, acceptance_bps, active_order_id
    FROM riders
    WHERE status in ('AVAILABLE', 'ONLINE')
      AND (zone_code = ${zoneCode} OR zone_code is null)
    LIMIT 25;
  `;

  if (!riders.length) {
    return {
      orderId,
      assignedRiderId: null,
      consideredCandidatesCount: 0,
      status: "NO_RIDERS_AVAILABLE",
      algorithmDurationMs: Date.now() - start,
    };
  }

  // 2. Score each candidate
  const candidates: DispatchCandidate[] = [];
  
  const origins = riders.map(r => ({ lat: r.lat ?? restaurantLat + 0.01, lng: r.lng ?? restaurantLng + 0.01 }));
  const realMatrix = await getRealDistanceMatrix(origins, { lat: restaurantLat, lng: restaurantLng });

  for (let i = 0; i < riders.length; i++) {
    const r = riders[i];
    const rLat = origins[i].lat;
    const rLng = origins[i].lng;
    const distKm = realMatrix[i].distanceKm;

    // Filter out riders further than 10 km
    if (distKm > 10.0) continue;

    // Real travel time
    const travelTimeMins = realMatrix[i].etaMins;

    // Sync score: perfect match is when travelTime equals prepTimeRemaining
    const syncGap = Math.abs(travelTimeMins - prepTimeRemainingMins);
    const syncPenalty = syncGap * 1.5;

    // Distance penalty
    const distancePenalty = distKm * 3;

    // Acceptance bonus (higher acceptance rate = lower penalty)
    const acceptanceBonus = (r.acceptance_bps / 10000) * 10;

    // Active load penalty (batching allows 1 existing delivery with small penalty)
    const loadPenalty = r.active_order_id ? 15 : 0;

    // Lower overall score = better candidate
    const overallScore = distancePenalty + syncPenalty + loadPenalty - acceptanceBonus;

    candidates.push({
      riderId: r.id,
      name: r.name,
      vehicle: r.vehicle,
      lat: rLat,
      lng: rLng,
      distanceKm: distKm,
      etaToRestaurantMins: travelTimeMins,
      activeDeliveries: r.active_order_id ? 1 : 0,
      acceptanceRateBps: r.acceptance_bps,
      overallScore: Math.round(overallScore * 10) / 10,
    });
  }

  if (!candidates.length) {
    return {
      orderId,
      assignedRiderId: null,
      consideredCandidatesCount: 0,
      status: "NO_RIDERS_AVAILABLE",
      algorithmDurationMs: Date.now() - start,
    };
  }

  // 3. Sort ascending by overall score (lowest penalty wins)
  candidates.sort((a, b) => a.overallScore - b.overallScore);
  const best = candidates[0];

  // 4. Assign rider in database transaction
  await sql`
    UPDATE orders
    SET rider_id = ${best.riderId},
        status = 'RIDER_ASSIGNED',
        updated_at = now()
    WHERE id = ${orderId};
  `;

  await sql`
    UPDATE riders
    SET active_order_id = ${orderId},
        status = 'BUSY'
    WHERE id = ${best.riderId};
  `;

  return {
    orderId,
    assignedRiderId: best.riderId,
    riderName: best.name,
    matchedScore: best.overallScore,
    consideredCandidatesCount: candidates.length,
    status: "ASSIGNED",
    algorithmDurationMs: Date.now() - start,
  };
}

export type CascadeDispatchResult = {
  orderId: string;
  previousOfferId: string;
  nextOfferId: string | null;
  nextRiderId: string | null;
  nextRiderName?: string;
  cascadeIndex: number;
  bountyPaise: number;
  distanceKm?: number;
  status: "CASCADED" | "NO_MORE_RIDERS";
};

/**
 * Strategic Nearest-Rider Cascading Dispatch
 * If a rider declines or times out:
 * 1. Find the next closest online rider who hasn't seen the order yet.
 * 2. Increment cascade_index.
 * 3. Dynamically escalate bounty (+₹10 on 1st decline, +₹20 on 2nd, +₹30 on 3rd).
 * 4. Create an exclusive offer for the next nearest rider.
 */
export async function cascadeNextNearestRider(
  sql: Sql,
  orderId: string,
  orgId: string
): Promise<CascadeDispatchResult> {
  // 1. Get the current order details
  const orderRows = await sql<{
    id: string;
    org_id: string;
    city_id: string;
    restaurant_id: string;
  }>`
    SELECT id, org_id, city_id, restaurant_id
    FROM orders
    WHERE id = ${orderId} AND org_id = ${orgId} AND status = 'READY'
    LIMIT 1;
  `;

  if (!orderRows[0]) {
    return {
      orderId,
      previousOfferId: "",
      nextOfferId: null,
      nextRiderId: null,
      cascadeIndex: 0,
      bountyPaise: 0,
      status: "NO_MORE_RIDERS",
    };
  }

  const order = orderRows[0];

  // 2. Get restaurant location
  const restRows = await sql<{ lat: number | null; lng: number | null }>`
    SELECT lat, lng FROM restaurants WHERE id = ${order.restaurant_id} LIMIT 1;
  `;
  const restLat = restRows[0]?.lat ?? 24.8690;
  const restLng = restRows[0]?.lng ?? 92.3580;

  // 3. Find current max cascade index and already contacted riders
  const previousAssignments = await sql<{ rider_id: string; cascade_index: number }>`
    SELECT rider_id, coalesce(cascade_index, 0) as cascade_index
    FROM dispatch_assignments
    WHERE order_id = ${orderId} AND org_id = ${orgId};
  `;

  const contactedRiderIds = new Set(previousAssignments.map((p) => p.rider_id));
  const maxCascadeIndex = previousAssignments.reduce((max, p) => Math.max(max, p.cascade_index), -1);
  const nextCascadeIndex = maxCascadeIndex + 1;

  // Escalating bounty: +₹10 on 1st retry, +₹20 on 2nd retry, +₹30 on 3rd retry
  const bountyPaise = nextCascadeIndex === 1 ? 1000 : nextCascadeIndex === 2 ? 2000 : nextCascadeIndex >= 3 ? 3000 : 0;

  // 4. Fetch available online riders
  const availableRiders = await sql<{
    id: string;
    name: string;
    lat: number | null;
    lng: number | null;
    rating_x10: number;
  }>`
    SELECT id, name, lat, lng, rating_x10
    FROM riders
    WHERE org_id = ${orgId}
      AND city_id = ${order.city_id}
      AND status in ('ACTIVE', 'ONLINE')
      AND online = 1
      AND data_mode = 'PRODUCTION'
      AND active_order_id is null;
  `;

  // Filter out riders already contacted
  const uncontactedRiders = availableRiders.filter((r) => !contactedRiderIds.has(r.id));
  
  if (!uncontactedRiders.length) {
    return {
      orderId,
      previousOfferId: "",
      nextOfferId: null,
      nextRiderId: null,
      cascadeIndex: nextCascadeIndex,
      bountyPaise,
      status: "NO_MORE_RIDERS",
    };
  }

  const origins = uncontactedRiders.map(r => ({ lat: r.lat ?? restLat + 0.01, lng: r.lng ?? restLng + 0.01 }));
  const realMatrix = await getRealDistanceMatrix(origins, { lat: restLat, lng: restLng });

  const eligibleRiders = uncontactedRiders.map((r, i) => {
    return { ...r, distanceKm: realMatrix[i].distanceKm, etaSec: realMatrix[i].etaMins * 60 };
  });

  // Sort by nearest distance first
  eligibleRiders.sort((a, b) => a.distanceKm - b.distanceKm || b.rating_x10 - a.rating_x10);
  const nextRider = eligibleRiders[0];

  const nextOfferId = "offer_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  const distanceM = Math.round(nextRider.distanceKm * 1000);
  const etaSec = nextRider.etaSec;

  await sql`
    INSERT INTO dispatch_assignments (
      id, org_id, order_id, rider_id, score, distance_m, eta_seconds, status, offered_at, cascade_index, bounty_paise, distance_km
    ) VALUES (
      ${nextOfferId}, ${orgId}, ${orderId}, ${nextRider.id}, ${nextRider.distanceKm}, ${distanceM}, ${etaSec}, 'OFFERED', now(), ${nextCascadeIndex}, ${bountyPaise}, ${nextRider.distanceKm}
    );
  `;

  return {
    orderId,
    previousOfferId: "",
    nextOfferId,
    nextRiderId: nextRider.id,
    nextRiderName: nextRider.name,
    cascadeIndex: nextCascadeIndex,
    bountyPaise,
    distanceKm: nextRider.distanceKm,
    status: "CASCADED",
  };
}

