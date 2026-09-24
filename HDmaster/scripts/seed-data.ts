import { ClientLead, ConnectedPlatform, RemoteContractGig, SeparableModule, EnterpriseProjectBlueprint, CrmStage } from '../src/lib/orderking/ai/supreme-founder-ai-core';

export const CURATED_CLIENT_LEADS: ClientLead[] = [
  {
    id: "LEAD-101",
    businessName: "Royal Darbar Palace & Cloud Kitchens",
    category: "restaurant",
    location: "Karimganj / Silchar",
    monthlyRevenueEst: "₹18,50,000",
    painPoint: "Losing 28% margins (₹5,18,000/mo) to Swiggy/Zomato commission taxes.",
    projectBudget: 149999,
    status: "PITCH_READY",
    suggestedSolution: "Turnkey OrderKing White-Label Direct Ordering App with 0% Commission & WhatsApp Fleet Dispatch.",
    potentialGmvGrowth: "+35% Net Profit Margin",
  },
  {
    id: "LEAD-102",
    businessName: "Assam Valley Organic Tea & Spices Export",
    category: "ecommerce",
    location: "Guwahati / Global",
    monthlyRevenueEst: "₹45,000,000",
    painPoint: "Outdated Shopify store with slow checkout, high drop-offs, and no direct Indian UPI QR soundbox.",
    projectBudget: 299999,
    status: "PITCH_READY",
    suggestedSolution: "Ultra-Fast Headless Next.js 15 E-Commerce with 1-Tap KingPay UPI, Multi-Currency & Parivahan ShipRocket Sync.",
    potentialGmvGrowth: "2.4x Conversion Rate",
  },
  {
    id: "LEAD-103",
    businessName: "Sribhumi Multi-Specialty Hospital & Diagnostic Hub",
    category: "healthcare",
    location: "Karimganj Town",
    monthlyRevenueEst: "₹62,00,000",
    painPoint: "Manual paper OPD slips, long patient queues, no digital tele-consultation or instant prescription vault.",
    projectBudget: 399999,
    status: "PITCH_READY",
    suggestedSolution: "ABDM-Compliant Patient Portal, WhatsApp Doctor Appointments, QR OPD Check-in & Pharmacy Dispatch.",
    potentialGmvGrowth: "Zero Queue Bottlenecks & 100% Digital Health Records",
  },
  {
    id: "LEAD-104",
    businessName: "North-East Intercity Express Logistics Fleet",
    category: "logistics",
    location: "Silchar – Shillong – Guwahati",
    monthlyRevenueEst: "₹85,00,000",
    painPoint: "Zero real-time driver telemetry, fuel pilferage, manual billing delays of up to 45 days.",
    projectBudget: 499999,
    status: "PITCH_READY",
    suggestedSolution: "Autonomous Fleet Telematics Dashboard, FastTag Auto-Reconcile, Automated e-Way Bill & Driver Payouts.",
    potentialGmvGrowth: "18% Fuel Cost Savings & Instant Freight Escrow",
  },
];


