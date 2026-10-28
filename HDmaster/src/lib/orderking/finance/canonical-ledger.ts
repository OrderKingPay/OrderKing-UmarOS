import { fraudShield, type OrderRiskContext } from '../security/fraud-shield.ts';
import { getSql, type Sql } from '../../db.ts';
import * as crypto from 'crypto';
import { assertSafePaise } from '../revenue/tax-calculator.ts';

export const SOVEREIGN_NPCI_UPI_VPA = "orderking@ybl";
export const SECONDARY_NPCI_UPI_VPA = "9395065587@ybl";
export const LATE_NIGHT_START_HOUR_IST = 23; // 11:00 PM IST
export const LATE_NIGHT_END_HOUR_IST = 4;   // 04:00 AM IST

export function isLateNightCurfewIst(date = new Date()) {
  const istDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hour = istDate.getHours();
  return hour >= LATE_NIGHT_START_HOUR_IST || hour < LATE_NIGHT_END_HOUR_IST;
}

export type LedgerAccountType =
  | "RESTAURANT_PAYABLE"
  | "RIDER_PAYABLE"
  | "PLATFORM_FEE_REVENUE"
  | "COMMISSION_ESCROW"
  | "GST_OUTPUT_LIABILITY"
  | "REFUND_CLEARING"
  | "FOUNDER_VAULT"
  | "CUSTOMER_CASH_IN"
  | "BANK_CLEARING"
  | "SUBSCRIPTION_REVENUE"
  | "MERCHANT_WALLET"
  | "TCS_PAYABLE_LIABILITY"
  | "TDS_PAYABLE_LIABILITY"
  | "FOOD_GST_9_5_LIABILITY"
  | "CUSTOMER_WALLET"
  | "ESCROW_HOLDING"
  | "JOB_MILESTONE_ESCROW"
  | "FREELANCER_PAYABLE"
  | "USER_WALLET"
  | "TRAVEL_PROVIDER_PAYABLE"
  | "PROMO_MARKETING_EXPENSE";

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

export const MANDATORY_OTA_CONVENIENCE_FEE_PAISE = {
  FLIGHT: 39_900, // ₹399 per passenger
  TRAIN: 4_000,   // ₹40 per ticket/passenger
  HOTEL: 25_000,  // ₹250 per room/booking
  BUS: 5_000,     // ₹50 per bus passenger
  CAB: 5_000,     // ₹50 per cab booking
} as const;

export interface DynamicTravelCheckoutSplitParams {
  bookingId: string;
  serviceType: "FLIGHT" | "TRAIN" | "HOTEL" | "BUS" | "CAB";
  customerPaidPaise: number;
  wholesaleNetPaise: number;
  foodWalletRewardPaise?: number; // default: 20_000 paise (₹200.00 closed-loop food wallet reward float)
  userId: string;
  passengerCount?: number;
  convenienceFeePaise?: number;
  providerName?: string; // default: "TBO_B2B_187051"
  paymentMethod?: "NPCI_UPI" | "DIRECT_UPI" | "KING_PAY" | "BANK_TRANSFER" | "RAZORPAY_ONLINE";
  founderAccount?: "PLATFORM_FEE_REVENUE" | "FOUNDER_VAULT";
  founderEntityId?: string;
  idempotencyKey: string;
}

export interface DynamicTravelCheckoutSplitResult {
  transaction: LedgerTransaction;
  splitSummary: {
    bookingId: string;
    serviceType: "FLIGHT" | "TRAIN" | "HOTEL" | "BUS" | "CAB";
    passengerCount: number;
    customerPaidPaise: number;
    wholesaleNetPaise: number;
    founderFeeRevenuePaise: number;
    foodWalletRewardPaise: number;
    convenienceFeePaise: number;
    doubleEntryVariancePaise: number; // strictly 0
    accountsCredited: {
      travelProviderPayable: number;
      platformFeeRevenue: number;
      customerWallet: number;
    };
    accountDebited: {
      account: LedgerAccountType;
      amountPaise: number;
    };
  };
}

export interface OtaTravelBookingParams {
  bookingId: string;
  serviceType: "FLIGHT" | "TRAIN" | "HOTEL";
  passengerCount: number;
  wholesaleNetPaise: number;
  publishedMrpPaise?: number;
  promoCode?: string | null;
  optInTripProtection?: boolean;
  paymentMethod?: "NPCI_UPI" | "DIRECT_UPI" | "KING_PAY" | "BANK_TRANSFER" | "RAZORPAY_ONLINE";
  userId?: string;
  providerName?: string;
  idempotencyKey: string;
}

export interface OtaTravelBookingResult {
  transaction: LedgerTransaction;
  fareBreakdown: {
    serviceType: "FLIGHT" | "TRAIN" | "HOTEL";
    passengerCount: number;
    wholesaleNetTotalPaise: number;
    publishedMrpTotalPaise: number;
    wholesaleCommissionPaise: number;
    mandatoryConvenienceFeePaise: number;
    tripProtectionPaise: number;
    promoCodeApplied: string | null;
    promoDiscountPaise: number;
    promoCashbackFoodWalletPaise: number;
    totalCustomerDebitPaise: number;
    platformRetainedMarginPaise: number;
    guaranteedUpfrontCashFloatPaise: number;
  };
}

export class CanonicalLedger {
  private inMemoryChainState = "0000000000000000000000000000000000000000000000000000000000000000";
  private inMemoryTransactions = new Map<string, LedgerTransaction>();
  private inMemoryTransactionsById = new Map<string, LedgerTransaction>();
  private inMemoryEntries: (LedgerEntry & { id: string; transactionId: string; timestamp: string })[] = [];
  private inMemorySettlements = new Map<string, SettlementBatch>();

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
    let sql: Sql | null = null;
    try {
      sql = await getSql();
    } catch {
      sql = null;
    }
    
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

