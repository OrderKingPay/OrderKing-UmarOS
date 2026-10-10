import { useState } from "react";
import { Check, ShieldAlert, Sparkles, Flame, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface DietaryAllergenConfig {
  dietaryClassification: "VEG" | "NON_VEG" | "VEGAN" | "JAIN" | "HALAL" | "EGG";
  isGlutenFree: boolean;
  isKetoFriendly: boolean;
  isDiabeticFriendly: boolean;
  isHighProtein: boolean;
  spiceLevel: number; // 1 to 5
  allergens: string[];
}

export interface DietaryAllergenEditorProps {
  initialConfig?: Partial<DietaryAllergenConfig>;
  dishName?: string;
  onSave?: (config: DietaryAllergenConfig) => void;
}

export function DietaryAllergenEditor({
  initialConfig,
  dishName = "Chicken Tikka Masala",
  onSave,
}: DietaryAllergenEditorProps) {
  const [classification, setClassification] = useState<DietaryAllergenConfig["dietaryClassification"]>(
    initialConfig?.dietaryClassification || "NON_VEG"
  );
  const [isGlutenFree, setIsGlutenFree] = useState<boolean>(Boolean(initialConfig?.isGlutenFree || false));
  const [isKetoFriendly, setIsKetoFriendly] = useState<boolean>(Boolean(initialConfig?.isKetoFriendly || false));
  const [isDiabeticFriendly, setIsDiabeticFriendly] = useState<boolean>(Boolean(initialConfig?.isDiabeticFriendly || false));
  const [isHighProtein, setIsHighProtein] = useState<boolean>(Boolean(initialConfig?.isHighProtein ?? true));
  const [spiceLevel, setSpiceLevel] = useState(initialConfig?.spiceLevel || 3);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(
    initialConfig?.allergens || ["Dairy / Butter", "Mustard Seeds"]
  );

  const ALLERGEN_OPTIONS = [
    "Dairy / Milk / Cheese",
    "Wheat / Gluten",
    "Peanuts",
    "Tree Nuts (Cashew / Almond)",
    "Soy / Soya",
    "Eggs",
    "Fish / Seafood",
    "Mustard Seeds",
    "Sesame Seeds",
    "Sulphites",
  ];

  const toggleAllergen = (item: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleSave = () => {
    onSave?.({
      dietaryClassification: classification,
      isGlutenFree,
      isKetoFriendly,
      isDiabeticFriendly,
      isHighProtein,
      spiceLevel,
      allergens: selectedAllergens,
    });
  };

  return (
    <Card className="p-4 space-y-4 max-w-xl">
      <div>
        <h3 className="text-sm font-bold text-fg flex items-center gap-1.5">
          <span>🥗</span> Dietary & Allergen Configuration
        </h3>
        <p className="text-xs text-muted">
          Dish: <strong className="text-fg">{dishName}</strong>. Standardized classifications for customer filtering.
        </p>
      </div>

      {/* Primary Dietary Category */}
      <div>
        <label className="text-xs font-bold text-fg mb-1.5 block">Primary Classification</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "VEG", label: "🌱 Pure Veg", desc: "100% Vegetarian" },
            { id: "NON_VEG", label: "🍗 Non-Veg", desc: "Meat & Poultry" },
            { id: "VEGAN", label: "🥑 Vegan", desc: "Plant-derived only" },
            { id: "JAIN", label: "🕉️ Jain", desc: "No Root Veggies" },
            { id: "HALAL", label: "🌙 Halal", desc: "Certified Halal" },
            { id: "EGG", label: "🥚 Eggetarian", desc: "Contains Egg" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setClassification(item.id as any)}
              className={`rounded-xl p-2 text-left border transition ${
                classification === item.id
                  ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                  : "border-border bg-surface-2 text-fg hover:border-primary/40"
              }`}
            >
              <p className="text-xs">{item.label}</p>
              <p className="text-[10px] text-muted">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Lifestyle & Health Attributes */}
      <div>
        <label className="text-xs font-bold text-fg mb-1.5 block">Lifestyle Badges</label>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Gluten-Free 🌾", val: isGlutenFree, set: setIsGlutenFree },
            { label: "Keto / Low Carb 🥩", val: isKetoFriendly, set: setIsKetoFriendly },
            { label: "Diabetic / Sugar-Free 🩸", val: isDiabeticFriendly, set: setIsDiabeticFriendly },
            { label: "High Protein (20g+) 💪", val: isHighProtein, set: setIsHighProtein },
          ].map((badge, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => badge.set(!badge.val)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                badge.val
                  ? "border-primary bg-primary text-primary-fg shadow-xs"
                  : "border-border bg-surface-2 text-muted hover:text-fg"
              }`}
            >
              {badge.val && "✓ "}
              {badge.label}
            </button>
          ))}
        </div>
      </div>

      {/* Spice Intensity Rating */}
      <div>
        <label className="text-xs font-bold text-fg mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Flame className="size-3.5 text-primary" /> Spice Rating
          </span>
          <span className="text-primary font-mono">{spiceLevel} / 5 Chilies</span>
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setSpiceLevel(lvl)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold border transition ${
                spiceLevel >= lvl
                  ? "border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-400"
                  : "border-border bg-surface-2 text-muted"
              }`}
            >
              {"🌶️".repeat(lvl)}
            </button>
          ))}
        </div>
      </div>

      {/* Allergen Checkbox Matrix */}
      <div>
        <label className="text-xs font-bold text-fg mb-1.5 block flex items-center gap-1.5">
          <ShieldAlert className="size-3.5 text-amber-500" /> Declared Allergens (FSSAI Compliance)
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {ALLERGEN_OPTIONS.map((alg) => {
            const has = selectedAllergens.includes(alg);
            return (
              <button
                key={alg}
                type="button"
                onClick={() => toggleAllergen(alg)}
                className={`flex items-center justify-between rounded-lg border p-2 text-left text-xs transition ${
                  has
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-300 font-semibold"
                    : "border-border bg-surface-2 text-muted hover:text-fg"
                }`}
              >
                <span>{alg}</span>
                {has && <Check className="size-3 text-amber-600 dark:text-amber-400 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>

      <Button onClick={handleSave} className="w-full">
        Save Dietary & Allergen Profile
      </Button>
    </Card>
  );
}
