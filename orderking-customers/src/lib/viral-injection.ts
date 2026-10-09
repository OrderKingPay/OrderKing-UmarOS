/**
 * UmarOS Viral Growth & Monetization Engine Integration
 * Provides thermonuclear viral injection and King's Pass revenue pipelines.
 */

// Define strict interfaces for UmarOS engines
export interface ViralGrowthEngine {
  initiateWhatsAppLoop(userId: string, campaignId: string, payload: Record<string, any>): Promise<boolean>;
  trackViralCoefficient(campaignId: string): Promise<number>;
}

export interface MonetizationEngine {
  processKingsPassCheckout(userId: string, tier: 'basic' | 'premium' | 'king'): Promise<{ success: boolean; transactionId: string }>;
}

export class ViralInjectionService {
  private growthEngine: ViralGrowthEngine;
  private monetizationEngine: MonetizationEngine;

  constructor(growthEngine: ViralGrowthEngine, monetizationEngine: MonetizationEngine) {
    this.growthEngine = growthEngine;
    this.monetizationEngine = monetizationEngine;
  }

  /**
   * Triggers the WhatsApp Viral Loop for the user.
   */
  public async triggerWhatsAppViralLoop(userId: string, customMessage: string): Promise<void> {
    console.log(`[ViralInjection] Initiating WhatsApp loop for user: ${userId}`);
    try {
      const success = await this.growthEngine.initiateWhatsAppLoop(userId, 'THERMONUCLEAR_CAMPAIGN_01', {
        message: customMessage,
        timestamp: new Date().toISOString()
      });

      if (success) {
        console.log(`[ViralInjection] WhatsApp loop successfully injected for ${userId}`);
      } else {
        console.warn(`[ViralInjection] WhatsApp loop injection failed for ${userId}`);
      }
    } catch (error) {
      console.error(`[ViralInjection] CRITICAL ERROR in WhatsApp viral loop:`, error);
      throw new Error('Thermonuclear viral injection failed.');
    }
  }

  /**
   * Initiates the King's Pass checkout flow UI trigger.
   */
  public async triggerKingsPassCheckout(userId: string): Promise<string> {
    console.log(`[Monetization] Initiating King's Pass checkout for user: ${userId}`);
    try {
      const result = await this.monetizationEngine.processKingsPassCheckout(userId, 'king');
      
      if (result.success) {
        console.log(`[Monetization] King's Pass checkout successful. TXID: ${result.transactionId}`);
        return result.transactionId;
      } else {
        throw new Error('Checkout declined by MonetizationEngine.');
      }
    } catch (error) {
      console.error(`[Monetization] King's Pass checkout failed:`, error);
      throw new Error('Revenue injection failed.');
    }
  }
}

// Singleton export for frontend usage
export const createViralInjection = (
  growthEngine: ViralGrowthEngine,
  monetizationEngine: MonetizationEngine
) => new ViralInjectionService(growthEngine, monetizationEngine);
