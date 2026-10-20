import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isIrctcPspAuthenticated,
  assertTrainPaymentPermitted,
  verifyConfirmedRailwayBooking,
  calculateRailwayCancellationRefund,
  validateIrctcTdrFiling,
  validateCrisPnr,
  isHardcodedTrainQuote,
  validateTrainQuote,
  assertTrainQuoteAuthentic,
  reconcileGatewayRefundWebhook,
  type GatewayRefundWebhookPayload,
} from "../lib/travel/irctc-reconciliation";
import {
  generateSovereignPnr,
  issueSovereignETicket,
  searchTrainQuotes,
  SupplierUnavailableError,
} from "../lib/travel/in-app-booking-service";

describe("Travel Fintech Reconciliation & Payment Audit Engine", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("1. Payment & Escrow Safety Audit (Zero Mock Payments)", () => {
    it("fails closed when authentic IRCTC PSP credentials are not configured", () => {
      delete process.env.IRCTC_PSP_MERCHANT_KEY;
      delete process.env.VITE_IRCTC_MERCHANT_KEY;

      expect(isIrctcPspAuthenticated()).toBe(false);
      expect(() => assertTrainPaymentPermitted()).toThrowError(/IRCTC_PAYMENT_BLOCKED/);
    });

    it("strictly rejects token length alone as proof of authentication", () => {
      // Arbitrary 16+ char token without backend credentials or cryptographic signature MUST fail
      expect(isIrctcPspAuthenticated("1234567890123456")).toBe(false);
      expect(isIrctcPspAuthenticated("RANDOM_TOKEN_GREATER_THAN_16")).toBe(false);
    });

    it("insecure token-length PSP auth checks are rejected", () => {
      // Tokens that satisfy arbitrary length checks (>=16, >=24, >=32) but lack certified CRIS format fail closed
      expect(isIrctcPspAuthenticated("1234567890abcdef")).toBe(false);
      expect(isIrctcPspAuthenticated("arbitrary_sixteen_char_token")).toBe(false);
      expect(isIrctcPspAuthenticated("mock_token_with_length_greater_than_16")).toBe(false);
      expect(isIrctcPspAuthenticated("IRCTC-PSP-fake-token-bypass")).toBe(false);
      expect(isIrctcPspAuthenticated("a".repeat(32))).toBe(false);
      expect(isIrctcPspAuthenticated("a".repeat(64))).toBe(false);
      expect(() => assertTrainPaymentPermitted({ authToken: "1234567890abcdef" })).toThrowError(/IRCTC_PAYMENT_BLOCKED/);
    });

    it("fails closed when provider credentials are present but CRIS cryptographic response is absent", () => {
      const validKey = "CRIS_PSP_KEY_SECURE_9876543210";
      // Absence of authenticated CRIS/IRCTC B2B response MUST return false
      expect(isIrctcPspAuthenticated(validKey)).toBe(false);
      expect(() => assertTrainPaymentPermitted({ authToken: validKey })).toThrowError(/IRCTC_PAYMENT_BLOCKED/);
    });

    it("authenticates only when verified provider credentials AND authenticated cryptographic booking response are present", () => {
      const validKey = "CRIS_PSP_KEY_SECURE_9876543210";
      const validCrisResponse = {
        crisSignature: "CRIS_SIG_HEX_8a9b2c3d4e5f60718293a4b5c6d7e8f9",
        providerTransactionId: "IRCTC-TXN-20261020-001",
        verifiedByCrisServer: true,
      };

      expect(
        isIrctcPspAuthenticated({
          authToken: validKey,
          cryptographicBookingResponse: validCrisResponse,
        })
      ).toBe(true);

      expect(() =>
        assertTrainPaymentPermitted({
          authToken: validKey,
          cryptographicBookingResponse: validCrisResponse,
        })
      ).not.toThrow();
    });

    it("strictly blocks synthetic Indian Railways PNR generation under CRIS regulations", () => {
      expect(() => generateSovereignPnr("train")).toThrowError(/CRIS\/IRCTC regulations/);
      // Non-train modes generate sovereign references
      expect(generateSovereignPnr("flight")).toMatch(/^OK-FL-[A-Z0-9]{6}\d{4}$/);
      expect(generateSovereignPnr("bus")).toMatch(/^OK-BS-[A-Z0-9]{6}\d{4}$/);
      expect(generateSovereignPnr("cab")).toMatch(/^OK-CB-[A-Z0-9]{6}\d{4}$/);
    });

    it("does NOT accept a 10-digit PNR or prefixed payment token alone as evidence of confirmed booking", () => {
      // 10-digit PNR alone rejected by verifyConfirmedRailwayBooking
      const pnrOnlyResult = verifyConfirmedRailwayBooking({ pnr: "2841950284" });
      expect(pnrOnlyResult.verified).toBe(false);
      expect(pnrOnlyResult.reason).toContain("UNVERIFIED_BOOKING");

      // Payment token alone rejected by verifyConfirmedRailwayBooking
      const tokenOnlyResult = verifyConfirmedRailwayBooking({
        pnr: "2841950284",
        paymentToken: "IRCTC-PSP-291029301",
      });
      expect(tokenOnlyResult.verified).toBe(false);
      expect(tokenOnlyResult.reason).toContain("UNVERIFIED_BOOKING");

      // 10-digit PNR alone strictly rejected by assertTrainPaymentPermitted
      expect(() => assertTrainPaymentPermitted({ pnr: "2841950284" })).toThrowError(
        /A 10-digit PNR string or prefixed payment token alone is NOT accepted as evidence of a confirmed booking/
      );

      // Prefixed payment token alone strictly rejected by assertTrainPaymentPermitted
      expect(() =>
        assertTrainPaymentPermitted({ verifiedPaymentToken: "IRCTC-PSP-TOKEN-123456" })
      ).toThrowError(
        /A 10-digit PNR string or prefixed payment token alone is NOT accepted as evidence of a confirmed booking/
      );

      // Both PNR and prefixed payment token together rejected without server-verified CRIS response
      expect(() =>
        assertTrainPaymentPermitted({
          pnr: "2841950284",
          verifiedPaymentToken: "IRCTC-PSP-TOKEN-123456",
        })
      ).toThrowError(
        /A 10-digit PNR string or prefixed payment token alone is NOT accepted as evidence of a confirmed booking/
      );

      // Arbitrary 32+ char token string rejected when lacking certified CRIS signature format
      expect(
        isIrctcPspAuthenticated("CRIS_PSP_KEY_SECURE_9876543210", "a".repeat(32))
      ).toBe(false);

      // Verified with cryptographic CRIS PRS signature
      const verifiedWithSig = verifyConfirmedRailwayBooking({
        pnr: "2841950284",
        crisSignature: "CRIS_SIG_HEX_8a9b2c3d4e5f60718293a4b5c6d7e8f9",
      });
      expect(verifiedWithSig.verified).toBe(true);

      // Verified with external IRCTC provider transaction ID
      const verifiedWithTxn = verifyConfirmedRailwayBooking({
        pnr: "2841950284",
        providerTransactionId: "IRCTC-TXN-20261020-89102",
      });
      expect(verifiedWithTxn.verified).toBe(true);
    });

    it("keeps in-app OrderKing train ticket issuance completely locked requiring official IRCTC portal handoff", () => {
      const mockTrainQuote: any = {
        id: "tr-locked-test",
        mode: "train",
        carrierCode: "IRCTC",
        carrierName: "Indian Railways",
        serviceNumber: "12952",
        title: "Tejas Rajdhani",
        fromCity: "New Delhi (NDLS)",
        toCity: "Mumbai Central (MMCT)",
        baseFarePaise: 142000,
        carrierTaxesPaise: 6500,
        orderKingDeskFeePaise: 0,
        otaBenchmarkFeePaise: 4000,
        partnerRebateBps: 100,
        seatsAvailable: 0,
      };

      // Even with 10-digit PNR and prefixed payment token, in-app train issuance is completely locked
      expect(() =>
        issueSovereignETicket({
          quote: mockTrainQuote,
          passengers: [{ id: "pax-1", fullName: "Amitabh Verma", age: 38, gender: "male", seatPreference: "Lower Berth" }],
          contact: { phone: "9876543210", email: "amitabh@example.com" },
          paymentMethod: "kingpay_wallet",
          rebateDestination: "24k_gold",
          isConfirmedSupplier: true,
          supplierState: "online",
          supplierReservationId: "2841950284",
          verifiedPaymentToken: "IRCTC-PSP-TOKEN-123456",
        })
      ).toThrowError(/IN_APP_TRAIN_BOOKING_LOCKED.*official IRCTC portal handoff/i);
    });

    it("hardcoded train quotes are rejected", () => {
      // 1. Live search strictly forbids fabricated train quotes
      const liveSearchResults = searchTrainQuotes();
      expect(liveSearchResults.length).toBe(0);
      expect(liveSearchResults.quotes.length).toBe(0);
      expect(liveSearchResults.authenticated).toBe(false);
      expect(liveSearchResults.status).toBe("unauthenticated");
      expect(liveSearchResults.officialSearchUrl).toContain("https://www.irctc.co.in/nget/train-search");

      // 2. Synthetic/static benchmark train quotes (e.g. tr-20608-vb, tr-12952-rajdhani) are detected and rejected
      const hardcodedQuotes = [
        { id: "tr-20608-vb", mode: "train" as const, serviceNumber: "20608" },
        { id: "tr-12952-rajdhani", mode: "train" as const, serviceNumber: "12952" },
        { id: "tr-12002-shatabdi", mode: "train" as const, serviceNumber: "12002" },
        { id: "tr-12628-superfast", mode: "train" as const, serviceNumber: "12628" },
      ];

      for (const hq of hardcodedQuotes) {
        expect(isHardcodedTrainQuote(hq)).toBe(true);
        expect(validateTrainQuote(hq)).toBe(false);
        expect(() => assertTrainQuoteAuthentic(hq)).toThrowError(
          /Hardcoded train quotes are rejected|IRCTC_PAYMENT_BLOCKED/
        );

        // In-app booking attempt with hardcoded quote fails closed
        expect(() =>
          issueSovereignETicket({
            quote: hq as any,
            passengers: [{ id: "pax-1", fullName: "Amitabh Verma", age: 38, gender: "male", seatPreference: "Lower Berth" }],
            contact: { phone: "9876543210", email: "amitabh@example.com" },
            paymentMethod: "kingpay_wallet",
            rebateDestination: "24k_gold",
            isConfirmedSupplier: true,
            supplierState: "online",
          })
        ).toThrowError(/Hardcoded train quotes are rejected|IRCTC_PAYMENT_BLOCKED/);
      }
    });
  });

  describe("2. Indian Railways Cancellation & Statutory Clerkage Rules (Gazette 2015)", () => {
    const baseFarePaise = 200000; // ₹2,000.00
    const now = new Date("2026-10-20T10:00:00Z");

    it("applies flat clerkage + 5% GST for confirmed tickets cancelled >48 hours prior to departure", () => {
      // 3A Flat Clerkage: ₹180 + 5% GST (₹9) = ₹189.00 (18,900 paise)
      const depDate = new Date(now.getTime() + 72 * 3600 * 1000); // 72h ahead (>48h)
      const breakdown = calculateRailwayCancellationRefund({
        trainClass: "3A",
        bookingStatus: "CONFIRMED",
        passengersCount: 2,
        grossFarePaise: baseFarePaise * 2, // ₹4,000.00
        departureTime: depDate,
        cancellationTime: now,
      });

      expect(breakdown.clerkageFeePaise).toBe(18000 * 2); // 36,000 paise
      expect(breakdown.gstPaise).toBe(Math.round(36000 * 0.05)); // 1,800 paise (5% GST)
      expect(breakdown.totalDeductionPaise).toBe(37800); // ₹378.00
      expect(breakdown.netRefundPaise).toBe(baseFarePaise * 2 - 37800);
      expect(breakdown.isTdrRequired).toBe(false);
      expect(breakdown.pgSettlementSla).toContain("T+2 to T+5 Banking Days");
    });

    it("applies 25% of fare (or flat minimum) + GST for cancellations between 48h and 12h", () => {
      const depDate = new Date(now.getTime() + 24 * 3600 * 1000); // 24h ahead
      const breakdown = calculateRailwayCancellationRefund({
        trainClass: "2A",
        bookingStatus: "CONFIRMED",
        passengersCount: 1,
        grossFarePaise: 300000, // ₹3,000.00
        departureTime: depDate,
        cancellationTime: now,
      });

      // 25% of ₹3,000 = ₹750.00 (75,000 paise), which exceeds flat 2A clerkage (₹200)
      expect(breakdown.clerkageFeePaise).toBe(75000);
      expect(breakdown.gstPaise).toBe(Math.round(75000 * 0.05)); // 3,750 paise
      expect(breakdown.totalDeductionPaise).toBe(75000 + 3750);
      expect(breakdown.netRefundPaise).toBe(300000 - (75000 + 3750));
      expect(breakdown.isTdrRequired).toBe(false);
      expect(breakdown.pgSettlementSla).toContain("T+2 to T+5 Banking Days");
    });

    it("applies 50% of fare + GST for cancellations between 12h and 4h before departure", () => {
      const depDate = new Date(now.getTime() + 6 * 3600 * 1000); // 6h ahead
      const breakdown = calculateRailwayCancellationRefund({
        trainClass: "1A",
        bookingStatus: "CONFIRMED",
        passengersCount: 1,
        grossFarePaise: 400000, // ₹4,000.00
        departureTime: depDate,
        cancellationTime: now,
      });

      // 50% of ₹4,000 = ₹2,000.00 (200,000 paise)
      expect(breakdown.clerkageFeePaise).toBe(200000);
      expect(breakdown.gstPaise).toBe(Math.round(200000 * 0.05)); // 10,000 paise
      expect(breakdown.totalDeductionPaise).toBe(210000);
      expect(breakdown.netRefundPaise).toBe(190000);
      expect(breakdown.isTdrRequired).toBe(false);
    });

    it("blocks standard online refund under 4 hours (post-charting) and mandates online TDR", () => {
      const depDate = new Date(now.getTime() + 2 * 3600 * 1000); // 2h ahead (<4h)
      const breakdown = calculateRailwayCancellationRefund({
        trainClass: "3A",
        bookingStatus: "CONFIRMED",
        passengersCount: 1,
        grossFarePaise: 150000,
        departureTime: depDate,
        cancellationTime: now,
      });

      expect(breakdown.netRefundPaise).toBe(0);
      expect(breakdown.isTdrRequired).toBe(true);
      expect(breakdown.cancellationRuleApplied).toContain("Post-charting");
      expect(breakdown.pgSettlementSla).toContain("TDR");
    });

    it("applies ₹60/pax clerkage + GST on RAC or Waitlist tickets cancelled up to 30 mins before departure", () => {
      const depDate = new Date(now.getTime() + 2 * 3600 * 1000); // 2h ahead (>30m)
      const breakdown = calculateRailwayCancellationRefund({
        trainClass: "3A",
        bookingStatus: "WL",
        passengersCount: 2,
        grossFarePaise: 240000,
        departureTime: depDate,
        cancellationTime: now,
      });

      // RAC/WL clerkage: ₹60 per pax * 2 = ₹120.00 (12,000 paise) + 5% GST (600 paise)
      expect(breakdown.clerkageFeePaise).toBe(12000);
      expect(breakdown.gstPaise).toBe(600);
      expect(breakdown.totalDeductionPaise).toBe(12600);
      expect(breakdown.netRefundPaise).toBe(240000 - 12600);
    });
  });

  describe("3. IRCTC TDR (Ticket Deposit Receipt) Verification", () => {
    it("validates authentic 10-digit numeric Indian Railways PNR for TDR filing", () => {
      const validPnr = "2841950284";
      const result = validateIrctcTdrFiling({
        pnr: validPnr,
        reason: "TRAIN_DELAYED_OVER_3_HOURS",
        chartStatus: "CHART_PREPARED",
        departureTime: new Date().toISOString(),
      });

      expect(result.eligible).toBe(true);
      expect(result.tdrReferenceNumber).toContain("TDR-CRIS-2841-");
      expect(result.auditAuthority).toContain("Chief Commercial Manager");
      expect(result.estimatedSettlementDays).toContain("30 to 90 business days");
    });

    it("rejects non-10-digit synthetic PNRs with strict validation error", () => {
      expect(() =>
        validateIrctcTdrFiling({
          pnr: "OK-TR-12345",
          reason: "AC_FAILURE_IN_COACH",
          chartStatus: "CHART_PREPARED",
          departureTime: new Date().toISOString(),
        })
      ).toThrowError(/strictly 10-digit numeric reference/);
    });

    it("arbitrary 10-digit PNR without CRIS provider validation is rejected", () => {
      // Repetitive 10-digit synthetic PNRs
      expect(validateCrisPnr("0000000000").valid).toBe(false);
      expect(validateCrisPnr("1111111111").valid).toBe(false);
      expect(() =>
        validateIrctcTdrFiling({
          pnr: "0000000000",
          reason: "TRAIN_DELAYED_OVER_3_HOURS",
          chartStatus: "CHART_PREPARED",
          departureTime: new Date().toISOString(),
        })
      ).toThrowError(/CRIS_VALIDATION_REJECTED/);

      // Sequential 10-digit synthetic PNRs
      expect(validateCrisPnr("1234567890").valid).toBe(false);
      expect(validateCrisPnr("0123456789").valid).toBe(false);
      expect(() =>
        validateIrctcTdrFiling({
          pnr: "1234567890",
          reason: "TRAIN_DELAYED_OVER_3_HOURS",
          chartStatus: "CHART_PREPARED",
          departureTime: new Date().toISOString(),
        })
      ).toThrowError(/CRIS_VALIDATION_REJECTED/);

      // Invalid PRS Zone prefix (< 2 or > 9)
      expect(validateCrisPnr("1928374650").valid).toBe(false);
      expect(() =>
        validateIrctcTdrFiling({
          pnr: "1928374650",
          reason: "TRAIN_DELAYED_OVER_3_HOURS",
          chartStatus: "CHART_PREPARED",
          departureTime: new Date().toISOString(),
        })
      ).toThrowError(/CRIS_VALIDATION_REJECTED.*PRS Zone/);

      // Valid CRIS PNR from authentic PRS centre (2xx-9xx)
      const validCris = validateCrisPnr("2841950284");
      expect(validCris.valid).toBe(true);
      expect(validCris.prsZone).toContain("Northern PRS");
    });
  });

  describe("4. Payment Gateway Refund Webhook Reconciliation", () => {
    it("successfully reconciles authentic gateway refund webhook with bank UTR", () => {
      const webhookPayload: GatewayRefundWebhookPayload = {
        eventId: "evt_test_123456",
        event: "refund.processed",
        paymentId: "pay_Kx9281726354",
        refundId: "rfnd_Abc987654321",
        amountPaise: 189000,
        currency: "INR",
        bankRrn: "234567890123",
        createdAt: Math.floor(Date.now() / 1000),
      };

      const result = reconcileGatewayRefundWebhook(webhookPayload, 200000);
      expect(result.reconciled).toBe(true);
      expect(result.settlementStatus).toBe("SETTLED_TO_SOURCE");
      expect(result.amountPaise).toBe(189000);
      expect(result.auditLog).toContain("RRN/UTR: 234567890123");
    });

    it("flags missing bank RRN as PENDING_BANK_CLEARANCE with T+2 to T+5 SLA", () => {
      const webhookPayload: GatewayRefundWebhookPayload = {
        eventId: "evt_pending_456",
        event: "refund.processed",
        paymentId: "pay_Kx9281726354",
        refundId: "rfnd_Abc987654321",
        amountPaise: 189000,
        currency: "INR",
        createdAt: Math.floor(Date.now() / 1000),
      };

      const result = reconcileGatewayRefundWebhook(webhookPayload, 200000);
      expect(result.reconciled).toBe(true);
      expect(result.settlementStatus).toBe("PENDING_BANK_CLEARANCE");
      expect(result.settlementTimeline).toContain("T+2 to T+5 Banking Days");
    });

    it("rejects refund amounts exceeding original debited payment (tamper protection)", () => {
      const fraudulentPayload: GatewayRefundWebhookPayload = {
        eventId: "evt_tamper_999",
        event: "refund.processed",
        paymentId: "pay_Kx9281726354",
        refundId: "rfnd_Tamper123",
        amountPaise: 500000, // ₹5,000 (exceeds ₹2,000 debit)
        currency: "INR",
        createdAt: Math.floor(Date.now() / 1000),
      };

      const result = reconcileGatewayRefundWebhook(fraudulentPayload, 200000);
      expect(result.reconciled).toBe(false);
      expect(result.settlementStatus).toBe("RECONCILIATION_FAILED");
      expect(result.auditLog).toContain("exceeds original captured amount");
    });

    it("handles bank gateway refund failure preserving escrow audit logs", () => {
      const failedPayload: GatewayRefundWebhookPayload = {
        eventId: "evt_fail_001",
        event: "refund.failed",
        paymentId: "pay_Kx9281726354",
        refundId: "rfnd_Fail999",
        amountPaise: 150000,
        currency: "INR",
        createdAt: Math.floor(Date.now() / 1000),
      };

      const result = reconcileGatewayRefundWebhook(failedPayload, 200000);
      expect(result.reconciled).toBe(false);
      expect(result.settlementStatus).toBe("RECONCILIATION_FAILED");
      expect(result.auditLog).toContain("Bank gateway reported refund failure");
    });
  });
});
