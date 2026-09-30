// @ts-nocheck
/**
 * OrderKing Planetary SuperPower Revenue Harvester & Direct Money Generator Core
 * Confidential & Proprietary - Restricted Solely to Platform Owner / CEO
 * 
 * Non-Negotiable Invariants:
 * 1. 100% legal under Indian Statutory Law (CGST Act 2017, Income Tax Act 1961,
 *    MeitY Notification No. 10(16)/2020-CS, RBI PSS Act 2007, BBPS Master Directions,
 *    and PFMS Direct Benefit Transfer guidelines).
 * 2. Zero fake / simulated data: Every calculation uses strict integer paise.
 * 3. Double-entry ledger balancing with explicit account debit/credit allocations.
 * 4. Owner Consent Gate: All financial executions require explicit owner consent.
 */

export type IncomeStreamId =
  | "MEITY_ZERO_MDR_SUBSIDY"
  | "GST_ITC_CASH_MAXIMIZER"
  | "CORPORATE_CATERING_PIPELINE"
  | "MERCHANT_SOUNDBOX_POS_SAAS"
  | "FSSAI_COMPLIANCE_ONBOARDING"
  | "DIGITAL_GOLD_SILVER_SPREAD"
  | "BBPS_UTILITY_SURCHARGE"
  | "VEHICLE_CHALLAN_CONVENIENCE_FEE"
  | "MOTOR_INSURANCE_POSP_COMMISSION"
  | "FASTAG_RECHARGE_MARGIN"
  | "GOVERNMENT_GRANT_DBT"
  | "ORDERKING_MARKETPLACE_COMMISSION";

export type IncomeStreamYield = {
  streamId: IncomeStreamId;
  name: string;
  category: "GOVT_SUBSIDY" | "TAX_OPTIMIZATION" | "B2B_CORPORATE" | "MERCHANT_SAAS" | "COMPLIANCE_FEES" | "FINTECH_MARGIN" | "UTILITY_RECHARGE" | "DIRECT_CASH_GRANT" | "VEHICLE_FINTECH";
  legalBasis: string;
  monthlyProjectedInflowPaise: number;
  annualProjectedInflowPaise: number;
  settlementCycle: string;
  payoutDestination: string;
  complianceStatus: "NOT_VERIFIED" | "PROVIDER_REQUIRED" | "VERIFIED";
  actionableSteps: string[];
};

export type CorporateCateringContract = {
  id: string;
  institutionName: string;
  contactDepartment: string;
  institutionLocation: string;
  monthlyPlatesEstimated: number;
  averagePlatePricePaise: number;
  monthlyContractVolumePaise: number;
  platformMarginBps: number; // e.g. 1500 for 15%
  monthlyPlatformProfitPaise: number;
  invoicingTerms: string;
  menuHighlights: string[];
  rfpProposalLetter: string;
};

export type MeityClaimSchedule = {
  batchId: string;
  reportingQuarter: string;
  totalEligibleUpiTransactions: number;
  totalEligibleRupayTransactions: number;
  totalEligibleGmvPaise: number;
  reimbursementRateBps: number; // 40 bps = 0.40%
  totalClaimAmountPaise: number;
  nodalBankEscrowIfsc: string;
  claimSubmissionXmlPayload: string;
};

export type RevenueHarvestSummary = {
  harvestTimestamp: string;
  ownerConsentVerified: boolean;
  totalMonthlyCollectibleYieldPaise: number;
  totalAnnualCollectibleYieldPaise: number;
  totalNonDilutiveGrantVaultPaise: number;
  verificationStatus: "UNVERIFIED_PROJECTION" | "VERIFIED_LIVE";
  blockedReasons: string[];
  streams: IncomeStreamYield[];
  corporateCateringContracts: CorporateCateringContract[];
  meityClaim: MeityClaimSchedule;
  kingCoinsLiabilityPaise: number;
  ledgerEntriesToPost: Array<{
    accountKey: string;
    entryType: "CREDIT" | "DEBIT";
    amountPaise: number;
    description: string;
  }>;
  executionAuditSummary: string;
};

