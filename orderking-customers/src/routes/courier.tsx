import { createFileRoute } from "@tanstack/react-router";
import { CustomerShell } from "@/components/market/shell";
import { PorterParcelEngine } from "@/components/courier/porter-parcel-engine";
import { AppErrorComponent } from "@/lib/error-component";

export const Route = createFileRoute("/courier")({
  component: CourierPage,
  errorComponent: AppErrorComponent,
  head: () => ({
    meta: [
      { property: "og:title", content: "Local Parcel & Courier — OrderKing" },
      {
        property: "og:description",
        content:
          "Point-to-point on-demand local parcel and courier delivery. Documents, food, keys, and packages up to 15 kg with ₹30 base fare and ₹10/km transparent pricing.",
      },
    ],
  }),
});

function CourierPage() {
  return (
    <CustomerShell>
      <div className="min-h-dvh bg-gradient-to-b from-[#080a10] via-[#0d1017] to-[#080a10] pb-24 text-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
          <PorterParcelEngine />
        </div>
      </div>
    </CustomerShell>
  );
}
