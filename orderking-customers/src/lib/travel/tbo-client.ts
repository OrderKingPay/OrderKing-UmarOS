/**
 * 👑 OrderKing & KingPay — TBO (Travel Boutique Online / TBO Tek Ltd) Enterprise Client
 *
 * Official Aggregator Agency Application: #187051
 * Trade Name: Orderkingpay
 * GSTIN: 18AFXPH9838M1Z9 (Assam - 788710)
 *
 * Endpoints & Architecture:
 * - Production Gateway: https://api.tbotechnology.com
 * - Staging Gateway: http://api.tektravels.com
 * Services:
 * - AirService: Domestic (IndiGo, AI, Akasa, SpiceJet) & Global GDS
 * - RailService: IRCTC Official B2C Rail PRS Booking
 * - HotelService: Global 1,000,000+ Properties
 */

export interface TboCredentials {
  agencyCode: string;
  userName: string;
  password: string;
  endpoint: string;
}

export interface TboAuthResult {
  authenticated: boolean;
  token?: string;
  memberId?: string;
  agencyId?: string;
  status: "active" | "pending_credentials" | "auth_failed";
  message: string;
}

export interface TboFlightSearchQuery {
  adultCount: number;
  childCount?: number;
  infantCount?: number;
  directFlight?: boolean;
  oneStopFlight?: boolean;
  journeyType: "OneWay" | "Return" | "MultiStop";
  preferredAirlines?: string[]; // e.g. ["6E", "AI", "QP", "SG"]
  cabinClass: "Economy" | "PremiumEconomy" | "Business";
  origin: string; // 3-letter IATA (e.g. DEL)
  destination: string; // 3-letter IATA (e.g. BOM)
  preferredDepartureTime: string; // ISO date string (YYYY-MM-DDTHH:mm:ss)
}

export interface TboRailSearchQuery {
  fromStationCode: string; // IRCTC Station Code (e.g. NDLS)
  toStationCode: string; // IRCTC Station Code (e.g. MMCT)
  journeyDate: string; // YYYY-MM-DD
  quota: "GN" | "TQ" | "LD";
  travelClass?: "1A" | "2A" | "3A" | "SL" | "CC" | "EC";
}

/**
 * Resolves TBO API credentials from environment variables.
 * Fails closed without throwing if credentials are not yet provisioned.
 */
export function getTboCredentials(): TboCredentials | null {
  const agencyCode =
    (typeof process !== "undefined" && process.env?.TBO_AGENCY_CODE) ||
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_TBO_AGENCY_CODE) ||
    "";

  const userName =
    (typeof process !== "undefined" && process.env?.TBO_USER_NAME) ||
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_TBO_USER_NAME) ||
    "";

  const password =
    (typeof process !== "undefined" && process.env?.TBO_PASSWORD) ||
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_TBO_PASSWORD) ||
    "";

  const endpoint =
    (typeof process !== "undefined" && process.env?.TBO_ENDPOINT) ||
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_TBO_ENDPOINT) ||
    "https://api.tbotechnology.com";

  if (!agencyCode || !userName || !password) {
    return null;
  }

  return { agencyCode, userName, password, endpoint };
}

/**
 * Authenticates with TBO API Gateway using registered agency credentials.
 */
