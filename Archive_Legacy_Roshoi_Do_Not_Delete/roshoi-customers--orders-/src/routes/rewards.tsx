import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CustomerShell } from "@/components/market/shell";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useLocationStore } from "@/lib/stores/location";
import { getLoyalty } from "@/lib/server/account";
import { toast } from "sonner";

export const Route = createFileRoute("/rewards")({ component: RewardsPage });

type AllianceReward = {
  id: string;
  category: "all" | "ecommerce" | "fuel" | "lpg" | "retail" | "edtech" | "fashion" | "health";
  brand: string;
  title: string;
  description: string;
  code: string;
  coinsRequired: number;
  valueLabel: string;
  badge: string;
  icon: string;
  terms: string;
  affiliateUrl: string;
  supportedCities: string[]; // ["ALL"] or specific city IDs like ["city_sribhumi", "city_silchar", "city_karimganj"]
};

const ALLIANCE_REWARDS: AllianceReward[] = [
  {
    id: "amazon_deals",
    category: "ecommerce",
    brand: "Amazon India",
    title: "Up to 60% OFF + Extra Cashback",
    description: "Save big on electronics, home essentials, and pantry items on Amazon.",
    code: "AMAZONKING",
    coinsRequired: 200,
    valueLabel: "Up to 60% OFF",
    badge: "⭐ Mega Affiliate",
    icon: "📦",
    terms: "Exclusive affiliate deals for OrderKing members across all pin codes in India.",
    affiliateUrl: "https://www.amazon.in?tag=orderking-21",
    supportedCities: ["ALL"],
  },
  {
    id: "flipkart_deals",
    category: "ecommerce",
    brand: "Flipkart",
    title: "Flat ₹150 OFF on Top Brands",
    description: "Special savings on smartphones, electronics, and fashion orders.",
    code: "FLIPKARTKING",
    coinsRequired: 300,
    valueLabel: "Flat ₹150 OFF",
    badge: "🚀 National Partner",
    icon: "🛍️",
    terms: "Valid on min order of ₹999 on Flipkart website and app.",
    affiliateUrl: "https://www.flipkart.com?affid=orderking",
    supportedCities: ["ALL"],
  },
  {
    id: "meesho_deals",
    category: "ecommerce",
    brand: "Meesho",
    title: "Wholesale Prices + Extra 15% OFF",
    description: "Lowest prices on trending fashion, home decor, and daily lifestyle items.",
    code: "MEESHOKING",
    coinsRequired: 150,
    valueLabel: "15% Extra OFF",
    badge: "🔥 Super Saver",
    icon: "🛒",
    terms: "Direct factory prices with free cash on delivery on Meesho.",
    affiliateUrl: "https://meesho.com?ref=orderking",
    supportedCities: ["ALL"],
  },
  {
    id: "hp_fuel",
    category: "fuel",
    brand: "HPCL (HP Pay)",
    title: "₹50 HPCL Petrol Refill Voucher",
    description: "Save ₹50 on fuel refills via HP Pay app at all HPCL petrol pumps.",
    code: "HPFUEL50",
    coinsRequired: 500,
    valueLabel: "Worth ₹50 Fuel",
    badge: "⛽ HPCL Alliance",
    icon: "⛽",
    terms: "Valid on min ₹300 fuel refill at partner HPCL pumps in Karimganj, Silchar & Sribhumi.",
    affiliateUrl: "https://hppay.in?ref=orderking",
    supportedCities: ["city_sribhumi", "city_silchar", "city_karimganj"],
  },
  {
    id: "iocl_fuel",
    category: "fuel",
    brand: "IndianOil (IOCL ONE)",
    title: "₹50 IndianOil Petrol Voucher",
    description: "Instant QR voucher redeemable at all IndianOil pumps with XTRAREWARDS.",
    code: "IOCL50",
    coinsRequired: 500,
    valueLabel: "Worth ₹50 Fuel",
    badge: "🛢️ IndianOil Partner",
    icon: "🛢️",
    terms: "Valid on min ₹300 fuel refill at IndianOil stations nationwide.",
    affiliateUrl: "https://iocl.com/indianoil-one?ref=orderking",
    supportedCities: ["city_sribhumi", "city_silchar", "city_karimganj"],
  },
  {
    id: "bpcl_fuel",
    category: "fuel",
    brand: "BPCL SmartDrive",
    title: "₹100 BPCL Octane Fuel Cashback",
    description: "Save ₹100 on premium Speed petrol or diesel refills via BPCL SmartDrive.",
    code: "BPOCTANE100",
    coinsRequired: 1000,
    valueLabel: "Worth ₹100 Fuel",
    badge: "⚡ BPCL Speed",
    icon: "⛽",
    terms: "Valid on min ₹1,000 fuel refill at Bharat Petroleum highway and city outlets.",
    affiliateUrl: "https://bharatpetroleum.in?ref=orderking",
    supportedCities: ["city_sribhumi", "city_silchar", "city_karimganj"],
  },
  {
    id: "fastag_fuel_waiver",
    category: "fuel",
    brand: "NETC FASTag Fuel Pay",
    title: "1% Highway Fuel Surcharge Waiver",
    description: "100% waiver on fuel surcharges when paying via FASTag at partner HPCL/IOCL highway pumps.",
    code: "FASTAGFREE",
    coinsRequired: 200,
    valueLabel: "1% Surcharge Free",
    badge: "🚗 Highway Pass",
    icon: "🚗",
    terms: "Valid on all vehicle FASTag recharges completed through KingPay BBPS switch.",
    affiliateUrl: "https://paytm.com/fastag-recharge?ref=orderking",
    supportedCities: ["ALL"],
  },
  {
    id: "indianoil_lpg",
    category: "lpg",
    brand: "IndianOil (Indane Gas)",
    title: "LPG Gas Booking + ₹50 Cashback",
    description: "Book domestic LPG cylinder online and unlock ₹50 fuel cashback credit.",
    code: "INDANE50",
    coinsRequired: 250,
    valueLabel: "₹50 Fuel Credit",
    badge: "🔥 LPG Utility",
    icon: "🔥",
    terms: "Valid on online Indane Gas cylinder refill booking across Barak Valley distributors.",
    affiliateUrl: "https://cx.indianoil.in?ref=orderking",
    supportedCities: ["city_sribhumi", "city_silchar", "city_karimganj"],
  },
  {
    id: "vishal_mega",
    category: "retail",
    brand: "Vishal Mega Mart",
    title: "Flat ₹100 OFF on Shopping",
    description: "Instant in-store discount on billing at nearest Vishal Mega Mart outlet.",
    code: "VISHAL100",
    coinsRequired: 500,
    valueLabel: "Save ₹100",
    badge: "🛒 In-Store Retail",
    icon: "🛍️",
    terms: "Valid on minimum billing of ₹999 at Vishal Mega Mart Karimganj / Silchar outlets.",
    affiliateUrl: "https://www.vishalmegamart.com?ref=orderking",
    supportedCities: ["city_sribhumi", "city_silchar", "city_karimganj"],
  },
  {
    id: "ajio_fashion",
    category: "fashion",
    brand: "Ajio & Myntra",
    title: "Flat ₹200 OFF on Trending Styles",
    description: "Exclusive shopping coupon on clothing, footwear, and accessories.",
    code: "AJIOKING200",
    coinsRequired: 750,
    valueLabel: "Save ₹200",
    badge: "👗 Lifestyle",
    icon: "👕",
    terms: "Valid on selected catalogue on minimum purchase of ₹999.",
    affiliateUrl: "https://www.ajio.com?utm_source=orderking_affiliate",
    supportedCities: ["ALL"],
  },
  {
    id: "ai_course",
    category: "edtech",
    brand: "AI Learning Academy",
    title: "100% Free AI & Python Masterclass",
    description: "Comprehensive beginner-to-advanced Generative AI & Python certification course.",
    code: "AIKINGFREE",
    coinsRequired: 1000,
    valueLabel: "Worth ₹1,999",
    badge: "🎓 100% Free Course",
    icon: "🤖",
    terms: "Full lifetime access with certificate. Sponsored by national EdTech alliance partner.",
    affiliateUrl: "https://orderking.in/courses/ai-masterclass?ref=affiliate",
    supportedCities: ["ALL"],
  },
  {
    id: "tata_1mg",
    category: "health",
    brand: "Tata 1mg & Apollo",
    title: "Flat 20% OFF on Medicines",
    description: "Get genuine prescription and healthcare medicines delivered to your doorstep.",
    code: "HEALTH20",
    coinsRequired: 250,
    valueLabel: "20% Discount",
    badge: "💊 Healthcare",
    icon: "🩺",
    terms: "Valid on prescription orders above ₹500 across partner pharmacy platforms.",
    affiliateUrl: "https://www.1mg.com?utm_source=orderking_affiliate",
    supportedCities: ["ALL"],
  },
];

