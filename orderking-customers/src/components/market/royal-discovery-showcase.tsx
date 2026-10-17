import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Crown,
  Sparkles,
  Star,
  Clock,
  ShieldCheck,
  Percent,
  Plane,
  GraduationCap,
  Wallet,
  ArrowRight,
  MapPin,
  Flame,
  Tag,
  Copy,
  Check,
  ChevronRight,
  UtensilsCrossed,
} from "lucide-react";
import { useLocationStore } from "@/lib/stores/location";
import { cn } from "@/lib/utils";

export interface FeaturedKitchen {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  ratingAvg: number;
  ratingCount: number;
  etaMinutes: number;
  priceForTwo: string;
  cuisine: string;
  vegOnly?: boolean;
  coverImage: string;
  badge: string;
}

export const FEATURED_ROYAL_KITCHENS: FeaturedKitchen[] = [
  {
    id: "royal-dum-biryani",
    slug: "dum-safar-biryani",
    name: "Dum Safar Royal Awadhi Biryani",
    tagline: "Slow-cooked handi dum biryani with fragrant saffron & galouti kebabs",
    ratingAvg: 4.9,
    ratingCount: 1420,
    etaMinutes: 25,
    priceForTwo: "₹280 for two",
    cuisine: "Biryani · Mughlai · Kebabs",
    coverImage: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=720&auto=format&fit=crop&q=80",
    badge: "👑 Royal Chef Special",
  },
  {
    id: "artisanal-pizzeria",
    slug: "woodfired-trattoria",
    name: "Artisanal Woodfired Trattoria",
    tagline: "San Marzano tomato sauce, fresh buffalo burrata & hand-stretched sourdough",
    ratingAvg: 4.8,
    ratingCount: 890,
    etaMinutes: 28,
    priceForTwo: "₹340 for two",
    cuisine: "Woodfired Pizza · Pasta · Desserts",
    coverImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=720&auto=format&fit=crop&q=80",
    badge: "🍕 100% Olive Oil",
  },
  {
    id: "imperial-udupi",
    slug: "imperial-udupi-bhavan",
    name: "Imperial Udupi Bhavan Pure Veg",
    tagline: "Crisp ghee roast dosas, steaming button idlis & traditional filter kaapi",
    ratingAvg: 4.9,
    ratingCount: 2650,
    etaMinutes: 18,
    priceForTwo: "₹180 for two",
    cuisine: "South Indian · Pure Veg · Tiffin",
    vegOnly: true,
    coverImage: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=720&auto=format&fit=crop&q=80",
    badge: "🌿 Pure Veg Heritage",
  },
  {
    id: "delhi-darbar",
    slug: "delhi-mughal-darbar",
    name: "The Delhi Mughal Darbar",
    tagline: "Velvety Old Delhi butter chicken, slow-simmered dal bukhara & garlic naan",
    ratingAvg: 4.8,
    ratingCount: 1820,
    etaMinutes: 26,
    priceForTwo: "₹320 for two",
    cuisine: "North Indian · Mughlai · Tandoor",
    coverImage: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=720&auto=format&fit=crop&q=80",
    badge: "🔥 Tandoor Master",
  },
  {
    id: "burger-royale",
    slug: "burger-royale-craft",
    name: "Burger Royale & Grill House",
    tagline: "Double smashed artisanal patties, melted cheddar & seasoned peri-peri crinkle fries",
    ratingAvg: 4.7,
    ratingCount: 940,
    etaMinutes: 22,
    priceForTwo: "₹240 for two",
    cuisine: "Gourmet Burgers · Wings · Shakes",
    coverImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=720&auto=format&fit=crop&q=80",
    badge: "🍔 Artisanal Brioche",
  },
  {
    id: "sweet-bengal",
    slug: "sweet-bengal-confectionery",
    name: "Sweet Bengal Royal Desserts",
    tagline: "Warm gulab jamuns, clay-pot mishti doi, shahi rasmalai & pure desi ghee sweets",
    ratingAvg: 4.9,
    ratingCount: 3200,
    etaMinutes: 15,
    priceForTwo: "₹160 for two",
    cuisine: "Authentic Sweets · Desserts",
    vegOnly: true,
    coverImage: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=720&auto=format&fit=crop&q=80",
    badge: "🍯 Pure Desi Ghee",
  },
];