    if (!sql) {
      const existingTx = this.inMemoryTransactions.get(params.idempotencyKey);
      if (existingTx) return existingTx;

      const transactionId = "tx-" + crypto.randomUUID();
      const now = new Date().toISOString();
      const previousHash = this.inMemoryChainState;
      const canonicalPayload = JSON.stringify({
        transactionId,
        idempotencyKey: params.idempotencyKey,
        previousHash,
        totalAmountPaise: totalDebit,
        entries: params.entries.map((e) => ({
          account: e.account,
          direction: e.direction,
          amountPaise: e.amountPaise,
          entityId: e.entityId,
        })),
      });
      const auditHash = this.generateHash(canonicalPayload);
      this.inMemoryChainState = auditHash;

      const entriesWithMeta = params.entries.map((e) => ({
        ...e,
        id: "ent-" + crypto.randomUUID(),
        entryId: "ent-" + crypto.randomUUID(),
        transactionId,
        timestamp: now,
      }));

      const transaction: LedgerTransaction = {
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
        entries: entriesWithMeta,
      };

      this.inMemoryTransactions.set(params.idempotencyKey, transaction);
      this.inMemoryTransactionsById.set(transactionId, transaction);
      this.inMemoryEntries.push(...entriesWithMeta);

      return transaction;
    }

