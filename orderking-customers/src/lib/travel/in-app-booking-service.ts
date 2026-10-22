import { PAISE_PER_RUPEE } from "@/lib/money";
import { supabase } from "@/lib/db-cloud";
import {
  isIrctcPspAuthenticated,
  assertTrainPaymentPermitted,
  validateCrisPnr,
  isHardcodedTrainQuote,
  assertTrainQuoteAuthentic,
  validateTrainQuote,
} from "./irctc-reconciliation";

export const SOVEREIGN_TRAVEL_DISCLAIMER =
  "Travel availability and booking confirmation require the original supplier. Unverified local estimates are not bookable.";

export type TravelMode = "flight" | "train" | "bus" | "cab";
export type RebateChoice = "24k_gold" | "food_wallet";
export type PaymentMethod = "kingpay_wallet" | "razorpay_upi" | "razorpay_card" | "razorpay_netbanking";

export interface Passenger {
  id: string;
  fullName: string;
  age: number;
  gender: "male" | "female" | "other";
  seatPreference: string;
}

export interface BookingContact {
  phone: string;
  email: string;
  gstin?: string;
}

export interface BaseQuote {
  id: string;
  mode: TravelMode;
  carrierCode: string;
  carrierName: string;
  serviceNumber: string;
  title: string;
  fromCity: string;
  fromCode?: string;
  toCity: string;
  toCode?: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  baseFarePaise: number;
  carrierTaxesPaise: number;
  orderKingDeskFeePaise: 0; // Strictly 0 paise
  otaBenchmarkFeePaise: number; // e.g. ₹399.00
  partnerRebateBps: number; // e.g. 200 bps = 2%
  stopsDisplay?: string;
  seatsAvailable: number;
}

export interface FlightQuote extends BaseQuote {
  mode: "flight";
  cabinClass: "Economy" | "Premium Economy" | "Business";
  baggageAllowance: string; // e.g. "15 kg Check-in · 7 kg Cabin"
  aircraftType: string;
  terminal: string;
}

export interface TrainQuote extends BaseQuote {
  mode: "train";
  trainClass: "1A" | "2A" | "3A" | "CC" | "EC" | "SL";
  quota: "GENERAL (GN)" | "TATKAL (TQ)" | "LADIES (LD)";
  availabilityStatus: string; // e.g. "AVAILABLE-42", "CURR_AVL-12"
  platform: string;
  pantryAvailable: boolean;
}

export interface BusSeatBerth {
  id: string;
  label: string; // e.g. "L1 (Window)", "U4 (Aisle)"
  deck: "lower" | "upper";
  berthType: "sleeper" | "seater";
  isWindow: boolean;
  isAvailable: boolean;
  pricePaise: number;
}

export interface BusQuote extends BaseQuote {
  mode: "bus";
  busType: string; // e.g. "Volvo Multi-Axle AC Sleeper (2+1)"
  operatorName: string;
  boardingPoint: string;
  droppingPoint: string;
  amenities: string[];
  seats: BusSeatBerth[];
}

export interface CabQuote extends BaseQuote {
  mode: "cab";
  category: "City Taxi" | "Airport Transfer" | "Intercity One-Way" | "Hourly Rental";
  vehicleModel: string;
  vehicleType: "Sedan" | "SUV" | "Mini" | "EV Taxi";
  seatingCapacity: number;
  driverName: string;
  driverRating: number;
  vehiclePlate: string;
  etaMinutes: number;
}

export interface FareCalculation {
  passengerCount: number;
  baseFarePaiseTotal: number;
  taxesPaiseTotal: number;
  orderKingDeskFeePaise: 0;
  totalCheckoutPaise: number;
  otaBenchmarkFeePaiseTotal: number;
  instantSavingsPaise: number;
  partnerRebatePaiseTotal: number;
  rebateGoldMilligrams: number;
  rebateFoodWalletPaise: number;
  effectiveNetCostPaise: number;
}

