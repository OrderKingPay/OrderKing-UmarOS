import * as crypto from "crypto";

export type BudgetLedgerAccount =
  | "BANK_CLEARING"
  | "MERCHANT_AD_WALLET"
  | "CAMPAIGN_BUDGET_RESERVED"
  | "AD_NETWORK_PAYABLE"
  | "PLATFORM_FEE_REVENUE"
  | "GST_OUTPUT_LIABILITY";

export type BudgetTransactionType =
  | "PREFUND_DEPOSIT"
  | "BUDGET_RESERVATION"
  | "SPEND_RECOGNIZED"
  | "FEE_COMMISSION"
  | "GST_TAX_18"
  | "RESERVATION_RELEASE"
  | "MERCHANT_REFUND";

export interface BudgetLedgerEntry {
  entryId: string;
  transactionId: string;
  account: BudgetLedgerAccount;
  direction: "DEBIT" | "CREDIT";
  amountPaise: number; // Must be integer SafeInteger > 0
  entityId: string;    // merchantId, campaignId, or platform system id
  memo: string;
  timestamp: string;
}

export interface BudgetLedgerTransaction {
  transactionId: string;
  idempotencyKey: string;
  type: BudgetTransactionType;
  merchantId: string;
  campaignId?: string;
  totalAmountPaise: number;
  entries: BudgetLedgerEntry[];
  timestamp: string;
  auditHash: string;
  previousHash: string;
}

export interface MerchantBudgetWalletState {
  merchantId: string;
  totalDepositedPaise: number;
  totalRefundedPaise: number;
  availableBalancePaise: number; // totalDeposited - totalRefunded
  reservedPaise: number;         // Currently locked across active/queued campaigns
  spentPaise: number;            // Total recognized spend + fees + gst
  unreservedAvailablePaise: number; // availableBalance - (reserved + spent)
}

export class DoubleEntryBudgetLedger {
  private transactions: BudgetLedgerTransaction[] = [];
  private idempotencyRegistry = new Map<string, BudgetLedgerTransaction>();
  private lastAuditHash: string = "0000000000000000000000000000000000000000000000000000000000000000";

