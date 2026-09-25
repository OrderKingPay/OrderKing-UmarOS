import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { QuoteLines } from "@/components/market/quote-lines";
import { CustomerShell } from "@/components/market/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/components/providers";
import { formatPaise } from "@/lib/money";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { quoteCart, trackAnalytics } from "@/lib/server/quote";
import { placeOrder } from "@/lib/server/orders";
import { placeOrderViaHDmaster } from "@/lib/server/hdmaster-orders";
import { loadConfig } from "@/lib/server/load-config";
import { useCartStore } from "@/lib/stores/cart";
import { useLocationStore } from "@/lib/stores/location";
import { newId } from "@/lib/ids";
import { createRazorpayOrder } from "@/lib/server/razorpay-order";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

function CheckoutPage() {
  const { t, lang } = useT();
  const locale = lang === "bn" ? "bn-IN" : "en-IN";
  const { user, isPending } = useCurrentUserState();
  const { restaurantId, items, coupon, clear } = useCartStore();
  const location = useLocationStore((s) => s.location);
  const [method, setMethod] = useState<"COD" | "UPI_SANDBOX" | "RAZORPAY_ONLINE" | "KING_PAY">("KING_PAY");
  const [notes, setNotes] = useState("");
  const [forSomeoneElse, setForSomeoneElse] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [tipPaise, setTipPaise] = useState<number>(0);
  const [roundupGold, setRoundupGold] = useState(true);
  const [noCutlery, setNoCutlery] = useState(true);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const DELIVERY_INSTRUCTIONS = [
    "Leave at door",
    "Ring doorbell",
    "Avoid calling",
    "Leave with guard",
    "Pet at home",
  ];

  const TIP_OPTIONS = [
    { label: "None", value: 0 },
    { label: "₹10", value: 1000, emoji: "😊" },
    { label: "₹20", value: 2000, emoji: "👍" },
    { label: "₹30", value: 3000, emoji: "🌟" },
    { label: "₹50", value: 5000, emoji: "🚀" },
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
    queryFn: () => quoteCart({ data: { restaurantId: restaurantId!, zoneId: location.zoneId, lat: location.lat, lng: location.lng, coupon, lines: items } }),
  });

  if (isPending) return <CustomerShell><div className="p-6 text-muted">{t("common.loading")}</div></CustomerShell>;
  if (!user) return <RedirectToSignIn />;

  const submit = async () => {
    if (!restaurantId || !quote.data) return;
    if (!quote.data.isDeliverable) { toast.error(t("checkout.blocked") || "Minimum order not met"); return; }
    if (!location.line1.trim()) { toast.error(t("checkout.needAddress")); return; }
    setBusy(true);
    try {
      void trackAnalytics({ data: { name: "checkout_started" } });
      const idempotencyKey = newId("idem");
      const cfg = await loadConfig();
        // Handle RAZORPAY_ONLINE later
      let orderNotes = notes;
      if (noCutlery) {
        orderNotes = `[🌱 No Cutlery Needed] ${orderNotes}`.trim();
      }
      if (forSomeoneElse && recipientName.trim()) {
        orderNotes = `[Deliver to: ${recipientName.trim()}${recipientPhone.trim() ? ` (${recipientPhone.trim()})` : ""}] ${orderNotes}`.trim();
      }
      if (roundupGold && goldRoundupPaise > 0) {
        orderNotes = `[✨ 24K Gold Savings: ₹${(goldRoundupPaise / 100).toFixed(2)}] ${orderNotes}`.trim();
      }
      const placeFinalOrder = async (finalPaymentMethod: string) => {
        const result = cfg.marketplace.launchMode === "live"
          ? await placeOrderViaHDmaster({ data: { restaurantId, zoneId: location.zoneId, lat: location.lat, lng: location.lng, coupon, tipPaise, lines: items, address: { line1: location.line1, area: location.zoneName, label: location.label }, paymentMethod: finalPaymentMethod as any, notes: orderNotes, idempotencyKey } })
          : await placeOrder({ data: { restaurantId, zoneId: location.zoneId, lat: location.lat, lng: location.lng, coupon, tipPaise, lines: items, address: { line1: location.line1, area: location.zoneName, label: location.label }, paymentMethod: finalPaymentMethod as any, notes: orderNotes, idempotencyKey } });
        clear();
        toast.success(t("orders.placed"));
        void navigate({ to: "/orders/$id", params: { id: result.orderId } });
      };

      if (method === "RAZORPAY_ONLINE") {
        const rzpOrder = await createRazorpayOrder({ data: { amountPaise: totalPayable, currency: "INR", receipt: idempotencyKey } });
        const options = {
          key: rzpOrder.keyId,
          amount: rzpOrder.amountPaise,
          currency: rzpOrder.currency,
          name: cfg.brand.name,
          description: "OrderKing Food Delivery",
          image: cfg.brand.logoUrl,
          order_id: rzpOrder.orderId,
          handler: async function (response: any) {
            await placeFinalOrder("UPI_SANDBOX");
          },
          prefill: {
            name: user.name ?? "",
            email: user.email ?? "",
            contact: user.phone ?? ""
          },
          theme: {
            color: cfg.brand.primaryColor
          }
        };
        // @ts-ignore
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          toast.error("Payment failed. Please try again.");
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

  const basePayable = (quote.data?.quote.totalPaise ?? 0) + tipPaise;
  const remainderPaise = basePayable % 1000;
  const goldRoundupPaise = basePayable > 0 ? (remainderPaise === 0 ? 1000 : 1000 - remainderPaise) : 0;
  const totalPayable = basePayable + (roundupGold ? goldRoundupPaise : 0);

  return (
    <CustomerShell>
      <div className="px-4 py-5">
        <h1 className="font-display text-3xl">{t("checkout.title")}</h1>
        {!items.length ? <p className="mt-6 text-muted">{t("cart.empty")}</p> : <>
          <section className="mt-6"><h2 className="text-sm font-medium text-muted">{t("checkout.address")}</h2><p className="mt-1 font-medium">{location.label}</p><p className="text-sm text-muted">{location.line1}</p></section>
          
          {/* Ordering for someone else? (Zomato-style) */}
          <section className="mt-4 rounded-[var(--radius-xl)] border border-border bg-surface p-4">
            <label className="flex cursor-pointer items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🎁</span>
                <div>
                  <span className="block text-sm font-semibold">Ordering for someone else?</span>
                  <span className="block text-xs text-muted">Delivery partner will call the recipient</span>
                </div>
              </div>
              <input
                type="checkbox"
                className="size-4 rounded border-border text-primary focus:ring-primary"
                checked={forSomeoneElse}
                onChange={(e) => setForSomeoneElse(e.target.checked)}
              />
            </label>
            {forSomeoneElse && (
              <div className="mt-3 grid gap-3 border-t border-border/60 pt-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-muted">Recipient Name</label>
                  <Input
                    className="mt-1 text-sm"
                    placeholder="e.g. Rahul Sharma"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted">Recipient Phone</label>
                  <Input
                    className="mt-1 text-sm"
                    placeholder="e.g. 9876543210"
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Eco-friendly Cutlery Option (Zomato-style) */}
          <section className="mt-4 rounded-[var(--radius-xl)] border border-emerald-500/20 bg-emerald-500/5 p-4">
            <label className="flex cursor-pointer items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🌱</span>
                <div>
                  <span className="block text-sm font-semibold text-emerald-900 dark:text-emerald-300">Don&apos;t send cutlery</span>
                  <span className="block text-xs text-muted">Help reduce plastic waste. Thank you for caring for nature!</span>
                </div>
              </div>
              <input
                type="checkbox"
                className="size-4 rounded border-emerald-500 text-emerald-600 focus:ring-emerald-500"
                checked={noCutlery}
                onChange={(e) => setNoCutlery(e.target.checked)}
              />
            </label>
          </section>

          {/* Delivery Instructions (Zomato-style chips) */}
          <section className="mt-6">
            <h2 className="text-sm font-medium text-muted">Delivery instructions for rider</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {DELIVERY_INSTRUCTIONS.map((chip) => {
                const active = notes.includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => toggleInstruction(chip)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      active
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-surface text-muted hover:border-primary/50"
                    }`}
                  >
                    {active ? "✓ " : "+ "}{chip}
                  </button>
                );
              })}
            </div>
            <Input
              className="mt-2 text-sm"
              placeholder="Add more details (e.g. Landmark, directions)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>

          {/* Delivery Partner Tip (Zomato-style) */}
          <section className="mt-6 rounded-[var(--radius-xl)] border border-primary/15 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-primary">Tip your delivery partner</h2>
                <p className="text-xs text-muted">100% of your tip goes directly to the partner</p>
              </div>
              <span className="text-xl">🛵</span>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {TIP_OPTIONS.map((opt) => {
                const selected = tipPaise === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTipPaise(opt.value)}
                    className={`flex flex-col items-center justify-center rounded-[var(--radius-lg)] border py-2 text-center transition ${
                      selected
                        ? "border-primary bg-primary font-bold text-white shadow-sm"
                        : "border-border bg-surface text-sm font-medium hover:bg-surface/80"
                    }`}
                  >
                    {opt.emoji && <span className="text-xs">{opt.emoji}</span>}
                    <span className="text-xs">{opt.label}</span>
                  </button>
                );
              })}
            </div>
            {tipPaise > 0 && (
              <p className="mt-2 text-center text-xs font-medium text-primary">
                Added {formatPaise(tipPaise, { locale })} tip for your delivery partner! ❤️
              </p>
            )}
          </section>

          {/* Spare Change 24K Gold Roundup (Jar/Cred style) */}
          <section className="mt-4 rounded-[var(--radius-xl)] border border-amber-500/20 bg-amber-500/5 p-4">
            <label className="flex cursor-pointer items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">✨</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="block text-sm font-semibold text-amber-950 dark:text-amber-200">
                      Save Spare Change in 24K Gold
                    </span>
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                      99.9% Purity
                    </span>
                  </div>
                  <span className="block text-xs text-muted mt-0.5">
                    Round up to nearest ₹10 to save {formatPaise(goldRoundupPaise, { locale })} in 24K digital gold. Instant liquidation to KingPay anytime.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                className="size-4 rounded border-amber-500 text-amber-600 focus:ring-amber-500"
                checked={roundupGold}
                onChange={(e) => setRoundupGold(e.target.checked)}
              />
            </label>
          </section>

          <section className="mt-6">
            <h2 className="text-sm font-medium text-muted">{t("checkout.pay")}</h2>

            {/* 1-Tap KingPay (Instant Zero-OTP Wallet) */}
            <div className={`mt-2 rounded-[var(--radius-lg)] border-2 transition ${method === "KING_PAY" ? "border-primary bg-primary/5 p-3.5" : "border-border bg-surface p-3"}`}>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="radio"
                  name="pay"
                  className="mt-1 size-4 text-primary focus:ring-primary"
                  checked={method === "KING_PAY"}
                  onChange={() => setMethod("KING_PAY")}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="block font-semibold text-foreground">💳 KingPay (1-Tap Instant Checkout)</span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        Zero OTP Delay
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Balance: ₹750.00
                    </span>
                  </div>
                  <span className="block text-xs text-muted mt-0.5">Direct RBI escrow deduction. Saves 2% gateway surcharge.</span>
                </div>
              </label>

              {method === "KING_PAY" && (
                <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-xs">
                  <span className="text-muted">Available Escrow Wallet: <strong className="text-foreground">₹750.00</strong></span>
                  <Link
                    to="/king-pay"
                    className="font-semibold text-primary hover:underline"
                  >
                    + Add Money / Recharges
                  </Link>
                </div>
              )}
            </div>
            
            {/* Online UPI & Cards (Zomato-standard) */}
            <div className={`mt-2 rounded-[var(--radius-lg)] border-2 transition ${method === "RAZORPAY_ONLINE" ? "border-primary bg-primary/5 p-3.5" : "border-border bg-surface p-3"}`}>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="radio"
                  name="pay"
                  className="mt-1 size-4 text-primary focus:ring-primary"
                  checked={method === "RAZORPAY_ONLINE"}
                  onChange={() => setMethod("RAZORPAY_ONLINE")}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="block font-semibold text-foreground">UPI / Cards / NetBanking (Instant)</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Fastest & Safe
                    </span>
                  </div>
                  <span className="block text-xs text-muted mt-0.5">Zero convenience fee · Protected by 256-bit encryption</span>
                </div>
              </label>

              {method === "RAZORPAY_ONLINE" && (
                <div className="mt-3.5 border-t border-border/60 pt-3">
                  <p className="text-xs font-medium text-muted">Preferred UPI Payment Apps:</p>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const upiUrl = `upi://pay?pa=orderking@icici&pn=OrderKing&am=${(totalPayable / 100).toFixed(2)}&cu=INR&tn=OrderKing Order`;
                        if (navigator.userAgent.includes("Mobile")) window.location.href = upiUrl;
                        else toast.info("Google Pay selected. Click 'Place Order' below to proceed.");
                      }}
                      className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface p-2 text-center transition hover:border-primary/60 hover:bg-primary/5"
                    >
                      <span className="text-lg">🟢</span>
                      <span className="mt-1 text-[11px] font-medium">Google Pay</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const upiUrl = `phonepe://pay?pa=orderking@icici&pn=OrderKing&am=${(totalPayable / 100).toFixed(2)}&cu=INR&tn=OrderKing Order`;
                        if (navigator.userAgent.includes("Mobile")) window.location.href = upiUrl;
                        else toast.info("PhonePe selected. Click 'Place Order' below to proceed.");
                      }}
                      className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface p-2 text-center transition hover:border-primary/60 hover:bg-primary/5"
                    >
                      <span className="text-lg">🟣</span>
                      <span className="mt-1 text-[11px] font-medium">PhonePe</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const upiUrl = `paytmmp://pay?pa=orderking@icici&pn=OrderKing&am=${(totalPayable / 100).toFixed(2)}&cu=INR&tn=OrderKing Order`;
                        if (navigator.userAgent.includes("Mobile")) window.location.href = upiUrl;
                        else toast.info("Paytm selected. Click 'Place Order' below to proceed.");
                      }}
                      className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface p-2 text-center transition hover:border-primary/60 hover:bg-primary/5"
                    >
                      <span className="text-lg">🔵</span>
                      <span className="mt-1 text-[11px] font-medium">Paytm</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toast.info("Cards / NetBanking selected. Click 'Place Order' below to proceed.")}
                      className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface p-2 text-center transition hover:border-primary/60 hover:bg-primary/5"
                    >
                      <span className="text-lg">💳</span>
                      <span className="mt-1 text-[11px] font-medium">Cards / Net</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cash on Delivery (COD) */}
            <label className={`mt-2 flex min-h-14 cursor-pointer items-start gap-3 rounded-[var(--radius-lg)] border transition ${method === "COD" ? "border-primary bg-primary/5 p-3.5" : "border-border bg-surface p-3"}`}>
              <input
                type="radio"
                name="pay"
                className="mt-1 size-4 text-primary focus:ring-primary"
                checked={method === "COD"}
                onChange={() => setMethod("COD")}
              />
              <div>
                <span className="block font-medium">{t("checkout.cod")}</span>
                <span className="block text-xs text-muted mt-0.5">{t("checkout.codHint")} (Exact change or rider UPI)</span>
              </div>
            </label>

            {/* Sandbox UPI for local dev & simulation */}
            <label className={`mt-2 flex min-h-14 cursor-pointer items-start gap-3 rounded-[var(--radius-lg)] border transition ${method === "UPI_SANDBOX" ? "border-primary bg-primary/5 p-3.5" : "border-border bg-surface p-3"}`}>
              <input
                type="radio"
                name="pay"
                className="mt-1 size-4 text-primary focus:ring-primary"
                checked={method === "UPI_SANDBOX"}
                onChange={() => setMethod("UPI_SANDBOX")}
              />
              <div>
                <span className="block font-medium">{t("checkout.upiSandbox")}</span>
                <span className="block text-xs text-muted mt-0.5">{t("checkout.upiSandboxHint")}</span>
              </div>
            </label>
          </section>

          <div className="mt-6 rounded-[var(--radius-xl)] bg-surface p-4">
            {quote.data ? (
              <>
                <QuoteLines lines={quote.data.quote.lines} locale={locale} />
                {tipPaise > 0 && (
                  <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm">
                    <span className="text-muted">Delivery partner tip</span>
                    <span className="font-medium text-primary">+{formatPaise(tipPaise, { locale })}</span>
                  </div>
                )}
                {roundupGold && goldRoundupPaise > 0 && (
                  <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm">
                    <span className="font-medium text-amber-600 dark:text-amber-400">✨ 24K Digital Gold Savings</span>
                    <span className="font-medium text-amber-600 dark:text-amber-400">+{formatPaise(goldRoundupPaise, { locale })}</span>
                  </div>
                )}
              </>
            ) : <p>{t("common.loading")}</p>}
          </div>

          {quote.data?.quote.blockers.length ? <p className="mt-3 text-sm text-warn">{quote.data.quote.blockers.includes("MIN_ORDER") ? t("cart.minOrder", { amount: formatPaise(quote.data.quote.minOrderPaise, { locale }) }) : t("checkout.blocked")}</p> : null}
          <Button className="mt-6 w-full" disabled={busy || !quote.data || !quote.data.isDeliverable} onClick={() => void submit()}>{busy ? t("checkout.placing") : t("checkout.place", { amount: formatPaise(totalPayable, { locale }) })}</Button>
        </>}
        <p className="mt-6 text-sm"><Link to="/cart" className="text-muted">← {t("cart.title")}</Link></p>
      </div>
    </CustomerShell>
  );
}
