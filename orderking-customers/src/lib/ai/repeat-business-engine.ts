
/**
 * HDmaster Founder AI — Revenue Growth & Repeat-Business Engine (§13, §14)
 *
 * Post-Project Opportunity Identification (§13):
 * - Maintenance & Security Retainers
 * - Cloud Hosting & Database Monitoring
 * - Additional Features & Integrations
 * - Localization & Geographic Expansion
 * - Automation & Analytics Dashboards
 *
 * Customer Retention Signals (§14):
 * - CSAT / NPS feedback signals
 * - Contract renewal dates
 * - Open issue resolution speed
 * - Support ticket frequency
 *
 * Strict Rule: Never automatically upsell inappropriately.
 * Generate the opportunity and require founder approval before dispatch.
 */

export interface RepeatBusinessOpportunity {
  id: string;
  clientId: string;
  clientName: string;
  previousProject: string;
  completedAt: string;
  csatRating: number; // 1 - 5
  type:
    | "MAINTENANCE_RETAINER"
    | "CLOUD_HOSTING"
    | "SECURITY_HARDENING"
    | "FEATURE_EXPANSION"
    | "ANALYTICS_DASHBOARD"
    | "LOCALIZATION";
  title: string;
  rationale: string;
  proposedMonthlyInr: number;
  expectedAnnualLtvInr: number;
  approvalStatus: "PENDING_FOUNDER_APPROVAL" | "APPROVED" | "DISPATCHED" | "DECLINED";
  proposalDraft: string;
}

export const INITIAL_REPEAT_OPPORTUNITIES: RepeatBusinessOpportunity[] = [];

export function generateRepeatProposal(opp: RepeatBusinessOpportunity): string {
  return opp.proposalDraft;
}
