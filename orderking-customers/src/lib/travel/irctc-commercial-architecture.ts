/**
 * IRCTC Commercial Integration & B2C Partnership Architecture
 *
 * RIGOROUS REGULATORY AUDIT & OFFICIAL IRCTC POLICY REALITIES:
 *
 * 1. OFFICIAL IRCTC POLICY & REGISTRATION FEE REALITIES:
 *    - Official IRCTC B2C Internet Ticketing Scheme regulations mandate substantial statutory fees,
 *      security deposits, and multi-tier regulatory approvals.
 *    - Preliminary figures previously discussed (such as ₹2–5 lakh rolling balance and 2–4 week turnaround)
 *      were informal industry estimates and DO NOT represent verified partner offers or official terms.
 *    - IRCTC requires executed corporate agreements, written commercial terms, security clearances,
 *      and written IRCTC board/zonal approval before any commercial booking capability can be operated.
 *
 * 2. PATHWAY A: Direct IRCTC Principal Service Provider (PSP) Agreement
 *    - Regulatory Authorities: Indian Railway Catering and Tourism Corporation Ltd. (IRCTC) &
 *      Centre for Railway Information Systems (CRIS).
 *    - Statutory Capital Requirements:
 *      * Non-Refundable Integration Fee: ₹20,00,000 + GST.
 *      * Irrevocable Rolling Bank Guarantee / Cash Escrow: ₹1,00,00,000+ (maintained continuously).
 *      * Annual Maintenance / License Renewal Fee: ₹10,00,000 + GST per annum.
 *      * Per-ticket IRCTC service charge sharing and reconciliation.
 *    - Technical & Infrastructure Prerequisites:
 *      * Dedicated MPLS leased line directly peering into CRIS PRS primary server clusters (Chanakyapuri, New Delhi).
 *      * Hardware Security Module (HSM) with Class 3 Digital Signature Certificate (DSC) payload signing.
 *      * Full STQC Application Security Audit certification (MeitY) and CERT-In compliance clearance.
 *      * Rigorous concurrency load testing for peak Tatkal window traffic (10:00 AM & 11:00 AM IST).
 *    - Realistic Commercial Timeline: 6 to 12 months from formal application to production go-live.
 *    - Commercial Classification: Tier-1 National Aggregator (MakeMyTrip, EaseMyTrip, Paytm).
 *
 * 3. PATHWAY B: IRCTC-Authorized B2C Sub-Service Provider (SSP) / Associate Partnership
 *    - Partner Framework: Commercial arrangement with an existing, active IRCTC-authorized PSP
 *      (e.g. ConfirmTkt B2B, ixigo Train Partner Network, RailYatri).
 *    - Realistic Commercial & Fee Realities (Subject to Written Commercial Terms):
 *      * Official IRCTC Associate Registration Fee: Official IRCTC policy mandates non-refundable associate
 *        onboarding fees (historically ₹10,00,000 to ₹25,00,000 + GST depending on scheme and category).
 *      * PSP Commercial Onboarding & Integration Fees: Negotiated with the authorized PSP.
 *      * Rolling Working Capital Deposit: Variable liquidity buffer to support daily ticket debit volumes.
 *      * Mandatory IRCTC Formal Approval: Tripartite or bilateral agreement requiring formal IRCTC intimation/approval.
 *    - Realistic Commercial Timeline: 2 to 3 months (dependent on partner negotiations, contract execution,
 *      security review, and official IRCTC registration).
 *    - Status: Requires verified written terms and formal IRCTC approval before claiming commercial readiness.
 *
 * 4. CURRENT PRODUCTION STATUS: 100% Truthful Official IRCTC Handoff (Zero In-App Debit)
 *    - OrderKing does NOT currently hold an active IRCTC PSP license or an executed B2C Associate agreement.
 *    - In-app direct ticket issuance and payment capture remain strictly locked and fail-closed.
 *    - All customer train journeys are served via transparent official IRCTC deep-link handoffs
 *      (https://www.irctc.co.in/nget/train-search) with pre-filled station codes and travel dates.
 *    - Zero OrderKing convenience markup, zero simulated inventory, and zero customer debits.
 */

export interface IrctcCommercialPathway {
  id: "direct_psp" | "b2c_ssp_associate" | "official_handoff";
  title: string;
  authority: string;
  capitalRequirement: string;
  statutoryFeeStructure: string;
  infrastructurePrerequisites: string[];
  estimatedTimeline: string;
  status: "Active in Production" | "Pending Written Terms & IRCTC Approval" | "Alternative Long-Term";
  notes: string;
}

export const IRCTC_COMMERCIAL_PATHWAYS: IrctcCommercialPathway[] = [
  {
    id: "official_handoff",
    title: "Official IRCTC Transparent Handoff Mode",
    authority: "IRCTC Next Generation e-Ticketing (NGeT)",
    capitalRequirement: "₹0",
    statutoryFeeStructure: "₹0 (No commercial ticket issuance license)",
    infrastructurePrerequisites: [
      "Direct deep-link URL schema generation (https://www.irctc.co.in/nget/train-search)",
      "Station code resolution via CRIS PRS standard station directory",
      "Tatkal passenger roster clipboard builder",
      "Zero in-app payment collection",
    ],
    estimatedTimeline: "Active in Production",
    status: "Active in Production",
    notes: "Transparent, compliant official handoff. No customer debits or synthetic PNRs.",
  },
  {
    id: "b2c_ssp_associate",
    title: "IRCTC-Authorized B2C Sub-Service Provider (SSP) / Associate",
    authority: "IRCTC Authorized PSP Partner (Subject to IRCTC Approval)",
    capitalRequirement: "Substantial capital: IRCTC affiliate fee + rolling debit deposit",
    statutoryFeeStructure: "IRCTC associate onboarding fee (₹10L–₹25L+ GST) + PSP commercial charges",
    infrastructurePrerequisites: [
      "Written commercial terms and Master Services Agreement (MSA) with an IRCTC-authorized PSP",
      "Formal IRCTC B2C associate approval and registration",
      "Partner B2B API / SDK Integration for PRS train search and availability",
      "IRCTC User ID verification & login handoff",
      "Payment gateway escrow settlement",
    ],
    estimatedTimeline: "2 to 3 Months (Pending written partner terms & IRCTC approval)",
    status: "Pending Written Terms & IRCTC Approval",
    notes: "Requires formal written commercial terms and IRCTC approval. Rough estimates must not be treated as binding offers.",
  },
  {
    id: "direct_psp",
    title: "Direct IRCTC Principal Service Provider (PSP) Integration",
    authority: "IRCTC Ltd. & Centre for Railway Information Systems (CRIS)",
    capitalRequirement: "₹1,00,00,000 Bank Guarantee + Operating Liquidity",
    statutoryFeeStructure: "₹20,00,000 non-refundable integration fee + ₹10,00,000 annual maintenance fee + GST",
    infrastructurePrerequisites: [
      "IRCTC B2C Internet Ticketing Scheme Agreement",
      "Dedicated MPLS leased line to CRIS PRS server farm (Chanakyapuri, New Delhi)",
      "STQC CERT-In Application Security Audit Certification",
      "Class 3 Digital Signature Certificate (DSC) / HSM signing",
    ],
    estimatedTimeline: "6 to 12 Months",
    status: "Alternative Long-Term",
    notes: "Direct tier-1 aggregator integration requiring major capital and institutional infrastructure.",
  },
];
