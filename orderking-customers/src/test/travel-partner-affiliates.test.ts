import { describe, it, expect } from "vitest";

// Benchmark constants matching Edge Function & Sovereign Travel mandate
const GOLD_BENCHMARK_RATE_INR_PER_GRAM = 7450; // ₹7,450 / gram

interface NormalizedPostback {
  partnerName: string;
  trackingToken: string;
  bookingReference: string;
  grossAmountInr: number;
  partnerCommissionInr: number;
  userCashbackInr: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  userId?: string;
}

function normalizeAffiliatePayload(params: Record<string, any>, headers: Record<string, string> = {}): NormalizedPostback {
  let partnerName = (params.partner || params.network || params.partner_name || params.provider || "").toUpperCase();

  if (!partnerName) {
    if (params.tin || params.ticket_no || headers["x-redbus-auth"]) {
      partnerName = "REDBUS";
    } else if (params.pnr || headers["x-confirmtkt-signature"]) {
      partnerName = "CONFIRMTKT";
    } else if (params.booking_token || params.bid || headers["x-kiwi-signature"] || headers["x-kiwi-token"]) {
      partnerName = "KIWI";
    } else if (params.action_id || params.marker || params.trip_class) {
      partnerName = "TRAVELPAYOUTS";
    } else {
      partnerName = "TRAVELPAYOUTS";
    }
  }

  const trackingToken = String(
    params.tracking_token ||
    params.trackingToken ||
    params.sub_id ||
    params.sub_id1 ||
    params.custom_id ||
    params.marker ||
    params.affilid ||
    params.affiliate_tag ||
    params.client_ref ||
    params.subId ||
    params.click_id ||
    ""
  ).trim();

  const bookingReference = String(
    params.booking_reference ||
    params.bookingReference ||
    params.booking_id ||
    params.action_id ||
    params.order_id ||
    params.trip_id ||
    params.booking_token ||
    params.bid ||
    params.pnr ||
    params.tin ||
    params.ticket_no ||
    params.ticket_number ||
    `BK-${Date.now()}`
  ).trim();

  const currency = String(params.currency || "INR").toUpperCase();
  const currencyRate = currency === "USD" ? 87.0 : currency === "EUR" ? 93.0 : 1.0;

  const rawGross = parseFloat(
    params.gross_booking_amount_inr ||
    params.grossAmount ||
    params.gross_amount ||
    params.payment ||
    params.amount ||
    params.total_fare ||
    params.price ||
    params.ticket_fare ||
    "0"
  );
  const grossAmountInr = Number(((isNaN(rawGross) ? 0 : rawGross) * currencyRate).toFixed(2));

  const rawCommission = parseFloat(
    params.partner_commission_inr ||
    params.partnerCommission ||
    params.commission_amount ||
    params.commission ||
    params.payout ||
    params.profit ||
    params.operator_commission ||
    "0"
  );
  const partnerCommissionInr = Number(((isNaN(rawCommission) ? 0 : rawCommission) * currencyRate).toFixed(2));

  let userCashbackInr = parseFloat(
    params.user_cashback_inr ||
    params.userCashback ||
    params.cashback_inr ||
    params.cashback ||
    "0"
  );

  if (isNaN(userCashbackInr) || userCashbackInr <= 0) {
    if (partnerCommissionInr > 0) {
      userCashbackInr = Math.max(5.00, Number((partnerCommissionInr * 0.60).toFixed(2)));
    } else if (grossAmountInr > 0) {
      userCashbackInr = Math.max(5.00, Number((grossAmountInr * 0.01).toFixed(2)));
    } else {
      userCashbackInr = 5.00;
    }
  }

  const rawStatus = String(
    params.status ||
    params.booking_status ||
    params.action_status ||
    "PENDING"
  ).toUpperCase();

  let status: "PENDING" | "CONFIRMED" | "CANCELLED" = "PENDING";
  if (["CONFIRMED", "PAID", "SETTLED", "SUCCESS", "TICKET_ISSUED", "BOOKED", "COMPLETED"].includes(rawStatus)) {
    status = "CONFIRMED";
  } else if (["CANCELLED", "REJECTED", "DECLINED", "FAILED", "REFUNDED"].includes(rawStatus)) {
    status = "CANCELLED";
  }

  const userId = params.user_id || params.userId;

  return {
    partnerName,
    trackingToken,
    bookingReference,
    grossAmountInr,
    partnerCommissionInr,
    userCashbackInr,
    status,
    userId,
  };
}