  public static assertSafePaise(amount: number, label: string = "amountPaise"): void {
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new Error(`Invalid paise amount for ${label}: ${amount}. Must be a positive integer within SafeInteger bounds.`);
    }
  }

  private generateHash(payload: string): string {
    return crypto.createHash("sha256").update(payload).digest("hex");
  }

  public getWalletState(merchantId: string): MerchantBudgetWalletState {
    let totalDepositedPaise = 0;
    let totalRefundedPaise = 0;
    let reservedPaise = 0;
    let spentPaise = 0;

    for (const tx of this.transactions) {
      if (tx.merchantId !== merchantId) continue;

      switch (tx.type) {
        case "PREFUND_DEPOSIT":
          totalDepositedPaise += tx.totalAmountPaise;
          break;
        case "MERCHANT_REFUND":
          totalRefundedPaise += tx.totalAmountPaise;
          break;
        case "BUDGET_RESERVATION":
          reservedPaise += tx.totalAmountPaise;
          break;
        case "RESERVATION_RELEASE":
          reservedPaise -= tx.totalAmountPaise;
          break;
        case "SPEND_RECOGNIZED":
        case "FEE_COMMISSION":
        case "GST_TAX_18":
          reservedPaise -= tx.totalAmountPaise;
          spentPaise += tx.totalAmountPaise;
          break;
      }
    }

    const availableBalancePaise = totalDepositedPaise - totalRefundedPaise;
    const unreservedAvailablePaise = availableBalancePaise - (reservedPaise + spentPaise);

    return {
      merchantId,
      totalDepositedPaise,
      totalRefundedPaise,
      availableBalancePaise,
      reservedPaise,
      spentPaise,
      unreservedAvailablePaise,
    };
  }

  public getCampaignReservedBalancePaise(campaignId: string): number {
    let balance = 0;
    for (const tx of this.transactions) {
      if (tx.campaignId !== campaignId) continue;
      if (tx.type === "BUDGET_RESERVATION") balance += tx.totalAmountPaise;
      if (["SPEND_RECOGNIZED", "FEE_COMMISSION", "GST_TAX_18", "RESERVATION_RELEASE"].includes(tx.type)) {
        balance -= tx.totalAmountPaise;
      }
    }
    return balance;
  }

  public postTransaction(params: {
    idempotencyKey: string;
    type: BudgetTransactionType;
    merchantId: string;
    campaignId?: string;
    entries: Array<{
      account: BudgetLedgerAccount;
      direction: "DEBIT" | "CREDIT";
      amountPaise: number;
      entityId: string;
      memo: string;
    }>;
  }): BudgetLedgerTransaction {
    // 1. Idempotency Check
    const existing = this.idempotencyRegistry.get(params.idempotencyKey);
    if (existing) return existing;

    // 2. Validate Entries and Mathematical Equality
    let totalDebit = 0;
    let totalCredit = 0;

    for (const e of params.entries) {
      DoubleEntryBudgetLedger.assertSafePaise(e.amountPaise, `entry [${e.account}]`);
      if (e.direction === "DEBIT") totalDebit += e.amountPaise;
      else if (e.direction === "CREDIT") totalCredit += e.amountPaise;
      else throw new Error(`Invalid direction: ${e.direction}`);
    }

    if (totalDebit !== totalCredit) {
      throw new Error(`Double-entry violation: Total debits (${totalDebit}) !== total credits (${totalCredit}).`);
    }

    const transactionAmount = totalDebit;
    const currentState = this.getWalletState(params.merchantId);

    // 3. Invariant Verification before applying mutation
    switch (params.type) {
      case "BUDGET_RESERVATION": {
        if (currentState.unreservedAvailablePaise < transactionAmount) {
          throw new Error(
            `Invariant violation: Insufficient unreserved balance. Requested reservation: ${transactionAmount} paise, Available: ${currentState.unreservedAvailablePaise} paise.`
          );
        }
        break;
      }
      case "SPEND_RECOGNIZED":
      case "FEE_COMMISSION":
      case "GST_TAX_18": {
        if (!params.campaignId) throw new Error("campaignId is mandatory for spend/fee recognition.");
        const campReserved = this.getCampaignReservedBalancePaise(params.campaignId);
        if (campReserved < transactionAmount) {
          throw new Error(
            `Invariant violation: Campaign reserved budget exhausted. Campaign: ${params.campaignId}, Remaining: ${campReserved} paise, Requested: ${transactionAmount} paise.`
          );
        }
        break;
      }
      case "RESERVATION_RELEASE": {
        if (!params.campaignId) throw new Error("campaignId is mandatory for reservation release.");
        const campReserved = this.getCampaignReservedBalancePaise(params.campaignId);
        if (campReserved < transactionAmount) {
          throw new Error(
            `Cannot release more than reserved campaign balance. Reserved: ${campReserved} paise, Release: ${transactionAmount} paise.`
          );
        }
        break;
      }
      case "MERCHANT_REFUND": {
        if (currentState.unreservedAvailablePaise < transactionAmount) {
          throw new Error(
            `Cannot refund more than unreserved balance. Unreserved: ${currentState.unreservedAvailablePaise} paise, Requested refund: ${transactionAmount} paise.`
          );
        }
        break;
      }
    }

    // 4. Record and Cryptographically Chain
    const transactionId = "btx_" + crypto.randomUUID();
    const now = new Date().toISOString();
    const previousHash = this.lastAuditHash;

    const entries: BudgetLedgerEntry[] = params.entries.map((e) => ({
      entryId: "bent_" + crypto.randomUUID(),
      transactionId,
      account: e.account,
      direction: e.direction,
      amountPaise: e.amountPaise,
      entityId: e.entityId,
      memo: e.memo,
      timestamp: now,
    }));

    const canonicalPayload = JSON.stringify({
      transactionId,
      idempotencyKey: params.idempotencyKey,
      type: params.type,
      merchantId: params.merchantId,
      campaignId: params.campaignId ?? null,
      totalAmountPaise: transactionAmount,
      previousHash,
      entries: entries.map((e) => ({
        account: e.account,
        direction: e.direction,
        amountPaise: e.amountPaise,
        entityId: e.entityId,
      })),
    });

    const auditHash = this.generateHash(canonicalPayload);

    const tx: BudgetLedgerTransaction = {
      transactionId,
      idempotencyKey: params.idempotencyKey,
      type: params.type,
      merchantId: params.merchantId,
      campaignId: params.campaignId,
      totalAmountPaise: transactionAmount,
      entries,
      timestamp: now,
      auditHash,
      previousHash,
    };

    // Commit
    this.transactions.push(tx);
    this.idempotencyRegistry.set(params.idempotencyKey, tx);
    this.lastAuditHash = auditHash;

    // Post-condition Invariant Assertion
    const nextState = this.getWalletState(params.merchantId);
    if (nextState.reservedPaise + nextState.spentPaise > nextState.availableBalancePaise) {
      throw new Error(
        `CRITICAL INVARIANT BREACH: reservedPaise (${nextState.reservedPaise}) + spentPaise (${nextState.spentPaise}) > availableBalancePaise (${nextState.availableBalancePaise})`
      );
    }
    if (nextState.unreservedAvailablePaise < 0) {
      throw new Error(`CRITICAL INVARIANT BREACH: Negative unreserved balance: ${nextState.unreservedAvailablePaise}`);
    }

    return tx;
  }

  // --- High-Level Operations ---

  public prefundDeposit(params: {
    merchantId: string;
    amountPaise: number;
    idempotencyKey: string;
    reference: string;
  }): BudgetLedgerTransaction {
    DoubleEntryBudgetLedger.assertSafePaise(params.amountPaise, "prefundDeposit");
    return this.postTransaction({
      idempotencyKey: params.idempotencyKey,
      type: "PREFUND_DEPOSIT",
      merchantId: params.merchantId,
      entries: [
        {
          account: "BANK_CLEARING",
          direction: "DEBIT",
          amountPaise: params.amountPaise,
          entityId: "GATEWAY_BANK",
          memo: `Merchant prefund deposit: ${params.reference}`,
        },
        {
          account: "MERCHANT_AD_WALLET",
          direction: "CREDIT",
          amountPaise: params.amountPaise,
          entityId: params.merchantId,
          memo: `Deposit credited to merchant ad wallet: ${params.reference}`,
        },
      ],
    });
  }

  public reserveCampaignBudget(params: {
    merchantId: string;
    campaignId: string;
    amountPaise: number;
    idempotencyKey: string;
  }): BudgetLedgerTransaction {
    DoubleEntryBudgetLedger.assertSafePaise(params.amountPaise, "reserveCampaignBudget");
    return this.postTransaction({
      idempotencyKey: params.idempotencyKey,
      type: "BUDGET_RESERVATION",
      merchantId: params.merchantId,
      campaignId: params.campaignId,
      entries: [
        {
          account: "MERCHANT_AD_WALLET",
          direction: "DEBIT",
          amountPaise: params.amountPaise,
          entityId: params.merchantId,
          memo: `Reserved budget commitment for campaign ${params.campaignId}`,
        },
        {
          account: "CAMPAIGN_BUDGET_RESERVED",
          direction: "CREDIT",
          amountPaise: params.amountPaise,
          entityId: params.campaignId,
          memo: `Budget escrow allocation for campaign ${params.campaignId}`,
        },
      ],
    });
  }

  public recognizeSpendAndFees(params: {
    merchantId: string;
    campaignId: string;
    netMediaSpendPaise: number;
    platformCommissionBps?: number; // default 1000 = 10%
    channel: string;
    idempotencyPrefix: string;
  }): {
    spendTx: BudgetLedgerTransaction;
    feeTx: BudgetLedgerTransaction;
    gstTx: BudgetLedgerTransaction;
    totalDeductedPaise: number;
  } {
    DoubleEntryBudgetLedger.assertSafePaise(params.netMediaSpendPaise, "netMediaSpendPaise");
    const commissionBps = params.platformCommissionBps ?? 1000;
    const feePaise = Math.round((params.netMediaSpendPaise * commissionBps) / 10000);
    const gstPaise = Math.round((feePaise * 1800) / 10000); // 18% GST on platform fee
    DoubleEntryBudgetLedger.assertSafePaise(feePaise, "feePaise");
    DoubleEntryBudgetLedger.assertSafePaise(gstPaise, "gstPaise");

    // 1. Media Spend Entry
    const spendTx = this.postTransaction({
      idempotencyKey: `${params.idempotencyPrefix}_spend`,
      type: "SPEND_RECOGNIZED",
      merchantId: params.merchantId,
      campaignId: params.campaignId,
      entries: [
        {
          account: "CAMPAIGN_BUDGET_RESERVED",
          direction: "DEBIT",
          amountPaise: params.netMediaSpendPaise,
          entityId: params.campaignId,
          memo: `Media spend incurred on ${params.channel} for campaign ${params.campaignId}`,
        },
        {
          account: "AD_NETWORK_PAYABLE",
          direction: "CREDIT",
          amountPaise: params.netMediaSpendPaise,
          entityId: params.channel,
          memo: `Payable liability to publisher network ${params.channel}`,
        },
      ],
    });

    // 2. Platform Commission Entry
    const feeTx = this.postTransaction({
      idempotencyKey: `${params.idempotencyPrefix}_fee`,
      type: "FEE_COMMISSION",
      merchantId: params.merchantId,
      campaignId: params.campaignId,
      entries: [
        {
          account: "CAMPAIGN_BUDGET_RESERVED",
          direction: "DEBIT",
          amountPaise: feePaise,
          entityId: params.campaignId,
          memo: `Platform ad management fee (${commissionBps / 100}%) on campaign ${params.campaignId}`,
        },
        {
          account: "PLATFORM_FEE_REVENUE",
          direction: "CREDIT",
          amountPaise: feePaise,
          entityId: "PLATFORM_TREASURY",
          memo: `Earned platform ad management commission fee on campaign ${params.campaignId}`,
        },
      ],
    });

    // 3. 18% GST Tax Entry
    const gstTx = this.postTransaction({
      idempotencyKey: `${params.idempotencyPrefix}_gst`,
      type: "GST_TAX_18",
      merchantId: params.merchantId,
      campaignId: params.campaignId,
      entries: [
        {
          account: "CAMPAIGN_BUDGET_RESERVED",
          direction: "DEBIT",
          amountPaise: gstPaise,
          entityId: params.campaignId,
          memo: `18% GST output tax on platform fee for campaign ${params.campaignId}`,
        },
        {
          account: "GST_OUTPUT_LIABILITY",
          direction: "CREDIT",
          amountPaise: gstPaise,
          entityId: "GOVT_TAX_TREASURY",
          memo: `18% GST output tax payable to Government for campaign ${params.campaignId}`,
        },
      ],
    });

    return {
      spendTx,
      feeTx,
      gstTx,
      totalDeductedPaise: params.netMediaSpendPaise + feePaise + gstPaise,
    };
  }

  public releaseReservation(params: {
    merchantId: string;
    campaignId: string;
    amountPaise: number;
    idempotencyKey: string;
    reason: string;
  }): BudgetLedgerTransaction {
    DoubleEntryBudgetLedger.assertSafePaise(params.amountPaise, "releaseReservation");
    return this.postTransaction({
      idempotencyKey: params.idempotencyKey,
      type: "RESERVATION_RELEASE",
      merchantId: params.merchantId,
      campaignId: params.campaignId,
      entries: [
        {
          account: "CAMPAIGN_BUDGET_RESERVED",
          direction: "DEBIT",
          amountPaise: params.amountPaise,
          entityId: params.campaignId,
          memo: `Unspent reservation released: ${params.reason}`,
        },
        {
          account: "MERCHANT_AD_WALLET",
          direction: "CREDIT",
          amountPaise: params.amountPaise,
          entityId: params.merchantId,
          memo: `Unspent budget returned to available balance for campaign ${params.campaignId}`,
        },
      ],
    });
  }

  public refundMerchant(params: {
    merchantId: string;
    amountPaise: number;
    idempotencyKey: string;
    payoutUpiOrIban: string;
  }): BudgetLedgerTransaction {
    DoubleEntryBudgetLedger.assertSafePaise(params.amountPaise, "refundMerchant");
    return this.postTransaction({
      idempotencyKey: params.idempotencyKey,
      type: "MERCHANT_REFUND",
      merchantId: params.merchantId,
      entries: [
        {
          account: "MERCHANT_AD_WALLET",
          direction: "DEBIT",
          amountPaise: params.amountPaise,
          entityId: params.merchantId,
          memo: `Merchant balance withdrawal refund to ${params.payoutUpiOrIban}`,
        },
        {
          account: "BANK_CLEARING",
          direction: "CREDIT",
          amountPaise: params.amountPaise,
          entityId: "GATEWAY_BANK",
          memo: `Disbursement from bank escrow to ${params.payoutUpiOrIban}`,
        },
      ],
    });
  }
}
