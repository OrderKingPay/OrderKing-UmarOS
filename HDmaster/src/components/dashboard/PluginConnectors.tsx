import { useState, useEffect, useMemo } from "react";
import {
  DEFAULT_PLUGIN_CONNECTORS,
  type PluginConnectorsConfig,
  type RazorpayConnector,
  type WhatsAppConnector,
  type FssaiConnector,
  type MapboxConnector,
} from "@/lib/orderking/cms-connectors";
import {
  loadPluginConnectorsFn,
  savePluginConnectorsFn,
  testPluginConnectorFn,
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
} from "lucide-react";

type ConnectorTab = "all" | "razorpay" | "whatsapp" | "fssai" | "mapbox";

export function PluginConnectors() {
  const [config, setConfig] = useState<PluginConnectorsConfig>(DEFAULT_PLUGIN_CONNECTORS);
  const [initialConfig, setInitialConfig] = useState<PluginConnectorsConfig>(DEFAULT_PLUGIN_CONNECTORS);
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
        let data: PluginConnectorsConfig | null = null;
        try {
          const res = await loadPluginConnectorsFn();
          if (res && res.ok && res.data) data = res.data;
        } catch {
          const resp = await fetch("/api/v1/admin/settings");
          if (resp.ok) {
            const json = await resp.json();
            if (json.plugin_connectors) data = json.plugin_connectors;
          }
        }

        if (mounted && data) {
          setConfig(data);
          setInitialConfig(data);
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

  const handleTestConnection = async (service: "razorpay" | "whatsapp" | "fssai" | "mapbox") => {
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
  const getConnectorStatus = (service: "razorpay" | "whatsapp" | "fssai" | "mapbox") => {
    const item = config[service];
    let isConfigured = false;
    if (service === "razorpay") isConfigured = !!(item as RazorpayConnector).keyId && !!(item as RazorpayConnector).keySecret;
    if (service === "whatsapp") isConfigured = !!(item as WhatsAppConnector).phoneNumberId && !!(item as WhatsAppConnector).systemAccessToken;
    if (service === "fssai") isConfigured = !!(item as FssaiConnector).clientId && !!(item as FssaiConnector).authorizationToken;
    if (service === "mapbox") isConfigured = !!(item as MapboxConnector).publicAccessToken;

    if (!isConfigured) return { status: "NOT_CONFIGURED" as const, label: "Not Configured", tone: "neutral" as const };
    if (!item.enabled) return { status: "STANDBY" as const, label: "Standby / Disabled", tone: "amber" as const };
    return { status: "CONNECTED" as const, label: "Active & Connected", tone: "emerald" as const };
  };

  // Metrics summary
  const summaryMetrics = useMemo(() => {
    let configuredCount = 0;
    let activeCount = 0;
    (["razorpay", "whatsapp", "fssai", "mapbox"] as const).forEach((svc) => {
      const st = getConnectorStatus(svc);
      if (st.status !== "NOT_CONFIGURED") configuredCount++;
      if (st.status === "CONNECTED") activeCount++;
    });
    return { configuredCount, activeCount, total: 4 };
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
                  Plugin Switchboard & External Connectors
                </h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary border border-primary/20">
                  {summaryMetrics.activeCount} / {summaryMetrics.total} Active
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Institutional integration management. Securely configure Razorpay payment rails, WhatsApp Business API, FSSAI regulatory verification, and Mapbox geospatial telemetry.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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

      {/* Navigation Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {[
          { id: "all" as const, label: "All Integrations", icon: Layers },
          { id: "razorpay" as const, label: "Razorpay Payments", icon: CreditCard },
          { id: "whatsapp" as const, label: "WhatsApp Business API", icon: MessageSquare },
          { id: "fssai" as const, label: "FSSAI Regulatory Gateway", icon: ShieldAlert },
          { id: "mapbox" as const, label: "Mapbox Geospatial Matrix", icon: Navigation },
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
                        Razorpay Payment Gateway Integration
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
                      Handles instant customer UPI, credit/debit card tokenization, auto-capture, and merchant settlement transfers.
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
                        WhatsApp Business API Connector
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
                      Transmits real-time order receipts, OTP delivery handshakes, and merchant alerts via Meta Cloud API or Gupshup.
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
                        FSSAI Government Regulatory Verification Gateway
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
                      Direct integration with the FoSCoS Government Portal. Verifies 14-digit restaurant food licenses and enforces statutory onboarding rules.
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
                    Strict Regulatory Onboarding Gate
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Automatically block merchant kitchens from taking live customer orders if their 14-digit FSSAI license is absent, lapsed, or rejected by the FoSCoS gateway.
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
                        Mapbox Geospatial Matrix & Routing Telemetry
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
                      Powers multi-point distance matrix calculations, live congestion avoidance, and real-time rider GPS vector estimation.
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
        </div>
      )}
    </div>
  );
}
