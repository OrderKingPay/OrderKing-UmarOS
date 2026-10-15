const fs = require("fs");
const path = "HDmaster/src/routes/index.tsx";

const content = `import { createFileRoute, Link } from "@tanstack/react-router";
import { Store, Users, Bike, Settings, Activity, ShieldCheck, MapPin } from "lucide-react";
import { createServerFn } from "@tanstack/start";
import { getSql } from "@/lib/db";

const getUmarOSStats = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  
  // Real ecosystem metrics
  const [{ count: userCount }] = await sql<{ count: number }>\`SELECT COUNT(*) FROM user\` || [{ count: 0 }];
  const [{ count: restCount }] = await sql<{ count: number }>\`SELECT COUNT(*) FROM restaurants\` || [{ count: 0 }];
  const [{ count: riderCount }] = await sql<{ count: number }>\`SELECT COUNT(*) FROM riders\` || [{ count: 0 }];
  const [{ count: orderCount }] = await sql<{ count: number }>\`SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE\` || [{ count: 0 }];
  
  // Fetch real pending restaurants
  const pendingRestaurants = await sql<{ id: string, name: string, status: string }>\`SELECT id, name, status FROM restaurants WHERE verification_status = 'PENDING_APPROVAL' LIMIT 5\` || [];

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

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-black text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        <header className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
              <ShieldCheck className="h-10 w-10 text-emerald-400" />
              Umar OS Control Center
            </h1>
            <Link to="/settings" className="inline-flex items-center gap-2 mt-4 text-emerald-400 font-bold bg-emerald-900/30 px-4 py-2 rounded-lg hover:bg-emerald-800/40"><Settings className="h-4 w-4"/> Platform Settings</Link>
            <p className="mt-2 text-slate-400 text-base">Real-time administrative control, onboarding approvals, and ecosystem metrics.</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-900/50 backdrop-blur-md border-white/5 p-3 rounded-xl shadow-sm border border-white/5">
            <div className="h-3 w-3 rounded-full bg-emerald-900/300 animate-pulse"></div>
            <span className="text-sm font-semibold text-slate-300">Ecosystem Online • PostGIS Active</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <MetricCard title="Total Customers" value={stats.users.toLocaleString()} icon={Users} color="text-blue-400" bg="bg-blue-900/20" />
          <MetricCard title="Active Restaurants" value={stats.restaurants.toLocaleString()} icon={Store} color="text-emerald-400" bg="bg-emerald-900/30" />
          <MetricCard title="Fleet Riders" value={stats.riders.toLocaleString()} icon={Bike} color="text-amber-400" bg="bg-amber-900/20" />
          <MetricCard title="Today\\'s Orders" value={stats.todayOrders.toLocaleString()} icon={Activity} color="text-indigo-600" bg="bg-indigo-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-md border-white/5 border border-white/10 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-800/30">
              <h2 className="text-lg font-bold flex items-center gap-2"><Store className="h-5 w-5 text-slate-400"/> Pending Approvals (KYC/FSSAI)</h2>
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">{stats.pendingRestaurants.length} Pending</span>
            </div>
            <div className="p-6">
              {stats.pendingRestaurants.length > 0 ? (
                <div className="space-y-4">
                  {stats.pendingRestaurants.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
                      <div>
                        <p className="font-bold text-white">{r.name}</p>
                        <p className="text-xs text-slate-400">ID: {r.id}</p>
                      </div>
                      <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-1 px-4 rounded-lg text-sm transition">
                        Review & Approve
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-12">
                  No pending onboarding requests at this time. All clear.
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border-white/5 border border-white/10 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-white/5 bg-slate-800/30">
              <h2 className="text-lg font-bold flex items-center gap-2"><Settings className="h-5 w-5 text-slate-400"/> Core Engines</h2>
            </div>
            <div className="p-5 space-y-4">
              <ToggleRow label="Surge Pricing Engine" description="Live active dynamic pricing" active={true} />
              <ToggleRow label="AI Tutor Omniscience" description="Gemini Pro Live Monitoring" active={true} />
              <ToggleRow label="PostGIS Live Tracking" description="Rider lat/lng websocket streaming" active={true} />
              <ToggleRow label="Escrow T+1 Settlements" description="Automated payout gateway active" active={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color, bg }: { title: string, value: string, icon: any, color: string, bg: string }) {
  return (
    <div className="bg-slate-900/50 backdrop-blur-md border-white/5 border border-white/10 rounded-2xl p-6 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <h3 className="text-3xl font-black text-white mt-2">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${bg}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
    </div>
  );
}

function ToggleRow({ label, description, active }: { label: string, description: string, active: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div>
        <p className="font-semibold text-white text-sm">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <div className={`shrink-0 w-10 h-6 rounded-full flex items-center px-1 transition-colors ${active ? 'bg-emerald-900/300' : 'bg-slate-300'}`}>
        <div className={`w-4 h-4 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] rounded-full transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`}></div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(path, content, "utf8");
console.log("Fixed UmarOS Dashboard with realistic data fetching");
