import React, { useState } from 'react';
import { Target, DollarSign, Megaphone, CheckCircle, Lock, Zap, Briefcase, ChevronRight, Activity, Globe, Smartphone } from 'lucide-react';

export function TelecomArbitrageHub() {
  const [clientName, setClientName] = useState('');
  const [adCopy, setAdCopy] = useState('');
  const [targetRadius, setTargetRadius] = useState(10);
  const [clientPayment, setClientPayment] = useState(10000);
  
  // Calculate arbitrage financials
  const apiCost = clientPayment * 0.5;
  const founderProfit = clientPayment - apiCost;
  
  // Fixed payload
  const viralPayload = "\n\n🚀 Order Food Faster. Get OrderKing App Now: https://orderking.app/download";
  const finalMessagePreview = `${adCopy}${viralPayload}`;

  const handleExecute = () => {
    alert("Campaign executing! Telecom Arbitrage successful.");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex items-start justify-between pb-6 border-b border-zinc-800">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Zap className="w-8 h-8 text-yellow-500" />
              Zero-Cost Telecom Arbitrage Engine
            </h1>
            <p className="mt-2 text-zinc-400 max-w-2xl text-sm leading-relaxed">
              Execute massive B2B SMS/Ad blasts on Jio & Airtel networks. Leverage client capital to acquire users for free through mandatory viral payloads.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-md flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-zinc-300">SYSTEM ACTIVE</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Intake Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl shadow-black/50">
              <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-white tracking-wide">Client Campaign Intake</h2>
              </div>
              
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Client Name</label>
                    <input 
                      type="text"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="e.g. Nexus Corp"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Target Radius (KM)</label>
                    <div className="relative">
                      <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        type="number"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        value={targetRadius}
                        onChange={(e) => setTargetRadius(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Client Budget (₹)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type="number"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      value={clientPayment}
                      onChange={(e) => setClientPayment(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Client Ad Copy</label>
                  <textarea 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors min-h-[100px] resize-none"
                    placeholder="Enter the client's marketing message..."
                    value={adCopy}
                    onChange={(e) => setAdCopy(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Viral Payload Injector */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl shadow-black/50">
              <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-fuchsia-500" />
                  <h2 className="text-lg font-semibold text-white tracking-wide">Viral Payload Injector</h2>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-fuchsia-400 bg-fuchsia-500/10 px-2 py-1 rounded">
                  <Lock className="w-3 h-3" />
                  LOCKED
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-sm text-zinc-400 mb-4">
                  This payload is forcibly appended to every outgoing message funded by the client. It converts their audience into OrderKing users at zero acquisition cost.
                </p>
                <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4 flex items-start gap-4">
                  <Smartphone className="w-5 h-5 text-zinc-500 mt-1 shrink-0" />
                  <div className="flex-1 space-y-2 text-sm text-zinc-300 whitespace-pre-wrap font-mono">
                    {viralPayload.trim()}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-zinc-800">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-3">Final Output Preview</label>
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-md p-4 text-sm text-blue-100 whitespace-pre-wrap font-mono relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    {finalMessagePreview}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Financials & Execution */}
          <div className="space-y-6">
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl shadow-black/50">
              <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-white tracking-wide">Arbitrage Financials</h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-zinc-400 uppercase">Client Payment</p>
                    <p className="text-2xl font-bold text-white">₹{clientPayment.toLocaleString()}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-zinc-600 mb-1" />
                </div>
                
                <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-zinc-400 uppercase">API Cost (Jio/Airtel)</p>
                    <p className="text-2xl font-bold text-red-400">-₹{apiCost.toLocaleString()}</p>
                  </div>
                  <Activity className="w-5 h-5 text-zinc-600 mb-1" />
                </div>
                
                <div className="flex justify-between items-end pt-2">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-emerald-500 uppercase">Founder Profit</p>
                    <p className="text-4xl font-extrabold text-emerald-400">₹{founderProfit.toLocaleString()}</p>
                  </div>
                  <Zap className="w-6 h-6 text-emerald-500 mb-1" />
                </div>
              </div>
            </div>

            <button 
              onClick={handleExecute}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-indigo-900/50 transition-all flex items-center justify-center gap-2 group"
            >
              <Megaphone className="w-5 h-5 group-hover:scale-110 transition-transform" />
              EXECUTE CAMPAIGN
              <ChevronRight className="w-5 h-5 opacity-50" />
            </button>
            
            <p className="text-center text-xs text-zinc-500 font-medium px-4">
              Authorized strictly for Founder-level operation. All telecom payloads are encrypted.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
