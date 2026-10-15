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

export interface SellableOrderKingService {
  id: string;
  name: string;
  category: "restaurant" | "ecommerce" | "healthcare" | "logistics" | "fintech" | "enterprise";
  setupFeeInr: number;
  monthlyRetainerInr: number;
  setupFeeUsd: number;
  monthlyRetainerUsd: number;
  estimatedDirectDeliveryCostInr: number;
  timelineDays: number;
  summary: string;
  deliverables: string[];
}

export const SELLABLE_ORDERKING_SERVICES: SellableOrderKingService[] = [
  {
    id: "SVC-01",
    name: "Restaurant Website & Digital Menu Setup",
    category: "restaurant",
    setupFeeInr: 24999,
    monthlyRetainerInr: 2999,
    setupFeeUsd: 499,
    monthlyRetainerUsd: 79,
    estimatedDirectDeliveryCostInr: 4500,
    timelineDays: 7,
    summary: "Direct-ordering web storefront, QR table menu, and 0% aggregator commission UPI checkout.",
    deliverables: [
      "Branded Mobile-First Web Storefront",
      "Dynamic QR Table & Takeaway Digital Menu",
      "Direct UPI Intent & QR Payment Integration",
      "FSSAI & GST INV-1 Compliant Checkout Receipt",
    ],
  },
  {
    id: "SVC-02",
    name: "Restaurant SaaS POS & KOT Tools",
    category: "restaurant",
    setupFeeInr: 49999,
    monthlyRetainerInr: 4999,
    setupFeeUsd: 999,
    monthlyRetainerUsd: 149,
    estimatedDirectDeliveryCostInr: 9000,
    timelineDays: 10,
    summary: "Multi-terminal cloud POS, real-time Kitchen Order Ticket (KOT) routing, and station prep timers.",
    deliverables: [
      "Cloud Billing & Cashier POS Console",
      "Multi-Station Kitchen Display System (KDS / KOT)",
      "Recipe Depletion & Raw Material Stock Alerts",
      "Shift Handover & Cash Drawer Audit Ledger",
    ],
  },
  {
    id: "SVC-03",
    name: "Menu Optimization & Analytics",
    category: "restaurant",
    setupFeeInr: 19999,
    monthlyRetainerInr: 2499,
    setupFeeUsd: 399,
    monthlyRetainerUsd: 59,
    estimatedDirectDeliveryCostInr: 3500,
    timelineDays: 5,
    summary: "Contribution-margin menu engineering, food-cost ratio audit, and high-margin combo structuring.",
    deliverables: [
      "Item-Level Food Cost & Gross Margin Matrix",
      "High-Margin Upsell & Combo Architecture",
      "Dead-Stock SKU Pruning Recommendations",
      "Daypart Pricing & Packaging Cost Audit",
    ],
  },
  {
    id: "SVC-04",
    name: "AI Customer Assistance",
    category: "restaurant",
    setupFeeInr: 29999,
    monthlyRetainerInr: 3499,
    setupFeeUsd: 599,
    monthlyRetainerUsd: 99,
    estimatedDirectDeliveryCostInr: 5500,
    timelineDays: 7,
    summary: "Permitted WhatsApp & web AI concierge for menu discovery, order status queries, and table reservations.",
    deliverables: [
      "Opt-In WhatsApp & Web Ordering Concierge",
      "Automated Live Order Tracking Responses",
      "Bilingual / Regional Customer Query Resolution",
      "Human Escalation Handoff to Store Manager",
    ],
  },
  {
    id: "SVC-05",
    name: "Merchant Workflow Automation",
    category: "enterprise",
    setupFeeInr: 39999,
    monthlyRetainerInr: 3999,
    setupFeeUsd: 799,
    monthlyRetainerUsd: 119,
    estimatedDirectDeliveryCostInr: 7500,
    timelineDays: 10,
    summary: "Automated vendor purchase orders, daily closing reconciliations, and staff shift checklists.",
    deliverables: [
      "Automated Supplier Reorder Triggers",
      "End-of-Day Payout & Settlement Reconciliation",
      "FSSAI Hygiene & Opening/Closing SOP Checklists",
      "Role-Based Approval Workflows",
    ],
  },
  {
    id: "SVC-06",
    name: "Order & Operations Dashboards",
    category: "logistics",
    setupFeeInr: 44999,
    monthlyRetainerInr: 4499,
    setupFeeUsd: 899,
    monthlyRetainerUsd: 129,
    estimatedDirectDeliveryCostInr: 8500,
    timelineDays: 12,
    summary: "Central command center for multi-unit dispatch SLA tracking, rider utilization, and kitchen throughput.",
    deliverables: [
      "Multi-Outlet Live Order & SLA Monitor",
      "Rider Dispatch & Proximity Assignment Board",
      "Kitchen Prep-Time Bottleneck Telemetry",
      "Customer Refund & Dispute Evidence Registry",
    ],
  },
  {
    id: "SVC-07",
    name: "Approved Booking/Order Integrations",
    category: "ecommerce",
    setupFeeInr: 34999,
    monthlyRetainerInr: 3499,
    setupFeeUsd: 699,
    monthlyRetainerUsd: 99,
    estimatedDirectDeliveryCostInr: 6500,
    timelineDays: 10,
    summary: "Official webhook and API bridges connecting POS terminals, payment gateways, and third-party logistics.",
    deliverables: [
      "2-Way POS & Inventory Webhook Synchronization",
      "Direct Payment Gateway & Bank UTR Webhook Setup",
      "3PL Courier Spillover Relay Integration",
      "HMAC-SHA256 Signed Payload Verification",
    ],
  },
  {
    id: "SVC-08",
    name: "Business Reporting",
    category: "fintech",
    setupFeeInr: 24999,
    monthlyRetainerInr: 2999,
    setupFeeUsd: 499,
    monthlyRetainerUsd: 79,
    estimatedDirectDeliveryCostInr: 4000,
    timelineDays: 6,
    summary: "Institutional unit-economics P&L statements, GST INV-1 tax summaries, and outlet-level EBITDA ledgers.",
    deliverables: [
      "Store-Wise Daily & Monthly P&L Ledger",
      "GST INV-1, Sec 9(5) & Sec 194-O Tax Export",
      "Aggregator vs Direct Channel Margin Comparison",
      "Automated Executive Weekly PDF Digest",
    ],
  },
  {
    id: "SVC-09",
    name: "Verified AI Automation Services",
    category: "enterprise",
    setupFeeInr: 59999,
    monthlyRetainerInr: 5999,
    setupFeeUsd: 1199,
    monthlyRetainerUsd: 179,
    estimatedDirectDeliveryCostInr: 11000,
    timelineDays: 14,
    summary: "Audited demand forecasting, prep-volume prediction, and optical proof anti-fraud verification.",
    deliverables: [
      "Historical SKU Demand & Prep-Sheet Forecasting",
      "Optical Proof Photo Hash Deduplication Shield",
      "Automated Anomaly & Discount Abuse Detection",
      "Human-in-the-Loop Audit Trail & Governance",
    ],
  },
  {
    id: "SVC-10",
    name: "Ongoing Maintenance & Support",
    category: "enterprise",
    setupFeeInr: 14999,
    monthlyRetainerInr: 4999,
    setupFeeUsd: 299,
    monthlyRetainerUsd: 149,
    estimatedDirectDeliveryCostInr: 3000,
    timelineDays: 3,
    summary: "99.9% uptime SLA monitoring, database backups, security patching, and priority operator desk support.",
    deliverables: [
      "24/7 Uptime & Database Health Monitoring",
      "Priority Rush-Hour Technical Escalation Desk",
      "Monthly Security & Dependency Patch Cycle",
      "Quarterly Menu & Tax Rule Configuration Updates",
    ],
  },
];

