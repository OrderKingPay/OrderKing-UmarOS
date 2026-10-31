import { useState } from "react";
import { useCartStore } from "@/lib/stores/cart";
import { formatPaise } from "@/lib/money";
import {
  ShieldCheck,
  Zap,
  QrCode,
  ExternalLink,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildNPCIUpiIntentUrl,
  generateAllUPIAppLinks,
} from "@/lib/payments/npci-upi-intent";
import { DirectUpiIntentModal } from "./direct-upi-intent-modal";
import { FOUNDER_UPI_VPA, FOUNDER_MERCHANT_NAME } from "@/lib/dispatch/whatsapp-gps-bridge";

interface FoodUpiCheckoutCardProps {
  className?: string;
  theme?: "dark" | "light";
  orderTotalPaise?: number;
  orderPublicId?: string;
}

/**
 * Zero-Fee Direct NPCI UPI Intent Card & Instant Dynamic BharatQR Bridge.
 * Allows customers to bypass 2-3% aggregator/gateway transaction fees,
 * routing 100% of money directly to the founder bank account via NPCI UPI.
 */
export function FoodUpiCheckoutCard({
  className = "",
  theme = "dark",
  orderTotalPaise,
  orderPublicId,
}: FoodUpiCheckoutCardProps) {
  const items = useCartStore((state) => state.items);
  const restaurantName = useCartStore((state) => state.restaurantName);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const hasItems = items.length > 0;
  const isDark = theme === "dark";

  // Calculate total or fallback
  const calculatedPaise = orderTotalPaise ?? 25000;
  const amountRupees = calculatedPaise > 0 ? calculatedPaise / 100 : 250;
  const publicId = orderPublicId || `OK-FOOD-${Date.now().toString().slice(-4)}`;

  const upiParams = {
    vpa: FOUNDER_UPI_VPA,
    payeeName: FOUNDER_MERCHANT_NAME,
    amountInRupees: amountRupees,
    currency: "INR" as const,
    transactionRef: `OKUPI-${publicId}`,
    transactionNote: `Food Order ${publicId} ${restaurantName || ""}`.trim().slice(0, 50),
    merchantCategoryCode: "5812",
    mode: "02",
  };

  const universalIntentUrl = buildNPCIUpiIntentUrl(upiParams);
  const appLinks = generateAllUPIAppLinks(upiParams);

  return (
    <section
      className={`rounded-3xl border-2 p-5 sm:p-6 transition-all relative overflow-hidden ${
        isDark
          ? "border-amber-400/50 bg-gradient-to-br from-stone-950 via-zinc-950 to-stone-900 text-white shadow-[0_8px_30px_rgba(245,158,11,0.15)]"
          : "border-amber-400/60 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/30 text-stone-950 shadow-md"
      } ${className}`}
      aria-label="Direct NPCI UPI Checkout"
    >
      {/* Decorative ambient shine */}
      <div className="absolute -top-12 -right-12 size-36 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-zinc-950 font-black shadow-xs text-sm">
              👑
            </span>
            <div>
              <h3 className="font-display font-black text-base sm:text-lg tracking-tight">
                Direct NPCI UPI Instant Pay
              </h3>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                <ShieldCheck className="size-3 text-emerald-500" />
                <span>Zero gateway deduction • Direct founder settlement</span>
              </p>
            </div>
          </div>

          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            0% Gateway Fee
          </span>
        </div>

        {hasItems ? (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Order Total</span>
              <div className="font-mono text-xl sm:text-2xl font-black text-amber-500 dark:text-amber-300">
                ₹{amountRupees.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Settlement VPA</span>
              <div className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {FOUNDER_UPI_VPA}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Review your cart items, delivery fees, and final total before launching direct UPI intent.
          </p>
        )}

        {/* 1-Tap Mobile Intent Buttons */}
        <div className="space-y-2 pt-1">
          <a
            href={universalIntentUrl}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-zinc-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/25 transition active:scale-95 no-underline"
          >
            <Zap className="size-4 fill-zinc-950" />
            <span>Open in UPI App (PhonePe / Paytm / Cred / BHIM / Amazon Pay)</span>
          </a>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsQrModalOpen(true)}
              className="h-10 rounded-xl border-amber-400/40 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <QrCode className="size-3.5 text-amber-500" />
              <span>Show Live QR Modal</span>
            </Button>

            <a
              href={hasItems ? "/checkout" : "/"}
              className="h-10 rounded-xl bg-surface border border-border hover:bg-surface-2 text-xs font-bold text-foreground flex items-center justify-center gap-1.5 no-underline transition"
            >
              <span>{hasItems ? "Royal Checkout →" : "Find Restaurants"}</span>
            </a>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-center pt-0.5">
          NPCI UPI Intent standard • Instant direct bank settlement • 0% gateway fee
        </p>
      </div>

      {/* Live QR Modal */}
      <DirectUpiIntentModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        orderTotalPaise={calculatedPaise > 0 ? calculatedPaise : 25000}
        orderPublicId={publicId}
      />
    </section>
  );
}