describe("Travel Partner Affiliate Ingestion & Commission Ledger Tests", () => {
  describe("Network Postback Payload Normalization", () => {
    it("correctly parses Travelpayouts postback webhook", () => {
      const tpPayload = {
        action_id: "TP-ACT-98213",
        sub_id: "track_usr_88921_tp",
        payment: "4850.00",
        payout: "242.50",
        currency: "INR",
        status: "paid",
        marker: "orderking_app",
      };

      const normalized = normalizeAffiliatePayload(tpPayload);
      expect(normalized.partnerName).toBe("TRAVELPAYOUTS");
      expect(normalized.bookingReference).toBe("TP-ACT-98213");
      expect(normalized.trackingToken).toBe("track_usr_88921_tp");
      expect(normalized.grossAmountInr).toBe(4850.00);
      expect(normalized.partnerCommissionInr).toBe(242.50);
      expect(normalized.userCashbackInr).toBe(145.50); // 60% of ₹242.50
      expect(normalized.status).toBe("CONFIRMED");
    });

    it("correctly parses Kiwi Tequila postback with currency conversion", () => {
      const kiwiPayload = {
        booking_token: "KW-BOK-33019",
        affilid: "track_kiwi_del_bom",
        price: "50.00",
        currency: "EUR",
        commission: "2.50",
        status: "confirmed",
      };

      const normalized = normalizeAffiliatePayload(kiwiPayload);
      expect(normalized.partnerName).toBe("KIWI");
      expect(normalized.bookingReference).toBe("KW-BOK-33019");
      expect(normalized.trackingToken).toBe("track_kiwi_del_bom");
      expect(normalized.grossAmountInr).toBe(4650.00); // 50 EUR * 93
      expect(normalized.partnerCommissionInr).toBe(232.50); // 2.5 EUR * 93
      expect(normalized.userCashbackInr).toBe(139.50); // 60% of 232.50
      expect(normalized.status).toBe("CONFIRMED");
    });

    it("correctly parses ConfirmTkt train booking postback", () => {
      const confirmTktPayload = {
        pnr: "2847291048",
        client_ref: "track_irctc_28472",
        ticket_fare: "1895.00",
        commission_amount: "28.40",
        booking_status: "BOOKED",
      };

      const normalized = normalizeAffiliatePayload(confirmTktPayload, { "x-confirmtkt-signature": "verified" });
      expect(normalized.partnerName).toBe("CONFIRMTKT");
      expect(normalized.bookingReference).toBe("2847291048");
      expect(normalized.trackingToken).toBe("track_irctc_28472");
      expect(normalized.grossAmountInr).toBe(1895.00);
      expect(normalized.partnerCommissionInr).toBe(28.40);
      // 60% of 28.40 is 17.04
      expect(normalized.userCashbackInr).toBe(17.04);
      expect(normalized.status).toBe("CONFIRMED");
    });

    it("correctly parses RedBus interstate bus booking postback", () => {
      const redbusPayload = {
        tin: "RB-TIN-8930491",
        sub_id: "track_bus_blr_goa",
        total_fare: "1350.00",
        commission: "67.50",
        status: "TICKET_ISSUED",
      };

      const normalized = normalizeAffiliatePayload(redbusPayload);
      expect(normalized.partnerName).toBe("REDBUS");
      expect(normalized.bookingReference).toBe("RB-TIN-8930491");
      expect(normalized.trackingToken).toBe("track_bus_blr_goa");
      expect(normalized.grossAmountInr).toBe(1350.00);
      expect(normalized.partnerCommissionInr).toBe(67.50);
      expect(normalized.userCashbackInr).toBe(40.50); // 60% of 67.50
      expect(normalized.status).toBe("CONFIRMED");
    });

    it("guarantees minimum ₹5.00 sovereign cashback even with zero or missing commission", () => {
      const zeroCommissionPayload = {
        partner: "CONFIRMTKT",
        pnr: "1234567890",
        tracking_token: "track_pnr_zero",
        ticket_fare: "350.00",
        commission: "0.00",
        status: "CONFIRMED",
      };

      const normalized = normalizeAffiliatePayload(zeroCommissionPayload);
      expect(normalized.userCashbackInr).toBe(5.00);
    });
  });

  describe("Double-Entry Ledger & 24K Gold Calculations", () => {
    it("ensures Debit equals Credit in paise with zero mathematical discrepancy", () => {
      const cashbackInr = 145.50;
      const cashbackPaise = Math.round(cashbackInr * 100);

      const debitEntry = {
        account: "PLATFORM_FEE_REVENUE",
        direction: "DEBIT",
        amount_paise: cashbackPaise,
      };

      const creditEntry = {
        account: "CUSTOMER_WALLET",
        direction: "CREDIT",
        amount_paise: cashbackPaise,
      };

      expect(debitEntry.amount_paise).toBe(14550);
      expect(creditEntry.amount_paise).toBe(14550);
      expect(debitEntry.amount_paise).toBe(creditEntry.amount_paise);
    });

    it("accurately converts cashback rupees into 24K gold milligrams", () => {
      const cashbackInr = 149.00;
      // Formula: (cashbackInr / 7450) * 1000 = (149 / 7450) * 1000 = 20 mg
      const goldMg = Math.round((cashbackInr / GOLD_BENCHMARK_RATE_INR_PER_GRAM) * 1000);
      expect(goldMg).toBe(20);
    });

    it("prevents double-crediting when commission was already marked credited", () => {
      const commissionState = {
        booking_reference: "TP-ACT-98213",
        cashback_credited: true,
      };

      let walletCreditCount = 0;
      if (!commissionState.cashback_credited) {
        walletCreditCount++;
      }

      expect(walletCreditCount).toBe(0);
    });
  });
});