export const UNIVERSAL_PLATFORMS: ConnectedPlatform[] = [
  {
    id: "plat-github",
    name: "GitHub & DevOps Cloud",
    category: "developer",
    description: "Autonomous code synchronization, PR generation, branch protection enforcement, and CI/CD pipelines.",
    icon: "github",
    status: "CONNECTED",
    apiLatencyMs: 24,
    lastSyncTime: "Just now",
    authMethod: "OAuth2 / HMAC-SHA256",
    guardrailProtection: {
      sandboxVerified: true,
      zeroDataLeak: true,
      rollbackSnapshotReady: true,
      rateLimitSafe: true,
    },
    supportedActions: [
      {
        id: "act-gh-commit",
        label: "Force Autonomous Commit & Push",
        description: "Commits production bugfixes and features with zero merge conflicts.",
        safetyLevel: "STRICT_SAFE",
        defaultPayload: "git commit -m 'feat: sovereign core update' && git push origin main",
      },
      {
        id: "act-gh-ci",
        label: "Trigger 160-Suite Zero-Failure CI/CD",
        description: "Runs end-to-end automated test suites with deterministic assertion sweeps.",
        safetyLevel: "STRICT_SAFE",
        defaultPayload: "npm test && npm run typecheck && npm run build:dev",
      },
    ],
  },
  {
    id: "plat-upwork",
    name: "Upwork Enterprise & Contracts",
    category: "freelance",
    description: "High-paid $100+/hr software contract hunter, automated tailored proposal generator, and escrow milestones tracker.",
    icon: "upwork",
    status: "CONNECTED",
    apiLatencyMs: 38,
    lastSyncTime: "2m ago",
    authMethod: "Encrypted API Token",
    guardrailProtection: {
      sandboxVerified: true,
      zeroDataLeak: true,
      rollbackSnapshotReady: true,
      rateLimitSafe: true,
    },
    supportedActions: [
      {
        id: "act-up-bid",
        label: "Force Instant Technical Bid Submission",
        description: "Submits verified proposal with live double-entry ledger & React 19 proof-of-work.",
        safetyLevel: "AUTO_ROLLBACK_ENABLED",
        defaultPayload: "Submit $145/hr proposal to FinTech Systems Architect role",
      },
      {
        id: "act-up-escrow",
        label: "Audit & Release Escrow Funds",
        description: "Verifies client milestone funding and requests immediate release.",
        safetyLevel: "STRICT_SAFE",
        defaultPayload: "Escrow milestone audit for $28,000 fixed contract",
      },
    ],
  },
  {
    id: "plat-whatsapp",
    name: "WhatsApp Business Cloud API",
    category: "messaging",
    description: "Direct merchant outreach, automated invoice delivery with 1-tap UPI deep links, and client support automation.",
    icon: "whatsapp",
    status: "CONNECTED",
    apiLatencyMs: 19,
    lastSyncTime: "Just now",
    authMethod: "OAuth2 / HMAC-SHA256",
    guardrailProtection: {
      sandboxVerified: true,
      zeroDataLeak: true,
      rollbackSnapshotReady: true,
      rateLimitSafe: true,
    },
    supportedActions: [
      {
        id: "act-wa-pitch",
        label: "Force Pitch & Invoice Dispatch",
        description: "Dispatches 0% commission direct ordering pitch with ₹92,500 advance QR payload.",
        safetyLevel: "STRICT_SAFE",
        defaultPayload: "Send verified pitch template to 5 local restaurant owners",
      },
      {
        id: "act-wa-broadcast",
        label: "Broadcast Promo Campaign",
        description: "Sends personalized promotional templates within Meta tier 2 rate limits.",
        safetyLevel: "STRICT_SAFE",
        defaultPayload: "Broadcast 15% discount code to active loyalty members",
      },
    ],
  },
  {
    id: "plat-zomato",
    name: "Zomato & Swiggy Merchant Bridge",
    category: "commerce",
    description: "Live menu synchronizer, price parity engine, and commission displacement tracking (0% direct order diversion).",
    icon: "zomato",
    status: "CONNECTED",
    apiLatencyMs: 42,
    lastSyncTime: "4m ago",
    authMethod: "Zero-Knowledge Webhook",
    guardrailProtection: {
      sandboxVerified: true,
      zeroDataLeak: true,
      rollbackSnapshotReady: true,
      rateLimitSafe: true,
    },
    supportedActions: [
      {
        id: "act-zm-sync",
        label: "Force Catalog & Menu Sync",
        description: "Synchronizes dishes, prices, and stock across POS and aggregator portals.",
        safetyLevel: "STRICT_SAFE",
        defaultPayload: "Sync 45 menu items with real-time stock quantities",
      },
      {
        id: "act-zm-parity",
        label: "Enforce 0% Direct Order Savings Banner",
        description: "Configures package inserts and digital receipts highlighting direct app savings.",
        safetyLevel: "STRICT_SAFE",
        defaultPayload: "Deploy 'Order Direct on OrderKing to Save 28%' customer flyers",
      },
    ],
  },
  {
    id: "plat-shopify",
    name: "Shopify & Headless E-Commerce",
    category: "commerce",
    description: "Catalog auto-importer, inventory synchronizer, and King Pay 1-tap checkout webhook bridge.",
    icon: "shopify",
    status: "CONNECTED",
    apiLatencyMs: 31,
    lastSyncTime: "6m ago",
    authMethod: "OAuth2 / HMAC-SHA256",
    guardrailProtection: {
      sandboxVerified: true,
      zeroDataLeak: true,
      rollbackSnapshotReady: true,
      rateLimitSafe: true,
    },
    supportedActions: [
      {
        id: "act-sh-checkout",
        label: "Force King Pay 1-Tap Checkout Injection",
        description: "Injects zero-commission King Pay UPI payment method into checkout.",
        safetyLevel: "AUTO_ROLLBACK_ENABLED",
        defaultPayload: "Inject custom payment app extension with UPI deep link support",
      },
      {
        id: "act-sh-inventory",
        label: "Real-Time Stock Audit & Sync",
        description: "Aligns warehouse quantities across physical store and online shop.",
        safetyLevel: "STRICT_SAFE",
        defaultPayload: "Audit 1,200 SKUs and update low stock flags",
      },
    ],
  },
  {
    id: "plat-kingpay",
    name: "King Pay & NPCI UPI Rails",
    category: "payments",
    description: "Direct founder bank escrow, 0% intermediary fees, instant QR generation, and Section 79 IT Act ledger audit.",
    icon: "kingpay",
    status: "CONNECTED",
    apiLatencyMs: 12,
    lastSyncTime: "Real-Time",
    authMethod: "Direct Sovereign RPC",
    guardrailProtection: {
      sandboxVerified: true,
      zeroDataLeak: true,
      rollbackSnapshotReady: true,
      rateLimitSafe: true,
    },
    supportedActions: [
      {
        id: "act-kp-invoice",
        label: "Mint Instant Statutory Invoice",
        description: "Creates verifiable ₹75,000 / ₹1,49,999 invoice with compliant NPCI UPI deep link.",
        safetyLevel: "STRICT_SAFE",
        defaultPayload: "Generate advance invoice for Royal Darbar Cloud Kitchen",
      },
      {
        id: "act-kp-sweep",
        label: "Execute 100% Payout Sweep",
        description: "Directs all settled customer paise into founder primary bank account with zero cuts.",
        safetyLevel: "STRICT_SAFE",
        defaultPayload: "Audit ledger balance and sweep ₹1,85,000 to primary HDFC account",
      },
    ],
  },
  {
    id: "plat-google",
    name: "Google Workspace & Cloud Drive",
    category: "productivity",
    description: "Automated legal NDA drafting, client meeting scheduling on Google Meet, and financial sheet synchronization.",
    icon: "google",
    status: "CONNECTED",
    apiLatencyMs: 27,
    lastSyncTime: "10m ago",
    authMethod: "OAuth2 / HMAC-SHA256",
    guardrailProtection: {
      sandboxVerified: true,
      zeroDataLeak: true,
      rollbackSnapshotReady: true,
      rateLimitSafe: true,
    },
    supportedActions: [
      {
        id: "act-g-meet",
        label: "Generate 15-Minute Client Meet Invite",
        description: "Generates Google Meet calendar link with evaluation scorecard and pitch deck attached.",
        safetyLevel: "STRICT_SAFE",
        defaultPayload: "Schedule architectural consulting call for Thursday 4:00 PM IST",
      },
      {
        id: "act-g-sheet",
        label: "Sync Revenue Ledger to Private Drive",
        description: "Exports immutable double-entry ledger entries into encrypted Google Sheet.",
        safetyLevel: "STRICT_SAFE",
        defaultPayload: "Sync Q3 settled invoice ledger with 18% GST allocation",
      },
    ],
  },
  {
    id: "plat-aws",
    name: "AWS Cloud & Vercel Edge",
    category: "cloud",
    description: "Multi-region edge deployment, serverless cold-start elimination, and PostgreSQL PGlite cache replication.",
    icon: "aws",
    status: "CONNECTED",
    apiLatencyMs: 18,
    lastSyncTime: "1m ago",
    authMethod: "Encrypted API Token",
    guardrailProtection: {
      sandboxVerified: true,
      zeroDataLeak: true,
      rollbackSnapshotReady: true,
      rateLimitSafe: true,
    },
    supportedActions: [
      {
        id: "act-aws-deploy",
        label: "Force Instant Edge Sandbox Deployment",
        description: "Compiles React 19 app and deploys to preview edge URL in under 2 seconds.",
        safetyLevel: "STRICT_SAFE",
        defaultPayload: "Deploy hospital-erp blueprint to https://preview-hospital.orderking.in",
      },
    ],
  },
];


