// @ts-nocheck
/**
 * MANDATE 3: AUTOMATED T+1 NODAL PAYOUT ENGINE & DISPUTE HANDLING TEST SUITE
 *
 * Specialist: Banking Payouts & RazorpayX Specialist (f1ad9aac)
 * Entity: Order King (GSTIN: 18AFXPH9838M1Z9), Sribhumi, Assam - 788710
 *
 * EMPIRICAL VERIFICATION:
 * 1. RazorpayX Composite Payout Payload formatting & RBI IMPS/NEFT routing rails.
 * 2. Automated Dispute Deduction Queue & Escrow Freeze (chargeback/complaint hold).
 * 3. Section 194-O (0.1% TDS) & Section 52 (1.0% TCS) statutory withholding enforcement.
 * 4. Production batch processor Day T order aggregation & cron summary.
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  TPlus1NodalPayoutProcessor,
  type TPlus1MerchantOrderInput,
} from "./tplus1-nodal-payout-processor.ts";
import {
  DisputeDeductionQueue,
  type OrderDisputeRecord,
} from "./dispute-deduction-queue.ts";
import {
  formatRazorpayXCompositePayoutPayload,
  executeRazorpayXPayout,
} from "./razorpayx-payout-engine.ts";

describe("Mandate 3: Automated T+1 Nodal Payout Engine & Dispute Handling", () => {
  beforeEach(() => {
    DisputeDeductionQueue.resetTestState();
  });

  // =========================================================================
  // 1. STATUTORY WITHHOLDING ENFORCEMENT: SEC 194-O (0.1% TDS) & SEC 52 (1.0% TCS)
  // =========================================================================
  describe("1. Statutory Withholdings: Section 194-O (0.1% TDS) & Section 52 (1.0% TCS)", () => {
    it("enforces exact 0.1% TDS on gross sales and 1.0% TCS on net taxable supply for PAN-verified merchant", () => {
      const grossSalesPaise = 1000000; // ₹10,000.00
      const discountsPaise = 100000; // ₹1,000.00
      const commissionBps = 1200; // 12% commission

      const result = TPlus1NodalPayoutProcessor.calculateMerchantStatutorySettlement({
        grossSalesPaise,
        restaurantDiscountsPaise: discountsPaise,
        commissionBps,
        hasValidPan: true,
      });

      // Net Taxable Supply = 10,000 - 1,000 = ₹9,000 (900,000 paise)
      assert.equal(result.netTaxableSupplyPaise, 900000);

      // Section 52 TCS: exactly 1.0% (100 bps) on Net Taxable Supply = 900,000 * 1% = 9,000 paise (₹90.00)
      assert.equal(result.tcsSection52Bps, 100);
      assert.equal(result.tcsSection52Paise, 9000);

      // Section 194-O TDS: exactly 0.1% (10 bps) on Gross Sales = 1,000,000 * 0.1% = 1,000 paise (₹10.00)
      assert.equal(result.tdsSection194OBps, 10);
      assert.equal(result.tdsSection194OPaise, 1000);

      // Platform Commission: 12% on Net Taxable Supply = 900,000 * 12% = 108,000 paise (₹1,080.00)
      assert.equal(result.commissionPaise, 108000);

      // 18% GST on Commission = 108,000 * 18% = 19,440 paise (₹194.40)
      assert.equal(result.gstOnCommissionPaise, 19440);

      // Payment Gateway fee: 1.8% on Gross Sales = 1,000,000 * 1.8% = 18,000 paise (₹180.00)
      assert.equal(result.pgFeePaise, 18000);

      // 18% GST on PG Fee = 18,000 * 18% = 3,240 paise (₹32.40)
      assert.equal(result.gstOnPgFeePaise, 3240);

      // Section 9(5) CGST 5% Food GST = 900,000 * 5% = 45,000 paise (Platform Liability, NOT deducted from net)
      assert.equal(result.sec9_5FoodGstPaise, 45000);

      // Total Deductions = 108,000 + 19,440 + 18,000 + 3,240 + 9,000 (TCS) + 1,000 (TDS) = 158,680 paise
      assert.equal(result.totalDeductionsPaise, 158680);

      // Net Merchant Payable = 900,000 - 158,680 = 741,320 paise (₹7,413.20)
      assert.equal(result.netPayablePaise, 741320);
      assert.ok(Number.isSafeInteger(result.netPayablePaise));
    });

    it("enforces Section 206AA higher 5.0% TDS if merchant PAN is missing or invalid", () => {
      const grossSalesPaise = 500000; // ₹5,000.00

      const result = TPlus1NodalPayoutProcessor.calculateMerchantStatutorySettlement({
        grossSalesPaise,
        hasValidPan: false, // Invalid / Missing PAN
      });

      // Section 194-O TDS escalates to 5.0% (500 bps) = 500,000 * 5% = 25,000 paise (₹250.00)
      assert.equal(result.tdsSection194OBps, 500);
      assert.equal(result.tdsSection194OPaise, 25000);

      // Section 52 TCS remains 1.0% = 500,000 * 1% = 5,000 paise (₹50.00)
      assert.equal(result.tcsSection52Paise, 5000);
    });
  });

  // =========================================================================
  // 2. AUTOMATED DISPUTE DEDUCTION QUEUE & ESCROW HOLD
  // =========================================================================
  describe("2. Automated Dispute Deduction Queue & Escrow Holding", () => {
    it("flags an active chargeback and locks disputed funds into escrow", async () => {
      const dispute = await DisputeDeductionQueue.flagOrderDispute({
        orderId: "ord_chargeback_101",
        restaurantId: "rst_assam_kitchen",
        customerId: "usr_cust_99",
        disputeType: "CHARGEBACK",
        amountPaise: 75000, // ₹750.00
        reason: "Cardholder reported unauthorized transaction via issuing bank switch",
      });

      assert.ok(dispute.disputeId.startsWith("disp_"));
      assert.equal(dispute.orderId, "ord_chargeback_101");
      assert.equal(dispute.amountPaise, 75000);
      assert.equal(dispute.status, "PENDING");
      assert.equal(dispute.heldInEscrow, true);
      assert.equal(DisputeDeductionQueue.getEscrowBalancePaise("rst_assam_kitchen"), 75000);
    });

    it("evaluates batch disputes: freezes entire disbursement on active chargeback", async () => {
      // Flag order with chargeback
      await DisputeDeductionQueue.flagOrderDispute({
        orderId: "ord_disputed_001",
        restaurantId: "rst_shillong_flavours",
        disputeType: "CHARGEBACK",
        amountPaise: 50000,
        reason: "Active cardholder chargeback",
      });

      const evalResult = await DisputeDeductionQueue.evaluateBatchDisputes(
        "rst_shillong_flavours",
        ["ord_disputed_001", "ord_clean_002"],
        200000 // Net payable ₹2,000.00
      );

      assert.equal(evalResult.hasActiveDispute, true);
      assert.equal(evalResult.shouldBlockDisbursement, true);
      assert.equal(evalResult.totalDisputeHoldPaise, 50000);
      assert.ok(evalResult.holdReason?.includes("Critical chargeback/fraud review active"));
    });

    it("allows clean balance disbursement while holding disputed order funds in escrow", async () => {
      // Flag order with customer complaint (food defect)
      await DisputeDeductionQueue.flagOrderDispute({
        orderId: "ord_complaint_003",
        restaurantId: "rst_surma_treats",
        disputeType: "CUSTOMER_COMPLAINT",
        amountPaise: 40000, // ₹400.00 held in escrow
        reason: "Customer reported burnt and inedible food item",
      });

      const evalResult = await DisputeDeductionQueue.evaluateBatchDisputes(
        "rst_surma_treats",
        ["ord_complaint_003", "ord_clean_004", "ord_clean_005"],
        300000 // Net payable ₹3,000.00
      );

      assert.equal(evalResult.hasActiveDispute, true);
      // Non-critical complaint does not block remaining clean balance if funds cover it
      assert.equal(evalResult.totalDisputeHoldPaise, 40000);
      assert.equal(evalResult.activeDisputes.length, 1);
    });

    it("admin resolves dispute in merchant favor: releases escrow back to merchant", async () => {
      const dispute = await DisputeDeductionQueue.flagOrderDispute({
        orderId: "ord_waiver_01",
        restaurantId: "rst_royal_darbar",
        disputeType: "CUSTOMER_COMPLAINT",
        amountPaise: 30000,
        reason: "Customer claimed wrong item delivered",
      });

      assert.equal(DisputeDeductionQueue.getEscrowBalancePaise("rst_royal_darbar"), 30000);

      // Admin resolves in merchant favor after proof review
      const resolved = await DisputeDeductionQueue.resolveDispute({
        disputeId: dispute.disputeId,
        decision: "RESOLVED_MERCHANT_FAVOR",
        adminUserId: "emp_admin_umar",
        notes: "Merchant submitted KDS prep photo proving correct dish was prepared and sealed with tamper-evident tape.",
      });

      assert.equal(resolved.status, "RESOLVED_MERCHANT_FAVOR");
      assert.equal(resolved.heldInEscrow, false);
      assert.equal(DisputeDeductionQueue.getEscrowBalancePaise("rst_royal_darbar"), 0);
    });

    it("admin resolves dispute in customer favor: debits escrow to refund clearing", async () => {
      const dispute = await DisputeDeductionQueue.flagOrderDispute({
        orderId: "ord_refund_02",
        restaurantId: "rst_royal_darbar",
        disputeType: "HYGIENE_DEFECT",
        amountPaise: 45000,
        reason: "Foreign object reported in food packaging",
      });

      const resolved = await DisputeDeductionQueue.resolveDispute({
        disputeId: dispute.disputeId,
        decision: "RESOLVED_CUSTOMER_FAVOR",
        adminUserId: "emp_admin_umar",
        notes: "Hygiene audit confirmed defect. Full refund authorized to customer.",
      });

      assert.equal(resolved.status, "RESOLVED_CUSTOMER_FAVOR");
      assert.equal(resolved.heldInEscrow, false);
      assert.equal(DisputeDeductionQueue.getEscrowBalancePaise("rst_royal_darbar"), 0);
    });
  });

  // =========================================================================
  // 3. EXACT RAZORPAYX COMPOSITE PAYLOAD FORMATTING & ROUTING
  // =========================================================================
  describe("3. RazorpayX Composite Payout Payload Formatting & RBI Routing Rails", () => {
    it("formats exact composite payout payload for Bank Account via instant IMPS", () => {
      const payload = formatRazorpayXCompositePayoutPayload({
        beneficiary: {
          accountNumber: "919395065587001",
          ifsc: "HDFC0001234",
          name: "Barak River Kitchen",
        },
        amountPaise: 250000, // ₹2,500.00
        referenceId: "stl_batch_20261026_001",
        narration: "OrderKing T+1 Payout",
        purpose: "settlement",
        statutoryMetadata: {
          batchId: "stl_batch_20261026_001",
          restaurantId: "rst_barak_01",
          grossSalesPaise: 300000,
          commissionPaise: 36000,
          tds194oPaise: 300, // 0.1% TDS
          tcs52Paise: 3000, // 1.0% TCS
          sec9_5FoodGstPaise: 15000,
        },
      });

      assert.equal(payload.amount, 250000);
      assert.equal(payload.currency, "INR");
      assert.equal(payload.mode, "IMPS");
      assert.equal(payload.purpose, "settlement");
      assert.equal(payload.queue_if_low_balance, true);
      assert.equal(payload.reference_id, "stl_batch_20261026_001");
      assert.equal(payload.fund_account.account_type, "bank_account");
      assert.equal(payload.fund_account.bank_account?.account_number, "919395065587001");
      assert.equal(payload.fund_account.bank_account?.ifsc, "HDFC0001234");
      assert.equal(payload.fund_account.contact.name, "Barak River Kitchen");
      assert.equal(payload.fund_account.contact.type, "vendor");

      // Verify statutory notes injected into payload
      assert.equal(payload.notes.tds_194o_paise, "300");
      assert.equal(payload.notes.tcs_52_paise, "3000");
      assert.equal(payload.notes.sec9_5_food_gst_paise, "15000");
    });

    it("auto-escalates to NEFT rail when amount exceeds ₹5 Lakhs IMPS ceiling", () => {
      const payload = formatRazorpayXCompositePayoutPayload({
        beneficiary: {
          accountNumber: "919395065587002",
          ifsc: "SBIN0000456",
          name: "Grand Assam Feast",
        },
        amountPaise: 65000000, // ₹6,50,000.00 (> ₹5 Lakhs)
        referenceId: "stl_batch_high_val_001",
      });

      assert.equal(payload.mode, "NEFT");
      assert.equal(payload.amount, 65000000);
    });

    it("routes to UPI rail when beneficiary VPA is provided", () => {
      const payload = formatRazorpayXCompositePayoutPayload({
        beneficiary: {
          vpa: "orderking@ybl",
          name: "Sovereign UPI Partner",
        },
        amountPaise: 150000,
        referenceId: "stl_batch_upi_001",
      });

      assert.equal(payload.mode, "UPI");
      assert.equal(payload.fund_account.account_type, "vpa");
      assert.equal(payload.fund_account.vpa?.address, "orderking@ybl");
    });

    it("strictly halts fail-closed on malformed Bank IFSC", () => {
      assert.throws(
        () => {
          formatRazorpayXCompositePayoutPayload({
            beneficiary: {
              accountNumber: "1234567890",
              ifsc: "HDFC123", // Invalid length (7 chars instead of 11)
              name: "Invalid Bank Partner",
            },
            amountPaise: 100000,
            referenceId: "stl_err_01",
          });
        },
        /INVALID_IFSC/
      );
    });
  });

  // =========================================================================
  // 4. PRODUCTION T+1 BATCH PROCESSOR & DISPUTE INTEGRATION
  // =========================================================================
  describe("4. Production T+1 Batch Processor with Dispute Hold & Statutory Withholdings", () => {
    it("processes Day T completed orders, deducts Section 194-O (0.1%) & Section 52 (1.0%), and isolates dispute hold", async () => {
      // Merchant directory setup
      const directory = new Map<string, any>([
        [
          "rst_clean_01",
          {
            name: "Karimganj Biryani House",
            bankAccount: "112233445566",
            bankIfsc: "HDFC0001234",
            commissionBps: 1200, // 12%
            hasValidPan: true,
          },
        ],
        [
          "rst_disputed_02",
          {
            name: "Sribhumi Sweets & Bakers",
            payoutVpa: "sribhumi@ybl",
            commissionBps: 1000, // 10%
            hasValidPan: true,
          },
        ],
      ]);

      // Seed order inputs
      const orderInputs: TPlus1MerchantOrderInput[] = [
        // Clean merchant orders (2 orders, gross ₹4,000)
        {
          orderId: "ord_c1",
          restaurantId: "rst_clean_01",
          foodPaise: 200000,
          packagingPaise: 0,
          restaurantDiscountPaise: 0,
          totalCollectedPaise: 200000,
          placedAt: "2026-10-25T14:00:00Z",
        },
        {
          orderId: "ord_c2",
          restaurantId: "rst_clean_01",
          foodPaise: 200000,
          packagingPaise: 0,
          restaurantDiscountPaise: 0,
          totalCollectedPaise: 200000,
          placedAt: "2026-10-25T18:00:00Z",
        },
        // Disputed merchant orders (gross ₹5,000)
        {
          orderId: "ord_d1",
          restaurantId: "rst_disputed_02",
          foodPaise: 500000,
          packagingPaise: 0,
          restaurantDiscountPaise: 0,
          totalCollectedPaise: 500000,
          placedAt: "2026-10-25T20:00:00Z",
        },
      ];

      // Flag order ord_d1 with active customer dispute (₹1,500 held in escrow)
      await DisputeDeductionQueue.flagOrderDispute({
        orderId: "ord_d1",
        restaurantId: "rst_disputed_02",
        disputeType: "CUSTOMER_COMPLAINT",
        amountPaise: 150000,
        reason: "Customer reported half portion missing",
      });

      const summary = await TPlus1NodalPayoutProcessor.runTPlus1NodalPayoutProcessor({
        referenceDate: new Date("2026-10-26T10:00:00Z"),
        autoDisburse: false, // Dry-run verification of composite payloads
        directOrderInputs: orderInputs,
        merchantDirectoryOverride: directory,
      });

      assert.equal(summary.totalMerchants, 2);
      assert.equal(summary.totalOrders, 3);
      assert.equal(summary.totalGrossSalesPaise, 900000); // ₹9,000 gross
      assert.equal(summary.totalDisputeEscrowHeldPaise, 150000); // ₹1,500 held in escrow

      // Verify Clean Merchant Batch
      const cleanBatch = summary.batches.find((b) => b.restaurantId === "rst_clean_01");
      assert.ok(cleanBatch);
      assert.equal(cleanBatch?.grossSalesPaise, 400000); // ₹4,000
      assert.equal(cleanBatch?.tcsSection52Paise, 4000); // 1.0% TCS = ₹40.00
      assert.equal(cleanBatch?.tdsSection194OPaise, 400); // 0.1% TDS = ₹4.00
      assert.equal(cleanBatch?.disputeHoldPaise, 0);
      assert.equal(cleanBatch?.status, "READY_FOR_PAYOUT");
      assert.ok(cleanBatch?.compositePayoutPayload);
      assert.equal(cleanBatch?.compositePayoutPayload?.amount, cleanBatch?.netDisbursablePaise);

      // Verify Disputed Merchant Batch
      const disputedBatch = summary.batches.find((b) => b.restaurantId === "rst_disputed_02");
      assert.ok(disputedBatch);
      assert.equal(disputedBatch?.grossSalesPaise, 500000); // ₹5,000
      assert.equal(disputedBatch?.tcsSection52Paise, 5000); // 1.0% TCS = ₹50.00
      assert.equal(disputedBatch?.tdsSection194OPaise, 500); // 0.1% TDS = ₹5.00
      assert.equal(disputedBatch?.disputeHoldPaise, 150000); // ₹1,500 held
      assert.equal(disputedBatch?.hasActiveDispute, true);
      // Net disbursable = preliminary net - ₹1,500 held in escrow
      assert.equal(
        disputedBatch?.netDisbursablePaise,
        disputedBatch?.preliminaryNetPayablePaise! - 150000
      );
    });

    it("completely halts batch disbursement when an active CHARGEBACK is flagged", async () => {
      const directory = new Map<string, any>([
        [
          "rst_chargeback_01",
          {
            name: "Karimganj Dhaba",
            payoutVpa: "dhaba@ybl",
            commissionBps: 1200,
            hasValidPan: true,
          },
        ],
      ]);

      const orderInputs: TPlus1MerchantOrderInput[] = [
        {
          orderId: "ord_cb_active",
          restaurantId: "rst_chargeback_01",
          foodPaise: 300000,
          totalCollectedPaise: 300000,
          placedAt: "2026-10-25T12:00:00Z",
        },
      ];

      // Flag active bank chargeback
      await DisputeDeductionQueue.flagOrderDispute({
        orderId: "ord_cb_active",
        restaurantId: "rst_chargeback_01",
        disputeType: "CHARGEBACK",
        amountPaise: 300000,
        reason: "Card issuer chargeback initiated",
      });

      const summary = await TPlus1NodalPayoutProcessor.runTPlus1NodalPayoutProcessor({
        referenceDate: new Date("2026-10-26T10:00:00Z"),
        autoDisburse: false,
        directOrderInputs: orderInputs,
        merchantDirectoryOverride: directory,
      });

      const cbBatch = summary.batches[0];
      assert.ok(cbBatch);
      assert.equal(cbBatch.status, "DISPUTE_HOLD");
      assert.equal(cbBatch.isDisbursementBlocked, true);
      assert.ok(cbBatch.reason?.includes("Critical chargeback/fraud review active"));
    });
  });
});
