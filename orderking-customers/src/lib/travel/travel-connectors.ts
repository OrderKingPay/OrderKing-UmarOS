/**
 * 👑 OrderKing B2B Travel Partner Connectors
 * Real-world aggregation engines for Flights (Kiwi Tequila / Travelpayouts),
 * Trains (IRCTC / ConfirmTkt / CRIS), Buses (RedBus B2B), and Hotels (Agoda / Booking.com).
 * Live supplier inventory only; unavailable suppliers return empty results.
 */

import {
  type FlightOption,
  type FlightSearchRequest,
  type FlightSearchResponse,
  type TrainOption,
  type TrainSearchRequest,
  type TrainSearchResponse,
  type BusOption,
  type BusSearchRequest,
  type BusSearchResponse,
  type HotelOption,
  type HotelSearchRequest,
  type HotelSearchResponse,
  type TrainClassAvailability,
  type TrainSeatStatus,
} from "./types";
import { buildOfficialAirlineDeepLink, extractAirportCode } from "./airline-deep-links";

// ============================================================================
// CARRIER & STATION LOOKUP MAPS
// ============================================================================

const AIRLINE_NAMES: Record<string, string> = {
  "6E": "IndiGo Airlines",
  "AI": "Air India",
  "QP": "Akasa Air",
  "SG": "SpiceJet",
  "UK": "Vistara",
  "IX": "Air India Express",
  "I5": "AIX Connect",
  "EK": "Emirates",
  "QR": "Qatar Airways",
  "EY": "Etihad Airways",
  "SQ": "Singapore Airlines",
  "BA": "British Airways",
  "LH": "Lufthansa",
};

const STATION_NAMES: Record<string, string> = {
  NDLS: "New Delhi",
  DLI: "Delhi Junction",
  NZM: "Hazrat Nizamuddin",
  ANVT: "Anand Vihar Terminal",
  BOM: "Mumbai Central",
  MMCT: "Mumbai Central",
  CSMT: "Chhatrapati Shivaji Maharaj Terminus",
  BDTS: "Bandra Terminus",
  HWH: "Howrah Junction",
  SDAH: "Sealdah",
  MAS: "Chennai Central",
  SBC: "KSR Bengaluru",
  YPR: "Yesvantpur Junction",
  HYB: "Hyderabad Deccan",
  SC: "Secunderabad Junction",
  PUNE: "Pune Junction",
  ADI: "Ahmedabad Junction",
  CNB: "Kanpur Central",
  BSB: "Varanasi Junction",
  LKO: "Lucknow Charbagh",
  PNBE: "Patna Junction",
  GHY: "Guwahati",
  JAT: "Jammu Tawi",
  SVDK: "Shri Mata Vaishno Devi Katra",
  ASR: "Amritsar Junction",
  CDG: "Chandigarh",
  BPL: "Bhopal Junction",
  RKMP: "Rani Kamlapati",
  R: "Raipur Junction",
  NGP: "Nagpur Junction",
};

// ============================================================================
// DATE FORMATTING HELPERS
// ============================================================================

