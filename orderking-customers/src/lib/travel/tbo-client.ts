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
 *
 * Strict Permanent Invariants:
 * - Zero Mocks: Fail-closed when credentials not provided; authentic JSON serialization.
 * - Integer Paise Founder Margin Calculations: Strict integer arithmetic with 0 float leaks.
 * - Instant Live Ticketing: Production-ready request serializers for Search, FareQuote, FareRule, SSR, Book, and Ticket.
 */

export const TBO_APPLICATION_ID = "187051";
export const TBO_TRADE_NAME = "Orderkingpay";
export const TBO_GSTIN = "18AFXPH9838M1Z9";
export const TBO_GST_ADDRESS = "Assam - 788710";
export const TBO_GST_CONTACT = "9395065587";
export const TBO_GST_EMAIL = "orderkingpay@gmail.com";
export const TBO_DEFAULT_ENDPOINT = "https://api.tbotechnology.com";
export const TBO_STAGING_ENDPOINT = "http://api.tektravels.com";
export const DEFAULT_END_USER_IP = "127.0.0.1";

export interface TboCredentials {
  agencyCode: string; // TBO_CLIENT_ID / TBO_AGENCY_CODE (default "187051")
  userName: string;   // TBO_USERNAME / TBO_USER_NAME
  password: string;   // TBO_PASSWORD
  endpoint: string;   // TBO_ENDPOINT (default https://api.tbotechnology.com)
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

export interface TboFareQuoteParams {
  traceId: string;
  resultIndex: string;
  endUserIp?: string;
}

export interface TboFareRuleParams {
  traceId: string;
  resultIndex: string;
  endUserIp?: string;
}

export interface TboSSRParams {
  traceId: string;
  resultIndex: string;
  endUserIp?: string;
}

export interface TboPassenger {
  title: "Mr" | "Mrs" | "Ms" | "Miss" | "Master";
  firstName: string;
  lastName: string;
  paxType: 1 | 2 | 3; // 1: Adult, 2: Child, 3: Infant
  dateOfBirth?: string; // YYYY-MM-DDTHH:mm:ss
  gender: 1 | 2; // 1: Male, 2: Female
  passportNo?: string;
  passportExpiry?: string;
  addressLine1?: string;
  city?: string;
  countryCode?: string; // default "IN"
  countryName?: string; // default "India"
  contactNo: string;
  email: string;
  isLeadPax: boolean;
  fare?: any; // TBO Fare breakdown object from FareQuote
  ffAirlineCode?: string | null;
  ffNumber?: string | null;
  gstDetails?: {
    gstNumber?: string;
    companyName?: string;
    companyAddress?: string;
    contactNumber?: string;
    email?: string;
  };
}

export interface TboBookRequestParams {
  traceId: string;
  resultIndex: string;
  passengers: TboPassenger[];
  endUserIp?: string;
}

export interface TboTicketRequestParams {
  traceId: string;
  resultIndex: string;
  passengers: TboPassenger[];
  endUserIp?: string;
}

export interface TboRailSearchQuery {
  fromStationCode: string; // IRCTC Station Code (e.g. NDLS)
  toStationCode: string; // IRCTC Station Code (e.g. MMCT)
  journeyDate: string; // YYYY-MM-DD
  quota: "GN" | "TQ" | "LD";
  travelClass?: "1A" | "2A" | "3A" | "SL" | "CC" | "EC";
}

export interface TboMarginCalculationParams {
  publishedPriceInrOrPaise: number; // Carrier published retail price (MRP)
  offeredPriceInrOrPaise: number;   // TBO B2B wholesale net price
  baseFareInrOrPaise: number;       // Base fare for customer rebate calculation
  passengerCount?: number;          // Default: 1
  customerRebateBps?: number;       // Default: 200 bps = 2%
  isInputInPaise?: boolean;         // true if input is already integer paise, false if INR
  goldRatePerGramRupees?: number;   // Default: 7500
}

export interface TboMarginResult {
  passengerCount: number;
  publishedPricePaiseTotal: number;
  wholesaleCostPaiseTotal: number;
  founderGrossMarginPaise: number;
  customerRebateBps: number;
  customerRebatePaiseTotal: number;
  rebateGoldMilligrams: number;
  founderNetRetainedMarginPaise: number;
  isProfitable: boolean;
}

/**
 * Resolves TBO API credentials from environment variables.
 * Fails closed without throwing if credentials are not yet provisioned.
 *
 * Supported environment keys:
 * - TBO_CLIENT_ID, TBO_AGENCY_CODE, VITE_TBO_CLIENT_ID, VITE_TBO_AGENCY_CODE (defaults to "187051")
 * - TBO_USERNAME, TBO_USER_NAME, VITE_TBO_USERNAME, VITE_TBO_USER_NAME
 * - TBO_PASSWORD, VITE_TBO_PASSWORD
 * - TBO_ENDPOINT, VITE_TBO_ENDPOINT (defaults to https://api.tbotechnology.com)
 */
export function getTboCredentials(): TboCredentials | null {
  const getEnv = (key: string): string => {
    if (typeof process !== "undefined" && process.env?.[key]) {
      return String(process.env[key]).trim();
    }
    if (typeof import.meta !== "undefined" && (import.meta as any).env?.[key]) {
      return String((import.meta as any).env[key]).trim();
    }
    return "";
  };

  const agencyCode =
    getEnv("TBO_CLIENT_ID") ||
    getEnv("TBO_AGENCY_CODE") ||
    getEnv("VITE_TBO_CLIENT_ID") ||
    getEnv("VITE_TBO_AGENCY_CODE") ||
    TBO_APPLICATION_ID;

  const userName =
    getEnv("TBO_USERNAME") ||
    getEnv("TBO_USER_NAME") ||
    getEnv("VITE_TBO_USERNAME") ||
    getEnv("VITE_TBO_USER_NAME");

  const password =
    getEnv("TBO_PASSWORD") ||
    getEnv("VITE_TBO_PASSWORD");

  const endpoint =
    getEnv("TBO_ENDPOINT") ||
    getEnv("VITE_TBO_ENDPOINT") ||
    TBO_DEFAULT_ENDPOINT;

  // Fail-closed: Must have username and password to authenticate with TBO gateway
  if (!userName || !password) {
    return null;
  }

  return { agencyCode, userName, password, endpoint };
}

// ============================================================================
// JSON REQUEST SERIALIZERS (Strict TBO Tek Production Schema)
// ============================================================================

/**
 * Serializes authentication request for TBO SharedServices/Authenticate.
 */
export function serializeTboAuthRequest(
  creds: TboCredentials,
  endUserIp = DEFAULT_END_USER_IP
): { ClientId: string; UserName: string; Password: string; EndUserIp: string } {
  return {
    ClientId: creds.agencyCode,
    UserName: creds.userName,
    Password: creds.password,
    EndUserIp: endUserIp,
  };
}

/**
 * Maps cabin class enum to TBO Air API numeric cabin class.
 * 1: Economy, 2: All, 3: PremiumEconomy, 4: Business, 5: PremiumBusiness, 6: FirstClass
 */
export function mapTboCabinClass(cabin: TboFlightSearchQuery["cabinClass"]): number {
  switch (cabin) {
    case "Business":
      return 4;
    case "PremiumEconomy":
      return 3;
    case "Economy":
    default:
      return 1;
  }
}

/**
 * Serializes flight search request for TBO BookingEngineService_Air/Search.
 */
export function serializeTboFlightSearchRequest(
  query: TboFlightSearchQuery,
  tokenId: string,
  endUserIp = DEFAULT_END_USER_IP
): Record<string, any> {
  const cabinCode = mapTboCabinClass(query.cabinClass);
  const journeyType = query.journeyType === "Return" ? 2 : query.journeyType === "MultiStop" ? 3 : 1;

  return {
    EndUserIp: endUserIp,
    TokenId: tokenId,
    AdultCount: Math.max(1, query.adultCount || 1),
    ChildCount: Math.max(0, query.childCount || 0),
    InfantCount: Math.max(0, query.infantCount || 0),
    DirectFlight: query.directFlight ?? true,
    OneStopFlight: query.oneStopFlight ?? false,
    JourneyType: journeyType,
    PreferredAirlines: query.preferredAirlines && query.preferredAirlines.length > 0 ? query.preferredAirlines : null,
    Segments: [
      {
        Origin: query.origin.trim().toUpperCase(),
        Destination: query.destination.trim().toUpperCase(),
        FlightCabinClass: cabinCode,
        PreferredDepartureTime: query.preferredDepartureTime,
      },
    ],
    Sources: null,
  };
}

/**
 * Serializes FareQuote request to re-validate pricing & availability before booking.
 */
export function serializeTboFareQuoteRequest(
  params: TboFareQuoteParams,
  tokenId: string
): { EndUserIp: string; TokenId: string; TraceId: string; ResultIndex: string } {
  return {
    EndUserIp: params.endUserIp || DEFAULT_END_USER_IP,
    TokenId: tokenId,
    TraceId: params.traceId,
    ResultIndex: params.resultIndex,
  };
}

/**
 * Serializes FareRule request for carrier baggage and cancellation policies.
 */
export function serializeTboFareRuleRequest(
  params: TboFareRuleParams,
  tokenId: string
): { EndUserIp: string; TokenId: string; TraceId: string; ResultIndex: string } {
  return {
    EndUserIp: params.endUserIp || DEFAULT_END_USER_IP,
    TokenId: tokenId,
    TraceId: params.traceId,
    ResultIndex: params.resultIndex,
  };
}

/**
 * Serializes SSR (Special Service Requests: Meals, Seats, Baggage) request.
 */
export function serializeTboSSRRequest(
  params: TboSSRParams,
  tokenId: string
): { EndUserIp: string; TokenId: string; TraceId: string; ResultIndex: string } {
  return {
    EndUserIp: params.endUserIp || DEFAULT_END_USER_IP,
    TokenId: tokenId,
    TraceId: params.traceId,
    ResultIndex: params.resultIndex,
  };
}

/**
 * Serializes passenger array into official TBO Passenger model with statutory GSTIN.
 */
export function serializeTboPassengers(passengers: TboPassenger[]): any[] {
  return passengers.map((pax, index) => {
    const isLead = pax.isLeadPax || index === 0;
    const gst = pax.gstDetails || {};

    return {
      Title: pax.title,
      FirstName: pax.firstName.trim(),
      LastName: pax.lastName.trim(),
      PaxType: pax.paxType,
      DateOfBirth: pax.dateOfBirth || "1994-01-01T00:00:00",
      Gender: pax.gender,
      PassportNo: pax.passportNo || "",
      PassportExpiry: pax.passportExpiry || "",
      AddressLine1: pax.addressLine1 || "Orderkingpay Sovereign Travel Desk",
      AddressLine2: "",
      City: pax.city || "Silchar",
      CountryCode: pax.countryCode || "IN",
      CountryName: pax.countryName || "India",
      ContactNo: pax.contactNo.replace(/\D/g, "") || TBO_GST_CONTACT,
      Email: pax.email || TBO_GST_EMAIL,
      IsLeadPax: isLead,
      FFAirlineCode: pax.ffAirlineCode || null,
      FFNumber: pax.ffNumber || null,
      Fare: pax.fare || null,
      GSTCompanyAddress: gst.companyAddress || TBO_GST_ADDRESS,
      GSTCompanyContactNumber: gst.contactNumber || TBO_GST_CONTACT,
      GSTCompanyName: gst.companyName || TBO_TRADE_NAME,
      GSTNumber: gst.gstNumber || TBO_GSTIN,
      GSTCompanyEmail: gst.email || TBO_GST_EMAIL,
    };
  });
}

/**
 * Serializes Book request for Non-LCC flights (holding reservation before ticketing).
 */
export function serializeTboBookRequest(
  params: TboBookRequestParams,
  tokenId: string
): Record<string, any> {
  return {
    EndUserIp: params.endUserIp || DEFAULT_END_USER_IP,
    TokenId: tokenId,
    TraceId: params.traceId,
    ResultIndex: params.resultIndex,
    Passengers: serializeTboPassengers(params.passengers),
  };
}

/**
 * Serializes Ticket request for instant LCC issuance or ticket generation on held PNR.
 */
export function serializeTboTicketRequest(
  params: TboTicketRequestParams,
  tokenId: string
): Record<string, any> {
  return {
    EndUserIp: params.endUserIp || DEFAULT_END_USER_IP,
    TokenId: tokenId,
    TraceId: params.traceId,
    ResultIndex: params.resultIndex,
    Passengers: serializeTboPassengers(params.passengers),
  };
}

/**
 * Serializes GetBookingDetails request for PNR and e-ticket status retrieval.
 */
export function serializeTboGetBookingDetailsRequest(
  pnr: string,
  bookingId: string | number,
  tokenId: string,
  endUserIp = DEFAULT_END_USER_IP
): { EndUserIp: string; TokenId: string; PNR: string; BookingId: number } {
  return {
    EndUserIp: endUserIp,
    TokenId: tokenId,
    PNR: pnr.trim().toUpperCase(),
    BookingId: Number(bookingId),
  };
}

// ============================================================================
// EXACT INTEGER-PAISE FOUNDER MARGIN CALCULATOR
// ============================================================================

/**
 * Calculates exact integer-paise founder margins on TBO B2B wholesale tariffs.
 *
 * Guaranteed Properties:
 * 1. Strict integer paise arithmetic (`Math.floor` / `Math.round`) - 0 float inaccuracies.
 * 2. Published Price (MRP) - Wholesale Cost (TBO Net) = Founder Gross Margin.
 * 3. 2% KingPay Wallet Rebate (or custom bps) deducted from base fare.
 * 4. Founder Net Retained Margin = Gross Margin - Customer Rebate.
 * 5. Milligram-accurate 24K gold rebate alternative calculation.
 */
export function calculateTboFounderMargin(
  params: TboMarginCalculationParams
): TboMarginResult {
  const count = Math.max(1, Math.floor(params.passengerCount || 1));
  const isPaise = Boolean(params.isInputInPaise);

  const publishedUnitPaise = isPaise
    ? Math.floor(params.publishedPriceInrOrPaise)
    : Math.round(params.publishedPriceInrOrPaise * 100);

  const wholesaleUnitPaise = isPaise
    ? Math.floor(params.offeredPriceInrOrPaise)
    : Math.round(params.offeredPriceInrOrPaise * 100);

  const baseFareUnitPaise = isPaise
    ? Math.floor(params.baseFareInrOrPaise)
    : Math.round(params.baseFareInrOrPaise * 100);

  const publishedPricePaiseTotal = publishedUnitPaise * count;
  const wholesaleCostPaiseTotal = wholesaleUnitPaise * count;
  const baseFarePaiseTotal = baseFareUnitPaise * count;

  // Founder Gross Margin: What TBO discounts from published price
  const founderGrossMarginPaise = publishedPricePaiseTotal - wholesaleCostPaiseTotal;

  // Customer 2% Rebate (default 200 bps): floor((baseFare * bps) / 10,000)
  const rebateBps = params.customerRebateBps ?? 200;
  const customerRebatePaiseTotal = Math.floor((baseFarePaiseTotal * rebateBps) / 10_000);

  // Founder Net Retained Margin after platform-funded 2% wallet cashback
  const founderNetRetainedMarginPaise = founderGrossMarginPaise - customerRebatePaiseTotal;

  // 24K Gold Milligrams conversion: (rebatePaise / 100) / goldRate * 1000
  const goldRate = params.goldRatePerGramRupees || 7500;
  const rebateGoldMilligrams = Math.round(
    ((customerRebatePaiseTotal / 100) / goldRate) * 1000
  );

  return {
    passengerCount: count,
    publishedPricePaiseTotal,
    wholesaleCostPaiseTotal,
    founderGrossMarginPaise,
    customerRebateBps: rebateBps,
    customerRebatePaiseTotal,
    rebateGoldMilligrams,
    founderNetRetainedMarginPaise,
    isProfitable: founderNetRetainedMarginPaise >= 0,
  };
}

// ============================================================================
// GATEWAY CLIENT METHODS
// ============================================================================

/**
 * Authenticates with TBO API Gateway using registered agency credentials.
 */
export async function authenticateTbo(
  creds?: TboCredentials | null,
  endUserIp = DEFAULT_END_USER_IP
): Promise<TboAuthResult> {
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
    const payload = serializeTboAuthRequest(credentials, endUserIp);

    const res = await fetch(authUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
  token?: string,
  endUserIp = DEFAULT_END_USER_IP
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
    const auth = await authenticateTbo(creds, endUserIp);
    if (!auth.authenticated || !auth.token) {
      return { success: false, flights: [], error: auth.message };
    }
    authToken = auth.token;
  }

  try {
    const searchUrl = `${creds.endpoint}/BookingEngineService_Air/AirService.svc/rest/Search`;
    const payload = serializeTboFlightSearchRequest(query, authToken, endUserIp);

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
 * Re-validates pricing, seat availability, and baggage/meal allowances before booking.
 */
export async function fareQuoteTbo(
  params: TboFareQuoteParams,
  token?: string
): Promise<{
  success: boolean;
  fareQuote?: any;
  isPriceChanged?: boolean;
  error?: string;
}> {
  const creds = getTboCredentials();
  if (!creds) {
    return {
      success: false,
      error: "TBO credentials pending. Application #187051 is under review.",
    };
  }

  let authToken = token;
  if (!authToken) {
    const auth = await authenticateTbo(creds, params.endUserIp);
    if (!auth.authenticated || !auth.token) {
      return { success: false, error: auth.message };
    }
    authToken = auth.token;
  }

  try {
    const url = `${creds.endpoint}/BookingEngineService_Air/AirService.svc/rest/FareQuote`;
    const payload = serializeTboFareQuoteRequest(params, authToken);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { success: false, error: `TBO FareQuote returned HTTP ${res.status}` };
    }

    const data: any = await res.json();
    if (data?.Response?.Error?.ErrorCode && data.Response.Error.ErrorCode !== 0) {
      return {
        success: false,
        error: data.Response.Error.ErrorMessage || "FareQuote rejected by carrier.",
      };
    }

    const result = data?.Response?.Results;
    return {
      success: true,
      fareQuote: result,
      isPriceChanged: Boolean(data?.Response?.IsPriceChanged),
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "TBO FareQuote error" };
  }
}

/**
 * Retrieves carrier fare rules and cancellation/reschedule terms.
 */
export async function fareRuleTbo(
  params: TboFareRuleParams,
  token?: string
): Promise<{
  success: boolean;
  fareRules?: any[];
  error?: string;
}> {
  const creds = getTboCredentials();
  if (!creds) {
    return { success: false, error: "TBO credentials pending. Application #187051 is under review." };
  }

  let authToken = token;
  if (!authToken) {
    const auth = await authenticateTbo(creds, params.endUserIp);
    if (!auth.authenticated || !auth.token) {
      return { success: false, error: auth.message };
    }
    authToken = auth.token;
  }

  try {
    const url = `${creds.endpoint}/BookingEngineService_Air/AirService.svc/rest/FareRule`;
    const payload = serializeTboFareRuleRequest(params, authToken);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { success: false, error: `TBO FareRule returned HTTP ${res.status}` };
    }

    const data: any = await res.json();
    return {
      success: true,
      fareRules: data?.Response?.FareRules || [],
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "TBO FareRule error" };
  }
}

/**
 * Special Service Requests: Baggage, Meals, and Seat layout retrieval.
 */
export async function ssrTbo(
  params: TboSSRParams,
  token?: string
): Promise<{
  success: boolean;
  ssr?: any;
  error?: string;
}> {
  const creds = getTboCredentials();
  if (!creds) {
    return { success: false, error: "TBO credentials pending. Application #187051 is under review." };
  }

  let authToken = token;
  if (!authToken) {
    const auth = await authenticateTbo(creds, params.endUserIp);
    if (!auth.authenticated || !auth.token) {
      return { success: false, error: auth.message };
    }
    authToken = auth.token;
  }

  try {
    const url = `${creds.endpoint}/BookingEngineService_Air/AirService.svc/rest/SSR`;
    const payload = serializeTboSSRRequest(params, authToken);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { success: false, error: `TBO SSR returned HTTP ${res.status}` };
    }

    const data: any = await res.json();
    return {
      success: true,
      ssr: data?.Response,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "TBO SSR error" };
  }
}

