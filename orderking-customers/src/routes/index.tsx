
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HomeFeed } from "@/components/market/home-feed";
import { CustomerShell } from "@/components/market/shell";
import { trackAnalytics } from "@/lib/server/quote";
import { useLocationStore } from "@/lib/stores/location";
import { isDeliveryActiveInLocation } from "@/lib/geo/geofence-guard";
import { KingPayPage } from "./king-pay";

export const Route = createFileRoute('/')({ component: Home, head: () => ({ meta: [{ property: 'og:title', content: '🍔 OrderKing - Local Food Delivery.' }, { property: 'og:description', content: 'Order from local kitchens with live availability, pricing and delivery status.' }, { name: 'twitter:title', content: '🍔 OrderKing - Local Food Delivery.' }, { name: 'twitter:description', content: 'Order from elite local kitchens.' }] }) });

function Home() {
  const navigate = useNavigate();
  const location = useLocationStore((s) => s.location);
  const isDeliveryActive = isDeliveryActiveInLocation(location.lat, location.lng, location.cityId);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (!hydrated) return;
    void trackAnalytics({
      data: {
        name: "app_open",
        payload: {
          cityId: location.cityId,
          cityName: location.cityName,
          isDeliveryActive,
        },
      },
    });
  }, [hydrated, location.cityId, location.cityName, isDeliveryActive]);

  if (!hydrated) {
    return (
      <CustomerShell onSearch={() => void navigate({ to: "/search" })}>
        <div className="min-h-[60vh] px-3 py-4 space-y-4" aria-busy="true">
          <div className="h-10 w-2/3 rounded-2xl bg-surface animate-pulse" />
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-56 rounded-[var(--radius-3xl)] border border-border bg-surface animate-pulse" />
            ))}
          </div>
        </div>
      </CustomerShell>
    );
  }

  // 1,000x Strict Geofencing:
  // In locations where Order King is NOT active, users must ONLY see and use King Pay.
  // Order King FOODS is completely invisible and inaccessible.
  if (!isDeliveryActive) {
    return <KingPayPage isGeofencedFallback={true} />;
  }

  return (
    <CustomerShell onSearch={() => void navigate({ to: "/search" })}>
      <HomeFeed />
    </CustomerShell>
  );
}
