/**
 * OrderKing & UmarOS Indian Payments: UPI Intent & Dynamic QR Fintech Engine
 * Strictly adheres to NPCI UPI 1.5+ Specification & RBI Payment Standards.
 */

export const UPI_CURRENCY = "INR" as const;
export const DEFAULT_PAYEE_NAME = "OrderKing";
export const NPCI_DYNAMIC_QR_MODE = "02"; // NPCI standard mode for dynamic pre-filled QR
export const NPCI_IN_APP_MODE = "04"; // NPCI standard mode for in-app merchant intent

export interface UpiIntentParams {
  payeeVpa: string; // 'pa'
  payeeName?: string; // 'pn' (defaults to 'OrderKing')
  amountInr: number; // 'am' (positive decimal in INR)
  transactionRef: string; // 'tr' (unique tracking reference, max 35 chars)
  transactionNote?: string; // 'tn' (optional memo/note)
  merchantCategoryCode?: string; // 'mc' (e.g. 5812 for restaurants)
  mode?: string; // 'mode' (e.g. 02 for dynamic QR, 04 for in-app)
  orgId?: string; // 'orgid' (optional partner ID)
  url?: string; // 'url' (optional reference link)
}

export interface UpiIntentResult {
  rawUri: string;
  params: {
    pa: string;
    pn: string;
    am: string;
    cu: "INR";
    tr: string;
    tn?: string;
    mc?: string;
    mode?: string;
    orgid?: string;
    url?: string;
  };
  deepLinks: {
    generic: string;
    phonepe: string;
    gpay: string;
    paytm: string;
    cred: string;
    bhim: string;
  };
}

export type DynamicQrMode = "ON_COUNTER" | "ON_APP";

export interface DynamicQrInput {
  mode: DynamicQrMode;
  payeeVpa: string;
  amountInr: number;
  transactionRef: string;
  payeeName?: string;
  orderId?: string;
  note?: string;
  merchantCategoryCode?: string;
  expiryMinutes?: number; // default: 10 mins for ON_COUNTER, 15 mins for ON_APP
  terminalId?: string; // For POS / Soundbox
  counterId?: string; // For store billing counters
  soundboxSync?: boolean; // For audio confirmation hook
  soundboxChannel?: string;
}

export interface DynamicQrContract {
  contractVersion: "2026.1";
  mode: DynamicQrMode;
  transactionRef: string;
  orderId?: string;
  payeeVpa: string;
  payeeName: string;
  amountInr: number;
  amountPaise: number;
  currency: "INR";
  rawPayload: string;
  qrImageUrl: string;
  expiresAt: string;
  ttlSeconds: number;
  terminalInfo?: {
    terminalId?: string;
    counterId?: string;
    soundboxSync?: boolean;
    soundboxChannel?: string;
  };
  appIntentLinks?: {
    generic: string;
    phonepe: string;
    gpay: string;
    paytm: string;
    cred: string;
    bhim: string;
  };
  status: "ACTIVE" | "EXPIRED" | "SETTLED" | "CANCELLED";
  idempotencyKey: string;
  createdAt: string;
}

// NPCI VPA Regex validation: username@bank
const VPA_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

/**
 * Validates a Virtual Payment Address (VPA / UPI ID)
 */
export function validateVpa(vpa: string): boolean {
  if (!vpa || typeof vpa !== "string") return false;
  return VPA_REGEX.test(vpa.trim());
}

/**
 * Formats numeric amount into exact UPI decimal string representation (e.g. 150.00 or 12.50)
 */
export function formatUpiAmount(amountInr: number): string {
  if (!Number.isFinite(amountInr) || amountInr <= 0) {
    throw new Error(`Invalid UPI amount: ${amountInr}. Must be a finite positive number.`);
  }
  return (Math.round(amountInr * 100) / 100).toFixed(2);
}

/**
 * Generates an NPCI-compliant UPI Intent URI and app-specific deep links.
 * Contract: `upi://pay?pa=...&pn=OrderKing&am=...&cu=INR&tr=...`
 */
export function generateUpiIntent(input: UpiIntentParams): UpiIntentResult {
  const vpa = input.payeeVpa?.trim();
  if (!vpa || !validateVpa(vpa)) {
    throw new Error(`Invalid payee VPA / UPI ID: "${input.payeeVpa}". Expected format: username@bank`);
  }

  const payeeName = input.payeeName?.trim() || DEFAULT_PAYEE_NAME;
  const formattedAmount = formatUpiAmount(input.amountInr);

  const tr = input.transactionRef?.trim();
  if (!tr) {
    throw new Error("Missing required transaction reference ('tr') for UPI intent payload");
  }
  if (!/^[a-zA-Z0-9_-]{1,35}$/.test(tr)) {
    throw new Error(`Invalid transaction reference ('tr'): "${tr}". Must be 1-35 alphanumeric characters or hyphens/underscores.`);
  }

  // Construct standard query parameters in canonical NPCI order
  const queryParams = new URLSearchParams();
  queryParams.set("pa", vpa);
  queryParams.set("pn", payeeName);
  queryParams.set("am", formattedAmount);
  queryParams.set("cu", UPI_CURRENCY);
  queryParams.set("tr", tr);

  if (input.transactionNote?.trim()) {
    queryParams.set("tn", input.transactionNote.trim());
  }

  if (input.merchantCategoryCode?.trim()) {
    queryParams.set("mc", input.merchantCategoryCode.trim());
  }

  if (input.mode?.trim()) {
    queryParams.set("mode", input.mode.trim());
  }

  if (input.orgId?.trim()) {
    queryParams.set("orgid", input.orgId.trim());
  }

  if (input.url?.trim()) {
    queryParams.set("url", input.url.trim());
  }

  const queryString = queryParams.toString();
  const rawUri = `upi://pay?${queryString}`;

  // App-specific deep link schemes widely used across India
  const deepLinks = {
    generic: rawUri,
    phonepe: `phonepe://pay?${queryString}`,
    gpay: `tez://upi/pay?${queryString}`,
    paytm: `paytmmp://pay?${queryString}`,
    cred: `cred://pay?${queryString}`,
    bhim: `bhim://pay?${queryString}`,
  };

  return {
    rawUri,
    params: {
      pa: vpa,
      pn: payeeName,
      am: formattedAmount,
      cu: UPI_CURRENCY,
      tr,
      ...(input.transactionNote ? { tn: input.transactionNote.trim() } : {}),
      ...(input.merchantCategoryCode ? { mc: input.merchantCategoryCode.trim() } : {}),
      ...(input.mode ? { mode: input.mode.trim() } : {}),
      ...(input.orgId ? { orgid: input.orgId.trim() } : {}),
      ...(input.url ? { url: input.url.trim() } : {}),
    },
    deepLinks,
  };
}

