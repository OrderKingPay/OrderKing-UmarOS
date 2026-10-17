/**
 * 👑 ORDERKING FINTECH ARCHITECTURE - COUNCIL DOMAIN 3
 * Standards-Compliant NPCI UPI Intent & Dynamic BharatQR Generator
 *
 * SPECIFICATION GROUNDING:
 * 1. NPCI Unified Payments Interface (UPI) Linking Specifications v1.6 / v2.0
 *    - Standard URI Scheme: upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...&tr=...
 * 2. NPCI / EMVCo Merchant-Presented Mode (MPM) BharatQR Specification v1.0
 *    - Tag-Length-Value (TLV) encoding with ISO-4217 Currency Code 356 (INR)
 *    - Strict CRC-16 CCITT (0x1021 / 0xFFFF) integrity seal
 * 3. Major Indian UPI App Deep-Linking Protocols:
 *    - PhonePe:  phonepe://pay?...
 *    - Google Pay (Tez): tez://upi/pay?...
 *    - Paytm:    paytmmp://pay?...
 *    - CRED:     cred://pay?...
 *    - BHIM:     bhim://pay?...
 *    - Universal: upi://pay?... (OS native app chooser)
 */

export type SupportedUPIApp = "phonepe" | "gpay" | "paytm" | "cred" | "bhim" | "universal";

export interface UPIIntentParams {
  /** Payee Virtual Payment Address (UPI ID), e.g. merchant@icici */
  vpa: string;
  /** Payee Name / Registered Business Name */
  payeeName: string;
  /** Amount in INR (Rupees), e.g. 150.00 */
  amountInRupees?: number;
  /** Alternative: Amount in Paise (e.g. 15000 -> 150.00 INR) */
  amountPaise?: number;
  /** Transaction Currency - strictly "INR" per NPCI mandate */
  currency?: "INR";
  /** Transaction Note / Memo (URL-encoded) */
  transactionNote?: string;
  /** Unique Transaction Reference ID / Order ID */
  transactionRef: string;
  /** Merchant Category Code (MCC, 4 digits e.g. "5812" for dining/groceries) */
  merchantCategoryCode?: string;
  /** Terminal ID (optional) */
  terminalId?: string;
  /** Reference URL for transaction details */
  url?: string;
  /** Transaction Mode (e.g. "02" for Secure Dynamic QR / Intent) */
  mode?: string;
  /** NPCI-assigned PSP Organization ID (optional) */
  orgId?: string;
  /** Base64 digital signature for signed intent (optional) */
  sign?: string;
}

export interface BharatQRParams extends UPIIntentParams {
  /** Merchant City (e.g. "Bengaluru", "Mumbai") - default "Bengaluru" */
  merchantCity?: string;
  /** Postal Code (optional) */
  postalCode?: string;
}

export interface BharatQRResult {
  /** Standards-compliant NPCI UPI URI Scheme */
  upiUri: string;
  /** Standards-compliant EMVCo / BharatQR TLV Payload string with CRC-16 */
  emvcoPayload: string;
  /** Verified VPA */
  vpa: string;
  /** Amount in Rupees formatted as string */
  amount: string;
  /** Unique Transaction Reference */
  transactionRef: string;
  /** Flag indicating dynamic payload with embedded amount */
  isDynamic: boolean;
}

export interface ParsedUPIIntent {
  vpa: string;
  payeeName: string;
  amountInRupees?: number;
  currency: string;
  transactionNote?: string;
  transactionRef?: string;
  merchantCategoryCode?: string;
  mode?: string;
  rawUrl: string;
  appScheme: string;
}

/**
 * Validates Virtual Payment Address (VPA) syntax according to NPCI standards.
 * Allowed format: <username>@<bank-handle>
 * Minimum 2 chars before '@', minimum 2 chars after '@', max 256 chars.
 */
export function isValidVPA(vpa: string): boolean {
  if (!vpa || typeof vpa !== "string") return false;
  const trimmed = vpa.trim();
  if (trimmed.length < 5 || trimmed.length > 256) return false;
  return /^[a-zA-Z0-9._-]{2,128}@[a-zA-Z0-9]{2,64}$/.test(trimmed);
}

/**
 * Resolves amount in rupees as a strictly formatted string (two decimal places).
 * Returns undefined if neither amountInRupees nor amountPaise is set.
 */
export function resolveFormattedAmount(params: UPIIntentParams): string | undefined {
  let rupees: number | undefined;

  if (typeof params.amountInRupees === "number") {
    if (params.amountInRupees < 0) {
      throw new Error(`Amount in rupees cannot be negative: ${params.amountInRupees}`);
    }
    rupees = params.amountInRupees;
  } else if (typeof params.amountPaise === "number") {
    if (params.amountPaise < 0) {
      throw new Error(`Amount in paise cannot be negative: ${params.amountPaise}`);
    }
    rupees = params.amountPaise / 100;
  }

  if (rupees === undefined) return undefined;
  return rupees.toFixed(2);
}

/**
 * Encodes query parameters in canonical NPCI UPI order.
 */
