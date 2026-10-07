// Service Productizer & Packaging Engine (Directive 7)
// Automatically packages technical capabilities into sellable, high-margin commercial service offerings.
// Generates: SERVICE, TARGET CUSTOMER, PROBLEM, DELIVERABLES, TIMELINE, REQUIRED RESOURCES, ESTIMATED COST, PRICE RANGE, MARGIN, OPTIONAL RETAINER.

export interface PackagedService {
  id: string;
  service: string;
  category:
    | "Business Websites"
    | "E-commerce Websites"
    | "SaaS MVPs"
    | "Internal Dashboards"
    | "AI Chatbots"
    | "AI Customer Support"
    | "AI Automation"
    | "Workflow Automation"
    | "Data Dashboards"
    | "API Integrations"
    | "CRM Automation"
    | "Document Automation"
    | "Voice Agents"
    | "Translation Systems"
    | "Custom Software"
    | "Maintenance & SLAs"
    | "Security Hardening"
    | "Analytics & Telemetry"
    | "Technical Consulting";
  targetCustomer: string;
  problem: string;
  deliverables: string[];
  timelineDays: number;
  requiredResources: string[];
  estimatedCost: {
    infraCost: number;
    aiApiCost: number;
    laborCost: number;
    totalCost: number;
  };
  priceRange: {
    min: number;
    max: number;
    recommended: number;
    currency: "INR" | "USD";
  };
  marginPercent: number;
  optionalRetainer: {
    monthlyFee: number;
    deliverables: string[];
    slaHours: number;
  };
}

