import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Wallet, ReceiptText, Plane } from "lucide-react";
import { CustomerShell } from "@/components/market/shell";
import { ServiceShortcuts } from "@/components/market/service-shortcuts";
import { AppErrorComponent } from "@/lib/error-component";
import { RemittanceDesk } from "@/components/kingpay/remittance-desk";

export const Route = createFileRoute("/kingpay/")({
  component: KingPayHub,
  errorComponent: AppErrorComponent,
});

function KingPayHub() {
  return (
    <CustomerShell>
      <div className="min-h-[calc(100dvh-120px)] bg-[#FCFAF7] px-4 pb-32 pt-4 text-stone-900 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <header className="mb-5">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-amber-800">OrderKing</p>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">KingPay</h1>
            <p className="mt-1 text-sm text-stone-600">Payments, records and services that matter to you.</p>
          </header>

          <section aria-label="KingPay payment tools" className="rounded-3xl border border-amber-400/60 bg-gradient-to-br from-[#141414] to-[#292016] p-5 text-white shadow-xl">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-200 to-amber-500 text-stone-950">
                <Wallet className="size-6" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-extrabold text-amber-100">Payment tools</h2>
                <p className="text-xs leading-snug text-stone-300">Choose methods supported by your payment provider.</p>
              </div>
            </div>
            <Link to="/king-pay" className="mt-4 flex min-h-12 items-center justify-between rounded-xl bg-gradient-to-r from-amber-300 to-yellow-500 px-4 text-sm font-extrabold text-stone-950 no-underline transition hover:brightness-105">
              Open KingPay <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link to="/kingpay/passbook" className="mt-2 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-white/10 text-sm font-bold text-amber-100 no-underline hover:bg-white/15">
              <ReceiptText className="size-4" aria-hidden="true" /> HISTORY · Receipts
            </Link>
          </section>

          <section aria-label="Explore services" className="mt-6">
            <h2 className="mb-3 text-lg font-extrabold">Explore useful services</h2>
            <ServiceShortcuts variant="tiles" />
          </section>

          <section aria-label="Your trips" className="mt-5">
            <Link to="/travel/trips" className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-4 text-sm font-extrabold text-stone-900 no-underline shadow-sm hover:border-amber-400">
              <span className="flex items-center gap-2"><Plane className="size-5 text-amber-700" aria-hidden="true" /> My tickets & trips</span>
              <ArrowRight className="size-4 text-amber-700" aria-hidden="true" />
            </Link>
          </section>

          <details className="mt-5 rounded-2xl border border-stone-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-extrabold text-stone-900">Remittance information</summary>
            <p className="my-3 text-xs text-stone-600">
              Rates, fees and eligibility require verification with the supported provider.
              An estimate is not a completed transfer.
            </p>
            <RemittanceDesk />
          </details>
        </div>
      </div>
    </CustomerShell>
  );
}
