import { Link, useNavigate } from "@tanstack/react-router";
import {
  Crown,
  Sparkles,
  Flame,
  Star,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import { formatPaise } from "@/lib/money";

export interface HeroCulinaryDish {
  id: string;
  name: string;
  regionalName: string;
  tagline: string;
  pricePaise: number;
  ratingAvg: number;
  ratingCount: number;
  etaMinutes: number;
  imageUrl: string;
  dietType: "veg" | "non-veg" | "jain";
  query: string;
}

export const HERO_CULINARY_DISHES: HeroCulinaryDish[] = [
  {
    id: "hero-biryani",
    name: "Hyderabadi Dum Biryani",
    regionalName: "बिरयानी · বিরিয়ানি",
    tagline: "Authentic clay handi dum basmati with saffron & tender marinated chicken",
    pricePaise: 26000,
    ratingAvg: 4.9,
    ratingCount: 1420,
    etaMinutes: 22,
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
    dietType: "non-veg",
    query: "Biryani",
  },
  {
    id: "hero-butter-chicken",
    name: "Old Delhi Butter Chicken",
    regionalName: "बटर चिकन · বাটার চিকেন",
    tagline: "Slow-roasted tandoori chicken simmered in rich white butter makhani gravy",
    pricePaise: 29000,
    ratingAvg: 4.9,
    ratingCount: 1140,
    etaMinutes: 24,
    imageUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80",
    dietType: "non-veg",
    query: "Butter Chicken",
  },
  {
    id: "hero-jain-paneer",
    name: "Sattvic Jain Shahi Paneer",
    regionalName: "पनीर · পনির",
    tagline: "No onion, no garlic pure sattvic recipe with cashew malai & royal saffron",
    pricePaise: 24000,
    ratingAvg: 4.8,
    ratingCount: 520,
    etaMinutes: 18,
    imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80",
    dietType: "jain",
    query: "Paneer",
  },
  {
    id: "hero-dosa",
    name: "Crispy Mysore Masala Dosa",
    regionalName: "दोसा · দোসা",
    tagline: "Golden ghee roast fermented crepe with spicy potato filling & fresh coconut chutney",
    pricePaise: 14000,
    ratingAvg: 4.8,
    ratingCount: 1240,
    etaMinutes: 18,
    imageUrl: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80",
    dietType: "veg",
    query: "Dosa",
  },
  {
    id: "hero-momos",
    name: "Tibetan Steamed Momos",
    regionalName: "मोमोज · মোমো",
    tagline: "Thin translucent hand-pinched wrappers with juicy filling & fiery Sichuan dip",
    pricePaise: 18000,
    ratingAvg: 4.7,
    ratingCount: 680,
    etaMinutes: 20,
    imageUrl: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=600&auto=format&fit=crop&q=80",
    dietType: "non-veg",
    query: "Momos",
  },
  {
    id: "hero-thali",
    name: "Imperial Maharaja Thali",
    regionalName: "थाली · থালি",
    tagline: "Grand royal platter with dal bukhara, paneer tikka, butter naan & gulab jamun",
    pricePaise: 32000,
    ratingAvg: 4.9,
    ratingCount: 920,
    etaMinutes: 25,
    imageUrl: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&auto=format&fit=crop&q=80",
    dietType: "veg",
    query: "Thali",
  },
  {
    id: "hero-rolls",
    name: "Kolkata Egg Chicken Roll",
    regionalName: "काठी रोल · কাঠি ৰোল",
    tagline: "Crisp flaky laccha paratha with succulent spiced chicken & tangy onion relish",
    pricePaise: 13000,
    ratingAvg: 4.7,
    ratingCount: 840,
    etaMinutes: 15,
    imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80",
    dietType: "non-veg",
    query: "Rolls",
  },
];

export function UltraLuxuryHero() {
  const navigate = useNavigate();

  return (
    <section
      aria-label="OrderKing Kitchen Specialties"
      className="relative w-full overflow-hidden rounded-[32px] border-2 border-amber-400/70 bg-gradient-to-br from-slate-950 via-[#18130d] to-amber-950 p-4 sm:p-6 text-white shadow-[0_20px_50px_rgba(245,158,11,0.22)] select-none"
    >
      {/* ─── PRISMATIC SPECULAR AURAS ─── */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 via-yellow-300 via-amber-400 to-transparent opacity-95 drop-shadow-[0_2px_10px_rgba(245,158,11,0.9)] pointer-events-none" />
      <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-gradient-to-br from-amber-400/25 via-yellow-400/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 size-64 rounded-full bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent blur-3xl" />

      <div className="relative z-10 space-y-4">
        {/* ROW 1: FSSAI Verified Badge & 25-30m Delivery Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/70 bg-gradient-to-r from-amber-950/90 via-yellow-900/70 to-amber-950/90 px-3.5 py-1 shadow-[0_2px_12px_rgba(245,158,11,0.3)] backdrop-blur-md">
            <Crown className="size-3.5 text-amber-400 fill-amber-400 animate-pulse" />
            <span className="text-[10.5px] font-black uppercase tracking-widest text-amber-200">
              OrderKing Express Kitchens
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300 shadow-2xs">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              0% Menu Markups
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-400/40 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
              <ShieldCheck className="size-3" />
              FSSAI Lic. Certified
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-400/40 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
              <Clock className="size-3" />
              25-30m Express Delivery
            </span>
          </div>
        </div>

        {/* ROW 2: Hero Headline & Value Props */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
            Order food online from verified kitchens near you ·{" "}
            <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
              25-30m Express Delivery · 0% Menu Markups
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl leading-relaxed">
            Direct pricing from FSSAI-certified partner kitchens. No inflated aggregator commissions or hidden packaging fees—hot, authentic meals delivered in 25-30 minutes with complete price transparency.
          </p>
        </div>

        {/* ROW 3: MOUTH-WATERING CULINARY SHOWCASE WITH VEG / NON-VEG / JAIN BADGES */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Flame className="size-3.5 text-amber-400" />
              <span>Fresh Kitchen Specialties · 25-30m Express Delivery</span>
            </span>
            <Link
              to="/search"
              className="text-[11px] font-black text-amber-300 hover:text-amber-100 flex items-center gap-0.5 no-underline"
            >
              <span>Explore All Dishes</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          {/* Horizontal scrolling showcase */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none pt-1">
            {HERO_CULINARY_DISHES.map((dish) => (
              <button
                key={dish.id}
                type="button"
                onClick={() => void navigate({ to: "/search", search: { q: dish.query } as any })}
                className="group flex flex-col justify-between w-56 sm:w-64 shrink-0 rounded-2xl border border-amber-400/40 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-amber-950/30 p-3 text-left transition-all duration-300 hover:scale-[1.02] hover:border-amber-300 hover:shadow-[0_8px_25px_rgba(245,158,11,0.3)] active:scale-98 cursor-pointer relative overflow-hidden"
              >
                {/* Image Section */}
                <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-800">
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-108"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                  {/* Top Left: FSSAI Diet Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    {dish.dietType === "jain" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-950/90 backdrop-blur-md px-2 py-0.5 text-[9px] font-black text-amber-300 border border-amber-400/60 shadow-md">
                        <span>🕉️</span>
                        <span>Jain Sattvic</span>
                      </span>
                    ) : dish.dietType === "veg" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-950/90 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-black text-emerald-300 border border-emerald-400/60 shadow-md">
                        <span className="size-2 rounded-[2px] border border-emerald-300 flex items-center justify-center bg-white">
                          <span className="size-1 rounded-full bg-emerald-600" />
                        </span>
                        <span>Pure Veg</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-stone-950/90 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-black text-rose-300 border border-rose-500/60 shadow-md">
                        <span className="size-2 rounded-[2px] border border-rose-400 flex items-center justify-center bg-white">
                          <span className="size-1 rounded-full bg-rose-600" />
                        </span>
                        <span>Non-Veg</span>
                      </span>
                    )}
                  </div>

                  {/* Top Right: Rating */}
                  <span className="absolute top-2 right-2 flex items-center gap-0.5 rounded-md bg-emerald-600/90 backdrop-blur-md px-1.5 py-0.5 text-[10px] font-black text-white shadow-md">
                    <span>{dish.ratingAvg}</span>
                    <Star className="size-2.5 fill-white text-white" />
                  </span>

                  {/* Bottom: ETA & Regional multilang tag */}
                  <div className="absolute bottom-2 inset-x-2 flex items-center justify-between text-[10px] font-bold text-white">
                    <span className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-sm">
                      <Clock className="size-2.5 text-amber-300" />
                      {dish.etaMinutes}m
                    </span>
                    <span className="text-amber-200 truncate max-w-[55%] text-right drop-shadow-sm font-medium">
                      {dish.regionalName}
                    </span>
                  </div>
                </div>

                {/* Dish Info & Price */}
                <div className="mt-2.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition-colors line-clamp-1 leading-snug">
                      {dish.name}
                    </h3>
                    <p className="mt-0.5 text-[10.5px] text-slate-400 font-medium line-clamp-1">
                      {dish.tagline}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-white/10">
                    <span className="font-mono text-xs font-black text-amber-300">
                      {formatPaise(dish.pricePaise, { locale: "en-IN" })}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-black text-amber-400 group-hover:translate-x-0.5 transition-transform">
                      <span>Order</span>
                      <ArrowRight className="size-3 stroke-[2.5]" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ROW 4: MULTILINGUAL SMART SEARCH STRIP */}
        <div className="rounded-2xl border border-amber-400/30 bg-slate-900/60 p-2.5 flex flex-wrap items-center justify-between gap-2 backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <span className="flex size-6 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300 text-xs shadow-2xs">
              🌐
            </span>
            <span className="text-[11px] font-black text-amber-200">
              Multilingual Voice &amp; Fast Search Active
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-slate-300">
            <span className="text-slate-400">Supported:</span>
            <span className="bg-white/10 px-1.5 py-0.5 rounded border border-white/10">English</span>
            <span className="bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/30">हिन्दी (Hindi)</span>
            <span className="bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-400/30">বাংলা (Bengali)</span>
            <span className="bg-sky-400/20 text-sky-300 px-1.5 py-0.5 rounded border border-sky-400/30">অসমীয়া (Assamese)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
