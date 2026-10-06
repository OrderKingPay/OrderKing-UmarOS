import { createFileRoute } from "@tanstack/react-router";
import { Store, Users, Bike, Settings, Activity, ShieldCheck, MapPin } from "lucide-react";

export const Route = createFileRoute("/")({
  component: OmarOSDashboard,
});

function OmarOSDashboard() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        <header className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 flex items-center gap-3">
              <ShieldCheck className="h-10 w-10 text-emerald-600" />
              Omar OS Control Center
            </h1>
            <p className="mt-2 text-slate-500 text-base">Real-time administrative control, onboarding approvals, and ecosystem metrics.</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm font-semibold text-slate-600">Ecosystem Online • Cloudflare Edge</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Metrics Cards */}
          <MetricCard title="Total Customers" value="---" icon={Users} color="text-blue-600" bg="bg-blue-50" />
          <MetricCard title="Active Restaurants" value="---" icon={Store} color="text-emerald-600" bg="bg-emerald-50" />
          <MetricCard title="Fleet Riders" value="---" icon={Bike} color="text-amber-600" bg="bg-amber-50" />
          <MetricCard title="Today's Orders" value="---" icon={Activity} color="text-indigo-600" bg="bg-indigo-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Onboarding Approvals */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold flex items-center gap-2"><Store className="h-5 w-5 text-slate-500"/> Pending Approvals (KYC/FSSAI)</h2>
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">Requires Action</span>
            </div>
            <div className="p-6 text-center text-slate-500 py-12">
              No pending onboarding requests at this time.
            </div>
          </div>

          {/* Configuration & Toggles */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold flex items-center gap-2"><Settings className="h-5 w-5 text-slate-500"/> Feature Flags</h2>
            </div>
            <div className="p-5 space-y-4">
              <ToggleRow label="Customer KingPay (Tickets/Bills)" description="Show Flight/Train booking UI in KingPay" active={true} />
              <ToggleRow label="Surge Pricing Engine" description="Apply dynamic multipliers during high demand" active={false} />
              <ToggleRow label="WhatsApp Viral Referral" description="Enable ₹100 referral bonuses" active={true} />
              <ToggleRow label="AI Tutor Gig Economy" description="Show affiliate jobs in Tutor section" active={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color, bg }: { title: string, value: string, icon: any, color: string, bg: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 mt-2">{value}</h3>
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
        <p className="font-semibold text-slate-900 text-sm">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <div className={`shrink-0 w-10 h-6 rounded-full flex items-center px-1 transition-colors ${active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`}></div>
      </div>
    </div>
  );
}
