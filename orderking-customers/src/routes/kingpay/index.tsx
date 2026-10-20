import { createFileRoute } from "@tanstack/react-router";
import { CustomerShell } from "@/components/market/shell";
import { SupremeKingPayExperience } from "@/components/fintech/supreme-kingpay-experience";
import { AppErrorComponent } from "@/lib/error-component";

export const Route = createFileRoute("/kingpay/")({
  component: KingPayHub,
  errorComponent: AppErrorComponent,
  head: () => ({
    meta: [
      { property: "og:title", content: "KingPay — Direct UPI, Bills, Travel & Jobs" },
      { property: "og:description", content: "Direct UPI pay, utility bills directory via standard UPI PSPs, train PNR status, bus routes, verified fleet & mentor jobs, and AI Tutor." },
    ],
  }),
});

function KingPayHub() {
  return (
    <CustomerShell>
      <div className="min-h-dvh bg-gradient-to-b from-[#080a10] via-[#0d1017] to-[#080a10] pb-24 text-slate-100">
        <SupremeKingPayExperience />
      </div>
    </CustomerShell>
  );
}
