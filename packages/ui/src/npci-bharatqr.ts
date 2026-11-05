/**
 * ORDERKING / KINGPAY FINTECH ARCHITECTURE
 * Production NPCI Direct UPI & BharatQR Integration Engine
 * Statutory Entity: OrderKing / KingPay (GSTIN: 18AFXPH9838M1Z9, Assam - 788710)
 *
 * SPECIFICATION COMPLIANCE:
 * 1. NPCI Unified Payments Interface (UPI) Linking Specifications v1.6 / v2.0
 *    - Standard URI Scheme: upi://pay?pa=...&pn=...&am=...&cu=INR&tr=...
 * 2. EMVCo Merchant-Presented Mode (MPM) BharatQR Specification v1.0
 *    - Tag-Length-Value (TLV) encoding with ISO-4217 Currency Code 356 (INR)
 *    - 16-bit CRC-CCITT (polynomial 0x1021, seed 0xFFFF) integrity seal
 * 3. Direct App Intent Protocols:
 *    - Google Pay (Tez): tez://upi/pay?...
 *    - PhonePe:          phonepe://pay?...
 *    - Paytm:            paytmmp://pay?...
 *    - CRED:             cred://pay?...
 *    - BHIM:             bhim://pay?...
 *    - Amazon Pay:       amazonpay://pay?...
 *    - Universal:        upi://pay?...
 */

export type SupportedUPIApp =
  | "gpay"
  | "phonepe"
  | "paytm"
  | "cred"
  | "bhim"
  | "amazonpay"
  | "universal";

/**
 * Sovereign Direct NPCI VPAs: 0.0% MDR direct settlement to founder accounts
 */
export const PRIMARY_FOUNDER_VPA = "orderking@ybl";
export const SECONDARY_FOUNDER_VPA = "9395065587@ybl";

export const SUPPORTED_FOUNDER_VPAS = [
  PRIMARY_FOUNDER_VPA,
  SECONDARY_FOUNDER_VPA,
] as const;

export const FOUNDER_UPI_VPAS: Record<string, string> = {
  primary: PRIMARY_FOUNDER_VPA,
  secondary: SECONDARY_FOUNDER_VPA,
  fallback: SECONDARY_FOUNDER_VPA,
  phonepe: PRIMARY_FOUNDER_VPA,
  gpay: PRIMARY_FOUNDER_VPA,
  paytm: PRIMARY_FOUNDER_VPA,
  cred: "9395065587@yescred",
  bhim: "9395065587@upi",
  amazonpay: "9395065587@apl",
  universal: PRIMARY_FOUNDER_VPA,
};

export const DEFAULT_FOUNDER_PAYEE_NAME = "OrderKingPay";

export interface UPIIntentParams {
  /** Payee Virtual Payment Address (e.g. orderking@ybl or 9395065587@ybl) */
  vpa: string;
  /** Payee Name / Registered Business Name / Order Public Identifier ('pn') - MANDATORY */
  payeeName: string;
  /** Amount in integer paise (e.g. 15000 -> 150.00 INR) */
  amountPaise?: number;
  /** Alternative: Amount in Rupees (e.g. 150.00) */
  amountInRupees?: number;
  /** Currency - strictly "INR" per NPCI mandate */
  currency?: "INR";
  /** Unique Transaction Reference ID ('tr') - MANDATORY */
  transactionRef: string;
  /** Transaction Note / Memo ('tn') */
  transactionNote?: string;
  /** Merchant Category Code ('mc', default 5812) */
  merchantCategoryCode?: string;
  /** Terminal ID (optional) */
  terminalId?: string;
  /** Reference URL */
  url?: string;
  /** Transaction Mode ('mode', default 02 for Dynamic QR) */
  mode?: string;
  /** Order Public ID for display tracking */
  orderPublicId?: string;
}

export interface BharatQRParams extends UPIIntentParams {
  /** Merchant City (default "Karimganj") */
  merchantCity?: string;
  /** Postal Code (default "788710") */
  postalCode?: string;
}

export interface BharatQRResult {
  /** Canonical NPCI UPI URI Scheme */
  upiUri: string;
  /** EMVCo MPM v1.0 TLV Byte Payload with 16-bit CRC-CCITT */
  emvcoPayload: string;
  /** Verified VPA */
  vpa: string;
  /** Amount in Rupees string formatted to 2 decimals */
  amount: string;
  /** Amount in exact integer paise */
  amountPaise: number;
  /** Mandatory Transaction Reference ('tr') */
  transactionRef: string;
  /** Mandatory Payee / Order Public Name ('pn') */
  payeeName: string;
  /** Verified 16-bit CRC checksum */
  checksum: string;
  /** Dynamic QR flag */
  isDynamic: boolean;
}

/**
 * Validates Virtual Payment Address (VPA) syntax per NPCI specifications.
 */
