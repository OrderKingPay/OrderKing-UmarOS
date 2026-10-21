import type {
  PackageType,
  PackageTypeConfig,
  FareCalculationInput,
  FareCalculationResult,
  FareBreakdownItem,
} from "./types";

export const BASE_FARE_PAISE = 3000; // ₹30.00 base fare
export const PER_KM_RATE_PAISE = 1000; // ₹10.00 per kilometer
export const NIGHT_SURCHARGE_PAISE = 1500; // ₹15.00 night surcharge (22:00 - 06:00)
export const ROAD_WINDING_FACTOR = 1.3; // Urban route coefficient over straight-line

export const PACKAGE_TYPE_CONFIGS: Record<PackageType, PackageTypeConfig> = {
  DOCUMENTS: {
    id: "DOCUMENTS",
    label: "Documents & Books",
    sublabel: "Legal papers, certificates, envelopes, textbooks",
    maxWeightKg: 3,
    handlingFeePaise: 0,
    description: "Standard courier bag handling, waterproof envelope protection",
  },
  FOOD: {
    id: "FOOD",
    label: "Food & Tiffin",
    sublabel: "Home-cooked lunchbox, snacks, bakery, beverages",
    maxWeightKg: 5,
    handlingFeePaise: 0,
    description: "Thermal insulated bag transport with upright spill-proof handling",
  },
  KEYS: {
    id: "KEYS",
    label: "Keys & Small Items",
    sublabel: "Home/car keys, chargers, medicine, eyewear, cards",
    maxWeightKg: 2,
    handlingFeePaise: 0,
    description: "Secure tamper-sealed zipper pouch with priority dispatch",
  },
  HEAVY_BOX: {
    id: "HEAVY_BOX",
    label: "Heavy Box",
    sublabel: "Electronics, appliances, bulky parcels up to 15 kg",
    maxWeightKg: 15,
    handlingFeePaise: 2000, // ₹20.00 heavy cargo handling
    description: "Heavy-duty rear carrier rack placement with secure strapping",
  },
};

/**
 * Checks if current timestamp falls within the night dispatch window (22:00 to 06:00).
 */
export function isNightTimeWindow(date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= 22 || hour < 6;
}

/**
 * Calculates straight-line Haversine distance in kilometers between two coordinates.
 */
export function calculateStraightLineDistanceKm(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const EARTH_RADIUS_KM = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);

  const lat1 = toRad(point1.lat);
  const lat2 = toRad(point2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Estimates actual road travel distance in kilometers by applying urban routing factor.
 */
export function calculateEstimatedRoadDistanceKm(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const straight = calculateStraightLineDistanceKm(point1, point2);
  const road = straight * ROAD_WINDING_FACTOR;
  return Math.round(road * 10) / 10;
}

/**
 * Server-authoritative parcel fare calculation.
 * Formula:
 * - Base Fare: ₹30 (3000 paise)
 * - Distance: ₹10 / km (1000 paise / km)
 * - Heavy Box: +₹20 handling (2000 paise)
 * - Night surcharge: +₹15 (1500 paise) if active
 */
export function calculateParcelFare(input: FareCalculationInput): FareCalculationResult {
  const dist = Math.max(0.5, Math.round(input.distanceKm * 10) / 10);
  const baseFarePaise = BASE_FARE_PAISE;
  const distanceFarePaise = Math.round(dist * PER_KM_RATE_PAISE);

  const packageConfig = PACKAGE_TYPE_CONFIGS[input.packageType] ?? PACKAGE_TYPE_CONFIGS.DOCUMENTS;
  const handlingFeePaise = packageConfig.handlingFeePaise;
  const nightSurchargePaise = input.isNight ? NIGHT_SURCHARGE_PAISE : 0;

  const totalPaise = baseFarePaise + distanceFarePaise + handlingFeePaise + nightSurchargePaise;
  const totalInr = totalPaise / 100;

  const breakdown: FareBreakdownItem[] = [
    {
      code: "BASE_FARE",
      label: "Base Courier Fare",
      amountPaise: baseFarePaise,
      amountInr: baseFarePaise / 100,
      note: "Includes rider allocation & doorstep pickup",
    },
    {
      code: "DISTANCE_FARE",
      label: `Distance Charge (${dist.toFixed(1)} km)`,
      amountPaise: distanceFarePaise,
      amountInr: distanceFarePaise / 100,
      note: "₹10.00 / km exact route pricing",
    },
  ];

  if (handlingFeePaise > 0) {
    breakdown.push({
      code: "HEAVY_HANDLING",
      label: `Handling Fee (${packageConfig.label})`,
      amountPaise: handlingFeePaise,
      amountInr: handlingFeePaise / 100,
      note: "Special cargo carrier & strapping",
    });
  }

  if (nightSurchargePaise > 0) {
    breakdown.push({
      code: "NIGHT_SURCHARGE",
      label: "Night Shift Surcharge (22:00 - 06:00)",
      amountPaise: nightSurchargePaise,
      amountInr: nightSurchargePaise / 100,
      note: "Direct rider night-shift allowance",
    });
  }

  return {
    baseFarePaise,
    distanceKm: dist,
    distanceFarePaise,
    handlingFeePaise,
    nightSurchargePaise,
    totalPaise,
    totalInr,
    breakdown,
  };
}

/**
 * Estimates courier transit time in minutes (pickup + transit at 20 km/h average city speed).
 */
export function estimateCourierTransitMinutes(distanceKm: number): {
  pickupMinutes: number;
  deliveryMinutes: number;
} {
  const pickupMinutes = 8; // Rider arrives at pickup location in ~8 mins
  const transitMinutes = Math.max(7, Math.round((distanceKm / 20) * 60));
  return {
    pickupMinutes,
    deliveryMinutes: pickupMinutes + transitMinutes,
  };
}
