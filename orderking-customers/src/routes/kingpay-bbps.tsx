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

      {/* The Promotional Banner */}
      <div className="px-6 mt-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-3xl p-6 relative overflow-hidden shadow-2xl"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-2xl" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white leading-tight mb-1">
                Pay any bill, get 10% flat cashback in Food Cash.
              </h3>
              <p className="text-sm text-yellow-100 font-medium">
                Use it on your next OrderKing meal!
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bill Categories */}
      <div className="px-6 mt-8">
        <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">
          Categories
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Lightbulb, label: "Electricity", color: "text-blue-400", bg: "bg-blue-400/10" },
            { icon: Car, label: "FASTag", color: "text-green-400", bg: "bg-green-400/10" },
            { icon: Home, label: "Rent", color: "text-purple-400", bg: "bg-purple-400/10" },
            { icon: Tv, label: "DTH", color: "text-orange-400", bg: "bg-orange-400/10" },
          ].map((item, i) => (
            <motion.button 
              key={i}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-4 p-4 rounded-3xl bg-[#151515] border border-white/5 hover:bg-[#1A1A1A] transition-colors"
            >
              <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center shrink-0`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <span className="text-sm font-semibold text-gray-200">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Fast Payments */}
      <div className="px-6 mt-8">
        <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" /> Fast Payments
        </h2>
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-[#151515] border border-white/5 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">BESCOM</p>
                  <p className="text-xs text-gray-400">ID: 123456789</p>
                </div>
             </div>
             <button className="px-4 py-2 bg-white/10 text-sm font-semibold text-white rounded-full hover:bg-white/20">
               Pay ₹1,450
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
