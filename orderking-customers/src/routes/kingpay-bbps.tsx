import { Buffer } from "buffer";
if (typeof globalThis !== "undefined" && !(globalThis as any).Buffer) {
  (globalThis as any).Buffer = Buffer;
}
if (typeof window !== "undefined" && !(window as any).Buffer) {
  (window as any).Buffer = Buffer;
}
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, AlertTriangle, ShieldCheck } from "lucide-react";
import { UtilitiesBillEngine } from "@/components/fintech/utilities-bill-engine";

export const Route = createFileRoute("/kingpay-bbps")({
  component: KingPayBBPS,
});

function KingPayBBPS() {
  return (
    <div className="min-h-screen bg-[#07090E] text-white pb-24 flex flex-col font-sans">
      <div className="px-4 sm:px-6 pt-8 pb-4 bg-[#0B0F17] border-b border-slate-800 flex items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link
            to="/king-pay"
            className="size-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition"
          >
            <ChevronLeft className="size-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">Recharge &amp; Bill Pay</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                BBPS Offline · Awaiting Clearance
              </span>
            </div>
            <p className="text-xs text-slate-400">Mobile, electricity, broadband, DTH, FASTag &amp; gas billers · Fees ₹0 (Waived)</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <ShieldCheck className="size-3.5 text-emerald-400" />
          <span>GSTIN 18AFXPH9838M1Z9</span>
        </div>
      </div>

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 space-y-4">
        {/* Offline Status Advisory */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3">
          <AlertTriangle className="size-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-white block">
              Official BBPS Clearing Clearance In Progress
            </span>
            <p className="text-slate-300 leading-relaxed">
              OrderKing&apos;s direct Bharat BillPay (BBPS) aggregator clearance is currently undergoing statutory regulatory licensing. In accordance with Section 9(5) CGST and consumer protection laws (Orderkingpay, Assam - 788710, GSTIN: 18AFXPH9838M1Z9), <strong>in-app payment collections are disabled</strong> to protect customer funds. Please use the official biller links provided to pay directly.
            </p>
          </div>
        </div>

        <UtilitiesBillEngine />
      </main>
    </div>
  );
}
