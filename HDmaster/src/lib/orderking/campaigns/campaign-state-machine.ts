import * as crypto from "crypto";

export type CampaignState =
  | "DRAFT"
  | "IN_REVIEW"
  | "APPROVED"
  | "QUEUED"
  | "SUBMITTED"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED";

export type AdFormat =
  | "IMAGE"
  | "CAROUSEL"
  | "VIDEO"
  | "TEXT_TEMPLATE"
  | "INTERACTIVE_WHATSAPP";

export type BiddingStrategy =
  | "LOWEST_COST"
  | "TARGET_COST"
  | "MAX_IMPRESSIONS";

export type ChannelType =
  | "WHATSAPP_BUSINESS"
  | "META_ADS"
  | "GOOGLE_LOCAL"
  | "DLT_SMS";

export interface CampaignCreative {
  headline: string;
  bodyText: string;
  mediaUrls: string[];
  callToAction: string;
  adFormat: AdFormat;
}

export interface CampaignBudget {
  totalBudgetPaise: number; // Integer paise only
  dailyBudgetPaise: number; // Integer paise only
  maxCpcPaise?: number;     // Optional cap
  biddingStrategy: BiddingStrategy;
}

export interface CampaignProviderAccount {
  channel: ChannelType;
  accountId: string;        // e.g. Meta Ad Account ID, WABA ID, Google Ads Customer ID
  senderOrPhoneId: string;  // e.g. WhatsApp Phone Number ID, DLT Header / Sender ID
}

export interface TargetGeography {
  state: string;           // Standard Indian State / UT name
  stateCodeGst: string;    // 2-digit GST code e.g. "18" (Assam), "27" (MH)
  district: string;        // District name
  city: string;            // City name
  pincode: string;         // Exact 6-digit Indian PIN code: ^[1-9][0-9]{5}$
  radiusKm: number;        // Hyper-local radius e.g. 0.5 to 30.0 km
}

export interface CampaignRecord {
  campaignId: string;
  merchantId: string;
  name: string;
  state: CampaignState;
  creative: CampaignCreative;
  budget: CampaignBudget;
  landingUrl: string;
  providerAccount: CampaignProviderAccount;
  geography: TargetGeography;
  
  // Immutability & Approval Guard Metadata
  approvedAt?: string;
  approvedBy?: string;
  approvalFingerprint?: string; // SHA-256 of protected fields at the moment of approval
  invalidationReason?: string;
  
  // Execution references
  externalCampaignId?: string; // Set when SUBMITTED to network
  reservedBudgetPaise: number; // Currently locked in ledger
  spentBudgetPaise: number;    // Cumulative spend recognized
  
  createdAt: string;
  updatedAt: string;
}

/**
 * Computes deterministic SHA-256 fingerprint over approval-protected fields.
 * Any divergence between the record and this hash triggers instant approval invalidation.
 */
