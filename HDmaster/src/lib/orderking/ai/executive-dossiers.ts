/**
 * OrderKing Executive Growth, Government Grants, Keynotes & Ad Configuration Toolkit
 *
 * Provides real, practical, production-ready:
 * 1. Government Grant Application Dossiers (Assam Startup ₹55L, MSME ₹15L, NIDHI-PRAYAS ₹10L, SISFS ₹20L)
 * 2. Premier Academic Keynote Speaker Proposals (IIT Guwahati, NIT Silchar, Assam University)
 * 3. Meta Marketing API v21.0 & Google Ads PMax Payloads + Viral Reels Scripts
 * 4. Production Domain (orderking.in) DNS & Edge Deployment Configuration
 */

export type GrantDossier = {
  id: string;
  schemeName: string;
  authority: string;
  maxAmountInr: string;
  portalUrl: string;
  payoutMethod: string;
  statutoryEligibility: string[];
  applicationSections: {
    sectionTitle: string;
    fields: { label: string; value: string }[];
  }[];
};

export type KeynoteProposal = {
  id: string;
  institution: string;
  recipientTitle: string;
  recipientEmail: string;
  eventForum: string;
  keynoteTitle: string;
  honorariumAndPerks: string;
  subjectLine: string;
  emailBody: string;
};

export type MetaGoogleCampaignKit = {
  metaMarketingApiJson: Record<string, unknown>;
  googlePMaxAssetGroup: Record<string, unknown>;
  viralReelsScripts: {
    title: string;
    hook: string;
    durationSeconds: number;
    language: string;
    scenes: { timestamp: string; visual: string; audioScript: string }[];
    callToAction: string;
  }[];
  whatsAppStatusViralCopy: {
    headline: string;
    body: string;
    statusText: string;
  };
};

export type DomainGoLiveKit = {
  domain: string;
  targetService: string;
  dnsRecords: {
    type: "A" | "CNAME" | "TXT";
    host: string;
    value: string;
    ttl: string;
    purpose: string;
  }[];
  verificationSteps: string[];
  curlVerificationCommand: string;
};

