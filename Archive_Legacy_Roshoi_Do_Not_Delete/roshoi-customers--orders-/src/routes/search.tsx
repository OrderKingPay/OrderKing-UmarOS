import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { HomeFeed } from "@/components/market/home-feed";
import { CustomerShell } from "@/components/market/shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers";
import { trackAnalytics } from "@/lib/server/quote";
import { useLocationStore } from "@/lib/stores/location";
import { isDeliveryActiveInLocation } from "@/lib/geo/geofence-guard";

type Search = { q?: string; category?: string; veg?: boolean; openNow?: boolean };

export const Route = createFileRoute("/search")({
  validateSearch: (raw: Record<string, unknown>): Search => ({
    q: typeof raw.q === "string" ? raw.q : "",
    category: typeof raw.category === "string" ? raw.category : undefined,
    veg: raw.veg === true || raw.veg === "true",
    openNow: raw.openNow === true || raw.openNow === "true",
  }),
  component: SearchPage,
});

function SearchPage() {
  const { t } = useT();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [draft, setDraft] = useState(search.q ?? "");
  const location = useLocationStore((s) => s.location);
  const isDeliveryActive = isDeliveryActiveInLocation(location.lat, location.lng, location.cityId);

  const commit = (next: Search) => {
    void navigate({ search: next });
    if (next.q) void trackAnalytics({ data: { name: "search", payload: { q: next.q } } });
  };

  if (!isDeliveryActive) {
    return (
      <CustomerShell onSearch={() => undefined}>
        <div className="px-4 py-12 text-center space-y-4">
          <span className="text-4xl block animate-bounce">👑</span>
          <h1 className="font-display text-2xl font-bold text-fg">
            Food Search is not active in {location.cityName || "your region"}
          </h1>
          <p className="text-sm text-muted max-w-sm mx-auto">
            Order King food catalog is 1,000x strictly geofenced. You can search utilities, FASTag, bills, flights, and UPI on King Pay!
          </p>
          <Button asChild className="bg-primary text-white font-bold px-6 py-2 rounded-xl">
            <Link to="/king-pay">Search on King Pay 👑</Link>
          </Button>
        </div>
      </CustomerShell>
    );
  }

  return (
    <CustomerShell onSearch={() => undefined}>
      <div className="px-3 pt-3 sm:px-4 sm:pt-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            commit({ ...search, q: draft });
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("home.searchPlaceholder")}
            aria-label={t("common.search")}
            autoFocus
          />
        </form>
        <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <FilterChip
            active={Boolean(search.veg)}
            onClick={() => commit({ ...search, veg: !search.veg })}
            label={t("home.vegOnly")}
          />
          <FilterChip
            active={Boolean(search.openNow)}
            onClick={() => commit({ ...search, openNow: !search.openNow })}
            label={t("home.openNow")}
          />
          <FilterChip
            active={search.category === "Biryani"}
            onClick={() => commit({ ...search, category: search.category === "Biryani" ? undefined : "Biryani" })}
            label="🍗 Biryani"
          />
          <FilterChip
            active={search.category === "Pizza"}
            onClick={() => commit({ ...search, category: search.category === "Pizza" ? undefined : "Pizza" })}
            label="🍕 Pizza"
          />
          <FilterChip
            active={search.category === "Rolls"}
            onClick={() => commit({ ...search, category: search.category === "Rolls" ? undefined : "Rolls" })}
            label="🌯 Rolls"
          />
          <FilterChip
            active={search.category === "Cafe"}
            onClick={() => commit({ ...search, category: search.category === "Cafe" ? undefined : "Cafe" })}
            label="☕ Cafe"
          />
        </div>
      </div>

      {/* Restaurants Only Feed (Exact Clean Zomato Style) */}
      <HomeFeed q={search.q} veg={search.veg} openNow={search.openNow} category={search.category} />
    </CustomerShell>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 shrink-0 rounded-full px-3 text-sm ${active ? "bg-primary text-primary-fg" : "bg-surface text-fg"}`}
    >
      {label}
    </button>
  );
}

