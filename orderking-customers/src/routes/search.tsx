
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
  const isDeliveryActive = location ? isDeliveryActiveInLocation(location.lat, location.lng, location.cityId) : true;

  const commit = (next: Search) => {
    void navigate({ search: next });
    if (next.q) void trackAnalytics({ data: { name: "search", payload: { q: next.q } } });
  };

  if (!isDeliveryActive) {
    return (
      <CustomerShell onSearch={() => undefined}>
        <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFEB] px-4 py-12 text-center">
          <div className="mx-auto max-w-md rounded-3xl border border-amber-300/60 bg-white/95 backdrop-blur-md p-8 shadow-[0_12px_40px_rgba(245,158,11,0.12)]">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 shadow-md shadow-amber-400/30">
              <span className="text-3xl">👑</span>
            </div>
            <h1 className="mt-4 font-display text-2xl font-black text-stone-900">
              Food Search is not active in {location.cityName || "your region"}
            </h1>
            <p className="mt-2 text-sm text-stone-600 leading-relaxed">
              Order King food catalog is strictly geofenced to operational kitchens. You can explore utilities, bills, and payments on King Pay!
            </p>
            <div className="mt-6">
              <Button asChild className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black py-3 rounded-2xl shadow-lg shadow-orange-500/25 hover:from-amber-600 hover:to-orange-600 transition-all">
                <Link to="/king-pay">Search on King Pay 👑</Link>
              </Button>
            </div>
          </div>
        </div>
      </CustomerShell>
    );
  }

  return (
    <CustomerShell onSearch={() => undefined}>
      <div className="bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFEB] border-b border-amber-900/10 px-3 pt-3 sm:px-4 sm:pt-4 pb-3 shadow-2xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            commit({ ...search, q: draft });
          }}
          className="relative flex items-center rounded-2xl border border-amber-300/80 bg-white/95 p-1.5 shadow-[0_4px_20px_rgba(245,158,11,0.08)]"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 text-white text-xs shadow-xs ml-1">
            🔍
          </div>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("home.searchPlaceholder")}
            aria-label={t("common.search")}
            className="border-none bg-transparent shadow-none text-stone-900 placeholder:text-stone-400 focus-visible:ring-0 h-10 text-sm font-semibold px-2.5"
            autoFocus
          />
          {draft && (
            <button
              type="button"
              onClick={() => {
                setDraft("");
                commit({ ...search, q: "" });
              }}
              className="mr-2 flex size-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-900 hover:bg-amber-200"
            >
              ✕
            </button>
          )}
        </form>

        <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <FilterChip
            active={Boolean(search.veg)}
            onClick={() => commit({ ...search, veg: !search.veg })}
            label={t("home.vegOnly")}
            badge="🌱"
          />
          <FilterChip
            active={Boolean(search.openNow)}
            onClick={() => commit({ ...search, openNow: !search.openNow })}
            label={t("home.openNow")}
            badge="⚡"
          />
          <FilterChip
            active={search.category === "Biryani"}
            onClick={() => commit({ ...search, category: search.category === "Biryani" ? undefined : "Biryani" })}
            label="Biryani"
            badge="🍗"
          />
          <FilterChip
            active={search.category === "Pizza"}
            onClick={() => commit({ ...search, category: search.category === "Pizza" ? undefined : "Pizza" })}
            label="Pizza"
            badge="🍕"
          />
          <FilterChip
            active={search.category === "Rolls"}
            onClick={() => commit({ ...search, category: search.category === "Rolls" ? undefined : "Rolls" })}
            label="Rolls"
            badge="🌯"
          />
          <FilterChip
            active={search.category === "Cafe"}
            onClick={() => commit({ ...search, category: search.category === "Cafe" ? undefined : "Cafe" })}
            label="Cafe"
            badge="☕"
          />
        </div>
      </div>

      {/* Luxury Ambient Feed Wrapper */}
      <div className="min-h-screen bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFEB] pb-24">
        <HomeFeed q={search.q} veg={search.veg} openNow={search.openNow} category={search.category} />
      </div>
    </CustomerShell>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 shrink-0 rounded-full px-3.5 py-1 text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-2xs ${
        active
          ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25 scale-105"
          : "border border-amber-200/80 bg-white/90 text-amber-950 hover:bg-amber-100/70"
      }`}
    >
      {badge && <span>{badge}</span>}
      <span>{label}</span>
    </button>
  );
}