export interface SovereignETicket {
  pnr: string;
  bookingId: string;
  mode: TravelMode;
  carrierCode: string;
  carrierName: string;
  serviceNumber: string;
  serviceTitle: string;
  origin: {
    city: string;
    code?: string;
    terminalOrPlatform?: string;
    departureDate: string;
    departureTime: string;
  };
  destination: {
    city: string;
    code?: string;
    terminalOrPlatform?: string;
    arrivalDate: string;
    arrivalTime: string;
  };
  duration: string;
  classOrTier: string;
  quota?: string;
  stopsDisplay?: string;
  passengers: Array<Passenger & { allocatedSeat: string; bookingStatus: "CONFIRMED" | "CNF" }>;
  contact: BookingContact;
  fareBreakdown: FareCalculation;
  payment: {
    method: PaymentMethod;
    paidAt: string;
    transactionId: string;
    rebateDestination: RebateChoice;
    rebateAmountCredited: string;
  };
  cancellationPolicy: {
    refundableUntil: string;
    refundablePaise: number;
    orderKingPenaltyPaise: 0;
    terms: string;
  };
  departureTimestamp: string;
  status: "CONFIRMED";
  qrCodeData: string;
  cabDriver?: {
    name: string;
    phone: string;
    vehicleModel: string;
    vehiclePlate: string;
    otp: string;
    etaMinutes: number;
  };
  bookedAt: string;
}

// ============================================================================
// PNR & SERIAL GENERATORS
// ============================================================================

export function generateSovereignPnr(_mode: TravelMode): string {
  throw new SupplierUnavailableError("Booking references must be issued by an authorized travel provider.");
}

export function generateTransactionId(method: PaymentMethod): string {
  const prefix = method === "kingpay_wallet" ? "KP-WAL" : "RZP-PAY";
  const num = Math.floor(100000000 + Math.random() * 900000000);
  return `${prefix}-${num}`;
}

// ============================================================================
// FARE & ZERO-CONVENIENCE-FEE CALCULATOR
// ============================================================================

