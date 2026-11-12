import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Crown,
  BarChart3,
  Bike,
  CreditCard,
  Brain,
  AlertTriangle,
  TrendingUp,
  PhoneCall,
  X,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatInrExact, formatNumber } from "@/lib/utils";
import {
  loadDashboard,
  loadFinance,
  loadRestaurants,
  loadRiders,
  loadSettlements,
} from "@/lib/orderking/actions";

interface OrderKingCommandSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteInChat?: (command: string) => void;
}

export function OrderKingCommandSuiteModal({
  isOpen,
  onClose,
  onExecuteInChat,
}: OrderKingCommandSuiteModalProps) {
  const [activeTab, setActiveTab] = useState<
    "reports" | "riders" | "payments" | "algorithm" | "weak_restaurants" | "growth" | "calling"
  >("reports");

  const dashQ = useQuery({
    queryKey: ["suite-dashboard"],
    queryFn: () => loadDashboard(),
    enabled: isOpen,
  });
  const ridersQ = useQuery({
    queryKey: ["suite-riders"],
    queryFn: () => loadRiders({ data: {} }),
    enabled: isOpen && (activeTab === "riders" || activeTab === "reports"),
  });
  const restQ = useQuery({
    queryKey: ["suite-restaurants"],
    queryFn: () => loadRestaurants({ data: {} }),
    enabled: isOpen && activeTab === "weak_restaurants",
  });
  const finQ = useQuery({
    queryKey: ["suite-finance"],
    queryFn: () => loadFinance(),
    enabled: isOpen && activeTab === "payments",
  });
  const settQ = useQuery({
    queryKey: ["suite-settlements"],
    queryFn: () => loadSettlements({ data: { party: "RESTAURANT" } }),
    enabled: isOpen && activeTab === "payments",
  });

  if (!isOpen) return null;

  const dash = dashQ.data && dashQ.data.ok ? dashQ.data.data : null;
  const today = dash?.today;
  const riders = ridersQ.data && ridersQ.data.ok ? ridersQ.data.data : [];
  const restaurants = restQ.data && restQ.data.ok ? restQ.data.data : [];
  const weakRestaurants = restaurants.filter((r) => r.rating < 4.3 || r.status !== "ACTIVE");
  const finance = finQ.data && finQ.data.ok ? finQ.data.data : null;
  const settlements = settQ.data && settQ.data.ok ? settQ.data.data : [];

  const notifyCallUnavailable = (target: string) => {
    toast.error(`Automated voice gateway is not configured for calling ${target}.`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-king-title"
    >
      <div className="flex h-[90vh] max-h-[820px] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border-2 border-emerald-500/40 bg-zinc-950 text-zinc-100 shadow-[0_10px_50px_rgba(0,0,0,0.8),0_0_40px_rgba(16,185,129,0.2)]">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-zinc-950 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-emerald-500 text-zinc-950 shadow-md">
              <Crown className="size-6 text-zinc-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="order-king-title" className="font-display text-lg font-black tracking-tight text-white">
                  Order King Command Suite
                </h2>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-mono">
                  EXECUTIVE OS
                </Badge>
              </div>
              <p className="text-xs text-zinc-400">
                Live PostgreSQL metrics: Reports, Fleet, Settlements, Kitchens &amp; Dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                void dashQ.refetch();
                void ridersQ.refetch();
                void restQ.refetch();
                void finQ.refetch();
                void settQ.refetch();
                toast.success("Refreshed live database metrics.");
              }}
              className="text-xs text-zinc-400 hover:text-white"
            >
              <RefreshCw className="size-3.5 mr-1" />
              Refresh Data
            </Button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-zinc-800/80 bg-zinc-900/50 px-4 py-2 text-xs scrollbar-none">
          {[
            { id: "reports", label: "All Reports", icon: BarChart3 },
            { id: "riders", label: "Rider Management", icon: Bike },
            { id: "payments", label: "Payment Cycles", icon: CreditCard },
            { id: "algorithm", label: "Live Telemetry", icon: Brain },
            { id: "weak_restaurants", label: "At-Risk Kitchens", icon: AlertTriangle },
            { id: "growth", label: "Growth Directives", icon: TrendingUp },
            { id: "calling", label: "Voice Dispatcher", icon: PhoneCall },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-all ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB CONTENTS */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: ALL REPORTS */}
          {activeTab === "reports" && (
            <div className="space-y-4">
              {!dash ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-xs text-zinc-400">
                  {dashQ.isLoading
                    ? "Loading live operations metrics from PostgreSQL..."
                    : dashQ.data && !dashQ.data.ok
                      ? dashQ.data.error
                      : "No dashboard telemetry available."}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                      <span className="text-xs text-zinc-400 block">Today&apos;s GMV</span>
                      <span className="text-2xl font-black text-emerald-400 block mt-1">
                        {formatInrExact(today?.gmv.value ?? 0)}
                      </span>
                      <span className="text-[10px] text-zinc-400">{today?.gmv.label ?? "ACTUAL"}</span>
                    </div>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                      <span className="text-xs text-zinc-400 block">Orders Today</span>
                      <span className="text-2xl font-black text-white block mt-1">
                        {formatNumber(today?.orders.value ?? 0)}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        Delayed now: {formatNumber(dash.live.delayedOrders)}
                      </span>
                    </div>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                      <span className="text-xs text-zinc-400 block">Net Contribution</span>
                      <span className="text-2xl font-black text-amber-400 block mt-1">
                        {today?.contribution ? formatInrExact(today.contribution.value) : "Restricted"}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        Refunds: {formatInrExact(today?.refunds.value ?? 0)}
                      </span>
                    </div>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                      <span className="text-xs text-zinc-400 block">Active Fleet &amp; Kitchens</span>
                      <span className="text-2xl font-black text-blue-400 block mt-1">
                        {formatNumber(today?.onlineRiders.value ?? 0)} / {formatNumber(today?.activeRestaurants.value ?? 0)}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        Unassigned: {formatNumber(dash.live.unassignedOrders)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: RIDER MANAGEMENT */}
          {activeTab === "riders" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">Live Fleet Directory</h3>
                  <p className="text-xs text-zinc-400">
                    {riders.length} rider records loaded from PostgreSQL
                  </p>
                </div>
              </div>

              {riders.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-xs text-zinc-400">
                  {ridersQ.isLoading ? "Loading rider fleet..." : "No riders found in workspace database."}
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/80 rounded-2xl border border-zinc-800 bg-zinc-900/50">
                  {riders.map((rider) => (
                    <div key={rider.id} className="flex items-center justify-between p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                          <Bike className="size-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white">{rider.name}</span>
                            <span className="font-mono text-[10px] text-zinc-400">({rider.id})</span>
                            <Badge className="bg-emerald-500/15 text-emerald-300 text-[9px]">{rider.status}</Badge>
                          </div>
                          <span className="text-[11px] text-zinc-400">
                            {rider.vehicle} - KYC: {rider.kycStatus}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => notifyCallUnavailable(`${rider.name} (${rider.id})`)}
                        className="border-zinc-700 text-xs text-emerald-400 hover:bg-emerald-950/40"
                      >
                        <PhoneCall className="size-3.5 mr-1" />
                        Call Rider
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PAYMENT CYCLES */}
          {activeTab === "payments" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">
                    Live Settlement &amp; Financial Ledger
                  </h3>
                  <Badge className="bg-emerald-500/20 text-emerald-300">PostgreSQL Verified</Badge>
                </div>
                {finance ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                      <span className="text-zinc-400 block text-[10px]">Gross GMV</span>
                      <span className="text-lg font-black text-white mt-0.5 block">
                        {formatInrExact(finance.summary.gmv)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                      <span className="text-zinc-400 block text-[10px]">Net Contribution</span>
                      <span className="text-lg font-black text-amber-400 mt-0.5 block">
                        {formatInrExact(finance.summary.contribution.total)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                      <span className="text-zinc-400 block text-[10px]">Settlement Batches</span>
                      <span className="text-lg font-black text-emerald-400 mt-0.5 block">
                        {formatNumber(settlements.length)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">
                    {finQ.isLoading ? "Loading financial summary..." : "Financial metrics require finance permission."}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: LIVE TELEMETRY */}
          {activeTab === "algorithm" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    Dispatch &amp; Operations Summary
                  </h3>
                  <Badge className="bg-emerald-500/20 text-emerald-300">Live Query</Badge>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900">
                    <span>Delayed Orders Now</span>
                    <span className="font-mono font-bold text-white">
                      {formatNumber(dash?.live.delayedOrders ?? 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900">
                    <span>Unassigned Orders Now</span>
                    <span className="font-mono font-bold text-white">
                      {formatNumber(dash?.live.unassignedOrders ?? 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900">
                    <span>Online Riders</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatNumber(today?.onlineRiders.value ?? 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AT-RISK KITCHENS */}
          {activeTab === "weak_restaurants" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">At-Risk Kitchen Detection</h3>
                  <p className="text-xs text-zinc-400">
                    Restaurants with rating below 4.3 or non-ACTIVE status in PostgreSQL
                  </p>
                </div>
                <Badge className="bg-rose-500/20 text-rose-300">
                  {weakRestaurants.length} Flagged
                </Badge>
              </div>

              {weakRestaurants.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-xs text-zinc-400">
                  {restQ.isLoading ? "Checking restaurant records..." : "No at-risk restaurants detected in database."}
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {weakRestaurants.map((rest) => (
                    <div
                      key={rest.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-amber-500/30 bg-amber-950/10"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{rest.name}</span>
                          <Badge className="bg-amber-500/20 text-amber-400">
                            Rating: {rest.rating.toFixed(1)}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1">
                          Status: {rest.status} | Orders: {rest.orderCount}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => notifyCallUnavailable(`${rest.name} (${rest.id})`)}
                        className="border-zinc-700 text-amber-400 hover:bg-amber-950/40 text-xs"
                      >
                        <PhoneCall className="size-3.5 mr-1" />
                        Contact Owner
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: GROWTH DIRECTIVES */}
          {activeTab === "growth" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  AI Operations Directives
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div>
                      <span className="font-bold text-xs text-white block">
                        Generate Corporate Catering Proposals
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        Opens AI assistant to draft B2B catering proposals from configured templates
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (onExecuteInChat) {
                          onExecuteInChat("Prepare institutional corporate catering proposals for Sribhumi and Silchar");
                          onClose();
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                    >
                      Open in AI Chat
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: VOICE DISPATCHER */}
          {activeTab === "calling" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    Telephony &amp; Voice Dispatch
                  </h3>
                  <Badge className="bg-zinc-800 text-zinc-300">Configuration Required</Badge>
                </div>
                <p className="text-xs text-zinc-300">
                  Configure Twilio / carrier voice webhook credentials in Master Settings to enable outbound automated voice dispatch.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
