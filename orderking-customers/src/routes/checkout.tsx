import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  MapPin,
  ShieldCheck,
  Check,
  Clock,
  Bike,
  Lock,
  Sparkles,
  Crown,
  CreditCard,
  Wallet,
  Banknote,
  Gift,
  Leaf,
  Heart,
  ArrowLeft,
  ChevronRight,
  Edit3,
  Info,
  CloudRain,
  Zap,
  Moon,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { QuoteLines } from "@/components/market/quote-lines";
import { CheckoutUpsellEngine } from "@/components/market/checkout-upsell-engine";
import { LocationDialog } from "@/components/market/location-dialog";
import { CustomerShell } from "@/components/market/shell";
import { ScheduleOrderModal } from "@/components/market/schedule-order-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/components/providers";
import { formatPaise } from "@/lib/money";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { quoteCart, trackAnalytics } from "@/lib/server/quote";
import {
  COD_MAX_PAISE,
  getCheckoutContext,
  placeOrder,
  type RazorpayVerificationInput,
} from "@/lib/server/orders";
import { placeOrderViaHDmaster } from "@/lib/server/hdmaster-orders";
import { loadConfig } from "@/lib/server/load-config";
import { useCartStore } from "@/lib/stores/cart";
import { useLocationStore } from "@/lib/stores/location";
import { newId } from "@/lib/ids";
import { createRazorpayOrder } from "@/lib/server/razorpay-order";
import { WhatsAppShare } from "@/components/market/whatsapp-share";
import { WhatsAppViralBountiesWidget as ReferralGamifiedLoop } from "@/components/market/whatsapp-viral-bounties-widget";
import { AudioVoiceNote } from "@/components/market/audio-voice-note";
import { useVoiceNoteStore } from "@/lib/stores/voice-notes";
import { CheckoutPageSkeleton } from "@/components/skeletons/route-skeletons";
import { AppErrorComponent } from "@/lib/error-component";
import {
  TIP_PRESETS,
  FEEDING_INDIA_DONATION_PAISE,
  parseCustomTip,
  calculateCheckoutTotal,
} from "@/lib/orders/tips-and-donations";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  pendingComponent: CheckoutPageSkeleton,
  errorComponent: AppErrorComponent,
});

function BillTooltip({ text, title }: { text: string; title?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-zinc-400 hover:text-amber-500 transition p-0.5 rounded-full cursor-pointer focus:outline-none"
        aria-label={title || "More information"}
      >
        <Info className="size-3.5" />
      </button>
      {open && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 rounded-xl border border-amber-400/40 bg-zinc-950 p-3 text-xs text-zinc-100 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 pointer-events-none"
        >
          {title && (
            <div className="font-extrabold text-amber-400 mb-1 flex items-center gap-1.5">
              <span>👑</span>
              <span>{title}</span>
            </div>
          )}
          <p className="text-[11px] leading-relaxed text-zinc-300 font-medium">{text}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-950" />
        </div>
      )}
    </div>
  );
}

