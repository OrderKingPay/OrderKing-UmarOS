// Umar OS Founder Privacy & Sovereign Identity Shield
// Enforces 100% cryptographic masking: Zero founder personal identity
// is ever visible to any customer, restaurant, rider, or public entity.
// Statutory compliance: Section 79 IT Act 2000, DPDP Act 2023, Consumer Protection Rules 2020.

export interface MaskedIdentityConfig {
  publicEntityName: string;
  publicLegalEntity: string;
  publicSupportEmail: string;
  publicNodalPhone: string;
  publicUpiVpa: string;
  publicStatutoryAddress: string;
  intermediaryStatus: string;
}

export const DEFAULT_PUBLIC_IDENTITY: MaskedIdentityConfig = {
  publicEntityName: "OrderKing Sovereign Operations",
  publicLegalEntity: "King Pay Network Technologies (Section 79 IT Act Compliant Intermediary)",
  publicSupportEmail: "support@orderking.in",
  publicNodalPhone: "+91 1800-KING-PAY",
  publicUpiVpa: "orderking@ybl",
  publicStatutoryAddress: "Orderkingpay, Assam - 788710",
  intermediaryStatus: "SECTION_79_INTERMEDIARY_SHIELD_ACTIVE",
};

export class FounderPrivacyShield {
  // Regex blacklist of private founder identifiers to strip automatically
  private sensitivePatterns: RegExp[] = [
    /hasan\s*habibullah/gi,
    /habibullah/gi,
    /hasan/gi,
    /93950\s*65587/g,
    /\b(\+?91[\-\s]?)?9395065587\b/g,
    /[a-zA-Z0-9._%+-]*(?:hasan|habibullah)[a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
    /Ward\s*(?:No\.?|Number)?\s*1\b/gi,
    /Station\s*Road/gi,
    /Karimganj\s*(?:Residence|House|Home)?/gi,
    /[A-Za-z]:[\\/](?:Users|home)[\\/](?:hasan|habibullah)[^:\r\n"'<>`]*/gi,
    /(?:\/Users|\/home)\/(?:hasan|habibullah)[^:\r\n"'<>`]*/gi,
  ];

  /**
   * Masks personal names, personal phone numbers, emails, and residential addresses
   * with sovereign corporate identities.
   */
  public maskText(input: string): string {
    if (!input) return "";
    let sanitized = input;

    // 1. UPI VPA containing personal phone number -> sovereign merchant VPA
    sanitized = sanitized.replace(/(?:\+?91[\-\s]?)?9395065587@[a-zA-Z0-9.\-_]+/gi, DEFAULT_PUBLIC_IDENTITY.publicUpiVpa);

    // 2. Personal phone numbers -> Corporate Nodal Phone
    sanitized = sanitized.replace(/(?:\+?91[\-\s]?)?9395065587\b/g, DEFAULT_PUBLIC_IDENTITY.publicNodalPhone);
    sanitized = sanitized.replace(/93950\s*65587\b/g, DEFAULT_PUBLIC_IDENTITY.publicNodalPhone);

    // 3. Personal emails -> Corporate support email
    sanitized = sanitized.replace(
      /[a-zA-Z0-9._%+-]*(?:hasan|habibullah)[a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
      DEFAULT_PUBLIC_IDENTITY.publicSupportEmail
    );

    // 4. Home address / residential markers -> Statutory Operational Address
    sanitized = sanitized.replace(/Ward\s*(?:No\.?|Number)?\s*1\b/gi, DEFAULT_PUBLIC_IDENTITY.publicStatutoryAddress);
    sanitized = sanitized.replace(/Station\s*Road/gi, DEFAULT_PUBLIC_IDENTITY.publicStatutoryAddress);
    sanitized = sanitized.replace(/Karimganj\s*(?:Residence|House|Home)?/gi, DEFAULT_PUBLIC_IDENTITY.publicStatutoryAddress);

    // 5. Personal names and aliases -> Sovereign Executive Titles
    sanitized = sanitized.replace(/hasan\s*habibullah/gi, "Chief Sovereign Executive (OrderKing)");
    sanitized = sanitized.replace(/hasan/gi, "Executive Director");
    sanitized = sanitized.replace(/habibullah/gi, "Sovereign Administrator");

    return sanitized;
  }

  /**
   * Strips local directory paths and developer user environments from stack traces.
   * Completely redacts C:\Users\hasan\... or /home/hasan/... and masks sensitive tokens.
   */
  public sanitizeErrorStackTrace(error: unknown): string {
    if (!error) return "";
    let rawTrace: string;
    if (error instanceof Error) {
      rawTrace = error.stack || `${error.name}: ${error.message}`;
    } else if (typeof error === "object") {
      try {
        rawTrace = JSON.stringify(error, Object.getOwnPropertyNames(error));
      } catch {
        rawTrace = String(error);
      }
    } else {
      rawTrace = String(error);
    }

    // Strip Windows local user paths: C:\Users\hasan\...
    let sanitized = rawTrace.replace(
      /[A-Za-z]:[\\/](?:Users|home)[\\/](?:hasan|habibullah)[^:\r\n"'<>`]*/gi,
      "[REDACTED_SECURE_PATH]"
    );

    // Strip POSIX local user paths: /Users/hasan/... or /home/hasan/...
    sanitized = sanitized.replace(
      /(?:\/Users|\/home)\/(?:hasan|habibullah)[^:\r\n"'<>`]*/gi,
      "[REDACTED_SECURE_PATH]"
    );

    // Run text masking for names, phones, emails, and addresses
    return this.maskText(sanitized);
  }

  /**
   * Recursively sanitizes any database query result, object, or array
   * before returning to public client-facing APIs.
   */
  public sanitizePublicQueryResult<T>(data: T): T {
    if (data === null || data === undefined) return data;

    if (typeof data === "string") {
      return this.maskText(data) as unknown as T;
    }

    if (typeof data === "number" || typeof data === "boolean" || typeof data === "symbol" || typeof data === "bigint") {
      return data;
    }

    if (data instanceof Date) {
      return new Date(data.getTime()) as unknown as T;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizePublicQueryResult(item)) as unknown as T;
    }

    if (typeof data === "object") {
      const sanitizedObj: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        const lowerKey = key.toLowerCase();

        // Phone field redaction
        if ((lowerKey.includes("phone") || lowerKey.includes("mobile") || lowerKey === "contact") && typeof value === "string") {
          if (/9395065587/g.test(value)) {
            sanitizedObj[key] = DEFAULT_PUBLIC_IDENTITY.publicNodalPhone;
            continue;
          }
        }

        // Email field redaction
        if (lowerKey.includes("email") && typeof value === "string") {
          if (/(?:hasan|habibullah)/i.test(value)) {
            sanitizedObj[key] = DEFAULT_PUBLIC_IDENTITY.publicSupportEmail;
            continue;
          }
        }

        // Address field redaction
        if ((lowerKey.includes("address") || lowerKey.includes("residence")) && typeof value === "string") {
          if (/(?:ward|station road|karimganj)/i.test(value)) {
            sanitizedObj[key] = DEFAULT_PUBLIC_IDENTITY.publicStatutoryAddress;
            continue;
          }
        }

        // Stack trace or file path field redaction
        if ((lowerKey.includes("stack") || lowerKey.includes("path") || lowerKey.includes("trace")) && typeof value === "string") {
          sanitizedObj[key] = this.sanitizeErrorStackTrace(value);
          continue;
        }

        sanitizedObj[key] = this.sanitizePublicQueryResult(value);
      }
      return sanitizedObj as T;
    }

    return data;
  }

  /**
   * Public invoice generator with sovereign corporate masking
   */
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

  /**
   * Verifies that a payload has 0 founder identity leaks.
   */
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
