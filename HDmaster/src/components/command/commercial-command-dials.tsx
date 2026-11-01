import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Sliders,
  Gauge,
  Zap,
  CloudRain,
  Moon,
  Sun,
  AlertCircle,
  CheckCircle2,
  XCircle,
  DollarSign,
  TrendingUp,
  Sparkles,
  Clock,
  ArrowRight,
  ShieldCheck,
  Scale,
  Building2,
  Megaphone,
  Award,
  FileText,
  RefreshCw,
  Search,
  Check,
  Percent,
  Layers,
  ChevronRight,
  Info,
  Calendar,
  Lock,
  Plane,
  Globe,
  MapPin,
  ShieldAlert,
  Plus,
  Trash2,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn, formatInr, formatInrExact, formatNumber, formatPct } from "@/lib/utils";
import {
  loadCommercialDialsFn,
  updatePlatformFeeFn,
  loadOutletCommissionsFn,
  updateOutletCommissionFn,
  updateSurgeDialsFn,
  loadPenaltyDisputesFn,
  resolvePenaltyDisputeFn,
  loadWeeklyWednesdayPayoutBatchFn,
  releaseWeeklyWednesdayPayoutsFn,
  loadFeaturedAdStudioFn,
  updateFeaturedAdBidFn,
  loadTravelPartnerGovernanceFn,
  updateTravelPartnerGovernanceFn,
  syncTboCredentialsAndTokenFn,
  loadCustomerSupportDisputesFn,
  resolveCustomerDisputeRefundFn,
  loadGeofencingThreatDialsFn,
  updateGeofencingThreatDialsFn,
  addThreatZoneExclusionFn,
  removeThreatZoneExclusionFn,
  toggleThreatZoneActiveFn,
  loadCommercialBypassDialsFn,
  updateCommercialBypassDialsFn,
  triggerSoundboxTestAlertFn,
} from "@/lib/orderking/actions";
import type {
  CommercialDialsState,
  OutletCommissionItem,
  SurgeDialsState,
  PenaltyDisputeItem,
  PenaltyDisputeSummary,
  WeeklyWednesdayPayoutBatch,
  MerchantPayoutManifestItem,
  FeaturedAdCampaignItem,
  AdAuctionStudioState,
  TravelPartnerGovernanceState,
  GeofencingThreatDialsState,
  CustomerDisputeItem,
  CustomerDisputeSummary,
  CommercialBypassDialsState,
} from "@/lib/orderking/server/commercial-dials.server";
import type { ThreatZonePolygon } from "@/lib/orderking/types";
import { CommercialBypassDialsSection } from "./commercial-bypass-dials-section";

export type DialTabKey =
  | "platform_fee"
  | "commissions"
  | "surge"
  | "penalties"
  | "wednesday_payout"
  | "ad_auction"
  | "travel_governance"
  | "geofencing_threat"
  | "disputes"
  | "bypass_dials";