export interface CommercialRevenueBreakdown {
  leadPipelineValueInr: number;
  quotedValueInr: number;
  signedContractValueInr: number;
  invoicedValueInr: number;
  outstandingReceivablesInr: number;
  verifiedMoneyCollectedInr: number;
  refundsInr: number;
  directDeliveryCostsInr: number;
  netProfitInr: number;
  verifiedLeadsCount: number;
  scenarioTemplatesCount: number;
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
  source: "INBOUND" | "AI_DISCOVERY" | "REFERRAL" | "OUTREACH" | "MANUAL_ENTRY";
  notes: string[];
  history: LeadHistoryEntry[];
  nextFollowUpDate: string;
  dataProvenance?: "VERIFIED_CRM_RECORD" | "SCENARIO_TEMPLATE";
  contactPermissionConfirmed?: boolean;
  verifiedCollectedInr?: number;
  invoicedInr?: number;
  refundsInr?: number;
  directDeliveryCostInr?: number;
  selectedServiceId?: string;
  selectedServiceName?: string;
  paymentUtr?: string;
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
    painPoint: "Losing 28% margins (₹5,18,000/mo) to legacy aggregator commission taxes.",
    dealValueInr: 149999,
    advanceLockedInr: 74999,
    currentStage: "PROPOSAL",
    source: "AI_DISCOVERY",
    dataProvenance: "SCENARIO_TEMPLATE",
    contactPermissionConfirmed: false,
    verifiedCollectedInr: 0,
    invoicedInr: 0,
    refundsInr: 0,
    directDeliveryCostInr: 0,
    selectedServiceId: "SVC-02",
    selectedServiceName: "Restaurant SaaS POS & KOT Tools",
    notes: ["[SCENARIO TEMPLATE] Example multi-unit restaurant prospect illustrating 28% commission recovery model."],
    history: [
      {
        timestamp: "2026-09-20 10:00",
        toStage: "LEAD",
        note: "Scenario template initialized for regional restaurant group",
        actor: "AI_EXECUTIVE",
      },
      {
        timestamp: "2026-09-21 14:30",
        fromStage: "LEAD",
        toStage: "PROPOSAL",
        note: "Sample proposal generated with 28% margin recovery model",
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
    dataProvenance: "SCENARIO_TEMPLATE",
    contactPermissionConfirmed: false,
    verifiedCollectedInr: 0,
    invoicedInr: 0,
    refundsInr: 0,
    directDeliveryCostInr: 0,
    selectedServiceId: "SVC-07",
    selectedServiceName: "Approved Booking/Order Integrations",
    notes: ["[SCENARIO TEMPLATE] Example e-commerce export prospect needing 1-tap Indian UPI QR checkout."],
    history: [
      {
        timestamp: "2026-09-21 11:15",
        toStage: "LEAD",
        note: "Scenario template created for export merchant storefront",
        actor: "AI_EXECUTIVE",
      },
      {
        timestamp: "2026-09-21 16:00",
        fromStage: "LEAD",
        toStage: "QUALIFICATION",
        note: "Benchmarked site speed and cart abandonment metrics",
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
    dataProvenance: "SCENARIO_TEMPLATE",
    contactPermissionConfirmed: false,
    verifiedCollectedInr: 0,
    invoicedInr: 0,
    refundsInr: 0,
    directDeliveryCostInr: 0,
    selectedServiceId: "SVC-05",
    selectedServiceName: "Merchant Workflow Automation",
    notes: ["[SCENARIO TEMPLATE] Example healthcare workflow digitization prospect."],
    history: [
      {
        timestamp: "2026-09-22 08:30",
        toStage: "LEAD",
        note: "Scenario template for hospital OPD queue digitization",
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

  findDuplicateLead(email?: string, phone?: string): CrmLead | undefined {
    const normEmail = (email || "").trim().toLowerCase();
    const normPhone = (phone || "").replace(/[^0-9+]/g, "");

    for (const existing of this.leads.values()) {
      const existingEmail = (existing.email || "").trim().toLowerCase();
      const existingPhone = (existing.phone || "").replace(/[^0-9+]/g, "");

      if (normEmail && existingEmail && normEmail === existingEmail) {
        return existing;
      }
      if (normPhone && normPhone.length >= 8 && existingPhone && normPhone === existingPhone) {
        return existing;
      }
    }
    return undefined;
  }

  addLead(lead: Omit<CrmLead, "id" | "history">): CrmLead {
    const duplicate = this.findDuplicateLead(lead.email, lead.phone);
    if (duplicate) {
      throw new Error(
        `Duplicate lead detected: "${duplicate.businessName}" (${duplicate.id}) already uses matching email or phone.`
      );
    }

    const id = `LEAD-${Date.now().toString().slice(-4)}`;
    const newLead: CrmLead = {
      ...lead,
      id,
      dataProvenance: lead.dataProvenance ?? "VERIFIED_CRM_RECORD",
      contactPermissionConfirmed: lead.contactPermissionConfirmed ?? true,
      verifiedCollectedInr: lead.verifiedCollectedInr ?? 0,
      invoicedInr: lead.invoicedInr ?? 0,
      refundsInr: lead.refundsInr ?? 0,
      directDeliveryCostInr: lead.directDeliveryCostInr ?? 0,
      history: [
        {
          timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
          toStage: lead.currentStage || "LEAD",
          note: `Verified CRM lead created (${lead.source}) • Permission confirmed: ${
            lead.contactPermissionConfirmed ?? true ? "YES" : "NO"
          }`,
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

    const stageIdx = CRM_STAGE_ORDER.indexOf(newStage);
    const contractIdx = CRM_STAGE_ORDER.indexOf("CONTRACT");
    const invoiceIdx = CRM_STAGE_ORDER.indexOf("INVOICE");

    if (stageIdx >= contractIdx && lead.contract) {
      lead.contract.isSigned = true;
      if (!lead.contract.signedAt) {
        lead.contract.signedAt = new Date().toISOString().slice(0, 10);
      }
    }

    if (stageIdx >= invoiceIdx && (!lead.invoicedInr || lead.invoicedInr === 0)) {
      lead.invoicedInr = lead.dealValueInr;
      if (!lead.invoiceId) {
        lead.invoiceId = `INV-${Date.now().toString().slice(-6)}`;
      }
    }

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

    const matchedSvc = SELLABLE_ORDERKING_SERVICES.find((s) => s.id === lead.selectedServiceId);

    const proposal = {
      title: matchedSvc
        ? `${matchedSvc.name} — Turnkey Deployment for ${lead.businessName}`
        : `Turnkey Enterprise Solution for ${lead.businessName}`,
      summary: `End-to-end implementation solving: ${lead.painPoint}`,
      deliverables: matchedSvc
        ? matchedSvc.deliverables
        : [
            "Custom Production Web & Mobile System",
            "PostgreSQL High-Availability Database",
            "Role-Based Access Control Console",
            "King Pay UPI 0% Gateway Integration",
          ],
      timelineDays: matchedSvc ? matchedSvc.timelineDays : 14,
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
      signedAt: new Date().toISOString().slice(0, 10),
      isSigned: true,
    };

    lead.contract = contract;
    this.updateLeadStage(id, "CONTRACT", "Master services agreement compiled and executed.");
    return contract;
  }

  issueInvoice(id: string, invoiceAmountInr?: number): CrmLead {
    const lead = this.leads.get(id);
    if (!lead) throw new Error(`Lead ${id} not found.`);

    const amount = invoiceAmountInr !== undefined ? invoiceAmountInr : lead.dealValueInr;
    lead.invoicedInr = amount;
    lead.invoiceId = lead.invoiceId || `INV-${Date.now().toString().slice(-6)}`;
    return this.updateLeadStage(
      id,
      "INVOICE",
      `GST INV-1 Invoice ${lead.invoiceId} issued for ₹${amount.toLocaleString("en-IN")}.`
    );
  }

  recordVerifiedPayment(
    id: string,
    amountInr: number,
    paymentUtr: string,
    directDeliveryCostInr?: number
  ): CrmLead {
    const lead = this.leads.get(id);
    if (!lead) throw new Error(`Lead ${id} not found.`);
    if (lead.dataProvenance === "SCENARIO_TEMPLATE") {
      throw new Error(
        "Cannot record verified revenue on a SCENARIO_TEMPLATE record. Convert or create a VERIFIED_CRM_RECORD lead first."
      );
    }
    if (!paymentUtr || paymentUtr.trim().length < 6) {
      throw new Error("A valid bank/UPI UTR reference (minimum 6 characters) is required to verify payment collection.");
    }
    if (amountInr <= 0) {
      throw new Error("Verified payment amount must be greater than ₹0.");
    }

    lead.verifiedCollectedInr = (lead.verifiedCollectedInr ?? 0) + amountInr;
    if (!lead.invoicedInr || lead.invoicedInr < lead.verifiedCollectedInr) {
      lead.invoicedInr = Math.max(lead.dealValueInr, lead.verifiedCollectedInr);
    }
    if (directDeliveryCostInr !== undefined && directDeliveryCostInr >= 0) {
      lead.directDeliveryCostInr = directDeliveryCostInr;
    }
    lead.paymentUtr = paymentUtr.trim();

    return this.updateLeadStage(
      id,
      "PAYMENT",
      `Verified payment of ₹${amountInr.toLocaleString("en-IN")} collected via UTR ${lead.paymentUtr}.`
    );
  }

  /**
   * Computes the 9 separated Mandate 3 commercial financial buckets strictly from VERIFIED_CRM_RECORD leads.
   * Sample/Scenario templates (SCENARIO_TEMPLATE) are 100% excluded from all financial buckets.
   */
  getCommercialRevenueBreakdown(): CommercialRevenueBreakdown {
    const allLeads = Array.from(this.leads.values());
    const verifiedLeads = allLeads.filter((l) => l.dataProvenance === "VERIFIED_CRM_RECORD");
    const scenarioTemplatesCount = allLeads.filter((l) => l.dataProvenance === "SCENARIO_TEMPLATE").length;

    const proposalIdx = CRM_STAGE_ORDER.indexOf("PROPOSAL");
    const contractIdx = CRM_STAGE_ORDER.indexOf("CONTRACT");
    const invoiceIdx = CRM_STAGE_ORDER.indexOf("INVOICE");

    let leadPipelineValueInr = 0;
    let quotedValueInr = 0;
    let signedContractValueInr = 0;
    let invoicedValueInr = 0;
    let verifiedMoneyCollectedInr = 0;
    let refundsInr = 0;
    let directDeliveryCostsInr = 0;

    for (const lead of verifiedLeads) {
      const stageIdx = CRM_STAGE_ORDER.indexOf(lead.currentStage);
      const dealVal = Math.max(0, Number(lead.dealValueInr || 0));

      leadPipelineValueInr += dealVal;

      if (stageIdx >= proposalIdx || Boolean(lead.proposal)) {
        quotedValueInr += Math.max(0, Number(lead.proposal?.commercialValueInr ?? dealVal));
      }

      if (stageIdx >= contractIdx || lead.contract?.isSigned) {
        signedContractValueInr += dealVal;
      }

      const leadInvoiced =
        lead.invoicedInr !== undefined && lead.invoicedInr > 0
          ? Number(lead.invoicedInr)
          : stageIdx >= invoiceIdx
          ? dealVal
          : 0;
      invoicedValueInr += leadInvoiced;

      const leadCollected = Math.max(0, Number(lead.verifiedCollectedInr || 0));
      verifiedMoneyCollectedInr += leadCollected;

      const leadRefunds = Math.max(0, Number(lead.refundsInr || 0));
      refundsInr += leadRefunds;

      const leadCost = Math.max(0, Number(lead.directDeliveryCostInr || 0));
      directDeliveryCostsInr += leadCost;
    }

    const outstandingReceivablesInr = Math.max(
      0,
      invoicedValueInr - verifiedMoneyCollectedInr - refundsInr
    );
    const netProfitInr = verifiedMoneyCollectedInr - refundsInr - directDeliveryCostsInr;

    return {
      leadPipelineValueInr: Math.round(leadPipelineValueInr),
      quotedValueInr: Math.round(quotedValueInr),
      signedContractValueInr: Math.round(signedContractValueInr),
      invoicedValueInr: Math.round(invoicedValueInr),
      outstandingReceivablesInr: Math.round(outstandingReceivablesInr),
      verifiedMoneyCollectedInr: Math.round(verifiedMoneyCollectedInr),
      refundsInr: Math.round(refundsInr),
      directDeliveryCostsInr: Math.round(directDeliveryCostsInr),
      netProfitInr: Math.round(netProfitInr),
      verifiedLeadsCount: verifiedLeads.length,
      scenarioTemplatesCount,
    };
  }
}

export const crmEngine = new CrmPipelineEngine();
