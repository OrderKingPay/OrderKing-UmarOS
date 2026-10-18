import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { MoneyText } from "@/components/money-text";
import { useT } from "@/components/use-t";
import { useVendor } from "@/components/use-vendor";
import {
  getPromotions,
  savePromotion,
  getAdCampaign,
  saveAdCampaign,
  getAnalytics,
} from "@/lib/server/api-finance";
import { getMenu } from "@/lib/server/api-menu";
import { computeRestaurantPayable, formatINR, mulBps, rupeesToPaise } from "@/lib/money";
import { can } from "@/lib/rbac";
import { platformConfig } from "@/lib/platform-config";
import type { PromotionKind } from "@/lib/contracts";
import { InStoreMarketingKit } from "@/components/in-store-marketing-kit";
import {
  Calculator,
  Camera,
  CheckCircle2,
  Clock,
  Layers,
  Megaphone,
  Sparkles,
  Tag,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";

export const Route = createFileRoute("/promotions")({ component: PromotionsPage });

function PromotionsPage() {
  const t = useT();
  const vendor = useVendor();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["promos", vendor.restaurantId],
    queryFn: () => getPromotions({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId),
  });

  const adQuery = useQuery({
    queryKey: ["adCampaign", vendor.restaurantId],
    queryFn: () => getAdCampaign({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId),
  });

  const menuQuery = useQuery({
    queryKey: ["menu", vendor.restaurantId],
    queryFn: () => getMenu({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId),
  });

  const analyticsQuery = useQuery({
    queryKey: ["analytics", vendor.restaurantId, "week"],
    queryFn: () => getAnalytics({ data: { restaurantId: vendor.restaurantId, range: "week" } }),
    enabled: Boolean(vendor.restaurantId),
  });

  const canEdit = vendor.role ? can(vendor.role, "promotions.edit") : false;

  // New Promotion Form State
  const [name, setName] = useState("");
  const [kind, setKind] = useState<PromotionKind>("percent");
  const [percent, setPercent] = useState("15");
  const [amountRupees, setAmountRupees] = useState("50");
  const [minOrderRupees, setMinOrderRupees] = useState("199");
  const [maxDiscountRupees, setMaxDiscountRupees] = useState("75");
  const [playbookAppliedNotice, setPlaybookAppliedNotice] = useState<string | null>(null);

  // Ad Campaign Budget Selection
  const [adBudgetRupees, setAdBudgetRupees] = useState("250");

  // Interactive Self-Service Discount Margin Calculator State
  const [simOrderRupees, setSimOrderRupees] = useState("300");
  const [simPackingRupees, setSimPackingRupees] = useState("20");
  const [activeMarketingSection, setActiveMarketingSection] = useState<"digital_promos" | "in_store_qr">("digital_promos");

  const rest = q.data?.promotions.filter((p) => p.funder === "RESTAURANT" && p.name !== "SPONSORED_BOOST") ?? [];
  const plat = q.data?.promotions.filter((p) => p.funder === "PLATFORM") ?? [];
  const activeRestCount = rest.filter((p) => p.isActive).length;

  // Calculate exact integer-paise margin breakdown for the simulator
  const simFoodPaise = rupeesToPaise(Math.max(0, Number(simOrderRupees) || 0));
  const simPackingPaise = rupeesToPaise(Math.max(0, Number(simPackingRupees) || 0));
  const minOrderPaise = rupeesToPaise(Math.max(0, Number(minOrderRupees) || 0));
  const maxCapPaise =
    maxDiscountRupees.trim() !== ""
      ? rupeesToPaise(Math.max(0, Number(maxDiscountRupees) || 0))
      : null;

  // Side-by-side comparison: Percentage Discount vs Flat ₹ Discount on the same basket
  const pctRate = Math.max(0, Math.min(90, Math.round(Number(percent) || 0)));
  const rawPctDiscPaise = simFoodPaise >= minOrderPaise ? mulBps(simFoodPaise, pctRate * 100) : 0;
  const comparePctDiscPaise =
    maxCapPaise != null && maxCapPaise > 0 ? Math.min(rawPctDiscPaise, maxCapPaise) : rawPctDiscPaise;

  const flatOfferPaise = rupeesToPaise(Math.max(0, Number(amountRupees) || 0));
  const compareFlatDiscPaise =
    simFoodPaise >= minOrderPaise ? Math.min(simFoodPaise, flatOfferPaise) : 0;

  let simDiscountPaise = 0;
  if (simFoodPaise >= minOrderPaise) {
    if (kind === "percent") {
      simDiscountPaise = comparePctDiscPaise;
    } else if (kind === "fixed") {
      simDiscountPaise = compareFlatDiscPaise;
    } else if (kind === "bogo") {
      simDiscountPaise = Math.round(simFoodPaise * 0.5);
    }
  }

  const commissionBps = vendor.selected?.commissionBps ?? platformConfig.commission.targetBps;
  const simSettlement = computeRestaurantPayable({
    foodValuePaise: simFoodPaise,
    packingPaise: simPackingPaise,
    restaurantDiscountPaise: simDiscountPaise,
    platformFundedDiscountPaise: 0,
    commissionBps,
  });

  const comparePctSettlement = computeRestaurantPayable({
    foodValuePaise: simFoodPaise,
    packingPaise: simPackingPaise,
    restaurantDiscountPaise: comparePctDiscPaise,
    platformFundedDiscountPaise: 0,
    commissionBps,
  });

  const compareFlatSettlement = computeRestaurantPayable({
    foodValuePaise: simFoodPaise,
    packingPaise: simPackingPaise,
    restaurantDiscountPaise: compareFlatDiscPaise,
    platformFundedDiscountPaise: 0,
    commissionBps,
  });

  const taxableCustomerBasePaise = Math.max(0, simFoodPaise + simPackingPaise - simDiscountPaise);
  const statutoryGst95Paise = mulBps(taxableCustomerBasePaise, 500); // 5% GST u/s 9(5)
  const statutoryTds194OPaise = mulBps(taxableCustomerBasePaise, 10); // 0.1% TDS u/s 194-O
  const customerPaysFoodAndTaxPaise = taxableCustomerBasePaise + statutoryGst95Paise;

  const activeDailyBudgetPaise =
    adQuery.data?.dailyBudgetPaise ?? rupeesToPaise(Math.max(0, Number(adBudgetRupees) || 250));

  // Live catalog conversion audit metrics from getMenu
  const activeMenuItems = (menuQuery.data?.items ?? []).filter((item) => item.isActive);
  const totalMenuCount = activeMenuItems.length;
  const itemsWithPhotoCount = activeMenuItems.filter(
    (item) => Boolean(item.image_url && item.image_url.trim().length > 0),
  ).length;
  const itemsWithPortionCount = activeMenuItems.filter((item) => {
    const hasTags = Boolean(item.tags && item.tags.trim().length > 0);
    const hasDesc = Boolean(item.description && item.description.trim().length >= 15);
    const hasMultiVariants = (item.variants?.length ?? 0) > 1;
    return hasTags || hasDesc || hasMultiVariants;
  }).length;
  const itemsWithAddonsCount = activeMenuItems.filter(
    (item) => (item.addonIds?.length ?? 0) > 0,
  ).length;
  const activeAddonsCount = (menuQuery.data?.addons ?? []).filter((a) => a.isActive).length;

  // Live 7-day daypart order counts from getAnalytics
  const hourBuckets = analyticsQuery.data?.hours ?? [];
  const countOrdersInHours = (startHour: number, endHourInclusive: number) =>
    hourBuckets
      .filter((h) => h.hour >= startHour && h.hour <= endHourInclusive)
      .reduce((acc, h) => acc + h.orders, 0);

  const lunchOrders7d = countOrdersInHours(12, 15);
  const snackOrders7d = countOrdersInHours(16, 18);
  const dinnerOrders7d = countOrdersInHours(19, 22);
  const weekAovPaise = analyticsQuery.data?.summary.aovPaise || 35000;
  const promoOrders7d = analyticsQuery.data?.promotions.orders ?? 0;
  const promoRestSpend7dPaise = analyticsQuery.data?.promotions.restaurantFundedPaise ?? 0;

  function applyMealPeriodPreset(preset: {
    label: string;
    offerName: string;
    kind: PromotionKind;
    percent?: string;
    amountRupees?: string;
    minOrderRupees: string;
    maxDiscountRupees?: string;
    benchmarkBasketRupees: string;
  }) {
    setName(preset.offerName);
    setKind(preset.kind);
    if (preset.percent) setPercent(preset.percent);
    if (preset.amountRupees) setAmountRupees(preset.amountRupees);
    setMinOrderRupees(preset.minOrderRupees);
    if (preset.maxDiscountRupees !== undefined) setMaxDiscountRupees(preset.maxDiscountRupees);
    setSimOrderRupees(preset.benchmarkBasketRupees);
    setPlaybookAppliedNotice(
      `Loaded "${preset.offerName}" into the calculator and offer builder below. Review your net take-home margin before activating.`,
    );
  }

  return (
    <VendorShell
      title={t("nav.promotions")}
      dataLabel={q.data?.dataLabel ?? vendor.dataLabel}
      restaurantName={vendor.selected?.restaurantName}
    >
      <div className="space-y-5">
        {/* Marketing Engine Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveMarketingSection("digital_promos")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeMarketingSection === "digital_promos"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              🏷️ Digital Promotions &amp; AI Playbook
            </button>
            <button
              type="button"
              onClick={() => setActiveMarketingSection("in_store_qr")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2 ${
                activeMarketingSection === "in_store_qr"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <span>🍽️ Table QR Dine-In Ordering &amp; Viral Marketing Kit</span>
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-mono text-emerald-300">
                0% Comm. Dine-In
              </span>
            </button>
          </div>
        </div>

        {activeMarketingSection === "in_store_qr" ? (
          <InStoreMarketingKit
            restaurantId={vendor.restaurantId}
            restaurantName={vendor.selected?.restaurantName}
          />
        ) : (
          <>
            {/* Spark AI Restaurant Growth & Strategic Playbook Panel */}
            <Card className="space-y-5 border-amber-500/30 bg-slate-900/90 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-2.5 text-amber-400 shrink-0">
                <Sparkles className="size-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-base font-bold text-white">
                    Spark AI Restaurant Growth &amp; Strategic Playbook
                  </h2>
                  <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono uppercase text-amber-300">
                    Unit-Economics Grounded
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  Practical daypart merchandising, retention discount math, and menu conversion actions grounded in{" "}
                  <span className="font-semibold text-white">
                    {vendor.selected?.restaurantName ?? "your kitchen"}
                  </span>
                  &apos;s live catalog ({totalMenuCount} active dishes) and{" "}
                  {activeRestCount} active merchant offer(s).
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <div className="rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-slate-300">
                7-Day AOV: <span className="font-bold text-emerald-400">{formatINR(weekAovPaise)}</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-slate-300">
                Promo Orders (7d): <span className="font-bold text-white">{promoOrders7d}</span>
              </div>
            </div>
          </div>

          {playbookAppliedNotice ? (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                {playbookAppliedNotice}
              </span>
              <button
                type="button"
                onClick={() => setPlaybookAppliedNotice(null)}
                className="text-[11px] font-mono underline text-emerald-200 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          ) : null}

          {/* Section 1: Meal-Period Gap Strategy */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-amber-400" />
                <h3 className="font-display text-sm font-bold text-white">
                  1. Meal-Period Gap Strategy (Daypart Demand Playbook)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Target off-peak kitchen capacity or boost family basket size during peak dinner hours
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {/* Lunch Combo Bundles */}
              <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400">
                      12:00 – 15:00 IST
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 tabular">
                      7d Volume: {lunchOrders7d} orders
                    </span>
                  </div>
                  <div className="font-semibold text-sm text-white">Lunch Combo Bundles</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Working professionals and solo diners look for single-serve thalis, bowls, or main + beverage bundles with predictable pricing under ₹249.
                  </p>
                  <div className="rounded-lg border border-slate-800/90 bg-slate-900/70 p-2 text-[11px] text-slate-300">
                    <span className="font-semibold text-emerald-400">Recommended Setup:</span> Flat ₹40 Off on orders above ₹199 (caps discount at ≤20% of food value).
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full text-xs"
                  onClick={() =>
                    applyMealPeriodPreset({
                      label: "Lunch Combo Bundles",
                      offerName: "Lunch Combo Saver (12:00–15:00)",
                      kind: "fixed",
                      amountRupees: "40",
                      minOrderRupees: "199",
                      benchmarkBasketRupees: "220",
                    })
                  }
                >
                  Load Lunch Preset into Calculator
                </Button>
              </div>

              {/* Evening Snack / Chai Combos */}
              <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-amber-300">
                      16:00 – 18:30 IST
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 tabular">
                      7d Volume: {snackOrders7d} orders
                    </span>
                  </div>
                  <div className="font-semibold text-sm text-white">Evening Snack / Chai Combos</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Utilize idle kitchen prep line hours between lunch and dinner by pairing quick-prep starters, chaat, or rolls with hot/cold beverages.
                  </p>
                  <div className="rounded-lg border border-slate-800/90 bg-slate-900/70 p-2 text-[11px] text-slate-300">
                    <span className="font-semibold text-amber-300">Recommended Setup:</span> 15% Off up to ₹45 on ₹149+ minimum order to drive high-frequency afternoon orders.
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full text-xs"
                  onClick={() =>
                    applyMealPeriodPreset({
                      label: "Evening Snack / Chai Combos",
                      offerName: "Evening Snack & Chai Combo (16:00–18:30)",
                      kind: "percent",
                      percent: "15",
                      minOrderRupees: "149",
                      maxDiscountRupees: "45",
                      benchmarkBasketRupees: "180",
                    })
                  }
                >
                  Load Evening Snack Preset
                </Button>
              </div>

              {/* Dinner Family Packs */}
              <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-indigo-300">
                      19:00 – 22:30 IST
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 tabular">
                      7d Volume: {dinnerOrders7d} orders
                    </span>
                  </div>
                  <div className="font-semibold text-sm text-white">Dinner Family Packs</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Households ordering dinner add multiple mains, breads, and desserts when incentivized with a clear step-up basket threshold.
                  </p>
                  <div className="rounded-lg border border-slate-800/90 bg-slate-900/70 p-2 text-[11px] text-slate-300">
                    <span className="font-semibold text-indigo-300">Recommended Setup:</span> Flat ₹90 Off on orders above ₹499 to lift AOV while keeping discount ≤18%.
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full text-xs"
                  onClick={() =>
                    applyMealPeriodPreset({
                      label: "Dinner Family Packs",
                      offerName: "Dinner Family Pack Privilege (19:00–22:30)",
                      kind: "fixed",
                      amountRupees: "90",
                      minOrderRupees: "499",
                      benchmarkBasketRupees: "540",
                    })
                  }
                >
                  Load Dinner Family Preset
                </Button>
              </div>
            </div>
          </div>

          {/* Section 2: Menu Conversion Checklist Grounded in Live Catalog */}
          <div className="space-y-3 border-t border-slate-800 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="size-4 text-emerald-400" />
                <h3 className="font-display text-sm font-bold text-white">
                  2. Menu Conversion Checklist (Live Storefront Audit)
                </h3>
              </div>
              <Link
                to="/menu"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline"
              >
                Open Dish Studio (/menu) →
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {/* 4:3 Studio Photos */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <Camera className="size-3.5 text-emerald-400" />
                    4:3 Studio Dish Photos
                  </span>
                  <span className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] font-mono text-emerald-400 tabular">
                    {itemsWithPhotoCount}/{totalMenuCount} dishes
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {totalMenuCount === 0
                    ? "Add active dishes in Dish Studio and upload 4:3 studio-lit photos so customers can see authentic portion presentation."
                    : itemsWithPhotoCount === totalMenuCount
                      ? "All active dishes have verified photographs. Well-lit 4:3 photos build immediate visual trust on your menu page."
                      : `${totalMenuCount - itemsWithPhotoCount} active dish(es) are missing photos. Prioritize top-selling mains and combos in Dish Studio.`}
                </p>
              </div>

              {/* Clear Portion Sizing */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <Layers className="size-3.5 text-amber-400" />
                    Clear Portion Sizing
                  </span>
                  <span className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] font-mono text-amber-300 tabular">
                    {itemsWithPortionCount}/{totalMenuCount} dishes
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Specify gram/ml weight or serving count (e.g. &ldquo;Serves 1 · 250g&rdquo; or &ldquo;Family Pack · Serves 4&rdquo;) to eliminate ordering hesitation and portion complaints.
                </p>
              </div>

              {/* Add-on Beverage / Dessert Pairing */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <TrendingUp className="size-3.5 text-indigo-400" />
                    Beverage &amp; Dessert Add-ons
                  </span>
                  <span className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] font-mono text-indigo-300 tabular">
                    {itemsWithAddonsCount}/{totalMenuCount} paired ({activeAddonsCount} add-ons)
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Attach high-margin beverages (Masala Chaas, Fresh Lime Soda) and desserts (Gulab Jamun, Brownie) as 1-tap add-ons on main course items to grow AOV organically.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Customer Retention & Repeat-Order Strategy: Flat ₹ Off vs Percentage Discount Unit-Economics Calculator */}
        <Card className="space-y-4 border-slate-800 bg-slate-900/80 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Calculator className="size-5 text-emerald-400" />
              <div>
                <h3 className="font-display text-base font-bold text-white">
                  3. Customer Retention &amp; Repeat-Order Unit-Economics Calculator
                </h3>
                <p className="text-xs text-slate-400">
                  Compare Flat ₹ Off vs Percentage Discount margin impact in exact integer paise before launching your promotion.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">
              Platform Commission: {(commissionBps / 100).toFixed(1)}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-300">Benchmark Order Value (₹)</Label>
              <Input
                type="number"
                min={0}
                value={simOrderRupees}
                onChange={(e) => setSimOrderRupees(e.target.value)}
                className="mt-1 h-9 text-xs bg-slate-950 border-slate-800"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Benchmark Packaging Fee (₹)</Label>
              <Input
                type="number"
                min={0}
                value={simPackingRupees}
                onChange={(e) => setSimPackingRupees(e.target.value)}
                className="mt-1 h-9 text-xs bg-slate-950 border-slate-800"
              />
            </div>
          </div>

          {/* Side-by-Side Retention Structure Comparison: Flat ₹ Off vs Percentage Discount */}
          <div className="grid gap-3 md:grid-cols-2">
            <div
              className={`rounded-xl border p-3.5 space-y-1.5 ${
                kind === "percent"
                  ? "border-emerald-500/40 bg-emerald-950/15"
                  : "border-slate-800 bg-slate-950/70"
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">
                  Structure A: {pctRate}% Off {maxCapPaise ? `(Cap ${formatINR(maxCapPaise)})` : "(Uncapped)"}
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  Min Order {formatINR(minOrderPaise)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">Merchant Discount Funded:</span>
                <span className="font-mono font-semibold text-rose-400 tabular">
                  −{formatINR(comparePctDiscPaise)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Net Merchant Take-Home:</span>
                <span className="font-mono font-bold text-emerald-400 tabular">
                  {formatINR(comparePctSettlement.restaurantPayablePaise)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                Best for acquiring first-time diners searching by percentage badge; always pair with a ₹ cap so large family baskets do not erode margin.
              </p>
            </div>

            <div
              className={`rounded-xl border p-3.5 space-y-1.5 ${
                kind === "fixed"
                  ? "border-emerald-500/40 bg-emerald-950/15"
                  : "border-slate-800 bg-slate-950/70"
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">
                  Structure B: Flat {formatINR(flatOfferPaise)} Off
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  Min Order {formatINR(minOrderPaise)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">Merchant Discount Funded:</span>
                <span className="font-mono font-semibold text-rose-400 tabular">
                  −{formatINR(compareFlatDiscPaise)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Net Merchant Take-Home:</span>
                <span className="font-mono font-bold text-emerald-400 tabular">
                  {formatINR(compareFlatSettlement.restaurantPayablePaise)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                Best for repeat-order retention and AOV step-ups: your subsidy is fixed in exact rupees even when the customer adds extra sides or beverages.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs pt-1">
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <div className="text-[10px] font-mono text-slate-400">CUSTOMER PAYS (INC 5% GST)</div>
              <div className="text-sm font-bold text-white mt-1 tabular">
                {formatINR(customerPaysFoodAndTaxPaise)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Includes {formatINR(statutoryGst95Paise)} GST §9(5)
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <div className="text-[10px] font-mono text-slate-400">MERCHANT DISCOUNT COST</div>
              <div className="text-sm font-bold text-rose-400 mt-1 tabular">
                −{formatINR(simDiscountPaise)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {simFoodPaise < minOrderPaise ? "Below min order" : `Active Form: ${kind.toUpperCase()}`}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <div className="text-[10px] font-mono text-slate-400">PLATFORM COMMISSION</div>
              <div className="text-sm font-bold text-rose-400 mt-1 tabular">
                −{formatINR(simSettlement.commissionPaise)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {(commissionBps / 100).toFixed(1)}% on net food+packing
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <div className="text-[10px] font-mono text-slate-400">STATUTORY TDS §194-O (0.1%)</div>
              <div className="text-sm font-bold text-slate-300 mt-1 tabular">
                {formatINR(statutoryTds194OPaise)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Credited to your PAN Form 16A</div>
            </div>

            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3">
              <div className="text-[10px] font-mono text-emerald-400">NET MERCHANT TAKE-HOME</div>
              <div className="text-base font-bold text-emerald-400 mt-1 tabular">
                {formatINR(simSettlement.restaurantPayablePaise)}
              </div>
              <div className="text-[10px] text-emerald-300/80 mt-0.5">Settled to your bank</div>
            </div>
          </div>
        </Card>

        {/* Create New Restaurant-Funded Promotion */}
        {canEdit ? (
          <Card className="space-y-4 border-slate-800 bg-slate-900/80 p-5">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Tag className="size-4 text-emerald-400" />
              <h3 className="font-display text-base font-bold text-white">{t("promotions.create")}</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-slate-300">{t("menu.name")}</Label>
                <Input
                  placeholder="e.g. Lunch Combo Saver (12:00–15:00)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 h-9 text-xs bg-slate-950 border-slate-800"
                />
              </div>

              <div>
                <Label className="text-xs text-slate-300">Offer Structure</Label>
                <select
                  className="mt-1 h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 text-xs text-slate-100"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as PromotionKind)}
                >
                  <option value="percent">Percentage Off (%)</option>
                  <option value="fixed">Flat Amount Off (₹)</option>
                  <option value="bogo">Buy 1 Get 1 Free (BOGO)</option>
                  <option value="free_delivery">Free Delivery Offer</option>
                </select>
              </div>

              {kind === "percent" ? (
                <div>
                  <Label className="text-xs text-slate-300">{t("promotions.percent")}</Label>
                  <Input
                    type="number"
                    value={percent}
                    onChange={(e) => setPercent(e.target.value)}
                    className="mt-1 h-9 text-xs bg-slate-950 border-slate-800"
                  />
                </div>
              ) : null}

              {kind === "fixed" ? (
                <div>
                  <Label className="text-xs text-slate-300">Discount Amount (₹)</Label>
                  <Input
                    type="number"
                    value={amountRupees}
                    onChange={(e) => setAmountRupees(e.target.value)}
                    className="mt-1 h-9 text-xs bg-slate-950 border-slate-800"
                  />
                </div>
              ) : null}

              <div>
                <Label className="text-xs text-slate-300">Minimum Order Value (₹)</Label>
                <Input
                  type="number"
                  value={minOrderRupees}
                  onChange={(e) => setMinOrderRupees(e.target.value)}
                  className="mt-1 h-9 text-xs bg-slate-950 border-slate-800"
                />
              </div>

              {kind === "percent" ? (
                <div>
                  <Label className="text-xs text-slate-300">Maximum Discount Cap (₹)</Label>
                  <Input
                    type="number"
                    value={maxDiscountRupees}
                    onChange={(e) => setMaxDiscountRupees(e.target.value)}
                    className="mt-1 h-9 text-xs bg-slate-950 border-slate-800"
                  />
                </div>
              ) : null}
            </div>

            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
              onClick={() =>
                void savePromotion({
                  data: {
                    restaurantId: vendor.restaurantId,
                    name: name.trim() || `${kind.toUpperCase()} Offer`,
                    funder: "RESTAURANT",
                    kind,
                    percentOff: kind === "percent" ? Number(percent) || 0 : undefined,
                    amountPaise: kind === "fixed" ? rupeesToPaise(Number(amountRupees) || 0) : undefined,
                    minOrderPaise: rupeesToPaise(Number(minOrderRupees) || 0),
                    maxDiscountPaise:
                      kind === "percent" && maxDiscountRupees
                        ? rupeesToPaise(Number(maxDiscountRupees))
                        : null,
                    isActive: true,
                  },
                }).then(() => {
                  setName("");
                  setPlaybookAppliedNotice(null);
                  void qc.invalidateQueries({ queryKey: ["promos"] });
                })
              }
            >
              {t("promotions.create")}
            </Button>
          </Card>
        ) : null}

        {/* Sponsored Placement Daily Cap Controls (Factual Ledger Metrics Only) */}
        <Card className="space-y-4 border-slate-800 bg-slate-900/80 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Megaphone className="size-5 text-emerald-400" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-base font-bold text-white">
                    Sponsored Placement Daily Budget Cap
                  </h2>
                  <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                    SELF-SERVE AD CAP
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  Configure a strict daily budget ceiling for promoted placement. Unspent daily cap is never charged.
                </p>
              </div>
            </div>
            {adQuery.data?.isActive ? (
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Campaign Active
              </span>
            ) : (
              <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400">
                Campaign Paused
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <span className="text-[11px] font-mono uppercase text-slate-400">Configured Daily Cap</span>
              <p className="text-lg font-bold text-white mt-0.5 tabular">
                <MoneyText paise={activeDailyBudgetPaise} />
              </p>
              <span className="text-[11px] text-slate-500">Hard ceiling per calendar day</span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <span className="text-[11px] font-mono uppercase text-slate-400">Promo-Assisted Orders (7d)</span>
              <p className="text-lg font-bold text-slate-200 mt-0.5 tabular">
                {promoOrders7d} {promoOrders7d === 1 ? "order" : "orders"}
              </p>
              <span className="text-[11px] text-slate-500">Verified ledger orders in last 7 days</span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <span className="text-[11px] font-mono uppercase text-slate-400">Merchant Promo Spend (7d)</span>
              <p className="text-lg font-bold text-emerald-400 mt-0.5 tabular">
                <MoneyText paise={promoRestSpend7dPaise} />
              </p>
              <span className="text-[11px] text-slate-500">Actual discount funded on delivered orders</span>
            </div>
          </div>

          {canEdit ? (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Label className="text-xs font-medium text-slate-300">Select Daily Budget Cap (₹):</Label>
              <div className="flex gap-2">
                {["100", "250", "500", "1000"].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAdBudgetRupees(amt)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      adBudgetRupees === amt
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex gap-2">
                <Button
                  size="sm"
                  variant={adQuery.data?.isActive ? "outline" : "primary"}
                  onClick={() =>
                    void saveAdCampaign({
                      data: {
                        restaurantId: vendor.restaurantId,
                        dailyBudgetPaise: rupeesToPaise(Number(adBudgetRupees) || 250),
                        isActive: !adQuery.data?.isActive,
                      },
                    }).then(() => qc.invalidateQueries({ queryKey: ["adCampaign"] }))
                  }
                >
                  {adQuery.data?.isActive ? "Pause Sponsored Placement" : "Activate Sponsored Placement"}
                </Button>
              </div>
            </div>
          ) : null}
        </Card>

        {/* Viral Dine-In Table QR & Customer Acquisition Kit */}
        <InStoreMarketingKit
          restaurantId={vendor.restaurantId}
          restaurantName={vendor.selected?.restaurantName}
        />

        {/* Active Offers & Discounts Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          <section className="space-y-2.5">
            <h2 className="font-display text-base font-bold text-white">
              {t("promotions.restaurantFunded")} ({rest.length})
            </h2>
            {rest.length === 0 ? (
              <Card className="text-xs text-slate-400 border-slate-800 bg-slate-900/60 p-4">
                No restaurant-funded offers configured yet. Use the Spark AI Playbook presets or the form above to launch a promotion.
              </Card>
            ) : (
              rest.map((p) => (
                <Card key={p.id} className="space-y-2 border-slate-800 bg-slate-900/70 p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm text-white">{p.name}</div>
                    <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-mono uppercase text-emerald-400">
                      {p.kind} · {p.isActive ? "ACTIVE" : "PAUSED"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{p.estimate.narrative}</p>
                  {canEdit ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs"
                      onClick={() =>
                        void savePromotion({
                          data: {
                            restaurantId: vendor.restaurantId,
                            id: p.id,
                            name: p.name,
                            funder: "RESTAURANT",
                            kind: p.kind as PromotionKind,
                            percentOff: p.percent_off ?? undefined,
                            amountPaise: p.amountPaise ?? undefined,
                            minOrderPaise: p.minOrderPaise,
                            maxDiscountPaise: p.maxDiscountPaise,
                            isActive: !p.isActive,
                          },
                        }).then(() => qc.invalidateQueries({ queryKey: ["promos"] }))
                      }
                    >
                      {p.isActive ? t("promotions.pause") : t("promotions.activate")}
                    </Button>
                  ) : null}
                </Card>
              ))
            )}
          </section>

          <section className="space-y-2.5">
            <h2 className="font-display text-base font-bold text-white">
              {t("promotions.platformFunded")} ({plat.length})
            </h2>
            {plat.length === 0 ? (
              <Card className="text-xs text-slate-400 border-slate-800 bg-slate-900/60 p-4">
                Platform-sponsored campaigns automatically reimburse 100% of the coupon subsidy to your settlement ledger.
              </Card>
            ) : (
              plat.map((p) => (
                <Card key={p.id} className="space-y-2 border-slate-800 bg-slate-900/70 p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm text-white">{p.name}</div>
                    <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono uppercase text-emerald-400">
                      {p.kind} · 100% REIMBURSED
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{p.estimate.narrative}</p>
                  <div className="text-xs font-mono text-emerald-400">
                    Subsidy Value: <MoneyText paise={p.estimate.estimatedDailyCostPaise} />
                  </div>
                </Card>
              ))
            )}
          </section>
        </div>
        </>
        )}
      </div>
    </VendorShell>
  );
}
