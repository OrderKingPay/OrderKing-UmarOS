/**
 * 👑 OrderKing Sovereign Travel Engine - Production B2B Partner Aggregators
 *
 * Real-world white-label affiliate and aggregation deep-link routing engine for:
 * 1. Flights: Kiwi.com / Skyscanner affiliate links with live route params (origin, destination, date, passengers, currency=INR, affiliate sub-id).
 * 2. Trains: ConfirmTkt / IRCTC live deep-link generator with 10-digit PNR prefill and station pair routing.
 * 3. Buses: RedBus live route affiliate link generator with source, destination, and journey date.
 * 4. Hotels: Booking.com / Agoda affiliate link generator with city, checkin, checkout, and guests.
 *
 * Core Mandates:
 * - Direct booking pass-through with zero platform markup (Strictly 0 paise convenience fee guarantee).
 * - Real B2B partner commission tracking (bps & safeInteger paise).
 * - Cryptographically signed tracking tokens (HMAC-SHA256) with tamper protection and expiration.
 * - Strict whitelist validation preventing open redirects or SSRF misuse.
 */

import { createHmac, randomBytes } from "node:crypto";
import { timingSafeHexCompare } from "@/lib/security/crypto-safe";
import {
  recordTravelCommissionLedger,
  type RecordCommissionInput,
} from "./travel-revenue-ledger";
import { extractAirportCode } from "./airline-deep-links";

// ============================================================================
// TYPES & DOMAIN INTERFACES
// ============================================================================

export type PartnerId =
  | "kiwi"
  | "skyscanner"
  | "confirmtkt"
  | "irctc"
  | "redbus"
  | "booking_com"
  | "agoda";

export type TravelMode = "flight" | "train" | "bus" | "hotel";

export type FlightCabinClass =
  | "ECONOMY"
  | "PREMIUM_ECONOMY"
  | "BUSINESS"
  | "FIRST";

export type TrainQuota = "GN" | "TQ" | "LD" | "GENERAL" | "TATKAL" | "LADIES";

export interface FlightPartnerParams {
  origin: string; // IATA (e.g. "DEL")
  destination: string; // IATA (e.g. "BOM")
  departureDate: string; // YYYY-MM-DD
  returnDate?: string; // Optional YYYY-MM-DD
  passengers?: number; // default 1
  cabinClass?: FlightCabinClass; // default "ECONOMY"
  currency?: string; // default "INR"
  subId?: string; // Affiliate sub-tracking id
  affiliateId?: string; // Custom affiliate override
  bookingToken?: string; // Direct Kiwi Tequila booking token if available
  estimatedGrossPaise?: number; // Expected gross booking amount for ledger tracking
  userId?: string;
}

export interface TrainPartnerParams {
  fromStation?: string; // Railway Station Code (e.g. "NDLS")
  toStation?: string; // Railway Station Code (e.g. "MMCT")
  travelDate?: string; // YYYY-MM-DD
  quota?: TrainQuota; // default "GN"
  pnr?: string; // 10-digit Indian Railway PNR
  trainNumber?: string; // e.g. "12952"
  subId?: string;
  affiliateId?: string;
  estimatedGrossPaise?: number;
  userId?: string;
}

export interface BusPartnerParams {
  sourceCity: string; // e.g. "Bengaluru" or "Delhi"
  destinationCity: string; // e.g. "Goa" or "Jaipur"
  journeyDate: string; // YYYY-MM-DD
  busType?: string; // e.g. "sleeper", "ac", "volvo"
  subId?: string;
  affiliateId?: string;
  estimatedGrossPaise?: number;
  userId?: string;
}

export interface HotelPartnerParams {
  cityOrLocation: string; // e.g. "Mumbai" or "Goa"
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  guests?: number; // default 2
  rooms?: number; // default 1
  subId?: string;
  affiliateId?: string;
  estimatedGrossPaise?: number;
  userId?: string;
}

export interface PartnerDeepLinkResult {
  partner: PartnerId;
  partnerName: string;
  travelMode: TravelMode;
  targetUrl: string; // Direct partner portal deep-link with affiliate and sub-id tracking
  handshakeUrl: string; // Routed via /api/travel/partner-handshake?token=...
  signedToken: string;
  clickId: string;
  expectedCommissionBps: number;
  estimatedCommissionPaise: number;
  platformMarkupPaise: 0; // Strictly 0 paise under OrderKing Sovereign Travel guarantee
  routeSummary: string;
  createdAt: string;
  expiresAt: string;
}

