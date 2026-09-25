import { fraudShield, OrderRiskContext } from '../security/fraud-shield';
import { getSql } from '@/lib/db';
import * as crypto from 'crypto';

export type LedgerAccountType =
  | "RESTAURANT_PAYABLE"
  | "RIDER_PAYABLE"
  | "PLATFORM_FEE_REVENUE"
  | "COMMISSION_ESCROW"
  | "GST_OUTPUT_LIABILITY"
  | "REFUND_CLEARING"
  | "FOUNDER_VAULT"
  | "CUSTOMER_CASH_IN"
  | "BANK_CLEARING";

export interface LedgerEntry {
  entryId?: string;
  transactionId?: string;
  account: LedgerAccountType;
  direction: "DEBIT" | "CREDIT";
  amountPaise: number;
  entityId: string;
  memo: string;
  timestamp?: string;
}

export type SettlementState =
  | "CALCULATED"
  | "VALIDATED"
  | "APPROVED"
  | "INITIATED"
  | "PROVIDER_PENDING"
  | "PROVIDER_CONFIRMED"
  | "BANK_PROCESSING"
  | "PAID"
  | "FAILED"
  | "RETRYABLE"
  | "ESCALATED"
  | "FRAUD_FROZEN";

export interface LedgerTransaction {
  transactionId: string;
  idempotencyKey: string;
  orderId?: string;
  eventType: string;
  entries: LedgerEntry[];
  totalAmountPaise: number;
  timestamp: string;
  auditHash: string;
  previousHash: string;
  isFraudSuspicious?: boolean;
  fraudReasons?: string[];
  fraudScore?: number;
}

export interface SettlementBatch {
  batchId: string;
  entityId: string;
  entityType: "RESTAURANT" | "RIDER";
  periodStart: string;
  periodEnd: string;
  grossAmountPaise: number;
  deductionsPaise: number;
  commissionPaise: number;
  gstPaise: number;
  netPayoutPaise: number;
  state: SettlementState;
  idempotencyKey: string;
  payoutUpiOrAccountNumber: string;
  providerReference?: string;
  failureReason?: string;
  attemptsCount: number;
  createdAt: string;
  updatedAt: string;
}

export class CanonicalLedger {

