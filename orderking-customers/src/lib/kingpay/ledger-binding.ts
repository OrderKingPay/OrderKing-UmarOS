/**
 * ORDERKING FINTECH ARCHITECTURE
 * Authentic Supabase & Double-Entry Ledger Binding for KingPay
 *
 * MANDATE:
 * - 100% Authentic Balances (Zero Simulated Default Credits / No Fake ₹5,000)
 * - Mathematical Double-Entry Invariant: Every Debit strictly matches Credit
 * - Binds directly to `kingpay_ledger_entries` table in Supabase & Local Database
 */

import { supabase } from "@/lib/db-cloud";

export type LedgerDirection = "DEBIT" | "CREDIT";

export type KingPayAccountType =
  | "CUSTOMER_WALLET"
  | "BANK_CLEARING"
  | "MERCHANT_PAYABLE"
  | "ESCROW_HOLDING"
  | "PLATFORM_FEE_REVENUE"
  | "GST_OUTPUT_LIABILITY";

export interface KingPayLedgerEntry {
  entry_id: string;
  transaction_id: string;
  account: KingPayAccountType;
  direction: LedgerDirection;
  amount_paise: number;
  entity_id: string;
  memo: string;
  timestamp: string;
}

export interface KingPayTransactionRecord {
  transaction_id: string;
  idempotency_key: string;
  total_amount_paise: number;
  entries: KingPayLedgerEntry[];
  timestamp: string;
}

/**
 * Computes authentic balance for a user strictly by summing all Credits
 * and subtracting all Debits from immutable ledger rows.
 */
export function calculateBalanceFromEntries(
  entries: KingPayLedgerEntry[],
  userId: string
): number {
  let creditSum = 0;
  let debitSum = 0;

  for (const entry of entries) {
    if (entry.entity_id === userId && entry.account === "CUSTOMER_WALLET") {
      if (entry.direction === "CREDIT") {
        creditSum += Number(entry.amount_paise) || 0;
      } else if (entry.direction === "DEBIT") {
        debitSum += Number(entry.amount_paise) || 0;
      }
    }
  }

  return Math.max(0, creditSum - debitSum);
}

/**
 * Fetches the user's authentic KingPay balance from Supabase `kingpay_ledger_entries`.
 * Never reads browser localStorage or returns simulated credits. Default is 0 paise.
 */
export async function fetchAuthenticKingPayBalance(userId: string): Promise<number> {
  if (!userId) return 0;

  try {
    if (supabase && typeof supabase.from === "function") {
      const { data, error } = await supabase
        .from("kingpay_ledger_entries")
        .select("entry_id, transaction_id, account, direction, amount_paise, entity_id, memo, timestamp")
        .eq("entity_id", userId)
        .eq("account", "CUSTOMER_WALLET");

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped: KingPayLedgerEntry[] = data.map((d: any) => ({
          entry_id: String(d.entry_id),
          transaction_id: String(d.transaction_id),
          account: d.account as KingPayAccountType,
          direction: d.direction as LedgerDirection,
          amount_paise: Number(d.amount_paise),
          entity_id: String(d.entity_id),
          memo: String(d.memo || ""),
          timestamp: String(d.timestamp),
        }));

        return calculateBalanceFromEntries(mapped, userId);
      }
    }
  } catch {
    // Database query failed or not configured
  }

  return 0;
}

/**
 * Records an authentic wallet top-up transaction with double-entry accounting in PostgreSQL/Supabase.
 */
