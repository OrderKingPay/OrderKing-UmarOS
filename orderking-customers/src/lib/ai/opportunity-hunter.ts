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

/**
 * No opportunity is considered verified without live evidence from an authorized
 * external source. The previous static examples are intentionally not claimable.
 */
export const VERIFIED_OPPORTUNITIES: Opportunity[] = [];
