
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CustomerShell } from "@/components/market/shell";
import { QuoteLines } from "@/components/market/quote-lines";
import { LiveDeliveryMap } from "@/components/market/live-delivery-map";
import { ResilientLiveMap } from "@/components/tracking/resilient-live-map";
import { DishReviewModal } from "@/components/market/dish-review-modal";
import { LiveOrderVoiceAlerts } from "@/components/market/live-order-voice-alerts";
import { Button } from "@/components/ui/button";
import { RetentionRoulette } from "@/components/RetentionRoulette";
import { useT } from "@/components/providers";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { advanceSimulatedOrder, cancelMyOrder, getMyOrder, reorderItems } from "@/lib/server/orders";
import { createTicket } from "@/lib/server/account";
import { getMyHDmasterOrder } from "@/lib/server/hdmaster-order-read";
import { submitOrderReview, getOrderReview } from "@/lib/server/reviews";
import { loadConfig } from "@/lib/server/load-config";
import { CUSTOMER_TRACK_STEPS } from "@/lib/orders/state";
import { formatPaise } from "@/lib/money";
import { useOrderSSE } from "@/lib/hooks/use-order-sse";
import { useCartStore } from "@/lib/stores/cart";
import { OrdersPageSkeleton } from "@/components/skeletons/route-skeletons";
import { AppErrorComponent } from "@/lib/error-component";

export const Route = createFileRoute("/orders/$id")({
  component: OrderDetailPage,
  pendingComponent: OrdersPageSkeleton,
  errorComponent: AppErrorComponent,
});

function OrderDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const cart = useCartStore();
  const { t, lang } = useT();
  const locale = lang === "bn" ? "bn-IN" : "en-IN";
  const { user, isPending } = useCurrentUserState();
  const [starRating, setStarRating] = useState(5);
  const [foodRating, setFoodRating] = useState(5);
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [riderRating, setRiderRating] = useState(5);
  const [appRating, setAppRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(["Fresh & hot", "Advanced fast delivery"]);
  const [reviewComment, setReviewComment] = useState("");
  const [splitCount, setSplitCount] = useState(2);
  const [dishReviewOpen, setDishReviewOpen] = useState(false);

  // Gold-Standard Verified Customer Complaint Room State
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintCategory, setComplaintCategory] = useState<
    "MISSING_ITEMS" | "SPILLED_FOOD" | "COLD_FOOD" | "DELAYED_DELIVERY" | "RIDER_CONDUCT" | "BILLING_ISSUE"
  >("MISSING_ITEMS");
  const [complaintText, setComplaintText] = useState("");
  const [complaintImage, setComplaintImage] = useState<string | null>(null);
  const [preferredResolution, setPreferredResolution] = useState<"REFUND" | "REDELIVERY" | "HDMASTER">("REFUND");
  const [submittedComplaint, setSubmittedComplaint] = useState<{
    ticketId: string;
    category: string;
    resolution: string;
    status: string;
    createdAt: string;
  } | null>(null);

  const handleComplaintImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setComplaintImage(reader.result as string);
      toast.success("Photo attached as verifiable dispute proof!");
    };
    reader.readAsDataURL(file);
  };

  const handleComplaintSubmit = async () => {
    if (!complaintText.trim() && !complaintImage) {
      toast.error("Please provide a description or attach photo proof of the issue.");
      return;
    }
    try {
      const photoNote = complaintImage
        ? "\nPhoto attachment: received in this browser, but private evidence storage is not connected yet."
        : "";
      const requestedResolution =
        preferredResolution === "REFUND"
          ? "Customer requested a refund."
          : preferredResolution === "REDELIVERY"
            ? "Customer requested redelivery."
            : "Customer requested HDmaster review.";
      const result = await createTicket({
        data: {
          orderId: id,
          topic: `ORDER_COMPLAINT_${complaintCategory}`,
          message: `${complaintText.trim()}${photoNote}\n${requestedResolution}`,
        },
      });
      const newComplaint = {
        ticketId: result.id,
        category: complaintCategory,
        resolution: "UNDER_REVIEW",
        status: "OPEN",
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setSubmittedComplaint(newComplaint);
      toast.success(`Complaint registered. Ticket #${newComplaint.ticketId} is under review.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create support ticket.");
    }
  };
  const detail = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const cfg = await loadConfig();
      return cfg.marketplace.launchMode === "live" ? getMyHDmasterOrder({ data: { orderId: id } }) : getMyOrder({ data: { orderId: id } });
    },
    enabled: Boolean(user),
    refetchInterval: (query) => {
      const status = query.state.data?.order?.status;
      if (status && ["DELIVERED", "CANCELLED", "REJECTED"].includes(status)) {
        return false;
      }
      return 5000;
    },
  });

  const { lastEvent, connected } = useOrderSSE(id, (event) => {
    if (event.status && event.status !== detail.data?.order?.status) {
      void detail.refetch();
    }
  });

  const cancel = useMutation({ mutationFn: () => cancelMyOrder({ data: { orderId: id } }), onSuccess: () => void detail.refetch() });
  const advance = useMutation({ mutationFn: () => advanceSimulatedOrder({ data: { orderId: id } }), onSuccess: () => void detail.refetch() });

  const reviewQuery = useQuery({
    queryKey: ["order-review", id],
    queryFn: () => getOrderReview({ data: { orderId: id } }),
    enabled: Boolean(user && detail.data?.order?.status === "DELIVERED"),
  });

  const submitReview = useMutation({
    mutationFn: () => submitOrderReview({ data: { orderId: id, rating: starRating, body: reviewComment } }),
    onSuccess: () => {
      toast.success("Review submitted! Thank you for rating.");
      void reviewQuery.refetch();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to submit review.");
    },
  });

  if (isPending || detail.isPending) {
    return (
      <CustomerShell>
        <div className="min-h-screen bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFEB] p-6 space-y-4 animate-pulse">
          <div className="h-6 w-1/4 bg-gradient-to-r from-amber-100 via-amber-200/70 to-amber-100 rounded-xl" />
          <div className="h-9 w-2/3 bg-gradient-to-r from-amber-100 via-amber-200/70 to-amber-100 rounded-2xl" />
          <div className="h-44 bg-gradient-to-r from-amber-100/80 via-amber-200/50 to-amber-100/80 rounded-3xl border border-amber-200/50" />
          <div className="h-40 bg-gradient-to-r from-amber-100/80 via-amber-200/50 to-amber-100/80 rounded-3xl border border-amber-200/50" />
        </div>
      </CustomerShell>
    );
  }
  if (!user) return <RedirectToSignIn />;
  const order = detail.data?.order;
  if (!order) return <CustomerShell><p className="p-6">{t("common.empty")}</p></CustomerShell>;

  const idx = CUSTOMER_TRACK_STEPS.indexOf(order.status as (typeof CUSTOMER_TRACK_STEPS)[number]);
  const labels: Record<string, string> = { PLACED: t("orders.placed"), ACCEPTED: t("orders.accepted"), PREPARING: t("orders.preparing"), READY: t("orders.ready"), RIDER_ASSIGNED: t("orders.riderAssigned"), PICKED_UP: t("orders.pickedUp"), ON_THE_WAY: t("orders.onTheWay"), DELIVERED: t("orders.delivered") };

  return (
    <CustomerShell>
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFEB] px-4 py-5 pb-28">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300 px-3 py-1 text-xs font-mono font-black text-amber-900 shadow-2xs">
            👑 #{order.summary.publicId}
          </span>
          <span className="text-xs font-black text-stone-900 tabular-nums bg-white border border-amber-200 px-2.5 py-1 rounded-lg">
            {formatPaise(order.summary.totalPaise, { locale })}
          </span>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-black text-stone-900 mt-2 tracking-tight">
          {order.summary.restaurantName}
        </h1>

        {/* Live Spoken Voice Alerts */}
        <div className="mt-3">
          <LiveOrderVoiceAlerts
            orderStatus={
              order.status === "DELIVERED"
                ? "DELIVERED"
                : order.status === "ON_THE_WAY"
                  ? "NEARBY"
                  : ["RIDER_ASSIGNED", "PICKED_UP"].includes(order.status)
                    ? "DISPATCHED"
                    : ["ACCEPTED", "PREPARING", "READY"].includes(order.status)
                      ? "PREPARING"
                      : "PLACED"
            }
          />
        </div>

        {/* Live Order Timeline Card */}
        <div className="mt-4 rounded-3xl border border-amber-300/80 bg-gradient-to-br from-white via-amber-50/40 to-yellow-50/20 p-5 shadow-[0_8px_30px_rgba(245,158,11,0.1)]">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-amber-900/10">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs shadow-xs">
                🛵
              </span>
              <h2 className="font-display font-extrabold text-stone-900 text-base">
                Live Order Journey
              </h2>
            </div>
            <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-0.5 text-[10px] font-black text-white uppercase tracking-wider shadow-2xs">
              {labels[order.status] || order.status}
            </span>
          </div>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-amber-400 before:via-orange-400 before:to-emerald-400">
            {CUSTOMER_TRACK_STEPS.map((step, i) => {
              const isPastStep = i < idx;
              const isCurrent = order.status === step;
              return (
                <div key={step} className="relative flex items-center justify-between">
                  <span
                    className={`absolute -left-6 flex size-5 items-center justify-center rounded-full text-[10px] font-black transition-all ${
                      isPastStep
                        ? "bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-xs"
                        : isCurrent
                          ? "bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/30 ring-4 ring-amber-300/50 animate-pulse"
                          : "bg-amber-100 text-amber-500 border border-amber-200"
                    }`}
                  >
                    {isPastStep ? "✓" : isCurrent ? "●" : i + 1}
                  </span>
                  <div className="pl-2">
                    <p className={`text-xs font-bold ${isCurrent ? "text-amber-950 font-black text-sm" : isPastStep ? "text-stone-700" : "text-stone-400"}`}>
                      {labels[step]}
                    </p>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md animate-pulse">
                      In Progress
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Instant Cancellation Grace Alert for New Orders */}
        {order.status === "PLACED" ? (
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">⚡</span>
              <div>
                <p className="font-extrabold text-amber-950">Order Placed &amp; Sent to Kitchen</p>
                <p className="text-stone-600 mt-0.5">Instant free cancellation available before kitchen accepts</p>
              </div>
            </div>
            {order.canCancel ? (
              <Button
                variant="danger"
                size="sm"
                className="rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold shadow-md shadow-rose-500/20"
                disabled={cancel.isPending}
                onClick={() => cancel.mutate()}
              >
                {cancel.isPending ? "Cancelling..." : "Cancel Order"}
              </Button>
            ) : null}
          </div>
        ) : null}

        {order.status === "CANCELLED" ? (
          <p className="mt-4 text-center text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
            ⚠️ {t("orders.cancelled")}
          </p>
        ) : null}

        {order.deliveryOtp && !["DELIVERED", "CANCELLED"].includes(order.status) ? (
          <div className="mt-4 rounded-2xl border-2 border-amber-400/90 bg-gradient-to-r from-amber-500/15 via-yellow-400/20 to-amber-500/10 p-4 shadow-[0_8px_25px_rgba(245,158,11,0.18)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-xs text-xl">
                🛡️
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                  Delivery Verification OTP
                </p>
                <p className="font-mono text-3xl font-black tracking-widest text-stone-900 mt-0.5">
                  {order.deliveryOtp}
                </p>
              </div>
            </div>
            <p className="max-w-[140px] text-right text-[11px] font-medium text-amber-950 leading-tight">
              Share this OTP only when delivery partner reaches door
            </p>
          </div>
        ) : null}

        {/* Platinum Delivery Partner Live Card */}
        {["RIDER_ASSIGNED", "PICKED_UP", "ON_THE_WAY"].includes(order.status) ? (
          <div className="mt-4 rounded-[var(--radius-xl)] border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-xl">
                  🛵
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-fg">
                    {order.status === "RIDER_ASSIGNED"
                      ? "Delivery Partner Assigned"
                      : "Delivery Partner On The Way"}
                  </h3>
                  <p className="text-xs text-muted">
                    {order.status === "RIDER_ASSIGNED"
                      ? "Reaching restaurant for pickup"
                      : "Safely delivering your warm food"}
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted">
                <span>📞</span>
                <span>Calling unavailable until masked-call provider is connected</span>
              </span>
            </div>
            {order.notes ? (
              <div className="mt-3 rounded-lg bg-surface-2/60 p-2 text-xs text-muted">
                <span className="font-medium text-fg">Delivery instructions: </span>
                {order.notes}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Live Vector & GPS Tracking Map: Resilient Mapbox Fail-Safe (Zero API Keys) */}
        {(typeof import.meta !== "undefined" && import.meta.env?.VITE_MAPBOX_TOKEN) ? (
          <LiveDeliveryMap
            status={lastEvent?.status || order.status}
            restaurantName={order.summary.restaurantName}
            orderId={order.summary.publicId || id}
            dispatchJobId={order.summary.id || id}
            riderProgressOverride={lastEvent?.step ? lastEvent.step / 20 : undefined}
            etaOverride={lastEvent?.eta}
          />
        ) : (
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 text-xs shadow-2xs">
                  🛵
                </span>
                <span className="text-sm font-black text-stone-900">
                  Live Resilient Tracking (Zero API Keys)
                </span>
              </div>
              <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                Telemetry Active
              </span>
            </div>
            <ResilientLiveMap
              orderId={order.summary.publicId || id}
              dispatchJobId={order.summary.id || id}
              status={lastEvent?.status || order.status}
              restaurantName={order.summary.restaurantName}
              riderProgressOverride={lastEvent?.step ? lastEvent.step / 20 : undefined}
              etaOverride={lastEvent?.eta}
            />
          </div>
        )}

        {/* POST-ORDER RETENTION ROULETTE GAMIFICATION WHEEL */}
        {order.status === "DELIVERED" && (
          <RetentionRoulette
            orderId={order.summary.publicId || id}
            orderTotalPaise={order.summary.totalPaise}
            className="mt-6"
          />
        )}

        {/* Dish Review Modal with 3-Photo Upload & ₹25 Gold Reward */}
        {order.status === "DELIVERED" && (
          <div className="mt-4">
            <Button
              type="button"
              onClick={() => setDishReviewOpen(true)}
              className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-stone-950 font-black py-3 rounded-2xl shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 border border-amber-300 transition-all active:scale-98 cursor-pointer"
            >
              <span className="text-base">📸</span>
              <span>Review Dishes &amp; Earn ₹25 Gold Reward</span>
              <span className="rounded-full bg-stone-950 text-amber-300 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                ₹25 Free
              </span>
            </Button>
            <DishReviewModal
              isOpen={dishReviewOpen}
              onClose={() => setDishReviewOpen(false)}
              orderId={order.summary.publicId || id}
              restaurantName={order.summary.restaurantName}
              items={order.items?.map((it, idx) => ({ id: `dish-${idx}`, name: it.name }))}
              onSubmit={() => {
                void reviewQuery.refetch();
              }}
            />
          </div>
        )}

        {/* Multi-Category Post-Delivery Review Card (Restaurant + Food + Rider + App) */}
        {order.status === "DELIVERED" && (
          <div className="mt-4 rounded-[var(--radius-xl)] border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-surface to-amber-500/10 p-4 sm:p-5 shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-black text-base text-foreground">Loved your meal today? ❤️</h2>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    ✓ Verified Delivery
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  If everything was wonderful, a quick 5★ rating means the world to our local chefs, delivery riders, and small team. No pressure at all—honest feedback helps us serve you better every time!
                </p>
              </div>
              <span className="text-3xl animate-bounce">🌟</span>
            </div>

            {reviewQuery.data?.review ? (
              <div className="mt-4 rounded-xl border border-border bg-surface/80 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-warn font-bold">
                  {"★".repeat(reviewQuery.data.review.rating)}
                  {"☆".repeat(5 - reviewQuery.data.review.rating)}
                  <span className="ml-2 text-xs font-semibold text-foreground">({reviewQuery.data.review.rating}/5)</span>
                  <span className="ml-auto text-[10px] text-emerald-600 font-bold">Verified Customer Review ✓</span>
                </div>
                {reviewQuery.data.review.body && (
                  <p className="text-xs italic text-foreground/90">"{reviewQuery.data.review.body}"</p>
                )}
                {reviewQuery.data.review.responseBody && (
                  <div className="rounded border-l-2 border-primary bg-primary/10 p-2 text-xs">
                    <span className="font-semibold text-primary">Kitchen response: </span>
                    <span className="text-foreground">{reviewQuery.data.review.responseBody}</span>
                  </div>
                )}
                <p className="text-[10px] text-muted">
                  Review submitted on {new Date(reviewQuery.data.review.createdAt).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {/* 4 Multi-Category Ratings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl bg-surface/70 border border-border/80 p-3.5">
                  {/* Category 1: Food Quality & Taste */}
                  <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-surface">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🍽️</span>
                      <div>
                        <span className="text-xs font-bold text-foreground block">Food Quality &amp; Taste</span>
                        <span className="text-[10px] text-muted">Freshness, spices &amp; flavor</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFoodRating(star)}
                          className={`text-lg transition hover:scale-125 ${
                            star <= foodRating ? "text-amber-400" : "text-muted/30"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category 2: Restaurant & Packaging */}
                  <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-surface">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏪</span>
                      <div>
                        <span className="text-xs font-bold text-foreground block">Restaurant &amp; Packaging</span>
                        <span className="text-[10px] text-muted">Seal, hygiene &amp; portion</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRestaurantRating(star)}
                          className={`text-lg transition hover:scale-125 ${
                            star <= restaurantRating ? "text-amber-400" : "text-muted/30"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category 3: Rider & Delivery Speed */}
                  <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-surface">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🛵</span>
                      <div>
                        <span className="text-xs font-bold text-foreground block">Rider &amp; Delivery</span>
                        <span className="text-[10px] text-muted">Speed, politeness &amp; care</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRiderRating(star)}
                          className={`text-lg transition hover:scale-125 ${
                            star <= riderRating ? "text-amber-400" : "text-muted/30"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category 4: Order King App Experience */}
                  <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-surface">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👑</span>
                      <div>
                        <span className="text-xs font-bold text-foreground block">Order King App</span>
                        <span className="text-[10px] text-muted">0% markup, ease &amp; speed</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setAppRating(star)}
                          className={`text-lg transition hover:scale-125 ${
                            star <= appRating ? "text-amber-400" : "text-muted/30"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Compliment Tags */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                    Quick Compliments (Tap to add):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Fresh & piping hot ♨️",
                      "Advanced fast delivery ⚡",
                      "Polite & helpful rider 🛵",
                      "Leak-proof packaging 📦",
                      "Authentic royal taste 🍗",
                      "0% menu markup savings 💰",
                    ].map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTags((prev) => prev.filter((t) => t !== tag));
                            } else {
                              setSelectedTags((prev) => [...prev, tag]);
                            }
                          }}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
                            isSelected
                              ? "bg-emerald-600 text-fg shadow-xs"
                              : "bg-surface border border-border text-muted hover:text-foreground"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <textarea
                  className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={2}
                  placeholder="Anything else you'd like to share? (Your review directly supports local chefs and riders)"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />

                <Button
                  size="sm"
                  disabled={submitReview.isPending}
                  onClick={() => {
                    const avg = Math.round((foodRating + restaurantRating + riderRating + appRating) / 4);
                    setStarRating(avg);
                    submitReview.mutate();
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-fg font-bold py-2 rounded-xl shadow-md transition"
                >
                  {submitReview.isPending ? "Submitting..." : "Submit Verified Review (Supports Local Kitchens & Riders) 🌟"}
                </Button>
              </div>
            )}
          </div>
        )}

        
          {order.status === "DELIVERED" && (
            <div className="mt-4 overflow-hidden rounded-[var(--radius-xl)] border border-[#D4AF37]/30 bg-white p-5 shadow-[0_0_30px_rgba(212,175,55,0.15)] relative">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#D4AF37]/10 blur-[50px] pointer-events-none"></div>
              <div className="flex items-start gap-4 relative z-10">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#F59E0B] shadow-lg">
                  <span className="text-2xl">👑</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-fg text-lg leading-tight">Gift a VIP Invite</h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    You have 1 exclusive invite remaining. Send it to a peer now. When they place their first order, your next meal (up to ₹500) is on us.
                  </p>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText("https://orderking.app/black/invite/KING500");
                      toast.success("VIP Invite Link Copied!");
                    }}
                    className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-black transition hover:bg-gray-200 active:scale-95"
                  >
                    Share Invite <span className="text-lg">🎁</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* GOLD-STANDARD VERIFIED CUSTOMER COMPLAINT ROOM (STRICTLY DELIVERED ORDERS ONLY) */}
        {order.status === "DELIVERED" && (
          <div className="mt-4 rounded-[var(--radius-xl)] border-2 border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-surface to-rose-500/5 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-rose-500/20 text-xl">
                  🚨
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-foreground">Order Complaint & Resolution Room</h3>
                    <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:text-rose-300">
                      Tier-1 Standard Redressal
                    </span>
                  </div>
                  <p className="text-xs text-muted">Direct complaint channel exclusively for verified delivered orders</p>
                </div>
              </div>
              <Button
                variant={complaintOpen ? "secondary" : "outline"}
                size="sm"
                className="text-xs font-semibold"
                onClick={() => setComplaintOpen(!complaintOpen)}
              >
                {complaintOpen ? "Close Room" : "Report Issue ➔"}
              </Button>
            </div>

            {/* Active Complaint Status if already submitted */}
            {submittedComplaint && (
              <div className="mt-3 rounded-xl border border-rose-500/40 bg-surface/90 p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-rose-700 dark:text-rose-300">
                    Ticket #{submittedComplaint.ticketId}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 font-bold text-amber-800 dark:text-amber-300">
                    <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                    {submittedComplaint.status}
                  </span>
                </div>
                <p className="text-muted">
                  <span className="font-semibold text-fg">Requested Resolution: </span>
                  {submittedComplaint.resolution}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <span className="text-[11px] text-muted">Escalated to HDmaster Founder Operations at {submittedComplaint.createdAt}</span>
                  <a
                    href={`/support?ticket=${encodeURIComponent(submittedComplaint.ticketId || "")}&orderId=${encodeURIComponent(id)}`}
                    className="text-primary font-bold text-[11px] hover:underline"
                  >
                    💬 Contact Founder Support →
                  </a>
                </div>
              </div>
            )}

            {/* Interactive Complaint Form */}
            {complaintOpen && !submittedComplaint && (
              <div className="mt-4 space-y-3 pt-3 border-t border-rose-500/20">
                {/* 1. Category Chips */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Select Exact Problem:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {[
                      { id: "MISSING_ITEMS", label: "🍱 Missing / Wrong Dish" },
                      { id: "SPILLED_FOOD", label: "🍲 Spilled / Damaged Box" },
                      { id: "COLD_FOOD", label: "❄️ Cold / Quality Issue" },
                      { id: "DELAYED_DELIVERY", label: "⏱️ Excessive Delay" },
                      { id: "RIDER_CONDUCT", label: "🛵 Rider Misbehavior" },
                      { id: "BILLING_ISSUE", label: "💳 Billing Discrepancy" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setComplaintCategory(cat.id as any)}
                        className={`rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition cursor-pointer ${
                          complaintCategory === cat.id
                            ? "border-rose-500 bg-rose-500/15 font-bold text-rose-900 dark:text-rose-200 ring-1 ring-rose-500"
                            : "border-border bg-surface text-muted hover:border-rose-300"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Photo Proof Uploader */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Attach Photo Proof (Camera / File):
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 rounded-lg border border-dashed border-rose-500/60 bg-surface px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-2 cursor-pointer">
                      <span>📸 Snap Photo / Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleComplaintImageUpload}
                      />
                    </label>
                    {complaintImage && (
                      <div className="relative size-12 rounded-lg border border-rose-500/50 overflow-hidden shadow-xs">
                        <img loading="lazy" src={complaintImage} alt="Dispute evidence" className="size-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setComplaintImage(null)}
                          className="absolute top-0 right-0 bg-white/70 text-fg rounded-bl px-1 text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Description Textarea */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Detailed Complaint Description:
                  </label>
                  <textarea
                    rows={2}
                    className="w-full rounded-lg border border-border bg-surface p-2.5 text-xs placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-rose-500"
                    placeholder="Describe the issue in detail (e.g. Biryani box seal was broken, raita was missing)..."
                    value={complaintText}
                    onChange={(e) => setComplaintText(e.target.value)}
                  />
                </div>

                {/* 4. Preferred Resolution Selection */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Select Your Preferred Resolution:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "REFUND", label: "⚡ 100% Instant Refund", desc: "Credited to KingPay Wallet" },
                      { id: "REDELIVERY", label: "🛵 Free Priority Redelivery", desc: "Fresh hot dish in 15m" },
                      { id: "HDMASTER", label: "👑 HDmaster Escalation", desc: "Direct Founder Review" },
                    ].map((res) => (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => setPreferredResolution(res.id as any)}
                        className={`rounded-lg border p-2 text-left transition cursor-pointer ${
                          preferredResolution === res.id
                            ? "border-rose-500 bg-rose-500/15 ring-1 ring-rose-500"
                            : "border-border bg-surface hover:border-rose-300"
                        }`}
                      >
                        <p className="text-xs font-bold text-foreground">{res.label}</p>
                        <p className="text-[10px] text-muted">{res.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Submit Button */}
                <div className="pt-2 flex items-center justify-between">
                  <p className="text-[11px] text-muted">
                    🛡️ Protected under Section 79 IT Act & Consumer Protection Rules
                  </p>
                  <Button
                    variant="danger"
                    size="sm"
                    className="text-xs font-bold px-4"
                    onClick={handleComplaintSubmit}
                  >
                    Submit Verified Complaint ➔
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 1-Tap Split Bill with Friends via UPI (Increases AOV, viral acquisition, 0.5% convenience fee) */}
        <div className="mt-4 rounded-[var(--radius-xl)] border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">👥</span>
              <div>
                <h3 className="font-semibold text-sm text-foreground">Split Bill with Friends via UPI</h3>
                <p className="text-xs text-muted">Generate instant UPI payment links for your friends in 1-tap</p>
              </div>
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              Zero Friction
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-mono">
              Split between {splitCount} people: ₹{((order.summary.totalPaise / splitCount) / 100).toFixed(2)} each
            </div>
            <div className="flex gap-1">
              {[2, 3, 4, 5].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setSplitCount(cnt)}
                  className={`size-7 rounded-md text-xs font-bold transition ${splitCount === cnt ? "bg-primary text-fg" : "border border-border bg-surface text-muted"}`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="w-full text-xs font-medium"
            onClick={() => {
              const text = `Hey! Here's your ₹${((order.summary.totalPaise / splitCount) / 100).toFixed(2)} share for our food order from ${order.summary.restaurantName}: upi://pay?pa=orderking@icici&pn=OrderKing&am=${((order.summary.totalPaise / splitCount) / 100).toFixed(2)}&cu=INR&tn=Bill Split for ${order.summary.publicId}`;
              if (typeof navigator !== "undefined" && navigator.share) {
                void navigator.share({ title: "Split Bill on OrderKing", text });
              } else if (typeof navigator !== "undefined") {
                void navigator.clipboard?.writeText(text);
                toast.success("UPI split payment link copied to clipboard!");
              }
            }}
          >
            📲 Share UPI Split Link (WhatsApp / SMS)
          </Button>
        </div>

        {order.summary.dataLabel === "REAL" ? (
          <p className="mt-4 text-center text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl p-2.5">
            ✓ Live status synchronized in real-time from OrderKing Command
          </p>
        ) : null}

        {/* Detailed Royal Invoice */}
        <div className="mt-6 rounded-3xl border border-amber-900/10 bg-white/95 backdrop-blur-md p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-amber-900/10">
            <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs shadow-xs">
              🧾
            </span>
            <h2 className="font-display font-extrabold text-stone-900 text-base">{t("orders.invoice")}</h2>
          </div>
          <ul className="mb-3 space-y-1.5 text-sm">
            {order.items.map((it: any) => (
              <li key={it.name} className="flex justify-between gap-3 text-stone-800 font-medium">
                <span>{it.quantity} × {it.name}</span>
                <span className="tabular-nums font-bold text-stone-900">{formatPaise(it.lineTotalPaise, { locale })}</span>
              </li>
            ))}
          </ul>
          <QuoteLines lines={order.lines} locale={locale} />
        </div>

        {order.restaurantSimulated && !["DELIVERED", "CANCELLED", "REJECTED"].includes(order.status) ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
            <p className="text-xs text-amber-950 font-medium">{t("orders.simulateHint")}</p>
            <Button
              className="mt-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-xs"
              disabled={advance.isPending}
              onClick={() => advance.mutate()}
            >
              {t("orders.simulate")} ⚡
            </Button>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2.5">
          {order.canCancel ? (
            <Button
              variant="danger"
              className="rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-extrabold shadow-md shadow-rose-500/20 px-5 py-2.5"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate()}
            >
              {t("orders.cancelOrder")}
            </Button>
          ) : null}
          <Button
            className="flex-1 min-w-[140px] rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black shadow-lg shadow-orange-500/25 px-5 py-2.5 hover:from-amber-600 hover:to-orange-600 transition-all active:scale-95"
            onClick={async () => {
              try {
                const res = await reorderItems({ data: { orderId: order.summary.id } });
                cart.replaceCart(res.restaurantId, res.restaurantName, res.lines);
                toast.success("Past order items added to cart!");
                void navigate({ to: "/cart" });
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not reorder");
              }
            }}
          >
            <span>{t("orders.reorder")}</span>
            <span>🍽️</span>
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl border border-amber-200 bg-white hover:bg-amber-50 text-amber-950 font-bold px-4 py-2.5"
            asChild
          >
            <Link to="/support">💬 {t("orders.help")}</Link>
          </Button>
        </div>
      </div>
    </CustomerShell>
  );
}
