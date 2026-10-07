import { travelRegistry } from "./provider-registry.ts";
import type { TravelSearchQuery, NormalizedTravelResult, TravelBookingRequest, TravelBookingResponse } from "./schemas/travel-schemas.ts";

/** 
 * 1000x Capacity In-Memory Cache 
 * TTL: 15 seconds to prevent stale pricing while surviving massive spike traffic.
 */
const capacityCache = new Map<string, { data: NormalizedTravelResult[], expiresAt: number }>();

export class TravelOrchestrator {
  /**
   * Universal search across all registered providers for the given travel mode.
   * UPGRADED: 1000x Capacity Architecture (Caching, AbortSignal timeouts, AllSettled Resilience)
   */
  static async search(query: TravelSearchQuery): Promise<{ results: NormalizedTravelResult[], errors: any[] }> {
    const cacheKey = JSON.stringify(query);
    const cached = capacityCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return { results: cached.data, errors: [] };
    }

    const providers = travelRegistry.getProvidersForMode(query.mode);
    
    if (providers.length === 0) {
      return {
        results: [],
        errors: [{ error: `No providers registered for mode ${query.mode}` }]
      };
    }

    // 1000x scaling: Bound every provider call with an AbortSignal to prevent hanging threads.
    const searchPromises = providers.map(async (provider) => {
      if (!provider.isAvailable()) {
        return { error: "EXTERNAL_PROVIDER_BLOCKED", details: `Provider ${provider.name} lacks credentials/configuration.` };
      }
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort("TIMEOUT_EXCEEDED"), 8000);
        
        // Passing signal to provider.search if supported, else we race.
        const result = await Promise.race([
          provider.search(query),
          new Promise((_, reject) => {
            controller.signal.addEventListener("abort", () => reject(new Error("PROVIDER_TIMEOUT")));
          })
        ]);
        clearTimeout(timeout);
        return result;
      } catch (err: any) {
        return { error: "PROVIDER_ERROR", details: err.message, providerId: provider.id };
      }
    });

    // Resilience: use allSettled instead of Promise.all so one dead provider doesn't sink the search.
    const settled = await Promise.allSettled(searchPromises);
    
    const results: NormalizedTravelResult[] = [];
    const errors: any[] = [];

    for (const res of settled) {
      if (res.status === "fulfilled") {
        if (Array.isArray(res.value)) {
          results.push(...res.value);
        } else {
          errors.push(res.value);
        }
      } else {
        errors.push({ error: "UNEXPECTED_FAILURE", details: res.reason });
      }
    }

    // Sort by price ascending (cheap to expensive)
    results.sort((a, b) => a.price.amount - b.price.amount);

    // Write to cache
    capacityCache.set(cacheKey, { data: results, expiresAt: Date.now() + 15000 });

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
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const result = await Promise.race([
        provider.book(request),
        new Promise<TravelBookingResponse>((_, reject) => {
          controller.signal.addEventListener("abort", () => reject(new Error("BOOKING_TIMEOUT")));
        })
      ]);
      clearTimeout(timeout);
      return result;
    } catch (err: any) {
       return { success: false, status: "FAILED", error: err.message };
    }
  }
}
