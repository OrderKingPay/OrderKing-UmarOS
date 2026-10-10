import { useState } from "react";
import { Flame, Activity, ShieldAlert, Heart, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface MacroNutrient {
  name: string;
  amount: string;
  percentage: number;
  color: string;
}

export interface NutritionAllergenDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
  dishName?: string;
  servingSize?: string;
  caloriesKcal?: number;
  macros?: MacroNutrient[];
  allergens?: string[];
  dietaryBadges?: string[];
  healthScore?: number;
}

export function NutritionAllergenDrawer({
  isOpen = false,
  onClose,
  dishName = "Tandoori Paneer Tikka (6 pcs)",
  servingSize = "280g / 1 Serving",
  caloriesKcal = 380,
  macros = [
    { name: "Protein", amount: "22g", percentage: 44, color: "bg-emerald-500" },
    { name: "Carbohydrates", amount: "14g", percentage: 28, color: "bg-amber-500" },
    { name: "Healthy Fats", amount: "18g", percentage: 36, color: "bg-rose-500" },
    { name: "Dietary Fiber", amount: "5g", percentage: 20, color: "bg-teal-500" },
  ],
  allergens = ["Contains Dairy (Paneer/Curd)", "Mustard Seeds", "Gluten-Free Facility"],
  dietaryBadges = ["High Protein", "Low Carb", "Vegetarian"],
  healthScore = 88,
}: NutritionAllergenDrawerProps) {
  const [open, setOpen] = useState(isOpen);

  if (!open && !isOpen) return null;

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-white/60 p-0 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-border bg-surface p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                ⭐ {healthScore}/100 Health Score
              </span>
              <span className="text-[11px] text-muted">Nutritional Audit</span>
            </div>
            <h3 className="font-display text-base font-bold text-fg mt-1">{dishName}</h3>
            <p className="text-xs text-muted">Serving size: {servingSize}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1 text-muted hover:bg-surface-2 hover:text-fg transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Energy Calorie Counter */}
        <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-500/15 via-surface-2 to-amber-500/5 p-4 border border-amber-500/20">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Flame className="size-6" />
            </span>
            <div>
              <p className="font-display text-xl font-black text-fg">{caloriesKcal} kcal</p>
              <p className="text-[11px] text-muted">Total Energy / Calories</p>
            </div>
          </div>
          <span className="text-[11px] text-muted text-right">
            ~19% of daily recommended<br />2,000 kcal intake
          </span>
        </div>

        {/* Macronutrient Breakdown */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-fg flex items-center gap-1.5">
            <Activity className="size-3.5 text-primary" /> Macronutrient Profile
          </h4>
          <div className="space-y-2">
            {macros.map((m) => (
              <div key={m.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted font-medium">{m.name}</span>
                  <span className="font-bold text-fg">{m.amount}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${m.color}`}
                    style={{ width: `${Math.min(100, m.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Allergen Information */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs">
            <AlertTriangle className="size-4" /> Allergen Advisory
          </div>
          <p className="text-[11px] text-muted">
            The following allergens are present or handled in the prep station for this dish:
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {allergens.map((alg) => (
              <span
                key={alg}
                className="rounded-md border border-amber-500/30 bg-surface px-2 py-1 text-[10px] font-semibold text-amber-900 dark:text-amber-300"
              >
                ⚠️ {alg}
              </span>
            ))}
          </div>
        </div>

        {/* Dietary Badges */}
        <div className="flex flex-wrap gap-1.5">
          {dietaryBadges.map((badge) => (
            <span
              key={badge}
              className="rounded-full bg-surface-2 border border-border px-2.5 py-0.5 text-[10px] font-semibold text-fg"
            >
              ✓ {badge}
            </span>
          ))}
        </div>

        {/* Verified by Chef Disclaimer */}
        <p className="text-[10px] text-muted text-center leading-normal">
          Caloric values are laboratory-certified or chef-estimated based on standardized recipes. Natural ingredient variations may occur.
        </p>

        <button
          type="button"
          onClick={handleClose}
          className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-fg hover:opacity-90 transition"
        >
          Close Nutritional View
        </button>
      </div>
    </div>
  );
}
