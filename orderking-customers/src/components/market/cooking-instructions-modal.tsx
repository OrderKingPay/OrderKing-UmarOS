import { useState } from "react";
import { ChefHat, Flame, Sparkles, X, Check, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface CookingInstructionsModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  itemName?: string;
  initialInstructions?: string;
  onSave?: (instructions: string) => void;
}

export function CookingInstructionsModal({
  isOpen = false,
  onClose,
  itemName = "Chicken Tikka Masala",
  initialInstructions = "",
  onSave,
}: CookingInstructionsModalProps) {
  const [open, setOpen] = useState(isOpen);
  const [spiceLevel, setSpiceLevel] = useState<"MILD" | "MEDIUM" | "SPICY" | "FIERY">("MEDIUM");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [customText, setCustomText] = useState(initialInstructions);

  const QUICK_CHIPS = [
    "🌱 Make Less Spicy",
    "🧅 No Onion / No Garlic",
    "💧 Less Oil / Low Butter",
    "🥫 Extra Mint Chutney & Gravy",
    "🍴 Don't send disposable cutlery",
    "🧂 Low Salt (Hypertension-friendly)",
    "📦 Double seal curry container",
  ];

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const handleSave = () => {
    const spiceNote = `Spice Level: ${spiceLevel}`;
    const allNotes = [spiceNote, ...selectedChips, customText.trim()].filter(Boolean).join(". ");
    onSave?.(allNotes);
    toast.success("Cooking instructions passed to chef station!");
    setOpen(false);
    onClose?.();
  };

  if (!open && !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-xl">
              👨‍🍳
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-fg">Cooking Instructions</h3>
              <p className="text-xs text-muted">For: {itemName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onClose?.();
            }}
            className="rounded-full p-1 text-muted hover:bg-surface-2 hover:text-fg"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Spice Level Preference */}
        <div>
          <label className="text-xs font-bold text-fg mb-1.5 flex items-center gap-1.5">
            <Flame className="size-3.5 text-primary" /> Preferred Spice Level
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: "MILD", label: "Mild", emoji: "🟢" },
              { id: "MEDIUM", label: "Medium", emoji: "🟡" },
              { id: "SPICY", label: "Spicy", emoji: "🌶️" },
              { id: "FIERY", label: "Extra Hot", emoji: "🔥" },
            ].map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setSpiceLevel(lvl.id as any)}
                className={`rounded-xl py-2 px-1 text-center border text-xs transition ${
                  spiceLevel === lvl.id
                    ? "border-primary bg-primary text-primary-fg font-bold shadow-xs"
                    : "border-border bg-surface-2 text-fg hover:border-primary/40"
                }`}
              >
                <span className="block text-sm">{lvl.emoji}</span>
                <span className="text-[11px] mt-0.5 block">{lvl.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Kitchen Preferences */}
        <div>
          <label className="text-xs font-bold text-fg mb-1.5 block">Common Kitchen Requests</label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_CHIPS.map((chip) => {
              const active = selectedChips.includes(chip);
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => toggleChip(chip)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                    active
                      ? "border-primary bg-primary text-primary-fg font-semibold shadow-xs"
                      : "border-border bg-surface-2 text-fg hover:border-primary/40"
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Allergy / Note */}
        <div>
          <label className="text-xs font-bold text-fg mb-1 block">Severe Allergies or Special Note</label>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="e.g. Severely allergic to peanuts/shellfish, please ensure clean ladle..."
            className="w-full min-h-16 rounded-xl border border-border bg-surface-2 p-2.5 text-xs focus:border-primary focus:outline-hidden"
          />
        </div>

        {/* Restaurant Kitchen Disclaimer */}
        <p className="text-[10px] text-muted leading-tight">
          Restaurants fulfill requests subject to ingredient availability. Special instructions do not modify item pricing.
        </p>

        {/* Save Button */}
        <Button onClick={handleSave} className="w-full gap-1.5">
          <Check className="size-4" /> Save Instructions
        </Button>
      </div>
    </div>
  );
}
