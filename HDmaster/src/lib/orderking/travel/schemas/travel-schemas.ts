export type TravelMode = "FLIGHT" | "TRAIN" | "BUS" | "HOTEL";

export interface TravelSearchQuery {
  mode: TravelMode;
  originCode: string;
  destinationCode: string;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string;
  passengers: number;
  class?: string;
  keyword?: string;
}

export interface NormalizedTravelResult {
  id: string;
  providerId: string; // e.g., "amadeus", "irctc"
  mode: TravelMode;
  origin: {
    code: string;
    name?: string;
  };
  destination: {
    code: string;
    name?: string;
  };
  departureTime: string; // ISO8601
  arrivalTime: string;   // ISO8601
  carrier: {
    code: string;
    name: string;
  };
  price: {
    amount: number;
    currency: string;
  };
  rawProviderData: any; // Original payload for booking
}

export interface TravelBookingRequest {
  resultId: string;
  providerId: string;
  rawProviderData: any;
  passengerDetails: any[];
}

export interface TravelBookingResponse {
  success: boolean;
  bookingId?: string;
  pnr?: string;
  error?: string;
  status: "CONFIRMED" | "PENDING" | "FAILED" | "BLOCKED_BY_EXTERNAL_PROVIDER";
  message?: string;
}
