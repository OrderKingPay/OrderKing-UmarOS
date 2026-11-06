// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Utensils, Plus, Trash2, Sparkles, Search, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/menu")({
  component: PartnerMenuPage,
});

type StockState = "IN_STOCK" | "OUT_OF_STOCK" | "NEXT_DAY_AUTO_RESET";

interface MenuDish {
  id: string;
  name: string;
  category: string;
  pricePaise: number;
  diet: "VEG" | "NONVEG";
  stockState: StockState;
  variantsSummary: string;
}

const MENU_STORAGE_KEY = "orderking_partner_menu_catalog_v2";

function PartnerMenuPage() {
  const [dishes, setDishes] = useState<MenuDish[]>([
    {
      id: "d1",
      name: "Special Chicken Dum Biryani",
      category: "Biryani",
      pricePaise: 18000,
      diet: "NONVEG",
      stockState: "IN_STOCK",
      variantsSummary: "Size (Half/Full) · Spice Level (Medium/Fiery)",
    },
    {
      id: "d2",
      name: "Smoked Chicken Bhut Jolokia Pizza",
      category: "Pizza",
      pricePaise: 34900,
      diet: "NONVEG",
      stockState: "IN_STOCK",
      variantsSummary: "Size (8in/10in/12in) · Crust (Hand Tossed/Cheese Burst) · Spice Level",
    },
    {
      id: "d3",
      name: "Paneer Butter Masala",
      category: "Main Course",
      pricePaise: 16000,
      diet: "VEG",
      stockState: "IN_STOCK",
      variantsSummary: "Portion (250ml/500ml) · Add-ons (Extra Butter)",
    },
  ]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Main Course");
  const [priceInr, setPriceInr] = useState("");
  const [diet, setDiet] = useState<"VEG" | "NONVEG">("NONVEG");
  const [variantsSummary, setVariantsSummary] = useState("Size · Crust · Spice Level");
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editPriceInrVal, setEditPriceInrVal] = useState<string>("");
  const [snapshotNotice, setSnapshotNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedRaw = window.localStorage.getItem(MENU_STORAGE_KEY);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (Array.isArray(parsed) && parsed.length > 0) setDishes(parsed);
      }
    } catch {}
  }, []);

  function saveDishes(next: MenuDish[]) {
    setDishes(next);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(next));
      } catch {}
    }
  }

  function handleAddDish(e: any) {
    e.preventDefault();
    if (!name.trim() || !priceInr.trim()) return;
    const paise = Math.max(1000, Math.round(parseFloat(priceInr) * 100) || 15000);
    const nextDish: MenuDish = {
      id: "d_" + Date.now(),
      name: name.trim(),
      category: category.trim() || "Main Course",
      pricePaise: paise,
      diet,
      stockState: "IN_STOCK",
      variantsSummary: variantsSummary.trim() || "Standard",
    };
    saveDishes([nextDish, ...dishes]);
    setName("");
    setPriceInr("");
    setSnapshotNotice(`Added "${nextDish.name}" at ₹${(paise / 100).toFixed(2)} (${paise} paise).`);
  }

  function handleSavePriceEdit(dish: MenuDish) {
    const newPaise = Math.max(1000, Math.round(parseFloat(editPriceInrVal) * 100) || dish.pricePaise);
    saveDishes(dishes.map((d) => (d.id === dish.id ? { ...d, pricePaise: newPaise } : d)));
    setEditingPriceId(null);
    setSnapshotNotice(
      `Updated "${dish.name}" price to ₹${(newPaise / 100).toFixed(2)}. Historical price snapshots on active KDS orders remain untouched.`
    );
  }

  function cycleStockState(current: StockState): StockState {
    if (current === "IN_STOCK") return "OUT_OF_STOCK";
    if (current === "OUT_OF_STOCK") return "NEXT_DAY_AUTO_RESET";
    return "IN_STOCK";
  }

  const filtered = dishes.filter((d) =>
    !search.trim()
      ? true
      : d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <VendorShell title="Live Menu Management">
      <div className="mx-auto max-w-5xl py-4 space-y-5 text-slate-100">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Utensils className="size-5 text-emerald-400" />
              <span>Live Menu &amp; Variant Manager (Historical Snapshot Protected)</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Toggle In Stock / Out of Stock / Next Day Auto-Reset (06:00 AM IST). Active order prices remain locked in integer paise.
            </p>
          </div>
          <Link
            to="/assistant"
            className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/40 px-4 py-2 text-xs font-bold text-emerald-300 inline-flex items-center gap-1.5"
          >
            <Sparkles className="size-4" />
            <span>Upload Menu via Spark AI →</span>
          </Link>
        </div>

        {snapshotNotice && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-200 flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
            <span>{snapshotNotice}</span>
          </div>
        )}

        <form onSubmit={handleAddDish} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 grid grid-cols-1 sm:grid-cols-6 gap-3">
          <div className="sm:col-span-2">
            <Label className="text-xs text-slate-300">Dish Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Assam Duck Curry"
              className="mt-1 h-10 bg-slate-950 border-slate-800 text-white text-xs"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-300">Category</Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Main Course"
              className="mt-1 h-10 bg-slate-950 border-slate-800 text-white text-xs"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-300">Price (₹) *</Label>
            <Input
              type="number"
              value={priceInr}
              onChange={(e) => setPriceInr(e.target.value)}
              placeholder="220"
              className="mt-1 h-10 bg-slate-950 border-slate-800 text-white text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-300">Variants (Size/Crust/Spice)</Label>
            <Input
              value={variantsSummary}
              onChange={(e) => setVariantsSummary(e.target.value)}
              className="mt-1 h-10 bg-slate-950 border-slate-800 text-white text-xs"
            />
          </div>
          <div className="flex items-end gap-2">
            <select
              value={diet}
              onChange={(e) => setDiet(e.target.value as any)}
              className="h-10 rounded-xl border border-slate-800 bg-slate-950 px-2 text-xs text-white"
            >
              <option value="NONVEG">Non-Veg</option>
              <option value="VEG">Veg</option>
            </select>
            <Button type="submit" className="h-10 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0">
              <Plus className="size-4" />
              <span>Add</span>
            </Button>
          </div>
        </form>

        <div className="relative">
          <Search className="size-4 text-slate-400 absolute left-3.5 top-3" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu items..."
            className="pl-10 h-10 bg-slate-900 border-slate-800 text-white text-xs rounded-xl"
          />
        </div>

        <div className="space-y-2.5">
          {filtered.map((d) => (
            <div key={d.id} className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1.5 size-3 rounded-full shrink-0 ${
                    d.diet === "VEG" ? "bg-emerald-400" : "bg-rose-500"
                  }`}
                />
                <div>
                  <div className="text-sm font-bold text-white">{d.name}</div>
                  <div className="text-xs text-slate-400">
                    {d.category} · <strong className="text-slate-200 font-mono">₹{(d.pricePaise / 100).toFixed(2)}</strong> ({d.pricePaise} paise)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Variants: {d.variantsSummary}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {editingPriceId === d.id ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      value={editPriceInrVal}
                      onChange={(e) => setEditPriceInrVal(e.target.value)}
                      className="w-24 h-8 bg-slate-950 border-slate-700 text-white text-xs font-mono"
                    />
                    <Button
                      type="button"
                      onClick={() => handleSavePriceEdit(d)}
                      className="h-8 px-3 bg-emerald-600 text-white text-xs font-bold rounded-lg"
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPriceId(d.id);
                      setEditPriceInrVal(String(d.pricePaise / 100));
                    }}
                    className="rounded-xl px-3 py-1.5 text-xs font-semibold border border-slate-700 bg-slate-950 text-slate-300 hover:text-white"
                  >
                    Edit Price
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    saveDishes(
                      dishes.map((item) =>
                        item.id === d.id ? { ...item, stockState: cycleStockState(item.stockState) } : item
                      )
                    )
                  }
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold border transition ${
                    d.stockState === "IN_STOCK"
                      ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                      : d.stockState === "NEXT_DAY_AUTO_RESET"
                      ? "border-amber-500/40 bg-amber-950/30 text-amber-300"
                      : "border-rose-500/40 bg-rose-950/30 text-rose-300"
                  }`}
                >
                  {d.stockState === "IN_STOCK"
                    ? "In Stock"
                    : d.stockState === "NEXT_DAY_AUTO_RESET"
                    ? "Next Day Auto-Reset (6 AM)"
                    : "Out of Stock"}
                </button>

                <button
                  type="button"
                  onClick={() => saveDishes(dishes.filter((item) => item.id !== d.id))}
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
