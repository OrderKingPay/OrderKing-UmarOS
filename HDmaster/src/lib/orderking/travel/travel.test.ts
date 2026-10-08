import test from 'node:test';
import assert from 'node:assert';
import { AffiliateCommissionEngine, AffiliateOffer } from './affiliate-commission-engine';
import { TravelOrchestrator, TravelProvider, TravelSearchQuery } from './travel-orchestrator';

test('AffiliateCommissionEngine - calculates basic percentage commission correctly', () => {
  const engine = new AffiliateCommissionEngine();
  const offer: AffiliateOffer = {
    providerId: 'booking-com',
    inventoryId: 'hotel-123',
    basePrice: 100,
    commissionRate: 0.15, // 15%
    maxDiscountShare: 0.5 // Pass up to half of commission to customer
  };

  const calculated = engine.calculateOffer(offer);
  
  assert.strictEqual(calculated.grossPrice, 100);
  assert.strictEqual(calculated.affiliateCommission, 15);
  assert.strictEqual(calculated.customerPrice, 100 - (15 * 0.5)); // 92.5
  assert.strictEqual(calculated.founderRevenue, 15 - 7.5); // 7.5
});

test('AffiliateCommissionEngine - calculates mixed fixed and percentage commission correctly', () => {
  const engine = new AffiliateCommissionEngine();
  const offer: AffiliateOffer = {
    providerId: 'booking-com',
    inventoryId: 'hotel-123',
    basePrice: 200,
    commissionRate: 0.10, // 10% = $20
    commissionFixed: 5.0, // $5 fixed
    maxDiscountShare: 0.2 // pass 20% of total commission
  };

  const calculated = engine.calculateOffer(offer);
  
  // Total commission: $25
  // Discount to customer: 25 * 0.2 = $5
  assert.strictEqual(calculated.affiliateCommission, 25);
  assert.strictEqual(calculated.customerPrice, 195);
  assert.strictEqual(calculated.founderRevenue, 20);
});

test('AffiliateCommissionEngine - selects best offer balancing customer price and founder revenue', () => {
  const engine = new AffiliateCommissionEngine();
  
  // Same hotel, different providers
  const offers: AffiliateOffer[] = [
    {
      providerId: 'provider-a',
      inventoryId: 'hotel-123',
      basePrice: 100,
      commissionRate: 0.10, 
      maxDiscountShare: 1.0 // Customer price: 90, Founder rev: 0
    },
    {
      providerId: 'provider-b',
      inventoryId: 'hotel-123',
      basePrice: 100,
      commissionRate: 0.20,
      maxDiscountShare: 0.6 // Customer price: 100 - (20 * 0.6) = 88, Founder rev: 20 - 12 = 8
    },
    {
      providerId: 'provider-c',
      inventoryId: 'hotel-123',
      basePrice: 100,
      commissionRate: 0.25,
      maxDiscountShare: 0.48 // Customer price: 100 - (25 * 0.48) = 88, Founder rev: 25 - 12 = 13
    }
  ];

  const best = engine.selectBestOffer(offers);
  
  assert.ok(best);
  // Provider B and C tie on customer price (88). Provider C has higher founder revenue (13 vs 8).
  assert.strictEqual(best.providerId, 'provider-c');
  assert.strictEqual(best.customerPrice, 88);
  assert.strictEqual(best.founderRevenue, 13);
});

test('TravelOrchestrator - aggregates providers and correctly maps inventory competition', async () => {
  const orchestrator = new TravelOrchestrator();

  class MockExpedia implements TravelProvider {
    id = 'expedia';
    async search(query: TravelSearchQuery): Promise<AffiliateOffer[]> {
      return [
        {
          providerId: this.id,
          inventoryId: 'flight-dl-404',
          basePrice: 500,
          commissionRate: 0.05, // $25 commission
          maxDiscountShare: 0.5 // $12.5 discount -> $487.5 price, $12.5 rev
        },
        {
          providerId: this.id,
          inventoryId: 'flight-dl-505',
          basePrice: 300,
          commissionRate: 0.05,
          maxDiscountShare: 0.0
        }
      ];
    }
  }

  class MockSkyscanner implements TravelProvider {
    id = 'skyscanner';
    async search(query: TravelSearchQuery): Promise<AffiliateOffer[]> {
      return [
        {
          providerId: this.id,
          inventoryId: 'flight-dl-404', // Same flight
          basePrice: 500,
          commissionRate: 0.08, // $40 commission
          maxDiscountShare: 0.5 // $20 discount -> $480 price, $20 rev
        }
      ];
    }
  }

  orchestrator.registerProvider('flight', new MockExpedia());
  orchestrator.registerProvider('flight', new MockSkyscanner());

  const results = await orchestrator.search({
    type: 'flight',
    origin: 'JFK',
    destination: 'LHR',
    date: '2026-12-01'
  });

  assert.strictEqual(results.length, 2);

  // Results should be sorted by best customer price ascending
  // flight-dl-505 has price 300
  // flight-dl-404 has price 480
  
  assert.strictEqual(results[0].inventoryId, 'flight-dl-505');
  assert.strictEqual(results[0].bestOffer.customerPrice, 300);

  assert.strictEqual(results[1].inventoryId, 'flight-dl-404');
  assert.strictEqual(results[1].bestOffer.providerId, 'skyscanner');
  assert.strictEqual(results[1].bestOffer.customerPrice, 480);
  assert.strictEqual(results[1].bestOffer.founderRevenue, 20);
  
  // Should have the expedia alternative for dl-404
  assert.strictEqual(results[1].alternativeOffers.length, 1);
  assert.strictEqual(results[1].alternativeOffers[0].providerId, 'expedia');
  assert.strictEqual(results[1].alternativeOffers[0].customerPrice, 487.5);
});
