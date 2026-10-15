import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { HomeFeed } from "@/components/market/home-feed";
import { CustomerShell } from "@/components/market/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { trackAnalytics } from "@/lib/server/quote";
import { useLocationStore } from "@/lib/stores/location";
import { isDeliveryActiveInLocation } from "@/lib/geo/geofence-guard";

import { CustomerAppSkeleton } from "@/components/skeletons/customer-app-skeleton";
import { AppErrorComponent } from "@/lib/error-component";

export const Route = createFileRoute('/')({
  component: Home,
  pendingComponent: CustomerAppSkeleton,
  errorComponent: AppErrorComponent,
  head: () => ({
    meta: [
      { property: 'og:title', content: 'OrderKing - Uncompromising Culinary Excellence' },
      { property: 'og:description', content: 'Curated gastronomy. Impeccable delivery.' },
    ],
  }),
});

function Home() {
  const navigate = useNavigate();
  const location = useLocationStore((s) => s.location);
  const isDeliveryActive = location ? isDeliveryActiveInLocation(location.lat, location.lng, location.cityId) : true;

  useEffect(() => {
    void trackAnalytics({
      data: {
        name: "app_open",
        payload: {
          cityId: location?.cityId,
          cityName: location?.cityName,
          isDeliveryActive,
        },
      },
    }).catch(() => {});
  }, [location?.cityId, location?.cityName, isDeliveryActive]);

  return (
    <CustomerShell onSearch={() => void navigate({ to: "/search" })}>
      <div className="min-h-full bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFEB]">
        {/* Prestige Royal Trust Strip */}
        <div className="border-b border-amber-900/10 bg-gradient-to-r from-amber-500/10 via-yellow-400/15 to-amber-500/10 px-3 py-1.5 text-center backdrop-blur-xs">
          <div className="flex items-center justify-center gap-2 text-[11px] font-extrabold text-amber-950">
            <span className="flex size-4 items-center justify-center rounded-full bg-amber-400/80 text-[10px] shadow-2xs">
              👑
            </span>
            <span className="tracking-tight">
              Prestige Gastronomy · <span className="text-amber-800">0% Menu Markups</span> · FSSAI Verified Kitchens
            </span>
            <span className="hidden sm:inline text-amber-700">· 100% Direct Chef Delivery</span>
          </div>
        </div>

        <ErrorBoundary>
          <HomeFeed />
        </ErrorBoundary>
      </div>
    </CustomerShell>
  );
}
