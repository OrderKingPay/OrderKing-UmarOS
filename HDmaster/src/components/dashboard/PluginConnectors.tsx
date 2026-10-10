import { useState, useEffect, useMemo } from "react";
import {
  DEFAULT_PLUGIN_CONNECTORS,
  type PluginConnectorsConfig,
  type RazorpayConnector,
  type StripeAtlasConnector,
  type PayoneerConnector,
  type WhatsAppConnector,
  type FssaiConnector,
  type MapboxConnector,
  type ClearTaxConnector,
  type WhatsAppMarketingConnector,
  type B2bLeadGenConnector,
  type AiTelemarketingConnector,
  type GeospatialAdExchangeConnector,
  type MetaOmnichannelConnector,
  type AiDeepfakeMediaConnector,
  type GlobalAdSyndicateConnector,
  type OemLockScreenConnector,
  type WifiCaptivePortalConnector,
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
  HelpCircle,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Copy,
  Check,
  Zap,
  Activity,
  Layers,
  ExternalLink,
  Lock,
  Calculator,
  Megaphone,
  Edit3,
  ShieldCheck,
  Target,
  Building2,
  Globe,
  Users,
  Landmark,
  DollarSign,
  ArrowRightLeft,
  PhoneCall,
  PhoneForwarded,
  Bot,
  Sparkles,
  Mic,
  Crosshair,
  Radio,
  Share2,
  Video,
  Smartphone,
  Wifi,
} from "lucide-react";

type ConnectorTab =
  | "all"
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