/**
 * Direct Live Ticket Issuance for LCCs or Ticket Generation on Held Bookings.
 */
export async function ticketTboFlight(
  params: TboTicketRequestParams,
  token?: string
): Promise<{
  success: boolean;
  bookingId?: number;
  pnr?: string;
  ticketStatus?: string;
  response?: any;
  error?: string;
}> {
  const creds = getTboCredentials();
  if (!creds) {
    return { success: false, error: "TBO credentials pending. Application #187051 is under review." };
  }

  let authToken = token;
  if (!authToken) {
    const auth = await authenticateTbo(creds, params.endUserIp);
    if (!auth.authenticated || !auth.token) {
      return { success: false, error: auth.message };
    }
    authToken = auth.token;
  }

  try {
    const url = `${creds.endpoint}/BookingEngineService_Air/AirService.svc/rest/Ticket`;
    const payload = serializeTboTicketRequest(params, authToken);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { success: false, error: `TBO Ticket returned HTTP ${res.status}` };
    }

    const data: any = await res.json();
    const resp = data?.Response;

    if (resp?.Error?.ErrorCode && resp.Error.ErrorCode !== 0) {
      return {
        success: false,
        error: resp.Error.ErrorMessage || "Carrier rejected live ticket generation.",
      };
    }

    return {
      success: true,
      bookingId: resp?.Response?.BookingId,
      pnr: resp?.Response?.PNR,
      ticketStatus: resp?.Response?.TicketStatus === 1 ? "CONFIRMED" : "PENDING",
      response: resp?.Response,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "TBO Ticket error" };
  }
}

