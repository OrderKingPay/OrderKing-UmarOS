import type { TravelProvider } from "../provider-registry.ts";
import type { TravelMode, TravelSearchQuery, NormalizedTravelResult, TravelBookingRequest, TravelBookingResponse } from "../schemas/travel-schemas.ts";

export class IrctcTrainProvider implements TravelProvider {
  id = "irctc_b2b_train";
  name = "IRCTC Authorized B2B Partner";
  supportedModes: TravelMode[] = ["TRAIN"];

  isAvailable(): boolean {
    // Fail-secure: Do not invent trains if credentials are missing
    return !!process.env.IRCTC_B2B_PARTNER_KEY;
  }

  async search(query: TravelSearchQuery): Promise<NormalizedTravelResult[] | { error: string, blocked: boolean, details?: string }> {
    if (!this.isAvailable()) {
       return { 
           error: "EXTERNAL_PROVIDER_BLOCKED", 
           blocked: true, 
           details: "IRCTC B2B Partner API credentials missing in production environment. A commercial agreement and API keys are required for real train availability." 
        };
    }

    // In the future, this will connect to the real licensed B2B aggregator (e.g. ConfirmTkt B2B, EaseMyTrip API, etc.)
    throw new Error("Not implemented yet. Need active provider integration.");
  }

  async book(request: TravelBookingRequest): Promise<TravelBookingResponse> {
    if (!this.isAvailable()) {
      return { success: false, status: "BLOCKED_BY_EXTERNAL_PROVIDER", error: "IRCTC API credentials missing." };
    }

    return { success: false, status: "FAILED", error: "Not implemented yet" };
  }
}
