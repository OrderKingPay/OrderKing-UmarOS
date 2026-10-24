/**
 * 👑 Sovereign Dual-Engine Travel Architecture
 *
 * Implements the Founder-mandated dual-engine distribution system:
 *
 * Engine 1: Travelpayouts Domestic Network
 * - Handles all Indian domestic air corridors (DEL, BOM, BLR, MAA, HYD, CCU, GOI, etc.)
 * - Direct official carrier checkouts: IndiGo (6E), Air India (AI), Akasa Air (QP), SpiceJet (SG)
 * - IRCTC Indian Railways authorized reservation assistance & station pair routing
 * - Interstate bus routing (RedBus) & verified domestic hotel tariffs
 * - Currency: INR exclusively; domestic rails: UPI, RuPay, Indian NetBanking
 * - Strictly ₹0 platform fee guarantee; zero fake markups, zero fabricated discounts
 *
 * Engine 2: Duffel International GDS Engine
 * - Handles international routes (DXB, LHR, SIN, JFK, BKK, DOH, KUL, FRA, etc.)
 * - Full IATA NDC offer structure, foreign card processing, and international passenger manifests
 * - Currency: Multi-currency clearing (USD, EUR, GBP, AED, SGD, INR)
 * - Zero fabricated urgency; genuine airline NDC availability
 *
 * Dual-Engine Router:
 * - Automatically routes:
 *   - Origin AND Destination in India + Domestic Card -> Travelpayouts Domestic Network
 *   - Origin OR Destination International (or Foreign Card flag) -> Duffel International GDS
 */

import { extractAirportCode, buildOfficialAirlineDeepLink } from "./airline-deep-links";
import { type FlightOption, type FlightSearchResponse } from "./types";
import { searchLiveFlights } from "./travel-connectors";
import { getTravelpayoutsMarker, TP_MARKER } from "./travelpayouts-config";

// ============================================================================
// 1. COMPREHENSIVE INDIAN IATA AIRPORT REGISTER
// ============================================================================

export const INDIAN_AIRPORT_IATAS: readonly string[] = [
  "DEL", // New Delhi (Indira Gandhi Int'l)
  "BOM", // Mumbai (Chhatrapati Shivaji Maharaj Int'l)
  "BLR", // Bengaluru (Kempegowda Int'l)
  "MAA", // Chennai (Meenambakkam Int'l)
  "HYD", // Hyderabad (Rajiv Gandhi Int'l)
  "CCU", // Kolkata (Netaji Subhash Chandra Bose Int'l)
  "AMD", // Ahmedabad (Sardar Vallabhbhai Patel Int'l)
  "PNQ", // Pune
  "GOI", // Goa (Dabolim)
  "GOX", // Goa (Manohar Int'l / Mopa)
  "JAI", // Jaipur Int'l
  "COK", // Kochi (Cochin Int'l)
  "LKO", // Lucknow (Chaudhary Charan Singh Int'l)
  "IXC", // Chandigarh
  "PAT", // Patna (Jay Prakash Narayan)
  "GAU", // Guwahati (Lokpriya Gopinath Bordoloi Int'l)
  "SXR", // Srinagar Int'l
  "VNS", // Varanasi (Lal Bahadur Shastri Int'l)
  "ATQ", // Amritsar (Sri Guru Ram Dass Jee Int'l)
  "BBI", // Bhubaneswar (Biju Patnaik Int'l)
  "IDR", // Indore (Devi Ahilya Bai Holkar Int'l)
  "NAG", // Nagpur (Dr. Babasaheb Ambedkar Int'l)
  "IXR", // Ranchi (Birsa Munda)
  "CJB", // Coimbatore Int'l
  "TRV", // Thiruvananthapuram Int'l
  "VTZ", // Visakhapatnam
  "IXB", // Bagdogra / Siliguri
  "IMF", // Imphal
  "DMU", // Dimapur
  "IXZ", // Port Blair (Veer Savarkar Int'l)
  "DED", // Dehradun (Jolly Grant)
  "BDQ", // Vadodara
  "UDR", // Udaipur (Maharana Pratap)
  "IXE", // Mangalore Int'l
  "TRZ", // Tiruchirappalli Int'l
  "IXM", // Madurai
  "RPR", // Raipur (Swami Vivekananda)
  "BHO", // Bhopal (Raja Bhoj)
  "IXJ", // Jammu
  "IXL", // Leh (Kushok Bakula Rimpochee)
  "GAY", // Gaya
  "TIR", // Tirupati
  "RJA", // Rajahmundry
  "JGA", // Jamnagar
  "KNU", // Kanpur
  "AGX", // Agatti Island (Lakshadweep)
  "MYQ", // Mysuru
  "DIU", // Diu
  "HBX", // Hubballi
  "IXA", // Agartala (Maharaja Bir Bikram)
  "IXS", // Silchar (Kumbhirgram)
  "TEZ", // Tezpur
  "JRH", // Jorhat
  "DIB", // Dibrugarh
  "RUP", // Rupsi
  "AJL", // Aizawl (Lengpui)
  "SHL", // Shillong (Umroi)
  "CNN", // Kannur Int'l
  "KQH", // Kishangarh / Ajmer
  "KLH", // Kolhapur
  "BUP", // Bhatinda
  "HSS", // Hisar
  "GWL", // Gwalior
  "JLR", // Jabalpur
  "BEK", // Bareilly
  "AYJ", // Ayodhya (Maharishi Valmiki Int'l)
] as const;