function buildQueryString(params: UPIIntentParams): string {
  if (!isValidVPA(params.vpa)) {
    throw new Error(`Invalid NPCI VPA format: '${params.vpa}'`);
  }
  if (!params.payeeName || !params.payeeName.trim()) {
    throw new Error("Payee name ('pn') is mandatory for NPCI UPI intent.");
  }
  if (!params.transactionRef || !params.transactionRef.trim()) {
    throw new Error("Transaction reference ('tr') is mandatory for NPCI UPI intent.");
  }

  const queryParts: string[] = [];
  queryParts.push(`pa=${encodeURIComponent(params.vpa.trim())}`);
  queryParts.push(`pn=${encodeURIComponent(params.payeeName.trim())}`);

  const formattedAmount = resolveFormattedAmount(params);
  if (formattedAmount !== undefined) {
    queryParts.push(`am=${formattedAmount}`);
  }

  const currency = params.currency || "INR";
  if (currency !== "INR") {
    throw new Error(`Unsupported currency: '${currency}'. NPCI UPI strictly mandates 'INR'.`);
  }
  queryParts.push(`cu=INR`);

  if (params.transactionNote && params.transactionNote.trim()) {
    queryParts.push(`tn=${encodeURIComponent(params.transactionNote.trim())}`);
  }

  queryParts.push(`tr=${encodeURIComponent(params.transactionRef.trim())}`);

  if (params.merchantCategoryCode) {
    queryParts.push(`mc=${encodeURIComponent(params.merchantCategoryCode.trim())}`);
  }
  if (params.terminalId) {
    queryParts.push(`tid=${encodeURIComponent(params.terminalId.trim())}`);
  }
  if (params.url) {
    queryParts.push(`url=${encodeURIComponent(params.url.trim())}`);
  }
  if (params.mode) {
    queryParts.push(`mode=${encodeURIComponent(params.mode.trim())}`);
  }
  if (params.orgId) {
    queryParts.push(`orgid=${encodeURIComponent(params.orgId.trim())}`);
  }
  if (params.sign) {
    queryParts.push(`sign=${encodeURIComponent(params.sign.trim())}`);
  }

  return queryParts.join("&");
}

/**
 * Generates standards-compliant universal NPCI UPI Intent URL:
 * `upi://pay?pa=${vpa}&pn=${payeeName}&am=${amountInRupees}&cu=INR&tn=${transactionNote}&tr=${transactionRef}`
 */
export function buildNPCIUpiIntentUrl(params: UPIIntentParams): string {
  const query = buildQueryString(params);
  return `upi://pay?${query}`;
}

/**
 * Returns deep-link URI prefix for a designated Indian UPI app.
 */
export function getAppPrefix(app: SupportedUPIApp): string {
  switch (app) {
    case "phonepe":
      return "phonepe://pay?";
    case "gpay":
      return "tez://upi/pay?";
    case "paytm":
      return "paytmmp://pay?";
    case "cred":
      return "cred://pay?";
    case "bhim":
      return "bhim://pay?";
    case "universal":
    default:
      return "upi://pay?";
  }
}

/**
 * Generates an app-specific deep-link URL for one-tap native mobile payment triggers.
 */
export function generateAppDeepLink(app: SupportedUPIApp, params: UPIIntentParams): string {
  const query = buildQueryString(params);
  const prefix = getAppPrefix(app);
  return `${prefix}${query}`;
}

/**
 * Generates a complete map of deep-link URLs across all major Indian UPI applications.
 */
export function generateAllUPIAppLinks(params: UPIIntentParams): Record<SupportedUPIApp, string> {
  const query = buildQueryString(params);
  return {
    phonepe: `phonepe://pay?${query}`,
    gpay: `tez://upi/pay?${query}`,
    paytm: `paytmmp://pay?${query}`,
    cred: `cred://pay?${query}`,
    bhim: `bhim://pay?${query}`,
    universal: `upi://pay?${query}`,
  };
}

/**
 * Calculates standard 16-bit CRC-CCITT (polynomial 0x1021, seed 0xFFFF)
 * strictly mandated by EMVCo MPM / BharatQR specifications.
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
 * Helper to build an EMVCo TLV (Tag-Length-Value) chunk.
 */
function toTLV(tag: string, value: string): string {
  const lenStr = value.length.toString().padStart(2, "0");
  return `${tag}${lenStr}${value}`;
}

/**
 * Generates standards-compliant Dynamic BharatQR payloads.
 * Produces both:
 * 1. EMVCo MPM TLV standard byte payload with verified CRC-16 seal
 * 2. Standards-compliant NPCI UPI Intent URI with `mode=02` (Dynamic QR)
 */
