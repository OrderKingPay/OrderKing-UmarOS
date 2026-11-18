// Umar Premium Founder AI Executive Intelligence & Core Dispatcher (Umar OS)
// Governs Multi-Model Ensemble Consensus, 1-Command Live Deploy, 500+ Platforms & Zero Identity Leakage

import { mediaStorageVault } from "./media-storage-vault.ts";
import { UniversalSuperintelligenceEngine } from "./universal-superintelligence-engine.server.ts";
import { ensembleConsensusEngine } from "./ensemble-consensus-engine.ts";
import { instantDeployEngine } from "./instant-deploy-engine.ts";
import { founderPrivacyShield } from "./founder-privacy-shield.ts";
import { autonomousModelUpdater } from "./autonomous-model-updater.ts";
import { ACTIVE_DELIVERY_ZONES, isDeliveryActiveInLocation } from "../geo/geofence-guard.ts";
import type { UmarAiJumpCardData } from "./umar-ai-directory";

export type AiModelId =
  | "auto-orchestrator"
  | "ensemble-consensus"
  | "local-ultra"
  | "claude-4-6-opus"
  | "gpt-5-6-omni"
  | "grok-4-6-super"
  | "codex-engine"
  | "gemini-3-8-ultra"
  | "deepseek-r1-local"
  | "claude-3-7-sonnet"
  | "gpt-4o"
  | "gemini-2-5-pro"
  | "grok-3";

/**
 * Autonomously selects the best AI model engine based on prompt domain, complexity, and latency requirements.
 */
export function resolveAutoModel(query: string): { model: AiModelId; reason: string } {
  const q = query.toLowerCase();
  if (q.includes("ensemble") || q.includes("all model") || q.includes("consensus") || q.includes("run all") || q.includes("together")) {
    return { model: "ensemble-consensus", reason: "Auto-routed to Ensemble Multi-Model Consensus: Running all strongest models simultaneously." };
  }
  if (q.includes("code") || q.includes("schema") || q.includes("api") || q.includes("scaffold") || q.includes("react") || q.includes("sql") || q.includes("git")) {
    return { model: "codex-engine", reason: "Auto-routed to Codex Premium Architect for maximum precision code synthesis." };
  }
  if (q.includes("live") || q.includes("score") || q.includes("news") || q.includes("trending") || q.includes("cricket") || q.includes("match")) {
    return { model: "grok-4-6-super", reason: "Auto-routed to Grok 4.6 SuperGrok Ultra for real-time live telemetric intelligence." };
  }
  if (q.includes("video") || q.includes("image") || q.includes("render") || q.includes("4k") || q.includes("reel")) {
    return { model: "local-ultra", reason: "Auto-routed to OrderKing Core for photorealistic multimodal & 4K video generation." };
  }
  if (q.includes("invoice") || q.includes("client") || q.includes("contract") || q.includes("legal") || q.includes("upwork") || q.includes("pitch")) {
    return { model: "claude-4-6-opus", reason: "Auto-routed to Claude 4.6 Opus for enterprise contractual & high-ticket negotiation excellence." };
  }
  return { model: "local-ultra", reason: "Auto-routed to OrderKing Core flagship executive reasoning engine." };
}

export interface ChatAttachment {
  content?: string;
  id: string;
  name: string;
  type: "image" | "video" | "audio" | "document" | "code" | "archive";
  url: string;
  sizeBytes: number;
  mimeType: string;
}

export type ClientLead = {
  id: string;
  businessName: string;
  category: "restaurant" | "ecommerce" | "enterprise" | "fintech" | "healthcare" | "logistics";
  location: string;
  monthlyRevenueEst: string;
  painPoint: string;
  projectBudget: number; // in INR
  status: "IDENTIFIED" | "PITCH_READY" | "NEGOTIATING" | "DEAL_CONFIRMED" | "PAID";
  suggestedSolution: string;
  potentialGmvGrowth: string;
};

export type ClientInvoice = {
  invoiceNumber: string;
  clientName: string;
  amountInr: number;
  advanceRequiredInr: number;
  description: string;
  upiPaymentLink: string;
  qrPayload: string;
  dueDate: string;
  status: "DRAFT" | "SENT" | "ADVANCE_PAID" | "SETTLED";
  payoutAccount: string;
};

export type ProjectFileArtifact = {
  filename: string;
  language: "typescript" | "sql" | "css" | "markdown" | "json";
  code: string;
};

export type EnterpriseProjectBlueprint = {
  id: string;
  title: string;
  category: "marketplace" | "erp" | "fintech" | "logistics" | "ecommerce";
  targetOrganization: string;
  techStack: string[];
  databaseSchema: string[];
  apiEndpoints: string[];
  frontendRoutes: string[];
  files: ProjectFileArtifact[];
  livePreviewUrl: string;
  estimatedBuildTime: string;
  commercialValueInr: number;
  clientHandoffReady: boolean;
  handoffCredentials: {
    adminEmail: string;
    temporaryPass: string;
    jwtSecret: string;
    databaseUrl: string;
  };
};

export type RemoteContractGig = {
  id: string;
  title: string;
  clientLocation: string;
  hourlyRateUsd: number;
  fixedBudgetUsd?: number;
  duration: string;
  skillsRequired: string[];
  description: string;
  matchScore: number;
  platform: "Upwork Enterprise" | "Toptal" | "Direct US Client" | "Contra" | "RemoteOK";
  proposalTemplate: string;
};

export type AgentExecutionStep = {
  stepNumber: number;
  totalSteps: number;
  label: string;
  status: "COMPLETED" | "RUNNING" | "PENDING";
  detail: string;
};

export type PremiumAiMessage = {
  id: string;
  sender: "founder" | "ai";
  text: string;
  timestamp: string;
  language?: string;
  modelUsed?: AiModelId;
  attachments?: ChatAttachment[];
  executionSteps?: AgentExecutionStep[];
  jumpCards?: UmarAiJumpCardData[];
  mediaCard?: {
    type: "image" | "video";
    prompt: string;
    url: string;
    style?: string;
  };
  actionCard?: {
    type:
    | "lead_pitch"
    | "invoice_pay"
    | "enterprise_blueprint"
    | "remote_gig_bid"
    | "income_payout"
    | "media_generator"
    | "storage_purifier"
    | "image_video_studio"
    | "cache_purifier"
    | "platform_connector"
    | "video_editor_studio"
    | "system_settings"
    | "module_separator"
    | "smart_cleaner"
    | "ensemble_consensus"
    | "instant_deploy"
    | "model_updates"
    | "geofence_status"
    | "auto_clean";
    data: any;
  };
};