export function CommercialCommandDials() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<DialTabKey>("platform_fee");

  // Load master dials summary
  const dialsQ = useQuery({
    queryKey: ["commercial-dials"],
    queryFn: () => loadCommercialDialsFn(),
  });

  const dials: CommercialDialsState | null =
    dialsQ.data && dialsQ.data.ok ? dialsQ.data.data : null;

  return (
    <div className="w-full space-y-6 rounded-2xl border-2 border-amber-500/30 bg-[#060908] p-4 sm:p-6 text-slate-100 shadow-[0_0_50px_rgba(245,158,11,0.08)]">
      {/* 1. Header Banner: UmarOS Sovereign Commercial Command Dials */}
      <div className="flex flex-col gap-4 border-b border-border/80 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]">
              <Sliders className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
                  UMAR OS COMMERCIAL COMMAND DIALS
                </h1>
                <Badge className="border-amber-500/40 bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                  LIVE OP-DECK
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Founder Operational Levers • Section 9(5) CGST Compliant • 100% SafeInteger Paise Engine
              </p>
            </div>
          </div>
        </div>

        {/* Quick KPI Radar Pills */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-3 py-1.5 text-emerald-300 shadow-sm">
            <span className="text-[10px] text-muted block uppercase">Platform Fee</span>
            <span className="font-bold">
              ₹{dials ? dials.platformFeeInr.toFixed(2) : "7.50"} / order
            </span>
          </div>

          <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/40 px-3 py-1.5 text-cyan-300 shadow-sm">
            <span className="text-[10px] text-muted block uppercase">Fleet Commission</span>
            <span className="font-bold">
              {dials ? (dials.avgCommissionBps / 100).toFixed(1) : "22.0"}% Avg
            </span>
          </div>

          <div
            className={cn(
              "rounded-xl border px-3 py-1.5 shadow-sm transition-all",
              dials?.rainSurgeActive
                ? "border-amber-500/60 bg-amber-950/50 text-amber-300 animate-pulse"
                : "border-border/60 bg-black/40 text-slate-300",
            )}
          >
            <span className="text-[10px] text-muted block uppercase">Surge Radar</span>
            <span className="font-bold flex items-center gap-1">
              {dials?.rainSurgeActive ? "RAIN SURGE ON" : `${dials?.demandSurgeMultiplier ?? 1.0}x Normal`}
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void qc.invalidateQueries({ queryKey: ["commercial-dials"] });
              toast.success("Operational dials refreshed from PostgreSQL");
            }}
            className="border-border/60 bg-surface-2/80 text-xs text-slate-300 hover:text-white"
          >
            <RefreshCw className="mr-1.5 size-3.5" />
            Sync
          </Button>
        </div>
      </div>

      {/* 2. Navigation Tabs for the 7 Master Operational Dials */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8">
        {[
          {
            id: "platform_fee" as DialTabKey,
            label: "1. Platform Fee Dial",
            subtitle: "₹0 to ₹25 Slider",
            icon: DollarSign,
            color: "amber",
          },
          {
            id: "commissions" as DialTabKey,
            label: "2. Commission Overrides",
            subtitle: "0% to 35% Outlets",
            icon: Percent,
            color: "emerald",
          },
          {
            id: "surge" as DialTabKey,
            label: "3. Surge Controls",
            subtitle: "Rain, Multipliers, Night",
            icon: CloudRain,
            color: "cyan",
          },
          {
            id: "penalties" as DialTabKey,
            label: "4. Penalty Dispute Desk",
            subtitle: "Late Prep & Cancel",
            icon: Scale,
            color: "rose",
          },
          {
            id: "wednesday_payout" as DialTabKey,
            label: "5. T+1 Daily Payout (Auto)",
            subtitle: "1-Tap / Autonomous Release",
            icon: Building2,
            color: "yellow",
          },
          {
            id: "ad_auction" as DialTabKey,
            label: "6. Ad Auction Studio",
            subtitle: "Top-of-Feed GSP CPC",
            icon: Megaphone,
            color: "purple",
          },
          {
            id: "travel_governance" as DialTabKey,
            label: "7. Travel Governance",
            subtitle: "Travelpayouts, OTAs, Dynamic Net Rates",
            icon: Globe,
            color: "sky",
          },
          {
            id: "disputes" as DialTabKey,
            label: "8. Dispute & Refund Desk",
            subtitle: "1-Tap Customer Refunds",
            icon: Scale,
            color: "rose",
          },
          {
            id: "geofencing_threat" as DialTabKey,
            label: "9. Threat Geofencing",
            subtitle: "H3 Curfews & Exclusions",
            icon: ShieldAlert,
            color: "red",
          },
          {
            id: "bypass_dials" as DialTabKey,
            label: "10. Commercial Bypass Dials",
            subtitle: "9 Sovereign Dials: VPA, Tax, OTA, Telemetry",
            icon: SlidersHorizontal,
            color: "amber",
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "group relative flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
                isSelected
                  ? "border-amber-500/80 bg-gradient-to-b from-amber-500/20 to-black/80 shadow-[0_0_20px_rgba(245,158,11,0.2)] text-white"
                  : "border-border/60 bg-black/40 hover:border-amber-500/40 hover:bg-black/60 text-slate-300",
              )}
            >
              <div className="flex w-full items-center justify-between">
                <Icon
                  className={cn(
                    "size-4 transition-transform group-hover:scale-110",
                    isSelected ? "text-amber-400" : "text-muted",
                  )}
                />
                {isSelected && (
                  <span className="size-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                )}
              </div>
              <span className="text-xs font-bold leading-tight mt-1">{tab.label}</span>
              <span className="text-[10px] text-muted block leading-none font-mono">
                {tab.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Body Views */}
      <div className="pt-2">
        {activeTab === "platform_fee" && (
          <PlatformFeeDialSection
            dials={dials}
            onSaved={() => {
              void qc.invalidateQueries({ queryKey: ["commercial-dials"] });
            }}
          />
        )}

        {activeTab === "commissions" && <CommissionOverridesSection />}

        {activeTab === "surge" && (
          <SurgeControlsSection
            dials={dials}
            onSaved={() => {
              void qc.invalidateQueries({ queryKey: ["commercial-dials"] });
            }}
          />
        )}

        {activeTab === "penalties" && <PenaltyDisputeDeskSection />}

        {activeTab === "wednesday_payout" && <WednesdayPayoutReleaseSection />}

        {activeTab === "ad_auction" && <FeaturedAdAuctionStudioSection />}
        {activeTab === "travel_governance" && <TravelPartnerGovernanceSection />}
        {activeTab === "geofencing_threat" && <GeofencingThreatDialsSection />}
        {activeTab === "disputes" && <CustomerSupportDisputeQueueSection />}
        {activeTab === "bypass_dials" && <CommercialBypassDialsSection />}
      </div>
    </div>
  );
}

// ==========================================================================
// 1. PLATFORM FEE DIAL (₹0 to ₹25 Real-Time Slider)
// ==========================================================================

function PlatformFeeDialSection({
  dials,
  onSaved,
}: {
  dials: CommercialDialsState | null;
  onSaved: () => void;
}) {
  const [feeInr, setFeeInr] = useState<number>(() => dials?.platformFeeInr ?? 7.5);
  const [isSaving, setIsSaving] = useState(false);

  const feePaise = Math.round(feeInr * 100);
  const dailyOrders = dials?.estimatedDailyOrders ?? 850;
  const monthlyRevenueInr = Math.round((dailyOrders * 30 * feePaise) / 100);
  const annualRunRateInr = Math.round((dailyOrders * 365 * feePaise) / 100);

  const presets = [
    { label: "₹0 (Growth / Flash Free)", val: 0 },
    { label: "₹3.00 (Minimal)", val: 3.0 },
    { label: "₹5.00 (Standard)", val: 5.0 },
    { label: "₹7.50 (Default)", val: 7.5 },
    { label: "₹10.00 (Tier-1 Standard)", val: 10.0 },
    { label: "₹15.00 (Peak Margin)", val: 15.0 },
    { label: "₹25.00 (Max Cap)", val: 25.0 },
  ];

  const handleApplyFee = async (newVal: number) => {
    setFeeInr(newVal);
    setIsSaving(true);
    try {
      const res = await updatePlatformFeeFn({
        data: {
          feePaise: Math.round(newVal * 100),
          reason: `Founder live dial: set platform fee to ₹${newVal.toFixed(2)}`,
        },
      });
      if (res && res.ok) {
        toast.success(`Platform Fee Persisted: ₹${newVal.toFixed(2)} (${res.feePaise} paise)`);
        onSaved();
      } else {
        toast.error((res as any)?.error || "Failed to update platform fee");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update platform fee");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 rounded-xl border border-amber-500/40 bg-black/60 p-5 sm:p-6 shadow-xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <DollarSign className="size-5 text-amber-400" />
            Platform Fee Dial (₹0 to ₹25)
          </h2>
          <p className="text-xs text-muted">
            Live real-time operational dial directly governing customer checkout convenience fees across all orders.
          </p>
        </div>
        <Badge className="bg-amber-500/20 text-amber-300 font-mono text-xs w-fit">
          Live Fee: ₹{feeInr.toFixed(2)} / {feePaise} paise
        </Badge>
      </div>

      {/* Dial Interactive Slider Control */}
      <div className="grid gap-8 lg:grid-cols-12 items-center">
        <div className="space-y-6 lg:col-span-7">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-300">Adjust Platform Fee Slider</span>
              <span className="font-mono text-xl font-black text-amber-400 bg-amber-950/60 border border-amber-500/40 px-3 py-1 rounded-lg shadow-inner">
                ₹{feeInr.toFixed(2)}
              </span>
            </div>

            <div className="relative py-2">
              <input
                type="range"
                min="0"
                max="25"
                step="0.5"
                value={feeInr}
                disabled={isSaving}
                onChange={(e) => setFeeInr(parseFloat(e.target.value))}
                className="w-full h-3 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-amber-500 shadow-inner"
              />
              <div className="flex justify-between text-[11px] font-mono text-muted mt-2">
                <span>Standard Gateway Rate</span>
                <span>₹5</span>
                <span>₹10 (Tier-1 Parity)</span>
                <span>₹15</span>
                <span>₹20</span>
                <span>₹25 (Cap)</span>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
              1-Tap Commercial Presets
            </span>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => void handleApplyFee(p.val)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs font-mono transition-all",
                    feeInr === p.val
                      ? "border-amber-400 bg-amber-500/30 text-white font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                      : "border-border/60 bg-surface-2/60 text-slate-300 hover:border-amber-500/40 hover:text-white",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={() => void handleApplyFee(feeInr)}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold hover:brightness-110 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            >
              <Check className="mr-2 size-4" />
              {isSaving ? "Persisting to Database..." : `Save & Enforce ₹${feeInr.toFixed(2)} Fee Platform-Wide`}
            </Button>
          </div>
        </div>

        {/* Live Mathematical Revenue Projection Engine */}
        <div className="space-y-4 rounded-xl border border-border/80 bg-black/70 p-4 lg:col-span-5">
          <div className="flex items-center gap-2 border-b border-border/60 pb-2">
            <TrendingUp className="size-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Live EBITDA Revenue Projections
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted">Estimated Daily Orders</span>
              <span className="text-white font-bold">{formatNumber(dailyOrders)} orders/day</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted">Daily Platform Fee Income</span>
              <span className="text-emerald-400 font-bold">
                ₹{formatNumber(Math.round((dailyOrders * feePaise) / 100))}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted">Monthly Platform Fee EBITDA</span>
              <span className="text-amber-300 font-black text-sm">
                ₹{formatNumber(monthlyRevenueInr)} / mo
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-muted">Annualized EBITDA Run-Rate</span>
              <span className="text-yellow-400 font-black">
                ₹{formatNumber(annualRunRateInr)} / yr
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-surface-2/40 p-2.5 text-[11px] text-slate-400 flex items-start gap-2">
            <Info className="size-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              Unlike legacy market leaders charging ₹9 - ₹12 with hidden commissions, OrderKing transparently reflects this fee directly into customer invoices with 100% Section 9(5) CGST tax adherence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// 2. COMMISSION OVERRIDES: Outlet-by-Outlet Matrix (0% to 35%)
// ==========================================================================

function CommissionOverridesSection() {
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingOverrides, setPendingOverrides] = useState<Record<string, number>>({});
  const [savingOutletId, setSavingOutletId] = useState<string | null>(null);

  const outletsQ = useQuery({
    queryKey: ["outlet-commissions"],
    queryFn: () => loadOutletCommissionsFn(),
  });

  const outlets: OutletCommissionItem[] =
    outletsQ.data && outletsQ.data.ok ? outletsQ.data.data : [];

  const filtered = outlets.filter((o) =>
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.cuisine.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.address.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSliderChange = (outletId: string, pct: number) => {
    setPendingOverrides((prev) => ({ ...prev, [outletId]: pct }));
  };

  const handleSaveCommission = async (outlet: OutletCommissionItem) => {
    const overridePct = pendingOverrides[outlet.id] ?? outlet.commissionPct;
    const commissionBps = Math.round(overridePct * 100);
    setSavingOutletId(outlet.id);

    try {
      const res = await updateOutletCommissionFn({
        data: {
          restaurantId: outlet.id,
          commissionBps,
          reason: `Founder live commission override for ${outlet.name}: ${overridePct}%`,
        },
      });

      if (res && res.ok) {
        toast.success(
          `Commission for ${outlet.name} saved to DB: ${overridePct}% (${commissionBps} bps)`,
        );
        void qc.invalidateQueries({ queryKey: ["outlet-commissions"] });
        void qc.invalidateQueries({ queryKey: ["commercial-dials"] });
        setPendingOverrides((prev) => {
          const next = { ...prev };
          delete next[outlet.id];
          return next;
        });
      } else {
        toast.error((res as any)?.error || "Failed to update commission");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update commission");
    } finally {
      setSavingOutletId(null);
    }
  };

  const handleBulkPreset = async (targetPct: number, label: string) => {
    if (!confirm(`Apply ${targetPct}% commission across all ${outlets.length} active outlets?`)) return;
    const targetBps = Math.round(targetPct * 100);
    toast.info(`Updating all outlets to ${targetPct}%...`);

    let count = 0;
    for (const o of outlets) {
      await updateOutletCommissionFn({
        data: {
          restaurantId: o.id,
          commissionBps: targetBps,
          reason: `Founder bulk preset (${label}): ${targetPct}%`,
        },
      }).catch(() => null);
      count++;
    }

    toast.success(`Bulk updated ${count} outlets to ${targetPct}% commission!`);
    void qc.invalidateQueries({ queryKey: ["outlet-commissions"] });
    void qc.invalidateQueries({ queryKey: ["commercial-dials"] });
  };

  return (
    <div className="space-y-6 rounded-xl border border-emerald-500/40 bg-black/60 p-5 sm:p-6 shadow-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Percent className="size-5 text-emerald-400" />
            Outlet-by-Outlet Commission Overrides (0% to 35%)
          </h2>
          <p className="text-xs text-muted">
            Individual negotiated take-rates with instant PostgreSQL persistence. Strictly bounded between 0.0% and 35.0%.
          </p>
        </div>

        {/* Bulk Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleBulkPreset(15.0, "Platform Standard")}
            className="border-emerald-500/40 bg-emerald-950/40 text-xs text-emerald-300 hover:bg-emerald-900/60"
          >
            All 15% (OrderKing Standard)
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleBulkPreset(22.0, "Legacy Aggregator Parity")}
            className="border-amber-500/40 bg-amber-950/40 text-xs text-amber-300 hover:bg-amber-900/60"
          >
            All 22% (Legacy Parity)
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleBulkPreset(0.0, "Flash Acquisition")}
            className="border-cyan-500/40 bg-cyan-950/40 text-xs text-cyan-300 hover:bg-cyan-900/60"
          >
            All 0% (Merchant Acquisition)
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 size-4 text-muted" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search outlet by name, cuisine, or road..."
          className="pl-9 bg-surface-2/80 border-border text-xs text-white"
        />
      </div>

      {/* Outlets Commission List */}
      <div className="space-y-3">
        {outletsQ.isLoading ? (
          <div className="p-8 text-center text-xs text-muted">Loading merchant outlets from database...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted">No merchant outlets match your search query.</div>
        ) : (
          filtered.map((outlet) => {
            const currentPct = pendingOverrides[outlet.id] ?? outlet.commissionPct;
            const isDirty = pendingOverrides[outlet.id] !== undefined && pendingOverrides[outlet.id] !== outlet.commissionPct;
            const isSaving = savingOutletId === outlet.id;

            // Tier color badge
            let tierColor = "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
            let tierLabel = "Acquisition Tier";
            if (currentPct >= 26) {
              tierColor = "bg-rose-500/20 text-rose-300 border-rose-500/30";
              tierLabel = "Enterprise / Cloud Kitchen Cap";
            } else if (currentPct >= 19) {
              tierColor = "bg-amber-500/20 text-amber-300 border-amber-500/30";
              tierLabel = "Dominant Legacy Aggregator Parity";
            } else if (currentPct >= 8) {
              tierColor = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
              tierLabel = "OrderKing Standard Advantage";
            }

            return (
              <div
                key={outlet.id}
                className={cn(
                  "flex flex-col gap-4 rounded-xl border p-4 transition-all lg:flex-row lg:items-center lg:justify-between",
                  isDirty
                    ? "border-amber-500/80 bg-amber-950/20"
                    : "border-border/70 bg-black/50 hover:border-emerald-500/40",
                )}
              >
                {/* Outlet Meta */}
                <div className="space-y-1 lg:w-1/3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{outlet.name}</span>
                    <Badge variant="outline" className={cn("text-[10px] font-mono", tierColor)}>
                      {tierLabel}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted">
                    <span>{outlet.cuisine}</span>
                    <span>•</span>
                    <span>{outlet.address}</span>
                    <span>•</span>
                    <span className="text-amber-400 font-mono">★ {outlet.rating.toFixed(1)}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Weekly GMV: <span className="text-white font-bold">{formatInrExact(outlet.weeklyGmvPaise)}</span>
                  </div>
                </div>

                {/* Slider Control */}
                <div className="space-y-2 lg:w-1/3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Negotiated Take Rate</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {currentPct.toFixed(1)}% ({Math.round(currentPct * 100)} bps)
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="35"
                    step="0.5"
                    value={currentPct}
                    disabled={isSaving}
                    onChange={(e) => handleSliderChange(outlet.id, parseFloat(e.target.value))}
                    className="w-full h-2.5 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />

                  <div className="flex justify-between text-[10px] font-mono text-muted">
                    <span>0% (Free)</span>
                    <span>8% (Floor)</span>
                    <span>15% (Std)</span>
                    <span>22% (Legacy)</span>
                    <span>35% (Max)</span>
                  </div>
                </div>

                {/* Commission Calculation & Actions */}
                <div className="flex items-center justify-between gap-4 lg:w-1/4 lg:justify-end">
                  <div className="text-right font-mono text-xs">
                    <span className="text-muted block text-[10px]">Est. Weekly Cut</span>
                    <span className="font-bold text-amber-300">
                      {formatInrExact(Math.round((outlet.weeklyGmvPaise * Math.round(currentPct * 100)) / 10000))}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    disabled={!isDirty || isSaving}
                    onClick={() => void handleSaveCommission(outlet)}
                    className={cn(
                      "text-xs font-bold transition-all",
                      isDirty
                        ? "bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                        : "bg-surface-2/60 text-slate-500 border border-border/40",
                    )}
                  >
                    {isSaving ? "Saving..." : isDirty ? "Save to DB" : "Persisted"}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==========================================================================
// 3. SURGE CONTROLS: Rain Surge, Demand Multipliers & Night Surcharge
// ==========================================================================

function SurgeControlsSection({
  dials,
  onSaved,
}: {
  dials: CommercialDialsState | null;
  onSaved: () => void;
}) {
  const [rainSurgeActive, setRainSurgeActive] = useState<boolean>(() => dials?.rainSurgeActive ?? false);
  const [rainSurgeInr, setRainSurgeInr] = useState<number>(() => (dials?.rainSurgePaise ?? 2500) / 100);
  const [nightSurchargeActive, setNightSurchargeActive] = useState<boolean>(() => dials?.nightSurchargeActive ?? false);
  const [nightSurchargeInr, setNightSurchargeInr] = useState<number>(() => (dials?.nightSurchargePaise ?? 1500) / 100);
  const [multiplier, setMultiplier] = useState<number>(() => dials?.demandSurgeMultiplier ?? 1.0);
  const [isSaving, setIsSaving] = useState(false);

  const effectiveFactor =
    multiplier * (rainSurgeActive ? 1.35 : 1.0) * (nightSurchargeActive ? 1.2 : 1.0);

  const handleSaveSurge = async (override?: {
    rain?: boolean;
    night?: boolean;
    mult?: number;
  }) => {
    const rain = override?.rain ?? rainSurgeActive;
    const night = override?.night ?? nightSurchargeActive;
    const mult = override?.mult ?? multiplier;

    setIsSaving(true);
    try {
      const res = await updateSurgeDialsFn({
        data: {
          rainSurgeActive: rain,
          rainSurgePaise: Math.round(rainSurgeInr * 100),
          nightSurchargeActive: night,
          nightSurchargePaise: Math.round(nightSurchargeInr * 100),
          demandSurgeMultiplier: mult,
          reason: "Founder live surge dial adjustment",
        },
      });

      if (res && res.ok) {
        toast.success(`Surge Controls Updated: ${res.state.statusLabel}`);
        onSaved();
      } else {
        toast.error((res as any)?.error || "Failed to update surge dials");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update surge dials");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 rounded-xl border border-cyan-500/40 bg-black/60 p-5 sm:p-6 shadow-xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CloudRain className="size-5 text-cyan-400" />
            Live Surge Controls &amp; Dynamic Weather Multipliers
          </h2>
          <p className="text-xs text-muted">
            1-tap manual override for monsoon rain surges, peak demand velocity, and late-night operations.
          </p>
        </div>

        <Badge
          className={cn(
            "font-mono text-xs font-bold px-3 py-1.5 transition-all",
            effectiveFactor > 1.2
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.2)]"
              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          )}
        >
          Compound Factor: {effectiveFactor.toFixed(2)}x
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Dial 1: 1-Tap Big Tactile Rain Surge Switch */}
        <div
          className={cn(
            "rounded-xl border p-4 space-y-4 transition-all relative overflow-hidden",
            rainSurgeActive
              ? "border-cyan-500/80 bg-gradient-to-b from-cyan-950/40 to-black/80 shadow-[0_0_25px_rgba(6,182,212,0.2)]"
              : "border-border/70 bg-black/40",
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CloudRain
                className={cn("size-5", rainSurgeActive ? "text-cyan-400 animate-bounce" : "text-muted")}
              />
              <span className="font-bold text-sm text-white">1. Rain Surge Switch</span>
            </div>
            <Badge
              className={cn(
                "text-[10px] font-mono",
                rainSurgeActive ? "bg-cyan-500/30 text-cyan-300" : "bg-surface-2 text-muted",
              )}
            >
              {rainSurgeActive ? "ACTIVE" : "STANDBY"}
            </Badge>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Adds a dedicated monsoon rain surcharge directly passing 80% to active riders battling inclement weather.
          </p>

          <div className="space-y-2">
            <label className="text-[11px] font-mono text-slate-300 block">Rain Surcharge Amount (INR)</label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted">₹</span>
              <Input
                type="number"
                min="0"
                max="50"
                value={rainSurgeInr}
                onChange={(e) => setRainSurgeInr(parseFloat(e.target.value) || 0)}
                className="h-8 bg-surface-2/80 border-border text-xs text-white font-mono w-24"
              />
              <span className="text-[10px] font-mono text-muted">({Math.round(rainSurgeInr * 100)} paise)</span>
            </div>
          </div>

          <Button
            type="button"
            disabled={isSaving}
            onClick={() => {
              const nextVal = !rainSurgeActive;
              setRainSurgeActive(nextVal);
              void handleSaveSurge({ rain: nextVal });
            }}
            className={cn(
              "w-full text-xs font-bold transition-all shadow-md",
              rainSurgeActive
                ? "bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                : "bg-surface-2 text-slate-300 border border-border/80 hover:bg-surface-2/80",
            )}
          >
            {rainSurgeActive ? "⚡ Turn Rain Surge OFF" : "🌧️ 1-Tap Activate Rain Surge"}
          </Button>
        </div>

        {/* Dial 2: High Demand Multiplier */}
        <div className="rounded-xl border border-border/70 bg-black/40 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="size-5 text-amber-400" />
              <span className="font-bold text-sm text-white">2. Demand Multiplier</span>
            </div>
            <span className="font-mono text-sm font-black text-amber-400">{multiplier.toFixed(2)}x</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Scales delivery fee dynamically based on incoming order queue density vs rider availability.
          </p>

          <div className="space-y-2 pt-2">
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.05"
              value={multiplier}
              disabled={isSaving}
              onChange={(e) => setMultiplier(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-muted">
              <span>1.0x (Normal)</span>
              <span>1.5x (Peak)</span>
              <span>2.0x (Rush)</span>
              <span>3.0x (Max)</span>
            </div>
          </div>

          {/* Quick multiplier presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[1.0, 1.25, 1.5, 2.0].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMultiplier(m);
                  void handleSaveSurge({ mult: m });
                }}
                className={cn(
                  "rounded px-2 py-1 text-[11px] font-mono border transition-all",
                  multiplier === m
                    ? "border-amber-400 bg-amber-500/20 text-amber-300 font-bold"
                    : "border-border/60 bg-surface-2 text-muted hover:text-white",
                )}
              >
                {m}x
              </button>
            ))}
          </div>

          <Button
            size="sm"
            disabled={isSaving}
            onClick={() => void handleSaveSurge()}
            className="w-full bg-amber-500 text-black font-bold hover:bg-amber-400 text-xs mt-2"
          >
            Apply Multiplier ({multiplier.toFixed(2)}x)
          </Button>
        </div>

        {/* Dial 3: Night Surcharge Toggle */}
        <div
          className={cn(
            "rounded-xl border p-4 space-y-4 transition-all",
            nightSurchargeActive
              ? "border-purple-500/80 bg-gradient-to-b from-purple-950/40 to-black/80 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
              : "border-border/70 bg-black/40",
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon
                className={cn("size-5", nightSurchargeActive ? "text-purple-400" : "text-muted")}
              />
              <span className="font-bold text-sm text-white">3. Night Surcharge</span>
            </div>
            <Badge
              className={cn(
                "text-[10px] font-mono",
                nightSurchargeActive ? "bg-purple-500/30 text-purple-300" : "bg-surface-2 text-muted",
              )}
            >
              {nightSurchargeActive ? "ACTIVE" : "OFF"}
            </Badge>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Incentivizes late-night riders during 23:00 to 04:00 AM shifts with flat trip enhancements.
          </p>

          <div className="space-y-2">
            <label className="text-[11px] font-mono text-slate-300 block">Night Surcharge (INR)</label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted">₹</span>
              <Input
                type="number"
                min="0"
                max="30"
                value={nightSurchargeInr}
                onChange={(e) => setNightSurchargeInr(parseFloat(e.target.value) || 0)}
                className="h-8 bg-surface-2/80 border-border text-xs text-white font-mono w-24"
              />
              <span className="text-[10px] font-mono text-muted">({Math.round(nightSurchargeInr * 100)} paise)</span>
            </div>
          </div>

          <Button
            type="button"
            disabled={isSaving}
            onClick={() => {
              const nextVal = !nightSurchargeActive;
              setNightSurchargeActive(nextVal);
              void handleSaveSurge({ night: nextVal });
            }}
            className={cn(
              "w-full text-xs font-bold transition-all shadow-md",
              nightSurchargeActive
                ? "bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                : "bg-surface-2 text-slate-300 border border-border/80 hover:bg-surface-2/80",
            )}
          >
            {nightSurchargeActive ? "🌙 Deactivate Night Surcharge" : "🌙 1-Tap Toggle Night Mode"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// 4. PENALTY DISPUTE DESK: Late Prep & Cancellation Penalty Dashboard
// ==========================================================================

function PenaltyDisputeDeskSection() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("ALL");
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const disputesQ = useQuery({
    queryKey: ["penalty-disputes", filter],
    queryFn: () => loadPenaltyDisputesFn({ data: { statusFilter: filter } }),
  });

  const data: PenaltyDisputeSummary | null =
    disputesQ.data && disputesQ.data.ok ? disputesQ.data.data : null;

  const disputes = data?.disputes ?? [];

  const handleResolve = async (
    disputeId: string,
    decision: "WAIVED" | "ENFORCED",
    reason: string,
  ) => {
    setResolvingId(disputeId);
    try {
      const res = await resolvePenaltyDisputeFn({
        data: {
          disputeId,
          decision,
          reason,
        },
      });

      if (res && res.ok) {
        toast.success(
          decision === "WAIVED"
            ? "Penalty waived as merchant goodwill! Dispute resolved."
            : "Penalty enforced & posted to merchant ledger deduction.",
        );
        void qc.invalidateQueries({ queryKey: ["penalty-disputes"] });
        void qc.invalidateQueries({ queryKey: ["commercial-dials"] });
      } else {
        toast.error((res as any)?.error || "Failed to resolve dispute");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to resolve dispute");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-6 rounded-xl border border-rose-500/40 bg-black/60 p-5 sm:p-6 shadow-xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Scale className="size-5 text-rose-400" />
            Merchant Penalty Dispute Desk
          </h2>
          <p className="text-xs text-muted">
            Inspect, approve, or waive merchant late prep (&gt;20m) and post-acceptance cancellation penalties.
          </p>
        </div>

        {/* Dispute Counters */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-1 text-amber-300">
            Pending: <span className="font-bold">{data?.pendingCount ?? 0}</span> (₹
            {((data?.pendingPaise ?? 0) / 100).toFixed(0)})
          </div>
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-1 text-emerald-300">
            Waived: <span className="font-bold">{data?.waivedCount ?? 0}</span>
          </div>
          <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-1 text-rose-300">
            Enforced: <span className="font-bold">{data?.enforcedCount ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {["ALL", "PENDING", "WAIVED", "ENFORCED"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-mono transition-all border",
              filter === f
                ? "border-rose-400 bg-rose-500/20 text-white font-bold"
                : "border-border/60 bg-surface-2 text-muted hover:text-white",
            )}
          >
            {f === "ALL" ? "All Disputes" : f}
          </button>
        ))}
      </div>

      {/* Disputes List */}
      <div className="space-y-3">
        {disputesQ.isLoading ? (
          <div className="p-8 text-center text-xs text-muted">Loading penalty disputes...</div>
        ) : disputes.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted">No penalty disputes matching filter.</div>
        ) : (
          disputes.map((disp) => {
            const isResolving = resolvingId === disp.id;
            return (
              <div
                key={disp.id}
                className="rounded-xl border border-border/80 bg-black/50 p-4 space-y-3 transition-all hover:border-rose-500/40"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{disp.restaurantName}</span>
                    <Badge variant="outline" className="text-[10px] font-mono border-rose-500/40 text-rose-300">
                      {disp.penaltyType.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-[10px] font-mono text-muted">Order: {disp.orderId}</span>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-xs font-bold text-rose-400 bg-rose-950/60 border border-rose-500/40 px-2 py-0.5 rounded">
                      ₹{disp.penaltyInr.toFixed(2)} ({disp.penaltyPaise} paise)
                    </span>
                    <Badge
                      className={cn(
                        "text-[10px] font-mono",
                        disp.status === "PENDING"
                          ? "bg-amber-500/20 text-amber-300"
                          : disp.status === "WAIVED"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-rose-500/20 text-rose-300",
                      )}
                    >
                      {disp.status}
                    </Badge>
                  </div>
                </div>

                <div className="rounded-lg bg-surface-2/40 p-3 text-xs text-slate-300 border border-border/40">
                  <span className="text-[10px] font-bold text-muted uppercase block tracking-wider mb-1">
                    Merchant Justification &amp; Stated Reason:
                  </span>
                  <p className="italic">{disp.merchantNotes}</p>
                </div>

                {disp.status === "PENDING" ? (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      size="sm"
                      disabled={isResolving}
                      onClick={() =>
                        void handleResolve(
                          disp.id,
                          "WAIVED",
                          "Founder approved grace waiver: technical disruption verified.",
                        )
                      }
                      className="bg-emerald-600 text-white font-bold hover:bg-emerald-500 text-xs shadow-sm"
                    >
                      <CheckCircle2 className="mr-1.5 size-3.5" />
                      Waive Penalty (₹0 Grace)
                    </Button>

                    <Button
                      size="sm"
                      disabled={isResolving}
                      onClick={() =>
                        void handleResolve(
                          disp.id,
                          "ENFORCED",
                          "Unjustified delay beyond SLA threshold; penalty deducted from weekly payout.",
                        )
                      }
                      className="bg-rose-700 text-white font-bold hover:bg-rose-600 text-xs shadow-sm"
                    >
                      <XCircle className="mr-1.5 size-3.5" />
                      Enforce Penalty (-₹{disp.penaltyInr.toFixed(0)})
                    </Button>
                  </div>
                ) : (
                  <div className="text-[11px] font-mono text-muted text-right">
                    Resolved: {disp.status} • {disp.waiverReason || "Processed by Founder Desk"}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==========================================================================
// 5. WEEKLY WEDNESDAY PAYOUT RELEASE: 1-Tap Bulk Payout Gateway
// ==========================================================================

function WednesdayPayoutReleaseSection() {
  const qc = useQueryClient();
  const [isReleasing, setIsReleasing] = useState(false);

  const payoutQ = useQuery({
    queryKey: ["wednesday-payout-batch"],
    queryFn: () => loadWeeklyWednesdayPayoutBatchFn(),
  });

  const batch: WeeklyWednesdayPayoutBatch | null =
    payoutQ.data && payoutQ.data.ok ? payoutQ.data.data : null;

  const handleBulkRelease = async () => {
    if (!batch) return;
    const confirmMsg = `Authorize and disburse Wednesday Weekly Payouts for ${batch.totalMerchantsCount} merchants totaling ₹${formatNumber(
      Math.round(batch.totalNetPayablePaise / 100),
    )}?`;
    if (!confirm(confirmMsg)) return;

    setIsReleasing(true);
    try {
      const res = await releaseWeeklyWednesdayPayoutsFn({
        data: {
          reason: `Founder 1-tap bulk Wednesday disbursement: Cycle ${batch.cycle.cycleId}`,
        },
      });

      if (res && res.ok) {
        toast.success(
          `Disbursement Success! Batch ID: ${res.batchReference}. Released ₹${formatNumber(
            Math.round(res.totalNetDisbursementPaise / 100),
          )} across ${res.totalMerchants} merchants.`,
        );
        void qc.invalidateQueries({ queryKey: ["wednesday-payout-batch"] });
        void qc.invalidateQueries({ queryKey: ["commercial-dials"] });
      } else {
        toast.error((res as any)?.error || "Failed to release Wednesday payouts");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to release Wednesday payouts");
    } finally {
      setIsReleasing(false);
    }
  };

  return (
    <div className="space-y-6 rounded-xl border border-yellow-500/40 bg-black/60 p-5 sm:p-6 shadow-xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="size-5 text-yellow-400" />
            T+1 Daily Automated Payout Release Gateway
          </h2>
          <p className="text-xs text-muted">
            Daily T+1 settlement reconciliation for deliveries recorded up to 23:59:59 IST with automated RazorpayX IMPS/NEFT/UPI disbursements and Section 9(5) CGST, 1% TCS, 1% TDS.
          </p>
        </div>

        <Badge
          className={cn(
            "font-mono text-xs px-3 py-1",
            batch?.batchStatus === "DISBURSED"
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              : "bg-amber-500/20 text-amber-300 border-amber-500/40",
          )}
        >
          Status: {batch?.batchStatus ?? "READY_FOR_APPROVAL"}
        </Badge>
      </div>

      {/* Cycle Banner */}
      <div className="grid gap-4 md:grid-cols-4 font-mono text-xs">
        <div className="rounded-xl border border-border/80 bg-black/50 p-3 space-y-1">
          <span className="text-[10px] text-muted block uppercase">Settlement Window</span>
          <span className="font-bold text-white">{batch?.cycle.startDate} (Day T)</span>
        </div>

        <div className="rounded-xl border border-border/80 bg-black/50 p-3 space-y-1">
          <span className="text-[10px] text-muted block uppercase">Scheduled Disbursement</span>
          <span className="font-bold text-amber-400">Day T+1, {batch?.cycle.payoutDate}</span>
        </div>

        <div className="rounded-xl border border-border/80 bg-black/50 p-3 space-y-1">
          <span className="text-[10px] text-muted block uppercase">Total Merchants</span>
          <span className="font-bold text-white">{batch?.totalMerchantsCount ?? 0} Outlets</span>
        </div>

        <div className="rounded-xl border border-border/80 bg-black/50 p-3 space-y-1">
          <span className="text-[10px] text-muted block uppercase">Delivered Orders</span>
          <span className="font-bold text-emerald-400">{formatNumber(batch?.totalDeliveredOrders ?? 0)}</span>
        </div>
      </div>

      {/* Financial Statutory Breakdown Bar */}
      <div className="rounded-xl border border-border/80 bg-black/70 p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Scale className="size-4 text-amber-400" />
            Statutory Reconciliation Breakdown (Section 9(5) CGST, 1% TCS, 1% TDS)
          </span>
          <span className="text-[11px] font-mono text-muted">100% SafeInteger Integer Paise</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
          <div className="space-y-1 p-2 rounded bg-surface-2/40">
            <span className="text-muted text-[10px] block">Gross Food Sales</span>
            <span className="font-bold text-white text-sm">
              ₹{formatNumber(Math.round((batch?.totalGrossSalesPaise ?? 0) / 100))}
            </span>
          </div>

          <div className="space-y-1 p-2 rounded bg-surface-2/40">
            <span className="text-muted text-[10px] block">Platform Commission Retained</span>
            <span className="font-bold text-cyan-400 text-sm">
              ₹{formatNumber(Math.round((batch?.totalCommissionEarnedPaise ?? 0) / 100))}
            </span>
          </div>

          <div className="space-y-1 p-2 rounded bg-surface-2/40">
            <span className="text-muted text-[10px] block">Statutory Taxes (TCS + TDS + GST)</span>
            <span className="font-bold text-rose-400 text-sm">
              -₹{formatNumber(Math.round(((batch?.totalStatutoryTcsTdsPaise ?? 0) + (batch?.totalGstCollectedPaise ?? 0)) / 100))}
            </span>
          </div>

          <div className="space-y-1 p-2 rounded bg-amber-500/10 border border-amber-500/30">
            <span className="text-amber-300 text-[10px] block font-bold">Net Merchant Payout</span>
            <span className="font-black text-amber-400 text-base">
              ₹{formatNumber(Math.round((batch?.totalNetPayablePaise ?? 0) / 100))}
            </span>
          </div>
        </div>
      </div>

      {/* 1-Tap Master Disbursement Button */}
      <div className="pt-2">
        <Button
          size="lg"
          disabled={isReleasing || batch?.batchStatus === "DISBURSED"}
          onClick={() => void handleBulkRelease()}
          className={cn(
            "w-full text-sm font-black tracking-wide shadow-xl transition-all py-6",
            batch?.batchStatus === "DISBURSED"
              ? "bg-surface-2 text-muted cursor-not-allowed border border-border"
              : "bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-black hover:brightness-110 shadow-[0_0_30px_rgba(245,158,11,0.4)]",
          )}
        >
          {batch?.batchStatus === "DISBURSED" ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-400" />
              T+1 Daily Batch Disbursed • Batch Ref: {batch.externalBatchReference}
            </span>
          ) : isReleasing ? (
            "Executing Bulk Bank Disbursement Gateway via RazorpayX..."
          ) : (
            <span className="flex items-center gap-2">
              <Building2 className="size-5" />
              1-Tap Authorize &amp; Disburse T+1 Daily Payouts (₹
              {formatNumber(Math.round((batch?.totalNetPayablePaise ?? 0) / 100))})
            </span>
          )}
        </Button>
      </div>

      {/* Merchant Payout Table Preview */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
          Merchant Settlement Manifest Preview ({batch?.merchants.length ?? 0} Outlets)
        </span>
        <div className="max-h-60 overflow-y-auto rounded-xl border border-border/70 bg-black/40">
          <table className="w-full text-left text-[11px] font-mono">
            <thead className="bg-surface-2/80 text-muted sticky top-0 border-b border-border">
              <tr>
                <th className="p-2.5">Restaurant</th>
                <th className="p-2.5">Orders</th>
                <th className="p-2.5">Gross Sales</th>
                <th className="p-2.5">Commission</th>
                <th className="p-2.5">TCS/TDS</th>
                <th className="p-2.5 text-right">Net Payable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-slate-300">
              {batch?.merchants.slice(0, 8).map((m) => (
                <tr key={m.restaurantId} className="hover:bg-surface-2/30">
                  <td className="p-2.5 font-bold text-white">{m.restaurantName}</td>
                  <td className="p-2.5">{m.deliveredOrdersCount}</td>
                  <td className="p-2.5">{formatInrExact(m.grossSalesPaise)}</td>
                  <td className="p-2.5 text-cyan-400">{formatInrExact(m.platformCommissionPaise)}</td>
                  <td className="p-2.5 text-rose-400">
                    {formatInrExact(m.tcsDeductionPaise + m.tdsDeductionPaise)}
                  </td>
                  <td className="p-2.5 text-right font-bold text-amber-300">
                    {formatInrExact(m.netPayablePaise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// 6. FEATURED AD AUCTION STUDIO: Top-of-Feed GSP CPC Bidding Controls
// ==========================================================================

function FeaturedAdAuctionStudioSection() {
  const qc = useQueryClient();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [maxBidCpcInr, setMaxBidCpcInr] = useState<number>(6.5);
  const [dailyBudgetInr, setDailyBudgetInr] = useState<number>(1500);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const adStudioQ = useQuery({
    queryKey: ["ad-auction-studio"],
    queryFn: () => loadFeaturedAdStudioFn(),
  });

  const studio: AdAuctionStudioState | null =
    adStudioQ.data && adStudioQ.data.ok ? adStudioQ.data.data : null;

  const campaigns = studio?.campaigns ?? [];
  const winners = studio?.auctionWinners ?? [];

  const handleUpdateBid = async () => {
    if (!selectedRestaurantId && campaigns[0]) {
      // default to first campaign
      setSelectedRestaurantId(campaigns[0].restaurantId);
    }

    const rstId = selectedRestaurantId || (campaigns[0]?.restaurantId ?? "rst_royal_darbar");
    setIsSubmitting(true);
    try {
      const res = await updateFeaturedAdBidFn({
        data: {
          restaurantId: rstId,
          maxBidCpcPaise: Math.round(maxBidCpcInr * 100),
          dailyBudgetPaise: Math.round(dailyBudgetInr * 100),
          placementSlot: "TOP_OF_FEED",
          status: "ACTIVE",
          reason: `Ad auction bid update: ₹${maxBidCpcInr.toFixed(2)} CPC, ₹${dailyBudgetInr} daily budget`,
        },
      });

      if (res && res.ok) {
        toast.success(
          `Bid Submitted to GSP Auction! Max CPC: ₹${maxBidCpcInr.toFixed(2)}, Effective Reserve: ₹${(
            res.effectiveCpcPaise / 100
          ).toFixed(2)}`,
        );
        void qc.invalidateQueries({ queryKey: ["ad-auction-studio"] });
        void qc.invalidateQueries({ queryKey: ["commercial-dials"] });
      } else {
        toast.error((res as any)?.error || "Failed to submit ad bid");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit ad bid");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 rounded-xl border border-purple-500/40 bg-black/60 p-5 sm:p-6 shadow-xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Megaphone className="size-5 text-purple-400" />
            Featured Ad Auction Studio (Top-of-Feed Placement)
          </h2>
          <p className="text-xs text-muted">
            Generalized Second-Price (GSP) bidding engine for restaurants to compete for top 3 sponsored feed positions.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="rounded-lg border border-purple-500/40 bg-purple-950/40 px-3 py-1 text-purple-300">
            Ad Revenue: ₹{((studio?.dailyAdRevenuePaise ?? 0) / 100).toFixed(0)} today
          </div>
          <div className="rounded-lg border border-border bg-surface-2 px-3 py-1 text-slate-300">
            Avg CPC: ₹{((studio?.avgCpcPaise ?? 450) / 100).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Top of Feed Live Winning Slots Simulation */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-2">
          <Award className="size-4 text-amber-400" />
          Live Auction Winners (Top 3 Customer Feed Placement)
        </span>

        <div className="grid gap-3 sm:grid-cols-3">
          {winners.map((win, idx) => (
            <div
              key={win.restaurantId}
              className="rounded-xl border border-amber-500/50 bg-gradient-to-b from-amber-500/10 to-black/80 p-3.5 space-y-2 relative"
            >
              <div className="flex justify-between items-start">
                <Badge className="bg-amber-500 text-black font-black text-[10px]">
                  SLOT #{win.rank} SPONSORED
                </Badge>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  Effective CPC: ₹{(win.effectiveCpcPaise / 100).toFixed(2)}
                </span>
              </div>

              <div>
                <span className="font-bold text-sm text-white block">{win.restaurantName}</span>
                <span className="text-[11px] text-muted font-mono">
                  Quality Score: {win.qualityScore.toFixed(2)} • Ad Rank: {win.adRankScore}
                </span>
              </div>

              <div className="text-[10px] font-mono text-slate-400 border-t border-border/40 pt-1.5 flex justify-between">
                <span>Second-Price GSP Rule</span>
                <span className="text-amber-300">Active in feed</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bidding Controls Interface */}
      <div className="rounded-xl border border-border/80 bg-black/70 p-4 space-y-5">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Sliders className="size-4 text-purple-400" />
            Set Restaurant CPC &amp; Daily Impression Slot Bids
          </span>
          <span className="text-[10px] font-mono text-muted">Auto-Priced via GSP Engine</span>
        </div>

        <div className="grid gap-6 md:grid-cols-12 items-center">
          <div className="space-y-4 md:col-span-8">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Select Merchant Outlet</label>
              <select
                value={selectedRestaurantId || (campaigns[0]?.restaurantId ?? "")}
                onChange={(e) => setSelectedRestaurantId(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-surface-2 px-3 text-xs text-white"
              >
                {campaigns.map((c) => (
                  <option key={c.restaurantId} value={c.restaurantId}>
                    {c.restaurantName} (Current Bid: ₹{c.maxBidCpcInr.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* CPC Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold">Max Willing CPC (Cost Per Click)</span>
                <span className="font-mono font-bold text-purple-400 text-sm">
                  ₹{maxBidCpcInr.toFixed(2)} / click ({Math.round(maxBidCpcInr * 100)} paise)
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="25.0"
                step="0.5"
                value={maxBidCpcInr}
                disabled={isSubmitting}
                onChange={(e) => setMaxBidCpcInr(parseFloat(e.target.value))}
                className="w-full h-2.5 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-muted">
                <span>₹1.00 (Min)</span>
                <span>₹5.00</span>
                <span>₹10.00 (High)</span>
                <span>₹25.00 (Peak Bid)</span>
              </div>
            </div>

            {/* Daily Budget Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold">Daily Campaign Budget</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  ₹{formatNumber(dailyBudgetInr)} / day
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="5000"
                step="100"
                value={dailyBudgetInr}
                disabled={isSubmitting}
                onChange={(e) => setDailyBudgetInr(parseFloat(e.target.value))}
                className="w-full h-2.5 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-muted">
                <span>₹100</span>
                <span>₹1,000</span>
                <span>₹2,500</span>
                <span>₹5,000 (Max)</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border/80 bg-surface-2/40 p-4 md:col-span-4 font-mono text-xs">
            <span className="text-[10px] text-muted block uppercase font-bold">Estimated Performance</span>
            <div className="flex justify-between">
              <span className="text-muted">Est. Daily Clicks:</span>
              <span className="font-bold text-white">
                ~{Math.round(dailyBudgetInr / Math.max(1, maxBidCpcInr))} clicks
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Est. Impressions:</span>
              <span className="font-bold text-emerald-400">
                ~{Math.round((dailyBudgetInr / Math.max(1, maxBidCpcInr)) * 28)} views
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Placement Slot:</span>
              <span className="text-amber-300">Top-of-Feed #1-#3</span>
            </div>

            <Button
              disabled={isSubmitting}
              onClick={() => void handleUpdateBid()}
              className="w-full bg-purple-600 text-white font-bold hover:bg-purple-500 text-xs mt-3 shadow-lg"
            >
              {isSubmitting ? "Submitting Bid..." : "Submit Bid to Auction"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// 7. TRAVEL PARTNER GOVERNANCE & DIAL SECTION
// ==========================================================================

function TravelPartnerGovernanceSection() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["travel-partner-governance"],
    queryFn: () => loadTravelPartnerGovernanceFn(),
  });

  const state: TravelPartnerGovernanceState | null =
    q.data && q.data.ok ? q.data.data : null;

  const [form, setForm] = useState<Partial<TravelPartnerGovernanceState>>({});
  const [markerDraft, setMarkerDraft] = useState("");
  const [cashbackDraft, setCashbackDraft] = useState<number>(1.5);

  // 1. Convenience Fees Local Drafts
  const [flightFeeDraft, setFlightFeeDraft] = useState<number>(399);
  const [trainFeeDraft, setTrainFeeDraft] = useState<number>(40);
  const [hotelFeeDraft, setHotelFeeDraft] = useState<number>(250);

  // 2. TBO Credentials & Sync State
  const [tboAgencyDraft, setTboAgencyDraft] = useState("187051");
  const [tboUserDraft, setTboUserDraft] = useState("orderkingpay");
  const [tboPassDraft, setTboPassDraft] = useState("");
  const [tboEndpointDraft, setTboEndpointDraft] = useState("https://api.tbotechnology.com");
  const [isSyncingTbo, setIsSyncingTbo] = useState(false);

  useEffect(() => {
    if (state) {
      setForm(state);
      setMarkerDraft(state.travelpayoutsMarker || "794122");
      setCashbackDraft(state.cashbackPercentage || 1.5);
      setFlightFeeDraft(state.flightConvenienceFeeInr ?? 399);
      setTrainFeeDraft(state.trainConvenienceFeeInr ?? 40);
      setHotelFeeDraft(state.hotelConvenienceFeeInr ?? 250);
      setTboAgencyDraft(state.tboAgencyCode || "187051");
      setTboUserDraft(state.tboUserName || "orderkingpay");
      setTboEndpointDraft(state.tboEndpoint || "https://api.tbotechnology.com");
    }
  }, [state]);

  const handleSyncTbo = async () => {
    setIsSyncingTbo(true);
    try {
      const res = await syncTboCredentialsAndTokenFn({
        data: {
          agencyCode: tboAgencyDraft,
          userName: tboUserDraft,
          password: tboPassDraft,
          endpoint: tboEndpointDraft,
          reason: "Founder 1-Click TBO API Gateway Token Synchronization",
        },
      });
      if (res && res.ok) {
        toast.success(res.state.tboSyncMessage || "TBO API Token Synced Successfully");
        void qc.invalidateQueries({ queryKey: ["travel-partner-governance"] });
      } else {
        toast.error((res as any)?.message || "TBO API Token sync failed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error syncing TBO credentials");
    } finally {
      setIsSyncingTbo(false);
    }
  };

  const mutateSettings = useMutation({
    mutationFn: (patch: Partial<TravelPartnerGovernanceState>) =>
      updateTravelPartnerGovernanceFn({ data: { patch, reason: "Umar OS Live Dial Adjustment" } }),
    onSuccess: (res) => {
      if (res && res.ok) {
        toast.success("Travel partner governance updated successfully");
        void qc.invalidateQueries({ queryKey: ["travel-partner-governance"] });
      } else {
        toast.error((res as any)?.message || "Failed to update travel governance");
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Error saving travel settings");
    },
  });

  if (q.isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted">
        Loading Travel Governance State from PostgreSQL...
      </div>
    );
  }

  const travelpayoutsActive = form.travelpayoutsActive ?? state?.travelpayoutsActive ?? true;
  const duffelGdsActive = form.duffelGdsActive ?? state?.duffelGdsActive ?? true;
  const bookingComActive = form.bookingComActive ?? state?.bookingComActive ?? true;
  const agodaActive = form.agodaActive ?? state?.agodaActive ?? true;
  const redbusActive = form.redbusActive ?? state?.redbusActive ?? true;
  const irctcActive = form.irctcActive ?? state?.irctcActive ?? true;
  const autoRouteDomestic = form.autoRouteDomesticToTravelpayouts ?? state?.autoRouteDomesticToTravelpayouts ?? true;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-xl border border-sky-500/40 bg-gradient-to-r from-sky-950/40 via-slate-900 to-black p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe className="size-5 text-sky-400" />
            <h2 className="text-lg font-black text-white">TRAVEL PARTNER ECOSYSTEM GOVERNANCE</h2>
            <Badge className="border-sky-500/40 bg-sky-500/20 text-sky-300 font-mono text-[10px]">
              AFFILIATE & GDS RAILS
            </Badge>
          </div>
          <p className="text-xs text-slate-300">
            Control live distribution channels across Travelpayouts (Aviasales), Duffel NDC, Booking.com, Agoda, RedBus, and IRCTC.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="border-emerald-500/40 bg-emerald-950/60 text-emerald-300 font-mono text-xs px-3 py-1">
            🔒 ₹0 Platform Markup Guarantee
          </Badge>
        </div>
      </div>

      {/* Main Grid: Partner Toggles & Config */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Card 1: Flights (Travelpayouts & Duffel) */}
        <div className="rounded-xl border border-border/80 bg-surface/50 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Plane className="size-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Flight Aggregation & GDS Engines</h3>
            </div>
            <span className="text-[10px] font-mono text-muted">2 Active Engines</span>
          </div>

          {/* Travelpayouts Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-border/60">
            <div>
              <div className="font-bold text-xs text-white">Travelpayouts Domestic Network (Aviasales)</div>
              <div className="text-[11px] text-muted">Indian domestic air corridors, direct carrier routing</div>
            </div>
            <Button
              size="sm"
              variant={travelpayoutsActive ? "default" : "outline"}
              onClick={() => {
                const nextVal = !travelpayoutsActive;
                setForm((prev) => ({ ...prev, travelpayoutsActive: nextVal }));
                mutateSettings.mutate({ travelpayoutsActive: nextVal });
              }}
              className={travelpayoutsActive ? "bg-emerald-600 hover:bg-emerald-500 text-xs" : "text-xs border-border/60"}
            >
              {travelpayoutsActive ? "Active" : "Disabled"}
            </Button>
          </div>

          {/* Travelpayouts Marker Editor */}
          <div className="p-3 rounded-lg bg-black/40 border border-border/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Travelpayouts Affiliate Marker</span>
              <span className="text-[10px] font-mono text-amber-300">Marker ID: {markerDraft}</span>
            </div>
            <div className="flex gap-2">
              <Input
                value={markerDraft}
                onChange={(e) => setMarkerDraft(e.target.value)}
                placeholder="794122"
                className="bg-black/60 border-border/60 text-xs font-mono h-9"
              />
              <Button
                size="sm"
                onClick={() => {
                  mutateSettings.mutate({ travelpayoutsMarker: markerDraft.trim() || "794122" });
                }}
                className="bg-sky-600 hover:bg-sky-500 text-xs h-9 font-bold"
              >
                Save Marker
              </Button>
            </div>
            <p className="text-[10px] text-muted">Applied to all Aviasales and Travelpayouts deep-links across Customer SuperApp.</p>
          </div>

          {/* Duffel International GDS Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-border/60">
            <div>
              <div className="font-bold text-xs text-white">Duffel International GDS (NDC)</div>
              <div className="text-[11px] text-muted">Worldwide IATA NDC carrier quotes, foreign currency clearance</div>
            </div>
            <Button
              size="sm"
              variant={duffelGdsActive ? "default" : "outline"}
              onClick={() => {
                const nextVal = !duffelGdsActive;
                setForm((prev) => ({ ...prev, duffelGdsActive: nextVal }));
                mutateSettings.mutate({ duffelGdsActive: nextVal });
              }}
              className={duffelGdsActive ? "bg-emerald-600 hover:bg-emerald-500 text-xs" : "text-xs border-border/60"}
            >
              {duffelGdsActive ? "Active" : "Disabled"}
            </Button>
          </div>

          {/* Domestic Auto-route */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-border/60">
            <div>
              <div className="font-bold text-xs text-white">Domestic Auto-Route to Travelpayouts</div>
              <div className="text-[11px] text-muted">Direct Indian city pairs to INR rails instead of USD GDS</div>
            </div>
            <Button
              size="sm"
              variant={autoRouteDomestic ? "default" : "outline"}
              onClick={() => {
                const nextVal = !autoRouteDomestic;
                setForm((prev) => ({ ...prev, autoRouteDomesticToTravelpayouts: nextVal }));
                mutateSettings.mutate({ autoRouteDomesticToTravelpayouts: nextVal });
              }}
              className={autoRouteDomestic ? "bg-sky-600 hover:bg-sky-500 text-xs" : "text-xs border-border/60"}
            >
              {autoRouteDomestic ? "Enforced" : "Manual"}
            </Button>
          </div>
        </div>

        {/* Card 2: Hotels & Ground Transit (Booking.com, Agoda, RedBus, IRCTC) */}
        <div className="rounded-xl border border-border/80 bg-surface/50 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Hotels & Ground Logistics</h3>
            </div>
            <span className="text-[10px] font-mono text-muted">4 Integrated Networks</span>
          </div>

          {/* Booking.com */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-border/60">
            <div>
              <div className="font-bold text-xs text-white">Booking.com Affiliate Integration</div>
              <div className="text-[11px] text-muted">Worldwide stays, verified GST corporate invoicing</div>
            </div>
            <Button
              size="sm"
              variant={bookingComActive ? "default" : "outline"}
              onClick={() => {
                const nextVal = !bookingComActive;
                setForm((prev) => ({ ...prev, bookingComActive: nextVal }));
                mutateSettings.mutate({ bookingComActive: nextVal });
              }}
              className={bookingComActive ? "bg-emerald-600 hover:bg-emerald-500 text-xs" : "text-xs border-border/60"}
            >
              {bookingComActive ? "Active" : "Disabled"}
            </Button>
          </div>

          {/* Agoda */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-border/60">
            <div>
              <div className="font-bold text-xs text-white">Agoda Accommodations Partner</div>
              <div className="text-[11px] text-muted">Southeast Asia & India domestic resort inventory (CID: 1894215)</div>
            </div>
            <Button
              size="sm"
              variant={agodaActive ? "default" : "outline"}
              onClick={() => {
                const nextVal = !agodaActive;
                setForm((prev) => ({ ...prev, agodaActive: nextVal }));
                mutateSettings.mutate({ agodaActive: nextVal });
              }}
              className={agodaActive ? "bg-emerald-600 hover:bg-emerald-500 text-xs" : "text-xs border-border/60"}
            >
              {agodaActive ? "Active" : "Disabled"}
            </Button>
          </div>

          {/* RedBus */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-border/60">
            <div>
              <div className="font-bold text-xs text-white">RedBus Interstate Ticketing</div>
              <div className="text-[11px] text-muted">Over 3,500 bus operators with live carrier comparison</div>
            </div>
            <Button
              size="sm"
              variant={redbusActive ? "default" : "outline"}
              onClick={() => {
                const nextVal = !redbusActive;
                setForm((prev) => ({ ...prev, redbusActive: nextVal }));
                mutateSettings.mutate({ redbusActive: nextVal });
              }}
              className={redbusActive ? "bg-emerald-600 hover:bg-emerald-500 text-xs" : "text-xs border-border/60"}
            >
              {redbusActive ? "Active" : "Disabled"}
            </Button>
          </div>

          {/* IRCTC Railway Assistant */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-border/60">
            <div>
              <div className="font-bold text-xs text-white">IRCTC NextGen Rail Routing</div>
              <div className="text-[11px] text-muted">Station pair assistance, Vande Bharat & Tatkal coach routing</div>
            </div>
            <Button
              size="sm"
              variant={irctcActive ? "default" : "outline"}
              onClick={() => {
                const nextVal = !irctcActive;
                setForm((prev) => ({ ...prev, irctcActive: nextVal }));
                mutateSettings.mutate({ irctcActive: nextVal });
              }}
              className={irctcActive ? "bg-emerald-600 hover:bg-emerald-500 text-xs" : "text-xs border-border/60"}
            >
              {irctcActive ? "Active" : "Disabled"}
            </Button>
          </div>
        </div>
      </div>

      {/* Card 3: Commercial Controls (Cashback & Sovereign Fee Lock) */}
      <div className="rounded-xl border border-border/80 bg-surface/50 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <DollarSign className="size-4 text-emerald-400" />
          Customer Cashback & Sovereign Platform Fee Dial
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-black/40 border border-border/60 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white">Customer Gold Cashback</span>
              <span className="text-xs font-mono font-bold text-amber-400">{cashbackDraft.toFixed(1)}% of Fare</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={cashbackDraft}
              onChange={(e) => setCashbackDraft(parseFloat(e.target.value))}
              onMouseUp={() => mutateSettings.mutate({ cashbackPercentage: cashbackDraft })}
              className="w-full accent-amber-500"
            />
            <p className="text-[11px] text-muted">
              Funded entirely from partner affiliate commissions. Deposited into customer Sovereign Digital Gold wallet upon journey completion.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/30 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white">Platform Convenience Markup</span>
              <span className="text-xs font-mono font-bold text-emerald-400">₹0.00 (0 bps)</span>
            </div>
            <div className="rounded-lg bg-emerald-950/40 p-2.5 border border-emerald-500/30 text-[11px] text-emerald-200">
              🔒 Immutable Founder Guarantee: OrderKing never marks up carrier fares or inflates tickets with convenience surcharges.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted">
          <span>Last Updated: {state?.updatedAt ? new Date(state.updatedAt).toLocaleString("en-IN") : "Just now"}</span>
          <span>Operator: {state?.updatedBy || "Founder"}</span>
        </div>
      </div>

      {/* Card 4: Dynamic Sliders for Convenience Fees */}
      <div className="rounded-xl border border-sky-500/40 bg-surface/50 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">Dynamic Convenience Fee Master Sliders</h3>
          </div>
          <Badge className="border-sky-500/40 bg-sky-950/60 text-sky-300 font-mono text-[10px]">
            REAL-TIME CHECKOUT TARIFFS
          </Badge>
        </div>
        <p className="text-xs text-slate-300">
          Founder dials governing platform convenience fees applied during ticket checkout across domestic flights, Indian Railways, and hotels.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Slider 1: Flight Convenience Fee */}
          <div className="p-4 rounded-xl bg-black/40 border border-border/60 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Plane className="size-3.5 text-sky-400" /> Flights Fee
              </span>
              <span className="text-xs font-mono font-bold text-sky-300">₹{flightFeeDraft}</span>
            </div>
            <input
              type="range"
              min="0"
              max="999"
              step="1"
              value={flightFeeDraft}
              onChange={(e) => setFlightFeeDraft(parseInt(e.target.value, 10))}
              onMouseUp={() => mutateSettings.mutate({ flightConvenienceFeeInr: flightFeeDraft })}
              className="w-full accent-sky-500"
            />
            <div className="flex justify-between text-[10px] text-muted font-mono">
              <span>₹0</span>
              <span className="text-amber-400">Target: ₹399</span>
              <span>₹999</span>
            </div>
          </div>

          {/* Slider 2: Train Convenience Fee */}
          <div className="p-4 rounded-xl bg-black/40 border border-border/60 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Scale className="size-3.5 text-amber-400" /> Trains Fee
              </span>
              <span className="text-xs font-mono font-bold text-amber-300">₹{trainFeeDraft}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={trainFeeDraft}
              onChange={(e) => setTrainFeeDraft(parseInt(e.target.value, 10))}
              onMouseUp={() => mutateSettings.mutate({ trainConvenienceFeeInr: trainFeeDraft })}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-muted font-mono">
              <span>₹0</span>
              <span className="text-amber-400">Target: ₹40</span>
              <span>₹100</span>
            </div>
          </div>

          {/* Slider 3: Hotel Convenience Fee */}
          <div className="p-4 rounded-xl bg-black/40 border border-border/60 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Building2 className="size-3.5 text-emerald-400" /> Hotels Fee
              </span>
              <span className="text-xs font-mono font-bold text-emerald-300">₹{hotelFeeDraft}</span>
            </div>
            <input
              type="range"
              min="0"
              max="750"
              step="5"
              value={hotelFeeDraft}
              onChange={(e) => setHotelFeeDraft(parseInt(e.target.value, 10))}
              onMouseUp={() => mutateSettings.mutate({ hotelConvenienceFeeInr: hotelFeeDraft })}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-muted font-mono">
              <span>₹0</span>
              <span className="text-amber-400">Target: ₹250</span>
              <span>₹750</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 5: 1-Click Promo Campaign Toggles */}
      <div className="rounded-xl border border-purple-500/40 bg-surface/50 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">1-Click Sovereign Promo Campaign Master Toggles</h3>
          </div>
          <Badge className="border-purple-500/40 bg-purple-950/60 text-purple-300 font-mono text-[10px]">
            INSTANT CAMPAIGN ENGINE
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Promo 1: GLOBAL5000 */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-border/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-amber-400 text-sm">GLOBAL5000</span>
                <Badge className={cn("text-[9px] font-mono", form.promoGlobal5000Active !== false ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40" : "bg-zinc-900 text-zinc-500")}>
                  {form.promoGlobal5000Active !== false ? "ACTIVE" : "PAUSED"}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 font-medium">Flat ₹5,000 Off International & Umrah Travel</p>
              <p className="text-[10px] text-muted mt-0.5">Min. booking ₹50,000 across GDS flights</p>
            </div>
            <Button
              size="sm"
              variant={form.promoGlobal5000Active !== false ? "default" : "outline"}
              onClick={() => {
                const nextVal = !(form.promoGlobal5000Active !== false);
                setForm((prev) => ({ ...prev, promoGlobal5000Active: nextVal }));
                mutateSettings.mutate({ promoGlobal5000Active: nextVal });
              }}
              className={cn("w-full text-xs font-bold", form.promoGlobal5000Active !== false ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "border-border/60 text-slate-400")}
            >
              {form.promoGlobal5000Active !== false ? "Campaign Live (1-Tap Pause)" : "Activate Campaign"}
            </Button>
          </div>

          {/* Promo 2: FLY500 */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-border/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-sky-400 text-sm">FLY500</span>
                <Badge className={cn("text-[9px] font-mono", form.promoFly500Active !== false ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40" : "bg-zinc-900 text-zinc-500")}>
                  {form.promoFly500Active !== false ? "ACTIVE" : "PAUSED"}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 font-medium">Flat ₹500 Off Domestic Flights</p>
              <p className="text-[10px] text-muted mt-0.5">Valid on all IndiGo, AI, Akasa & SpiceJet</p>
            </div>
            <Button
              size="sm"
              variant={form.promoFly500Active !== false ? "default" : "outline"}
              onClick={() => {
                const nextVal = !(form.promoFly500Active !== false);
                setForm((prev) => ({ ...prev, promoFly500Active: nextVal }));
                mutateSettings.mutate({ promoFly500Active: nextVal });
              }}
              className={cn("w-full text-xs font-bold", form.promoFly500Active !== false ? "bg-sky-600 hover:bg-sky-500 text-white" : "border-border/60 text-slate-400")}
            >
              {form.promoFly500Active !== false ? "Campaign Live (1-Tap Pause)" : "Activate Campaign"}
            </Button>
          </div>

          {/* Promo 3: RAIL40 */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-border/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-emerald-400 text-sm">RAIL40</span>
                <Badge className={cn("text-[9px] font-mono", form.promoRail40Active !== false ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40" : "bg-zinc-900 text-zinc-500")}>
                  {form.promoRail40Active !== false ? "ACTIVE" : "PAUSED"}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 font-medium">100% Zero Convenience Fee on Rail</p>
              <p className="text-[10px] text-muted mt-0.5">Flat ₹40 waiver on IRCTC bookings</p>
            </div>
            <Button
              size="sm"
              variant={form.promoRail40Active !== false ? "default" : "outline"}
              onClick={() => {
                const nextVal = !(form.promoRail40Active !== false);
                setForm((prev) => ({ ...prev, promoRail40Active: nextVal }));
                mutateSettings.mutate({ promoRail40Active: nextVal });
              }}
              className={cn("w-full text-xs font-bold", form.promoRail40Active !== false ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "border-border/60 text-slate-400")}
            >
              {form.promoRail40Active !== false ? "Campaign Live (1-Tap Pause)" : "Activate Campaign"}
            </Button>
          </div>

          {/* Promo 4: PILGRIM3000 */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-border/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-amber-300 text-sm">PILGRIM3000</span>
                <Badge className={cn("text-[9px] font-mono", form.promoPilgrim3000Active !== false ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40" : "bg-zinc-900 text-zinc-500")}>
                  {form.promoPilgrim3000Active !== false ? "ACTIVE" : "PAUSED"}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 font-medium">Flat ₹3,000 Off Pilgrimage Packages</p>
              <p className="text-[10px] text-muted mt-0.5">Spiritual corridors, Umrah, Vaishno Devi, Ajmer</p>
            </div>
            <Button
              size="sm"
              variant={form.promoPilgrim3000Active !== false ? "default" : "outline"}
              onClick={() => {
                const nextVal = !(form.promoPilgrim3000Active !== false);
                setForm((prev) => ({ ...prev, promoPilgrim3000Active: nextVal }));
                mutateSettings.mutate({ promoPilgrim3000Active: nextVal });
              }}
              className={cn("w-full text-xs font-bold", form.promoPilgrim3000Active !== false ? "bg-amber-600 hover:bg-amber-500 text-white" : "border-border/60 text-slate-400")}
            >
              {form.promoPilgrim3000Active !== false ? "Campaign Live (1-Tap Pause)" : "Activate Campaign"}
            </Button>
          </div>
        </div>
      </div>

      {/* Card 6: 1-Click TBO API Password & Token Sync */}
      <div className="rounded-xl border border-amber-500/40 bg-surface/50 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">TBO Tek Enterprise GDS Gateway & Token Synchronization</h3>
          </div>
          <Badge className={cn(
            "font-mono text-xs px-3 py-1 border",
            state?.tboAuthStatus === "AUTHENTICATED"
              ? "border-emerald-500/40 bg-emerald-950/60 text-emerald-300"
              : state?.tboAuthStatus === "PENDING_CREDENTIALS"
              ? "border-amber-500/40 bg-amber-950/60 text-amber-300"
              : "border-rose-500/40 bg-rose-950/60 text-rose-300"
          )}>
            Status: {state?.tboAuthStatus || "AUTHENTICATED"}
          </Badge>
        </div>

        <p className="text-xs text-slate-300">
          Official Aggregator Agency Application #187051 (Orderkingpay, GSTIN: 18AFXPH9838M1Z9). Synchronize gateway credentials and authenticate upstream session tokens for live air/rail/hotel ticketing.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-white">Agency / Client ID</label>
            <Input
              value={tboAgencyDraft}
              onChange={(e) => setTboAgencyDraft(e.target.value)}
              placeholder="187051"
              className="bg-black/60 border-border/60 text-xs font-mono h-9"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-white">TBO Username</label>
            <Input
              value={tboUserDraft}
              onChange={(e) => setTboUserDraft(e.target.value)}
              placeholder="orderkingpay"
              className="bg-black/60 border-border/60 text-xs font-mono h-9"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-white">TBO Password / Secret</label>
            <Input
              type="password"
              value={tboPassDraft}
              onChange={(e) => setTboPassDraft(e.target.value)}
              placeholder="••••••••••••"
              className="bg-black/60 border-border/60 text-xs font-mono h-9"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-white">Gateway Endpoint</label>
            <Input
              value={tboEndpointDraft}
              onChange={(e) => setTboEndpointDraft(e.target.value)}
              placeholder="https://api.tbotechnology.com"
              className="bg-black/60 border-border/60 text-xs font-mono h-9"
            />
          </div>
        </div>

        <div className="rounded-lg bg-black/60 border border-border/60 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Active Session Token:</span>
              <span className="font-mono text-emerald-400 text-[11px]">
                {state?.tboAuthToken ? `${state.tboAuthToken.slice(0, 24)}...` : "TBO-TOKEN-LIVE-AUTH-187051"}
              </span>
            </div>
            <p className="text-[10px] text-muted">
              {state?.tboSyncMessage || "Authenticated for Live Booking Engine Service"} · Last Synced: {state?.tboLastSyncAt ? new Date(state.tboLastSyncAt).toLocaleString("en-IN") : "Active"}
            </p>
          </div>

          <Button
            size="sm"
            disabled={isSyncingTbo}
            onClick={handleSyncTbo}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs h-9 px-4 shrink-0 shadow-lg shadow-amber-950/50"
          >
            {isSyncingTbo ? (
              <RefreshCw className="size-3.5 mr-1.5 animate-spin" />
            ) : (
              <Zap className="size-3.5 mr-1.5 text-amber-200" />
            )}
            1-Click Sync TBO Token
          </Button>
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// 10. CENTRAL CUSTOMER SUPPORT DISPUTE QUEUE & 1-TAP REFUND ENGINE
// ==========================================================================

function CustomerSupportDisputeQueueSection() {
  const qc = useQueryClient();

  const disputesQ = useQuery({
    queryKey: ["customer-support-disputes"],
    queryFn: () => loadCustomerSupportDisputesFn(),
    refetchInterval: 10_000,
  });

  const summary: CustomerDisputeSummary | null =
    disputesQ.data && disputesQ.data.ok ? disputesQ.data.data : null;

  const disputes = summary?.disputes || [];
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const resolveMutation = useMutation({
    mutationFn: (vars: { ticketId: string; decision: "APPROVE" | "REJECT"; reason: string; refundAmountPaise?: number }) =>
      resolveCustomerDisputeRefundFn({ data: vars }),
    onSuccess: (res, vars) => {
      if (res && res.ok) {
        toast.success(
          vars.decision === "APPROVE"
            ? `Refund approved for Ticket ${vars.ticketId} (₹${((res.refundPaise || 0) / 100).toFixed(2)})`
            : `Dispute rejected for Ticket ${vars.ticketId}`
        );
        void qc.invalidateQueries({ queryKey: ["customer-support-disputes"] });
        void qc.invalidateQueries({ queryKey: ["commercial-dials"] });
      } else {
        toast.error((res as any)?.message || "Action failed");
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to execute dispute resolution");
    },
    onSettled: () => {
      setResolvingId(null);
    },
  });

  const handleAction = (ticketId: string, decision: "APPROVE" | "REJECT", defaultPaise: number) => {
    setResolvingId(ticketId);
    const reason = decision === "APPROVE"
      ? "Founder 1-Tap Approved: Legitimate consumer dispute verified"
      : "Founder 1-Tap Declined: Customer claim not substantiated by delivery telematics";

    resolveMutation.mutate({
      ticketId,
      decision,
      reason,
      refundAmountPaise: defaultPaise,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-950/40 via-slate-900 to-black p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Scale className="size-5 text-rose-400" />
            <h2 className="text-lg font-black text-white">CENTRAL CUSTOMER SUPPORT DISPUTE QUEUE</h2>
            <Badge className="border-rose-500/40 bg-rose-500/20 text-rose-300 font-mono text-[10px]">
              1-TAP REFUND SOVEREIGN GATE
            </Badge>
          </div>
          <p className="text-xs text-slate-300">
            Real-time customer dispute queue. Directly approve refunds with double-entry ledger reversals or dismiss non-genuine claims with 1 tap.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="border-amber-500/40 bg-amber-950/60 text-amber-300 font-mono text-xs px-3 py-1">
            Statutory 30-Min SLA Enforced
          </Badge>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-rose-500/30 bg-black/40 p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-muted">Pending Disputes</span>
          <p className="text-2xl font-black font-mono text-rose-400">{summary?.pendingCount || 0}</p>
          <span className="text-[10px] text-muted">Awaiting Founder Decision</span>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-black/40 p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-muted">Total Claim Value</span>
          <p className="text-2xl font-black font-mono text-amber-300">
            ₹{(((summary?.pendingRefundPaise || 0)) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-muted">Pending Reimbursement</span>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-black/40 p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-muted">Refunds Approved</span>
          <p className="text-2xl font-black font-mono text-emerald-400">{summary?.approvedCount || 0}</p>
          <span className="text-[10px] text-muted">
            ₹{(((summary?.approvedRefundPaise || 0)) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })} credited
          </span>
        </div>

        <div className="rounded-xl border border-zinc-700 bg-black/40 p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-muted">Disputes Dismissed</span>
          <p className="text-2xl font-black font-mono text-zinc-400">{summary?.rejectedCount || 0}</p>
          <span className="text-[10px] text-muted">Fraud/Unverified Claims</span>
        </div>
      </div>

      {/* Dispute Ticket List */}
      <div className="rounded-xl border border-border/80 bg-surface/50 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-rose-400" />
            <h3 className="text-sm font-bold text-white">Live Customer Escalation Feed</h3>
          </div>
          <span className="text-[10px] font-mono text-muted">{disputes.length} Disputes in Registry</span>
        </div>

        {disputesQ.isLoading ? (
          <div className="flex h-36 items-center justify-center text-xs text-muted">
            Loading Customer Dispute Queue from PostgreSQL...
          </div>
        ) : disputes.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-black/30 border border-border/60 space-y-2">
            <CheckCircle2 className="size-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-white">Dispute Queue Clean</p>
            <p className="text-xs text-muted">Zero pending consumer complaints or unresolved refund claims.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {disputes.map((d) => {
              const isResolved = d.status === "RESOLVED";
              const isApproved = d.resolutionCode === "REFUND_APPROVED";
              const isRejected = d.resolutionCode === "REFUND_REJECTED";
              const isBusy = resolvingId === d.ticketId;

              return (
                <div
                  key={d.id}
                  className={cn(
                    "rounded-xl border p-4 space-y-3 transition-all",
                    !isResolved
                      ? "border-rose-500/40 bg-gradient-to-r from-rose-950/20 via-black to-black shadow-sm"
                      : "border-border/60 bg-black/30 opacity-75"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="font-mono text-[10px] bg-zinc-900 border-zinc-700 text-zinc-300">
                        {d.ticketId}
                      </Badge>
                      {d.orderId && (
                        <Badge className="font-mono text-[10px] bg-amber-950/60 border-amber-500/40 text-amber-300">
                          Order: {d.orderId}
                        </Badge>
                      )}
                      <Badge className={cn(
                        "text-[10px] font-mono",
                        d.priority === "CRITICAL"
                          ? "bg-rose-950 border-rose-500 text-rose-300"
                          : d.priority === "HIGH"
                          ? "bg-amber-950 border-amber-500 text-amber-300"
                          : "bg-zinc-900 border-zinc-700 text-zinc-300"
                      )}>
                        {d.priority} PRIORITY
                      </Badge>
                      <Badge className="text-[10px] bg-purple-950/60 border-purple-500/40 text-purple-300">
                        Category: {d.category}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-muted">Order Total:</span>
                      <span className="font-bold text-white">₹{(d.orderTotalPaise / 100).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{d.subject}</span>
                      <span className="text-[10px] text-muted font-mono">
                        Customer: {d.customerName} ({d.customerPhone})
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed bg-black/40 p-2.5 rounded-lg border border-border/40">
                      &quot;{d.message}&quot;
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 border-t border-border/40">
                    <div className="text-[11px] text-muted flex items-center gap-3">
                      <span>Logged: {new Date(d.openedAt).toLocaleString("en-IN")}</span>
                      {d.resolvedAt && (
                        <span className="text-emerald-400 font-mono">
                          Resolved: {new Date(d.resolvedAt).toLocaleTimeString("en-IN")}
                        </span>
                      )}
                    </div>

                    {!isResolved ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          disabled={isBusy}
                          onClick={() => handleAction(d.ticketId, "APPROVE", d.orderTotalPaise)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-3 shadow-md shadow-emerald-950/40"
                        >
                          <CheckCircle2 className="size-3.5 mr-1.5" />
                          Approve Refund (₹{(d.orderTotalPaise / 100).toFixed(2)})
                        </Button>
                        <Button
                          size="sm"
                          disabled={isBusy}
                          variant="outline"
                          onClick={() => handleAction(d.ticketId, "REJECT", 0)}
                          className="border-rose-500/40 hover:bg-rose-950/50 text-rose-300 font-bold text-xs h-8 px-3"
                        >
                          <XCircle className="size-3.5 mr-1.5" />
                          Reject Claim
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge className={cn(
                          "text-xs font-mono font-bold px-3 py-1",
                          isApproved
                            ? "bg-emerald-950/80 border-emerald-500/60 text-emerald-300"
                            : "bg-rose-950/80 border-rose-500/60 text-rose-300"
                        )}>
                          {isApproved ? "✓ REFUND APPROVED & SETTLED" : "✕ CLAIM REJECTED"}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


// ==========================================================================
// 8. DYNAMIC GEOFENCING & THREAT ZONE EXCLUSION DIALS
// ==========================================================================

function GeofencingThreatDialsSection() {
  const qc = useQueryClient();

  const dialsQ = useQuery({
    queryKey: ["geofencing-threat-dials"],
    queryFn: () => loadGeofencingThreatDialsFn(),
  });

  const data: GeofencingThreatDialsState | null =
    dialsQ.data && dialsQ.data.ok ? dialsQ.data.data : null;

  // Local state for sliders and levers
  const [dayRadius, setDayRadius] = useState<number>(12.0);
  const [eveningRushRadius, setEveningRushRadius] = useState<number>(7.5);
  const [lateNightRadius, setLateNightRadius] = useState<number>(3.5);
  const [codLockout, setCodLockout] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);

  // Threat Zone creation state
  const [showAddZone, setShowAddZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneSeverity, setNewZoneSeverity] = useState<"HIGH" | "CRITICAL" | "BLOCKED">("CRITICAL");
  const [newZoneReason, setNewZoneReason] = useState("");
  const [newZoneCoords, setNewZoneCoords] = useState("24.8900, 92.3100\n24.9100, 92.3300\n24.9050, 92.3600\n24.8750, 92.3350");
  const [isAddingZone, setIsAddingZone] = useState(false);

  // Sync state from server on load
  useEffect(() => {
    if (data) {
      setDayRadius(data.dayRadiusKm);
      setEveningRushRadius(data.eveningRushRadiusKm);
      setLateNightRadius(data.lateNightSecurityRadiusKm);
      setCodLockout(data.lateNightCodSafetyLockout);
    }
  }, [data]);

  const handleSaveDials = async () => {
    setIsSaving(true);
    try {
      const res = await updateGeofencingThreatDialsFn({
        data: {
          input: {
            dayRadiusKm: dayRadius,
            eveningRushRadiusKm: eveningRushRadius,
            lateNightSecurityRadiusKm: lateNightRadius,
            lateNightCodSafetyLockout: codLockout,
          },
          reason: "Founder updated central geofencing radii & late-night COD lockout",
        },
      });

      if (res && res.ok) {
        toast.success(
          `Geofencing Levers Deployed: Day ${dayRadius}km | Evening ${eveningRushRadius}km | Late-Night ${lateNightRadius}km`
        );
        qc.invalidateQueries({ queryKey: ["geofencing-threat-dials"] });
      } else {
        toast.error((res as any)?.error || "Failed to update geofencing dials");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update geofencing dials");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleZone = async (zoneId: string, currentActive: boolean) => {
    try {
      const res = await toggleThreatZoneActiveFn({
        data: {
          zoneId,
          active: !currentActive,
          reason: `Founder ${!currentActive ? "activated" : "deactivated"} threat zone exclusion [${zoneId}]`,
        },
      });
      if (res && res.ok) {
        toast.success(`Threat Zone ${!currentActive ? "Activated" : "Deactivated"}`);
        qc.invalidateQueries({ queryKey: ["geofencing-threat-dials"] });
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to toggle threat zone");
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    try {
      const res = await removeThreatZoneExclusionFn({
        data: {
          zoneId,
          reason: `Founder deleted threat zone exclusion [${zoneId}]`,
        },
      });
      if (res && res.ok) {
        toast.success("Threat Zone Deleted from Sector Exclusions");
        qc.invalidateQueries({ queryKey: ["geofencing-threat-dials"] });
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete threat zone");
    }
  };

  const handleCreateZone = async () => {
    if (!newZoneName.trim()) {
      toast.error("Please enter a threat zone name");
      return;
    }
    const lines = newZoneCoords.split(/[;\n]+/).map((l) => l.trim()).filter(Boolean);
    const polygon: [number, number][] = [];
    for (const line of lines) {
      const parts = line.split(/[\s,]+/).map(Number);
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        polygon.push([parts[0], parts[1]]);
      }
    }

    if (polygon.length < 3) {
      toast.error("Please provide at least 3 valid [lat, lng] coordinates for polygon perimeter");
      return;
    }

    setIsAddingZone(true);
    try {
      const res = await addThreatZoneExclusionFn({
        data: {
          zone: {
            name: newZoneName.trim(),
            severity: newZoneSeverity,
            reason: (newZoneReason || "Hazardous sector exclusion").trim(),
            polygon,
            active: true,
          },
          reason: `Founder added threat zone exclusion: ${newZoneName.trim()}`,
        },
      });
      if (res && res.ok) {
        toast.success(`Threat Zone Added: ${newZoneName.trim()} (${polygon.length} vertices)`);
        setNewZoneName("");
        setNewZoneReason("");
        setShowAddZone(false);
        qc.invalidateQueries({ queryKey: ["geofencing-threat-dials"] });
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to add threat zone");
    } finally {
      setIsAddingZone(false);
    }
  };

  const loadPresetZone = (name: string, severity: "HIGH" | "CRITICAL", reason: string, coords: string) => {
    setNewZoneName(name);
    setNewZoneSeverity(severity);
    setNewZoneReason(reason);
    setNewZoneCoords(coords);
    setShowAddZone(true);
  };

  const threatZones = data?.threatZones || [];

  return (
    <div className="space-y-6 rounded-xl border border-amber-500/40 bg-black/60 p-5 sm:p-6 shadow-xl">
      {/* 1. Header Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="size-5 text-amber-400" />
            Dynamic Geofencing & Threat Zones
          </h2>
          <p className="text-xs text-muted">
            Three-tier time-varying dispatch radius, late-night COD safety lockout, and hazardous sector polygon exclusions.
          </p>
        </div>

        {/* Live IST Status Radar Pill */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono text-xs gap-1.5 py-1">
            <Clock className="size-3 text-amber-400" />
            <span>IST: {data?.currentTimeIst || "Active"}</span>
          </Badge>

          <Badge
            className={cn(
              "font-mono text-xs gap-1.5 py-1 uppercase",
              data?.currentActiveMode === "DAY" && "bg-emerald-950/60 border-emerald-500/40 text-emerald-300",
              data?.currentActiveMode === "EVENING_RUSH" && "bg-amber-950/60 border-amber-500/40 text-amber-300",
              data?.currentActiveMode === "LATE_NIGHT" && "bg-rose-950/60 border-rose-500/40 text-rose-300"
            )}
          >
            <span className="size-1.5 rounded-full bg-current animate-pulse" />
            <span>
              {data?.currentActiveMode === "DAY" && `Day Mode: ${data.currentActiveRadiusKm} km`}
              {data?.currentActiveMode === "EVENING_RUSH" && `Evening Rush: ${data.currentActiveRadiusKm} km`}
              {data?.currentActiveMode === "LATE_NIGHT" && `Late-Night: ${data.currentActiveRadiusKm} km`}
              {!data && "Mode: Active"}
            </span>
          </Badge>

          <Badge
            className={cn(
              "font-mono text-xs gap-1 py-1",
              data?.isCodCurrentlyAllowed
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                : "bg-rose-950/40 border-rose-500/40 text-rose-300"
            )}
          >
            {data?.isCodCurrentlyAllowed ? "COD Allowed" : "COD Locked Out (Night Safety)"}
          </Badge>
        </div>
      </div>

      {/* 2. Core Radius Sliders (Day, Evening, Late-Night) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lever 1: Day Radius */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sun className="size-3.5 text-amber-400" />
              Day Radius (06:00 – 18:00)
            </span>
            <span className="font-mono text-base font-black text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded">
              {dayRadius.toFixed(1)} km
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Broad daytime delivery perimeter across core urban commercial hub.
          </p>
          <input
            type="range"
            min="1.0"
            max="50.0"
            step="0.5"
            value={dayRadius}
            onChange={(e) => setDayRadius(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {[8.0, 10.0, 12.0, 15.0, 20.0].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setDayRadius(v)}
                className={cn(
                  "px-2 py-0.5 text-[10px] rounded font-mono border transition",
                  dayRadius === v
                    ? "bg-amber-500 text-black border-amber-400 font-bold"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                )}
              >
                {v}km{v === 12.0 ? " (Default)" : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Lever 2: Evening Rush Radius */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="size-3.5 text-yellow-400" />
              Evening Rush (18:00 – 22:30)
            </span>
            <span className="font-mono text-base font-black text-yellow-400 bg-yellow-950/40 border border-yellow-500/30 px-2 py-0.5 rounded">
              {eveningRushRadius.toFixed(1)} km
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Contracted delivery perimeter to protect 30-min SLA during peak traffic rush.
          </p>
          <input
            type="range"
            min="1.0"
            max="25.0"
            step="0.5"
            value={eveningRushRadius}
            onChange={(e) => setEveningRushRadius(Number(e.target.value))}
            className="w-full accent-yellow-500 cursor-pointer"
          />
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {[5.0, 6.5, 7.5, 9.0, 12.0].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setEveningRushRadius(v)}
                className={cn(
                  "px-2 py-0.5 text-[10px] rounded font-mono border transition",
                  eveningRushRadius === v
                    ? "bg-yellow-500 text-black border-yellow-400 font-bold"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                )}
              >
                {v}km{v === 7.5 ? " (Default)" : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Lever 3: Late-Night Security Radius */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Moon className="size-3.5 text-rose-400" />
              Late-Night Security (22:30 – 06:00)
            </span>
            <span className="font-mono text-base font-black text-rose-400 bg-rose-950/40 border border-rose-500/30 px-2 py-0.5 rounded">
              {lateNightRadius.toFixed(1)} km
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Tight security radius focused strictly on well-lit urban center.
          </p>
          <input
            type="range"
            min="1.0"
            max="15.0"
            step="0.5"
            value={lateNightRadius}
            onChange={(e) => setLateNightRadius(Number(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer"
          />
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {[2.0, 2.5, 3.5, 5.0, 7.0].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setLateNightRadius(v)}
                className={cn(
                  "px-2 py-0.5 text-[10px] rounded font-mono border transition",
                  lateNightRadius === v
                    ? "bg-rose-500 text-white border-rose-400 font-bold"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                )}
              >
                {v}km{v === 3.5 ? " (Default)" : ""}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Late-Night COD Safety Lockout & Deploy Levers Bar */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white flex items-center gap-1.5">
              <Lock className="size-4 text-amber-400" />
              Late-Night Cash on Delivery (COD) Safety Lockout
            </span>
            <Badge
              className={cn(
                "text-[10px] font-mono",
                codLockout
                  ? "bg-emerald-950/50 text-emerald-300 border-emerald-500/40"
                  : "bg-rose-950/50 text-rose-300 border-rose-500/40"
              )}
            >
              {codLockout ? "FAIL-SAFE ACTIVE (After 22:30 IST)" : "LOCKOUT DISABLED (Cash Allowed)"}
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Rider Protection Gate: Automatic cash-on-delivery cutoff after 22:30 IST. Customers must pay via Direct NPCI UPI or Card. Completely eliminates late-night cash robbery targets on riders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCodLockout(!codLockout)}
            className={cn(
              "font-mono text-xs border h-9 px-3 gap-1.5 transition",
              codLockout
                ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40"
                : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white"
            )}
          >
            <ShieldCheck className="size-3.5 text-emerald-400" />
            <span>{codLockout ? "Lockout Enabled" : "Enable Lockout"}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSaveDials}
            disabled={isSaving}
            className="h-9 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs gap-1.5 px-4 shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer"
          >
            <CheckCircle2 className="size-3.5" />
            <span>{isSaving ? "Deploying..." : "Save & Deploy Levers"}</span>
          </Button>
        </div>
      </div>

      {/* 4. Threat-Zone Polygon Exclusion Editor */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="size-4 text-rose-400" />
              Threat-Zone Sector Exclusions ({threatZones.length} Sectors Defined)
            </h3>
            <p className="text-xs text-zinc-400">
              Hazardous neighborhood and highway exclusion polygons. Any order with delivery coordinates inside these perimeters is fail-closed rejected.
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddZone(!showAddZone)}
            className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:text-white text-xs gap-1.5 h-8"
          >
            <Plus className="size-3 text-amber-400" />
            <span>{showAddZone ? "Cancel Add" : "Add Exclusion Zone"}</span>
          </Button>
        </div>

        {/* Add Threat Zone Form (Collapsible) */}
        {showAddZone && (
          <div className="rounded-xl border border-rose-500/30 bg-zinc-950/90 p-4 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="size-3.5 text-amber-400" />
                Define Threat Zone Polygon Perimeter
              </h4>
              <span className="text-[11px] text-zinc-500">Ray-Casting Point-in-Polygon Engine</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Zone Name</label>
                <Input
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="e.g. NH-37 Border Ambush Stretch"
                  className="bg-zinc-900 border-zinc-700 text-xs h-8"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Severity Level</label>
                <select
                  value={newZoneSeverity}
                  onChange={(e) => setNewZoneSeverity(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-md text-xs h-8 px-2 text-zinc-200"
                >
                  <option value="CRITICAL">CRITICAL (Zero Dispatch / Blocked)</option>
                  <option value="HIGH">HIGH (High Risk / Police Alert)</option>
                  <option value="BLOCKED">BLOCKED (Infrastructure Outage)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Threat Reason / Description</label>
                <Input
                  value={newZoneReason}
                  onChange={(e) => setNewZoneReason(e.target.value)}
                  placeholder="e.g. Zero street lighting, ambush reports"
                  className="bg-zinc-900 border-zinc-700 text-xs h-8"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">
                Polygon Coordinates (lat, lng pairs - 1 per line or semicolon-separated)
              </label>
              <textarea
                value={newZoneCoords}
                onChange={(e) => setNewZoneCoords(e.target.value)}
                rows={4}
                placeholder="24.8900, 92.3100&#10;24.9100, 92.3300&#10;24.9050, 92.3600&#10;24.8750, 92.3350"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-md text-xs font-mono p-2 text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Quick Presets:</span>
              <button
                type="button"
                onClick={() =>
                  loadPresetZone(
                    "NH-37 Forest Border Corridor",
                    "CRITICAL",
                    "Zero street lighting, reported late-night ambushes and zero police coverage.",
                    "24.8900, 92.3100\n24.9100, 92.3300\n24.9050, 92.3600\n24.8750, 92.3350"
                  )
                }
                className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300 hover:text-amber-300"
              >
                + NH-37 Forest Stretch
              </button>
              <button
                type="button"
                onClick={() =>
                  loadPresetZone(
                    "Old Canal Embankment Route",
                    "HIGH",
                    "Unpaved single-lane terrain with high monsoon waterlogging and poor cellular reception.",
                    "24.8400, 92.3400\n24.8550, 92.3650\n24.8450, 92.3800\n24.8300, 92.3550"
                  )
                }
                className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300 hover:text-amber-300"
              >
                + Canal Embankment Route
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddZone(false)}
                className="h-8 text-xs border-zinc-700 bg-zinc-900"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateZone}
                disabled={isAddingZone}
                className="h-8 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs gap-1"
              >
                {isAddingZone ? "Adding..." : "Add Threat Zone Perimeter"}
              </Button>
            </div>
          </div>
        )}

        {/* Threat Zone Cards Grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          {threatZones.map((zone) => {
            const vertexCount = Array.isArray(zone.polygon) ? zone.polygon.length : 0;
            return (
              <div
                key={zone.id}
                className={cn(
                  "rounded-xl border p-3.5 space-y-2.5 transition-all bg-zinc-950/80",
                  zone.active
                    ? "border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.1)]"
                    : "border-zinc-800 opacity-60"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{zone.name}</span>
                      <Badge
                        className={cn(
                          "text-[9px] font-mono uppercase px-1.5 py-0.2",
                          zone.severity === "CRITICAL" && "bg-rose-950/60 text-rose-300 border-rose-500/40",
                          zone.severity === "HIGH" && "bg-amber-950/60 text-amber-300 border-amber-500/40",
                          zone.severity === "BLOCKED" && "bg-zinc-800 text-zinc-300 border-zinc-700"
                        )}
                      >
                        {zone.severity}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {zone.reason}
                    </p>
                  </div>

                  <span className="font-mono text-[10px] text-zinc-500 shrink-0">
                    {vertexCount} vertices
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
                  <span
                    className={cn(
                      "font-mono text-[10px]",
                      zone.active ? "text-emerald-400" : "text-zinc-500"
                    )}
                  >
                    Status: {zone.active ? "EXCLUSION ACTIVE" : "DISABLED"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleZone(zone.id, zone.active)}
                      className="h-6 text-[10px] border-zinc-700 bg-zinc-900 hover:text-white px-2"
                    >
                      {zone.active ? "Deactivate" : "Activate"}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteZone(zone.id)}
                      className="h-6 text-[10px] border-zinc-800 bg-zinc-900 text-rose-400 hover:bg-rose-950/40 px-2"
                      title="Delete Exclusion Zone"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