export function generateBharatQRPayload(params: BharatQRParams): BharatQRResult {
  const formattedAmount = resolveFormattedAmount(params);
  const isDynamic = formattedAmount !== undefined && parseFloat(formattedAmount) > 0;

  // 1. Build standard NPCI dynamic URI
  const upiUri = buildNPCIUpiIntentUrl({
    ...params,
    mode: params.mode || "02", // 02 indicates dynamic QR
  });

  // 2. Build EMVCo TLV string
  let payload = "";

  // Tag 00: Payload Format Indicator (Fixed "01")
  payload += toTLV("00", "01");

  // Tag 01: Point of Initiation Method ("12" for Dynamic QR, "11" for Static)
  payload += toTLV("01", isDynamic ? "12" : "11");

  // Tag 26: Merchant Account Information (UPI Sub-template)
  // Sub-tag 00: GUID for UPI ("in.npci.upi")
  // Sub-tag 01: VPA
  const upiSubTLV = toTLV("00", "in.npci.upi") + toTLV("01", params.vpa.trim());
  payload += toTLV("26", upiSubTLV);

  // Tag 52: Merchant Category Code (default "5812" - Dining / Quick Service)
  const mcc = params.merchantCategoryCode?.trim() || "5812";
  payload += toTLV("52", mcc.padStart(4, "0").slice(0, 4));

  // Tag 53: Transaction Currency ("356" for Indian Rupee per ISO-4217)
  payload += toTLV("53", "356");

  // Tag 54: Transaction Amount (Mandatory for Dynamic QR)
  if (isDynamic && formattedAmount) {
    payload += toTLV("54", formattedAmount);
  }

  // Tag 58: Country Code ("IN")
  payload += toTLV("58", "IN");

  // Tag 59: Merchant Name (Up to 25 chars)
  const safeName = params.payeeName.trim().slice(0, 25);
  payload += toTLV("59", safeName);

  // Tag 60: Merchant City (Up to 15 chars)
  const city = (params.merchantCity || "Bengaluru").trim().slice(0, 15);
  payload += toTLV("60", city);

  // Tag 61: Postal Code (Optional)
  if (params.postalCode) {
    payload += toTLV("61", params.postalCode.trim().slice(0, 10));
  }

  // Tag 62: Additional Data Field Template
  // Sub-tag 01: Bill / Reference Number
  // Sub-tag 05: Note / Purpose
  let additionalData = toTLV("01", params.transactionRef.trim().slice(0, 25));
  if (params.transactionNote) {
    additionalData += toTLV("05", params.transactionNote.trim().slice(0, 25));
  }
  payload += toTLV("62", additionalData);

  // Tag 63: CRC-16 Checksum
  // Prefix "6304" appended before CRC calculation
  const preCrc = `${payload}6304`;
  const checksum = calculateCRC16CCITT(preCrc);
  const emvcoPayload = `${preCrc}${checksum}`;

  return {
    upiUri,
    emvcoPayload,
    vpa: params.vpa.trim(),
    amount: formattedAmount || "0.00",
    transactionRef: params.transactionRef.trim(),
    isDynamic,
  };
}

/**
 * Validates the CRC-16 checksum of an EMVCo / BharatQR payload.
 */
export function verifyBharatQRChecksum(emvcoPayload: string): boolean {
  if (!emvcoPayload || emvcoPayload.length < 8) return false;
  const tag63Index = emvcoPayload.lastIndexOf("6304");
  if (tag63Index === -1 || tag63Index + 8 !== emvcoPayload.length) return false;

  const dataPart = emvcoPayload.slice(0, tag63Index + 4);
  const expectedCrc = emvcoPayload.slice(tag63Index + 4).toUpperCase();
  const calculatedCrc = calculateCRC16CCITT(dataPart);

  return expectedCrc === calculatedCrc;
}

/**
 * Parses and validates an existing UPI Intent or QR URL.
 */
export function parseUPIIntentUrl(rawUrl: string): ParsedUPIIntent {
  if (!rawUrl || typeof rawUrl !== "string") {
    throw new Error("Invalid UPI URL string provided.");
  }

  const match = rawUrl.match(/^([a-zA-Z0-9_-]+):\/\/(?:upi\/)?pay\?(.*)$/);
  if (!match) {
    throw new Error(`Not a valid UPI Intent URL: '${rawUrl}'`);
  }

  const appScheme = match[1];
  const searchParams = new URLSearchParams(match[2]);

  const vpa = searchParams.get("pa");
  if (!vpa || !isValidVPA(vpa)) {
    throw new Error(`Missing or invalid VPA ('pa') in URL: '${vpa}'`);
  }

  const payeeName = searchParams.get("pn");
  if (!payeeName) {
    throw new Error("Missing payee name ('pn') in UPI URL.");
  }

  const amountStr = searchParams.get("am");
  let amountInRupees: number | undefined;
  if (amountStr) {
    const parsed = parseFloat(amountStr);
    if (!isNaN(parsed) && parsed >= 0) {
      amountInRupees = parsed;
    }
  }

  const currency = searchParams.get("cu") || "INR";
  const transactionNote = searchParams.get("tn") || undefined;
  const transactionRef = searchParams.get("tr") || undefined;
  const merchantCategoryCode = searchParams.get("mc") || undefined;
  const mode = searchParams.get("mode") || undefined;

  return {
    vpa,
    payeeName,
    amountInRupees,
    currency,
    transactionNote,
    transactionRef,
    merchantCategoryCode,
    mode,
    rawUrl,
    appScheme,
  };
}
