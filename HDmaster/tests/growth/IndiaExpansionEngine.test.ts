import { describe, it } from 'node:test';
import assert from 'node:assert';
import { IndiaExpansionEngine, PinCodeMetrics } from '../../src/lib/orderking/growth/IndiaExpansionEngine.ts';
import { CustomerLTVStats, RestaurantLTVStats } from '../../src/lib/orderking/growth/ReferralRewardCalculator.ts';

describe('IndiaExpansionEngine', () => {
  const engine = new IndiaExpansionEngine('https://orderking.in');

  it('accurately evaluates Tier-1 waitlist progression', () => {
    const metrics: PinCodeMetrics = {
      pincode: '400001', // Mumbai
      tier: 'TIER_1',
      primaryLanguage: 'mr', // Marathi
      averageLocalAOV_INR: 400,
      waitlistedCustomers: 500, // 500/1000 = 50%
      interestedRestaurants: 30, // 30/30 = 100%
      availableRiders: 25, // 25/50 = 50%
    };

    const progress = engine.evaluateAutonomousLaunch(metrics);
    assert.strictEqual(progress.isUnlocked, false);
    assert.strictEqual(progress.missingCustomers, 500);
    assert.strictEqual(progress.missingRestaurants, 0);
    assert.strictEqual(progress.customerProgressPct, 50);
    assert.strictEqual(progress.overallProgressPct, 66); // Math.floor((50 + 100 + 50) / 3) = 66
  });

  it('accurately evaluates Tier-3 auto-launch capability (hyper-local viral breakout)', () => {
    const metrics: PinCodeMetrics = {
      pincode: '413001', // Solapur
      tier: 'TIER_3',
      primaryLanguage: 'mr',
      averageLocalAOV_INR: 200,
      waitlistedCustomers: 300, // Over 250 threshold
      interestedRestaurants: 10, // Over 8 threshold
      availableRiders: 15, // Over 10 threshold
    };

    const progress = engine.evaluateAutonomousLaunch(metrics);
    assert.strictEqual(progress.isUnlocked, true);
    assert.strictEqual(progress.missingCustomers, 0);
    assert.strictEqual(progress.overallProgressPct, 100);
  });

  it('generates linguistically localized, gamified WhatsApp campaigns', () => {
    const metrics: PinCodeMetrics = {
      pincode: '500001', // Hyderabad
      tier: 'TIER_1',
      primaryLanguage: 'te', // Telugu
      averageLocalAOV_INR: 350,
      waitlistedCustomers: 800,
      interestedRestaurants: 20,
      availableRiders: 40,
    };

    const ltvStats: CustomerLTVStats = {
      averageOrderValue: 350,
      averageOrdersPerMonth: 5,
      expectedLifespanMonths: 12,
      grossMarginPercentage: 0.15 // 15% platform margin
    };

    const loop = engine.generateLocalizedWhatsAppLoop(metrics, 'user_xyz', ltvStats);
    
    // Overall Progress: 800/1000(80) + 20/30(66.6) + 40/50(80) = 226.6 / 3 = 75
    assert.ok(loop.message.includes('75%'));
    assert.ok(loop.message.includes('Zomato/Swiggy వదిలేయండి!'));
    assert.ok(loop.message.includes('UPI'));
    assert.ok(loop.url.includes('https://wa.me/?text='));
  });

  it('constructs a ruthless B2B Micro-Franchise offer to hijack competitor supply', () => {
    const metrics: PinCodeMetrics = {
      pincode: '110001', // Delhi
      tier: 'TIER_1',
      primaryLanguage: 'hi',
      averageLocalAOV_INR: 400,
      waitlistedCustomers: 0,
      interestedRestaurants: 0,
      availableRiders: 0,
    };

    const restaurantLtvStats: RestaurantLTVStats = {
      averageMonthlyRevenue: 100000, // 1 Lakh INR
      platformFeePercentage: 0.05, // OrderKing flat 5% fee (competitive exploit)
      expectedLifespanMonths: 36
    };

    const offer = engine.generateMicroFranchiseOffer('influencer_foodie123', metrics, restaurantLtvStats);
    
    assert.ok(offer.businessPitch.includes('Zomato takes 25%. We take 5%.'));
    assert.strictEqual(offer.estimatedMonthlyPassiveIncomePerRestaurantINR, 2000); // 2% of 1 Lakh
  });
});
