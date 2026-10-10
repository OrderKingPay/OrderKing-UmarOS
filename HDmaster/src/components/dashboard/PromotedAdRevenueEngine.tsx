import React from 'react';
import { Megaphone, TrendingUp, IndianRupee, Target } from 'lucide-react';

export function PromotedAdRevenueEngine() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Zero-Setup-Fee Ad Revenue</h3>
            <p className="text-sm text-slate-500">Promoted Restaurant Placements & Visibility Tariffs</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="p-4 border border-slate-200 rounded-lg">
              <div className="text-sm text-slate-500 font-semibold mb-1">Global Ad Impressions</div>
              <div className="text-2xl font-bold text-slate-900">0</div>
           </div>
           <div className="p-4 border border-slate-200 rounded-lg">
              <div className="text-sm text-slate-500 font-semibold mb-1">Active Promoted Restaurants</div>
              <div className="text-2xl font-bold text-slate-900">0</div>
           </div>
           <div className="p-4 border border-emerald-200 bg-emerald-50 rounded-lg">
              <div className="text-sm text-emerald-700 font-semibold mb-1 flex items-center gap-1"><TrendingUp className="w-4 h-4"/> Ad Revenue Generated</div>
              <div className="text-2xl font-bold text-emerald-700">₹0.00</div>
           </div>
        </div>

        <div className="space-y-4">
           <h4 className="text-sm font-bold text-slate-900">Ad Pricing Controls</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Daily Placement Flat Fee (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input type="number" defaultValue="250" className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Guarantees top 3 slot placement for 24 hours.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Cost-Per-Click (CPC) Premium (₹)</label>
                <div className="relative">
                  <Target className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input type="number" defaultValue="4.50" className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Charged only when customer clicks the promoted card.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
