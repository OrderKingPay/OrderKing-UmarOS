import { AffiliateCommissionEngine, AffiliateOffer, CalculatedOffer } from './affiliate-commission-engine';

export type TravelType = 'flight' | 'rail' | 'hotel' | 'bus';

export interface TravelSearchQuery {
  type: TravelType;
  origin: string;
  destination: string;
  date: string;
  passengers?: number;
}

export interface TravelProvider {
  id: string;
  search(query: TravelSearchQuery): Promise<AffiliateOffer[]>;
}

export interface TravelSearchResult {
  inventoryId: string;
  type: TravelType;
  bestOffer: CalculatedOffer;
  alternativeOffers: CalculatedOffer[];
}

export class TravelOrchestrator {
  private providers: Map<TravelType, TravelProvider[]> = new Map();
  private commissionEngine: AffiliateCommissionEngine;

  constructor() {
    this.commissionEngine = new AffiliateCommissionEngine();
  }

  /**
   * Registers an affiliate provider capable of searching a specific travel type.
   */
  registerProvider(type: TravelType, provider: TravelProvider): void {
    if (!this.providers.has(type)) {
      this.providers.set(type, []);
    }
    this.providers.get(type)!.push(provider);
  }

  /**
   * Executes a multi-provider affiliate search and returns economically optimized results.
   */
  async search(query: TravelSearchQuery): Promise<TravelSearchResult[]> {
    const providers = this.providers.get(query.type) || [];
    if (providers.length === 0) {
      return [];
    }

    // Execute searches concurrently across all registered providers
    const providerPromises = providers.map(p => 
      p.search(query).catch((err) => {
        console.error(`Provider ${p.id} search failed:`, err);
        return [] as AffiliateOffer[];
      })
    );
    const results = await Promise.all(providerPromises);
    
    // Flatten all retrieved offers
    const allOffers = results.flat();

    // Group offers by inventoryId to compare different providers selling the exact same item
    const offersByInventory = new Map<string, AffiliateOffer[]>();
    for (const offer of allOffers) {
      if (!offersByInventory.has(offer.inventoryId)) {
        offersByInventory.set(offer.inventoryId, []);
      }
      offersByInventory.get(offer.inventoryId)!.push(offer);
    }

    const searchResults: TravelSearchResult[] = [];

    // Analyze groups and select the best offer for each unique inventory item
    for (const [inventoryId, offers] of offersByInventory.entries()) {
      const bestOffer = this.commissionEngine.selectBestOffer(offers);
      
      if (bestOffer) {
        // Collect alternatives for transparency or fallback
        const alternatives = offers
          .map(o => this.commissionEngine.calculateOffer(o, o.maxDiscountShare))
          .filter(o => o.providerId !== bestOffer.providerId);
          
        searchResults.push({
          inventoryId,
          type: query.type,
          bestOffer,
          alternativeOffers: alternatives
        });
      }
    }

    // Rank overall results by the best customer price
    searchResults.sort((a, b) => a.bestOffer.customerPrice - b.bestOffer.customerPrice);

    return searchResults;
  }
}