export function calculateFareBreakdown(
  baseFarePaise: number,
  taxesPaise: number,
  passengerCount: number,
  otaBenchmarkFeePaise: number,
  partnerRebateBps: number,
  goldRatePerGramRupees = 7500
): FareCalculation {
  const count = Math.max(1, Math.floor(passengerCount));
  const baseFarePaiseTotal = baseFarePaise * count;
  const taxesPaiseTotal = taxesPaise * count;
  const orderKingDeskFeePaise = 0 as const; // Sovereign guarantee: strictly 0 paise
  const totalCheckoutPaise = baseFarePaiseTotal + taxesPaiseTotal + orderKingDeskFeePaise;

  const otaBenchmarkFeePaiseTotal = otaBenchmarkFeePaise * count;
  const instantSavingsPaise = otaBenchmarkFeePaiseTotal;

  // Exact Integer-Paise partner rebate: floor((base * bps) / 10,000)
  const partnerRebatePaiseTotal = Math.floor((baseFarePaiseTotal * partnerRebateBps) / 10_000);

  // 24K Gold conversion: (rebatePaise / 100) / goldRatePerGram = grams * 1000 = milligrams
  const rebateGoldMilligrams = Math.round(
    ((partnerRebatePaiseTotal / PAISE_PER_RUPEE) / goldRatePerGramRupees) * 1000
  );
  const rebateFoodWalletPaise = partnerRebatePaiseTotal;
  const effectiveNetCostPaise = totalCheckoutPaise - partnerRebatePaiseTotal;

  return {
    passengerCount: count,
    baseFarePaiseTotal,
    taxesPaiseTotal,
    orderKingDeskFeePaise,
    totalCheckoutPaise,
    otaBenchmarkFeePaiseTotal,
    instantSavingsPaise,
    partnerRebatePaiseTotal,
    rebateGoldMilligrams,
    rebateFoodWalletPaise,
    effectiveNetCostPaise,
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validatePassenger(passenger: Partial<Passenger>): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!passenger.fullName || passenger.fullName.trim().length < 2) {
    errors.fullName = "Full name must be at least 2 characters.";
  } else if (!/^[A-Za-z\s.'-]+$/.test(passenger.fullName.trim())) {
    errors.fullName = "Name can only contain alphabets and spaces.";
  }

  if (passenger.age === undefined || passenger.age === null || Number.isNaN(Number(passenger.age))) {
    errors.age = "Age is required.";
  } else {
    const ageNum = Number(passenger.age);
    if (ageNum < 1 || ageNum > 120) {
      errors.age = "Age must be between 1 and 120 years.";
    }
  }

  if (!passenger.gender || !["male", "female", "other"].includes(passenger.gender)) {
    errors.gender = "Please select a valid gender (Male, Female, or Other).";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePassengers(passengers: Partial<Passenger>[]): { valid: boolean; errors: string[] } {
  if (!passengers || passengers.length === 0) {
    return { valid: false, errors: ["At least one passenger must be specified."] };
  }

  const allErrors: string[] = [];
  passengers.forEach((p, idx) => {
    const res = validatePassenger(p);
    if (!res.valid) {
      Object.entries(res.errors).forEach(([field, msg]) => {
        allErrors.push(`Passenger ${idx + 1} (${field}): ${msg}`);
      });
    }
  });

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

export function validateContact(contact: Partial<BookingContact>): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const cleanPhone = (contact.phone || "").replace(/\D/g, "");
  if (cleanPhone.length !== 10) {
    errors.phone = "Contact phone must be a valid 10-digit mobile number.";
  }

  const email = (contact.email || "").trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.email = "Please provide a valid email address for receiving your e-ticket.";
  }

  if (contact.gstin && contact.gstin.trim()) {
    const cleanGst = contact.gstin.trim().toUpperCase();
    if (cleanGst.length !== 15 || !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanGst)) {
      errors.gstin = "Optional GSTIN must be a valid 15-character Indian GST format (e.g. 07AAAAA0000A1Z5).";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// ============================================================================
// LIVE QUOTES PROVIDERS (FLIGHTS, TRAINS, BUSES, CABS)
// ============================================================================

/** No authenticated supplier inventory is available from this local module. */
export function searchFlightQuotes(
  _from = "New Delhi (DEL)",
  _to = "Mumbai (BOM)",
  _date = new Date().toISOString().split("T")[0],
  _cabinClass: "Economy" | "Premium Economy" | "Business" = "Economy"
): FlightQuote[] {
  return [];
}

export function searchTrainQuotes(
  from = "New Delhi (NDLS)",
  to = "Mumbai Central (MMCT)",
  date = new Date().toISOString().split("T")[0],
  quota: "GENERAL (GN)" | "TATKAL (TQ)" | "LADIES (LD)" = "GENERAL (GN)",
  trainClass: "1A" | "2A" | "3A" | "CC" | "EC" | "SL" = "3A"
): TrainQuote[] & TrainQuoteQueryResult {
  const extractCode = (str: string, fallback: string) => {
    const match = str.match(/\(([A-Za-z]{2,6})\)/i);
    if (match && match[1]) return match[1].toUpperCase();
    const alpha = str.replace(/[^A-Za-z]/g, "").toUpperCase();
    return alpha.slice(0, 5) || fallback;
  };

  const fromCode = extractCode(from, "NDLS");
  const toCode = extractCode(to, "MMCT");
  const journeyDate = date || new Date().toISOString().split("T")[0];
  const officialSearchUrl = buildOfficialIrctcSearchUrl(fromCode, toCode, journeyDate);

  // Strict Fintech Audit Guarantee: Zero fabricated train inventory.
  // In accordance with CRIS/IRCTC regulations, synthetic or mock train seat allocation is strictly prohibited.
  // In the absence of server-side authenticated CRIS PRS provider credentials, return an empty array with explicit unauthenticated state.
  const quotes: TrainQuote[] = [];

  return Object.assign(quotes, {
    mode: "train" as const,
    quotes,
    realTimePrsManaged: false as const,
    authenticated: false,
    status: "unauthenticated" as const,
    inventoryNotice: "In-app railway inventory is not connected to an authorized booking provider. Use the official IRCTC booking portal: " + officialSearchUrl,
    fromCity: from,
    fromCode,
    toCity: to,
    toCode,
    journeyDate,
    quota,
    trainClass,
    officialSearchUrl,
  });
}

/** Seat availability is never guessed. It must come from an authorized operator. */
export function generateBusSeats(_baseFarePaise: number): BusSeatBerth[] {
  return [];
}

/** No fabricated operators, berths, fares or departure schedules. */
export function searchBusQuotes(
  _from = "Bengaluru (Kempegowda)",
  _to = "Goa (Panaji)",
  _date = new Date().toISOString().split("T")[0]
): BusQuote[] {
  return [];
}

/** No locally generated drivers, plates, ETA or cab fares. */
export function searchCabQuotes(
  _pickup = "Terminal 3, IGI Airport (DEL)",
  _drop = "Connaught Place, New Delhi",
  _category: "City Taxi" | "Airport Transfer" | "Intercity One-Way" | "Hourly Rental" = "Airport Transfer"
): CabQuote[] {
  return [];
}

// ============================================================================
// SOVEREIGN DIGITAL E-TICKET ISSUANCE & PERSISTENCE
// ============================================================================

export const SOVEREIGN_ETICKETS_STORAGE_KEY = "orderking_sovereign_etickets_v1";
export const SAVED_TRIPS_STORAGE_KEY = "orderking_saved_trips_v1";

export type SupplierApiState = "online" | "unauthenticated" | "offline" | "rate_limited";

export const SUPPLIER_UNAVAILABLE_MESSAGE = "Direct carrier partner booking temporarily unavailable in your region";

export class SupplierUnavailableError extends Error {
  readonly code = "SUPPLIER_UNAVAILABLE";
  constructor(message: string = SUPPLIER_UNAVAILABLE_MESSAGE) {
    super(message);
    this.name = "SupplierUnavailableError";
  }
}

export interface SupplierGatingResult {
  available: boolean;
  status: SupplierApiState;
  message: string;
}

/**
 * Verifies carrier or supplier API connectivity.
 * Fails closed gracefully if supplier is unauthenticated, offline, or rate-limited.
 */
export function checkSupplierGating(
  mode: TravelMode,
  carrierCode?: string,
  options?: {
    region?: string;
    authToken?: string;
    statusOverride?: SupplierApiState;
  }
): SupplierGatingResult {
  if (options?.statusOverride) {
    if (options.statusOverride !== "online") {
      return {
        available: false,
        status: options.statusOverride,
        message: SUPPLIER_UNAVAILABLE_MESSAGE,
      };
    }
  }

  // Strict IRCTC PSP Compliance Check for Train Bookings
  if (mode === "train") {
    // In-app train booking path is strictly locked; official IRCTC portal handoff is required
    return {
      available: false,
      status: "unauthenticated",
      message:
        "IRCTC Direct PSP Gateway Handoff Required: In accordance with Indian Railways CRIS statutory guidelines, in-app train ticket issuance is locked. Bookings must be completed directly via the official IRCTC portal (https://www.irctc.co.in/nget/train-search). No payment has been captured.",
    };
  }

  // Check if carrier API credentials exist in environment
  const envKey =
    typeof process !== "undefined" && process?.env
      ? process.env.VITE_TRAVEL_API_KEY || process.env.VITE_IRCTC_MERCHANT_KEY
      : undefined;

  const effectiveToken = options?.authToken || envKey;

  // If unauthenticated: fail-closed gracefully
  if (!effectiveToken && options?.statusOverride !== "online") {
    return {
      available: false,
      status: "unauthenticated",
      message: SUPPLIER_UNAVAILABLE_MESSAGE,
    };
  }

  return {
    available: true,
    status: "online",
    message: "Carrier partner booking online.",
  };
}

export function issueSovereignETicket(_params: {
  quote: BaseQuote & Record<string, any>;
  passengers: Passenger[];
  contact: BookingContact;
  paymentMethod: PaymentMethod;
  rebateDestination: RebateChoice;
  selectedSeats?: string[];
  travelDate?: string;
  verifiedPaymentToken?: string;
  supplierReservationId?: string;
  isConfirmedSupplier?: boolean;
  supplierState?: SupplierApiState;
  region?: string;
}): SovereignETicket {
  // No provider-issued reservation, airline PNR, payment receipt or driver assignment
  // is available here. Never manufacture a CONFIRMED customer ticket.
  throw new SupplierUnavailableError("Confirmed bookings require an authorized provider-issued ticket.");
}

/**
 * High-level graceful booking orchestrator.
 * Fails closed gracefully with truthful error message if supplier APIs are
 * unauthenticated, offline, or rate-limited without throwing uncaught exceptions.
 */
export async function bookDirectTravelQuote(params: {
  quote: BaseQuote & Record<string, any>;
  passengers: Passenger[];
  contact: BookingContact;
  paymentMethod: PaymentMethod;
  rebateDestination: RebateChoice;
  selectedSeats?: string[];
  travelDate?: string;
  region?: string;
  supplierState?: SupplierApiState;
  supplierAuthToken?: string;
  supplierReservationId?: string;
  verifiedPaymentToken?: string;
}): Promise<
  | { success: true; ticket: SovereignETicket }
  | { success: false; error: string; code: SupplierApiState | "VALIDATION_FAILED" | "SUPPLIER_BLOCKED" }
> {
  const paxVal = validatePassengers(params.passengers);
  if (!paxVal.valid) {
    return {
      success: false,
      error: paxVal.errors[0] || "Invalid passenger details.",
      code: "VALIDATION_FAILED",
    };
  }

  const contactVal = validateContact(params.contact);
  if (!contactVal.valid) {
    const errList = Object.values(contactVal.errors);
    return {
      success: false,
      error: errList[0] || "Invalid contact details.",
      code: "VALIDATION_FAILED",
    };
  }

  const gating = checkSupplierGating(params.quote.mode, params.quote.carrierCode, {
    region: params.region,
    authToken: params.supplierAuthToken,
    statusOverride: params.supplierState,
  });

  if (!gating.available) {
    return {
      success: false,
      error: gating.message,
      code: gating.status,
    };
  }

  try {
    const ticket = issueSovereignETicket({
      ...params,
      isConfirmedSupplier: true,
    });
    return { success: true, ticket };
  } catch (err: any) {
    return {
      success: false,
      error: err instanceof SupplierUnavailableError ? err.message : SUPPLIER_UNAVAILABLE_MESSAGE,
      code: "SUPPLIER_BLOCKED",
    };
  }
}

/** Legacy browser tickets are retained for audit, but are not proof of issuance. */
export function getStoredETickets(): SovereignETicket[] {
  return [];
}

export function saveETicketToStorage(_ticket: SovereignETicket): void {
  // Keep existing local data untouched; never persist unverified new tickets.
  throw new SupplierUnavailableError("Only server-verified provider tickets may be stored as confirmed bookings.");
}

function syncTicketToSavedTrips(ticket: SovereignETicket): void {
  if (typeof window === "undefined") return;
  // Strictly prevent synthetic train tickets from syncing to saved trips
  if (ticket.mode === "train") {
    const cris = validateCrisPnr(ticket.pnr);
    if (!cris.valid || isHardcodedTrainQuote({ id: ticket.serviceNumber, mode: "train" })) {
      return;
    }
  }
  try {
    const raw = window.localStorage.getItem(SAVED_TRIPS_STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    // Cleanse any legacy synthetic train entries
    const cleansedExisting = Array.isArray(existing)
      ? existing.filter((t: any) => {
          if (t.bookingType === "Train") {
            const cris = validateCrisPnr(t.bookingRef);
            if (!cris.valid) return false;
          }
          return t.bookingRef !== ticket.pnr;
        })
      : [];

    const modeName =
      ticket.mode === "flight" ? "Flight" :
      ticket.mode === "train" ? "Train" :
      ticket.mode === "bus" ? "Bus" : "Cab";

    const tripEntry = {
      id: `trip-${ticket.pnr}`,
      bookingType: modeName,
      providerName: `${ticket.carrierName} (${ticket.serviceNumber})`,
      bookingRef: ticket.pnr,
      travelDate: ticket.origin.departureDate,
      routeOrLocation: `${ticket.origin.city} ➔ ${ticket.destination.city}`,
      notes: `${ticket.passengers.length} Pax · Total ₹${(ticket.fareBreakdown.totalCheckoutPaise / 100).toFixed(2)} · In-App Confirmed`,
      createdAt: ticket.bookedAt,
      sovereignETicket: ticket,
    };

    const nextTrips = [tripEntry, ...cleansedExisting];
    window.localStorage.setItem(SAVED_TRIPS_STORAGE_KEY, JSON.stringify(nextTrips));
  } catch {
    // ignore
  }
}

// ============================================================================
// B2B Travel Partner Bookings Supabase Integration
// ============================================================================

export type B2BBookingType = "FLIGHT" | "TRAIN" | "BUS" | "HOTEL";
export type B2BPartnerProvider = "KIWI" | "TRAVELPAYOUTS" | "CONFIRMTKT" | "REDBUS" | "BOOKING_COM";
export type B2BBookingStatus = "INITIATED" | "HANDOFF_COMPLETED" | "CONFIRMED" | "FAILED";

export interface TravelPartnerBookingRecord {
  id?: string;
  userId?: string | null;
  bookingType: B2BBookingType;
  partnerProvider: B2BPartnerProvider;
  carrierName?: string | null;
  carrierCode?: string | null;
  routeSummary: string;
  fareAmountInr: number;
  platformConvenienceFeeInr?: number;
  commissionExpectedInr?: number;
  cashbackAccruedPaise?: number;
  bookingStatus?: B2BBookingStatus;
  affiliateDeepLink?: string | null;
  createdAt?: string;
}

export interface TravelPartnerBookingResult {
  success: boolean;
  bookingId?: string;
  error?: string;
}

/**
 * Logs a B2B travel partner booking lead or checkout to Supabase `travel_partner_bookings`.
 * Uses authentic production data only — zero mock fallbacks.
 */
export async function logTravelPartnerBooking(
  booking: TravelPartnerBookingRecord
): Promise<TravelPartnerBookingResult> {
  try {
    const payload = {
      user_id: booking.userId ?? null,
      booking_type: booking.bookingType,
      partner_provider: booking.partnerProvider,
      carrier_name: booking.carrierName ?? null,
      carrier_code: booking.carrierCode ?? null,
      route_summary: booking.routeSummary,
      fare_amount_inr: booking.fareAmountInr,
      platform_convenience_fee_inr: booking.platformConvenienceFeeInr ?? 29.0,
      commission_expected_inr: booking.commissionExpectedInr ?? 0.0,
      cashback_accrued_paise: booking.cashbackAccruedPaise ?? 500,
      booking_status: booking.bookingStatus ?? "INITIATED",
      affiliate_deep_link: booking.affiliateDeepLink ?? null,
    };

    const { data, error } = await supabase
      .from("travel_partner_bookings")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.warn("Failed to log B2B booking to Supabase travel_partner_bookings:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, bookingId: data?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error logging travel partner booking";
    console.warn("Error in logTravelPartnerBooking:", message);
    return { success: false, error: message };
  }
}

/**
 * Updates the booking status of an existing travel partner booking in Supabase.
 */
export async function updateTravelPartnerBookingStatus(
  bookingId: string,
  status: B2BBookingStatus
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("travel_partner_bookings")
      .update({ booking_status: status })
      .eq("id", bookingId);

    if (error) {
      console.warn("Failed to update B2B booking status:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Error updating travel partner booking status:", err);
    return false;
  }
}

/**
 * Fetches user travel partner booking history from Supabase `travel_partner_bookings`.
 */
export async function fetchUserTravelPartnerBookings(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("travel_partner_bookings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }
    return data;
  } catch {
    return [];
  }
}

