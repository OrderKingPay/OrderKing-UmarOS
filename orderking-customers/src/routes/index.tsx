import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { HomeFeed } from "@/components/market/home-feed";
import { CustomerShell } from "@/components/market/shell";
import { trackAnalytics } from "@/lib/server/quote";
import { useLocationStore } from "@/lib/stores/location";
import { isDeliveryActiveInLocation } from "@/lib/geo/geofence-guard";
import { KingPayPage } from "./king-pay";

export const Route = createFileRoute("/")({ component: Home });

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
