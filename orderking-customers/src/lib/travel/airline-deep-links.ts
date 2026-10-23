/**
 * Official Indian Airline Deep-Link Generator & Carrier Route Resolver
 *
 * Replaces synthetic in-app booking engines with direct, compliant deep-links
 * to official carrier portals (IndiGo, Air India, Akasa Air, SpiceJet)
 * with pre-populated origin, destination, departure date, passenger count, and cabin class.
 */

export interface AirlineDeepLinkParams {
  carrierCode: string;
  from: string;
  to: string;
  departureDate: string; // YYYY-MM-DD
  passengers?: number;
  cabinClass?: "Economy" | "Premium Economy" | "Business" | string;
}

export interface AirlineDeepLinkResult {
  carrierCode: string;
  carrierName: string;
  portalName: string;
  portalBaseUrl: string;
  bookingUrl: string;
  fromCode: string;
  toCode: string;
  departureDate: string;
  passengers: number;
  cabinClass: string;
  disclaimer: string;
}

const COMMON_CITY_IATA_MAP: Record<string, string> = {
  DELHI: "DEL",
  "NEW DELHI": "DEL",
  MUMBAI: "BOM",
  BOMBAY: "BOM",
  BENGALURU: "BLR",
  BANGALORE: "BLR",
  CHENNAI: "MAA",
  MADRAS: "MAA",
  KOLKATA: "CCU",
  CALCUTTA: "CCU",
  HYDERABAD: "HYD",
  AHMEDABAD: "AMD",
  PUNE: "PNQ",
  GOA: "GOI",
  MOPA: "GOX",
  JAIPUR: "JAI",
  KOCHI: "COK",
  COCHIN: "COK",
  LUCKNOW: "LKO",
  CHANDIGARH: "IXC",
  PATNA: "PAT",
  GUWAHATI: "GAU",
  SRINAGAR: "SXR",
  VARANASI: "VNS",
  AMRITSAR: "ATQ",
  BHUBANESWAR: "BBI",
  INDORE: "IDR",
  NAGPUR: "NAG",
  RANCHI: "IXR",
  COIMBATORE: "CJB",
  TRIVANDRUM: "TRV",
  THIRUVANANTHAPURAM: "TRV",
  VISAKHAPATNAM: "VTZ",
  VIZAG: "VTZ",
};

export const INDIAN_AIRPORT_IATA_CODES = new Set(Object.values(COMMON_CITY_IATA_MAP));

/**
 * Checks if a route is purely domestic between two Indian airports
 */
export function isDomesticIndianRoute(originCode: string, destCode: string): boolean {
  const o = (originCode || "").trim().toUpperCase();
  const d = (destCode || "").trim().toUpperCase();
  return INDIAN_AIRPORT_IATA_CODES.has(o) && INDIAN_AIRPORT_IATA_CODES.has(d);
}

/**
 * Extracts standard 3-letter IATA airport code from user input
 * e.g. "New Delhi (DEL)" -> "DEL", "BOM" -> "BOM", "Bengaluru" -> "BLR"
 */
export function extractAirportCode(input: string, fallback = "DEL"): string {
  if (!input) return fallback;
  const trimmed = input.trim();

  // Pattern 1: City with code in parentheses: "New Delhi (DEL)"
  const parenMatch = trimmed.match(/\(([A-Za-z]{3})\)/);
  if (parenMatch) return parenMatch[1].toUpperCase();

  // Pattern 2: Direct 3-letter code: "DEL"
  if (/^[A-Za-z]{3}$/.test(trimmed)) return trimmed.toUpperCase();

  // Pattern 3: Common Indian city name lookup
  const cleanUpper = trimmed.toUpperCase();
  for (const [cityName, code] of Object.entries(COMMON_CITY_IATA_MAP)) {
    if (cleanUpper.includes(cityName)) {
      return code;
    }
  }

  // Fallback to sanitizing leading uppercase letters or fallback code
  const lettersOnly = trimmed.replace(/[^A-Za-z]/g, "").toUpperCase();
  return lettersOnly.length >= 3 ? lettersOnly.slice(0, 3) : fallback;
}