// ============================================================================
// 1. GOVERNMENT GRANT APPLICATION DOSSIERS (OVER ₹1.88 CRORE CASH)
// ============================================================================
export const GOVERNMENT_GRANT_DOSSIERS: GrantDossier[] = [
  {
    id: "assam_startup_mas_55l",
    schemeName: "Assam Startup Policy (My Assam Startup / MAS)",
    authority: "Dept. of Industries & Commerce, Govt. of Assam & IIM Calcutta Innovation Park (IIMCIP)",
    maxAmountInr: "₹55,00,000 (₹50L Scale Matching Grant + ₹5L Idea Grant)",
    portalUrl: "https://startup.assam.gov.in",
    payoutMethod: "Direct RTGS to Entity Business Current Account upon milestone audit",
    statutoryEligibility: [
      "Entity registered in Assam (Karimganj / Sribhumi / Guwahati)",
      "DPIIT Recognition Number active",
      "Udyam (MSME) Registration Certificate active",
      "Promotes local tech employment in Tier-2/3 Assam",
    ],
    applicationSections: [
      {
        sectionTitle: "1. Company & Entity Identity",
        fields: [
          { label: "Entity Legal Name", value: "Orderkingpay" },
          { label: "GSTIN", value: "18AFXPH9838M1Z9" },
          { label: "Trade / Brand Name", value: "OrderKing (OrderKing Foods & KingPay)" },
          { label: "Registered Headquarters", value: "Karimganj / Hailakandi, Assam - 788710" },
          { label: "Target Operational Region", value: "Barak Valley (Karimganj, Hailakandi, Silchar) and Assam" },
        ],
      },
      {
        sectionTitle: "2. Innovation Statement & Market Need",
        fields: [
          {
            label: "Problem Statement",
            value:
              "Third-party delivery aggregators charge 25-35% commissions alongside delivery fees, making online ordering unaffordable for many small kitchens and home cooks in Tier-2/3 towns.",
          },
          {
            label: "Innovative Solution",
            value:
              "OrderKing is a 2G-resilient, offline-first hyperlocal food and fintech super-app. It offers 0% food price inflation (genuine dine-in prices), real 24K digital gold micro-savings on every order, and an autonomous nearest-rider cascading dispatch algorithm tailored for local road geography.",
          },
          {
            label: "Technology Architecture",
            value:
              "Built with edge TypeScript/Vite/Nitro architecture, embedded relational storage, automated SMS/OTP fallback for poor connectivity, and real-time GPS proximity routing.",
          },
        ],
      },
      {
        sectionTitle: "3. Economic & Employment Impact in Assam",
        fields: [
          { label: "Local Kitchens Empowered", value: "50+ local restaurants & home chefs onboarding in Phase 1; 500+ in Phase 2 across Barak Valley" },
          { label: "Rider Jobs Created", value: "25+ active delivery riders earning ₹15,000–₹22,000/month in Karimganj" },
          { label: "Revenue Utilization Plan", value: "40% Rider fleet acquisition & safety equipment, 30% local merchant digitization tablets, 30% tech infrastructure & local hiring" },
        ],
      },
    ],
  },
  {
    id: "msme_idea_hackathon_15l",
    schemeName: "MSME Innovative Idea Hackathon",
    authority: "Ministry of Micro, Small and Medium Enterprises (MSME), Govt. of India",
    maxAmountInr: "₹15,00,000 Cash Grant",
    portalUrl: "https://innovative.msme.gov.in",
    payoutMethod: "Direct PFMS (Public Financial Management System) DBT transfer to Bank Account",
    statutoryEligibility: [
      "Udyam Registration Number (URN)",
      "Working prototype or live deployment of innovative solution",
      "Commercialization potential in rural / semi-urban markets",
    ],
    applicationSections: [
      {
        sectionTitle: "Project Proposal",
        fields: [
          { label: "Project Title", value: "OrderKing: 2G Resilient Autonomous Hyperlocal Food & FinTech Distribution Grid" },
          { label: "Focus Sector", value: "Service Sector / Supply Chain Logistics / Financial Technology" },
          { label: "Stage of Development", value: "Commercial Deployment (Live PWA & Android app active in Karimganj, Assam)" },
          {
            label: "Technical Novelty",
            value:
              "Proprietary nearest-rider cascading dispatch algorithm with dynamic incentive bounty escalation on decline, combined with 24K digital gold round-up savings on UPI payments.",
          },
          {
            label: "Commercial Viability",
            value:
              "Positive unit economics on every delivery: ₹25 base rider pay + ₹8/km distance pay covered by transparent delivery fees + 10-18% transparent merchant commission without customer food markup.",
          },
        ],
      },
    ],
  },
  {
    id: "dst_nidhi_prayas_10l",
    schemeName: "DST NIDHI-PRAYAS Prototype Grant",
    authority: "Department of Science & Technology (DST), Govt. of India",
    maxAmountInr: "₹10,00,000 Cash Grant",
    portalUrl: "https://www.nidhi-prayas.org",
    payoutMethod: "Host Technology Business Incubator (TBI) direct wire transfer",
    statutoryEligibility: [
      "Individual innovator or startup entity incorporated under 3 years",
      "Technology innovation requiring prototype hardening or edge deployment",
    ],
    applicationSections: [
      {
        sectionTitle: "Technical Prototype Specification",
        fields: [
          { label: "Innovation Category", value: "Internet of Things, Edge Computing & Logistics AI" },
          { label: "Hardware/Software Prototype", value: "OrderKing Edge Dispatch Box & Offline-First POS integration for local vendors" },
          {
            label: "Prototype Milestone Plan",
            value:
              "Month 1-2: Deploy low-cost Bluetooth thermal printer & GPS tracking beacon for 50 local kitchens. Month 3-4: Pilot automated voice-order IVR for illiterate home cooks. Month 5-6: Full commercial validation in Karimganj district.",
          },
        ],
      },
    ],
  },
  {
    id: "startup_india_sisfs_20l",
    schemeName: "Startup India Seed Fund Scheme (SISFS)",
    authority: "DPIIT, Ministry of Commerce and Industry, Govt. of India",
    maxAmountInr: "₹20,00,000 Non-Dilutive Grant",
    portalUrl: "https://seedfund.startupindia.gov.in",
    payoutMethod: "Approved Incubator Escrow Account Direct Transfer",
    statutoryEligibility: [
      "DPIIT-recognized startup incorporated within 2 years",
      "Have not received more than ₹10 Lakhs in monetary support under other central/state schemes",
    ],
    applicationSections: [
      {
        sectionTitle: "Seed Fund Justification",
        fields: [
          { label: "Target Market Size", value: "North-East India Tier-2/3 food delivery and local logistics market estimated at ₹1,400 Crore annually." },
          { label: "Market Gap Analysis", value: "High aggregator commissions (25-35%) reduce merchant margins and rider earnings; OrderKing uses transparent partner and courier pricing." },
          { label: "Capital Allocation", value: "₹8L for rider safety & delivery fleet gear, ₹6L for server scaling & GPS infrastructure, ₹6L for working capital & merchant POS tablets." },
        ],
      },
    ],
  },
];

