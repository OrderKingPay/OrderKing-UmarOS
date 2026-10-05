// Payment adapter boundary only. Real KingPay settlement must come from an
// approved provider/bank/PSP/ledger integration with durable database state.
// This in-memory implementation is intentionally fail-closed and cannot settle money.

export type TransactionType = "P2M_PAYMENT" | "P2P_TRANSFER" | "WALLET_LOAD" | "REFUND" | "CASHBACK";
export type TransactionStatus = "PENDING" | "SETTLED" | "FAILED" | "BLOCKED_AML";

export interface LedgerEntry {
  transactionId: string;
  idempotencyKey: string;
  type: TransactionType;
  amountInr: number;
  status: TransactionStatus;
  debitAccount: string;
  creditAccount: string;
  merchantNodalSplitInr: number;
  taxSplitInr: number;
  platformSplitInr: number;
  timestamp: string;
  amlFlag: boolean;
}

export class KingPayLedgerEngine {
  processPayment(
    _idempotencyKey: string,
    _senderId: string,
    _merchantId: string,
    _amountInr: number,
    _platformFeePct = 2,
  ): never {
    throw new Error("KingPay settlement is unavailable until a real regulated/provider-backed ledger is connected.");
  }

  getLedgerAuditTrail(): LedgerEntry[] {
    return [];
  }
}

export const kingpayLedgerEngine = new KingPayLedgerEngine();
