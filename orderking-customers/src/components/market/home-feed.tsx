import { Store, Flame, CloudRain, Star, Clock, Sparkles, Filter, Leaf, Percent, MapPin, Search, Crown, ChevronRight, GraduationCap, Briefcase, Ticket } from "lucide-react";
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
  const navigate = useNavigate();

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
        return res;
      } catch (err) {
        console.error("Failed to fetch restaurants", err);
        return { restaurants: [], count: 0, fromCache: false };
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const festive = getCurrentFestiveContext();

  const FOOD_CATEGORIES = [
    { id: "all", name: "All", icon: "🍔" },
    { id: "biryani", name: "Biryani", icon: "🥘" },
    { id: "pizza", name: "Pizza", icon: "🍕" },
    { id: "chicken", name: "Chicken", icon: "🍗" },
    { id: "burger", name: "Burger", icon: "🍔" },
    { id: "healthy", name: "Healthy", icon: "🥗" },
    { id: "desserts", name: "Desserts", icon: "🍦" },
  ];

  return (
    <div className="mx-auto max-w-md md:max-w-xl pb-32">
      {/* 1. VIP / GOLD BANNER */}
      {!q && !category && (
        <div className="px-4 mt-2">
          <Link to="/king-pay" className="block relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-600/20 border border-amber-500/30 p-4 shadow-[0_4px_20px_rgba(245,158,11,0.15)] no-underline">
            <div className="absolute top-0 right-0 p-2 opacity-20">
              <Crown className="size-16 text-amber-500" />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="font-display font-black text-amber-400 text-lg flex items-center gap-2">
                  <Crown className="size-5" /> OrderKing VIP
                </h3>
                <p className="text-amber-200/80 text-xs mt-0.5 font-medium">Free Delivery & Exclusive Perks</p>
              </div>
              <div className="bg-amber-500 text-black text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                JOIN NOW <ChevronRight className="size-3" />
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* 2. FOOD CATEGORIES CAROUSEL */}
      {!q && (
        <div className="mt-6">
          <div className="flex overflow-x-auto gap-4 px-4 pb-4 no-scrollbar snap-x">
            {FOOD_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate({ to: "/", search: { category: cat.id === "all" ? undefined : cat.id } })}
                className="flex flex-col items-center gap-2 snap-start group"
              >
                <div className={`flex items-center justify-center size-16 rounded-full border transition-all duration-300 shadow-md ${category === cat.id || (!category && cat.id === "all") ? 'bg-primary/20 border-primary/50 scale-110' : 'bg-white/5 border-white/10 group-hover:bg-white/10'}`}>
                  <span className="text-2xl drop-shadow-md">{cat.icon}</span>
                </div>
                <span className={`text-[11px] font-bold tracking-wide ${category === cat.id || (!category && cat.id === "all") ? 'text-primary' : 'text-zinc-400'}`}>
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. DYNAMIC FILTERS (Zomato Style Horizontal) */}
      {!q && (
        <div className="flex items-center gap-2 overflow-x-auto px-4 pb-4 no-scrollbar mt-2 sticky top-[72px] z-30 bg-[#000000]/80 backdrop-blur-md py-2">
          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === "fast" ? "all" : "fast")}
            className={`flex items-center gap-1.5 shrink-0 rounded-xl px-4 py-1.5 text-xs font-semibold transition cursor-pointer shadow-sm ${
              activeFilter === "fast" ? "bg-white text-black" : "border border-white/15 bg-[#111] text-zinc-300 hover:bg-white/10"
            }`}
          >
            <Clock className="size-3.5" /> Fast Delivery
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === "rating" ? "all" : "rating")}
            className={`flex items-center gap-1.5 shrink-0 rounded-xl px-4 py-1.5 text-xs font-semibold transition cursor-pointer shadow-sm ${
              activeFilter === "rating" ? "bg-white text-black" : "border border-white/15 bg-[#111] text-zinc-300 hover:bg-white/10"
            }`}
          >
            <Star className="size-3.5" /> Rating 4.0+
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === "veg" ? "all" : "veg")}
            className={`flex items-center gap-1.5 shrink-0 rounded-xl px-4 py-1.5 text-xs font-semibold transition cursor-pointer shadow-sm ${
              activeFilter === "veg" ? "bg-green-500 text-black border-green-500" : "border border-white/15 bg-[#111] text-zinc-300 hover:bg-white/10"
            }`}
          >
            <Leaf className="size-3.5 text-green-500" /> Pure Veg
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === "offers" ? "all" : "offers")}
            className={`flex items-center gap-1.5 shrink-0 rounded-xl px-4 py-1.5 text-xs font-semibold transition cursor-pointer shadow-sm ${
              activeFilter === "offers" ? "bg-white text-black" : "border border-white/15 bg-[#111] text-zinc-300 hover:bg-white/10"
            }`}
          >
            <Percent className="size-3.5 text-rose-500" /> Offers
          </button>
        </div>
      )}

      {/* 4. SPOTLIGHT / RECOMMENDED WITH DEALS */}
      {!q && !category && activeFilter === "all" && list.data?.restaurants && list.data.restaurants.length > 2 && (
        <div className="mt-2 mb-6 px-4">
          <h2 className="font-display text-[15px] font-black tracking-wider text-zinc-400 uppercase mb-3 flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> Recommended with Deals
          </h2>
          <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x">
            {list.data.restaurants.slice(0, 4).map((r) => (
              <div key={r.id} className="snap-start min-w-[280px] w-[80vw] max-w-[320px]">
                <KitchenCard restaurant={r} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. EXPLORE MORE (KINGPAY AFFILIATES TIE-IN) */}
      {!q && !category && activeFilter === "all" && (
        <div className="mb-6 px-4">
          <h2 className="font-display text-[15px] font-black tracking-wider text-zinc-400 uppercase mb-3">Explore More</h2>
          <div className="grid grid-cols-3 gap-3">
            <Link to="/king-pay" className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#111] border border-white/5 hover:bg-white/5 transition no-underline group text-center gap-2 shadow-sm">
              <div className="p-2 rounded-full bg-blue-500/10 text-blue-400 group-hover:scale-110 transition"><Ticket className="size-5" /></div>
              <span className="text-[10px] font-bold text-zinc-400">Flight & Train</span>
            </Link>
            <Link to="/king-pay" className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#111] border border-white/5 hover:bg-white/5 transition no-underline group text-center gap-2 shadow-sm">
              <div className="p-2 rounded-full bg-fuchsia-500/10 text-fuchsia-400 group-hover:scale-110 transition"><GraduationCap className="size-5" /></div>
              <span className="text-[10px] font-bold text-zinc-400">AI Tutor</span>
            </Link>
            <Link to="/king-pay" className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#111] border border-white/5 hover:bg-white/5 transition no-underline group text-center gap-2 shadow-sm">
              <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition"><Briefcase className="size-5" /></div>
              <span className="text-[10px] font-bold text-zinc-400">Gigs & Jobs</span>
            </Link>
          </div>
        </div>
      )}

      {/* RESTAURANT SUGGESTIONS: STRICTLY GATED BY 100% ACCURATE REAL-TIME GEO-LOCATION */}
      <div className="px-4">
        {!isGeoActive ? (
          <div className="rounded-2xl border border-rose-500/30 bg-[#0a0a0a]/80 p-6 text-center space-y-3 shadow-[0_0_30px_rgba(225,29,72,0.15)] my-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400 text-2xl mx-auto shadow-inner border border-rose-500/30">
              📍
            </div>
            <h3 className="font-display text-lg font-black text-white">Enable Live GPS Location</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
              To guarantee 25-minute royal delivery, 0% food spoilage, and verified kitchen authenticity, restaurant suggestions strictly appear only when 100% real-time accurate GPS tracking is active.
            </p>
            <button
              type="button"
              onClick={requestLiveGps}
              disabled={isRequestingGeo}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-6 py-2.5 text-xs font-black text-white shadow-[0_0_20px_rgba(225,29,72,0.4)] transition active:scale-95 border border-rose-500/50"
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
                <div className="h-64 w-full rounded-[var(--radius-3xl)] bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"><div className="h-40 w-full bg-white/5 animate-pulse border-b border-white/10" /><div className="p-4 space-y-3"><div className="h-5 w-2/3 bg-white/10 rounded-full animate-pulse" /><div className="h-4 w-1/3 bg-white/10 rounded-full animate-pulse" /></div></div>
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
                : `${list.data?.restaurants?.length ?? 0} Restaurants Delivering To You`
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
    return empty ? <p className="text-sm text-zinc-400">{empty}</p> : null;
  }
  return (
    <section>
      <h2 className="mb-4 font-display text-[15px] font-black tracking-wider text-zinc-400 uppercase">{title}</h2>
      <motion.div 
        className="grid gap-6 md:grid-cols-2"
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
