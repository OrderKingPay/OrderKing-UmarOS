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

export const Route = createFileRoute("/kingpay-wallet")({
  component: KingPayWallet,
  errorComponent: AppErrorComponent,
  head: () => ({
    meta: [
      { property: "og:title", content: "KingPay" },
      {
        property: "og:description",
        content: "Pay Anyone, Book Travel, AI Tutor & Jobs.",
      },
    ],
  }),
});

function KingPayWallet() {
  return (
    <CustomerShell>
      <div className="min-h-dvh bg-gradient-to-b from-[#080a10] via-[#0d1017] to-[#080a10] pb-24 text-slate-100">
        <SupremeKingPayExperience />
      </div>
    </CustomerShell>
  );
}