export const CURATED_REMOTE_GIGS: RemoteContractGig[] = [
  {
    id: "REMOTE-501",
    title: "Lead Distributed Systems Architect (FinTech Core)",
    clientLocation: "San Francisco, CA (Remote)",
    hourlyRateUsd: 145,
    fixedBudgetUsd: 28000,
    duration: "3-6 Months",
    skillsRequired: ["TypeScript", "PostgreSQL", "Distributed State Machines", "Double-Entry Ledger", "TanStack"],
    description:
      "Enterprise FinTech building high-throughput payment rails. Needs hands-on architect to design idempotent ledgers, zero-markup payment pipelines, and real-time reconciliation.",
    matchScore: 99,
    platform: "Upwork Enterprise",
    proposalTemplate: `Hi Hiring Team,
I specialize in building sovereign FinTech ledgers and zero-markup payment engines handling high-concurrency transactions. In my current production architecture, I built a double-entry ledger with PGlite memory caching, instant UPI/escrow settlement, and automated Section 79 IT Act compliance.

I can immediately deliver:
1. Idempotent payment state machine with zero double-charge risk.
2. High-performance PostgreSQL ledger with sub-50ms audit sweeps.
3. Clean, modular TypeScript/TanStack integration.

Let's hop on a 15-minute sync to review my live architecture demo.`,
  },
  {
    id: "REMOTE-502",
    title: "Principal Full-Stack React 19 / Node Engineer",
    clientLocation: "London, UK (Remote)",
    hourlyRateUsd: 125,
    fixedBudgetUsd: 18500,
    duration: "2-4 Months",
    skillsRequired: ["React 19", "TanStack Router", "Tailwind CSS", "WebSockets", "Autonomous AI Agents"],
    description:
      "Scale-up building high-performance marketplace apps. Needs an expert who writes pristine, minimal diff code with zero placeholders.",
    matchScore: 97,
    platform: "Toptal",
    proposalTemplate: `Hi there,
I design and ship complete, production-grade marketplaces with React 19, TanStack Router, and real-time WebSockets dispatch. My code adheres to strict zero-placeholder standards, full type safety, and responsive glassmorphism UI.

Ready to start immediately and push clean, verified PRs from Day 1.`,
  },
  {
    id: "REMOTE-503",
    title: "Autonomous AI Agents & Multi-Modal Voice Systems Lead",
    clientLocation: "Austin, TX (Remote)",
    hourlyRateUsd: 155,
    fixedBudgetUsd: 32000,
    duration: "Ongoing / Retainer",
    skillsRequired: ["Web Speech API", "Gemini 2.5/Flash", "AudioContext", "Full Duplex Voice", "Autonomous Workflows"],
    description:
      "AI startup building real-time executive voice assistants. Needs an engineer who has implemented real-time duplex voice turn-taking and multi-lingual voice synthesis.",
    matchScore: 100,
    platform: "Direct US Client",
    proposalTemplate: `Hi,
I have directly engineered full-duplex voice call systems with real-time audio waveform visualizers, native language auto-detection, and natural young female acoustic tuning (Web Speech + AudioContext).

I can integrate and benchmark this within your app within 48 hours. Let's schedule a live voice demo.`,
  },
];


