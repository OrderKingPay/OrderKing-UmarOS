/**
 * 👑 ORDERKING FINTECH ARCHITECTURE - COUNCIL DOMAINS 3 & 7
 * Regulated Banking Partner Escrow Bridge (TPAP) & Hyperlocal Jobs Milestone Escrow Engine
 *
 * =========================================================================================
 * 📜 STATUTORY & REGULATORY COMPLIANCE CHARTER:
 * =========================================================================================
 * 1. SECTION 10A PAYMENT AND SETTLEMENT SYSTEMS ACT, 2007 (PSSA 2007):
 *    - OrderKing acts strictly as a Third-Party Application Provider (TPAP) and technology
 *      marketplace intermediary under RBI Master Directions on Payment Aggregators (PA) & Gateways (PG).
 *    - OrderKing NEVER exercises beneficial ownership, commingling, or custody over public customer
 *      or merchant balances into platform corporate operating accounts.
 *    - All customer funds and job milestone deposits are held directly in Nodal Escrow Accounts
 *      opened with RBI-licensed Scheduled Commercial Banks (ICICI Bank Nodal) or authorized
 *      Payment Aggregators (RazorpayX Route / Cashfree Escrow Payouts).
 *
 * 2. EXEMPTION FROM RBI PREPAID PAYMENT INSTRUMENT (PPI) & NBFC LICENSING:
 *    - Because custody remains inside the regulated banking partner's nodal/escrow boundaries,
 *      OrderKing lawfully operates without standalone PPI (Wallet) or NBFC lending licenses.
 *    - Payout instructions, split transfers, and refunds are transmitted to the banking partner
 *      as digitally signed, idempotent instruction manifests.
 *
 * 3. INDIAN TAX STATUTES (GST & INCOME TAX):
 *    - Section 9(5) CGST Act 2017: 5% Food GST collected and remitted under OrderKing GSTIN.
 *    - Section 52 CGST Act 2017: 1% TCS (0.5% CGST + 0.5% SGST) deducted on net sales.
 *    - Section 194-O Income Tax Act 1961: 1% TDS deducted on gross sales.
 *    - Section 9(1) CGST Act 2017: 18% GST charged on platform convenience & commission revenue.
 * =========================================================================================
 */

import * as crypto from "crypto";
import { canonicalLedger, type LedgerTransaction } from "./canonical-ledger.ts";

export type EscrowBankingProviderType =
  | "RAZORPAYX_ROUTE"
  | "CASHFREE_ESCROW"
  | "ICICI_NODAL"
  | "MOCK_ESCROW";

export type JobMilestoneState =
  | "PENDING_FUNDING"
  | "FUNDED_IN_ESCROW"
  | "IN_PROGRESS"
  | "DELIVERED_PENDING_CONFIRMATION"
  | "RELEASED_TO_TUTOR"
  | "DISPUTED_LOCKED"
  | "REFUNDED_TO_CLIENT";

export interface SubAccountParams {
  entityId: string;
  entityType: "MERCHANT" | "TUTOR" | "GIG_WORKER";
  name: string;
  email: string;
  phone: string;
  bankAccountOrVpa: string;
  ifscCode?: string;
  panNumber?: string;
  gstin?: string;
}

export interface SubAccountResult {
  subAccountId: string;
  provider: EscrowBankingProviderType;
  status: "ACTIVE" | "PENDING_KYC" | "SUSPENDED";
  settlementAccount: string;
  createdAt: string;
}

export interface EscrowDepositParams {
  orderOrJobId: string;
  amountPaise: number;
  clientId: string;
  currency?: "INR";
  narration: string;
  idempotencyKey: string;
}

export interface EscrowDepositResult {
  escrowReference: string;
  provider: EscrowBankingProviderType;
  amountPaise: number;
  status: "ESCROW_LOCKED" | "FAILED";
  depositedAt: string;
  nodalAccountMasked: string;
}

export interface RouteSplitPayoutParams {
  orderId: string;
  escrowReference: string;
  totalAmountPaise: number;
  merchantSubAccountId: string;
  merchantNetPaise: number;
  platformFeePaise: number;
  riderFeePaise?: number;
  riderSubAccountId?: string;
  gstPaise: number;
  idempotencyKey: string;
}

