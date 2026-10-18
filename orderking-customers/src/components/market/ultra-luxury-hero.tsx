import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Compass, Crown, Globe2, Search, Sparkles } from "lucide-react";

/**
 * Editorial cuisine inspiration, NOT an inventory or purchasable product catalog.
 * Prices, ratings, ETAs and dietary labels must only come from verified merchants.
 */
export interface HeroCulinaryDish {
  id: string;
  name: string;
  regionalName: string;
  tagline: string;
  imageUrl: string;
  query: string;
}

export const HERO_CULINARY_DISHES: HeroCulinaryDish[] = [
  {
    id: "hero-biryani",
    name: "Dum Biryani",
    regionalName: "बिरयानी · বিরিয়ানি",
    tagline: "Discover fragrant rice, slow-cooked spices and regional traditions.",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
    query: "Biryani",
  },
  {
    id: "hero-butter-chicken",
    name: "Butter Chicken",
    regionalName: "बटर चिकन · বাটার চিকেন",
    tagline: "Explore classic North Indian dishes and rich tomato gravies.",
    imageUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80",
    query: "Butter Chicken",
  },
  {
    id: "hero-paneer",
    name: "Paneer",
    regionalName: "पनीर · পনির",
    tagline: "Find paneer preparations and check ingredients with each kitchen.",
    imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80",
    query: "Paneer",
  },
  {
    id: "hero-dosa",
    name: "Masala Dosa",
    regionalName: "दोसा · দোসা",
    tagline: "Explore crispy South Indian favourites and fresh accompaniments.",
    imageUrl: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80",
    query: "Dosa",
  },
  {
    id: "hero-momos",
    name: "Momos",
    regionalName: "मोमोज · মোমো",
    tagline: "Browse steamed and fried dumpling styles from available kitchens.",
    imageUrl: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=600&auto=format&fit=crop&q=80",
    query: "Momos",
  },
  {
    id: "hero-thali",
    name: "Indian Thali",
    regionalName: "थाली · থালি",
    tagline: "Explore regional combinations and hearty meals.",
    imageUrl: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&auto=format&fit=crop&q=80",
    query: "Thali",
  },
  {
    id: "hero-rolls",
    name: "Kolkata Rolls",
    regionalName: "काठी रोल · কাঠি ৰোল",
    tagline: "Discover wrapped street-food favourites and local variations.",
    imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80",
    query: "Rolls",
  },
];

export function UltraLuxuryHero() {
  const navigate = useNavigate();

  return (
    <section
      aria-labelledby="orderking-cuisine-hero-title"
      className="relative isolate w-full overflow-hidden rounded-[30px] border border-amber-400/45 bg-gradient-to-br from-[#090D16] via-[#18141B] to-[#3A220C] px-4 py-5 text-white shadow-[0_18px_55px_rgba(58,35,15,0.24)] sm:px-7 sm:py-7"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-amber-400/15 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-12 size-72 rounded-full bg-rose-500/10 blur-3xl" />

      <div className="relative z-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold tracking-widest text-amber-200">
            <Crown aria-hidden="true" className="size-4" />
            ORDERKING · CULINARY DISCOVERY
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
            <Compass aria-hidden="true" className="size-3.5 text-amber-300" />
            Explore by cuisine
          </span>
        </div>

        <div className="max-w-3xl">
          <h1 id="orderking-cuisine-hero-title" className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">
            Discover what you love.
            <span className="mt-1 block bg-gradient-to-r from-amber-200 via-[#FFF1CE] to-amber-400 bg-clip-text text-transparent">
              Effortless food exploration.
            </span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-200">
            Find cuisines that inspire you. Actual dishes, prices, preparation times and delivery
            availability are confirmed from participating restaurant menus before checkout.
          </p>
          <button
            type="button"
            onClick={() => void navigate({ to: "/search" })}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-[0_6px_24px_rgba(245,158,11,0.22)] transition-transform hover:brightness-110 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-100"
          >
            <Search aria-hidden="true" className="size-4" />
            Search available menus
            <ArrowRight aria-hidden="true" className="size-4" />
          </button>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-amber-200">
            <Sparkles aria-hidden="true" className="size-4" />
            Cuisine inspirations
          </h2>
          <span className="text-[11px] font-medium text-slate-300">
            Illustrative imagery · Not live menu offers
          </span>
        </div>

        <div aria-label="Browse cuisines" className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:thin] [scrollbar-color:#BC9655_transparent]">
          {HERO_CULINARY_DISHES.map((dish) => (
            <button
              key={dish.id}
              type="button"
              onClick={() => void navigate({ to: "/search", search: { q: dish.query } as any })}
              className="group relative flex w-52 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] text-left shadow-lg transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-amber-300/70 hover:shadow-[0_12px_28px_rgba(0,0,0,0.24)] motion-reduce:transform-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 sm:w-60"
              aria-label={`Explore ${dish.name} on available menus`}
            >
              <div className="relative aspect-[16/11] overflow-hidden bg-slate-800">
                <img
                  src={dish.imageUrl}
                  alt={`Illustrative food photograph for ${dish.name}`}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transform-none"
                />
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090D16] via-transparent to-transparent" />
                <span className="absolute bottom-2 left-2 rounded-md bg-black/65 px-2 py-1 text-[10px] font-semibold text-amber-100 backdrop-blur-sm">
                  Inspiration only
                </span>
              </div>
              <div className="flex min-h-32 flex-1 flex-col p-3">
                <h3 className="text-sm font-bold text-white">{dish.name}</h3>
                <p className="mt-0.5 text-[10px] text-amber-200">{dish.regionalName}</p>
                <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-slate-300">{dish.tagline}</p>
                <span className="mt-3 inline-flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-xs font-bold text-amber-200">
                  Explore real menus
                  <ArrowRight aria-hidden="true" className="size-4" />
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/15 bg-white/[0.04] p-3">
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-100">
            <Globe2 aria-hidden="true" className="size-4 text-amber-300" />
            Discover regional favourites
          </span>
          <span className="text-xs text-slate-300">
            English · हिन्दी · বাংলা · অসমীয়া
          </span>
        </div>
      </div>
    </section>
  );
}
