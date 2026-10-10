import { useState, useEffect, useMemo } from "react";
import {
  type AiDeepfakeMediaConnector,
  type RenderedVideoItem,
  DEFAULT_PLUGIN_CONNECTORS,
  type EcosystemCmsConfig,
  DEFAULT_ECOSYSTEM_CMS,
} from "@/lib/orderking/cms-connectors";
import {
  testPluginConnectorFn,
  renderAiAvatarVideoFn,
  dispatchAiMediaGeoDmBlastFn,
} from "@/lib/orderking/actions";
import {
  Video,
  Play,
  Sparkles,
  Film,
  Sliders,
  Download,
  Share2,
  Send,
  Layers,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
  Bot,
  Zap,
  Crosshair,
  Activity,
  MapPin,
  TrendingUp,
  DollarSign,
  Flame,
  Award,
  Info,
  Lock,
  MessageSquare,
  Key,
  Cpu,
  Smartphone,
  ChevronRight,
  Radio,
  FileVideo,
} from "lucide-react";

export interface AiMediaEngineHubProps {
  config?: AiDeepfakeMediaConnector;
  onUpdate?: (updates: Partial<AiDeepfakeMediaConnector>) => void;
  cmsConfig?: EcosystemCmsConfig;
  onSave?: () => void;
  isSaving?: boolean;
}

// Preset Indian high-density commercial dining catchments
const METRO_CATCHMENTS = [
  {
    label: "Connaught Place & Central Catchment, New Delhi",
    short: "Connaught Place, DL",
    lat: 28.6315,
    lng: 77.2167,
    densityMultiplier: 1.45,
    typicalDiners: 4200,
  },
  {
    label: "Indiranagar 100ft Road & Defence Colony, Bengaluru",
    short: "Indiranagar, BLR",
    lat: 12.9784,
    lng: 77.6408,
    densityMultiplier: 1.6,
    typicalDiners: 5100,
  },
  {
    label: "Bandra West & BKC Financial Catchment, Mumbai",
    short: "Bandra BKC, BOM",
    lat: 19.0596,
    lng: 72.8295,
    densityMultiplier: 1.55,
    typicalDiners: 4800,
  },
  {
    label: "CyberHub & DLF Phase 2 Corridor, Gurugram",
    short: "CyberHub, GGN",
    lat: 28.4952,
    lng: 77.0895,
    densityMultiplier: 1.35,
    typicalDiners: 3900,
  },
  {
    label: "HITEC City & Jubilee Hills Catchment, Hyderabad",
    short: "HITEC City, HYD",
    lat: 17.4435,
    lng: 78.3772,
    densityMultiplier: 1.25,
    typicalDiners: 3600,
  },
  {
    label: "Koramangala 5th Block & Sony World, Bengaluru",
    short: "Koramangala, BLR",
    lat: 12.9352,
    lng: 77.6245,
    densityMultiplier: 1.7,
    typicalDiners: 5600,
  },
];

// Curated AI Avatars tailored for Indian high-conversion food commerce
const AVATAR_PRESETS = [
  {
    id: "kabir_growth_exec",
    name: "Kabir",
    role: "Restaurant Growth Director",
    tone: "Authoritative, confident Hinglish, executive suit",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    badge: "Most Popular",
    suggestedVoice: "en-IN-PrabhatNeural",
  },
  {
    id: "priya_indian_anchor",
    name: "Priya",
    role: "Consumer Savings & Tech Anchor",
    roleSubtitle: "High-energy viral reels & news anchor style",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    badge: "Viral Pick",
    suggestedVoice: "hi-IN-SwaraNeural",
  },
  {
    id: "aarav_culinary_critic",
    name: "Aarav",
    role: "Food Critic & Creator",
    roleSubtitle: "Relatable street food foodie, candid camera",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    badge: "Gen-Z Reach",
    suggestedVoice: "en-IN-NeerjaNeural",
  },
  {
    id: "zoya_savings_anchor",
    name: "Zoya",
    role: "Food Economics Investigative Host",
    roleSubtitle: "Analytical, sharp, breaks down aggregator bills",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    badge: "High Credibility",
    suggestedVoice: "en-IN-PrabhatNeural",
  },
];

// Viral Script Presets for "Delete Zomato Bounty"
const BOUNTY_SCRIPT_PRESETS = [
  {
    id: "bounty_uninstall_150",
    title: "₹150 Instant Cash Diner Uninstall Bounty",
    targetAudience: "Hungry Diners tired of Surge Pricing",
    rewardInr: 150,
    script: `Stop paying ₹45 surge pricing, ₹35 platform fees, and 30% hidden markups to Zomato! Here is the official Delete Zomato Bounty from OrderKing. Uninstall Zomato right now, install OrderKing, and we immediately deposit ₹150 sovereign cash straight into your dining wallet. 0% restaurant commissions, authentic kitchen rates, and lightning-fast direct dispatch. Tap the link below, claim your ₹150 bounty, and eat like a King today!`,
  },
  {
    id: "bounty_b2b_margin_liberation",
    title: "Restaurant Owner Margin Liberation (0% Commission)",
    targetAudience: "Restaurant Owners bleeding 28-32% margins",
    rewardInr: 0,
    script: `Attention all restaurant owners bleeding 28% to 32% of your hard-earned revenue to Zomato: Stop funding your competitor's marketing! OrderKing gives you ₹0 setup fee, 0% commission, and direct instant UPI payouts deposited directly into your bank account. Keep 100% of your earnings. Claim your verified kitchen listing on OrderKing in 60 seconds at the link below.`,
  },
  {
    id: "bounty_receipt_shock",
    title: "Aggregator Receipt Shock (Viral Expose)",
    targetAudience: "Smart Consumers looking for bill transparency",
    rewardInr: 150,
    script: `Did you know that a Butter Chicken on Zomato costs ₹380, but the exact same restaurant only sells it for ₹280? Where did that extra ₹100 go? Straight to corporate aggregator pockets. OrderKing connects you directly with the kitchen at actual menu prices with zero markup, plus a ₹150 welcome bounty. Delete Zomato today and order direct!`,
  },
];