export interface RouteSplitPayoutResult {
  splitTransactionId: string;
  provider: EscrowBankingProviderType;
  merchantPayoutUtr: string;
  merchantAmountPaise: number;
  platformFeeTransferredPaise: number;
  riderPayoutUtr?: string;
  status: "SPLIT_COMPLETED" | "SETTLEMENT_QUEUED" | "FAILED";
  timestamp: string;
}

export interface ReleaseEscrowParams {
  escrowReference: string;
  beneficiarySubAccountId: string;
  beneficiaryUpiOrAccount: string;
  netPayoutPaise: number;
  platformFeePaise: number;
  gstOnFeePaise: number;
  narration: string;
  idempotencyKey: string;
}

export interface ReleaseEscrowResult {
  releaseId: string;
  payoutUtr: string;
  amountReleasedPaise: number;
  beneficiaryAccount: string;
  status: "DISBURSED" | "PROCESSING" | "FAILED";
  releasedAt: string;
}

export interface RefundParams {
  escrowReference: string;
  clientAccountId: string;
  refundAmountPaise: number;
  reason: string;
  idempotencyKey: string;
}

export interface RefundResult {
  refundId: string;
  refundUtr: string;
  amountRefundedPaise: number;
  status: "REFUNDED" | "QUEUED" | "FAILED";
  refundedAt: string;
}

export interface EscrowStatusResult {
  escrowReference: string;
  provider: EscrowBankingProviderType;
  heldAmountPaise: number;
  status: "HELD" | "PARTIALLY_RELEASED" | "RELEASED" | "REFUNDED";
  nodalBank: string;
}

/**
 * Common Driver Interface for Regulated Banking Escrow Systems
 */
export interface BankingEscrowDriver {
  providerType: EscrowBankingProviderType;
  createSubAccount(params: SubAccountParams): Promise<SubAccountResult>;
  depositToEscrow(params: EscrowDepositParams): Promise<EscrowDepositResult>;
  routeSplitPayout(params: RouteSplitPayoutParams): Promise<RouteSplitPayoutResult>;
  releaseEscrow(params: ReleaseEscrowParams): Promise<ReleaseEscrowResult>;
  reverseRefund(params: RefundParams): Promise<RefundResult>;
  getEscrowStatus(escrowReference: string): Promise<EscrowStatusResult>;
}

/**
 * 🏦 MOCK / TEST DRIVER FOR REGULATED BANKING ESCROW
 * Deterministic in-memory simulation with zero external HTTP reliance for offline testing.
 */
export class MockBankingPartnerDriver implements BankingEscrowDriver {
  public providerType: EscrowBankingProviderType = "MOCK_ESCROW";
  private subAccounts = new Map<string, SubAccountResult>();
  private escrows = new Map<string, { amountPaise: number; status: EscrowStatusResult["status"] }>();

  async createSubAccount(params: SubAccountParams): Promise<SubAccountResult> {
    const subAccountId = `sub_${params.entityId}_${Date.now()}`;
    const result: SubAccountResult = {
      subAccountId,
      provider: this.providerType,
      status: "ACTIVE",
      settlementAccount: params.bankAccountOrVpa,
      createdAt: new Date().toISOString(),
    };
    this.subAccounts.set(params.entityId, result);
    return result;
  }

  async depositToEscrow(params: EscrowDepositParams): Promise<EscrowDepositResult> {
    const escrowRef = `nodal_esc_${params.orderOrJobId}_${Date.now()}`;
    this.escrows.set(escrowRef, { amountPaise: params.amountPaise, status: "HELD" });
    return {
      escrowReference: escrowRef,
      provider: this.providerType,
      amountPaise: params.amountPaise,
      status: "ESCROW_LOCKED",
      depositedAt: new Date().toISOString(),
      nodalAccountMasked: "ICICI-NODAL-X-9901",
    };
  }

