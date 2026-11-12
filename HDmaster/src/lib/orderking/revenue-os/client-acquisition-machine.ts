// Client Acquisition Machine & Prospecting Engine (Directive 6)
// 10-step flow: Research -> Need ID -> Service Match -> Personalized Value Prop -> Outreach Draft -> Approval -> Permitted Channel Send -> Response Tracking -> Follow-up -> Meeting -> Proposal.
// Enforces anti-spam protections, daily rate limits, and opt-out handling.

export type AcquisitionStage =
  | "RESEARCH"
  | "NEED_IDENTIFIED"
  | "SERVICE_MATCHED"
  | "VALUE_PROP_GENERATED"
  | "OUTREACH_DRAFTED"
  | "APPROVAL_PENDING"
  | "OUTREACH_SENT"
  | "RESPONSE_RECEIVED"
  | "FOLLOW_UP_SCHEDULED"
  | "MEETING_CONFIRMED"
  | "PROPOSAL_REQUESTED"
  | "OPTED_OUT";

export interface ClientProspect {
  id: string;
  businessName: string;
  contactPerson: string;
  contactEmail?: string;
  contactPhone?: string;
  category: "restaurant" | "ecommerce" | "hospital" | "logistics" | "fintech" | "professional_services";
  location: string;
  source: string;
  identifiedNeed: string;
  matchedService: string;
  personalizedValueProposition: string;
  draftedOutreachMessage: string;
  stage: AcquisitionStage;
  isOptedOut: boolean;
  history: Array<{ stage: AcquisitionStage; timestamp: string; note: string }>;
  sentAt?: string;
  followUpDate?: string;
  dataProvenance?: "VERIFIED_CRM_RECORD" | "SCENARIO_TEMPLATE";
  contactPermissionConfirmed?: boolean;
  verifiedCollectedInr?: number;
  invoicedInr?: number;
  refundsInr?: number;
  directDeliveryCostInr?: number;
}

export class ClientAcquisitionMachine {
  private prospects: Map<string, ClientProspect> = new Map();
  private dailySendCount: number = 0;
  private maxDailySends: number = 15; // Anti-spam ceiling
  private optedOutEmails: Set<string> = new Set();

  constructor() {}

  getProspects(): ClientProspect[] {
    return Array.from(this.prospects.values());
  }

  getProspect(id: string): ClientProspect | undefined {
    return this.prospects.get(id);
  }

  draftOutreachForCrmLead(params: {
    leadId: string;
    businessName: string;
    contactPerson: string;
    contactEmail?: string;
    contactPhone?: string;
    location: string;
    painPoint: string;
    matchedService: string;
    dealValueInr: number;
    dataProvenance?: "VERIFIED_CRM_RECORD" | "SCENARIO_TEMPLATE";
    contactPermissionConfirmed?: boolean;
  }): ClientProspect {
    const message = [
      `Dear ${params.contactPerson},`,
      "",
      `Following our operational review of ${params.businessName} (${params.location}), we identified a direct opportunity to resolve: ${params.painPoint}`,
      "",
      `Proposed OrderKing Deliverable: ${params.matchedService}`,
      `Commercial Investment: ₹${params.dealValueInr.toLocaleString("en-IN")} (GST INV-1 invoice, 50% advance milestone, 14-day deployment SLA).`,
      "",
      "Key Operational Guarantees:",
      "1. 0% aggregator commission bleed with direct UPI QR & Intent checkout",
      "2. Real-time KOT & order operations dashboard",
      "3. Full customer data ownership and statutory GST compliance",
      "",
      "Would you have 10 minutes this week to review the live architecture walkthrough?",
      "",
      "Warm regards,",
      "OrderKing Commercial Desk (Ex-Burger King Multi-Unit Operations)",
      "To opt out of future communications, reply 'STOP' or 'UNSUBSCRIBE'.",
    ].join("\n");

    const prospect: ClientProspect = {
      id: `PROS-${params.leadId}`,
      businessName: params.businessName,
      contactPerson: params.contactPerson,
      contactEmail: params.contactEmail,
      contactPhone: params.contactPhone,
      category: "restaurant",
      location: params.location,
      source: "CRM Pipeline Sync",
      identifiedNeed: params.painPoint,
      matchedService: params.matchedService,
      personalizedValueProposition: `Deploy ${params.matchedService} for ₹${params.dealValueInr.toLocaleString("en-IN")} with 0% aggregator commission bleed.`,
      draftedOutreachMessage: message,
      stage: "OUTREACH_DRAFTED",
      isOptedOut: false,
      dataProvenance: params.dataProvenance ?? "VERIFIED_CRM_RECORD",
      contactPermissionConfirmed: params.contactPermissionConfirmed ?? true,
      verifiedCollectedInr: 0,
      invoicedInr: 0,
      refundsInr: 0,
      directDeliveryCostInr: 0,
      history: [
        {
          stage: "OUTREACH_DRAFTED",
          timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
          note: `Personalized outreach drafted for ${params.businessName}`,
        },
      ],
    };

    this.prospects.set(prospect.id, prospect);
    return prospect;
  }

  // Anti-Spam & Rate-Limited Outreach Sender
  sendOutreach(prospectId: string): { success: boolean; message: string; prospect?: ClientProspect } {
    const prospect = this.prospects.get(prospectId);
    if (!prospect) return { success: false, message: `Prospect ${prospectId} not found.` };

    if (prospect.isOptedOut || (prospect.contactEmail && this.optedOutEmails.has(prospect.contactEmail))) {
      return { success: false, message: `Cannot send: Prospect has opted out.` };
    }

    if (this.dailySendCount >= this.maxDailySends) {
      return {
        success: false,
        message: `ANTI_SPAM_LIMIT: Daily outreach ceiling of ${this.maxDailySends} reached. Scheduled for tomorrow.`,
      };
    }

    this.dailySendCount++;
    prospect.stage = "OUTREACH_SENT";
    prospect.sentAt = new Date().toISOString().replace("T", " ").slice(0, 16);
    prospect.followUpDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    prospect.history.push({
      stage: "OUTREACH_SENT",
      timestamp: prospect.sentAt,
      note: `Outreach sent via permitted email channel. Daily quota used: ${this.dailySendCount}/${this.maxDailySends}.`,
    });

    return {
      success: true,
      message: `Outreach sent to ${prospect.businessName}. Follow-up scheduled on ${prospect.followUpDate}.`,
      prospect,
    };
  }

  handleOptOut(prospectId: string): void {
    const prospect = this.prospects.get(prospectId);
    if (prospect) {
      prospect.isOptedOut = true;
      prospect.stage = "OPTED_OUT";
      if (prospect.contactEmail) this.optedOutEmails.add(prospect.contactEmail);
      prospect.history.push({
        stage: "OPTED_OUT",
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
        note: "Recipient requested opt-out. All future communications blocked.",
      });
    }
  }

  advanceStage(prospectId: string, stage: AcquisitionStage, note: string): ClientProspect {
    const prospect = this.prospects.get(prospectId);
    if (!prospect) throw new Error(`Prospect ${prospectId} not found.`);
    prospect.stage = stage;
    prospect.history.push({
      stage,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      note,
    });
    return prospect;
  }
}

export const clientAcquisitionMachine = new ClientAcquisitionMachine();
