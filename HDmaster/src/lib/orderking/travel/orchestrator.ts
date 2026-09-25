import { travelRegistry } from "./provider-registry.ts";
import type { TravelSearchQuery, NormalizedTravelResult, TravelBookingRequest, TravelBookingResponse } from "./schemas/travel-schemas.ts";

export class TravelOrchestrator {
  /**
   * Universal search across all registered providers for the given travel mode.
   */
  static async search(query: TravelSearchQuery): Promise<{ results: NormalizedTravelResult[], errors: any[] }> {
    const providers = travelRegistry.getProvidersForMode(query.mode);
    
    if (providers.length === 0) {
      return {
        results: [],
        errors: [{ error: `No providers registered for mode ${query.mode}` }]
      };
    }

    const searchPromises = providers.map(async (provider) => {
      if (!provider.isAvailable()) {
        return { error: "EXTERNAL_PROVIDER_BLOCKED", details: `Provider ${provider.name} lacks credentials/configuration.` };
      }
      try {
        return await provider.search(query);
      } catch (err: any) {
        return { error: "PROVIDER_ERROR", details: err.message, providerId: provider.id };
      }
    });

    const settled = await Promise.all(searchPromises);
    
    const results: NormalizedTravelResult[] = [];
    const errors: any[] = [];

    for (const res of settled) {
      if (Array.isArray(res)) {
        results.push(...res);
      } else {
        errors.push(res);
      }
    }

    // Sort by price ascending (cheap to expensive)
    results.sort((a, b) => a.price.amount - b.price.amount);

    return { results, errors };
  }

  static async book(request: TravelBookingRequest): Promise<TravelBookingResponse> {
    const provider = travelRegistry.getProvider(request.providerId);
    
    if (!provider) {
      return { success: false, status: "FAILED", error: `Provider ${request.providerId} not found.` };
    }

    if (!provider.isAvailable()) {
       return { success: false, status: "BLOCKED_BY_EXTERNAL_PROVIDER", error: `Provider ${provider.name} is not available (missing credentials).` };
    }

    try {
      return await provider.book(request);
    } catch (err: any) {
       return { success: false, status: "FAILED", error: err.message };
    }
  }
}