/**
 * Non-LCC Holding Flight Booking.
 */
export async function bookTboFlight(
  params: TboBookRequestParams,
  token?: string
): Promise<{
  success: boolean;
  bookingId?: number;
  pnr?: string;
  response?: any;
  error?: string;
}> {
  const creds = getTboCredentials();
  if (!creds) {
    return { success: false, error: "TBO credentials pending. Application #187051 is under review." };
  }

  let authToken = token;
  if (!authToken) {
    const auth = await authenticateTbo(creds, params.endUserIp);
    if (!auth.authenticated || !auth.token) {
      return { success: false, error: auth.message };
    }
    authToken = auth.token;
  }

  try {
    const url = `${creds.endpoint}/BookingEngineService_Air/AirService.svc/rest/Book`;
    const payload = serializeTboBookRequest(params, authToken);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { success: false, error: `TBO Book returned HTTP ${res.status}` };
    }

    const data: any = await res.json();
    const resp = data?.Response;

    if (resp?.Error?.ErrorCode && resp.Error.ErrorCode !== 0) {
      return {
        success: false,
        error: resp.Error.ErrorMessage || "Carrier rejected flight booking.",
      };
    }

    return {
      success: true,
      bookingId: resp?.Response?.BookingId,
      pnr: resp?.Response?.PNR,
      response: resp?.Response,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "TBO Book error" };
  }
}

