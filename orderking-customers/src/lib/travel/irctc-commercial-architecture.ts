/**
 * IRCTC Commercial Integration & B2C Partnership Architecture
 *
 * Analysis of Commercial Pathways for OrderKing:
 *
 * 1. PATHWAY A: Direct IRCTC Principal Service Provider (PSP) Agreement
 *    - Regulatory Authority: Indian Railway Catering and Tourism Corporation Ltd. (IRCTC) / Centre for Railway Information Systems (CRIS).
 *    - Capital Requirement: ₹1 Crore+ Security Deposit / Irrevocable Bank Guarantee + ₹20 Lakhs non-refundable integration fee.
 *    - Infrastructure: Dedicated MPLS leased line to CRIS PRS server farm (Chanakyapuri, New Delhi), Hardware Security Module (HSM), Class 3 Digital Signature Certificate (DSC) payload signing.
 *    - Certifications: Comprehensive STQC application security audit (MeitY), CERT-In security clearance, load testing for 10,000+ concurrency.
 *    - Estimated Timeline: 6 to 12 months.
 *    - Suitability: Tier-1 national aggregators (MakeMyTrip, EaseMyTrip, Paytm).
 *
 * 2. PATHWAY B (FASTEST LEGITIMATE COMMERCIAL ROUTE): IRCTC-Authorized B2C Sub-Service Provider (SSP) / Associate Partnership
 *    - Partner Framework: IRCTC's official B2C Partnership Scheme permits authorized PSPs (e.g. ConfirmTkt B2B / ixigo Train Partner Network / RailYatri Partner Program) to onboard corporate B2C associates.
 *    - Capital Requirement: Low working capital / rolling deposit (typically ₹2 to ₹5 Lakhs maintained with the authorized PSP).
 *    - Infrastructure: Standard HTTPS REST APIs with OAuth / IRCTC User ID validation. The partner PSP's existing CRIS leased line, STQC certification, and bank guarantee legitimately cover the railway infrastructure.
 *    - User Experience: Passenger enters IRCTC User ID in OrderKing; authentication and booking execute via partner PSP SDK/gateway; official 10-digit PNR is issued by Indian Railways with instant PNR tracking.
 *    - Estimated Timeline: 2 to 4 weeks.
 *    - Suitability: High-growth consumer super-apps and fintech platforms (OrderKing).
 *
 * 3. CURRENT OPERATIONAL STATUS: Official IRCTC Portal Handoff (Zero In-App Debit)
 *    - Until either Pathway B or Pathway A commercial agreements are executed and production API keys provisioned, OrderKing operates in 100% Truthful Official Handoff Mode.
 *    - Pre-populates station codes, journey date, class, and quota.
 *    - Hands off passengers directly to https://www.irctc.co.in/nget/train-search with ₹0 OrderKing fee and zero customer debit.
 */

export interface IrctcCommercialPathway {
  id: "direct_psp" | "b2c_ssp_associate" | "official_handoff";
  title: string;
  authority: string;
  capitalRequirement: string;
  infrastructurePrerequisites: string[];
  estimatedTimeline: string;
  status: "Active" | "Recommended" | "Alternative";
}

export const IRCTC_COMMERCIAL_PATHWAYS: IrctcCommercialPathway[] = [
  {
    id: "official_handoff",
    title: "Official IRCTC Transparent Handoff Mode",
    authority: "IRCTC Next Generation e-Ticketing (NGeT)",
    capitalRequirement: "₹0",
    infrastructurePrerequisites: [
      "Direct deep-link URL schema generation (https://www.irctc.co.in/nget/train-search)",
      "Station code resolution via CRIS PRS standard station list",
      "Tatkal passenger roster clipboard builder",
      "Zero in-app payment collection",
    ],
    estimatedTimeline: "Currently Active in Production",
    status: "Active",
  },
  {
    id: "b2c_ssp_associate",
    title: "IRCTC-Authorized B2C Sub-Service Provider (SSP) / Associate (Fastest Commercial Route)",
    authority: "IRCTC Authorized PSP Partner (ConfirmTkt B2B / ixigo Partner Network / RailYatri)",
    capitalRequirement: "₹2,00,000 – ₹5,00,000 Rolling Balance",
    infrastructurePrerequisites: [
      "Commercial Master Services Agreement (MSA) with an IRCTC-authorized PSP",
      "Partner B2B API / SDK Integration for PRS train search and availability",
      "IRCTC User ID verification & login handoff",
      "Payment gateway escrow settlement",
    ],
    estimatedTimeline: "2 to 4 Weeks",
    status: "Recommended",
  },
  {
    id: "direct_psp",
    title: "Direct IRCTC Principal Service Provider (PSP) Integration",
    authority: "IRCTC Ltd. & Centre for Railway Information Systems (CRIS)",
    capitalRequirement: "₹1,00,00,000 Bank Guarantee + ₹20,00,000 Integration Fee",
    infrastructurePrerequisites: [
      "IRCTC B2C Internet Ticketing Scheme Agreement",
      "Dedicated MPLS leased line to CRIS PRS server farm",
      "STQC CERT-In Application Security Audit Certification",
      "Class 3 Digital Signature Certificate (DSC) / HSM signing",
    ],
    estimatedTimeline: "6 to 12 Months",
    status: "Alternative",
  },
];