function toKiwiDateFormat(isoDate: string): string {
  // Converts "2026-10-19" to "19/10/2026"
  const parts = isoDate.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

// ============================================================================
// 1. LIVE FLIGHT SEARCH (Duffel v2 / Kiwi Tequila / Travelpayouts / GDS)
// ============================================================================

function parseIsoDurationMinutes(isoDuration?: string): number {
  if (!isoDuration) return 120;
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 120;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  return hours * 60 + minutes;
}

export async function searchLiveFlights(req: FlightSearchRequest): Promise<FlightSearchResponse> {
  const origin = extractAirportCode(req.origin, "DEL");
  const destination = extractAirportCode(req.destination, "BOM");
  const departureDate = req.departureDate || new Date().toISOString().split("T")[0];
  const passengers = Math.max(1, Math.min(9, Math.floor(req.passengers || 1)));
  const cabinClass = req.cabinClass === "BUSINESS" ? "BUSINESS" : "ECONOMY";

  const duffelToken =
    process.env.DUFFEL_ACCESS_TOKEN ||
    process.env.DUFFEL_API_KEY;

  const kiwiApiKey =
    process.env.KIWI_API_KEY ||
    process.env.TEQUILA_API_KEY;

  const travelpayoutsToken =
    process.env.TRAVELPAYOUTS_TOKEN ||
    process.env.AVIASALES_API_TOKEN;

  // 1. Try Duffel v2 Flights API if token is configured
  if (duffelToken?.startsWith("duffel_live_")) {
    try {
      const duffelRes = await fetch("https://api.duffel.com/air/offer_requests?return_offers=true", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${duffelToken}`,
          "Duffel-Version": "v2",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          data: {
            slices: [
              {
                origin,
                destination,
                departure_date: departureDate,
              },
            ],
            passengers: Array.from({ length: passengers }, () => ({ type: "adult" })),
            cabin_class: cabinClass === "BUSINESS" ? "business" : "economy",
          },
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (duffelRes.ok) {
        const json = await duffelRes.json();
        const offers = json?.data?.offers;
        if (Array.isArray(offers) && offers.length > 0) {
          const flights: FlightOption[] = offers.filter((offer: any) => {
            const slice = offer?.slices?.[0];
            const first = slice?.segments?.[0];
            const last = slice?.segments?.at(-1);
            return Boolean(
              offer?.id && (offer?.owner?.iata_code || first?.operating_carrier?.iata_code) &&
              first?.operating_carrier_flight_number && first?.departing_at &&
              last?.arriving_at && slice?.duration && Number(offer?.total_amount) > 0 &&
              offer?.total_currency?.toUpperCase() === "INR"
            );
          }).map((offer: any, idx: number) => {
            const firstSlice = offer.slices?.[0];
            const firstSegment = firstSlice?.segments?.[0];
            const lastSegment = firstSlice?.segments?.[firstSlice.segments.length - 1] || firstSegment;
            const primaryCarrier = offer.owner?.iata_code || firstSegment?.operating_carrier?.iata_code || "6E";
            const carrierName = offer.owner?.name || AIRLINE_NAMES[primaryCarrier] || "Scheduled Carrier";
            const flightNumber = firstSegment?.operating_carrier_flight_number
              ? `${primaryCarrier} ${String(firstSegment.operating_carrier_flight_number).replace(primaryCarrier, "").trim()}`
              : `${primaryCarrier}-${idx + 101}`;
            const depIso = firstSegment?.departing_at || `${departureDate}T06:00:00`;
            const arrIso = lastSegment?.arriving_at || `${departureDate}T08:15:00`;
            const durationMins = parseIsoDurationMinutes(firstSlice?.duration);
            const rawAmount = parseFloat(offer.total_amount);
            const pricePaise = Math.round(rawAmount * 100);
            const stops = Math.max(0, (firstSlice?.segments?.length || 1) - 1);

            return {
              id: offer.id || `fl-duffel-${primaryCarrier}-${idx}`,
              carrierName,
              carrierCode: primaryCarrier,
              flightNumber,
              departureTime: depIso,
              arrivalTime: arrIso,
              durationMinutes: durationMins,
              pricePaise,
              directStops: stops,
              cabinClass,
              seatsAvailable: undefined,
              bookingUrl: offer.id
                ? `https://links.duffel.com/air/offers/${offer.id}`
                : buildOfficialAirlineDeepLink({
                    carrierCode: primaryCarrier,
                    from: origin,
                    to: destination,
                    departureDate,
                    passengers,
                    cabinClass,
                  }).bookingUrl,
              baggageAllowance: undefined,
              aircraftType: firstSegment?.aircraft?.name,
            };
          });

          if (!flights.length) throw new Error("No complete INR Duffel offers were returned.");
          flights.sort((a, b) => a.pricePaise - b.pricePaise);
          return {
            success: true,
            data: flights,
            source: "duffel_v2",
            count: flights.length,
            origin,
            destination,
            departureDate,
          };
        }
      }
    } catch (err) {
      console.warn("[TravelConnectors] Duffel API query failed, falling through to secondary connector:", err);
    }
  }

  // 2. Try Kiwi.com Tequila API if key is available
  if (kiwiApiKey) {
    try {
      const kiwiDate = toKiwiDateFormat(departureDate);
      const kiwiCabin = cabinClass === "BUSINESS" ? "C" : "M";
      const kiwiUrl = new URL("https://api.tequila.kiwi.com/v2/search");
      kiwiUrl.searchParams.set("fly_from", origin);
      kiwiUrl.searchParams.set("fly_to", destination);
      kiwiUrl.searchParams.set("date_from", kiwiDate);
      kiwiUrl.searchParams.set("date_to", kiwiDate);
      kiwiUrl.searchParams.set("adults", String(passengers));
      kiwiUrl.searchParams.set("selected_cabins", kiwiCabin);
      kiwiUrl.searchParams.set("curr", "INR");
      kiwiUrl.searchParams.set("max_stopovers", "2");
      kiwiUrl.searchParams.set("sort", "price");
      kiwiUrl.searchParams.set("limit", "25");

      const res = await fetch(kiwiUrl.toString(), {
        headers: {
          apikey: kiwiApiKey,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data) && json.data.length > 0) {
          const flights: FlightOption[] = json.data.filter((item: any) =>
            item?.id && item?.airlines?.[0] && item?.route?.[0]?.flight_no &&
            item?.local_departure && item?.local_arrival &&
            Number(item?.duration?.total) > 0 && Number(item?.price) > 0 &&
            typeof item?.deep_link === "string" && item.deep_link.startsWith("https://")
          ).map((item: any, idx: number) => {
            const primaryAirline = item.airlines?.[0] || "6E";
            const carrierName = AIRLINE_NAMES[primaryAirline] || item.cityFrom || "Carrier Partner";
            const firstRoute = item.route?.[0];
            const flightNumber = firstRoute ? `${firstRoute.airline || primaryAirline} ${firstRoute.flight_no}` : `${primaryAirline}-${idx + 101}`;
            const depIso = item.local_departure || `${departureDate}T06:00:00`;
            const arrIso = item.local_arrival || `${departureDate}T08:15:00`;
            const durationMins = item.duration?.total ? Math.round(item.duration.total / 60) : 135;
            const pricePaise = Math.round(Number(item.price) * 100);
            const stops = Math.max(0, (item.route?.length || 1) - 1);

            return {
              id: item.id || `fl-kiwi-${primaryAirline}-${idx}`,
              carrierName,
              carrierCode: primaryAirline,
              flightNumber,
              departureTime: depIso,
              arrivalTime: arrIso,
              durationMinutes: durationMins,
              pricePaise,
              directStops: stops,
              cabinClass,
              seatsAvailable: item.availability?.seats,
              bookingUrl: item.deep_link || buildOfficialAirlineDeepLink({
                carrierCode: primaryAirline,
                from: origin,
                to: destination,
                departureDate,
                passengers,
                cabinClass,
              }).bookingUrl,
              baggageAllowance: undefined,
              aircraftType: undefined,
            };
          });

          if (!flights.length) throw new Error("No complete Kiwi offers were returned.");
          flights.sort((a, b) => a.pricePaise - b.pricePaise);
          return {
            success: true,
            data: flights,
            source: "kiwi_tequila",
            count: flights.length,
            origin,
            destination,
            departureDate,
          };
        }
      }
    } catch (err) {
      console.warn("[TravelConnectors] Kiwi API query failed, falling through to secondary connector:", err);
    }
  }

  // 2. Try Travelpayouts Aviasales API if token is available
  if (travelpayoutsToken && process.env.TRAVELPAYOUTS_MARKER) {
    try {
      const tpUrl = new URL("https://api.travelpayouts.com/aviasales/v3/prices_for_dates");
      tpUrl.searchParams.set("origin", origin);
      tpUrl.searchParams.set("destination", destination);
      tpUrl.searchParams.set("departure_at", departureDate);
      tpUrl.searchParams.set("currency", "inr");
      tpUrl.searchParams.set("sorting", "price");

      const res = await fetch(tpUrl.toString(), {
        headers: {
          "x-access-token": travelpayoutsToken,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data) && json.data.length > 0) {
          const flights: FlightOption[] = json.data.filter((item: any) =>
            item?.airline && item?.flight_number && item?.departure_at &&
            Number(item?.duration) > 0 && Number(item?.price) > 0 &&
            typeof item?.link === "string" && item.link.length > 0
          ).map((item: any, idx: number) => {
            const airline = item.airline || "6E";
            const carrierName = AIRLINE_NAMES[airline] || "Direct Airline";
            const pricePaise = Math.round(Number(item.price) * 100);
            return {
              id: `fl-tp-${airline}-${idx}`,
              carrierName,
              carrierCode: airline,
              flightNumber: `${airline} ${item.flight_number || idx + 201}`,
              departureTime: item.departure_at || `${departureDate}T07:30:00`,
              arrivalTime: new Date(new Date(item.departure_at).getTime() + Number(item.duration) * 60000).toISOString(),
              durationMinutes: item.duration || 135,
              pricePaise,
              directStops: item.transfers || 0,
              cabinClass,
              seatsAvailable: undefined,
              bookingUrl: `https://tp.media/r?marker=${encodeURIComponent(process.env.TRAVELPAYOUTS_MARKER!)}&p=4114&u=${encodeURIComponent(item.link)}`,
              baggageAllowance: undefined,
              aircraftType: undefined,
            };
          });

          if (!flights.length) throw new Error("No complete Travelpayouts offers were returned.");
          flights.sort((a, b) => a.pricePaise - b.pricePaise);
          return {
            success: true,
            data: flights,
            source: "travelpayouts",
            count: flights.length,
            origin,
            destination,
            departureDate,
          };
        }
      }
    } catch (err) {
      console.warn("[TravelConnectors] Travelpayouts API query failed, falling through to authentic GDS schedule:", err);
    }
  }

  // Never invent airline flight numbers, seats, dates or fares when live providers fail.
  return {
    success: false,
    data: [],
    source: "carrier_direct_gds",
    count: 0,
    origin,
    destination,
    departureDate,
  };
}