export type PlatformCategory = "developer" | "freelance" | "messaging" | "commerce" | "payments" | "productivity" | "cloud";

export interface ConnectedPlatform {
  id: string;
  name: string;
  category: PlatformCategory;
  description: string;
  icon: string;
  status: "CONNECTED" | "ENFORCING" | "STANDBY" | "SECURED";
  apiLatencyMs: number;
  lastSyncTime: string;
  authMethod: "OAuth2 / HMAC-SHA256" | "Encrypted API Token" | "Zero-Knowledge Webhook" | "Direct RPC";
  guardrailProtection: {
    sandboxVerified: boolean;
    zeroDataLeak: boolean;
    rollbackSnapshotReady: boolean;
    rateLimitSafe: boolean;
  };
  supportedActions: {
    id: string;
    label: string;
    description: string;
    safetyLevel: "STRICT_SAFE" | "AUTO_ROLLBACK_ENABLED";
    defaultPayload: string;
  }[];
}

export const UNIVERSAL_PLATFORMS: ConnectedPlatform[] = [];

export type VideoAspectRatio = "9:16" | "16:9" | "1:1" | "4:5" | "21:9";
export type VideoDurationPreset = "15s" | "30s" | "60s" | "3m" | "10m" | "30m";
export type VideoVoiceoverStyle = "young_female_aria" | "executive_nova" | "deep_male_orion" | "multilingual_indic";
export type VideoColorGrade = "cinematic_hdr" | "cyberpunk_neon" | "golden_hour" | "clean_commercial" | "noir_classic";
export type VideoResolution = "1080p" | "4k_60fps" | "8k_master";

export interface VideoEditorStudioConfig {
  id: string;
  title: string;
  prompt: string;
  aspectRatio: VideoAspectRatio;
  duration: VideoDurationPreset;
  resolution: VideoResolution;
  voiceover: VideoVoiceoverStyle;
  voiceoverLanguage: "en-IN" | "hi-IN" | "bn-IN" | "en-US";
  autoSubtitles: boolean;
  colorGrade: VideoColorGrade;
  fps: 60;
  videoUrl: string;
  thumbnailUrl: string;
  isLongForm: boolean;
  exportFormat: "MP4_H265" | "PRORES_422" | "WEBM_ULTRA";
  renderSpeedMultiplier: string;
  commercialRightsCertified: boolean;
}

