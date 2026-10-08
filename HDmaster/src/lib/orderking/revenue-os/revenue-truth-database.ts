import { createHash } from "node:crypto";
import { assertReality } from "./reality-engine";
import { getSql, type Sql } from "../../../lib/db";

export type FinancialEventType =
  | "invoice_created"
  | "payment_pending"
  | "payment_confirmed"
  | "refund"
  | "chargeback";

export interface FinancialEvent {
  id: string;
  type: FinancialEventType;
  amount: number;
  currency: string;
  provider: "KING_PAY_UPI" | "RAZORPAY" | "STRIPE" | "BANK_WIRE" | "SYSTEM_AUDIT";
  providerEventId: string;
  timestamp: string;
  verified: boolean;
  previousEventHash: string;
  eventHash: string;
  metadata?: Record<string, unknown>;
}

export class RevenueTruthDatabase {
  
  private calculateHash(event: Omit<FinancialEvent, "eventHash">): string {
    const payload = JSON.stringify({
      id: event.id,
      type: event.type,
      amount: event.amount,
      currency: event.currency,
      provider: event.provider,
      providerEventId: event.providerEventId,
      timestamp: event.timestamp,
      verified: event.verified,
      previousEventHash: event.previousEventHash,
      metadata: event.metadata,
    });
    return createHash("sha256").update(payload).digest("hex");
  }

  async recordFinancialEvent(params: {
    type: FinancialEventType;
    amount: number;
    currency: string;
    provider: FinancialEvent["provider"];
    providerEventId: string;
    verified: boolean;
    evidence?: string[];
    metadata?: Record<string, unknown>;
  }): Promise<FinancialEvent> {
    if (params.type === "payment_confirmed") {
      if (!params.providerEventId || params.providerEventId.trim().length === 0) {
        throw new Error("REVENUE_TRUTH_VIOLATION: Cannot confirm payment without valid provider event ID or bank reference (UTR).");
      }
      const reality = assertReality({
        subject: `Payment ${params.providerEventId}`,
        data: params,
        evidence: params.evidence,
        status: "Verified",
      });
      if (!reality.claimable) {
        throw new Error("REVENUE_TRUTH_VIOLATION: Payment confirmation requires verifiable evidence.");
      }
      params.verified = true;
    }

    const sql = await getSql();
    return await sql.transaction(async (tx: Sql) => {
      const lastEventRows = await tx`SELECT event_hash FROM financial_events ORDER BY created_at DESC LIMIT 1`;
      const lastHash = lastEventRows.length > 0 ? (lastEventRows[0] as any).event_hash : "GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000";

      const id = `FE-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const timestamp = new Date().toISOString();

      const partialEvent = {
        id,
        type: params.type,
        amount: params.amount,
        currency: params.currency,
        provider: params.provider,
        providerEventId: params.providerEventId,
        timestamp,
        verified: params.verified,
        previousEventHash: lastHash,
        metadata: params.metadata || {},
      };

      const eventHash = this.calculateHash(partialEvent);
      const fullEvent: FinancialEvent = {
        ...partialEvent,
        eventHash,
      };

      await tx`
        INSERT INTO financial_events (id, event_type, amount, currency, provider, provider_event_id, verified, previous_event_hash, event_hash, metadata, created_at)
        VALUES (${id}, ${fullEvent.type}, ${fullEvent.amount}, ${fullEvent.currency}, ${fullEvent.provider}, ${fullEvent.providerEventId}, ${fullEvent.verified}, ${fullEvent.previousEventHash}, ${fullEvent.eventHash}, ${fullEvent.metadata as any}, NOW())
      `;

      return fullEvent;
    });
  }

  async getEvents(): Promise<FinancialEvent[]> {
    const sql = await getSql();
    const rows = await sql`SELECT * FROM financial_events ORDER BY created_at ASC`;
    return rows.map((r: any) => ({
      id: r.id,
      type: r.event_type,
      amount: parseFloat(r.amount),
      currency: r.currency,
      provider: r.provider,
      providerEventId: r.provider_event_id,
      timestamp: r.created_at,
      verified: r.verified,
      previousEventHash: r.previous_event_hash,
      eventHash: r.event_hash,
      metadata: r.metadata
    }));
  }

  async verifyLedgerIntegrity(): Promise<{ isValid: boolean; checkedCount: number; errorIndex?: number }> {
    const events = await this.getEvents();
    let prev = "GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000";
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      if (e.previousEventHash !== prev) return { isValid: false, checkedCount: i, errorIndex: i };
      const recomputed = this.calculateHash({
        id: e.id,
        type: e.type,
        amount: e.amount,
        currency: e.currency,
        provider: e.provider,
        providerEventId: e.providerEventId,
        timestamp: e.timestamp,
        verified: e.verified,
        previousEventHash: e.previousEventHash,
        metadata: e.metadata,
      });
      if (recomputed !== e.eventHash) return { isValid: false, checkedCount: i, errorIndex: i };
      prev = e.eventHash;
    }
    return { isValid: true, checkedCount: events.length };
  }

  async getVerifiedRevenue(currency: string = "INR"): Promise<number> {
    const sql = await getSql();
    const result = await sql`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM financial_events 
      WHERE event_type = 'payment_confirmed' AND verified = true AND currency = ${currency}
    `;
    return parseFloat((result[0] as any).total);
  }

  async getPendingPayments(currency: string = "INR"): Promise<number> {
    const sql = await getSql();
    const result = await sql`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM financial_events 
      WHERE event_type = 'payment_pending' AND currency = ${currency}
    `;
    return parseFloat((result[0] as any).total);
  }
}

export const revenueTruthDB = new RevenueTruthDatabase();
