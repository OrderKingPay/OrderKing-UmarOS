export interface GPSCoordinate {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number;
  heading?: number;
  speed?: number;
  timestamp: number;
  bearing?: number;
}

export interface TelematicsPayload {
  riderId: string;
  location: GPSCoordinate;
  batteryLevel: number;
  networkType: '5G' | '4G' | '3G' | '2G' | 'Starlink' | 'Offline';
  bearing?: number;
}

export interface LatLngPoint {
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
}

export interface CandidateRiderSpatial {
  riderId: string;
  userId: string;
  lat: number;
  lng: number;
  status: "ONLINE" | "BUSY" | "OFFLINE" | string;
  kycStatus: "VERIFIED" | "PENDING" | "REJECTED" | string;
  batteryLevel?: number;
  vehicleType?: "BICYCLE" | "MOTORCYCLE" | "CAR" | string;
}

export interface MatchedNearestRider {
  riderId: string;
  userId: string;
  distanceMeters: number;
  distanceKm: number;
  lat: number;
  lng: number;
  status: string;
  kycStatus: string;
  bearingToPickup: number;
}

/**
 * Calculates true forward geodesic bearing (azimuth in degrees, 0..359.999°) from start to destination
 * using Great Circle forward azimuth trigonometry on WGS-84 reference sphere.
 * Normalizes output into [0, 360).
 */
export function calcBearing(
  from: LatLngPoint | { latitude: number; longitude: number } | { lat: number; lng: number },
  to: LatLngPoint | { latitude: number; longitude: number } | { lat: number; lng: number }
): number;
export function calcBearing(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number
): number;
export function calcBearing(
  a: number | LatLngPoint,
  b: number | LatLngPoint,
  c?: number,
  d?: number
): number {
  let lat1: number, lon1: number, lat2: number, lon2: number;

  if (typeof a === "number" && typeof b === "number" && typeof c === "number" && typeof d === "number") {
    lat1 = a;
    lon1 = b;
    lat2 = c;
    lon2 = d;
  } else if (typeof a === "object" && typeof b === "object" && a !== null && b !== null) {
    lat1 = "latitude" in a && a.latitude != null ? a.latitude : (a as any).lat ?? 0;
    lon1 = "longitude" in a && a.longitude != null ? a.longitude : (a as any).lng ?? 0;
    lat2 = "latitude" in b && b.latitude != null ? b.latitude : (b as any).lat ?? 0;
    lon2 = "longitude" in b && b.longitude != null ? b.longitude : (b as any).lng ?? 0;
  } else {
    return 0;
  }

  // Handle coincident coordinates
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;

  const φ1 = lat1 * toRad;
  const φ2 = lat2 * toRad;
  const Δλ = (lon2 - lon1) * toRad;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const bearing = (θ * toDeg + 360) % 360;

  return Math.round(bearing * 100) / 100;
}

/**
 * Computes great circle distance between two points in meters using Haversine formula.
 */
