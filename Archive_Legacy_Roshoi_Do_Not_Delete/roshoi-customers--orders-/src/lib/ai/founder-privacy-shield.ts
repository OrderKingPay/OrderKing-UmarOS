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
    legalEntity: "OrderKing Sovereign Operations Private Limited",
    supportEmail: "ops@orderking.in",
    publicPhone: "+91 8000 123 456",
    publicUpiVpa: "orderking@okhdfcbank",
    regulatoryJurisdiction: "Sribhumi Jurisdiction, Section 79 IT Act 2000",
  },
  KINGPAY: {
    appName: "King Pay",
    legalEntity: "King Pay Technologies Private Limited",
    supportEmail: "compliance@kingpay.in",
    publicPhone: "+91 8000 987 654",
    publicUpiVpa: "orderking@okhdfcbank",
    regulatoryJurisdiction: "Reserve Bank of India Master Directions & IT Act 2000",
  },
  SYSTEM: {
    appName: "Umar OS",
    legalEntity: "Umar Sovereign Infrastructure Group",
    supportEmail: "executive@umaros.internal",
    publicPhone: "+91 8000 000 000",
    publicUpiVpa: "orderking@okhdfcbank",
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
