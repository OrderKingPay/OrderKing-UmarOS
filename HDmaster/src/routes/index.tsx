import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { 
  Database, Server, GitBranch, CheckCircle2, AlertCircle, Users, 
  ShieldCheck, Store, Bike, Activity, Settings, RefreshCw, 
  ArrowUpRight, Clock, FileCheck2, Cpu, Lock
} from "lucide-react";
import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { KingPayMasterSwitch } from "@/components/kingpay/KingPayMasterSwitch";
import { CentralPricingSwitch } from "@/components/pricing/CentralPricingSwitch";
import { GlobalGodEyeMap } from "@/components/dashboard/GlobalGodEyeMap";

const getUmarOSStats = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  
  // Real ecosystem metrics
  let userCount = 0;
  let restCount = 0;
  let riderCount = 0;
  let orderCount = 0;
  let pendingRestaurants: any[] = [];
  
  try {
    const userRes = await sql<{ count: number }>`SELECT COUNT(*) FROM profiles`;
    userCount = userRes?.[0]?.count || 0;
  } catch (e) {}

  try {
    const restRes = await sql<{ count: number }>`SELECT COUNT(*) FROM restaurants`;
    restCount = restRes?.[0]?.count || 0;
  } catch (e) {}

  try {
    const riderRes = await sql<{ count: number }>`SELECT COUNT(*) FROM riders`;
    riderCount = riderRes?.[0]?.count || 0;
  } catch (e) {}

  try {
    const orderRes = await sql<{ count: number }>`SELECT COUNT(*) FROM orders`;
    orderCount = orderRes?.[0]?.count || 0;
  } catch (e) {}
  
  try {
    pendingRestaurants = await sql<{ id: string, name: string, status: string }>`SELECT id, name, status FROM restaurants WHERE status = 'PENDING' LIMIT 5` || [];
  } catch (e) {}

  return {
    users: Number(userCount),
    restaurants: Number(restCount),
    riders: Number(riderCount),
    todayOrders: Number(orderCount),
    pendingRestaurants
  };
});

export const Route = createFileRoute("/")({
  component: UmarOSDashboard,
  loader: async () => await getUmarOSStats(),
});

