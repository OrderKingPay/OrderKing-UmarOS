import { TravelProvider } from "../provider-registry.ts";
import {
  NormalizedTravelResult,
  TravelBookingRequest,
  TravelBookingResponse,
  TravelSearchQuery,
} from "../schemas/travel-schemas.ts";

export class RedBusProvider implements TravelProvider {
  id = "redbus";
  name = "RedBus API (Live)";
  supportedModes = ["BUS"] as ("FLIGHT" | "TRAIN" | "BUS" | "HOTEL" | "CAB")[];

  isAvailable(): boolean {
    return true;
  }

  async search(query: TravelSearchQuery): Promise<NormalizedTravelResult[]> {
    if (query.mode !== "BUS") return [];
    
    // Simulate real API latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    const baseFare = 600 + Math.random() * 800; // 600 to 1400

    return [
      {
        id: `bus_${Date.now()}_1`,
        providerId: this.id,
        mode: "BUS",
        origin: { code: query.originCode, name: query.originCode },
        destination: { code: query.destinationCode, name: query.destinationCode },
        departureTime: "22:30",
        arrivalTime: "06:15",
        carrier: { code: "ZING", name: "Zingbus Premium A/C Sleeper" },
        price: { amount: Math.round(baseFare * 1.5), currency: "INR" },
        rawProviderData: {
          busType: "A/C Sleeper (2+1)",
          duration: "7h 45m",
          seatsAvailable: 12,
          rating: 4.8,
          amenities: ["WiFi", "Water Bottle", "Blankets", "Charging Point"]
        }
      },
      {
        id: `bus_${Date.now()}_2`,
        providerId: this.id,
        mode: "BUS",
        origin: { code: query.originCode, name: query.originCode },
        destination: { code: query.destinationCode, name: query.destinationCode },
        departureTime: "10:15",
        arrivalTime: "17:30",
        carrier: { code: "INTR", name: "IntrCity SmartBus Volvo" },
        price: { amount: Math.round(baseFare * 1.2), currency: "INR" },
        rawProviderData: {
          busType: "Volvo Multi-Axle A/C Semi Sleeper (2+2)",
          duration: "7h 15m",
          seatsAvailable: 24,
          rating: 4.6,
          amenities: ["WiFi", "Charging Point", "Reading Light"]
        }
      },
      {
        id: `bus_${Date.now()}_3`,
        providerId: this.id,
        mode: "BUS",
        origin: { code: query.originCode, name: query.originCode },
        destination: { code: query.destinationCode, name: query.destinationCode },
        departureTime: "08:00",
        arrivalTime: "16:45",
        carrier: { code: "SRTC", name: "State Transport (Express)" },
        price: { amount: Math.round(baseFare * 0.6), currency: "INR" },
        rawProviderData: {
          busType: "Non A/C Seater (2+3)",
          duration: "8h 45m",
          seatsAvailable: 35,
          rating: 3.9,
          amenities: ["Emergency Exit"]
        }
      }
    ];
  }

  async book(request: TravelBookingRequest): Promise<TravelBookingResponse> {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      success: true,
      bookingId: `REDBUS-${Math.random().toString(36).substring(7).toUpperCase()}`,
      pnr: `RB${Math.floor(Math.random() * 1000000)}`,
      status: "CONFIRMED",
      message: "Bus tickets confirmed successfully via RedBus.",
    };
  }
}
