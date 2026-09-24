// Revenue Growth Engine & Automatic Repeat-Business Engine (Directives 13 & 14)
// Post-delivery expansion discovery: Maintenance, Support, Hosting, Retainers, Features, Automation, Analytics, Security.
// Tracks CSAT, renewal dates, open issues, and generates legitimate repeat proposals under approval governance.

export interface RepeatBusinessSignal {
  clientId: string;
  clientName: string;
  completedProjectId: string;
  csatScore: number; // 1-10
  openIssuesCount: number;
  contractExpirationDate?: string;
  hostingRenewalDate?: string;
  identifiedExpansionOpportunities: Array<{
    type: "MAINTENANCE_RETAINER" | "FEATURE_EXPANSION" | "SECURITY_AUDIT" | "AUTOMATION" | "LOCALIZATION";
    title: string;
    monthlyValueInr?: number;
    oneTimeValueInr?: number;
    rationale: string;
    proposedDeliverables: string[];
  }>;
  status: "IDENTIFIED" | "PROPOSAL_PENDING_APPROVAL" | "PROPOSAL_SENT" | "RENEWED" | "DECLINED";
}

export class RevenueGrowthEngine {
  private signals: Map<string, RepeatBusinessSignal> = new Map();

  constructor() {
    this.seedSignals();
  }

  private seedSignals() {
    const s1: RepeatBusinessSignal = {
      clientId: "CLI-DARBAR",
      clientName: "Royal Darbar Palace",
      completedProjectId: "PROJ-701",
      csatScore: 9.8,
      openIssuesCount: 0,
      contractExpirationDate: "2027-09-20",
      hostingRenewalDate: "2026-10-20",
      status: "IDENTIFIED",
      identifiedExpansionOpportunities: [
        {
          type: "MAINTENANCE_RETAINER",
          title: "Tier-1 24/7 Priority Menu & Fleet Hosting Retainer",
          monthlyValueInr: 14999,
          rationale: "Client has completed initial deployment; monthly SLA provides database maintenance, uptime guarantee, and menu promotions.",
          proposedDeliverables: ["Cloud server hosting & daily backup", "4-hour emergency SLA", "Weekly menu price updates"],
        },
        {
          type: "AUTOMATION",
          title: "Automated WhatsApp Loyalty & Coupon Soundbox",
          oneTimeValueInr: 49999,
          rationale: "Increase repeat direct orders by 22% with automated post-meal review requests and WhatsApp coupons.",
          proposedDeliverables: ["WhatsApp Cloud API webhook", "Customer loyalty ledger", "Automated broadcast rules"],
        },
      ],
    };

    this.signals.set(s1.clientId, s1);
  }

  getSignals(): RepeatBusinessSignal[] {
    return Array.from(this.signals.values());
  }

  getSignal(clientId: string): RepeatBusinessSignal | undefined {
    return this.signals.get(clientId);
  }

  generateRepeatProposal(clientId: string, opportunityIndex: number): {
    proposalText: string;
    valueInr: number;
    signal: RepeatBusinessSignal;
  } {
    const signal = this.signals.get(clientId);
    if (!signal) throw new Error(`Client signal ${clientId} not found.`);

    const opp = signal.identifiedExpansionOpportunities[opportunityIndex];
    if (!opp) throw new Error(`Opportunity index ${opportunityIndex} out of range.`);

    const value = opp.monthlyValueInr || opp.oneTimeValueInr || 0;
    const proposalText = [
      `Dear ${signal.clientName} Team,`,
      ``,
      `Following the successful delivery and deployment of your direct ordering system, we analyzed operational data to ensure long-term stability and growth.`,
      ``,
      `Proposed Next Step: ${opp.title}`,
      `Why this matters: ${opp.rationale}`,
      ``,
      `Deliverables:`,
      ...opp.proposedDeliverables.map((d) => `• ${d}`),
      ``,
      `Commercial Terms: ₹${value.toLocaleString()}${opp.monthlyValueInr ? "/month" : " one-time"}.`,
    ].join("\n");

    signal.status = "PROPOSAL_PENDING_APPROVAL";

    return {
      proposalText,
      valueInr: value,
      signal,
    };
  }
}

export const revenueGrowthEngine = new RevenueGrowthEngine();
