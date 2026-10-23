import { useState, useEffect, useMemo } from "react";
import {
  DEFAULT_PLUGIN_CONNECTORS,
  type PluginConnectorsConfig,
  type EcosystemCmsConfig,
  DEFAULT_ECOSYSTEM_CMS,
} from "@/lib/orderking/cms-connectors";
import {
  loadPluginConnectorsFn,
  savePluginConnectorsFn,
  testPluginConnectorFn,
  loadEcosystemCmsFn,
  saveEcosystemCmsFn,
} from "@/lib/orderking/actions";
import { GeospatialAdHub } from "./GeospatialAdHub";
import { MetaOmnichannelHub } from "./MetaOmnichannelHub";
import { AiMediaEngineHub } from "./AiMediaEngineHub";
import { GlobalAdSyndicateHub } from "./GlobalAdSyndicateHub";
import { OemLockScreenHub } from "./OemLockScreenHub";
import { WifiCaptivePortalHub } from "./WifiCaptivePortalHub";
import {
  Cpu,
  CreditCard,
  MessageSquare,
  ShieldAlert,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Copy,
  Check,
  Zap,
  Layers,
  Calculator,
  Megaphone,
  Edit3,
  Target,
  Globe,
  Landmark,
  PhoneCall,
  Sparkles,
  Crosshair,
  Share2,
  Video,
  Smartphone,
  Wifi,
  Database,
  Sliders,
} from "lucide-react";

export type ConnectorTab =
  | "all"
  | "supabase"
  | "openaiGemini"
  | "globalAdSyndicate"
  | "oemLockScreen"
  | "wifiCaptivePortal"
  | "razorpay"
  | "stripeAtlas"
  | "payoneer"
  | "whatsapp"
  | "fssai"
  | "mapbox"
  | "cleartax"
  | "whatsappMarketing"
  | "b2bLeadGen"
  | "telemarketing"
  | "geospatialAdExchange"
  | "metaOmnichannel"
  | "aiMediaEngine";

interface ExtraPlatformConnectors {
  supabase: {
    enabled: boolean;
    projectUrl: string;
    databaseUrl: string;
    anonKey: string;
    serviceRoleKey: string;
    poolerMode: "transaction" | "session";
  };
  openaiGemini: {
    enabled: boolean;
    geminiApiKey: string;
    openaiApiKey: string;
    defaultModel: string;
    dailySpendCapInr: number;
  };
}

const DEFAULT_EXTRA_CONNECTORS: ExtraPlatformConnectors = {
  supabase: {
    enabled: false,
    projectUrl: "",
    databaseUrl: "",
    anonKey: "",
    serviceRoleKey: "",
    poolerMode: "transaction",
  },
  openaiGemini: {
    enabled: false,
    geminiApiKey: "",
    openaiApiKey: "",
    defaultModel: "gemini-2.5-flash",
    dailySpendCapInr: 500,
  },
};

const EXTRA_STORAGE_KEY = "orderking_extra_connectors_v1";

// Public preferences only. Database, service role and AI API keys must be
// configured and verified on the server, never persisted in browser storage.
function sanitizeExtraConnectors(extra: ExtraPlatformConnectors): ExtraPlatformConnectors {
  return {
    supabase: { ...extra.supabase, databaseUrl: "", serviceRoleKey: "" },
    openaiGemini: { ...extra.openaiGemini, geminiApiKey: "", openaiApiKey: "" },
  };
}