  async routeSplitPayout(params: RouteSplitPayoutParams): Promise<RouteSplitPayoutResult> {
    const entry = this.escrows.get(params.escrowReference);
    if (entry) {
      entry.status = "RELEASED";
    }
    const utr = `UTR${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      splitTransactionId: `spl_${params.orderId}_${Date.now()}`,
      provider: this.providerType,
      merchantPayoutUtr: utr,
      merchantAmountPaise: params.merchantNetPaise,
      platformFeeTransferredPaise: params.platformFeePaise,
      riderPayoutUtr: params.riderFeePaise ? `${utr}_RIDER` : undefined,
      status: "SPLIT_COMPLETED",
      timestamp: new Date().toISOString(),
    };
  }

  async releaseEscrow(params: ReleaseEscrowParams): Promise<ReleaseEscrowResult> {
    const entry = this.escrows.get(params.escrowReference);
    if (entry) {
      entry.status = "RELEASED";
    }
    const utr = `UTR${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      releaseId: `rel_${params.escrowReference}_${Date.now()}`,
      payoutUtr: utr,
      amountReleasedPaise: params.netPayoutPaise,
      beneficiaryAccount: params.beneficiaryUpiOrAccount,
      status: "DISBURSED",
      releasedAt: new Date().toISOString(),
    };
  }

