/**
 * 🇮🇳 ORDERKING / UMAROS DPDP ACT 2023 DATA GOVERNANCE ENGINE
 * packages/ui/src/dpdp.ts
 *
 * Statutory Compliance Standards:
 * Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023):
 * 1. Notice & Consent Governance (Sections 5 & 6):
 *    - Explicit, granular, informed consent with verifiable timestamp, IP, and version.
 * 2. Purpose Limitation & Data Minimization (Section 7):
 *    - Personal data collected strictly for order dispatch, invoicing, and statutory taxation.
 * 3. Security Safeguards & Masked Telephony (Section 8):
 *    - Virtual VoIP telephony bridge; customer direct telephone number is never exposed to merchants or delivery riders.
 * 4. Data Principal Rights (Sections 11, 12, 13, 14):
 *    - Right to Access summary of personal data & entities with whom shared.
 *    - Right to Correction and Updating.
 *    - Right to Erasure / Oblivion.
 * 5. Statutory Retention Conflict Resolution:
 *    - Under Section 36 CGST Act, 2017, all books of account, invoices, credit notes,
 *      and tax settlement ledgers must be retained for seventy-two (72) months (6 years).
 *    - Under DPDP Act 2023 Section 8(7), non-financial personal data (GPS telemetry, breadcrumbs)
 *      must be purged after operational fulfillment (max 90 days).
 */

export const DPDP_OFFICIAL_DPO = {
  name: "OrderKing Data Protection Officer",
  email: "dpo@orderking.in",
  postalAddress: "OrderKing Compliance Operations, New Delhi, India",
  escalationSlaDays: 15,
};

export type DpdpPurpose =
  | "ORDER_FULFILLMENT"
  | "PAYMENT_AND_TAX_COMPLIANCE"
  | "DELIVERY_TELEMETRY"
  | "CUSTOMER_SUPPORT";

export interface DpdpConsentRecord {
  dataPrincipalId: string;
  dataPrincipalType: "CUSTOMER" | "MERCHANT" | "RIDER";
  consentedPurposes: DpdpPurpose[];
  noticeVersion: string;
  consentTimestampIso: string;
  ipAddress: string;
  userAgent?: string;
  isFreelyGiven: boolean;
}

export interface DpdpConsentValidationResult {
  isValid: boolean;
  errors: string[];
}

export type DpdpRetentionCategory =
  | "FINANCIAL_LEDGER"
  | "TAX_INVOICE"
  | "GPS_TELEMETRY"
  | "COMMUNICATION_LOG"
  | "CUSTOMER_PII";

export interface DpdpRetentionPolicy {
  category: DpdpRetentionCategory;
  statutoryBasis: string;
  retentionMonths: number;
  isStrictRetentionMandate: boolean;
}

export const STATUTORY_RETENTION_POLICIES: Record<DpdpRetentionCategory, DpdpRetentionPolicy> = {
  FINANCIAL_LEDGER: {
    category: "FINANCIAL_LEDGER",
    statutoryBasis: "Section 36 Central Goods and Services Tax (CGST) Act, 2017",
    retentionMonths: 72, // 6 years
    isStrictRetentionMandate: true,
  },
  TAX_INVOICE: {
    category: "TAX_INVOICE",
    statutoryBasis: "Section 36 Central Goods and Services Tax (CGST) Act, 2017 & Income Tax Act",
    retentionMonths: 72, // 6 years
    isStrictRetentionMandate: true,
  },
  GPS_TELEMETRY: {
    category: "GPS_TELEMETRY",
    statutoryBasis: "Section 8(7) DPDP Act, 2023 (Data minimization for ephemeral tracking)",
    retentionMonths: 3, // 90 days
    isStrictRetentionMandate: false,
  },
  COMMUNICATION_LOG: {
    category: "COMMUNICATION_LOG",
    statutoryBasis: "Information Technology Act, 2000 & Telecom Regulations",
    retentionMonths: 12, // 1 year
    isStrictRetentionMandate: false,
  },
  CUSTOMER_PII: {
    category: "CUSTOMER_PII",
    statutoryBasis: "Section 12 DPDP Act, 2023 (Right to Erasure upon disengagement)",
    retentionMonths: 0, // Shredded upon validated erasure request
    isStrictRetentionMandate: false,
  },
};

/**
 * Masks Indian phone numbers for DPDP Act Section 8 compliance.
 * Input: "+919876543210" or "9876543210"
 * Output: "+91 98XXX XX210"
 */
export function maskCustomerPhoneNumber(phone: string | null | undefined): string {
  if (!phone || typeof phone !== "string") return "XXXXXXXXXX";
  const digits = phone.replace(/[^0-9]/g, "");

  if (digits.length < 10) {
    return "XXXXXXXXXX";
  }

  const last10 = digits.slice(-10);
  const first2 = last10.slice(0, 2);
  const last3 = last10.slice(7);
  const countryCode = digits.length > 10 ? `+${digits.slice(0, digits.length - 10)} ` : "+91 ";

  return `${countryCode}${first2}XXX XX${last3}`;
}