export function RoyalDiscoveryShowcase() {
  const location = useLocationStore((s) => s.location);
  const setLocation = useLocationStore((s) => s.setLocation);
  const [copiedCode, setCopiedCode] = useState(false);

  const cityName =
    location?.cityName && location.cityName !== "Locating..."
      ? location.cityName
      : "Connaught Place, New Delhi";

  const copyPromo = () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText("ROYAL100");
      }
      setCopiedCode(true);
      toast.success("Coupon ROYAL100 copied! Flat ₹100 OFF applied to your cart.");
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      toast.success("Coupon code: ROYAL100 (Flat ₹100 OFF)");
    }
  };

  return (
    <div className="w-full space-y-6 pt-2 pb-6 select-none">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 1. KINGPAY FOOD FESTIVAL 3D VIP BANNER                              */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="relative overflow-hidden rounded-[28px] sm:rounded-3xl border-2 border-amber-400/80 bg-gradient-to-br from-stone-950 via-[#18130d] to-amber-950 p-5 sm:p-7 text-white shadow-[0_16px_40px_rgba(245,158,11,0.25)]">
        {/* Glow ambient background illumination */}
        <div className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-gradient-to-br from-amber-400/30 to-yellow-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 size-48 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 blur-2xl" />

        <div className="relative z-10 flex flex-col space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400/25 via-yellow-300/35 to-amber-500/25 px-3 py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-300 backdrop-blur-md border border-amber-400/60 shadow-2xs">
              <Crown className="size-3 text-amber-300 fill-amber-300" />
              KingPay Royal Food Festival
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-wide text-emerald-300 border border-emerald-400/40">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Pan-India Live
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
              Flat ₹100 OFF + 5% 24K Gold
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-medium">
              Enjoy verified gastronomy delivered to your doorstep. Zero 30% aggregator markups · FSSAI certified kitchens.
            </p>
          </div>

          {/* Coupon Code Strip & CTA */}
          <div className="pt-1 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={copyPromo}
              className="flex items-center gap-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/70 px-3.5 py-2 text-xs font-black text-amber-200 transition active:scale-95 cursor-pointer shadow-2xs group"
              title="Click to copy coupon code"
            >
              <Tag className="size-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span>Use Code:</span>
              <span className="bg-amber-400 text-stone-950 px-1.5 py-0.5 rounded font-mono font-black text-xs tracking-wider">
                ROYAL100
              </span>
              {copiedCode ? (
                <Check className="size-3.5 text-emerald-400" />
              ) : (
                <Copy className="size-3.5 text-amber-300" />
              )}
            </button>

            <Link
              to="/search"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 px-4 py-2 text-xs font-black text-stone-950 shadow-md hover:brightness-105 active:scale-95 transition no-underline"
            >
              <span>Explore Menus</span>
              <ArrowRight className="size-3.5 stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 2. 1-TAP POPULAR CULINARY METRO HUBS (SOLVES "NO KITCHENS" STATE)   */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="rounded-3xl border border-amber-200/90 bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-white p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-xl bg-amber-400/25 border border-amber-300 text-amber-900 text-xs shadow-2xs">
              📍
            </span>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-gray-950 tracking-tight">
                Switch to an Active Metro Culinary Zone
              </h4>
              <p className="text-[10.5px] text-stone-500 font-medium">
                Tap any neighborhood below to browse live menus and order immediately
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {[
            { city: "Delhi NCR", area: "Connaught Place", tag: "Mughlai & Chaat", lat: 28.6315, lng: 77.2167, cityId: "del", zoneId: "del-cp" },
            { city: "Mumbai", area: "Bandra West", tag: "Seafood & Cafes", lat: 19.0600, lng: 72.8336, cityId: "mum", zoneId: "mum-bandra" },
            { city: "Bengaluru", area: "Koramangala", tag: "Craft Burgers & Brews", lat: 12.9352, lng: 77.6245, cityId: "blr", zoneId: "blr-kor" },
            { city: "Kolkata", area: "Park Street", tag: "Royal Dum Biryani", lat: 22.5510, lng: 88.3533, cityId: "kolkata", zoneId: "kol-park" },
            { city: "Hyderabad", area: "Jubilee Hills", tag: "Nizami Dum Handi", lat: 17.4319, lng: 78.4073, cityId: "hyd", zoneId: "hyd-jubilee" },
            { city: "Pune", area: "Koregaon Park", tag: "Bistros & Desserts", lat: 18.5362, lng: 73.8940, cityId: "pun", zoneId: "pun-kp" },
            { city: "Chennai", area: "Nungambakkam", tag: "Chettinad & Tiffin", lat: 13.0604, lng: 80.2405, cityId: "chn", zoneId: "chn-nungam" },
            { city: "Silchar", area: "Central Silchar", tag: "Authentic Thalis", lat: 24.8333, lng: 92.7789, cityId: "silchar", zoneId: "sil-central" },
          ].map((hub) => (
            <button
              key={`${hub.cityId}-${hub.zoneId}`}
              type="button"
              onClick={() => {
                setLocation({
                  cityId: hub.cityId,
                  cityName: hub.city,
                  zoneId: hub.zoneId,
                  zoneName: hub.area,
                  label: `${hub.area}, ${hub.city}`,
                  line1: `${hub.area}, ${hub.city}`,
                  lat: hub.lat,
                  lng: hub.lng,
                });
                toast.success(`Location switched to ${hub.area}, ${hub.city}!`);
              }}
              className="flex flex-col items-start p-2.5 rounded-2xl border border-amber-200/80 bg-white hover:border-amber-500 hover:bg-amber-50/70 transition-all text-left shadow-2xs active:scale-95 cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 w-full">
                <MapPin className="size-3 text-[#E23744] shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black text-gray-950 truncate group-hover:text-[#E23744]">
                  {hub.area}
                </span>
              </div>
              <span className="text-[10px] text-stone-500 font-medium truncate w-full mt-0.5">
                {hub.city} · {hub.tag}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 3. FEATURED ROYAL CLOUD KITCHENS (RICH GASTRONOMY SHOWCASE)         */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300/70 leading-none">
                👑 Royal Cloud Kitchens
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200/80">
                0% Menu Markup
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-gray-950 tracking-tight mt-1">
              Featured Sovereign Partner Kitchens
            </h3>
            <p className="text-xs text-stone-500 font-medium">
              Handpicked culinary masters with sub-25 min direct chef dispatch
            </p>
          </div>
          <Link
            to="/search"
            className="text-xs font-black text-[#E23744] hover:underline flex items-center gap-0.5"
          >
            All <ChevronRight className="size-3.5" />
          </Link>
        </div>

        {/* Grid of 6 Royal Kitchen Cards */}
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
          {FEATURED_ROYAL_KITCHENS.map((k) => (
            <Link
              key={k.id}
              to="/search"
              search={{ q: k.name } as any}
              className="group flex flex-col overflow-hidden rounded-3xl border border-amber-200/80 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_32px_rgba(245,158,11,0.18)] hover:border-amber-400 transition-all active:scale-[0.98] no-underline"
            >
              {/* Cover Image & Badges */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-100">
                <img
                  src={k.coverImage}
                  alt={k.name}
                  className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-black/20" />

                {/* Top Left Badge */}
                <span className="absolute top-3 left-3 rounded-full bg-slate-950/85 backdrop-blur-md px-2.5 py-1 text-[10px] font-black uppercase text-amber-300 border border-amber-400/50 shadow-md">
                  {k.badge}
                </span>

                {/* Top Right Pure Veg Badge */}
                {k.vegOnly && (
                  <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-emerald-600/90 backdrop-blur-md px-2.5 py-1 text-[9.5px] font-black uppercase text-white shadow-md">
                    <span className="size-1.5 rounded-full bg-white" />
                    Pure Veg
                  </span>
                )}

                {/* Bottom Overlay Info: ETA & Price */}
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-white text-xs font-black">
                  <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20">
                    <Clock className="size-3 text-amber-300" />
                    {k.etaMinutes} mins
                  </span>
                  <span className="bg-emerald-600/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 text-[11px]">
                    {k.priceForTwo}
                  </span>
                </div>
              </div>

              {/* Kitchen Details */}
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between bg-gradient-to-b from-white to-[#FFFDF9]">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-black text-sm sm:text-base text-gray-950 group-hover:text-[#E23744] transition-colors leading-snug">
                      {k.name}
                    </h4>
                    <span className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-0.5 text-xs font-black text-white shrink-0 shadow-2xs">
                      <span>{k.ratingAvg}</span>
                      <Star className="size-3 fill-white text-white" />
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-stone-500 font-medium line-clamp-1">
                    {k.tagline}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900/80 truncate max-w-[65%]">
                    {k.cuisine}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-black text-[#E23744] group-hover:translate-x-0.5 transition-transform">
                    <span>Order Now</span>
                    <ArrowRight className="size-3 stroke-[2.5]" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 4. QUICK 1-TAP SOVEREIGN SERVICES (TRAVEL, AI TUTOR, KING PAY)      */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-amber-600" />
          OrderKing Sovereign Ecosystem
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Sovereign Travel Card */}
          <Link
            to="/travel"
            className="flex items-center justify-between p-4 rounded-2xl border border-sky-300/80 bg-gradient-to-r from-sky-50 via-cyan-50/50 to-white hover:border-sky-500 shadow-2xs hover:shadow-xs transition-all active:scale-95 no-underline group"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_4px_12px_rgba(14,165,233,0.3)] group-hover:rotate-12 transition-transform">
                <Plane className="size-5" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-sky-800 bg-sky-100 px-1.5 py-0.2 rounded-full">
                  0% FEE
                </span>
                <p className="text-xs font-black text-gray-950 mt-0.5">Sovereign Travel</p>
                <p className="text-[10px] text-stone-500">Flights &amp; Luxury Stays</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-sky-600 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* AI Tutor & Jobs Card */}
          <Link
            to="/tutor"
            className="flex items-center justify-between p-4 rounded-2xl border border-purple-300/80 bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white hover:border-purple-500 shadow-2xs hover:shadow-xs transition-all active:scale-95 no-underline group"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-[0_4px_12px_rgba(147,51,234,0.3)] group-hover:rotate-12 transition-transform">
                <GraduationCap className="size-5" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-purple-800 bg-purple-100 px-1.5 py-0.2 rounded-full">
                  CAREERS
                </span>
                <p className="text-xs font-black text-gray-950 mt-0.5">AI Tutor &amp; Jobs</p>
                <p className="text-[10px] text-stone-500">Cloud Kitchen Chef Prep</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* King Pay Sovereign Card */}
          <Link
            to="/king-pay"
            className="flex items-center justify-between p-4 rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-50 via-yellow-50/50 to-white hover:border-amber-500 shadow-2xs hover:shadow-xs transition-all active:scale-95 no-underline group"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 shadow-[0_4px_12px_rgba(245,158,11,0.3)] group-hover:rotate-12 transition-transform">
                <Crown className="size-5 fill-slate-950" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded-full">
                  24K GOLD
                </span>
                <p className="text-xs font-black text-gray-950 mt-0.5">King Pay Sovereign</p>
                <p className="text-[10px] text-stone-500">Direct UPI &amp; Bill Pay</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
