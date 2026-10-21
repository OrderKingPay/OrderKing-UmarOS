import { createFileRoute, Link } from "@tanstack/react-router";
import { CustomerShell } from "@/components/market/shell";
import { RemittanceDesk } from "@/components/kingpay/remittance-desk";
import { AppErrorComponent } from "@/lib/error-component";
import { CreditCard, History } from "lucide-react";

export const Route = (createFileRoute as any)("/kingpay/remittance")({
  component: KingPayRemittancePage,
  errorComponent: AppErrorComponent,
});

function KingPayRemittancePage() {
  return (
    <CustomerShell>
      <div className="min-h-screen bg-slate-950 text-white pb-28 pt-2">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-amber-400 transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link to="/kingpay" className="hover:text-amber-400 transition-colors">
              KingPay
            </Link>
            <span>/</span>
            <span className="text-amber-400 font-bold">FX &amp; Remittance Calculator</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/king-pay"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/40 text-slate-300 hover:text-amber-300 font-bold text-xs transition"
            >
              <CreditCard className="size-3.5" />
              <span>KingPay UPI Hub</span>
            </Link>
          </div>
        </div>

        <RemittanceDesk />
      </div>
    </CustomerShell>
  );
}