const INDIAN_IATA_SET = new Set<string>(INDIAN_AIRPORT_IATAS);

export function isIndianAirport(iata: string): boolean {
  if (!iata) return false;
  const clean = iata.trim().toUpperCase();
  return INDIAN_IATA_SET.has(clean);
}

export function isDomesticIndianRoute(origin: string, destination: string): boolean {
  const origCode = extractAirportCode(origin, "DEL");
  const destCode = extractAirportCode(destination, "BOM");
  return isIndianAirport(origCode) && isIndianAirport(destCode);
}

export function isInternationalRoute(origin: string, destination: string): boolean {
  return !isDomesticIndianRoute(origin, destination);
}

// ============================================================================
// 2. ENGINE CLASSIFICATION & RESOLUTION
// ============================================================================

export type TravelEngineType = "TRAVELPAYOUTS_DOMESTIC" | "DUFFEL_INTERNATIONAL";

export interface TravelEngineResolution {
  engine: TravelEngineType;
  engineName: string;
  engineBadge: string;
  isDomestic: boolean;
  settlementCurrency: "INR" | "USD" | "EUR" | "GBP" | "AED";
  supportedPaymentMethods: string[];
  clearingMode: "DIRECT_DOMESTIC_CARRIER" | "IATA_NDC_INTERNATIONAL";
  primaryGateway: string;
  originCode: string;
  destinationCode: string;
  notes: string;
}

export function resolveTravelEngine({
  origin,
  destination,
  isForeignCard = false,
  preferredEngine = "auto",
}: {
  origin: string;
  destination: string;
  isForeignCard?: boolean;
  preferredEngine?: "auto" | "travelpayouts" | "duffel";
}): TravelEngineResolution {
  const origCode = extractAirportCode(origin, "DEL");
  const destCode = extractAirportCode(destination, "BOM");
  const isDomestic = isIndianAirport(origCode) && isIndianAirport(destCode);

  // Determine active engine: explicit overrides take precedence; otherwise auto-route
  const selectDuffel =
    preferredEngine === "duffel"
      ? true
      : preferredEngine === "travelpayouts"
        ? false
        : isForeignCard || !isDomestic;

  if (selectDuffel) {
    return {
      engine: "DUFFEL_INTERNATIONAL",
      engineName: "Duffel International GDS",
      engineBadge: "Global NDC Network",
      isDomestic: false,
      settlementCurrency: isDomestic && !isForeignCard ? "INR" : "USD",
      supportedPaymentMethods: [
        "International Credit Cards (Visa / Mastercard)",
        "American Express",
        "Multi-Currency Foreign Cards",
        "Direct IATA NDC Settlement",
      ],
      clearingMode: "IATA_NDC_INTERNATIONAL",
      primaryGateway: "Duffel Airways API v2",
      originCode: origCode,
      destinationCode: destCode,
      notes: "Full IATA NDC multi-carrier pipeline for international sectors and cross-border currency settlement.",
    };
  }

  return {
    engine: "TRAVELPAYOUTS_DOMESTIC",
    engineName: "Travelpayouts Domestic Network",
    engineBadge: "India Domestic Rail & Air",
    isDomestic: true,
    settlementCurrency: "INR",
    supportedPaymentMethods: [
      "UPI Instant (Google Pay, PhonePe, Paytm, BHIM)",
      "RuPay Debit & Credit Cards",
      "NetBanking (All Indian Scheduled Banks)",
      "Domestic Indian Credit Cards",
    ],
    clearingMode: "DIRECT_DOMESTIC_CARRIER",
    primaryGateway: "Travelpayouts Aviasales + IRCTC CRIS Direct",
    originCode: origCode,
    destinationCode: destCode,
    notes: "Direct domestic carrier booking (IndiGo, Air India, IRCTC, RedBus) with 0 paise intermediary fee.",
  };
}