export interface PartnerHandshakePayload {
  clickId: string;
  partner: PartnerId;
  travelMode: TravelMode;
  targetUrl: string;
  userId?: string;
  subId?: string;
  grossAmountPaise?: number;
  expectedCommissionBps: number;
  issuedAt: number; // Unix epoch ms
  expiresAt: number; // Unix epoch ms
}

// ============================================================================
// COMMISSION RATES & PARTNER CONFIGURATION
// ============================================================================

export const PARTNER_COMMISSION_RATES_BPS: Record<PartnerId, number> = {
  kiwi: 300, // 3.0% (Kiwi.com affiliate partner tier)
  skyscanner: 200, // 2.0% (Skyscanner associate tier)
  confirmtkt: 100, // 1.0% (ConfirmTkt / IRCTC B2B authorized partner rate)
  irctc: 100, // 1.0% (IRCTC pass-through integration)
  redbus: 300, // 3.0% (RedBus B2B standard commission)
  booking_com: 400, // 4.0% (Booking.com affiliate baseline)
  agoda: 500, // 5.0% (Agoda partner baseline)
};

export const PARTNER_DISPLAY_NAMES: Record<PartnerId, string> = {
  kiwi: "Kiwi.com Global Flights",
  skyscanner: "Skyscanner Travel",
  confirmtkt: "ConfirmTkt Railways",
  irctc: "IRCTC NextGen Ticketing",
  redbus: "RedBus India",
  booking_com: "Booking.com Stays",
  agoda: "Agoda Accommodations",
};

// Domain whitelist for anti-SSRF & open redirect security
export const ALLOWED_PARTNER_HOSTS: readonly string[] = [
  "kiwi.com",
  "www.kiwi.com",
  "api.tequila.kiwi.com",
  "skyscanner.co.in",
  "www.skyscanner.co.in",
  "skyscanner.net",
  "www.skyscanner.net",
  "skyscanner.com",
  "www.skyscanner.com",
  "confirmtkt.com",
  "www.confirmtkt.com",
  "irctc.co.in",
  "www.irctc.co.in",
  "indianrail.gov.in",
  "www.indianrail.gov.in",
  "redbus.in",
  "www.redbus.in",
  "booking.com",
  "www.booking.com",
  "agoda.com",
  "www.agoda.com",
  "tp.media",
  "travelpayouts.com",
  "www.travelpayouts.com",
  "tpwidg.com",
  "tpwgts.com",
  "orderkingpay.com",
  "www.orderkingpay.com",
  "aviasales.com",
  "www.aviasales.com",
  "hotellook.com",
  "search.hotellook.com",
  "duffel.com",
  "www.duffel.com",
  "api.duffel.com",
  "links.duffel.com",
];

// ============================================================================
// CRYPTOGRAPHIC TOKEN & SECURITY UTILITIES
// ============================================================================

function getPartnerSecret(): string {
  return (
    process.env.TRAVEL_PARTNER_SECRET ||
        process.env.AUTH_SECRET ||
    "orderking_sovereign_partner_crypto_key_2026"
  );
}

/**
 * Validates that the target URL belongs strictly to an authorized partner host.
 * Thwarts open-redirect abuse and SSRF exploits.
 */
export function isAllowedPartnerUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_PARTNER_HOSTS.some(
      (allowed) => host === allowed || host.endsWith("." + allowed)
    );
  } catch {
    return false;
  }
}

/**
 * Generates an cryptographically signed tracking token (HMAC-SHA256).
 */
