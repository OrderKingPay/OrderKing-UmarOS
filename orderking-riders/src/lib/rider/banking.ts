/**
 * OrderKing Rider Banking & Instant RazorpayX Payout Service
 *
 * Dispatches real-time automated payouts and instant on-demand withdrawals
 * for fleet delivery riders via RazorpayX (UPI / IMPS).
 */

export interface RiderPayoutRequest {
  riderId: string;
  riderName: string;
  amountPaise: number;
  vpa?: string | null;
  accountNumber?: string | null;
  ifsc?: string | null;
  referenceId: string;
  narration?: string;
}

export interface RiderPayoutResult {
  success: boolean;
  status: "queued" | "pending" | "processing" | "processed" | "paid" | "failed";
  payoutId?: string;
  utr?: string | null;
  reference: string;
  mode: "UPI" | "IMPS" | "NEFT";
  error?: string;
}

function getEnv(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return undefined;
}

/**
 * Returns whether live RazorpayX banking credentials are configured.
 */
export function isRiderBankingLive(): boolean {
  const keyId = (getEnv("RAZORPAYX_KEY_ID") || getEnv("RAZORPAY_KEY_ID") || "").trim();
  const keySecret = (getEnv("RAZORPAYX_KEY_SECRET") || getEnv("RAZORPAY_KEY_SECRET") || "").trim();
  return Boolean(keyId && keySecret);
}

/**
 * Dispatches an instant or daily settlement payout to a rider via RazorpayX.
 */
export async function executeRiderRazorpayXPayout(
  req: RiderPayoutRequest,
): Promise<RiderPayoutResult> {
  const keyId = (getEnv("RAZORPAYX_KEY_ID") || getEnv("RAZORPAY_KEY_ID") || "").trim();
  const keySecret = (getEnv("RAZORPAYX_KEY_SECRET") || getEnv("RAZORPAY_KEY_SECRET") || "").trim();
  const accountNumber = (
    getEnv("RAZORPAYX_ACCOUNT_NUMBER") ||
    getEnv("RAZORPAY_MERCHANT_ACCOUNT_ID") ||
    getEnv("RAZORPAY_ACCOUNT_NUMBER") ||
    "2323230000000000"
  ).trim();

  const isUpi = Boolean(req.vpa?.trim());
  const mode: "UPI" | "IMPS" | "NEFT" = isUpi
    ? "UPI"
    : req.amountPaise <= 50000000
    ? "IMPS"
    : "NEFT";

  // Strict Fail-Closed Zero-Simulation Gate
  if (!keyId || !keySecret) {
    throw new RiderError(
      "GATEWAY_NOT_CONFIGURED",
      "RazorpayX banking payout gateway credentials are not configured on the server",
      503
    );
  }

  const fundAccount = isUpi
    ? {
        account_type: "vpa",
        vpa: { address: req.vpa!.trim() },
        contact: {
          name: req.riderName.trim() || "OrderKing Rider",
          type: "employee",
        },
      }
    : {
        account_type: "bank_account",
        bank_account: {
          name: req.riderName.trim() || "OrderKing Rider",
          ifsc: (req.ifsc || "").toUpperCase().trim(),
          account_number: (req.accountNumber || "").trim(),
        },
        contact: {
          name: req.riderName.trim() || "OrderKing Rider",
          type: "employee",
        },
      };

  const payload = {
    account_number: accountNumber,
    fund_account: fundAccount,
    amount: req.amountPaise,
    currency: "INR",
    mode,
    purpose: "payout",
    queue_if_low_balance: true,
    reference_id: req.referenceId,
    narration: req.narration || "OrderKing Rider Payout",
  };

  const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  try {
    const res = await fetch("https://api.razorpay.com/v1/payouts", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
        "X-Payout-Idempotency": req.referenceId,
        "X-Razorpay-Idempotency-Key": req.referenceId,
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok) {
      const errorObj = (data?.error as Record<string, unknown>) || {};
      const msg = String(errorObj.description || data.message || `RazorpayX HTTP ${res.status}`);
      return {
        success: false,
        status: "failed",
        reference: req.referenceId,
        mode,
        error: msg,
      };
    }

    const rawStatus = String(data.status || "processing").toLowerCase();
    const finalStatus: RiderPayoutResult["status"] =
      rawStatus === "processed"
        ? "processed"
        : rawStatus === "processing"
        ? "processing"
        : rawStatus === "queued"
        ? "queued"
        : "pending";

    return {
      success: true,
      status: finalStatus,
      payoutId: String(data.id || ""),
      utr: data.utr ? String(data.utr) : null,
      reference: req.referenceId,
      mode,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      status: "failed",
      reference: req.referenceId,
      mode,
      error: msg,
    };
  }
}
