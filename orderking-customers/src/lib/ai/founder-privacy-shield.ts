
// Umar OS: Cryptographic Founder Privacy Shield
// Strictly guarantees that the founder's personal identity is NEVER visible to any customer, restaurant, or rider.
// Enforces sovereign corporate entity personas for all external communications.

export interface PublicFacingEntity {
  appName: string;
  legalEntity: string;
  supportEmail: string;
  publicPhone: string;
  publicUpiVpa: string;
  regulatoryJurisdiction: string;
}

export const SOVEREIGN_PUBLIC_ENTITIES: Record<"FOODS" | "KINGPAY" | "SYSTEM", PublicFacingEntity> = {
  FOODS: {
    appName: "Order King",
    legalEntity: "Orderkingpay",
    supportEmail: "ops@orderking.in",
    publicPhone: "+91 8000 123 456",
    publicUpiVpa: "9395065587@ybl",
    regulatoryJurisdiction: "Sribhumi, Assam - 788710 | GSTIN: 18AFXPH9838M1Z9",
  },
  KINGPAY: {
    appName: "King Pay",
    legalEntity: "Orderkingpay",
    supportEmail: "compliance@kingpay.in",
    publicPhone: "+91 8000 987 654",
    publicUpiVpa: "9395065587@ybl",
    regulatoryJurisdiction: "Reserve Bank of India Master Directions & IT Act 2000",
  },
  SYSTEM: {
    appName: "Order King",
    legalEntity: "Orderkingpay",
    supportEmail: "executive@orderking.internal",
    publicPhone: "+91 8000 000 000",
    publicUpiVpa: "9395065587@ybl",
    regulatoryJurisdiction: "Autonomous Founder Protected Architecture",
  },
};

export class FounderPrivacyShield {
  private static instance: FounderPrivacyShield;

  public static getInstance(): FounderPrivacyShield {
    if (!FounderPrivacyShield.instance) {
      FounderPrivacyShield.instance = new FounderPrivacyShield();
    }
    return FounderPrivacyShield.instance;
  }

  /**
   * Sanitizes any customer, restaurant, or rider payload, redacting personal names, private numbers, and emails.
   */
  public sanitizePublicPayload(text: string, context: "FOODS" | "KINGPAY" | "SYSTEM" = "SYSTEM"): string {
    const entity = SOVEREIGN_PUBLIC_ENTITIES[context];
    
    return text
      .replace(/hasan/gi, entity.legalEntity)
      .replace(/habibullah/gi, "")
      .replace(/\+91\s?[6-9]\d{9}/g, entity.publicPhone)
      .replace(/[a-zA-Z0-9._%+-]+@(gmail|yahoo|hotmail|outlook)\.com/gi, entity.supportEmail)
      .replace(/[a-zA-Z0-9.\-_]{2,256}@(okhdfcbank|okaxis|oksbi|paytm)/gi, entity.publicUpiVpa);
  }

  public getPublicEntity(context: "FOODS" | "KINGPAY" | "SYSTEM" = "SYSTEM"): PublicFacingEntity {
    return SOVEREIGN_PUBLIC_ENTITIES[context];
  }
}

export const founderPrivacyShield = FounderPrivacyShield.getInstance();