export function createSignedTrackingToken(
  payload: PartnerHandshakePayload,
  customSecret?: string
): string {
  const secret = customSecret || getPartnerSecret();
  const canonicalString = [
    payload.clickId,
    payload.partner,
    payload.travelMode,
    encodeURIComponent(payload.targetUrl),
    payload.userId || "",
    payload.subId || "",
    payload.grossAmountPaise || 0,
    payload.expectedCommissionBps,
    payload.issuedAt,
    payload.expiresAt,
  ].join("|");

  const signature = createHmac("sha256", secret)
    .update(canonicalString)
    .digest("hex");

  const jsonBytes = Buffer.from(JSON.stringify(payload), "utf-8");
  const payloadB64 = jsonBytes.toString("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies the validity, tamper resistance, and expiration of a partner tracking token.
 */
export function verifySignedTrackingToken(
  token: string,
  customSecret?: string
): { valid: boolean; payload?: PartnerHandshakePayload; error?: string } {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false, error: "Malformed tracking token format." };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, error: "Invalid token segments." };
  }

  const [payloadB64, receivedSigHex] = parts;

  try {
    const jsonStr = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const payload = JSON.parse(jsonStr) as PartnerHandshakePayload;

    if (!payload.clickId || !payload.partner || !payload.targetUrl) {
      return { valid: false, error: "Incomplete token payload." };
    }

    // Check expiration (24h default TTL)
    if (Date.now() > payload.expiresAt) {
      return { valid: false, error: "Tracking token has expired." };
    }

    // Recompute signature
    const secret = customSecret || getPartnerSecret();
    const canonicalString = [
      payload.clickId,
      payload.partner,
      payload.travelMode,
      encodeURIComponent(payload.targetUrl),
      payload.userId || "",
      payload.subId || "",
      payload.grossAmountPaise || 0,
      payload.expectedCommissionBps,
      payload.issuedAt,
      payload.expiresAt,
    ].join("|");

    const expectedSigHex = createHmac("sha256", secret)
      .update(canonicalString)
      .digest("hex");

    if (!timingSafeHexCompare(expectedSigHex, receivedSigHex)) {
      return { valid: false, error: "Cryptographic signature mismatch." };
    }

    // Verify host against whitelist
    if (!isAllowedPartnerUrl(payload.targetUrl)) {
      return { valid: false, error: "Target URL host is not in authorized partner whitelist." };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: "Failed to decode tracking token." };
  }
}

// ============================================================================
// NORMALIZATION & STRING HELPERS
// ============================================================================

const COMMON_RAILWAY_STATION_MAP: Record<string, string> = {
  DELHI: "NDLS",
  "NEW DELHI": "NDLS",
  MUMBAI: "MMCT",
  "MUMBAI CENTRAL": "MMCT",
  CSMT: "CSMT",
  BENGALURU: "SBC",
  BANGALORE: "SBC",
  KOLKATA: "HWH",
  HOWRAH: "HWH",
  CHENNAI: "MAS",
  HYDERABAD: "SC",
  SECUNDERABAD: "SC",
  PUNE: "PUNE",
  AHMEDABAD: "ADI",
  KANPUR: "CNB",
  VARANASI: "BSB",
  LUCKNOW: "LKO",
  PATNA: "PNBE",
  GUWAHATI: "GHY",
  CHANDIGARH: "CDG",
  AGRA: "AGC",
  BHOPAL: "BPL",
  GOA: "MAO",
  MADGAON: "MAO",
  KOCHI: "ERS",
};

/**
 * Extracts standard railway station code from inputs like "New Delhi (NDLS)", "NDLS", or "Kanpur".
 */
export function extractRailwayStationCode(input: string, fallback = "NDLS"): string {
  if (!input) return fallback;
  const trimmed = input.trim();

  // Pattern 1: Code in parentheses: "New Delhi (NDLS)"
  const parenMatch = trimmed.match(/\(([A-Za-z0-9]{2,6})\)/);
  if (parenMatch) return parenMatch[1].toUpperCase();

  // Pattern 2: Direct 2 to 5 letter code: "NDLS", "CNB", "HWH"
  if (/^[A-Za-z]{2,5}$/.test(trimmed)) return trimmed.toUpperCase();

  // Pattern 3: Common station map
  const upper = trimmed.toUpperCase();
  for (const [key, code] of Object.entries(COMMON_RAILWAY_STATION_MAP)) {
    if (upper.includes(key)) return code;
  }

  const clean = trimmed.replace(/[^A-Za-z]/g, "").toUpperCase();
  return clean.length >= 2 ? clean.slice(0, 4) : fallback;
}

/**
 * Normalizes city names for canonical bus routing slugs (e.g. "Bengaluru" -> "bangalore").
 */
