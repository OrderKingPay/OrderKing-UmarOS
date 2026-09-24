// HDmaster Founder AI — Service Productizer & Packaging Engine
// Implements Directive §7 (Automatic Service Packaging)

export interface ProductizedService {
  id: string;
  name: string;
  category:
    | "saas_mvp"
    | "ecommerce_pwa"
    | "ai_voice_agents"
    | "hyperlocal_logistics"
    | "fintech_pos"
    | "cybersecurity_hardening";
  targetCustomer: string;
  problemSolved: string;
  deliverables: string[];
  timeline: string;
  requiredResources: string[];
  estimatedCostInr: number;
  priceRangeInr: { min: number; max: number };
  marginPct: number;
  optionalRetainerInr?: number;
  readyBlueprintId?: string;
}

export const PRODUCTIZED_SERVICES: ProductizedService[] = [
  {
    id: "SRV-001",
    name: "Zero-Commission White-Label Food Ordering & Dispatch Platform",
    category: "hyperlocal_logistics",
    targetCustomer: "Independent Restaurants, Cloud Kitchens, Bakery Chains & Cafes",
    problemSolved: "Eliminates crippling 24-28% aggregator commissions by enabling direct customer ordering.",
    deliverables: [
      "Custom Branded PWA Customer App (iOS/Android compatible)",
      "Kitchen Order Management Terminal & Tablet Console",
      "WhatsApp & SMS Real-Time Order Dispatch",
      "KingPay 0% Fee Direct UPI Soundbox & QR Integration",
      "Customer Database Ownership (zero platform lock-in)",
    ],
    timeline: "3 to 5 Days to Live Production",
    requiredResources: ["OrderKing Core Engine", "PostgreSQL PGlite", "WhatsApp Business API", "Domain DNS"],
    estimatedCostInr: 3500,
    priceRangeInr: { min: 49999, max: 149999 },
    marginPct: 96,
    optionalRetainerInr: 4999, // ₹4,999/mo maintenance & hosting
    readyBlueprintId: "BP-FOOD-01",
  },
  {
    id: "SRV-002",
    name: "Autonomous SaaS MVP Turnkey Architecture",
    category: "saas_mvp",
    targetCustomer: "Early-Stage Founders, B2B Startups & Agency Clients",
    problemSolved: "Reduces SaaS time-to-market from 6 months to 1 week with production-ready auth, billing & DB.",
    deliverables: [
      "Multi-Tenant PostgreSQL Schema with Kysely Query Engine",
      "Better-Auth Session & Role-Based Access Control (RBAC)",
      "Stripe / Razorpay Subscription Webhook Billing Engine",
      "Interactive Admin Dashboard & User Management Console",
      "Automated CI/CD Pipeline & Edge Cloud Deployment",
    ],
    timeline: "7 Days to Production MVP",
    requiredResources: ["React 19", "TanStack Start", "Tailwind CSS v4", "Docker / Cloudflare"],
    estimatedCostInr: 5000,
    priceRangeInr: { min: 99999, max: 299999 },
    marginPct: 95,
    optionalRetainerInr: 9999,
    readyBlueprintId: "BP-SAAS-01",
  },
  {
    id: "SRV-003",
    name: "Full-Duplex Multilingual AI Voice Concierge System",
    category: "ai_voice_agents",
    targetCustomer: "Hospitals, Financial Services, E-Commerce & Customer Support Centers",
    problemSolved: "Replaces slow mechanical IVR phone trees with instant, natural conversational voice in 12 languages.",
    deliverables: [
      "Low-Latency Web Speech & AudioContext VAD Streaming Loop",
      "Natural Interruption & Barge-In Audio Waveform Visualizer",
      "Automatic Language Detection (Hindi, Bengali, English, Assamese, etc.)",
      "CRM & Ticketing System Webhook Integration",
      "Full Duplex Voice Call Mode with Zero External Latency",
    ],
    timeline: "4 Days to Deployment",
    requiredResources: ["Web Audio API", "Gemini 2.5 Flash / Grok", "WebSocket Server"],
    estimatedCostInr: 4000,
    priceRangeInr: { min: 79999, max: 199999 },
    marginPct: 95,
    optionalRetainerInr: 7999,
    readyBlueprintId: "BP-VOICE-01",
  },
  {
    id: "SRV-004",
    name: "Turnkey FinTech Double-Entry Ledger & POS Suite",
    category: "fintech_pos",
    targetCustomer: "Retailers, Supermarkets, Distributors & Micro-Finance Institutions",
    problemSolved: "Provides verifiable bank-grade ledger accounting and instant T+0 UPI merchant settlements.",
    deliverables: [
      "Immutable Double-Entry Financial Ledger Engine",
      "Dynamic NPCI-Compliant UPI QR & Soundbox Generator",
      "Automatic Daily Merchant Settlement Sweep & Payout Ledger",
      "GST Return Reconciliation & Tax Invoice Generator",
      "Audit Log & Tamper-Evident Proof of Transaction",
    ],
    timeline: "5 Days to Production",
    requiredResources: ["PostgreSQL", "Jose JWT", "Razorpay / Bank Route", "PDFKit"],
    estimatedCostInr: 3000,
    priceRangeInr: { min: 69999, max: 189999 },
    marginPct: 96,
    optionalRetainerInr: 5999,
    readyBlueprintId: "BP-FIN-01",
  },
];