export function PluginConnectors({ forcedTab }: { forcedTab?: ConnectorTab }) {
  const [config, setConfig] = useState<PluginConnectorsConfig>(DEFAULT_PLUGIN_CONNECTORS);
  const [initialConfig, setInitialConfig] = useState<PluginConnectorsConfig>(DEFAULT_PLUGIN_CONNECTORS);
  const [extraConfig, setExtraConfig] = useState<ExtraPlatformConnectors>(DEFAULT_EXTRA_CONNECTORS);
  const [initialExtraConfig, setInitialExtraConfig] = useState<ExtraPlatformConnectors>(DEFAULT_EXTRA_CONNECTORS);
  const [cmsConfig, setCmsConfig] = useState<EcosystemCmsConfig>(DEFAULT_ECOSYSTEM_CMS);
  const [initialCmsConfig, setInitialCmsConfig] = useState<EcosystemCmsConfig>(DEFAULT_ECOSYSTEM_CMS);
  const [showCmsEditor, setShowCmsEditor] = useState(false);
  const [cmsSaving, setCmsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<ConnectorTab>(forcedTab || "all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingService, setTestingService] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { ok: boolean; message: string; timestamp: string }>
  >({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [statusBanner, setStatusBanner] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (forcedTab) setActiveTab(forcedTab);
  }, [forcedTab]);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        setLoading(true);
        try {
          const rawExtra = localStorage.getItem(EXTRA_STORAGE_KEY);
          if (rawExtra) {
            const stored = JSON.parse(rawExtra);
            const parsed = sanitizeExtraConnectors({
              supabase: { ...DEFAULT_EXTRA_CONNECTORS.supabase, ...stored?.supabase },
              openaiGemini: { ...DEFAULT_EXTRA_CONNECTORS.openaiGemini, ...stored?.openaiGemini },
            });
            // Purge previously stored credentials on the next page load.
            localStorage.setItem(EXTRA_STORAGE_KEY, JSON.stringify(parsed));
            setExtraConfig(parsed);
            setInitialExtraConfig(parsed);
          }
        } catch {
          // ignore localStorage errors
        }

        let connectorData: PluginConnectorsConfig | null = null;
        let cmsData: EcosystemCmsConfig | null = null;

        try {
          const res = await loadPluginConnectorsFn();
          if (res && res.ok && res.data) connectorData = res.data;
        } catch {
          // fallback
        }

        try {
          const resCms = await loadEcosystemCmsFn();
          if (resCms && resCms.ok && resCms.data) cmsData = resCms.data;
        } catch {
          // fallback
        }

        if (!connectorData || !cmsData) {
          try {
            const resp = await fetch("/api/v1/admin/settings");
            if (resp.ok) {
              const json = await resp.json();
              if (json.plugin_connectors && !connectorData) connectorData = json.plugin_connectors;
              if (json.cms && !cmsData) cmsData = json.cms;
            }
          } catch {
            // ignore network fallback error
          }
        }

        if (mounted) {
          if (connectorData) {
            setConfig(connectorData);
            setInitialConfig(connectorData);
          }
          if (cmsData) {
            const mergedCms = { ...DEFAULT_ECOSYSTEM_CMS, ...cmsData };
            setCmsConfig(mergedCms);
            setInitialCmsConfig(mergedCms);
          }
        }
      } catch (err) {
        console.error("Error loading connectors:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const hasChanges = useMemo(() => {
    return (
      JSON.stringify(config) !== JSON.stringify(initialConfig) ||
      JSON.stringify(extraConfig) !== JSON.stringify(initialExtraConfig)
    );
  }, [config, initialConfig, extraConfig, initialExtraConfig]);

  const hasCmsChanges = useMemo(() => {
    return JSON.stringify(cmsConfig) !== JSON.stringify(initialCmsConfig);
  }, [cmsConfig, initialCmsConfig]);

  const toggleSecretVisibility = (fieldId: string) => {
    setVisibleSecrets((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setStatusBanner(null);

      try {
        const safeExtra = sanitizeExtraConnectors(extraConfig);
        localStorage.setItem(EXTRA_STORAGE_KEY, JSON.stringify(safeExtra));
        setExtraConfig(safeExtra);
        setInitialExtraConfig(safeExtra);
      } catch {
        setInitialExtraConfig(sanitizeExtraConnectors(extraConfig));
      }

      let success = false;
      try {
        const res = await savePluginConnectorsFn({ data: { connectors: config } });
        if (res && res.ok && res.data) {
          setConfig(res.data);
          setInitialConfig(res.data);
          success = true;
        }
      } catch {
        try {
          const resp = await fetch("/api/v1/admin/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plugin_connectors: config }),
          });
          if (resp.ok) {
            setInitialConfig(config);
            success = true;
          }
        } catch {
          // Server save failed. Never claim an unpersisted change succeeded.
          success = false;
        }
      }

      if (success) {
        setStatusBanner({
          type: "success",
          text: "Connector settings saved by the server. Extra public preferences are browser-only; provider secrets need server configuration.",
        });
        setTimeout(() => setStatusBanner(null), 5000);
      } else {
        setStatusBanner({
          type: "error",
          text: "Could not save connector settings. Please verify your admin session.",
        });
      }
    } catch (err: unknown) {
      setStatusBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Error saving connector settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCmsCopy = async () => {
    try {
      setCmsSaving(true);
      setStatusBanner(null);
      let success = false;
      try {
        const res = await saveEcosystemCmsFn({ data: { cms: cmsConfig } });
        if (res && res.ok && res.data) {
          setCmsConfig(res.data);
          setInitialCmsConfig(res.data);
          success = true;
        }
      } catch {
        const resp = await fetch("/api/v1/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cms: cmsConfig }),
        });
        if (resp.ok) {
          setInitialCmsConfig(cmsConfig);
          success = true;
        }
      }
      if (success) {
        setStatusBanner({ type: "success", text: "Connector labels saved." });
      }
    } finally {
      setCmsSaving(false);
    }
  };

  const handleTestConnection = async (service: string) => {
    const nowStr = new Date().toLocaleTimeString();

    if (service === "supabase" || service === "openaiGemini") {
      setTestResults((prev) => ({
        ...prev,
        [service]: {
          ok: false,
          message: "Not verified. Configure the provider securely on the server, then run an authenticated connectivity test.",
          timestamp: nowStr,
        },
      }));
      return;
    }

    try {
      setTestingService(service);
      const typedService = service as Exclude<
        ConnectorTab,
        "all" | "supabase" | "openaiGemini" | "globalAdSyndicate" | "oemLockScreen" | "wifiCaptivePortal"
      >;
      const payload = config[typedService];
      const res = await testPluginConnectorFn({ data: { service: typedService, payload } });

      if (res && res.ok) {
        setTestResults((prev) => ({
          ...prev,
          [service]: {
            ok: true,
            message: res.message || "Credentials verified.",
            timestamp: nowStr,
          },
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [service]: {
            ok: false,
            message:
              (res as { error?: string })?.error ||
              "Not Connected — Please enter valid API keys and try again.",
            timestamp: nowStr,
          },
        }));
      }
    } catch (err: unknown) {
      setTestResults((prev) => ({
        ...prev,
        [service]: {
          ok: false,
          message:
            err instanceof Error
              ? err.message
              : "Connection test failed. Check your API key.",
          timestamp: nowStr,
        },
      }));
    } finally {
      setTestingService(null);
    }
  };

  // Honest connection status helper: ONLY returns Connected when an API key is actually entered AND saved!
  const getHonestStatus = (service: ConnectorTab) => {
    if (service === "supabase" || service === "openaiGemini") {
      return {
        status: "NOT_CONNECTED" as const,
        label: "Server verification required",
        badgeClass: "bg-slate-100 text-slate-600 border-slate-300",
      };
    }
    const checkHasKey = (cfg: PluginConnectorsConfig, ext: ExtraPlatformConnectors): boolean => {
      switch (service) {
        case "razorpay":
          return !!cfg.razorpay.keyId.trim() && !!cfg.razorpay.keySecret.trim();
        case "whatsapp":
          return !!cfg.whatsapp.phoneNumberId.trim() && !!cfg.whatsapp.systemAccessToken.trim();
        case "mapbox":
          return !!cfg.mapbox.publicAccessToken.trim();
        case "fssai":
          return !!cfg.fssai.clientId.trim() && !!cfg.fssai.authorizationToken.trim();
        case "cleartax":
          return !!cfg.cleartax.authKey.trim() && !!cfg.cleartax.gstin.trim();
        case "stripeAtlas":
          return !!cfg.stripeAtlas.publishableKey.trim() && !!cfg.stripeAtlas.secretKey.trim();
        case "payoneer":
          return !!cfg.payoneer.programId.trim() && !!cfg.payoneer.clientSecret.trim();
        case "whatsappMarketing":
          return !!cfg.whatsappMarketing.apiKey.trim() && !!cfg.whatsappMarketing.phoneNumberId.trim();
        case "b2bLeadGen":
          return !!cfg.b2bLeadGen.apolloApiKey.trim() || !!cfg.b2bLeadGen.linkedinAccessToken.trim();
        case "telemarketing":
          return !!cfg.telemarketing.apiKey.trim();
        case "geospatialAdExchange":
          return (
            (!!cfg.geospatialAdExchange.jioAdsClientId.trim() &&
              !!cfg.geospatialAdExchange.jioAdsClientSecret.trim()) ||
            (!!cfg.geospatialAdExchange.airtelPartnerId.trim() &&
              !!cfg.geospatialAdExchange.airtelXstreamToken.trim())
          );
        case "metaOmnichannel":
          return (
            !!cfg.metaOmnichannel.metaAppId.trim() &&
            !!cfg.metaOmnichannel.systemAccessToken.trim()
          );
        case "aiMediaEngine":
          return (
            !!cfg.aiMediaEngine.heygenApiKey.trim() ||
            !!cfg.aiMediaEngine.synthesiaApiKey.trim()
          );
        case "oemLockScreen":
          return (
            !!cfg.oemLockScreen.glancePublisherApiKey.trim() ||
            !!cfg.oemLockScreen.samsungKnoxAdvertiserId.trim()
          );
        case "wifiCaptivePortal":
          return !!cfg.wifiCaptivePortal.apiAuthToken.trim();
        case "globalAdSyndicate":
          return (
            cfg.globalAdSyndicate.enabled &&
            cfg.globalAdSyndicate.promotedPlacements.bookings.length > 0
          );
        default:
          return false;
      }
    };

    const checkEnabled = (cfg: PluginConnectorsConfig, ext: ExtraPlatformConnectors): boolean => {
      if (service === "all") return false;
      return !!cfg[service]?.enabled;
    };

    const hasDraftKey = checkHasKey(config, extraConfig);
    const hasSavedKey = checkHasKey(initialConfig, initialExtraConfig);
    const isSavedEnabled = checkEnabled(initialConfig, initialExtraConfig);

    if (!hasDraftKey) {
      return {
        status: "NOT_CONNECTED" as const,
        label: "Not Connected — Enter API Key",
        badgeClass: "bg-slate-100 text-slate-600 border-slate-300",
      };
    }

    if (!hasSavedKey || !isSavedEnabled) {
      return {
        status: "UNSAVED" as const,
        label: "Key Entered — Enable & Click Save",
        badgeClass: "bg-amber-50 text-amber-800 border-amber-300",
      };
    }

    // Saved credentials alone do not prove provider acceptance or transactions.
    return {
      status: "NOT_CONNECTED" as const,
      label: "Configured — live verification pending",
      badgeClass: "bg-slate-100 text-slate-600 border-slate-300",
    };
  };

  const coreServices: ConnectorTab[] = [
    "razorpay",
    "supabase",
    "whatsapp",
    "mapbox",
    "openaiGemini",
    "fssai",
    "cleartax",
    "stripeAtlas",
    "payoneer",
    "whatsappMarketing",
    "telemarketing",
    "b2bLeadGen",
  ];

  const connectedCount = useMemo(() => {
    return coreServices.filter((s) => getHonestStatus(s).status === "CONNECTED").length;
  }, [config, initialConfig, extraConfig, initialExtraConfig]);

  const renderStatusBadge = (svc: ConnectorTab) => {
    const st = getHonestStatus(svc);
    return (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${st.badgeClass}`}>
        {st.label}
      </span>
    );
  };

  const renderTestBanner = (svc: string) => {
    const res = testResults[svc];
    if (!res) return null;
    return (
      <div
        className={`rounded-lg p-3 text-xs border flex items-center justify-between ${
          res.ok
            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
            : "border-rose-300 bg-rose-50 text-rose-900"
        }`}
      >
        <div className="flex items-center gap-2">
          {res.ok ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{res.message}</span>
        </div>
        <span className="font-mono text-[10px] opacity-75">Tested {res.timestamp}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  API Keys & Connectors
                </h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary border border-primary/20">
                  {connectedCount} / {coreServices.length} Connected
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Paste, test, and save your live API keys for payments, database, WhatsApp, maps, AI models, and GST compliance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowCmsEditor((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>{showCmsEditor ? "Hide Labels" : "Customize Labels"}</span>
          </button>

          {hasChanges && (
            <button
              type="button"
              onClick={() => {
                setConfig(initialConfig);
                setExtraConfig(initialExtraConfig);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Changes
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-all ${
              hasChanges
                ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving Keys..." : hasChanges ? "Save All Keys" : "All Keys Saved"}
          </button>
        </div>
      </div>

      {/* 1. Current Status / Result & Next Action */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-[11px] font-bold uppercase text-muted-foreground block">
            Current Status / Result
          </span>
          <p className="text-sm font-bold text-foreground mt-1">
            {connectedCount === 0
              ? "No Live API Keys Saved Yet"
              : `${connectedCount} ${connectedCount === 1 ? "Service" : "Services"} Connected`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Status shows Connected only after you paste a real key, enable the toggle, and click Save.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-[11px] font-bold uppercase text-muted-foreground block">
            Settings & Customizations
          </span>
          <p className="text-xs font-semibold text-foreground mt-1">
            Razorpay • Supabase • WhatsApp • Maps • AI • FSSAI/GST
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            All secret keys stay masked on screen and can be updated anytime.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <span className="text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-300 block">
            Next Action
          </span>
          <p className="text-xs font-semibold text-foreground mt-1">
            Select a service tab below, paste your API key, click Test Key, then click Save All Keys.
          </p>
        </div>
      </div>

      {/* Status Notification */}
      {statusBanner && (
        <div
          className={`flex items-center justify-between rounded-lg border p-4 text-sm ${
            statusBanner.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusBanner.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span>{statusBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Optional CMS Label Editor */}
      {showCmsEditor && (
        <div className="rounded-xl border border-primary/30 bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">Customize Connector Titles</h3>
              <p className="text-xs text-muted-foreground">
                Rename section headers to match your internal team terminology.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveCmsCopy}
              disabled={cmsSaving || !hasCmsChanges}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              {cmsSaving ? "Saving..." : "Save Labels"}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-medium text-foreground block mb-1">Razorpay Title</label>
              <input
                type="text"
                value={cmsConfig.connectorRazorpayTitle || ""}
                onChange={(e) =>
                  setCmsConfig((p) => ({ ...p, connectorRazorpayTitle: e.target.value }))
                }
                className="w-full h-8 rounded border border-border bg-background px-2.5"
              />
            </div>
            <div>
              <label className="font-medium text-foreground block mb-1">WhatsApp Title</label>
              <input
                type="text"
                value={cmsConfig.connectorWhatsappTitle || ""}
                onChange={(e) =>
                  setCmsConfig((p) => ({ ...p, connectorWhatsappTitle: e.target.value }))
                }
                className="w-full h-8 rounded border border-border bg-background px-2.5"
              />
            </div>
            <div>
              <label className="font-medium text-foreground block mb-1">Maps Title</label>
              <input
                type="text"
                value={cmsConfig.connectorMapboxTitle || ""}
                onChange={(e) =>
                  setCmsConfig((p) => ({ ...p, connectorMapboxTitle: e.target.value }))
                }
                className="w-full h-8 rounded border border-border bg-background px-2.5"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {!forcedTab && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-3">
          {(
            [
              { id: "all", label: "All Essential Keys", icon: Layers },
              { id: "razorpay", label: "Razorpay Payments", icon: CreditCard },
              { id: "supabase", label: "Supabase / Postgres", icon: Database },
              { id: "whatsapp", label: "WhatsApp / SMS", icon: MessageSquare },
              { id: "mapbox", label: "Google Maps / Mapbox", icon: Navigation },
              { id: "openaiGemini", label: "OpenAI / Gemini", icon: Sparkles },
              { id: "fssai", label: "FSSAI Verification", icon: ShieldAlert },
              { id: "cleartax", label: "GST & ClearTax", icon: Calculator },
              { id: "stripeAtlas", label: "Stripe USD", icon: Globe },
              { id: "payoneer", label: "Payoneer Bank", icon: Landmark },
              { id: "whatsappMarketing", label: "WhatsApp Promos", icon: Megaphone },
              { id: "telemarketing", label: "Voice Phone AI", icon: PhoneCall },
              { id: "b2bLeadGen", label: "B2B Leads", icon: Target },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card">
          <span className="text-xs text-muted-foreground">Loading saved connector settings...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. RAZORPAY PAYMENTS */}
          {(activeTab === "all" || activeTab === "razorpay") && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">Razorpay Payments</h3>
                      {renderStatusBadge("razorpay")}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Collect customer UPI, card, and netbanking payments and settle funds to your bank account.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
                    <span>Enable Razorpay</span>
                    <input
                      type="checkbox"
                      checked={config.razorpay.enabled}
                      onChange={(e) =>
                        setConfig((p) => ({
                          ...p,
                          razorpay: { ...p.razorpay, enabled: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded border-border"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTestConnection("razorpay")}
                    disabled={testingService === "razorpay"}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
                  >
                    <Zap className="h-3.5 w-3.5 text-blue-600" />
                    {testingService === "razorpay" ? "Testing..." : "Test Key"}
                  </button>
                </div>
              </div>

              {renderTestBanner("razorpay")}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    API Key ID
                  </label>
                  <input
                    type="text"
                    value={config.razorpay.keyId}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        razorpay: { ...p.razorpay, keyId: e.target.value },
                      }))
                    }
                    placeholder="rzp_live_xxxxxxxxxxxxxx"
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-foreground">API Key Secret</label>
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility("rzp_sec")}
                      className="text-[11px] text-muted-foreground flex items-center gap-1"
                    >
                      {visibleSecrets.rzp_sec ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {visibleSecrets.rzp_sec ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={visibleSecrets.rzp_sec ? "text" : "password"}
                    value={config.razorpay.keySecret}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        razorpay: { ...p.razorpay, keySecret: e.target.value },
                      }))
                    }
                    placeholder="Enter Razorpay Key Secret"
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Webhook Secret
                  </label>
                  <input
                    type="password"
                    value={config.razorpay.webhookSecret}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        razorpay: { ...p.razorpay, webhookSecret: e.target.value },
                      }))
                    }
                    placeholder="Optional webhook signature secret"
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Mode</label>
                    <select
                      value={config.razorpay.mode}
                      onChange={(e) =>
                        setConfig((p) => ({
                          ...p,
                          razorpay: { ...p.razorpay, mode: e.target.value as "live" | "test" },
                        }))
                      }
                      className="w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs"
                    >
                      <option value="live">Live Mode</option>
                      <option value="test">Test Mode</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Bank Settlement
                    </label>
                    <select
                      value={config.razorpay.settlementCycle}
                      onChange={(e) =>
                        setConfig((p) => ({
                          ...p,
                          razorpay: {
                            ...p.razorpay,
                            settlementCycle: e.target.value as "T1" | "SAME_DAY",
                          },
                        }))
                      }
                      className="w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs"
                    >
                      <option value="T1">T+1 Next Day</option>
                      <option value="SAME_DAY">Same Day Instant</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-secondary/40 border border-border p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">
                  Webhook URL to paste in Razorpay Dashboard:
                </span>
                <div className="flex items-center gap-2">
                  <code className="rounded bg-background px-2 py-1 font-mono border border-border">
                    /api/v1/kingpay/razorpay-webhook
                  </code>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        "https://orderking.in/api/v1/kingpay/razorpay-webhook",
                        "rzp_hook"
                      )
                    }
                    className="flex items-center gap-1 rounded bg-background px-2.5 py-1 border border-border font-semibold"
                  >
                    {copiedKey === "rzp_hook" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copiedKey === "rzp_hook" ? "Copied" : "Copy URL"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. SUPABASE / POSTGRES DATABASE */}
          {(activeTab === "all" || activeTab === "supabase") && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">
                        Supabase & Postgres Database
                      </h3>
                      {renderStatusBadge("supabase")}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Connect your Postgres database to store live orders, menus, riders, and GST invoices.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
                    <span>Enable Database</span>
                    <input
                      type="checkbox"
                      checked={extraConfig.supabase.enabled}
                      onChange={(e) =>
                        setExtraConfig((p) => ({
                          ...p,
                          supabase: { ...p.supabase, enabled: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded border-border"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTestConnection("supabase")}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
                  >
                    <Zap className="h-3.5 w-3.5 text-emerald-600" />
                    Test Key
                  </button>
                </div>
              </div>

              {renderTestBanner("supabase")}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    value={extraConfig.supabase.projectUrl}
                    onChange={(e) =>
                      setExtraConfig((p) => ({
                        ...p,
                        supabase: { ...p.supabase, projectUrl: e.target.value },
                      }))
                    }
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
                  />
                </div>

                <div className="rounded-lg border border-border bg-secondary/30 px-3 py-3 text-xs text-muted-foreground">Set DATABASE_URL in Cloudflare as a server secret; this browser form cannot verify or save it.</div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Supabase Anon Public Key
                  </label>
                  <input
                    type="text"
                    value={extraConfig.supabase.anonKey}
                    onChange={(e) =>
                      setExtraConfig((p) => ({
                        ...p,
                        supabase: { ...p.supabase, anonKey: e.target.value },
                      }))
                    }
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
                  />
                </div>

                <div className="rounded-lg border border-border bg-secondary/30 px-3 py-3 text-xs text-muted-foreground">Set the Supabase service-role key only in the server secret store. Never enter it in a browser.</div>
              </div>
            </div>
          )}

          {/* 3. WHATSAPP & SMS ALERTS */}
          {(activeTab === "all" || activeTab === "whatsapp") && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">WhatsApp & SMS Alerts</h3>
                      {renderStatusBadge("whatsapp")}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Send automatic order receipts, OTP codes, and live delivery updates to customers on WhatsApp.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
                    <span>Enable WhatsApp</span>
                    <input
                      type="checkbox"
                      checked={config.whatsapp.enabled}
                      onChange={(e) =>
                        setConfig((p) => ({
                          ...p,
                          whatsapp: { ...p.whatsapp, enabled: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded border-border"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTestConnection("whatsapp")}
                    disabled={testingService === "whatsapp"}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
                  >
                    <Zap className="h-3.5 w-3.5 text-green-600" />
                    {testingService === "whatsapp" ? "Testing..." : "Test Key"}
                  </button>
                </div>
              </div>

              {renderTestBanner("whatsapp")}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Provider</label>
                  <select
                    value={config.whatsapp.provider}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        whatsapp: {
                          ...p.whatsapp,
                          provider: e.target.value as "meta" | "gupshup" | "twilio",
                        },
                      }))
                    }
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs"
                  >
                    <option value="meta">Meta WhatsApp Cloud API</option>
                    <option value="gupshup">Gupshup Enterprise</option>
                    <option value="twilio">Twilio WhatsApp / SMS</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Phone Number ID
                  </label>
                  <input
                    type="text"
                    value={config.whatsapp.phoneNumberId}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        whatsapp: { ...p.whatsapp, phoneNumberId: e.target.value },
                      }))
                    }
                    placeholder="e.g. 105928374619283"
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Permanent Access Token / API Key
                  </label>
                  <input
                    type="password"
                    value={config.whatsapp.systemAccessToken}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        whatsapp: { ...p.whatsapp, systemAccessToken: e.target.value },
                      }))
                    }
                    placeholder="EAAGm0PX4ZCpsBA..."
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Approved Order Receipt Template Name
                  </label>
                  <input
                    type="text"
                    value={config.whatsapp.orderTemplateName}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        whatsapp: { ...p.whatsapp, orderTemplateName: e.target.value },
                      }))
                    }
                    placeholder="order_confirmed_v1"
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. GOOGLE MAPS & MAPBOX */}
          {(activeTab === "all" || activeTab === "mapbox") && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                    <Navigation className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">
                        Google Maps & Mapbox Routing
                      </h3>
                      {renderStatusBadge("mapbox")}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Calculate accurate road distance, delivery fees, and live rider arrival times.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
                    <span>Enable Live Maps</span>
                    <input
                      type="checkbox"
                      checked={config.mapbox.enabled}
                      onChange={(e) =>
                        setConfig((p) => ({
                          ...p,
                          mapbox: { ...p.mapbox, enabled: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded border-border"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTestConnection("mapbox")}
                    disabled={testingService === "mapbox"}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-600" />
                    {testingService === "mapbox" ? "Testing..." : "Test Key"}
                  </button>
                </div>
              </div>

              {renderTestBanner("mapbox")}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Public Map Token (Mapbox pk.* or Google Maps Key)
                  </label>
                  <input
                    type="text"
                    value={config.mapbox.publicAccessToken}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        mapbox: { ...p.mapbox, publicAccessToken: e.target.value },
                      }))
                    }
                    placeholder="pk.eyJ1Ijoib3JkZXJraW5nIi..."
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Server Routing Secret Key (Optional)
                  </label>
                  <input
                    type="password"
                    value={config.mapbox.secretRoutingToken}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        mapbox: { ...p.mapbox, secretRoutingToken: e.target.value },
                      }))
                    }
                    placeholder="sk.eyJ1Ijoib3JkZXJraW5nIi..."
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Max Delivery Radius (km)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={config.mapbox.maxServiceRadiusKm}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        mapbox: {
                          ...p.mapbox,
                          maxServiceRadiusKm: Number(e.target.value) || 10,
                        },
                      }))
                    }
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    ETA Traffic Buffer (Minutes)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={config.mapbox.etaSafetyBufferMinutes}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        mapbox: {
                          ...p.mapbox,
                          etaSafetyBufferMinutes: Number(e.target.value) || 5,
                        },
                      }))
                    }
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. OPENAI & GEMINI AI KEYS */}
          {(activeTab === "all" || activeTab === "openaiGemini") && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">
                        OpenAI & Google Gemini AI
                      </h3>
                      {renderStatusBadge("openaiGemini")}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Power automated customer support replies, menu descriptions, and daily business summaries.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
                    <span>Enable AI Assistant</span>
                    <input
                      type="checkbox"
                      checked={extraConfig.openaiGemini.enabled}
                      onChange={(e) =>
                        setExtraConfig((p) => ({
                          ...p,
                          openaiGemini: { ...p.openaiGemini, enabled: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded border-border"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTestConnection("openaiGemini")}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
                  >
                    <Zap className="h-3.5 w-3.5 text-purple-600" />
                    Test Key
                  </button>
                </div>
              </div>

              {renderTestBanner("openaiGemini")}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-secondary/30 px-3 py-3 text-xs text-muted-foreground">Set the Gemini API key as a server secret. This page cannot save or verify it.</div>

                <div className="rounded-lg border border-border bg-secondary/30 px-3 py-3 text-xs text-muted-foreground">Set the OpenAI API key as a server secret. This page cannot save or verify it.</div>
              </div>
            </div>
          )}

          {/* 6. FSSAI & CLEARTAX GST */}
          {(activeTab === "all" || activeTab === "fssai" || activeTab === "cleartax") && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(activeTab === "all" || activeTab === "fssai") && (
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">FSSAI License Verification</h3>
                        {renderStatusBadge("fssai")}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Verify 14-digit restaurant FSSAI food safety licenses before activation.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.fssai.enabled}
                      onChange={(e) =>
                        setConfig((p) => ({
                          ...p,
                          fssai: { ...p.fssai, enabled: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded border-border"
                    />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">
                        FoSCoS Client ID
                      </label>
                      <input
                        type="text"
                        value={config.fssai.clientId}
                        onChange={(e) =>
                          setConfig((p) => ({
                            ...p,
                            fssai: { ...p.fssai, clientId: e.target.value },
                          }))
                        }
                        placeholder="Enter FSSAI API Client ID"
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">
                        Authorization Token
                      </label>
                      <input
                        type="password"
                        value={config.fssai.authorizationToken}
                        onChange={(e) =>
                          setConfig((p) => ({
                            ...p,
                            fssai: { ...p.fssai, authorizationToken: e.target.value },
                          }))
                        }
                        placeholder="Enter FoSCoS Secret Token"
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(activeTab === "all" || activeTab === "cleartax") && (
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">ClearTax GST Invoicing</h3>
                        {renderStatusBadge("cleartax")}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Automate CGST/SGST Sec 9(5) calculation and restaurant GSTIN checks.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.cleartax.enabled}
                      onChange={(e) =>
                        setConfig((p) => ({
                          ...p,
                          cleartax: { ...p.cleartax, enabled: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded border-border"
                    />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">
                        Platform GSTIN
                      </label>
                      <input
                        type="text"
                        value={config.cleartax.gstin}
                        onChange={(e) =>
                          setConfig((p) => ({
                            ...p,
                            cleartax: { ...p.cleartax, gstin: e.target.value.toUpperCase() },
                          }))
                        }
                        placeholder="29AAACZ1234A1Z5"
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">
                        ClearTax API Auth Key
                      </label>
                      <input
                        type="password"
                        value={config.cleartax.authKey}
                        onChange={(e) =>
                          setConfig((p) => ({
                            ...p,
                            cleartax: { ...p.cleartax, authKey: e.target.value },
                          }))
                        }
                        placeholder="Enter ClearTax Auth Key"
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7. ADDITIONAL CONNECTORS (Stripe, Payoneer, WhatsApp Promos, Voice AI, B2B Leads) */}
          {activeTab === "stripeAtlas" && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">Stripe USD Payments</h3>
                    {renderStatusBadge("stripeAtlas")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Accept international USD card payments and SaaS subscriptions.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.stripeAtlas.enabled}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      stripeAtlas: { ...p.stripeAtlas, enabled: e.target.checked },
                    }))
                  }
                  className="h-4 w-4 rounded border-border"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">Publishable Key</label>
                  <input
                    type="text"
                    value={config.stripeAtlas.publishableKey}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        stripeAtlas: { ...p.stripeAtlas, publishableKey: e.target.value },
                      }))
                    }
                    placeholder="pk_live_..."
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Secret Key</label>
                  <input
                    type="password"
                    value={config.stripeAtlas.secretKey}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        stripeAtlas: { ...p.stripeAtlas, secretKey: e.target.value },
                      }))
                    }
                    placeholder="sk_live_..."
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "payoneer" && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">Payoneer Cross-Border</h3>
                    {renderStatusBadge("payoneer")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Receive international wire and ACH transfers.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.payoneer.enabled}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      payoneer: { ...p.payoneer, enabled: e.target.checked },
                    }))
                  }
                  className="h-4 w-4 rounded border-border"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">Program ID</label>
                  <input
                    type="text"
                    value={config.payoneer.programId}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        payoneer: { ...p.payoneer, programId: e.target.value },
                      }))
                    }
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Client Secret</label>
                  <input
                    type="password"
                    value={config.payoneer.clientSecret}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        payoneer: { ...p.payoneer, clientSecret: e.target.value },
                      }))
                    }
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "whatsappMarketing" && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">WhatsApp Promo Broadcasts</h3>
                    {renderStatusBadge("whatsappMarketing")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Send opt-in festival offers and reorder reminders on WhatsApp.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.whatsappMarketing.enabled}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      whatsappMarketing: { ...p.whatsappMarketing, enabled: e.target.checked },
                    }))
                  }
                  className="h-4 w-4 rounded border-border"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">Phone Number ID</label>
                  <input
                    type="text"
                    value={config.whatsappMarketing.phoneNumberId}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        whatsappMarketing: {
                          ...p.whatsappMarketing,
                          phoneNumberId: e.target.value,
                        },
                      }))
                    }
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Marketing API Key</label>
                  <input
                    type="password"
                    value={config.whatsappMarketing.apiKey}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        whatsappMarketing: { ...p.whatsappMarketing, apiKey: e.target.value },
                      }))
                    }
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "telemarketing" && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">Voice Phone AI</h3>
                    {renderStatusBadge("telemarketing")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Configure Bland.ai or Twilio Voice credentials for automated merchant onboarding calls.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.telemarketing.enabled}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      telemarketing: { ...p.telemarketing, enabled: e.target.checked },
                    }))
                  }
                  className="h-4 w-4 rounded border-border"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">API Key</label>
                  <input
                    type="password"
                    value={config.telemarketing.apiKey}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        telemarketing: { ...p.telemarketing, apiKey: e.target.value },
                      }))
                    }
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Outbound Caller ID</label>
                  <input
                    type="text"
                    value={config.telemarketing.fromPhoneNumber}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        telemarketing: { ...p.telemarketing, fromPhoneNumber: e.target.value },
                      }))
                    }
                    placeholder="+918047123456"
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "b2bLeadGen" && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">B2B Franchise Leads</h3>
                    {renderStatusBadge("b2bLeadGen")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Connect Apollo or LinkedIn API keys for restaurant partner outreach.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.b2bLeadGen.enabled}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      b2bLeadGen: { ...p.b2bLeadGen, enabled: e.target.checked },
                    }))
                  }
                  className="h-4 w-4 rounded border-border"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">Apollo API Key</label>
                  <input
                    type="password"
                    value={config.b2bLeadGen.apolloApiKey}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        b2bLeadGen: { ...p.b2bLeadGen, apolloApiKey: e.target.value },
                      }))
                    }
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">LinkedIn Access Token</label>
                  <input
                    type="password"
                    value={config.b2bLeadGen.linkedinAccessToken}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        b2bLeadGen: { ...p.b2bLeadGen, linkedinAccessToken: e.target.value },
                      }))
                    }
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dedicated Sub-Hubs when requested via forcedTab */}
          {activeTab === "geospatialAdExchange" && (
            <div className="rounded-xl border border-primary/20 bg-card p-6 shadow-sm space-y-6">
              <GeospatialAdHub
                config={config.geospatialAdExchange}
                onUpdate={(updates) =>
                  setConfig((prev) => ({
                    ...prev,
                    geospatialAdExchange: { ...prev.geospatialAdExchange, ...updates },
                  }))
                }
                cmsConfig={cmsConfig}
                onSave={handleSave}
                isSaving={saving}
              />
            </div>
          )}

          {activeTab === "metaOmnichannel" && (
            <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-sm space-y-6">
              <MetaOmnichannelHub
                config={config.metaOmnichannel}
                onUpdate={(updates) =>
                  setConfig((prev) => ({
                    ...prev,
                    metaOmnichannel: { ...prev.metaOmnichannel, ...updates },
                  }))
                }
                cmsConfig={cmsConfig}
                onSave={handleSave}
                isSaving={saving}
              />
            </div>
          )}

          {activeTab === "aiMediaEngine" && (
            <div className="rounded-xl border border-emerald-500/20 bg-card p-6 shadow-sm space-y-6">
              <AiMediaEngineHub
                config={config.aiMediaEngine}
                onUpdate={(updates) =>
                  setConfig((prev) => ({
                    ...prev,
                    aiMediaEngine: { ...prev.aiMediaEngine, ...updates },
                  }))
                }
                cmsConfig={cmsConfig}
                onSave={handleSave}
                isSaving={saving}
              />
            </div>
          )}

          {activeTab === "globalAdSyndicate" && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm space-y-6">
              <GlobalAdSyndicateHub
                config={config.globalAdSyndicate}
                onUpdate={(updates) =>
                  setConfig((prev) => ({
                    ...prev,
                    globalAdSyndicate: { ...prev.globalAdSyndicate, ...updates },
                  }))
                }
                cmsConfig={cmsConfig}
                onSave={handleSave}
                isSaving={saving}
              />
            </div>
          )}

          {activeTab === "oemLockScreen" && (
            <div className="rounded-xl border border-purple-200 bg-white shadow-sm space-y-6">
              <OemLockScreenHub
                config={config.oemLockScreen}
                onUpdate={(updates) =>
                  setConfig((prev) => ({
                    ...prev,
                    oemLockScreen: { ...prev.oemLockScreen, ...updates },
                  }))
                }
                cmsConfig={cmsConfig}
                onSave={handleSave}
                isSaving={saving}
              />
            </div>
          )}

          {activeTab === "wifiCaptivePortal" && (
            <div className="rounded-xl border border-blue-200 bg-white shadow-sm space-y-6">
              <WifiCaptivePortalHub
                config={config.wifiCaptivePortal}
                onUpdate={(updates) =>
                  setConfig((prev) => ({
                    ...prev,
                    wifiCaptivePortal: { ...prev.wifiCaptivePortal, ...updates },
                  }))
                }
                cmsConfig={cmsConfig}
                onSave={handleSave}
                isSaving={saving}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