export function haversineDistanceMeters(
  point1: { lat?: number; lng?: number; latitude?: number; longitude?: number },
  point2: { lat?: number; lng?: number; latitude?: number; longitude?: number }
): number {
  const lat1 = point1.latitude ?? point1.lat ?? 0;
  const lon1 = point1.longitude ?? point1.lng ?? 0;
  const lat2 = point2.latitude ?? point2.lat ?? 0;
  const lon2 = point2.longitude ?? point2.lng ?? 0;

  const R = 6371000; // Mean Earth radius in meters
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * PostGIS SQL DDL definition for match_nearest_riders.
 * Uses ST_DWithin for spatial indexing and ST_Distance for closest-first sorting.
 */
export const POSTGIS_MATCH_NEAREST_RIDERS_SQL = `
CREATE OR REPLACE FUNCTION match_nearest_riders(
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  max_radius_meters DOUBLE PRECISION DEFAULT 5000,
  max_limit INT DEFAULT 10
)
RETURNS TABLE (
  rider_id UUID,
  user_id UUID,
  distance_meters DOUBLE PRECISION,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  status TEXT,
  kyc_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id AS rider_id,
    r.user_id,
    ST_Distance(
      r.current_location::geography,
      ST_SetSRID(ST_MakePoint(pickup_lng, pickup_lat), 4326)::geography
    ) AS distance_meters,
    ST_Y(r.current_location::geometry) AS lat,
    ST_X(r.current_location::geometry) AS lng,
    COALESCE(r.is_active::TEXT, 'ONLINE') AS status,
    'VERIFIED'::TEXT AS kyc_status
  FROM public.riders r
  WHERE r.is_active = true
    AND r.current_location IS NOT NULL
    AND ST_DWithin(
      r.current_location::geography,
      ST_SetSRID(ST_MakePoint(pickup_lng, pickup_lat), 4326)::geography,
      max_radius_meters
    )
  ORDER BY distance_meters ASC
  LIMIT max_limit;
END;
$$;
`;

/**
 * Pure TypeScript spatial distance fallback when PostGIS is unavailable or in offline/simulated mode.
 * Evaluates candidate riders within maxRadiusMeters using spherical Haversine distance
 * (matching ST_DWithin) and returns them sorted ascending by distance (matching ST_Distance).
 */
export function matchNearestRidersFallback(
  pickup: { lat?: number; lng?: number; latitude?: number; longitude?: number },
  candidates: CandidateRiderSpatial[],
  maxRadiusMeters: number = 5000,
  maxLimit: number = 10
): MatchedNearestRider[] {
  const pickupLat = pickup.latitude ?? pickup.lat ?? 0;
  const pickupLng = pickup.longitude ?? pickup.lng ?? 0;

  const eligible = candidates.filter((rider) => {
    if (rider.status !== "ONLINE") return false;
    if (rider.kycStatus !== "VERIFIED") return false;
    if (!Number.isFinite(rider.lat) || !Number.isFinite(rider.lng)) return false;
    return true;
  });

  const withDistances = eligible.map((rider) => {
    const distMeters = haversineDistanceMeters(
      { lat: rider.lat, lng: rider.lng },
      { lat: pickupLat, lng: pickupLng }
    );
    const bearing = calcBearing(
      { lat: rider.lat, lng: rider.lng },
      { lat: pickupLat, lng: pickupLng }
    );
    return {
      riderId: rider.riderId,
      userId: rider.userId,
      distanceMeters: distMeters,
      distanceKm: Math.round((distMeters / 1000) * 100) / 100,
      lat: rider.lat,
      lng: rider.lng,
      status: rider.status,
      kycStatus: rider.kycStatus,
      bearingToPickup: bearing,
    };
  });

  // Filter within radius (ST_DWithin equivalent)
  const withinRadius = withDistances.filter((r) => r.distanceMeters <= maxRadiusMeters);

  // Sort ascending by distance (ST_Distance equivalent)
  withinRadius.sort((a, b) => a.distanceMeters - b.distanceMeters);

  return withinRadius.slice(0, maxLimit);
}

/**
 * Unified Spatial Dispatch: attempts PostGIS database function query,
 * falling back seamlessly to TypeScript spatial haversine algorithm.
 */
export async function matchNearestRiders(
  pickup: { lat?: number; lng?: number; latitude?: number; longitude?: number },
  options?: {
    maxRadiusMeters?: number;
    maxLimit?: number;
    dbQueryFn?: (sqlQuery: string, params: any[]) => Promise<any[]>;
    fallbackCandidates?: CandidateRiderSpatial[];
  }
): Promise<MatchedNearestRider[]> {
  const pickupLat = pickup.latitude ?? pickup.lat ?? 0;
  const pickupLng = pickup.longitude ?? pickup.lng ?? 0;
  const maxRadiusMeters = options?.maxRadiusMeters ?? 5000;
  const maxLimit = options?.maxLimit ?? 10;

  if (options?.dbQueryFn) {
    try {
      const rows = await options.dbQueryFn(
        `SELECT * FROM match_nearest_riders($1, $2, $3, $4)`,
        [pickupLat, pickupLng, maxRadiusMeters, maxLimit]
      );
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map((r) => {
          const riderLat = Number(r.lat);
          const riderLng = Number(r.lng);
          return {
            riderId: String(r.rider_id ?? r.riderId),
            userId: String(r.user_id ?? r.userId),
            distanceMeters: Math.round(Number(r.distance_meters ?? r.distanceMeters)),
            distanceKm: Math.round((Number(r.distance_meters ?? r.distanceMeters) / 1000) * 100) / 100,
            lat: riderLat,
            lng: riderLng,
            status: String(r.status ?? "ONLINE"),
            kycStatus: String(r.kyc_status ?? "VERIFIED"),
            bearingToPickup: calcBearing(
              { lat: riderLat, lng: riderLng },
              { lat: pickupLat, lng: pickupLng }
            ),
          };
        });
      }
    } catch (err) {
      console.warn("[SpatialDispatch] PostGIS query failed, using TypeScript fallback:", err);
    }
  }

  // TypeScript spatial fallback
  return matchNearestRidersFallback(
    { lat: pickupLat, lng: pickupLng },
    options?.fallbackCandidates ?? [],
    maxRadiusMeters,
    maxLimit
  );
}

class TelematicsQueue {
  private queue: TelematicsPayload[] = [];
  
