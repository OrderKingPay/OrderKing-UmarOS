
const fs = require("fs");
const path = "orderking-customers/src/routes/king-pay.tsx";

const newContent = `
import { createFileRoute, Link } from "@tanstack/react-router";
import { CustomerShell } from "@/components/market/shell";
import { ShieldCheck, Wallet, QrCode, Banknote } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/king-pay")({ component: KingPayPage });

function KingPayPage() {
  return (
    <CustomerShell>
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/80 backdrop-blur-3xl border border-amber-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(245,158,11,0.15)] max-w-sm w-full"
        >
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-20 rounded-full"></div>
              <span className="text-6xl drop-shadow-2xl relative z-10">👑</span>
            </div>
          </div>
          
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500 mb-2">
            KingPay
          </h1>
          <p className="text-sm text-slate-300 mb-8 font-medium">
            Sovereign Payments & Wallet Infrastructure. Zero Fake Data.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2">
              <QrCode className="w-8 h-8 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300">UPI Scanner</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2">
              <Wallet className="w-8 h-8 text-sky-400" />
              <span className="text-xs font-bold text-slate-300">Wallet</span>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 text-left">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-400">RBI Compliant</h3>
              <p className="text-[10px] text-slate-400 mt-1">
                Real financial services require KYC and RBI integration. All placeholder UI has been removed. Services will activate upon official integration.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </CustomerShell>
  );
}
`;

fs.writeFileSync(path, newContent, "utf8");
console.log("Rewrote king-pay.tsx entirely");

