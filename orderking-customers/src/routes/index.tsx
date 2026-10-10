import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { HomeFeed } from "@/components/market/home-feed";
import { CustomerShell } from "@/components/market/shell";
import { trackAnalytics } from "@/lib/server/quote";
import { useLocationStore } from "@/lib/stores/location";
import { isDeliveryActiveInLocation } from "@/lib/geo/geofence-guard";

export const Route = createFileRoute('/')({ component: Home, head: () => ({ meta: [{ property: 'og:title', content: 'OrderKing - Uncompromising Culinary Excellence' }, { property: 'og:description', content: 'Curated gastronomy. Impeccable delivery.' }] }) });

function Home() {
  const navigate = useNavigate();
  const location = useLocationStore((s) => s.location);
  const isDeliveryActive = isDeliveryActiveInLocation(location.lat, location.lng, location.cityId);

  useEffect(() => {
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
  }, [location.cityId, location.cityName, isDeliveryActive]);

  return (
    <>
      <CustomerShell onSearch={() => void navigate({ to: "/search" })}>
        <HomeFeed />
      </CustomerShell>
    </>
  );
}