export function isValidVPA(vpa: string): boolean {
  if (!vpa || typeof vpa !== "string") return false;
  const trimmed = vpa.trim();
  if (trimmed.length < 5 || trimmed.length > 256) return false;
  return /^[a-zA-Z0-9._-]{2,128}@[a-zA-Z0-9]{2,64}$/.test(trimmed);
}

/**
 * Resolves amount in rupees strictly formatted to 2 decimal places.
 * Guarantees zero float drift by asserting integer paise.
 */
export function resolveFormattedAmount(params: UPIIntentParams): {
  amountStr: string | undefined;
  amountPaise: number | undefined;
} {
  let paise: number | undefined;

  if (typeof params.amountPaise === "number") {
    if (!Number.isSafeInteger(params.amountPaise) || params.amountPaise < 0) {
      throw new Error(`Amount in paise must be a non-negative SafeInteger: ${params.amountPaise}`);
    }
    paise = params.amountPaise;
  } else if (typeof params.amountInRupees === "number") {
    if (!Number.isFinite(params.amountInRupees) || params.amountInRupees < 0) {
      throw new Error(`Amount in rupees must be a non-negative number: ${params.amountInRupees}`);
    }
    paise = Math.round(params.amountInRupees * 100);
  }

  if (paise === undefined) {
    return { amountStr: undefined, amountPaise: undefined };
  }

  return {
    amountStr: (paise / 100).toFixed(2),
    amountPaise: paise,
  };
}

/**
 * Formats a single Tag-Length-Value (TLV) segment for EMVCo payloads.
 */
export function toTLV(tag: string, value: string): string {
  const lenStr = value.length.toString().padStart(2, "0");
  return `${tag}${lenStr}${value}`;
}

/**
 * Calculates 16-bit CRC-CCITT (polynomial 0x1021, seed 0xFFFF)
 * strictly mandated by EMVCo Merchant-Presented Mode (MPM) v1.0.
 */
