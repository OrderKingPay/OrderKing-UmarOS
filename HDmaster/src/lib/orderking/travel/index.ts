import { travelRegistry } from "./provider-registry.ts";
import { AmadeusFlightProvider } from "./providers/amadeus-flight-provider.ts";
import { IrctcTrainProvider } from "./providers/irctc-train-provider.ts";
import { RedBusProvider } from "./providers/redbus-bus-provider.ts";
import { UberCabProvider } from "./providers/uber-cab-provider.ts";
import { TravelOrchestrator } from "./orchestrator.ts";

// Initialize the universal travel fabric
travelRegistry.register(new AmadeusFlightProvider());
travelRegistry.register(new IrctcTrainProvider());
travelRegistry.register(new RedBusProvider());
travelRegistry.register(new UberCabProvider());

export { TravelOrchestrator, travelRegistry };
export * from "./schemas/travel-schemas.ts";
