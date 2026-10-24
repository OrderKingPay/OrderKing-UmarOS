import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Utensils,
  Calendar,
  Clock,
  Sparkles,
  MapPin,
  ChevronRight,
  Store,
  ShieldCheck,
  CheckCircle2,
  Users,
} from "lucide-react";
import { CustomerShell } from "@/components/market/shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DiningOutReservationModal } from "@/components/market/dining-out-reservation";
import { useLocationStore } from "@/lib/stores/location";

export const Route = createFileRoute("/dining")({
  component: DiningPage,
});

function DiningPage() {
  const location = useLocationStore((s) => s.location);
  const [reservationModalOpen, setReservationModalOpen] = useState(false);

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
              loading="lazy"
              decoding="async"
              className="absolute inset-0 size-full object-cover opacity-50"
            />
            <div className="relative z-20 max-w-xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 px-3 py-1 text-xs font-black text-amber-300">
                  <Utensils className="size-3.5 text-amber-400" />
                  OrderKing Dining Out
                </span>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300">
                  Partner Network
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-4xl font-black text-white tracking-tight">
                Table Reservations &amp; Dining
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Discover table reservations and dining experiences in {location.cityName || "your city"}. Dine-in restaurant partner onboarding is actively underway across operating hubs.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => setReservationModalOpen(true)}
                  className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-zinc-950 font-black shadow-md hover:scale-105 transition"
                >
                  <Calendar className="size-4 mr-1.5" />
                  Table Reservation Enquiry
                </Button>
                <Link
                  to="/"
                  className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 text-xs font-bold transition backdrop-blur-md inline-flex items-center"
                >
                  Switch to Delivery
                </Link>
              </div>
            </div>
          </div>

          {/* Genuine Status & Partner Onboarding Card */}
          <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-50">
                    Restaurant Partner Onboarding Active
                  </h2>
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border-amber-400/30">
                    Phase 1 Network
                  </Badge>
                </div>
                <p className="text-xs text-muted mt-1">
                  We are actively onboarding verified dine-in restaurants across {location.cityName || "your city"}.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                <span>Zero Booking Markups</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/80 bg-surface-2/50 p-5 space-y-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-400/20 text-amber-700 dark:text-amber-300 font-bold">
                  <Store className="size-5" />
                </div>
                <h3 className="text-sm font-bold text-fg">For Restaurant Partners</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Join our verified dine-out catalog with 0% intermediary booking fees. Reach active diners in your area.
                </p>
                <a
                  href="https://partner.orderking.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline pt-1"
                >
                  <span>Partner Onboarding Portal</span>
                  <ChevronRight className="size-3" />
                </a>
              </div>

              <div className="rounded-2xl border border-border/80 bg-surface-2/50 p-5 space-y-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                  <Calendar className="size-5" />
                </div>
                <h3 className="text-sm font-bold text-fg">Special Event Booking</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Planning a family gathering, business dinner, or celebration? Submit a reservation enquiry directly to our desk.
                </p>
                <button
                  type="button"
                  onClick={() => setReservationModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline pt-1"
                >
                  <span>Submit Reservation Enquiry</span>
                  <ChevronRight className="size-3" />
                </button>
              </div>

              <div className="rounded-2xl border border-border/80 bg-surface-2/50 p-5 space-y-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 font-bold">
                  <Utensils className="size-5" />
                </div>
                <h3 className="text-sm font-bold text-fg">Immediate Doorstep Food</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Hungry now? Browse our live menu catalog for fast, hot contactless delivery from top local kitchens.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline pt-1"
                >
                  <span>Browse Delivery Menus</span>
                  <ChevronRight className="size-3" />
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs text-muted">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                <span>Transparent reservations reconciled with genuine restaurant seating</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-amber-500 shrink-0" />
                <span>Support desk assistance available for confirmed inquiries</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Reservation Modal */}
      <DiningOutReservationModal
        isOpen={reservationModalOpen}
        onClose={() => setReservationModalOpen(false)}
        restaurantId="dining-onboarding"
        restaurantName={`Dine Out Partner Desk (${location.cityName || "Barak Valley"})`}
        restaurantArea={location.zoneName || "City Center"}
        cuisineSummary="Fine Dining & Table Reservations"
      />
    </CustomerShell>
  );
}
