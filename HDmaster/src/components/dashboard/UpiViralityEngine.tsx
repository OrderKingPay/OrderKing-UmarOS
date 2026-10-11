import React, { useState } from 'react';
import { QrCode, Link2, Zap, IndianRupee } from 'lucide-react';

export function UpiViralityEngine() {
  const [config, setConfig] = useState({
    cashbackAmount: 50,
    redirectUrl: 'intent://orderking.app/download#Intent;scheme=orderking;package=com.orderking.app;end'
  });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 min-h-screen bg-slate-50">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <Zap className="w-8 h-8 text-[#10B981]" />
          UPI Deep-Link Virality Engine
        </h1>
        <p className="text-slate-500 mt-2">Proprietary architecture to convert physical KingPay offline transactions into guaranteed app installations.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b pb-4">
            <QrCode className="w-5 h-5 text-slate-600" /> Post-Payment Funnel Configurator
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Post-Payment Success Redirect URI (Deep-Link)</label>
              <input 
                type="text" 
                value={config.redirectUrl}
                onChange={e => setConfig({...config, redirectUrl: e.target.value})}
                className="w-full border rounded p-3 font-mono text-sm bg-slate-50"
              />
              <p className="text-xs text-slate-500 mt-1">When a user scans a KingPay QR with GPay/PhonePe, they are automatically routed to this URI upon success.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Instant App-Install Cashback Incentive (₹)</label>
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <IndianRupee className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" 
                    value={config.cashbackAmount}
                    onChange={e => setConfig({...config, cashbackAmount: Number(e.target.value)})}
                    className="w-full border rounded p-2 pl-9 font-bold text-lg"
                  />
                </div>
                <button className="bg-[#E23744] hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2">
                  <Link2 className="w-5 h-5" /> Compile Viral QR Payloads
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Console */}
        <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 text-green-400 font-mono text-sm">
          <div className="flex items-center gap-2 mb-4 text-slate-400 border-b border-slate-700 pb-2">
            <Zap className="w-4 h-4" /> Live Interception Preview Log
          </div>
          <p>{`> USER INITIATES UPI PAYMENT AT OFFLINE MERCHANT`}</p>
          <p>{`> PAYMENT SUCCESS DETECTED (NPCI CALLBACK)`}</p>
          <p>{`> TRIGGERING INTENT ROUTING: ${config.redirectUrl}`}</p>
          <p>{`> BROWSER HIJACK INITIATED: PROMPTING DOWNLOAD FOR ₹${config.cashbackAmount} CASHBACK`}</p>
          <p className="mt-4 text-emerald-400 animate-pulse">{`> STATUS: READY FOR NATIONWIDE DEPLOYMENT`}</p>
        </div>
      </div>
    </div>
  );
}
