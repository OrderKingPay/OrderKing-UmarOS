
import { createFileRoute, Link } from "@tanstack/react-router";
import { CustomerShell } from "@/components/market/shell";
import { ShieldCheck, Wallet, QrCode, Banknote } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/king-pay")({ component: OrderKingPayPage });

function OrderKingPayPage() {
  return (
    <CustomerShell>
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-sm max-w-sm w-full"
        >
          <div className="flex justify-center mb-6">
            <div className="relative">
              
              <Wallet className="w-12 h-12 text-white relative z-10" />
            </div>
          </div>
          
          <h1 className="text-3xl font-medium text-white mb-2">
            OrderKing Pay
          </h1>
          <p className="text-sm text-zinc-400 mb-8 font-medium">
            Global Financial Infrastructure. Encrypted & Secured.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors rounded-2xl p-4 flex flex-col items-center gap-2">
              <QrCode className="w-8 h-8 text-white" />
              <span className="text-xs font-medium text-zinc-400">UPI Scanner</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors rounded-2xl p-4 flex flex-col items-center gap-2">
              <Wallet className="w-8 h-8 text-white" />
              <span className="text-xs font-medium text-zinc-400">Wallet</span>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-start gap-3 text-left">
            <ShieldCheck className="w-5 h-5 text-white shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-white">Secure Payments</h3>
              <p className="text-[10px] text-zinc-500 mt-1">
                Real financial services require payment gateway integration. All placeholder UI has been removed. Services will activate upon official integration.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </CustomerShell>
  );
}