// ============================================================================
// 3. ENGINE 1: TRAVELPAYOUTS DOMESTIC & GLOBAL DEEP-LINKS & SEARCH GENERATOR
// ============================================================================

export function getActiveTravelpayoutsMarker(customMarker?: string): string {
  if (customMarker && customMarker.trim()) return customMarker.trim();
  return getTravelpayoutsMarker();
}

export interface TravelpayoutsDomesticLinkParams {
  origin: string;
  destination: string;
  departureDate: string; // YYYY-MM-DD
  passengers?: number;
  marker?: string;
  currency?: string;
  subId?: string;
}

export function generateTravelpayoutsDomesticLink({
  origin,
  destination,
  departureDate,
  passengers = 1,
  marker,
  currency = "INR",
  subId,
}: TravelpayoutsDomesticLinkParams): {
  url: string;
  originCode: string;
  destinationCode: string;
  marker: string;
  currency: string;
  engine: "TRAVELPAYOUTS_DOMESTIC";
} {
  const origCode = extractAirportCode(origin, "DEL");
  const destCode = extractAirportCode(destination, "BOM");
  const activeMarker = getActiveTravelpayoutsMarker(marker);

  // Format date for Aviasales (DDMM)
  const [year, month, day] = departureDate.split("-");
  const shortDate = day && month ? `${day}${month}` : "0112";

  const subParam = subId ? `&sub_id=${encodeURIComponent(subId)}` : "";
  const directAviasalesUrl = `https://www.aviasales.com/search/${origCode}${shortDate}${destCode}${passengers}?marker=${activeMarker}&currency=${currency.toLowerCase()}${subParam}`;

  return {
    url: directAviasalesUrl,
    originCode: origCode,
    destinationCode: destCode,
    marker: activeMarker,
    currency: currency.toUpperCase(),
    engine: "TRAVELPAYOUTS_DOMESTIC",
  };
}

export interface TravelpayoutsFlightLinkParams {
  origin: string;
  destination: string;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD
  passengers?: number;
  marker?: string;
  currency?: string;
  subId?: string;
}

/**
 * Universal Flight deep-link generator via Travelpayouts / Aviasales
 * Supporting both Indian Domestic and International Air Corridors with active affiliate tracking.
 */
export function generateTravelpayoutsFlightLink({
  origin,
  destination,
  departureDate,
  returnDate,
  passengers = 1,
  marker,
  currency = "INR",
  subId,
}: TravelpayoutsFlightLinkParams): {
  url: string;
  originCode: string;
  destinationCode: string;
  marker: string;
  currency: string;
  isDomestic: boolean;
  engine: "TRAVELPAYOUTS_DOMESTIC" | "TRAVELPAYOUTS_INTERNATIONAL";
} {
  const origCode = extractAirportCode(origin, "DEL");
  const destCode = extractAirportCode(destination, "BOM");
  const activeMarker = getActiveTravelpayoutsMarker(marker);
  const isDomestic = isIndianAirport(origCode) && isIndianAirport(destCode);

  const [year, month, day] = departureDate.split("-");
  const shortDate = day && month ? `${day}${month}` : "0112";

  let dateSegment = `${shortDate}${destCode}`;
  if (returnDate) {
    const [retY, retM, retD] = returnDate.split("-");
    const shortRetDate = retD && retM ? `${retD}${retM}` : "";
    if (shortRetDate) {
      dateSegment = `${shortDate}${destCode}${shortRetDate}`;
    }
  }

  const subParam = subId ? `&sub_id=${encodeURIComponent(subId)}` : "";
  const directAviasalesUrl = `https://www.aviasales.com/search/${origCode}${dateSegment}${passengers}?marker=${activeMarker}&currency=${currency.toLowerCase()}${subParam}`;

  return {
    url: directAviasalesUrl,
    originCode: origCode,
    destinationCode: destCode,
    marker: activeMarker,
    currency: currency.toUpperCase(),
    isDomestic,
    engine: isDomestic ? "TRAVELPAYOUTS_DOMESTIC" : "TRAVELPAYOUTS_INTERNATIONAL",
  };
}

