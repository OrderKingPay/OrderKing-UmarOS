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

export const INITIAL_REPEAT_OPPORTUNITIES: RepeatBusinessOpportunity[] = [
  {
    id: "REP-001",
    clientId: "CLI-ROYAL-FEAST",
    clientName: "Royal Feast Cloud Kitchen",
    previousProject: "Sovereign POS & QR Billing Engine",
    completedAt: new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
    csatRating: 5,
    type: "MAINTENANCE_RETAINER",
    title: "Monthly 99.9% Uptime SLA & Menu Sync Retainer",
    rationale: "Client has been live for 30 days with zero outages. Offering 24/7 uptime guarantee and weekly menu updates.",
    proposedMonthlyInr: 15000,
    expectedAnnualLtvInr: 180000,
    approvalStatus: "PENDING_FOUNDER_APPROVAL",
    proposalDraft:
      "Dear Royal Feast Team, following your successful launch, we propose an ongoing 24/7 Maintenance Retainer (₹15,000/mo) covering 99.9% uptime, security patches, and automated weekly menu syncing.",
  },
  {
    id: "REP-002",
    clientId: "CLI-BENGALURU-TENDERS",
    clientName: "Bengaluru Logistics Tenders",
    previousProject: "Hyperlocal Geodesic Clustering Algorithm",
    completedAt: new Date(Date.now() - 14 * 86400 * 1000).toISOString(),
    csatRating: 4.8,
    type: "ANALYTICS_DASHBOARD",
    title: "Fleet Route Telemetry & Driver Performance Dashboard",
    rationale: "Client expressed interest in visualizing delivery times and fuel consumption trends across their 40 riders.",
    proposedMonthlyInr: 25000,
    expectedAnnualLtvInr: 300000,
    approvalStatus: "PENDING_FOUNDER_APPROVAL",
    proposalDraft:
      "Dear Logistics Ops, we have prepared an add-on Fleet Telemetry Dashboard visualizing real-time driver density, route efficiency, and fuel savings for ₹25,000/month.",
  },
];

export function generateRepeatProposal(opp: RepeatBusinessOpportunity): string {
  return opp.proposalDraft;
}
