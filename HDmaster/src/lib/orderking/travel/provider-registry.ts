import type { TravelMode, TravelSearchQuery, NormalizedTravelResult, TravelBookingRequest, TravelBookingResponse } from "./schemas/travel-schemas.ts";
import { AmadeusFlightProvider } from "./providers/amadeus-flight-provider.ts";
import { IrctcTrainProvider } from "./providers/irctc-train-provider.ts";
import { RedBusProvider } from "./providers/redbus-bus-provider.ts";
import { UberCabProvider } from "./providers/uber-cab-provider.ts";

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

  getProvidersForMode(mode: TravelMode | string): TravelProvider[] {
    const normalized = String(mode || "").toUpperCase();
    return Array.from(this.providers.values()).filter(p =>
      p.supportedModes.map(m => String(m).toUpperCase()).includes(normalized)
    );
  }
}

// Global registry instance pre-loaded with verified production travel providers
export const travelRegistry = new TravelProviderRegistry();
travelRegistry.register(new AmadeusFlightProvider());
travelRegistry.register(new IrctcTrainProvider());
travelRegistry.register(new RedBusProvider());
travelRegistry.register(new UberCabProvider());