export function slugifyBusCity(city: string, fallback = "city"): string {
  if (!city) return fallback;
  const clean = city.trim().toLowerCase();

  const cityAliases: Record<string, string> = {
    bengaluru: "bangalore",
    bangalore: "bangalore",
    "new delhi": "delhi",
    delhi: "delhi",
    mumbai: "mumbai",
    bombay: "mumbai",
    pune: "pune",
    hyderabad: "hyderabad",
    chennai: "chennai",
    madras: "chennai",
    kolkata: "kolkata",
    calcutta: "kolkata",
    ahmedabad: "ahmedabad",
    jaipur: "jaipur",
    goa: "goa",
    lucknow: "lucknow",
    chandigarh: "chandigarh",
    indore: "indore",
    nagpur: "nagpur",
    surat: "surat",
    coimbatore: "coimbatore",
    mysore: "mysore",
    mysuru: "mysore",
    visakhapatnam: "visakhapatnam",
    vizag: "visakhapatnam",
  };

  for (const [key, slug] of Object.entries(cityAliases)) {
    if (clean.includes(key)) return slug;
  }

  const slugified = clean
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slugified || fallback;
}

/**
 * Formats ISO YYYY-MM-DD into DD-MMM-YYYY (e.g. "25-Oct-2026")
 */
export function formatDateToDdMmmYyyy(isoDate: string): string {
  if (!isoDate || !isoDate.includes("-")) return isoDate;
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const mIndex = Math.max(0, Math.min(11, parseInt(month, 10) - 1));
  return `${day}-${months[mIndex]}-${year}`;
}

/**
 * Formats ISO YYYY-MM-DD into DD/MM/YYYY (e.g. "25/10/2026")
 */
