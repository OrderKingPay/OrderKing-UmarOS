import { useState, useEffect, useMemo } from "react";
import {
  type GeospatialAdExchangeConnector,
  DEFAULT_PLUGIN_CONNECTORS,
  type EcosystemCmsConfig,
  DEFAULT_ECOSYSTEM_CMS,
} from "@/lib/orderking/cms-connectors";
import {
  loadPluginConnectorsFn,
  savePluginConnectorsFn,
  testPluginConnectorFn,
  dispatchCarpetBombingCampaignFn,
} from "@/lib/orderking/actions";
import {
  Radio,
  Target,
  Zap,
  MapPin,
  Shield,
  Layers,
  DollarSign,
  TrendingUp,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  Eye,
  EyeOff,
  Crosshair,
  Wifi,
  Sparkles,
  PhoneCall,
  Sliders,
  Play,
  Share2,
  Flame,
  Award,
  Globe,
  Lock,
} from "lucide-react";

interface GeospatialAdHubProps {
  config?: GeospatialAdExchangeConnector;
  onUpdate?: (updates: Partial<GeospatialAdExchangeConnector>) => void;
  cmsConfig?: EcosystemCmsConfig;
  onSave?: () => void;
  isSaving?: boolean;
}

const METRO_PRESETS = [
  {
    name: "Connaught Place, New Delhi",
    lat: 28.6315,
    lng: 77.2167,
    circle: "DELHI_NCR",
    description: "High-density retail, corporate & dining hub (Central Delhi)",
  },
  {
    name: "Koramangala, Bengaluru",
    lat: 12.9352,
    lng: 77.6245,
    circle: "KARNATAKA",
    description: "Startup founders, high disposable income tech workers",
  },
  {
    name: "Bandra Kurla Complex (BKC), Mumbai",
    lat: 19.0657,
    lng: 72.8687,
    circle: "MUMBAI",
    description: "Financial headquarters & premium culinary catchment",
  },
  {
    name: "HITEC City / Cyberabad, Hyderabad",
    lat: 17.4435,
    lng: 78.3772,
    circle: "ANDHRA_PRADESH",
    description: "IT corridor, young tech demographics & late-night ordering",
  },
  {
    name: "Park Street, Kolkata",
    lat: 22.551,
    lng: 88.3533,
    circle: "KOLKATA",
    description: "Historic commercial dining & nightlife strip",
  },
  {
    name: "CyberHub, Gurugram",
    lat: 28.495,
    lng: 77.0895,
    circle: "DELHI_NCR",
    description: "Fortune 500 corporate campus & luxury restaurant belt",
  },
];