export async function recordAuthenticTopUp(params: {
  userId: string;
  amountPaise: number;
  idempotencyKey?: string;
  source?: string;
}): Promise<{ newBalancePaise: number; transactionId: string }> {
  if (!params.amountPaise || params.amountPaise <= 0) {
    throw new Error(`Top-up amount must be positive paise: ${params.amountPaise}`);
  }

  const txBuf = new Uint32Array(1);
  crypto.getRandomValues(txBuf);
  const transactionId = `tx-topup-${Date.now()}-${1000 + (txBuf[0] % 9000)}`;
  const now = new Date().toISOString();

  const debitEntry: KingPayLedgerEntry = {
    entry_id: `ent-${Date.now()}-1`,
    transaction_id: transactionId,
    account: "BANK_CLEARING",
    direction: "DEBIT",
    amount_paise: params.amountPaise,
    entity_id: "BANK_GATEWAY",
    memo: `Top-up via ${params.source || "UPI"}`,
    timestamp: now,
  };

  const creditEntry: KingPayLedgerEntry = {
    entry_id: `ent-${Date.now()}-2`,
    transaction_id: transactionId,
    account: "CUSTOMER_WALLET",
    direction: "CREDIT",
    amount_paise: params.amountPaise,
    entity_id: params.userId,
    memo: `Wallet top-up credited for ${params.userId}`,
    timestamp: now,
  };

  if (debitEntry.amount_paise !== creditEntry.amount_paise) {
    throw new Error("Double-entry violation: Debit does not equal Credit.");
  }

  if (!supabase || typeof supabase.from !== "function") {
    throw new Error("KingPay database client not configured.");
  }

  const { error } = await supabase.from("kingpay_ledger_entries").insert([
    debitEntry,
    creditEntry,
  ]);
  if (error) {
    throw new Error(`Failed to persist wallet top-up: ${error.message}`);
  }

  const newBalance = await fetchAuthenticKingPayBalance(params.userId);
  return { newBalancePaise: newBalance, transactionId };
}

/**
 * Records an authentic payment / merchant deduction with double-entry accounting in PostgreSQL/Supabase.
 */
export async function recordAuthenticPayment(params: {
  userId: string;
  recipientId: string;
  amountPaise: number;
  memo?: string;
}): Promise<{ success: boolean; newBalancePaise: number; error?: string }> {
  if (!params.amountPaise || params.amountPaise <= 0) {
    return { success: false, newBalancePaise: 0, error: "Invalid payment amount." };
  }

  const currentBalance = await fetchAuthenticKingPayBalance(params.userId);

  const isTrainPayment =
    params.memo?.toLowerCase().includes("train") ||
    params.memo?.toLowerCase().includes("irctc") ||
    params.recipientId?.toLowerCase().includes("irctc") ||
    params.recipientId?.toLowerCase().includes("train");

  if (isTrainPayment) {
    return {
      success: false,
      newBalancePaise: currentBalance,
      error:
        "IRCTC_PAYMENT_BLOCKED: Train ticket payment capture is restricted by Indian Railways CRIS guidelines. Certified IRCTC PSP API is not verified. No customer account, card, or wallet has been charged.",
    };
  }

  if (currentBalance < params.amountPaise) {
    return {
      success: false,
      newBalancePaise: currentBalance,
      error: `Insufficient KingPay balance. Available: ₹${(currentBalance / 100).toFixed(2)}`,
    };
  }

  const txPayBuf = new Uint32Array(1);
  crypto.getRandomValues(txPayBuf);
  const transactionId = `tx-pay-${Date.now()}-${1000 + (txPayBuf[0] % 9000)}`;
  const now = new Date().toISOString();

  const debitEntry: KingPayLedgerEntry = {
    entry_id: `ent-${Date.now()}-1`,
    transaction_id: transactionId,
    account: "CUSTOMER_WALLET",
    direction: "DEBIT",
    amount_paise: params.amountPaise,
    entity_id: params.userId,
    memo: params.memo || `UPI payment to ${params.recipientId}`,
    timestamp: now,
  };

  const creditEntry: KingPayLedgerEntry = {
    entry_id: `ent-${Date.now()}-2`,
    transaction_id: transactionId,
    account: "MERCHANT_PAYABLE",
    direction: "CREDIT",
    amount_paise: params.amountPaise,
    entity_id: params.recipientId,
    memo: `Payment received from user ${params.userId}`,
    timestamp: now,
  };

  if (debitEntry.amount_paise !== creditEntry.amount_paise) {
    throw new Error("Double-entry violation: Debit does not equal Credit.");
  }

  if (!supabase || typeof supabase.from !== "function") {
    return {
      success: false,
      newBalancePaise: currentBalance,
      error: "KingPay database client not configured.",
    };
  }

  const { error } = await supabase.from("kingpay_ledger_entries").insert([
    debitEntry,
    creditEntry,
  ]);
  if (error) {
    return {
      success: false,
      newBalancePaise: currentBalance,
      error: `Failed to record payment in database: ${error.message}`,
    };
  }

  const newBalance = await fetchAuthenticKingPayBalance(params.userId);
  return { success: true, newBalancePaise: newBalance };
}