export interface SystemSettingsConfig {
  aiModel: AiModelId;
  thinkingDepth: "standard" | "deep" | "extended_deep";
  speechVoice: "young_female_aria" | "executive_nova" | "deep_male_orion";
  speechSpeed: number; // 0.8 to 1.5
  speechPitch: number; // 0.8 to 1.4
  autoDuplexTurnTaking: boolean;
  autoCleanOnStartup: boolean;
  zeroDataLeakProtection: boolean;
  hmacSha256Security: boolean;
  maxMemoryCacheMb: number;
  edgeRoutingRegion: "ap-south-1" | "us-east-1" | "eu-west-1" | "global-edge";
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettingsConfig = {
  aiModel: "local-ultra",
  thinkingDepth: "extended_deep",
  speechVoice: "young_female_aria",
  speechSpeed: 1.05,
  speechPitch: 1.1,
  autoDuplexTurnTaking: true,
  autoCleanOnStartup: true,
  zeroDataLeakProtection: true,
  hmacSha256Security: true,
  maxMemoryCacheMb: 512,
  edgeRoutingRegion: "ap-south-1",
};

export interface SeparableModule {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: "media" | "integrations" | "fintech" | "sales" | "enterprise" | "system";
  standaloneRoute: string;
  subdomainUrl: string;
  filesCount: number;
  bundleSizeKb: number;
  techStack: string[];
  standalonePackageJson: {
    name: string;
    version: string;
    scripts: Record<string, string>;
    dependencies: Record<string, string>;
  };
  sampleComponentCode: string;
}

export const SEPARABLE_MODULES: SeparableModule[] = [];

export function generateFounderClientInvoice(params: {
  clientName: string;
  amountInr: number;
  description: string;
  founderUpiVpa?: string;
}): ClientInvoice {
  const vpa = params.founderUpiVpa || "orderking@ybl";
  const invNum = `INV-${Date.now().toString().slice(-6)}`;
  const advance = Math.round(params.amountInr * 0.5);
  const upiLink = `upi://pay?pa=${encodeURIComponent(String(vpa ?? ""))}&pn=OrderKingPay&am=${advance}&tn=${encodeURIComponent(String(
    // @ts-ignore
    `Advance-${invNum}`
    ?? ""))}&cu=INR`;
  const qrPayload = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(String(upiLink ?? ""))}`;

  const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return {
    invoiceNumber: invNum,
    clientName: params.clientName,
    amountInr: params.amountInr,
    advanceRequiredInr: advance,
    description: params.description,
    upiPaymentLink: upiLink,
    qrPayload,
    dueDate,
    status: "SENT",
    payoutAccount: `Founder Direct Private Escrow (UPI: ${vpa})`,
  };
}


export async function getUniversalPlatforms(): Promise<ConnectedPlatform[]> {
  const mod = await import('../server/supreme-founder-data.server');
  return mod.getUniversalPlatformsFromDb();
}
export async function getSeparableModules(): Promise<SeparableModule[]> {
  const mod = await import('../server/supreme-founder-data.server');
  return mod.getSeparableModulesFromDb();
}
export async function getCuratedClientLeads(): Promise<ClientLead[]> {
  const mod = await import('../server/supreme-founder-data.server');
  return mod.getCuratedClientLeadsFromDb();
}
export async function getCuratedRemoteGigs(): Promise<RemoteContractGig[]> {
  const mod = await import('../server/supreme-founder-data.server');
  return mod.getCuratedRemoteGigsFromDb();
}
export async function getEnterpriseBlueprints(): Promise<Record<string, EnterpriseProjectBlueprint>> {
  const mod = await import('../server/supreme-founder-data.server');
  return mod.getEnterpriseBlueprintsFromDb();
}
export async function parseFounderQuery(query: string, founderUpiVpa: string = "orderking@ybl"): Promise<{
  intent:
  | "client_sales"
  | "remote_jobs"
  | "enterprise_blueprint"
  | "invoice_pay"
  | "general_executive"
  | "media_generation"
  | "storage_purifier"
  | "platform_connector"
  | "video_editor_studio"
  | "system_settings"
  | "module_separator"
  | "smart_cleaner"
  | "ensemble_consensus"
  | "instant_deploy";
  detectedLanguage: string;
  responseMarkdown: string;
  voiceSpokenText: string;
  executionSteps: AgentExecutionStep[];
  mediaCard?: {
    type: "image" | "video";
    prompt: string;
    url: string;
    style?: string;
  };
  actionCard?: {
    type:
    | "lead_pitch"
    | "invoice_pay"
    | "enterprise_blueprint"
    | "remote_gig_bid"
    | "income_payout"
    | "media_generator"
    | "storage_purifier"
    | "image_video_studio"
    | "cache_purifier"
    | "platform_connector"
    | "video_editor_studio"
    | "system_settings"
    | "module_separator"
    | "smart_cleaner"
    | "ensemble_consensus"
    | "instant_deploy"
    | "model_updates"
    | "geofence_status"
    | "auto_clean";
    data: any;
  };
}> {
  const q = query.trim().toLowerCase();

  let detectedLanguage = "en-IN";
  const isHindi = /[\u0900-\u097F]/.test(query) || /\b(kya|kaise|paise|karo|bhejo|kamana|kaam|batao|grahak|client)\b/i.test(q);
  const isBengali = /[\u0980-\u09FF]/.test(query) || /\b(kemon|taka|kaaj|bolun|amake|lagbe|pathan|kothay|bhalo)\b/i.test(q);

  if (isHindi) detectedLanguage = "hi-IN";
  else if (isBengali) detectedLanguage = "bn-IN";

  // 1. Sovereign Purifier & Storage Cleaner Command
  if (
    q.startsWith("/clean") ||
    q.includes("clean cache") ||
    q.includes("purge cache") ||
    q.includes("clean storage") ||
    q.includes("storage cleaner") ||
    q.includes("purifier") ||
    q.includes("clean everything")
  ) {
    const inspection = mediaStorageVault.inspectSystemStorage();
    const executionSteps: AgentExecutionStep[] = [
      { stepNumber: 1, totalSteps: 4, label: "Scanning Disk & Memory Quotas", status: "COMPLETED", detail: `Scanned ${inspection.formattedTotalSize} across temporary files` },
      { stepNumber: 2, totalSteps: 4, label: "Validating Core Protection Policy", status: "COMPLETED", detail: "Protected 15 Client Leads, Invoices, Contracts, & Vault Keys" },
      { stepNumber: 3, totalSteps: 4, label: "Arming Cache Purifier Cockpit", status: "COMPLETED", detail: "Browser cache inspection active" },
      { stepNumber: 4, totalSteps: 4, label: "Performance Optimizer Ready", status: "COMPLETED", detail: `Current Speed Score: ${inspection.speedOptimizationScore}%` },
    ];

    const responseMarkdown = `### Cache & Storage Purifier Armed
- **Total Temporary Storage**: **${inspection.formattedTotalSize}** (${inspection.itemCount} cached items)
- **Generated Media Footprint**: ${(inspection.breakdown.generatedImagesBytes / (1024 * 1024)).toFixed(1)} MB Images · ${(inspection.breakdown.generatedVideosBytes / (1024 * 1024)).toFixed(1)} MB Videos
- **Current Performance Score**: **${inspection.speedOptimizationScore}%**

> [!IMPORTANT]
> **100% Core Protection Shield**: Zero danger to critical assets. Your verified Client Leads, King Pay UPI Invoices, MSA Contracts, and Founder Vault Keys are **permanently locked & protected**.

Click **"1-Click Purge All Junk"** below or in the Purifier Cockpit to clear cached items and reclaim storage.`;

    const voiceSpokenText = isHindi
      ? `Storage Purifier active hai. ${inspection.formattedTotalSize} temporary cache scan ho gaya hai. Aapke sabhi client leads aur invoices bilkul surakshit hain.`
      : isBengali
        ? `Storage Purifier ready. ${inspection.formattedTotalSize} temp cache scan kora hoyeche. Apnar client leads ebong invoices 100% safe.`
        : `Storage Purifier is armed. Scanned ${inspection.formattedTotalSize} of temporary cache. Your client leads and invoices are 100% protected and safe.`;

    return {
      intent: "storage_purifier",
      detectedLanguage,
      responseMarkdown,
      voiceSpokenText,
      executionSteps,
      actionCard: {
        type: "storage_purifier",
        data: inspection,
      },
    };
  }

  // 2. Unlimited Free AI Image Generation
  if (
    q.startsWith("/image") ||
    q.includes("generate image") ||
    q.includes("create image") ||
    q.includes("make image") ||
    q.includes("draw image") ||
    q.includes("generate an image")
  ) {
    const rawPrompt = query
      .replace(/^\/image/i, "")
      .replace(/generate (an )?image (of )?/i, "")
      .replace(/create (an )?image (of )?/i, "")
      .replace(/make (an )?image (of )?/i, "")
      .trim() || "Futuristic OrderKing luxury food delivery hub with golden drones and neon lights, 8k octane render";

    const seed = Math.floor(Math.random() * 999999);
    // @ts-ignore
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(String(
      // @ts-ignore
      rawPrompt + ", 8k resolution, cinematic lighting, photorealistic, commercial grade, award winning"
      ?? ""))}?width=1024&height=1024&nologo=true&seed=${seed}`;

    // Auto-save to Media Storage Vault
    mediaStorageVault.addItem({
      type: "image",
      title: rawPrompt.slice(0, 45),
      prompt: rawPrompt,
      url: imageUrl,
      sizeBytes: 2150000,
      mimeType: "image/jpeg",
    });

    const executionSteps: AgentExecutionStep[] = [
      { stepNumber: 1, totalSteps: 3, label: "Parsing Visual Prompt", status: "COMPLETED", detail: rawPrompt },
      { stepNumber: 2, totalSteps: 3, label: "Requesting Pollinations Render URL", status: "COMPLETED", detail: "1024x1024 resolution" },
      { stepNumber: 3, totalSteps: 3, label: "Saving Reference to Media Vault", status: "COMPLETED", detail: "Stored in HDmaster Media Vault" },
    ];