export function GeospatialAdHub(props: GeospatialAdHubProps) {
  // If parent didn't provide state, manage local copy
  const [internalConfig, setInternalConfig] = useState<GeospatialAdExchangeConnector>(
    props.config || DEFAULT_PLUGIN_CONNECTORS.geospatialAdExchange
  );
  const [localSaving, setLocalSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; timestamp: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Live Campaign Trigger parameters
  const activeConfig = props.config || internalConfig;
  const updateConfig = (patch: Partial<GeospatialAdExchangeConnector>) => {
    if (props.onUpdate) {
      props.onUpdate(patch);
    } else {
      setInternalConfig((prev) => ({ ...prev, ...patch }));
    }
  };

  const [campaignLat, setCampaignLat] = useState<number>(activeConfig.targetLat || 28.6315);
  const [campaignLng, setCampaignLng] = useState<number>(activeConfig.targetLng || 77.2167);
  const [campaignRadiusKm, setCampaignRadiusKm] = useState<number>(activeConfig.defaultRadiusKm || 5.0);
  const [giftIncentiveInr, setGiftIncentiveInr] = useState<number>(activeConfig.firstOrderGiftIncentiveInr || 150.0);
  const [campaignHeadline, setCampaignHeadline] = useState<string>(
    activeConfig.campaignHeadline || "₹150 Fresh Food Credit Just Landed on Your Smartphone!"
  );
  const [campaignBody, setCampaignBody] = useState<string>(
    activeConfig.campaignBody ||
      "OrderKing direct from local master kitchens with 0% markup. Pre-loaded welcome dining balance activated."
  );
  const [campaignDeepLink, setCampaignDeepLink] = useState<string>(
    activeConfig.ctaDeepLink || "orderking://order?gift=150&ref=carpet_bombing"
  );
  const [selectedChannels, setSelectedChannels] = useState({
    jioAds: true,
    airtelXstream: true,
    inmobiDsp: true,
  });

  // Monetization / Ad Network Placement state
  const [advertiserMode, setAdvertiserMode] = useState<"sovereign" | "commercial">(
    activeConfig.thirdPartyAdvertiserMonetization ? "commercial" : "sovereign"
  );
  const [whitelistedAdvertiser, setWhitelistedAdvertiser] = useState<string>("OrderKing Sovereign Network");
  const [clientRetailCpmRateInr, setClientRetailCpmRateInr] = useState<number>(
    activeConfig.thirdPartyRetailCpmRateInr || 110.0
  );

  // Dispatch state & execution logs
  const [isDispatching, setIsDispatching] = useState(false);
  const [lastDispatchedCampaign, setLastDispatchedCampaign] = useState<any | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Synchronize initial values if activeConfig updates
  useEffect(() => {
    if (activeConfig.targetLat) setCampaignLat(activeConfig.targetLat);
    if (activeConfig.targetLng) setCampaignLng(activeConfig.targetLng);
    if (activeConfig.defaultRadiusKm) setCampaignRadiusKm(activeConfig.defaultRadiusKm);
    if (activeConfig.firstOrderGiftIncentiveInr) setGiftIncentiveInr(activeConfig.firstOrderGiftIncentiveInr);
  }, [activeConfig.targetLat, activeConfig.targetLng, activeConfig.defaultRadiusKm, activeConfig.firstOrderGiftIncentiveInr]);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleSecret = (field: string) => {
    setVisibleSecrets((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Real-time authentic geospatial mathematics
  const polygonMetrics = useMemo(() => {
    const areaSqKm = Math.PI * Math.pow(campaignRadiusKm, 2);
    // Typical Indian Tier-1 metro urban macro cell density: ~2.4 eNodeB/BTS sites per km²
    const cellTowers = Math.max(3, Math.round(areaSqKm * 2.4));
    // High-intent smartphone density in urban polygon: ~3,800 active connected SIMs / km²
    const totalPotentialSmartphones = Math.round(areaSqKm * 3800);

    let activeMultiplier = 0;
    if (selectedChannels.jioAds) activeMultiplier += 0.42;
    if (selectedChannels.airtelXstream) activeMultiplier += 0.36;
    if (selectedChannels.inmobiDsp) activeMultiplier += 0.22;

    const targetedSmartphones = Math.round(totalPotentialSmartphones * activeMultiplier);
    const scrubbedDnd = Math.round(targetedSmartphones * 0.08);
    const netDeliverable = Math.max(0, targetedSmartphones - scrubbedDnd);

    // Wholesale carrier cost @ ₹45 CPM
    const wholesaleCarrierCostInr = Math.round((netDeliverable / 1000) * 45);
    // Client billed @ retail CPM
    const retailBilledInr = Math.round((netDeliverable / 1000) * clientRetailCpmRateInr);
    const adNetworkMarginInr = retailBilledInr - wholesaleCarrierCostInr;
    const marginPercent = retailBilledInr > 0 ? ((adNetworkMarginInr / retailBilledInr) * 100).toFixed(1) : "0.0";

    // Expected conversion: 9.4% engagement CTR -> 32% of clicks complete orders
    const projectedClicks = Math.round(netDeliverable * 0.094);
    const projectedFirstOrders = Math.round(projectedClicks * 0.32);
    const totalGiftIncentiveReserveInr = projectedFirstOrders * giftIncentiveInr;

    return {
      areaSqKm: Number(areaSqKm.toFixed(2)),
      cellTowers,
      totalPotentialSmartphones,
      netDeliverable,
      scrubbedDnd,
      wholesaleCarrierCostInr,
      retailBilledInr,
      adNetworkMarginInr,
      marginPercent,
      projectedClicks,
      projectedFirstOrders,
      totalGiftIncentiveReserveInr,
    };
  }, [campaignRadiusKm, selectedChannels, clientRetailCpmRateInr, giftIncentiveInr]);

  // Test Connector Handshake
  const handleTestConnection = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);
      const res = await testPluginConnectorFn({
        data: {
          service: "geospatialAdExchange",
          payload: activeConfig,
        },
      });

      const now = new Date().toLocaleTimeString();
      if (res && res.ok) {
        setTestResult({
          ok: true,
          message: res.message || "UmarOS Broad_Reach Ad Exchange handshake verified.",
          timestamp: now,
        });
        updateConfig({ lastTestedAt: now });
      } else {
        setTestResult({
          ok: false,
          message: (res as any)?.error || "Telecom handshake unverified. Please check API credentials.",
          timestamp: now,
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err?.message || "Diagnostic probe failure.",
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Dispatch Broad_Reach Run
  const handleDispatchCampaign = async () => {
    try {
      setIsDispatching(true);
      setDispatchError(null);

      const res = await dispatchCarpetBombingCampaignFn({
        data: {
          targetLat: campaignLat,
          targetLng: campaignLng,
          radiusKm: campaignRadiusKm,
          firstOrderGiftIncentiveInr: giftIncentiveInr,
          headline: campaignHeadline,
          body: campaignBody,
          ctaDeepLink: campaignDeepLink,
          channels: selectedChannels,
          advertiserName: whitelistedAdvertiser,
          retailCpmRateInr: clientRetailCpmRateInr,
        },
      });

      if (res && res.ok) {
        setLastDispatchedCampaign(res);
      } else {
        setDispatchError((res as any)?.error || "Failed to dispatch campaign to telecom carrier rails.");
      }
    } catch (err: any) {
      setDispatchError(err?.message || "Execution exception while triggering carpet-bombing run.");
    } finally {
      setIsDispatching(false);
    }
  };

  // Geolocation trigger
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCampaignLat(Number(pos.coords.latitude.toFixed(6)));
          setCampaignLng(Number(pos.coords.longitude.toFixed(6)));
        },
        () => {
          alert("Unable to access browser GPS location. Using manual input.");
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-card via-card to-primary/5 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Crosshair className="h-6 w-6 animate-pulse text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    UmarOS Broad_Reach Ad Exchange
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Radio className="h-3 w-3 animate-ping" />
                    Telecom &amp; OpenRTB 2.5 DSP Hub
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Forcefully and legally reach every smartphone in a hyper-local geographic radius via JioAds Cell-Tower
                  triangulation, Airtel Xstream Geofences, and InMobi OpenRTB DSP bidding.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              <Cpu className="h-3.5 w-3.5 text-primary" />
              {isTesting ? "Probing Carrier Rails..." : "Verify Telecom Handshake"}
            </button>

            <label className="flex items-center gap-2 cursor-pointer bg-card border border-border rounded-lg px-3 py-2 text-xs font-medium">
              <span>Exchange Active</span>
              <input
                type="checkbox"
                checked={activeConfig.enabled}
                onChange={(e) => updateConfig({ enabled: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </label>
          </div>
        </div>

        {/* Handshake Diagnostic Result Banner */}
        {testResult && (
          <div
            className={`mt-4 flex items-center justify-between rounded-lg border p-3.5 text-xs ${
              testResult.ok
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {testResult.ok ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
              )}
              <span>{testResult.message}</span>
            </div>
            <span className="text-[11px] opacity-70">{testResult.timestamp}</span>
          </div>
        )}
      </div>

      {/* Real-time Polygon Telemetry Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Polygon Surface Area
            </span>
            <Target className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {polygonMetrics.areaSqKm} <span className="text-sm font-normal text-muted-foreground">km²</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Radius: {campaignRadiusKm} km coverage</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Cell Towers Engaged
            </span>
            <Wifi className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {polygonMetrics.cellTowers.toLocaleString("en-IN")}{" "}
            <span className="text-sm font-normal text-muted-foreground">Nodes</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Jio eNodeB + Airtel BTS sectors</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Deliverable Reach
            </span>
            <Radio className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {polygonMetrics.netDeliverable.toLocaleString("en-IN")}{" "}
            <span className="text-sm font-normal text-muted-foreground">Smartphones</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {polygonMetrics.scrubbedDnd.toLocaleString("en-IN")} DND scrubbed out
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Est. First Orders
            </span>
            <Flame className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {polygonMetrics.projectedFirstOrders.toLocaleString("en-IN")}{" "}
            <span className="text-sm font-normal text-muted-foreground">Conversions</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            ₹{polygonMetrics.totalGiftIncentiveReserveInr.toLocaleString("en-IN")} gift pool
          </p>
        </div>
      </div>

      {/* Main Two-Column Grid: Left (Campaign Trigger & Polygon Radar) | Right (Carrier Connectors & Ad Network) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Campaign Trigger (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Campaign Trigger Box */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Play className="h-4 w-4 fill-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Broad_Reach Campaign Trigger</h3>
                  <p className="text-xs text-muted-foreground">
                    Set target coordinates, radius perimeter, and forceful first-order gift incentive.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <MapPin className="h-3 w-3 text-red-500" />
                Current GPS
              </button>
            </div>

            {/* Quick Metro Catchment Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Quick Metro Catchment Presets</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {METRO_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setCampaignLat(preset.lat);
                      setCampaignLng(preset.lng);
                      updateConfig({
                        targetLat: preset.lat,
                        targetLng: preset.lng,
                        targetLocationLabel: preset.name,
                        jioAdsCircle: preset.circle,
                      });
                    }}
                    className={`rounded-lg border p-2 text-left text-xs transition-colors ${
                      campaignLat === preset.lat && campaignLng === preset.lng
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <div className="font-medium truncate">{preset.name.split(",")[0]}</div>
                    <div className="text-[10px] opacity-75 truncate">{preset.name.split(",")[1]}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Coordinates & Radius (km) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center justify-between">
                  <span>Target Latitude</span>
                  <span className="text-[10px] text-muted-foreground">Decimal Deg</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={campaignLat}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value) || 0;
                    setCampaignLat(v);
                    updateConfig({ targetLat: v });
                  }}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center justify-between">
                  <span>Target Longitude</span>
                  <span className="text-[10px] text-muted-foreground">Decimal Deg</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={campaignLng}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value) || 0;
                    setCampaignLng(v);
                    updateConfig({ targetLng: v });
                  }}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center justify-between">
                  <span>Radius (km)</span>
                  <span className="text-[10px] font-semibold text-primary">{campaignRadiusKm} km</span>
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="25.0"
                  step="0.5"
                  value={campaignRadiusKm}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value) || 1.0;
                    setCampaignRadiusKm(v);
                    updateConfig({ defaultRadiusKm: v });
                  }}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Radius Interactive Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>0.5 km (Hyperlocal Micro-Cell)</span>
                <span>5 km (Standard Hub)</span>
                <span>25 km (Metropolitan Wide Sweep)</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="25.0"
                step="0.5"
                value={campaignRadiusKm}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setCampaignRadiusKm(v);
                  updateConfig({ defaultRadiusKm: v });
                }}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            {/* Forceful First-Order Gift Incentive (₹) */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-amber-500" />
                  <label className="text-xs font-semibold text-foreground">
                    First-Order Gift Incentive (₹)
                  </label>
                </div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  ₹{giftIncentiveInr} per conversion
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Crucial psychological trigger: This credit is pre-loaded directly into the customer&apos;s KingPay wallet upon
                first tap, eliminating friction and locking in the first transaction over Swiggy / Zomato.
              </p>

              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 150, 250].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => {
                      setGiftIncentiveInr(amount);
                      updateConfig({ firstOrderGiftIncentiveInr: amount });
                    }}
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      giftIncentiveInr === amount
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-background border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    ₹{amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Programmatic Creative & Deep Link Payload */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Ad Headline (SIM Push / Rich Media)</label>
                <input
                  type="text"
                  value={campaignHeadline}
                  onChange={(e) => {
                    setCampaignHeadline(e.target.value);
                    updateConfig({ campaignHeadline: e.target.value });
                  }}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Offer Copy &amp; Value Proposition</label>
                <textarea
                  rows={2}
                  value={campaignBody}
                  onChange={(e) => {
                    setCampaignBody(e.target.value);
                    updateConfig({ campaignBody: e.target.value });
                  }}
                  className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">CTA Deep Link Destination</label>
                <input
                  type="text"
                  value={campaignDeepLink}
                  onChange={(e) => {
                    setCampaignDeepLink(e.target.value);
                    updateConfig({ ctaDeepLink: e.target.value });
                  }}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Carrier Channel Selection */}
            <div className="space-y-2 border-t border-border pt-4">
              <label className="text-xs font-semibold text-foreground">Target Telecom &amp; DSP Rails</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <label className="flex items-center gap-2 rounded-lg border border-border bg-background p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedChannels.jioAds}
                    onChange={(e) => setSelectedChannels((prev) => ({ ...prev, jioAds: e.target.checked }))}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="font-medium text-foreground block">JioAds LBS</span>
                    <span className="text-[10px] text-muted-foreground">42% 4G/5G share</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 rounded-lg border border-border bg-background p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedChannels.airtelXstream}
                    onChange={(e) => setSelectedChannels((prev) => ({ ...prev, airtelXstream: e.target.checked }))}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="font-medium text-foreground block">Airtel Geofence</span>
                    <span className="text-[10px] text-muted-foreground">36% Airtel share</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 rounded-lg border border-border bg-background p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedChannels.inmobiDsp}
                    onChange={(e) => setSelectedChannels((prev) => ({ ...prev, inmobiDsp: e.target.checked }))}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="font-medium text-foreground block">InMobi OpenRTB</span>
                    <span className="text-[10px] text-muted-foreground">22% app inventory</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleDispatchCampaign}
                disabled={isDispatching}
                className={`w-full flex items-center justify-center gap-2.5 rounded-xl py-3 px-4 text-xs font-bold uppercase tracking-wider shadow-md transition-all ${
                  isDispatching
                    ? "bg-muted text-muted-foreground cursor-wait"
                    : "bg-red-600 hover:bg-red-700 text-white cursor-pointer hover:shadow-lg"
                }`}
              >
                <Crosshair className="h-4 w-4 animate-spin" />
                {isDispatching ? "Broadcasting to Cellular Towers..." : "EXECUTE CARPET-BOMBING RUN"}
              </button>
            </div>

            {dispatchError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{dispatchError}</span>
              </div>
            )}
          </div>

          {/* Last Dispatched Campaign Telemetry Card */}
          {lastDispatchedCampaign && (
            <div className="rounded-xl border border-emerald-500/40 bg-card p-5 shadow-sm space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-bold text-foreground">
                    Active Run Dispatched: {lastDispatchedCampaign.campaignId}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {new Date(lastDispatchedCampaign.executionTimestamp).toLocaleTimeString()}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-lg bg-secondary/40 p-2.5">
                  <div className="text-[10px] text-muted-foreground">Target Reach</div>
                  <div className="text-sm font-bold text-foreground">
                    {lastDispatchedCampaign.telemetry.deliverableImpressions.toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="rounded-lg bg-secondary/40 p-2.5">
                  <div className="text-[10px] text-muted-foreground">Cell Towers</div>
                  <div className="text-sm font-bold text-foreground">
                    {lastDispatchedCampaign.telemetry.cellTowersEngaged} Sectors
                  </div>
                </div>

                <div className="rounded-lg bg-secondary/40 p-2.5">
                  <div className="text-[10px] text-muted-foreground">Wholesale Carrier Cost</div>
                  <div className="text-sm font-bold text-foreground">
                    ₹{lastDispatchedCampaign.telemetry.financials.wholesaleCostInr.toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="rounded-lg bg-secondary/40 p-2.5">
                  <div className="text-[10px] text-muted-foreground">Network Net Spread</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    +₹{lastDispatchedCampaign.telemetry.financials.adNetworkMarginInr.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-muted/40 p-3 text-[11px] space-y-1 text-muted-foreground font-mono">
                <div>
                  &bull; Jio eNodeB Pings:{" "}
                  {lastDispatchedCampaign.telemetry.carrierBreakdown.jioAdsPings.toLocaleString("en-IN")}
                </div>
                <div>
                  &bull; Airtel BTS Geofence Pings:{" "}
                  {lastDispatchedCampaign.telemetry.carrierBreakdown.airtelXstreamPings.toLocaleString("en-IN")}
                </div>
                <div>
                  &bull; InMobi DSP RTB Bids:{" "}
                  {lastDispatchedCampaign.telemetry.carrierBreakdown.inmobiDspImpressions.toLocaleString("en-IN")}
                </div>
                <div>
                  &bull; TRAI DLT Compliance Header: {lastDispatchedCampaign.compliance.traiDltHeader} (Verified)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Carrier API Connectors & Sovereign Ad-Network Monetization (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Ad Network Monetization Switchboard ("Charge Others for Placement") */}
          <div className="rounded-xl border border-primary/30 bg-card p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Ad-Network Placement Monetizer</h3>
                  <p className="text-xs text-muted-foreground">
                    Charge external restaurants &amp; brands to place geofenced campaigns.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-500/20">
                PROFIT MARGIN: {polygonMetrics.marginPercent}%
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">Exchange Operational Mode</span>
                <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/50 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAdvertiserMode("sovereign");
                      updateConfig({ thirdPartyAdvertiserMonetization: false });
                    }}
                    className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      advertiserMode === "sovereign"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Sovereign Only
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdvertiserMode("commercial");
                      updateConfig({ thirdPartyAdvertiserMonetization: true });
                    }}
                    className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      advertiserMode === "commercial"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Public Ad Network
                  </button>
                </div>
              </div>

              {advertiserMode === "commercial" && (
                <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-3.5 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Carrier Wholesale CPM</label>
                      <input
                        type="text"
                        disabled
                        value="₹45.00 / 1K pings"
                        className="w-full h-8 rounded border border-border bg-muted px-2.5 text-xs font-semibold text-muted-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-foreground">Retail Rate Charged (CPM)</label>
                      <input
                        type="number"
                        min="50"
                        max="500"
                        step="5"
                        value={clientRetailCpmRateInr}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value) || 110;
                          setClientRetailCpmRateInr(v);
                          updateConfig({ thirdPartyRetailCpmRateInr: v });
                        }}
                        className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <label className="text-[11px] font-medium text-foreground">Bidding Advertiser Client</label>
                    <select
                      value={whitelistedAdvertiser}
                      onChange={(e) => setWhitelistedAdvertiser(e.target.value)}
                      className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
                    >
                      <option value="OrderKing Sovereign Network">OrderKing Sovereign Network (Internal Growth)</option>
                      <option value="Haldiram's Express Hub">Haldiram&apos;s Express Hub (Sponsored Slot #1)</option>
                      <option value="Bikanervala Cloud Operations">Bikanervala Cloud Operations (Sponsored Slot #2)</option>
                      <option value="Chaayos Direct">Chaayos Direct (Breakfast Slot #3)</option>
                      <option value="External High-Ticket FMCG Advertiser">External High-Ticket FMCG Advertiser</option>
                    </select>
                  </div>

                  <div className="rounded bg-background p-2.5 text-[11px] space-y-1 border border-border">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Gross Advertiser Billing:</span>
                      <span className="font-semibold text-foreground">
                        ₹{polygonMetrics.retailBilledInr.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Wholesale Carrier Cost:</span>
                      <span className="font-semibold text-foreground">
                        ₹{polygonMetrics.wholesaleCarrierCostInr.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-1 font-bold text-emerald-600 dark:text-emerald-400">
                      <span>Founder Net Yield (Profit):</span>
                      <span>+₹{polygonMetrics.adNetworkMarginInr.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 1. JioAds Cell-Tower Targeting Connector */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <h4 className="text-xs font-semibold text-foreground">JioAds Cell-Tower Targeting</h4>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">eNodeB LBS V4</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">JioAds Client ID</label>
                <input
                  type="text"
                  value={activeConfig.jioAdsClientId}
                  onChange={(e) => updateConfig({ jioAdsClientId: e.target.value })}
                  placeholder="jio_lbs_live_sec_..."
                  className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground flex items-center justify-between">
                  <span>JioAds Client Secret</span>
                  <button
                    type="button"
                    onClick={() => toggleSecret("jioSecret")}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    {visibleSecrets["jioSecret"] ? "Mask" : "Reveal"}
                  </button>
                </label>
                <input
                  type={visibleSecrets["jioSecret"] ? "text" : "password"}
                  value={activeConfig.jioAdsClientSecret}
                  onChange={(e) => updateConfig({ jioAdsClientSecret: e.target.value })}
                  placeholder="••••••••••••••••••••••••"
                  className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Telecom Circle</label>
                  <select
                    value={activeConfig.jioAdsCircle}
                    onChange={(e) => updateConfig({ jioAdsCircle: e.target.value })}
                    className="w-full h-8 rounded border border-border bg-background px-2 text-xs text-foreground focus:ring-1 focus:ring-primary"
                  >
                    <option value="DELHI_NCR">Delhi NCR</option>
                    <option value="MUMBAI">Mumbai</option>
                    <option value="KARNATAKA">Karnataka</option>
                    <option value="MAHARASHTRA">Maharashtra</option>
                    <option value="ANDHRA_PRADESH">Andhra &amp; Tel.</option>
                    <option value="KOLKATA">Kolkata</option>
                    <option value="ALL_INDIA">All-India Roaming</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Cell ID Range</label>
                  <input
                    type="text"
                    value={activeConfig.jioAdsEnodebCellRange}
                    onChange={(e) => updateConfig({ jioAdsEnodebCellRange: e.target.value })}
                    placeholder="404-850-ENB-*"
                    className="w-full h-8 rounded border border-border bg-background px-2 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Airtel Xstream Geofence Connector */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <h4 className="text-xs font-semibold text-foreground">Airtel Xstream Geofence</h4>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">Airtel IQ Gateway</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">Airtel IQ Partner ID</label>
                <input
                  type="text"
                  value={activeConfig.airtelPartnerId}
                  onChange={(e) => updateConfig({ airtelPartnerId: e.target.value })}
                  placeholder="airtel_iq_ptnr_994..."
                  className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground flex items-center justify-between">
                  <span>Xstream Auth Token</span>
                  <button
                    type="button"
                    onClick={() => toggleSecret("airtelToken")}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    {visibleSecrets["airtelToken"] ? "Mask" : "Reveal"}
                  </button>
                </label>
                <input
                  type={visibleSecrets["airtelToken"] ? "text" : "password"}
                  value={activeConfig.airtelXstreamToken}
                  onChange={(e) => updateConfig({ airtelXstreamToken: e.target.value })}
                  placeholder="••••••••••••••••••••••••"
                  className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Precision Mode</label>
                  <select
                    value={activeConfig.airtelPrecisionMode}
                    onChange={(e: any) => updateConfig({ airtelPrecisionMode: e.target.value })}
                    className="w-full h-8 rounded border border-border bg-background px-2 text-xs text-foreground focus:ring-1 focus:ring-primary"
                  >
                    <option value="tower_triangulation">Tower Triangulation</option>
                    <option value="gps_assisted">GPS Assisted LBS</option>
                    <option value="hybrid">Hybrid Carrier Mesh</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Polygon Boundary ID</label>
                  <input
                    type="text"
                    value={activeConfig.airtelPolygonBoundaryId}
                    onChange={(e) => updateConfig({ airtelPolygonBoundaryId: e.target.value })}
                    placeholder="GEOFENCE_POLY_001"
                    className="w-full h-8 rounded border border-border bg-background px-2 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. InMobi DSP Connector */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                <h4 className="text-xs font-semibold text-foreground">InMobi DSP (OpenRTB 2.5)</h4>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">Exchange Rail</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">Exchange Account ID</label>
                <input
                  type="text"
                  value={activeConfig.inmobiAccountId}
                  onChange={(e) => updateConfig({ inmobiAccountId: e.target.value })}
                  placeholder="inmobi_acc_884920..."
                  className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground flex items-center justify-between">
                  <span>DSP API Secret</span>
                  <button
                    type="button"
                    onClick={() => toggleSecret("inmobiSecret")}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    {visibleSecrets["inmobiSecret"] ? "Mask" : "Reveal"}
                  </button>
                </label>
                <input
                  type={visibleSecrets["inmobiSecret"] ? "text" : "password"}
                  value={activeConfig.inmobiDspSecret}
                  onChange={(e) => updateConfig({ inmobiDspSecret: e.target.value })}
                  placeholder="••••••••••••••••••••••••"
                  className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Seat ID</label>
                  <input
                    type="text"
                    value={activeConfig.inmobiSeatId}
                    onChange={(e) => updateConfig({ inmobiSeatId: e.target.value })}
                    placeholder="SEAT_ORDERKING"
                    className="w-full h-8 rounded border border-border bg-background px-2 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">Bid Floor CPM (₹)</label>
                  <input
                    type="number"
                    value={activeConfig.inmobiBidFloorCpmInr}
                    onChange={(e) => updateConfig({ inmobiBidFloorCpmInr: parseFloat(e.target.value) || 45.0 })}
                    placeholder="45.0"
                    className="w-full h-8 rounded border border-border bg-background px-2 text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Legal / Regulatory Compliance Assurance (TRAI TCCCPR 2018) */}
          <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Shield className="h-4 w-4 text-emerald-500" />
              <span>TRAI TCCCPR 2018 &amp; DND Regulatory Assurance</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Every cellular broadcast is cryptographically bound to OrderKing&apos;s Principal Entity DLT ID (
              <span className="font-mono text-foreground">{activeConfig.traiDltPrincipalEntityId}</span>) and scrubbed
              in real time against the National Do-Not-Call registry. Fully compliant with Section 4 of the Indian
              Telegraph Act.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
