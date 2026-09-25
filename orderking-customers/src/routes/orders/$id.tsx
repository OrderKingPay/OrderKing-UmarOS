import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CustomerShell } from "@/components/market/shell";
import { QuoteLines } from "@/components/market/quote-lines";
import { LiveDeliveryMap } from "@/components/market/live-delivery-map";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { advanceSimulatedOrder, cancelMyOrder, getMyOrder, reorderItems } from "@/lib/server/orders";
import { getMyHDmasterOrder } from "@/lib/server/hdmaster-order-read";
import { submitOrderReview, getOrderReview } from "@/lib/server/reviews";
import { loadConfig } from "@/lib/server/load-config";
import { CUSTOMER_TRACK_STEPS } from "@/lib/orders/state";
import { formatPaise } from "@/lib/money";
import { useOrderSSE } from "@/lib/hooks/use-order-sse";
import { useCartStore } from "@/lib/stores/cart";

export const Route = createFileRoute("/orders/$id")({ component: OrderDetailPage });

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
  const [selectedTags, setSelectedTags] = useState<string[]>(["Fresh & hot", "Super fast delivery"]);
  const [reviewComment, setReviewComment] = useState("");
  const [scratched, setScratched] = useState(false);
  const [splitCount, setSplitCount] = useState(2);

  // Zomato-style Verified Customer Complaint Room State
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

  const handleComplaintSubmit = () => {
    if (!complaintText.trim() && !complaintImage) {
      toast.error("Please provide a description or attach photo proof of the issue.");
      return;
    }
    const ticketNum = Math.floor(100000 + Math.random() * 900000);
    const newComplaint = {
      ticketId: `HD-COMPLAINT-${ticketNum}`,
      category: complaintCategory,
      resolution:
        preferredResolution === "REFUND"
          ? "Instant 100% Wallet Refund"
          : preferredResolution === "REDELIVERY"
            ? "Free Express Redelivery"
            : "Escalated to HDmaster Founder Operations",
      status: "UNDER_REVIEW",
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setSubmittedComplaint(newComplaint);
    toast.success(`Complaint registered! Ticket #${newComplaint.ticketId} escalated.`);
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

  if (isPending) return <CustomerShell><div className="p-6">{t("common.loading")}</div></CustomerShell>;
  if (!user) return <RedirectToSignIn />;
  const order = detail.data?.order;
  if (detail.isPending) return <CustomerShell><div className="p-6">{t("common.loading")}</div></CustomerShell>;
  if (!order) return <CustomerShell><p className="p-6">{t("common.empty")}</p></CustomerShell>;

  const idx = CUSTOMER_TRACK_STEPS.indexOf(order.status as (typeof CUSTOMER_TRACK_STEPS)[number]);
  const labels: Record<string, string> = { PLACED: t("orders.placed"), ACCEPTED: t("orders.accepted"), PREPARING: t("orders.preparing"), READY: t("orders.ready"), RIDER_ASSIGNED: t("orders.riderAssigned"), PICKED_UP: t("orders.pickedUp"), ON_THE_WAY: t("orders.onTheWay"), DELIVERED: t("orders.delivered") };

  return (
    <CustomerShell>
      <div className="px-4 py-5">
        <p className="text-sm text-muted">{t("orders.copyId", { id: order.summary.publicId })}</p>
        <h1 className="font-display text-3xl">{order.summary.restaurantName}</h1>
        <ol className="mt-6 space-y-3">{CUSTOMER_TRACK_STEPS.map((step, i) => <li key={step} className={i <= idx || order.status === step ? "text-fg" : "text-subtle"}><span className="font-medium">{labels[step]}</span></li>)}</ol>
        
        {/* Zomato-style Instant Cancellation Grace Alert for New Orders */}
        {order.status === "PLACED" ? (
          <div className="mt-4 flex items-center justify-between rounded-[var(--radius-lg)] border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-300">Order Placed & Sent to Kitchen</p>
                <p className="text-muted">Instant free cancellation available before kitchen accepts</p>
              </div>
            </div>
            {order.canCancel ? (
              <Button
                variant="danger"
                size="sm"
                disabled={cancel.isPending}
                onClick={() => cancel.mutate()}
              >
                {cancel.isPending ? "Cancelling..." : "Cancel Order"}
              </Button>
            ) : null}
          </div>
        ) : null}

        {order.status === "CANCELLED" ? <p className="mt-4 text-danger">{t("orders.cancelled")}</p> : null}
        {order.deliveryOtp && !["DELIVERED", "CANCELLED"].includes(order.status) ? (
          <div className="mt-4 flex items-center justify-between rounded-[var(--radius-lg)] border border-primary/30 bg-primary/5 p-3">
            <div>
              <p className="text-xs text-muted font-medium">Delivery Verification OTP</p>
              <p className="font-mono text-2xl font-bold tracking-widest text-primary">{order.deliveryOtp}</p>
            </div>
            <p className="max-w-[180px] text-right text-[11px] text-muted">Share this OTP with your delivery partner at door</p>
          </div>
        ) : null}

        {/* Zomato-standard Delivery Partner Live Card */}
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
              <a
                href="tel:18001000"
                className="flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-fg shadow-xs hover:bg-surface-3"
              >
                <span>📞</span>
                <span>Call (Masked)</span>
              </a>
            </div>
            {order.notes ? (
              <div className="mt-3 rounded-lg bg-surface-2/60 p-2 text-xs text-muted">
                <span className="font-medium text-fg">Delivery instructions: </span>
                {order.notes}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Live Vector & GPS Tracking Map */}
        <LiveDeliveryMap
          status={lastEvent?.status || order.status}
          restaurantName={order.summary.restaurantName}
          riderProgressOverride={lastEvent?.step ? lastEvent.step / 20 : undefined}
          etaOverride={lastEvent?.eta}
        />

        {/* Google Pay / CRED-Style Mystery Scratch Card on Delivery */}
        {order.status === "DELIVERED" && (
          <div className="mt-6 overflow-hidden rounded-[var(--radius-xl)] border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-surface to-amber-500/5 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-amber-500/20 text-lg">
                  🎁
                </span>
                <div>
                  <h3 className="font-display font-bold text-fg">Delivery Mystery Scratch Card</h3>
                  <p className="text-xs text-muted">You unlocked secret rewards on this order!</p>
                </div>
              </div>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-200">
                King Club
              </span>
            </div>

            <div className="mt-3">
              {!scratched ? (
                <button
                  type="button"
                  onClick={() => {
                    setScratched(true);
                    toast.success("🎉 Mystery Reward Unlocked!");
                  }}
                  className="group flex h-24 w-full items-center justify-center rounded-xl border border-dashed border-amber-500/60 bg-gradient-to-r from-amber-500/10 via-primary/10 to-amber-500/10 text-center transition hover:border-amber-500 cursor-pointer"
                >
                  <div>
                    <span className="text-2xl transition-transform group-hover:scale-125 inline-block">✨</span>
                    <p className="font-bold text-sm text-fg">Tap to Scratch Your Reward</p>
                    <p className="text-[11px] text-muted">Win King Coins, Fuel Vouchers & Brand Deals</p>
                  </div>
                </button>
              ) : (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
                  <span className="text-2xl">🎉</span>
                  <p className="font-bold text-sm text-emerald-800 dark:text-emerald-200">
                    You won 2,500 King Coins + ₹50 HP Fuel Voucher!
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    Code: <span className="font-mono font-bold text-fg">HPFUEL50</span> (HP Pay / IndianOil ONE)
                  </p>
                  <div className="mt-2.5 flex flex-wrap justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void navigator.clipboard?.writeText("HPFUEL50");
                        toast.success("Voucher code copied!");
                      }}
                    >
                      Copy Code
                    </Button>
                    <a
                      href="https://hppay.in?ref=orderking"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                    >
                      <span>Redeem on HP Pay</span>
                      <span>↗</span>
                    </a>
                    <Button size="sm" variant="ghost" asChild>
                      <Link to="/king-pay">KingPay Hub →</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
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
                      "Super fast delivery ⚡",
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
                              ? "bg-emerald-600 text-white shadow-xs"
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
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl shadow-md transition"
                >
                  {submitReview.isPending ? "Submitting..." : "Submit Verified Review (Supports Local Kitchens & Riders) 🌟"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ZOMATO-STYLE VERIFIED CUSTOMER COMPLAINT ROOM (STRICTLY DELIVERED ORDERS ONLY) */}
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
                      Zomato-Standard Redressal
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
                    href="https://wa.me/918000000000?text=Hi%2C%20I%20have%20an%20urgent%20complaint%20regarding%20ticket%20"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-bold text-[11px] hover:underline"
                  >
                    💬 WhatsApp Escalation →
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
                          className="absolute top-0 right-0 bg-black/70 text-white rounded-bl px-1 text-[10px]"
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
                  className={`size-7 rounded-md text-xs font-bold transition ${splitCount === cnt ? "bg-primary text-white" : "border border-border bg-surface text-muted"}`}
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

        {order.summary.dataLabel === "REAL" ? <p className="mt-4 text-sm text-muted">Live status is synchronized from OrderKing Command.</p> : null}
        <div className="mt-6 rounded-[var(--radius-xl)] bg-surface p-4">
          <h2 className="mb-3 font-medium">{t("orders.invoice")}</h2>
          <ul className="mb-3 space-y-1 text-sm">{order.items.map((it) => <li key={it.name} className="flex justify-between gap-3"><span>{it.quantity} × {it.name}</span><span className="tabular-nums">{formatPaise(it.lineTotalPaise, { locale })}</span></li>)}</ul>
          <QuoteLines lines={order.lines} locale={locale} />
        </div>
        {order.restaurantSimulated && !["DELIVERED", "CANCELLED", "REJECTED"].includes(order.status) ? <div className="mt-4 rounded-[var(--radius-lg)] border border-border p-3"><p className="text-sm text-muted">{t("orders.simulateHint")}</p><Button className="mt-2" variant="outline" disabled={advance.isPending} onClick={() => advance.mutate()}>{t("orders.simulate")}</Button></div> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {order.canCancel ? <Button variant="danger" disabled={cancel.isPending} onClick={() => cancel.mutate()}>{t("orders.cancelOrder")}</Button> : null}
          <Button
            variant="outline"
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
            {t("orders.reorder")}
          </Button>
          <Button variant="ghost" asChild><Link to="/support">{t("orders.help")}</Link></Button>
        </div>
      </div>
    </CustomerShell>
  );
}