export function computeCampaignApprovalFingerprint(payload: {
  creative: CampaignCreative;
  budget: CampaignBudget;
  landingUrl: string;
  providerAccount: CampaignProviderAccount;
}): string {
  const canonical = JSON.stringify({
    creative: {
      headline: payload.creative.headline.trim(),
      bodyText: payload.creative.bodyText.trim(),
      mediaUrls: [...payload.creative.mediaUrls].map((u) => u.trim()).sort(),
      callToAction: payload.creative.callToAction.trim(),
      adFormat: payload.creative.adFormat,
    },
    budget: {
      totalBudgetPaise: payload.budget.totalBudgetPaise,
      dailyBudgetPaise: payload.budget.dailyBudgetPaise,
      maxCpcPaise: payload.budget.maxCpcPaise ?? null,
      biddingStrategy: payload.budget.biddingStrategy,
    },
    landingUrl: payload.landingUrl.trim(),
    providerAccount: {
      channel: payload.providerAccount.channel,
      accountId: payload.providerAccount.accountId.trim(),
      senderOrPhoneId: payload.providerAccount.senderOrPhoneId.trim(),
    },
  });
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

export class CampaignStateMachine {
  private static readonly ALLOWED_TRANSITIONS: Record<CampaignState, CampaignState[]> = {
    DRAFT: ["IN_REVIEW", "CANCELLED"],
    IN_REVIEW: ["APPROVED", "DRAFT", "CANCELLED"],
    APPROVED: ["QUEUED", "DRAFT", "CANCELLED"],
    QUEUED: ["SUBMITTED", "CANCELLED", "FAILED"],
    SUBMITTED: ["COMPLETED", "CANCELLED", "FAILED"],
    COMPLETED: [],
    CANCELLED: [],
    FAILED: [],
  };

  /**
   * Asserts if transition is permissible in the state graph.
   */
  public static canTransition(from: CampaignState, to: CampaignState): boolean {
    return this.ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
  }

  /**
   * Explicit Guard: Checks if any protected fields were modified.
   * If campaign was in APPROVED state, this invalidates approval and returns DRAFT.
   */
  public static mutateCampaignFields(
    current: CampaignRecord,
    mutations: {
      name?: string;
      creative?: Partial<CampaignCreative>;
      budget?: Partial<CampaignBudget>;
      landingUrl?: string;
      providerAccount?: Partial<CampaignProviderAccount>;
      geography?: Partial<TargetGeography>;
    }
  ): { updatedCampaign: CampaignRecord; approvalInvalidated: boolean } {
    if (["SUBMITTED", "COMPLETED", "CANCELLED", "FAILED"].includes(current.state)) {
      throw new Error(`Cannot modify campaign in terminal or active state '${current.state}'.`);
    }

    const nextCreative: CampaignCreative = {
      ...current.creative,
      ...(mutations.creative ?? {}),
      mediaUrls: mutations.creative?.mediaUrls ? [...mutations.creative.mediaUrls] : current.creative.mediaUrls,
    };

    const nextBudget: CampaignBudget = {
      ...current.budget,
      ...(mutations.budget ?? {}),
    };

    // SafeInteger validation on budget
    if (!Number.isSafeInteger(nextBudget.totalBudgetPaise) || nextBudget.totalBudgetPaise <= 0) {
      throw new Error(`totalBudgetPaise must be a positive SafeInteger. Got: ${nextBudget.totalBudgetPaise}`);
    }
    if (!Number.isSafeInteger(nextBudget.dailyBudgetPaise) || nextBudget.dailyBudgetPaise <= 0) {
      throw new Error(`dailyBudgetPaise must be a positive SafeInteger. Got: ${nextBudget.dailyBudgetPaise}`);
    }
    if (nextBudget.dailyBudgetPaise > nextBudget.totalBudgetPaise) {
      throw new Error(`dailyBudgetPaise (${nextBudget.dailyBudgetPaise}) cannot exceed totalBudgetPaise (${nextBudget.totalBudgetPaise}).`);
    }

    const nextLandingUrl = (mutations.landingUrl ?? current.landingUrl).trim();
    const nextProviderAccount: CampaignProviderAccount = {
      ...current.providerAccount,
      ...(mutations.providerAccount ?? {}),
    };

    const nextGeography: TargetGeography = {
      ...current.geography,
      ...(mutations.geography ?? {}),
    };

    const newFingerprint = computeCampaignApprovalFingerprint({
      creative: nextCreative,
      budget: nextBudget,
      landingUrl: nextLandingUrl,
      providerAccount: nextProviderAccount,
    });

    const hasProtectedFieldChanged =
      !current.approvalFingerprint || current.approvalFingerprint !== newFingerprint;

    let nextState = current.state;
    let approvalInvalidated = false;
    let invalidationReason: string | undefined = undefined;

    // EXPLICIT GUARD: Changing creative, budget, landing URL, or provider account invalidates approval
    if (current.state === "APPROVED" && hasProtectedFieldChanged) {
      nextState = "DRAFT";
      approvalInvalidated = true;
      invalidationReason = "Approval invalidated due to mutation of protected fields (creative/budget/landingUrl/providerAccount).";
    }

    const now = new Date().toISOString();

    const updatedCampaign: CampaignRecord = {
      ...current,
      name: mutations.name ?? current.name,
      creative: nextCreative,
      budget: nextBudget,
      landingUrl: nextLandingUrl,
      providerAccount: nextProviderAccount,
      geography: nextGeography,
      state: nextState,
      updatedAt: now,
      approvalFingerprint: approvalInvalidated ? undefined : current.approvalFingerprint,
      approvedAt: approvalInvalidated ? undefined : current.approvedAt,
      approvedBy: approvalInvalidated ? undefined : current.approvedBy,
      invalidationReason,
    };

    return { updatedCampaign, approvalInvalidated };
  }

  /**
   * Advances state with strict verification.
   */
  public static transition(
    campaign: CampaignRecord,
    targetState: CampaignState,
    metadata?: { approvedBy?: string; externalCampaignId?: string; reason?: string }
  ): CampaignRecord {
    if (!this.canTransition(campaign.state, targetState)) {
      throw new Error(`Invalid state transition: Cannot transition from '${campaign.state}' to '${targetState}'.`);
    }

    const now = new Date().toISOString();

    // 1. Transition to APPROVED: Compute and seal the approval fingerprint
    if (targetState === "APPROVED") {
      if (!metadata?.approvedBy) {
        throw new Error("Approver identifier is mandatory when moving campaign to APPROVED.");
      }
      const fingerprint = computeCampaignApprovalFingerprint(campaign);
      return {
        ...campaign,
        state: "APPROVED",
        approvedAt: now,
        approvedBy: metadata.approvedBy,
        approvalFingerprint: fingerprint,
        invalidationReason: undefined,
        updatedAt: now,
      };
    }

    // 2. Transition to QUEUED: Verify approval fingerprint integrity
    if (targetState === "QUEUED") {
      if (campaign.state !== "APPROVED") {
        throw new Error(`Campaign must be in APPROVED state before queuing. Current state: '${campaign.state}'.`);
      }
      const currentFingerprint = computeCampaignApprovalFingerprint(campaign);
      if (!campaign.approvalFingerprint || campaign.approvalFingerprint !== currentFingerprint) {
        throw new Error(
          "Approval integrity violation: Campaign payload fingerprint does not match approved fingerprint. Re-approval required."
        );
      }
      return {
        ...campaign,
        state: "QUEUED",
        updatedAt: now,
      };
    }

    // 3. Transition to SUBMITTED
    if (targetState === "SUBMITTED") {
      if (!metadata?.externalCampaignId) {
        throw new Error("externalCampaignId from ad provider is mandatory when moving to SUBMITTED.");
      }
      return {
        ...campaign,
        state: "SUBMITTED",
        externalCampaignId: metadata.externalCampaignId,
        updatedAt: now,
      };
    }

    // 4. Terminal states or rejection
    return {
      ...campaign,
      state: targetState,
      updatedAt: now,
    };
  }
}
