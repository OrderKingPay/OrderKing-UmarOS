import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { MoneyText } from "@/components/money-text";
import { useT } from "@/components/use-t";
import { useVendor } from "@/components/use-vendor";
import { getPromotions, savePromotion, getAdCampaign, saveAdCampaign } from "@/lib/server/api-finance";
import { rupeesToPaise } from "@/lib/money";
import { can } from "@/lib/rbac";
import type { PromotionKind } from "@/lib/contracts";

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

  const canEdit = vendor.role ? can(vendor.role, "promotions.edit") : false;

  // New Promotion Form State
  const [name, setName] = useState("");
  const [kind, setKind] = useState<PromotionKind>("percent");
  const [percent, setPercent] = useState("15");
  const [amountRupees, setAmountRupees] = useState("50");
  const [minOrderRupees, setMinOrderRupees] = useState("199");
  const [maxDiscountRupees, setMaxDiscountRupees] = useState("75");

  // Ad Campaign Budget Selection
  const [adBudgetRupees, setAdBudgetRupees] = useState("250");

  const rest = q.data?.promotions.filter((p) => p.funder === "RESTAURANT") ?? [];
  const plat = q.data?.promotions.filter((p) => p.funder === "PLATFORM") ?? [];

  return (
    <VendorShell title={t("nav.promotions")} dataLabel={q.data?.dataLabel ?? vendor.dataLabel}>
      {/* Zomato-Style Sponsored Ads & Boost Section */}
      <Card className="mb-6 space-y-4 border-2 border-primary/20 bg-gradient-to-br from-surface via-surface to-primary/5 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Zomato-Style Ad Engine
              </span>
              <h2 className="font-display text-xl font-bold">Promote & Boost Kitchen</h2>
            </div>
            <p className="mt-1 text-sm text-muted">
              Get top placement on customer app Search & Home feed with a Promoted badge.
            </p>
          </div>
          {adQuery.data?.isActive ? (
            <span className="flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" /> Active Campaign
            </span>
          ) : (
            <span className="rounded-full bg-muted/20 px-3 py-1 text-xs font-medium text-muted">
              Campaign Paused
            </span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface p-3">
            <span className="text-xs text-muted">Daily Budget</span>
            <p className="text-lg font-bold">
              <MoneyText paise={adQuery.data?.dailyBudgetPaise ?? 25000} />
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-3">
            <span className="text-xs text-muted">Est. Impressions</span>
            <p className="text-lg font-bold text-fg">~{adQuery.data?.estimatedImpressions ?? 3000} views/day</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-3">
            <span className="text-xs text-muted">Est. Extra Orders</span>
            <p className="text-lg font-bold text-primary">~{adQuery.data?.estimatedClicks ?? 35} clicks</p>
          </div>
        </div>

        {canEdit ? (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Label className="text-sm font-medium">Set Daily Budget (₹):</Label>
            <div className="flex gap-2">
              {["100", "250", "500", "1000"].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAdBudgetRupees(amt)}
                  className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                    adBudgetRupees === amt
                      ? "bg-primary text-white"
                      : "bg-surface-2 text-fg hover:bg-surface-3"
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
            <div className="ml-auto flex gap-2">
              <Button
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
                {adQuery.data?.isActive ? "Pause Campaign" : "🚀 Launch Ad Boost"}
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      {/* Offers & Discounts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="space-y-2">
          <h2 className="font-display text-xl">{t("promotions.restaurantFunded")}</h2>
          {rest.map((p) => (
            <Card key={p.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">{p.name}</div>
                <span className="rounded bg-surface-2 px-2 py-0.5 text-xs uppercase font-medium">
                  {p.kind}
                </span>
              </div>
              <p className="text-sm text-muted">{p.estimate.narrative}</p>
              {canEdit ? (
                <Button
                  variant="secondary"
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
                        isActive: !p.isActive,
                      },
                    }).then(() => qc.invalidateQueries({ queryKey: ["promos"] }))
                  }
                >
                  {p.isActive ? t("promotions.pause") : t("promotions.activate")}
                </Button>
              ) : null}
            </Card>
          ))}
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl">{t("promotions.platformFunded")}</h2>
          {plat.map((p) => (
            <Card key={p.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">{p.name}</div>
                <span className="rounded bg-surface-2 px-2 py-0.5 text-xs uppercase font-medium">
                  {p.kind}
                </span>
              </div>
              <p className="text-sm text-muted">{p.estimate.narrative}</p>
              <MoneyText paise={p.estimate.estimatedDailyCostPaise} />
            </Card>
          ))}
        </section>
      </div>

      {/* Create New Zomato-Style Promotion */}
      {canEdit ? (
        <Card className="mt-6 space-y-4">
          <h3 className="font-display text-lg font-bold">{t("promotions.create")}</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t("menu.name")}</Label>
              <Input
                placeholder="e.g. 20% Off Weekend Specials"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Label>Offer Type</Label>
              <select
                className="h-11 w-full rounded-[12px] border border-line bg-surface px-3 text-sm"
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
                <Label>{t("promotions.percent")}</Label>
                <Input
                  type="number"
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                />
              </div>
            ) : null}

            {kind === "fixed" ? (
              <div>
                <Label>Discount Amount (₹)</Label>
                <Input
                  type="number"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                />
              </div>
            ) : null}

            <div>
              <Label>Minimum Order Value (₹)</Label>
              <Input
                type="number"
                value={minOrderRupees}
                onChange={(e) => setMinOrderRupees(e.target.value)}
              />
            </div>

            {kind === "percent" ? (
              <div>
                <Label>Maximum Discount Cap (₹)</Label>
                <Input
                  type="number"
                  value={maxDiscountRupees}
                  onChange={(e) => setMaxDiscountRupees(e.target.value)}
                />
              </div>
            ) : null}
          </div>

          <Button
            onClick={() =>
              void savePromotion({
                data: {
                  restaurantId: vendor.restaurantId,
                  name: name.trim() || `${kind.toUpperCase()} Deal`,
                  funder: "RESTAURANT",
                  kind,
                  percentOff: kind === "percent" ? Number(percent) || 0 : undefined,
                  amountPaise: kind === "fixed" ? rupeesToPaise(Number(amountRupees) || 0) : undefined,
                  minOrderPaise: rupeesToPaise(Number(minOrderRupees) || 0),
                  maxDiscountPaise: kind === "percent" && maxDiscountRupees ? rupeesToPaise(Number(maxDiscountRupees)) : null,
                  isActive: true,
                },
              }).then(() => {
                setName("");
                void qc.invalidateQueries({ queryKey: ["promos"] });
              })
            }
          >
            {t("promotions.create")}
          </Button>
        </Card>
      ) : null}
    </VendorShell>
  );
}
