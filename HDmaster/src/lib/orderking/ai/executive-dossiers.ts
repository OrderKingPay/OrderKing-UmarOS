/**
 * OrderKing Executive Growth, Government Grants, Keynotes & 100,000x Ad Domination Toolkit
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
        sectionTitle: "1. Company & Founder Identity",
        fields: [
          { label: "Entity Legal Name", value: "OrderKing Technologies Private Limited" },
          { label: "Trade / Brand Name", value: "OrderKing (OrderKing Foods & KingPay)" },
          { label: "Founder / Managing Director", value: "Hasan (Founder & Chief Architect)" },
          { label: "Registered Headquarters", value: "Karimganj Town, District: Sribhumi / Karimganj, Assam - 788710" },
          { label: "Target Operational Region", value: "Barak Valley (Karimganj, Hailakandi, Silchar) expanding across Assam" },
        ],
      },
      {
        sectionTitle: "2. Innovation Statement & Market Need",
        fields: [
          {
            label: "Problem Statement",
            value:
              "Multinational delivery aggregators (Zomato/Swiggy) impose 25-35% commission markups on local small restaurants, while charging customers high delivery fees. In Tier-2/3 towns of Assam like Karimganj, small dhabas and home kitchens cannot afford these markups, causing 80% to remain offline.",
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
          { label: "Direct Competitor Analysis", value: "Zomato and Swiggy suffer from high delivery partner churn (due to low pay) and merchant rebellion (due to 30% cuts). OrderKing solves both with fair pay and 0% markup." },
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
    eventForum: "Udgam Annual Entrepreneurship Summit / Keynote Lecture Series",
    keynoteTitle: "Rural-First Hyperlocal Logistics & Autonomous AI Dispatch in Tier-2/3 India",
    honorariumAndPerks: "₹50,000 Honorarium + Campus Citation, Plaque & VIP Guest Accommodation",
    subjectLine: "Keynote Lecture Proposal: Rural-First Hyperlocal AI Logistics by OrderKing Founder (Hasan)",
    emailBody: `Respected Faculty In-Charge & E-Cell Conveners,
IIT Guwahati,

I hope this email finds you well.

My name is Hasan, Founder and Chief Architect of OrderKing (https://orderking.in), an autonomous hyperlocal food and fintech super-app operating out of Karimganj / Barak Valley, Assam.

While decacorn aggregators focus exclusively on metro tier-1 hubs, we have engineered an offline-resilient, 2G-tolerant logistics and dispatch network that solves the deep challenges of Tier-2 and Tier-3 Northeast India:
1. Algorithmic Nearest-Rider Cascading Dispatch that eliminates deadhead mileage on unpaved roads.
2. 0% Food Price Inflation preserving local small restaurant margins.
3. 24K Digital Gold round-up savings embedded directly into UPI micro-transactions.

I would be honored to deliver an interactive Keynote Session at IIT Guwahati's upcoming Udgam Summit on the topic:
"Rural-First Hyperlocal Logistics & Autonomous AI Dispatch: Bootstrapping Scalable Deep-Tech in Northeast India".

We would also be delighted to demonstrate our live production system, share architectural learnings on low-latency edge systems, and offer summer internship / project opportunities to talented IIT Guwahati students.

Looking forward to your favorable response.

Warm regards,

Hasan
Founder & Chief Architect, OrderKing Technologies
Website: https://orderking.in
Karimganj / Sribhumi, Assam`,
  },
  {
    id: "nit_silchar",
    institution: "National Institute of Technology (NIT) Silchar",
    recipientTitle: "Head, Center for Innovation & Entrepreneurship (CIE)",
    recipientEmail: "cie@nits.ac.in",
    eventForum: "NIT Silchar Innovation & Startup Conclave",
    keynoteTitle: "Overthrowing Bloatware: How Localized Tech Beats Multinational Monopolies",
    honorariumAndPerks: "₹35,00,000 / ₹35,000 Honorarium + VIP Tech Memento & State Felicitation",
    subjectLine: "Keynote Proposal & Barak Valley Tech Spotlight: OrderKing Founder Hasan at NIT Silchar",
    emailBody: `Respected Head of Center for Innovation & Entrepreneurship,
NIT Silchar,

Greetings from Karimganj.

I am writing to propose a Keynote Address and Technical Workshop for the faculty and students of NIT Silchar.

As a homegrown tech venture originating right here in Barak Valley, OrderKing (https://orderking.in) has built a world-class, ultra-fast delivery and micro-payments platform that is outperforming national legacy apps in local delivery speed, driver retention, and merchant profitability.

Topic: "Overthrowing Bloatware: How Localized Tech Beats Multinational Monopolies in Tier-2/3 Markets"
Key Takeaways for Students:
- How to design sub-100ms distributed architectures using TypeScript, Nitro, and edge databases.
- Solving the "cold start" logistics problem with algorithmic proximity dispatch.
- Why building for Bharat (Barak Valley & Northeast) is India's next ₹10,000 Crore opportunity.

We would be glad to coordinate with your team for the date and session logistics.

Sincerely,

Hasan
Founder & Chief Architect, OrderKing
Website: https://orderking.in`,
  },
  {
    id: "assam_university",
    institution: "Assam University, Silchar",
    recipientTitle: "Dean, School of Technology & Head, Dept. of Computer Science",
    recipientEmail: "dean.sot@aus.ac.in",
    eventForum: "State Tech Conclave & Industry-Academia MoU",
    keynoteTitle: "Zero-Loss Economics: 2G Resilient FinTech & Hyperlocal Order Infrastructure",
    honorariumAndPerks: "University Citation, Felicitation Plaque & Official Honorarium",
    subjectLine: "Guest Lecture & Industry MoU: OrderKing Hyperlocal Super-App Founder Hasan",
    emailBody: `Respected Dean, School of Technology,
Assam University, Silchar,

It is a privilege to connect with you.

OrderKing is a Barak Valley-founded technology platform dedicated to revolutionizing local commerce, food distribution, and micro-savings across Assam. 

We would like to propose:
1. A Keynote Guest Lecture on "Zero-Loss Economics: 2G Resilient FinTech & Hyperlocal Order Infrastructure".
2. An institutional collaboration / MoU providing live project internships in cloud computing, GPS logistics, and frontend engineering for Assam University students.

Please let us know your available time window for an exploratory discussion.

Warm regards,

Hasan
Founder & Chief Architect, OrderKing Technologies
https://orderking.in`,
  },
];

// ============================================================================
// 3. META MARKETING API v21.0 & GOOGLE PMAX DOMINATION PAYLOADS
// ============================================================================
export const META_GOOGLE_CAMPAIGN_KITS: MetaGoogleCampaignKit = {
  metaMarketingApiJson: {
    campaign_spec: {
      name: "OrderKing_100000x_Karimganj_Domination",
      objective: "OUTCOME_APP_INSTALLS_AND_TRAFFIC",
      status: "ACTIVE",
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
      publisher_platforms: ["facebook", "instagram", "audience_network", "messenger"],
      facebook_positions: ["feed", "story"],
      instagram_positions: ["stream", "story", "reels"],
    },
    ad_creative: {
      title: "OrderKing — Karimganj's Food Super-App 👑",
      body: "🔥 Zero Markup on Food! Enjoy delicious Mutton Biryani, Fish Thali & Momos at exact restaurant prices + Win Real 24K Digital Gold on every order! Tap to Order Now.",
      call_to_action_type: "ORDER_NOW",
      link: "https://orderking.in",
    },
  },
  googlePMaxAssetGroup: {
    campaign_name: "OrderKing_Google_PMax_Local_Domination",
    advertising_channel_type: "PERFORMANCE_MAX",
    daily_budget_micros: "200000000", // ₹200.00 INR/day
    location_ids: ["1007787"], // Assam, India
    headlines: [
      "OrderKing Food Delivery",
      "0% Markup on Food",
      "Karimganj Local Super-App",
      "Hot Biryani in 20 Mins",
      "Win 24K Gold Every Order",
    ],
    long_headlines: [
      "Order Food at Dine-in Prices in Karimganj on OrderKing",
      "Karimganj's Fastest Food Delivery & Utility Bill App",
    ],
    descriptions: [
      "Order royal dum biryani, homestyle thalis and snacks with zero price inflation. 20-min delivery.",
      "Support local Karimganj restaurants. Pay dine-in prices and earn real 24K gold rewards.",
    ],
    call_to_action: "ORDER_NOW",
    final_urls: ["https://orderking.in"],
  },
  viralReelsScripts: [
    {
      title: "Reel 1: The 'Zomato Price Trap' Revelation (Bengali / English)",
      hook: "Did you know you are paying ₹100 extra on every single food order in Karimganj?! 😱",
      durationSeconds: 30,
      language: "Bengali & English",
      scenes: [
        {
          timestamp: "0:00 - 0:05",
          visual: "Creator holds two phones showing same restaurant menu: Zomato at ₹320 vs OrderKing at ₹220.",
          audioScript: "Stop! If you order food online in Karimganj, check this out right now.",
        },
        {
          timestamp: "0:05 - 0:15",
          visual: "Zoom into screen comparison showing 0% markup and exact dine-in rates on OrderKing.",
          audioScript: "Zomato charges ₹320 for the exact same Biryani, but OrderKing gives it to you for ₹220 — original restaurant price!",
        },
        {
          timestamp: "0:15 - 0:25",
          visual: "Customer scratches digital scratch card on OrderKing app, showing 'Won 10mg 24K Gold'.",
          audioScript: "Plus, on every single order, you get a digital scratch card with REAL 24K Gold rewards!",
        },
        {
          timestamp: "0:25 - 0:30",
          visual: "Tap 'Order Now' button pointing to https://orderking.in with OrderKing crown logo.",
          audioScript: "Order like a King. Open orderking.in right now and get free delivery on your first order!",
        },
      ],
      callToAction: "Click the link below or visit orderking.in to order now!",
    },
    {
      title: "Reel 2: The 20-Minute Hot Food Challenge",
      hook: "Can we get piping hot Dum Biryani delivered to Central Bazaar in under 20 minutes? ⏱️🔥",
      durationSeconds: 28,
      language: "Bengali & Hindi",
      scenes: [
        {
          timestamp: "0:00 - 0:04",
          visual: "Creator starts stopwatch on phone and taps 1-Click Order on OrderKing.",
          audioScript: "Order placed on OrderKing! Timer starts now.",
        },
        {
          timestamp: "0:04 - 0:18",
          visual: "Split screen: Kitchen packing handi biryani + OrderKing rider picking up via nearest-rider dispatch.",
          audioScript: "Our rider is already at the restaurant because OrderKing uses nearest-rider smart GPS dispatch!",
        },
        {
          timestamp: "0:18 - 0:28",
          visual: "Rider arrives at doorstep. Steam comes out of biryani handi. Stopwatch reads 17 mins 42 secs.",
          audioScript: "17 minutes! Piping hot and steaming. Stop waiting 50 minutes — switch to OrderKing!",
        },
      ],
      callToAction: "Order hot & fast at orderking.in!",
    },
    {
      title: "Reel 3: Supporting Local Karimganj Home Kitchens",
      hook: "Meet the mother whose handmade fish thalis are taking Karimganj by storm! 🐟❤️",
      durationSeconds: 35,
      language: "Bengali",
      scenes: [
        {
          timestamp: "0:00 - 0:08",
          visual: "Authentic home kitchen in Karimganj cooking traditional Rohu mustard fish curry.",
          audioScript: "This is Rina Aunty. She makes the most delicious homestyle fish thali in Karimganj.",
        },
        {
          timestamp: "0:08 - 0:20",
          visual: "She holds OrderKing partner tablet, receiving orders seamlessly with 0% extra customer fee.",
          audioScript: "Big apps charged her 30% commission, but OrderKing empowered her to start her online kitchen with zero hassles.",
        },
        {
          timestamp: "0:20 - 0:35",
          visual: "Customer enjoying the thali with family. OrderKing app shown on phone.",
          audioScript: "Support our local mothers and home cooks. Eat fresh, homestyle food every day on OrderKing.",
        },
      ],
      callToAction: "Support local kitchens at orderking.in",
    },
  ],
  whatsAppStatusViralCopy: {
    headline: "👑 Just won 10mg Real 24K Gold on OrderKing! 🪙",
    body: "I just ordered hot Dum Biryani from Karimganj Kitchen at exact restaurant price (no Zomato markups) and scratched my King Reward to win 24K Gold! Order yours now: https://orderking.in",
    statusText: "Ordered on OrderKing 👑 Got exact restaurant price + won 24K Gold! Check it out: https://orderking.in",
  },
};

// ============================================================================
// 4. WEBSITE (https://orderking.in) PRODUCTION DNS & GO-LIVE SPECIFICATION
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