export function calculateCRC16CCITT(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Encodes query string according to canonical NPCI UPI order.
 * Enforces mandatory 'tr' (transaction reference) and 'pn' (payee name / order public ID).
 */
export function buildQueryString(params: UPIIntentParams): string {
  if (!isValidVPA(params.vpa)) {
    throw new Error(`Invalid NPCI VPA format: '${params.vpa}'`);
  }
  if (!params.payeeName || !params.payeeName.trim()) {
    throw new Error("Payee name / order public ID ('pn') is strictly mandatory for NPCI UPI intent.");
  }
  if (!params.transactionRef || !params.transactionRef.trim()) {
    throw new Error("Transaction reference ('tr') is strictly mandatory for NPCI UPI intent.");
  }

  const queryParts: string[] = [];
  queryParts.push(`pa=${encodeURIComponent(params.vpa.trim())}`);
  queryParts.push(`pn=${encodeURIComponent(params.payeeName.trim())}`);

  const { amountStr } = resolveFormattedAmount(params);
  if (amountStr !== undefined) {
    queryParts.push(`am=${amountStr}`);
  }

  const currency = params.currency || "INR";
  if (currency !== "INR") {
    throw new Error(`Unsupported currency '${currency}'. NPCI UPI strictly mandates 'INR'.`);
  }
  queryParts.push(`cu=INR`);

  queryParts.push(`tr=${encodeURIComponent(params.transactionRef.trim())}`);

  if (params.transactionNote && params.transactionNote.trim()) {
    queryParts.push(`tn=${encodeURIComponent(params.transactionNote.trim())}`);
  }

  const mcc = params.merchantCategoryCode?.trim() || "5812";
  queryParts.push(`mc=${encodeURIComponent(mcc)}`);

  const mode = params.mode?.trim() || "02";
  queryParts.push(`mode=${encodeURIComponent(mode)}`);

  if (params.terminalId) {
    queryParts.push(`tid=${encodeURIComponent(params.terminalId.trim())}`);
  }
  if (params.url) {
    queryParts.push(`url=${encodeURIComponent(params.url.trim())}`);
  }

  return queryParts.join("&");
}

/**
 * Builds universal NPCI UPI intent URL:
 * `upi://pay?pa=...&pn=...&am=...&cu=INR&tr=...`
 */
export function buildNPCIUpiIntentUrl(params: UPIIntentParams): string {
  const query = buildQueryString(params);
  return `upi://pay?${query}`;
}

/**
 * Returns deep-link URI prefix for designated Indian UPI apps.
 */
export function getAppPrefix(app: SupportedUPIApp): string {
  switch (app) {
    case "gpay":
      return "tez://upi/pay?";
    case "phonepe":
      return "phonepe://pay?";
    case "paytm":
      return "paytmmp://pay?";
    case "cred":
      return "cred://pay?";
    case "bhim":
      return "bhim://pay?";
    case "amazonpay":
      return "amazonpay://pay?";
    case "universal":
    default:
      return "upi://pay?";
  }
}

/**
 * Generates an app-specific deep-link URL with verified 'tr' and 'pn' parameters.
 */
export function generateAppDeepLink(app: SupportedUPIApp, params: UPIIntentParams): string {
  const query = buildQueryString(params);
  const prefix = getAppPrefix(app);
  return `${prefix}${query}`;
}

/**
 * Generates deep-link URLs across all major Indian UPI applications.
 */
export function generateAllUPIAppLinks(params: UPIIntentParams): Record<SupportedUPIApp, string> {
  const query = buildQueryString(params);
  return {
    gpay: `tez://upi/pay?${query}`,
    phonepe: `phonepe://pay?${query}`,
    paytm: `paytmmp://pay?${query}`,
    cred: `cred://pay?${query}`,
    bhim: `bhim://pay?${query}`,
    amazonpay: `amazonpay://pay?${query}`,
    universal: `upi://pay?${query}`,
  };
}

/**
 * Generates standards-compliant Dynamic BharatQR EMVCo MPM v1.0 payload.
 * Binds exact order amount in integer paise directly to sovereign founder VPAs
 * (`orderking@ybl` or `9395065587@ybl`).
 */
export function generateBharatQRPayload(params: BharatQRParams): BharatQRResult {
  const { amountStr, amountPaise } = resolveFormattedAmount(params);
  const isDynamic = amountStr !== undefined && parseFloat(amountStr) > 0;

  // 1. Build canonical NPCI URI
  const upiUri = buildNPCIUpiIntentUrl({
    ...params,
    mode: params.mode || "02",
  });

  // 2. Build EMVCo TLV string
  let payload = "";

  // Tag 00: Payload Format Indicator (Fixed "01")
  payload += toTLV("00", "01");

  // Tag 01: Point of Initiation Method ("12" for Dynamic QR, "11" for Static)
  payload += toTLV("01", isDynamic ? "12" : "11");

  // Tag 26: Merchant Account Information (UPI Sub-template)
  // Sub-tag 00: "in.npci.upi"
  // Sub-tag 01: VPA
  const upiSubTLV = toTLV("00", "in.npci.upi") + toTLV("01", params.vpa.trim());
  payload += toTLV("26", upiSubTLV);

  // Tag 52: Merchant Category Code (default "5812")
  const mcc = (params.merchantCategoryCode || "5812").trim().padStart(4, "0").slice(0, 4);
  payload += toTLV("52", mcc);

  // Tag 53: Currency Code ("356" for Indian Rupee)
  payload += toTLV("53", "356");

  // Tag 54: Transaction Amount (Mandatory for Dynamic QR)
  if (isDynamic && amountStr) {
    payload += toTLV("54", amountStr);
  }

  // Tag 58: Country Code ("IN")
  payload += toTLV("58", "IN");

  // Tag 59: Merchant Name (Up to 25 chars)
  const safeName = params.payeeName.trim().slice(0, 25);
  payload += toTLV("59", safeName);

  // Tag 60: Merchant City (Up to 15 chars)
  const city = (params.merchantCity || "Karimganj").trim().slice(0, 15);
  payload += toTLV("60", city);

  // Tag 61: Postal Code (Up to 10 chars)
  const postal = (params.postalCode || "788710").trim().slice(0, 10);
  payload += toTLV("61", postal);

  // Tag 62: Additional Data Field Template
  // Sub-tag 01: Transaction Reference Number ('tr')
  // Sub-tag 05: Note / Purpose ('tn')
  let additionalData = toTLV("01", params.transactionRef.trim().slice(0, 25));
  if (params.transactionNote) {
    additionalData += toTLV("05", params.transactionNote.trim().slice(0, 25));
  }
  payload += toTLV("62", additionalData);

  // Tag 63: CRC-16 Checksum
  const preCrc = `${payload}6304`;
  const checksum = calculateCRC16CCITT(preCrc);
  const emvcoPayload = `${preCrc}${checksum}`;

  return {
    upiUri,
    emvcoPayload,
    vpa: params.vpa.trim(),
    amount: amountStr || "0.00",
    amountPaise: amountPaise || 0,
    transactionRef: params.transactionRef.trim(),
    payeeName: params.payeeName.trim(),
    checksum,
    isDynamic,
  };
}

/**
 * Validates the CRC-16 checksum of an EMVCo BharatQR payload.
 */
export function verifyBharatQRChecksum(emvcoPayload: string): boolean {
  if (!emvcoPayload || emvcoPayload.length < 8) return false;
  const tag63Index = emvcoPayload.lastIndexOf("6304");
  if (tag63Index === -1 || tag63Index + 8 !== emvcoPayload.length) return false;

  const dataWithoutCrc = emvcoPayload.slice(0, tag63Index + 4);
  const expectedCrc = emvcoPayload.slice(tag63Index + 4);
  const calculatedCrc = calculateCRC16CCITT(dataWithoutCrc);

  return expectedCrc.toUpperCase() === calculatedCrc.toUpperCase();
}
