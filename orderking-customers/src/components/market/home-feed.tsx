import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { KitchenCard } from "@/components/market/restaurant-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrand, useT } from "@/components/providers";
import { listCategories, listRestaurants } from "@/lib/server/catalog";
import { listMyOrders, reorderItems } from "@/lib/server/orders";
import { formatPaise } from "@/lib/money";
import { useLocationStore } from "@/lib/stores/location";
import { useCartStore } from "@/lib/stores/cart";
import type { RestaurantCard } from "@/lib/market-types";
import { PreferredKitchensAdRow } from "@/components/market/preferred-kitchens-ad-row";
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
      try {
        const res = await listRestaurants({
          data: {
            zoneId: location.zoneId,
            lat: location.lat,
            lng: location.lng,
            q,
            veg,
            openNow,
            category,
            lang,
          },
        });
        if (res) cacheSet("home_restaurants", res);
        return res;
      } catch (err) {
        const cached = cacheGet<Awaited<ReturnType<typeof listRestaurants>>>("home_restaurants");
        if (cached) return cached;
        throw err;
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
      <PaidRestaurantAdZone className="mb-0.5" />

      {/* 👑 3D GLOWING SWITCH BUTTON + SAME-LEVEL AI SUPPORT */}
      <EcosystemSwitchBar currentApp="FOODS" className="mb-1.5" />

      {/* 1-Tap Quick Re-Order (Zero-Friction Simplicity) */}
      {pastOrders.data?.orders?.[0] && !q && !veg && !openNow && !category ? (
        <section aria-label="1-Tap Quick Re-Order">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-[var(--radius-xl)] border-2 border-emerald-500/30 bg-emerald-500/5 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  1-Tap Quick Re-Order
                </span>
                <h3 className="font-bold text-foreground mt-0.5">{pastOrders.data.orders[0].restaurantName}</h3>
                <p className="text-xs text-muted">
                  {pastOrders.data.orders[0].itemPreview || "Past Order"} · {formatPaise(pastOrders.data.orders[0].totalPaise, { locale })}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleReorder(pastOrders.data.orders[0].id)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow transition"
            >
              <span>⚡ Re-Order in 1-Tap</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">Instant</span>
            </button>
          </div>
        </section>
      ) : null}

      {/* Zomato-style Active Live Order Tracker Banner */}
      {activeOrder && !q && !veg && !openNow && !category ? (
        <section aria-label="Active live order">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-[var(--radius-xl)] border-2 border-primary/30 bg-primary/5 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Live Order Active</p>
                <h3 className="font-bold text-foreground">{activeOrder.restaurantName} · #{activeOrder.publicId}</h3>
                <p className="text-xs text-muted">Status: {activeOrder.status.replace(/_/g, " ")}</p>
              </div>
            </div>
            <Link
              to="/orders/$id"
              params={{ id: activeOrder.id }}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90"
            >
              Track Order Live ➔
            </Link>
          </div>
        </section>
      ) : null}

      {/* Zomato-style Order Again / Past Order Carousel */}
      {pastOrders.data?.orders && pastOrders.data.orders.length > 0 && !q && !veg && !openNow && !category ? (
        <section aria-label={t("home.reorder")}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-display text-xl">{t("home.reorder")}</h2>
              <p className="text-xs text-muted">Repeat your favourite meals in 1 tap</p>
            </div>
            <Link to="/orders" className="text-xs font-semibold text-primary hover:underline">
              {t("common.viewAll")}
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {pastOrders.data.orders.slice(0, 5).map((o) => (
              <div
                key={o.id}
                className="flex w-64 shrink-0 flex-col justify-between rounded-[var(--radius-xl)] border border-border bg-surface p-3.5 shadow-sm transition hover:shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-1 text-sm font-semibold">{o.restaurantName}</h3>
                    <span className="text-[11px] font-bold text-primary">
                      {formatPaise(o.totalPaise, { locale: lang === "bn" ? "bn-IN" : "en-IN" })}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{o.itemPreview || "Delicious meal"}</p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2">
                  <span className="text-[10px] text-muted">
                    {new Date(o.placedAt).toLocaleDateString(lang === "bn" ? "bn-IN" : "en-IN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleReorder(o.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white"
                  >
                    Reorder ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Preferred & Top-Rated Kitchens Ad Row (Ranked by Ad Spend + Performance) */}
      {!q && !veg && !openNow && !category ? <PreferredKitchensAdRow className="my-1" /> : null}

      {/* 100x Viral Marketing: Invite Friends & Both Get Rewarded */}
      {!q && !veg && !openNow && !category ? (
        <section aria-label="Referral Rewards" className="rounded-[var(--radius-xl)] border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/20 text-2xl shadow-inner">
                🎁
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-fg">Give ₹40 + Free Delivery, Get ₹40!</h3>
                <p className="text-xs text-muted">
                  Share OrderKing with friends. They get <span className="font-semibold text-primary">₹40 OFF + Free Delivery</span> (min ₹249) and you get <span className="font-semibold text-primary">₹40 wallet cash</span>!
                </p>
              </div>
            </div>
            <div className="flex w-full sm:w-auto items-center gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent("Hey! Use my code to get ₹40 OFF + Free Delivery on your first delicious food order on OrderKing: https://orderking.in/?ref=KINGVIP")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
              >
                <span>💬</span>
                <span>Share WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText("https://orderking.in/?ref=KINGVIP");
                  toast.success("Referral link copied to clipboard!");
                }}
                className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-fg shadow-xs transition hover:bg-surface-2"
              >
                Copy Link
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {marketplace.sampleCatalogueBanner ? (
        <p className="rounded-[var(--radius-lg)] bg-surface px-3 py-3 text-sm text-muted">{t("home.sampleBanner")}</p>
      ) : null}

      <section aria-label={t("home.categories")}>
        <h2 className="mb-3 font-display text-xl">{t("home.categories")}</h2>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {cats.isPending
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-24 shrink-0" />)
            : (cats.data?.categories ?? []).map((c) => (
                <Link
                  key={c.id}
                  to="/search"
                  search={{ category: c.id }}
                  className="w-24 shrink-0 text-center text-fg no-underline"
                >
                  <div className="aspect-square overflow-hidden rounded-[var(--radius-lg)] bg-surface-2">
                    {c.imageUrl ? (
                      <img loading="lazy" src={c.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <span className="mt-1 block text-xs font-medium">{c.name}</span>
                </Link>
              ))}
        </div>
      </section>

      {/* 👑 UNIQUE ENGAGEMENT HOOKS (News, Jobs, AI Tutor) - HIGHEST RETENTION DRIVERS */}
      <section aria-label="Daily Hub">
        <h2 className="mb-2.5 font-display text-lg font-bold">Daily Hub</h2>
        <div className="grid grid-cols-3 gap-2">
          {/* 1. Local News */}
          <Link
            to="/"
            className="group relative flex flex-col items-center overflow-hidden rounded-xl border border-blue-500/20 bg-gradient-to-b from-blue-500/10 to-surface p-2.5 shadow-sm transition hover:border-blue-500 hover:shadow-md active:scale-95 text-center"
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-blue-500/20 text-blue-500 mb-1.5 group-hover:scale-110 transition">
              <span className="text-lg">📰</span>
            </div>
            <span className="text-[10px] font-black uppercase text-fg leading-tight">Local News</span>
            <span className="text-[8px] font-bold text-blue-500 mt-0.5 tracking-wider">LIVE 24/7</span>
          </Link>

          {/* 2. AI English Tutor */}
          <Link
            to="/"
            className="group relative flex flex-col items-center overflow-hidden rounded-xl border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-surface p-2.5 shadow-sm transition hover:border-purple-500 hover:shadow-md active:scale-95 text-center"
          >
            <div className="absolute top-0 right-0 rounded-bl-lg bg-purple-500 px-1.5 py-0.5 text-[7px] font-black text-white shadow-sm">
              FREE
            </div>
            <div className="flex size-9 items-center justify-center rounded-full bg-purple-500/20 text-purple-500 mb-1.5 group-hover:scale-110 transition">
              <span className="text-lg">🧠</span>
            </div>
            <span className="text-[10px] font-black uppercase text-fg leading-tight">AI Tutor</span>
            <span className="text-[8px] font-bold text-purple-500 mt-0.5 tracking-wider">LEARN ENGLISH</span>
          </Link>

          {/* 3. Part-Time Jobs */}
          <Link
            to="/"
            className="group relative flex flex-col items-center overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-b from-amber-500/10 to-surface p-2.5 shadow-sm transition hover:border-amber-500 hover:shadow-md active:scale-95 text-center"
          >
            <div className="absolute top-0 right-0 rounded-bl-lg bg-amber-500 px-1.5 py-0.5 text-[7px] font-black text-black shadow-sm animate-pulse">
              NEW
            </div>
            <div className="flex size-9 items-center justify-center rounded-full bg-amber-500/20 text-amber-500 mb-1.5 group-hover:scale-110 transition">
              <span className="text-lg">💼</span>
            </div>
            <span className="text-[10px] font-black uppercase text-fg leading-tight">Gigs & Jobs</span>
            <span className="text-[8px] font-bold text-amber-500 mt-0.5 tracking-wider">EARN DAILY</span>
          </Link>
        </div>
      </section>

      {/* Zomato-style Quick Filter Pills */}
      {isGeoActive && !q && !category && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === "fast" ? "all" : "fast")}
            className={`flex items-center gap-1 shrink-0 rounded-full px-3 py-1.5 transition shadow-xs cursor-pointer ${
              activeFilter === "fast"
                ? "bg-primary text-primary-fg font-bold"
                : "border border-border bg-surface text-fg hover:bg-surface-2"
            }`}
          >
            <span>⚡</span>
            <span>Fast Delivery</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === "rating" ? "all" : "rating")}
            className={`flex items-center gap-1 shrink-0 rounded-full px-3 py-1.5 transition shadow-xs cursor-pointer ${
              activeFilter === "rating"
                ? "bg-primary text-primary-fg font-bold"
                : "border border-border bg-surface text-fg hover:bg-surface-2"
            }`}
          >
            <span>⭐</span>
            <span>Rating 4.0+</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === "veg" ? "all" : "veg")}
            className={`flex items-center gap-1 shrink-0 rounded-full px-3 py-1.5 transition shadow-xs cursor-pointer ${
              activeFilter === "veg"
                ? "bg-primary text-primary-fg font-bold"
                : "border border-border bg-surface text-fg hover:bg-surface-2"
            }`}
          >
            <span>🥗</span>
            <span>Pure Veg</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === "offers" ? "all" : "offers")}
            className={`flex items-center gap-1 shrink-0 rounded-full px-3 py-1.5 transition shadow-xs cursor-pointer ${
              activeFilter === "offers"
                ? "bg-primary text-primary-fg font-bold"
                : "border border-border bg-surface text-fg hover:bg-surface-2"
            }`}
          >
            <span>🏷️</span>
            <span>Great Offers</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === "budget" ? "all" : "budget")}
            className={`flex items-center gap-1 shrink-0 rounded-full px-3 py-1.5 transition shadow-xs cursor-pointer ${
              activeFilter === "budget"
                ? "bg-primary text-primary-fg font-bold"
                : "border border-border bg-surface text-fg hover:bg-surface-2"
            }`}
          >
            <span>💰</span>
            <span>Under ₹199</span>
          </button>
        </div>
      )}

      {/* RESTAURANT SUGGESTIONS: STRICTLY GATED BY 100% ACCURATE REAL-TIME GEO-LOCATION */}
      {!isGeoActive ? (
        <div className="rounded-2xl border-2 border-primary/30 bg-surface p-6 text-center space-y-3 shadow-md my-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary text-2xl mx-auto shadow-inner">
            📍
          </div>
          <h3 className="font-display text-lg font-black text-fg">Enable Live GPS Location</h3>
          <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
            To guarantee 25-minute royal delivery, 0% food spoilage, and verified kitchen authenticity, restaurant suggestions strictly appear only when 100% real-time accurate GPS tracking is active.
          </p>
          <button
            type="button"
            onClick={requestLiveGps}
            disabled={isRequestingGeo}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 px-6 py-2.5 text-xs font-black text-white shadow-md transition active:scale-95"
          >
            <span>📍</span>
            <span>{isRequestingGeo ? "Verifying Live GPS..." : "Turn On 100% Real-Time GPS"}</span>
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
              <Skeleton className="h-52 w-full rounded-[var(--radius-xl)] bg-surface-2" />
            </motion.div>
          ))}
        </motion.div>
      ) : q || veg || openNow || category ? (
        <Section title={t("common.search")} items={list.data?.restaurants ?? []} empty={t("home.noResults")} />
      ) : (
        <Section
          title={
            activeFilter === "fast"
              ? "⚡ Fastest Delivering Restaurants"
              : activeFilter === "rating"
              ? "⭐ Top-Rated Restaurants (4.0+)"
              : activeFilter === "veg"
              ? "🥗 Pure Veg Verified Kitchens"
              : activeFilter === "offers"
              ? "🏷️ Restaurants with Maximum Offers"
              : activeFilter === "budget"
              ? "💰 Budget Friendly Picks"
              : "👑 Verified Restaurants (Ranked Best to Down)"
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
