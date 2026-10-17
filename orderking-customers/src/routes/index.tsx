import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CustomerShell } from "@/components/market/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { trackAnalytics } from "@/lib/server/quote";
import { useLocationStore } from "@/lib/stores/location";
import { isDeliveryActiveInLocation } from "@/lib/geo/geofence-guard";
import { CustomerAppSkeleton } from "@/components/skeletons/customer-app-skeleton";
import { AppErrorComponent } from "@/lib/error-component";
import { DynamicSectionRenderer } from "@orderking/ui";
import { homeSectionRegistry, HomeSectionFallback } from "@/components/sdui/home-sections";
import { UltraLuxuryHero } from "@/components/market/ultra-luxury-hero";

export const Route = createFileRoute('/')({
  component: Home,
  pendingComponent: CustomerAppSkeleton,
  errorComponent: AppErrorComponent,
  head: () => ({
    meta: [
      { property: 'og:title', content: 'OrderKing - Direct Kitchen Delivery & Transparent Pricing' },
      { property: 'og:description', content: 'FSSAI verified partner kitchens, zero menu markups, and express 25-30m delivery.' },
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
        {/* Transparent Pricing & Hygiene Trust Strip */}
        <div className="border-b border-amber-900/10 bg-gradient-to-r from-amber-500/10 via-yellow-400/15 to-amber-500/10 px-3 py-1.5 text-center backdrop-blur-xs">
          <div className="flex items-center justify-center gap-2 text-[11px] font-extrabold text-amber-950">
            <span className="flex size-4 items-center justify-center rounded-full bg-amber-400/80 text-[10px] shadow-2xs">
              👑
            </span>
            <span className="tracking-tight">
              Order food online from verified kitchens near you · <span className="text-amber-800">25-30m Delivery</span> · <span className="text-emerald-800">0% Menu Markups</span>
            </span>
          </div>
        </div>

        {/* 10x Ultra-Luxury 3D Ambient Jewel Hero Section */}
        <div className="px-3 pt-3 sm:px-4 sm:pt-4">
          <UltraLuxuryHero />
        </div>

        {/* Server-Driven UI (SDUI) Dynamic Section Renderer */}
        <ErrorBoundary sectionName="SDUI Home Feed">
          <DynamicSectionRenderer
            pageId="customer_home"
            registry={homeSectionRegistry}
            fallback={HomeSectionFallback}
            className="w-full space-y-4 px-3 py-3 sm:px-4 sm:py-4"
          />
        </ErrorBoundary>
      </div>
    </CustomerShell>
  );
}