export interface TravelpayoutsHotelLinkParams {
  cityOrLocation: string;
  checkInDate: string;
  checkOutDate?: string;
  nights?: number;
  guests?: number;
  rooms?: number;
  marker?: string;
  partner?: "booking_com" | "agoda" | "hotellook";
  subId?: string;
}

/**
 * Universal Hotel tracked deep-link generator for Booking.com, Agoda, and Hotellook.
 */
export function generateTravelpayoutsHotelLink({
  cityOrLocation,
  checkInDate,
  checkOutDate,
  nights = 2,
  guests = 2,
  rooms = 1,
  marker,
  partner = "agoda",
  subId = "ok_travel",
}: TravelpayoutsHotelLinkParams): {
  url: string;
  cleanCity: string;
  checkIn: string;
  checkOut: string;
  partner: "booking_com" | "agoda" | "hotellook";
  partnerName: string;
  marker: string;
} {
  const cleanCity = cityOrLocation.replace(/\,.*$/, "").trim() || "Goa";
  const checkIn = checkInDate || new Date().toISOString().split("T")[0];
  let checkOut = checkOutDate;
  if (!checkOut) {
    const dNext = new Date(checkIn);
    dNext.setDate(dNext.getDate() + (nights || 1));
    checkOut = dNext.toISOString().split("T")[0];
  }

  const activeMarker = getActiveTravelpayoutsMarker(marker);

  if (partner === "booking_com") {
    const aid = (typeof process !== "undefined" ? process.env?.BOOKING_COM_AID : undefined) || "orderking_hotels";
    const bookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(cleanCity)}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${guests}&no_rooms=${rooms}&selected_currency=INR&aid=${aid}&label=${encodeURIComponent(subId)}`;
    return {
      url: bookingUrl,
      cleanCity,
      checkIn,
      checkOut,
      partner: "booking_com",
      partnerName: "Booking.com",
      marker: activeMarker,
    };
  }

  if (partner === "hotellook") {
    const hotellookUrl = `https://search.hotellook.com/?destination=${encodeURIComponent(cleanCity)}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${guests}&rooms=${rooms}&marker=${activeMarker}${subId ? `&sub_id=${encodeURIComponent(subId)}` : ""}`;
    return {
      url: hotellookUrl,
      cleanCity,
      checkIn,
      checkOut,
      partner: "hotellook",
      partnerName: "Hotellook (Travelpayouts)",
      marker: activeMarker,
    };
  }

  // Default: Agoda partner with CID and tracking tag
  const cid = (typeof process !== "undefined" ? process.env?.AGODA_CID : undefined) || "1894215";
  const agodaUrl = `https://www.agoda.com/partners/partnersearch.aspx?city=${encodeURIComponent(cleanCity)}&checkin=${checkIn}&checkout=${checkOut}&rooms=${rooms}&adults=${guests}&cid=${cid}&tag=${encodeURIComponent(subId)}`;
  return {
    url: agodaUrl,
    cleanCity,
    checkIn,
    checkOut,
    partner: "agoda",
    partnerName: "Agoda Accommodations",
    marker: activeMarker,
  };
}

export function generateIrctcTrainAssistanceLink(
  fromStation: string,
  toStation: string,
  travelDate?: string
): {
  officialUrl: string;
  fromCode: string;
  toCode: string;
  travelDate: string;
  engine: "TRAVELPAYOUTS_DOMESTIC";
} {
  const cleanFrom = fromStation.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 5) || "NDLS";
  const cleanTo = toStation.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 5) || "MMCT";
  const dateIso = travelDate || new Date().toISOString().split("T")[0];

  return {
    officialUrl: `https://www.irctc.co.in/nget/train-search?from=${cleanFrom}&to=${cleanTo}&date=${dateIso}`,
    fromCode: cleanFrom,
    toCode: cleanTo,
    travelDate: dateIso,
    engine: "TRAVELPAYOUTS_DOMESTIC",
  };
}

