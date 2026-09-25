import { travelRegistry } from "./provider-registry.ts";
import { AmadeusFlightProvider } from "./providers/amadeus-flight-provider.ts";
import { IrctcTrainProvider } from "./providers/irctc-train-provider.ts";
import { TravelOrchestrator } from "./orchestrator.ts";

// Initialize the universal travel fabric with shared provider instances so
// OAuth/token state can be reused across warm server instances.
export const amadeusFlightProvider = new AmadeusFlightProvider();
export const irctcTrainProvider = new IrctcTrainProvider();

travelRegistry.register(amadeusFlightProvider);
travelRegistry.register(irctcTrainProvider);

export { TravelOrchestrator, travelRegistry };
export * from "./schemas/travel-schemas.ts";
