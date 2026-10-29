import { createFileRoute } from "@tanstack/react-router";
import { CustomerShell } from "@/components/market/shell";
import { CustomerAppSkeleton } from "@/components/skeletons/customer-app-skeleton";
import { AppErrorComponent } from "@/lib/error-component";
import { HomeFeed } from "@/components/market/home-feed";

export const Route = createFileRoute("/")({
  component: Home,
  pendingComponent: CustomerAppSkeleton,
  errorComponent: AppErrorComponent,
  head: () => ({meta: [
    { property: "og:title", content: "OrderKing — Restaurants & Food Delivery" },
    { property: "og:description", content: "Find restaurants and browse available menus in your area." },
  ]}),
});

function Home() {
  return (
    <CustomerShell>
      <div className="min-h-full bg-[#FCFAF7]">
        <HomeFeed />
      </div>
    </CustomerShell>
  );
}