export function generateRedBusDomesticLink(
  sourceCity: string,
  destinationCity: string,
  journeyDate?: string,
  affiliateId?: string,
  subId?: string
): {
  url: string;
  sourceCity: string;
  destinationCity: string;
  journeyDate: string;
  affiliateId: string;
  engine: "TRAVELPAYOUTS_DOMESTIC";
} {
  const cleanSrc = sourceCity.replace(/\(.*\)/, "").trim().toLowerCase();
  const cleanDest = destinationCity.replace(/\(.*\)/, "").trim().toLowerCase();
  const dateIso = journeyDate || new Date().toISOString().split("T")[0];
  const activeAffId = affiliateId || (typeof process !== "undefined" ? process.env?.REDBUS_AFFILIATE_ID : undefined) || "orderking_bus";
  const activeSubId = subId || "ok_bus";

  const url = new URL(`https://www.redbus.in/bus-tickets/${encodeURIComponent(cleanSrc)}-to-${encodeURIComponent(cleanDest)}`);
  url.searchParams.set("onward", dateIso);
  url.searchParams.set("utm_source", "orderking");
  url.searchParams.set("utm_medium", "affiliate");
  url.searchParams.set("affId", activeAffId);
  url.searchParams.set("subId", activeSubId);

  return {
    url: url.toString(),
    sourceCity: cleanSrc,
    destinationCity: cleanDest,
    journeyDate: dateIso,
    affiliateId: activeAffId,
    engine: "TRAVELPAYOUTS_DOMESTIC",
  };
}

// ============================================================================
// 4. ENGINE 2: DUFFEL INTERNATIONAL DEEP-LINKS & GDS DISPATCHER
// ============================================================================

export interface DuffelInternationalOffer {
  id: string;
  offerRequestId?: string;
  carrierCode: string;
  carrierName: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  pricePaise: number;
  currency: string;
  aircraftType?: string;
  bookingUrl: string;
  cabinClass: string;
  source: "duffel_v2";
}

export function generateDuffelInternationalLink(offerId: string): string {
  const clean = offerId.trim();
  return clean ? `https://links.duffel.com/air/offers/${encodeURIComponent(clean)}` : "https://duffel.com";
}

// ============================================================================
// 5. MASTER DUAL-ENGINE SEARCH DISPATCHER
// ============================================================================

export interface DualEngineFlightRequest {
  origin: string;
  destination: string;
  departureDate: string;
  passengers?: number;
  cabinClass?: "Economy" | "Premium Economy" | "Business" | "First" | string;
  isForeignCard?: boolean;
  preferredEngine?: "auto" | "travelpayouts" | "duffel";
}

export interface DualEngineFlightResponse {
  success: boolean;
  engine: TravelEngineType;
  resolution: TravelEngineResolution;
  data: FlightOption[];
  count: number;
  source: string;
  directCarrierLinks: Array<{
    carrierCode: string;
    carrierName: string;
    portalName: string;
    bookingUrl: string;
  }>;
}

export async function searchDualEngineFlights(
  req: DualEngineFlightRequest
): Promise<DualEngineFlightResponse> {
  const resolution = resolveTravelEngine({
    origin: req.origin,
    destination: req.destination,
    isForeignCard: req.isForeignCard,
    preferredEngine: req.preferredEngine,
  });

  const passengers = Math.max(1, Math.min(9, Math.floor(req.passengers || 1)));
  const cabinClass = req.cabinClass === "Business" || req.cabinClass === "BUSINESS" ? "BUSINESS" : "ECONOMY";

  // Build authentic official carrier direct links for transparent zero-markup fallback
  const directCarriers = resolution.isDomestic
    ? [
        { code: "6E", name: "IndiGo Airlines" },
        { code: "AI", name: "Air India" },
        { code: "QP", name: "Akasa Air" },
        { code: "SG", name: "SpiceJet" },
      ]
    : [
        { code: "AI", name: "Air India (International)" },
        { code: "EK", name: "Emirates" },
        { code: "QR", name: "Qatar Airways" },
        { code: "SQ", name: "Singapore Airlines" },
      ];

  const directCarrierLinks = directCarriers.map((c) => {
    const deepLink = buildOfficialAirlineDeepLink({
      carrierCode: c.code,
      from: resolution.originCode,
      to: resolution.destinationCode,
      departureDate: req.departureDate,
      passengers,
      cabinClass: req.cabinClass || "Economy",
    });
    return {
      carrierCode: c.code,
      carrierName: c.name,
      portalName: deepLink.portalName,
      bookingUrl: deepLink.bookingUrl,
    };
  });

  // Query live backend connectors (which encapsulates Duffel v2 & Travelpayouts APIs)
  const connectorRes: FlightSearchResponse = await searchLiveFlights({
    origin: resolution.originCode,
    destination: resolution.destinationCode,
    departureDate: req.departureDate,
    passengers,
    cabinClass,
  });

  return {
    success: connectorRes.success,
    engine: resolution.engine,
    resolution,
    data: connectorRes.data || [],
    count: connectorRes.count || 0,
    source: connectorRes.source || (resolution.engine === "DUFFEL_INTERNATIONAL" ? "duffel_v2" : "travelpayouts"),
    directCarrierLinks,
  };
}