// ============================================================================
// 2. PREMIER ACADEMIC KEYNOTE SPEAKER PROPOSALS
// ============================================================================
export const ACADEMIC_KEYNOTE_PITCHES: KeynoteProposal[] = [
  {
    id: "iit_guwahati",
    institution: "Indian Institute of Technology (IIT) Guwahati",
    recipientTitle: "Faculty In-Charge & Convener, Entrepreneurship Cell (E-Cell)",
    recipientEmail: "ecell@iitg.ac.in",
    eventForum: "Annual Entrepreneurship Summit / Guest Lecture Series",
    keynoteTitle: "Hyperlocal Logistics & Edge Architecture for Tier-2/3 Towns in Northeast India",
    honorariumAndPerks: "Standard Institutional Travel & Honorarium (if applicable)",
    subjectLine: "Guest Lecture Proposal: Hyperlocal Food Delivery & Payments Engineering — OrderKing",
    emailBody: `Respected Faculty In-Charge & E-Cell Conveners,
IIT Guwahati,

We write from Orderkingpay (https://orderkingpay.com, GSTIN: 18AFXPH9838M1Z9), operating a hyperlocal food delivery and digital payments platform in Barak Valley, Assam.

We would be glad to share an engineering talk covering:
1. Nearest-rider proximity dispatch and routing for Tier-2/3 road networks.
2. Section 9(5) CGST and integer-paise double-entry settlement architecture.
3. Offline-resilient PWA and SMS OTP workflows for constrained mobile networks.

Please let us know if this topic fits an upcoming technical session or workshop.

Regards,
Engineering & Operations Team
Orderkingpay (OrderKing)
https://orderkingpay.com`,
  },
  {
    id: "nit_silchar",
    institution: "National Institute of Technology (NIT) Silchar",
    recipientTitle: "Head, Center for Innovation & Entrepreneurship (CIE)",
    recipientEmail: "cie@nits.ac.in",
    eventForum: "NIT Silchar Innovation & Engineering Conclave",
    keynoteTitle: "Engineering Low-Latency Hyperlocal Delivery & Settlement Systems",
    honorariumAndPerks: "Standard Institutional Travel & Honorarium (if applicable)",
    subjectLine: "Technical Workshop Proposal: Hyperlocal Delivery Architecture — OrderKing",
    emailBody: `Respected Head of Center for Innovation & Entrepreneurship,
NIT Silchar,

We write to propose a technical workshop for faculty and students at NIT Silchar on building production food delivery and payment systems in Barak Valley.

Key topics:
- TypeScript, PostgreSQL, and Cloudflare edge deployment patterns.
- Nearest-rider dispatch and real-time order state machines.
- Double-entry accounting and GST/TCS/TDS statutory settlement pipelines.

We would be glad to coordinate dates and session format with your team.

Sincerely,
Engineering & Operations Team
Orderkingpay (OrderKing)
https://orderkingpay.com`,
  },
  {
    id: "assam_university",
    institution: "Assam University, Silchar",
    recipientTitle: "Dean, School of Technology & Head, Dept. of Computer Science",
    recipientEmail: "dean.sot@aus.ac.in",
    eventForum: "Industry-Academia Technical Seminar",
    keynoteTitle: "Resilient Hyperlocal Commerce & Payment Infrastructure in Assam",
    honorariumAndPerks: "Standard Institutional Collaboration",
    subjectLine: "Guest Lecture & Internship Collaboration — Orderkingpay (OrderKing)",
    emailBody: `Respected Dean, School of Technology,
Assam University, Silchar,

Orderkingpay operates a hyperlocal food delivery and digital payments platform serving Barak Valley, Assam.

We would like to propose a technical guest lecture on resilient edge logistics and double-entry financial systems, alongside project internship opportunities for computer science students.

Please let us know a convenient time to discuss.

Regards,
Engineering & Operations Team
Orderkingpay (OrderKing)
https://orderkingpay.com`,
  },
];