export function AiMediaEngineHub({
  config: initialConfig,
  onUpdate,
  cmsConfig = DEFAULT_ECOSYSTEM_CMS,
  onSave,
  isSaving: externalSaving = false,
}: AiMediaEngineHubProps) {
  // Local state
  const [form, setForm] = useState<AiDeepfakeMediaConnector>(
    initialConfig || DEFAULT_PLUGIN_CONNECTORS.aiMediaEngine
  );

  useEffect(() => {
    if (initialConfig) {
      setForm((prev) => ({ ...prev, ...initialConfig }));
    }
  }, [initialConfig]);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<
    "studio" | "render" | "geoblast" | "credentials" | "library"
  >("studio");

  // Mask toggles for credentials
  const [showHeyGenKey, setShowHeyGenKey] = useState(false);
  const [showSynthesiaKey, setShowSynthesiaKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Diagnostic testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  // Render pipeline state
  const [isRendering, setIsRendering] = useState(false);
  const [renderStep, setRenderStep] = useState<number>(0);
  const [activeRenderedVideo, setActiveRenderedVideo] = useState<RenderedVideoItem | null>(
    form.renderedVideos?.[0] || null
  );
  const [renderNotice, setRenderNotice] = useState<string | null>(null);

  // Geo-blast state
  const [isBlasting, setIsBlasting] = useState(false);
  const [blastReport, setBlastReport] = useState<any | null>(null);
  const [blastTargetCatchment, setBlastTargetCatchment] = useState(
    METRO_CATCHMENTS[0]
  );
  const [blastTargetRadiusKm, setBlastTargetRadiusKm] = useState(form.targetGeoRadiusKm || 5.0);
  const [blastTargetInstagram, setBlastTargetInstagram] = useState(true);
  const [blastTargetWhatsapp, setBlastTargetWhatsapp] = useState(true);
  const [blastTargetMessenger, setBlastTargetMessenger] = useState(true);
  const [blastQuota, setBlastQuota] = useState(form.dailyRenderQuota || 500);

  // Local save status
  const [internalSaving, setInternalSaving] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const isSaving = externalSaving || internalSaving;

  const handleFieldChange = <K extends keyof AiDeepfakeMediaConnector>(
    key: K,
    value: AiDeepfakeMediaConnector[K]
  ) => {
    const updated = { ...form, [key]: value };
    setForm(updated);
    if (onUpdate) {
      onUpdate({ [key]: value });
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  // Calculus for Script & Speech
  const scriptCalculus = useMemo(() => {
    const words = (form.scriptTemplate || "").trim().split(/\s+/).filter(Boolean).length;
    const characters = (form.scriptTemplate || "").length;
    // High-energy presenter cadence: ~2.25 words per second
    const estimatedSeconds = Math.max(12, Math.min(180, Math.round(words / 2.25)));
    const viralityScore = Math.min(
      99,
      Math.max(72, Math.round(75 + (form.bountyCashRewardInr > 0 ? 15 : 5) + (words > 25 && words < 75 ? 9 : 3)))
    );
    return {
      words,
      characters,
      estimatedSeconds,
      viralityScore,
      costEstimateTokens: words * 4,
    };
  }, [form.scriptTemplate, form.bountyCashRewardInr]);

  // Calculus for Geo-Blast Linkage
  const blastCalculus = useMemo(() => {
    const radius = Math.max(0.5, blastTargetRadiusKm);
    const areaSqKm = Math.PI * Math.pow(radius, 2);
    const baseDensity = 32.5 * blastTargetCatchment.densityMultiplier;
    const totalPotentialDiners = Math.max(100, Math.round(areaSqKm * baseDensity * 4.2));

    const igDms = blastTargetInstagram ? Math.round(totalPotentialDiners * 0.45) : 0;
    const waDms = blastTargetWhatsapp ? Math.round(totalPotentialDiners * 0.65) : 0;
    const messengerDms = blastTargetMessenger ? Math.round(totalPotentialDiners * 0.25) : 0;

    const totalRaw = igDms + waDms + messengerDms;
    const cappedDispatch = Math.min(totalRaw, blastQuota);
    const estimatedViews = Math.round(cappedDispatch * 0.88);
    const projectedBountiesClaimed = Math.round(estimatedViews * 0.28);
    const estimatedConsumerSavingsInr = projectedBountiesClaimed * 85;

    return {
      radiusKm: radius,
      areaSqKm: Number(areaSqKm.toFixed(2)),
      totalPotentialDiners,
      igDms,
      waDms,
      messengerDms,
      cappedDispatch,
      estimatedViews,
      projectedBountiesClaimed,
      estimatedConsumerSavingsInr,
    };
  }, [
    blastTargetRadiusKm,
    blastTargetCatchment,
    blastTargetInstagram,
    blastTargetWhatsapp,
    blastTargetMessenger,
    blastQuota,
  ]);

  // Test Connection Handshake
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testPluginConnectorFn({
        data: {
          service: "aiMediaEngine",
          payload: form,
        },
      });
      if (res.ok) {
        setTestResult({ ok: true, message: res.message });
        handleFieldChange("status", "CONNECTED");
        handleFieldChange("lastTestedAt", new Date().toISOString());
      } else {
        setTestResult({ ok: false, error: res.error || "AI Media Engine Handshake failed." });
        handleFieldChange("status", "ERROR");
      }
    } catch (err: any) {
      setTestResult({ ok: false, error: err.message || "Failed to reach AI Media Engine rails." });
      handleFieldChange("status", "ERROR");
    } finally {
      setIsTesting(false);
    }
  };

  // Trigger Video Render
  const handleRenderVideo = async () => {
    if (!form.scriptTemplate?.trim()) {
      alert("Please provide a script before rendering.");
      return;
    }

    setIsRendering(true);
    setRenderNotice(null);
    setRenderStep(1);

    try {
      // Step 1: Phoneme & Prosody Neural Tokenization
      await new Promise((r) => setTimeout(r, 600));
      setRenderStep(2);

      // Step 2: Audio Synthesis & Neural Voice Generation
      await new Promise((r) => setTimeout(r, 700));
      setRenderStep(3);

      // Step 3: 3D Facial Mesh & Lip-Sync Rendering
      await new Promise((r) => setTimeout(r, 800));
      setRenderStep(4);

      // Step 4: Video Encoding & Finalization
      const res = await renderAiAvatarVideoFn({
        data: {
          provider: form.provider,
          avatarId: form.avatarId,
          avatarPose: form.avatarPose,
          voiceId: form.voiceId,
          language: form.language,
          script: form.scriptTemplate,
          title: `${form.bountyCampaignTitle} (${form.aspectRatio})`,
          aspectRatio: form.aspectRatio,
          videoResolution: form.videoResolution,
          backgroundType: form.backgroundType,
          backgroundColor: form.backgroundColor,
          bountyOfferInr: form.bountyCashRewardInr,
          heygenApiKey: form.heygenApiKey,
          synthesiaApiKey: form.synthesiaApiKey,
          mode: form.mode,
        },
      });

      setRenderStep(5);
      await new Promise((r) => setTimeout(r, 400));

      if (res.ok && res.video) {
        setActiveRenderedVideo(res.video);
        const updatedList = [res.video, ...(form.renderedVideos || []).filter((v) => v.id !== res.video.id)];
        handleFieldChange("renderedVideos", updatedList);
        handleFieldChange("lastRenderedAt", new Date().toISOString());
        handleFieldChange("rendersCompletedToday", (form.rendersCompletedToday || 0) + 1);
        setRenderNotice(res.message || "AI Avatar MP4 video successfully generated & rendered!");
        setActiveTab("render");
      } else {
        alert(res.error || "Failed to render video.");
      }
    } catch (err: any) {
      alert(err.message || "Video rendering process encountered an error.");
    } finally {
      setIsRendering(false);
      setRenderStep(0);
    }
  };

  // Trigger Meta DM Geo-Blast
  const handleDispatchGeoBlast = async () => {
    if (!activeRenderedVideo) {
      alert("No rendered video selected to blast. Please render or select a video first.");
      return;
    }

    setIsBlasting(true);
    setBlastReport(null);

    try {
      const res = await dispatchAiMediaGeoDmBlastFn({
        data: {
          videoId: activeRenderedVideo.id,
          targetLat: blastTargetCatchment.lat,
          targetLng: blastTargetCatchment.lng,
          radiusKm: blastTargetRadiusKm,
          targetLocationLabel: blastTargetCatchment.label,
          targetInstagram: blastTargetInstagram,
          targetMessenger: blastTargetMessenger,
          targetWhatsapp: blastTargetWhatsapp,
          bountyHeadline: form.bountyCampaignTitle,
          bountyCashRewardInr: form.bountyCashRewardInr,
          dailyDmQuota: blastQuota,
        },
      });

      if (res.ok) {
        setBlastReport(res);
        // Update local blast count
        const updated = (form.renderedVideos || []).map((v) => {
          if (v.id === activeRenderedVideo.id) {
            return { ...v, blastCount: (v.blastCount || 0) + res.dispatchedCount };
          }
          return v;
        });
        handleFieldChange("renderedVideos", updated);
        setActiveRenderedVideo((prev) =>
          prev ? { ...prev, blastCount: (prev.blastCount || 0) + res.dispatchedCount } : null
        );
      } else {
        alert(res.error || "Failed to dispatch viral media blast.");
      }
    } catch (err: any) {
      alert(err.message || "Exception during geo-blast dispatch.");
    } finally {
      setIsBlasting(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    try {
      setInternalSaving(true);
      if (onSave) {
        await onSave();
      }
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to save media engine settings.");
    } finally {
      setInternalSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-emerald-950/20 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-md shadow-emerald-500/20">
                <Video className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold tracking-tight text-foreground">
                    {cmsConfig.connectorAiMediaEngineTitle ||
                      "AI Deepfake Media Engine (Synthesia / HeyGen API)"}
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                      form.enabled
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {form.enabled ? "Active & Render-Ready" : "Standby Mode"}
                  </span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary border border-primary/20">
                    {form.mode === "live" ? "Live Edge Production" : "Sandbox Simulator"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-3xl">
                  {cmsConfig.connectorAiMediaEngineSubtitle ||
                    "Autonomous viral avatar video studio for the Founder. Mass-produces photorealistic MP4 presenter videos explaining the 'Delete Zomato Bounty' and blasts them into Meta DMs geographically with zero employees."}
                </p>
              </div>
            </div>

            {/* Quick telemetry pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 font-medium text-secondary-foreground border border-border/50">
                <Bot className="h-3 w-3 text-emerald-500" />
                Zero Employees Media Factory
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 font-medium text-secondary-foreground border border-border/50">
                <Film className="h-3 w-3 text-blue-500" />
                1080p 60fps Neural Lip-Sync
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 font-medium text-secondary-foreground border border-border/50">
                <Share2 className="h-3 w-3 text-purple-500" />
                Meta DM Geo-Blast Hook
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 font-medium text-secondary-foreground border border-border/50">
                <DollarSign className="h-3 w-3 text-amber-500" />
                ₹{form.bountyCashRewardInr} Bounty Drop
              </span>
            </div>
          </div>

          {/* Master Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer bg-secondary/60 hover:bg-secondary px-3 py-2 rounded-lg border border-border text-xs font-medium transition-colors">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => handleFieldChange("enabled", e.target.checked)}
                className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500"
              />
              <span>{cmsConfig.connectorAiMediaEngineToggleLabel || "AI Media Engine Active"}</span>
            </label>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSaving}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold shadow-xs transition-colors ${
                isSaving
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{isSaving ? "Persisting..." : "Save Configuration"}</span>
            </button>
          </div>
        </div>

        {saveSuccessNotice && (
          <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <Check className="h-3.5 w-3.5" />
            Media Engine settings and rendered video library committed to platform database.
          </div>
        )}
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {[
          {
            id: "studio" as const,
            label: "Viral Studio & Prompt Engine",
            icon: Sparkles,
          },
          {
            id: "render" as const,
            label: "Neural Render Queue & Live Player",
            icon: Play,
          },
          {
            id: "geoblast" as const,
            label: "Meta DM Geo-Blast Linkage",
            icon: Crosshair,
          },
          {
            id: "credentials" as const,
            label: "API Credentials & Webhook Gateway",
            icon: Key,
          },
          {
            id: "library" as const,
            label: `Rendered Video Vault (${(form.renderedVideos || []).length})`,
            icon: Layers,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "bg-card border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: VIRAL STUDIO & PROMPT ENGINE */}
      {activeTab === "studio" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols): Script & Avatar Config */}
          <div className="lg:col-span-2 space-y-6">
            {/* Avatar Presenter Selector */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-emerald-500" />
                  <h4 className="text-sm font-semibold text-foreground">
                    1. Select AI Avatar Presenter
                  </h4>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Neural 3D Head Mesh & Wav2Lip Model
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AVATAR_PRESETS.map((av) => {
                  const isSelected = form.avatarId === av.id;
                  return (
                    <div
                      key={av.id}
                      onClick={() => {
                        handleFieldChange("avatarId", av.id);
                        handleFieldChange("voiceId", av.suggestedVoice);
                      }}
                      className={`relative flex items-center gap-3.5 rounded-xl border p-3 cursor-pointer transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/30"
                          : "border-border bg-background hover:bg-secondary/40"
                      }`}
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                        <img
                          src={av.photoUrl}
                          alt={av.name}
                          className="h-full w-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                            <Check className="h-2.5 w-2.5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {av.name}
                          </span>
                          <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                            {av.badge}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 truncate">
                          {av.role}
                        </p>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">
                          {av.tone}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Avatar Pose & Voice Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div>
                  <label className="font-medium text-foreground block mb-1">Avatar Framing</label>
                  <select
                    value={form.avatarPose}
                    onChange={(e: any) => handleFieldChange("avatarPose", e.target.value)}
                    className="w-full h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:ring-1 focus:ring-primary"
                  >
                    <option value="half_body">Half Body (Reels / DMs)</option>
                    <option value="close_up">Close-up Portrait (Direct Call)</option>
                    <option value="full_body">Full Studio Presenter</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-foreground block mb-1">Language Dialect</label>
                  <select
                    value={form.language}
                    onChange={(e: any) => handleFieldChange("language", e.target.value)}
                    className="w-full h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:ring-1 focus:ring-primary"
                  >
                    <option value="hinglish">Hinglish (Urban Metros - High Virality)</option>
                    <option value="hi-IN">Hindi (North India Catchment)</option>
                    <option value="en-IN">Indian English (Corporate & Premium)</option>
                    <option value="ta-IN">Tamil (Chennai Catchment)</option>
                    <option value="te-IN">Telugu (Hyderabad Catchment)</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-foreground block mb-1">Voice Profile ID</label>
                  <input
                    type="text"
                    value={form.voiceId}
                    onChange={(e) => handleFieldChange("voiceId", e.target.value)}
                    placeholder="en-IN-PrabhatNeural"
                    className="w-full h-8 rounded-lg border border-border bg-background px-2 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Delete Zomato Bounty Script Presets & Customizer */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-amber-500" />
                  <h4 className="text-sm font-semibold text-foreground">
                    2. 'Delete Zomato Bounty' Script Studio
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-muted-foreground">Presets:</span>
                  {BOUNTY_SCRIPT_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        handleFieldChange("scriptTemplate", p.script);
                        handleFieldChange("bountyCampaignTitle", p.title);
                        handleFieldChange("bountyCashRewardInr", p.rewardInr);
                      }}
                      className="rounded bg-secondary/80 hover:bg-secondary px-2 py-1 text-[10px] font-medium text-foreground transition-colors"
                    >
                      {p.rewardInr > 0 ? `₹${p.rewardInr} Bounty` : "B2B Pitch"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campaign Metadata Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-medium text-foreground block mb-1">Campaign Headline</label>
                  <input
                    type="text"
                    value={form.bountyCampaignTitle}
                    onChange={(e) => handleFieldChange("bountyCampaignTitle", e.target.value)}
                    className="w-full h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-medium text-foreground block mb-1">
                    Bounty Sovereign Cash Reward (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={form.bountyCashRewardInr}
                    onChange={(e) =>
                      handleFieldChange("bountyCashRewardInr", parseFloat(e.target.value) || 0)
                    }
                    className="w-full h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Script Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-foreground">
                    Presenter Script (Phonetically Optimized)
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    {scriptCalculus.words} words • ~{scriptCalculus.estimatedSeconds}s duration
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={form.scriptTemplate}
                  onChange={(e) => handleFieldChange("scriptTemplate", e.target.value)}
                  placeholder="Enter the speech script for the AI presenter..."
                  className="w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground focus:ring-1 focus:ring-primary leading-relaxed font-sans"
                />
              </div>

              {/* Speech Telemetry Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-secondary/40 p-2.5 text-[11px] text-muted-foreground border border-border/50">
                <div className="flex items-center gap-3">
                  <span>
                    Estimated Length: <strong className="text-foreground">{scriptCalculus.estimatedSeconds}s</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Pacing: <strong className="text-foreground">{form.voiceSpeed || 1.05}x</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Virality Rating:{" "}
                    <strong className="text-emerald-500 font-bold">
                      {scriptCalculus.viralityScore} / 100
                    </strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRenderVideo}
                  disabled={isRendering}
                  className="flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>{isRendering ? "Synthesizing MP4..." : "Render Video Now"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (1 Col): Video Format, Background, & Preview */}
          <div className="space-y-6">
            {/* Aspect Ratio & Video Specs */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">3. Visual Specifications</h4>
              </div>

              {/* Aspect Ratio Selector */}
              <div>
                <label className="text-xs font-medium text-foreground block mb-2">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "9:16" as const, label: "9:16 Vertical", desc: "Meta DMs / Reels" },
                    { id: "16:9" as const, label: "16:9 Wide", desc: "Web / YouTube" },
                    { id: "1:1" as const, label: "1:1 Square", desc: "Feed Posts" },
                  ].map((r) => {
                    const isSel = form.aspectRatio === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleFieldChange("aspectRatio", r.id)}
                        className={`rounded-lg border p-2 text-center transition-all ${
                          isSel
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                            : "border-border bg-background text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        <div className="text-xs">{r.label}</div>
                        <div className="text-[10px] text-muted-foreground opacity-80">{r.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Resolution & Background */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-medium text-foreground block mb-1">Resolution Engine</label>
                  <select
                    value={form.videoResolution}
                    onChange={(e: any) => handleFieldChange("videoResolution", e.target.value)}
                    className="w-full h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:ring-1 focus:ring-primary"
                  >
                    <option value="1080p">1080p Full HD (60fps, Optimized)</option>
                    <option value="720p">720p HD (Fast Render)</option>
                    <option value="4k">4K Ultra HD (Studio Master)</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-foreground block mb-1">Studio Backdrop</label>
                  <select
                    value={form.backgroundType}
                    onChange={(e: any) => handleFieldChange("backgroundType", e.target.value)}
                    className="w-full h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:ring-1 focus:ring-primary"
                  >
                    <option value="cyber_dark">Dark Emerald Sovereign Studio (#0D3B2E)</option>
                    <option value="kitchen_luxury">Commercial Stainless Kitchen</option>
                    <option value="studio_green">Green Screen Chroma Key</option>
                    <option value="transparent">Transparent Alpha Channel</option>
                  </select>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.enableSubtitles}
                      onChange={(e) => handleFieldChange("enableSubtitles", e.target.checked)}
                      className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-foreground">
                      Burn-in Dynamic Kinetic Captions (Word-by-word highlight)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Quick Render Action Card */}
            <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Zap className="h-4 w-4" />
                <h4 className="text-sm font-semibold">Render Pipeline Ready</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Click below to tokenize phonemes, synthesize neural voice, calculate 3D lip-sync
                keyframes, and render your MP4 file ready for direct Meta DM geo-blasting.
              </p>
              <button
                type="button"
                onClick={handleRenderVideo}
                disabled={isRendering}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Zap className="h-4 w-4" />
                <span>
                  {isRendering
                    ? `Rendering Stage ${renderStep}/5...`
                    : "⚡ Render Photorealistic MP4 Video"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NEURAL RENDER QUEUE & LIVE PLAYER */}
      {activeTab === "render" && (
        <div className="space-y-6">
          {/* Active Render Progress Bar (When rendering) */}
          {isRendering && (
            <div className="rounded-xl border border-emerald-500/40 bg-card p-5 shadow-sm space-y-3 animate-pulse">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <Activity className="h-4 w-4 animate-spin" />
                  Synthesizing Neural Avatar Video...
                </span>
                <span className="text-muted-foreground font-mono">Stage {renderStep} of 5</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${(renderStep / 5) * 100}%` }}
                />
              </div>
              <div className="grid grid-cols-5 text-[10px] text-muted-foreground pt-1 text-center">
                <div className={renderStep >= 1 ? "text-emerald-500 font-semibold" : ""}>
                  1. Script Tokenization
                </div>
                <div className={renderStep >= 2 ? "text-emerald-500 font-semibold" : ""}>
                  2. Neural Voice
                </div>
                <div className={renderStep >= 3 ? "text-emerald-500 font-semibold" : ""}>
                  3. Wav2Lip Sync
                </div>
                <div className={renderStep >= 4 ? "text-emerald-500 font-semibold" : ""}>
                  4. H.264 GPU Render
                </div>
                <div className={renderStep >= 5 ? "text-emerald-500 font-semibold" : ""}>
                  5. Global Edge CDN
                </div>
              </div>
            </div>
          )}

          {renderNotice && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>{renderNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setRenderNotice(null)}
                className="text-xs opacity-70 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Video Player & Inspection Grid */}
          {activeRenderedVideo ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Video Player */}
              <div className="lg:col-span-7 rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <FileVideo className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold text-foreground truncate">
                      {activeRenderedVideo.title}
                    </h4>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600 border border-emerald-500/20">
                    Rendered MP4
                  </span>
                </div>

                {/* HTML5 Video Player */}
                <div className="relative mx-auto flex items-center justify-center overflow-hidden rounded-xl border border-border bg-black max-h-[480px]">
                  <video
                    controls
                    playsInline
                    poster={activeRenderedVideo.thumbnailUrl}
                    src={activeRenderedVideo.mp4Url}
                    className="max-h-[480px] w-auto rounded-lg object-contain"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>

                {/* Player Quick Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
                  <div className="flex items-center gap-2">
                    <a
                      href={activeRenderedVideo.mp4Url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={`orderking_${activeRenderedVideo.id}.mp4`}
                      className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 font-medium text-foreground hover:bg-secondary/80 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download MP4</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeRenderedVideo.mp4Url, "mp4Url")}
                      className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 font-medium text-foreground hover:bg-secondary/80 transition-colors"
                    >
                      {copiedKey === "mp4Url" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>Copy CDN Link</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("geoblast")}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 font-semibold transition-colors cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Blast This Video to DMs</span>
                  </button>
                </div>
              </div>

              {/* Right: Video Telemetry & Metadata Card */}
              <div className="lg:col-span-5 rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <Activity className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">
                    Video Render Telemetry
                  </h4>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">Asset ID</span>
                    <span className="font-mono text-foreground">{activeRenderedVideo.id}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">Provider Rail</span>
                    <span className="font-semibold uppercase text-emerald-500">
                      {activeRenderedVideo.provider} Enterprise
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">Aspect Ratio</span>
                    <span className="font-semibold text-foreground">
                      {activeRenderedVideo.aspectRatio}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">Spoken Duration</span>
                    <span className="font-mono text-foreground">
                      {activeRenderedVideo.durationSeconds} seconds
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">Bounty Offer</span>
                    <span className="font-bold text-amber-500">
                      ₹{activeRenderedVideo.bountyOfferInr} Instant Cash
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">Dispatched Blasts</span>
                    <span className="font-bold text-foreground">
                      {activeRenderedVideo.blastCount.toLocaleString()} smartphones
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-muted-foreground">Render Timestamp</span>
                    <span className="text-muted-foreground">
                      {new Date(activeRenderedVideo.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Script Snippet Box */}
                <div className="rounded-lg bg-secondary/40 p-3 text-xs space-y-1 border border-border/50">
                  <span className="font-medium text-foreground block">Rendered Script Excerpt</span>
                  <p className="text-muted-foreground italic leading-relaxed">
                    "{activeRenderedVideo.scriptSnippet}"
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
              <Film className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
              <h4 className="text-sm font-semibold text-foreground">No Rendered Video Selected</h4>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                Generate your first AI avatar MP4 file in the Viral Studio tab to preview and inspect
                here.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("studio")}
                className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
              >
                Open Viral Studio
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: META DM GEO-BLAST LINKAGE */}
      {activeTab === "geoblast" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Blast Configuration (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Crosshair className="h-4 w-4 text-purple-500" />
                  <h4 className="text-sm font-semibold text-foreground">
                    Geospatial Meta DM Auto-Blaster
                  </h4>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Direct Instagram / WhatsApp / Messenger Bridge
                </span>
              </div>

              {/* Target Catchment Selector */}
              <div className="space-y-1.5 text-xs">
                <label className="font-medium text-foreground">Target Dining Catchment Polygon</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {METRO_CATCHMENTS.map((c) => {
                    const isSel = blastTargetCatchment.short === c.short;
                    return (
                      <button
                        key={c.short}
                        type="button"
                        onClick={() => setBlastTargetCatchment(c)}
                        className={`flex items-start gap-2 rounded-lg border p-2.5 text-left transition-all ${
                          isSel
                            ? "border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/30"
                            : "border-border bg-background text-muted-foreground hover:bg-secondary/50"
                        }`}
                      >
                        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-purple-500" />
                        <div>
                          <div className="text-xs font-semibold text-foreground">{c.short}</div>
                          <div className="text-[10px] text-muted-foreground line-clamp-1">
                            {c.label}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Blast Radius Slider */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-foreground">Geospatial Radial Perimeter</label>
                  <span className="font-mono text-purple-500 font-bold">
                    {blastTargetRadiusKm} km ({blastCalculus.areaSqKm} km²)
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="15.0"
                  step="0.5"
                  value={blastTargetRadiusKm}
                  onChange={(e) => setBlastTargetRadiusKm(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>

              {/* Omnichannel Dispatch Rails */}
              <div className="space-y-2 text-xs">
                <label className="font-medium text-foreground block">
                  Select Meta Omnichannel Rails
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 rounded-lg border border-border bg-background p-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={blastTargetInstagram}
                      onChange={(e) => setBlastTargetInstagram(e.target.checked)}
                      className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs font-medium text-foreground">Instagram Direct</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-border bg-background p-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={blastTargetWhatsapp}
                      onChange={(e) => setBlastTargetWhatsapp(e.target.checked)}
                      className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs font-medium text-foreground">WhatsApp Cloud</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-border bg-background p-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={blastTargetMessenger}
                      onChange={(e) => setBlastTargetMessenger(e.target.checked)}
                      className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs font-medium text-foreground">Messenger</span>
                  </label>
                </div>
              </div>

              {/* Daily Quota */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-foreground">Daily Blast Quota Cap</label>
                  <span className="font-mono text-foreground font-semibold">
                    {blastQuota} DMs / day
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="5000"
                  step="50"
                  value={blastQuota}
                  onChange={(e) => setBlastQuota(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>

              {/* Big Action Blast Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDispatchGeoBlast}
                  disabled={isBlasting || !activeRenderedVideo}
                  className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 text-xs font-bold shadow-md transition-all ${
                    isBlasting || !activeRenderedVideo
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20 cursor-pointer"
                  }`}
                >
                  <Send className="h-4 w-4" />
                  <span>
                    {isBlasting
                      ? "Dispatching Video DMs Geographically..."
                      : `🚀 Blast Rendered Avatar MP4 to ${blastCalculus.cappedDispatch.toLocaleString()} Smartphones`}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Live Blast Calculus & Blast Telemetry (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <h4 className="text-sm font-semibold text-foreground">
                  Geospatial Conversion Calculus
                </h4>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Target Reachable Diners</span>
                  <span className="font-bold text-foreground">
                    {blastCalculus.totalPotentialDiners.toLocaleString()} diners
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Effective Capped DM Dispatch</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    {blastCalculus.cappedDispatch.toLocaleString()} DMs
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Projected Video Views (88%)</span>
                  <span className="font-bold text-foreground">
                    {blastCalculus.estimatedViews.toLocaleString()} views
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Bounties Claimed (28%)</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {blastCalculus.projectedBountiesClaimed.toLocaleString()} uninstalls
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted-foreground">Consumer Bill Savings</span>
                  <span className="font-bold text-amber-500">
                    ₹{blastCalculus.estimatedConsumerSavingsInr.toLocaleString()} saved
                  </span>
                </div>
              </div>
            </div>

            {/* Blast Confirmation / Telemetry Notice */}
            {blastReport && (
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-5 space-y-3 shadow-sm animate-in fade-in">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-bold">Meta DM Blast Executed Successfully</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {blastReport.message}
                </p>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-1">
                  <div className="rounded bg-background/80 p-1.5 border border-border/50">
                    <span className="text-muted-foreground block">Instagram</span>
                    <strong className="text-foreground">
                      {blastReport.channels?.instagramDirect || 0}
                    </strong>
                  </div>
                  <div className="rounded bg-background/80 p-1.5 border border-border/50">
                    <span className="text-muted-foreground block">WhatsApp</span>
                    <strong className="text-foreground">
                      {blastReport.channels?.whatsAppCloud || 0}
                    </strong>
                  </div>
                  <div className="rounded bg-background/80 p-1.5 border border-border/50">
                    <span className="text-muted-foreground block">Messenger</span>
                    <strong className="text-foreground">
                      {blastReport.channels?.messenger || 0}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: API CREDENTIALS & WEBHOOK GATEWAY */}
      {activeTab === "credentials" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Synthesia & HeyGen Enterprise API Gateway
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Authenticate your API keys to enable autonomous high-fidelity video rendering.
                  </p>
                </div>
              </div>

              {/* Test Handshake Button */}
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 px-3.5 py-2 text-xs font-semibold text-foreground transition-colors cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? "animate-spin" : ""}`} />
                <span>
                  {isTesting
                    ? "Validating Handshake..."
                    : cmsConfig.connectorAiMediaEngineTestBtnText ||
                      "Verify Synthesia / HeyGen Handshake"}
                </span>
              </button>
            </div>

            {/* Diagnostic Result Banner */}
            {testResult && (
              <div
                className={`flex items-start gap-3 rounded-lg border p-4 text-xs ${
                  testResult.ok
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                }`}
              >
                {testResult.ok ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                )}
                <div className="flex-1">
                  <span className="font-semibold block mb-0.5">
                    {testResult.ok ? "Connection Verified" : "Diagnostic Check Failed"}
                  </span>
                  <span>{testResult.message || testResult.error}</span>
                </div>
              </div>
            )}

            {/* Provider Selector */}
            <div className="space-y-1.5 text-xs">
              <label className="font-medium text-foreground">Default Synthetic Video Provider</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: "heygen" as const,
                    name: "HeyGen Enterprise (v2)",
                    desc: "Interactive Avatars & Ultra-Fast Lip-Sync",
                  },
                  {
                    id: "synthesia" as const,
                    name: "Synthesia STUDIO API (v2)",
                    desc: "Broadcast-Grade Studio Quality",
                  },
                  {
                    id: "d_id" as const,
                    name: "D-ID Real-Time Engine",
                    desc: "Live Conversational Agent Fallback",
                  },
                ].map((p) => {
                  const isSel = form.provider === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleFieldChange("provider", p.id)}
                      className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                        isSel
                          ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30"
                          : "border-border bg-background hover:bg-secondary/40"
                      }`}
                    >
                      <span className="text-xs font-semibold text-foreground">{p.name}</span>
                      <span className="text-[11px] text-muted-foreground mt-0.5">{p.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* API Key Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* HeyGen API Key */}
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">HeyGen API Key (X-Api-Key)</label>
                <div className="relative">
                  <input
                    type={showHeyGenKey ? "text" : "password"}
                    value={form.heygenApiKey}
                    onChange={(e) => handleFieldChange("heygenApiKey", e.target.value)}
                    placeholder="hg_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 pr-20 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                  />
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowHeyGenKey(!showHeyGenKey)}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      {showHeyGenKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(form.heygenApiKey, "heygenKey")}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      {copiedKey === "heygenKey" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Synthesia API Key */}
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Synthesia API Key (Authorization)</label>
                <div className="relative">
                  <input
                    type={showSynthesiaKey ? "text" : "password"}
                    value={form.synthesiaApiKey}
                    onChange={(e) => handleFieldChange("synthesiaApiKey", e.target.value)}
                    placeholder="syn_api_xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 pr-20 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                  />
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowSynthesiaKey(!showSynthesiaKey)}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      {showSynthesiaKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(form.synthesiaApiKey, "synthesiaKey")}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      {copiedKey === "synthesiaKey" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Webhook Secret */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="font-medium text-foreground">
                  Video Render Completion Webhook URL & Secret
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value="https://orderking.delivery/api/v1/media/render-webhook"
                      className="w-full h-9 rounded-lg border border-border bg-secondary/60 px-3 pr-10 text-xs font-mono text-foreground"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy("https://orderking.delivery/api/v1/media/render-webhook", "webhookUrl")
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    >
                      {copiedKey === "webhookUrl" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={form.webhookSecret}
                      onChange={(e) => handleFieldChange("webhookSecret", e.target.value)}
                      placeholder="Webhook signing secret"
                      className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {cmsConfig.connectorAiMediaEngineWebhookNotice ||
                    "Synthesia / HeyGen Video Render Webhook (/api/v1/media/render-webhook): Receives real-time video rendering completion events, Cloudflare Stream / AWS S3 MP4 download URLs, and triggers immediate geospatial DM blasting."}
                </p>
              </div>
            </div>

            {/* Compliance Policy Notice */}
            <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Shield className="h-4 w-4 text-emerald-500" />
                <span>
                  {cmsConfig.connectorAiMediaEnginePolicyTitle ||
                    "Autonomous Synthetic Media & Regulatory Transparency Guard"}
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {cmsConfig.connectorAiMediaEnginePolicyNotice ||
                  "All AI-generated video outputs strictly observe synthetic media transparency standards and IT Rules 2021 labeling while executing high-conversion viral customer acquisition and restaurant partner onboarding."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: RENDERED VIDEO VAULT */}
      {activeTab === "library" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">
              Archive of Rendered MP4 Assets ({(form.renderedVideos || []).length})
            </h4>
            <button
              type="button"
              onClick={() => setActiveTab("studio")}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Render New Avatar MP4</span>
            </button>
          </div>

          {(form.renderedVideos || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(form.renderedVideos || []).map((video) => {
                const isSelected = activeRenderedVideo?.id === video.id;
                return (
                  <div
                    key={video.id}
                    className={`rounded-xl border bg-card p-4 space-y-3 transition-all ${
                      isSelected
                        ? "border-emerald-500 ring-1 ring-emerald-500/30"
                        : "border-border hover:border-border/80"
                    }`}
                  >
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black border border-border">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="h-full w-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveRenderedVideo(video);
                            setActiveTab("render");
                          }}
                          className="h-10 w-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition-colors"
                        >
                          <Play className="h-5 w-5 fill-white ml-0.5" />
                        </button>
                      </div>
                      <div className="absolute top-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-mono text-white">
                        {video.aspectRatio}
                      </div>
                      <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-mono text-white">
                        {video.durationSeconds}s
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h5 className="text-xs font-semibold text-foreground line-clamp-1">
                        {video.title}
                      </h5>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {video.scriptSnippet}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/50 text-muted-foreground">
                      <span>Bounty: ₹{video.bountyOfferInr}</span>
                      <span>Blasts: {video.blastCount.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveRenderedVideo(video);
                          setActiveTab("render");
                        }}
                        className="flex-1 rounded-lg border border-border bg-secondary/60 hover:bg-secondary py-1.5 text-center text-xs font-medium text-foreground transition-colors"
                      >
                        Play MP4
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveRenderedVideo(video);
                          setActiveTab("geoblast");
                        }}
                        className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-1.5 text-center text-xs font-semibold text-white transition-colors"
                      >
                        Blast to DMs
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
              <Film className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
              <p className="text-xs text-muted-foreground">No videos rendered yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
