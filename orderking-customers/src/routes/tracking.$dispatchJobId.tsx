import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bike,
  CheckCircle2,
  ChefHat,
  Clock,
  HelpCircle,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/db-cloud";
import { formatPaise } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { lazyWithRetry } from "@/lib/lazy-retry";
import { ErrorBoundary } from "@/components/error-boundary";
import { CustomerAppSkeleton } from "@/components/skeletons/customer-app-skeleton";
import { toast } from "sonner";
import { CancellationGraceWindow } from "@/components/market/cancellation-grace-window";
import { cancelMyOrder } from "@/lib/server/orders";

/**
 * Standard Haversine distance formula between two geographic coordinates.
 */
function haversineDistanceKm(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): number {
  const R = 6371; // Earth radius in km
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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
  paymentMethod?: string;
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
  if (["ACCEPTED", "AUTO_ACCEPTED", "PREPARING"].includes(normalized)) return 1;
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
  if (["ACCEPTED", "AUTO_ACCEPTED", "PREPARING"].includes(normalized)) {
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
  const [isCancelling, setIsCancelling] = useState(false);
  const [showSos, setShowSos] = useState(false);
  const [restaurantPos, setRestaurantPos] = useState<TrackingPosition | null>(null);

  // Dynamic turn-by-turn ETA recalculation: Haversine × 1.35 Indian road traffic multiplier
  const computedEta = useMemo(() => {
    if (!order) return null;
    const status = (order.status || "").toUpperCase();
    if (["DELIVERED", "COMPLETED"].includes(status)) {
      return { minutes: 0, effectiveKm: 0, isDelivered: true };
    }

    // Default reference coordinates if GPS stream is establishing
    const rider = position || { lat: 28.6315, lng: 77.2167 };
    const dest = restaurantPos || { lat: 28.6448, lng: 77.2167 };

    const rawKm = haversineDistanceKm(rider, dest);
    // Indian road traffic multiplier: 1.35x
    const effectiveKm = Math.max(0.5, rawKm * 1.35);

    // Realistic urban two-wheeler speed: ~20 km/h in Indian traffic (3 min per km)
    let minutes = Math.max(1, Math.round((effectiveKm / 20) * 60));

    // Add preparation buffer if kitchen is still cooking
    if (["PLACED", "ACCEPTED", "AUTO_ACCEPTED", "PREPARING"].includes(status)) {
      minutes += 10;
    } else if (["READY", "RIDER_ASSIGNED"].includes(status)) {
      minutes += 4;
    }

    return { minutes, effectiveKm, isDelivered: false };
  }, [order, position, restaurantPos]);

  const handleCancelOrder = async () => {
    setIsCancelling(true);
    try {
      await cancelMyOrder({ data: { orderId: dispatchJobId } });
      toast.success("Order cancelled within 60-second grace window. Full refund initiated.");
      setOrder((prev) => (prev ? { ...prev, status: "CANCELLED_BY_CUSTOMER" } : null));
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel order.");
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("orders")
          .select("id, public_id, status, total_paise, delivery_otp, notes, placed_at, rider_lat, rider_lng, restaurant_lat, restaurant_lng, payment_method")
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
            paymentMethod: data.payment_method || "UPI",
          });

          const riderLat = Number(data.rider_lat);
          const riderLng = Number(data.rider_lng);
          const restaurantLat = Number(data.restaurant_lat);
          const restaurantLng = Number(data.restaurant_lng);

          if (Number.isFinite(restaurantLat) && Number.isFinite(restaurantLng)) {
            setRestaurantPos({ lat: restaurantLat, lng: restaurantLng });
          }

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
          {/* Main Status Headline & Dynamic 1.35x Indian Traffic ETA */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{statusInfo.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white leading-tight">{statusInfo.title}</h2>
                  {computedEta && (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[11px] font-black text-emerald-400 border border-emerald-500/30">
                      ETA ~{computedEta.minutes} min
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-0.5">{statusInfo.subtitle}</p>
                {computedEta && (
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {computedEta.effectiveKm.toFixed(1)} km · Indian Traffic Multiplier: 1.35×
                  </p>
                )}
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

          {/* 1-Tap Call Partner & Emergency SOS Dialers */}
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href="tel:+918045671234"
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2.5 text-xs font-bold text-white shadow-md active:scale-95 transition"
            >
              <span>📞</span>
              <span>1-Tap Call Partner</span>
            </a>

            <button
              type="button"
              onClick={() => setShowSos(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 px-3 py-2.5 text-xs font-black text-white shadow-md shadow-red-600/30 active:scale-95 transition"
            >
              <span className="animate-pulse">🚨</span>
              <span>1-Tap SOS Safety (112)</span>
            </button>
          </div>

          {/* Authentic 60-Second Order Cancellation Grace Window */}
          {order && (order.status === "PLACED" || order.status === "AUTO_ACCEPTED" || order.status.startsWith("CANCELLED")) ? (
            <CancellationGraceWindow
              className="mt-1"
              placedAt={order.placedAt}
              orderId={order.id}
              orderPublicId={order.publicId}
              status={order.status}
              paymentMethod={order.paymentMethod || "UPI"}
              totalPaise={order.totalPaise}
              isCancelling={isCancelling}
              onCancel={handleCancelOrder}
              onWindowExpire={() => {}}
            />
          ) : null}

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

      {/* Emergency SOS Dialog Modal */}
      {showSos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-red-500/40 bg-slate-950 p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-red-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-red-600/30 text-red-400 border border-red-500/40">
                  <span className="text-lg">🚨</span>
                </div>
                <div>
                  <h3 className="font-display text-sm font-black uppercase tracking-wider text-red-400">
                    Emergency Safety Helpline
                  </h3>
                  <p className="text-[11px] text-slate-400">24x7 Sovereign Police & Medical Response</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSos(false)}
                className="rounded-full bg-white/10 p-1.5 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <a
                href="tel:112"
                className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-b from-red-600 to-rose-700 p-3.5 text-center text-white shadow-md active:scale-95 transition"
              >
                <span className="text-base font-black">📞 Call 112</span>
                <span className="text-[10px] text-rose-100">National Police & SOS</span>
              </a>

              <a
                href="tel:108"
                className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-b from-amber-600 to-yellow-700 p-3.5 text-center text-white shadow-md active:scale-95 transition"
              >
                <span className="text-base font-black">🚑 Call 108</span>
                <span className="text-[10px] text-amber-100">Ambulance & Medical</span>
              </a>
            </div>

            <a
              href="tel:18001000"
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 p-3 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              <span>🛡️</span>
              <span>OrderKing 24x7 Safety Command Desk (1800-100-ORDER)</span>
            </a>

            {position && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs space-y-1 font-mono text-slate-300">
                <p className="font-bold text-white text-[11px] uppercase tracking-wider font-sans">
                  Active Dispatch Coordinates
                </p>
                <p>Lat: {position.lat.toFixed(5)}, Lng: {position.lng.toFixed(5)}</p>
                <p className="text-[10px] text-slate-400 font-sans">
                  Telemetry linked to Order #{order?.publicId || dispatchJobId.slice(0, 8)}
                </p>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSos(false)}
              className="w-full text-xs font-semibold text-slate-300 border-slate-700 bg-slate-900"
            >
              Close Safety Panel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
