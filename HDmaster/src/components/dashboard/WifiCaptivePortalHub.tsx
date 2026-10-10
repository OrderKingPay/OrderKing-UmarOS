import { useState, useMemo } from "react";
import {
  type WifiCaptivePortalConnector,
  type WifiCaptiveRouter,
  type WifiBrandAdCampaign,
  DEFAULT_PLUGIN_CONNECTORS,
  type EcosystemCmsConfig,
} from "@/lib/orderking/cms-connectors";
import {
  testPluginConnectorFn,
  registerWifiCaptiveRouterFn,
  bookWifiCaptiveAdFn,
  toggleWifiCaptiveStatusFn,
} from "@/lib/orderking/actions";
import {
  Wifi,
  Radio,
  Router,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Sliders,
  DollarSign,
  TrendingUp,
  Smartphone,
  Eye,
  Check,
  Copy,
  ExternalLink,
  Layers,
  Sparkles,
  Zap,
  Building,
  Store,
  UploadCloud,
  Clock,
  Lock,
  Unlock,
} from "lucide-react";

interface WifiCaptivePortalHubProps {
  config?: WifiCaptivePortalConnector;
  onUpdate?: (updates: Partial<WifiCaptivePortalConnector>) => void;
  cmsConfig?: EcosystemCmsConfig;
  onSave?: () => void;
  isSaving?: boolean;
}