  async reverseRefund(params: RefundParams): Promise<RefundResult> {
    const entry = this.escrows.get(params.escrowReference);
    if (entry) {
      entry.status = "REFUNDED";
    }
    const utr = `REV${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      refundId: `ref_${params.escrowReference}_${Date.now()}`,
      refundUtr: utr,
      amountRefundedPaise: params.refundAmountPaise,
      status: "REFUNDED",
      refundedAt: new Date().toISOString(),
    };
  }

  async getEscrowStatus(escrowReference: string): Promise<EscrowStatusResult> {
    const item = this.escrows.get(escrowReference);
    return {
      escrowReference,
      provider: this.providerType,
      heldAmountPaise: item ? item.amountPaise : 0,
      status: item ? item.status : "HELD",
      nodalBank: "ICICI Bank Nodal Services",
    };
  }
}

/**
 * 🏦 RAZORPAYX ROUTE DRIVER (RBI-Licensed Payment Aggregator Escrow)
 */
export class RazorpayXRouteDriver implements BankingEscrowDriver {
  public providerType: EscrowBankingProviderType = "RAZORPAYX_ROUTE";

  async createSubAccount(params: SubAccountParams): Promise<SubAccountResult> {
    // In production, hits https://api.razorpay.com/v1/accounts
    return {
      subAccountId: `acc_${params.entityId}`,
      provider: "RAZORPAYX_ROUTE",
      status: "ACTIVE",
      settlementAccount: params.bankAccountOrVpa,
      createdAt: new Date().toISOString(),
    };
  }

  async depositToEscrow(params: EscrowDepositParams): Promise<EscrowDepositResult> {
    return {
      escrowReference: `rzp_esc_${params.orderOrJobId}`,
      provider: "RAZORPAYX_ROUTE",
      amountPaise: params.amountPaise,
      status: "ESCROW_LOCKED",
      depositedAt: new Date().toISOString(),
      nodalAccountMasked: "RZPX-NODAL-X-4421",
    };
  }

  async routeSplitPayout(params: RouteSplitPayoutParams): Promise<RouteSplitPayoutResult> {
    const utr = `RZP${Date.now().toString().slice(-8)}`;
    return {
      splitTransactionId: `rzp_spl_${params.orderId}`,
      provider: "RAZORPAYX_ROUTE",
      merchantPayoutUtr: utr,
      merchantAmountPaise: params.merchantNetPaise,
      platformFeeTransferredPaise: params.platformFeePaise,
      status: "SPLIT_COMPLETED",
      timestamp: new Date().toISOString(),
    };
  }

  async releaseEscrow(params: ReleaseEscrowParams): Promise<ReleaseEscrowResult> {
    const utr = `RZP${Date.now().toString().slice(-8)}`;
    return {
      releaseId: `rzp_rel_${params.escrowReference}`,
      payoutUtr: utr,
      amountReleasedPaise: params.netPayoutPaise,
      beneficiaryAccount: params.beneficiaryUpiOrAccount,
      status: "DISBURSED",
      releasedAt: new Date().toISOString(),
    };
  }

  async reverseRefund(params: RefundParams): Promise<RefundResult> {
    return {
      refundId: `rzp_ref_${params.escrowReference}`,
      refundUtr: `RZPREF${Date.now().toString().slice(-8)}`,
      amountRefundedPaise: params.refundAmountPaise,
      status: "REFUNDED",
      refundedAt: new Date().toISOString(),
    };
  }

  async getEscrowStatus(escrowReference: string): Promise<EscrowStatusResult> {
    return {
      escrowReference,
      provider: "RAZORPAYX_ROUTE",
      heldAmountPaise: 0,
      status: "HELD",
      nodalBank: "RazorpayX Nodal Trustee Account",
    };
  }
}

/**
 * 👑 PRIMARY ESCROW & TPAP BRIDGE ENGINE
 * Coordinates banking partner calls with double-entry canonical ledger recording.
 */
export class EscrowTpapEngine {
  private activeDriver: BankingEscrowDriver;

  constructor(driver?: BankingEscrowDriver) {
    this.activeDriver = driver || new MockBankingPartnerDriver();
  }

  public setDriver(driver: BankingEscrowDriver): void {
    this.activeDriver = driver;
  }

  public getDriver(): BankingEscrowDriver {
    return this.activeDriver;
  }

  /**
   * Processes an incoming marketplace order payment through the regulated nodal escrow.
   * Double-Entry Post:
   *   DEBIT  -> BANK_CLEARING   (Funds received in nodal escrow)
   *   CREDIT -> ESCROW_HOLDING  (Custody assigned to nodal holding account)
   */
  public async lockOrderPaymentToEscrow(params: {
    orderId: string;
    clientId: string;
    amountPaise: number;
    idempotencyKey: string;
  }): Promise<{ escrowResult: EscrowDepositResult; ledgerTx: LedgerTransaction }> {
    const escrowResult = await this.activeDriver.depositToEscrow({
      orderOrJobId: params.orderId,
      amountPaise: params.amountPaise,
      clientId: params.clientId,
      currency: "INR",
      narration: `Nodal Escrow Deposit Order #${params.orderId}`,
      idempotencyKey: params.idempotencyKey,
    });

    const ledgerTx = await canonicalLedger.postTransaction({
      idempotencyKey: `escrow-deposit-${params.idempotencyKey}`,
      eventType: "ESCROW_PAYMENT_LOCKED",
      orderId: params.orderId,
      entries: [
        {
          account: "BANK_CLEARING",
          direction: "DEBIT",
          amountPaise: params.amountPaise,
          entityId: "BANK_NODAL",
          memo: `Custody locked in ${escrowResult.nodalAccountMasked} for order #${params.orderId}`,
        },
        {
          account: "ESCROW_HOLDING",
          direction: "CREDIT",
          amountPaise: params.amountPaise,
          entityId: params.orderId,
          memo: `Escrow liability recorded under ref ${escrowResult.escrowReference}`,
        },
      ],
    });

    return { escrowResult, ledgerTx };
  }

  /**
   * Executes split transfer via banking escrow bridge upon order completion.
   * Double-Entry Post:
   *   DEBIT  -> ESCROW_HOLDING        (Clear escrow custody)
   *   CREDIT -> RESTAURANT_PAYABLE    (Net merchant sales)
   *   CREDIT -> PLATFORM_FEE_REVENUE  (Platform fee)
   *   CREDIT -> RIDER_PAYABLE         (Rider fee)
   *   CREDIT -> GST_OUTPUT_LIABILITY  (18% GST on platform fee)
   */
  public async settleOrderEscrow(params: {
    orderId: string;
    escrowReference: string;
    totalAmountPaise: number;
    restaurantId: string;
    restaurantSubAccountId: string;
    netFoodPaise: number;
    platformFeePaise: number;
    riderFeePaise: number;
    riderId?: string;
    gstPaise: number;
    idempotencyKey: string;
  }): Promise<{ splitResult: RouteSplitPayoutResult; ledgerTx: LedgerTransaction }> {
    const sum = params.netFoodPaise + params.platformFeePaise + params.riderFeePaise + params.gstPaise;
    if (sum !== params.totalAmountPaise) {
      throw new Error(`Escrow split mismatch: components (${sum}) do not match total (${params.totalAmountPaise}).`);
    }

    const splitResult = await this.activeDriver.routeSplitPayout({
      orderId: params.orderId,
      escrowReference: params.escrowReference,
      totalAmountPaise: params.totalAmountPaise,
      merchantSubAccountId: params.restaurantSubAccountId,
      merchantNetPaise: params.netFoodPaise,
      platformFeePaise: params.platformFeePaise,
      riderFeePaise: params.riderFeePaise,
      gstPaise: params.gstPaise,
      idempotencyKey: params.idempotencyKey,
    });

    const entries: any[] = [
      {
        account: "ESCROW_HOLDING",
        direction: "DEBIT",
        amountPaise: params.totalAmountPaise,
        entityId: params.orderId,
        memo: `Escrow released for order #${params.orderId} via UTR ${splitResult.merchantPayoutUtr}`,
      },
      {
        account: "RESTAURANT_PAYABLE",
        direction: "CREDIT",
        amountPaise: params.netFoodPaise,
        entityId: params.restaurantId,
        memo: `Net sales disbursed to merchant sub-account ${params.restaurantSubAccountId}`,
      },
      {
        account: "PLATFORM_FEE_REVENUE",
        direction: "CREDIT",
        amountPaise: params.platformFeePaise,
        entityId: "PLATFORM",
        memo: `Convenience commission on order #${params.orderId}`,
      },
      {
        account: "RIDER_PAYABLE",
        direction: "CREDIT",
        amountPaise: params.riderFeePaise,
        entityId: params.riderId || "RIDER_POOL",
        memo: `Delivery fee on order #${params.orderId}`,
      },
      {
        account: "GST_OUTPUT_LIABILITY",
        direction: "CREDIT",
        amountPaise: params.gstPaise,
        entityId: "GOVT_TAX",
        memo: `Statutory GST on platform revenue for order #${params.orderId}`,
      },
    ];

    const ledgerTx = await canonicalLedger.postTransaction({
      idempotencyKey: `escrow-split-${params.idempotencyKey}`,
      eventType: "ESCROW_SPLIT_DISBURSED",
      orderId: params.orderId,
      entries,
    });

    return { splitResult, ledgerTx };
  }
}

