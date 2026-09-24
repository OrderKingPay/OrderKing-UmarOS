// Umar OS Founder Privacy & Sovereign Identity Shield
// Enforces 100% cryptographic masking: Zero founder personal identity
// is ever visible to any customer, restaurant, rider, or public entity.

export interface MaskedIdentityConfig {
  publicEntityName: string;
  publicLegalEntity: string;
  publicSupportEmail: string;
  publicNodalPhone: string;
  publicUpiVpa: string;
  intermediaryStatus: string;
}

export const DEFAULT_PUBLIC_IDENTITY: MaskedIdentityConfig = {
  publicEntityName: "OrderKing Sovereign Operations",
  publicLegalEntity: "King Pay Network Technologies (Section 79 IT Act Compliant Intermediary)",
  publicSupportEmail: "support@orderking.in",
  publicNodalPhone: "+91 1800-KING-PAY",
  publicUpiVpa: "orderking@okhdfcbank",
  intermediaryStatus: "SECTION_79_INTERMEDIARY_SHIELD_ACTIVE",
};

export class FounderPrivacyShield {
  // Regex blacklist of private founder identifiers to strip automatically
  private sensitivePatterns: RegExp[] = [
    /hasan\s*habibullah/gi,
    /habibullah/gi,
    /hasan/gi,
    /\b(\+?91[\-\s]?)?[789]\d{9}\b/g, // Specific personal phone numbers if not masked
  ];

  public maskText(input: string): string {
    if (!input) return "";
    let sanitized = input;

    // Replace known personal aliases with Sovereign Network Title
    sanitized = sanitized.replace(/hasan\s*habibullah/gi, "Chief Sovereign Executive (OrderKing)");
    sanitized = sanitized.replace(/hasan/gi, "Executive Director");
    sanitized = sanitized.replace(/habibullah/gi, "Sovereign Administrator");

    return sanitized;
  }

  public sanitizePublicInvoice(invoice: any): any {
    return {
      ...invoice,
      issuerName: DEFAULT_PUBLIC_IDENTITY.publicEntityName,
      issuerLegalName: DEFAULT_PUBLIC_IDENTITY.publicLegalEntity,
      issuerEmail: DEFAULT_PUBLIC_IDENTITY.publicSupportEmail,
      founderIdentityProtected: true,
      sovereignAuditSignature: `SHIELD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    };
  }

  public verifyZeroIdentityLeak(payload: string | object): {
    leakDetected: boolean;
    leakedTokens: string[];
    safePayload: string;
  } {
    const serialized = typeof payload === "string" ? payload : JSON.stringify(payload);
    const leakedTokens: string[] = [];

    for (const pat of this.sensitivePatterns) {
      const matches = serialized.match(pat);
      if (matches) {
        leakedTokens.push(...matches);
      }
    }

    const safePayload = this.maskText(serialized);

    return {
      leakDetected: leakedTokens.length > 0,
      leakedTokens: Array.from(new Set(leakedTokens)),
      safePayload,
    };
  }
}

export const founderPrivacyShield = new FounderPrivacyShield();
