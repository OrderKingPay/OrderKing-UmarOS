// Client Acquisition CRM Pipeline Engine (15-Stage Lifecycle)
// Governs Lead -> Qualification -> Research -> Outreach -> Conversation -> Proposal -> Negotiation -> Approval -> Contract -> Invoice -> Payment -> Project -> Delivery -> Acceptance -> Support -> Repeat

export type CrmStage =
  | "LEAD"
  | "QUALIFICATION"
  | "RESEARCH"
  | "PERSONALIZED_OUTREACH"
  | "CONVERSATION"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "APPROVAL"
  | "CONTRACT"
  | "INVOICE"
  | "PAYMENT"
  | "PROJECT"
  | "DELIVERY"
  | "ACCEPTANCE"
  | "SUPPORT"
  | "REPEAT";

export const CRM_STAGE_ORDER: CrmStage[] = [
  "LEAD",
  "QUALIFICATION",
  "RESEARCH",
  "PERSONALIZED_OUTREACH",
  "CONVERSATION",
  "PROPOSAL",
  "NEGOTIATION",
  "APPROVAL",
  "CONTRACT",
  "INVOICE",
  "PAYMENT",
  "PROJECT",
  "DELIVERY",
  "ACCEPTANCE",
  "SUPPORT",
  "REPEAT",
];

export interface LeadHistoryEntry {
  timestamp: string;
  fromStage?: CrmStage;
  toStage: CrmStage;
  note: string;
  actor: "FOUNDER" | "AI_EXECUTIVE" | "CLIENT";
}

export interface CrmLead {
  id: string;
  businessName: string;
  category: "restaurant" | "ecommerce" | "healthcare" | "logistics" | "fintech" | "enterprise";
  contactPerson: string;
  phone: string;
  email: string;
  location: string;
  monthlyRevenueEst: string;
  painPoint: string;
  dealValueInr: number;
  advanceLockedInr: number;
  currentStage: CrmStage;
  source: "INBOUND" | "AI_DISCOVERY" | "REFERRAL" | "OUTREACH";
  notes: string[];
  history: LeadHistoryEntry[];
  nextFollowUpDate: string;
  proposal?: {
    title: string;
    summary: string;
    deliverables: string[];
    timelineDays: number;
    commercialValueInr: number;
    advanceRequiredInr: number;
  };
  contract?: {
    contractId: string;
    termsSummary: string;
    signedAt?: string;
    isSigned: boolean;
  };
  invoiceId?: string;
}

export const INITIAL_LEADS: CrmLead[] = [
  {
    id: "LEAD-201",
    businessName: "Royal Darbar Palace & Cloud Kitchens",
    category: "restaurant",
    contactPerson: "Afzal Hussain (Managing Director)",
    phone: "+91 94350 XXXXX",
    email: "management@royaldarbar.in",
    location: "Karimganj / Silchar",
    monthlyRevenueEst: "₹18,50,000",
    painPoint: "Losing 28% margins (₹5,18,000/mo) to Swiggy/Zomato commission taxes.",
    dealValueInr: 149999,
    advanceLockedInr: 74999,
    currentStage: "PROPOSAL",
    source: "AI_DISCOVERY",
    notes: ["Owner very interested in zero-commission direct ordering app with WhatsApp fleet dispatch."],
    history: [
      {
        timestamp: "2026-09-20 10:00",
        toStage: "LEAD",
        note: "Discovered via regional business registry audit",
        actor: "AI_EXECUTIVE",
      },
      {
        timestamp: "2026-09-21 14:30",
        fromStage: "LEAD",
        toStage: "PROPOSAL",
        note: "Custom proposal generated with 28% margin recovery model",
        actor: "AI_EXECUTIVE",
      },
    ],
    nextFollowUpDate: "2026-09-23",
    proposal: {
      title: "Turnkey OrderKing Direct Ordering & Fleet Dispatch System",
      summary: "Full replacement of aggregator reliance with branded web & mobile ordering.",
      deliverables: ["Next.js 15 Customer Web App", "Merchant POS Console", "Rider Dispatch App", "King Pay UPI 0% Gateway"],
      timelineDays: 14,
      commercialValueInr: 149999,
      advanceRequiredInr: 74999,
    },
  },
  {
    id: "LEAD-202",
    businessName: "Assam Valley Organic Tea & Spices Export",
    category: "ecommerce",
    contactPerson: "Bikramjit Baruah (CEO)",
    phone: "+91 98640 XXXXX",
    email: "exports@assamvalleytea.com",
    location: "Guwahati / Global",
    monthlyRevenueEst: "₹45,00,000",
    painPoint: "Outdated Shopify store with slow checkout, high drop-offs, and no direct Indian UPI QR soundbox.",
    dealValueInr: 299999,
    advanceLockedInr: 149999,
    currentStage: "QUALIFICATION",
    source: "AI_DISCOVERY",
    notes: ["Needs international currency support + 1-tap Indian UPI QR for domestic exports."],
    history: [
      {
        timestamp: "2026-09-21 11:15",
        toStage: "LEAD",
        note: "Identified high-volume export merchant with outdated storefront",
        actor: "AI_EXECUTIVE",
      },
      {
        timestamp: "2026-09-21 16:00",
        fromStage: "LEAD",
        toStage: "QUALIFICATION",
        note: "Audited site speed (score 38/100) and cart abandonment rate (68%)",
        actor: "AI_EXECUTIVE",
      },
    ],
    nextFollowUpDate: "2026-09-24",
  },
  {
    id: "LEAD-203",
    businessName: "Sribhumi Multi-Specialty Hospital & Diagnostic Hub",
    category: "healthcare",
    contactPerson: "Dr. K. N. Deb (Medical Director)",
    phone: "+91 94351 XXXXX",
    email: "director@sribhumihospital.org",
    location: "Karimganj Town",
    monthlyRevenueEst: "₹62,00,000",
    painPoint: "Chaotic physical OPD paper tokens and delayed patient check-ins.",
    dealValueInr: 349999,
    advanceLockedInr: 174999,
    currentStage: "RESEARCH",
    source: "AI_DISCOVERY",
    notes: ["ABDM compliance mandatory. Doctors request live queue monitor on tablets."],
    history: [
      {
        timestamp: "2026-09-22 08:30",
        toStage: "LEAD",
        note: "Hospital identified as prime candidate for OPD digitization",
        actor: "AI_EXECUTIVE",
      },
      {
        timestamp: "2026-09-22 09:00",
        fromStage: "LEAD",
        toStage: "RESEARCH",
        note: "Drafted database schema and ABDM M1/M2/M3 compliance plan",
        actor: "AI_EXECUTIVE",
      },
    ],
    nextFollowUpDate: "2026-09-25",
  },
];

