import React, { useState } from 'react';
import { Download, Settings, Smartphone, CheckCircle2 } from 'lucide-react';

export function OemSideloadHub() {
  const [pwaConfig, setPwaConfig] = useState({ aggressivePrompt: true, delaySeconds: 0 });
  const [oemConfig, setOemConfig] = useState({ provider: 'JioStore API', apiKey: '', preLoadTarget: 100000 });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 min-h-screen bg-slate-50">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <Download className="w-8 h-8 text-[#E23744]" />
          OEM Sideload & PWA Engine
        </h1>
        <p className="text-slate-500 mt-2">Proprietary infrastructure to bypass standard app stores and maximize direct device installations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* PWA Prompt Engine */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-600" /> Web App Prompt Injection
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="font-semibold text-slate-700">Aggressive 'Add to Home Screen'</span>
              <input type="checkbox" checked={pwaConfig.aggressivePrompt} onChange={e => setPwaConfig({...pwaConfig, aggressivePrompt: e.target.checked})} className="w-5 h-5 accent-[#E23744]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Prompt Delay (Seconds)</label>
              <input type="number" value={pwaConfig.delaySeconds} onChange={e => setPwaConfig({...pwaConfig, delaySeconds: Number(e.target.value)})} className="w-full border rounded p-2" />
            </div>
          </div>
        </div>

        {/* OEM Sideload API */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-600" /> Carrier / OEM Pre-Load API
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Target OEM Provider</label>
              <select className="w-full border rounded p-2" value={oemConfig.provider} onChange={e => setOemConfig({...oemConfig, provider: e.target.value})}>
                <option>JioStore API</option>
                <option>Xiaomi GetApps API</option>
                <option>Oppo/Vivo Store API</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">OEM Publisher API Key</label>
              <input type="password" placeholder="****************" className="w-full border rounded p-2" />
            </div>
            <button className="w-full mt-4 bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition flex justify-center items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Authorize Direct APK Push
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