  private generateHash(payload: string): string {
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  public async postTransaction(params: {
    idempotencyKey: string;
    eventType: string;
    orderId?: string;
    entries: LedgerEntry[];
    isFraudSuspicious?: boolean;
    fraudReasons?: string[];
    fraudScore?: number;
  }): Promise<LedgerTransaction> {
    const sql = await getSql();
    
    let totalDebit = 0;
    let totalCredit = 0;
    
    for (const entry of params.entries) {
      if (!Number.isInteger(entry.amountPaise) || entry.amountPaise < 0) {
        throw new Error(`Invalid entry amount: ${entry.amountPaise}`);
      }
      if (entry.direction === "DEBIT") totalDebit += entry.amountPaise;
      else if (entry.direction === "CREDIT") totalCredit += entry.amountPaise;
      else throw new Error(`Invalid direction: ${entry.direction}`);
    }

    if (totalDebit !== totalCredit) {
      throw new Error(`Double-entry violation: Debits (${totalDebit}) do not match Credits (${totalCredit}).`);
    }

    if (totalDebit === 0) {
      throw new Error("Transaction must have a non-zero value.");
    }

    const existing = await sql.query<any>("SELECT transaction_id FROM ledger_transactions WHERE idempotency_key = $1 LIMIT 1", [params.idempotencyKey]);
    if (existing && existing.length > 0) {
      const txId = existing[0].transaction_id;
      const txRows = await sql.query<any>("SELECT * FROM ledger_transactions WHERE transaction_id = $1", [txId]);
      const entryRows = await sql.query<any>("SELECT * FROM ledger_entries WHERE transaction_id = $1", [txId]);
      
      return {
        transactionId: txRows[0].transaction_id,
        idempotencyKey: txRows[0].idempotency_key,
        orderId: txRows[0].order_id,
        eventType: txRows[0].event_type,
        totalAmountPaise: parseInt(txRows[0].total_amount_paise),
        timestamp: txRows[0].timestamp,
        auditHash: txRows[0].audit_hash,
        previousHash: txRows[0].previous_hash,
        isFraudSuspicious: txRows[0].is_fraud_suspicious,
        fraudReasons: typeof txRows[0].fraud_reasons === 'string' ? JSON.parse(txRows[0].fraud_reasons) : txRows[0].fraud_reasons,
        fraudScore: txRows[0].fraud_score,
        entries: entryRows.map(e => ({
          entryId: e.entry_id,
          account: e.account,
          direction: e.direction,
          amountPaise: parseInt(e.amount_paise),
          entityId: e.entity_id,
          memo: e.memo
        }))
      };
    }

    const transactionId = "tx-" + crypto.randomUUID();
    const now = new Date().toISOString();

    const lastTx = await sql.query<any>("SELECT audit_hash FROM ledger_transactions ORDER BY created_at DESC LIMIT 1", []);
    const previousHash = lastTx.length > 0 ? lastTx[0].audit_hash : "0000000000000000000000000000000000000000000000000000000000000000";

    const canonicalPayload = JSON.stringify({
      transactionId,
      idempotencyKey: params.idempotencyKey,
      previousHash,
      totalAmountPaise: totalDebit,
      entries: params.entries.map(e => ({ account: e.account, direction: e.direction, amountPaise: e.amountPaise, entityId: e.entityId }))
    });

    const auditHash = this.generateHash(canonicalPayload);
    const fraudReasonsJson = params.fraudReasons ? JSON.stringify(params.fraudReasons) : null;

    await sql.query("BEGIN", []);
    try {
      await sql.query(
        "INSERT INTO ledger_transactions (transaction_id, idempotency_key, order_id, event_type, total_amount_paise, timestamp, audit_hash, previous_hash, is_fraud_suspicious, fraud_reasons, fraud_score) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
        [transactionId, params.idempotencyKey, params.orderId || null, params.eventType, totalDebit, now, auditHash, previousHash, params.isFraudSuspicious || false, fraudReasonsJson, params.fraudScore || 0]
      );

      for (const entry of params.entries) {
        const entryId = "ent-" + crypto.randomUUID();
        await sql.query(
          "INSERT INTO ledger_entries (entry_id, transaction_id, account, direction, amount_paise, entity_id, memo, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
          [entryId, transactionId, entry.account, entry.direction, entry.amountPaise, entry.entityId, entry.memo, now]
        );
      }
      await sql.query("COMMIT", []);
    } catch (err) {
      await sql.query("ROLLBACK", []);
      throw err;
    }

    return {
      transactionId,
      idempotencyKey: params.idempotencyKey,
      orderId: params.orderId,
      eventType: params.eventType,
      totalAmountPaise: totalDebit,
      timestamp: now,
      auditHash,
      previousHash,
      isFraudSuspicious: params.isFraudSuspicious,
      fraudReasons: params.fraudReasons,
      fraudScore: params.fraudScore,
      entries: params.entries
    };
  }

  public async captureOrderPayment(params: {
    orderId: string;
    totalAmountPaise: number;
    platformFeePaise: number;
    deliveryFeePaise: number;
    gstPaise: number;
    restaurantId: string;
    idempotencyKey: string;
    orderRiskContext?: OrderRiskContext;
  }): Promise<LedgerTransaction> {
    const netFoodPaise = params.totalAmountPaise - params.platformFeePaise - params.deliveryFeePaise - params.gstPaise;

    let isFraudSuspicious = false;
    let fraudReasons: string[] = [];
    let fraudScore = 0;

    if (params.orderRiskContext) {
      const evaluation = fraudShield.evaluateOrderRisk(params.orderRiskContext);
      isFraudSuspicious = evaluation.isFraudulent;
      fraudReasons = evaluation.reasons;
      fraudScore = evaluation.riskScore;
    }

    return this.postTransaction({
      idempotencyKey: params.idempotencyKey,
      eventType: "ORDER_PAYMENT_CAPTURED",
      orderId: params.orderId,
      isFraudSuspicious,
      fraudReasons,
      fraudScore,
      entries: [
        { account: "BANK_CLEARING", direction: "DEBIT", amountPaise: params.totalAmountPaise, entityId: "GATEWAY", memo: `Customer UPI capture for order #${params.orderId}` },
        { account: "RESTAURANT_PAYABLE", direction: "CREDIT", amountPaise: netFoodPaise, entityId: params.restaurantId, memo: `Net food sales payable for order #${params.orderId}` },
        { account: "PLATFORM_FEE_REVENUE", direction: "CREDIT", amountPaise: params.platformFeePaise, entityId: "PLATFORM", memo: `Convenience fee revenue on order #${params.orderId}` },
        { account: "RIDER_PAYABLE", direction: "CREDIT", amountPaise: params.deliveryFeePaise, entityId: "RIDER_POOL", memo: `Delivery fee allocated to rider on order #${params.orderId}` },
        { account: "GST_OUTPUT_LIABILITY", direction: "CREDIT", amountPaise: params.gstPaise, entityId: "GOVT_TAX", memo: `18% GST output tax liability on order #${params.orderId}` },
      ],
    });
  }

  public async createSettlementBatch(params: {
    entityId: string;
    entityType: "RESTAURANT" | "RIDER";
    periodStart: string;
    periodEnd: string;
    grossAmountPaise: number;
    deductionsPaise: number;
    commissionPaise: number;
    gstPaise: number;
    payoutUpiOrAccountNumber: string;
    idempotencyKey: string;
  }): Promise<SettlementBatch> {
    const sql = await getSql();
    
    const existing = await sql.query<any>("SELECT * FROM settlement_batches WHERE idempotency_key = $1 LIMIT 1", [params.idempotencyKey]);
    if (existing && existing.length > 0) {
      const b = existing[0];
      return {
        batchId: b.batch_id, entityId: b.entity_id, entityType: b.entity_type, periodStart: b.period_start, periodEnd: b.period_end,
        grossAmountPaise: parseInt(b.gross_amount_paise), deductionsPaise: parseInt(b.deductions_paise), commissionPaise: parseInt(b.commission_paise),
        gstPaise: parseInt(b.gst_paise), netPayoutPaise: parseInt(b.net_payout_paise), state: b.state, idempotencyKey: b.idempotency_key,
        payoutUpiOrAccountNumber: b.payout_upi_or_account_number, providerReference: b.provider_reference, failureReason: b.failure_reason,
        attemptsCount: b.attempts_count, createdAt: b.created_at, updatedAt: b.updated_at
      };
    }

    const netPayoutPaise = params.grossAmountPaise - params.deductionsPaise - params.commissionPaise - params.gstPaise;
    if (netPayoutPaise < 0) {
      throw new Error(`Net settlement cannot be negative: ₹${(netPayoutPaise / 100).toFixed(2)}`);
    }

    const batchId = "stl-" + crypto.randomUUID();
    const now = new Date().toISOString();

    await sql.query(
      "INSERT INTO settlement_batches (batch_id, entity_id, entity_type, period_start, period_end, gross_amount_paise, deductions_paise, commission_paise, gst_paise, net_payout_paise, state, idempotency_key, payout_upi_or_account_number, attempts_count, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)",
      [batchId, params.entityId, params.entityType, params.periodStart, params.periodEnd, params.grossAmountPaise, params.deductionsPaise, params.commissionPaise, params.gstPaise, netPayoutPaise, "CALCULATED", params.idempotencyKey, params.payoutUpiOrAccountNumber, 0, now, now]
    );

    return {
      batchId, entityId: params.entityId, entityType: params.entityType, periodStart: params.periodStart, periodEnd: params.periodEnd,
      grossAmountPaise: params.grossAmountPaise, deductionsPaise: params.deductionsPaise, commissionPaise: params.commissionPaise,
      gstPaise: params.gstPaise, netPayoutPaise, state: "CALCULATED", idempotencyKey: params.idempotencyKey,
      payoutUpiOrAccountNumber: params.payoutUpiOrAccountNumber, attemptsCount: 0, createdAt: now, updatedAt: now
    };
  }

  public async advanceSettlementState(
    batchId: string,
    nextState: SettlementState,
    metadata?: { providerReference?: string; failureReason?: string }
  ): Promise<SettlementBatch> {
    const sql = await getSql();
    
    const existing = await sql.query<any>("SELECT * FROM settlement_batches WHERE batch_id = $1", [batchId]);
    if (!existing || existing.length === 0) {
      throw new Error(`Settlement batch '${batchId}' not found.`);
    }
    
    const batch = existing[0];
    const validTransitions: Record<string, string[]> = {
      CALCULATED: ["VALIDATED", "FAILED", "FRAUD_FROZEN"],
      VALIDATED: ["APPROVED", "FAILED", "FRAUD_FROZEN"],
      APPROVED: ["INITIATED", "FAILED", "FRAUD_FROZEN"],
      INITIATED: ["PROVIDER_PENDING", "FAILED"],
      PROVIDER_PENDING: ["PROVIDER_CONFIRMED", "FAILED", "RETRYABLE"],
      PROVIDER_CONFIRMED: ["BANK_PROCESSING", "PAID", "FAILED"],
      BANK_PROCESSING: ["PAID", "FAILED", "ESCALATED"],
      PAID: [],
      FAILED: ["RETRYABLE", "ESCALATED"],
      RETRYABLE: ["INITIATED", "FAILED"],
      ESCALATED: ["APPROVED", "FAILED"],
      FRAUD_FROZEN: ["VALIDATED", "FAILED", "ESCALATED"],
    };

    const allowed = validTransitions[batch.state] || [];
    if (!allowed.includes(nextState)) {
      throw new Error(`Invalid settlement state transition from '${batch.state}' to '${nextState}'.`);
    }

    const attempts = nextState === "INITIATED" ? batch.attempts_count + 1 : batch.attempts_count;
    const now = new Date().toISOString();

    await sql.query(
      "UPDATE settlement_batches SET state = $1, provider_reference = COALESCE($2, provider_reference), failure_reason = COALESCE($3, failure_reason), attempts_count = $4, updated_at = $5 WHERE batch_id = $6",
      [nextState, metadata?.providerReference || null, metadata?.failureReason || null, attempts, now, batchId]
    );

    if (nextState === "PAID") {
      await this.postTransaction({
        idempotencyKey: "payout-settled-" + batchId,
        eventType: batch.entity_type === "RESTAURANT" ? "MERCHANT_PAYOUT_SETTLED" : "RIDER_PAYOUT_SETTLED",
        entries: [
          { account: batch.entity_type === "RESTAURANT" ? "RESTAURANT_PAYABLE" : "RIDER_PAYABLE", direction: "DEBIT", amountPaise: parseInt(batch.net_payout_paise), entityId: batch.entity_id, memo: `Settlement payout disbursed for batch #${batchId}` },
          { account: "BANK_CLEARING", direction: "CREDIT", amountPaise: parseInt(batch.net_payout_paise), entityId: "BANK", memo: `Funds debited from operational bank for batch #${batchId}` },
        ],
      });
    }

    const updated = await sql.query<any>("SELECT * FROM settlement_batches WHERE batch_id = $1", [batchId]);
    const b = updated[0];
    return {
      batchId: b.batch_id, entityId: b.entity_id, entityType: b.entity_type, periodStart: b.period_start, periodEnd: b.period_end,
      grossAmountPaise: parseInt(b.gross_amount_paise), deductionsPaise: parseInt(b.deductions_paise), commissionPaise: parseInt(b.commission_paise),
      gstPaise: parseInt(b.gst_paise), netPayoutPaise: parseInt(b.net_payout_paise), state: b.state, idempotencyKey: b.idempotency_key,
      payoutUpiOrAccountNumber: b.payout_upi_or_account_number, providerReference: b.provider_reference, failureReason: b.failure_reason,
      attemptsCount: b.attempts_count, createdAt: b.created_at, updatedAt: b.updated_at
    };
  }

  public async getAccountBalancePaise(account: LedgerAccountType): Promise<number> {
    const sql = await getSql();
    const rows = await sql.query<any>("SELECT SUM(CASE WHEN direction = 'CREDIT' THEN amount_paise ELSE -amount_paise END) as balance FROM ledger_entries WHERE account = $1", [account]);
    return rows.length > 0 && rows[0].balance ? parseInt(rows[0].balance) : 0;
  }

  public async getAccountBalanceInr(account: LedgerAccountType): Promise<number> {
    const paise = await this.getAccountBalancePaise(account);
    return parseFloat((paise / 100).toFixed(2));
  }

  public async getSettlementBatch(batchId: string): Promise<any> {
    const sql = await getSql();
    const rows = await sql.query<any>("SELECT * FROM settlement_batches WHERE batch_id = $1", [batchId]);
    return rows.length > 0 ? rows[0] : undefined;
  }

  public async listSettlementBatches(): Promise<any[]> {
    const sql = await getSql();
    const rows = await sql.query<any>("SELECT * FROM settlement_batches", []);
    return rows;
  }

  public async getTransaction(txId: string): Promise<any> {
    const sql = await getSql();
    const rows = await sql.query<any>("SELECT * FROM ledger_transactions WHERE transaction_id = $1", [txId]);
    return rows.length > 0 ? rows[0] : undefined;
  }

  public async listTransactions(): Promise<any[]> {
    const sql = await getSql();
    const rows = await sql.query<any>("SELECT * FROM ledger_transactions ORDER BY created_at DESC", []);
    return rows;
  }

  public async verifyLedgerChainIntegrity(): Promise<{ isValid: boolean; totalTransactions: number; tamperedTxId?: string }> {
    const sql = await getSql();
    const txList = await sql.query<any>("SELECT * FROM ledger_transactions ORDER BY created_at ASC", []);
    
    let prevHash = "0000000000000000000000000000000000000000000000000000000000000000";

    for (const tx of txList) {
      if (tx.previous_hash !== prevHash) {
        return { isValid: false, totalTransactions: txList.length, tamperedTxId: tx.transaction_id };
      }
      
      const entryRows = await sql.query<any>("SELECT * FROM ledger_entries WHERE transaction_id = $1", [tx.transaction_id]);
      const entries = entryRows.map((e: any) => ({ account: e.account, direction: e.direction, amountPaise: parseInt(e.amount_paise), entityId: e.entity_id }));

      const canonicalPayload = JSON.stringify({
        transactionId: tx.transaction_id,
        idempotencyKey: tx.idempotency_key,
        previousHash: prevHash,
        totalAmountPaise: parseInt(tx.total_amount_paise),
        entries
      });

      const expectedHash = this.generateHash(canonicalPayload);

      if (tx.audit_hash !== expectedHash) {
        return { isValid: false, totalTransactions: txList.length, tamperedTxId: tx.transaction_id };
      }
      prevHash = tx.audit_hash;
    }

    return { isValid: true, totalTransactions: txList.length };
  }
}

export const canonicalLedger = new CanonicalLedger();