export class CrmPipelineEngine {
  private leads: Map<string, CrmLead> = new Map();

  constructor() {
    INITIAL_LEADS.forEach((l) => this.leads.set(l.id, l));
  }

  getLeads(): CrmLead[] {
    return Array.from(this.leads.values());
  }

  getLeadById(id: string): CrmLead | undefined {
    return this.leads.get(id);
  }

  addLead(lead: Omit<CrmLead, "id" | "history">): CrmLead {
    const id = `LEAD-${Date.now().toString().slice(-4)}`;
    const newLead: CrmLead = {
      ...lead,
      id,
      history: [
        {
          timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
          toStage: lead.currentStage || "LEAD",
          note: "Lead created in HDmaster CRM",
          actor: "FOUNDER",
        },
      ],
    };
    this.leads.set(id, newLead);
    return newLead;
  }

  updateLeadStage(id: string, newStage: CrmStage, note: string): CrmLead {
    const lead = this.leads.get(id);
    if (!lead) throw new Error(`Lead ${id} not found.`);

    const fromStage = lead.currentStage;
    lead.currentStage = newStage;
    lead.history.push({
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      fromStage,
      toStage: newStage,
      note,
      actor: "FOUNDER",
    });

    return lead;
  }

  generateProposal(id: string): NonNullable<CrmLead["proposal"]> {
    const lead = this.leads.get(id);
    if (!lead) throw new Error(`Lead ${id} not found.`);

    const proposal = {
      title: `Turnkey Enterprise Solution for ${lead.businessName}`,
      summary: `End-to-end modernization solving: ${lead.painPoint}`,
      deliverables: [
        "Custom Production Web & Mobile System",
        "PostgreSQL High-Availability Database",
        "Role-Based Access Control Console",
        "King Pay UPI 0% Gateway Integration",
      ],
      timelineDays: 21,
      commercialValueInr: lead.dealValueInr,
      advanceRequiredInr: lead.advanceLockedInr,
    };

    lead.proposal = proposal;
    this.updateLeadStage(id, "PROPOSAL", "Formal client proposal generated with 50% advance milestone.");
    return proposal;
  }

  generateContract(id: string): NonNullable<CrmLead["contract"]> {
    const lead = this.leads.get(id);
    if (!lead) throw new Error(`Lead ${id} not found.`);

    const contract = {
      contractId: `CTR-${Date.now().toString().slice(-6)}`,
      termsSummary: `Commercial delivery of software for ₹${lead.dealValueInr.toLocaleString(
        "en-IN"
      )}. 50% advance required prior to code deployment. 99.9% uptime SLA guarantee. Section 79 IT Act compliance.`,
      isSigned: false,
    };

    lead.contract = contract;
    this.updateLeadStage(id, "CONTRACT", "Master services agreement compiled and ready for signature.");
    return contract;
  }
}

export const crmEngine = new CrmPipelineEngine();
