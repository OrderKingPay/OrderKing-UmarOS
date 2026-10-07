import { z } from "zod";

export const travelModeSchema = z.enum(["FLIGHT", "TRAIN", "BUS", "HOTEL", "CAB"]);
export type TravelMode = z.infer<typeof travelModeSchema>;

export const travelSearchQuerySchema = z.object({
  mode: travelModeSchema,
  originCode: z.string().trim().min(2).max(12),
  destinationCode: z.string().trim().min(2).max(12),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  passengers: z.number().int().min(1).max(9),
  class: z.string().trim().max(32).optional(),
});

export type TravelSearchQuery = z.infer<typeof travelSearchQuerySchema>;

export const travelBookingRequestSchema = z.object({
  resultId: z.string().trim().min(1).max(256),
  providerId: z.string().trim().min(1).max(128),
  rawProviderData: z.unknown(),
  passengerDetails: z.array(z.record(z.string(), z.unknown())).min(1).max(9),
});

export type NormalizedTravelResult = {
  id: string;
  providerId: string;
  mode: TravelMode;
  origin: { code: string; name?: string };
  destination: { code: string; name?: string };
  departureTime: string;
  arrivalTime: string;
  carrier: { code: string; name: string };
  price: { amount: number; currency: string };
  rawProviderData: unknown;
};

export type TravelBookingRequest = z.infer<typeof travelBookingRequestSchema>;

export type TravelBookingResponse = {
  success: boolean;
  bookingId?: string;
  pnr?: string;
  error?: string;
  status: "CONFIRMED" | "PENDING" | "FAILED" | "BLOCKED_BY_EXTERNAL_PROVIDER";
  message?: string;
};
