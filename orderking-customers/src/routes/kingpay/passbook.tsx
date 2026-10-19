import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Wallet,
  ArrowRight,
  Sparkles,
  Receipt,
  CreditCard,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { CustomerShell } from "@/components/market/shell";
import { AppErrorComponent } from "@/lib/error-component";
import { OrderKingPassbookReceipts } from "@/components/fintech/orderking-passbook-receipts";
import { useRealKingPayWallet } from "@/lib/hooks/use-real-kingpay-wallet";
import { formatPaise } from "@/lib/money";

export const Route = (createFileRoute as any)("/kingpay/passbook")({
  component: KingPayPassbookPage,
  errorComponent: AppErrorComponent,
});

function KingPayPassbookPage() {
  const { walletBalancePaise } = useRealKingPayWallet();

  return (
    <CustomerShell>
      <div className="min-h-dvh bg-[#FCFAF7] px-4 py-6 pb-32 text-stone-900">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-amber-900/10 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-3 py-0.5 text-xs font-bold text-amber-900 mb-2">
                <Sparkles className="size-3 text-amber-600" />
                <span>UPI &amp; Remit Passbook</span>
              </div>
              <h1 className="text-2xl font-black text-stone-950 tracking-tight sm:text-3xl">
                HISTORY
              </h1>
              <p className="text-xs text-stone-600 mt-1 font-medium">
                Your recorded KingPay transactions, receipts, and payment activity. Payment completion must be confirmed by your provider.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/king-pay"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-105 text-slate-950 px-4 py-2 text-xs font-bold transition no-underline shadow-xs shrink-0"
              >
                <CreditCard className="size-3.5" />
                <span>Open KingPay UPI</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Balance Banner */}
          <div className="rounded-3xl border border-amber-300/80 bg-gradient-to-br from-amber-50 via-white to-amber-100/50 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-xs">
                <Wallet className="size-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                  Balance returned by the connected account
                </p>
                <p className="text-2xl font-black font-mono text-stone-900">
                  {formatPaise(walletBalancePaise)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
                <ShieldCheck className="size-3.5 text-emerald-600" />
                Verify status with your payment provider
              </span>
            </div>
          </div>

          {/* Full Passbook Ledger Component */}
          <div className="rounded-3xl border border-stone-200 bg-white p-4 sm:p-6 shadow-xs">
            <OrderKingPassbookReceipts theme="light" />
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
