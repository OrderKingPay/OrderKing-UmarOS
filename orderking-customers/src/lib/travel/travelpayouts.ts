export const TRAVELPAYOUTS_PROJECT_NAME = 'Orderkingpay' as const;
export const TRAVELPAYOUTS_MARKER = '589554' as const;
export type CabinClassCode = '' | 'w' | 'c' | 'f';
export interface FlightSearchParams {
  originIata: string;
  destinationIata: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  cabinClass?: CabinClassCode;
  subId?: string;
}
export interface SupplierPolicyDisclosure {
  supplierId: string;
  supplierName: string;
  category: 'flights' | 'hotels' | 'trains' | 'buses' | 'activities' | 'transfers' | 'esim';
  relationshipType: 'travelpayouts_affiliate' | 'official_direct_portal';
  paymentHandler: string;
  issuanceHandler: string;
  cancellationAndRefundHandler: string;
  officialDomain: string;
  ctaLabel: 'Continue to partner to book and pay';
}
export interface TravelpayoutsEnvConfig {
  VITE_TP_MARKER?: string;
  VITE_TP_WL_ID?: string;
}
export function formatAviasalesDateDDMM(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) {
    throw new Error(`Invalid ISO date format "${isoDate}". Expected YYYY-MM-DD.`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  if (
    dateObj.getUTCFullYear() !== year ||
    dateObj.getUTCMonth() + 1 !== month ||
    dateObj.getUTCDate() !== day
  ) {
    throw new Error(`Invalid calendar date "${isoDate}".`);
  }
  return `${String(day).padStart(2, '0')}${String(month).padStart(2, '0')}`;
}
export function normalizeIataCode(code: string, fieldName: string): string {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new Error(`Invalid ${fieldName} IATA code "${code}". Must be 3 uppercase Latin letters.`);
  }
  return normalized;
}
export function buildAviasalesSearchCode(params: FlightSearchParams): string {
  const origin = normalizeIataCode(params.originIata, 'origin');
  const destination = normalizeIataCode(params.destinationIata, 'destination');
  if (origin === destination) {
    throw new Error('Origin and destination IATA codes cannot be identical.');
  }
  const adults = Math.trunc(params.adults);
  const children = Math.trunc(params.children ?? 0);
  const infants = Math.trunc(params.infants ?? 0);
  if (adults < 1 || adults > 9) {
    throw new Error('Adults count must be between 1 and 9.');
  }
  if (children < 0 || children > 9 || infants < 0 || infants > 9) {
    throw new Error('Children and infants counts must be between 0 and 9.');
  }
  if (infants > adults) {
    throw new Error('Number of infants cannot exceed number of adults.');
  }
  const departDDMM = formatAviasalesDateDDMM(params.departureDate);
  const returnDDMM = params.returnDate ? formatAviasalesDateDDMM(params.returnDate) : '';
  const cabin = params.cabinClass ?? '';
  let passengerSuffix = `${adults}`;
  if (children > 0 || infants > 0) {
    passengerSuffix = `${adults}${children}${infants > 0 ? infants : ''}`;
  }
  return `${origin}${departDDMM}${destination}${returnDDMM}${cabin}${passengerSuffix}`;
}
export function buildAviasalesAffiliateUrl(params: FlightSearchParams): string {
  const searchCode = buildAviasalesSearchCode(params);
  const marker = params.subId
    ? `${TRAVELPAYOUTS_MARKER}.${params.subId.replace(/[^a-zA-Z0-9_-]/g, '')}`
    : TRAVELPAYOUTS_MARKER;
  const url = new URL(`https://www.aviasales.com/search/${searchCode}`);
  url.searchParams.set('marker', marker);
  url.searchParams.set('currency', 'inr');
  url.searchParams.set('locale', 'en-IN');
  return url.toString();
}
export function buildHotellookAffiliateUrl(params: {
  destination: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  subId?: string;
}): string {
  const dest = params.destination.trim();
  if (!dest) {
    throw new Error('Destination city or hotel name is required.');
  }
  formatAviasalesDateDDMM(params.checkInDate);
  formatAviasalesDateDDMM(params.checkOutDate);
  if (params.checkOutDate <= params.checkInDate) {
    throw new Error('Check-out date must be after check-in date.');
  }
  const adults = Math.max(1, Math.min(9, Math.trunc(params.adults)));
  const marker = params.subId
    ? `${TRAVELPAYOUTS_MARKER}.${params.subId.replace(/[^a-zA-Z0-9_-]/g, '')}`
    : TRAVELPAYOUTS_MARKER;
  const url = new URL('https://search.hotellook.com/');
  url.searchParams.set('destination', dest);
  url.searchParams.set('checkIn', params.checkInDate);
  url.searchParams.set('checkOut', params.checkOutDate);
  url.searchParams.set('adults', String(adults));
  url.searchParams.set('marker', marker);
  url.searchParams.set('currency', 'inr');
  url.searchParams.set('language', 'en_us');
  return url.toString();
}
export function resolveWhiteLabelWidgetConfig(env: TravelpayoutsEnvConfig): {
  enabled: boolean;
  wlId: string | null;
  scriptSrc: string | null;
  marker: string;
  reasonIfDisabled: string | null;
} {
  const rawWlId = (env.VITE_TP_WL_ID ?? '').trim();
  if (!rawWlId || rawWlId === 'undefined' || rawWlId === 'null' || rawWlId === 'YOUR_WL_ID') {
    return {
      enabled: false,
      wlId: null,
      scriptSrc: null,
      marker: TRAVELPAYOUTS_MARKER,
      reasonIfDisabled:
        'White Label Widget ID (VITE_TP_WL_ID) is not set. Using verified Aviasales affiliate deep-link search (marker 589554).',
    };
  }
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(rawWlId)) {
    return {
      enabled: false,
      wlId: null,
      scriptSrc: null,
      marker: TRAVELPAYOUTS_MARKER,
      reasonIfDisabled: 'VITE_TP_WL_ID format is invalid.',
    };
  }
  return {
    enabled: true,
    wlId: rawWlId,
    scriptSrc: `https://tpwgts.com/wl_web/main.js?wl_id=${encodeURIComponent(rawWlId)}`,
    marker: TRAVELPAYOUTS_MARKER,
    reasonIfDisabled: null,
  };
}
export const AUTHORITATIVE_SUPPLIER_CATALOG: ReadonlyArray&lt;SupplierPolicyDisclosure&gt; = [
  {
    supplierId: 'aviasales-tp',
    supplierName: 'Aviasales (Travelpayouts Project Orderkingpay · Marker 589554)',
    category: 'flights',
    relationshipType: 'travelpayouts_affiliate',
    paymentHandler: 'Selected Airline or OTA partner on Aviasales checkout',
    issuanceHandler: 'Issuing Airline / Accredited IATA Ticketing Partner',
    cancellationAndRefundHandler: 'Issuing Airline or OTA according to fare rules displayed before payment',
    officialDomain: 'https://www.aviasales.com',
    ctaLabel: 'Continue to partner to book and pay',
  },
  {
    supplierId: 'indigo-direct',
    supplierName: 'IndiGo Airlines (Official Direct Portal)',
    category: 'flights',
    relationshipType: 'official_direct_portal',
    paymentHandler: 'InterGlobe Aviation Ltd (IndiGo) Official Checkout',
    issuanceHandler: 'IndiGo Airlines (6E PNR issued directly by carrier)',
    cancellationAndRefundHandler: 'IndiGo Airlines under DGCA Passenger Charter & fare rules',
    officialDomain: 'https://www.goindigo.in',
    ctaLabel: 'Continue to partner to book and pay',
  },
  {
    supplierId: 'airindia-direct',
    supplierName: 'Air India (Official Direct Portal)',
    category: 'flights',
    relationshipType: 'official_direct_portal',
    paymentHandler: 'Air India Ltd Official Checkout',
    issuanceHandler: 'Air India (AI PNR & e-Ticket issued directly by carrier)',
    cancellationAndRefundHandler: 'Air India Ltd Customer Support & Manage Booking portal',
    officialDomain: 'https://www.airindia.com',
    ctaLabel: 'Continue to partner to book and pay',
  },
  {
    supplierId: 'irctc-direct',
    supplierName: 'IRCTC (Official Indian Railways Portal)',
    category: 'trains',
    relationshipType: 'official_direct_portal',
    paymentHandler: 'Indian Railway Catering and Tourism Corporation (IRCTC)',
    issuanceHandler: 'IRCTC / CRIS Passenger Reservation System (10-digit PNR)',
    cancellationAndRefundHandler: 'IRCTC Official Rules (Clerkage & refund processed to original payment source)',
    officialDomain: 'https://www.irctc.co.in/nget/train-search',
    ctaLabel: 'Continue to partner to book and pay',
  },
  {
    supplierId: 'redbus-direct',
    supplierName: 'redBus / Official State RTC Portals',
    category: 'buses',
    relationshipType: 'official_direct_portal',
    paymentHandler: 'redBus (Ibibo Group) or State Road Transport Corporation',
    issuanceHandler: 'Bus Operator / State RTC via redBus m-Ticket',
    cancellationAndRefundHandler: 'Bus Operator cancellation policy displayed on redBus checkout',
    officialDomain: 'https://www.redbus.in',
    ctaLabel: 'Continue to partner to book and pay',
  },
  {
    supplierId: 'hotellook-tp',
    supplierName: 'Hotellook / Hotel Partners (Travelpayouts Marker 589554)',
    category: 'hotels',
    relationshipType: 'travelpayouts_affiliate',
    paymentHandler: 'Selected Hotel OTA (Booking.com, Agoda, Expedia) or Property at Check-in',
    issuanceHandler: 'Selected OTA Partner (Instant Accommodation Voucher)',
    cancellationAndRefundHandler: 'Selected OTA Partner under room rate cancellation policy',
    officialDomain: 'https://search.hotellook.com',
    ctaLabel: 'Continue to partner to book and pay',
  },
];