/**
 * Validates a DPDP Act 2023 consent record.
 */
export function validateDpdpConsentRecord(record: DpdpConsentRecord): DpdpConsentValidationResult {
  const errors: string[] = [];

  if (!record.dataPrincipalId || record.dataPrincipalId.trim().length === 0) {
    errors.push("Data Principal ID is mandatory under DPDP Act 2023");
  }

  if (!record.consentedPurposes || record.consentedPurposes.length === 0) {
    errors.push("At least one explicit purpose must be consented to");
  }

  if (!record.noticeVersion || record.noticeVersion.trim().length === 0) {
    errors.push("DPDP Notice version reference is required");
  }

  if (!record.consentTimestampIso || isNaN(Date.parse(record.consentTimestampIso))) {
    errors.push("Valid ISO-8601 consent timestamp is required");
  }

  if (!record.ipAddress || record.ipAddress.trim().length === 0) {
    errors.push("Client IP address is required for verifiable electronic audit trail");
  }

  if (!record.isFreelyGiven) {
    errors.push("Consent must be freely given, specific, and unbundled");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export interface DataRetentionEvaluation {
  category: DpdpRetentionCategory;
  recordCreatedAtIso: string;
  ageInMonths: number;
  statutoryRetentionMonths: number;
  canBeDeleted: boolean;
  retentionBasis: string;
  actionRequired: "RETAIN_MANDATORY" | "ELIGIBLE_FOR_PURGE";
}

/**
 * Evaluates whether a data record can be deleted or must be preserved under statutory laws.
 */
export function evaluateDataRetentionStatus(
  category: DpdpRetentionCategory,
  createdAt: Date | string,
  referenceDate: Date = new Date()
): DataRetentionEvaluation {
  const created = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  if (isNaN(created.getTime())) {
    throw new Error("Invalid createdAt date");
  }

  const diffMs = referenceDate.getTime() - created.getTime();
  const ageInMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4375));

  const policy = STATUTORY_RETENTION_POLICIES[category];
  const canBeDeleted = !policy.isStrictRetentionMandate && ageInMonths >= policy.retentionMonths;

  return {
    category,
    recordCreatedAtIso: created.toISOString(),
    ageInMonths,
    statutoryRetentionMonths: policy.retentionMonths,
    canBeDeleted,
    retentionBasis: policy.statutoryBasis,
    actionRequired: canBeDeleted ? "ELIGIBLE_FOR_PURGE" : "RETAIN_MANDATORY",
  };
}

export interface DpdpDataPrincipalSummary {
  dataPrincipalId: string;
  dataPrincipalType: string;
  processedCategories: string[];
  dataFiduciariesSharedWith: string[];
  statutoryRetentionNotice: string;
  dpoGrievanceDesk: typeof DPDP_OFFICIAL_DPO;
  rightsAvailable: string[];
}

/**
 * Generates statutory personal data summary pursuant to Section 11 of DPDP Act 2023.
 */
export function generateDataPrincipalSummary(
  principalId: string,
  principalType: "CUSTOMER" | "MERCHANT" | "RIDER"
): DpdpDataPrincipalSummary {
  return {
    dataPrincipalId: principalId,
    dataPrincipalType: principalType,
    processedCategories: [
      "Contact Details (Masked Telephone, Delivery Address)",
      "Financial Transaction & Invoicing Ledgers (Section 9(5) CGST Act, TCS, TDS)",
      "Live GPS Logistics Telemetry (Active Duty / In-Transit Only)",
    ],
    dataFiduciariesSharedWith: [
      "OrderKing Technologies Private Limited (Data Fiduciary)",
      "Authorized Payment Aggregator (RBI Registered Bank / PG)",
      "Goods & Services Tax Network (GSTN - Mandatory Table 3.1.1 E-Commerce Reporting)",
    ],
    statutoryRetentionNotice:
      "Financial and statutory tax ledgers are retained for seventy-two (72) months in accordance with Section 36 of the CGST Act, 2017. Ephemeral GPS telemetry is purged within 90 days pursuant to Section 8(7) DPDP Act 2023.",
    dpoGrievanceDesk: DPDP_OFFICIAL_DPO,
    rightsAvailable: [
      "Section 11: Right to Access Summary of Personal Data",
      "Section 12: Right to Correction, Completion & Erasure (Subject to statutory tax retention)",
      "Section 13: Right of Grievance Redressal (15-Day Resolution SLA)",
      "Section 14: Right to Nominate",
    ],
  };
}
