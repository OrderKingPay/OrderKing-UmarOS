/**
 * DeepLinkGenerator.ts
 * Generates deep-links for affiliate sharing.
 */

export enum AffiliateRole {
  CUSTOMER = 'customer',
  RESTAURANT = 'restaurant',
  RIDER = 'rider'
}

export interface DeepLinkPayload {
  referrerId: string;
  role: AffiliateRole;
  campaignId?: string;
  channel?: string;
}

export class DeepLinkGenerator {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://orderking.app') {
    this.baseUrl = baseUrl;
  }

  public generateAffiliateLink(payload: DeepLinkPayload): string {
    const url = new URL(`${this.baseUrl}/invite`);
    
    url.searchParams.append('ref', payload.referrerId);
    url.searchParams.append('role', payload.role);
    
    if (payload.campaignId) {
      url.searchParams.append('campaign', payload.campaignId);
    }
    
    if (payload.channel) {
      url.searchParams.append('channel', payload.channel);
    }
    
    return url.toString();
  }
}