/**
 * Retrieves authoritative e-ticket details from TBO GDS by PNR & Booking ID.
 */
export async function getTboBookingDetails(
  pnr: string,
  bookingId: string | number,
  token?: string,
  endUserIp = DEFAULT_END_USER_IP
): Promise<{
  success: boolean;
  bookingDetails?: any;
  error?: string;
}> {
  const creds = getTboCredentials();
  if (!creds) {
    return { success: false, error: "TBO credentials pending. Application #187051 is under review." };
  }

  let authToken = token;
  if (!authToken) {
    const auth = await authenticateTbo(creds, endUserIp);
    if (!auth.authenticated || !auth.token) {
      return { success: false, error: auth.message };
    }
    authToken = auth.token;
  }

  try {
    const url = `${creds.endpoint}/BookingEngineService_Air/AirService.svc/rest/GetBookingDetails`;
    const payload = serializeTboGetBookingDetailsRequest(pnr, bookingId, authToken, endUserIp);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { success: false, error: `TBO GetBookingDetails returned HTTP ${res.status}` };
    }

    const data: any = await res.json();
    return {
      success: true,
      bookingDetails: data?.Response,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "TBO GetBookingDetails error" };
  }
}

/**
 * Live Rail Search & Seat Availability via TBO IRCTC Rail API.
 */
export async function searchTboRail(
  query: TboRailSearchQuery,
  token?: string,
  endUserIp = DEFAULT_END_USER_IP
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
    const auth = await authenticateTbo(creds, endUserIp);
    if (!auth.authenticated || !auth.token) {
      return { success: false, trains: [], error: auth.message };
    }
    authToken = auth.token;
  }

  try {
    const railUrl = `${creds.endpoint}/BookingEngineService_Rail/RailService.svc/rest/Search`;
    const payload = {
      EndUserIp: endUserIp,
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
