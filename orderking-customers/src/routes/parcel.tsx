import { createFileRoute } from "@tanstack/react-router";
import { CustomerShell } from "@/components/market/shell";
import { LocalParcelEstimator } from "@/components/parcel/local-parcel-estimator";
import { AppErrorComponent } from "@/lib/error-component";

export const Route = createFileRoute("/parcel")({
  component: ParcelRoutePage,
  errorComponent: AppErrorComponent,
});

function ParcelRoutePage() {
  return (
    <CustomerShell>
      <div className="min-h-dvh bg-[#0d1017] px-3 py-6 sm:px-6 pb-28">
        <div className="mx-auto max-w-4xl space-y-6">
          <LocalParcelEstimator />
        </div>
      </div>
    </CustomerShell>
  );
}