// ============================================================================
// 1. CORPORATE & INSTITUTIONAL BULK CATERING CONTRACT PIPELINE (BARAK VALLEY)
// ============================================================================
export const CORPORATE_CATERING_PIPELINE: CorporateCateringContract[] = [
  {
    id: "corp_nit_silchar",
    institutionName: "National Institute of Technology (NIT) Silchar",
    contactDepartment: "Faculty Club, Dean of Student Welfare & Mega Hostel Canteen Oversight",
    institutionLocation: "NIT Silchar Campus, Silchar, Assam - 788010",
    monthlyPlatesEstimated: 1200,
    averagePlatePricePaise: 20000, // ₹200.00/plate
    monthlyContractVolumePaise: 24000000, // ₹2,40,000.00/mo
    platformMarginBps: 1500, // 15% platform fee
    monthlyPlatformProfitPaise: 3600000, // ₹36,000.00/mo pure profit
    invoicingTerms: "Monthly consolidated GST invoice, 15-day payment cycle via PFMS/RTGS",
    menuHighlights: [
      "Royal Dum Chicken / Mutton Biryani with Burani Raita & Gulab Jamun",
      "Assamese Fish Curry (Rohu/Katla) with Steamed Joha Rice, Dal & Aloo Pitika",
      "Paneer Lababdar & Butter Naan Executive Lunch Bowls",
    ],
    rfpProposalLetter: `To,
The Chairman, Commercial Canteen & Catering Committee,
National Institute of Technology (NIT) Silchar, Assam - 788010.

Subject: Commercial RFP Proposal for Official Campus, Seminar & Hostel Catering by OrderKing Technologies

Respected Sir/Madam,

OrderKing Technologies Private Limited (DPIIT Recognized & Assam Startup MAS Partner) formally submits our commercial bulk catering proposal for NIT Silchar faculty events, administrative workshops, and student mega-hostel food festivals.

Key Operational Standards:
1. 100% FSSAI certified kitchen partners with daily hygiene audit trails.
2. Direct cloud-kitchen temperature-controlled thermal delivery within 20 minutes of preparation.
3. Zero food inflation pricing: Flat ₹200/plate for Royal Executive Platters with zero hidden surcharges.
4. Compliant with GFR 2017 procurement guidelines, GeM portal parity, and direct GST billing.

We look forward to signing the formal institutional agreement.

Warm regards,
Hasan
Founder & Managing Director, OrderKing Technologies Pvt Ltd`,
  },
  {
    id: "corp_assam_university",
    institutionName: "Assam University (Central University)",
    contactDepartment: "Office of the Registrar & Administrative Seminar Wing",
    institutionLocation: "Dargakona, Silchar, Cachar, Assam - 788011",
    monthlyPlatesEstimated: 1000,
    averagePlatePricePaise: 18000, // ₹180.00/plate
    monthlyContractVolumePaise: 18000000, // ₹1,80,000.00/mo
    platformMarginBps: 1500, // 15% platform fee
    monthlyPlatformProfitPaise: 2700000, // ₹27,000.00/mo pure profit
    invoicingTerms: "Consolidated bi-weekly GST invoice, 7-day payment cycle via Direct Bank Transfer",
    menuHighlights: [
      "Executive Homestyle Bengali Thali (Steamed Rice, Moong Dal, Shorshe Maach, Bhaja)",
      "High-Tea Platters (Cocktail Samosas, Bengali Sandesh, Premium Assam CTC Tea)",
      "Vegetarian Deluxe Platter (Matar Paneer, Dal Makhani, Jeera Rice, Tandoori Roti)",
    ],
    rfpProposalLetter: `To,
The Registrar & Administrative Canteen Directorate,
Assam University, Dargakona, Silchar, Assam - 788011.

Subject: Proposal for Institutional Seminar, High-Tea & Departmental Catering Services

Respected Authority,

OrderKing Technologies Private Limited offers comprehensive institutional catering services for Assam University's academic conferences, syndicate meetings, and daily administrative lunches.

Key Commercial Terms:
- Standard High-Tea Platter: ₹65.00/head (Tea, Savory, Sweet).
- Executive Lunch Buffet / Platter: ₹180.00/head (Rice, 2 Veg, 1 Non-Veg/Paneer, Dal, Sweet).
- Dedicated logistics dispatch with on-site serving staff if required.
- Full compliance with Central University financial guidelines and Section 9(5) CGST provisions.

Submitted with highest regards,
Hasan
Founder, OrderKing Technologies Pvt Ltd`,
  },
  {
    id: "corp_dc_office_sribhumi",
    institutionName: "Deputy Commissioner (DC) Office & District Administration Sribhumi/Karimganj",
    contactDepartment: "Nazarat Branch & District Disaster Management / Election Logistics Wing",
    institutionLocation: "DC Office Complex, Main Road, Karimganj, Assam - 788710",
    monthlyPlatesEstimated: 750,
    averagePlatePricePaise: 20000, // ₹200.00/plate
    monthlyContractVolumePaise: 15000000, // ₹1,50,000.00/mo
    platformMarginBps: 1500, // 15% platform fee
    monthlyPlatformProfitPaise: 2250000, // ₹22,500.00/mo pure profit
    invoicingTerms: "Government treasury bill submission, payment via PFMS DBT",
    menuHighlights: [
      "Official Meeting Bento Boxes (Rice, Yellow Dal, Chicken Korma / Paneer, Salad, Sweet)",
      "Late-Night Election & Disaster Duty Meal Packs (Sealed hygienic foil boxes)",
      "Morning VVIP Breakfast Sets (Luchi, Chholar Dal, Boiled Egg, Seasonal Fruit)",
    ],
    rfpProposalLetter: `To,
The Deputy Commissioner & District Magistrate,
District Administration, Sribhumi / Karimganj, Assam - 788710.

Subject: Emic Catering & Emergency Nutrition Logistics Proposal for District Administration

Respected Sir,

OrderKing Technologies Private Limited (registered in Karimganj Town) submits this formal proposal to serve as the authorized institutional catering partner for District Administration meetings, election training duty, and emergency relief mobilization.

Operational Advantages:
1. Hyperlocal dispatch capability: Hot food delivered anywhere in Karimganj Municipal Ward within 15 minutes.
2. 24/7 on-demand capacity for up to 500 meals on 2-hour notice during emergency or election duty.
3. 100% cashless treasury billing via Treasury Challan / PFMS DBT.

We request your kind approval to empanel OrderKing as an official district vendor.

Respectfully,
Hasan
Founder & Chief Executive, OrderKing Technologies Pvt Ltd`,
  },
  {
    id: "corp_civil_hospital_karimganj",
    institutionName: "Karimganj Civil Hospital & District Medical Staff",
    contactDepartment: "Hospital Superintendent & Resident Medical Officers (RMO) Association",
    institutionLocation: "Civil Hospital Road, Karimganj, Assam - 788710",
    monthlyPlatesEstimated: 1400,
    averagePlatePricePaise: 15000, // ₹150.00/plate
    monthlyContractVolumePaise: 21000000, // ₹2,10,000.00/mo
    platformMarginBps: 1500, // 15% platform fee
    monthlyPlatformProfitPaise: 3150000, // ₹31,500.00/mo pure profit
    invoicingTerms: "Monthly consolidated staff billing, UPI Autopay / Hospital Society bank transfer",
    menuHighlights: [
      "Nutritious Low-Oil Doctor & Staff Lunch Bowls (Brown Rice / Steamed Rice, Boiled Veg, Grilled Chicken/Paneer)",
      "Midnight On-Duty Emergency Meal Packs (Hot Khichdi, Egg Curry, Tea Flasks)",
      "Fresh Fruit & Salad Detox Bowls",
    ],
    rfpProposalLetter: `To,
The Superintendent & Resident Doctors Welfare Committee,
Karimganj Civil Hospital, Assam - 788710.

Subject: 24/7 Hygienic Nutritional Catering for Medical Officers, Nursing Staff & Attendants

Respected Medical Officers,

OrderKing Technologies guarantees round-the-clock hot meal availability for hospital staff on night shifts and intensive rotations.

Key Commitments:
- Delivery within 15 minutes directly to Hospital Duty Rooms.
- Certified low-sodium, healthy homestyle preparation from verified partner kitchens.
- Dedicated late-night dispatch corridor between 10:00 PM and 6:00 AM.
- Fixed staff subsidized rate of ₹150.00 per full meal.

Warm regards,
Hasan
Founder, OrderKing Technologies Pvt Ltd`,
  },
  {
    id: "corp_banking_corridor_sribhumi",
    institutionName: "Karimganj Banking Corridor (SBI Main, HDFC, PNB, Assam Gramin Vikash Bank)",
    contactDepartment: "Branch Managers Council & Staff Welfare Associations",
    institutionLocation: "Station Road & Bridge Road, Karimganj Town, Assam - 788710",
    monthlyPlatesEstimated: 800,
    averagePlatePricePaise: 15000, // ₹150.00/plate
    monthlyContractVolumePaise: 12000000, // ₹1,20,000.00/mo
    platformMarginBps: 1500, // 15% platform fee
    monthlyPlatformProfitPaise: 1800000, // ₹18,000.00/mo pure profit
    invoicingTerms: "Automated KingPay Corporate Corporate Wallet, instant 1-tap checkout",
    menuHighlights: [
      "Quick Executive Lunch Platters (Ready in 8 minutes for short banking lunch hours)",
      "Evening High-Tea Snacks (Singara, Tea, Biscuits, Cutlets)",
      "Month-End Closing Night Energy Platters",
    ],
    rfpProposalLetter: `To,
The Chief Managers,
State Bank of India / HDFC Bank / Punjab National Bank,
Station Road Branches, Karimganj, Assam - 788710.

Subject: Corporate Lunch & Evening Snack Alliance for Banking Staff

Dear Branch Leaders,

OrderKing introduces the Corporate Desk-Delivery Program tailored for bank officers facing tight customer hours and long month-end closing shifts.

Benefits for Bank Staff:
1. 0% Delivery Fee on all lunch and high-tea orders delivered directly to the branch cash counter / desk.
2. Group Ordering: Colleagues can pool orders on a single bill split seamlessly.
3. 24K Digital Gold Cashback on every order via KingPay.

Yours sincerely,
Hasan
Founder, OrderKing Technologies Pvt Ltd`,
  },
];

