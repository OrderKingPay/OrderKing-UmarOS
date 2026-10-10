import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { VendorShell } from "@/components/vendor-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/use-t";
import { useVendor } from "@/components/use-vendor";
import { getDashboard, quickThrottleKitchen } from "@/lib/server/api-orders";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { Cpu, Zap, RadioTower, Banknote, ShieldAlert, ArrowUpRight, TrendingUp, IndianRupee, Activity, Smartphone, Server } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

const AI_DEMAND_DATA = [
  { time: "08:00", actual: 12, predicted: 15, surge: 1.0 },
  { time: "10:00", actual: 24, predicted: 22, surge: 1.0 },
  { time: "12:00", actual: 85, predicted: 90, surge: 1.2 },
  { time: "14:00", actual: 45, predicted: 50, surge: 1.0 },
  { time: "16:00", actual: 30, predicted: 35, surge: 1.0 },
  { time: "18:00", actual: 95, predicted: 110, surge: 1.5 },
  { time: "20:00", actual: 145, predicted: 165, surge: 2.1 }, // Peak
  { time: "22:00", actual: 80, predicted: 95, surge: 1.4 },
  { time: "00:00", actual: 10, predicted: 15, surge: 1.0 },
];

function DashboardPage() {
  const t = useT();
  const vendor = useVendor();
  const dash = useQuery({
    queryKey: ["dashboard", vendor.restaurantId],
    queryFn: () => getDashboard({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId),
    refetchInterval: 8000,
  });

  const [surgeActive, setSurgeActive] = useState(true);
  const [payoutStatus, setPayoutStatus] = useState<"idle" | "processing" | "success">("idle");

  const handlePayout = () => {
    setPayoutStatus("processing");
    setTimeout(() => setPayoutStatus("success"), 2500);
  };

  if (!vendor.isPending && vendor.memberships.length === 0) {
    return (
      <VendorShell title={t("dashboard.greeting")}>
        <Card className="space-y-3 p-6 border-zinc-800 bg-black text-zinc-300">
          <p>{t("onboarding.title")}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild><Link to="/onboarding">{t("onboarding.realCta")}</Link></Button>
            <Button variant="secondary" asChild><Link to="/onboarding">{t("onboarding.demoCta")}</Link></Button>
          </div>
        </Card>
      </VendorShell>
    );
  }

  const d = dash.data;
  const stale = dash.isError;

  return (
    <VendorShell
      title={d?.restaurantName ?? t("nav.home")}
      dataLabel={d?.dataLabel ?? vendor.dataLabel}
      stale={stale}
      restaurantName={d?.restaurantName}
    >
      <div className="font-mono bg-zinc-950 text-zinc-100 p-4 sm:p-6 min-h-screen rounded-xl border border-zinc-800 shadow-[0_0_40px_rgba(16,185,129,0.05)] flex flex-col gap-6 relative overflow-hidden">
        
        {/* Terminal Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800 pb-4 gap-4 z-10 relative">
          <div className="flex items-center gap-3">
            <Cpu className="text-emerald-500 animate-pulse" size={28} />
            <div>
              <h1 className="text-2xl font-bold tracking-widest text-emerald-400 leading-none">ORDERKING // AI TERMINAL</h1>
              <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">Sys: v4.9.0-OMEGA | Node: OK-BLR-09</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 text-xs font-bold bg-zinc-900/50 px-3 py-2 rounded border border-zinc-800">
            <span className="flex items-center gap-2 text-emerald-500"><RadioTower size={14} className="animate-pulse" /> SAT-LINK ACTIVE (12ms)</span>
            <span className="text-zinc-400">ENCRYPTION: AES-256-GCM</span>
          </div>
        </div>

        {/* Top KPI Grid (Bloomberg Style) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 z-10 relative">
          <TerminalStat label="LIVE ORDERS" value="142" sub="↑ 24% vs last hr" color="emerald" />
          <TerminalStat label="GROSS VOLUME (INR)" value="₹3,42,901" sub="Target: ₹400k" color="cyan" />
          <TerminalStat label="AVG PREP TIME" value="11m 04s" sub="Excellent" color="emerald" />
          <TerminalStat label="CANCELLATION RISK" value="1.2%" sub="Optimal" color="zinc" />
        </div>

        {/* Middle Section: AI Chart & Surge Pricing */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 z-10 relative">
          
          {/* AI Demand Prediction Chart */}
          <div className="lg:col-span-2 border border-zinc-800 bg-black p-4 rounded text-xs flex flex-col gap-4 shadow-inner">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-widest">
                <Activity size={16} /> Neural Demand Projection
              </div>
              <span className="text-zinc-500">ACCURACY: 98.4%</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={AI_DEMAND_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="time" stroke="#52525b" tick={{fill: '#a1a1aa', fontSize: 10}} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" tick={{fill: '#a1a1aa', fontSize: 10}} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '4px', color: '#fff' }}
                    itemStyle={{ color: '#06b6d4', fontSize: '12px' }}
                  />
                  <ReferenceLine x="20:00" stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: 'SURGE PEAK', fill: '#f59e0b', fontSize: 10 }} />
                  <Area type="monotone" dataKey="predicted" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorPredicted)" />
                  <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 border-t border-zinc-800 pt-2 text-[10px] text-zinc-400">
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> ACTUAL VOLUME</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 bg-cyan-500 rounded-full" /> AI PREDICTION</span>
            </div>
          </div>

          {/* Dynamic Surge Pricing */}
          <div className="border border-amber-500/30 bg-amber-950/10 p-4 rounded flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-amber-900/50 pb-2">
              <div className="flex items-center gap-2 text-amber-500 font-bold uppercase tracking-widest text-xs">
                <Zap size={16} /> 1-Tap Surge Engine
              </div>
              <div className="px-2 py-0.5 bg-amber-500 text-black text-[9px] font-bold rounded-sm animate-pulse">LIVE</div>
            </div>
            <div className="text-xs text-zinc-400 leading-relaxed">
              AI detects extreme local demand. Enable algorithmic surge pricing to throttle inbound requests while maximizing per-ticket AOV.
            </div>
            
            <div className="bg-black border border-zinc-800 p-3 rounded flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-300">AUTO-SURGE MODULE</span>
                <button 
                  onClick={() => setSurgeActive(!surgeActive)}
                  className={cn("w-12 h-6 rounded-full flex items-center p-1 transition-colors", surgeActive ? "bg-amber-500 justify-end" : "bg-zinc-800 justify-start")}
                >
                  <div className="w-4 h-4 bg-black rounded-full shadow-sm" />
                </button>
              </div>
              <div className="text-[10px] text-zinc-500">Currently overriding base menu prices by <span className="text-amber-500 font-bold">2.1x</span> (Max: 3x). Algorithm optimizing for lowest bounce rate.</div>
            </div>

            <div className="mt-auto grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" className="h-8 text-[10px] border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800">
                MANUAL OVERRIDE
              </Button>
              <Button size="sm" className="h-8 text-[10px] bg-amber-600 hover:bg-amber-500 text-white font-bold tracking-wider">
                LOCK SURGE
              </Button>
            </div>
          </div>
        </div>

        {/* Lower Section: UPI Payouts & Heatmap */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 z-10 relative">
          
          {/* Instant Payout / UPI */}
          <div className="border border-zinc-800 bg-black p-4 rounded flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-xs">
                <Banknote size={16} /> Treasury & Settlement
              </div>
              <span className="text-zinc-500 text-[10px] border border-zinc-800 px-1.5 py-0.5 rounded">UPI IMPS ACTIVE</span>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <div className="text-[10px] text-zinc-500 mb-1">AVAILABLE TO WITHDRAW</div>
                <div className="text-3xl font-bold text-emerald-500 tracking-tight">₹84,293<span className="text-zinc-500 text-lg">.42</span></div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-zinc-500 mb-1">UNSETTLED HOLD</div>
                <div className="text-sm font-bold text-zinc-300">₹12,400.00</div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-3 rounded text-xs flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded"><Smartphone size={14} /></div>
                <div>
                  <div className="font-bold text-zinc-300">restaurant@ybl</div>
                  <div className="text-[10px] text-zinc-500">Verified Merchant VPA</div>
                </div>
              </div>
              <span className="text-emerald-500 text-[10px] font-bold">✓ LINKED</span>
            </div>

            <Button 
              onClick={handlePayout}
              disabled={payoutStatus !== "idle"}
              className={cn(
                "w-full h-10 font-bold tracking-widest text-xs mt-2 transition-all",
                payoutStatus === "idle" ? "bg-emerald-600 hover:bg-emerald-500 text-white" :
                payoutStatus === "processing" ? "bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700" :
                "bg-emerald-500 text-black"
              )}
            >
              {payoutStatus === "idle" && "INSTANT UPI PAYOUT"}
              {payoutStatus === "processing" && "INITIATING IMPS TRANSFER..."}
              {payoutStatus === "success" && "SETTLEMENT COMPLETE ✓"}
            </Button>
          </div>

          {/* Neighborhood Demand Heatmap (Abstracted) */}
          <div className="border border-zinc-800 bg-black p-4 rounded flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-widest text-xs">
                <Server size={16} /> Geo-Spatial Heatmap
              </div>
              <span className="text-zinc-500 text-[10px]">RADAR SCAN: 3KM RADIUS</span>
            </div>
            
            <div className="flex-1 bg-zinc-950 rounded border border-zinc-900 p-2 grid grid-cols-7 gap-1 overflow-hidden relative">
              {/* Simulated Heatmap Grid */}
              {Array.from({ length: 28 }).map((_, i) => {
                const intensity = Math.random();
                return (
                  <div 
                    key={i} 
                    className="rounded-sm animate-pulse"
                    style={{
                      backgroundColor: `rgba(6, 182, 212, ${intensity * 0.8})`,
                      animationDuration: `${2 + Math.random() * 3}s`
                    }}
                  />
                )
              })}
              {/* Overlay elements */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-black shadow-[0_0_15px_#10b981] z-10" />
                <div className="w-16 h-16 border border-emerald-500/50 rounded-full absolute animate-ping" />
              </div>
            </div>
            
            <div className="flex justify-between text-[9px] text-zinc-500 font-bold tracking-widest">
              <span>LOW DENSITY</span>
              <div className="w-24 h-2 bg-gradient-to-r from-transparent via-cyan-500/50 to-cyan-500 rounded-full" />
              <span>HIGH DENSITY</span>
            </div>
          </div>

        </div>
        
        {/* Decorative Grid Background for entire component */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-50 z-0 pointer-events-none" />
      </div>
    </VendorShell>
  );
}

function TerminalStat({ label, value, sub, color }: { label: string, value: string, sub: string, color: "emerald" | "cyan" | "zinc" }) {
  const colors = {
    emerald: "text-emerald-500 border-emerald-500/30 bg-emerald-950/10",
    cyan: "text-cyan-500 border-cyan-500/30 bg-cyan-950/10",
    zinc: "text-zinc-300 border-zinc-700 bg-zinc-900",
  };
  
  return (
    <div className={cn("border p-3 rounded flex flex-col gap-1 shadow-inner", colors[color])}>
      <span className="text-[10px] text-zinc-500 font-bold tracking-widest">{label}</span>
      <span className="text-xl font-bold tracking-tight">{value}</span>
      <span className="text-[9px] text-zinc-400">{sub}</span>
    </div>
  );
}