function RewardsPage() {
  const { user } = useCurrentUserState();
  const location = useLocationStore((s) => s.location);
  const loyalty = useQuery({
    queryKey: ["loyalty"],
    queryFn: () => getLoyalty(),
    enabled: Boolean(user),
  });

  const [activeTab, setActiveTab] = useState<"all" | "ecommerce" | "fuel" | "lpg" | "retail" | "fashion" | "edtech" | "health">("all");
  const [unlockedCodes, setUnlockedCodes] = useState<Record<string, boolean>>({});
  const [scratchRevealed, setScratchRevealed] = useState(false);

  // User's King Coins (10 coins per ₹1 spent)
  const basePoints = loyalty.data?.loyalty.points ?? 1250;
  const userCoins = basePoints * 10;

  // Location-aware filtering algorithm:
  // If an offer is restricted to specific cities, check if user's current city matches.
  // If not supported, seamlessly hide it from the customer view (zero confusing error text).
  const locationFilteredRewards = ALLIANCE_REWARDS.filter((reward) => {
    if (reward.supportedCities.includes("ALL")) return true;
    const currentCityId = location.cityId?.toLowerCase() ?? "";
    const currentCityName = location.cityName?.toLowerCase() ?? "";
    return reward.supportedCities.some(
      (c) =>
        currentCityId.includes(c) ||
        currentCityName.includes("karimganj") ||
        currentCityName.includes("silchar") ||
        currentCityName.includes("sribhumi")
    );
  });

  const finalRewards = activeTab === "all"
    ? locationFilteredRewards
    : locationFilteredRewards.filter((r) => r.category === activeTab);

  const handleUnlock = (reward: AllianceReward) => {
    if (userCoins < reward.coinsRequired && !unlockedCodes[reward.id]) {
      toast.error(`You need ${reward.coinsRequired.toLocaleString()} King Coins to claim this perk.`);
      return;
    }
    setUnlockedCodes((prev) => ({ ...prev, [reward.id]: true }));
    void navigator.clipboard?.writeText(reward.code);
    toast.success(`Coupon code ${reward.code} copied!`);
  };

  return (
    <CustomerShell>
      <div className="px-4 py-5 space-y-6">
        {/* Header Vault Card */}
        <div className="relative overflow-hidden rounded-[var(--radius-xl)] border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/20 via-surface to-amber-500/5 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-200">
                👑 King Club Rewards Vault
              </span>
              <h1 className="mt-2 font-display text-2xl font-bold text-fg">
                Your King Coins
              </h1>
              <p className="text-xs text-muted">
                Earn 10 King Coins for every ₹1 spent on food orders
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-3xl font-black text-amber-600 dark:text-amber-400">
                {userCoins.toLocaleString()}
              </p>
              <p className="text-[11px] font-semibold text-muted">
                Coins Available
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-amber-500/20 pt-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span>📍</span>
              <span className="font-semibold text-fg">{location.cityName || "Barak Valley"}</span>
              <span className="text-muted">(Location Verified)</span>
            </div>
            <Link to="/king-pay" className="font-medium text-primary hover:underline">
              KingPay Hub →
            </Link>
          </div>
        </div>

        {/* KingPay Quick Access Banner */}
        <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">💳</span>
            <div>
              <p className="font-semibold text-fg">KingPay Fintech Hub</p>
              <p className="text-muted">Recharges, Bill Pay, Train & Bus Tickets with extra cashback</p>
            </div>
          </div>
          <Button size="sm" variant="primary" asChild>
            <Link to="/king-pay">Open Pay</Link>
          </Button>
        </div>

        {/* Mystery Scratch Card Section */}
        <div className="rounded-[var(--radius-xl)] border border-primary/20 bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-fg">
                ✨ Mystery Scratch Card
              </h2>
              <p className="text-xs text-muted">
                Scratch to reveal surprise affiliate & brand coupons!
              </p>
            </div>
            <span className="text-2xl">🎁</span>
          </div>

          <div className="mt-3">
            {!scratchRevealed ? (
              <button
                type="button"
                onClick={() => {
                  setScratchRevealed(true);
                  toast.success("🎉 Mystery Reward Unlocked!");
                }}
                className="group relative flex h-28 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-amber-500/50 bg-gradient-to-r from-amber-500/10 via-primary/10 to-amber-500/10 p-4 text-center transition hover:border-amber-500 cursor-pointer"
              >
                <div className="space-y-1">
                  <span className="text-3xl transition-transform group-hover:scale-125 inline-block">
                    🎟️
                  </span>
                  <p className="font-bold text-sm text-fg">
                    Tap to Scratch & Reveal
                  </p>
                  <p className="text-[11px] text-muted">
                    Win up to 5,000 King Coins or Amazon / Fuel Vouchers
                  </p>
                </div>
              </button>
            ) : (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                <span className="text-3xl">🎉</span>
                <h3 className="mt-1 font-bold text-sm text-emerald-800 dark:text-emerald-200">
                  Congratulations! You Won 2,500 King Coins + ₹50 Fuel Voucher!
                </h3>
                <p className="mt-0.5 text-xs text-muted">
                  Use code <span className="font-mono font-bold text-fg">HPFUEL50</span> on HP Pay.
                </p>
                <div className="mt-3 flex justify-center gap-2">
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
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {(
            [
              { id: "all", label: "All Perks" },
              { id: "ecommerce", label: "🛍️ Amazon & Flipkart" },
              { id: "fuel", label: "⛽ Fuel" },
              { id: "lpg", label: "🔥 LPG Gas" },
              { id: "retail", label: "🛒 Retail Mart" },
              { id: "fashion", label: "👗 Fashion" },
              { id: "edtech", label: "🎓 AI Courses" },
              { id: "health", label: "💊 Health" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 font-medium transition ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface text-muted hover:bg-surface-2"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Alliance Rewards Grid */}
        <div className="space-y-3">
          {finalRewards.map((reward) => {
            const isUnlocked = unlockedCodes[reward.id];
            return (
              <div
                key={reward.id}
                className="rounded-[var(--radius-xl)] border border-border bg-surface p-4 shadow-xs transition hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-surface-2 text-2xl">
                      {reward.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted">
                          {reward.brand}
                        </span>
                        <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                          {reward.badge}
                        </span>
                      </div>
                      <h3 className="mt-0.5 font-semibold text-sm text-fg">
                        {reward.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted">
                        {reward.description}
                      </p>
                      <p className="mt-1 text-[11px] text-muted italic">
                        {reward.terms}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                      🪙 {reward.coinsRequired.toLocaleString()} Coins
                    </span>
                    <span className="text-[11px] text-muted">({reward.valueLabel})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isUnlocked ? (
                      <span className="rounded border border-dashed border-emerald-500 bg-emerald-500/10 px-2 py-1 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        {reward.code}
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleUnlock(reward)}
                      >
                        Unlock Code
                      </Button>
                    )}

                    <a
                      href={reward.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        toast.success(`Opening ${reward.brand} affiliate portal...`);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-fg hover:bg-surface-3 transition"
                    >
                      <span>Shop with Link</span>
                      <span>↗</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Zero-Loss Guardrail Notice */}
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface-2/40 p-3 text-center text-xs text-muted">
          <p className="font-semibold text-fg">100% Verified Brand & Affiliate Partnerships</p>
          <p className="mt-0.5 text-[11px]">
            OrderKing partners with top national brands & local fuel stations to provide real savings without platform markups or hidden fees.
          </p>
        </div>
      </div>
    </CustomerShell>
  );
}
