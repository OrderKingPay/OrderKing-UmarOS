// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Tag, Plus, Trash2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/promotions")({
  component: PartnerPromotionsPage,
});

interface PromoOffer {
  id: string;
  code: string;
  discountPct: number;
  maxCapInr: number;
  minOrderInr: number;
  active: boolean;
}

const PROMO_KEY = "orderking_partner_promos_v1";

function PartnerPromotionsPage() {
  const [offers, setOffers] = useState<PromoOffer[]>([
    { id: "p1", code: "WELCOME20", discountPct: 20, maxCapInr: 50, minOrderInr: 199, active: true },
  ]);
  const [code, setCode] = useState("");
  const [discountPct, setDiscountPct] = useState("15");
  const [maxCapInr, setMaxCapInr] = useState("45");
  const [minOrderInr, setMinOrderInr] = useState("249");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(PROMO_KEY);
      if (raw) setOffers(JSON.parse(raw));
    } catch {}
  }, []);

  function saveOffers(next: PromoOffer[]) {
    setOffers(next);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(PROMO_KEY, JSON.stringify(next));
      } catch {}
    }
  }

  function handleAddOffer(e: any) {
    e.preventDefault();
    const cleanCode = (code || "SAVE" + discountPct).toUpperCase().replace(/[^A-Z0-9]/g, "");
    const next: PromoOffer = {
      id: "p_" + Date.now(),
      code: cleanCode,
      discountPct: Math.min(60, Math.max(5, parseInt(discountPct || "15", 10))),
      maxCapInr: Math.max(20, parseInt(maxCapInr || "50", 10)),
      minOrderInr: Math.max(99, parseInt(minOrderInr || "199", 10)),
      active: true,
    };
    saveOffers([next, ...offers]);
    setCode("");
  }

  return (
    <VendorShell title="Offers">
      <div className="mx-auto max-w-4xl py-4 space-y-5 text-slate-100">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Tag className="size-5 text-emerald-400" />
            <span>Restaurant Offers &amp; Discounts</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create percentage discounts for customers ordering from your restaurant.
          </p>

          <form onSubmit={handleAddOffer} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4">
            <div>
              <Label className="text-xs text-slate-300">Coupon Code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SAVE20"
                className="mt-1 h-10 bg-slate-950 border-slate-800 text-white font-mono uppercase text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Discount %</Label>
              <Input
                type="number"
                value={discountPct}
                onChange={(e) => setDiscountPct(e.target.value)}
                className="mt-1 h-10 bg-slate-950 border-slate-800 text-white text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Min Order (₹)</Label>
              <Input
                type="number"
                value={minOrderInr}
                onChange={(e) => setMinOrderInr(e.target.value)}
                className="mt-1 h-10 bg-slate-950 border-slate-800 text-white text-xs"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5">
                <Plus className="size-4" />
                <span>Create Offer</span>
              </Button>
            </div>
          </form>
        </div>

        <div className="space-y-3">
          {offers.map((o) => (
            <div key={o.id} className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-emerald-400">{o.code}</span>
                  <span className="text-xs font-bold text-white">{o.discountPct}% OFF up to ₹{o.maxCapInr}</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Valid on orders above ₹{o.minOrderInr}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    saveOffers(offers.map((item) => (item.id === o.id ? { ...item, active: !item.active } : item)))
                  }
                  className={`h-8 px-3 text-xs rounded-lg border ${
                    o.active
                      ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                      : "border-slate-700 bg-slate-950 text-slate-400"
                  }`}
                >
                  {o.active ? "Active" : "Paused"}
                </Button>
                <button
                  type="button"
                  onClick={() => saveOffers(offers.filter((item) => item.id !== o.id))}
                  className="p-2 text-slate-400 hover:text-rose-400"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </VendorShell>
  );
}
