import type { TravelProvider } from "../provider-registry.ts";
import type {
  TravelMode,
  TravelSearchQuery,
  NormalizedTravelResult,
  TravelBookingRequest,
  TravelBookingResponse,
} from "../schemas/travel-schemas.ts";

export class IrctcTrainProvider implements TravelProvider {
  id = "irctc_b2b_train";
  name = "IRCTC Licensed B2B Train Provider";
  supportedModes: TravelMode[] = ["TRAIN"];

  isAvailable(): boolean {
    return Boolean(
      process.env.IRCTC_B2B_PARTNER_KEY?.trim() &&
      process.env.IRCTC_B2B_API_URL?.trim(),
    );
  }

  async search(
    _query: TravelSearchQuery,
  ): Promise<NormalizedTravelResult[] | { error: string; blocked: boolean; details?: string }> {
    return {
      error: "EXTERNAL_PROVIDER_BLOCKED",
      blocked: true,
      details:
        "No licensed IRCTC/Principal Service Provider API contract is configured. OrderKing will not scrape IRCTC or invent train availability.",
    };
  }

  async book(_request: TravelBookingRequest): Promise<TravelBookingResponse> {
    return {
      success: false,
      status: "BLOCKED_BY_EXTERNAL_PROVIDER",
      error:
        "No licensed IRCTC/Principal Service Provider booking API is configured. No payment or ticket confirmation was created.",
    };
  }
}
