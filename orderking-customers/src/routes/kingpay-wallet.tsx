import React, { useState, useEffect } from 'react';
import { QrCode, Send, Wallet, Clock, Zap, CreditCard, ShieldCheck } from 'lucide-react';

export default function KingPayWallet() {
  const [timeLeft, setTimeLeft] = useState(172799); // 47:59:59 in seconds

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-4 pb-24 selection:bg-[#E23744]/30">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 pt-4">
        <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">KingPay</h1>
        <ShieldCheck className="text-emerald-400 w-6 h-6" />
      </div>

      {/* The Trap (Expiring Cashback) */}
      <div className="mb-8 p-[1px] rounded-2xl bg-gradient-to-r from-[#E23744] to-orange-500 animate-pulse">
        <div className="bg-slate-900 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#E23744] uppercase tracking-wider mb-1 flex items-center gap-1"><Zap className="w-3 h-3"/> Action Required</div>
            <div className="text-lg font-bold text-white">₹100 Food Cash</div>
            <div className="text-sm text-slate-400">Valid on next OrderKing delivery</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 mb-1">EXPIRES IN</div>
            <div className="text-xl font-mono font-bold text-orange-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      {/* Core Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button className="relative overflow-hidden group bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-emerald-500/50 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <QrCode className="w-10 h-10 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
          <div className="font-bold text-lg text-left">Scan QR</div>
          <div className="text-xs text-slate-400 text-left mt-1">Any UPI or BharatQR</div>
        </button>
        <button className="relative overflow-hidden group bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-cyan-500/50 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Send className="w-10 h-10 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
          <div className="font-bold text-lg text-left">Pay Contact</div>
          <div className="text-xs text-slate-400 text-left mt-1">Phone Number or UPI ID</div>
        </button>
      </div>

      {/* Balance & Bills */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 mb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Wallet className="text-slate-400 w-5 h-5" />
            <span className="font-semibold text-slate-300">KingPay Balance</span>
          </div>
          <div className="text-xl font-bold">₹0.00</div>
        </div>
        <button className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-white transition-colors flex justify-center items-center gap-2">
          <CreditCard className="w-5 h-5" /> Pay Utility Bills & Rent
        </button>
      </div>
    </div>
  );
}
