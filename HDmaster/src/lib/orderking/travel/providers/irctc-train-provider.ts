// @ts-nocheck
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

  // 1000x Capacity Variables
  private activeRequests = 0;
  private readonly MAX_CONCURRENCY = 5000;
  private isCircuitBroken = false;
  private circuitBreakUntil = 0;

  isAvailable(): boolean {
    return Boolean(
      process.env.IRCTC_B2B_PARTNER_KEY?.trim() &&
      process.env.IRCTC_B2B_API_URL?.trim(),
    );
  }

  private checkCircuit() {
    if (this.isCircuitBroken && Date.now() < this.circuitBreakUntil) {
      throw new Error("CIRCUIT_BROKEN: IRCTC Provider is currently overloaded. Tripped for 60s.");
    }
    this.isCircuitBroken = false;
    
    if (this.activeRequests >= this.MAX_CONCURRENCY) {
      this.isCircuitBroken = true;
      this.circuitBreakUntil = Date.now() + 60000; // Trip for 60s
      throw new Error("CAPACITY_EXCEEDED: 1000x Virtual Queue Limit hit.");
    }
  }

  async search(
    _query: TravelSearchQuery,
  ): Promise<NormalizedTravelResult[] | { error: string; blocked: boolean; details?: string }> {
    this.checkCircuit();
    this.activeRequests++;
    
    try {
      // Normal Execution Path
      return {
        error: "EXTERNAL_PROVIDER_BLOCKED",
        blocked: true,
        details:
          "No licensed IRCTC/Principal Service Provider API contract is configured. OrderKing will not scrape IRCTC or invent train availability.",
      };
    } finally {
      this.activeRequests--;
    }
  }

  async book(_request: TravelBookingRequest): Promise<TravelBookingResponse> {
    this.checkCircuit();
    this.activeRequests++;
    
    try {
      return {
        success: false,
        status: "BLOCKED_BY_EXTERNAL_PROVIDER",
        error:
          "No licensed IRCTC/Principal Service Provider booking API is configured. No payment or ticket confirmation was created.",
      };
    } finally {
      this.activeRequests--;
    }
  }
}
