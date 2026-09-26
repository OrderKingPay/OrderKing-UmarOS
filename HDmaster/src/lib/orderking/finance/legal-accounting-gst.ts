/**
 * Verified accounting/compliance adapter for Umar OS.
 *
 * This module is intentionally fail-closed: it never manufactures GST amounts,
 * payout records, UTRs, tax filings, or statutory compliance certifications.
 * A future implementation must source all values from the canonical ledger,
 * verified settlement records, and the applicable professional/legal workflow.
 */

export type GstReport = {
  returnType: "GSTR-1" | "GSTR-3B";
  period: string;
  taxableValuePaise: number;
  igstPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  totalTaxPaise: number;
  status: "COMPILED" | "FILED" | "PENDING_REVIEW";
};

export type LegalPayoutEntry = {
  id: string;
  recipientType: "MERCHANT" | "RIDER" | "FOUNDER_DIVIDEND";
  recipientMaskedName: string;
  grossAmountPaise: number;
  tdsDeductedPaise: number;
  netSettledPaise: number;
  utrNumber: string;
  settledAt: string;
  complianceDoc: string;
};

export class LegalAccountingGstEngine {
  private static instance: LegalAccountingGstEngine;

  private constructor() {}

  public static getInstance(): LegalAccountingGstEngine {
    if (!LegalAccountingGstEngine.instance) {
      LegalAccountingGstEngine.instance = new LegalAccountingGstEngine();
    }
    return LegalAccountingGstEngine.instance;
  }

  /**
   * Returns a review-required shell until canonical accounting data is wired.
   */
  public generateMonthlyGstReturns(month: string = new Date().toISOString().slice(0, 7)): GstReport[] {
    const empty = {
      period: month,
      taxableValuePaise: 0,
      igstPaise: 0,
      cgstPaise: 0,
      sgstPaise: 0,
      totalTaxPaise: 0,
      status: "PENDING_REVIEW" as const,
    };
    return [
      { returnType: "GSTR-1", ...empty },
      { returnType: "GSTR-3B", ...empty },
    ];
  }

  /**
   * No settlement is shown unless it comes from the verified settlement source.
   */
  public getRecentSettlementLedger(): LegalPayoutEntry[] {
    return [];
  }

  /**
   * This UI does not certify statutory status. Compliance must be established from
   * the actual organization, contracts, data-flow controls and professional review.
   */
  public verifyIntermediaryPrivacyShield(): {
    isShieldActive: boolean;
    personalDataExposed: boolean | null;
    statutoryNotice: string;
  } {
    return {
      isShieldActive: false,
      personalDataExposed: null,
      statutoryNotice:
        "Compliance and privacy status is not certified by this screen. Verify the actual data flows, contracts, security controls and applicable law before making statutory claims.",
    };
  }
}

export const legalAccounting = LegalAccountingGstEngine.getInstance();