export function WifiCaptivePortalHub({
  config: externalConfig,
  onUpdate,
  onSave,
  isSaving = false,
}: WifiCaptivePortalHubProps) {
  const [internalConfig, setInternalConfig] = useState<WifiCaptivePortalConnector>(
    externalConfig || DEFAULT_PLUGIN_CONNECTORS.wifiCaptivePortal
  );

  const config = externalConfig || internalConfig;

  const updateConfig = (updates: Partial<WifiCaptivePortalConnector>) => {
    if (onUpdate) {
      onUpdate(updates);
    } else {
      setInternalConfig((prev) => ({ ...prev, ...updates }));
    }
  };

  // Diagnostic state
  const [isTesting, setIsTesting] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<{
    ok: boolean;
    message: string;
    timestamp: string;
  } | null>(null);

  // Router Input Fields (Required Mandate Inputs)
  const [partnerLocationName, setPartnerLocationName] = useState(
    config.partnerLocationName || ""
  );
  const [routerMacAddress, setRouterMacAddress] = useState(
    config.routerMacAddress || ""
  );
  const [portalTemplate, setPortalTemplate] = useState<
    "orderking_voucher_splash" | "interstitial_video_unlock" | "quick_survey_perk" | "minimal_fast_connect"
  >(config.portalTemplate || "orderking_voucher_splash");
  const [venueType, setVenueType] = useState<
    "cafe" | "restaurant" | "food_court" | "retail_mall" | "transit_hub"
  >("cafe");

  const [isRegisteringRouter, setIsRegisteringRouter] = useState(false);
  const [routerRegistrationNotice, setRouterRegistrationNotice] = useState<string | null>(null);

  // External Brand Ad Upload Modal State
  const [showAdModal, setShowAdModal] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [adHeadline, setAdHeadline] = useState("");
  const [adDescription, setAdDescription] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [creativeUrl, setCreativeUrl] = useState(
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
  );
  const [adBudget, setAdBudget] = useState(2500);
  const [isBookingAd, setIsBookingAd] = useState(false);
  const [adBookingNotice, setAdBookingNotice] = useState<string | null>(null);

  // Preview countdown simulator
  const [previewTimer, setPreviewTimer] = useState(5);
  const [previewUnlocked, setPreviewUnlocked] = useState(false);

  // Routers and Brand Campaigns references (Zero fake data - start at 0)
  const routers = config.routers || [];
  const brandCampaigns = config.brandCampaigns || [];

  // Aggregated totals (Zero fake data)
  const metrics = useMemo(() => {
    const totalUnlocks = routers.reduce((sum, r) => sum + (r.totalUnlocks || 0), 0) + (config.totalCaptiveUnlocks || 0);
    const totalImps = brandCampaigns.reduce((sum, b) => sum + (b.impressionsDelivered || 0), 0) + (config.totalAdImpressionsServed || 0);
    const totalRevenue = brandCampaigns.reduce((sum, b) => sum + (b.budgetInr || 0), 0) + (config.totalAdRevenueInr || 0);
    const activeRouters = routers.filter((r) => r.status === "ACTIVE").length;
    const activeAds = brandCampaigns.filter((b) => b.status === "ACTIVE").length;

    return {
      totalUnlocks,
      totalImps,
      totalRevenue,
      activeRouters,
      activeAds,
      costPerImp: config.costPerImpressionInr || 2.5,
    };
  }, [routers, brandCampaigns, config.totalCaptiveUnlocks, config.totalAdImpressionsServed, config.totalAdRevenueInr, config.costPerImpressionInr]);

  // Handle Diagnostic test
  const handleTestHandshake = async () => {
    try {
      setIsTesting(true);
      setDiagnosticResult(null);
      const res = await testPluginConnectorFn({
        data: { service: "wifiCaptivePortal", payload: config },
      });
      if (res && res.ok) {
        setDiagnosticResult({
          ok: true,
          message: res.message || "UmarOS Captive Portal Gateway Verified.",
          timestamp: new Date().toLocaleTimeString(),
        });
      } else {
        setDiagnosticResult({
          ok: false,
          message: (res as any)?.error || "Captive Portal handshake failed.",
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (err: any) {
      setDiagnosticResult({
        ok: false,
        message: err?.message || "Diagnostic connection failure.",
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Submit Router Registration
  const handleRegisterRouter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerLocationName.trim() || !routerMacAddress.trim()) return;

    try {
      setIsRegisteringRouter(true);
      setRouterRegistrationNotice(null);

      const res = await registerWifiCaptiveRouterFn({
        data: {
          locationName: partnerLocationName.trim(),
          routerMacAddress: routerMacAddress.trim(),
          portalTemplate,
          venueType,
        },
      });

      if (res && res.ok && res.router) {
        setRouterRegistrationNotice(res.message);
        const updatedRouters: WifiCaptiveRouter[] = [res.router as WifiCaptiveRouter, ...routers];
        updateConfig({
          routers: updatedRouters,
          partnerLocationName: partnerLocationName.trim(),
          routerMacAddress: routerMacAddress.trim(),
          portalTemplate,
        });
        setPartnerLocationName("");
        setRouterMacAddress("");
        setTimeout(() => setRouterRegistrationNotice(null), 3000);
      } else {
        setRouterRegistrationNotice((res as any)?.error || "Failed to register router.");
      }
    } catch (err: any) {
      setRouterRegistrationNotice(err?.message || "Error registering router.");
    } finally {
      setIsRegisteringRouter(false);
    }
  };

  // Submit External Brand Ad Campaign
  const handleBookBrandAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim() || !adHeadline.trim() || !targetUrl.trim()) return;

    try {
      setIsBookingAd(true);
      setAdBookingNotice(null);

      const res = await bookWifiCaptiveAdFn({
        data: {
          brandName: brandName.trim(),
          headline: adHeadline.trim(),
          description: adDescription.trim() || "Enjoy high-speed Wi-Fi courtesy of our sponsor.",
          creativeUrl: creativeUrl.trim(),
          targetUrl: targetUrl.trim(),
          budgetInr: Number(adBudget),
          costPerImpressionInr: config.costPerImpressionInr,
          retailCpmInr: (config.costPerImpressionInr || 2.5) * 1000,
        },
      });

      if (res && res.ok && res.campaign) {
        setAdBookingNotice(`Ad scheduled! ${res.message}`);
        const updated: WifiBrandAdCampaign[] = [res.campaign as WifiBrandAdCampaign, ...brandCampaigns];
        updateConfig({ brandCampaigns: updated });
        setTimeout(() => {
          setShowAdModal(false);
          setAdBookingNotice(null);
          setBrandName("");
          setAdHeadline("");
          setTargetUrl("");
        }, 1500);
      } else {
        setAdBookingNotice((res as any)?.error || "Failed to launch Wi-Fi captive ad.");
      }
    } catch (err: any) {
      setAdBookingNotice(err?.message || "Error booking Wi-Fi ad.");
    } finally {
      setIsBookingAd(false);
    }
  };

  // Toggle Router / Ad Status
  const handleToggleRouter = async (routerId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "OFFLINE" : "ACTIVE";
    try {
      await toggleWifiCaptiveStatusFn({ data: { routerId, newStatus } });
      const updated = routers.map((r) =>
        r.id === routerId ? { ...r, status: newStatus as any } : r
      );
      updateConfig({ routers: updated });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 text-slate-900 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <Wifi className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                UmarOS Captive Portal Ad Network
              </h2>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 border border-blue-200">
                Wi-Fi Unlock Interstitial
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Equip partner restaurants, cafes, and food courts with UmarOS Wi-Fi Captive Portals.
              Forces every customer connecting to guest Wi-Fi to watch an OrderKing or sponsored B2B ad before granting internet access.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleTestHandshake}
            disabled={isTesting}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? "animate-spin" : ""}`} />
            {isTesting ? "Testing Gateway..." : "Test Captive Gateway"}
          </button>

          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-xs"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {isSaving ? "Persisting Config..." : "Save Portal Settings"}
            </button>
          )}
        </div>
      </div>

      {/* Diagnostic Alert */}
      {diagnosticResult && (
        <div
          className={`flex items-start gap-3 rounded-lg border p-4 text-xs ${
            diagnosticResult.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {diagnosticResult.ok ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          )}
          <div className="flex-1">
            <div className="font-semibold">
              {diagnosticResult.ok ? "UmarOS Captive RADIUS Operational" : "Gateway Error"}
            </div>
            <p className="mt-0.5 text-slate-700">{diagnosticResult.message}</p>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Audited at: {diagnosticResult.timestamp}
            </span>
          </div>
        </div>
      )}

      {/* Real Aggregate Metrics Cards (Zero fake data - starts at 0) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Connected Routers</span>
            <Router className="h-4 w-4 text-slate-700" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {metrics.activeRouters}
            </span>
            <span className="text-xs text-slate-500">Live APs</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Partner restaurant & food court access points
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Wi-Fi Unlocks</span>
            <Unlock className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {metrics.totalUnlocks.toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-slate-500">Logins</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Forced ad exposures before internet release
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Impression Rate</span>
            <Sliders className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-700">
              ₹{metrics.costPerImp.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-emerald-600">/ unlock</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Effective CPM: ₹{(metrics.costPerImp * 1000).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total B2B Ad Revenue</span>
            <DollarSign className="h-4 w-4 text-slate-700" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              ₹{metrics.totalRevenue.toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-slate-500">Collected</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Pre-paid external brand campaign bookings
          </p>
        </div>
      </div>

      {/* SECTION 1: MANDATORY ROUTER MANAGEMENT & ATTACHMENT */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-slate-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Attach Partner Location Router to Captive Network
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            Gateway: <code className="text-slate-800 font-mono">{config.gatewayDomain}</code>
          </span>
        </div>

        <form onSubmit={handleRegisterRouter} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* MANDATORY INPUT 1: Partner Location Name */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-800">
              Partner Location Name *
            </label>
            <input
              type="text"
              required
              value={partnerLocationName}
              onChange={(e) => setPartnerLocationName(e.target.value)}
              placeholder="e.g. Blue Door Cafe (Khan Market)"
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* MANDATORY INPUT 2: Router MAC Address */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-800">
              Router MAC Address *
            </label>
            <input
              type="text"
              required
              value={routerMacAddress}
              onChange={(e) => setRouterMacAddress(e.target.value)}
              placeholder="A4:91:B1:2F:33:40"
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 font-mono text-slate-900 uppercase focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* MANDATORY INPUT 3: Portal Template Selector */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-800">
              Portal Template *
            </label>
            <select
              value={portalTemplate}
              onChange={(e) => setPortalTemplate(e.target.value as any)}
              className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="orderking_voucher_splash">OrderKing Sovereign Voucher Splash</option>
              <option value="interstitial_video_unlock">Interstitial Video Ad Unlock</option>
              <option value="quick_survey_perk">Quick 1-Question Survey Perk</option>
              <option value="minimal_fast_connect">Minimal Fast Connect Splash</option>
            </select>
          </div>

          {/* Submit Button */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isRegisteringRouter}
              className="w-full h-9 flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700 transition-colors shadow-2xs disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              {isRegisteringRouter ? "Deploying..." : "Deploy Router Gateway"}
            </button>
          </div>
        </form>

        {routerRegistrationNotice && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-emerald-800 text-xs font-medium">
            {routerRegistrationNotice}
          </div>
        )}

        {/* Routers Ledger Table (Starts empty - Zero fake data) */}
        <div className="pt-2">
          <div className="text-[11px] font-semibold text-slate-500 mb-2">
            Active Hardware Fleet ({routers.length})
          </div>

          {routers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center bg-white text-xs text-slate-500">
              No routers registered yet. Enter Partner Location Name and Router MAC Address above to deploy.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                  <tr>
                    <th className="p-2.5">Partner Location</th>
                    <th className="p-2.5">Router MAC</th>
                    <th className="p-2.5">Template</th>
                    <th className="p-2.5">Unlocks Today</th>
                    <th className="p-2.5">Total Unlocks</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {routers.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="p-2.5 font-semibold text-slate-900">{r.locationName}</td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-600">{r.routerMacAddress}</td>
                      <td className="p-2.5 text-[11px] text-slate-600">{r.portalTemplate}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{r.todayUnlocks}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{r.totalUnlocks}</td>
                      <td className="p-2.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            r.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleRouter(r.id, r.status)}
                          className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                        >
                          {r.status === "ACTIVE" ? "Disconnect" : "Connect"}
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

      {/* SECTION 2: B2B AD RESELLING & PRICING SLIDERS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Reselling Dashboard & Pricing Slider */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-blue-600" />
                B2B Ad Reselling: Charge per Wi-Fi Unlock Impression
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload external brand ads and charge businesses for every user who connects to venue Wi-Fi.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAdModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              Upload External Brand Ad
            </button>
          </div>

          {/* Pricing Slider */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900">
                  Cost Per Unlock Screen Impression (₹)
                </span>
                <p className="text-[11px] text-slate-500">
                  Rate billed to sponsors per verified Wi-Fi captive splash screen load.
                </p>
              </div>
              <div className="rounded-lg bg-white border border-slate-300 px-3 py-1.5 text-right shadow-2xs">
                <div className="text-[10px] font-semibold text-blue-600 uppercase">Rate</div>
                <div className="text-base font-extrabold text-slate-900">
                  ₹{config.costPerImpressionInr.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-slate-500">/ impression</span>
                </div>
              </div>
            </div>

            <input
              type="range"
              min="0.5"
              max="10.0"
              step="0.25"
              value={config.costPerImpressionInr}
              onChange={(e) =>
                updateConfig({
                  costPerImpressionInr: Number(e.target.value),
                  retailCpmInr: Number(e.target.value) * 1000,
                })
              }
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            <div className="flex justify-between text-[11px] text-slate-500">
              <span>₹0.50/unlock (₹500 CPM)</span>
              <span className="font-semibold text-slate-800">
                Effective Retail CPM: ₹{(config.costPerImpressionInr * 1000).toLocaleString("en-IN")}
              </span>
              <span>₹10.00/unlock (₹10,000 CPM)</span>
            </div>
          </div>

          {/* Mandatory Ad Duration Slider */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900">
                  Mandatory Ad Exposure Duration
                </span>
                <p className="text-[11px] text-slate-500">
                  Seconds user must view the OrderKing sponsor ad before internet unlocks.
                </p>
              </div>
              <span className="rounded bg-white px-2.5 py-1 font-bold text-slate-900 border border-slate-300 shadow-2xs">
                {config.mandatoryAdDurationSeconds || 5} Seconds
              </span>
            </div>

            <input
              type="range"
              min="3"
              max="15"
              step="1"
              value={config.mandatoryAdDurationSeconds || 5}
              onChange={(e) =>
                updateConfig({
                  mandatoryAdDurationSeconds: Number(e.target.value),
                })
              }
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Campaigns Ledger (Starts at 0 - Zero fake data) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>External Brand Ad Campaigns ({brandCampaigns.length})</span>
              {brandCampaigns.length === 0 && (
                <span className="text-[11px] text-slate-400 italic">
                  Zero fake data — all metrics start at 0
                </span>
              )}
            </div>

            {brandCampaigns.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center bg-slate-50/50 text-xs text-slate-500">
                No external brand campaigns uploaded yet. Click "Upload External Brand Ad" to book your first client.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                    <tr>
                      <th className="p-2.5">Brand</th>
                      <th className="p-2.5">Headline</th>
                      <th className="p-2.5">Budget</th>
                      <th className="p-2.5">Impressions</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {brandCampaigns.map((c) => (
                      <tr key={c.id}>
                        <td className="p-2.5 font-bold text-slate-900">{c.brandName}</td>
                        <td className="p-2.5 text-slate-700">{c.headline}</td>
                        <td className="p-2.5 font-semibold text-slate-900">
                          ₹{c.budgetInr.toLocaleString("en-IN")}
                        </td>
                        <td className="p-2.5">
                          {c.impressionsDelivered} / {c.targetImpressions}
                        </td>
                        <td className="p-2.5">
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Live Phone Captive Portal Unlock Simulator */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 flex flex-col items-center justify-between space-y-4">
          <div className="w-full flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Smartphone className="h-4 w-4 text-blue-600" />
              Live Phone Portal Preview
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-semibold">
              Live Simulatedup
            </span>
          </div>

          {/* Smartphone Frame */}
          <div className="w-64 rounded-3xl border-4 border-slate-800 bg-white shadow-lg overflow-hidden flex flex-col">
            {/* Status Bar */}
            <div className="bg-slate-900 text-white text-[10px] px-3 py-1 flex items-center justify-between">
              <span>12:45</span>
              <div className="flex items-center gap-1">
                <Wifi className="h-3 w-3 text-emerald-400" />
                <span>Guest Wi-Fi</span>
              </div>
            </div>

            {/* Portal Content */}
            <div className="p-4 space-y-3 text-center flex-1 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-semibold text-blue-700 border border-blue-200 mb-1">
                  <Lock className="h-2.5 w-2.5" />
                  Internet Locked
                </div>
                <h4 className="text-xs font-extrabold text-slate-900">
                  Welcome to {partnerLocationName || "Partner Dining Wi-Fi"}
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Watch this sponsor message to unlock 100 Mbps free internet.
                </p>
              </div>

              {/* Sponsor Creative Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden text-left shadow-2xs">
                <div className="h-24 bg-cover bg-center" style={{ backgroundImage: `url(${creativeUrl})` }} />
                <div className="p-2.5">
                  <span className="text-[8px] uppercase font-bold text-blue-600 tracking-wider">
                    Sponsored • OrderKing Partner
                  </span>
                  <div className="text-[11px] font-bold text-slate-900 leading-tight mt-0.5">
                    {adHeadline || "Get ₹150 Instant Cash • Order Direct via OrderKing"}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    0% commissions. Authentic restaurant prices.
                  </div>
                </div>
              </div>

              {/* Unlock Action Button with Countdown */}
              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setPreviewUnlocked(true)}
                  className="w-full rounded-lg bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs"
                >
                  {previewUnlocked ? "Connected to Internet ✓" : "Claim Offer & Unlock Wi-Fi"}
                </button>
                <div className="text-[9px] text-slate-400">
                  Powered by UmarOS Sovereign Radius Engine
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 text-center max-w-xs">
            Every customer connecting to partner Wi-Fi is redirected to this screen before internet access is authorized.
          </div>
        </div>
      </div>

      {/* MODAL: Upload External Brand Ad */}
      {showAdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-xl border border-slate-300 bg-white p-6 shadow-xl space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-blue-600" />
                <h4 className="text-base font-bold text-slate-900">
                  Upload External Brand Ad
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAdModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookBrandAd} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Brand / Sponsor Name *
                </label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. CRED / Boat Lifestyle / Local Boutique"
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ad Headline *
                </label>
                <input
                  type="text"
                  required
                  value={adHeadline}
                  onChange={(e) => setAdHeadline(e.target.value)}
                  placeholder="e.g. 50% Off First Delivery on OrderKing"
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Destination URL *
                </label>
                <input
                  type="text"
                  required
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://orderking.delivery/promo/wifi-special"
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-slate-900 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Banner Creative Image URL
                </label>
                <input
                  type="text"
                  value={creativeUrl}
                  onChange={(e) => setCreativeUrl(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-slate-900 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Campaign Budget (₹) *
                </label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={adBudget}
                  onChange={(e) => setAdBudget(Number(e.target.value))}
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span>Price Per Unlock Screen:</span>
                  <span className="font-semibold text-slate-900">₹{config.costPerImpressionInr.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                  <span>Guaranteed Wi-Fi Unlocks:</span>
                  <span className="text-blue-600">
                    {Math.floor(adBudget / config.costPerImpressionInr).toLocaleString("en-IN")} Unlocks
                  </span>
                </div>
              </div>

              {adBookingNotice && (
                <div className="rounded-lg bg-slate-100 p-2.5 text-slate-800 font-medium">
                  {adBookingNotice}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAdModal(false)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBookingAd}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isBookingAd ? "Booking..." : "Book Ad & Schedule Injections"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
