import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { 
  ScanLine, 
  Send, 
  Smartphone, 
  Lightbulb, 
  Wifi, 
  CreditCard, 
  Wallet,
  ArrowRightLeft,
  ChevronRight,
  ShieldCheck,
  Gift
} from "lucide-react";

export const Route = createFileRoute("/kingpay-wallet")({
  component: KingPayWallet,
});

function KingPayWallet() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-24 flex flex-col font-sans">
      {/* Header Section */}
      <div className="px-6 pt-12 pb-8 bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] rounded-b-[40px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-600 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600">
              KingPay
            </h1>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-green-400" />
              Bank-Grade Security
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-600 p-[2px]">
            <div className="w-full h-full bg-[#111] rounded-full flex items-center justify-center">
              <Wallet className="w-5 h-5 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-3xl p-6 bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-white/5 relative overflow-hidden backdrop-blur-xl shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-400 font-medium">Total Balance</p>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-400/50 shadow-2xs">
              👑 24K Gold Sovereign VIP
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-gray-400">₹</span>
            <span className="text-5xl font-bold tracking-tight text-white">0</span>
            <span className="text-xl font-medium text-gray-500">.00</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Prepaid Payment Instrument (PPI) wallet balance requires regulated RBI banking partner settlement integration.
          </p>
          
          {/* Canonical KingPay Navigation Banner */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 rounded-2xl relative overflow-hidden">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-yellow-500 shrink-0" />
              <p className="text-xs font-semibold text-yellow-400/90 leading-tight">
                Access verified food order ledger &amp; direct NPCI UPI checkout on canonical KingPay.
              </p>
            </div>
            <Link
              to="/king-pay"
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-yellow-500 text-black font-bold text-xs shrink-0 hover:bg-yellow-400 transition-colors"
            >
              Open /king-pay <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Primary Actions */}
      <div className="px-6 mt-8 grid grid-cols-2 gap-5">
        <Link
          to="/king-pay"
          className="relative flex flex-col items-center justify-center gap-4 p-6 rounded-[32px] bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] backdrop-blur-xl shadow-2xl overflow-hidden group"
        >
          <div className="relative w-14 h-14 rounded-[20px] bg-gradient-to-b from-white/10 to-white/5 flex items-center justify-center border border-white/10">
            <ScanLine className="w-6 h-6 text-yellow-500" />
          </div>
          <span className="text-[13px] font-bold text-gray-400 group-hover:text-gray-200 transition-colors tracking-wide text-center leading-snug">
            Direct UPI<br/>Checkout (/king-pay)
          </span>
        </Link>
        
        <Link
          to="/king-pay"
          className="relative flex flex-col items-center justify-center gap-4 p-6 rounded-[32px] bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] backdrop-blur-xl shadow-2xl overflow-hidden group"
        >
          <div className="relative w-14 h-14 rounded-[20px] bg-gradient-to-b from-white/10 to-white/5 flex items-center justify-center border border-white/10">
            <Send className="w-6 h-6 text-yellow-500 ml-1" />
          </div>
          <span className="text-[13px] font-bold text-gray-400 group-hover:text-gray-200 transition-colors tracking-wide text-center leading-snug">
            Verified Order<br/>Ledger (/king-pay)
          </span>
        </Link>
      </div>

      {/* Bill Payments Section */}
      <div className="px-6 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
            Utility Bill Categories (BBPS)
          </h2>
          <Link to="/kingpay-bbps" className="text-xs text-yellow-500 font-semibold flex items-center">
            Integration Status <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        
        <div className="bg-[#151515] rounded-[32px] p-2 border border-white/5 shadow-lg">
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Smartphone, label: "Recharge" },
              { icon: Lightbulb, label: "Electricity" },
              { icon: Wifi, label: "Broadband" },
              { icon: CreditCard, label: "Credit Card" },
            ].map((item, i) => (
              <Link 
                key={i}
                to="/kingpay-bbps"
                className="flex flex-col items-center gap-2 py-4 rounded-2xl hover:bg-[#222] transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center border border-white/5 shadow-inner">
                  <item.icon className="w-5 h-5 text-gray-300" />
                </div>
                <span className="text-[10px] font-medium text-gray-400">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity (Zero-Initialized Honest State) */}
      <div className="px-6 mt-8 flex-1">
         <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-100">Recent Transactions</h2>
            <Link to="/king-pay" className="text-xs text-yellow-500 font-semibold flex items-center">
              Go to /king-pay <ChevronRight className="w-3 h-3" />
            </Link>
         </div>
         <div className="p-6 rounded-2xl bg-[#151515] border border-white/5 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center mx-auto">
              <ArrowRightLeft className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-sm font-semibold text-gray-200">No Verified Wallet Transactions</p>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Zero ledger entries recorded on this legacy route. Use the canonical KingPay interface for real-time order payments and verified ledger records.
            </p>
            <div className="pt-2">
              <Link
                to="/king-pay"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-yellow-500 hover:text-yellow-400"
              >
                View Canonical KingPay Ledger <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
         </div>
      </div>

    </div>
  );
}