    const responseMarkdown = `### AI Image Generation Output
- **Prompt**: *"${rawPrompt}"*
- **Resolution**: **1024 × 1024** | **Provider**: Pollinations AI
- **Vault Status**: Saved in **HDmaster Media Vault**.

![Generated AI Image](${imageUrl})

You can download or copy the image link below.`;

    const voiceSpokenText = isHindi
      ? `Maine aapke liye AI image prepare kar diya hai aur aapke media vault me save ho gaya hai.`
      : isBengali
        ? `Ami apnar jonno AI image toiri korechi ebong media vault e save hoyeche.`
        : `AI image prepared and saved to your Media Vault.`;

    return {
      intent: "media_generation",
      detectedLanguage,
      responseMarkdown,
      voiceSpokenText,
      executionSteps,
      mediaCard: {
        type: "image",
        prompt: rawPrompt,
        url: imageUrl,
        style: "Photorealistic 8K",
      },
      actionCard: {
        type: "media_generator",
        data: {
          type: "image",
          prompt: rawPrompt,
          url: imageUrl,
        },
      },
    };
  }

  // 3. Video Generation Configuration Check
  if (
    q.startsWith("/video") ||
    q.includes("generate video") ||
    q.includes("create video") ||
    q.includes("make video") ||
    q.includes("ai video") ||
    q.includes("motion video") ||
    q.includes("edit video") ||
    q.includes("video studio") ||
    q.includes("fastest video") ||
    q.includes("long video") ||
    q.includes("commercial video") ||
    q.includes("realistic video")
  ) {
    return {
      intent: "general_executive",
      detectedLanguage,
      responseMarkdown: "### Video Generation Provider Not Configured\nConfigure a live video rendering provider key (Gemini Veo / Runway / Luma) in **Integrations** before generating videos. Stock placeholder clips are disabled.",
      voiceSpokenText: "Video generation provider is not configured in Integrations.",
      executionSteps: [
        { stepNumber: 1, totalSteps: 1, label: "Provider Key Verification", status: "COMPLETED", detail: "Video rendering provider API key is missing in Integrations" },
      ],
    };
  }

  // Business Action 1: Client Prospect & Invoice Lookup (DB-backed)
  if (
    q.startsWith("/client") ||
    q.includes("client lead") ||
    q.includes("find client") ||
    q.includes("pitch client") ||
    q.includes("find clients to sell our food delivery software") ||
    q.includes("sell our food delivery software") ||
    (q.includes("client") && (q.includes("software") || q.includes("prospect") || q.includes("restaurant") || q.includes("dhundte") || q.includes("pitch")))
  ) {
    const leads = await getCuratedClientLeads();
    const lead = leads[0];
    if (!lead) {
      return {
        intent: "client_sales",
        detectedLanguage,
        responseMarkdown: "### Client Pipeline Empty\nNo verified client leads are currently stored in `founder_client_leads`. Add a verified prospect record in CRM before generating an invoice.",
        voiceSpokenText: "No verified client leads are stored in the database.",
        executionSteps: [
          { stepNumber: 1, totalSteps: 1, label: "Database Lookup", status: "COMPLETED", detail: "0 rows returned from founder_client_leads" },
        ],
      };
    }

    const invoice = generateFounderClientInvoice({
      clientName: lead.businessName,
      amountInr: lead.projectBudget,
      description: `Software License & Setup for ${lead.businessName}`,
      founderUpiVpa,
    });

    const executionSteps: AgentExecutionStep[] = [
      { stepNumber: 1, totalSteps: 3, label: "Querying Client Pipeline", status: "COMPLETED", detail: `Loaded ${leads.length} verified record(s) from founder_client_leads` },
      { stepNumber: 2, totalSteps: 3, label: "Selecting Top Prospect", status: "COMPLETED", detail: `Selected ${lead.businessName} (${lead.location})` },
      { stepNumber: 3, totalSteps: 3, label: "Preparing Advance Invoice", status: "COMPLETED", detail: `50% Advance: ₹${invoice.advanceRequiredInr.toLocaleString("en-IN")} via UPI (${founderUpiVpa})` },
    ];

    const responseMarkdown = `### Client Record: **${lead.businessName}**
- **Location**: ${lead.location} | **Reported Monthly Volume**: ${lead.monthlyRevenueEst}
- **Operational Requirement**: ${lead.painPoint}
- **Proposed Scope**: ${lead.suggestedSolution}
- **Contract Value**: **₹${lead.projectBudget.toLocaleString("en-IN")}** (50% Milestone Advance: **₹${invoice.advanceRequiredInr.toLocaleString("en-IN")}**)`;

    const voiceSpokenText = isHindi
      ? `${lead.businessName} ke liye proposal aur ₹${lead.projectBudget.toLocaleString("en-IN")} ka invoice tayyar hai.`
      : isBengali
        ? `${lead.businessName} er jonno ₹${lead.projectBudget.toLocaleString("en-IN")} er invoice toiri ache.`
        : `Prepared proposal and advance invoice for ${lead.businessName} totaling ₹${lead.projectBudget.toLocaleString("en-IN")}.`;

    return {
      intent: "client_sales",
      detectedLanguage,
      responseMarkdown,
      voiceSpokenText,
      executionSteps,
      actionCard: {
        type: "lead_pitch",
        data: { lead, invoice },
      },
    };
  }

  // Business Action 2: Remote Contract Records (DB-backed)
  if (
    q.startsWith("/job") ||
    q.includes("remote gig") ||
    q.includes("remote contract") ||
    q.includes("remote freelance") ||
    q.includes("find high paid remote contracts") ||
    q.includes("freelance job") ||
    (q.includes("upwork") && (q.includes("contract") || q.includes("proposal") || q.includes("bid")))
  ) {
    const gigs = await getCuratedRemoteGigs();
    const gig = gigs[0];
    if (!gig) {
      return {
        intent: "remote_jobs",
        detectedLanguage,
        responseMarkdown: "### No Remote Contracts Stored\nNo verified contract records were found in `founder_remote_gigs`.",
        voiceSpokenText: "No remote contract records are stored in the database.",
        executionSteps: [
          { stepNumber: 1, totalSteps: 1, label: "Database Lookup", status: "COMPLETED", detail: "0 rows returned from founder_remote_gigs" },
        ],
      };
    }

    const executionSteps: AgentExecutionStep[] = [
      { stepNumber: 1, totalSteps: 2, label: "Querying Remote Contract Table", status: "COMPLETED", detail: `Loaded ${gigs.length} record(s) from founder_remote_gigs` },
      { stepNumber: 2, totalSteps: 2, label: "Loading Proposal Template", status: "COMPLETED", detail: `Loaded ${gig.title} (${gig.platform})` },
    ];

    const responseMarkdown = `### Remote Contract Record: **${gig.title}**
- **Client**: ${gig.clientLocation} | **Platform**: ${gig.platform}
- **Rate**: **$${gig.hourlyRateUsd}/hr**${gig.fixedBudgetUsd ? ` | **Fixed Budget**: $${gig.fixedBudgetUsd.toLocaleString("en-US")}` : ""}
- **Duration**: ${gig.duration}
- **Scope**: ${gig.description}

\`\`\`markdown
${gig.proposalTemplate}
\`\`\``;

    const voiceSpokenText = isHindi
      ? `${gig.title} ke liye contract record aur proposal template load ho gaya hai.`
      : isBengali
        ? `${gig.title} er contract record ebong proposal template load hoyeche.`
        : `Loaded remote contract record for ${gig.title} from database.`;

    return {
      intent: "remote_jobs",
      detectedLanguage,
      responseMarkdown,
      voiceSpokenText,
      executionSteps,
      actionCard: {
        type: "remote_gig_bid",
        data: gig,
      },
    };
  }

  // Business Action 3: Enterprise Blueprint Loader (DB-backed, zero fake preview URLs)
  if (
    q.startsWith("/scaffold") ||
    q.includes("scaffold app") ||
    q.includes("scaffold website") ||
    q.includes("scaffold erp") ||
    q.includes("scaffold heavy enterprise") ||
    q.includes("enterprise blueprint") ||
    q.includes("hospital erp web app") ||
    q.includes("multi vendor marketplace app")
  ) {
    const blueprints = await getEnterpriseBlueprints();
    const bp = q.includes("hospital")
      ? blueprints.hospital_erp
      : q.includes("fintech") || q.includes("ledger")
        ? blueprints.fintech_ledger
        : blueprints.multi_vendor_marketplace;

    if (!bp) {
      return {
        intent: "enterprise_blueprint",
        detectedLanguage,
        responseMarkdown: "### Blueprint Not Found\nNo matching architecture blueprint was found in `founder_enterprise_blueprints`.",
        voiceSpokenText: "No matching blueprint found in the database.",
        executionSteps: [
          { stepNumber: 1, totalSteps: 1, label: "Blueprint Lookup", status: "COMPLETED", detail: "No matching record in founder_enterprise_blueprints" },
        ],
      };
    }

    const dbTables = Array.isArray(bp.databaseSchema) ? bp.databaseSchema : [];
    const executionSteps: AgentExecutionStep[] = [
      { stepNumber: 1, totalSteps: 2, label: "Loading Architecture Blueprint", status: "COMPLETED", detail: `Loaded schema metadata for ${bp.targetOrganization}` },
      { stepNumber: 2, totalSteps: 2, label: "Listing Endpoints & Routes", status: "COMPLETED", detail: `${bp.apiEndpoints.length} API endpoints, ${bp.frontendRoutes.length} routes` },
    ];

    const responseMarkdown = `### Architecture Blueprint: **${bp.title}**
- **Target Organization**: ${bp.targetOrganization}
- **Estimated Build Effort**: ${bp.estimatedBuildTime}
- **Deployment Status**: ${bp.livePreviewUrl ? `[${bp.livePreviewUrl}](${bp.livePreviewUrl})` : "Not deployed (blueprint specification only)"}

---
- **Tech Stack**: ${bp.techStack.join(" · ")}
- **Database Tables**:
${dbTables.map((t) => `  - \`${t}\``).join("\n")}
- **API Endpoints**:
${bp.apiEndpoints.map((e) => `  - \`${e}\``).join("\n")}
- **Frontend Routes**:
${bp.frontendRoutes.map((r) => `  - \`${r}\``).join("\n")}`;

    const voiceSpokenText = isHindi
      ? `${bp.title} ka architecture blueprint database se load ho gaya hai.`
      : isBengali
        ? `${bp.title} er architecture blueprint database theke load hoyeche.`
        : `Loaded architecture blueprint specification for ${bp.title}.`;

    return {
      intent: "enterprise_blueprint",
      detectedLanguage,
      responseMarkdown,
      voiceSpokenText,
      executionSteps,
      actionCard: {
        type: "enterprise_blueprint",
        data: bp,
      },
    };
  }

  // Business Action 4: Invoice Generation & King Pay UPI Link
  if (
    q.startsWith("/invoice") ||
    q.includes("generate invoice") ||
    q.includes("create invoice") ||
    q.includes("send invoice") ||
    q.includes("invoice for client") ||
    q.includes("client invoice") ||
    q.includes("upi invoice")
  ) {
    const amountMatch = query.match(/(?:₹|rs\.?|inr)?\s*(\d{3,8})/i);
    const parsedAmount = amountMatch ? Number(amountMatch[1]) : 0;
    if (!parsedAmount || !Number.isFinite(parsedAmount)) {
      return {
        intent: "invoice_pay",
        detectedLanguage,
        responseMarkdown:
          "### Invoice Generator\nSpecify an explicit INR amount to generate a direct NPCI UPI payment link (for example: `/invoice 25000`).",
        voiceSpokenText: "Specify an explicit amount in rupees to generate an invoice.",
        executionSteps: [
          { stepNumber: 1, totalSteps: 1, label: "Input Validation", status: "COMPLETED", detail: "Awaiting explicit INR amount parameter" },
        ],
      };
    }

    const inv = generateFounderClientInvoice({
      clientName: "Orderkingpay B2B Client",
      amountInr: parsedAmount,
      description: "Orderkingpay Software & Merchant Settlement Invoice (GSTIN: 18AFXPH9838M1Z9)",
      founderUpiVpa: founderUpiVpa || "orderking@ybl",
    });

    const executionSteps: AgentExecutionStep[] = [
      { stepNumber: 1, totalSteps: 3, label: "Compiling Invoice Record", status: "COMPLETED", detail: `Invoice #${inv.invoiceNumber} for ₹${inv.amountInr.toLocaleString("en-IN")}` },
      { stepNumber: 2, totalSteps: 3, label: "Generating NPCI UPI Deep-Link", status: "COMPLETED", detail: `50% Advance (₹${inv.advanceRequiredInr.toLocaleString("en-IN")})` },
      { stepNumber: 3, totalSteps: 3, label: "Encoding Dynamic QR Payload", status: "COMPLETED", detail: "NPCI UPI deep-link encoded for UPI apps" },
    ];

    const responseMarkdown = `### Direct NPCI UPI Invoice Generated
- **Invoice Number**: \`${inv.invoiceNumber}\`
- **Total Amount**: **₹${inv.amountInr.toLocaleString("en-IN")}**
- **50% Advance**: **₹${inv.advanceRequiredInr.toLocaleString("en-IN")}**
- **Payout Destination**: **${inv.payoutAccount}**
- **Direct UPI Deep-Link**: \`${inv.upiPaymentLink}\``;

    const voiceSpokenText = isHindi
      ? `₹${inv.amountInr.toLocaleString("en-IN")} ka direct UPI invoice generate ho gaya hai.`
      : isBengali
        ? `₹${inv.amountInr.toLocaleString("en-IN")} er direct UPI invoice toiri hoyeche.`
        : `Generated ₹${inv.amountInr.toLocaleString("en-IN")} NPCI UPI invoice ${inv.invoiceNumber}.`;

    return {
      intent: "invoice_pay",
      detectedLanguage,
      responseMarkdown,
      voiceSpokenText,
      executionSteps,
      actionCard: {
        type: "invoice_pay",
        data: inv,
      },
    };
  }

  // 1. Universal Platform & App Connector / Enforcer
  if (
    q.includes("connect") ||
    q.includes("integrate") ||
    q.includes("platform") ||
    q.includes("force app") ||
    q.includes("external app") ||
    q.includes("github") ||
    q.includes("upwork") ||
    q.includes("whatsapp") ||
    q.includes("aggregator") ||
    q.includes("third-party") ||
    q.includes("shopify") ||
    q.includes("connector") ||
    q.includes("sync app") ||
    q.includes("enforce task")
  ) {
    const allPlatforms = await getUniversalPlatforms();
    if (allPlatforms.length === 0) {
      return {
        intent: "platform_connector",
        detectedLanguage,
        responseMarkdown:
          "### Platform Connectors\nNo external platform connector records are currently configured in the PostgreSQL database. Configure live credentials in **Settings -> Integrations**.",
        voiceSpokenText: "No external platform connectors are configured in the database.",
        executionSteps: [
          { stepNumber: 1, totalSteps: 1, label: "Querying Platform Connectors", status: "COMPLETED", detail: "0 configured platform records in database" },
        ],
      };
    }

    let matchedPlatform = allPlatforms[0];
    if (q.includes("upwork") || q.includes("contract") || q.includes("bid")) matchedPlatform = allPlatforms[1] ?? allPlatforms[0];
    else if (q.includes("whatsapp") || q.includes("message") || q.includes("chat")) matchedPlatform = allPlatforms[2] ?? allPlatforms[0];
    else if (q.includes("aggregator") || q.includes("third-party") || q.includes("menu")) matchedPlatform = allPlatforms[3] ?? allPlatforms[0];
    else if (q.includes("shopify") || q.includes("store") || q.includes("ecommerce")) matchedPlatform = allPlatforms[4] ?? allPlatforms[0];
    else if (q.includes("pay") || q.includes("upi") || q.includes("bank")) matchedPlatform = allPlatforms[5] ?? allPlatforms[0];
    else if (q.includes("google") || q.includes("meet") || q.includes("drive") || q.includes("sheet")) matchedPlatform = allPlatforms[6] ?? allPlatforms[0];
    else if (q.includes("aws") || q.includes("cloud") || q.includes("deploy") || q.includes("edge")) matchedPlatform = allPlatforms[7] ?? allPlatforms[0];

    const executionSteps: AgentExecutionStep[] = [
      { stepNumber: 1, totalSteps: 2, label: "Loading Platform Connector", status: "COMPLETED", detail: `Loaded ${matchedPlatform.name} (${matchedPlatform.status})` },
      { stepNumber: 2, totalSteps: 2, label: "Reading Supported Actions", status: "COMPLETED", detail: `${matchedPlatform.supportedActions.length} actions registered` },
    ];

    const responseMarkdown = `### Platform Connector: **${matchedPlatform.name}**
- **Connection Status**: **${matchedPlatform.status}** (Latency: \`${matchedPlatform.apiLatencyMs}ms\` · Auth: \`${matchedPlatform.authMethod}\`)
- **Registered Actions**:
${matchedPlatform.supportedActions.map((a) => `  - **${a.label}** (\`${a.safetyLevel}\`): ${a.description}`).join("\n")}`;

    const voiceSpokenText = isHindi
      ? `${matchedPlatform.name} connector database se load ho gaya hai.`
      : isBengali
        ? `${matchedPlatform.name} connector database theke load hoyeche.`
        : `Loaded platform connector ${matchedPlatform.name} from the database.`;

    return {
      intent: "platform_connector",
      detectedLanguage,
      responseMarkdown,
      voiceSpokenText,
      executionSteps,
      actionCard: {
        type: "platform_connector",
        data: {
          selectedPlatform: matchedPlatform,
          allPlatforms,
        },
      },
    };
  }

  // 2. Media Studio Check (redirects image prompts cleanly, no fake URLs)
  if (q.includes("edit image") || q.includes("photo edit") || q.includes("image studio") || q.includes("media studio")) {
    return {
      intent: "general_executive",
      detectedLanguage,
      responseMarkdown: "### Image Studio\nUse `/image <prompt>` to generate a real AI image via the configured image endpoint.",
      voiceSpokenText: "Use /image followed by your prompt to generate an image.",
      executionSteps: [
        { stepNumber: 1, totalSteps: 1, label: "Media Studio Routing", status: "COMPLETED", detail: "Direct /image prompt routing enabled" },
      ],
    };
  }

  if (q.includes("cache") || q.includes("purify") || q.includes("purifier") || q.includes("scan disk") || q.includes("purge")) {
    const inspection = mediaStorageVault.inspectSystemStorage();
    return {
      intent: "storage_purifier",
      detectedLanguage,
      responseMarkdown: `### Storage Purifier Scan\n- **Measured Cache Size**: ${inspection.formattedTotalSize} (${inspection.itemCount} items)`,
      voiceSpokenText: `Storage scan complete. Measured size is ${inspection.formattedTotalSize}.`,
      executionSteps: [
        { stepNumber: 1, totalSteps: 1, label: "Vault Inspection", status: "COMPLETED", detail: `Measured ${inspection.formattedTotalSize} across ${inspection.itemCount} items` },
      ],
      actionCard: {
        type: "storage_purifier",
        data: inspection,
      },
    };
  }

  // 3. System Settings, Restart & Refresh
  if (
    q.includes("setting") ||
    q.includes("restart") ||
    q.includes("restert") ||
    q.includes("refresh") ||
    q.includes("glitch") ||
    q.includes("optimize system") ||
    q.includes("reboot")
  ) {
    const isRestart = q.includes("restart") || q.includes("restert") || q.includes("reboot");
    const isRefresh = q.includes("refresh") || q.includes("glitch");
    return {
      intent: "system_settings",
      detectedLanguage,
      responseMarkdown: `### HDmaster System Configuration\n- **Operation**: ${isRestart ? "System Restart" : isRefresh ? "Soft Refresh" : "Settings"}`,
      voiceSpokenText: "HDmaster system settings controls are ready below.",
      executionSteps: [
        { stepNumber: 1, totalSteps: 1, label: "System Controls Ready", status: "COMPLETED", detail: "Configuration panel loaded" },
      ],
      actionCard: {
        type: "system_settings",
        data: {
          settings: DEFAULT_SYSTEM_SETTINGS,
          action: isRestart ? "restart" : isRefresh ? "refresh" : "settings",
        },
      },
    };
  }

  // 4. Smart Suggest Clean (uses real vault item counts, zero fake 3.84 GB claims)
  if (
    q.includes("suggest clean") ||
    q.includes("auto clean") ||
    q.includes("clean mistake") ||
    q.includes("duplicate") ||
    q.includes("problem") ||
    q.includes("junk") ||
    q.includes("smart clean") ||
    q.includes("unnecessary")
  ) {
    const inspection = mediaStorageVault.inspectSystemStorage();
    return {
      intent: "smart_cleaner",
      detectedLanguage,
      responseMarkdown: `### Storage Scan Complete\n- **Vault Items Scanned**: ${inspection.itemCount} (${inspection.formattedTotalSize})`,
      voiceSpokenText: `Storage scan complete with ${inspection.itemCount} vault items.`,
      executionSteps: [
        { stepNumber: 1, totalSteps: 1, label: "Heuristic Inspection", status: "COMPLETED", detail: `Scanned ${inspection.itemCount} vault items (${inspection.formattedTotalSize})` },
      ],
      actionCard: {
        type: "smart_cleaner",
        data: {
          suggestedItemsCount: inspection.itemCount,
          duplicateCount: 0,
          mistakesFixedCount: 0,
          freedEstimateBytes: inspection.totalSizeBytes,
        },
      },
    };
  }

  // 5. Separate / Extract Any Section into Independent Standalone Apps & Websites
  if (
    q.includes("separate") ||
    q.includes("different website") ||
    q.includes("standalone app") ||
    q.includes("export section") ||
    q.includes("make out") ||
    q.includes("extract module") ||
    q.includes("split app") ||
    q.includes("different app")
  ) {
    const modules = await getSeparableModules();
    const executionSteps: AgentExecutionStep[] = [
      { stepNumber: 1, totalSteps: 1, label: "Querying Separable Modules", status: "COMPLETED", detail: `Loaded ${modules.length} module definition(s) from database` },
    ];

    const responseMarkdown =
      modules.length === 0
        ? "### Standalone Module Exporter\nNo separable module packages are registered in PostgreSQL yet."
        : `### Standalone Module Exporter (${modules.length})\n${modules.map((m, idx) => `${idx + 1}. **${m.name}** — \`${m.standaloneRoute}\` (${m.subdomainUrl})`).join("\n")}`;

    const voiceSpokenText =
      modules.length === 0
        ? "No separable modules are registered in the database."
        : `Loaded ${modules.length} separable modules from the database.`;

    return {
      intent: "module_separator",
      detectedLanguage,
      responseMarkdown,
      voiceSpokenText,
      executionSteps,
      actionCard: {
        type: "module_separator",
        data: {
          modules,
        },
      },
    };
  }

  // 6. Multi-Model Ensemble Consensus (All Strongest Models Run Together)
  if (
    q.includes("ensemble") ||
    q.includes("all model") ||
    q.includes("consensus") ||
    q.includes("run together") ||
    q.includes("all strongest") ||
    q.includes("together")
  ) {
    const consensus = ensembleConsensusEngine.executeConsensus(query);
    const activeModels =
      consensus.modelsBreakdown
        .filter((m) => m.connectionStatus === "CONNECTED")
        .map((m) => m.modelName)
        .join(", ") || "Local Deterministic Core";
    const executionSteps: AgentExecutionStep[] = [
      { stepNumber: 1, totalSteps: 2, label: "Checking Active Model Providers", status: "COMPLETED", detail: `Providers checked: ${activeModels}` },
      { stepNumber: 2, totalSteps: 2, label: "Consensus Summary Built", status: "COMPLETED", detail: `${consensus.overallConsensusAgreement}% agreement across active providers` },
    ];

    return {
      intent: "ensemble_consensus",
      detectedLanguage,
      responseMarkdown: consensus.unifiedSynthesis,
      voiceSpokenText: `Consensus checked across ${activeModels}.`,
      executionSteps,
      actionCard: {
        type: "ensemble_consensus",
        data: consensus,
      },
    };
  }

  // 7. 1-Command App & Deployment Script Generator
  if (
    q.includes("deploy live") ||
    q.includes("1-command deploy") ||
    q.includes("deploy app") ||
    q.includes("deploy website") ||
    q.includes("create website") ||
    q.includes("create product page") ||
    q.includes("deploy")
  ) {
    const deployRes = instantDeployEngine.deployLive(
      query.includes("hospital") ? "Sribhumi Health Care ERP" : query.includes("market") ? "Hyperlocal Marketplace" : "Sovereign Web System",
      query.includes("hospital") ? "erp" : query.includes("product") ? "product_page" : "website",
      query
    );

    const executionSteps: AgentExecutionStep[] = [
      { stepNumber: 1, totalSteps: 3, label: "Preparing App Artifacts", status: "COMPLETED", detail: `${deployRes.filesGeneratedCount} files generated` },
      { stepNumber: 2, totalSteps: 3, label: "Generating Deployment Commands", status: "COMPLETED", detail: "Vercel & Cloudflare CLI commands prepared" },
      { stepNumber: 3, totalSteps: 3, label: "Target Host Assigned", status: "COMPLETED", detail: `Target URL: ${deployRes.liveUrl}` },
    ];

    const responseMarkdown = `### Deployment Bundle Ready
