
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { KitchenCard } from "@/components/market/restaurant-card";
import { GrowthWidget } from "@/components/market/growth-widget";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrand, useT } from "@/components/providers";
import { listCategories, listRestaurants } from "@/lib/server/catalog";
import { listMyOrders, reorderItems } from "@/lib/server/orders";
import { formatPaise } from "@/lib/money";
import { useLocationStore } from "@/lib/stores/location";
import { useCartStore } from "@/lib/stores/cart";
import type { RestaurantCard } from "@/lib/market-types";

import { getNetworkSpeed, cacheGet, cacheSet, type NetworkSpeed } from "@/lib/low-network-cache";
import { getCurrentFestiveContext } from "@/lib/brand/calendar-festive-engine";
import { EcosystemSwitchBar } from "@/components/common/ecosystem-switch-bar";
import { PaidRestaurantAdZone } from "@/components/market/paid-restaurant-ad-zone";





export function HomeFeed({
  q,
  veg,
  openNow,
  category,
}: {
  q?: string;
  veg?: boolean;
  openNow?: boolean;
  category?: string;
}) {
  const { t, lang } = useT();
  const locale = lang === "bn" ? "bn-IN" : "en-IN";
  const { marketplace, brand } = useBrand();
  const location = useLocationStore((s) => s.location);
  const setLocation = useLocationStore((s) => s.setLocation);
  const [isGeoActive, setIsGeoActive] = useState<boolean>(true);
  const [isRequestingGeo, setIsRequestingGeo] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "fast" | "rating" | "veg" | "offers" | "budget">("all");

  const requestLiveGps = () => {
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      setIsRequestingGeo(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsRequestingGeo(false);
          setIsGeoActive(true);
          setLocation({
            ...location,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            line1: `Verified GPS (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`,
          });
          toast.success("100% Real-Time GPS Active! Verifying restaurants in your vicinity...");
        },
        (err) => {
          setIsRequestingGeo(false);
          setIsGeoActive(false);
          toast.error("Accurate GPS location required to show verified restaurants.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setIsGeoActive(false);
      toast.error("Geolocation is not supported by your browser.");
    }
  };

  const [networkSpeed, setNetworkSpeed] = useState<NetworkSpeed>("NORMAL");
  useEffect(() => {
    setNetworkSpeed(getNetworkSpeed());
    const handleOnline = () => setNetworkSpeed(getNetworkSpeed());
    const handleOffline = () => setNetworkSpeed("OFFLINE");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const pastOrders = useQuery({
    queryKey: ["pastOrders"],
    queryFn: () => listMyOrders(),
    retry: false,
  });
  const cats = useQuery({
    queryKey: ["categories", lang],
    queryFn: () => listCategories({ data: { lang } }),
  });
  const list = useQuery({
    queryKey: ["restaurants", location.zoneId, location.lat, location.lng, q, veg, openNow, category, lang],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (veg) params.set("veg", "true");
      if (openNow) params.set("openNow", "true");
      if (category) params.set("category", category);
      params.set("lat", location.lat.toString());
      params.set("lng", location.lng.toString());
      params.set("zoneId", location.zoneId);
      if (lang) params.set("lang", lang);

      const cacheKey = `hyperedge_list_${params.toString()}`;

      try {
        const response = await fetch(`/api/search?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch restaurants");
        const res = await response.json();
        if (res) await cacheSet(cacheKey, res);
        return res;
      } catch (err) {
        const cached = await cacheGet<any>(cacheKey);
        if (cached) return cached;
        // Aggressively fallback to empty state rather than breaking the UI with an error
        return { 
          restaurants: [], 
          sections: { offers: [], popular: [], fast: [], budget: [], veg: [], newKitchens: [] },
          marketContext: { sortStrategy: "lowest_price_first" }
        };
      }
    },
  });

  const cart = useCartStore();
  const navigate = useNavigate();

  const handleReorder = async (orderId: string) => {
    try {
      const res = await reorderItems({ data: { orderId } });
      cart.replaceCart(res.restaurantId, res.restaurantName, res.lines);
      toast.success("Past order items added to cart!");
      void navigate({ to: "/cart" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reorder");
    }
  };

  const activeOrder = pastOrders.data?.orders?.find((o) =>
    ["PENDING", "PLACED", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "ARRIVED"].includes(o.status)
  );

  const festive = getCurrentFestiveContext();

  return (
    <div className="space-y-2 px-2 py-2 sm:px-3 sm:py-3">

        
        {/* 2G / Low-Network Offline-First Resilience Banner */}
      {networkSpeed !== "NORMAL" ? (
        <div className="flex items-center justify-between rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <span>⚡</span>
            <span className="font-semibold">2G / Low-Network Mode Active</span>
            <span className="text-[11px] text-muted hidden sm:inline">· Instant 0ms cached browsing &amp; background sync</span>
          </div>
          <span className="font-mono text-[10px] uppercase font-bold bg-amber-500/20 px-1.5 py-0.5 rounded">
            {networkSpeed}
          </span>
        </div>
      ) : null}

      {/* 👑 SPONSORED PAID RESTAURANT AD ZONE (AUTO-SCALING & AD-SPEND RANKED) */}
      {/* <PaidRestaurantAdZone /> */}

      {/* GAMIFIED GROWTH SYNDICATE WIDGET */}
      {!q && !category && (
        <GrowthWidget />
      )}
      {/* 👑 3D GLOWING SWITCH BUTTON + SAME-LEVEL AI SUPPORT */}
      {/* <EcosystemSwitchBar /> */}

      {/* 1-Tap Quick Re-Order (Zero-Friction Simplicity) */}
      {pastOrders.data?.orders?.[0] && !q && !veg && !openNow && !category ? (
        <section aria-label="Recent Selection">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black p-5">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted bg-surface px-2 py-0.5 rounded-full">
                  Recent Selection
                </span>
                <h3 className="font-medium text-fg mt-1">{pastOrders.data.orders[0].restaurantName}</h3>
                <p className="text-xs text-muted">
                  {pastOrders.data.orders[0].itemPreview || "Past Order"} · {formatPaise(pastOrders.data.orders[0].totalPaise, { locale })}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleReorder(pastOrders.data.orders[0].id)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-white hover:bg-gray-200 px-4 py-2.5 text-xs font-medium text-black transition"
            >
              <span>Reorder</span>
            </button>
          </div>
        </section>
      ) : null}

      {/* Zomato-style Active Live Order Tracker Banner */}
      {activeOrder && !q && !veg && !openNow && !category ? (
        <section aria-label="Active Order">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black p-5">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-300"></span>
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">Active Order</p>
                <h3 className="font-medium text-fg">{activeOrder.restaurantName} · #{activeOrder.publicId}</h3>
                <p className="text-xs text-subtle">Status: {activeOrder.status.replace(/_/g, " ")}</p>
              </div>
            </div>
            <Link
              to="/orders/$id"
              params={{ id: activeOrder.id }}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-xs font-medium text-black transition hover:bg-gray-200"
            >
              Track Order
            </Link>
          </div>
        </section>
      ) : null}

      {/* Zomato-style Order Again / Past Order Carousel */}
      {pastOrders.data?.orders && pastOrders.data.orders.length > 0 && !q && !veg && !openNow && !category ? (
        <section aria-label="Reorder">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-display text-xl text-fg">Reorder</h2>
              <p className="text-xs text-muted">Reorder past selections effortlessly.</p>
            </div>
            <Link to="/orders" className="text-xs font-medium text-gray-300 hover:text-fg hover:underline">
              {t("common.viewAll")}
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {pastOrders.data.orders.slice(0, 5).map((o) => (
              <div
                key={o.id}
                className="flex w-64 shrink-0 flex-col justify-between rounded-2xl border border-white/10 bg-black p-4 transition hover:border-gray-600"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-1 text-sm font-medium text-fg">{o.restaurantName}</h3>
                    <span className="text-[11px] font-medium text-gray-300">
                      {formatPaise(o.totalPaise, { locale: lang === "bn" ? "bn-IN" : "en-IN" })}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{o.itemPreview || "Curated selection"}</p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
                  <span className="text-[10px] text-subtle">
                    {new Date(o.placedAt).toLocaleDateString(lang === "bn" ? "bn-IN" : "en-IN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleReorder(o.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-fg transition hover:bg-white hover:text-black"
                  >
                    Reorder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Preferred & Top-Rated Kitchens Ad Row (Ranked by Ad Spend + Performance) */}
      {!q && !veg && !openNow && !category ? null : null}



      {marketplace.sampleCatalogueBanner ? (
        <p className="rounded-[var(--radius-lg)] bg-surface px-3 py-3 text-sm text-muted">{t("home.sampleBanner")}</p>
      ) : null}

      <section aria-label={t("home.categories")}>
        <h2 className="mb-4 font-display text-2xl font-medium text-fg">{t("home.categories")}</h2>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {cats.isPending
            ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 w-24 shrink-0 rounded-[var(--radius-2xl)] bg-surface border border-white/10 animate-pulse" />)
            : (cats.data?.categories ?? []).map((c: any) => (
                <Link
                  key={c.id}
                  to="/search"
                  search={{ category: c.id }}
                  className="w-24 shrink-0 text-center text-fg no-underline"
                >
                  <div className="aspect-square overflow-hidden rounded-[var(--radius-2xl)] bg-black border border-white/10 p-1">
                    {c.imageUrl ? (
                      <img loading="lazy" src={c.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <span className="mt-1 block text-xs font-medium">{c.name}</span>
                </Link>
              ))}
        </div>
      </section>


      {/* Unified Action Bar: Veg/Non-Veg */}
      {isGeoActive && !q && !category && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-2 scrollbar-hide px-2">
          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === "veg" ? "all" : "veg")}
            className={`flex items-center gap-1.5 shrink-0 rounded-full px-4 py-1.5 transition shadow-sm text-sm font-semibold border ${
              activeFilter === "veg" ? "bg-[#D4AF37]/10 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
            }`}
          >
            <span className={`w-3 h-3 rounded-sm border flex items-center justify-center ${activeFilter === "veg" ? "border-white" : "border-green-600"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${activeFilter === "veg" ? "bg-white" : "bg-green-600"}`}></span>
            </span>
            Veg Only
          </button>
        </div>
      )}

      {/* RESTAURANT SUGGESTIONS: STRICTLY GATED BY 100% ACCURATE REAL-TIME GEO-LOCATION */}
      {!isGeoActive ? (
        <div className="rounded-2xl border border-white/10 bg-black p-6 text-center space-y-3 shadow-md my-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-surface text-muted text-xl mx-auto">
            📍
          </div>
          <h3 className="font-display text-lg font-medium text-fg">Location Services Required</h3>
          <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
            Please enable location services to discover curated culinary partners in your vicinity.
          </p>
          <button
            type="button"
            onClick={requestLiveGps}
            disabled={isRequestingGeo}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-gray-200 px-6 py-2.5 text-xs font-medium text-black transition active:scale-95"
          >
            <span>📍</span>
            <span>{isRequestingGeo ? "Acquiring Location..." : "Enable Location"}</span>
          </button>
        </div>
      ) : list.isError ? (
        <button type="button" className="text-sm text-primary" onClick={() => void list.refetch()}>
          {t("common.retry")}
        </button>
      ) : list.isPending ? (
        <motion.div className="grid gap-4 md:grid-cols-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <div className="h-64 w-full rounded-[var(--radius-3xl)] bg-black border border-white/10 overflow-hidden flex flex-col"><div className="h-40 w-full bg-primary/10 animate-pulse" /><div className="p-4 space-y-3"><div className="h-5 w-2/3 bg-primary/10 rounded-full animate-pulse" /><div className="h-4 w-1/3 bg-primary/10 rounded-full animate-pulse" /></div></div>
            </motion.div>
          ))}
        </motion.div>
      ) : q || veg || openNow || category ? (
        <Section title={t("common.search")} items={list.data?.restaurants ?? []} empty={t("home.noResults")} />
      ) : (
        <Section
          title={
            activeFilter === "fast"
              ? "Expedited Delivery"
              : activeFilter === "rating"
              ? "Highest Ratings"
              : activeFilter === "veg"
              ? "Vegetarian Selection"
              : activeFilter === "offers"
              ? "Special Privileges"
              : activeFilter === "budget"
              ? "Accessible Dining"
              : "Curated Culinary Partners"
          }
          items={(() => {
            const raw = list.data?.restaurants ?? [];
            return [...raw]
              .filter((r) => {
                if (activeFilter === "veg" && !r.vegOnly) return false;
                if (activeFilter === "rating" && (r.ratingAvg ?? 0) < 4.0) return false;
                if (activeFilter === "offers" && !r.hasOffer) return false;
                return true;
              })
              .sort((a, b) => {
                if (activeFilter === "fast") {
                  return (a.etaMinutes ?? 30) - (b.etaMinutes ?? 30);
                }
                if (activeFilter === "budget") {
                  return (a.minOrderPaise ?? 20000) - (b.minOrderPaise ?? 20000);
                }
                const scoreA = (a.ratingAvg ?? 4.0) * Math.log10(Math.max(10, a.ratingCount ?? 10));
                const scoreB = (b.ratingAvg ?? 4.0) * Math.log10(Math.max(10, b.ratingCount ?? 10));
                return scoreB - scoreA;
              });
          })()}
        />
      )}
    </div>
  );
}

function Section({ title, items, empty }: { title: string; items: RestaurantCard[]; empty?: string }) {
  const [visibleCount, setVisibleCount] = useState(10);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleCount < items.length) {
        setVisibleCount((prev) => prev + 10);
      }
    });
    if (node) observer.current.observe(node);
  }, [visibleCount, items.length]);

  if (!items.length) {
    return empty ? <p className="text-sm text-muted">{empty}</p> : null;
  }
  return (
    <section>
      <h2 className="mb-3 font-display text-xl">{title}</h2>
      <motion.div 
        className="grid gap-4 md:grid-cols-2"
        initial="hidden" animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      >
        <AnimatePresence>
          {items.slice(0, visibleCount).map((r, i) => (
            <motion.div
              key={r.id}
              ref={i === visibleCount - 1 ? lastElementRef : null}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <KitchenCard restaurant={r} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      {visibleCount < items.length && (
        <div className="mt-6 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </section>
  );
}

