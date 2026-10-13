import { describe, it, expect } from "vitest";
import {
  CampaignStateMachine,
  computeCampaignApprovalFingerprint,
  type CampaignRecord,
} from "./campaign-state-machine";
import { DoubleEntryBudgetLedger } from "./budget-ledger";
import {
  validateTargetGeography,
  checkChannelConfiguration,
  INDIAN_STATES_AND_UTS,
} from "./merchant-campaign-contract";

describe("Campaign State Machine & Explicit Approval Invalidation Guard", () => {
  const baseCampaign: CampaignRecord = {
    campaignId: "cmp_biryani_promo_101",
    merchantId: "rest_behrouz_001",
    name: "Weekend Dum Biryani 20% Off",
    state: "DRAFT",
    creative: {
      headline: "Authentic Awadhi Dum Biryani",
      bodyText: "Get 20% flat discount on royal handi biryani orders above ₹499.",
      mediaUrls: ["https://cdn.orderking.app/creatives/biryani_hero.webp"],
      callToAction: "ORDER_NOW",
      adFormat: "IMAGE",
    },
    budget: {
      totalBudgetPaise: 500_000, // ₹5,000.00
      dailyBudgetPaise: 100_000, // ₹1,000.00
      maxCpcPaise: 500,          // ₹5.00
      biddingStrategy: "LOWEST_COST",
    },
    landingUrl: "https://orderking.app/restaurant/rest_behrouz_001?promo=ROYAL20",
    providerAccount: {
      channel: "META_ADS",
      accountId: "act_9876543210",
      senderOrPhoneId: "page_12345",
    },
    geography: {
      state: "ASSAM",
      stateCodeGst: "18",
      district: "Karimganj",
      city: "Karimganj",
      pincode: "788710",
      radiusKm: 7.5,
    },
    reservedBudgetPaise: 0,
    spentBudgetPaise: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("completes full happy-path state flow: DRAFT -> IN_REVIEW -> APPROVED -> QUEUED -> SUBMITTED -> COMPLETED", () => {
    // 1. DRAFT -> IN_REVIEW
    const inReview = CampaignStateMachine.transition(baseCampaign, "IN_REVIEW");
    expect(inReview.state).toBe("IN_REVIEW");

    // 2. IN_REVIEW -> APPROVED
    const approved = CampaignStateMachine.transition(inReview, "APPROVED", {
      approvedBy: "compliance_lead_aditi",
    });
    expect(approved.state).toBe("APPROVED");
    expect(approved.approvedBy).toBe("compliance_lead_aditi");
    expect(approved.approvalFingerprint).toBeDefined();

    // 3. APPROVED -> QUEUED (Verifies fingerprint matching)
    const queued = CampaignStateMachine.transition(approved, "QUEUED");
    expect(queued.state).toBe("QUEUED");

    // 4. QUEUED -> SUBMITTED (With external ad provider ID)
    const submitted = CampaignStateMachine.transition(queued, "SUBMITTED", {
      externalCampaignId: "meta_ad_camp_66554433",
    });
    expect(submitted.state).toBe("SUBMITTED");
    expect(submitted.externalCampaignId).toBe("meta_ad_camp_66554433");

    // 5. SUBMITTED -> COMPLETED
    const completed = CampaignStateMachine.transition(submitted, "COMPLETED");
    expect(completed.state).toBe("COMPLETED");

    // Terminal check: COMPLETED cannot transition anywhere
    expect(CampaignStateMachine.canTransition("COMPLETED", "DRAFT")).toBe(false);
    expect(() => CampaignStateMachine.transition(completed, "DRAFT")).toThrow(/Invalid state transition/);
  });

  it("strictly invalidates approval and reverts to DRAFT if creative headline is edited in APPROVED state", () => {
    const inReview = CampaignStateMachine.transition(baseCampaign, "IN_REVIEW");
    const approved = CampaignStateMachine.transition(inReview, "APPROVED", { approvedBy: "admin_rahul" });
    expect(approved.state).toBe("APPROVED");

    // Mutate creative headline
    const { updatedCampaign, approvalInvalidated } = CampaignStateMachine.mutateCampaignFields(approved, {
      creative: { headline: "Updated Sneaky Unapproved Headline" },
    });

    expect(approvalInvalidated).toBe(true);
    expect(updatedCampaign.state).toBe("DRAFT");
    expect(updatedCampaign.approvalFingerprint).toBeUndefined();
    expect(updatedCampaign.approvedBy).toBeUndefined();
    expect(updatedCampaign.approvedAt).toBeUndefined();
    expect(updatedCampaign.invalidationReason).toContain("Approval invalidated");
  });

  it("strictly invalidates approval if totalBudgetPaise is changed in APPROVED state", () => {
    const inReview = CampaignStateMachine.transition(baseCampaign, "IN_REVIEW");
    const approved = CampaignStateMachine.transition(inReview, "APPROVED", { approvedBy: "admin_rahul" });

    // Mutate budget
    const { updatedCampaign, approvalInvalidated } = CampaignStateMachine.mutateCampaignFields(approved, {
      budget: { totalBudgetPaise: 800_000 },
    });

    expect(approvalInvalidated).toBe(true);
    expect(updatedCampaign.state).toBe("DRAFT");
  });

  it("strictly invalidates approval if landingUrl is changed in APPROVED state", () => {
    const inReview = CampaignStateMachine.transition(baseCampaign, "IN_REVIEW");
    const approved = CampaignStateMachine.transition(inReview, "APPROVED", { approvedBy: "admin_rahul" });

    // Mutate landing URL
    const { updatedCampaign, approvalInvalidated } = CampaignStateMachine.mutateCampaignFields(approved, {
      landingUrl: "https://phishing-spoof-domain.com/trap",
    });

    expect(approvalInvalidated).toBe(true);
    expect(updatedCampaign.state).toBe("DRAFT");
  });

  it("strictly rejects illegal transition jumps e.g. DRAFT directly to SUBMITTED", () => {
    expect(() => CampaignStateMachine.transition(baseCampaign, "SUBMITTED")).toThrow(/Invalid state transition/);
    expect(() => CampaignStateMachine.transition(baseCampaign, "APPROVED")).toThrow(/Invalid state transition/);
  });
});

describe("Double-Entry Budget Ledger & Hard Invariant Guarantee", () => {
  it("enforces balanced debits === credits, atomic reservations, spend recognition, and releases", () => {
    const ledger = new DoubleEntryBudgetLedger();
    const merchantId = "rest_karimganj_spice";
    const campaignId = "cmp_assam_tea_fest";

    // Initial state check
    const initial = ledger.getWalletState(merchantId);
    expect(initial.availableBalancePaise).toBe(0);
    expect(initial.reservedPaise).toBe(0);
    expect(initial.spentPaise).toBe(0);
    expect(initial.unreservedAvailablePaise).toBe(0);

    // 1. Merchant deposits ₹10,000 (1,000,000 paise)
    ledger.prefundDeposit({
      merchantId,
      amountPaise: 1_000_000,
      idempotencyKey: "dep_upi_998877",
      reference: "UPI/20261014/9988776655",
    });

    const afterDeposit = ledger.getWalletState(merchantId);
    expect(afterDeposit.totalDepositedPaise).toBe(1_000_000);
    expect(afterDeposit.availableBalancePaise).toBe(1_000_000);
    expect(afterDeposit.unreservedAvailablePaise).toBe(1_000_000);

    // 2. Reserve ₹4,000 (400,000 paise) for campaign
    ledger.reserveCampaignBudget({
      merchantId,
      campaignId,
      amountPaise: 400_000,
      idempotencyKey: "res_cmp_001",
    });

    const afterReserve = ledger.getWalletState(merchantId);
    expect(afterReserve.reservedPaise).toBe(400_000);
    expect(afterReserve.unreservedAvailablePaise).toBe(600_000); // 1,000,000 - 400,000
    expect(ledger.getCampaignReservedBalancePaise(campaignId)).toBe(400_000);

    // Invariant Check
    expect(afterReserve.reservedPaise + afterReserve.spentPaise).toBeLessThanOrEqual(
      afterReserve.availableBalancePaise
    );

    // 3. Attempting to reserve ₹7,000 (exceeds unreserved 600,000) MUST THROW
    expect(() =>
      ledger.reserveCampaignBudget({
        merchantId,
        campaignId: "cmp_greedy_overdraft",
        amountPaise: 700_000,
        idempotencyKey: "res_overdraft_fail",
      })
    ).toThrow(/Invariant violation: Insufficient unreserved balance/);

    // 4. Recognize spend ₹2,000 (200,000 paise) + 10% fee (20,000 paise) + 18% GST (3,600 paise)
    const { totalDeductedPaise } = ledger.recognizeSpendAndFees({
      merchantId,
      campaignId,
      netMediaSpendPaise: 200_000,
      platformCommissionBps: 1000, // 10%
      channel: "META_ADS",
      idempotencyPrefix: "batch_day_1",
    });

    expect(totalDeductedPaise).toBe(200_000 + 20_000 + 3_600); // 223,600 paise

    const afterSpend = ledger.getWalletState(merchantId);
    expect(afterSpend.spentPaise).toBe(223_600);
    expect(afterSpend.reservedPaise).toBe(400_000 - 223_600); // 176,400 remaining
    expect(ledger.getCampaignReservedBalancePaise(campaignId)).toBe(176_400);

    // 5. Release remaining reservation (176,400 paise) back to merchant
    ledger.releaseReservation({
      merchantId,
      campaignId,
      amountPaise: 176_400,
      idempotencyKey: "rel_cmp_001",
      reason: "Campaign concluded with surplus budget",
    });

    const afterRelease = ledger.getWalletState(merchantId);
    expect(afterRelease.reservedPaise).toBe(0);
    expect(afterRelease.spentPaise).toBe(223_600);
    expect(afterRelease.availableBalancePaise).toBe(1_000_000);
    expect(afterRelease.unreservedAvailablePaise).toBe(1_000_000 - 223_600); // 776,400 paise

    // Invariant Check
    expect(afterRelease.reservedPaise + afterRelease.spentPaise).toBeLessThanOrEqual(
      afterRelease.availableBalancePaise
    );
  });
});

describe("Indian Geographic Validation & Channel Credential Verification", () => {
  it("validates authentic Indian State, GST code, 6-digit Pincode and radius bounds", () => {
    const valid = validateTargetGeography({
      state: "Assam",
      district: "Karimganj",
      city: "Karimganj",
      pincode: "788710",
      radiusKm: 5.0,
    });

    expect(valid.state).toBe("ASSAM");
    expect(valid.stateCodeGst).toBe("18");
    expect(valid.district).toBe("Karimganj");
    expect(valid.pincode).toBe("788710");
    expect(valid.radiusKm).toBe(5.0);
  });

  it("strictly rejects fake or non-Indian postal codes and states", () => {
    // Non-existent state
    expect(() =>
      validateTargetGeography({
        state: "California",
        district: "Bay Area",
        city: "San Francisco",
        pincode: "788710",
        radiusKm: 5.0,
      })
    ).toThrow(/Invalid Indian State/);

    // Invalid PIN code format (starting with 0, 5 digits, or letters)
    expect(() =>
      validateTargetGeography({
        state: "Assam",
        district: "Karimganj",
        city: "Karimganj",
        pincode: "088710",
        radiusKm: 5.0,
      })
    ).toThrow(/Invalid Indian Postal PIN code/);

    expect(() =>
      validateTargetGeography({
        state: "Assam",
        district: "Karimganj",
        city: "Karimganj",
        pincode: "78871",
        radiusKm: 5.0,
      })
    ).toThrow(/Invalid Indian Postal PIN code/);
  });

  it("returns CONFIGURATION_REQUIRED when external channel credentials are absent from .env", () => {
    const emptyEnv = {};
    const checkMeta = checkChannelConfiguration("META_ADS", emptyEnv);
    expect(checkMeta.status).toBe("CONFIGURATION_REQUIRED");
    expect(checkMeta.isConfigured).toBe(false);
    expect(checkMeta.missingKeys).toContain("META_ADS_ACCESS_TOKEN");

    const checkWa = checkChannelConfiguration("WHATSAPP_BUSINESS", emptyEnv);
    expect(checkWa.status).toBe("CONFIGURATION_REQUIRED");
    expect(checkWa.missingKeys).toContain("WHATSAPP_PHONE_NUMBER_ID");

    const checkSms = checkChannelConfiguration("DLT_SMS", emptyEnv);
    expect(checkSms.status).toBe("CONFIGURATION_REQUIRED");
    expect(checkSms.missingKeys).toContain("SMS_DLT_ENTITY_ID");
  });

  it("returns READY when all required credentials are present in env", () => {
    const liveEnv = {
      META_ADS_ACCESS_TOKEN: "EAAX...live_token",
      META_AD_ACCOUNT_ID: "act_123456789",
      META_APP_ID: "1122334455",
      META_APP_SECRET: "sec_abc123",
    };
    const check = checkChannelConfiguration("META_ADS", liveEnv);
    expect(check.status).toBe("READY");
    expect(check.isConfigured).toBe(true);
    expect(check.missingKeys).toHaveLength(0);
  });
});