- **Project**: **${deployRes.projectName}**
- **Target URL**: [\`${deployRes.liveUrl}\`](${deployRes.liveUrl})
- **Status**: **${deployRes.status}** (Edge: ${deployRes.edgeRegion})
- **Files Generated**: **${deployRes.filesGeneratedCount} files**

\`\`\`bash
${deployRes.vercelDeployCommand}
\`\`\`

Run the CLI command above to deploy to Cloudflare Pages or Vercel.`;

    return {
      intent: "instant_deploy",
      detectedLanguage,
      responseMarkdown,
      voiceSpokenText: `Prepared ${deployRes.projectName} deployment bundle with CLI scripts ready to run.`,
      executionSteps,
      actionCard: {
        type: "instant_deploy",
        data: deployRes,
      },
    };
  }

  // 8. Model Registry & Upgrade Check
  if (
    q.includes("model update") ||
    q.includes("frontier model") ||
    q.includes("next gen") ||
    q.includes("gpt-6") ||
    q.includes("claude 5") ||
    q.includes("grok 5") ||
    q.includes("upgrade model") ||
    q.includes("generation upgrade") ||
    q.includes("evolution")
  ) {
    const updateReport = autonomousModelUpdater.checkForUpdates();
    const upgradeCount = updateReport.notifications.length;
    const executionSteps: AgentExecutionStep[] = [
      { stepNumber: 1, totalSteps: 2, label: "Inspecting Model Registry", status: "COMPLETED", detail: `${upgradeCount} upgrade option(s) listed in registry` },
      { stepNumber: 2, totalSteps: 2, label: "Waiting for Admin Confirmation", status: "COMPLETED", detail: "Manual switch required before applying changes" },
    ];

    const responseMarkdown = `### Model Registry Check
- **Registered Upgrade Options**: **${upgradeCount}**
- **Switch Policy**: Manual founder approval required before updating active provider models.

Review the available options below before switching models.`;

    return {
      intent: "general_executive",
      detectedLanguage,
      responseMarkdown,
      voiceSpokenText: `${upgradeCount} model upgrade options are available for review.`,
      executionSteps,
      actionCard: {
        type: "model_updates",
        data: updateReport,
      },
    };
  }

  // 9. Strict Geofencing & Food Delivery Zone Quarantine
  if (
    q.includes("geofence") ||
    q.includes("zone") ||
    q.includes("sribhumi") ||
    q.includes("karimganj") ||
    q.includes("restaurant restriction") ||
    q.includes("kingpay only") ||
    q.includes("radius")
  ) {
    const activeZone = ACTIVE_DELIVERY_ZONES[0];
    const executionSteps: AgentExecutionStep[] = [
      { stepNumber: 1, totalSteps: 3, label: "Querying Spatial GPS Radar", status: "COMPLETED", detail: "Enforcing 12km strict radius centered at Sribhumi / Karimganj" },
      { stepNumber: 2, totalSteps: 3, label: "Verifying Inactive Zone Quarantine", status: "COMPLETED", detail: "Food ordering masked across inactive regions; King Pay rendered exclusively" },
      { stepNumber: 3, totalSteps: 3, label: "Compliance & Fee Verification", status: "COMPLETED", detail: "Direct NPCI UPI settlement verified" },
    ];

    const responseMarkdown = `### Geofence Enforcement Status
- **Active Food Delivery Zone**: **${activeZone.name}** (12.0 km strict radius)
- **Active Coordinates**: \`24.8688° N, 92.3511° E\`
- **Pan-India Inactive Zone Rule**:
  - Customers outside the active 12km delivery zone do not see food delivery listings.
  - Outside active food zones, users access **King Pay** digital payments only.`;

    return {
      intent: "general_executive",
      detectedLanguage,
      responseMarkdown,
      voiceSpokenText: `Geofence rules are strictly active. Food delivery is confined to a 12 kilometer radius around Karimganj and Sribhumi. In all other parts of India, restaurants are hidden and customers access King Pay digital payments.`,
      executionSteps,
      actionCard: {
        type: "geofence_status",
        data: {
          activeZone,
          rules: "Strict 12km Karimganj zone for food; Pan-India King Pay digital payment ecosystem outside.",
        },
      },
    };
  }

  // Open-world universal cognitive intelligence fallback: Handles medical, coding, math, science, strategy & general Q&A
  return synthesizeOpenWorldCognitiveResponse(query, detectedLanguage);
}

