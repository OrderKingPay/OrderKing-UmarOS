import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Utensils,
  Calendar,
  Clock,
  Sparkles,
  MapPin,
  Star,
  Crown,
  ChevronRight,
  Search,
  Users,
  CheckCircle2,
} from "lucide-react";
import { CustomerShell } from "@/components/market/shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DiningOutReservationModal } from "@/components/market/dining-out-reservation";
import { useLocationStore } from "@/lib/stores/location";

export const Route = createFileRoute("/dining")({
  component: DiningPage,
});

interface DiningVenue {
  id: string;
  name: string;
  area: string;
  cuisine: string;
  rating: number;
  reviewsCount: string;
  costForTwo: string;
  imageUrl: string;
  tag: string;
  features: string[];
}

const LUXURY_VENUES: DiningVenue[] = [
  {
    id: "rest-001",
    name: "The Royal Nizam & Courtyard",
    area: "Park Street, Central",
    cuisine: "North Indian · Awadhi · Mughlai",
    rating: 4.9,
    reviewsCount: "2.4k",
    costForTwo: "₹1,800 for two",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    tag: "👑 Royal Dining",
    features: ["Rooftop Gazebo", "Live Classical Sitar", "Valet Parking"],
  },
  {
    id: "rest-002",
    name: "Saffron Lounge & Grill",
    area: "Koramangala 5th Block",
    cuisine: "Continental · Pan-Asian · Cocktails",
    rating: 4.8,
    reviewsCount: "1.9k",
    costForTwo: "₹2,200 for two",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    tag: "✨ Candlelight Table",
    features: ["Private Cabana", "Sommelier Selection", "Outdoor Garden"],
  },
  {
    id: "rest-003",
    name: "Emerald Spice Garden",
    area: "Bandra West",
    cuisine: "Coastal Malabar · Bengali Seafood",
    rating: 4.7,
    reviewsCount: "1.5k",
    costForTwo: "₹1,500 for two",
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    tag: "🌿 Organic Farm-to-Table",
    features: ["Chef Tasting Menu", "Kids Play Area", "Pet Friendly"],
  },
  {
    id: "rest-004",
    name: "Dusk Skybar & Teppanyaki",
    area: "Connaught Place",
    cuisine: "Japanese · Sushi · Asian Robata",
    rating: 4.9,
    reviewsCount: "3.1k",
    costForTwo: "₹3,000 for two",
    imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80",
    tag: "🍸 Skyline Panorama",
    features: ["360° City View", "Live Teppan Grill", "VIP Gold Discount 20%"],
  },
];

function DiningPage() {
  const location = useLocationStore((s) => s.location);
  const [selectedVenue, setSelectedVenue] = useState<DiningVenue | null>(null);
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVenues = LUXURY_VENUES.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.area.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBookTable = (venue: DiningVenue) => {
    setSelectedVenue(venue);
    setReservationModalOpen(true);
  };

  return (
    <CustomerShell>
      <div className="min-h-screen bg-gradient-to-b from-amber-500/10 via-white to-amber-50/20 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 pb-28 px-3 sm:px-6 py-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Hero Banner */}
          <div className="relative rounded-3xl overflow-hidden border border-amber-400/30 bg-zinc-950 text-white shadow-xl p-6 sm:p-10">
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-10" />
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
              alt="Luxury Dining Out"
              className="absolute inset-0 size-full object-cover opacity-50"
            />
            <div className="relative z-20 max-w-xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 px-3 py-1 text-xs font-black text-amber-300">
                  <Crown className="size-3.5 text-amber-400" />
                  OrderKing Dining Out Privilege
                </span>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300">
                  Instant Table Confirmation
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-4xl font-black text-white tracking-tight">
                Reserve Tables at the Finest Luxury Venues
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Skip queues, guarantee rooftop cabanas, and unlock up to 25% bill discounts with VIP Gold Pass reservation access in {location.cityName || "your city"}.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => handleBookTable(LUXURY_VENUES[0])}
                  className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-zinc-950 font-black shadow-md hover:scale-105 transition"
                >
                  <Utensils className="size-4 mr-1.5" />
                  Instant Table Booking
                </Button>
                <Link
                  to="/"
                  className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 text-xs font-bold transition backdrop-blur-md"
                >
                  Switch to Delivery
                </Link>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="rounded-2xl border border-border bg-surface p-3 shadow-xs flex items-center gap-3">
            <Search className="size-4 text-muted shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fine dining venues, cuisines, rooftops, or localities..."
              className="w-full bg-transparent text-sm focus:outline-none font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-xs font-bold text-muted hover:text-fg"
              >
                Clear
              </button>
            )}
          </div>

          {/* Featured Dining Destinations Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-50">
                  Curated Fine Dining &amp; Rooftops ({filteredVenues.length})
                </h2>
                <p className="text-xs text-muted">Exclusively handpicked and verified by OrderKing Concierge</p>
              </div>
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border-amber-400/30">
                100% Guaranteed Seating
              </Badge>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {filteredVenues.map((venue) => (
                <div
                  key={venue.id}
                  className="group rounded-3xl border border-border bg-surface overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-950">
                      <img
                        src={venue.imageUrl}
                        alt={venue.name}
                        loading="lazy"
                        className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-bold text-amber-300 border border-amber-400/30">
                          {venue.tag}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1 text-xs font-black text-white shadow-md">
                        <Star className="size-3.5 fill-white" />
                        <span>{venue.rating}</span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h3 className="font-display text-lg font-bold leading-tight">
                          {venue.name}
                        </h3>
                        <p className="text-xs text-zinc-300 mt-0.5 flex items-center gap-1">
                          <MapPin className="size-3 text-amber-400 shrink-0" />
                          <span>{venue.area}</span>
                        </p>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                          {venue.cuisine}
                        </span>
                        <span className="font-bold text-amber-700 dark:text-amber-400">
                          {venue.costForTwo}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {venue.features.map((feat) => (
                          <span
                            key={feat}
                            className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300"
                          >
                            ✓ {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <Button
                      onClick={() => handleBookTable(venue)}
                      className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-zinc-950 font-black shadow-md hover:scale-[1.01] active:scale-95 transition"
                    >
                      <Calendar className="size-4 mr-1.5" />
                      Reserve Table · Free
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table Reservation Modal */}
      <DiningOutReservationModal
        isOpen={reservationModalOpen}
        onClose={() => setReservationModalOpen(false)}
        restaurantId={selectedVenue?.id || "dining-general"}
        restaurantName={selectedVenue?.name || "Luxury Dining Out"}
        restaurantArea={selectedVenue?.area || location.zoneName || "City Center"}
        cuisineSummary={selectedVenue?.cuisine || "Fine Dining & Grill"}
      />
    </CustomerShell>
  );
}
