import { useState, useEffect } from "react";
import { Flame, Activity, X, CheckCircle2, AlertTriangle } from "lucide-react";

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
  dishName = "Dish Nutrition",
  servingSize,
  caloriesKcal,
  macros = [],
  allergens = [],
  dietaryBadges = [],
  healthScore,
}: NutritionAllergenDrawerProps) {
  const [open, setOpen] = useState(isOpen);

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  if (!open && !isOpen) return null;

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  const hasNutritionData =
    caloriesKcal !== undefined ||
    macros.length > 0 ||
    allergens.length > 0 ||
    dietaryBadges.length > 0 ||
    healthScore !== undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-white/60 p-0 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-border bg-surface p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            {(healthScore !== undefined || hasNutritionData) && (
              <div className="flex items-center gap-1.5">
                {healthScore !== undefined && (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {healthScore}/100 Nutrition Index
                  </span>
                )}
                <span className="text-[11px] text-muted">Dish Nutrition &amp; Allergens</span>
              </div>
            )}
            <h3 className="font-display text-base font-bold text-fg mt-1">{dishName}</h3>
            {servingSize && <p className="text-xs text-muted">Serving size: {servingSize}</p>}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1 text-muted hover:bg-surface-2 hover:text-fg transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {!hasNutritionData ? (
          <div className="rounded-xl border border-border bg-surface-2 p-4 text-xs text-muted leading-relaxed">
            Nutritional and allergen details have not been published by the restaurant for this dish yet. Please contact the restaurant via support if you have severe food allergies.
          </div>
        ) : (
          <>
            {/* Energy Calorie Counter */}
            {caloriesKcal !== undefined && (
              <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-orange-500/15 via-surface-2 to-orange-500/5 p-4 border border-orange-500/20">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-600 dark:text-orange-400">
                    <Flame className="size-6" />
                  </span>
                  <div>
                    <p className="font-display text-xl font-black text-fg">{caloriesKcal} kcal</p>
                    <p className="text-[11px] text-muted">Total Energy / Calories</p>
                  </div>
                </div>
                <span className="text-[11px] text-muted text-right">
                  {Math.round((caloriesKcal / 2000) * 100)}% of 2,000 kcal<br />daily reference intake
                </span>
              </div>
            )}

            {/* Macronutrient Breakdown */}
            {macros.length > 0 && (
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
            )}

            {/* Allergen Information */}
            {allergens.length > 0 && (
              <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-orange-700 dark:text-orange-400 font-bold text-xs">
                  <AlertTriangle className="size-4" /> Allergen Advisory
                </div>
                <p className="text-[11px] text-muted">
                  Allergens reported for this dish or preparation station:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {allergens.map((alg) => (
                    <span
                      key={alg}
                      className="inline-flex items-center gap-1 rounded-md border border-orange-500/30 bg-surface px-2 py-1 text-[10px] font-semibold text-orange-950 dark:text-orange-300"
                    >
                      <AlertTriangle className="size-3 shrink-0" />
                      <span>{alg}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dietary Badges */}
            {dietaryBadges.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {dietaryBadges.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1 rounded-full bg-surface-2 border border-border px-2.5 py-0.5 text-[10px] font-semibold text-fg"
                  >
                    <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                    <span>{badge}</span>
                  </span>
                ))}
              </div>
            )}

            <p className="text-[10px] text-muted text-center leading-normal">
              Nutritional values are provided by the restaurant kitchen based on standard recipe portions.
            </p>
          </>
        )}

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