/**
 * Formats YYYY-MM-DD date into DD/MM/YYYY or DD-MM-YYYY if required by specific airline portals
 */
function formatDateForPortal(dateStr: string, separator: "/" | "-" = "/"): string {
  if (!dateStr || !dateStr.includes("-")) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}${separator}${month}${separator}${year}`;
  }
  return dateStr;
}

/**
 * Generates direct booking and comparison deep-link URLs to official airline portals
 */
export function buildOfficialAirlineDeepLink({
  carrierCode,
  from,
  to,
  departureDate,
  passengers = 1,
  cabinClass = "Economy",
}: AirlineDeepLinkParams): AirlineDeepLinkResult {
  const normCarrier = (carrierCode || "").trim().toUpperCase();
  const fromCode = extractAirportCode(from, "DEL");
  const toCode = extractAirportCode(to, "BOM");
  const paxCount = Math.max(1, Math.min(9, Math.floor(passengers || 1)));
  const dateIso = departureDate || new Date().toISOString().split("T")[0];

  switch (normCarrier) {
    case "6E": // IndiGo
      return {
        carrierCode: "6E",
        carrierName: "IndiGo Airlines",
        portalName: "goindigo.in",
        portalBaseUrl: "https://www.goindigo.in",
        bookingUrl: `https://www.goindigo.in/booking/flight-select.html?orCity=${fromCode}&destCity=${toCode}&deptDate=${dateIso}&adt=${paxCount}&chd=0&inf=0`,
        fromCode,
        toCode,
        departureDate: dateIso,
        passengers: paxCount,
        cabinClass,
        disclaimer: "Opens official IndiGo booking engine with direct airline inventory and zero intermediary fee markup.",
      };

    case "AI": // Air India
      return {
        carrierCode: "AI",
        carrierName: "Air India",
        portalName: "airindia.com",
        portalBaseUrl: "https://www.airindia.com",
        bookingUrl: `https://www.airindia.com/in/en/book/flight-search.html?from=${fromCode}&to=${toCode}&date=${dateIso}&adults=${paxCount}&cabin=${encodeURIComponent(
          cabinClass.toLowerCase().replace(/\s+/g, "_")
        )}`,
        fromCode,
        toCode,
        departureDate: dateIso,
        passengers: paxCount,
        cabinClass,
        disclaimer: "Opens official Air India portal with Maharaja live fares and direct baggage inclusion.",
      };

    case "QP": // Akasa Air
      return {
        carrierCode: "QP",
        carrierName: "Akasa Air",
        portalName: "akasaair.com",
        portalBaseUrl: "https://www.akasaair.com",
        bookingUrl: `https://www.akasaair.com/booking?origin=${fromCode}&destination=${toCode}&departureDate=${dateIso}&adults=${paxCount}`,
        fromCode,
        toCode,
        departureDate: dateIso,
        passengers: paxCount,
        cabinClass,
        disclaimer: "Opens official Akasa Air booking portal with genuine carrier availability and seat selection.",
      };

    case "SG": // SpiceJet
      return {
        carrierCode: "SG",
        carrierName: "SpiceJet",
        portalName: "spicejet.com",
        portalBaseUrl: "https://www.spicejet.com",
        bookingUrl: `https://www.spicejet.com/?origin=${fromCode}&destination=${toCode}&departureDate=${dateIso}&adults=${paxCount}`,
        fromCode,
        toCode,
        departureDate: dateIso,
        passengers: paxCount,
        cabinClass,
        disclaimer: "Opens official SpiceJet portal with direct airline fare options and zero convenience markup.",
      };

    default:
      return {
        carrierCode: normCarrier || "CARRIER",
        carrierName: normCarrier ? `${normCarrier} Airline` : "Official Airline",
        portalName: "Official Airline Portal",
        portalBaseUrl: "https://www.google.com/travel/flights",
        bookingUrl: `https://www.google.com/travel/flights?q=flights+from+${fromCode}+to+${toCode}+on+${dateIso}`,
        fromCode,
        toCode,
        departureDate: dateIso,
        passengers: paxCount,
        cabinClass,
        disclaimer: "Compares live official carrier itineraries and fares without third-party commission surcharges.",
      };
  }
}
