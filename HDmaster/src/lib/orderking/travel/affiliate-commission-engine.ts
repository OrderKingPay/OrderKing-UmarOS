export interface AffiliateOffer {
  providerId: string;
  inventoryId: string;
  basePrice: number;
  commissionRate?: number; // percentage based commission, e.g., 0.15 for 15%
  commissionFixed?: number; // fixed amount commission, e.g., 5.00 for $5 flat
  maxDiscountShare: number; // 0.0 to 1.0 (how much of the commission we are allowed/willing to pass to the customer as a discount)
}

export interface CalculatedOffer {
  providerId: string;
  inventoryId: string;
  grossPrice: number;
  customerPrice: number;
  affiliateCommission: number;
  founderRevenue: number;
}

export class AffiliateCommissionEngine {
  /**
   * Calculates the exact economics of a single affiliate offer.
   * Total commission is derived from both percentage and fixed rates.
   * Customer discount is bounded by maxDiscountShare.
   */
  calculateOffer(offer: AffiliateOffer, desiredDiscountShare: number = 1.0): CalculatedOffer {
    const actualDiscountShare = Math.min(Math.max(desiredDiscountShare, 0), offer.maxDiscountShare);
    
    const rate = offer.commissionRate ?? 0;
    const fixed = offer.commissionFixed ?? 0;
    
    // Total gross commission paid to the platform by the affiliate provider
    const affiliateCommission = (offer.basePrice * rate) + fixed;
    
    // The amount of the commission that will be returned to the customer to lower their price
    const customerDiscount = affiliateCommission * actualDiscountShare;
    
    // Final price paid by the customer
    const customerPrice = offer.basePrice - customerDiscount;
    
    // Remaining profit kept by the platform/founder
    const founderRevenue = affiliateCommission - customerDiscount;

    return {
      providerId: offer.providerId,
      inventoryId: offer.inventoryId,
      grossPrice: offer.basePrice,
      customerPrice: Number(customerPrice.toFixed(4)),
      affiliateCommission: Number(affiliateCommission.toFixed(4)),
      founderRevenue: Number(founderRevenue.toFixed(4))
    };
  }

  /**
   * Evaluates multiple offers for the exact same inventory (e.g. same flight, same hotel room)
   * and identifies the best economic route.
   * 
   * Optimization Target:
   * 1. Lowest legitimate customer total price.
   * 2. Highest legitimate founder commission (if tied on customer price).
   */
  selectBestOffer(offers: AffiliateOffer[]): CalculatedOffer | null {
    if (offers.length === 0) return null;

    // Calculate all offers maximizing the allowed discount to the customer
    const calculated = offers.map(o => this.calculateOffer(o, o.maxDiscountShare));

    calculated.sort((a, b) => {
      // Primary Sort: Lowest customer price
      if (a.customerPrice !== b.customerPrice) {
        return a.customerPrice - b.customerPrice;
      }
      // Secondary Sort: Highest founder revenue (descending)
      return b.founderRevenue - a.founderRevenue;
    });

    return calculated[0];
  }
}
