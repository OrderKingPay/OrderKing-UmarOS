import type { TravelMode, TravelSearchQuery, NormalizedTravelResult, TravelBookingRequest, TravelBookingResponse } from "./schemas/travel-schemas.ts";

export interface TravelProvider {
  id: string;
  name: string;
  supportedModes: TravelMode[];
  isAvailable(): boolean;
  search(query: TravelSearchQuery): Promise<NormalizedTravelResult[] | { error: string, blocked: boolean, details?: string }>;
  book(request: TravelBookingRequest): Promise<TravelBookingResponse>;
}

export class TravelProviderRegistry {
  private providers: Map<string, TravelProvider> = new Map();

  register(provider: TravelProvider) {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: string): TravelProvider | undefined {
    return this.providers.get(id);
  }

  getProvidersForMode(mode: TravelMode): TravelProvider[] {
    return Array.from(this.providers.values()).filter(p => p.supportedModes.includes(mode));
  }
}

// Global registry instance
export const travelRegistry = new TravelProviderRegistry();