    const existing = await sql.query<any>(
      "SELECT transaction_id FROM ledger_transactions WHERE idempotency_key = $1 LIMIT 1",
      [params.idempotencyKey],
    );
    if (existing && existing.length > 0) {
      const txId = existing[0].transaction_id;
      const txRows = await sql.query<any>(
        "SELECT * FROM ledger_transactions WHERE transaction_id = $1",
        [txId],
      );
      const entryRows = await sql.query<any>(
        "SELECT * FROM ledger_entries WHERE transaction_id = $1",
        [txId],
      );
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
        fraudReasons: typeof txRows[0].fraud_reasons === "string" ? JSON.parse(txRows[0].fraud_reasons) : txRows[0].fraud_reasons,
        fraudScore: txRows[0].fraud_score,
        entries: entryRows.map((e: any) => ({
          entryId: e.entry_id,
          account: e.account,
          direction: e.direction,
          amountPaise: parseInt(e.amount_paise),
          entityId: e.entity_id,
          memo: e.memo,
        })),
      };
    }

    const transactionId = "tx-" + crypto.randomUUID();
    const now = new Date().toISOString();
    const fraudReasonsJson = params.fraudReasons ? JSON.stringify(params.fraudReasons) : null;
    let previousHash = "0000000000000000000000000000000000000000000000000000000000000000";
    let auditHash = "";
    let duplicateTxId: string | null = null;

    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await sql.transaction(async (tx: Sql) => {
          await tx.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
          const lockedExisting = await tx.query<any>(
            "SELECT transaction_id FROM ledger_transactions WHERE idempotency_key = $1 FOR UPDATE",
            [params.idempotencyKey],
          );
          if (lockedExisting.length > 0) {
            duplicateTxId = lockedExisting[0].transaction_id;
            return;
          }

          const chainState = await tx.query<{ last_audit_hash: string }>(
            "SELECT last_audit_hash FROM ledger_chain_state WHERE id = 1 FOR UPDATE",
          );
          previousHash =
            chainState[0]?.last_audit_hash ??
            "0000000000000000000000000000000000000000000000000000000000000000";

          const canonicalPayload = JSON.stringify({
            transactionId,
            idempotencyKey: params.idempotencyKey,
            previousHash,
            totalAmountPaise: totalDebit,
            entries: params.entries.map((e) => ({
              account: e.account,
              direction: e.direction,
              amountPaise: e.amountPaise,
              entityId: e.entityId,
            })),
          });
          auditHash = this.generateHash(canonicalPayload);

          await tx.query(
            "INSERT INTO ledger_transactions (transaction_id, idempotency_key, order_id, event_type, total_amount_paise, timestamp, audit_hash, previous_hash, is_fraud_suspicious, fraud_reasons, fraud_score) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
            [transactionId, params.idempotencyKey, params.orderId || null, params.eventType, totalDebit, now, auditHash, previousHash, params.isFraudSuspicious || false, fraudReasonsJson, params.fraudScore || 0],
          );

          for (const entry of params.entries) {
            const entryId = "ent-" + crypto.randomUUID();
            await tx.query(
              "INSERT INTO ledger_entries (id, entry_id, transaction_id, account, direction, amount_paise, entity_id, memo, timestamp) VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8)",
              [entryId, transactionId, entry.account, entry.direction, entry.amountPaise, entry.entityId, entry.memo, now],
            );
            try {
              await tx.query(
                "INSERT INTO kingpay_ledger_entries (entry_id, transaction_id, account, direction, amount_paise, entity_id, memo, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (entry_id) DO NOTHING",
                [entryId, transactionId, entry.account, entry.direction, entry.amountPaise, entry.entityId, entry.memo, now],
              );
            } catch {
              // Fallback if table not yet migrated
            }
          }

          await tx.query(
            "UPDATE ledger_chain_state SET last_audit_hash = $1 WHERE id = 1",
            [auditHash],
          );
        });
        break;
      } catch (err: any) {
        const isSerializationError =
          err?.code === "40001" ||
          err?.message?.includes("could not serialize access") ||
          err?.message?.includes("deadlock detected");
        if (isSerializationError && attempt < maxRetries - 1) {
          await new Promise((r) => setTimeout(r, 60 * Math.pow(2, attempt) + Math.random() * 50));
          continue;
        }
        throw err;
      }
    }

    if (duplicateTxId) {
      const txRows = await sql.query<any>(
        "SELECT * FROM ledger_transactions WHERE transaction_id = $1",
        [duplicateTxId],
      );
      const entryRows = await sql.query<any>(
        "SELECT * FROM ledger_entries WHERE transaction_id = $1",
        [duplicateTxId],
      );
      const txRow = txRows[0];
      if (!txRow) throw new Error("Idempotent transaction disappeared");
      return {
        transactionId: txRow.transaction_id,
        idempotencyKey: txRow.idempotency_key,
        orderId: txRow.order_id,
        eventType: txRow.event_type,
        totalAmountPaise: parseInt(txRow.total_amount_paise),
        timestamp: txRow.timestamp,
        auditHash: txRow.audit_hash,
        previousHash: txRow.previous_hash,
        isFraudSuspicious: txRow.is_fraud_suspicious,
        fraudReasons: typeof txRow.fraud_reasons === "string" ? JSON.parse(txRow.fraud_reasons) : txRow.fraud_reasons,
        fraudScore: txRow.fraud_score,
        entries: entryRows.map((entry: any) => ({
          entryId: entry.entry_id,
          account: entry.account,
          direction: entry.direction,
          amountPaise: parseInt(entry.amount_paise),
          entityId: entry.entity_id,
          memo: entry.memo,
        })),
      };
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

  public static readonly SOVEREIGN_NPCI_UPI_VPA = SOVEREIGN_NPCI_UPI_VPA;
  public static readonly SECONDARY_NPCI_UPI_VPA = SECONDARY_NPCI_UPI_VPA;

  public static evaluatePaymentMethodSafety(params: {
    paymentMethod?: string;
    timestamp?: string | Date;
    isThreatZone?: boolean;
    zoneId?: string;
  }): {
    allowed: boolean;
    isLateNight: boolean;
    isThreatZone: boolean;
    reason?: string;
  } {
    const method = (params.paymentMethod || "NPCI_UPI").toUpperCase();
    const isLateNight = isLateNightCurfewIst(params.timestamp ? new Date(params.timestamp) : new Date());
    const isThreatZone = Boolean(params.isThreatZone);

    if (method === "COD") {
      if (isLateNight) {
        return {
          allowed: false,
          isLateNight: true,
          isThreatZone,
          reason: `LATE_NIGHT_COD_LOCKOUT: Cash on Delivery is strictly locked out between 23:00 and 04:00 IST for rider safety. Only verified NPCI UPI (${SOVEREIGN_NPCI_UPI_VPA}) and online prepaid flows are permitted.`,
        };
      }
      if (isThreatZone) {
        return {
          allowed: false,
          isLateNight,
          isThreatZone: true,
          reason: `THREAT_ZONE_COD_LOCKOUT: Cash on Delivery is locked out in high-risk zones for rider physical safety. Only verified NPCI UPI (${SOVEREIGN_NPCI_UPI_VPA}) and online prepaid flows are permitted.`,
        };
      }
    }

    return {
      allowed: true,
      isLateNight,
      isThreatZone,
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
    paymentMethod?: "COD" | "DIRECT_UPI" | "NPCI_UPI" | "KING_PAY" | "RAZORPAY_ONLINE" | "UPI_SANDBOX";
    riderId?: string;
    customerId?: string;
    isThreatZone?: boolean;
    timestamp?: string | Date;
    npciUpiVpa?: string;
  }): Promise<LedgerTransaction> {
    const method = (params.paymentMethod || "NPCI_UPI").toUpperCase();

    // Rider safety & late-night lockout enforcement
    const safety = CanonicalLedger.evaluatePaymentMethodSafety({
      paymentMethod: method,
      timestamp: params.timestamp,
      isThreatZone: params.isThreatZone,
    });
    if (!safety.allowed) {
      throw new Error(safety.reason);
    }

    // Strict SafeInteger paise verification
    if (!Number.isInteger(params.totalAmountPaise) || params.totalAmountPaise <= 0) {
      throw new Error(`Total amount must be a positive integer in paise, received: ${params.totalAmountPaise}`);
    }
    if (!Number.isInteger(params.platformFeePaise) || params.platformFeePaise < 0) {
      throw new Error(`Platform fee must be a non-negative integer in paise, received: ${params.platformFeePaise}`);
    }
    if (!Number.isInteger(params.deliveryFeePaise) || params.deliveryFeePaise < 0) {
      throw new Error(`Delivery fee must be a non-negative integer in paise, received: ${params.deliveryFeePaise}`);
    }
    if (!Number.isInteger(params.gstPaise) || params.gstPaise < 0) {
      throw new Error(`GST liability must be a non-negative integer in paise, received: ${params.gstPaise}`);
    }

    const netFoodPaise = params.totalAmountPaise - params.platformFeePaise - params.deliveryFeePaise - params.gstPaise;
    if (!Number.isInteger(netFoodPaise) || netFoodPaise < 0) {
      throw new Error(`Net food payable must be non-negative integer paise. Computed ${netFoodPaise} from total ${params.totalAmountPaise}`);
    }

    let isFraudSuspicious = false;
    let fraudReasons: string[] = [];
    let fraudScore = 0;

    if (params.orderRiskContext) {
      const evaluation = fraudShield.evaluateOrderRisk(params.orderRiskContext);
      isFraudSuspicious = evaluation.isFraudulent;
      fraudReasons = evaluation.reasons;
      fraudScore = evaluation.riskScore;
    }

    let debitAccount: LedgerAccountType = "BANK_CLEARING";
    let debitEntityId = "GATEWAY";
    let debitMemo = `Customer online capture for order #${params.orderId}`;

    if (method === "COD") {
      debitAccount = "CUSTOMER_CASH_IN";
      debitEntityId = params.riderId || "RIDER_POCKET_HOLDING";
      debitMemo = `Rider doorstep cash collection for COD order #${params.orderId}`;
    } else if (method === "DIRECT_UPI" || method === "NPCI_UPI") {
      debitAccount = "BANK_CLEARING";
      const vpa = params.npciUpiVpa || SOVEREIGN_NPCI_UPI_VPA;
      debitEntityId = `NPCI_UPI:${vpa}`;
      debitMemo = `Direct NPCI UPI collection via ${vpa} for order #${params.orderId}`;
    } else if (method === "KING_PAY") {
      debitAccount = "CUSTOMER_WALLET";
      debitEntityId = params.customerId || "KINGPAY_USER_WALLET";
      debitMemo = `KingPay wallet payment debit for order #${params.orderId}`;
    }

    return this.postTransaction({
      idempotencyKey: params.idempotencyKey,
      eventType: method === "COD" ? "ORDER_COD_COLLECTION_RECORDED" : "ORDER_PAYMENT_CAPTURED",
      orderId: params.orderId,
      isFraudSuspicious,
      fraudReasons,
      fraudScore,
      entries: [
        { account: debitAccount, direction: "DEBIT", amountPaise: params.totalAmountPaise, entityId: debitEntityId, memo: debitMemo },
        { account: "RESTAURANT_PAYABLE", direction: "CREDIT", amountPaise: netFoodPaise, entityId: params.restaurantId, memo: `Net food sales payable for order #${params.orderId}` },
        { account: "PLATFORM_FEE_REVENUE", direction: "CREDIT", amountPaise: params.platformFeePaise, entityId: "PLATFORM", memo: `Convenience fee revenue on order #${params.orderId}` },
        { account: "RIDER_PAYABLE", direction: "CREDIT", amountPaise: params.deliveryFeePaise, entityId: params.riderId || "RIDER_POOL", memo: `Delivery fee allocated to rider on order #${params.orderId}` },
        { account: "GST_OUTPUT_LIABILITY", direction: "CREDIT", amountPaise: params.gstPaise, entityId: "GOVT_TAX", memo: `18% GST output tax liability on order #${params.orderId}` },
      ],
    });
  }

  public async recordNpciUpiDirectCollection(params: {
    orderId: string;
    totalAmountPaise: number;
    platformFeePaise: number;
    deliveryFeePaise: number;
    gstPaise: number;
    restaurantId: string;
    riderId?: string;
    idempotencyKey: string;
    vpa?: string;
  }): Promise<LedgerTransaction> {
    return this.captureOrderPayment({
      ...params,
      paymentMethod: "NPCI_UPI",
      npciUpiVpa: params.vpa || SOVEREIGN_NPCI_UPI_VPA,
    });
  }

  /**
   * Settles food order and concierge add-on pairing revenue via double-entry accounting.
   * - Withholds 5% GST under CGST Act Section 9(5) under OrderKing GSTIN 18AFXPH9838M1Z9.
   * - Enforces zero floating-point rounding (100% integer paise).
   * - Credits restaurant payable for food and add-ons net of platform fee and Sec 9(5) liability.
   */
  public async recordConciergeOrderSettlement(params: {
    orderId: string;
    restaurantId: string;
    dishName: string;
    dishPricePaise: number;
    quantity: number;
    packagingPaise?: number;
    addOns?: Array<{ id: string; name: string; pricePaise: number }>;
    paymentMethod?: "NPCI_UPI" | "DIRECT_UPI" | "KING_PAY" | "COD";
    npciUpiVpa?: string;
    idempotencyKey: string;
    platformCommissionBps?: number;
  }): Promise<LedgerTransaction> {
    const qty = Math.max(1, Math.floor(params.quantity));
    assertSafePaise(params.dishPricePaise, "dishPricePaise");
    const dishSubtotalPaise = Math.floor(params.dishPricePaise * qty);
    
    const addOnsSubtotalPaise = (params.addOns || []).reduce((sum, item) => {
      assertSafePaise(item.pricePaise, `addOn.${item.name || item.id}`);
      return sum + Math.floor(item.pricePaise);
    }, 0);

    const packagingPaise = Math.min(5000, Math.max(0, Math.floor(params.packagingPaise ?? 3000)));
    const grossFoodAndAddOnsPaise = dishSubtotalPaise + addOnsSubtotalPaise + packagingPaise;

    // Section 9(5) CGST Act: 5% withholding on composite food + add-on supply
    const foodGst9_5Paise = Math.round((grossFoodAndAddOnsPaise * 500) / 10000);
    const totalCustomerPaidPaise = grossFoodAndAddOnsPaise + foodGst9_5Paise;

    // Platform commission (10% standard unless specified) and 18% GST under Sec 9(1) with ITC
    const commBps = params.platformCommissionBps ?? 1000;
    const platformCommissionPaise = Math.floor((grossFoodAndAddOnsPaise * commBps) / 10000);
    const commissionGstPaise = Math.round((platformCommissionPaise * 1800) / 10000);
    const totalPlatformRevenuePaise = platformCommissionPaise + commissionGstPaise;

    // Net payable to restaurant: gross food & add-ons minus commission & commission GST
    const netRestaurantPayablePaise = grossFoodAndAddOnsPaise - totalPlatformRevenuePaise;

    const method = (params.paymentMethod || "NPCI_UPI").toUpperCase();
    let debitAccount: LedgerAccountType = "BANK_CLEARING";
    let debitEntityId = `NPCI_UPI:${params.npciUpiVpa || SOVEREIGN_NPCI_UPI_VPA}`;
    let debitMemo = `Customer 1-Tap UPI payment for order #${params.orderId} (incl. concierge add-ons)`;

    if (method === "KING_PAY") {
      debitAccount = "CUSTOMER_WALLET";
      debitEntityId = "KINGPAY_USER_WALLET";
      debitMemo = `KingPay wallet payment for order #${params.orderId} (incl. concierge add-ons)`;
    } else if (method === "COD") {
      debitAccount = "CUSTOMER_CASH_IN";
      debitEntityId = "RIDER_POCKET_HOLDING";
      debitMemo = `Doorstep cash collection for order #${params.orderId} (incl. concierge add-ons)`;
    }

    const entries: LedgerEntry[] = [
      {
        account: debitAccount,
        direction: "DEBIT",
        amountPaise: totalCustomerPaidPaise,
        entityId: debitEntityId,
        memo: debitMemo,
      },
      {
        account: "FOOD_GST_9_5_LIABILITY",
        direction: "CREDIT",
        amountPaise: foodGst9_5Paise,
        entityId: "GSTIN:18AFXPH9838M1Z9",
        memo: `Section 9(5) CGST 5% withholding on food & concierge add-ons for order #${params.orderId}`,
      },
      {
        account: "RESTAURANT_PAYABLE",
        direction: "CREDIT",
        amountPaise: netRestaurantPayablePaise,
        entityId: params.restaurantId,
        memo: `Net payable to kitchen for dish '${params.dishName}' and concierge add-ons on order #${params.orderId}`,
      },
      {
        account: "PLATFORM_FEE_REVENUE",
        direction: "CREDIT",
        amountPaise: platformCommissionPaise,
        entityId: "PLATFORM_COMMISSION",
        memo: `Platform fee on order #${params.orderId} (incl. add-on volume)`,
      },
      {
        account: "GST_OUTPUT_LIABILITY",
        direction: "CREDIT",
        amountPaise: commissionGstPaise,
        entityId: "GOVT_TAX_SEC_9_1",
        memo: `18% GST output tax on platform commission for order #${params.orderId}`,
      },
    ];

    // Assert double-entry balance: sum(DEBIT) === sum(CREDIT)
    const totalDebit = entries.filter((e) => e.direction === "DEBIT").reduce((s, e) => s + e.amountPaise, 0);
    const totalCredit = entries.filter((e) => e.direction === "CREDIT").reduce((s, e) => s + e.amountPaise, 0);
    if (totalDebit !== totalCredit) {
      throw new Error(`Double-entry balance mismatch: DEBIT=${totalDebit} paise, CREDIT=${totalCredit} paise`);
    }

    return this.postTransaction({
      idempotencyKey: params.idempotencyKey,
      eventType: "CONCIERGE_ORDER_SETTLEMENT_RECORDED",
      orderId: params.orderId,
      entries,
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

    await sql.transaction(async (tx) => {
      await tx.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
      
      const existingTx = await tx.query<any>("SELECT * FROM settlement_batches WHERE idempotency_key = $1 FOR UPDATE", [params.idempotencyKey]);
      if (existingTx && existingTx.length > 0) {
        return; // Handled outside or we can just ignore and let the outer function return the existing one.
      }
      
      await tx.query(
        "INSERT INTO settlement_batches (batch_id, entity_id, entity_type, period_start, period_end, gross_amount_paise, deductions_paise, commission_paise, gst_paise, net_payout_paise, state, idempotency_key, payout_upi_or_account_number, attempts_count, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)",
        [batchId, params.entityId, params.entityType, params.periodStart, params.periodEnd, params.grossAmountPaise, params.deductionsPaise, params.commissionPaise, params.gstPaise, netPayoutPaise, "CALCULATED", params.idempotencyKey, params.payoutUpiOrAccountNumber, 0, now, now]
      );
    });

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

    await sql.transaction(async (tx) => {
      await tx.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
      
      const lockedBatch = await tx.query<any>("SELECT state, attempts_count FROM settlement_batches WHERE batch_id = $1 FOR UPDATE", [batchId]);
      if (!lockedBatch || lockedBatch.length === 0) {
        throw new Error(`Settlement batch '${batchId}' not found.`);
      }
      
      const currentState = lockedBatch[0].state;
      if (!validTransitions[currentState]?.includes(nextState)) {
        throw new Error(`Invalid settlement state transition from '${currentState}' to '${nextState}'.`);
      }

      await tx.query(
        "UPDATE settlement_batches SET state = $1, provider_reference = COALESCE($2, provider_reference), failure_reason = COALESCE($3, failure_reason), attempts_count = $4, updated_at = $5 WHERE batch_id = $6",
        [nextState, metadata?.providerReference || null, metadata?.failureReason || null, attempts, now, batchId]
      );
    });

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
    let sql: Sql | null = null;
    try {
      sql = await getSql();
    } catch {
      sql = null;
    }

    if (!sql) {
      let balance = 0;
      for (const entry of this.inMemoryEntries) {
        if (entry.account === account) {
          if (entry.direction === "CREDIT") balance += entry.amountPaise;
          else if (entry.direction === "DEBIT") balance -= entry.amountPaise;
        }
      }
      return balance;
    }

    const rows = await sql.query<any>("SELECT SUM(CASE WHEN direction = 'CREDIT' THEN amount_paise ELSE -amount_paise END) as balance FROM ledger_entries WHERE account = $1", [account]);
    return rows.length > 0 && rows[0].balance ? parseInt(rows[0].balance) : 0;
  }

  public async getAccountBalanceInr(account: LedgerAccountType): Promise<number> {
    const paise = await this.getAccountBalancePaise(account);
    return parseFloat((paise / 100).toFixed(2));
  }

  public async getSettlementBatch(batchId: string): Promise<any> {
    let sql: Sql | null = null;
    try {
      sql = await getSql();
    } catch {
      sql = null;
    }
    if (!sql) {
      return this.inMemorySettlements.get(batchId);
    }
    const rows = await sql.query<any>("SELECT * FROM settlement_batches WHERE batch_id = $1", [batchId]);
    return rows.length > 0 ? rows[0] : undefined;
  }

  public async listSettlementBatches(): Promise<any[]> {
    let sql: Sql | null = null;
    try {
      sql = await getSql();
    } catch {
      sql = null;
    }
    if (!sql) {
      return Array.from(this.inMemorySettlements.values());
    }
    const rows = await sql.query<any>("SELECT * FROM settlement_batches", []);
    return rows;
  }

  public async getTransaction(txId: string): Promise<any> {
    let sql: Sql | null = null;
    try {
      sql = await getSql();
    } catch {
      sql = null;
    }
    if (!sql) {
      return this.inMemoryTransactionsById.get(txId);
    }
    const rows = await sql.query<any>("SELECT * FROM ledger_transactions WHERE transaction_id = $1", [txId]);
    return rows.length > 0 ? rows[0] : undefined;
  }

  public async listTransactions(): Promise<any[]> {
    let sql: Sql | null = null;
    try {
      sql = await getSql();
    } catch {
      sql = null;
    }
    if (!sql) {
      return Array.from(this.inMemoryTransactionsById.values());
    }
    const rows = await sql.query<any>("SELECT * FROM ledger_transactions ORDER BY created_at DESC", []);
    return rows;
  }

  public async verifyLedgerChainIntegrity(): Promise<{ isValid: boolean; totalTransactions: number; tamperedTxId?: string }> {
    let sql: Sql | null = null;
    try {
      sql = await getSql();
    } catch {
      sql = null;
    }

    if (!sql) {
      let prevHash = "0000000000000000000000000000000000000000000000000000000000000000";
      const txList = Array.from(this.inMemoryTransactionsById.values());
      for (const tx of txList) {
        if (tx.previousHash !== prevHash) {
          return { isValid: false, totalTransactions: txList.length, tamperedTxId: tx.transactionId };
        }
        const canonicalPayload = JSON.stringify({
          transactionId: tx.transactionId,
          idempotencyKey: tx.idempotencyKey,
          previousHash: prevHash,
          totalAmountPaise: tx.totalAmountPaise,
          entries: tx.entries.map((e) => ({
            account: e.account,
            direction: e.direction,
            amountPaise: e.amountPaise,
            entityId: e.entityId,
          })),
        });
        const expectedHash = this.generateHash(canonicalPayload);
        if (tx.auditHash !== expectedHash) {
          return { isValid: false, totalTransactions: txList.length, tamperedTxId: tx.transactionId };
        }
        prevHash = tx.auditHash;
      }
      return { isValid: true, totalTransactions: txList.length };
    }

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

  public async ensureKingPayLedgerTable(sql: any): Promise<void> {
    try {
      await sql.query(`
        CREATE TABLE IF NOT EXISTS kingpay_ledger_entries (
          entry_id TEXT PRIMARY KEY,
          transaction_id TEXT NOT NULL,
          account TEXT NOT NULL,
          direction TEXT NOT NULL CHECK (direction IN ('DEBIT', 'CREDIT')),
          amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
          entity_id TEXT NOT NULL,
          memo TEXT,
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await sql.query(`CREATE INDEX IF NOT EXISTS idx_kple_entity_id ON kingpay_ledger_entries (entity_id)`);
      await sql.query(`CREATE INDEX IF NOT EXISTS idx_kple_account ON kingpay_ledger_entries (account)`);
    } catch {
      // Table may already exist
    }
  }

  public async getKingPayWalletBalancePaise(userId: string): Promise<number> {
    let sql: Sql | null = null;
    try {
      sql = await getSql();
    } catch {
      sql = null;
    }

    if (!sql) {
      let balance = 0;
      for (const entry of this.inMemoryEntries) {
        if (entry.entityId === userId && (entry.account === "CUSTOMER_WALLET" || entry.account === "USER_WALLET")) {
          if (entry.direction === "CREDIT") balance += entry.amountPaise;
          else if (entry.direction === "DEBIT") balance -= entry.amountPaise;
        }
      }
      return Math.max(0, balance);
    }

    await this.ensureKingPayLedgerTable(sql);
    try {
      const rows = await sql.query<any>(
        `SELECT COALESCE(SUM(CASE WHEN direction = 'CREDIT' THEN amount_paise ELSE -amount_paise END), 0) as balance 
         FROM kingpay_ledger_entries 
         WHERE entity_id = $1 AND (account = 'CUSTOMER_WALLET' OR account = 'USER_WALLET' OR account LIKE 'USER_WALLET_%')`,
        [userId]
      );
      return rows.length > 0 && rows[0].balance ? Math.max(0, parseInt(rows[0].balance)) : 0;
    } catch {
      return 0;
    }
  }

  public async recordKingPayWalletTopUp(params: {
    userId: string;
    amountPaise: number;
    idempotencyKey: string;
    memo?: string;
  }): Promise<LedgerTransaction> {
    if (params.amountPaise <= 0) {
      throw new Error(`Top-up amount must be positive paise: ${params.amountPaise}`);
    }
    return this.postTransaction({
      idempotencyKey: params.idempotencyKey,
      eventType: "KINGPAY_WALLET_TOPUP",
      entries: [
        {
          account: "BANK_CLEARING",
          direction: "DEBIT",
          amountPaise: params.amountPaise,
          entityId: "BANK_GATEWAY",
          memo: params.memo || `Sovereign Bank Top-Up for user ${params.userId}`,
        },
        {
          account: "CUSTOMER_WALLET",
          direction: "CREDIT",
          amountPaise: params.amountPaise,
          entityId: params.userId,
          memo: params.memo || `Wallet credit for user ${params.userId}`,
        },
      ],
    });
  }

  public async recordKingPayPayment(params: {
    userId: string;
    recipientId: string;
    amountPaise: number;
    idempotencyKey: string;
    recipientAccount?: LedgerAccountType;
    memo?: string;
  }): Promise<LedgerTransaction> {
    if (params.amountPaise <= 0) {
      throw new Error(`Payment amount must be positive paise: ${params.amountPaise}`);
    }
    const currentBalance = await this.getKingPayWalletBalancePaise(params.userId);
    if (currentBalance < params.amountPaise) {
      throw new Error(
        `Insufficient authentic wallet balance: available is ₹${(currentBalance / 100).toFixed(2)}, required ₹${(params.amountPaise / 100).toFixed(2)}`
      );
    }

    return this.postTransaction({
      idempotencyKey: params.idempotencyKey,
      eventType: "KINGPAY_WALLET_PAYMENT",
      entries: [
        {
          account: "CUSTOMER_WALLET",
          direction: "DEBIT",
          amountPaise: params.amountPaise,
          entityId: params.userId,
          memo: params.memo || `Payment debit from user ${params.userId}`,
        },
        {
          account: params.recipientAccount || "RESTAURANT_PAYABLE",
          direction: "CREDIT",
          amountPaise: params.amountPaise,
          entityId: params.recipientId,
          memo: params.memo || `Payment credit to ${params.recipientId}`,
        },
      ],
    });
  }

  public async recordOtaTravelBooking(params: OtaTravelBookingParams): Promise<OtaTravelBookingResult> {
    const count = Math.max(1, Math.floor(params.passengerCount || 1));
    const wholesaleNetUnit = Math.max(0, Math.floor(params.wholesaleNetPaise));
    const publishedMrpUnit = Math.max(wholesaleNetUnit, Math.floor(params.publishedMrpPaise ?? wholesaleNetUnit));

    const wholesaleNetTotalPaise = wholesaleNetUnit * count;
    const publishedMrpTotalPaise = publishedMrpUnit * count;
    const wholesaleCommissionPaise = publishedMrpTotalPaise - wholesaleNetTotalPaise;

    const feePerUnit = MANDATORY_OTA_CONVENIENCE_FEE_PAISE[params.serviceType];
    const mandatoryConvenienceFeePaise = feePerUnit * count;
    const tripProtectionPaise = params.optInTripProtection ? 14_900 * count : 0; // ₹149/pax

    // Promo Code: strictly opt-in
    let promoCodeApplied: string | null = null;
    let promoCashbackFoodWalletPaise = 0;

    if (params.promoCode && typeof params.promoCode === "string" && params.promoCode.trim().length > 0) {
      const code = params.promoCode.trim().toUpperCase();
      if (code === "FLYKING" || code === "ORDERKING" || code === "KINGTRAVEL") {
        promoCodeApplied = code;
        // Cap at ₹150 (15,000 paise) per booking, funded into closed-loop food wallet,
        // strictly preserving minimum ₹249 cash float per unit
        promoCashbackFoodWalletPaise = Math.min(15_000, Math.floor(mandatoryConvenienceFeePaise * 0.40));
      }
    }

    // Customer debit = published MRP + mandatory convenience fee + trip protection
    const totalCustomerDebitPaise = publishedMrpTotalPaise + mandatoryConvenienceFeePaise + tripProtectionPaise;

    // Platform retained margin = convenience fee + wholesale commission + trip protection - food wallet promo
    const platformRetainedMarginPaise =
      mandatoryConvenienceFeePaise + wholesaleCommissionPaise + tripProtectionPaise - promoCashbackFoodWalletPaise;

    const guaranteedUpfrontCashFloatPaise = mandatoryConvenienceFeePaise + wholesaleCommissionPaise + tripProtectionPaise;

    const debitAccount: LedgerAccountType = params.paymentMethod === "KING_PAY" ? "CUSTOMER_WALLET" : "BANK_CLEARING";
    const debitEntityId = params.paymentMethod === "KING_PAY" 
      ? (params.userId || "KINGPAY_USER") 
      : `NPCI_UPI:${SOVEREIGN_NPCI_UPI_VPA}`;

    const entries: LedgerEntry[] = [
      {
        account: debitAccount,
        direction: "DEBIT",
        amountPaise: totalCustomerDebitPaise,
        entityId: debitEntityId,
        memo: `Customer payment for ${params.serviceType} booking #${params.bookingId} (${count} units)`,
      },
      {
        account: "TRAVEL_PROVIDER_PAYABLE",
        direction: "CREDIT",
        amountPaise: wholesaleNetTotalPaise,
        entityId: params.providerName || "TBO_WHOLESALE_187051",
        memo: `Wholesale net payable to carrier/hotel for booking #${params.bookingId}`,
      },
      {
        account: "PLATFORM_FEE_REVENUE",
        direction: "CREDIT",
        amountPaise: mandatoryConvenienceFeePaise,
        entityId: "PLATFORM_TREASURY",
        memo: `Mandatory OTA convenience fee (${params.serviceType}: ₹${(feePerUnit / 100).toFixed(2)} x ${count}) for booking #${params.bookingId}`,
      },
    ];

    if (wholesaleCommissionPaise > 0) {
      entries.push({
        account: "COMMISSION_ESCROW",
        direction: "CREDIT",
        amountPaise: wholesaleCommissionPaise,
        entityId: "PLATFORM_TREASURY",
        memo: `Wholesale carrier markup margin for booking #${params.bookingId}`,
      });
    }

    if (tripProtectionPaise > 0) {
      entries.push({
        account: "PLATFORM_FEE_REVENUE",
        direction: "CREDIT",
        amountPaise: tripProtectionPaise,
        entityId: "PLATFORM_TREASURY",
        memo: `Trip protection fee for booking #${params.bookingId}`,
      });
    }

    const tx = await this.postTransaction({
      idempotencyKey: params.idempotencyKey,
      eventType: "OTA_TRAVEL_BOOKING_CAPTURED",
      orderId: params.bookingId,
      entries,
    });

    if (promoCashbackFoodWalletPaise > 0 && params.userId) {
      await this.postTransaction({
        idempotencyKey: `promo_cashback_${params.bookingId}_${params.idempotencyKey}`,
        eventType: "OTA_PROMO_FOOD_WALLET_CREDIT",
        orderId: params.bookingId,
        entries: [
          {
            account: "PROMO_MARKETING_EXPENSE",
            direction: "DEBIT",
            amountPaise: promoCashbackFoodWalletPaise,
            entityId: "MARKETING_BUDGET",
            memo: `Opt-in promo voucher ${promoCodeApplied} for travel booking #${params.bookingId}`,
          },
          {
            account: "CUSTOMER_WALLET",
            direction: "CREDIT",
            amountPaise: promoCashbackFoodWalletPaise,
            entityId: params.userId,
            memo: `Closed-loop food wallet credit from travel booking #${params.bookingId}`,
          },
        ],
      });
    }

    return {
      transaction: tx,
      fareBreakdown: {
        serviceType: params.serviceType,
        passengerCount: count,
        wholesaleNetTotalPaise,
        publishedMrpTotalPaise,
        wholesaleCommissionPaise,
        mandatoryConvenienceFeePaise,
        tripProtectionPaise,
        promoCodeApplied,
        promoDiscountPaise: 0,
        promoCashbackFoodWalletPaise,
        totalCustomerDebitPaise,
        platformRetainedMarginPaise,
        guaranteedUpfrontCashFloatPaise,
      },
    };
  }

  /**
   * Binds dynamic travel checkout split-settlement with exact 4-way balanced double-entry accounting:
   * - DEBIT: Bank Clearing (BANK_CLEARING) — Full Customer Paid Amount via NPCI UPI
   * - CREDIT: TBO B2B Settlement Account (TRAVEL_PROVIDER_PAYABLE) — Wholesale Net Paise
   * - CREDIT: Founder Fee Revenue Account (PLATFORM_FEE_REVENUE / FOUNDER_VAULT) — Net Retained Margin + Convenience Fee
   * - CREDIT: Closed-Loop Food Wallet Float (CUSTOMER_WALLET) — ₹200 / 20,000 paise reward per booking
   *
   * Invariant: Debits - Credits === 0 paise exact. Fail-closed if funds are insufficient or fractional.
   */
  public async recordDynamicTravelCheckoutSplit(
    params: DynamicTravelCheckoutSplitParams
  ): Promise<DynamicTravelCheckoutSplitResult> {
    const count = Math.max(1, Math.floor(params.passengerCount || 1));
    const customerPaidPaise = assertSafePaise(params.customerPaidPaise, "customerPaidPaise");
    const wholesaleNetPaise = assertSafePaise(params.wholesaleNetPaise, "wholesaleNetPaise");
    const foodWalletRewardPaise = params.foodWalletRewardPaise !== undefined
      ? assertSafePaise(params.foodWalletRewardPaise, "foodWalletRewardPaise")
      : 20_000;

    const defaultFee =
      MANDATORY_OTA_CONVENIENCE_FEE_PAISE[params.serviceType as keyof typeof MANDATORY_OTA_CONVENIENCE_FEE_PAISE] ?? 39_900;
    const convenienceFeePaise = params.convenienceFeePaise !== undefined
      ? assertSafePaise(params.convenienceFeePaise, "convenienceFeePaise")
      : defaultFee * count;

    // Strict fail-closed solvency check: customerPaidPaise must >= wholesaleNetPaise + foodWalletRewardPaise
    if (customerPaidPaise < wholesaleNetPaise + foodWalletRewardPaise) {
      throw new Error(
        `FAIL-CLOSED: Customer paid amount (${customerPaidPaise} paise) is insufficient to cover wholesale net (${wholesaleNetPaise} paise) and closed-loop food wallet reward (${foodWalletRewardPaise} paise).`
      );
    }

    // Net retained paise + convenience fee credited to founder revenue
    const founderFeeRevenuePaise = customerPaidPaise - wholesaleNetPaise - foodWalletRewardPaise;

    const debitAccount: LedgerAccountType = params.paymentMethod === "KING_PAY" ? "CUSTOMER_WALLET" : "BANK_CLEARING";
    const debitEntityId = params.paymentMethod === "KING_PAY"
      ? (params.userId || "KINGPAY_USER")
      : `NPCI_UPI:${SOVEREIGN_NPCI_UPI_VPA}`;

    const founderAccount: LedgerAccountType = params.founderAccount || "PLATFORM_FEE_REVENUE";
    const founderEntityId = params.founderEntityId || "FOUNDER_VAULT";
    const providerEntityId = params.providerName || "TBO_B2B_187051";

    const entries: LedgerEntry[] = [
      {
        account: debitAccount,
        direction: "DEBIT",
        amountPaise: customerPaidPaise,
        entityId: debitEntityId,
        memo: `Dynamic travel checkout payment for ${params.serviceType} booking #${params.bookingId} (${count} pax)`,
      },
      {
        account: "TRAVEL_PROVIDER_PAYABLE",
        direction: "CREDIT",
        amountPaise: wholesaleNetPaise,
        entityId: providerEntityId,
        memo: `TBO B2B wholesale net settlement for booking #${params.bookingId}`,
      },
      {
        account: founderAccount,
        direction: "CREDIT",
        amountPaise: founderFeeRevenuePaise,
        entityId: founderEntityId,
        memo: `Founder fee revenue & net margin retained for booking #${params.bookingId}`,
      },
      {
        account: "CUSTOMER_WALLET",
        direction: "CREDIT",
        amountPaise: foodWalletRewardPaise,
        entityId: params.userId,
        memo: `Closed-Loop Food Wallet Float reward (₹${(foodWalletRewardPaise / 100).toFixed(2)}) for travel booking #${params.bookingId}`,
      },
    ];

    // Mathematical verification of zero-paise double-entry variance
    const totalDebits = entries.filter((e) => e.direction === "DEBIT").reduce((s, e) => s + e.amountPaise, 0);
    const totalCredits = entries.filter((e) => e.direction === "CREDIT").reduce((s, e) => s + e.amountPaise, 0);
    const doubleEntryVariancePaise = totalDebits - totalCredits;

    if (doubleEntryVariancePaise !== 0) {
      throw new Error(
        `CRITICAL FINANCIAL DEFECT: Imbalanced double-entry journal! Debits (${totalDebits}) !== Credits (${totalCredits}), variance: ${doubleEntryVariancePaise} paise.`
      );
    }

    const tx = await this.postTransaction({
      idempotencyKey: params.idempotencyKey,
      eventType: "TRAVEL_DYNAMIC_CHECKOUT_SPLIT_CAPTURED",
      orderId: params.bookingId,
      entries,
    });

    return {
      transaction: tx,
      splitSummary: {
        bookingId: params.bookingId,
        serviceType: params.serviceType,
        passengerCount: count,
        customerPaidPaise,
        wholesaleNetPaise,
        founderFeeRevenuePaise,
        foodWalletRewardPaise,
        convenienceFeePaise,
        doubleEntryVariancePaise,
        accountsCredited: {
          travelProviderPayable: wholesaleNetPaise,
          platformFeeRevenue: founderFeeRevenuePaise,
          customerWallet: foodWalletRewardPaise,
        },
        accountDebited: {
          account: debitAccount,
          amountPaise: customerPaidPaise,
        },
      },
    };
  }
}

export const canonicalLedger = new CanonicalLedger();
