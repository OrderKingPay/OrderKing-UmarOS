import React from 'react';
import { Globe, Building, DollarSign, Server, Key, CheckCircle2 } from 'lucide-react';

export function GlobalSaaSFranchiseEngine() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">B2B SaaS Franchise Exporter</h3>
            <p className="text-sm text-slate-500">License UmarOS AI to Middle East & US Chains</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-4 h-4" /> ENGINE ACTIVE
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Target Franchise Client</label>
              <div className="relative">
                <Building className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input type="text" className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g., Burger King Franchisee (Riyadh)" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Monthly SaaS Licensing Fee (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input type="number" className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g., 2500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Deployment Region</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option>US East (N. Virginia) - B1/B2 Target</option>
                <option>Middle East (Bahrain) - KSA Target</option>
                <option>AP South (Mumbai)</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg flex flex-col justify-center items-center text-center space-y-3">
            <Server className="w-8 h-8 text-slate-400" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">Deploy Isolated White-label Cluster</h4>
              <p className="text-xs text-slate-500 mt-1">This will clone the employee-less UmarOS engine to a dedicated sovereign server for your B2B client.</p>
            </div>
            <button className="mt-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-lg shadow-sm w-full">
              Deploy SaaS Instance
            </button>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h4 className="text-sm font-bold text-slate-900 mb-3">Active SaaS Licenses (Monthly Recurring Revenue)</h4>
          <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
             <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center">
                <Key className="w-6 h-6 text-slate-300 mb-2" />
                No active B2B licenses. Awaiting first franchise deployment.
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