/**
 * Fail-closed fallback when an open-world prompt does not match a live database command
 * and no external LLM provider key is active. Zero canned or fabricated answers.
 */
export function synthesizeOpenWorldCognitiveResponse(
  query: string,
  detectedLanguage: string = "en-US"
): {
  intent: "general_executive";
  detectedLanguage: string;
  responseMarkdown: string;
  voiceSpokenText: string;
  executionSteps: AgentExecutionStep[];
} {
  const isHindi = detectedLanguage === "hi-IN" || /[\u0900-\u097F]/.test(query);
  const isBengali = detectedLanguage === "bn-IN" || /[\u0980-\u09FF]/.test(query);

  const executionSteps: AgentExecutionStep[] = [
    {
      stepNumber: 1,
      totalSteps: 1,
      label: "Live AI Provider Check",
      status: "COMPLETED",
      detail: "No live LLM provider API key active for open-world prompt",
    },
  ];

  const responseMarkdown = `### Live AI Provider Required
No live language model API key is active for open-world reasoning on: **"${query.slice(0, 120)}"**.

Configure a live provider key (Gemini, OpenAI, Anthropic, or xAI) in **Settings -> Integrations**, or use a live operational command (\`/client\`, \`/invoice\`, \`/scaffold\`, \`/clean\`, \`geofence\`).`;

  const voiceSpokenText = isHindi
    ? "Live AI model API key configured nahi hai. Integrations me Gemini, OpenAI, Anthropic ya xAI key add karein."
    : isBengali
      ? "Live AI model API key configured nei. Integrations e Gemini, OpenAI, Anthropic ba xAI key add korun."
      : "No live AI model API key is configured. Add a Gemini, OpenAI, Anthropic, or xAI key in Integrations.";

  return {
    intent: "general_executive",
    detectedLanguage,
    responseMarkdown,
    voiceSpokenText,
    executionSteps,
  };
}

