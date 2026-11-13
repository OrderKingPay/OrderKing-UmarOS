import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CartConflictModalProps {
  isOpen: boolean;
  currentRestaurantName: string;
  newRestaurantName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function CartConflictModal({
  isOpen,
  currentRestaurantName,
  newRestaurantName,
  onCancel,
  onConfirm,
}: CartConflictModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-conflict-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-orange-400/30 text-center space-y-4">
        {/* Warning Icon Badge */}
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-600 dark:text-orange-400 shadow-inner">
          <AlertTriangle className="size-7" />
        </div>

        <div className="space-y-2">
          <h2
            id="cart-conflict-title"
            className="font-display text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight"
          >
            Replace cart items?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Your cart contains dishes from{" "}
            <span className="font-bold text-zinc-950 dark:text-zinc-100">
              {currentRestaurantName || "another restaurant"}
            </span>
            . Do you want to discard your selection and add dishes from{" "}
            <span className="font-bold text-orange-600 dark:text-orange-400">
              {newRestaurantName || "this restaurant"}
            </span>
            ?
          </p>
        </div>

        <div className="flex gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 rounded-xl border-zinc-200 dark:border-zinc-700 font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-zinc-950 font-black text-xs shadow-md"
          >
            Clear Cart &amp; Add New Dish
          </Button>
        </div>
      </div>
    </div>
  );
}
