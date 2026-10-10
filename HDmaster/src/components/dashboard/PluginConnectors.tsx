import { useState, useEffect, useMemo } from "react";
import {
  DEFAULT_PLUGIN_CONNECTORS,
  type PluginConnectorsConfig,
  type RazorpayConnector,
  type WhatsAppConnector,
  type FssaiConnector,
  type MapboxConnector,
  type ClearTaxConnector,
  type WhatsAppMarketingConnector,
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
} from "lucide-react";

type ConnectorTab = "all" | "razorpay" | "whatsapp" | "fssai" | "mapbox" | "cleartax" | "whatsappMarketing";

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

  const handleTestConnection = async (service: "razorpay" | "whatsapp" | "fssai" | "mapbox" | "cleartax" | "whatsappMarketing") => {
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
  const getConnectorStatus = (service: "razorpay" | "whatsapp" | "fssai" | "mapbox" | "cleartax" | "whatsappMarketing") => {
    const item = config[service];
    let isConfigured = false;
    if (service === "razorpay") isConfigured = !!(item as RazorpayConnector).keyId && !!(item as RazorpayConnector).keySecret;
    if (service === "whatsapp") isConfigured = !!(item as WhatsAppConnector).phoneNumberId && !!(item as WhatsAppConnector).systemAccessToken;
    if (service === "fssai") isConfigured = !!(item as FssaiConnector).clientId && !!(item as FssaiConnector).authorizationToken;
    if (service === "mapbox") isConfigured = !!(item as MapboxConnector).publicAccessToken;
    if (service === "cleartax") isConfigured = !!(item as ClearTaxConnector).authKey && !!(item as ClearTaxConnector).gstin;
    if (service === "whatsappMarketing") isConfigured = !!(item as WhatsAppMarketingConnector).apiKey && !!(item as WhatsAppMarketingConnector).phoneNumberId;

    if (!isConfigured) return { status: "NOT_CONFIGURED" as const, label: "Not Configured", tone: "neutral" as const };
    if (!item.enabled) return { status: "STANDBY" as const, label: "Standby / Disabled", tone: "amber" as const };
    return { status: "CONNECTED" as const, label: "Active & Connected", tone: "emerald" as const };
  };

  // Metrics summary
  const summaryMetrics = useMemo(() => {
    let configuredCount = 0;
    let activeCount = 0;
    (["razorpay", "whatsapp", "fssai", "mapbox", "cleartax", "whatsappMarketing"] as const).forEach((svc) => {
      const st = getConnectorStatus(svc);
      if (st.status !== "NOT_CONFIGURED") configuredCount++;
      if (st.status === "CONNECTED") activeCount++;
    });
    return { configuredCount, activeCount, total: 6 };
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
                {cmsConfig.connectorsHubSubtitle || "Institutional integration management. Securely configure Razorpay payment rails, WhatsApp Business API, FSSAI regulatory verification, Mapbox geospatial telemetry, ClearTax automated GST calculation, and automated WhatsApp marketing campaigns."}
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
          </div>
        </div>
      )}

      {/* Navigation Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {[
          { id: "all" as const, label: "All Integrations", icon: Layers },
          { id: "razorpay" as const, label: "Razorpay Payments", icon: CreditCard },
          { id: "whatsapp" as const, label: "WhatsApp Business API", icon: MessageSquare },
          { id: "fssai" as const, label: "FSSAI Regulatory Gateway", icon: ShieldAlert },
          { id: "mapbox" as const, label: "Mapbox Geospatial Matrix", icon: Navigation },
          { id: "cleartax" as const, label: "Automated Tax (ClearTax)", icon: Calculator },
          { id: "whatsappMarketing" as const, label: "Automated WhatsApp Marketing", icon: Megaphone },
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
        </div>
      )}
    </div>
  );
}