export function formatDateToDdMmYyyy(isoDate: string): string {
  if (!isoDate || !isoDate.includes("-")) return isoDate;
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

/**
 * Formats ISO YYYY-MM-DD into YYMMDD (e.g. "2026-10-25" -> "261025")
 */
export function formatDateToYyMmDd(isoDate: string): string {
  if (!isoDate || !isoDate.includes("-")) return isoDate;
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts;
  return `${year.slice(-2)}${month}${day}`;
}

/**
 * Generates an atomic click ID and tracking result wrapper.
 */
function createResultWrapper({
  partner,
  travelMode,
  targetUrl,
  routeSummary,
  userId,
  subId,
  estimatedGrossPaise = 0,
}: {
  partner: PartnerId;
  travelMode: TravelMode;
  targetUrl: string;
  routeSummary: string;
  userId?: string;
  subId?: string;
  estimatedGrossPaise?: number;
}): PartnerDeepLinkResult {
  const clickId = `clk_${partner}_${Date.now()}_${randomBytes(4).toString("hex")}`;
  const effectiveSubId = subId || (userId ? `usr_${userId}` : clickId);
  const commissionBps = PARTNER_COMMISSION_RATES_BPS[partner];
  const estimatedCommissionPaise = Math.floor(
    (estimatedGrossPaise * commissionBps) / 10_000
  );

  const nowMs = Date.now();
  const expiresAtMs = nowMs + 24 * 60 * 60 * 1000; // 24 hours validity

  const payload: PartnerHandshakePayload = {
    clickId,
    partner,
    travelMode,
    targetUrl,
    userId,
    subId: effectiveSubId,
    grossAmountPaise: estimatedGrossPaise,
    expectedCommissionBps: commissionBps,
    issuedAt: nowMs,
    expiresAt: expiresAtMs,
  };

  const signedToken = createSignedTrackingToken(payload);
  const handshakeUrl = `/api/travel/partner-handshake?token=${encodeURIComponent(signedToken)}`;

  return {
    partner,
    partnerName: PARTNER_DISPLAY_NAMES[partner],
    travelMode,
    targetUrl,
    handshakeUrl,
    signedToken,
    clickId,
    expectedCommissionBps: commissionBps,
    estimatedCommissionPaise,
    platformMarkupPaise: 0,
    routeSummary,
    createdAt: new Date(nowMs).toISOString(),
    expiresAt: new Date(expiresAtMs).toISOString(),
  };
}

// ============================================================================
// 1. FLIGHT PARTNER GENERATORS (Kiwi.com & Skyscanner)
// ============================================================================

/**
 * Generates verified Kiwi.com affiliate deep-link with live route params:
 * origin, destination, date, passengers, currency=INR, affiliate sub-id.
 */
export function generateKiwiFlightLink(
  params: FlightPartnerParams
): PartnerDeepLinkResult {
  const origin = extractAirportCode(params.origin, "DEL");
  const destination = extractAirportCode(params.destination, "BOM");
  const departureDate =
    params.departureDate || new Date().toISOString().split("T")[0];
  const passengers = Math.max(1, Math.min(9, Math.floor(params.passengers || 1)));
  const currency = params.currency || "INR";
  const affilId =
    params.affiliateId ||
    process.env.KIWI_AFFILIATE_ID ||
    process.env.TEQUILA_AFFILIATE_ID ||
    "orderking_travel";
  const subId = params.subId || (params.userId ? `ok_${params.userId}` : "ok_web");

  const kiwiUrl = new URL("https://www.kiwi.com/deep");
  kiwiUrl.searchParams.set("affilid", affilId);
  kiwiUrl.searchParams.set("currency", currency);
  kiwiUrl.searchParams.set("lang", "en");
  kiwiUrl.searchParams.set("from", origin);
  kiwiUrl.searchParams.set("to", destination);
  kiwiUrl.searchParams.set("departure", departureDate);
  if (params.returnDate) {
    kiwiUrl.searchParams.set("return", params.returnDate);
  }
  kiwiUrl.searchParams.set("passengers", String(passengers));
  kiwiUrl.searchParams.set("sub_id", subId);

  // If a pre-queried booking token exists (from Tequila search), deep link straight to booking
  if (params.bookingToken) {
    kiwiUrl.searchParams.set("booking_token", params.bookingToken);
  }

  const targetUrl = kiwiUrl.toString();
  const routeSummary = `Flight ${origin} ➔ ${destination} on ${departureDate} (${passengers} Pax, ${currency})`;

  return createResultWrapper({
    partner: "kiwi",
    travelMode: "flight",
    targetUrl,
    routeSummary,
    userId: params.userId,
    subId,
    estimatedGrossPaise: params.estimatedGrossPaise || passengers * 450000,
  });
}

/**
 * Generates verified Skyscanner affiliate deep-link with live route params:
 * origin, destination, date, passengers, currency=INR, affiliate sub-id.
 */
export function generateSkyscannerFlightLink(
  params: FlightPartnerParams
): PartnerDeepLinkResult {
  const origin = extractAirportCode(params.origin, "DEL").toLowerCase();
  const destination = extractAirportCode(params.destination, "BOM").toLowerCase();
  const departureDate =
    params.departureDate || new Date().toISOString().split("T")[0];
  const passengers = Math.max(1, Math.min(9, Math.floor(params.passengers || 1)));
  const currency = params.currency || "INR";
  const associateId =
    params.affiliateId ||
    process.env.SKYSCANNER_ASSOCIATE_ID ||
    "orderking_travel";
  const subId = params.subId || (params.userId ? `ok_${params.userId}` : "ok_web");

  const depShort = formatDateToYyMmDd(departureDate);
  const datePath = params.returnDate
    ? `${depShort}/${formatDateToYyMmDd(params.returnDate)}`
    : `${depShort}`;

  let cabin = "economy";
  if (params.cabinClass === "BUSINESS") cabin = "business";
  else if (params.cabinClass === "PREMIUM_ECONOMY") cabin = "premiumeconomy";
  else if (params.cabinClass === "FIRST") cabin = "first";

  const basePath = `https://www.skyscanner.co.in/transport/flights/${origin}/${destination}/${datePath}/`;
  const url = new URL(basePath);
  url.searchParams.set("adultsv2", String(passengers));
  url.searchParams.set("cabinclass", cabin);
  url.searchParams.set("currency", currency);
  url.searchParams.set("rtn", params.returnDate ? "1" : "0");
  url.searchParams.set("associateid", associateId);
  url.searchParams.set("utm_source", subId);
  url.searchParams.set("utm_medium", "affiliate");
  url.searchParams.set("utm_campaign", "b2b_travel_engine");

  const targetUrl = url.toString();
  const routeSummary = `Flight ${origin.toUpperCase()} ➔ ${destination.toUpperCase()} on ${departureDate} (${passengers} Pax, ${currency})`;

  return createResultWrapper({
    partner: "skyscanner",
    travelMode: "flight",
    targetUrl,
    routeSummary,
    userId: params.userId,
    subId,
    estimatedGrossPaise: params.estimatedGrossPaise || passengers * 450000,
  });
}

// ============================================================================
// 2. TRAIN PARTNER GENERATORS (ConfirmTkt & IRCTC)
// ============================================================================

/**
 * Generates verified ConfirmTkt live deep-link with 10-digit PNR prefill
 * and station pair routing.
 */
export function generateConfirmTktTrainLink(
  params: TrainPartnerParams
): PartnerDeepLinkResult {
  const partnerId =
    params.affiliateId ||
    process.env.CONFIRMTKT_PARTNER_ID ||
    "orderking";
  const subId = params.subId || (params.userId ? `ok_${params.userId}` : "ok_trains");

  // Case 1: 10-digit PNR prefill enquiry
  if (params.pnr) {
    const cleanPnr = params.pnr.replace(/\D/g, "");
    if (cleanPnr.length !== 10) {
      throw new Error("Invalid Indian Railways PNR: must be exactly 10 digits.");
    }

    const pnrUrl = `https://www.confirmtkt.com/pnr-status/${cleanPnr}?partner=${encodeURIComponent(
      partnerId
    )}&subId=${encodeURIComponent(subId)}`;

    return createResultWrapper({
      partner: "confirmtkt",
      travelMode: "train",
      targetUrl: pnrUrl,
      routeSummary: `ConfirmTkt Live PNR Prediction & Status (${cleanPnr})`,
      userId: params.userId,
      subId,
      estimatedGrossPaise: params.estimatedGrossPaise || 120000,
    });
  }

  // Case 2: Station Pair Routing
  const fromCode = extractRailwayStationCode(params.fromStation || "NDLS", "NDLS");
  const toCode = extractRailwayStationCode(params.toStation || "MMCT", "MMCT");
  const travelDate =
    params.travelDate || new Date().toISOString().split("T")[0];
  const formattedDate = formatDateToDdMmYyyy(travelDate).replace(/\//g, "-");
  const quota = params.quota === "TQ" || params.quota === "TATKAL" ? "TQ" : "GN";

  let targetUrl: string;
  if (params.trainNumber) {
    const cleanTrain = params.trainNumber.replace(/\D/g, "");
    targetUrl = `https://www.confirmtkt.com/train-running-status/${cleanTrain}?partner=${encodeURIComponent(
      partnerId
    )}&subId=${encodeURIComponent(subId)}`;
  } else {
    targetUrl = `https://www.confirmtkt.com/trains/${fromCode.toLowerCase()}-to-${toCode.toLowerCase()}?date=${formattedDate}&quota=${quota}&partner=${encodeURIComponent(
      partnerId
    )}&subId=${encodeURIComponent(subId)}`;
  }

  const routeSummary = `Train ${fromCode} ➔ ${toCode} on ${travelDate} [Quota: ${quota}]`;

  return createResultWrapper({
    partner: "confirmtkt",
    travelMode: "train",
    targetUrl,
    routeSummary,
    userId: params.userId,
    subId,
    estimatedGrossPaise: params.estimatedGrossPaise || 145000,
  });
}

/**
 * Generates verified IRCTC live deep-link generator with 10-digit PNR prefill
 * and official NextGen e-ticketing station pair routing.
 */
export function generateIrctcTrainLink(
  params: TrainPartnerParams
): PartnerDeepLinkResult {
  const subId = params.subId || (params.userId ? `ok_${params.userId}` : "ok_irctc");

  // Case 1: 10-digit PNR prefill
  if (params.pnr) {
    const cleanPnr = params.pnr.replace(/\D/g, "");
    if (cleanPnr.length !== 10) {
      throw new Error("Invalid Indian Railways PNR: must be exactly 10 digits.");
    }

    const targetUrl = `https://www.irctc.co.in/nget/enquiry/pnr/${cleanPnr}`;
    return createResultWrapper({
      partner: "irctc",
      travelMode: "train",
      targetUrl,
      routeSummary: `IRCTC Official PNR Enquiry (${cleanPnr})`,
      userId: params.userId,
      subId,
      estimatedGrossPaise: params.estimatedGrossPaise || 120000,
    });
  }

  // Case 2: Station Pair NextGen Search
  const fromCode = extractRailwayStationCode(params.fromStation || "NDLS", "NDLS");
  const toCode = extractRailwayStationCode(params.toStation || "MMCT", "MMCT");
  const travelDate =
    params.travelDate || new Date().toISOString().split("T")[0];
  const irctcDate = formatDateToDdMmYyyy(travelDate); // DD/MM/YYYY
  const irctcQuota =
    params.quota === "TQ" || params.quota === "TATKAL"
      ? "TATKAL"
      : params.quota === "LD" || params.quota === "LADIES"
      ? "LADIES"
      : "GENERAL";

  const url = new URL("https://www.irctc.co.in/nget/train-search");
  url.searchParams.set("fromStation", fromCode);
  url.searchParams.set("toStation", toCode);
  url.searchParams.set("journeyDate", irctcDate);
  url.searchParams.set("journeyQuota", irctcQuota);

  const targetUrl = url.toString();
  const routeSummary = `IRCTC NextGen Ticketing ${fromCode} ➔ ${toCode} on ${irctcDate} (${irctcQuota})`;

  return createResultWrapper({
    partner: "irctc",
    travelMode: "train",
    targetUrl,
    routeSummary,
    userId: params.userId,
    subId,
    estimatedGrossPaise: params.estimatedGrossPaise || 145000,
  });
}

// ============================================================================
// 3. BUS PARTNER GENERATOR (RedBus)
// ============================================================================

/**
 * Generates verified RedBus live route affiliate link with source,
 * destination, and journey date.
 */
export function generateRedBusLink(
  params: BusPartnerParams
): PartnerDeepLinkResult {
  const sourceSlug = slugifyBusCity(params.sourceCity, "bangalore");
  const destSlug = slugifyBusCity(params.destinationCity, "goa");
  const journeyDate =
    params.journeyDate || new Date().toISOString().split("T")[0];
  const formattedDoj = formatDateToDdMmmYyyy(journeyDate); // e.g. "25-Oct-2026"
  const affiliateId =
    params.affiliateId || process.env.REDBUS_AFFILIATE_ID || "orderking_bus";
  const subId = params.subId || (params.userId ? `ok_${params.userId}` : "ok_bus");

  // Canonical RedBus route slug format
  const basePath = `https://www.redbus.in/bus-tickets/${sourceSlug}-to-${destSlug}`;
  const url = new URL(basePath);
  url.searchParams.set("doj", formattedDoj);
  if (params.busType) {
    url.searchParams.set("busType", params.busType);
  }
  url.searchParams.set("utm_source", "orderking");
  url.searchParams.set("utm_medium", "affiliate");
  url.searchParams.set("affId", affiliateId);
  url.searchParams.set("subId", subId);

  const targetUrl = url.toString();
  const routeSummary = `RedBus Corridor ${params.sourceCity} ➔ ${params.destinationCity} on ${formattedDoj}`;

  return createResultWrapper({
    partner: "redbus",
    travelMode: "bus",
    targetUrl,
    routeSummary,
    userId: params.userId,
    subId,
    estimatedGrossPaise: params.estimatedGrossPaise || 95000,
  });
}

// ============================================================================
// 4. HOTEL PARTNER GENERATORS (Booking.com & Agoda)
// ============================================================================

/**
 * Generates verified Booking.com affiliate link with city, checkin,
 * checkout, and guests.
 */
export function generateBookingComHotelLink(
  params: HotelPartnerParams
): PartnerDeepLinkResult {
  const city = params.cityOrLocation.trim() || "Mumbai, Maharashtra, India";
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const checkIn =
    params.checkInDate || today.toISOString().split("T")[0];
  const checkOut =
    params.checkOutDate || tomorrow.toISOString().split("T")[0];
  const guests = Math.max(1, Math.floor(params.guests || 2));
  const rooms = Math.max(1, Math.floor(params.rooms || 1));
  const aid =
    params.affiliateId || process.env.BOOKING_COM_AID || "orderking_hotels";
  const subId = params.subId || (params.userId ? `ok_${params.userId}` : "ok_hotels");

  const url = new URL("https://www.booking.com/searchresults.html");
  url.searchParams.set("ss", city);
  url.searchParams.set("checkin", checkIn);
  url.searchParams.set("checkout", checkOut);
  url.searchParams.set("group_adults", String(guests));
  url.searchParams.set("no_rooms", String(rooms));
  url.searchParams.set("group_children", "0");
  url.searchParams.set("selected_currency", "INR");
  url.searchParams.set("aid", aid);
  url.searchParams.set("label", subId);

  const targetUrl = url.toString();
  const routeSummary = `Booking.com Stays in ${city} [${checkIn} to ${checkOut}] (${guests} Guests, ${rooms} Room)`;

  return createResultWrapper({
    partner: "booking_com",
    travelMode: "hotel",
    targetUrl,
    routeSummary,
    userId: params.userId,
    subId,
    estimatedGrossPaise: params.estimatedGrossPaise || 450000,
  });
}

/**
 * Generates verified Agoda affiliate link with city, checkin,
 * checkout, and guests.
 */
export function generateAgodaHotelLink(
  params: HotelPartnerParams
): PartnerDeepLinkResult {
  const city = params.cityOrLocation.trim() || "Goa, India";
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const checkIn =
    params.checkInDate || today.toISOString().split("T")[0];
  const checkOut =
    params.checkOutDate || tomorrow.toISOString().split("T")[0];
  const guests = Math.max(1, Math.floor(params.guests || 2));
  const rooms = Math.max(1, Math.floor(params.rooms || 1));
  const cid =
    params.affiliateId || process.env.AGODA_CID || "1894215";
  const subId = params.subId || (params.userId ? `ok_${params.userId}` : "ok_hotels");

  const url = new URL("https://www.agoda.com/search");
  url.searchParams.set("city", city);
  url.searchParams.set("checkIn", checkIn);
  url.searchParams.set("checkOut", checkOut);
  url.searchParams.set("rooms", String(rooms));
  url.searchParams.set("adults", String(guests));
  url.searchParams.set("cur", "INR");
  url.searchParams.set("cid", cid);
  url.searchParams.set("tag", subId);

  const targetUrl = url.toString();
  const routeSummary = `Agoda Accommodations in ${city} [${checkIn} to ${checkOut}] (${guests} Guests, ${rooms} Room)`;

  return createResultWrapper({
    partner: "agoda",
    travelMode: "hotel",
    targetUrl,
    routeSummary,
    userId: params.userId,
    subId,
    estimatedGrossPaise: params.estimatedGrossPaise || 450000,
  });
}

// ============================================================================
// 5. UNIFIED DISPATCHER & AUDIT HANDSHAKE
// ============================================================================

export type UnifiedPartnerRequest =
  | { mode: "flight"; partner: "kiwi" | "skyscanner"; params: FlightPartnerParams }
  | { mode: "train"; partner: "confirmtkt" | "irctc"; params: TrainPartnerParams }
  | { mode: "bus"; partner: "redbus"; params: BusPartnerParams }
  | { mode: "hotel"; partner: "booking_com" | "agoda"; params: HotelPartnerParams };

/**
 * Unified entry point to generate any verified partner affiliate link with
 * cryptographic tracking token and handshake URL.
 */
export function generatePartnerLink(
  req: UnifiedPartnerRequest
): PartnerDeepLinkResult {
  switch (req.partner) {
    case "kiwi":
      return generateKiwiFlightLink(req.params);
    case "skyscanner":
      return generateSkyscannerFlightLink(req.params);
    case "confirmtkt":
      return generateConfirmTktTrainLink(req.params);
    case "irctc":
      return generateIrctcTrainLink(req.params);
    case "redbus":
      return generateRedBusLink(req.params);
    case "booking_com":
      return generateBookingComHotelLink(req.params);
    case "agoda":
      return generateAgodaHotelLink(req.params);
    default: {
      const _exhaustiveCheck: never = req;
      throw new Error(`Unsupported partner: ${JSON.stringify(_exhaustiveCheck)}`);
    }
  }
}

/**
 * Records an outbound partner booking click in the authentic double-entry ledger.
 */
export async function recordOutboundPartnerClick(
  payload: PartnerHandshakePayload
): Promise<void> {
  try {
    const input: RecordCommissionInput = {
      bookingReference: payload.clickId,
      travelMode: payload.travelMode,
      partnerName: PARTNER_DISPLAY_NAMES[payload.partner] || payload.partner,
      grossAmountPaise: payload.grossAmountPaise || 0,
      partnerCommissionBps: payload.expectedCommissionBps,
      userId: payload.userId,
    };
    await recordTravelCommissionLedger(input);
  } catch (err) {
    console.warn("[PartnerAggregators] Failed to record outbound ledger click:", err);
  }
}
