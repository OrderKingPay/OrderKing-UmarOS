import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { 
  Lightbulb, 
  Car, 
  Home, 
  Tv, 
  ChevronLeft,
  Gift,
  Zap
} from "lucide-react";

export const Route = createFileRoute("/kingpay-bbps")({
  component: KingPayBBPS,
});

function KingPayBBPS() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-24 flex flex-col font-sans">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 bg-[#1A1A1A] flex items-center gap-4 sticky top-0 z-50 shadow-md">
        <Link to="/kingpay-wallet" className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center">
          <ChevronLeft className="w-6 h-6 text-white" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Utility Bills</h1>
          <p className="text-xs text-gray-400">Powered by BBPS</p>
        </div>
      </div>

      {/* BBPS Partner Integration Disclosure Banner */}
      <div className="px-6 mt-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#151515] border border-amber-500/30 rounded-3xl p-6 relative overflow-hidden shadow-2xl"
        >
          <div className="relative z-10 flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-amber-500/20">
              <Zap className="w-6 h-6 text-amber-400" />
            </div>
            <div className="space-y-2">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                BBPS Partner Integration Pending
              </span>
              <h3 className="text-base font-bold text-white leading-tight">
                NPCI Bharat Connect (BBPS) Biller Operating Unit Authorization Required
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Live utility bill fetching and settlement require an active NPCI Bharat BillPay Operating Unit (BBPOU) sponsor bank integration. No utility bills are fetched or stored on this route.
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <Link
                  to="/king-pay"
                  className="px-4 py-2 rounded-xl bg-yellow-500 text-black font-bold text-xs hover:bg-yellow-400 transition-colors"
                >
                  Open Canonical /king-pay
                </Link>
                <a
                  href="https://www.bharatbillpay.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-white/10 text-white font-semibold text-xs hover:bg-white/15 transition-colors"
                >
                  Official NPCI Bharat BillPay Portal ↗
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bill Categories (Pending Biller Directory) */}
      <div className="px-6 mt-8">
        <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">
          Supported BBPS Categories (Pending BBPOU Activation)
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Lightbulb, label: "Electricity", color: "text-blue-400", bg: "bg-blue-400/10" },
            { icon: Car, label: "FASTag", color: "text-green-400", bg: "bg-green-400/10" },
            { icon: Home, label: "Housing & Utilities", color: "text-purple-400", bg: "bg-purple-400/10" },
            { icon: Tv, label: "DTH & Cable", color: "text-orange-400", bg: "bg-orange-400/10" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-3xl bg-[#151515] border border-white/5 opacity-80"
            >
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl ${item.bg} flex items-center justify-center shrink-0`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-200 block">{item.label}</span>
                  <span className="text-[10px] text-amber-400/80 font-medium">Partner Pending</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Biller Account Ledger Status */}
      <div className="px-6 mt-8">
        <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
          <Gift className="w-4 h-4 text-yellow-500" /> Linked Utility Billers
        </h2>
        <div className="p-6 rounded-3xl bg-[#151515] border border-white/5 text-center space-y-2">
          <p className="text-sm font-bold text-gray-200">Zero Linked Biller Accounts</p>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            No electricity, broadband, or state utility consumer IDs are linked. For food order payments and verified UPI deep-link checkout, proceed to KingPay.
          </p>
          <div className="pt-2">
            <Link
              to="/king-pay"
              className="inline-flex items-center px-4 py-2 bg-white/10 text-xs font-semibold text-yellow-400 rounded-full hover:bg-white/20 transition-colors"
            >
              Go to /king-pay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
