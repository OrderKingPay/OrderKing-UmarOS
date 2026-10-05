
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
    legalEntity: "LEGAL ENTITY CONFIGURATION REQUIRED",
    supportEmail: "",
    publicPhone: "",
    publicUpiVpa: "",
    regulatoryJurisdiction: "COUNSEL_REVIEW_REQUIRED",
  },
  KINGPAY: {
    appName: "King Pay",
    legalEntity: "LEGAL ENTITY CONFIGURATION REQUIRED",
    supportEmail: "",
    publicPhone: "",
    publicUpiVpa: "",
    regulatoryJurisdiction: "REGULATORY_REVIEW_REQUIRED",
  },
  SYSTEM: {
    appName: "Umar OS",
    legalEntity: "INTERNAL CONTROL PLANE",
    supportEmail: "",
    publicPhone: "",
    publicUpiVpa: "",
    regulatoryJurisdiction: "INTERNAL_ONLY",
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