export function PluginConnectors() {
  const [config, setConfig] = useState<PluginConnectorsConfig>(DEFAULT_PLUGIN_CONNECTORS);
  const [initialConfig, setInitialConfig] = useState<PluginConnectorsConfig>(DEFAULT_PLUGIN_CONNECTORS);
  const [cmsConfig, setCmsConfig] = useState<EcosystemCmsConfig>(DEFAULT_ECOSYSTEM_CMS);
  const [initialCmsConfig, setInitialCmsConfig] = useState<EcosystemCmsConfig>(DEFAULT_ECOSYSTEM_CMS);
  const [showCmsEditor, setShowCmsEditor] = useState(false);
  const [cmsSaving, setCmsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<ConnectorTab>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingService, setTestingService] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; message: string; timestamp: string }>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [statusBanner, setStatusBanner] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Load config on mount
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        setLoading(true);
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
          } catch {}
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
        console.error("Error loading Plugin Connectors:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  const hasChanges = useMemo(() => {
    return JSON.stringify(config) !== JSON.stringify(initialConfig);
  }, [config, initialConfig]);

  const hasCmsChanges = useMemo(() => {
    return JSON.stringify(cmsConfig) !== JSON.stringify(initialCmsConfig);
  }, [cmsConfig, initialCmsConfig]);

  const toggleSecretVisibility = (fieldId: string) => {
    setVisibleSecrets((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setStatusBanner(null);

      let success = false;
      try {
        const res = await savePluginConnectorsFn({ data: { connectors: config } });
        if (res && res.ok && res.data) {
          setConfig(res.data);
          setInitialConfig(res.data);
          success = true;
        }
      } catch {
        const resp = await fetch("/api/v1/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plugin_connectors: config }),
        });
        if (resp.ok) {
          setInitialConfig(config);
          success = true;
        }
      }

      if (success) {
        setStatusBanner({
          type: "success",
          text: "Integration switchboard credentials and configuration successfully committed to platform settings.",
        });
        setTimeout(() => setStatusBanner(null), 6000);
      } else {
        setStatusBanner({
          type: "error",
          text: "Failed to persist connector settings. Please verify administrator permissions.",
        });
      }
    } catch (err: any) {
      setStatusBanner({
        type: "error",
        text: err?.message || "Unexpected exception during connector synchronization.",
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
        setStatusBanner({
          type: "success",
          text: "CMS content copy successfully updated and synchronized across all connector surfaces.",
        });
        setTimeout(() => setStatusBanner(null), 6000);
      } else {
        setStatusBanner({
          type: "error",
          text: "Failed to save CMS copy. Please check network logs.",
        });
      }
    } catch (err: any) {
      setStatusBanner({
        type: "error",
        text: err?.message || "Unexpected error saving CMS copy.",
      });
    } finally {
      setCmsSaving(false);
    }
  };

  const handleTestConnection = async (
    service:
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
      | "aiMediaEngine"
  ) => {
    try {
      setTestingService(service);
      const payload = config[service];
      const res = await testPluginConnectorFn({ data: { service, payload } });
      const nowStr = new Date().toLocaleTimeString();

      if (res && res.ok) {
        setTestResults((prev) => ({
          ...prev,
          [service]: { ok: true, message: res.message || "Connection Verified Successfully", timestamp: nowStr },
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [service]: {
            ok: false,
            message: (res as any)?.error || "Connectivity diagnostic returned unverified state. Check credentials.",
            timestamp: nowStr,
          },
        }));
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [service]: {
          ok: false,
          message: err?.message || "Connectivity diagnostic probe failure.",
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
    } finally {
      setTestingService(null);
    }
  };

  // Live status helpers
  const getConnectorStatus = (
    service:
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
      | "aiMediaEngine"
      | "globalAdSyndicate"
      | "oemLockScreen"
      | "wifiCaptivePortal"
  ) => {
    const item = config[service];
    let isConfigured = false;
    if (service === "razorpay") isConfigured = !!(item as RazorpayConnector).keyId && !!(item as RazorpayConnector).keySecret;
    if (service === "stripeAtlas") {
      const s = item as StripeAtlasConnector;
      isConfigured = !!s.publishableKey && !!s.secretKey;
    }
    if (service === "payoneer") {
      const p = item as PayoneerConnector;
      isConfigured = !!p.programId && (!!p.accountNumber || !!p.clientSecret);
    }
    if (service === "whatsapp") isConfigured = !!(item as WhatsAppConnector).phoneNumberId && !!(item as WhatsAppConnector).systemAccessToken;
    if (service === "fssai") isConfigured = !!(item as FssaiConnector).clientId && !!(item as FssaiConnector).authorizationToken;
    if (service === "mapbox") isConfigured = !!(item as MapboxConnector).publicAccessToken;
    if (service === "cleartax") isConfigured = !!(item as ClearTaxConnector).authKey && !!(item as ClearTaxConnector).gstin;
    if (service === "whatsappMarketing") isConfigured = !!(item as WhatsAppMarketingConnector).apiKey && !!(item as WhatsAppMarketingConnector).phoneNumberId;
    if (service === "b2bLeadGen") {
      const b = item as B2bLeadGenConnector;
      isConfigured = !!b.apolloApiKey || !!(b.linkedinClientId && b.linkedinClientSecret) || !!b.linkedinAccessToken;
    }
    if (service === "telemarketing") {
      const t = item as AiTelemarketingConnector;
      isConfigured = !!t.apiKey || (!!t.accountSid && !!t.apiSecret);
    }
    if (service === "geospatialAdExchange") {
      const g = item as unknown as GeospatialAdExchangeConnector;
      isConfigured =
        !!(g.jioAdsClientId && g.jioAdsClientSecret) ||
        !!(g.airtelPartnerId && g.airtelXstreamToken) ||
        !!(g.inmobiAccountId && g.inmobiDspSecret);
    }
    if (service === "metaOmnichannel") {
      const m = item as unknown as MetaOmnichannelConnector;
      isConfigured =
        !!m.metaAppId &&
        !!m.appSecret &&
        !!m.systemAccessToken &&
        !!m.whatsappBusinessAccountId;
    }
    if (service === "aiMediaEngine") {
      const a = item as unknown as AiDeepfakeMediaConnector;
      isConfigured = !!a.heygenApiKey || !!a.synthesiaApiKey;
    }
    if (service === "globalAdSyndicate") {
      isConfigured = !!item.enabled;
    }
    if (service === "oemLockScreen") {
      const o = item as unknown as OemLockScreenConnector;
      isConfigured = !!o.glancePublisherApiKey || !!o.samsungKnoxAdvertiserId;
    }
    if (service === "wifiCaptivePortal") {
      const w = item as unknown as WifiCaptivePortalConnector;
      isConfigured = !!w.apiAuthToken || (w.routers && w.routers.length > 0) || !!w.routerMacAddress;
    }

    if (!isConfigured) return { status: "NOT_CONFIGURED" as const, label: "NOT CONFIGURED", tone: "neutral" as const };
    if (!item.enabled) return { status: "STANDBY" as const, label: "Standby / Disabled", tone: "amber" as const };
    return { status: "CONNECTED" as const, label: "Active & Connected", tone: "emerald" as const };
  };

  // Metrics summary
  const summaryMetrics = useMemo(() => {
    let configuredCount = 0;
    let activeCount = 0;
    ([
      "globalAdSyndicate",
      "oemLockScreen",
      "wifiCaptivePortal",
      "razorpay",
      "stripeAtlas",
      "payoneer",
      "whatsapp",
      "fssai",
      "mapbox",
      "cleartax",
      "whatsappMarketing",
      "b2bLeadGen",
      "telemarketing",
      "geospatialAdExchange",
      "metaOmnichannel",
      "aiMediaEngine",
    ] as const).forEach((svc) => {
      const st = getConnectorStatus(svc);
      if (st.status !== "NOT_CONFIGURED") configuredCount++;
      if (st.status === "CONNECTED") activeCount++;
    });
    return { configuredCount, activeCount, total: 16 };
  }, [config]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  {cmsConfig.connectorsHubTitle || "Plugin Switchboard & External Connectors"}
                </h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary border border-primary/20">
                  {summaryMetrics.activeCount} / {summaryMetrics.total} Active
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {cmsConfig.connectorsHubSubtitle || "Institutional integration management. Securely configure Razorpay payment rails, WhatsApp Business API, FSSAI regulatory verification, Mapbox geospatial telemetry, ClearTax automated GST calculation, automated WhatsApp marketing campaigns, B2B Franchise Lead Generation, and Bland.ai / Twilio Voice autonomous restaurant telemarketing."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowCmsEditor((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              showCmsEditor
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border bg-secondary/50 text-foreground hover:bg-secondary"
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>{showCmsEditor ? "Close Copy Editor" : "Edit Copy in CMS"}</span>
          </button>

          {hasChanges && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Discard unsaved integration modifications?")) setConfig(initialConfig);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Discard Changes
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
            {saving ? "Persisting Credentials..." : hasChanges ? "Save Switchboard Configuration" : "Configuration In Sync"}
          </button>
        </div>
      </div>

      {/* Status Notifications */}
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

      {/* Inline CMS Copy Customizer Panel */}
      {showCmsEditor && (
        <div className="rounded-xl border border-primary/30 bg-card p-6 shadow-md space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Edit3 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Connector Words & Copy Live CMS Controller
                </h3>
                <p className="text-xs text-muted-foreground">
                  Every title, subtitle, toggle label, button text, and compliance notice across all 6 connectors is fully controllable via CMS.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasCmsChanges && (
                <button
                  type="button"
                  onClick={() => setCmsConfig(initialCmsConfig)}
                  className="rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Reset Copy
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveCmsCopy}
                disabled={cmsSaving || !hasCmsChanges}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold shadow-xs ${
                  hasCmsChanges
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                <Save className="h-3.5 w-3.5" />
                {cmsSaving ? "Saving Copy..." : "Save Copy to CMS"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Hub Header Title</label>
              <input
                type="text"
                value={cmsConfig.connectorsHubTitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorsHubTitle: e.target.value }))}
                placeholder="Plugin Switchboard & External Connectors"
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">ClearTax Connector Title</label>
              <input
                type="text"
                value={cmsConfig.connectorClearTaxTitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorClearTaxTitle: e.target.value }))}
                placeholder="Automated Tax Calculation (ClearTax)"
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">ClearTax Subtitle</label>
              <input
                type="text"
                value={cmsConfig.connectorClearTaxSubtitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorClearTaxSubtitle: e.target.value }))}
                placeholder="Statutory automated GST calculation..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">ClearTax Toggle Label</label>
              <input
                type="text"
                value={cmsConfig.connectorClearTaxToggleLabel || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorClearTaxToggleLabel: e.target.value }))}
                placeholder="Tax Engine Active"
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">ClearTax Diagnostic Test Button</label>
              <input
                type="text"
                value={cmsConfig.connectorClearTaxTestBtnText || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorClearTaxTestBtnText: e.target.value }))}
                placeholder="Test ClearTax Diagnostic"
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">ClearTax Policy Title</label>
              <input
                type="text"
                value={cmsConfig.connectorClearTaxPolicyTitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorClearTaxPolicyTitle: e.target.value }))}
                placeholder="Statutory GST & E-Invoicing Enforcement"
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-medium text-foreground">ClearTax Policy Disclaimer</label>
              <input
                type="text"
                value={cmsConfig.connectorClearTaxPolicyNotice || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorClearTaxPolicyNotice: e.target.value }))}
                placeholder="Generates IRN & QR-coded e-invoices instantly..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">WhatsApp Marketing Title</label>
              <input
                type="text"
                value={cmsConfig.connectorWhatsappMarketingTitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorWhatsappMarketingTitle: e.target.value }))}
                placeholder="Automated WhatsApp Marketing"
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">WhatsApp Marketing Subtitle</label>
              <input
                type="text"
                value={cmsConfig.connectorWhatsappMarketingSubtitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorWhatsappMarketingSubtitle: e.target.value }))}
                placeholder="High-conversion automated customer re-engagement..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">WhatsApp Marketing Toggle Label</label>
              <input
                type="text"
                value={cmsConfig.connectorWhatsappMarketingToggleLabel || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorWhatsappMarketingToggleLabel: e.target.value }))}
                placeholder="Marketing Engine Active"
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">WhatsApp Marketing Test Button</label>
              <input
                type="text"
                value={cmsConfig.connectorWhatsappMarketingTestBtnText || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorWhatsappMarketingTestBtnText: e.target.value }))}
                placeholder="Test Broadcast Dispatch"
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">WhatsApp Marketing Policy Title</label>
              <input
                type="text"
                value={cmsConfig.connectorWhatsappMarketingPolicyTitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorWhatsappMarketingPolicyTitle: e.target.value }))}
                placeholder="Strict DND & Anti-Spam Marketing Policy"
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">WhatsApp Marketing Opt-Out Notice</label>
              <input
                type="text"
                value={cmsConfig.connectorWhatsappMarketingOptInNotice || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorWhatsappMarketingOptInNotice: e.target.value }))}
                placeholder="Automatic Unsubscribe Handler..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-medium text-foreground">WhatsApp Marketing Policy Notice</label>
              <input
                type="text"
                value={cmsConfig.connectorWhatsappMarketingPolicyNotice || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorWhatsappMarketingPolicyNotice: e.target.value }))}
                placeholder="Ensures all automated promotional broadcasts respect 10:00 AM - 09:00 PM..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            {/* 8. B2B Franchise Lead Generation (Apollo / LinkedIn API) */}
            <div className="space-y-1 md:col-span-2 pt-2 border-t border-border">
              <span className="font-semibold text-primary">B2B Franchise Lead Generation (Apollo / LinkedIn) CMS Labels</span>
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">B2B Lead Gen Card Title</label>
              <input
                type="text"
                value={cmsConfig.connectorB2bLeadGenTitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorB2bLeadGenTitle: e.target.value }))}
                placeholder="B2B Franchise Lead Generation (Apollo / LinkedIn API)..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">B2B Lead Gen Toggle Label</label>
              <input
                type="text"
                value={cmsConfig.connectorB2bLeadGenToggleLabel || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorB2bLeadGenToggleLabel: e.target.value }))}
                placeholder="Lead Gen Engine Active..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-medium text-foreground">B2B Lead Gen Subtitle</label>
              <input
                type="text"
                value={cmsConfig.connectorB2bLeadGenSubtitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorB2bLeadGenSubtitle: e.target.value }))}
                placeholder="Enterprise B2B prospecting rail..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">B2B Lead Gen Test Button Text</label>
              <input
                type="text"
                value={cmsConfig.connectorB2bLeadGenTestBtnText || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorB2bLeadGenTestBtnText: e.target.value }))}
                placeholder="Verify Prospecting Handshake..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">B2B Lead Gen Policy Title</label>
              <input
                type="text"
                value={cmsConfig.connectorB2bLeadGenPolicyTitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorB2bLeadGenPolicyTitle: e.target.value }))}
                placeholder="High-Ticket Enterprise Outreach & Compliance Guard..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-medium text-foreground">B2B Lead Gen Policy Notice</label>
              <input
                type="text"
                value={cmsConfig.connectorB2bLeadGenPolicyNotice || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorB2bLeadGenPolicyNotice: e.target.value }))}
                placeholder="Automated multi-channel persona mapping targeting VP of Franchising..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            {/* 9. Stripe Atlas (USD B2B SaaS) */}
            <div className="space-y-1 md:col-span-2 pt-2 border-t border-border">
              <span className="font-semibold text-primary">Stripe Atlas (USD B2B SaaS Delaware C-Corp) CMS Labels</span>
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Stripe Atlas Card Title</label>
              <input
                type="text"
                value={cmsConfig.connectorStripeAtlasTitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorStripeAtlasTitle: e.target.value }))}
                placeholder="Stripe Atlas (USD B2B SaaS)..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Stripe Atlas Toggle Label</label>
              <input
                type="text"
                value={cmsConfig.connectorStripeAtlasToggleLabel || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorStripeAtlasToggleLabel: e.target.value }))}
                placeholder="Stripe Atlas Router Active..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-medium text-foreground">Stripe Atlas Subtitle</label>
              <input
                type="text"
                value={cmsConfig.connectorStripeAtlasSubtitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorStripeAtlasSubtitle: e.target.value }))}
                placeholder="Delaware C-Corp global USD merchant rail..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Stripe Atlas Test Button Text</label>
              <input
                type="text"
                value={cmsConfig.connectorStripeAtlasTestBtnText || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorStripeAtlasTestBtnText: e.target.value }))}
                placeholder="Verify Stripe Atlas Handshake..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Stripe Atlas Policy Title</label>
              <input
                type="text"
                value={cmsConfig.connectorStripeAtlasPolicyTitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorStripeAtlasPolicyTitle: e.target.value }))}
                placeholder="Delaware C-Corp B2B SaaS Invoicing & US Compliance..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-medium text-foreground">Stripe Atlas Policy Notice</label>
              <input
                type="text"
                value={cmsConfig.connectorStripeAtlasPolicyNotice || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorStripeAtlasPolicyNotice: e.target.value }))}
                placeholder="Collects direct USD revenue into US corporate accounts..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* 10. Payoneer Cross-Border Routing */}
            <div className="space-y-1 md:col-span-2 pt-2 border-t border-border">
              <span className="font-semibold text-primary">Payoneer Cross-Border Routing CMS Labels</span>
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Payoneer Card Title</label>
              <input
                type="text"
                value={cmsConfig.connectorPayoneerTitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorPayoneerTitle: e.target.value }))}
                placeholder="Payoneer Cross-Border Routing..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Payoneer Toggle Label</label>
              <input
                type="text"
                value={cmsConfig.connectorPayoneerToggleLabel || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorPayoneerToggleLabel: e.target.value }))}
                placeholder="Payoneer Cross-Border Active..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-medium text-foreground">Payoneer Subtitle</label>
              <input
                type="text"
                value={cmsConfig.connectorPayoneerSubtitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorPayoneerSubtitle: e.target.value }))}
                placeholder="Institutional cross-border ACH & wire clearing network..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Payoneer Test Button Text</label>
              <input
                type="text"
                value={cmsConfig.connectorPayoneerTestBtnText || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorPayoneerTestBtnText: e.target.value }))}
                placeholder="Verify Payoneer ACH Rail..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Payoneer Policy Title</label>
              <input
                type="text"
                value={cmsConfig.connectorPayoneerPolicyTitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorPayoneerPolicyTitle: e.target.value }))}
                placeholder="Global Cross-Border Liquidity & Commercial ACH Routing..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-medium text-foreground">Payoneer Policy Notice</label>
              <input
                type="text"
                value={cmsConfig.connectorPayoneerPolicyNotice || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorPayoneerPolicyNotice: e.target.value }))}
                placeholder="Enables direct collection of international franchise royalty fees..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* AI Telemarketing */}
            <div className="space-y-1">
              <label className="font-medium text-foreground">AI Telemarketing Title</label>
              <input
                type="text"
                value={cmsConfig.connectorTelemarketingTitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorTelemarketingTitle: e.target.value }))}
                placeholder="Bland.ai / Twilio Voice (Autonomous Restaurant Pitching)..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">AI Telemarketing Toggle Label</label>
              <input
                type="text"
                value={cmsConfig.connectorTelemarketingToggleLabel || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorTelemarketingToggleLabel: e.target.value }))}
                placeholder="AI Sales Engine Active..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-medium text-foreground">AI Telemarketing Subtitle</label>
              <input
                type="text"
                value={cmsConfig.connectorTelemarketingSubtitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorTelemarketingSubtitle: e.target.value }))}
                placeholder="Autonomous AI sales force that dials Indian restaurant owners, pitches the Zero-Setup-Fee and 0% commission direct ordering platform..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">AI Telemarketing Test Button Text</label>
              <input
                type="text"
                value={cmsConfig.connectorTelemarketingTestBtnText || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorTelemarketingTestBtnText: e.target.value }))}
                placeholder="Test AI Voice Dial Probe..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">AI Telemarketing Policy Title</label>
              <input
                type="text"
                value={cmsConfig.connectorTelemarketingPolicyTitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorTelemarketingPolicyTitle: e.target.value }))}
                placeholder="TRAI Telemarketing & DND Regulatory Compliance Guard..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-medium text-foreground">AI Telemarketing Policy Notice</label>
              <input
                type="text"
                value={cmsConfig.connectorTelemarketingPolicyNotice || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorTelemarketingPolicyNotice: e.target.value }))}
                placeholder="Commercial communications strictly scrubbed against the National Do-Not-Call (NDNC) registry..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* 12. UmarOS Carpet-Bombing Ad Exchange */}
            <div className="space-y-1 md:col-span-2 pt-2 border-t border-border">
              <span className="font-semibold text-primary">UmarOS Carpet-Bombing Telecom Ad Exchange CMS Labels</span>
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Exchange Card Title</label>
              <input
                type="text"
                value={cmsConfig.connectorGeospatialAdTitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorGeospatialAdTitle: e.target.value }))}
                placeholder="UmarOS Carpet-Bombing Ad Exchange..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Exchange Toggle Label</label>
              <input
                type="text"
                value={cmsConfig.connectorGeospatialAdToggleLabel || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorGeospatialAdToggleLabel: e.target.value }))}
                placeholder="Geospatial Ad Exchange Active..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-medium text-foreground">Exchange Subtitle</label>
              <input
                type="text"
                value={cmsConfig.connectorGeospatialAdSubtitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorGeospatialAdSubtitle: e.target.value }))}
                placeholder="Geospatial programmatic ad network..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Diagnostic Test Button</label>
              <input
                type="text"
                value={cmsConfig.connectorGeospatialAdTestBtnText || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorGeospatialAdTestBtnText: e.target.value }))}
                placeholder="Verify Telecom & DSP Handshake..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Regulatory Policy Title</label>
              <input
                type="text"
                value={cmsConfig.connectorGeospatialAdPolicyTitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorGeospatialAdPolicyTitle: e.target.value }))}
                placeholder="TRAI TCCCPR 2018 & Indian Telegraph Act Compliance..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-medium text-foreground">Regulatory Policy Notice</label>
              <input
                type="text"
                value={cmsConfig.connectorGeospatialAdPolicyNotice || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorGeospatialAdPolicyNotice: e.target.value }))}
                placeholder="Commercial communications strictly bound to TRAI DLT Principal Entity headers..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* 13. Meta Omnichannel Geo-Blast */}
            <div className="space-y-1 md:col-span-2 pt-2 border-t border-border">
              <span className="font-semibold text-primary">Meta Omnichannel Geo-Blast Engine CMS Labels</span>
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Connector Title</label>
              <input
                type="text"
                value={cmsConfig.connectorMetaOmnichannelTitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorMetaOmnichannelTitle: e.target.value }))}
                placeholder="Meta Omnichannel Geo-Blast Engine..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Engine Toggle Label</label>
              <input
                type="text"
                value={cmsConfig.connectorMetaOmnichannelToggleLabel || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorMetaOmnichannelToggleLabel: e.target.value }))}
                placeholder="Meta Omnichannel Active..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-medium text-foreground">Connector Subtitle</label>
              <input
                type="text"
                value={cmsConfig.connectorMetaOmnichannelSubtitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorMetaOmnichannelSubtitle: e.target.value }))}
                placeholder="Automated Direct Messaging acquisition across Instagram, Messenger, and WhatsApp..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Handshake Test Button Label</label>
              <input
                type="text"
                value={cmsConfig.connectorMetaOmnichannelTestBtnText || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorMetaOmnichannelTestBtnText: e.target.value }))}
                placeholder="Test Graph API Handshake..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Policy Title</label>
              <input
                type="text"
                value={cmsConfig.connectorMetaOmnichannelPolicyTitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorMetaOmnichannelPolicyTitle: e.target.value }))}
                placeholder="Meta Platform Terms & TRAI NDNC Compliance..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-medium text-foreground">Policy Notice</label>
              <input
                type="text"
                value={cmsConfig.connectorMetaOmnichannelPolicyNotice || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorMetaOmnichannelPolicyNotice: e.target.value }))}
                placeholder="Direct messaging operates in compliance with Meta Graph API v21.0..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* AI Media Engine CMS */}
            <div className="md:col-span-2 pt-2 border-t border-border">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                AI Deepfake Media Engine (Synthesia / HeyGen API) Copy
              </span>
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Connector Title</label>
              <input
                type="text"
                value={cmsConfig.connectorAiMediaEngineTitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorAiMediaEngineTitle: e.target.value }))}
                placeholder="AI Deepfake Media Engine (Synthesia / HeyGen API)"
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Toggle Switch Label</label>
              <input
                type="text"
                value={cmsConfig.connectorAiMediaEngineToggleLabel || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorAiMediaEngineToggleLabel: e.target.value }))}
                placeholder="Enable AI Media Engine"
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-medium text-foreground">Connector Subtitle</label>
              <input
                type="text"
                value={cmsConfig.connectorAiMediaEngineSubtitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorAiMediaEngineSubtitle: e.target.value }))}
                placeholder="Autonomous viral avatar video generator for the Founder..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Handshake Test Button Label</label>
              <input
                type="text"
                value={cmsConfig.connectorAiMediaEngineTestBtnText || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorAiMediaEngineTestBtnText: e.target.value }))}
                placeholder="Verify Synthesia / HeyGen Handshake..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-foreground">Policy Title</label>
              <input
                type="text"
                value={cmsConfig.connectorAiMediaEnginePolicyTitle || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorAiMediaEnginePolicyTitle: e.target.value }))}
                placeholder="Autonomous Synthetic Media Guard..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-medium text-foreground">Policy Notice</label>
              <input
                type="text"
                value={cmsConfig.connectorAiMediaEnginePolicyNotice || ""}
                onChange={(e) => setCmsConfig((prev) => ({ ...prev, connectorAiMediaEnginePolicyNotice: e.target.value }))}
                placeholder="All AI-generated video outputs strictly observe synthetic media transparency..."
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {[
          { id: "all" as const, label: "All Integrations", icon: Layers },
          { id: "globalAdSyndicate" as const, label: "Global Ad Syndicate Hub (4 Streams)", icon: Landmark },
          { id: "oemLockScreen" as const, label: "OEM Lock-Screen Ads (Glance / InMobi)", icon: Smartphone },
          { id: "wifiCaptivePortal" as const, label: "Wi-Fi Captive Portal (UmarOS)", icon: Wifi },
          { id: "aiMediaEngine" as const, label: "AI Deepfake Media Engine (Synthesia / HeyGen)", icon: Video },
          { id: "metaOmnichannel" as const, label: "Meta Omnichannel Geo-Blast (IG / WA / Messenger)", icon: Share2 },
          { id: "geospatialAdExchange" as const, label: "Telecom Carpet-Bombing Ad Exchange", icon: Crosshair },
          { id: "razorpay" as const, label: "Razorpay Payments", icon: CreditCard },
          { id: "stripeAtlas" as const, label: "Stripe Atlas (USD B2B SaaS)", icon: Globe },
          { id: "payoneer" as const, label: "Payoneer Cross-Border", icon: Landmark },
          { id: "whatsapp" as const, label: "WhatsApp Business API", icon: MessageSquare },
          { id: "fssai" as const, label: "FSSAI Regulatory Gateway", icon: ShieldAlert },
          { id: "mapbox" as const, label: "Mapbox Geospatial Matrix", icon: Navigation },
          { id: "cleartax" as const, label: "Automated Tax (ClearTax)", icon: Calculator },
          { id: "whatsappMarketing" as const, label: "Automated WhatsApp Marketing", icon: Megaphone },
          { id: "b2bLeadGen" as const, label: "B2B Franchise Leads (Apollo/LinkedIn)", icon: Target },
          { id: "telemarketing" as const, label: "AI Voice Telemarketing", icon: PhoneCall },
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
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
          <div className="flex flex-col items-center gap-2 text-muted-foreground text-sm">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Loading Integration Security Profiles...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. RAZORPAY INTEGRATION */}
          {(activeTab === "all" || activeTab === "razorpay") && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-semibold text-foreground">
                        {cmsConfig.connectorRazorpayTitle || "Razorpay Payment Gateway Integration"}
                      </h3>
                      {(() => {
                        const st = getConnectorStatus("razorpay");
                        return (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                              st.tone === "emerald"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : st.tone === "amber"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                            }`}
                          >
                            {st.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cmsConfig.connectorRazorpaySubtitle || "Handles instant customer UPI, credit/debit card tokenization, auto-capture, and merchant settlement transfers."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                    <span>Gateway Active</span>
                    <input
                      type="checkbox"
                      checked={config.razorpay.enabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          razorpay: { ...prev.razorpay, enabled: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTestConnection("razorpay")}
                    disabled={testingService === "razorpay"}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <Zap className="h-3.5 w-3.5 text-blue-500" />
                    {testingService === "razorpay" ? "Testing..." : "Test Connection"}
                  </button>
                </div>
              </div>

              {/* Diagnostic Message */}
              {testResults.razorpay && (
                <div
                  className={`rounded-lg p-3 text-xs border flex items-center justify-between ${
                    testResults.razorpay.ok
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResults.razorpay.ok ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{testResults.razorpay.message}</span>
                  </div>
                  <span className="font-mono text-[10px] opacity-75">
                    Checked {testResults.razorpay.timestamp}
                  </span>
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Environment Mode
                  </label>
                  <select
                    value={config.razorpay.mode}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        razorpay: { ...prev.razorpay, mode: e.target.value as "live" | "test" },
                      }))
                    }
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="live">Production Mode (Live Keys)</option>
                    <option value="test">Sandbox Mode (Test Keys)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Merchant MID / Account ID
                  </label>
                  <input
                    type="text"
                    value={config.razorpay.merchantAccountId}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        razorpay: { ...prev.razorpay, merchantAccountId: e.target.value },
                      }))
                    }
                    placeholder="e.g. acc_xxxxxxxxxxxxxx"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    API Key ID
                  </label>
                  <input
                    type="text"
                    value={config.razorpay.keyId}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        razorpay: { ...prev.razorpay, keyId: e.target.value },
                      }))
                    }
                    placeholder={config.razorpay.mode === "live" ? "rzp_live_xxxxxxxxxxxxxxxx" : "rzp_test_xxxxxxxxxxxxxxxx"}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      API Key Secret
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility("rzp_secret")}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {visibleSecrets.rzp_secret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {visibleSecrets.rzp_secret ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={visibleSecrets.rzp_secret ? "text" : "password"}
                    value={config.razorpay.keySecret}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        razorpay: { ...prev.razorpay, keySecret: e.target.value },
                      }))
                    }
                    placeholder="••••••••••••••••••••••••••••••••"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Webhook Secret Signature
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility("rzp_webhook")}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {visibleSecrets.rzp_webhook ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {visibleSecrets.rzp_webhook ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={visibleSecrets.rzp_webhook ? "text" : "password"}
                    value={config.razorpay.webhookSecret}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        razorpay: { ...prev.razorpay, webhookSecret: e.target.value },
                      }))
                    }
                    placeholder="Secret used to sign payment.captured webhooks"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Merchant Settlement Cycle
                  </label>
                  <select
                    value={config.razorpay.settlementCycle}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        razorpay: { ...prev.razorpay, settlementCycle: e.target.value as "T1" | "SAME_DAY" },
                      }))
                    }
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="T1">T+1 Standard Bank Batch</option>
                    <option value="SAME_DAY">Same-Day IMPS Instant Settlement</option>
                  </select>
                </div>
              </div>

              {/* Webhook Endpoint Info */}
              <div className="rounded-lg bg-secondary/40 border border-border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-foreground">
                    Production Webhook Listener URL
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Register this URL in your Razorpay Dashboard under Webhooks (Events: payment.captured, refund.processed)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="rounded bg-background px-2.5 py-1 text-xs font-mono text-foreground border border-border">
                    /api/v1/kingpay/razorpay-webhook
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy("https://api.orderkingpay.com/api/v1/kingpay/razorpay-webhook", "rzp_hook")}
                    className="flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs text-foreground hover:bg-secondary/80 border border-border"
                  >
                    {copiedKey === "rzp_hook" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey === "rzp_hook" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STRIPE ATLAS (USD B2B SAAS - GLOBAL USD PAYMENT ROUTER) */}
          {(activeTab === "all" || activeTab === "stripeAtlas") && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-semibold text-foreground">
                        {cmsConfig.connectorStripeAtlasTitle || "Stripe Atlas (USD B2B SaaS)"}
                      </h3>
                      {(() => {
                        const st = getConnectorStatus("stripeAtlas");
                        return (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                              st.tone === "emerald"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : st.tone === "amber"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                            }`}
                          >
                            {st.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cmsConfig.connectorStripeAtlasSubtitle ||
                        "Delaware C-Corp global USD merchant rail. Powers recurring B2B SaaS licensing, monthly franchise subscriptions, automated W-8BEN/W-9 invoices, and Stripe Billing across US and overseas operators."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                    <span>{cmsConfig.connectorStripeAtlasToggleLabel || "Stripe Atlas Router Active"}</span>
                    <input
                      type="checkbox"
                      checked={config.stripeAtlas.enabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          stripeAtlas: { ...prev.stripeAtlas, enabled: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTestConnection("stripeAtlas")}
                    disabled={testingService === "stripeAtlas"}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <Zap className="h-3.5 w-3.5 text-indigo-500" />
                    {testingService === "stripeAtlas" ? "Testing..." : (cmsConfig.connectorStripeAtlasTestBtnText || "Verify Stripe Atlas Handshake")}
                  </button>
                </div>
              </div>

              {/* Diagnostic Message */}
              {testResults.stripeAtlas && (
                <div
                  className={`rounded-lg p-3 text-xs border flex items-center justify-between ${
                    testResults.stripeAtlas.ok
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResults.stripeAtlas.ok ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{testResults.stripeAtlas.message}</span>
                  </div>
                  <span className="font-mono text-[10px] opacity-75">
                    Checked {testResults.stripeAtlas.timestamp}
                  </span>
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Environment Mode</label>
                  <select
                    value={config.stripeAtlas.mode}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        stripeAtlas: { ...prev.stripeAtlas, mode: e.target.value as "live" | "test" },
                      }))
                    }
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="live">Production Mode (Live Keys)</option>
                    <option value="test">Sandbox Mode (Test Keys)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Delaware Platform Account ID (Stripe Connect)</label>
                  <input
                    type="text"
                    value={config.stripeAtlas.accountId}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        stripeAtlas: { ...prev.stripeAtlas, accountId: e.target.value },
                      }))
                    }
                    placeholder="e.g. acct_1Nxxxxxxxxxxxxxx"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">Stripe Publishable Key</label>
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility("stripe_pub")}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {visibleSecrets.stripe_pub ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {visibleSecrets.stripe_pub ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={visibleSecrets.stripe_pub ? "text" : "password"}
                    value={config.stripeAtlas.publishableKey}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        stripeAtlas: { ...prev.stripeAtlas, publishableKey: e.target.value },
                      }))
                    }
                    placeholder={config.stripeAtlas.mode === "live" ? "pk_live_xxxxxxxxxxxxxxxx" : "pk_test_xxxxxxxxxxxxxxxx"}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">Stripe Secret API Key</label>
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility("stripe_sec")}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {visibleSecrets.stripe_sec ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {visibleSecrets.stripe_sec ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={visibleSecrets.stripe_sec ? "text" : "password"}
                    value={config.stripeAtlas.secretKey}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        stripeAtlas: { ...prev.stripeAtlas, secretKey: e.target.value },
                      }))
                    }
                    placeholder={config.stripeAtlas.mode === "live" ? "sk_live_xxxxxxxxxxxxxxxx" : "sk_test_xxxxxxxxxxxxxxxx"}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">Stripe Webhook Signing Secret</label>
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility("stripe_wh")}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {visibleSecrets.stripe_wh ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {visibleSecrets.stripe_wh ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={visibleSecrets.stripe_wh ? "text" : "password"}
                    value={config.stripeAtlas.webhookSecret}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        stripeAtlas: { ...prev.stripeAtlas, webhookSecret: e.target.value },
                      }))
                    }
                    placeholder="whsec_xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Statement Descriptor (Bank Card Billings)</label>
                  <input
                    type="text"
                    value={config.stripeAtlas.statementDescriptor}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        stripeAtlas: { ...prev.stripeAtlas, statementDescriptor: e.target.value.toUpperCase().slice(0, 22) },
                      }))
                    }
                    placeholder="ORDERKING SAAS (Max 22 chars)"
                    maxLength={22}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Monthly B2B SaaS Plan Price ID</label>
                  <input
                    type="text"
                    value={config.stripeAtlas.monthlySaaSPlanId}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        stripeAtlas: { ...prev.stripeAtlas, monthlySaaSPlanId: e.target.value },
                      }))
                    }
                    placeholder="e.g. price_1Nxxxxxxxxxxxxxx ($499/mo franchise tier)"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Settlement Currency</label>
                  <div className="flex h-10 w-full items-center rounded-lg border border-border bg-secondary/30 px-3 text-sm font-mono text-foreground">
                    <DollarSign className="h-4 w-4 text-emerald-500 mr-2 shrink-0" />
                    <span>USD ($) — United States Dollar (B2B SaaS Default)</span>
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2 pt-2 border-t border-border/60">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                    <input
                      type="checkbox"
                      checked={config.stripeAtlas.autoInvoicing}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          stripeAtlas: { ...prev.stripeAtlas, autoInvoicing: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Automated W-8BEN & SaaS B2B PDF Invoicing</span>
                  </label>
                  <p className="text-[11px] text-muted-foreground pl-6">
                    Automatically generates IRS-compliant W-8BEN/W-9 invoices with Delaware EIN and export tax credits upon successful monthly subscription charge.
                  </p>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                    <input
                      type="checkbox"
                      checked={config.stripeAtlas.delawareTaxFiling}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          stripeAtlas: { ...prev.stripeAtlas, delawareTaxFiling: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Delaware Franchise Tax & Foreign Revenue Allocation Track</span>
                  </label>
                  <p className="text-[11px] text-muted-foreground pl-6">
                    Classifies US vs overseas Saudi franchise income separately for institutional tax compliance, protecting founder visa eligibility through clean cross-border commercial receipts.
                  </p>
                </div>
              </div>

              {/* Policy & Compliance Box */}
              <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-semibold text-foreground">
                    {cmsConfig.connectorStripeAtlasPolicyTitle || "Delaware C-Corp B2B SaaS Invoicing & US Compliance"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {cmsConfig.connectorStripeAtlasPolicyNotice ||
                    "Collects direct USD revenue into US corporate accounts, generating qualifying institutional business revenue for US entity expansion and visa compliance."}
                </p>
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-indigo-500/10 text-[11px] text-muted-foreground">
                  <span>
                    {cmsConfig.connectorStripeAtlasWebhookNotice ||
                      "Stripe Subscriptions & Invoice Webhook: Synchronizes recurring SaaS collections, payment intents, and customer lifecycle."}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono bg-background px-2 py-0.5 rounded border border-border text-[10px]">
                      /api/v1/kingpay/stripe-webhook
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy("https://api.orderkingpay.com/api/v1/kingpay/stripe-webhook", "stripe_wh_url")}
                      className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy Webhook Endpoint"
                    >
                      {copiedKey === "stripe_wh_url" ? <Check className="h-3 w-3 text-indigo-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAYONEER CROSS-BORDER ROUTING */}
          {(activeTab === "all" || activeTab === "payoneer") && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-semibold text-foreground">
                        {cmsConfig.connectorPayoneerTitle || "Payoneer Cross-Border Routing"}
                      </h3>
                      {(() => {
                        const st = getConnectorStatus("payoneer");
                        return (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                              st.tone === "emerald"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : st.tone === "amber"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                            }`}
                          >
                            {st.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cmsConfig.connectorPayoneerSubtitle ||
                        "Institutional cross-border ACH & wire clearing network. Provides US Virtual Fedwire/ABA routing numbers and multi-currency receiving accounts for Saudi Arabia (SAR/USD) and GCC restaurant franchise royalties."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                    <span>{cmsConfig.connectorPayoneerToggleLabel || "Payoneer Cross-Border Active"}</span>
                    <input
                      type="checkbox"
                      checked={config.payoneer.enabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          payoneer: { ...prev.payoneer, enabled: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTestConnection("payoneer")}
                    disabled={testingService === "payoneer"}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <Zap className="h-3.5 w-3.5 text-emerald-500" />
                    {testingService === "payoneer" ? "Testing..." : (cmsConfig.connectorPayoneerTestBtnText || "Verify Payoneer ACH Rail")}
                  </button>
                </div>
              </div>

              {/* Diagnostic Message */}
              {testResults.payoneer && (
                <div
                  className={`rounded-lg p-3 text-xs border flex items-center justify-between ${
                    testResults.payoneer.ok
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResults.payoneer.ok ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{testResults.payoneer.message}</span>
                  </div>
                  <span className="font-mono text-[10px] opacity-75">
                    Checked {testResults.payoneer.timestamp}
                  </span>
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Payoneer Program ID</label>
                  <input
                    type="text"
                    value={config.payoneer.programId}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        payoneer: { ...prev.payoneer, programId: e.target.value },
                      }))
                    }
                    placeholder="e.g. 100xxxxxxx"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Payee ID / Merchant Identifier</label>
                  <input
                    type="text"
                    value={config.payoneer.payeeId}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        payoneer: { ...prev.payoneer, payeeId: e.target.value },
                      }))
                    }
                    placeholder="e.g. pay_orderking_global"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">API Client Secret / Key</label>
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility("payoneer_secret")}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {visibleSecrets.payoneer_secret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {visibleSecrets.payoneer_secret ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={visibleSecrets.payoneer_secret ? "text" : "password"}
                    value={config.payoneer.clientSecret}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        payoneer: { ...prev.payoneer, clientSecret: e.target.value },
                      }))
                    }
                    placeholder="Enter Payoneer API Secret"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">US Virtual Fedwire / ABA Routing Number (9 Digits)</label>
                  <input
                    type="text"
                    value={config.payoneer.routingNumber}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        payoneer: { ...prev.payoneer, routingNumber: e.target.value },
                      }))
                    }
                    placeholder="e.g. 021000021 (First Century Bank / Citibank NA)"
                    maxLength={9}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">US Virtual Checking Account Number</label>
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility("payoneer_acct")}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {visibleSecrets.payoneer_acct ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {visibleSecrets.payoneer_acct ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={visibleSecrets.payoneer_acct ? "text" : "password"}
                    value={config.payoneer.accountNumber}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        payoneer: { ...prev.payoneer, accountNumber: e.target.value },
                      }))
                    }
                    placeholder="e.g. 409174829103"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Receiving Currency Rail</label>
                  <div className="flex h-10 w-full items-center rounded-lg border border-border bg-secondary/30 px-3 text-sm font-mono text-foreground">
                    <DollarSign className="h-4 w-4 text-emerald-500 mr-2 shrink-0" />
                    <span>USD ($) — Multi-Currency Global Receiving Network</span>
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-foreground">Receiving Bank BIC / SWIFT Code</label>
                  <input
                    type="text"
                    value={config.payoneer.bankBic}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        payoneer: { ...prev.payoneer, bankBic: e.target.value.toUpperCase() },
                      }))
                    }
                    placeholder="e.g. FCNBUS33"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2 pt-2 border-t border-border/60">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                    <input
                      type="checkbox"
                      checked={config.payoneer.saudiSarConversionRail}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          payoneer: { ...prev.payoneer, saudiSarConversionRail: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Saudi Arabia (SAR) Direct Local Receiving Rail</span>
                  </label>
                  <p className="text-[11px] text-muted-foreground pl-6">
                    Enables franchise partners in Riyadh and Jeddah to pay in Saudi Riyals (SAR) via local SAMA/SARIE clearing without international FX friction, settling directly into founder treasury.
                  </p>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                    <input
                      type="checkbox"
                      checked={config.payoneer.autoSweepTreasury}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          payoneer: { ...prev.payoneer, autoSweepTreasury: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Automated Sweep to Delaware Corporate Treasury</span>
                  </label>
                  <p className="text-[11px] text-muted-foreground pl-6">
                    Daily automatic liquidation and sweep of collected international wire funds directly into Delaware operating bank account, maintaining automated cash balance audit trails.
                  </p>
                </div>
              </div>

              {/* Policy & Compliance Box */}
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-foreground">
                    {cmsConfig.connectorPayoneerPolicyTitle || "Global Cross-Border Liquidity & Commercial ACH Routing"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {cmsConfig.connectorPayoneerPolicyNotice ||
                    "Enables direct collection of international franchise royalty fees from Saudi Arabia and North America without high intermediary bank conversion friction."}
                </p>
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-emerald-500/10 text-[11px] text-muted-foreground">
                  <span>
                    {cmsConfig.connectorPayoneerWebhookNotice ||
                      "Payoneer Global Payment Service Ingestion Webhook: Receives inbound wire clearing events and instant treasury deposits."}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono bg-background px-2 py-0.5 rounded border border-border text-[10px]">
                      /api/v1/kingpay/payoneer-webhook
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy("https://api.orderkingpay.com/api/v1/kingpay/payoneer-webhook", "payoneer_wh_url")}
                      className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy Webhook Endpoint"
                    >
                      {copiedKey === "payoneer_wh_url" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. WHATSAPP BUSINESS API INTEGRATION */}
          {(activeTab === "all" || activeTab === "whatsapp") && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-semibold text-foreground">
                        {cmsConfig.connectorWhatsappTitle || "WhatsApp Business API Connector"}
                      </h3>
                      {(() => {
                        const st = getConnectorStatus("whatsapp");
                        return (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                              st.tone === "emerald"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : st.tone === "amber"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                            }`}
                          >
                            {st.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cmsConfig.connectorWhatsappSubtitle || "Transmits real-time order receipts, OTP delivery handshakes, and merchant alerts via Meta Cloud API or Gupshup."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                    <span>Messenger Active</span>
                    <input
                      type="checkbox"
                      checked={config.whatsapp.enabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          whatsapp: { ...prev.whatsapp, enabled: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTestConnection("whatsapp")}
                    disabled={testingService === "whatsapp"}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <Zap className="h-3.5 w-3.5 text-emerald-500" />
                    {testingService === "whatsapp" ? "Testing..." : "Test Connection"}
                  </button>
                </div>
              </div>

              {/* Diagnostic Message */}
              {testResults.whatsapp && (
                <div
                  className={`rounded-lg p-3 text-xs border flex items-center justify-between ${
                    testResults.whatsapp.ok
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResults.whatsapp.ok ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{testResults.whatsapp.message}</span>
                  </div>
                  <span className="font-mono text-[10px] opacity-75">
                    Checked {testResults.whatsapp.timestamp}
                  </span>
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Integration Provider
                  </label>
                  <select
                    value={config.whatsapp.provider}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        whatsapp: { ...prev.whatsapp, provider: e.target.value as "meta" | "gupshup" | "twilio" },
                      }))
                    }
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="meta">Meta Cloud API (Official Graph API)</option>
                    <option value="gupshup">Gupshup Enterprise Gateway</option>
                    <option value="twilio">Twilio Programmable Messaging</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    WhatsApp Phone Number ID
                  </label>
                  <input
                    type="text"
                    value={config.whatsapp.phoneNumberId}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        whatsapp: { ...prev.whatsapp, phoneNumberId: e.target.value },
                      }))
                    }
                    placeholder="e.g. 104829104829104"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    WhatsApp Business Account ID (WABA ID)
                  </label>
                  <input
                    type="text"
                    value={config.whatsapp.businessAccountId}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        whatsapp: { ...prev.whatsapp, businessAccountId: e.target.value },
                      }))
                    }
                    placeholder="e.g. 192837461928374"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Permanent System User Access Token
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility("wa_token")}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {visibleSecrets.wa_token ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {visibleSecrets.wa_token ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={visibleSecrets.wa_token ? "text" : "password"}
                    value={config.whatsapp.systemAccessToken}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        whatsapp: { ...prev.whatsapp, systemAccessToken: e.target.value },
                      }))
                    }
                    placeholder="EAAGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Approved Template Name
                  </label>
                  <input
                    type="text"
                    value={config.whatsapp.orderTemplateName}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        whatsapp: { ...prev.whatsapp, orderTemplateName: e.target.value },
                      }))
                    }
                    placeholder="e.g. order_delivery_update_v2"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Webhook Verification Token
                  </label>
                  <input
                    type="text"
                    value={config.whatsapp.webhookVerifyToken}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        whatsapp: { ...prev.whatsapp, webhookVerifyToken: e.target.value },
                      }))
                    }
                    placeholder="Custom alphanumeric verification token"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. FSSAI GOVERNMENT REGULATORY API */}
          {(activeTab === "all" || activeTab === "fssai") && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-semibold text-foreground">
                        {cmsConfig.connectorFssaiTitle || "FSSAI Government Regulatory Verification Gateway"}
                      </h3>
                      {(() => {
                        const st = getConnectorStatus("fssai");
                        return (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                              st.tone === "emerald"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : st.tone === "amber"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                            }`}
                          >
                            {st.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cmsConfig.connectorFssaiSubtitle || "Direct integration with the FoSCoS Government Portal. Verifies 14-digit restaurant food licenses and enforces statutory onboarding rules."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                    <span>Enforcement Active</span>
                    <input
                      type="checkbox"
                      checked={config.fssai.enabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          fssai: { ...prev.fssai, enabled: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTestConnection("fssai")}
                    disabled={testingService === "fssai"}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    {testingService === "fssai" ? "Probing..." : "Test Verification"}
                  </button>
                </div>
              </div>

              {/* Diagnostic Message */}
              {testResults.fssai && (
                <div
                  className={`rounded-lg p-3 text-xs border flex items-center justify-between ${
                    testResults.fssai.ok
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResults.fssai.ok ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{testResults.fssai.message}</span>
                  </div>
                  <span className="font-mono text-[10px] opacity-75">
                    Checked {testResults.fssai.timestamp}
                  </span>
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    FSSAI Gateway Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={config.fssai.gatewayUrl}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        fssai: { ...prev.fssai, gatewayUrl: e.target.value },
                      }))
                    }
                    placeholder="https://foscos.fssai.gov.in/api/v1/verify"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Government Client ID / Agency ID
                  </label>
                  <input
                    type="text"
                    value={config.fssai.clientId}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        fssai: { ...prev.fssai, clientId: e.target.value },
                      }))
                    }
                    placeholder="e.g. FOSCOS_ORD_KARIMGANJ_01"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Department Authorization Token
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility("fssai_token")}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {visibleSecrets.fssai_token ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {visibleSecrets.fssai_token ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={visibleSecrets.fssai_token ? "text" : "password"}
                    value={config.fssai.authorizationToken}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        fssai: { ...prev.fssai, authorizationToken: e.target.value },
                      }))
                    }
                    placeholder="Gov-issued HMAC or Bearer key"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    License Expiry Alert Threshold (Days)
                  </label>
                  <input
                    type="number"
                    value={config.fssai.licenseExpiryAlertDays}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        fssai: { ...prev.fssai, licenseExpiryAlertDays: Number(e.target.value) || 30 },
                      }))
                    }
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Policy Enforce Box */}
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="enforceBlock"
                  checked={config.fssai.enforceBlockUnverified}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      fssai: { ...prev.fssai, enforceBlockUnverified: e.target.checked },
                    }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="enforceBlock" className="space-y-1 cursor-pointer">
                  <span className="text-xs font-semibold text-foreground block">
                    {cmsConfig.connectorFssaiPolicyTitle || "Strict Regulatory Onboarding Gate"}
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {cmsConfig.connectorFssaiPolicyNotice || "Automatically block merchant kitchens from taking live customer orders if their 14-digit FSSAI license is absent, lapsed, or rejected by the FoSCoS gateway."}
                  </p>
                </label>
              </div>
            </div>
          )}

          {/* 4. MAPBOX ROUTING & MATRIX API */}
          {(activeTab === "all" || activeTab === "mapbox") && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                    <Navigation className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-semibold text-foreground">
                        {cmsConfig.connectorMapboxTitle || "Mapbox Geospatial Matrix & Routing Telemetry"}
                      </h3>
                      {(() => {
                        const st = getConnectorStatus("mapbox");
                        return (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                              st.tone === "emerald"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : st.tone === "amber"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                            }`}
                          >
                            {st.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cmsConfig.connectorMapboxSubtitle || "Powers multi-point distance matrix calculations, live congestion avoidance, and real-time rider GPS vector estimation."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                    <span>Routing Engine Active</span>
                    <input
                      type="checkbox"
                      checked={config.mapbox.enabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          mapbox: { ...prev.mapbox, enabled: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTestConnection("mapbox")}
                    disabled={testingService === "mapbox"}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <Zap className="h-3.5 w-3.5 text-indigo-500" />
                    {testingService === "mapbox" ? "Testing..." : "Test Matrix Ping"}
                  </button>
                </div>
              </div>

              {/* Diagnostic Message */}
              {testResults.mapbox && (
                <div
                  className={`rounded-lg p-3 text-xs border flex items-center justify-between ${
                    testResults.mapbox.ok
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResults.mapbox.ok ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{testResults.mapbox.message}</span>
                  </div>
                  <span className="font-mono text-[10px] opacity-75">
                    Checked {testResults.mapbox.timestamp}
                  </span>
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Public Access Token
                  </label>
                  <input
                    type="text"
                    value={config.mapbox.publicAccessToken}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        mapbox: { ...prev.mapbox, publicAccessToken: e.target.value },
                      }))
                    }
                    placeholder="pk.eyJ1Ixxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Secret Matrix Token (Server Only)
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility("mapbox_secret")}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {visibleSecrets.mapbox_secret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {visibleSecrets.mapbox_secret ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={visibleSecrets.mapbox_secret ? "text" : "password"}
                    value={config.mapbox.secretRoutingToken}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        mapbox: { ...prev.mapbox, secretRoutingToken: e.target.value },
                      }))
                    }
                    placeholder="sk.eyJ1Ixxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Traffic & Routing Profile
                  </label>
                  <select
                    value={config.mapbox.routingProfile}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        mapbox: { ...prev.mapbox, routingProfile: e.target.value as any },
                      }))
                    }
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="driving-traffic">Mapbox Driving Traffic (Real-time live congestion)</option>
                    <option value="driving">Mapbox Driving Standard (Nominal speed)</option>
                    <option value="cycling">Mapbox Cycling (Local micro-mobility)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Maximum Service Radius Ceiling (km)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={config.mapbox.maxServiceRadiusKm}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        mapbox: { ...prev.mapbox, maxServiceRadiusKm: Number(e.target.value) || 25 },
                      }))
                    }
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. CLEARTAX AUTOMATED GST & TAX CALCULATION */}
          {(activeTab === "all" || activeTab === "cleartax") && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-semibold text-foreground">
                        {cmsConfig.connectorClearTaxTitle || "Automated Tax Calculation (ClearTax)"}
                      </h3>
                      {(() => {
                        const st = getConnectorStatus("cleartax");
                        return (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                              st.tone === "emerald"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : st.tone === "amber"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                            }`}
                          >
                            {st.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cmsConfig.connectorClearTaxSubtitle || "Statutory automated GST calculation, real-time e-invoicing, reverse charge determination, and seamless automated tax reconciliation for compliant restaurant operations."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                    <span>{cmsConfig.connectorClearTaxToggleLabel || "Tax Engine Active"}</span>
                    <input
                      type="checkbox"
                      checked={config.cleartax.enabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          cleartax: { ...prev.cleartax, enabled: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTestConnection("cleartax")}
                    disabled={testingService === "cleartax"}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <Zap className="h-3.5 w-3.5 text-indigo-500" />
                    {testingService === "cleartax" ? "Testing..." : (cmsConfig.connectorClearTaxTestBtnText || "Test ClearTax Diagnostic")}
                  </button>
                </div>
              </div>

              {/* Diagnostic Message */}
              {testResults.cleartax && (
                <div
                  className={`rounded-lg p-3 text-xs border flex items-center justify-between ${
                    testResults.cleartax.ok
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResults.cleartax.ok ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <span>{testResults.cleartax.message}</span>
                  </div>
                  <span className="text-[10px] opacity-75">{testResults.cleartax.timestamp}</span>
                </div>
              )}

              {/* 1-Click Quick Settings Switchboard */}
              <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-indigo-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      1-Click ClearTax Engine Presets & Automation
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Instant Live Execution</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="flex items-start gap-2.5 p-2.5 rounded-md border border-border bg-card/60 hover:bg-card cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={config.cleartax.autoEinvoice}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          cleartax: { ...prev.cleartax, autoEinvoice: e.target.checked },
                        }))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">Auto E-Invoice & IRN Generation</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Generates IRN & signed QR code on customer invoice dispatch
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-md border border-border bg-card/60 hover:bg-card cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={config.cleartax.autoReverseCharge}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          cleartax: { ...prev.cleartax, autoReverseCharge: e.target.checked },
                        }))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">Auto Reverse Charge (RCM)</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Detects unregistered vendors and flags Section 9(4) reverse charge
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-md border border-border bg-card/60 hover:bg-card cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={config.cleartax.instantGstinValidation}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          cleartax: { ...prev.cleartax, instantGstinValidation: e.target.checked },
                        }))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">Instant GSTIN Live Validation</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Verifies restaurant partner GSTIN against GSTN master ledger
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">ClearTax API Mode</label>
                  <select
                    value={config.cleartax.mode}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        cleartax: { ...prev.cleartax, mode: e.target.value as any },
                      }))
                    }
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="sandbox">Sandbox / Staging Mode (ClearTax Test Server)</option>
                    <option value="production">Production Mode (ClearTax Live GSTN Gateway)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Master Business GSTIN</label>
                  <input
                    type="text"
                    value={config.cleartax.gstin}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        cleartax: { ...prev.cleartax, gstin: e.target.value.toUpperCase() },
                      }))
                    }
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">ClearTax Auth Bearer Token</label>
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility("cleartax_authKey")}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {visibleSecrets.cleartax_authKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      <span>{visibleSecrets.cleartax_authKey ? "Hide" : "Show"}</span>
                    </button>
                  </div>
                  <input
                    type={visibleSecrets.cleartax_authKey ? "text" : "password"}
                    value={config.cleartax.authKey}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        cleartax: { ...prev.cleartax, authKey: e.target.value },
                      }))
                    }
                    placeholder="Enter ClearTax Auth Key"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Primary HSN / SAC Code</label>
                  <input
                    type="text"
                    value={config.cleartax.hsnSacCode}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        cleartax: { ...prev.cleartax, hsnSacCode: e.target.value },
                      }))
                    }
                    placeholder="e.g. 996331 (Restaurant Food Services)"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Tax Engine Calculation Profile</label>
                  <select
                    value={config.cleartax.taxEngineMode}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        cleartax: { ...prev.cleartax, taxEngineMode: e.target.value as any },
                      }))
                    }
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="realtime_gst">Real-Time Multi-Tier GST (5% / 12% / 18% Automated Split)</option>
                    <option value="einvoice_b2b">Mandatory B2B E-Invoicing & IRN Mode</option>
                    <option value="composite_flat">Composite Scheme (Flat 5% Without Input Tax Credit)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">Webhook & Reconciliation Secret</label>
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility("cleartax_webhook")}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {visibleSecrets.cleartax_webhook ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      <span>{visibleSecrets.cleartax_webhook ? "Hide" : "Show"}</span>
                    </button>
                  </div>
                  <input
                    type={visibleSecrets.cleartax_webhook ? "text" : "password"}
                    value={config.cleartax.webhookSecret}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        cleartax: { ...prev.cleartax, webhookSecret: e.target.value },
                      }))
                    }
                    placeholder="ClearTax Webhook Secret"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-foreground">E-Way Bill Auto-Generation Threshold (INR)</label>
                  <input
                    type="text"
                    value={config.cleartax.eWayBillThreshold}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        cleartax: { ...prev.cleartax, eWayBillThreshold: e.target.value },
                      }))
                    }
                    placeholder="e.g. 50000"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Policy & Compliance Box */}
              <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-semibold text-foreground">
                    {cmsConfig.connectorClearTaxPolicyTitle || "Statutory GST & E-Invoicing Enforcement"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {cmsConfig.connectorClearTaxPolicyNotice || "Generates IRN & QR-coded e-invoices instantly via ClearTax APIs upon order fulfillment, verifying restaurant GSTIN active status."}
                </p>
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-indigo-500/10 text-[11px] text-muted-foreground">
                  <span>{cmsConfig.connectorClearTaxWebhookNotice || "ClearTax GSTN Reconciliation Webhook: Automatically imports GSTR-1 & GSTR-3B monthly outward supply filings."}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono bg-background px-2 py-0.5 rounded border border-border text-[10px]">
                      /api/v1/tax/cleartax-gst-webhook
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy("https://api.orderking.in/api/v1/tax/cleartax-gst-webhook", "cleartax_wh")}
                      className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy Webhook Endpoint"
                    >
                      {copiedKey === "cleartax_wh" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. AUTOMATED WHATSAPP MARKETING */}
          {(activeTab === "all" || activeTab === "whatsappMarketing") && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-semibold text-foreground">
                        {cmsConfig.connectorWhatsappMarketingTitle || "Automated WhatsApp Marketing"}
                      </h3>
                      {(() => {
                        const st = getConnectorStatus("whatsappMarketing");
                        return (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                              st.tone === "emerald"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : st.tone === "amber"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                            }`}
                          >
                            {st.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cmsConfig.connectorWhatsappMarketingSubtitle || "High-conversion automated customer re-engagement, promotional drops, festival banquet offers, and personalized loyalty cart recovery campaigns with full TRAI/DND compliance."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                    <span>{cmsConfig.connectorWhatsappMarketingToggleLabel || "Marketing Engine Active"}</span>
                    <input
                      type="checkbox"
                      checked={config.whatsappMarketing.enabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          whatsappMarketing: { ...prev.whatsappMarketing, enabled: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTestConnection("whatsappMarketing")}
                    disabled={testingService === "whatsappMarketing"}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <Zap className="h-3.5 w-3.5 text-emerald-500" />
                    {testingService === "whatsappMarketing" ? "Testing..." : (cmsConfig.connectorWhatsappMarketingTestBtnText || "Test Broadcast Dispatch")}
                  </button>
                </div>
              </div>

              {/* Diagnostic Message */}
              {testResults.whatsappMarketing && (
                <div
                  className={`rounded-lg p-3 text-xs border flex items-center justify-between ${
                    testResults.whatsappMarketing.ok
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResults.whatsappMarketing.ok ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <span>{testResults.whatsappMarketing.message}</span>
                  </div>
                  <span className="text-[10px] opacity-75">{testResults.whatsappMarketing.timestamp}</span>
                </div>
              )}

              {/* 1-Click Quick Settings Switchboard */}
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      1-Click Promotional Campaigns & Auto-Triggers
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Automated Drip Pipelines</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <label className="flex items-start gap-2.5 p-2.5 rounded-md border border-border bg-card/60 hover:bg-card cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={config.whatsappMarketing.autoCartRecovery}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          whatsappMarketing: { ...prev.whatsappMarketing, autoCartRecovery: e.target.checked },
                        }))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">Abandoned Cart Auto-Recovery</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Dispatches incentive reminder within 15 min of checkout exit
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-md border border-border bg-card/60 hover:bg-card cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={config.whatsappMarketing.autoFeedbackDrop}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          whatsappMarketing: { ...prev.whatsappMarketing, autoFeedbackDrop: e.target.checked },
                        }))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">Post-Meal Review & Re-Order</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Triggers 60 mins post-delivery to capture ratings & repeat order
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-md border border-border bg-card/60 hover:bg-card cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={config.whatsappMarketing.weekendChefSpecials}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          whatsappMarketing: { ...prev.whatsappMarketing, weekendChefSpecials: e.target.checked },
                        }))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">Weekend Feast Broadcast</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Friday 06:00 PM automated chef specials & banquet drop
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-md border border-border bg-card/60 hover:bg-card cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={config.whatsappMarketing.dormantCustomerReengagement}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          whatsappMarketing: { ...prev.whatsappMarketing, dormantCustomerReengagement: e.target.checked },
                        }))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">Dormant Customer Win-Back</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Automated loyalty coupon after 14 days of diner inactivity
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Marketing Integration Provider</label>
                  <select
                    value={config.whatsappMarketing.provider}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        whatsappMarketing: { ...prev.whatsappMarketing, provider: e.target.value as any },
                      }))
                    }
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="meta">Meta Cloud Marketing API (Direct WABA Graph v20)</option>
                    <option value="gupshup">Gupshup Enterprise Marketing Suite</option>
                    <option value="wati">Wati High-Volume Broadcast API</option>
                    <option value="aisensy">AiSensy Automated Retention Engine</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">Marketing API Secret / Bearer Key</label>
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility("wam_apiKey")}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {visibleSecrets.wam_apiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      <span>{visibleSecrets.wam_apiKey ? "Hide" : "Show"}</span>
                    </button>
                  </div>
                  <input
                    type={visibleSecrets.wam_apiKey ? "text" : "password"}
                    value={config.whatsappMarketing.apiKey}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        whatsappMarketing: { ...prev.whatsappMarketing, apiKey: e.target.value },
                      }))
                    }
                    placeholder="Enter Marketing API Key"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">WhatsApp Business Account ID (WABA ID)</label>
                  <input
                    type="text"
                    value={config.whatsappMarketing.businessAccountId}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        whatsappMarketing: { ...prev.whatsappMarketing, businessAccountId: e.target.value },
                      }))
                    }
                    placeholder="e.g. 938472910482910"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Marketing Phone Number ID</label>
                  <input
                    type="text"
                    value={config.whatsappMarketing.phoneNumberId}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        whatsappMarketing: { ...prev.whatsappMarketing, phoneNumberId: e.target.value },
                      }))
                    }
                    placeholder="e.g. 104829104829104"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Approved Campaign Template Name</label>
                  <input
                    type="text"
                    value={config.whatsappMarketing.campaignTemplateName}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        whatsappMarketing: { ...prev.whatsappMarketing, campaignTemplateName: e.target.value },
                      }))
                    }
                    placeholder="e.g. weekend_feast_curry_drop_v1"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Opt-Out / Unsubscribe Keyword</label>
                  <input
                    type="text"
                    value={config.whatsappMarketing.optOutKeyword}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        whatsappMarketing: { ...prev.whatsappMarketing, optOutKeyword: e.target.value },
                      }))
                    }
                    placeholder="e.g. STOP or UNSUBSCRIBE"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Daily Broadcast Rate Limit Ceiling</label>
                  <input
                    type="text"
                    value={config.whatsappMarketing.dailyBroadcastLimit}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        whatsappMarketing: { ...prev.whatsappMarketing, dailyBroadcastLimit: e.target.value },
                      }))
                    }
                    placeholder="e.g. 5000 messages / day"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Compliant Marketing Schedule Window</label>
                  <input
                    type="text"
                    value={config.whatsappMarketing.scheduleWindow}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        whatsappMarketing: { ...prev.whatsappMarketing, scheduleWindow: e.target.value },
                      }))
                    }
                    placeholder="e.g. 10:00 AM - 09:00 PM (TRAI Compliant)"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Policy & Compliance Box */}
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-foreground">
                    {cmsConfig.connectorWhatsappMarketingPolicyTitle || "Strict DND & Anti-Spam Marketing Policy"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {cmsConfig.connectorWhatsappMarketingPolicyNotice || "Ensures all automated promotional broadcasts respect 10:00 AM - 09:00 PM regulatory delivery windows and honour instant opt-out requests without exception."}
                </p>
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-emerald-500/10 text-[11px] text-muted-foreground">
                  <span>{cmsConfig.connectorWhatsappMarketingOptInNotice || "Automatic Unsubscribe Handler: Customers replying STOP or UNSUBSCRIBE are instantly purged from promotional broadcast audiences."}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono bg-background px-2 py-0.5 rounded border border-border text-[10px]">
                      /api/v1/marketing/whatsapp-optout-webhook
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy("https://api.orderking.in/api/v1/marketing/whatsapp-optout-webhook", "wam_wh")}
                      className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy Webhook Endpoint"
                    >
                      {copiedKey === "wam_wh" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. B2B FRANCHISE LEAD GENERATION (APOLLO / LINKEDIN API) */}
          {(activeTab === "all" || activeTab === "b2bLeadGen") && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-semibold text-foreground">
                        {cmsConfig.connectorB2bLeadGenTitle || "B2B Franchise Lead Generation (Apollo / LinkedIn API)"}
                      </h3>
                      {(() => {
                        const st = getConnectorStatus("b2bLeadGen");
                        return (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide border ${
                              st.tone === "emerald"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : st.tone === "amber"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                            }`}
                          >
                            {st.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cmsConfig.connectorB2bLeadGenSubtitle || "Enterprise B2B prospecting rail. Automatically query Apollo.io and LinkedIn Sales Navigator to identify multi-unit restaurant operators and franchise owners across Saudi Arabia and the United States to sell the SaaS engine directly."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                    <span>{cmsConfig.connectorB2bLeadGenToggleLabel || "Lead Gen Engine Active"}</span>
                    <input
                      type="checkbox"
                      checked={config.b2bLeadGen.enabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          b2bLeadGen: { ...prev.b2bLeadGen, enabled: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTestConnection("b2bLeadGen")}
                    disabled={testingService === "b2bLeadGen"}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <Zap className="h-3.5 w-3.5 text-indigo-500" />
                    {testingService === "b2bLeadGen" ? "Testing Pipeline..." : (cmsConfig.connectorB2bLeadGenTestBtnText || "Verify Prospecting Handshake")}
                  </button>
                </div>
              </div>

              {/* Diagnostic Message */}
              {testResults.b2bLeadGen && (
                <div
                  className={`rounded-lg p-3 text-xs border flex items-center justify-between ${
                    testResults.b2bLeadGen.ok
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResults.b2bLeadGen.ok ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <span>{testResults.b2bLeadGen.message}</span>
                  </div>
                  <span className="text-[10px] opacity-75">{testResults.b2bLeadGen.timestamp}</span>
                </div>
              )}

              {/* Founder Value Proposition Banner (Direct SaaS Expansion) */}
              <div className="rounded-lg border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white shadow-xs">
                      <Building2 className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Founder Direct Sales Engine — Multi-Unit Franchise Acquisition
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-indigo-500" />
                    Target Corridors: Saudi Arabia (KSA) & United States (US)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Empowers the Founder to automatically scrape, enrich, and identify high-LTV Multi-Unit Restaurant Owners and Franchise Groups across Saudi Arabia (Riyadh, Jeddah, Eastern Province) and the United States (Major Metro MSAs). Directly pitch and sell OrderKing's SaaS engine with 0% surge take rate and multi-store white-label portals.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="flex items-center gap-2 rounded-md border border-indigo-500/20 bg-background/80 p-2 text-xs">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-medium text-foreground">Saudi Arabia (KSA)</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">Franchise & Cloud Kitchens</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md border border-indigo-500/20 bg-background/80 p-2 text-xs">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="font-medium text-foreground">United States (US)</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">Multi-Unit QSR Groups</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md border border-indigo-500/20 bg-background/80 p-2 text-xs">
                    <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                    <span className="font-medium text-foreground">Zero Fake Data</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">Production API Rail</span>
                  </div>
                </div>
              </div>

              {/* 1-Click Prospecting & Enrichment Automation Switches */}
              <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-indigo-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      1-Click Franchise Discovery & Telemetry Controls
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">High-Ticket Executive Scrapers</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <label className="flex items-start gap-2.5 p-2.5 rounded-md border border-border bg-card/60 hover:bg-card cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={config.b2bLeadGen.autoEnrichDirectDials}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          b2bLeadGen: { ...prev.b2bLeadGen, autoEnrichDirectDials: e.target.checked },
                        }))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">Auto-Enrich Direct Dials</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Scrapes verified mobile numbers & direct dials for instant WhatsApp pitch
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-md border border-border bg-card/60 hover:bg-card cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={config.b2bLeadGen.autoExportToCrm}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          b2bLeadGen: { ...prev.b2bLeadGen, autoExportToCrm: e.target.checked },
                        }))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">Auto-Sync to Founder CRM</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Pipes enriched restaurant owners straight into Founder closing outbox
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-md border border-border bg-card/60 hover:bg-card cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={config.b2bLeadGen.targetRegions.includes("saudi_arabia")}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setConfig((prev) => {
                          const current = new Set(prev.b2bLeadGen.targetRegions);
                          if (checked) current.add("saudi_arabia");
                          else current.delete("saudi_arabia");
                          return {
                            ...prev,
                            b2bLeadGen: { ...prev.b2bLeadGen, targetRegions: Array.from(current) },
                          };
                        });
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">Saudi Arabia (KSA) Focus</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Filters Riyadh, Jeddah & Eastern Province multi-unit restaurant brands
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-md border border-border bg-card/60 hover:bg-card cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={config.b2bLeadGen.targetRegions.includes("united_states")}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setConfig((prev) => {
                          const current = new Set(prev.b2bLeadGen.targetRegions);
                          if (checked) current.add("united_states");
                          else current.delete("united_states");
                          return {
                            ...prev,
                            b2bLeadGen: { ...prev.b2bLeadGen, targetRegions: Array.from(current) },
                          };
                        });
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">United States (US) Focus</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Filters US multi-unit franchise operators & regional QSR holding groups
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Prospecting Provider Engine</label>
                  <select
                    value={config.b2bLeadGen.provider}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        b2bLeadGen: { ...prev.b2bLeadGen, provider: e.target.value as any },
                      }))
                    }
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="apollo_linkedin">Apollo.io API + LinkedIn Sales Navigator (Ensemble Mode)</option>
                    <option value="apollo">Apollo.io Dedicated Scraper API</option>
                    <option value="linkedin">LinkedIn Sales Navigator API Dedicated</option>
                    <option value="proxycurl">Proxycurl LinkedIn Scraper Bridge</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">Apollo.io Master API Key</label>
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility("b2b_apollo")}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {visibleSecrets.b2b_apollo ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {visibleSecrets.b2b_apollo ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={visibleSecrets.b2b_apollo ? "text" : "password"}
                    value={config.b2bLeadGen.apolloApiKey}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        b2bLeadGen: { ...prev.b2bLeadGen, apolloApiKey: e.target.value },
                      }))
                    }
                    placeholder="Enter Apollo API Key (e.g. apollo_live_...)"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">LinkedIn Client ID</label>
                  <input
                    type="text"
                    value={config.b2bLeadGen.linkedinClientId}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        b2bLeadGen: { ...prev.b2bLeadGen, linkedinClientId: e.target.value },
                      }))
                    }
                    placeholder="Enter LinkedIn Client ID (e.g. 78xxxxxxxxxxxx)"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">LinkedIn Client Secret</label>
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility("b2b_li_secret")}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {visibleSecrets.b2b_li_secret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {visibleSecrets.b2b_li_secret ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={visibleSecrets.b2b_li_secret ? "text" : "password"}
                    value={config.b2bLeadGen.linkedinClientSecret}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        b2bLeadGen: { ...prev.b2bLeadGen, linkedinClientSecret: e.target.value },
                      }))
                    }
                    placeholder="Enter LinkedIn Client Secret"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">LinkedIn OAuth 2.0 Access Token</label>
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility("b2b_li_token")}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {visibleSecrets.b2b_li_token ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {visibleSecrets.b2b_li_token ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={visibleSecrets.b2b_li_token ? "text" : "password"}
                    value={config.b2bLeadGen.linkedinAccessToken}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        b2bLeadGen: { ...prev.b2bLeadGen, linkedinAccessToken: e.target.value },
                      }))
                    }
                    placeholder="Enter LinkedIn OAuth Bearer Token"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Target Executive Persona Filter</label>
                  <input
                    type="text"
                    value={config.b2bLeadGen.targetPersona}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        b2bLeadGen: { ...prev.b2bLeadGen, targetPersona: e.target.value },
                      }))
                    }
                    placeholder="e.g. Multi-Unit Franchisee, Managing Director, VP Franchising"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Minimum Multi-Unit Restaurant Count</label>
                  <select
                    value={config.b2bLeadGen.minRestaurantUnits}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        b2bLeadGen: { ...prev.b2bLeadGen, minRestaurantUnits: Number(e.target.value) || 3 },
                      }))
                    }
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value={2}>2+ Restaurant Units (Emerging Operators)</option>
                    <option value={3}>3+ Restaurant Units (Multi-Unit Operators)</option>
                    <option value={5}>5+ Restaurant Units (Mid-Tier Franchisees)</option>
                    <option value={10}>10+ Restaurant Units (Regional Groups)</option>
                    <option value={25}>25+ Restaurant Units (Enterprise Franchise Groups)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">Lead Ingestion Webhook Secret</label>
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility("b2b_wh_secret")}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {visibleSecrets.b2b_wh_secret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {visibleSecrets.b2b_wh_secret ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={visibleSecrets.b2b_wh_secret ? "text" : "password"}
                    value={config.b2bLeadGen.webhookSecret}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        b2bLeadGen: { ...prev.b2bLeadGen, webhookSecret: e.target.value },
                      }))
                    }
                    placeholder="Enter HMAC Webhook Secret"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Policy & Compliance Box */}
              <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-semibold text-foreground">
                    {cmsConfig.connectorB2bLeadGenPolicyTitle || "High-Ticket Enterprise Outreach & Compliance Guard"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {cmsConfig.connectorB2bLeadGenPolicyNotice || "Automated multi-channel persona mapping targeting VP of Franchising, C-Suite, and Multi-Unit Franchisees. Enforces CAN-SPAM, CITC (Saudi Arabia), and LinkedIn API rate quotas."}
                </p>
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-indigo-500/10 text-[11px] text-muted-foreground">
                  <span>{cmsConfig.connectorB2bLeadGenWebhookNotice || "Apollo & LinkedIn Lead Enrichment Ingestion Webhook: Receives verified mobile numbers, direct corporate emails, and multi-unit chain footprint."}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono bg-background px-2 py-0.5 rounded border border-border text-[10px]">
                      /api/v1/leads/b2b-franchise-webhook
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy("https://api.orderking.in/api/v1/leads/b2b-franchise-webhook", "b2b_wh")}
                      className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy Webhook Endpoint"
                    >
                      {copiedKey === "b2b_wh" ? <Check className="h-3 w-3 text-indigo-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 8. AI TELEMARKETING CONNECTOR (BLAND.AI / TWILIO VOICE AUTONOMOUS RESTAURANT PITCHING) */}
          {(activeTab === "all" || activeTab === "telemarketing") && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <PhoneCall className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-semibold text-foreground">
                        {cmsConfig.connectorTelemarketingTitle || "Bland.ai / Twilio Voice (Autonomous Restaurant Pitching)"}
                      </h3>
                      {(() => {
                        const st = getConnectorStatus("telemarketing");
                        return (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide border ${
                              st.tone === "emerald"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : st.tone === "amber"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                            }`}
                          >
                            {st.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cmsConfig.connectorTelemarketingSubtitle || "Autonomous AI sales force that dials Indian restaurant owners, pitches the Zero-Setup-Fee and 0% commission direct ordering platform, handles common aggregator objections, and books onboarding walkthroughs without human sales reps."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                    <span>{cmsConfig.connectorTelemarketingToggleLabel || "AI Sales Engine Active"}</span>
                    <input
                      type="checkbox"
                      checked={config.telemarketing.enabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          telemarketing: { ...prev.telemarketing, enabled: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTestConnection("telemarketing")}
                    disabled={testingService === "telemarketing"}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <Zap className="h-3.5 w-3.5 text-emerald-500" />
                    {testingService === "telemarketing" ? "Dialing Voice Probe..." : (cmsConfig.connectorTelemarketingTestBtnText || "Test AI Voice Dial Probe")}
                  </button>
                </div>
              </div>

              {/* Diagnostic Message */}
              {testResults.telemarketing && (
                <div
                  className={`rounded-lg p-3 text-xs border flex items-center justify-between ${
                    testResults.telemarketing.ok
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResults.telemarketing.ok ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <span>{testResults.telemarketing.message}</span>
                  </div>
                  <span className="text-[10px] opacity-75">{testResults.telemarketing.timestamp}</span>
                </div>
              )}

              {/* Autonomous Restaurant Acquisition & Zero-Setup-Fee Hero Banner */}
              <div className="rounded-lg border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600 text-white shadow-xs">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Autonomous AI Sales Representative (SDR) — Zero-Setup-Fee Restaurant Acquisition
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                    100% Autonomous • Untiring Outbound Dialing • Direct UPI Pitch
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Acquire hundreds of Indian restaurants, cafes, and cloud kitchens without hiring human sales reps. The AI autonomously dials restaurant owners, asks for the decision-maker, pitches OrderKing's Zero-Setup-Fee ₹0 onboarding and 0% commission model (saving them 28% to 32% compared to Swiggy and Zomato), handles kitchen-rush objections with instant Hinglish conversational intelligence, and automatically drops a WhatsApp brochure link upon call completion.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-background/80 p-2 text-xs">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-medium text-foreground">₹0 Setup Fee Pitch</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">0% Commission Hook</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-background/80 p-2 text-xs">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="font-medium text-foreground">Hinglish Conversational AI</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">Indian Business Persona</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-background/80 p-2 text-xs">
                    <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                    <span className="font-medium text-foreground">Instant WhatsApp Drop</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">Post-Call Brochure</span>
                  </div>
                </div>
              </div>

              {/* 1-Click Autonomous Sales Presets & Call Safeguards */}
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      1-Click Autonomous Sales Presets & Call Automation
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">High-Velocity Outbound SDR</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <label className="flex items-start gap-2.5 p-2.5 rounded-md border border-border bg-card/60 hover:bg-card cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={config.telemarketing.autoPitchZeroSetupFee}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          telemarketing: { ...prev.telemarketing, autoPitchZeroSetupFee: e.target.checked },
                        }))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">Auto-Pitch Zero Setup Fee (₹0 Onboarding)</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Emphasizes ₹0 upfront cost, ₹0 hardware lock-in, and instant UPI payouts to remove friction
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-md border border-border bg-card/60 hover:bg-card cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={config.telemarketing.autoSendWhatsappBrochure}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          telemarketing: { ...prev.telemarketing, autoSendWhatsappBrochure: e.target.checked },
                        }))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">Instant WhatsApp Brochure Drop</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Auto-dispatches digital menu demo link & onboarding brochure to owner's WhatsApp immediately
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-md border border-border bg-card/60 hover:bg-card cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={config.telemarketing.autoBookOnboardingDemo}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          telemarketing: { ...prev.telemarketing, autoBookOnboardingDemo: e.target.checked },
                        }))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">Auto-Book Onboarding Walkthrough</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        AI verifies owner's free time and reserves a 10-minute slot with OrderKing onboarding specialists
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-md border border-border bg-card/60 hover:bg-card cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={config.telemarketing.transferOnHighIntent}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          telemarketing: { ...prev.telemarketing, transferOnHighIntent: e.target.checked },
                        }))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">Warm Live Transfer on High Intent</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Instantly rings the Founder's direct phone if the restaurant owner expresses high interest
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-md border border-border bg-card/60 hover:bg-card cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={config.telemarketing.dndScrubbingEnabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          telemarketing: { ...prev.telemarketing, dndScrubbingEnabled: e.target.checked },
                        }))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">TRAI NDNC Scrubbing & Compliance</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Filters telephone numbers against National Do-Not-Call registry before outbound dialing
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-md border border-border bg-card/60 hover:bg-card cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={config.telemarketing.recordCalls}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          telemarketing: { ...prev.telemarketing, recordCalls: e.target.checked },
                        }))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">Dual-Channel Call Recording & Sentiment</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Saves high-res audio recordings and transcripts with merchant objection sentiment scoring
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Voice AI Provider Engine</label>
                  <select
                    value={config.telemarketing.provider}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        telemarketing: { ...prev.telemarketing, provider: e.target.value as any },
                      }))
                    }
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="bland_ai">Bland.ai Enterprise (Outbound Conversational Phone Agent)</option>
                    <option value="twilio_voice">Twilio Voice + Custom Speech LLM WebSocket</option>
                    <option value="vapi">Vapi.ai Voice Pipeline</option>
                    <option value="retell">Retell AI Real-Time Conversational Engine</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Pitch Objective & Value Proposition</label>
                  <select
                    value={config.telemarketing.pitchObjective}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        telemarketing: { ...prev.telemarketing, pitchObjective: e.target.value as any },
                      }))
                    }
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="zero_setup_fee_acquisition">Zero Setup Fee & 0% Commission (Aggregator Alternative - Recommended)</option>
                    <option value="commission_slashing">Aggregator Commission Slashing (Save 30% on Repeat Diners)</option>
                    <option value="direct_ordering_migration">Direct Ordering QR Migration (Convert Dine-In into Regulars)</option>
                    <option value="custom">Custom Bespoke Pitch Script</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      {config.telemarketing.provider === "twilio_voice" ? "Bland.ai / Voice API Key (Optional)" : "Bland.ai API Key"}
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility("tm_apiKey")}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {visibleSecrets.tm_apiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {visibleSecrets.tm_apiKey ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={visibleSecrets.tm_apiKey ? "text" : "password"}
                    value={config.telemarketing.apiKey}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        telemarketing: { ...prev.telemarketing, apiKey: e.target.value },
                      }))
                    }
                    placeholder="Enter Bland.ai API Key (e.g. org_live_...)"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Twilio Account SID {config.telemarketing.provider === "twilio_voice" ? "(Required)" : "(Optional)"}
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility("tm_accountSid")}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {visibleSecrets.tm_accountSid ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {visibleSecrets.tm_accountSid ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={visibleSecrets.tm_accountSid ? "text" : "password"}
                    value={config.telemarketing.accountSid}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        telemarketing: { ...prev.telemarketing, accountSid: e.target.value },
                      }))
                    }
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Twilio Auth Token / API Secret {config.telemarketing.provider === "twilio_voice" ? "(Required)" : "(Optional)"}
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility("tm_apiSecret")}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {visibleSecrets.tm_apiSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {visibleSecrets.tm_apiSecret ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={visibleSecrets.tm_apiSecret ? "text" : "password"}
                    value={config.telemarketing.apiSecret}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        telemarketing: { ...prev.telemarketing, apiSecret: e.target.value },
                      }))
                    }
                    placeholder="Enter Twilio Auth Token or Provider Secret"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Outbound Caller ID DID (E.164)</label>
                  <input
                    type="text"
                    value={config.telemarketing.fromPhoneNumber}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        telemarketing: { ...prev.telemarketing, fromPhoneNumber: e.target.value },
                      }))
                    }
                    placeholder="+91 80 4712 3456 (Verified Indian Outbound Caller ID)"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Founder Direct Mobile for Warm Transfer</label>
                  <input
                    type="text"
                    value={config.telemarketing.transferPhoneNumber}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        telemarketing: { ...prev.telemarketing, transferPhoneNumber: e.target.value },
                      }))
                    }
                    placeholder="+91 98765 43210 (Founder personal phone for live transfer)"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">AI Voice Persona & Model</label>
                  <select
                    value={config.telemarketing.voiceId}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        telemarketing: { ...prev.telemarketing, voiceId: e.target.value },
                      }))
                    }
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="nat_indian_exec">Kabir (Natural Indian Male - Executive & Confident)</option>
                    <option value="priya_indian_consultative">Priya (Natural Indian Female - Warm & Consultative)</option>
                    <option value="rohit_indian_energetic">Rohit (Energetic Indian Male - High Growth Focus)</option>
                    <option value="ananya_indian_concise">Ananya (Polite Indian Female - Crisp & Professional)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Primary Language & Regional Dialect</label>
                  <select
                    value={config.telemarketing.language}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        telemarketing: { ...prev.telemarketing, language: e.target.value as any },
                      }))
                    }
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="hinglish">Hinglish (Hindi + English Conversational Blend - Recommended for Metro Restaurants)</option>
                    <option value="en-IN">Indian English (Formal Business English - Pan India)</option>
                    <option value="hi-IN">Hindi (North India & Tier 2/3 Regions)</option>
                    <option value="mr-IN">Marathi + Hinglish (Maharashtra / Mumbai / Pune)</option>
                    <option value="ta-IN">Tamil + English (Tamil Nadu / Chennai)</option>
                    <option value="te-IN">Telugu + English (Telangana / Hyderabad / AP)</option>
                    <option value="bn-IN">Bengali + English (West Bengal / Kolkata)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Objection Handling Stance</label>
                  <select
                    value={config.telemarketing.objectionHandlingMode}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        telemarketing: { ...prev.telemarketing, objectionHandlingMode: e.target.value as any },
                      }))
                    }
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="aggressive_roi">Aggressive ROI (Focus on saving ₹30k - ₹50k/month lost to Swiggy/Zomato commission)</option>
                    <option value="consultative_polite">Consultative & Respectful (Educate on owning customer data and direct UPI payouts)</option>
                    <option value="urgency_limited_slots">Limited Cohort Urgency (Only 5 zero-commission slots available in this pin code)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Voice Pacing / Speech Rate</label>
                  <select
                    value={config.telemarketing.voiceSpeed.toString()}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        telemarketing: { ...prev.telemarketing, voiceSpeed: parseFloat(e.target.value) || 1.0 },
                      }))
                    }
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="0.85">0.85x (Deliberate & Slow)</option>
                    <option value="0.95">0.95x (Clear & Calm)</option>
                    <option value="1">1.0x (Natural Conversational Speed - Default)</option>
                    <option value="1.08">1.08x (Brisk & Dynamic)</option>
                    <option value="1.15">1.15x (Fast Executive Pacing)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Voice Temperature / Spontaneity</label>
                  <select
                    value={config.telemarketing.voiceTemperature.toString()}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        telemarketing: { ...prev.telemarketing, voiceTemperature: parseFloat(e.target.value) || 0.7 },
                      }))
                    }
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="0.3">0.3 (Strict Script Adherence - Low Variance)</option>
                    <option value="0.5">0.5 (Balanced Conversational Flow)</option>
                    <option value="0.7">0.7 (Dynamic & Natural Objection Handling - Recommended)</option>
                    <option value="0.9">0.9 (Highly Spontaneous & Adaptive)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Max Concurrent Outbound Lines</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={config.telemarketing.maxConcurrentCalls}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        telemarketing: { ...prev.telemarketing, maxConcurrentCalls: parseInt(e.target.value, 10) || 5 },
                      }))
                    }
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Max Call Duration Limit (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={config.telemarketing.maxCallDurationMinutes}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        telemarketing: { ...prev.telemarketing, maxCallDurationMinutes: parseInt(e.target.value, 10) || 4 },
                      }))
                    }
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Calling Window Start Time (IST)</label>
                  <input
                    type="text"
                    value={config.telemarketing.callingWindowStart}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        telemarketing: { ...prev.telemarketing, callingWindowStart: e.target.value },
                      }))
                    }
                    placeholder="10:30 AM (Avoid early kitchen prep)"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Calling Window End Time (IST)</label>
                  <input
                    type="text"
                    value={config.telemarketing.callingWindowEnd}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        telemarketing: { ...prev.telemarketing, callingWindowEnd: e.target.value },
                      }))
                    }
                    placeholder="05:00 PM (Avoid dinner rush)"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Unanswered Call Retry Attempts</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={config.telemarketing.retryAttempts}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        telemarketing: { ...prev.telemarketing, retryAttempts: parseInt(e.target.value, 10) || 2 },
                      }))
                    }
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Unanswered Retry Delay (Minutes)</label>
                  <input
                    type="number"
                    min="15"
                    max="240"
                    value={config.telemarketing.retryDelayMinutes}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        telemarketing: { ...prev.telemarketing, retryDelayMinutes: parseInt(e.target.value, 10) || 60 },
                      }))
                    }
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">HMAC Webhook Secret</label>
                    <button
                      type="button"
                      onClick={() => toggleSecretVisibility("tm_webhookSecret")}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {visibleSecrets.tm_webhookSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {visibleSecrets.tm_webhookSecret ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={visibleSecrets.tm_webhookSecret ? "text" : "password"}
                    value={config.telemarketing.webhookSecret}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        telemarketing: { ...prev.telemarketing, webhookSecret: e.target.value },
                      }))
                    }
                    placeholder="Enter HMAC Webhook Secret"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Full Width Script Customization: First Sentence Opener */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Mic className="h-3.5 w-3.5 text-emerald-500" />
                    First Sentence Opener (Immediate 3-Second Hook)
                  </label>
                  <span className="text-[11px] text-muted-foreground">Spoken the millisecond the merchant picks up</span>
                </div>
                <input
                  type="text"
                  value={config.telemarketing.firstSentence}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      telemarketing: { ...prev.telemarketing, firstSentence: e.target.value },
                    }))
                  }
                  placeholder="Namaste! Am I speaking with the restaurant owner or general manager? Quick question regarding your online delivery commission rates."
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Full Width Script Customization: System Prompt & Objection Handling Playbook */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5 text-emerald-500" />
                    Autonomous Sales Agent System Prompt & Objection Handling Playbook
                  </label>
                  <span className="text-[11px] text-muted-foreground">Comprehensive Zero-Setup-Fee Pitch Instructions</span>
                </div>
                <textarea
                  rows={10}
                  value={config.telemarketing.systemPrompt}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      telemarketing: { ...prev.telemarketing, systemPrompt: e.target.value },
                    }))
                  }
                  placeholder="Enter full system prompt for the AI telemarketing sales agent..."
                  className="w-full rounded-lg border border-border bg-background p-3 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </div>

              {/* Policy & Compliance Box */}
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-foreground">
                    {cmsConfig.connectorTelemarketingPolicyTitle || "TRAI Telemarketing & DND Regulatory Compliance Guard"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {cmsConfig.connectorTelemarketingPolicyNotice || "Commercial communications strictly scrubbed against the National Do-Not-Call (NDNC) registry. Calling windows enforced between 10:30 AM and 05:00 PM to avoid kitchen rush periods."}
                </p>
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-emerald-500/10 text-[11px] text-muted-foreground">
                  <span>{cmsConfig.connectorTelemarketingWebhookNotice || "Autonomous Call Webhook: Streams real-time call transcripts, audio recordings, owner sentiment scores, and auto-dispatches WhatsApp onboarding links upon hangup."}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono bg-background px-2 py-0.5 rounded border border-border text-[10px]">
                      /api/v1/telemarketing/bland-voice-webhook
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy("https://api.orderking.in/api/v1/telemarketing/bland-voice-webhook", "tm_wh")}
                      className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy Webhook Endpoint"
                    >
                      {copiedKey === "tm_wh" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 12. UMAROS CARPET-BOMBING GEOSPATIAL AD EXCHANGE (TELECOM & DSP) */}
          {(activeTab === "all" || activeTab === "geospatialAdExchange") && (
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

          {/* 13. META OMNICHANNEL GEO-BLAST ENGINE (META GRAPH API & WHATSAPP CLOUD API) */}
          {(activeTab === "all" || activeTab === "metaOmnichannel") && (
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

          {/* 14. AI DEEPFAKE MEDIA ENGINE (SYNTHESIA / HEYGEN API) */}
          {(activeTab === "all" || activeTab === "aiMediaEngine") && (
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

          {/* 15. GLOBAL AD SYNDICATE HUB (4 REVENUE STREAMS) */}
          {(activeTab === "all" || activeTab === "globalAdSyndicate") && (
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

          {/* 16. OEM LOCK-SCREEN AD HUB (GLANCE & INMOBI) */}
          {(activeTab === "all" || activeTab === "oemLockScreen") && (
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

          {/* 17. WI-FI CAPTIVE PORTAL AD NETWORK (UMAROS) */}
          {(activeTab === "all" || activeTab === "wifiCaptivePortal") && (
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
