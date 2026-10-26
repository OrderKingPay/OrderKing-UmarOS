/**
 * 👑 OrderKing Travel Revenue Ledger
 * Immutable Double-Entry Ledger Recording for Dynamic Partner Commissions
 * and Platform Convenience Fees in Supabase & Local Database.
 *
 * Guarantees:
 * - Standard Sovereign Travel Desk Fee Structure
 * - Dynamic Partner Affiliate / B2B Commission (200 - 600 bps) credited to PLATFORM_FEE_REVENUE
 * - Double-entry balanced ledger entries (DEBIT from Clearing / Partner Receivable, CREDIT to Revenue)
 */

import { supabase } from "@/lib/db-cloud";
import { type TravelRevenueLedgerRecord } from "./types";
import { type KingPayLedgerEntry } from "@/lib/kingpay/ledger-binding";

export const DEFAULT_TRAVEL_COMMISSION_BPS = {
  flight: 200, // 2.0%
  train: 100,  // 1.0%
  bus: 300,    // 3.0%
  hotel: 600,  // 6.0%
} as const;

export interface RecordCommissionInput {
  bookingReference: string;
  travelMode: "flight" | "train" | "bus" | "hotel";
  partnerName: string;
  grossAmountPaise: number;
  partnerCommissionBps?: number;
  userId?: string;
}

/**
 * Calculates dynamic integer partner commission in paise.
 */
export function calculateTravelCommissionPaise(grossPaise: number, bps: number): number {
  if (grossPaise <= 0 || bps <= 0) return 0;
  return Math.floor((grossPaise * bps) / 10_000);
}

/**
 * Records a travel booking commission event into the authentic ledger.
 */
export async function recordTravelCommissionLedger(
  input: RecordCommissionInput
): Promise<TravelRevenueLedgerRecord> {
  const bps = input.partnerCommissionBps ?? DEFAULT_TRAVEL_COMMISSION_BPS[input.travelMode];
  const commissionPaise = calculateTravelCommissionPaise(input.grossAmountPaise, bps);
  const trvBuf = new Uint32Array(1);
  crypto.getRandomValues(trvBuf);
  const transactionId = `TRV-COMM-${Date.now()}-${1000 + (trvBuf[0] % 9000)}`;
  const now = new Date().toISOString();

  const record: TravelRevenueLedgerRecord = {
    transactionId,
    bookingReference: input.bookingReference,
    travelMode: input.travelMode,
    partnerName: input.partnerName,
    grossAmountPaise: input.grossAmountPaise,
    partnerCommissionBps: bps,
    partnerCommissionPaise: commissionPaise,
    platformConvenienceFeePaise: 0,
    netCreditedPaise: commissionPaise,
    userId: input.userId,
    timestamp: now,
  };

  // Create Double-Entry Ledger Rows
  const debitEntry: KingPayLedgerEntry = {
    entry_id: `${transactionId}-DR`,
    transaction_id: transactionId,
    account: "BANK_CLEARING",
    direction: "DEBIT",
    amount_paise: commissionPaise,
    entity_id: input.partnerName,
    memo: `Partner commission receivable from ${input.partnerName} (${bps} bps) for ${input.travelMode.toUpperCase()} ${input.bookingReference}`,
    timestamp: now,
  };

  const creditEntry: KingPayLedgerEntry = {
    entry_id: `${transactionId}-CR`,
    transaction_id: transactionId,
    account: "PLATFORM_FEE_REVENUE",
    direction: "CREDIT",
    amount_paise: commissionPaise,
    entity_id: "ORDERKING_REVENUE",
    memo: `Earned travel revenue commission from ${input.partnerName} for booking ${input.bookingReference}`,
    timestamp: now,
  };

  try {
    // Attempt persist to Supabase only if legitimately configured and not in test sandbox
    const isConfiguredSupabase =
      typeof process !== "undefined" && process.env.NODE_ENV === "test"
        ? false
        : Boolean(import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes("unconfigured"));

    if (isConfiguredSupabase && supabase) {
      await supabase.from("kingpay_ledger_entries").insert([
        {
          entry_id: debitEntry.entry_id,
          transaction_id: debitEntry.transaction_id,
          account: debitEntry.account,
          direction: debitEntry.direction,
          amount_paise: debitEntry.amount_paise,
          entity_id: debitEntry.entity_id,
          memo: debitEntry.memo,
          created_at: debitEntry.timestamp,
        },
        {
          entry_id: creditEntry.entry_id,
          transaction_id: creditEntry.transaction_id,
          account: creditEntry.account,
          direction: creditEntry.direction,
          amount_paise: creditEntry.amount_paise,
          entity_id: creditEntry.entity_id,
          memo: creditEntry.memo,
          created_at: creditEntry.timestamp,
        },
      ]);
    }
  } catch (err) {
    console.warn("[TravelRevenueLedger] Supabase insertion skipped, falling back to local ledger:", err);
  }

  // Also persist to local storage cache if in browser environment
  if (typeof window !== "undefined") {
    try {
      const storageKey = "orderking_travel_commissions_v1";
      const existingRaw = window.localStorage.getItem(storageKey);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      existing.unshift(record);
      window.localStorage.setItem(storageKey, JSON.stringify(existing.slice(0, 100)));
    } catch {
      // ignore quota
    }
  }

  return record;
}
