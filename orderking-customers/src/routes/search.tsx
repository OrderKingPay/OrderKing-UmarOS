
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
        <div className="px-4 py-12 text-center space-y-4 bg-white text-gray-900">
          <span className="text-4xl block animate-bounce">👑</span>
          <h1 className="font-extrabold text-2xl text-gray-900">
            Food Search is not active in {location.cityName || "your region"}
          </h1>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Order King food catalog is strictly geofenced. You can explore utilities, bills, and payments on King Pay!
          </p>
          <Button asChild className="bg-[#E23744] hover:bg-[#c92f3b] text-white font-bold px-6 py-2 rounded-xl">
            <Link to="/king-pay">Search on King Pay 👑</Link>
          </Button>
        </div>
      </CustomerShell>
    );
  }

  return (
    <CustomerShell onSearch={() => undefined}>
      <div className="px-3 pt-3 sm:px-4 sm:pt-4 bg-white">
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
            className="bg-gray-50 border-gray-200 text-gray-900 focus:bg-white focus:border-[#E23744] rounded-xl h-11 text-sm font-medium"
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
      className={`min-h-9 shrink-0 rounded-full px-3.5 text-xs font-bold transition-all border ${
        active
          ? "bg-[#E23744] text-white border-[#E23744] shadow-xs"
          : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
}

