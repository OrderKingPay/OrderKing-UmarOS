import { Buffer } from "buffer";
if (typeof globalThis !== "undefined" && !(globalThis as any).Buffer) {
  (globalThis as any).Buffer = Buffer;
}
if (typeof window !== "undefined" && !(window as any).Buffer) {
  (window as any).Buffer = Buffer;
}
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { UtilitiesBillEngine } from "@/components/fintech/utilities-bill-engine";

export const Route = createFileRoute("/kingpay-bbps")({
  component: KingPayBBPS,
});

function KingPayBBPS() {
  return (
    <div className="min-h-screen bg-[#07090E] text-white pb-24 flex flex-col font-sans">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-8 pb-4 bg-[#0B0F17] border-b border-slate-800 flex items-center gap-4 sticky top-0 z-40">
        <Link
          to="/kingpay-wallet"
          className="size-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">Utilities</h1>
          <p className="text-xs text-slate-400">Electricity, mobile, DTH, FASTag, gas &amp; water</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6">
        <UtilitiesBillEngine />
      </main>
    </div>
  );
}