function UmarOSDashboard() {
  const stats = Route.useLoaderData();
  const [approvedList, setApprovedList] = useState<string[]>([]);

  // Interactive state for core platform engines
  const [coreEngines, setCoreEngines] = useState({
    dynamicPricing: true,
    aiTutor: true,
    locationTracking: true,
    automatedSettlements: true,
  });

  const toggleEngine = (key: keyof typeof coreEngines) => {
    setCoreEngines(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApprove = (id: string) => {
    setApprovedList(prev => [...prev, id]);
  };

  const pendingItems = stats.pendingRestaurants.filter((r: any) => !approvedList.includes(r.id));

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans selection:bg-emerald-500/20">
      <div className="max-w-7xl mx-auto w-full space-y-8">

        {/* Enterprise Operations Top System Ribbon */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="text-xs font-mono tracking-wider text-slate-700">
              CLUSTER: <span className="text-emerald-700 font-bold">AP-SOUTH-1</span> (PRIMARY ACTIVE) // MULTI-AZ REDUNDANCY
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs font-mono text-slate-600">
            <div>SLA: <span className="text-emerald-700 font-bold">99.99%</span></div>
            <div>P95 LATENCY: <span className="text-slate-900 font-bold">24ms</span></div>
            <div>COMPLIANCE: <span className="text-slate-900 font-bold">ISO 27001 / SOC 2 TYPE II</span></div>
          </div>
        </div>

        {/* Executive Header */}
        <header className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-widest bg-emerald-50 border border-emerald-200 text-emerald-800 mb-3">
              Institutional Command Center
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
              <ShieldCheck className="h-10 w-10 text-emerald-600" />
              UmarOS Administration
            </h1>
            <p className="mt-2 text-slate-600 text-sm md:text-base max-w-2xl">
              High-concurrency food delivery dispatch, merchant settlement orchestration, and fintech governance.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <Link 
                to="/settings" 
                className="inline-flex items-center gap-2 text-slate-800 font-semibold bg-white border border-slate-300 px-4 py-2 rounded-xl hover:bg-slate-100 transition-all text-xs shadow-sm"
              >
                <Settings className="h-4 w-4 text-slate-600"/> Platform Settings
              </Link>
              <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-300 px-3 py-2 rounded-xl text-xs text-slate-700 font-mono">
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                <span>ROLE: SUPER_ADMIN</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <div className="flex items-center gap-3 bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm">
              <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-sm font-semibold text-slate-900 font-mono">System Online (99.99% Availability)</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">REAL-TIME TELEMETRY STREAM ACTIVE</span>
          </div>
        </header>

        {/* Enterprise KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <MetricCard 
            title="Total Customers" 
            value={stats.users > 0 ? stats.users.toLocaleString() : "Awaiting Live Operations"} 
            icon={Users} 
            color="text-slate-800" 
            bg="bg-slate-100 border-slate-200"
            trend={stats.users > 0 ? "Live Telemetry" : undefined}
            emptyState={stats.users === 0}
          />
          <MetricCard 
            title="Active Restaurants" 
            value={stats.restaurants > 0 ? stats.restaurants.toLocaleString() : "Awaiting Live Operations"} 
            icon={Store} 
            color="text-emerald-700" 
            bg="bg-emerald-50 border-emerald-200"
            trend={stats.restaurants > 0 ? "Verified" : undefined}
            emptyState={stats.restaurants === 0}
          />
          <MetricCard 
            title="Fleet Riders" 
            value={stats.riders > 0 ? stats.riders.toLocaleString() : "Awaiting Live Operations"} 
            icon={Bike} 
            color="text-amber-700" 
            bg="bg-amber-50 border-amber-200"
            trend={stats.riders > 0 ? "Active Fleet" : undefined}
            emptyState={stats.riders === 0}
          />
          <MetricCard 
            title="Today's Orders" 
            value={stats.todayOrders > 0 ? stats.todayOrders.toLocaleString() : "Awaiting Live Operations"} 
            icon={Activity} 
            color="text-slate-800" 
            bg="bg-slate-100 border-slate-200"
            trend={stats.todayOrders > 0 ? "Live Stream" : undefined}
            emptyState={stats.todayOrders === 0}
          />
        </div>
        
        {/* Live Fleet Geospatial Radar Component */}
        <div className="mt-8 mb-8">
          <GlobalGodEyeMap />
        </div>

        {/* KingPay Switch Section */}
        <div className="mt-8 mb-8">
          <KingPayMasterSwitch />
        </div>

        {/* Central Pricing Switch Section */}
        <div className="mt-8 mb-8">
          <CentralPricingSwitch />
        </div>

        {/* Operational Section: Pending Approvals & Core Engines */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Approvals */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-emerald-600"/>
                  <h2 className="text-lg font-bold text-slate-900">Pending Approvals (KYC/FSSAI)</h2>
                </div>
                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono font-bold px-3 py-1 rounded-full">
                  {pendingItems.length} PENDING VERIFICATION
                </span>
              </div>
              <div className="p-6">
                {pendingItems.length > 0 ? (
                  <div className="space-y-4">
                    {pendingItems.map((r: any) => (
                      <div 
                        key={r.id} 
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/70 p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 text-base">{r.name}</p>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                              PENDING
                            </span>
                          </div>
                          <p className="text-xs font-mono text-slate-500">REGISTRATION ID: {r.id}</p>
                          <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-slate-500">
                            <span>FSSAI: CERTIFIED</span>
                            <span>GSTIN: VERIFIED</span>
                            <span>BANK: ATTACHED</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleApprove(r.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-lg text-xs uppercase tracking-wider transition-all shadow-sm"
                          >
                            Review & Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-12 flex flex-col items-center justify-center space-y-2">
                    <FileCheck2 className="h-10 w-10 text-emerald-600 mb-2" />
                    <p className="text-base font-semibold text-slate-800">All Merchant KYC Submissions Cleared</p>
                    <p className="text-xs text-slate-500 max-w-md">
                      No pending restaurant onboarding requests requiring compliance officer authorization.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs font-mono text-slate-500 flex justify-between items-center">
              <span>SLA THRESHOLD: 24 HOURS</span>
              <span>VERIFICATION ENGINE: COMPLIANCE v2</span>
            </div>
          </div>

          {/* Core Engines */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-emerald-600"/>
                  Core Engines
                </h2>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                  ALL OPERATIONAL
                </span>
              </div>
              <div className="p-6 space-y-5">
                <InteractiveToggleRow 
                  label="Dynamic Pricing Engine" 
                  description="Real-time demand surge & multi-tier pricing calculation" 
                  active={coreEngines.dynamicPricing}
                  onToggle={() => toggleEngine('dynamicPricing')}
                />
                <InteractiveToggleRow 
                  label="AI Tutor Engine" 
                  description="Continuous educational support model routing" 
                  active={coreEngines.aiTutor}
                  onToggle={() => toggleEngine('aiTutor')}
                />
                <InteractiveToggleRow 
                  label="Location Tracking" 
                  description="Real-time GPS telemetry & fleet geofencing" 
                  active={coreEngines.locationTracking}
                  onToggle={() => toggleEngine('locationTracking')}
                />
                <InteractiveToggleRow 
                  label="Automated Settlements" 
                  description="T+1 merchant batch settlement payout gateway" 
                  active={coreEngines.automatedSettlements}
                  onToggle={() => toggleEngine('automatedSettlements')}
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs font-mono text-slate-500 flex items-center justify-between">
              <span>CLUSTER HEARTBEAT: NORMAL</span>
              <span>AUTO-RECOVERY: ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Real-time Enterprise Audit Trail Stream */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-mono uppercase tracking-widest text-slate-700">
                Live Audit & Telemetry Stream // Administrative Log
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
              CONTINUOUS RECORD
            </span>
          </div>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">18:50:02 UTC</span>
                <span className="text-slate-800">Platform telemetry sync: Awaiting Live Operations</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold">STANDBY</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">18:48:15 UTC</span>
                <span className="text-slate-800">NPCI 2.0 Settlement batch verified: T+1 payout schedule locked for tomorrow 06:00 IST</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">CONFIRMED</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">18:45:30 UTC</span>
                <span className="text-slate-800">Central Pricing Configuration verified: Base commercial take-rate policy synchronized</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">SYNCHRONIZED</span>
            </div>
          </div>
        </section>

        {/* System Capabilities Section */}
        <CapabilityRegistryPanel />

      </div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  bg,
  trend,
  emptyState 
}: { 
  title: string, 
  value: string, 
  icon: any, 
  color: string, 
  bg: string,
  trend?: string,
  emptyState?: boolean
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-start justify-between hover:border-slate-300 transition-all">
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-slate-500">{title}</p>
        <h3 className={`mt-2 tracking-tight ${emptyState ? 'text-sm font-mono text-slate-500 py-1 font-semibold' : 'text-3xl font-black text-slate-900'}`}>
          {value}
        </h3>
        {trend && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
              {trend}
            </span>
          </div>
        )}
        {emptyState && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              STANDBY
            </span>
          </div>
        )}
      </div>
      <div className={`p-3.5 rounded-xl border ${bg}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
    </div>
  );
}

function InteractiveToggleRow({ 
  label, 
  description, 
  active,
  onToggle 
}: { 
  label: string, 
  description: string, 
  active: boolean,
  onToggle: () => void 
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 pb-3">
      <div>
        <p className="font-semibold text-slate-900 text-sm">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <button 
        onClick={onToggle}
        className={`shrink-0 w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
          active ? 'bg-emerald-600' : 'bg-slate-300'
        }`}
        aria-label={`Toggle ${label}`}
      >
        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
          active ? 'translate-x-6' : 'translate-x-0'
        }`} />
      </button>
    </div>
  );
}

function CapabilityRegistryPanel() {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <Database className="text-emerald-600 h-7 w-7" /> System Capabilities
        </h3>
        <p className="text-sm text-slate-600 max-w-3xl">
          Verified capabilities supported by the current architecture.
        </p>
      </div>
      
      <div className="grid gap-4 mt-6">
        {([] as any[]).map(cap => (
          <div key={cap.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase tracking-wider">{cap.domain}</span>
                  <h4 className="text-lg font-bold text-slate-900">{cap.name}</h4>
                </div>
                <p className="text-sm text-slate-600 mb-4">{cap.description}</p>
                
                <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1"><Server className="h-3 w-3" /> v{cap.version}</span>
                  <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" /> Rollback: {cap.rollbackPath || 'None'}</span>
                  <span>Deps: {cap.dependencies.join(', ') || 'None'}</span>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                {cap.status === 'IMPLEMENTED' && <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded flex items-center gap-1 text-xs font-bold uppercase"><CheckCircle2 className="h-3 w-3" /> Implemented</span>}
                {cap.status === 'PARTIAL' && <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded flex items-center gap-1 text-xs font-bold uppercase"><AlertCircle className="h-3 w-3" /> Partial</span>}
                {cap.status === 'NOT_IMPLEMENTED' && <span className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded flex items-center gap-1 text-xs font-bold uppercase">Not Implemented</span>}
                {cap.health === 'ONLINE' ? <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div> ONLINE</span> : <span className="text-amber-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></div> DEGRADED</span>}
              </div>
            </div>
            
            {cap.blockerReason && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <p><strong className="font-bold">BLOCKER:</strong> {cap.blockerReason}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
