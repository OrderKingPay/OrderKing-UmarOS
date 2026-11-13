import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CreditCard, MapPin, Tag } from "lucide-react";
import { CustomerShell } from "@/components/market/shell";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useLocationStore } from "@/lib/stores/location";
import { useCartStore } from "@/lib/stores/cart";
import { getLoyalty, listPromos } from "@/lib/server/account";
import { formatPaise } from "@/lib/money";
import { toast } from "sonner";
import { WhatsAppViralBountiesWidget } from "@/components/market/whatsapp-viral-bounties-widget";

export const Route = createFileRoute("/rewards")({ component: RewardsPage });

function RewardsPage() {
  const { user } = useCurrentUserState();
  const location = useLocationStore((s) => s.location);
  const setCoupon = useCartStore((s) => s.setCoupon);

  const loyalty = useQuery({
    queryKey: ["loyalty"],
    queryFn: () => getLoyalty(),
    enabled: Boolean(user),
  });

  const promos = useQuery({
    queryKey: ["promos"],
    queryFn: () => listPromos(),
  });

  const basePoints = user ? (loyalty.data?.loyalty.points ?? 0) : 0;
  const userCoins = basePoints * 10;
  const activePromos = promos.data?.promos ?? [];

  return (
    <CustomerShell>
      <div className="px-4 py-5 space-y-6 pb-28">
        {/* Header Vault Card */}
        <div className="relative overflow-hidden rounded-[var(--radius-xl)] border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/20 via-surface to-orange-500/5 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs font-bold text-orange-900 dark:text-orange-200">
                King Club Rewards
              </span>
              <h1 className="mt-2 font-display text-2xl font-bold text-fg">
                Your King Coins
              </h1>
              <p className="text-xs text-muted">
                Earned from completed food orders
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-3xl font-black text-orange-600 dark:text-orange-400">
                {userCoins.toLocaleString()}
              </p>
              <p className="text-[11px] font-semibold text-muted">
                Coins Available
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-orange-500/20 pt-3 text-xs">
            <div className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-orange-600" />
              <span className="font-semibold text-fg">{location.cityName || "Barak Valley"}</span>
              <span className="text-muted">({location.zoneName || "Current Zone"})</span>
            </div>
            <Link to="/king-pay" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              <span>KingPay Hub</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* KingPay Quick Access Banner */}
        <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <CreditCard className="size-4" />
            </div>
            <div>
              <p className="font-semibold text-fg">KingPay Wallet &amp; Bill Payments</p>
              <p className="text-muted">UPI payments, recharges, and utility bill payments</p>
            </div>
          </div>
          <Button size="sm" variant="primary" asChild>
            <Link to="/king-pay">Open Pay</Link>
          </Button>
        </div>

        {/* Referral Program */}
        <WhatsAppViralBountiesWidget source="rewards_vault" />

        {/* Live Database Promotions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-fg flex items-center gap-2">
              <Tag className="size-4 text-primary" />
              <span>Active Platform &amp; Restaurant Offers</span>
            </h2>
            <Link to="/offers" className="text-xs font-medium text-primary hover:underline">
              View All
            </Link>
          </div>

          {promos.isPending ? (
            <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-4 text-xs text-muted">
              Loading active promotions...
            </div>
          ) : activePromos.length === 0 ? (
            <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-5 text-center space-y-2">
              <p className="font-semibold text-sm text-fg">No active promo codes right now</p>
              <p className="text-xs text-muted">
                Active restaurant and platform promo codes will appear here once published.
              </p>
              <Button size="sm" variant="outline" asChild>
                <Link to="/offers">Check Offers</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {activePromos.map((promo) => (
                <div
                  key={promo.id}
                  className="rounded-[var(--radius-xl)] border border-border bg-surface p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {promo.fundedBy === "RESTAURANT"
                          ? "Restaurant Offer"
                          : promo.fundedBy === "PLATFORM"
                            ? "Platform Offer"
                            : "Partner Offer"}
                      </span>
                      <span className="text-[11px] text-muted">
                        Min order: {formatPaise(promo.minOrderPaise)}
                      </span>
                    </div>
                    <h3 className="mt-1 font-semibold text-sm text-fg">{promo.name}</h3>
                  </div>

                  {promo.code && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded border border-dashed border-orange-400 bg-orange-500/10 px-2.5 py-1 font-mono text-xs font-bold text-fg">
                        {promo.code}
                      </span>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setCoupon(promo.code!);
                          toast.success(`Coupon ${promo.code} applied to cart.`);
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CustomerShell>
  );
}