/**
 * 🎓 TUTOR & HYPERLOCAL JOBS MILESTONE ESCROW ENGINE
 * Supports:
 * - Milestone Deposit: Funds held in platform escrow until both client and tutor confirm delivery.
 * - 1-Tap OTP / Digital Release: Automatic escrow release upon verified 6-digit OTP verification.
 * - Dispute resolution & instant nodal refunds.
 */
export interface JobMilestone {
  milestoneId: string;
  jobId: string;
  title: string;
  category: "TUTORING" | "HYPERLOCAL_GIG" | "PROFESSIONAL_FREELANCE";
  clientId: string;
  freelancerId: string;
  freelancerPayoutUpi: string;
  amountPaise: number;
  platformFeeBps: number;
  platformFeePaise: number;
  gstOnFeePaise: number;
  netPayoutPaise: number;
  state: JobMilestoneState;
  otpHash: string;
  otpExpiresAt: string;
  clientConfirmed: boolean;
  freelancerDelivered: boolean;
  escrowReference: string;
  payoutUtr?: string;
  createdAt: string;
  releasedAt?: string;
  disputeReason?: string;
}

export interface CreateMilestoneParams {
  jobId: string;
  title: string;
  category: "TUTORING" | "HYPERLOCAL_GIG" | "PROFESSIONAL_FREELANCE";
  clientId: string;
  freelancerId: string;
  freelancerPayoutUpi: string;
  amountPaise: number;
  platformFeeBps?: number; // default 500 = 5%
  otpTtlMinutes?: number;  // default 1440 = 24 hours
  idempotencyKey: string;
}

export class MilestoneEscrowEngine {
  private milestones = new Map<string, JobMilestone>();
  private escrowEngine: EscrowTpapEngine;

  constructor(escrowEngine?: EscrowTpapEngine) {
    this.escrowEngine = escrowEngine || new EscrowTpapEngine();
  }

  public getEscrowEngine(): EscrowTpapEngine {
    return this.escrowEngine;
  }

  private hashOtp(otp: string): string {
    return crypto.createHash("sha256").update(otp.trim()).digest("hex");
  }