export async function authenticateTbo(creds?: TboCredentials | null): Promise<TboAuthResult> {
  const credentials = creds || getTboCredentials();

  if (!credentials) {
    return {
      authenticated: false,
      status: "pending_credentials",
      message:
        "TBO credentials not yet configured in environment. Application #187051 is currently under KYC review by TBO Onboarding Team.",
    };
  }

  try {
    const authUrl = `${credentials.endpoint}/SharedServices/SharedData.svc/rest/Authenticate`;
    const res = await fetch(authUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ClientId: credentials.agencyCode,
        UserName: credentials.userName,
        Password: credentials.password,
        EndUserIp: "127.0.0.1",
      }),
    });

    if (!res.ok) {
      return {
        authenticated: false,
        status: "auth_failed",
        message: `TBO API authentication returned HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data: any = await res.json();
    if (data?.Status === 1 && data?.TokenId) {
      return {
        authenticated: true,
        token: data.TokenId,
        memberId: data.Member?.MemberId,
        agencyId: data.Member?.AgencyId,
        status: "active",
        message: "TBO Session Authenticated successfully.",
      };
    }

    return {
      authenticated: false,
      status: "auth_failed",
      message: data?.Error?.ErrorMessage || "Failed to obtain valid TBO authentication token.",
    };
  } catch (err: any) {
    return {
      authenticated: false,
      status: "auth_failed",
      message: `TBO gateway unreachable: ${err?.message || "Network error"}`,
    };
  }
}

/**
 * Live Flight Search via TBO Air API.
 */
export async function searchTboFlights(
  query: TboFlightSearchQuery,
  token?: string
): Promise<{
  success: boolean;
  flights: any[];
  traceId?: string;
  error?: string;
}> {
  const creds = getTboCredentials();
  if (!creds) {
    return {
      success: false,
      flights: [],
      error: "TBO credentials pending. Awaiting TBO account activation for Application #187051.",
    };
  }

  let authToken = token;
  if (!authToken) {
    const auth = await authenticateTbo(creds);
    if (!auth.authenticated || !auth.token) {
      return { success: false, flights: [], error: auth.message };
    }
    authToken = auth.token;
  }

  try {
    const searchUrl = `${creds.endpoint}/BookingEngineService_Air/AirService.svc/rest/Search`;
    const payload = {
      EndUserIp: "127.0.0.1",
      TokenId: authToken,
      AdultCount: query.adultCount || 1,
      ChildCount: query.childCount || 0,
      InfantCount: query.infantCount || 0,
      DirectFlight: query.directFlight ?? true,
      OneStopFlight: query.oneStopFlight ?? false,
      JourneyType: query.journeyType === "Return" ? 2 : 1,
      PreferredAirlines: query.preferredAirlines || null,
      Segments: [
        {
          Origin: query.origin.toUpperCase(),
          Destination: query.destination.toUpperCase(),
          FlightCabinClass: query.cabinClass === "Business" ? 4 : query.cabinClass === "PremiumEconomy" ? 3 : 1,
          PreferredDepartureTime: query.preferredDepartureTime,
        },
      ],
      Sources: null,
    };

    const res = await fetch(searchUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { success: false, flights: [], error: `TBO Search returned HTTP ${res.status}` };
    }

    const data: any = await res.json();
    const results = data?.Response?.Results?.[0] || [];
    return {
      success: true,
      flights: results,
      traceId: data?.Response?.TraceId,
    };
  } catch (err: any) {
    return { success: false, flights: [], error: err?.message || "TBO flight search error" };
  }
}

/**
 * Live Rail Search & Seat Availability via TBO IRCTC Rail API.
 */
export async function searchTboRail(
  query: TboRailSearchQuery,
  token?: string
): Promise<{
  success: boolean;
  trains: any[];
  error?: string;
}> {
  const creds = getTboCredentials();
  if (!creds) {
    return {
      success: false,
      trains: [],
      error: "TBO Rail API pending credentials. Application #187051 is under review.",
    };
  }

  let authToken = token;
  if (!authToken) {
    const auth = await authenticateTbo(creds);
    if (!auth.authenticated || !auth.token) {
      return { success: false, trains: [], error: auth.message };
    }
    authToken = auth.token;
  }

  try {
    const railUrl = `${creds.endpoint}/BookingEngineService_Rail/RailService.svc/rest/Search`;
    const payload = {
      EndUserIp: "127.0.0.1",
      TokenId: authToken,
      FromStation: query.fromStationCode.toUpperCase(),
      ToStation: query.toStationCode.toUpperCase(),
      JourneyDate: query.journeyDate,
      Quota: query.quota || "GN",
      Class: query.travelClass || "ALL",
    };

    const res = await fetch(railUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { success: false, trains: [], error: `TBO Rail returned HTTP ${res.status}` };
    }

    const data: any = await res.json();
    return {
      success: true,
      trains: data?.Response?.TrainList || [],
    };
  } catch (err: any) {
    return { success: false, trains: [], error: err?.message || "TBO Rail search error" };
  }
}
