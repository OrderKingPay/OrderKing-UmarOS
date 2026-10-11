import { createFileRoute } from "@tanstack/react-router";
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
          <p className="text-sm text-gray-400 font-medium mb-1">Total Balance</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-gray-400">₹</span>
            <span className="text-5xl font-bold tracking-tight text-white">42,500</span>
            <span className="text-xl font-medium text-gray-500">.00</span>
          </div>
          
          {/* Ecosystem Hijack Banner */}
          <div className="mt-6 inline-flex w-full items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 rounded-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/10 to-yellow-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <Gift className="w-5 h-5 text-yellow-500 shrink-0" />
            <p className="text-xs font-semibold text-yellow-400/90 leading-tight">
              Pay a friend or a bill, instantly earn <span className="text-yellow-400 font-bold">OrderKing Food Cash.</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Primary Actions */}
      <div className="px-6 mt-8 grid grid-cols-2 gap-5">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="relative flex flex-col items-center justify-center gap-4 p-6 rounded-[32px] bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] backdrop-blur-xl shadow-2xl overflow-hidden group"
        >
          {/* Animated Glow on Hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/0 via-yellow-500/5 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Top border highlight */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative w-14 h-14 rounded-[20px] bg-gradient-to-b from-white/10 to-white/5 flex items-center justify-center border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] group-hover:shadow-[0_0_15px_rgba(234,179,8,0.15)] transition-all duration-300">
            <div className="absolute inset-0 bg-yellow-500/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-screen" />
            <ScanLine className="w-6 h-6 text-yellow-500 group-hover:text-yellow-400 group-hover:scale-110 transition-all duration-300 drop-shadow-md" />
          </div>
          <span className="text-[13px] font-bold text-gray-400 group-hover:text-gray-200 transition-colors tracking-wide text-center leading-snug">
            Scan ANY<br/>UPI QR
          </span>
        </motion.button>
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="relative flex flex-col items-center justify-center gap-4 p-6 rounded-[32px] bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] backdrop-blur-xl shadow-2xl overflow-hidden group"
        >
          {/* Animated Glow on Hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/0 via-yellow-500/5 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Top border highlight */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative w-14 h-14 rounded-[20px] bg-gradient-to-b from-white/10 to-white/5 flex items-center justify-center border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] group-hover:shadow-[0_0_15px_rgba(234,179,8,0.15)] transition-all duration-300">
             <div className="absolute inset-0 bg-yellow-500/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-screen" />
            <Send className="w-6 h-6 text-yellow-500 group-hover:text-yellow-400 group-hover:scale-110 transition-all duration-300 drop-shadow-md ml-1" />
          </div>
          <span className="text-[13px] font-bold text-gray-400 group-hover:text-gray-200 transition-colors tracking-wide text-center leading-snug">
            Send Money<br/>to Contact
          </span>
        </motion.button>
      </div>

      {/* Bill Payments Section */}
      <div className="px-6 mt-8">
        <h2 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2">
          Pay Utility Bills & Rent
        </h2>
        
        <div className="bg-[#151515] rounded-[32px] p-2 border border-white/5 shadow-lg">
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Smartphone, label: "Recharge" },
              { icon: Lightbulb, label: "Electricity" },
              { icon: Wifi, label: "Broadband" },
              { icon: CreditCard, label: "Credit Card" },
            ].map((item, i) => (
              <motion.button 
                key={i}
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-2 py-4 rounded-2xl hover:bg-[#222] transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center border border-white/5 shadow-inner">
                  <item.icon className="w-5 h-5 text-gray-300" />
                </div>
                <span className="text-[10px] font-medium text-gray-400">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity (Placeholder for premium feel) */}
      <div className="px-6 mt-8 flex-1">
         <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-100">Recent Transactions</h2>
            <button className="text-xs text-yellow-500 font-semibold flex items-center">
              View All <ChevronRight className="w-3 h-3" />
            </button>
         </div>
         <div className="space-y-4">
            {[
              { name: "Rahul Sharma", amount: "-₹850", time: "Today, 2:45 PM", icon: ArrowRightLeft },
              { name: "Jio Fiber", amount: "-₹1,180", time: "Yesterday", icon: Wifi },
            ].map((tx, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-[#151515] border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center">
                    <tx.icon className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-200">{tx.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{tx.time}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-white">{tx.amount}</span>
              </div>
            ))}
         </div>
      </div>

    </div>
  );
}
