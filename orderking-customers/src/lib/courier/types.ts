/**
 * Porter-Style Local Parcel & Courier Types
 * Professional point-to-point courier and parcel dispatch engine for OrderKing & KingPay.
 */

export type PackageType = "DOCUMENTS" | "FOOD" | "KEYS" | "HEAVY_BOX";

export interface PackageTypeConfig {
  id: PackageType;
  label: string;
  sublabel: string;
  maxWeightKg: number;
  handlingFeePaise: number;
  description: string;
}

export interface ParcelLocationPoint {
  address: string;
  lat: number;
  lng: number;
  area?: string;
  city?: string;
  contactName?: string;
  contactPhone: string;
}

export interface FareCalculationInput {
  distanceKm: number;
  packageType: PackageType;
  isNight?: boolean;
}

export interface FareBreakdownItem {
  code: string;
  label: string;
  amountPaise: number;
  amountInr: number;
  note?: string;
}

export interface FareCalculationResult {
  baseFarePaise: number;
  distanceKm: number;
  distanceFarePaise: number;
  handlingFeePaise: number;
  nightSurchargePaise: number;
  totalPaise: number;
  totalInr: number;
  breakdown: FareBreakdownItem[];
}

export interface ParcelOrderSubmission {
  pickup: ParcelLocationPoint;
  drop: ParcelLocationPoint;
  packageType: PackageType;
  packageDescription?: string;
  specialInstructions?: string;
  distanceKm: number;
  isNight?: boolean;
  paymentMethod: "RAZORPAY_ONLINE" | "COD";
  idempotencyKey: string;
  razorpayPayment?: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    amountPaise?: number;
  };
}

export interface ParcelOrderResult {
  success: boolean;
  orderId: string;
  publicId: string;
  deliveryOtp: string;
  totalPaise: number;
  totalInr: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  estimatedPickupMinutes: number;
  estimatedDeliveryMinutes: number;
}
