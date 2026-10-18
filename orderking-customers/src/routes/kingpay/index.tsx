import { createFileRoute, Link } from "@tanstack/react-router";
import { CustomerShell } from "@/components/market/shell";
import { RemittanceDesk } from "@/components/kingpay/remittance-desk";
import { AppErrorComponent } from "@/lib/error-component";
import { CreditCard, History, ShieldCheck, ArrowRight, Wallet, QrCode } from "lucide-react";
import { useRealKingPayWallet } from "@/lib/hooks/use-real-kingpay-wallet";
import { formatPaise } from "@/lib/money";

export const Route = createFileRoute("/kingpay/")({
  component: KingPayIndexPage,
  errorComponent: AppErrorComponent,
});

function KingPayIndexPage() {
  const { walletBalancePaise } = useRealKingPayWallet();

  return (
    <CustomerShell>
      <div className="min-h-screen bg-slate-950 text-white pb-28 pt-2">
        {/* Navigation Breadcrumb & Quick Actions */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-amber-400 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-amber-400 font-bold">KingPay Sovereign Desk</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/king-pay"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/40 text-slate-300 hover:text-amber-300 font-bold text-xs transition"
            >
              <CreditCard className="size-3.5" />
              <span>Full UPI Hub</span>
            </Link>
            <Link
              to="/kingpay/passbook"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/40 text-slate-300 hover:text-amber-300 font-bold text-xs transition"
            >
              <History className="size-3.5" />
              <span>Ledger Passbook</span>
            </Link>
          </div>
        </div>

        {/* Global Remittance Desk */}
        <RemittanceDesk />
      </div>
    </CustomerShell>
  );
}
