import { createFileRoute } from "@tanstack/react-router";
import { Zap, Cpu, Network, Globe, Activity, Terminal } from "lucide-react";

export const Route = createFileRoute("/")({
  component: OmarOSGodDashboard,
});

function OmarOSGodDashboard() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50 p-8">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        <header className="border-b border-slate-800 pb-8">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 flex items-center gap-4">
            <Cpu className="h-12 w-12 text-amber-400" />
            OMAR OS: GOD OF TECHNOLOGY
          </h1>
          <p className="mt-4 text-slate-400 text-lg">Supreme Administrative Control. Unlimited Power. 100x Capability.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Models */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><Zap className="text-yellow-400"/> AI Models Matrix</h2>
            <ul className="space-y-3">
              <li className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="font-semibold text-emerald-400">Super Grok 4.6</span>
                <span className="text-xs bg-emerald-900 text-emerald-200 px-2 py-1 rounded">ACTIVE / UNLIMITED</span>
              </li>
              <li className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="font-semibold text-blue-400">Claude 4.6</span>
                <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded">ACTIVE / UNLIMITED</span>
              </li>
              <li className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="font-semibold text-purple-400">GPT-Omega</span>
                <span className="text-xs bg-purple-900 text-purple-200 px-2 py-1 rounded">ACTIVE / UNLIMITED</span>
              </li>
            </ul>
          </div>

          {/* Core Systems */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><Network className="text-blue-400"/> Infrastructure</h2>
            <ul className="space-y-3">
              <li className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="font-semibold text-slate-300">SpaceX Starlink Node</span>
                <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded">SYNCED - 14ms</span>
              </li>
              <li className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="font-semibold text-slate-300">Cloudflare Edge Fleet</span>
                <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded">340 REGIONS UP</span>
              </li>
            </ul>
          </div>

          {/* Master Switches */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><Globe className="text-indigo-400"/> Supreme Commands</h2>
            <div className="space-y-3">
              <button className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-bold py-3 rounded-lg shadow-lg hover:scale-[1.02] transition-transform">
                Force Algorithm Update
              </button>
              <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold py-3 rounded-lg shadow-lg hover:scale-[1.02] transition-transform">
                Execute Automated Wealth Generation
              </button>
              <button className="w-full bg-slate-800 text-white font-bold py-3 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors">
                Delete All Fake Data
              </button>
            </div>
          </div>
        </div>
        
        {/* Logs */}
        <div className="bg-black border border-slate-800 rounded-2xl p-4 font-mono text-xs text-green-500 overflow-hidden h-40">
          <div className="flex items-center gap-2 mb-2 text-slate-400 border-b border-slate-800 pb-2"><Terminal size={14}/> Omar OS Terminal</div>
          <p>[SYSTEM] Connected to Global Algorithm...</p>
          <p>[SYSTEM] All fake data purged.</p>
          <p>[SYSTEM] PWA Caches invalidated.</p>
          <p>[SYSTEM] Customer UI luxury injection successful.</p>
          <p>[SYSTEM] Supreme Power granted to Founder.</p>
        </div>

      </div>
    </div>
  );
}
