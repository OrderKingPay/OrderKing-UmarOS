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
    return Boolean(process.env.BUS_PROVIDER_API_URL?.trim() && process.env.BUS_PROVIDER_API_TOKEN?.trim());
  }

  async search(query: TravelSearchQuery): Promise<NormalizedTravelResult[] | { error: string; blocked: boolean; details?: string }> {
    if (query.mode !== "BUS") return [];
    if (!this.isAvailable()) {
      return {
        error: "EXTERNAL_PROVIDER_BLOCKED",
        blocked: true,
        details: "No licensed bus provider API is configured. No synthetic schedules, seats, ratings, fares, or operators are returned.",
      };
    }

    const response = await fetch(process.env.BUS_PROVIDER_API_URL!, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.BUS_PROVIDER_API_TOKEN!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "search", query }),
    });
    const payload = await response.json().catch(() => ({})) as { results?: NormalizedTravelResult[]; error?: string };
    if (!response.ok) {
      return { error: "EXTERNAL_PROVIDER_ERROR", blocked: true, details: payload.error ?? `Bus provider returned HTTP ${response.status}.` };
    }
    return Array.isArray(payload.results) ? payload.results : [];
  }

  async book(request: TravelBookingRequest): Promise<TravelBookingResponse> {
    if (!this.isAvailable()) {
      return {
        success: false,
        status: "BLOCKED_BY_EXTERNAL_PROVIDER",
        error: "No licensed bus provider booking API is configured. No ticket reference was created.",
      };
    }

    const response = await fetch(process.env.BUS_PROVIDER_API_URL!, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.BUS_PROVIDER_API_TOKEN!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "book", request }),
    });
    const payload = await response.json().catch(() => ({})) as TravelBookingResponse;
    if (!response.ok) {
      return { success: false, status: "FAILED", error: payload.error ?? `Bus provider returned HTTP ${response.status}.` };
    }
    return payload;
  }
}