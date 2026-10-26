import test from 'node:test';
import assert from 'node:assert';
import { calculateRestaurantWeeklySettlement } from '../finance/weekly-settlement.ts';

test('Payout Scheduler - Statutory calculations for Daily T+1 batches', () => {
  const result = calculateRestaurantWeeklySettlement({
    restaurantId: 'rest_001',
    restaurantName: 'Biryani King',
    cycle: {
      cycleId: 'daily_2026-10-25',
      startDate: '2026-10-25',
      endDate: '2026-10-25',
      payoutDate: '2026-10-26',
      status: 'OPEN',
    },
    deliveredOrdersCount: 20,
    grossSalesPaise: 1000000, // ₹10,000.00
    restaurantDiscountsPaise: 100000, // ₹1,000.00 discount funded by restaurant
    commissionBps: 1200, // 12% commission
    pgFeeBps: 180, // 1.8% PG fee
  });

  // Net food sales = 10,000 - 1,000 = ₹9,000 (900000 paise)
  assert.strictEqual(result.netFoodSalesPaise, 900000);

  // Platform commission @ 12% = 900,000 * 12% = 108,000 paise (₹1,080.00)
  assert.strictEqual(result.platformCommissionPaise, 108000);

  // GST on commission @ 18% = 108,000 * 18% = 19,440 paise (₹194.40)
  assert.strictEqual(result.gstOnCommissionPaise, 19440);

  // Section 52 TCS @ 1% on net sales = 900,000 * 1% = 9,000 paise (₹90.00)
  assert.strictEqual(result.tcsDeductionPaise, 9000);

  // Section 194-O TDS @ 1% on net sales = 900,000 * 1% = 9,000 paise (₹90.00)
  assert.strictEqual(result.tdsDeductionPaise, 9000);

  // Section 9(5) CGST @ 5% on net sales = 900,000 * 5% = 45,000 paise (₹450.00)
  assert.strictEqual(result.sec9_5FoodGstPaise, 45000);

  // Net payable must be positive and integer paise
  assert.ok(result.netPayablePaise > 0);
  assert.strictEqual(Number.isInteger(result.netPayablePaise), true);

  // Total deductions must not exceed gross sales
  const totalDeductions = result.grossSalesPaise - result.netPayablePaise;
  assert.ok(totalDeductions > 0);
  assert.ok(result.netPayablePaise < result.grossSalesPaise);
});

test('Payout Scheduler - Enforces integer paise arithmetic throughout', () => {
  const result = calculateRestaurantWeeklySettlement({
    restaurantId: 'rest_odd_amt',
    restaurantName: 'Chai Point',
    cycle: {
      cycleId: 'daily_odd',
      startDate: '2026-10-25',
      endDate: '2026-10-25',
      payoutDate: '2026-10-26',
      status: 'OPEN',
    },
    deliveredOrdersCount: 7,
    grossSalesPaise: 333333, // ₹3,333.33
    restaurantDiscountsPaise: 33333, // ₹333.33
    commissionBps: 1234, // 12.34%
    pgFeeBps: 185, // 1.85%
  });

  assert.strictEqual(Number.isInteger(result.netFoodSalesPaise), true);
  assert.strictEqual(Number.isInteger(result.platformCommissionPaise), true);
  assert.strictEqual(Number.isInteger(result.gstOnCommissionPaise), true);
  assert.strictEqual(Number.isInteger(result.tcsDeductionPaise), true);
  assert.strictEqual(Number.isInteger(result.tdsDeductionPaise), true);
  assert.strictEqual(Number.isInteger(result.netPayablePaise), true);
});
