import { travelRegistry } from "./provider-registry.ts";
import { AmadeusFlightProvider } from "./providers/amadeus-flight-provider.ts";
import { IrctcTrainProvider } from "./providers/irctc-train-provider.ts";
import { TravelOrchestrator } from "./orchestrator.ts";

// Initialize the universal travel fabric
travelRegistry.register(new AmadeusFlightProvider());
travelRegistry.register(new IrctcTrainProvider());

export { TravelOrchestrator, travelRegistry };
export * from "./schemas/travel-schemas.ts";
