import { Buffer } from "buffer";
if (typeof globalThis !== "undefined" && !(globalThis as any).Buffer) {
  (globalThis as any).Buffer = Buffer;
}
if (typeof window !== "undefined" && !(window as any).Buffer) {
  (window as any).Buffer = Buffer;
}
import { createFileRoute } from "@tanstack/react-router";
import { CustomerShell } from "@/components/market/shell";
import { SupremeKingPayExperience } from "@/components/fintech/supreme-kingpay-experience";
import { AppErrorComponent } from "@/lib/error-component";

export const Route = createFileRoute("/king-pay")({
  component: OrderKingPayPage,
  errorComponent: AppErrorComponent,
  head: () => ({
    meta: [
      { property: "og:title", content: "KingPay — Direct UPI, Dynamic BharatQR & Instant Payments" },
      {
        property: "og:description",
        content: "Direct UPI pay, dynamic BharatQR, instant refunds, and double-entry ledger security.",
      },
    ],
  }),
});

function OrderKingPayPage() {
  return (
    <CustomerShell>
      <div className="min-h-dvh bg-gradient-to-b from-[#080a10] via-[#0d1017] to-[#080a10] pb-24 text-slate-100">
        <SupremeKingPayExperience />
      </div>
    </CustomerShell>
  );
}