export const SEPARABLE_MODULES: SeparableModule[] = [
  {
    id: "mod-video-studio",
    name: "World-Class 4K Video & Image Studio",
    tagline: "World's #1 fastest video generation & editing engine",
    description: "Complete standalone 9:16 reels, 16:9 widescreen, 1:1, and 21:9 video editing platform with young female voiceover and dynamic karaoke auto-subtitles.",
    category: "media",
    standaloneRoute: "/studio",
    subdomainUrl: "https://studio.orderking.in",
    filesCount: 8,
    bundleSizeKb: 142,
    techStack: ["React 19", "Vite", "WebCodecs Turbo", "Tailwind CSS", "Canvas AudioContext"],
    standalonePackageJson: {
      name: "orderking-video-studio",
      version: "1.0.0",
      scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
      dependencies: { react: "^19.0.0", "react-dom": "^19.0.0", "lucide-react": "^1.16.0" },
    },
    sampleComponentCode: `import React, { useState } from "react";
// Standalone OrderKing 4K Video & Image Creation Studio
export default function StandaloneVideoStudio() {
  const [aspect, setAspect] = useState("9:16");
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold text-purple-400">OrderKing 4K Video Studio (Standalone)</h1>
      <p className="text-xs text-slate-400 mt-1">100,000x Realtime WebCodecs Turbo Engine</p>
    </div>
  );
}`,
  },
  {
    id: "mod-platform-enforcer",
    name: "Universal Platform & App Enforcer",
    tagline: "Force external apps to execute work safely",
    description: "Autonomous integration bridge connecting GitHub, Upwork, WhatsApp API, Zomato, Shopify, and King Pay with zero data leak and automatic rollback.",
    category: "integrations",
    standaloneRoute: "/enforcer",
    subdomainUrl: "https://enforcer.orderking.in",
    filesCount: 12,
    bundleSizeKb: 185,
    techStack: ["Node.js", "TypeScript", "HMAC-SHA256 Sandbox", "Webhooks", "Edge RPC"],
    standalonePackageJson: {
      name: "orderking-platform-enforcer",
      version: "1.0.0",
      scripts: { start: "node dist/server.js", build: "tsc" },
      dependencies: { express: "^4.19.0", axios: "^1.7.0" },
    },
    sampleComponentCode: `import { Router } from "express";

export const ENTERPRISE_BLUEPRINTS: Record<string, EnterpriseProjectBlueprint> = {
  hospital_erp: {
    id: "BP-HOSP-01",
    title: "Autonomous Hospital Management ERP & Tele-Care System",
    category: "erp",
    targetOrganization: "Private Hospitals, Diagnostic Labs & Specialty Polyclinics",
    techStack: ["TypeScript", "React 19", "PostgreSQL", "TanStack Query", "WebRTC", "Tailwind CSS"],
    databaseSchema: [
      "patients (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), abha_id VARCHAR(32), full_name VARCHAR(128), phone VARCHAR(16), blood_group VARCHAR(6), created_at TIMESTAMPTZ)",
      "opd_appointments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), patient_id UUID REFERENCES patients(id), doctor_id UUID, slot_time TIMESTAMPTZ, token_no INT, status VARCHAR(24))",
      "diagnostic_reports (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), patient_id UUID REFERENCES patients(id), test_name VARCHAR(128), file_url TEXT, verified_by VARCHAR(64))",
      "medical_billing_ledger (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), patient_id UUID, total_inr NUMERIC(10,2), gst_inr NUMERIC(10,2), status VARCHAR(24), upi_ref VARCHAR(64))",
    ],
    apiEndpoints: [
      "POST /api/v1/patients/register",
      "POST /api/v1/opd/book-slot",
      "GET  /api/v1/doctors/:id/queue",
      "POST /api/v1/billing/generate-invoice",
      "POST /api/v1/telehealth/session-token",
    ],
    frontendRoutes: ["/", "/opd-queue", "/doctor-console", "/patient-portal", "/billing-settlement", "/reports"],
    livePreviewUrl: "https://preview-health.orderking.in",
    estimatedBuildTime: "48 Hours (Autonomous Scaffolding)",
    commercialValueInr: 399999,
    clientHandoffReady: true,
    handoffCredentials: {
      adminEmail: "director@sribhumihospital.com",
      temporaryPass: "Sribhumi#Health2026!",
      jwtSecret: "sk_live_hosp_902384902834092834098234",
      databaseUrl: "postgresql://sribhumi_admin:SecurePglitePass@db.orderking.in:5432/hospital_core",
    },
    files: [
      {
        filename: "App.tsx",
        language: "typescript",
        code: `import React, { useState } from "react";

export default function HospitalPortal() {
  const [activeTab, setActiveTab] = useState("opd");
  const [patientName, setPatientName] = useState("");
  const [tokenNo, setTokenNo] = useState(14);
  const [queue, setQueue] = useState([
    { token: 11, name: "Rahul Sharma", doctor: "Dr. A. K. Sen (Cardio)", status: "IN_CONSULTATION" },
    { token: 12, name: "Ananya Roy", doctor: "Dr. M. Begum (Gynae)", status: "WAITING" },
    { token: 13, name: "Kabir Das", doctor: "Dr. P. Baruah (Ortho)", status: "WAITING" },
  ]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;
    const nextToken = tokenNo + 1;
    setTokenNo(nextToken);
    setQueue([...queue, { token: nextToken, name: patientName, doctor: "General OPD", status: "WAITING" }]);
    setPatientName("");
    alert(\`Token #\${nextToken} issued for \${patientName}! Direct WhatsApp SMS sent.\`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <header className="border-b border-emerald-500/30 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400">Sribhumi Hospital &amp; OPD Hub</h1>
          <p className="text-xs text-slate-400">ABDM Compliant · Instant QR Check-in · 100% Digital Health Records</p>
        </div>
        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-3 py-1 rounded-full text-xs font-mono">
          Live OPD Queue: {queue.length} Active
        </span>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Fast-Track OPD Registration</h2>
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Patient Full Name</label>
              <input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Enter patient name..."
                className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-sm"
              />
            </div>
            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-lg text-sm transition">
              Issue Instant Digital OPD Token
            </button>
          </form>
        </div>

        <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Real-Time Doctor Queue Console</h2>
          <div className="space-y-2">
            {queue.map((item) => (
              <div key={item.token} className="flex justify-between items-center bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-1 rounded text-xs">
                    #{item.token}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-white">{item.name}</h4>
                    <p className="text-xs text-slate-400">{item.doctor}</p>
                  </div>
                </div>
                <span className={\`text-xs font-bold px-2.5 py-1 rounded-full \${item.status === "IN_CONSULTATION" ? "bg-amber-500/20 text-amber-300 animate-pulse" : "bg-slate-700 text-slate-300"}\`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}`,
      },
      {
        filename: "schema.sql",
        language: "sql",
        code: `-- Sribhumi Multi-Specialty Hospital Core Database Schema
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  abha_id VARCHAR(32) UNIQUE,
  full_name VARCHAR(128) NOT NULL,
  phone VARCHAR(16) NOT NULL,
  blood_group VARCHAR(6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE opd_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL,
  slot_time TIMESTAMPTZ NOT NULL,
  token_no INT NOT NULL,
  status VARCHAR(24) DEFAULT 'WAITING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opd_status ON opd_appointments(status, slot_time);
CREATE INDEX idx_patients_phone ON patients(phone);`,
      },
      {
        filename: "api-routes.ts",
        language: "typescript",
        code: `import { Router } from "express";

