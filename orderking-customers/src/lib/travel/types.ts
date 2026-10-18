/**
 * 👑 OrderKing Travel Engine - Core B2B Aggregation & Affiliate Domain Types
 * Strict SafeInteger Paise, Zero Placeholders, Full Production Types.
 */

export type TravelCabinClass = "ECONOMY" | "BUSINESS" | "PREMIUM_ECONOMY";
export type TrainQuota = "GN" | "TQ" | "LD";
export type TrainSeatClass = "1A" | "2A" | "3A" | "CC" | "EC" | "SL" | "2S";
export type TrainSeatStatus = "AVAILABLE" | "RAC" | "WL" | "CURR_AVL" | "REGRET";

export interface FlightSearchRequest {
  origin: string; // IATA e.g. "DEL"
  destination: string; // IATA e.g. "BOM"
  departureDate: string; // YYYY-MM-DD
  passengers?: number; // default 1
  cabinClass?: TravelCabinClass; // default ECONOMY
}

export interface FlightOption {
  id: string;
  carrierName: string;
  carrierCode: string;
  flightNumber: string;
  departureTime: string; // ISO 8601 or HH:mm
  arrivalTime: string; // ISO 8601 or HH:mm
  durationMinutes: number;
  pricePaise: number;
  directStops: number; // 0 = direct / non-stop
  cabinClass: "ECONOMY" | "BUSINESS";
  bookingUrl: string;
  affiliateToken?: string;
  baggageAllowance?: string;
  aircraftType?: string;
  terminal?: string;
  seatsAvailable?: number;
}

export interface FlightSearchResponse {
  success: boolean;
  data: FlightOption[];
  source: "kiwi_tequila" | "travelpayouts" | "carrier_direct_gds";
  count: number;
  origin: string;
  destination: string;
  departureDate: string;
}

export interface TrainSearchRequest {
  fromStation: string; // Code e.g. "NDLS"
  toStation: string; // Code e.g. "CNB" or "BSB"
  travelDate: string; // YYYY-MM-DD
  quota?: TrainQuota; // default 'GN'
}

export interface TrainClassAvailability {
  classCode: TrainSeatClass;
  className: string;
  farePaise: number;
  status: TrainSeatStatus;
  statusDetails: string; // e.g. "AVAILABLE-42", "RAC 12", "WL 35"
  availableSeats?: number;
}

export interface TrainOption {
  id: string;
  trainNumber: string;
  trainName: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  fromStation: string;
  toStation: string;
  classes: TrainClassAvailability[];
  quota: TrainQuota;
  pantryAvailable: boolean;
  bookingUrl: string;
  source: "confirmtkt" | "irctc_direct" | "cris_realtime";
}

export interface TrainSearchResponse {
  success: boolean;
  data: TrainOption[];
  source: string;
  count: number;
  fromStation: string;
  toStation: string;
  travelDate: string;
  quota: TrainQuota;
}

export interface BusSearchRequest {
  sourceCity: string;
  destinationCity: string;
  journeyDate: string; // YYYY-MM-DD
  busType?: string;
}

export interface BusOption {
  id: string;
  operatorName: string;
  busType: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  sourceCity: string;
  destinationCity: string;
  boardingPoints: string[];
  droppingPoints: string[];
  rating: number;
  ratingsCount?: number;
  totalSeats: number;
  availableSeats: number;
  farePaise: number;
  startingFarePaise: number;
  amenities: string[];
  bookingUrl: string;
}

export interface BusSearchResponse {
  success: boolean;
  data: BusOption[];
  source: "redbus_b2b" | "partner_catalog";
  count: number;
  sourceCity: string;
  destinationCity: string;
  journeyDate: string;
}

export interface HotelSearchRequest {
  cityOrLocation: string;
  checkInDate?: string; // YYYY-MM-DD
  checkOutDate?: string; // YYYY-MM-DD
  guests?: number;
  rooms?: number;
}

export interface HotelOption {
  id: string;
  hotelName: string;
  starRating: number;
  userRating: number;
  reviewCount: number;
  city: string;
  address: string;
  thumbnailUrl: string;
  nightlyRatePaise: number;
  totalFarePaise: number;
  roomType: string;
  freeCancellation: boolean;
  breakfastIncluded: boolean;
  bookingUrl: string;
  provider: "agoda" | "booking_com" | "partner_wholesale";
}

export interface HotelSearchResponse {
  success: boolean;
  data: HotelOption[];
  source: string;
  count: number;
  cityOrLocation: string;
  checkInDate: string;
  checkOutDate: string;
}

export interface TravelRevenueLedgerRecord {
  transactionId: string;
  bookingReference: string;
  travelMode: "flight" | "train" | "bus" | "hotel";
  partnerName: string;
  grossAmountPaise: number;
  partnerCommissionBps: number;
  partnerCommissionPaise: number;
  platformConvenienceFeePaise: 0; // Strictly 0 paise under OrderKing guarantee
  netCreditedPaise: number;
  userId?: string;
  timestamp: string;
}
