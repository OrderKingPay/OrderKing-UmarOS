import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { RiderBenefitsHub } from "@/components/rider/rider-benefits-hub";
import { bootstrapRiderFn, getHomeFn } from "@/lib/server/rider-fns";
import type { RiderProfile } from "@/lib/rider/types";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/benefits")({ component: BenefitsPage });

function BenefitsPage() {
  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [lifetimeTrips, setLifetimeTrips] = useState(0);

  useEffect(() => {
    void bootstrapRiderFn().then(setRider).catch(() => undefined);
    void getHomeFn()
      .then((h) => {
        setLifetimeTrips(h.rider?.lifetimeDeliveries ?? h.completedToday ?? 0);
      })
      .catch(() => undefined);
  }, []);

  return (
    <AppShell>
      <div className="space-y-4">
        <RiderBenefitsHub
          lifetimeDeliveries={lifetimeTrips}
          riderName={rider?.fullName}
        />
      </div>
    </AppShell>
  );
}