export class ServiceProductizer {
  private services: PackagedService[] = [
    {
      id: "SVC-01",
      service: "Turnkey Direct Ordering App & Fleet Dispatch Suite",
      category: "E-commerce Websites",
      targetCustomer: "High-volume restaurants, bakeries, cloud kitchens (₹10L-₹50L/mo revenue)",
      problem: "Paying 25-30% aggregator commission taxes to Swiggy/Zomato on repeat direct customers.",
      deliverables: [
        "White-labeled web ordering portal (Next.js 15, React 19)",
        "0% transaction fee King Pay UPI integration",
        "Kitchen Display System (KDS) & rider dispatch console",
        "WhatsApp automated order receipt & tracking bot",
      ],
      timelineDays: 14,
      requiredResources: ["Next.js 15", "PostgreSQL", "WhatsApp Cloud API", "King Pay UPI"],
      estimatedCost: {
        infraCost: 2000,
        aiApiCost: 500,
        laborCost: 15000,
        totalCost: 17500,
      },
      priceRange: {
        min: 99999,
        max: 249999,
        recommended: 149999,
        currency: "INR",
      },
      marginPercent: 88,
      optionalRetainer: {
        monthlyFee: 14999,
        deliverables: ["Cloud server hosting", "Daily DB backups", "Menu updates", "Priority SLA"],
        slaHours: 4,
      },
    },
    {
      id: "SVC-02",
      service: "Ultra-Fast Headless E-Commerce Next.js 15 Storefront",
      category: "E-commerce Websites",
      targetCustomer: "D2C brands, organic produce exporters, regional manufacturers",
      problem: "Slow Shopify/WooCommerce mobile checkout causing >60% cart abandonment.",
      deliverables: [
        "Sub-500ms Headless Next.js 15 storefront",
        "1-Tap UPI and international payment gateway integration",
        "Automated inventory & ShipRocket logistics sync",
        "SEO optimization & Core Web Vitals 95+ score",
      ],
      timelineDays: 21,
      requiredResources: ["Next.js 15", "TailwindCSS", "PostgreSQL", "ShipRocket API"],
      estimatedCost: {
        infraCost: 3500,
        aiApiCost: 800,
        laborCost: 25000,
        totalCost: 29300,
      },
      priceRange: {
        min: 199999,
        max: 499999,
        recommended: 299999,
        currency: "INR",
      },
      marginPercent: 90,
      optionalRetainer: {
        monthlyFee: 24999,
        deliverables: ["Performance optimization", "Conversion A/B testing", "Security patches"],
        slaHours: 2,
      },
    },
    {
      id: "SVC-03",
      service: "Enterprise Double-Entry Financial Ledger Engine",
      category: "Custom Software",
      targetCustomer: "FinTech startups, marketplaces, neobanks, cross-border remittance providers",
      problem: "Single-entry databases causing reconciliation discrepancies and audit failures.",
      deliverables: [
        "Mathematical double-entry ledger in PostgreSQL with ACID guarantees",
        "Idempotent webhook settlement handlers for Stripe, UPI, and wires",
        "Append-only immutable audit trail with SHA-256 tamper verification",
        "Comprehensive automated testing suite (98%+ coverage)",
      ],
      timelineDays: 30,
      requiredResources: ["Node.js / TypeScript", "PostgreSQL", "Kysely", "Stripe API"],
      estimatedCost: {
        infraCost: 150,
        aiApiCost: 60,
        laborCost: 2500,
        totalCost: 2710,
      },
      priceRange: {
        min: 12000,
        max: 30000,
        recommended: 18000,
        currency: "USD",
      },
      marginPercent: 85,
      optionalRetainer: {
        monthlyFee: 2500,
        deliverables: ["Continuous audit monitoring", "Ledger scaling support", "24/7 incident response"],
        slaHours: 1,
      },
    },
    {
      id: "SVC-04",
      service: "Multi-Specialty OPD Token & Hospital EHR Suite",
      category: "Internal Dashboards",
      targetCustomer: "Hospitals, nursing homes, diagnostic clinics, multi-doctor OPD centers",
      problem: "Manual paper slips, long crowded waiting lines, lost patient medical history.",
      deliverables: [
        "Live QR token queue with doctor on-call status displays",
        "Digital doctor prescription pad & pharmacy inventory link",
        "ABDM Health ID (ABHA) integration readiness",
        "Instant billing & UPI collection terminal",
      ],
      timelineDays: 21,
      requiredResources: ["React 19", "PostgreSQL", "TailwindCSS", "Thermal Printer SDK"],
      estimatedCost: {
        infraCost: 4000,
        aiApiCost: 1000,
        laborCost: 30000,
        totalCost: 35000,
      },
      priceRange: {
        min: 249999,
        max: 599999,
        recommended: 349999,
        currency: "INR",
      },
      marginPercent: 90,
      optionalRetainer: {
        monthlyFee: 29999,
        deliverables: ["Hardware integration support", "Doctor onboarding", "Weekly data backups"],
        slaHours: 2,
      },
    },
    {
      id: "SVC-05",
      service: "Autonomous AI Customer Support & Voice Agent",
      category: "AI Customer Support",
      targetCustomer: "SaaS companies, e-commerce stores, logistics firms with high ticket volume",
      problem: "High support staff overhead and slow after-hours customer response times.",
      deliverables: [
        "Multi-channel AI agent (Web chat, WhatsApp, Voice/Telephony)",
        "Trained on company documentation, FAQs, and return policies",
        "Ticket escalation to human agent with context summary",
        "Analytics dashboard tracking CSAT and resolution time",
      ],
      timelineDays: 14,
      requiredResources: ["Gemini / Claude API", "Vector Embeddings", "Twilio / WhatsApp API"],
      estimatedCost: {
        infraCost: 3000,
        aiApiCost: 2000,
        laborCost: 20000,
        totalCost: 25000,
      },
      priceRange: {
        min: 149999,
        max: 349999,
        recommended: 199999,
        currency: "INR",
      },
      marginPercent: 87,
      optionalRetainer: {
        monthlyFee: 19999,
        deliverables: ["Continuous model prompt tuning", "Knowledge base updates", "Monthly CSAT reports"],
        slaHours: 4,
      },
    },
  ];

  getAllServices(): PackagedService[] {
    return [...this.services];
  }

  getServiceById(id: string): PackagedService | undefined {
    return this.services.find((s) => s.id === id);
  }

  getServicesByCategory(category: PackagedService["category"]): PackagedService[] {
    return this.services.filter((s) => s.category === category);
  }
}

export const serviceProductizer = new ServiceProductizer();
