
// 1,000x Strict Geofencing & Sovereign Territory Guard for Order King & King Pay
// Enforces mandatory rule: Order King FOODS only appears where delivery is strictly active.
// Everywhere else across India, users ONLY see and experience King Pay.

export interface ActiveDeliveryZone {
  id: string;
  name: string;
  cityId: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  status: "ACTIVE" | "EXPANDING_SOON";
  description: string;
}

/**
 * Verified zones where Order King Food Delivery infrastructure is live.
 * Default flagship launch zone: Sribhumi / Karimganj core 12km radius.
 */
// Static city-radius flags cannot establish verified merchants or online riders.
export const ACTIVE_DELIVERY_ZONES: ActiveDeliveryZone[] = [
  {
    id: "karimganj_core",
    name: "Karimganj / Sribhumi Core",
    cityId: "karimganj",
    centerLat: 24.8688,
    centerLng: 92.3511,
    radiusKm: 12.0,
    status: "ACTIVE",
    description: "Launch flagship: 12km strict delivery radius across Karimganj and Sribhumi.",
  },
  {
    id: "silchar_hub",
    name: "Silchar Hub",
    cityId: "silchar",
    centerLat: 24.8333,
    centerLng: 92.7789,
    radiusKm: 10.0,
    status: "ACTIVE",
    description: "Silchar urban dining and delivery zone.",
  },
  {
    id: "guwahati_metro",
    name: "Guwahati Metro",
    cityId: "guwahati",
    centerLat: 26.1445,
    centerLng: 91.7362,
    radiusKm: 12.0,
    status: "ACTIVE",
    description: "Guwahati metropolitan delivery zone.",
  },
];

/**
 * Calculates great-circle distance between two geographic coordinates using the Haversine formula (km).
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 1,000x Strict Evaluation: Checks whether food delivery is legally active at the coordinates.
 * If false, the app MUST hide all food restaurants, carts, and delivery menus,
 * presenting ONLY the King Pay FinTech ecosystem.
 */
export function isDeliveryActiveInLocation(lat?: number, lng?: number, cityId?: string): boolean {
  if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
    return false; // no static city identifier may assert live delivery
  }

  for (const zone of ACTIVE_DELIVERY_ZONES) {
    if (zone.status !== "ACTIVE") continue;
    const distanceKm = calculateDistanceKm(lat, lng, zone.centerLat, zone.centerLng);
    if (distanceKm <= zone.radiusKm) {
      return true;
    }
  }

  // No fallback: a city name alone cannot authorize rider dispatch.

  return false;
}

/**
 * Viral Expansion Waitlist & City Growth Engine for Inactive Zones
 */
export interface CityWaitlistEntry {
  cityName: string;
  waitlistVotes: number;
  trendingRank: number;
  estimatedLaunchDays: number;
}

// No fictitious votes, rankings or announced launch dates.
export const EXPANSION_WAITLIST: Record<string, CityWaitlistEntry> = {};

export function getCityWaitlistInfo(cityName: string): CityWaitlistEntry {
  const match = Object.values(EXPANSION_WAITLIST).find(
    (w) => w.cityName.toLowerCase() === cityName.toLowerCase() || cityName.toLowerCase().includes(w.cityName.toLowerCase())
  );
  if (match) return match;

  return {
    cityName: cityName || "Your City",
    waitlistVotes: 0,
    trendingRank: 0,
    estimatedLaunchDays: 0,
  };
}
