import { describe, it, expect, vi } from 'vitest';
import {
  SUBSCRIPTION_TIERS,
  SOUNDBOX_ADDON_FEE_PAISE,
  SOUNDBOX_ADDON_FEE_INR,
  GST_RATE_PCT,
  SAC_CODE_SAAS,
  getTierConfig,
  listSubscriptionTiers,
  calculateSoundboxAddonFee,
  createSubscription,
  calculateProRataFee,
  calculateProRataSubscription,
  calculateTierChangeProration,
  calculateSubscriptionGst,
  generateSubscriptionInvoice,
  generateSubscriptionLedgerEntries,
  postSubscriptionSettlementToLedger,
} from './subscriptions.ts';

describe('B2B SaaS Restaurant Subscriptions Engine', () => {
  describe('1. Subscription Tiers & Feature Verification', () => {
    it('verifies STARTER tier features (₹999/mo, 12% commission, standard payouts)', () => {
      const config = getTierConfig('STARTER');
      expect(config.tier).toBe('STARTER');
      expect(config.monthlyFeePaise).toBe(99900); // ₹999.00
      expect(config.monthlyFeeInr).toBe(999);
      expect(config.commissionRatePct).toBe(12); // 12% commission
      expect(config.includedSoundboxDevices).toBe(0); // 0 included devices
      expect(config.settlementSpeed).toBe('STANDARD'); // Standard payouts
      expect(config.hasPriorityAiDispatch).toBe(false);
      expect(config.features).toContain('Basic online ordering & digital menu');
      expect(config.features).toContain('12% commission rate');
      expect(config.features).toContain('Standard payouts (T+2 settlement)');
    });

    it('verifies PRO tier features (₹2,999/mo, 8% commission, KingPay Soundbox audio alerts included, same-day settlement)', () => {
      const config = getTierConfig('PRO');
      expect(config.tier).toBe('PRO');
      expect(config.monthlyFeePaise).toBe(299900); // ₹2,999.00
      expect(config.monthlyFeeInr).toBe(2999);
      expect(config.commissionRatePct).toBe(8); // 8% commission
      expect(config.includedSoundboxDevices).toBe(1); // 1x Soundbox included
      expect(config.settlementSpeed).toBe('SAME_DAY'); // Same-day settlement
      expect(config.hasPriorityAiDispatch).toBe(false);
      expect(config.features).toContain('8% commission rate');
      expect(config.features).toContain('1x KingPay Soundbox audio alerts included');
      expect(config.features).toContain('Same-day settlement (T+0 evening payout)');
    });

    it('verifies EMPIRE tier features (₹9,999/mo, 5% commission, 2x Soundbox devices, priority AI dispatch, instant settlement)', () => {
      const config = getTierConfig('EMPIRE');
      expect(config.tier).toBe('EMPIRE');
      expect(config.monthlyFeePaise).toBe(999900); // ₹9,999.00
      expect(config.monthlyFeeInr).toBe(9999);
      expect(config.commissionRatePct).toBe(5); // 5% commission
      expect(config.includedSoundboxDevices).toBe(2); // 2x Soundbox included
      expect(config.settlementSpeed).toBe('INSTANT'); // Instant settlement
      expect(config.hasPriorityAiDispatch).toBe(true); // Priority AI dispatch
      expect(config.features).toContain('5% commission rate');
      expect(config.features).toContain('2x KingPay Soundbox devices included');
      expect(config.features).toContain('Priority AI dispatch algorithm');
      expect(config.features).toContain('Instant settlement (real-time UPI payout)');
    });

    it('lists all 3 tiers with correct hierarchy', () => {
      const tiers = listSubscriptionTiers();
      expect(tiers.length).toBe(3);
      expect(tiers.map((t) => t.tier)).toEqual(['STARTER', 'PRO', 'EMPIRE']);
    });

    it('throws when querying an invalid tier', () => {
      expect(() => getTierConfig('ULTRA_VIP' as any)).toThrow('Invalid subscription tier');
    });
  });

  describe('2. Soundbox Hardware Add-on Pricing (₹199/month per extra device)', () => {
    it('charges ₹0 for extra devices when within tier allowance', () => {
      // STARTER: 0 included, 0 requested
      const starterZero = calculateSoundboxAddonFee('STARTER', 0);
      expect(starterZero.includedDevices).toBe(0);
      expect(starterZero.extraDevices).toBe(0);
      expect(starterZero.totalAddonPaise).toBe(0);

      // PRO: 1 included, 1 requested
      const proOne = calculateSoundboxAddonFee('PRO', 1);
      expect(proOne.includedDevices).toBe(1);
      expect(proOne.extraDevices).toBe(0);
      expect(proOne.totalAddonPaise).toBe(0);

      // EMPIRE: 2 included, 2 requested
      const empireTwo = calculateSoundboxAddonFee('EMPIRE', 2);
      expect(empireTwo.includedDevices).toBe(2);
      expect(empireTwo.extraDevices).toBe(0);
      expect(empireTwo.totalAddonPaise).toBe(0);
    });

    it('correctly charges ₹199/month per extra device above included allowance', () => {
      // STARTER with 2 soundboxes: 2 extra devices = 2 * ₹199 = ₹398 (39,800 paise)
      const starterExtra = calculateSoundboxAddonFee('STARTER', 2);
      expect(starterExtra.includedDevices).toBe(0);
      expect(starterExtra.extraDevices).toBe(2);
      expect(starterExtra.totalAddonPaise).toBe(39800);
      expect(starterExtra.totalAddonInr).toBe(398);

      // PRO with 3 soundboxes: 1 included, 2 extra = 2 * ₹199 = ₹398 (39,800 paise)
      const proExtra = calculateSoundboxAddonFee('PRO', 3);
      expect(proExtra.includedDevices).toBe(1);
      expect(proExtra.extraDevices).toBe(2);
      expect(proExtra.totalAddonPaise).toBe(39800);

      // EMPIRE with 5 soundboxes: 2 included, 3 extra = 3 * ₹199 = ₹597 (59,700 paise)
      const empireExtra = calculateSoundboxAddonFee('EMPIRE', 5);
      expect(empireExtra.includedDevices).toBe(2);
      expect(empireExtra.extraDevices).toBe(3);
      expect(empireExtra.totalAddonPaise).toBe(59700);
      expect(empireExtra.totalAddonInr).toBe(597);
    });
  });

  describe('3. Subscription Creation & Initialization', () => {
    it('creates active subscription with default soundbox allowance and dates', () => {
      const startDate = new Date('2026-10-01T00:00:00.000Z');
      const sub = createSubscription({
        restaurantId: 'rest_punjabi_dhaba_101',
        tier: 'PRO',
        restaurantGstin: '29AAACH1234F1Z5',
        merchantStateCode: 'KA',
        startDate,
      });

      expect(sub.id).toMatch(/^sub_rest_punjabi_dhaba_101_/);
      expect(sub.restaurantId).toBe('rest_punjabi_dhaba_101');
      expect(sub.tier).toBe('PRO');
      expect(sub.status).toBe('ACTIVE');
      expect(sub.soundboxCount).toBe(1); // Default for PRO
      expect(sub.billingCycle).toBe('MONTHLY');
      expect(sub.currentPeriodStart).toEqual(startDate);
      expect(sub.restaurantGstin).toBe('29AAACH1234F1Z5');
      expect(sub.merchantStateCode).toBe('KA');
      expect(sub.cancelAtPeriodEnd).toBe(false);

      // Next billing period should be 1 month later
      const expectedEnd = new Date(startDate);
      expectedEnd.setMonth(expectedEnd.getMonth() + 1);
      expect(sub.currentPeriodEnd).toEqual(expectedEnd);
    });

    it('creates subscription with custom extra soundbox devices', () => {
      const sub = createSubscription({
        restaurantId: 'rest_bengaluru_biryani_502',
        tier: 'EMPIRE',
        soundboxCount: 4, // 2 included + 2 extra
        merchantStateCode: 'KA',
      });

      expect(sub.soundboxCount).toBe(4);
      expect(sub.tier).toBe('EMPIRE');
    });
  });

  describe('4. Pro-Rata Fee Calculations', () => {
    it('computes exact pro-rata fee for partial days in period', () => {
      // Half month (15 days out of 30) for STARTER (₹999 / 99,900 paise)
      const halfMonthStarter = calculateProRataFee({
        monthlyFeePaise: 99900,
        daysActive: 15,
        daysInPeriod: 30,
      });
      expect(halfMonthStarter).toBe(49950); // Exactly half

      // 10 days out of 30 for PRO (₹2,999 / 299,900 paise)
      const tenDaysPro = calculateProRataFee({
        monthlyFeePaise: 299900,
        daysActive: 10,
        daysInPeriod: 30,
      });
      expect(tenDaysPro).toBe(Math.round((299900 * 10) / 30)); // 99967 paise
    });

    it('handles edge cases in pro-rata calculation (0 days, full month)', () => {
      expect(calculateProRataFee({ monthlyFeePaise: 99900, daysActive: 0, daysInPeriod: 30 })).toBe(0);
      expect(calculateProRataFee({ monthlyFeePaise: 99900, daysActive: 30, daysInPeriod: 30 })).toBe(99900);
      expect(calculateProRataFee({ monthlyFeePaise: 99900, daysActive: 35, daysInPeriod: 30 })).toBe(99900);
      expect(() => calculateProRataFee({ monthlyFeePaise: 99900, daysActive: 10, daysInPeriod: 0 })).toThrow();
    });

    it('computes pro-rata subscription fee including hardware add-ons', () => {
      const start = new Date('2026-10-15T00:00:00.000Z');
      const end = new Date('2026-10-30T00:00:00.000Z'); // 15 active days

      // PRO tier (₹2,999) + 1 extra soundbox (₹199), total monthly = ₹3,198 (319,800 paise)
      const result = calculateProRataSubscription({
        tier: 'PRO',
        soundboxCount: 2, // 1 included + 1 extra
        startDate: start,
        endDate: end,
        referenceCycleDays: 30,
      });

      expect(result.daysActive).toBe(15);
      expect(result.monthlyBaseFeePaise).toBe(299900);
      expect(result.proRataBaseFeePaise).toBe(149950);
      expect(result.extraSoundboxCount).toBe(1);
      expect(result.monthlySoundboxFeePaise).toBe(19900);
      expect(result.proRataSoundboxFeePaise).toBe(9950);
      expect(result.totalProRataSubtotalPaise).toBe(149950 + 9950); // 159,900 paise = ₹1,599
      expect(result.totalProRataSubtotalInr).toBe(1599);
    });

    it('calculates mid-cycle tier change proration (upgrade from STARTER to PRO)', () => {
      // 10 days remaining in the cycle
      const proration = calculateTierChangeProration({
        currentTier: 'STARTER',
        newTier: 'PRO',
        daysRemaining: 10,
        daysInPeriod: 30,
      });

      // STARTER: 99,900 * 10 / 30 = 33,300 paise credit
      expect(proration.unusedCurrentCreditPaise).toBe(33300);
      // PRO: 299,900 * 10 / 30 = 99,967 paise charge
      expect(proration.chargeNewTierPaise).toBe(99967);
      // Net upgrade adjustment to pay: 99,967 - 33,300 = 66,667 paise (₹666.67)
      expect(proration.netAdjustmentPaise).toBe(66667);
    });
  });

  describe('5. GST Tax Engine (18% GST: CGST+SGST vs IGST)', () => {
    it('computes Intra-state GST (KA to KA): 9% CGST + 9% SGST = 18% total', () => {
      const amountPaise = 299900; // ₹2,999 PRO fee
      const gst = calculateSubscriptionGst({
        amountPaise,
        merchantStateCode: 'KA',
        supplierStateCode: 'KA',
      });

      expect(gst.ratePct).toBe(18);
      expect(gst.isInterstate).toBe(false);
      expect(gst.subtotalPaise).toBe(299900);

      // Total 18% GST = Math.round(299900 * 0.18) = 53982 paise
      expect(gst.totalGstPaise).toBe(53982);

      // Intra-state split: 9% CGST (26991) + 9% SGST (26991)
      expect(gst.cgstRatePct).toBe(9);
      expect(gst.sgstRatePct).toBe(9);
      expect(gst.cgstPaise).toBe(26991);
      expect(gst.sgstPaise).toBe(26991);
      expect(gst.igstRatePct).toBe(0);
      expect(gst.igstPaise).toBe(0);

      // Mathematical exactness
      expect(gst.cgstPaise + gst.sgstPaise).toBe(gst.totalGstPaise);
      expect(gst.totalAmountPaise).toBe(gst.subtotalPaise + gst.totalGstPaise);
      expect(gst.totalAmountPaise).toBe(353882); // ₹3,538.82
    });

    it('computes Inter-state GST (KA supplier to MH merchant): 18% IGST', () => {
      const amountPaise = 999900; // ₹9,999 EMPIRE fee
      const gst = calculateSubscriptionGst({
        amountPaise,
        merchantStateCode: 'MH', // Maharashtra
        supplierStateCode: 'KA', // Karnataka
      });

      expect(gst.ratePct).toBe(18);
      expect(gst.isInterstate).toBe(true);
      expect(gst.subtotalPaise).toBe(999900);

      // Total 18% GST = Math.round(999900 * 0.18) = 179982 paise
      expect(gst.totalGstPaise).toBe(179982);

      // Inter-state: CGST = 0, SGST = 0, IGST = 18%
      expect(gst.cgstRatePct).toBe(0);
      expect(gst.cgstPaise).toBe(0);
      expect(gst.sgstRatePct).toBe(0);
      expect(gst.sgstPaise).toBe(0);
      expect(gst.igstRatePct).toBe(18);
      expect(gst.igstPaise).toBe(179982);

      expect(gst.totalAmountPaise).toBe(gst.subtotalPaise + gst.totalGstPaise);
      expect(gst.totalAmountPaise).toBe(1179882); // ₹11,798.82
    });

    it('handles explicit isInterstate flag override', () => {
      const gst = calculateSubscriptionGst({
        amountPaise: 99900,
        isInterstate: true,
      });

      expect(gst.isInterstate).toBe(true);
      expect(gst.igstPaise).toBe(Math.round(99900 * 0.18));
      expect(gst.cgstPaise).toBe(0);
      expect(gst.sgstPaise).toBe(0);
    });
  });

  describe('6. GST Invoice Generation', () => {
    it('generates compliant B2B tax invoice with SAC code and line items', () => {
      const sub = createSubscription({
        restaurantId: 'rest_smoke_house_deli',
        tier: 'PRO',
        soundboxCount: 2, // 1 included + 1 extra (₹199)
        merchantStateCode: 'KA',
        restaurantGstin: '29ABCDE1234F1Z2',
      });

      const invoice = generateSubscriptionInvoice({
        subscription: sub,
        invoiceNumber: 'INV-TEST-2026-001',
      });

      expect(invoice.invoiceNumber).toBe('INV-TEST-2026-001');
      expect(invoice.subscriptionId).toBe(sub.id);
      expect(invoice.restaurantId).toBe('rest_smoke_house_deli');
      expect(invoice.restaurantGstin).toBe('29ABCDE1234F1Z2');
      expect(invoice.sacCode).toBe(SAC_CODE_SAAS);
      expect(invoice.tier).toBe('PRO');
      expect(invoice.status).toBe('ISSUED');

      // 2 line items: Base Pro tier (₹2,999) + 1x Extra Soundbox (₹199)
      expect(invoice.lineItems.length).toBe(2);
      expect(invoice.lineItems[0].unitPricePaise).toBe(299900);
      expect(invoice.lineItems[1].unitPricePaise).toBe(SOUNDBOX_ADDON_FEE_PAISE);

      // Subtotal = 299900 + 19900 = 319,800 paise (₹3,198)
      expect(invoice.subtotalPaise).toBe(319800);

      // GST 18% on 319800 = 57564 paise
      expect(invoice.gst.totalGstPaise).toBe(57564);
      expect(invoice.gst.cgstPaise + invoice.gst.sgstPaise).toBe(57564);

      // Total = 319800 + 57564 = 377364 paise (₹3,773.64)
      expect(invoice.totalAmountPaise).toBe(377364);
      expect(invoice.totalAmountInr).toBe(3773.64);
    });

    it('generates pro-rata invoice correctly', () => {
      const sub = createSubscription({
        restaurantId: 'rest_bistro_44',
        tier: 'STARTER',
        merchantStateCode: 'DL', // Delhi (Interstate from KA)
      });

      const invoice = generateSubscriptionInvoice({
        subscription: sub,
        isProRata: true,
        proRataSubtotalPaise: 49950, // Half month STARTER
      });

      expect(invoice.subtotalPaise).toBe(49950);
      expect(invoice.gst.isInterstate).toBe(true);
      expect(invoice.gst.igstPaise).toBe(Math.round(49950 * 0.18));
      expect(invoice.totalAmountPaise).toBe(49950 + Math.round(49950 * 0.18));
    });
  });

  describe('7. Double-Entry Ledger Integration', () => {
    it('creates perfectly balanced double-entry settlement entries', () => {
      const sub = createSubscription({
        restaurantId: 'rest_chettinad_palace',
        tier: 'EMPIRE',
        merchantStateCode: 'KA',
      });

      const invoice = generateSubscriptionInvoice({
        subscription: sub,
        invoiceNumber: 'INV-LEDGER-001',
      });

      const settlement = generateSubscriptionLedgerEntries({
        restaurantId: sub.restaurantId,
        invoice,
      });

      expect(settlement.isBalanced).toBe(true);
      expect(settlement.eventType).toBe('B2B_SUBSCRIPTION_SETTLED');
      expect(settlement.totalDebitPaise).toBe(settlement.totalCreditPaise);
      expect(settlement.totalDebitPaise).toBe(invoice.totalAmountPaise);

      // Verify specific accounts
      const entries = settlement.entries;
      expect(entries.length).toBe(3);

      const debitMerchant = entries.find((e) => e.account === 'MERCHANT_WALLET' && e.direction === 'DEBIT');
      expect(debitMerchant).toBeDefined();
      expect(debitMerchant!.amountPaise).toBe(invoice.totalAmountPaise);
      expect(debitMerchant!.entityId).toBe(sub.restaurantId);

      const creditRevenue = entries.find((e) => e.account === 'SUBSCRIPTION_REVENUE' && e.direction === 'CREDIT');
      expect(creditRevenue).toBeDefined();
      expect(creditRevenue!.amountPaise).toBe(invoice.subtotalPaise);
      expect(creditRevenue!.entityId).toBe('PLATFORM_REVENUE');

      const creditGst = entries.find((e) => e.account === 'GST_OUTPUT_LIABILITY' && e.direction === 'CREDIT');
      expect(creditGst).toBeDefined();
      expect(creditGst!.amountPaise).toBe(invoice.gst.totalGstPaise);
      expect(creditGst!.entityId).toBe('GOVT_TAX');

      // Mathematical zero-leakage check
      expect(debitMerchant!.amountPaise).toBe(creditRevenue!.amountPaise + creditGst!.amountPaise);
    });

    it('posts transaction through canonical ledger without violations', async () => {
      const sub = createSubscription({
        restaurantId: 'rest_udupi_grand',
        tier: 'STARTER',
        merchantStateCode: 'MH',
      });

      const invoice = generateSubscriptionInvoice({
        subscription: sub,
        invoiceNumber: 'INV-POST-002',
      });

      // Test with mock ledger engine to ensure exact integration contract
      const mockPostTransaction = vi.fn().mockImplementation(async (params) => {
        let totalDebit = 0;
        let totalCredit = 0;
        for (const e of params.entries) {
          if (e.direction === 'DEBIT') totalDebit += e.amountPaise;
          if (e.direction === 'CREDIT') totalCredit += e.amountPaise;
        }
        expect(totalDebit).toBe(totalCredit);
        return {
          transactionId: 'tx-mock-123',
          idempotencyKey: params.idempotencyKey,
          eventType: params.eventType,
          totalAmountPaise: totalDebit,
          entries: params.entries,
        };
      });

      const result = await postSubscriptionSettlementToLedger({
        restaurantId: sub.restaurantId,
        invoice,
        ledger: { postTransaction: mockPostTransaction },
      });

      expect(mockPostTransaction).toHaveBeenCalledTimes(1);
      const callArgs = mockPostTransaction.mock.calls[0][0];
      expect(callArgs.eventType).toBe('B2B_SUBSCRIPTION_SETTLED');
      expect(callArgs.entries.length).toBe(3);
      expect((result as any).transactionId).toBe('tx-mock-123');
    });

    it('falls back gracefully when running in offline or unconfigured database environments', async () => {
      const sub = createSubscription({
        restaurantId: 'rest_offline_test',
        tier: 'PRO',
      });

      const invoice = generateSubscriptionInvoice({
        subscription: sub,
      });

      // Calling postSubscriptionSettlementToLedger with the real canonicalLedger
      // When DATABASE_URL is not set, it catches the error and returns the balanced settlement result
      const result = await postSubscriptionSettlementToLedger({
        restaurantId: sub.restaurantId,
        invoice,
      });

      expect(result).toBeDefined();
      if ('isBalanced' in result) {
        expect(result.isBalanced).toBe(true);
        expect(result.totalDebitPaise).toBe(result.totalCreditPaise);
      }
    });
  });
});
