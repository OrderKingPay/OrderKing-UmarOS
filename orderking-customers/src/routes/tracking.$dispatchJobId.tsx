import { lazy, Suspense, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bike,
  CheckCircle2,
  ChefHat,
  Clock,
  HelpCircle,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/db-cloud";
import { formatPaise } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { lazyWithRetry } from "@/lib/lazy-retry";
import { ErrorBoundary } from "@/components/error-boundary";
import { CustomerAppSkeleton } from "@/components/skeletons/customer-app-skeleton";

const LazyLiveTrackingMap = lazyWithRetry(
  () => import("@/components/tracking/live-tracking-map"),
  "LiveTrackingMap"
);

function TrackingMapSkeleton() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-950 text-white/70 animate-pulse">
      <div className="h-10 w-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-xs font-mono uppercase tracking-widest text-emerald-400">Connecting Satellite Telemetry…</p>
      <p className="text-[11px] text-zinc-500 mt-1">Streaming dispatch vector over 3G network</p>
    </div>
  );
}

type TrackingPosition = { lat: number; lng: number };

type OrderTrackingDetails = {
  id: string;
  publicId: string;
  status: string;
  totalPaise: number;
  deliveryOtp: string | null;
  notes: string | null;
  placedAt: string;
};

export const Route = createFileRoute("/tracking/$dispatchJobId")({
  component: TrackingRoute,
  pendingComponent: CustomerAppSkeleton,
});

function getStepIndex(status: string): number {
  const normalized = status.toUpperCase();
  if (["DELIVERED", "COMPLETED"].includes(normalized)) return 4;
  if (["PICKED_UP", "ON_THE_WAY", "OUT_FOR_DELIVERY", "ARRIVED_AT_CUSTOMER"].includes(normalized)) return 3;
  if (["READY", "RIDER_ASSIGNED", "ARRIVING_AT_RESTAURANT", "ARRIVED_AT_RESTAURANT"].includes(normalized)) return 2;
  if (["ACCEPTED", "PREPARING"].includes(normalized)) return 1;
  return 0; // PLACED
}

function getStatusDescription(status: string): { title: string; subtitle: string; icon: string } {
  const normalized = status.toUpperCase();
  if (["DELIVERED", "COMPLETED"].includes(normalized)) {
    return {
      title: "Order Delivered!",
      subtitle: "Your food was safely handed over. Enjoy your meal!",
      icon: "🎉",
    };
  }
  if (["PICKED_UP", "ON_THE_WAY", "OUT_FOR_DELIVERY", "ARRIVED_AT_CUSTOMER"].includes(normalized)) {
    return {
      title: "Out for Delivery",
      subtitle: "Your delivery partner has picked up your food and is on the way to you.",
      icon: "🛵",
    };
  }
  if (["READY", "RIDER_ASSIGNED", "ARRIVING_AT_RESTAURANT", "ARRIVED_AT_RESTAURANT"].includes(normalized)) {
    return {
      title: "Delivery Partner Assigned",
      subtitle: "Food is packed and ready. Partner is picking up your order from the kitchen.",
      icon: "📦",
    };
  }
  if (["ACCEPTED", "PREPARING"].includes(normalized)) {
    return {
      title: "Kitchen Preparing Food",
      subtitle: "The chef is preparing your meal fresh with verified hygiene standards.",
      icon: "🍳",
    };
  }
  return {
    title: "Order Placed & Confirmed",
    subtitle: "Your order was sent to the restaurant kitchen for immediate preparation.",
    icon: "✅",
  };
}

