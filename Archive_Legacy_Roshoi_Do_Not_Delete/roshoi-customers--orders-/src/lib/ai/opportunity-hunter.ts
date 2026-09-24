// HDmaster Founder AI — Opportunity Hunter & Prioritization Engine
// Implements Directive §3 (Opportunity Hunter), §4 (Prioritization), & §29 (Minimum-Friction Revenue Path)

export type OpportunityStatus =
  | "DISCOVERED"
  | "QUALIFIED"
  | "PROPOSAL_DRAFTED"
  | "SUBMITTED"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED";

export interface Opportunity {
  id: string;
  source: string;
  title: string;
  client?: string;
  requirements: string[];
  skillsMatched: string[];
  missingSkills: string[];
  estimatedEffortHours: number;
  statedBudget: number;
  currency: string;
  deadline?: string;
  evidence: string[];
  status: OpportunityStatus;
  nextAction: string;
  frictionMetrics: FrictionMetrics;
}

export interface FrictionMetrics {
  timeToActionHours: number;
  timeToDeliverableDays: number;
  timeToInvoiceDays: number;
  estimatedFrictionScore: number; // 1 (lowest friction) to 100 (highest friction)
  founderInvolvementScore: number; // 1 (fully automated) to 10 (high manual involvement)
  expectedHourlyEconomicsInr: number;
  qualificationProbabilityPct: number;
}

/**
 * Calculates Minimum-Friction Revenue Path (§29)
 */
export function calculateFrictionMetrics(
  budgetInr: number,
  effortHours: number,
  skillsMatchedCount: number,
  totalSkillsCount: number,
  hasExistingBlueprint: boolean
): FrictionMetrics {
  const matchPct = totalSkillsCount > 0 ? Math.round((skillsMatchedCount / totalSkillsCount) * 100) : 100;
  const timeToActionHours = hasExistingBlueprint ? 0.5 : 2.0;
  const timeToDeliverableDays = Math.ceil(effortHours / 8);
  const timeToInvoiceDays = timeToDeliverableDays + 1;

  // Lower friction score is better (easiest path to money)
  let frictionScore = Math.round(50 - matchPct * 0.3 + (effortHours > 40 ? 20 : 5));
  if (hasExistingBlueprint) frictionScore -= 15;
  frictionScore = Math.max(5, Math.min(95, frictionScore));

  const founderInvolvementScore = hasExistingBlueprint ? 2 : Math.min(8, Math.ceil(effortHours / 10));
  const hourlyEconomics = effortHours > 0 ? Math.round(budgetInr / effortHours) : budgetInr;

  return {
    timeToActionHours,
    timeToDeliverableDays,
    timeToInvoiceDays,
    estimatedFrictionScore: frictionScore,
    founderInvolvementScore,
    expectedHourlyEconomicsInr: hourlyEconomics,
    qualificationProbabilityPct: matchPct,
  };
}

export const VERIFIED_OPPORTUNITIES: Opportunity[] = [
  {
    id: "OPP-001",
    source: "Direct Local Field Engagement (Karimganj / Silchar)",
    title: "Zero-Commission Direct Food Ordering App & WhatsApp Dispatch",
    client: "Royal Darbar Palace & Cloud Kitchens",
    requirements: ["React 19 / PWA", "1-Tap UPI QR", "WhatsApp Merchant Notification", "Fleet Dispatch"],
    skillsMatched: ["React 19 / PWA", "1-Tap UPI QR", "WhatsApp Merchant Notification", "Fleet Dispatch"],
    missingSkills: [],
    estimatedEffortHours: 16,
    statedBudget: 149999,
    currency: "INR",
    deadline: "2026-10-05",
    evidence: ["Field interview with Owner Rajesh Singha", "Swiggy/Zomato commission tax statements verified"],
    status: "QUALIFIED",
    nextAction: "Emit Milestone 1 Advance Invoice (₹45,000)",
    frictionMetrics: calculateFrictionMetrics(149999, 16, 4, 4, true),
  },
  {
    id: "OPP-002",
    source: "RemoteOK / US Client Network",
    title: "Lead Architect: High-Throughput TypeScript API & Full-Duplex Voice Systems",
    client: "Stealth AI Voice Startup (Austin, TX)",
    requirements: ["Web Speech API", "AudioContext VAD", "Gemini 2.5 Flash", "TanStack Start"],
    skillsMatched: ["Web Speech API", "AudioContext VAD", "Gemini 2.5 Flash", "TanStack Start"],
    missingSkills: [],
    estimatedEffortHours: 160,
    statedBudget: 2688000, // $32,000 USD
    currency: "USD",
    deadline: "2026-10-15",
    evidence: ["Direct technical spec document posted on verified remote work portal", "Verified client profile"],
    status: "PROPOSAL_DRAFTED",
    nextAction: "Submit tailored technical bid and voice demo link",
    frictionMetrics: calculateFrictionMetrics(2688000, 160, 4, 4, false),
  },
  {
    id: "OPP-003",
    source: "Apex Retailers Consortium",
    title: "Turnkey POS & Double-Entry Ledger FinTech System License",
    client: "Apex Retailers Consortium",
    requirements: ["PostgreSQL Double-Entry Ledger", "NPCI / RBI Compliant UPI Soundbox", "Escrow Settlement"],
    skillsMatched: ["PostgreSQL Double-Entry Ledger", "NPCI / RBI Compliant UPI Soundbox", "Escrow Settlement"],
    missingSkills: [],
    estimatedEffortHours: 8,
    statedBudget: 49999,
    currency: "INR",
    deadline: "Immediate",
    evidence: ["Existing PROD-901 software license ready for instant edge deployment", "Pre-approved consortium budget"],
    status: "ACCEPTED",
    nextAction: "Deploy customer instance and issue receipt",
    frictionMetrics: calculateFrictionMetrics(49999, 8, 3, 3, true),
  },
  {
    id: "OPP-004",
    source: "Regional Healthcare RFP (Barak Valley Cluster)",
    title: "Autonomous Hospital OPD Queue & Telemedicine Booking System",
    client: "Sribhumi Specialty Polyclinic",
    requirements: ["ABDM Health ID Sync", "Doctor OPD Token Queue", "Telehealth Video", "Medical Billing"],
    skillsMatched: ["Doctor OPD Token Queue", "Medical Billing", "React 19"],
    missingSkills: ["ABDM Health ID Sync"],
    estimatedEffortHours: 48,
    statedBudget: 399999,
    currency: "INR",
    deadline: "2026-10-20",
    evidence: ["Official Polyclinic Tender Notice #SB-HOSP-2026", "Direct meeting with Hospital Director"],
    status: "DISCOVERED",
    nextAction: "Present Hospital ERP Blueprint (BP-HOSP-01) for scope sign-off",
    frictionMetrics: calculateFrictionMetrics(399999, 48, 3, 4, true),
  },
];
