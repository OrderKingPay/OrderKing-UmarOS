import { useState, useMemo } from "react";
import {
  type OemLockScreenConnector,
  type OemLockScreenCampaign,
  DEFAULT_PLUGIN_CONNECTORS,
  type EcosystemCmsConfig,
} from "@/lib/orderking/cms-connectors";
import {
  testPluginConnectorFn,
  createOemLockScreenCampaignFn,
  toggleOemCampaignStatusFn,
} from "@/lib/orderking/actions";
import {
  Smartphone,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  DollarSign,
  TrendingUp,
  Sliders,
  Plus,
  Play,
  Pause,
  ExternalLink,
  Layers,
  Sparkles,
  Zap,
  Building2,
  CheckSquare,
  Square,
  ArrowUpRight,
  Info,
} from "lucide-react";

interface OemLockScreenHubProps {
  config?: OemLockScreenConnector;
  onUpdate?: (updates: Partial<OemLockScreenConnector>) => void;
  cmsConfig?: EcosystemCmsConfig;
  onSave?: () => void;
  isSaving?: boolean;
}

export function OemLockScreenHub({
  config: externalConfig,
  onUpdate,
  onSave,
  isSaving = false,
}: OemLockScreenHubProps) {
  const [internalConfig, setInternalConfig] = useState<OemLockScreenConnector>(
    externalConfig || DEFAULT_PLUGIN_CONNECTORS.oemLockScreen
  );

  const config = externalConfig || internalConfig;

  const updateConfig = (updates: Partial<OemLockScreenConnector>) => {
    if (onUpdate) {
      onUpdate(updates);
    } else {
      setInternalConfig((prev) => ({ ...prev, ...updates }));
    }
  };

  // Credentials visibility & copy states
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Diagnostic testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
    timestamp: string;
  } | null>(null);

  // Campaign Booking Form State
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [advName, setAdvName] = useState("");
  const [advPhone, setAdvPhone] = useState("");
  const [advCategory, setAdvCategory] = useState("Local Restaurant & Dining");
  const [adHeadline, setAdHeadline] = useState("");
  const [adSubtext, setAdSubtext] = useState("");
  const [adDeepLink, setAdDeepLink] = useState("");
  const [adFormat, setAdFormat] = useState<"glance_story_card" | "full_bleed_wallpaper" | "interactive_widget">(
    "glance_story_card"
  );
  const [campaignBudget, setCampaignBudget] = useState(5000);
  const [targetXiaomi, setTargetXiaomi] = useState(true);
  const [targetSamsung, setTargetSamsung] = useState(true);
  const [targetVivo, setTargetVivo] = useState(true);
  const [targetOppo, setTargetOppo] = useState(true);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [campaignCreationMessage, setCampaignCreationMessage] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Run API handshake diagnostic
  const handleRunDiagnostic = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);
      const res = await testPluginConnectorFn({
        data: { service: "oemLockScreen", payload: config },
      });
      if (res && res.ok) {
        setTestResult({
          ok: true,
          message: res.message || "InMobi / Glance OEM API verified successfully.",
          timestamp: new Date().toLocaleTimeString(),
        });
      } else {
        setTestResult({
          ok: false,
          message: (res as any)?.error || "Lock-Screen API authentication failed.",
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err?.message || "Diagnostic test encounter error.",
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Aggregated campaign calculations (Zero fake data - starts at 0)
  const campaigns = config.campaigns || [];
  const metrics = useMemo(() => {
    const totalBookedBudget = campaigns.reduce((acc, c) => acc + (c.budgetInr || 0), 0);
    const totalFounderProfit = campaigns.reduce((acc, c) => acc + (c.founderProfitInr || 0), 0);
    const totalImpressionsDelivered = campaigns.reduce(
      (acc, c) => acc + (c.impressionsDelivered || 0),
      0
    );
    const activeCampaignsCount = campaigns.filter((c) => c.status === "ACTIVE").length;

    const wholesaleCpm = config.wholesaleCostCpmInr || 48.0;
    const retailCpm = config.retailMarkupPriceInr || 185.0;
    const marginSpread = retailCpm - wholesaleCpm;
    const marginPercent = ((marginSpread / retailCpm) * 100).toFixed(1);

    return {
      totalBookedBudget,
      totalFounderProfit,
      totalImpressionsDelivered,
      activeCampaignsCount,
      wholesaleCpm,
      retailCpm,
      marginSpread,
      marginPercent,
    };
  }, [campaigns, config.wholesaleCostCpmInr, config.retailMarkupPriceInr]);

  // Handle Create Local Business Campaign
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advName.trim() || !adHeadline.trim() || !adDeepLink.trim()) return;

    try {
      setIsCreatingCampaign(true);
      setCampaignCreationMessage(null);

      const res = await createOemLockScreenCampaignFn({
        data: {
          advertiserName: advName.trim(),
          contactPhone: advPhone.trim() || "+91 98000 00000",
          businessCategory: advCategory,
          adHeadline: adHeadline.trim(),
          adSubtext: adSubtext.trim() || "Order direct with ₹0 markups via OrderKing.",
          ctaDeepLink: adDeepLink.trim(),
          adFormat,
          budgetInr: Number(campaignBudget),
          retailCpmInr: config.retailMarkupPriceInr,
          wholesaleCpmInr: config.wholesaleCostCpmInr,
          targetXiaomi,
          targetSamsung,
          targetVivo,
          targetOppo,
        },
      });

      if (res && res.ok && res.campaign) {
        setCampaignCreationMessage(`Success: ${res.message}`);
        const updated: OemLockScreenCampaign[] = [res.campaign as OemLockScreenCampaign, ...campaigns];
        updateConfig({ campaigns: updated });
        setTimeout(() => {
          setShowCampaignModal(false);
          setCampaignCreationMessage(null);
          setAdvName("");
          setAdHeadline("");
          setAdSubtext("");
          setAdDeepLink("");
        }, 1500);
      } else {
        setCampaignCreationMessage((res as any)?.error || "Failed to create lock-screen campaign.");
      }
    } catch (err: any) {
      setCampaignCreationMessage(err?.message || "Error booking lock-screen campaign.");
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  // Toggle Campaign status
  const handleToggleStatus = async (
    campaignId: string,
    currentStatus: "ACTIVE" | "COMPLETED" | "PAUSED"
  ) => {
    const nextStatus: "ACTIVE" | "PAUSED" = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      await toggleOemCampaignStatusFn({
        data: { campaignId, newStatus: nextStatus },
      });
      const updated: OemLockScreenCampaign[] = campaigns.map((c) =>
        c.id === campaignId ? { ...c, status: nextStatus } : c
      );
      updateConfig({ campaigns: updated });
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  return (
    <div className="space-y-6 text-slate-900 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-700 text-white shadow-xs">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                OEM Lock-Screen Ad Hub (Glance & InMobi)
              </h2>
              <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800 border border-purple-200">
                Xiaomi • Samsung • Vivo Fleet
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Turn 100M+ Indian smartphone lock-screens into a proprietary hyper-local billboard network.
              Buy wholesale Glance inventory from InMobi, apply retail markup pricing, and charge local restaurants and businesses to display full-bleed lock-screen stories.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleRunDiagnostic}
            disabled={isTesting}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? "animate-spin" : ""}`} />
            {isTesting ? "Validating SSP API..." : "Test InMobi/Glance Handshake"}
          </button>

          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-xs"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {isSaving ? "Persisting Config..." : "Save Lock-Screen Config"}
            </button>
          )}
        </div>
      </div>

      {/* Diagnostic Result Banner */}
      {testResult && (
        <div
          className={`flex items-start gap-3 rounded-lg border p-4 text-xs ${
            testResult.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {testResult.ok ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          )}
          <div className="flex-1">
            <div className="font-semibold">
              {testResult.ok ? "InMobi / Glance SSP Authenticated" : "Handshake Diagnostic Error"}
            </div>
            <p className="mt-0.5 text-slate-700">{testResult.message}</p>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Checked at: {testResult.timestamp}
            </span>
          </div>
        </div>
      )}

      {/* SECTION 1: CREDENTIALS & API CONNECTOR INPUTS */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-slate-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              OEM Publisher Credentials & Knox Gateways
            </h3>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <span>Connector Enabled:</span>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => updateConfig({ enabled: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* MANDATORY INPUT 1: InMobi/Glance Publisher API Key */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-800">
              InMobi/Glance Publisher API Key *
            </label>
            <div className="relative flex items-center">
              <input
                type={showApiKey ? "text" : "password"}
                value={config.glancePublisherApiKey || ""}
                onChange={(e) => updateConfig({ glancePublisherApiKey: e.target.value })}
                placeholder="glance_live_pub_key_xxxxxxxx"
                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 pr-16 text-slate-900 font-mono text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
              <div className="absolute right-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                  title={showApiKey ? "Hide key" : "Show key"}
                >
                  {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(config.glancePublisherApiKey || "", "api_key")}
                  className="p-1 text-slate-400 hover:text-slate-700"
                  title="Copy key"
                >
                  {copiedField === "api_key" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Direct Glance programmatic partner key from InMobi Enterprise DSP dashboard.
            </p>
          </div>

          {/* MANDATORY INPUT 2: Samsung Knox Advertiser ID */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-800">
              Samsung Knox Advertiser ID *
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={config.samsungKnoxAdvertiserId || config.samsungKnoxAdNetworkId || ""}
                onChange={(e) =>
                  updateConfig({
                    samsungKnoxAdvertiserId: e.target.value,
                    samsungKnoxAdNetworkId: e.target.value,
                  })
                }
                placeholder="knox_adv_corp_orderking_ind"
                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 pr-9 text-slate-900 font-mono text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    config.samsungKnoxAdvertiserId || config.samsungKnoxAdNetworkId || "",
                    "knox_id"
                  )
                }
                className="absolute right-2 p-1 text-slate-400 hover:text-slate-700"
                title="Copy Knox ID"
              >
                {copiedField === "knox_id" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Samsung Galaxy One UI Glance verification token for hardware lock-screen carousel.
            </p>
          </div>

          {/* Secondary fields */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              Glance Partner ID
            </label>
            <input
              type="text"
              value={config.glancePartnerId || ""}
              onChange={(e) => updateConfig({ glancePartnerId: e.target.value })}
              placeholder="orderking-inmobi-dsp-partner-delhi"
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-slate-900 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700">
              Xiaomi SSP Publisher ID
            </label>
            <input
              type="text"
              value={config.xiaomiSspPublisherId || ""}
              onChange={(e) => updateConfig({ xiaomiSspPublisherId: e.target.value })}
              placeholder="mi_hyperos_ssp_carousel_991"
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-slate-900 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {/* OEM Target Fleet Checkboxes */}
        <div className="pt-2 border-t border-slate-200">
          <div className="text-xs font-semibold text-slate-700 mb-2">
            Target Hardware Fleet Surfaces:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={config.targetXiaomiHyperOs}
                onChange={(e) => updateConfig({ targetXiaomiHyperOs: e.target.checked })}
                className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900"
              />
              <span className="text-[11px] font-medium text-slate-800">Xiaomi HyperOS</span>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={config.targetSamsungOneUi}
                onChange={(e) => updateConfig({ targetSamsungOneUi: e.target.checked })}
                className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900"
              />
              <span className="text-[11px] font-medium text-slate-800">Samsung One UI</span>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={config.targetVivoFuntouch}
                onChange={(e) => updateConfig({ targetVivoFuntouch: e.target.checked })}
                className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900"
              />
              <span className="text-[11px] font-medium text-slate-800">Vivo Funtouch OS</span>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={config.targetOppoRealmeColorOs}
                onChange={(e) => updateConfig({ targetOppoRealmeColorOs: e.target.checked })}
                className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900"
              />
              <span className="text-[11px] font-medium text-slate-800">Oppo / Realme</span>
            </label>
          </div>
        </div>
      </div>

      {/* SECTION 2: AD-NETWORK RESELLING DASHBOARD & PRICING SLIDER */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-purple-700" />
              Ad-Network Reselling Dashboard & Retail Markup Slider
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Charge local businesses retail pricing while settling programmatic inventory at wholesale rates.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCampaignModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-purple-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-purple-800 transition-colors shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Book Local Business Ad
          </button>
        </div>

        {/* Pricing Slider Box */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-800">
                Retail CPM Charged to Local Businesses
              </span>
              <p className="text-[11px] text-slate-500">
                The price you quote and bill to local dining and retail clients per 1,000 lock-screen impressions.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] text-slate-500">Wholesale InMobi Base</div>
                <div className="text-xs font-semibold text-slate-700">
                  ₹{metrics.wholesaleCpm.toFixed(2)} / CPM
                </div>
              </div>
              <div className="rounded-lg bg-white border border-slate-300 px-3 py-1.5 text-right shadow-2xs">
                <div className="text-[10px] font-semibold text-purple-700 uppercase">Retail Price</div>
                <div className="text-base font-extrabold text-slate-900">
                  ₹{metrics.retailCpm.toFixed(2)} <span className="text-xs font-normal text-slate-500">/ CPM</span>
                </div>
              </div>
            </div>
          </div>

          <input
            type="range"
            min="60"
            max="450"
            step="5"
            value={config.retailMarkupPriceInr}
            onChange={(e) =>
              updateConfig({
                retailMarkupPriceInr: Number(e.target.value),
              })
            }
            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-700"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <span className="text-slate-500">
              Net Arbitrage Spread: <strong className="text-slate-900">+₹{metrics.marginSpread.toFixed(2)}/CPM</strong>
            </span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-800 border border-emerald-200">
              Founder Net Profit Margin: {metrics.marginPercent}%
            </span>
          </div>
        </div>

        {/* Live Aggregated Metrics (Zero fake data - starts at 0) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
            <div className="text-slate-500 text-[11px]">Active Campaigns</div>
            <div className="text-lg font-bold text-slate-900 mt-1">
              {metrics.activeCampaignsCount}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
            <div className="text-slate-500 text-[11px]">Delivered Impressions</div>
            <div className="text-lg font-bold text-slate-900 mt-1">
              {metrics.totalImpressionsDelivered.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
            <div className="text-slate-500 text-[11px]">Gross Client Spend</div>
            <div className="text-lg font-bold text-slate-900 mt-1">
              ₹{metrics.totalBookedBudget.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="rounded-lg border border-purple-200 bg-purple-50/60 p-3 text-center">
            <div className="text-purple-800 text-[11px] font-semibold">Founder Net Profit</div>
            <div className="text-lg font-extrabold text-purple-900 mt-1">
              ₹{metrics.totalFounderProfit.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* Active Campaigns Table (Starts at 0 - Zero fake data) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Booked Local Business Campaigns ({campaigns.length})
            </h4>
            {campaigns.length === 0 && (
              <span className="text-[11px] text-slate-400 italic">
                Zero fake data seeded — start by clicking "Book Local Business Ad"
              </span>
            )}
          </div>

          {campaigns.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center bg-slate-50/50">
              <Smartphone className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-700">No campaigns booked yet</div>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm mx-auto">
                All ledger metrics start at 0. Charge local restaurants to display swipeable story cards on Xiaomi and Samsung lock-screens.
              </p>
              <button
                type="button"
                onClick={() => setShowCampaignModal(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <Plus className="h-3 w-3" />
                Book First Campaign
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                  <tr>
                    <th className="p-3">Advertiser Business</th>
                    <th className="p-3">Ad Format</th>
                    <th className="p-3">Budget</th>
                    <th className="p-3">Impressions</th>
                    <th className="p-3">Founder Profit</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-semibold text-slate-900">
                        {c.advertiserName}
                        <div className="text-[10px] text-slate-500 font-normal">
                          {c.adHeadline}
                        </div>
                      </td>
                      <td className="p-3 uppercase text-[10px] font-mono text-slate-600">
                        {c.adFormat.replace(/_/g, " ")}
                      </td>
                      <td className="p-3 font-semibold text-slate-900">
                        ₹{c.budgetInr.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3">
                        {c.impressionsDelivered.toLocaleString("en-IN")} /{" "}
                        {c.totalImpressions.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3 font-bold text-emerald-700">
                        +₹{c.founderProfitInr.toLocaleString("en-IN")}{" "}
                        <span className="text-[10px] font-normal text-slate-500">
                          ({c.profitMarginPercent}%)
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            c.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : c.status === "PAUSED"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c.id, c.status)}
                          className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                        >
                          {c.status === "ACTIVE" ? "Pause" : "Resume"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Book Local Business Lock-Screen Ad */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl border border-slate-300 bg-white p-6 shadow-xl space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-purple-700" />
                <h4 className="text-base font-bold text-slate-900">
                  Book Local Business Lock-Screen Ad
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowCampaignModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Advertiser Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={advName}
                  onChange={(e) => setAdvName(e.target.value)}
                  placeholder="e.g. Biryani Blues / Urban Pizza Co."
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={advPhone}
                    onChange={(e) => setAdvPhone(e.target.value)}
                    placeholder="+91 98110 00000"
                    className="w-full h-9 rounded-lg border border-slate-300 px-3 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ad Format
                  </label>
                  <select
                    value={adFormat}
                    onChange={(e) => setAdFormat(e.target.value as any)}
                    className="w-full h-9 rounded-lg border border-slate-300 px-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="glance_story_card">Glance Story Card (Carousel)</option>
                    <option value="full_bleed_wallpaper">Full-Bleed Wallpaper Ad</option>
                    <option value="interactive_widget">Interactive Swipe Widget</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lock-Screen Headline *
                </label>
                <input
                  type="text"
                  required
                  value={adHeadline}
                  onChange={(e) => setAdHeadline(e.target.value)}
                  placeholder="e.g. Sizzling Butter Chicken Delivered in 20 Mins • ₹0 Surge"
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Subtext / Value Proposition
                </label>
                <input
                  type="text"
                  value={adSubtext}
                  onChange={(e) => setAdSubtext(e.target.value)}
                  placeholder="Order direct for genuine restaurant rates and ₹0 platform fee."
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Destination Deep-Link / Claim URL *
                </label>
                <input
                  type="text"
                  required
                  value={adDeepLink}
                  onChange={(e) => setAdDeepLink(e.target.value)}
                  placeholder="https://orderking.delivery/r/partner-restaurant?source=glance"
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-slate-900 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Campaign Budget (₹)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={campaignBudget}
                  onChange={(e) => setCampaignBudget(Number(e.target.value))}
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Real-time Profit Calculation */}
              {(() => {
                const totalImps = Math.floor((campaignBudget / config.retailMarkupPriceInr) * 1000);
                const wholesaleCost = Math.round((totalImps / 1000) * config.wholesaleCostCpmInr);
                const profit = campaignBudget - wholesaleCost;
                const margin = ((profit / campaignBudget) * 100).toFixed(1);
                return (
                  <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 space-y-1.5 text-slate-700">
                    <div className="flex justify-between">
                      <span>Booked Impressions:</span>
                      <strong className="text-slate-900">{totalImps.toLocaleString("en-IN")} imps</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Wholesale InMobi Cost:</span>
                      <span>₹{wholesaleCost.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between border-t border-purple-200 pt-1 font-bold text-slate-900">
                      <span>Founder Net Spread:</span>
                      <span className="text-emerald-700">+₹{profit.toLocaleString("en-IN")} ({margin}% margin)</span>
                    </div>
                  </div>
                );
              })()}

              {campaignCreationMessage && (
                <div className="rounded-lg bg-slate-100 p-2.5 text-slate-800 font-medium">
                  {campaignCreationMessage}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCampaign}
                  className="rounded-lg bg-purple-700 px-4 py-1.5 font-semibold text-white hover:bg-purple-800 disabled:opacity-50"
                >
                  {isCreatingCampaign ? "Generating Contract..." : "Confirm & Launch Ad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