// ============================================================================
// ============================================================================
// 2. LIVE TRAIN SEARCH (IRCTC / ConfirmTkt / CRIS)
// ============================================================================

export async function searchLiveTrains(req: TrainSearchRequest): Promise<TrainSearchResponse> {
  const fromStation = (req.fromStation || "NDLS").trim().toUpperCase();
  const toStation = (req.toStation || "CNB").trim().toUpperCase();
  const travelDate = req.travelDate || new Date().toISOString().split("T")[0];
  const quota = req.quota || "GN";

  // Rail schedule aggregators are not a substitute for authenticated IRCTC
  // availability and ticketing. Until an approved provider API is contracted,
  // return no bookable seats, no synthetic fare, no artificial booking status.
  // 2. Strict Rail Compliance: Zero fabricated train inventory.
  // In accordance with CRIS/IRCTC regulations, synthetic train options, simulated fares, or mock seat
  // allocations are strictly prohibited. In unauthenticated state, fail closed with empty data
  // directing users to the official IRCTC portal.
  return {
    success: false,
    data: [],
    source: "irctc_direct",
    count: 0,
    fromStation,
    toStation,
    travelDate,
    quota,
  };
}

// ============================================================================
// 3. LIVE BUS SEARCH (RedBus B2B / Intercity Operators)
// ============================================================================

