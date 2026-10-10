import { useState } from "react";
import { Check, Info, Sparkles, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type DietaryType =
  | "ALL"
  | "PURE_VEG"
  | "NON_VEG"
  | "VEGAN"
  | "JAIN"
  | "HALAL"
  | "GLUTEN_FREE"
  | "HIGH_PROTEIN"
  | "KETO"
  | "DIABETIC_FRIENDLY";

export interface DietaryOption {
  id: DietaryType;
  label: string;
  icon: string;
  badge?: string;
  description: string;
  colorClass: string;
}

export const DIETARY_OPTIONS: DietaryOption[] = [
  {
    id: "ALL",
    label: "All Items",
    icon: "🍽️",
    description: "Browse the entire curated menu without dietary restrictions",
    colorClass: "bg-surface-2 text-fg border-border",
  },
  {
    id: "PURE_VEG",
    label: "Pure Veg",
    icon: "🌱",
    badge: "100% Segregated",
    description: "Prepared in 100% vegetarian kitchens with dedicated cookware and green tamper seals",
    colorClass: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
  },
  {
    id: "NON_VEG",
    label: "Non-Veg",
    icon: "🍗",
    description: "Fresh poultry, mutton, seafood, and egg specialties",
    colorClass: "bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/30",
  },
  {
    id: "VEGAN",
    label: "Vegan",
    icon: "🥑",
    badge: "Plant-Based",
    description: "Strictly 100% plant-derived recipes with zero dairy, honey, or animal derivatives",
    colorClass: "bg-teal-500/10 text-teal-800 dark:text-teal-300 border-teal-500/30",
  },
  {
    id: "JAIN",
    label: "Jain Friendly",
    icon: "🕉️",
    badge: "No Root Veg",
    description: "Prepared strictly without onions, garlic, potatoes, or underground root vegetables",
    colorClass: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30",
  },
  {
    id: "HALAL",
    label: "Halal Certified",
    icon: "🌙",
    badge: "Certified",
    description: "Prepared using 100% certified halal-compliant meat and strict kitchen sanitation",
    colorClass: "bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-500/30",
  },
  {
    id: "GLUTEN_FREE",
    label: "Gluten-Free",
    icon: "🌾",
    badge: "Celiac Safe",
    description: "Made without wheat, barley, or rye; zero cross-contact gluten protocols",
    colorClass: "bg-orange-500/10 text-orange-800 dark:text-orange-300 border-orange-500/30",
  },
  {
    id: "HIGH_PROTEIN",
    label: "High Protein",
    icon: "💪",
    badge: "25g+ Protein",
    description: "Nutritious macro-balanced dishes packed with 25g+ protein per serving",
    colorClass: "bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-500/30",
  },
  {
    id: "KETO",
    label: "Keto / Low Carb",
    icon: "🥩",
    badge: "<10g Net Carbs",
    description: "High healthy fats and ultra-low carbohydrates suited for ketogenic lifestyle",
    colorClass: "bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 border-indigo-500/30",
  },
  {
    id: "DIABETIC_FRIENDLY",
    label: "Sugar-Free / Diabetic",
    icon: "🩸",
    badge: "Low GI",
    description: "Zero added refined sugar and low-glycemic index wholesome ingredients",
    colorClass: "bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 border-cyan-500/30",
  },
];

export interface DietaryFiltersProps {
  selected?: DietaryType;
  selectedMulti?: DietaryType[];
  allowMultiple?: boolean;
  onSelect?: (type: DietaryType) => void;
  onMultiChange?: (types: DietaryType[]) => void;
  showAssuranceBanner?: boolean;
  className?: string;
}

export function DietaryFilters({
  selected = "ALL",
  selectedMulti = ["ALL"],
  allowMultiple = false,
  onSelect,
  onMultiChange,
  showAssuranceBanner = true,
  className = "",
}: DietaryFiltersProps) {
  const [internalSelected, setInternalSelected] = useState<DietaryType>(selected);
  const [internalMulti, setInternalMulti] = useState<DietaryType[]>(selectedMulti);
  const [activeInfo, setActiveInfo] = useState<DietaryOption | null>(null);

  const isSelected = (id: DietaryType) => {
    if (allowMultiple) {
      return internalMulti.includes(id);
    }
    return internalSelected === id;
  };

  const handleToggle = (opt: DietaryOption) => {
    if (allowMultiple) {
      let updated: DietaryType[];
      if (opt.id === "ALL") {
        updated = ["ALL"];
      } else {
        const withoutAll = internalMulti.filter((t) => t !== "ALL");
        if (withoutAll.includes(opt.id)) {
          updated = withoutAll.filter((t) => t !== opt.id);
          if (updated.length === 0) updated = ["ALL"];
        } else {
          updated = [...withoutAll, opt.id];
        }
      }
      setInternalMulti(updated);
      onMultiChange?.(updated);
    } else {
      setInternalSelected(opt.id);
      onSelect?.(opt.id);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Scrollable Dietary Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {DIETARY_OPTIONS.map((opt) => {
          const active = isSelected(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleToggle(opt)}
              className={`group relative inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                active
                  ? "border-primary bg-primary text-primary-fg shadow-xs"
                  : "border-border bg-surface text-fg hover:border-primary/40 hover:bg-surface-2"
              }`}
            >
              <span className="text-sm">{opt.icon}</span>
              <span>{opt.label}</span>
              {active && <Check className="size-3 stroke-[3]" />}
              {opt.badge && !active && (
                <span className="ml-0.5 rounded-full bg-surface-2 px-1.5 py-0.2 text-[9px] font-bold text-muted group-hover:text-fg">
                  {opt.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Dietary Segregation & Safety Assurance Banner */}
      {showAssuranceBanner && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="text-muted">
              <strong className="text-fg">Dietary Guarantee:</strong> Segregated cookware, tamper-proof green/red seals, and verified allergen handling.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveInfo(DIETARY_OPTIONS.find((o) => o.id === "PURE_VEG") || null)}
            className="shrink-0 text-[11px] font-semibold text-primary hover:underline"
          >
            Learn more
          </button>
        </div>
      )}

      {/* Dietary Detail Modal */}
      {activeInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{activeInfo.icon}</span>
                <div>
                  <h3 className="font-display text-base font-bold text-fg">{activeInfo.label}</h3>
                  {activeInfo.badge && <Badge tone="primary">{activeInfo.badge}</Badge>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveInfo(null)}
                className="rounded-full p-1 text-muted hover:bg-surface-2 hover:text-fg"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-muted leading-relaxed">{activeInfo.description}</p>
            <div className="rounded-lg bg-surface-2 p-3 text-xs text-muted space-y-1.5">
              <p className="font-semibold text-fg">👑 OrderKing Standards:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>Strictly audited kitchen partners with regular spot-inspections</li>
                <li>Zero cross-contamination protocols for cookware & ladles</li>
                <li>FSSAI-certified packaging seals matching dietary criteria</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setActiveInfo(null)}
              className="w-full rounded-xl bg-primary py-2 text-xs font-bold text-primary-fg hover:opacity-90 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