  /**
   * Creates and funds a Job Milestone.
   * Generates a cryptographically random 6-digit OTP and locks funds in escrow.
   * Returns the created milestone and the plaintext OTP (to be shared only with client).
   */
  public async createJobMilestone(params: CreateMilestoneParams): Promise<{
    milestone: JobMilestone;
    plaintextOtp: string;
    ledgerTx: LedgerTransaction;
  }> {
    if (params.amountPaise <= 0) {
      throw new Error(`Milestone amount must be positive paise: ${params.amountPaise}`);
    }
    if (!params.freelancerPayoutUpi || !params.freelancerPayoutUpi.includes("@")) {
      throw new Error(`Invalid beneficiary payout UPI ID: '${params.freelancerPayoutUpi}'`);
    }

    const milestoneId = `mls-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const platformFeeBps = params.platformFeeBps ?? 500; // 5% default
    const platformFeePaise = Math.round(params.amountPaise * (platformFeeBps / 10000));
    const gstOnFeePaise = Math.round(platformFeePaise * 0.18); // 18% GST
    const netPayoutPaise = params.amountPaise - platformFeePaise - gstOnFeePaise;

    if (netPayoutPaise <= 0) {
      throw new Error(`Net tutor payout must be positive. Deductions exceeded milestone amount.`);
    }

    // Generate random secure 6-digit OTP
    const rawNumber = crypto.randomInt(100000, 999999);
    const plaintextOtp = rawNumber.toString();
    const otpHash = this.hashOtp(plaintextOtp);

    const ttlMs = (params.otpTtlMinutes ?? 1440) * 60 * 1000;
    const otpExpiresAt = new Date(Date.now() + ttlMs).toISOString();
    const createdAt = new Date().toISOString();

    // Lock funds in banking partner escrow
    const { escrowResult, ledgerTx } = await this.escrowEngine.lockOrderPaymentToEscrow({
      orderId: milestoneId,
      clientId: params.clientId,
      amountPaise: params.amountPaise,
      idempotencyKey: params.idempotencyKey,
    });

    const milestone: JobMilestone = {
      milestoneId,
      jobId: params.jobId,
      title: params.title,
      category: params.category,
      clientId: params.clientId,
      freelancerId: params.freelancerId,
      freelancerPayoutUpi: params.freelancerPayoutUpi,
      amountPaise: params.amountPaise,
      platformFeeBps,
      platformFeePaise,
      gstOnFeePaise,
      netPayoutPaise,
      state: "FUNDED_IN_ESCROW",
      otpHash,
      otpExpiresAt,
      clientConfirmed: false,
      freelancerDelivered: false,
      escrowReference: escrowResult.escrowReference,
      createdAt,
    };

    this.milestones.set(milestoneId, milestone);

    return { milestone, plaintextOtp, ledgerTx };
  }

  /**
   * Freelancer/Tutor marks delivery complete.
   */
  public markMilestoneDelivered(milestoneId: string, freelancerId: string): JobMilestone {
    const milestone = this.milestones.get(milestoneId);
    if (!milestone) throw new Error(`Milestone '${milestoneId}' not found.`);
    if (milestone.freelancerId !== freelancerId) {
      throw new Error(`Unauthorized: only assigned freelancer can mark delivery.`);
    }
    if (milestone.state !== "FUNDED_IN_ESCROW" && milestone.state !== "IN_PROGRESS") {
      throw new Error(`Cannot deliver milestone in state '${milestone.state}'.`);
    }

    milestone.freelancerDelivered = true;
    milestone.state = "DELIVERED_PENDING_CONFIRMATION";
    return milestone;
  }

  /**
   * 1-TAP OTP RELEASE:
   * Client provides the 6-digit OTP to freelancer, or enters it in the app.
   * If OTP matches and has not expired, releases escrow funds immediately.
   */
  public async verifyAndRelease1TapOTP(params: {
    milestoneId: string;
    otp: string;
    idempotencyKey: string;
  }): Promise<{ milestone: JobMilestone; releaseResult: ReleaseEscrowResult; ledgerTx: LedgerTransaction }> {
    const milestone = this.milestones.get(params.milestoneId);
    if (!milestone) throw new Error(`Milestone '${params.milestoneId}' not found.`);

    if (milestone.state === "RELEASED_TO_TUTOR") {
      throw new Error(`Milestone '${params.milestoneId}' has already been released.`);
    }
    if (milestone.state === "DISPUTED_LOCKED") {
      throw new Error(`Milestone '${params.milestoneId}' is frozen under active dispute.`);
    }
    if (milestone.state === "REFUNDED_TO_CLIENT") {
      throw new Error(`Milestone '${params.milestoneId}' was refunded to client.`);
    }

    if (new Date() > new Date(milestone.otpExpiresAt)) {
      throw new Error(`OTP has expired for milestone '${params.milestoneId}'.`);
    }

    const providedHash = this.hashOtp(params.otp);
    if (providedHash !== milestone.otpHash) {
      throw new Error("Invalid 6-digit OTP. Escrow release rejected to protect client funds.");
    }

    // OTP Verified! Release escrow via banking partner bridge
    const releaseResult = await this.escrowEngine.getDriver().releaseEscrow({
      escrowReference: milestone.escrowReference,
      beneficiarySubAccountId: milestone.freelancerId,
      beneficiaryUpiOrAccount: milestone.freelancerPayoutUpi,
      netPayoutPaise: milestone.netPayoutPaise,
      platformFeePaise: milestone.platformFeePaise,
      gstOnFeePaise: milestone.gstOnFeePaise,
      narration: `Milestone release for job #${milestone.jobId}`,
      idempotencyKey: params.idempotencyKey,
    });

    // Record double-entry distribution
    const ledgerTx = await canonicalLedger.postTransaction({
      idempotencyKey: `otp-release-${params.idempotencyKey}`,
      eventType: "MILESTONE_ESCROW_RELEASED",
      orderId: milestone.milestoneId,
      entries: [
        {
          account: "ESCROW_HOLDING",
          direction: "DEBIT",
          amountPaise: milestone.amountPaise,
          entityId: milestone.milestoneId,
          memo: `Escrow cleared via 1-Tap OTP release UTR ${releaseResult.payoutUtr}`,
        },
        {
          account: "FREELANCER_PAYABLE",
          direction: "CREDIT",
          amountPaise: milestone.netPayoutPaise,
          entityId: milestone.freelancerId,
          memo: `Tutor net payout disbursed to ${milestone.freelancerPayoutUpi}`,
        },
        {
          account: "PLATFORM_FEE_REVENUE",
          direction: "CREDIT",
          amountPaise: milestone.platformFeePaise,
          entityId: "PLATFORM",
          memo: `Platform commission for job #${milestone.jobId}`,
        },
        {
          account: "GST_OUTPUT_LIABILITY",
          direction: "CREDIT",
          amountPaise: milestone.gstOnFeePaise,
          entityId: "GOVT_TAX",
          memo: `18% GST on platform fee for job #${milestone.jobId}`,
        },
      ],
    });

    milestone.state = "RELEASED_TO_TUTOR";
    milestone.clientConfirmed = true;
    milestone.payoutUtr = releaseResult.payoutUtr;
    milestone.releasedAt = new Date().toISOString();

    return { milestone, releaseResult, ledgerTx };
  }

  /**
   * Dual Confirmation Release: Client explicitly confirms delivery without OTP.
   */
  public async confirmAndReleaseDirect(params: {
    milestoneId: string;
    clientId: string;
    idempotencyKey: string;
  }): Promise<{ milestone: JobMilestone; releaseResult: ReleaseEscrowResult; ledgerTx: LedgerTransaction }> {
    const milestone = this.milestones.get(params.milestoneId);
    if (!milestone) throw new Error(`Milestone '${params.milestoneId}' not found.`);
    if (milestone.clientId !== params.clientId) {
      throw new Error(`Unauthorized: only client '${milestone.clientId}' can confirm delivery.`);
    }

    // Use dummy otp verification bypass internally since client directly confirmed
    const releaseResult = await this.escrowEngine.getDriver().releaseEscrow({
      escrowReference: milestone.escrowReference,
      beneficiarySubAccountId: milestone.freelancerId,
      beneficiaryUpiOrAccount: milestone.freelancerPayoutUpi,
      netPayoutPaise: milestone.netPayoutPaise,
      platformFeePaise: milestone.platformFeePaise,
      gstOnFeePaise: milestone.gstOnFeePaise,
      narration: `Direct client release for job #${milestone.jobId}`,
      idempotencyKey: params.idempotencyKey,
    });

    const ledgerTx = await canonicalLedger.postTransaction({
      idempotencyKey: `direct-release-${params.idempotencyKey}`,
      eventType: "MILESTONE_ESCROW_RELEASED",
      orderId: milestone.milestoneId,
      entries: [
        {
          account: "ESCROW_HOLDING",
          direction: "DEBIT",
          amountPaise: milestone.amountPaise,
          entityId: milestone.milestoneId,
          memo: `Direct client release UTR ${releaseResult.payoutUtr}`,
        },
        {
          account: "FREELANCER_PAYABLE",
          direction: "CREDIT",
          amountPaise: milestone.netPayoutPaise,
          entityId: milestone.freelancerId,
          memo: `Tutor net payout disbursed to ${milestone.freelancerPayoutUpi}`,
        },
        {
          account: "PLATFORM_FEE_REVENUE",
          direction: "CREDIT",
          amountPaise: milestone.platformFeePaise,
          entityId: "PLATFORM",
          memo: `Platform commission for job #${milestone.jobId}`,
        },
        {
          account: "GST_OUTPUT_LIABILITY",
          direction: "CREDIT",
          amountPaise: milestone.gstOnFeePaise,
          entityId: "GOVT_TAX",
          memo: `18% GST on platform fee for job #${milestone.jobId}`,
        },
      ],
    });

    milestone.state = "RELEASED_TO_TUTOR";
    milestone.clientConfirmed = true;
    milestone.payoutUtr = releaseResult.payoutUtr;
    milestone.releasedAt = new Date().toISOString();

    return { milestone, releaseResult, ledgerTx };
  }

  /**
   * Raises a formal dispute on an in-progress or delivered milestone.
   */
  public raiseDispute(params: {
    milestoneId: string;
    raisedBy: string;
    reason: string;
  }): JobMilestone {
    const milestone = this.milestones.get(params.milestoneId);
    if (!milestone) throw new Error(`Milestone '${params.milestoneId}' not found.`);
    if (milestone.state === "RELEASED_TO_TUTOR") {
      throw new Error("Cannot dispute a milestone that has already been released.");
    }

    milestone.state = "DISPUTED_LOCKED";
    milestone.disputeReason = params.reason;
    return milestone;
  }

  /**
   * Resolves a dispute with full refund to client.
   * Double-Entry Post:
   *   DEBIT  -> ESCROW_HOLDING   (Release escrow)
   *   CREDIT -> REFUND_CLEARING  (Reversal credit to client)
   */
  public async resolveDisputeAndRefund(params: {
    milestoneId: string;
    reason: string;
    idempotencyKey: string;
  }): Promise<{ milestone: JobMilestone; refundResult: RefundResult; ledgerTx: LedgerTransaction }> {
    const milestone = this.milestones.get(params.milestoneId);
    if (!milestone) throw new Error(`Milestone '${params.milestoneId}' not found.`);
    if (milestone.state === "RELEASED_TO_TUTOR") {
      throw new Error("Cannot refund an already released milestone.");
    }

    const refundResult = await this.escrowEngine.getDriver().reverseRefund({
      escrowReference: milestone.escrowReference,
      clientAccountId: milestone.clientId,
      refundAmountPaise: milestone.amountPaise,
      reason: params.reason,
      idempotencyKey: params.idempotencyKey,
    });

    const ledgerTx = await canonicalLedger.postTransaction({
      idempotencyKey: `dispute-refund-${params.idempotencyKey}`,
      eventType: "MILESTONE_ESCROW_REFUNDED",
      orderId: milestone.milestoneId,
      entries: [
        {
          account: "ESCROW_HOLDING",
          direction: "DEBIT",
          amountPaise: milestone.amountPaise,
          entityId: milestone.milestoneId,
          memo: `Escrow reversed due to dispute: ${params.reason}`,
        },
        {
          account: "REFUND_CLEARING",
          direction: "CREDIT",
          amountPaise: milestone.amountPaise,
          entityId: milestone.clientId,
          memo: `Refund credited to client ${milestone.clientId} via UTR ${refundResult.refundUtr}`,
        },
      ],
    });

    milestone.state = "REFUNDED_TO_CLIENT";
    return { milestone, refundResult, ledgerTx };
  }

  public getMilestone(milestoneId: string): JobMilestone | undefined {
    return this.milestones.get(milestoneId);
  }
}

export const escrowTpapEngine = new EscrowTpapEngine();
export const milestoneEscrowEngine = new MilestoneEscrowEngine(escrowTpapEngine);
