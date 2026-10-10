import { useState } from "react";
import { Sparkles, Flame, Moon, Heart, ChevronRight, Award, Compass } from "lucide-react";
import { Link } from "@tanstack/react-router";

export interface FoodCollection {
  id: string;
  title: string;
  tagline: string;
  placesCount: number;
  coverImage: string;
  badge: string;
  searchFilter: { category?: string; veg?: boolean; openNow?: boolean };
}

export const CURATED_COLLECTIONS: FoodCollection[] = [
  {
    id: "trending-now",
    title: "Trending This Week",
    tagline: "Most ordered flavors loved across the city",
    placesCount: 24,
    coverImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=500&q=80",
    badge: "🔥 Hot & Viral",
    searchFilter: { category: "Biryani" },
  },
  {
    id: "late-night",
    title: "Late Night Cravings",
    tagline: "Midnight food cravings delivered till 3 AM",
    placesCount: 18,
    coverImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80",
    badge: "🌙 Open Late",
    searchFilter: { openNow: true },
  },
  {
    id: "pure-veg-gems",
    title: "Pure Veg Wonders",
    tagline: "100% vegetarian culinary sanctuaries & sweets",
    placesCount: 16,
    coverImage: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80",
    badge: "🌱 100% Veg",
    searchFilter: { veg: true },
  },
  {
    id: "pocket-friendly",
    title: "Pocket-Friendly Feasts",
    tagline: "Hearty combos and satisfying meals under ₹199",
    placesCount: 32,
    coverImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80",
    badge: "💰 Under ₹199",
    searchFilter: { category: "Rolls" },
  },
  {
    id: "romantic-dining",
    title: "Romantic Dining Out",
    tagline: "Rooftop ambiance and candlelight tables for two",
    placesCount: 12,
    coverImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80",
    badge: "✨ Romantic",
    searchFilter: { category: "Cafe" },
  },
  {
    id: "authentic-biryani",
    title: "Biryani Central",
    tagline: "Kachchi, Dum & Awadhi fragrant rice masters",
    placesCount: 20,
    coverImage: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80",
    badge: "🍗 Authentic",
    searchFilter: { category: "Biryani" },
  },
];

export interface CuratedCollectionsProps {
  onSelectCollection?: (col: FoodCollection) => void;
  className?: string;
}

export function CuratedCollections({
  onSelectCollection,
  className = "",
}: CuratedCollectionsProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-base">✨</span>
            <h2 className="font-display text-base font-bold text-fg">Collections</h2>
          </div>
          <p className="text-xs text-muted">Curated dining and delivery lists based on local trends</p>
        </div>
        <Link
          to="/search"
          className="flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline"
        >
          <span>All collections</span>
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      {/* Horizontal Carousel */}
      <div className="flex gap-3.5 overflow-x-auto pb-2 no-scrollbar">
        {CURATED_COLLECTIONS.map((col) => (
          <Link
            key={col.id}
            to="/search"
            search={col.searchFilter}
            onClick={() => onSelectCollection?.(col)}
            className="group relative h-48 w-40 shrink-0 overflow-hidden rounded-2xl border border-border shadow-xs transition-transform duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            {/* Background Image */}
            <img
              src={col.coverImage}
              alt={col.title}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            {/* Top Badge */}
            <div className="absolute top-2.5 left-2.5">
              <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                {col.badge}
              </span>
            </div>

            {/* Bottom Content */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
              <h3 className="font-display text-sm font-bold leading-tight group-hover:text-primary-fg">
                {col.title}
              </h3>
              <p className="mt-0.5 text-[10px] text-white/80 line-clamp-1">
                {col.placesCount} Places
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