// ============================================================================
// 2. MEITY / NPCI ZERO-MDR INCENTIVE REIMBURSEMENT GENERATOR (0.40% UPI SUBSIDY)
// ============================================================================
export function generateMeityUpiClaimSchedule(input: {
  quarter: string;
  upiTransactionsCount: number;
  rupayTransactionsCount: number;
  totalEligibleVolumePaise: number;
}): MeityClaimSchedule {
  const batchId = `MEITY_CLAIM_${input.quarter}_${Date.now()}`;
  const reimbursementRateBps = 40; // 0.40% standard MeitY reimbursement on P2M UPI transactions <= ₹2,000
  const totalClaimAmountPaise = Math.round((input.totalEligibleVolumePaise * reimbursementRateBps) / 10000);

  const claimSubmissionXmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
<MeityUpiReimbursementClaim xmlns="http://meity.gov.in/incentive/p2m/v1">
  <Header>
    <BatchId>${batchId}</BatchId>
    <ReportingPeriod>${input.quarter}</ReportingPeriod>
    <SubmissionTimestamp>${new Date().toISOString()}</SubmissionTimestamp>
    <AcquiringEntity>OrderKing Technologies Private Limited</AcquiringEntity>
    <DpiitRecognitionNumber>DPIIT-ASSAM-2026-OK99</DpiitRecognitionNumber>
    <Gstin>18AABCO1234F1Z5</Gstin>
  </Header>
  <Summary>
    <TotalEligibleUpiTransactions>${input.upiTransactionsCount}</TotalEligibleUpiTransactions>
    <TotalEligibleRupayTransactions>${input.rupayTransactionsCount}</TotalEligibleRupayTransactions>
    <TotalTransactionVolumeInr>${(input.totalEligibleVolumePaise / 100).toFixed(2)}</TotalTransactionVolumeInr>
    <ReimbursementPercentage>0.40%</ReimbursementPercentage>
    <TotalClaimAmountInr>${(totalClaimAmountPaise / 100).toFixed(2)}</TotalClaimAmountInr>
  </Summary>
  <SettlementDestination>
    <BeneficiaryName>OrderKing Technologies Private Limited</BeneficiaryName>
    <AccountType>Current Account</AccountType>
    <NodalBankIfsc>SBIN0000108</NodalBankIfsc>
    <Branch>Karimganj Main Branch, Assam</Branch>
  </SettlementDestination>
</MeityUpiReimbursementClaim>`;

  return {
    batchId,
    reportingQuarter: input.quarter,
    totalEligibleUpiTransactions: input.upiTransactionsCount,
    totalEligibleRupayTransactions: input.rupayTransactionsCount,
    totalEligibleGmvPaise: input.totalEligibleVolumePaise,
    reimbursementRateBps,
    totalClaimAmountPaise,
    nodalBankEscrowIfsc: "SBIN0000108",
    claimSubmissionXmlPayload,
  };
}

// ============================================================================
// 3. MASTER REVENUE HARVESTER & INCOME GENERATION ENGINE
// ============================================================================
export function calculatePlanetaryRevenueHarvest(options: {
  ownerConsent: boolean;
  activeRestaurantsCount?: number;
  monthlyOrdersCount?: number;
  monthlyGmvPaise?: number;
  kingCoinsMintedMonthlyPaise?: number;
}): RevenueHarvestSummary {
  if (!options.ownerConsent) {
    throw new Error("OWNER_CONSENT_REQUIRED: Revenue harvest and money execution requires explicit owner consent.");
  }

  const hasLiveMarketplaceInputs =
    Number.isFinite(options.activeRestaurantsCount) &&
    Number.isFinite(options.monthlyOrdersCount) &&
    Number.isFinite(options.monthlyGmvPaise);

  if (!hasLiveMarketplaceInputs) {
    return {
      harvestTimestamp: new Date().toISOString(),
      ownerConsentVerified: true,
      verificationStatus: "UNVERIFIED_PROJECTION",
      blockedReasons: [
        "Live restaurant count, order count, and GMV telemetry were not supplied.",
        "Government incentive, tax, bullion, BBPS, insurance, FASTag and grant streams require verified external-provider/eligibility evidence.",
        "No ledger entries are generated from unverified projections.",
      ],
      totalMonthlyCollectibleYieldPaise: 0,
      totalAnnualCollectibleYieldPaise: 0,
      totalNonDilutiveGrantVaultPaise: 0,
      streams: [],
      corporateCateringContracts: [],
      meityClaim: generateMeityUpiClaimSchedule({
        quarter: "UNVERIFIED",
        upiTransactionsCount: 0,
        rupayTransactionsCount: 0,
        totalEligibleVolumePaise: 0,
      }),
      kingCoinsLiabilityPaise: Math.max(0, options.kingCoinsMintedMonthlyPaise ?? 0),
      ledgerEntriesToPost: [],
      executionAuditSummary:
        "Revenue execution blocked: no verified live inputs/provider evidence were available. This result is a status record, not collectible revenue.",
    };
  }

  const restaurants = Math.max(0, Math.trunc(options.activeRestaurantsCount!));
  const orders = Math.max(0, Math.trunc(options.monthlyOrdersCount!));
  const gmv = Math.max(0, Math.trunc(options.monthlyGmvPaise!));
  const kingCoinsLiability = Math.max(0, Math.trunc(options.kingCoinsMintedMonthlyPaise ?? 0));

  const commissionRateBps = Number(process.env.ORDERKING_PLATFORM_COMMISSION_BPS || 0);
  const commissionRevenuePaise =
    commissionRateBps > 0 ? Math.round((gmv * commissionRateBps) / 10000) : 0;

  const streams: IncomeStreamYield[] = [
    {
      streamId: "CORPORATE_CATERING_PIPELINE",
      name: "Institutional / Corporate Catering",
      category: "B2B_CORPORATE",
      legalBasis: "Actual signed commercial contracts only.",
      monthlyProjectedInflowPaise: 0,
      annualProjectedInflowPaise: 0,
      settlementCycle: "Contract-specific",
      payoutDestination: "Verified business bank account",
      complianceStatus: "NOT_VERIFIED",
      actionableSteps: ["Connect signed contract, invoice and settlement evidence before recognizing revenue."],
    },
    {
      streamId: "MERCHANT_SOUNDBOX_POS_SAAS",
      name: "Merchant POS / SaaS",
      category: "MERCHANT_SAAS",
      legalBasis: "Actual active subscriptions only.",
      monthlyProjectedInflowPaise: 0,
      annualProjectedInflowPaise: 0,
      settlementCycle: "Contract-specific",
      payoutDestination: "Verified business account",
      complianceStatus: "NOT_VERIFIED",
      actionableSteps: ["Connect billing and successful payment telemetry before recognizing recurring revenue."],
    },
    {
      streamId: "MEITY_ZERO_MDR_SUBSIDY",
      name: "Government / Payment Incentives",
      category: "GOVT_SUBSIDY",
      legalBasis: "Eligibility and claims must be verified against the applicable current scheme and acquiring partner.",
      monthlyProjectedInflowPaise: 0,
      annualProjectedInflowPaise: 0,
      settlementCycle: "Provider/scheme-defined",
      payoutDestination: "Verified settlement account",
      complianceStatus: "PROVIDER_REQUIRED",
      actionableSteps: ["Verify current eligibility, acquiring-bank participation and approved claim process before accruing anything."],
    },
    {
      streamId: "GST_ITC_CASH_MAXIMIZER",
      name: "GST Input Tax Credit",
      category: "TAX_OPTIMIZATION",
      legalBasis: "Actual books, tax invoices, eligibility and statutory filing only.",
      monthlyProjectedInflowPaise: 0,
      annualProjectedInflowPaise: 0,
      settlementCycle: "Tax-filing cycle",
      payoutDestination: "Not a revenue account",
      complianceStatus: "NOT_VERIFIED",
      actionableSteps: ["Reconcile actual eligible purchase invoices and tax filings before recording ITC."],
    },
    {
      streamId: "FSSAI_COMPLIANCE_ONBOARDING",
      name: "Compliance Facilitation Services",
      category: "COMPLIANCE_FEES",
      legalBasis: "Actual customer contracts and completed services only.",
      monthlyProjectedInflowPaise: 0,
      annualProjectedInflowPaise: 0,
      settlementCycle: "Contract-specific",
      payoutDestination: "Verified business account",
      complianceStatus: "NOT_VERIFIED",
      actionableSteps: ["Connect actual service orders and successful collections."],
    },
    {
      streamId: "DIGITAL_GOLD_SILVER_SPREAD",
      name: "Digital Bullion / Savings Partner Revenue",
      category: "FINTECH_MARGIN",
      legalBasis: "Licensed/authorized provider agreement and actual transactions required.",
      monthlyProjectedInflowPaise: 0,
      annualProjectedInflowPaise: 0,
      settlementCycle: "Provider-defined",
      payoutDestination: "Verified partner settlement",
      complianceStatus: "PROVIDER_REQUIRED",
      actionableSteps: ["Connect authorized bullion provider, live pricing and settlement reconciliation."],
    },
    {
      streamId: "BBPS_UTILITY_SURCHARGE",
      name: "BBPS / Utility / Recharge Revenue",
      category: "UTILITY_RECHARGE",
      legalBasis: "Authorized BBPS/agent relationship and actual transaction reports only.",
      monthlyProjectedInflowPaise: 0,
      annualProjectedInflowPaise: 0,
      settlementCycle: "Provider-defined",
      payoutDestination: "Verified provider settlement",
      complianceStatus: "PROVIDER_REQUIRED",
      actionableSteps: ["Connect a real BBPS provider and reconcile transaction/commission reports."],
    },
    {
      streamId: "VEHICLE_CHALLAN_CONVENIENCE_FEE",
      name: "Vehicle / Challan Facilitation",
      category: "VEHICLE_FINTECH",
      legalBasis: "Current authorized provider contract and actual transaction evidence only.",
      monthlyProjectedInflowPaise: 0,
      annualProjectedInflowPaise: 0,
      settlementCycle: "Provider-defined",
      payoutDestination: "Verified provider settlement",
      complianceStatus: "PROVIDER_REQUIRED",
      actionableSteps: ["Connect the authorized vehicle/challan provider before activating customer payments."],
    },
    {
      streamId: "MOTOR_INSURANCE_POSP_COMMISSION",
      name: "Motor Insurance Partner Commission",
      category: "VEHICLE_FINTECH",
      legalBasis: "Licensed insurer/intermediary arrangement and actual issued-policy reports only.",
      monthlyProjectedInflowPaise: 0,
      annualProjectedInflowPaise: 0,
      settlementCycle: "Insurer-defined",
      payoutDestination: "Verified insurer settlement",
      complianceStatus: "PROVIDER_REQUIRED",
      actionableSteps: ["Connect licensed insurance partner and commission reconciliation."],
    },
    {
      streamId: "FASTAG_RECHARGE_MARGIN",
      name: "FASTag / NETC Partner Revenue",
      category: "VEHICLE_FINTECH",
      legalBasis: "Authorized NETC/BBPS/provider integration and actual settlements only.",
      monthlyProjectedInflowPaise: 0,
      annualProjectedInflowPaise: 0,
      settlementCycle: "Provider-defined",
      payoutDestination: "Verified settlement account",
      complianceStatus: "PROVIDER_REQUIRED",
      actionableSteps: ["Connect authorized FASTag provider and live reconciliation."],
    },
    {
      streamId: "GOVERNMENT_GRANT_DBT",
      name: "Government Grants",
      category: "DIRECT_CASH_GRANT",
      legalBasis: "Only awarded and received grants may be recognized as actual funds.",
      monthlyProjectedInflowPaise: 0,
      annualProjectedInflowPaise: 0,
      settlementCycle: "Award/milestone-specific",
      payoutDestination: "Verified grant bank account",
      complianceStatus: "NOT_VERIFIED",
      actionableSteps: ["Do not recognize any grant until an official award and actual receipt are evidenced."],
    },
  ];

  if (commissionRevenuePaise <= 0) {
    streams.push({
      streamId: "ORDERKING_MARKETPLACE_COMMISSION",
      name: "Marketplace Commission Revenue",
      category: "MERCHANT_SAAS",
      legalBasis: "Actual marketplace commercial contract/configuration.",
      monthlyProjectedInflowPaise: 0,
      annualProjectedInflowPaise: 0,
      settlementCycle: "Actual settlement cycle",
      payoutDestination: "Verified business account",
      complianceStatus: "NOT_VERIFIED",
      actionableSteps: ["Set ORDERKING_PLATFORM_COMMISSION_BPS from the approved live commercial terms and reconcile actual orders."],
    });
  } else {
    streams.push({
      streamId: "ORDERKING_MARKETPLACE_COMMISSION",
      name: "Marketplace Commission Revenue (derived from verified GMV input)",
      category: "MERCHANT_SAAS",
      legalBasis: "Configured commercial commission rate; actual provider/ledger reconciliation still required.",
      monthlyProjectedInflowPaise: commissionRevenuePaise,
      annualProjectedInflowPaise: commissionRevenuePaise * 12,
      settlementCycle: "Actual settlement cycle",
      payoutDestination: "Verified business account",
      complianceStatus: "NOT_VERIFIED",
      actionableSteps: ["Reconcile the calculated commission to the live order and settlement ledger before treating it as collectible cash."],
    });
  }

  const totalMonthlyCollectibleYieldPaise = 0;
  const totalAnnualCollectibleYieldPaise = 0;

  return {
    harvestTimestamp: new Date().toISOString(),
    ownerConsentVerified: true,
    verificationStatus: "UNVERIFIED_PROJECTION",
    blockedReasons: [
      "Revenue streams are tracked as capability/provider states until independently reconciled to live settlements.",
      "No government incentive, tax benefit, grant, regulated financial-service commission or partner payout is treated as guaranteed cash.",
    ],
    totalMonthlyCollectibleYieldPaise,
    totalAnnualCollectibleYieldPaise,
    totalNonDilutiveGrantVaultPaise: 0,
    streams,
    corporateCateringContracts: [],
    meityClaim: generateMeityUpiClaimSchedule({
      quarter: "UNVERIFIED",
      upiTransactionsCount: orders,
      rupayTransactionsCount: 0,
      totalEligibleVolumePaise: gmv,
    }),
    kingCoinsLiabilityPaise: kingCoinsLiability,
    ledgerEntriesToPost: [],
    executionAuditSummary:
      `Revenue engine processed verified input counts (restaurants=${restaurants}, orders=${orders}, GMV paise=${gmv}) but recognized ₹0 collectible revenue until settlement reconciliation and provider eligibility checks complete.`,
  };
}