function CheckoutPage() {
  const { t, lang } = useT();
  const locale = lang === "bn" ? "bn-IN" : "en-IN";
  const { user, isPending } = useCurrentUserState();
  const { restaurantId, restaurantName, items, coupon, clear } = useCartStore();
  const location = useLocationStore((s) => s.location);
  const [method, setMethod] = useState<"COD" | "UPI_SANDBOX" | "RAZORPAY_ONLINE" | "KING_PAY">("RAZORPAY_ONLINE");
  const [preferredUpiApp, setPreferredUpiApp] = useState<string>("GPay");
  const [notes, setNotes] = useState("");
  const [forSomeoneElse, setForSomeoneElse] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [tipPaise, setTipPaise] = useState<number>(0);
  const [customTipRupees, setCustomTipRupees] = useState<string>("");
  const [isCustomTipOpen, setIsCustomTipOpen] = useState(false);
  const [donateFeedingIndia, setDonateFeedingIndia] = useState(false);
  const [noCutlery, setNoCutlery] = useState(true);
  const [busy, setBusy] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduledSlot, setScheduledSlot] = useState<{ date: string; timeSlot: string } | null>(null);
  const navigate = useNavigate();

  const DELIVERY_INSTRUCTIONS = [
    "Leave at door",
    "Do not ring bell / Baby sleeping",
    "Avoid calling",
    "Leave with security / guard",
    "Pet at home",
  ];

  const toggleInstruction = (chip: string) => {
    setNotes((prev) => {
      if (prev.includes(chip)) {
        return prev.replace(chip, "").replace(/,\s*,/g, ",").replace(/^,\s*|,\s*$/g, "").trim();
      }
      return prev ? `${prev}, ${chip}` : chip;
    });
  };

  const quote = useQuery({
    queryKey: ["quote", restaurantId, items, coupon, location],
    enabled: Boolean(restaurantId && items.length),
    queryFn: () =>
      quoteCart({
        data: {
          restaurantId: restaurantId!,
          zoneId: location.zoneId,
          lat: location.lat,
          lng: location.lng,
          coupon,
          lines: items,
        },
      }),
  });

  const checkoutCtx = useQuery({
    queryKey: ["checkout-ctx", restaurantId, (user as any)?.id],
    enabled: Boolean(user && restaurantId),
    queryFn: () => getCheckoutContext({ data: { restaurantId } }),
  });

  if (isPending) {
    return (
      <CustomerShell>
        <div className="p-6 max-w-3xl mx-auto space-y-4 animate-pulse">
          <div className="h-10 w-1/3 bg-amber-500/20 rounded-2xl" />
          <div className="h-40 bg-zinc-200 dark:bg-zinc-800 rounded-3xl" />
          <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-3xl" />
        </div>
      </CustomerShell>
    );
  }
  if (!user) return <RedirectToSignIn />;

  const walletBalancePaise = checkoutCtx.data?.walletBalancePaise ?? 0;
  const restaurantOpen = checkoutCtx.data?.restaurantOpen ?? true;
  const codMaxPaise = checkoutCtx.data?.codMaxPaise ?? COD_MAX_PAISE;

  // Server-authoritative integer-paise payable calculation (quote total + validated tip + Feeding India donation)
  const safeTipPaise = Number.isInteger(tipPaise) && tipPaise >= 0 ? tipPaise : 0;
  const donationPaise = donateFeedingIndia ? FEEDING_INDIA_DONATION_PAISE : 0;
  const { totalPayablePaise: totalPayable } = calculateCheckoutTotal(
    quote.data?.quote.totalPaise ?? 0,
    safeTipPaise,
    donateFeedingIndia
  );

  const isCodEligible = totalPayable > 0 && totalPayable <= codMaxPaise;
  const isKingPaySufficient = walletBalancePaise >= totalPayable && totalPayable > 0;

  const submit = async () => {
    if (!restaurantId || !quote.data) return;
    if (!restaurantOpen) {
      toast.error("This restaurant is currently closed and not accepting orders.");
      return;
    }
    if (!quote.data.isDeliverable || quote.data.quote.blockers.length > 0) {
      toast.error(t("checkout.blocked") || "Order cannot be delivered to the selected location.");
      return;
    }
    if (!location.line1.trim()) {
      toast.error(t("checkout.needAddress") || "Please select a valid delivery address.");
      return;
    }
    if (!location.zoneId || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
      toast.error("Valid delivery zone and coordinates are required.");
      return;
    }
    if (method === "COD" && !isCodEligible) {
      toast.error(`Cash on Delivery is only available for orders up to ${formatPaise(codMaxPaise, { locale })}.`);
      return;
    }
    if (method === "KING_PAY" && !isKingPaySufficient) {
      toast.error(
        `Insufficient KingPay wallet balance (${formatPaise(walletBalancePaise, { locale })} available, ${formatPaise(totalPayable, { locale })} required).`
      );
      return;
    }

    setBusy(true);
    try {
      void trackAnalytics({ data: { name: "checkout_started" } });
      const idempotencyKey = newId("idem");
      const cfg = await loadConfig();

      let orderNotes = notes;
      const deliveryVoiceNoteText = useVoiceNoteStore.getState().getFormattedNoteText("delivery");
      if (deliveryVoiceNoteText) {
        orderNotes = `${orderNotes} ${deliveryVoiceNoteText}`.trim();
      }
      if (noCutlery) {
        orderNotes = `[🌱 No Cutlery Needed] ${orderNotes}`.trim();
      }
      if (forSomeoneElse && recipientName.trim()) {
        orderNotes = `[Deliver to: ${recipientName.trim()}${recipientPhone.trim() ? ` (${recipientPhone.trim()})` : ""}] ${orderNotes}`.trim();
      }

      const placeFinalOrder = async (
        finalPaymentMethod: "COD" | "UPI_SANDBOX" | "KING_PAY" | "RAZORPAY_ONLINE",
        razorpayPayment?: RazorpayVerificationInput
      ) => {
        const result =
          cfg.marketplace.launchMode === "live" && finalPaymentMethod !== "RAZORPAY_ONLINE"
            ? await placeOrderViaHDmaster({
                data: {
                  restaurantId,
                  zoneId: location.zoneId,
                  lat: location.lat,
                  lng: location.lng,
                  coupon,
                  tipPaise: safeTipPaise,
                  donationPaise,
                  lines: items,
                  address: { line1: location.line1, area: location.zoneName, label: location.label },
                  paymentMethod: finalPaymentMethod as "COD" | "UPI_SANDBOX" | "KING_PAY",
                  notes: orderNotes,
                  idempotencyKey,
                },
              })
            : await placeOrder({
                data: {
                  restaurantId,
                  zoneId: location.zoneId,
                  lat: location.lat,
                  lng: location.lng,
                  coupon,
                  tipPaise: safeTipPaise,
                  donationPaise,
                  lines: items,
                  address: { line1: location.line1, area: location.zoneName, label: location.label },
                  paymentMethod: finalPaymentMethod,
                  razorpayPayment,
                  notes: orderNotes,
                  idempotencyKey,
                },
              });
        clear();
        toast.success(t("orders.placed") || "Order successfully placed! 👑");
        void navigate({ to: "/orders/$id", params: { id: result.orderId } });
      };

      if (method === "RAZORPAY_ONLINE") {
        const rzpOrder = await createRazorpayOrder({
          data: {
            restaurantId,
            zoneId: location.zoneId,
            lat: location.lat,
            lng: location.lng,
            lines: items,
            coupon,
            tipPaise: safeTipPaise,
            donationPaise,
            amountPaise: totalPayable,
            currency: "INR",
            receipt: idempotencyKey,
          },
        });
        if (rzpOrder.amountPaise !== totalPayable) {
          throw new Error("Gateway order amount mismatch detected. Checkout aborted.");
        }
        const options = {
          key: rzpOrder.keyId,
          amount: rzpOrder.amountPaise,
          currency: rzpOrder.currency,
          name: cfg.brand.appName,
          description: `OrderKing Order (${restaurantName || "Kitchen"})`,
          image: cfg.brand.logoUrl,
          order_id: rzpOrder.orderId,
          handler: async function (response: {
            razorpay_order_id?: string;
            razorpay_payment_id?: string;
            razorpay_signature?: string;
          }) {
            try {
              if (
                !response?.razorpay_order_id ||
                !response?.razorpay_payment_id ||
                !response?.razorpay_signature ||
                response.razorpay_order_id !== rzpOrder.orderId
              ) {
                throw new Error("Incomplete or mismatched payment verification response from gateway.");
              }
              await placeFinalOrder("RAZORPAY_ONLINE", {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                amountPaise: rzpOrder.amountPaise,
              });
            } catch (err) {
              toast.error(err instanceof Error ? err.message : t("checkout.failed"));
              setBusy(false);
            }
          },
          modal: {
            ondismiss: function () {
              setBusy(false);
            },
          },
          prefill: {
            name: (user as any).name ?? "",
            email: (user as any).email ?? "",
            contact: (user as any).phone ?? "",
          },
          theme: {
            color: "#F59E0B",
          },
        };
        const RazorpayCtor = (window as unknown as { Razorpay?: new (opts: unknown) => any }).Razorpay;
        if (!RazorpayCtor) {
          throw new Error("Razorpay payment SDK is not loaded. Please check your connection or choose another payment method.");
        }
        const rzp = new RazorpayCtor(options);
        rzp.on("payment.failed", function (response: any) {
          const reason = response?.error?.description || "Payment authorization declined by bank or gateway.";
          toast.error(`Payment failed: ${reason}`);
          setBusy(false);
        });
        rzp.open();
      } else {
        await placeFinalOrder(method);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("checkout.failed"));
      setBusy(false);
    }
  };

  return (
    <CustomerShell>
      <div className="min-h-[85vh] bg-gradient-to-b from-amber-500/10 via-white to-amber-50/20 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 pb-32 px-3 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Luxury Breadcrumb / Step Indicator */}
          <div className="flex items-center justify-between px-2">
            <Link
              to="/cart"
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-amber-600 transition"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Cart</span>
            </Link>

            <div className="flex items-center gap-2 text-xs font-black">
              <span className="text-zinc-400">Cart ✓</span>
              <span className="text-amber-500">──</span>
              <span className="rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 px-2.5 py-0.5 shadow-xs">
                2. Royal Checkout
              </span>
              <span className="text-zinc-300">──</span>
              <span className="text-zinc-400">3. Feast</span>
            </div>
          </div>

          {/* Top Royal Banner */}
          <div className="rounded-3xl border border-amber-400/40 bg-gradient-to-r from-amber-500/20 via-yellow-400/25 to-amber-600/15 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-zinc-950 font-black shadow-md text-xl">
                  👑
                </div>
                <div>
                  <h1 className="font-display text-xl sm:text-2xl font-black text-zinc-950 dark:text-amber-100 tracking-tight">
                    {t("checkout.title") || "Secure Royal Checkout"}
                  </h1>
                  <p className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Delivering fresh from <span className="text-amber-800 dark:text-amber-300 font-extrabold">{restaurantName || "Kitchen"}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <Lock className="size-3.5 text-emerald-600" />
                <span>256-bit SSL</span>
              </div>
            </div>
          </div>

          {!items.length ? (
            <div className="p-8 text-center rounded-3xl bg-surface border border-zinc-200">
              <p className="text-muted">{t("cart.empty")}</p>
              <Button asChild className="mt-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-bold">
                <Link to="/">Browse Restaurants</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* 1. ADDRESS SELECTION WITH MAP PREVIEW */}
              <section className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-white via-zinc-50/70 to-amber-50/15 dark:from-zinc-900 dark:to-zinc-850 p-5 shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600">
                      <MapPin className="size-5" />
                    </div>
                    <div>
                      <h2 className="font-display text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                        {t("checkout.address") || "Delivery Address"}
                      </h2>
                      <p className="text-xs text-zinc-400">Where should we deliver your feast?</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setLocationPickerOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-50 dark:bg-zinc-800 px-3 py-1.5 text-xs font-black text-amber-900 dark:text-amber-200 hover:bg-amber-100 transition shadow-xs cursor-pointer"
                  >
                    <Edit3 className="size-3.5" />
                    <span>Change</span>
                  </button>
                </div>

                <div className="rounded-2xl border border-amber-400/25 bg-white dark:bg-zinc-900 p-4 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-black text-[10px] uppercase px-2 py-0.5">
                      {location.label || "HOME"}
                    </span>
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      {location.zoneName || location.cityName || "Verified Operational Hub"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-relaxed">
                    {location.line1 || "Please provide your detailed street address & landmark"}
                  </p>
                </div>

                {/* Interactive Route Map Preview Visualization */}
                <div className="rounded-2xl border border-zinc-900/10 dark:border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-4 text-white shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Bike className="size-28" />
                  </div>

                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-amber-400 font-extrabold uppercase tracking-wider">
                        <Sparkles className="size-3.5" />
                        <span>Live Delivery Route Preview</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                        <span>🍳 {restaurantName || "Kitchen"}</span>
                        <span className="text-amber-400">┈┈┈ 🛵 ┈┈┈</span>
                        <span>📍 {location.label || "Your Location"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-xl bg-amber-400/20 border border-amber-400/40 px-2.5 py-1 text-xs font-black text-amber-300">
                        ⚡ ~25-30 Mins
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400">
                        [{location.lat.toFixed(2)}, {location.lng.toFixed(2)}]
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Delivery Timing & Scheduling Section */}
              <section className="rounded-3xl border border-amber-400/25 bg-gradient-to-br from-white via-zinc-50/70 to-amber-50/15 dark:from-zinc-900 dark:to-zinc-850 p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700">
                      <Clock className="size-5" />
                    </div>
                    <div>
                      <span className="block font-display text-sm font-bold text-zinc-900 dark:text-zinc-50">
                        {scheduledSlot ? `Scheduled: ${scheduledSlot.date} (${scheduledSlot.timeSlot})` : "Standard Express Delivery (~25-30 mins)"}
                      </span>
                      <span className="block text-xs text-zinc-500">
                        {scheduledSlot ? "Order will be prepared fresh right before your chosen slot" : "Food prepared and delivered right away"}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setScheduleModalOpen(true)}
                    className="rounded-xl border-amber-400/40 text-xs font-bold hover:bg-amber-50"
                  >
                    {scheduledSlot ? "Change Slot" : "Schedule for Later"}
                  </Button>
                </div>
              </section>

              {/* Kitchen & Zone Availability Banner */}
              {!restaurantOpen ? (
                <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 shadow-sm">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-600 text-xl font-bold">
                    ⛔
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400">
                      Restaurant Outside Operating Hours
                    </h3>
                    <p className="text-xs text-rose-600/80 dark:text-rose-300/80 mt-0.5">
                      {restaurantName || "This kitchen"} is currently closed and not accepting new checkout requests.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 shadow-sm">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 font-black">
                    ✓
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <span>Verified Kitchen &amp; Delivery Zone</span>
                      <span className="text-[10px] rounded-full bg-emerald-500/20 px-2 py-0.2 font-black">
                        LIVE
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      OrderKing connects with {restaurantName || "kitchen"} via active dispatch network. Real-time integer-paise quote guaranteed.
                    </p>
                  </div>
                </div>
              )}

              {/* Ordering for someone else */}
              <section className="rounded-3xl border border-amber-400/25 bg-gradient-to-br from-white via-zinc-50/70 to-amber-50/15 dark:from-zinc-900 dark:to-zinc-850 p-4 sm:p-5 shadow-sm">
                <label className="flex cursor-pointer items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700">
                      <Gift className="size-5" />
                    </div>
                    <div>
                      <span className="block font-display text-sm font-bold text-zinc-900 dark:text-zinc-50">
                        Ordering for someone else?
                      </span>
                      <span className="block text-xs text-zinc-500">Delivery partner will call the recipient directly</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="size-5 rounded-lg border-amber-400 text-amber-500 focus:ring-amber-400"
                    checked={forSomeoneElse}
                    onChange={(e) => setForSomeoneElse(e.target.checked)}
                  />
                </label>

                {forSomeoneElse && (
                  <div className="mt-4 grid gap-3 border-t border-amber-400/20 pt-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                        Recipient Name
                      </label>
                      <Input
                        className="mt-1 text-sm rounded-xl border-amber-400/40 focus:border-amber-500"
                        placeholder="e.g. Priya Sharma"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                        Recipient Phone Number
                      </label>
                      <Input
                        className="mt-1 text-sm rounded-xl border-amber-400/40 focus:border-amber-500"
                        placeholder="e.g. 9876543210"
                        type="tel"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </section>

              {/* Eco-Friendly Cutlery Option */}
              <section className="rounded-3xl border border-emerald-400/30 bg-gradient-to-r from-emerald-500/10 via-white to-emerald-500/5 dark:from-emerald-950/20 dark:via-zinc-900 dark:to-zinc-850 p-4 sm:p-5 shadow-sm">
                <label className="flex cursor-pointer items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600">
                      <Leaf className="size-5" />
                    </div>
                    <div>
                      <span className="block font-display text-sm font-bold text-emerald-950 dark:text-emerald-200">
                        Don&apos;t send plastic cutlery
                      </span>
                      <span className="block text-xs text-zinc-500">
                        Help reduce single-use plastic waste. Thank you for protecting nature! 🌱
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="size-5 rounded-lg border-emerald-500 text-emerald-600 focus:ring-emerald-500"
                    checked={noCutlery}
                    onChange={(e) => setNoCutlery(e.target.checked)}
                  />
                </label>
              </section>

              {/* Delivery Instructions Chips */}
              <section className="rounded-3xl border border-amber-400/25 bg-gradient-to-br from-white via-zinc-50/70 to-amber-50/15 dark:from-zinc-900 dark:to-zinc-850 p-4 sm:p-5 shadow-sm space-y-3">
                <h2 className="font-display text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
                  Delivery instructions for rider
                </h2>
                <div className="flex flex-wrap gap-2">
                  {DELIVERY_INSTRUCTIONS.map((chip) => {
                    const active = notes.includes(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => toggleInstruction(chip)}
                        className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-2xs ${
                          active
                            ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 shadow-xs"
                            : "bg-surface border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                        }`}
                      >
                        {active ? "✓ " : "+ "}
                        {chip}
                      </button>
                    );
                  })}
                </div>
                <Input
                  className="text-sm rounded-xl border-amber-400/40 focus:border-amber-500"
                  placeholder="Add specific landmark, gate code, or floor directions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />

                {/* 1-Tap 15-Second Delivery Partner Audio Note */}
                <AudioVoiceNote
                  target="delivery"
                  samplePlaceholder="Ghar ke gate par black bell hai, bell mat bajana baby so raha hai"
                  className="mt-3"
                />
              </section>

              {/* Feeding India Micro-Donation Opt-in (₹2) */}
              <section className="rounded-3xl border border-rose-400/30 bg-gradient-to-r from-rose-500/10 via-white to-amber-500/5 dark:from-rose-950/20 dark:via-zinc-900 dark:to-zinc-850 p-4 sm:p-5 shadow-sm">
                <label className="flex cursor-pointer items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-600 font-bold text-lg">
                      🍲
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="block font-display text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          Donate ₹2 to Feeding India — feed a daily wage earner or child in need
                        </span>
                        <BillTooltip
                          title="Feeding India Initiative"
                          text="100% of your ₹2 micro-donation goes directly to Feeding India hunger relief programs supporting daily wage earners and underprivileged children. OrderKing retains 0%."
                        />
                      </div>
                      <span className="block text-xs text-zinc-500">
                        Transparent micro-donation · 100% meal funding · 0% platform deduction
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="size-5 rounded-lg border-rose-400 text-rose-600 focus:ring-rose-500 shrink-0 cursor-pointer"
                    checked={donateFeedingIndia}
                    onChange={(e) => setDonateFeedingIndia(e.target.checked)}
                  />
                </label>
              </section>

              {/* Delivery Partner Tip Selector */}
              <section className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 dark:from-amber-950/20 dark:via-zinc-900 dark:to-zinc-850 p-4 sm:p-5 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-sm font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                      <Heart className="size-4 text-rose-500 fill-rose-500" />
                      <span>Tip your delivery partner</span>
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      100% of your tip goes directly to your delivery partner. OrderKing charges 0% commission or fee on tips.
                    </p>
                  </div>
                  <span className="text-2xl">🛵</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TIP_PRESETS.map((preset) => {
                    const selected = safeTipPaise === preset.valuePaise;
                    return (
                      <button
                        key={preset.valuePaise}
                        type="button"
                        onClick={() => {
                          if (selected) {
                            setTipPaise(0);
                            setIsCustomTipOpen(false);
                            setCustomTipRupees("");
                          } else {
                            setTipPaise(preset.valuePaise);
                            setIsCustomTipOpen(false);
                            setCustomTipRupees("");
                          }
                        }}
                        className={`flex flex-col items-center justify-center rounded-2xl py-2.5 px-2 transition active:scale-95 cursor-pointer relative ${
                          selected
                            ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-black shadow-md border-transparent"
                            : "bg-surface border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <span className="text-base font-black">{preset.label}</span>
                        <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                          {preset.tag}
                        </span>
                      </button>
                    );
                  })}

                  {/* Custom Tip Amount Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomTipOpen(!isCustomTipOpen);
                    }}
                    className={`flex flex-col items-center justify-center rounded-2xl py-2.5 px-2 transition active:scale-95 cursor-pointer ${
                      isCustomTipOpen || (safeTipPaise > 0 && !TIP_PRESETS.some((p) => p.valuePaise === safeTipPaise))
                        ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-black shadow-md border-transparent"
                        : "bg-surface border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span className="text-base font-black">
                      {safeTipPaise > 0 && !TIP_PRESETS.some((p) => p.valuePaise === safeTipPaise)
                        ? `₹${Math.round(safeTipPaise / 100)}`
                        : "Custom"}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                      Enter Amount ✍️
                    </span>
                  </button>
                </div>

                {/* Custom Tip Input Drawer / Field */}
                {isCustomTipOpen && (
                  <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-200">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">
                        ₹
                      </span>
                      <Input
                        type="number"
                        min="0"
                        max="1000"
                        placeholder="Enter custom tip amount (e.g. 40)"
                        value={customTipRupees}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomTipRupees(val);
                          const parsed = parseCustomTip(val);
                          setTipPaise(parsed);
                        }}
                        className="pl-7 rounded-xl border-amber-400/40 text-sm font-bold"
                      />
                    </div>
                    {safeTipPaise > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTipPaise(0);
                          setCustomTipRupees("");
                          setIsCustomTipOpen(false);
                        }}
                        className="rounded-xl text-xs font-bold text-zinc-500 hover:text-rose-600"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                )}

                {safeTipPaise > 0 && (
                  <div className="flex items-center justify-between rounded-xl bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 text-xs">
                    <span className="font-bold text-amber-900 dark:text-amber-200">
                      🎉 Added {formatPaise(safeTipPaise, { locale })} tip for your delivery partner! Thank you!
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTipPaise(0);
                        setCustomTipRupees("");
                        setIsCustomTipOpen(false);
                      }}
                      className="font-black text-[11px] text-amber-900 dark:text-amber-200 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </section>

              {/* Checkout Upsell Engine */}
              {restaurantId && items.length > 0 && (
                <CheckoutUpsellEngine
                  restaurantId={restaurantId}
                  restaurantName={restaurantName}
                  locale={locale}
                  deliveryFeePaise={quote.data?.quote.deliveryFeePaise}
                  currentSubtotalPaise={quote.data?.quote.foodSubtotalPaise}
                />
              )}

              {/* 2. PAYMENT METHOD SELECTION WITH KINGPAY GOLD HIGHLIGHT */}
              <section className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-white via-zinc-50/70 to-amber-50/15 dark:from-zinc-900 dark:to-zinc-850 p-5 shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    <CreditCard className="size-4 text-amber-600" />
                    <span>Select Payment Method</span>
                  </h2>
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <ShieldCheck className="size-3.5" />
                    Zero Extra Fees
                  </span>
                </div>

                {/* KingPay Wallet: Royal 24k Gold Highlight Card */}
                <div
                  className={`rounded-2xl border-2 transition-all p-4 duration-300 ${
                    method === "KING_PAY"
                      ? "border-amber-400 bg-gradient-to-br from-amber-500/20 via-yellow-400/15 to-amber-600/20 shadow-[0_8px_25px_rgba(245,158,11,0.25)]"
                      : "border-amber-400/30 bg-amber-500/5 hover:border-amber-400/60"
                  }`}
                >
                  <label className="flex cursor-pointer items-start gap-3.5">
                    <input
                      type="radio"
                      name="pay"
                      className="mt-1 size-5 text-amber-500 focus:ring-amber-400"
                      checked={method === "KING_PAY"}
                      onChange={() => setMethod("KING_PAY")}
                    />
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 text-zinc-950 font-black shadow-xs">
                            👑
                          </span>
                          <span className="font-display font-black text-sm sm:text-base text-zinc-950 dark:text-amber-100">
                            KingPay Royal Wallet
                          </span>
                          <span className="rounded-full bg-amber-500/30 border border-amber-500/40 px-2 py-0.2 text-[9px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
                            Instant 1-Click
                          </span>
                        </div>

                        <span
                          className={`text-xs font-black tabular-nums ${
                            isKingPaySufficient
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-amber-800 dark:text-amber-300"
                          }`}
                        >
                          Balance: {checkoutCtx.isPending ? "Checking..." : formatPaise(walletBalancePaise, { locale })}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        Atomic ledger debit with row-level transaction safety. 0% gateway drop rate.
                      </p>
                    </div>
                  </label>

                  {method === "KING_PAY" && (
                    <div className="mt-3 flex items-center justify-between border-t border-amber-400/30 pt-3 text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Available:{" "}
                        <strong className="text-zinc-900 dark:text-zinc-100 font-bold">
                          {formatPaise(walletBalancePaise, { locale })}
                        </strong>
                        {!isKingPaySufficient && totalPayable > 0 && (
                          <span className="ml-2 font-bold text-rose-600 dark:text-rose-400">
                            (Short by {formatPaise(totalPayable - walletBalancePaise, { locale })})
                          </span>
                        )}
                      </span>
                      <Link to="/king-pay" className="font-black text-amber-800 dark:text-amber-300 hover:underline">
                        + Add Money / Recharges
                      </Link>
                    </div>
                  )}
                </div>

                {/* Razorpay Online Checkout (UPI / Cards) */}
                <div
                  className={`rounded-2xl border-2 transition-all p-4 duration-300 ${
                    method === "RAZORPAY_ONLINE"
                      ? "border-zinc-950 dark:border-white bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 shadow-lg"
                      : "border-zinc-200 dark:border-zinc-800 bg-surface hover:border-zinc-400"
                  }`}
                >
                  <label className="flex cursor-pointer items-start gap-3.5">
                    <input
                      type="radio"
                      name="pay"
                      className="mt-1 size-5 accent-zinc-950 dark:accent-white"
                      checked={method === "RAZORPAY_ONLINE"}
                      onChange={() => setMethod("RAZORPAY_ONLINE")}
                    />
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-display font-black text-sm sm:text-base text-zinc-900 dark:text-zinc-50">
                          UPI / Cards / NetBanking
                        </span>
                        <span className="rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider self-start sm:self-auto">
                          HMAC-SHA256 Verified
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        Instant gateway verification via GPay, PhonePe, Paytm, or Credit/Debit Cards
                      </p>
                    </div>
                  </label>

                  {method === "RAZORPAY_ONLINE" && (
                    <div className="mt-3 border-t border-zinc-200 dark:border-zinc-800 pt-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2">
                        Preferred Payment App ({preferredUpiApp})
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {(["GPay", "PhonePe", "Paytm", "Cards"] as const).map((appLabel) => {
                          const isSelected = preferredUpiApp === appLabel;
                          const icon =
                            appLabel === "GPay" ? "🟢" : appLabel === "PhonePe" ? "🟣" : appLabel === "Paytm" ? "🔵" : "💳";
                          return (
                            <button
                              key={appLabel}
                              type="button"
                              onClick={() => {
                                setMethod("RAZORPAY_ONLINE");
                                setPreferredUpiApp(appLabel);
                                toast.info(`${appLabel} selected. Tap "Place Order" to pay.`);
                              }}
                              className={`flex flex-col items-center justify-center rounded-xl border p-2.5 transition active:scale-95 cursor-pointer ${
                                isSelected
                                  ? "border-amber-400 bg-amber-500/15 text-zinc-950 dark:text-amber-100 font-black shadow-xs"
                                  : "border-zinc-200 dark:border-zinc-800 bg-surface text-zinc-700 dark:text-zinc-300"
                              }`}
                            >
                              <span className="text-xl">{icon}</span>
                              <span className="text-[11px] font-bold mt-1">{appLabel}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Cash on Delivery (COD) */}
                <label
                  className={`flex cursor-pointer items-start gap-3.5 rounded-2xl border-2 p-4 transition-all ${
                    method === "COD"
                      ? "border-amber-400 bg-amber-500/15"
                      : "border-zinc-200 dark:border-zinc-800 bg-surface"
                  } ${!isCodEligible ? "opacity-50" : ""}`}
                >
                  <input
                    type="radio"
                    name="pay"
                    className="mt-1 size-5 text-amber-500"
                    checked={method === "COD"}
                    disabled={!isCodEligible}
                    onChange={() => setMethod("COD")}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-50">
                        {t("checkout.cod") || "Cash on Delivery"}
                      </span>
                      <span className="text-xs font-semibold text-zinc-500">
                        Max {formatPaise(codMaxPaise, { locale })}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {isCodEligible
                        ? "Pay cash or scan rider's QR code upon delivery"
                        : `Cash on Delivery is unavailable for orders above ${formatPaise(codMaxPaise, { locale })}.`}
                    </p>
                  </div>
                </label>
              </section>

              {/* 3. ORDER SUMMARY WITH CRISP LUXURY BILL BREAKDOWN */}
              <div className="rounded-3xl border border-amber-400/40 bg-gradient-to-b from-white via-zinc-50/70 to-amber-50/20 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-950 p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-amber-400/20 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-zinc-950 shadow-xs">
                      <Receipt className="size-4" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-black text-zinc-950 dark:text-amber-100">
                        Royal Bill Breakdown
                      </h3>
                      <p className="text-[11px] text-zinc-500">100% Transparent · Zero Hidden Charges</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 shadow-2xs">
                    <ShieldCheck className="size-3" />
                    GST Sec 9(5) Compliant
                  </span>
                </div>

                {quote.data ? (
                  <div className="space-y-3">
                    {/* Food Total */}
                    <div className="flex items-center justify-between text-sm py-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">Food Total</span>
                        <BillTooltip
                          title="Kitchen Food Bill"
                          text="Sum of all ordered delicacies from the master kitchen menu at genuine restaurant prices without aggregator markups."
                        />
                      </div>
                      <span className="tabular-nums font-bold text-zinc-950 dark:text-zinc-50">
                        {formatPaise(quote.data.quote.foodSubtotalPaise, { locale })}
                      </span>
                    </div>

                    {/* Discounts */}
                    {quote.data.quote.restaurantDiscountPaise > 0 && (
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 py-0.5">
                        <div className="flex items-center gap-1.5">
                          <span>🎁 {quote.data.promoName || "Kitchen Discount"}</span>
                        </div>
                        <span className="tabular-nums">-{formatPaise(quote.data.quote.restaurantDiscountPaise, { locale })}</span>
                      </div>
                    )}
                    {quote.data.quote.platformDiscountPaise > 0 && (
                      <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 py-0.5">
                        <div className="flex items-center gap-1.5">
                          <span>👑 Platform Royal Discount</span>
                        </div>
                        <span className="tabular-nums">-{formatPaise(quote.data.quote.platformDiscountPaise, { locale })}</span>
                      </div>
                    )}

                    {/* Packaging */}
                    {quote.data.quote.packagingPaise > 0 && (
                      <div className="flex items-center justify-between text-sm py-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-700 dark:text-zinc-300">Kitchen Packaging</span>
                          <BillTooltip
                            title="Tamper-Proof Packaging"
                            text="Set directly by the kitchen to guarantee spill-proof, food-grade, tamper-evident thermal packaging."
                          />
                        </div>
                        <span className="tabular-nums font-semibold text-zinc-800 dark:text-zinc-200">
                          {formatPaise(quote.data.quote.packagingPaise, { locale })}
                        </span>
                      </div>
                    )}

                    {/* Delivery Fee with Distance Slabs & Dynamic Surge Breakdown */}
                    <div className="rounded-2xl border border-amber-400/25 dark:border-zinc-800 bg-amber-500/5 dark:bg-zinc-850/60 p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                            <Bike className="size-3.5 text-amber-600" />
                            <span>Delivery Fee</span>
                          </span>
                          <BillTooltip
                            title="Distance Slab Delivery"
                            text="Calculated using verified distance slabs: Base delivery 0-3km (₹25-₹35), 3-7km (+₹10/km), >7km (+₹14/km) plus any active dynamic surge."
                          />
                          {quote.data.quote.surgeFeePaise > 0 && (
                            <span className="rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 text-[9px] font-black uppercase px-2 py-0.5 flex items-center gap-0.5 shadow-2xs animate-pulse">
                              <Zap className="size-2.5" />
                              Surge Active
                            </span>
                          )}
                        </div>
                        <span className="tabular-nums font-extrabold text-zinc-950 dark:text-zinc-50">
                          {quote.data.quote.deliveryFeePaise === 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              FREE
                            </span>
                          ) : (
                            formatPaise(quote.data.quote.deliveryFeePaise, { locale })
                          )}
                        </span>
                      </div>

                      {/* Distance slab fee component */}
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span>Base slab fee ({quote.data.quote.baseDeliveryFeePaise === 0 ? "Waived" : "0-3km standard slab"})</span>
                        <span className="tabular-nums font-medium">{formatPaise(quote.data.quote.baseDeliveryFeePaise, { locale })}</span>
                      </div>

                      {/* Dynamic Surge itemized breakdown if active */}
                      {quote.data.quote.surgeFeePaise > 0 && (
                        <div className="space-y-1.5 border-t border-dashed border-amber-400/30 pt-2">
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                            <span>Active Surge Breakdown</span>
                            <span>+{formatPaise(quote.data.quote.surgeFeePaise, { locale })}</span>
                          </div>
                          {quote.data.quote.surgeBreakdown?.activeSurges.map((surge) => (
                            <div key={surge.type} className="flex items-center justify-between text-xs py-0.5 bg-amber-500/10 dark:bg-amber-500/5 rounded-lg px-2">
                              <div className="flex items-center gap-1.5">
                                {surge.type === "RAIN" ? (
                                  <CloudRain className="size-3.5 text-sky-500" />
                                ) : surge.type === "PEAK_DEMAND" ? (
                                  <Zap className="size-3.5 text-amber-500" />
                                ) : (
                                  <Moon className="size-3.5 text-indigo-400" />
                                )}
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{surge.label}</span>
                                <BillTooltip title={surge.label} text={surge.description} />
                              </div>
                              <span className="tabular-nums font-bold text-amber-800 dark:text-amber-300">
                                +{formatPaise(surge.amountPaise, { locale })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Small Cart Fee */}
                    {quote.data.quote.smallCartFeePaise > 0 && (
                      <div className="flex items-center justify-between text-sm py-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-700 dark:text-zinc-300">Small Cart Fee</span>
                          <BillTooltip
                            title="Small Cart Fee"
                            text="Standard ₹25.00 fee applied for orders with food value under ₹149.00 to maintain logistics viability and fair rider payouts."
                          />
                        </div>
                        <span className="tabular-nums font-semibold text-zinc-800 dark:text-zinc-200">
                          +{formatPaise(quote.data.quote.smallCartFeePaise, { locale })}
                        </span>
                      </div>
                    )}

                    {/* Platform Fee */}
                    <div className="flex items-center justify-between text-sm py-1 rounded-xl bg-amber-500/10 dark:bg-amber-500/5 px-2.5 border border-amber-400/20">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                          <span>👑</span>
                          <span>Consumer Platform Fee</span>
                        </span>
                        <BillTooltip
                          title="Platform Fee (Founder Gross Profit)"
                          text="Flat ₹6.00 to ₹10.00 platform fee representing 100% founder gross profit. Supports high-reliability 24/7 cloud servers, bank-grade payment encryption, and round-the-clock live dispatch monitoring."
                        />
                      </div>
                      <span className="tabular-nums font-extrabold text-amber-950 dark:text-amber-200">
                        {formatPaise(quote.data.quote.platformFeePaise, { locale })}
                      </span>
                    </div>

                    {/* Govt Taxes: 5% Food GST + 18% Services GST */}
                    <div className="space-y-1.5 rounded-2xl border border-dashed border-amber-400/30 p-3 bg-amber-500/5 dark:bg-zinc-850/40 text-xs text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-center justify-between font-bold text-zinc-850 dark:text-zinc-150">
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-900 dark:text-zinc-100 font-bold">Govt Taxes (GST)</span>
                          <BillTooltip
                            title="Statutory GST Compliance"
                            text="Includes 5% restaurant food GST levied under Section 9(5) CGST (collected and remitted by OrderKing as an Electronic Commerce Operator) plus statutory 18% services GST on platform charges."
                          />
                        </div>
                        <span className="tabular-nums font-bold text-zinc-900 dark:text-zinc-100">
                          {quote.data.quote.taxPaise > 0
                            ? formatPaise(quote.data.quote.taxPaise, { locale })
                            : "Included"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-zinc-500 dark:text-zinc-400 font-mono pt-1">
                        <span>• Restaurant Food GST (Sec 9(5) CGST 5%)</span>
                        <span>{quote.data.quote.taxBreakdown?.foodGstIncludedInMenu ? "Included in Item Prices" : formatPaise(quote.data.quote.taxBreakdown?.foodGstPaise ?? 0, { locale })}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                        <span>• Services GST (18% on Platform &amp; Services)</span>
                        <span>{formatPaise(quote.data.quote.taxBreakdown?.servicesGstPaise ?? 0, { locale })}</span>
                      </div>
                    </div>

                    {/* Delivery Partner Tip */}
                    {safeTipPaise > 0 && (
                      <div className="flex items-center justify-between text-sm font-bold border-t border-zinc-200 dark:border-zinc-800 pt-2">
                        <div className="flex items-center gap-1.5">
                          <Heart className="size-4 text-rose-500 fill-rose-500" />
                          <span className="text-zinc-800 dark:text-zinc-200">Delivery Partner Tip</span>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                            100% to Rider
                          </span>
                        </div>
                        <span className="text-amber-600 font-extrabold tabular-nums">+{formatPaise(safeTipPaise, { locale })}</span>
                      </div>
                    )}

                    {/* Feeding India Micro-Donation */}
                    {donateFeedingIndia && (
                      <div className="flex items-center justify-between text-sm font-bold border-t border-zinc-200 dark:border-zinc-800 pt-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">🍲</span>
                          <span className="text-zinc-800 dark:text-zinc-200">Feeding India Donation</span>
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded-full">
                            Feed a person in need
                          </span>
                        </div>
                        <span className="text-rose-600 font-extrabold tabular-nums">+{formatPaise(donationPaise, { locale })}</span>
                      </div>
                    )}

                    {/* Total Payable (Ultra-Crisp 3D Golden Card) */}
                    <div className="flex items-center justify-between rounded-2xl border-2 border-amber-400/60 bg-gradient-to-r from-amber-500/15 via-yellow-400/20 to-amber-500/10 dark:from-amber-950/40 dark:to-zinc-900 p-3.5 mt-3 shadow-md">
                      <div>
                        <span className="block font-display text-sm sm:text-base font-black text-zinc-950 dark:text-zinc-50 tracking-tight">
                          Total Payable
                        </span>
                        <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">
                          All taxes &amp; operational fees included
                        </span>
                      </div>
                      <span className="font-display text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-300 tabular-nums tracking-tight">
                        {formatPaise(totalPayable, { locale })}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">{t("common.loading") || "Calculating bill..."}</p>
                )}
              </div>

              {/* Gamified Referral Loop */}
              <ReferralGamifiedLoop source="checkout" className="my-6" />

              {/* 4. PROMINENT GOLDEN PLACE ORDER BUTTON */}
              <div className="sticky bottom-4 z-40">
                <button
                  type="button"
                  disabled={
                    busy ||
                    !quote.data ||
                    !quote.data.isDeliverable ||
                    !restaurantOpen ||
                    (method === "KING_PAY" && !isKingPaySufficient) ||
                    (method === "COD" && !isCodEligible)
                  }
                  onClick={() => void submit()}
                  className="w-full h-16 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-zinc-950 font-black text-lg sm:text-xl shadow-[0_12px_40px_rgba(245,158,11,0.55)] hover:shadow-[0_16px_50px_rgba(245,158,11,0.7)] flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  aria-label="Place Order"
                >
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <span className="size-5 border-3 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                      <span>Processing Royal Order...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Lock className="size-5 stroke-[2.5]" />
                      <span>Place Order • {formatPaise(totalPayable, { locale })}</span>
                    </span>
                  )}
                </button>
              </div>

              {/* Security Trust Microcopy */}
              <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-500 font-medium pt-2">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  RBI &amp; NPCI Compliant
                </span>
                <span>•</span>
                <span>100% Refund on Kitchen Cancellation</span>
              </div>
            </>
          )}

          {/* Location Dialog for Address Picker */}
          <LocationDialog
            open={locationPickerOpen}
            onOpenChange={setLocationPickerOpen}
          />

          {/* Schedule Order Modal */}
          <ScheduleOrderModal
            isOpen={scheduleModalOpen}
            onClose={() => setScheduleModalOpen(false)}
            restaurantName={restaurantName}
            onSchedule={(slot) => {
              setScheduledSlot(slot);
              toast.success(`Delivery slot reserved for ${slot.date} (${slot.timeSlot})`);
            }}
          />

        </div>
      </div>
    </CustomerShell>
  );
}