export async function searchLiveBuses(req: BusSearchRequest): Promise<BusSearchResponse> {
  const sourceCity = (req.sourceCity || "Bengaluru").trim();
  const destinationCity = (req.destinationCity || "Goa").trim();
  const journeyDate = req.journeyDate || new Date().toISOString().split("T")[0];

  const redbusApiKey = process.env.REDBUS_API_KEY || process.env.REDBUS_AUTH_KEY;

  if (redbusApiKey) {
    try {
      const redbusUrl = new URL("https://api.redbus.in/v2/availabletrips");
      redbusUrl.searchParams.set("source", sourceCity);
      redbusUrl.searchParams.set("destination", destinationCity);
      redbusUrl.searchParams.set("doj", journeyDate);

      const res = await fetch(redbusUrl.toString(), {
        headers: {
          "Auth-Key": redbusApiKey,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.availableTrips) && json.availableTrips.length > 0) {
          const buses: BusOption[] = json.availableTrips.filter((trip: any) =>
            trip?.id && trip?.travels && trip?.busType && trip?.departureTime &&
            trip?.arrivalTime && Number(trip?.duration) > 0 &&
            Number(trip?.availableSeats) >= 0 && Number(trip?.totalSeats) > 0 &&
            Number(trip?.fares?.[0]) > 0
          ).map((trip: any, idx: number) => ({
            id: trip.id || `rb-${idx}`,
            operatorName: trip.travels,
            busType: trip.busType,
            departureTime: trip.departureTime,
            arrivalTime: trip.arrivalTime,
            durationMinutes: Number(trip.duration),
            sourceCity,
            destinationCity,
            boardingPoints: Array.isArray(trip.boardingTimes) ? trip.boardingTimes.map((b: any) => b.location).filter(Boolean) : [],
            droppingPoints: Array.isArray(trip.dropTimes) ? trip.dropTimes.map((d: any) => d.location).filter(Boolean) : [],
            rating: Number(trip.rating) || 0,
            ratingsCount: Number(trip.ratingsCount) || 0,
            totalSeats: Number(trip.totalSeats),
            availableSeats: Number(trip.availableSeats),
            farePaise: Math.round(Number(trip.fares[0]) * 100),
            startingFarePaise: Math.round(Number(trip.fares[0]) * 100),
            amenities: Array.isArray(trip.amenities) ? trip.amenities : [],
            bookingUrl: `https://www.redbus.in/bus-tickets/${encodeURIComponent(sourceCity)}-to-${encodeURIComponent(destinationCity)}`,
          }));

          if (!buses.length) throw new Error("No complete RedBus offers were returned.");
          buses.sort((a, b) => a.farePaise - b.farePaise);
          return {
            success: true,
            data: buses,
            source: "redbus_b2b",
            count: buses.length,
            sourceCity,
            destinationCity,
            journeyDate,
          };
        }
      }
    } catch (err) {
      console.warn("[TravelConnectors] RedBus API query failed, falling through to operator catalog feed:", err);
    }
  }

  // Do not fabricate operator timetables, seat counts, ratings or fare quotes
  // for routes that the ticket provider did not return.
  return {
    success: false,
    data: [],
    source: "partner_catalog",
    count: 0,
    sourceCity,
    destinationCity,
    journeyDate,
  };
}

// ============================================================================
// ============================================================================
// 4. LIVE HOTEL SEARCH (Agoda / Booking.com Wholesale Partner)
// ============================================================================

export async function searchLiveHotels(req: HotelSearchRequest): Promise<HotelSearchResponse> {
  const city = (req.cityOrLocation || "Goa").trim();
  const checkInDate = req.checkInDate || new Date().toISOString().split("T")[0];
  const dNext = new Date();
  dNext.setDate(dNext.getDate() + 1);
  const checkOutDate = req.checkOutDate || dNext.toISOString().split("T")[0];
  // No contracted hotel-inventory API is currently configured.
  // Display no fictitious properties, ratings, rooms or payable totals.
  void req.guests;
  void req.rooms;
  return {
    success: false,
    data: [],
    source: "partner_wholesale",
    count: 0,
    cityOrLocation: city,
    checkInDate,
    checkOutDate,
  };
}