  enqueue(payload: TelematicsPayload) {
    this.queue.push(payload);
  }
  
  dequeueAll(): TelematicsPayload[] {
    const payloads = [...this.queue];
    this.queue = [];
    return payloads;
  }
  
  get length(): number {
    return this.queue.length;
  }
}

export class SpatialTrackingService {
  private isTracking = false;
  private riderId: string;
  private watchId?: number;
  private fallbackQueue = new TelematicsQueue();
  private telematicsEndpoint = 'https://api.orderking.com/telematics/ingest';
  private lastCoordinate?: GPSCoordinate;
  
  constructor(riderId: string) {
    this.riderId = riderId;
  }

  public async startTracking(): Promise<void> {
    if (this.isTracking) return;
    
    if (typeof navigator === "undefined" || !('geolocation' in navigator)) {
      throw new Error('Geolocation is not supported by this device.');
    }
    
    this.isTracking = true;
    
    // Battery-efficient background geolocation polling setup
    this.watchId = navigator.geolocation.watchPosition(
      this.handlePositionUpdate.bind(this),
      this.handlePositionError.bind(this),
      {
        enableHighAccuracy: false, // For battery efficiency
        timeout: 10000,
        maximumAge: 30000,
      }
    );
    
    // Fallback sync loop
    setInterval(() => this.syncFallbackQueue(), 60000);
  }

  public stopTracking(): void {
    if (!this.isTracking) return;
    this.isTracking = false;
    
    if (this.watchId !== undefined && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = undefined;
    }
  }

  private async handlePositionUpdate(position: GeolocationPosition): Promise<void> {
    const coordinate: GPSCoordinate = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      altitude: position.coords.altitude || undefined,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
      timestamp: position.timestamp,
    };

    // Calculate courier forward true bearing when heading is unavailable from GPS hardware
    let bearing: number | undefined = position.coords.heading || undefined;
    if ((bearing === undefined || Number.isNaN(bearing) || bearing === 0) && this.lastCoordinate) {
      bearing = calcBearing(this.lastCoordinate, coordinate);
    }
    coordinate.bearing = bearing;
    if (coordinate.heading === undefined) {
      coordinate.heading = bearing;
    }
    this.lastCoordinate = coordinate;
    
    const payload: TelematicsPayload = {
      riderId: this.riderId,
      location: coordinate,
      batteryLevel: await this.getBatteryLevel(),
      networkType: this.getNetworkType(),
      bearing,
    };
    
    await this.transmitTelematics(payload);
  }
  
  private handlePositionError(error: GeolocationPositionError): void {
    console.error(`Geolocation error (${error.code}): ${error.message}`);
  }

  private async transmitTelematics(payload: TelematicsPayload): Promise<void> {
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        throw new Error('Device offline, routing to fallback queue.');
      }
      
      const response = await fetch(this.telematicsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Target-Engines': 'RiderTelematicsEngine,AutonomousFleetEngine'
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`Telematics ingestion failed with status ${response.status}`);
      }
    } catch (error) {
      console.warn('Transmission failed, queuing for Starlink/2G fallback sync.', error);
      this.fallbackQueue.enqueue(payload);
    }
  }

  private async syncFallbackQueue(): Promise<void> {
    if (typeof navigator !== "undefined" && (!navigator.onLine || this.fallbackQueue.length === 0)) {
      return;
    }
    
    const payloads = this.fallbackQueue.dequeueAll();
    
    try {
      const response = await fetch(`${this.telematicsEndpoint}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Target-Engines': 'RiderTelematicsEngine,AutonomousFleetEngine'
        },
        body: JSON.stringify({ batch: payloads }),
      });
      
      if (!response.ok) {
        throw new Error(`Batch telematics ingestion failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Fallback sync failed, requeuing payloads.', error);
      payloads.forEach(p => this.fallbackQueue.enqueue(p));
    }
  }

  private async getBatteryLevel(): Promise<number> {
    try {
      if (typeof navigator !== "undefined" && 'getBattery' in navigator) {
        const battery: any = await (navigator as any).getBattery();
        return battery.level * 100;
      }
      return 100; // Default if unsupported
    } catch {
      return 100;
    }
  }

  private getNetworkType(): TelematicsPayload['networkType'] {
    if (typeof navigator === "undefined" || !navigator.onLine) return 'Offline';
    
    const connection: any = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      switch (connection.effectiveType) {
        case 'slow-2g':
        case '2g':
          return '2G';
        case '3g':
          return '3G';
        case '4g':
          return '4G';
        default:
          return '5G';
      }
    }
    return 'Starlink'; // Default fallback assumption for high-latency sat connections
  }
}