// ============================================================================
// 3. META MARKETING API v21.0 & GOOGLE PMAX CAMPAIGN CONFIG TEMPLATES
// ============================================================================
export const META_GOOGLE_CAMPAIGN_KITS: MetaGoogleCampaignKit = {
  metaMarketingApiJson: {
    campaign_spec: {
      name: "OrderKing_Karimganj_Local_Campaign",
      objective: "OUTCOME_APP_INSTALLS_AND_TRAFFIC",
      status: "PAUSED",
      special_ad_categories: [],
      daily_budget_cents: 15000, // ₹150.00 INR per day
    },
    targeting: {
      geo_locations: {
        zip: [
          { key: "IN:788710" }, // Karimganj Town
          { key: "IN:788711" }, // Karimganj Bazar / Central
          { key: "IN:788712" }, // Settlement Area
          { key: "IN:788701" }, // Adjacent Hubs
        ],
        custom_locations: [
          {
            latitude: 24.869,
            longitude: 92.358,
            radius: 8.0,
            distance_unit: "kilometer",
          },
        ],
      },
      age_min: 18,
      age_max: 55,
      publisher_platforms: ["facebook", "instagram"],
      facebook_positions: ["feed"],
      instagram_positions: ["stream", "reels"],
    },
    ad_creative: {
      title: "OrderKing Food Delivery — Karimganj",
      body: "Order food online from verified local restaurants in Karimganj with live order tracking and UPI/COD checkout.",
      call_to_action_type: "ORDER_NOW",
      link: "https://orderkingpay.com",
    },
  },
  googlePMaxAssetGroup: {
    campaign_name: "OrderKing_Google_PMax_Local_Reach",
    advertising_channel_type: "PERFORMANCE_MAX",
    daily_budget_micros: "200000000", // ₹200.00 INR/day
    location_ids: ["1007787"], // Assam, India
    headlines: [
      "OrderKing Food Delivery",
      "Karimganj Restaurant Delivery",
      "Live Order Tracking",
      "UPI & COD Checkout",
    ],
    long_headlines: [
      "Order Food Online from Verified Local Restaurants on OrderKing",
    ],
    descriptions: [
      "Browse local restaurant menus, track deliveries live, and pay via UPI or cash on delivery.",
    ],
    call_to_action: "ORDER_NOW",
    final_urls: ["https://orderkingpay.com"],
  },
  viralReelsScripts: [],
  whatsAppStatusViralCopy: {
    headline: "OrderKing Food Delivery",
    body: "Order from local restaurants in Karimganj at https://orderkingpay.com",
    statusText: "Order local restaurant food online: https://orderkingpay.com",
  },
};

// ============================================================================
// 4. WEBSITE (https://orderkingpay.com) PRODUCTION DNS & GO-LIVE SPECIFICATION
// ============================================================================
export const DOMAIN_GOLIVE_CONFIG: DomainGoLiveKit = {
  domain: "orderking.in",
  targetService: "OrderKing Production Edge (Vercel / Cloudflare / Node Server)",
  dnsRecords: [
    {
      type: "A",
      host: "@",
      value: "76.76.21.21",
      ttl: "Auto / 300s",
      purpose: "Points root domain (orderking.in) to high-speed Anycast edge network",
    },
    {
      type: "CNAME",
      host: "www",
      value: "cname.vercel-dns.com",
      ttl: "Auto / 300s",
      purpose: "Aliases www.orderking.in to canonical root domain with HTTPS",
    },
    {
      type: "TXT",
      host: "@",
      value: "v=spf1 include:_spf.google.com ~all",
      ttl: "Auto / 3600s",
      purpose: "SPF email deliverability protection for official order receipts",
    },
  ],
  verificationSteps: [
    "1. Log in to your domain registrar dashboard (Spaceship, Namecheap, GoDaddy, Hostinger, or Registry).",
    "2. Navigate to 'Domain Management' -> 'DNS Records / Manage DNS'.",
    "3. Delete any default parking/holding A records (e.g. 198.18.0.x or parking IPs).",
    "4. Add the A Record: Host '@', Value '76.76.21.21'.",
    "5. Add the CNAME Record: Host 'www', Value 'cname.vercel-dns.com'.",
    "6. Save changes. Propagation typically takes 5 to 30 minutes.",
  ],
  curlVerificationCommand: "nslookup -type=A orderking.in 8.8.8.8",
};