/**
 * Creates a UPI Dynamic QR Generation Contract for either On-Counter or On-App payments.
 * On-Counter: POS display, Soundbox terminal, printed receipts with soundbox sync & short TTL.
 * On-App: Direct intent app links with fallback QR code and transaction tracking.
 */
export function generateDynamicQrContract(input: DynamicQrInput): DynamicQrContract {
  const isCounter = input.mode === "ON_COUNTER";
  const defaultTtlMinutes = isCounter ? 10 : 15;
  const expiryMinutes = input.expiryMinutes && input.expiryMinutes > 0 ? input.expiryMinutes : defaultTtlMinutes;
  const ttlSeconds = expiryMinutes * 60;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();

  const upiIntent = generateUpiIntent({
    payeeVpa: input.payeeVpa,
    payeeName: input.payeeName || DEFAULT_PAYEE_NAME,
    amountInr: input.amountInr,
    transactionRef: input.transactionRef,
    transactionNote: input.note || (isCounter ? `Counter Bill ${input.counterId ?? ""}`.trim() : `OrderKing Payment`),
    merchantCategoryCode: input.merchantCategoryCode || "5812", // Default Food/Restaurant MCC
    mode: NPCI_DYNAMIC_QR_MODE,
  });

  const amountPaise = Math.round(input.amountInr * 100);
  const idempotencyKey = `upi_qr_${input.transactionRef}_${amountPaise}`;

  // Deterministic QR generation endpoint
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=10&data=${encodeURIComponent(upiIntent.rawUri)}`;

  const contract: DynamicQrContract = {
    contractVersion: "2026.1",
    mode: input.mode,
    transactionRef: input.transactionRef,
    orderId: input.orderId,
    payeeVpa: upiIntent.params.pa,
    payeeName: upiIntent.params.pn,
    amountInr: input.amountInr,
    amountPaise,
    currency: UPI_CURRENCY,
    rawPayload: upiIntent.rawUri,
    qrImageUrl,
    expiresAt,
    ttlSeconds,
    status: "ACTIVE",
    idempotencyKey,
    createdAt: now.toISOString(),
  };

  if (isCounter) {
    contract.terminalInfo = {
      terminalId: input.terminalId,
      counterId: input.counterId,
      soundboxSync: input.soundboxSync ?? true,
      soundboxChannel: input.soundboxChannel || (input.terminalId ? `soundbox:${input.terminalId}` : undefined),
    };
  }

  if (input.mode === "ON_APP") {
    contract.appIntentLinks = upiIntent.deepLinks;
  }

  return contract;
}

/**
 * Parses and verifies an incoming UPI URI payload against NPCI specifications
 */
export function parseUpiPayload(payload: string): {
  valid: boolean;
  scheme: string;
  params: Record<string, string>;
  error?: string;
} {
  try {
    if (!payload.startsWith("upi://pay?")) {
      return { valid: false, scheme: "", params: {}, error: "Payload must start with upi://pay?" };
    }
    const searchPart = payload.slice("upi://pay?".length);
    const searchParams = new URLSearchParams(searchPart);
    const params: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      params[key] = val;
    });

    if (!params.pa || !validateVpa(params.pa)) {
      return { valid: false, scheme: "upi", params, error: "Missing or invalid 'pa' (Payee VPA)" };
    }
    if (!params.pn) {
      return { valid: false, scheme: "upi", params, error: "Missing 'pn' (Payee Name)" };
    }
    if (!params.am || isNaN(Number(params.am)) || Number(params.am) <= 0) {
      return { valid: false, scheme: "upi", params, error: "Missing or invalid 'am' (Amount)" };
    }
    if (params.cu !== UPI_CURRENCY) {
      return { valid: false, scheme: "upi", params, error: `Invalid currency 'cu'. Expected ${UPI_CURRENCY}` };
    }
    if (!params.tr) {
      return { valid: false, scheme: "upi", params, error: "Missing required 'tr' (Transaction Reference)" };
    }

    return { valid: true, scheme: "upi", params };
  } catch (err) {
    return { valid: false, scheme: "", params: {}, error: (err as Error).message };
  }
}

/**
 * Checks whether a Dynamic QR contract has expired
 */
export function isDynamicQrExpired(contract: DynamicQrContract): boolean {
  return new Date(contract.expiresAt).getTime() <= Date.now();
}