function TrackingRoute() {
  const { dispatchJobId } = Route.useParams() as { dispatchJobId: string };
  const [position, setPosition] = useState<TrackingPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderTrackingDetails | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("orders")
          .select("id, public_id, status, total_paise, delivery_otp, notes, placed_at, rider_lat, rider_lng, restaurant_lat, restaurant_lng")
          .eq("id", dispatchJobId)
          .maybeSingle();

        if (cancelled) return;

        if (data) {
          setOrder({
            id: data.id,
            publicId: data.public_id || data.id.slice(0, 8).toUpperCase(),
            status: data.status || "PLACED",
            totalPaise: Number(data.total_paise || 0),
            deliveryOtp: data.delivery_otp || null,
            notes: data.notes || null,
            placedAt: data.placed_at || new Date().toISOString(),
          });

          const riderLat = Number(data.rider_lat);
          const riderLng = Number(data.rider_lng);
          const restaurantLat = Number(data.restaurant_lat);
          const restaurantLng = Number(data.restaurant_lng);

          if (Number.isFinite(riderLat) && Number.isFinite(riderLng)) {
            setPosition({ lat: riderLat, lng: riderLng });
          } else if (Number.isFinite(restaurantLat) && Number.isFinite(restaurantLng)) {
            setPosition({ lat: restaurantLat, lng: restaurantLng });
          } else {
            setPosition(null);
          }
        }
      } catch (err) {
        console.error("Failed to load tracking data", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadInitialData();

    // Subscribe to live status changes on this order
    const channel = supabase
      .channel(`customer_tracking_${dispatchJobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${dispatchJobId}`,
        },
        (payload: any) => {
          if (cancelled) return;
          const updated = payload.new;
          if (updated) {
            setOrder((prev) =>
              prev
                ? {
                    ...prev,
                    status: updated.status || prev.status,
                    deliveryOtp: updated.delivery_otp || prev.deliveryOtp,
                  }
                : null
            );
            const rLat = Number(updated.rider_lat);
            const rLng = Number(updated.rider_lng);
            if (Number.isFinite(rLat) && Number.isFinite(rLng)) {
              setPosition({ lat: rLat, lng: rLng });
            }
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [dispatchJobId]);

  const currentStep = getStepIndex(order?.status || "PLACED");
  const statusInfo = getStatusDescription(order?.status || "PLACED");

  return (
    <div className="relative w-full h-dvh bg-slate-950 flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <div className="absolute top-0 left-0 w-full p-4 z-20 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/60 to-transparent pointer-events-none">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="pointer-events-auto p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur text-white"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-white font-bold text-base tracking-wide flex items-center gap-2">
              Order #{order?.publicId || dispatchJobId.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-[11px] text-emerald-400 font-medium">Live Satellite Telemetry</p>
          </div>
        </div>

        <Link
          to="/support"
          className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white backdrop-blur transition"
        >
          <HelpCircle className="size-3.5 text-amber-400" />
          <span>Help</span>
        </Link>
      </div>

      {/* Main Map Viewport */}
      <div className="flex-1 w-full relative">
        {position ? (
          <ErrorBoundary inline sectionName="Live Telemetry Map">
            <Suspense fallback={<TrackingMapSkeleton />}>
              <LazyLiveTrackingMap
                dispatchJobId={dispatchJobId}
                initialLat={position.lat}
                initialLng={position.lng}
              />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-950 p-6 text-center text-zinc-300">
            <div className="mb-3 size-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-2xl animate-pulse">
              📍
            </div>
            <h3 className="text-base font-bold text-white">Live Tracking Active</h3>
            <p className="mt-1 text-xs text-zinc-400 max-w-sm">
              {loading
                ? "Connecting to delivery dispatch stream…"
                : "Rider GPS signal is being acquired. Route coordinates will plot automatically once the partner departs."}
            </p>
          </div>
        )}
      </div>

      {/* Tier-1 Grade Bottom Stepper Sheet */}
      <div className="relative z-20 w-full border-t border-white/10 bg-slate-900/95 backdrop-blur-md p-4 sm:p-5 text-white shadow-2xl rounded-t-3xl">
        <div className="mx-auto max-w-lg space-y-4">
          {/* Main Status Headline */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{statusInfo.icon}</span>
              <div>
                <h2 className="text-base font-bold text-white leading-tight">{statusInfo.title}</h2>
                <p className="text-xs text-slate-300 mt-0.5">{statusInfo.subtitle}</p>
              </div>
            </div>

            {order?.totalPaise ? (
              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                <span className="text-sm font-extrabold text-emerald-400">
                  {formatPaise(order.totalPaise)}
                </span>
              </div>
            ) : null}
          </div>

          {/* Doorstep Handover Verification PIN Card */}
          {order?.deliveryOtp ? (
            <div className="flex items-center justify-between rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/20 via-surface to-amber-500/10 p-3 text-xs">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="size-5 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-white">Customer Handover PIN</span>
                  <p className="text-[11px] text-slate-300">Share with delivery partner at door</p>
                </div>
              </div>
              <div className="rounded-xl bg-black/60 px-3 py-1 font-mono text-base font-black tracking-widest text-amber-300 border border-amber-400/50">
                {order.deliveryOtp}
              </div>
            </div>
          ) : null}

          {/* 5-Stage Stepper Progress Bar */}
          <div className="pt-2">
            <div className="grid grid-cols-5 gap-1.5 text-center">
              {[
                { label: "Placed", icon: CheckCircle2 },
                { label: "Cooking", icon: ChefHat },
                { label: "Ready", icon: Bike },
                { label: "On Way", icon: MapPin },
                { label: "Delivered", icon: CheckCircle2 },
              ].map((step, idx) => {
                const isPassed = idx <= currentStep;
                const isCurrent = idx === currentStep;
                const IconComponent = step.icon;
                return (
                  <div key={step.label} className="flex flex-col items-center">
                    <div
                      className={`size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isPassed
                          ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/40 ring-2 ring-emerald-400/50"
                          : "bg-white/10 text-slate-400"
                      } ${isCurrent ? "scale-110" : ""}`}
                    >
                      <IconComponent className="size-3.5" />
                    </div>
                    <span
                      className={`text-[10px] mt-1 truncate max-w-full font-medium ${
                        isPassed ? "text-emerald-300 font-bold" : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, ((currentStep + 1) / 5) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
