import * as Dialog from "@radix-ui/react-dialog";
import { Minus, Plus, ChefHat, Check, AlertCircle, Sparkles, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers";
import { formatPaise } from "@/lib/money";
import type { AddonGroupView, MenuItemView } from "@/lib/market-types";
import { cartKey, type CartItem } from "@/lib/stores/cart";
import { CookingInstructionsModal } from "@/components/market/cooking-instructions-modal";
import {
  calculateModifierPricing,
  extractEffectiveAddonGroups,
  validateModifierSelections,
} from "@/lib/modifiers/nested-modifiers";

export function CustomizeDialog({
  item,
  open,
  onOpenChange,
  onConfirm,
  locale,
}: {
  item: MenuItemView | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (line: CartItem) => void;
  locale: string;
}) {
  const { t } = useT();
  const defaultVariant = item?.variants.find((v) => v.isDefault) ?? item?.variants[0] ?? null;
  const [variantId, setVariantId] = useState<string | null>(defaultVariant?.id ?? null);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [showChefModal, setShowChefModal] = useState(false);

  const reset = (next: MenuItemView | null) => {
    const v = next?.variants.find((x) => x.isDefault) ?? next?.variants[0] ?? null;
    setVariantId(v?.id ?? null);
    setAddonIds([]);
    setQty(1);
    setNote("");
  };

  useEffect(() => {
    if (open) reset(item);
  }, [open, item?.id]);

  // Extract all active groups (top-level and conditional/nested sub-groups)
  const activeGroups = useMemo(() => {
    if (!item) return [];
    return extractEffectiveAddonGroups(item, variantId, addonIds);
  }, [item, variantId, addonIds]);

  // Live pricing breakdown with added extras
  const pricing = useMemo(() => {
    if (!item) {
      return {
        basePricePaise: 0,
        variantPricePaise: 0,
        extrasPricePaise: 0,
        unitPricePaise: 0,
        totalPricePaise: 0,
        addedExtras: [],
      };
    }
    return calculateModifierPricing(item, variantId, addonIds, qty);
  }, [item, variantId, addonIds, qty]);

  // Validation
  const validation = useMemo(() => {
    if (!item) return { isValid: false, errors: [], missingRequiredGroups: [], groupStatuses: {} };
    return validateModifierSelections(item, variantId, addonIds);
  }, [item, variantId, addonIds]);

  if (!item) return null;

  const toggleAddon = (id: string, groupMax: number, groupAddonIds: string[]) => {
    setAddonIds((cur) => {
      if (cur.includes(id)) {
        return cur.filter((x) => x !== id);
      }
      const inGroup = cur.filter((x) => groupAddonIds.includes(x));
      if (groupMax === 1) {
        // Single select radio behavior inside group
        return [...cur.filter((x) => !groupAddonIds.includes(x)), id];
      }
      if (inGroup.length >= groupMax) {
        // If max limit reached, replace the first selected option in group
        const withoutFirst = inGroup.slice(1);
        const withoutGroup = cur.filter((x) => !groupAddonIds.includes(x));
        return [...withoutGroup, ...withoutFirst, id];
      }
      return [...cur, id];
    });
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (v) reset(item);
        onOpenChange(v);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-3xl bg-surface border-t border-amber-400/30 shadow-2xl pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {/* Header */}
          <div className="border-b border-border p-5 pb-3 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <Dialog.Title className="font-display text-2xl font-black text-fg">
                  {item.name}
                </Dialog.Title>
                <p className="mt-0.5 text-xs text-muted max-w-lg">{item.description}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-muted uppercase">Base Price</span>
                <p className="font-display text-lg font-black text-amber-600 dark:text-amber-400 tabular-nums">
                  {formatPaise(item.basePricePaise, { locale })}
                </p>
              </div>
            </div>

            {/* Stepper Breadcrumb / Multi-Level Header */}
            <div className="mt-3 flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold text-muted pb-1">
              {item.variants.length > 0 && (
                <>
                  <span className={`px-2 py-0.5 rounded-md ${variantId ? "bg-amber-100 text-amber-900 font-extrabold" : "bg-muted/20"}`}>
                    1. Size
                  </span>
                  <ChevronRight className="size-3 text-muted shrink-0" />
                </>
              )}
              {activeGroups.map((g, i) => {
                const stepNum = (item.variants.length > 0 ? 2 : 1) + i;
                const status = validation.groupStatuses[g.id];
                const isComplete = status?.isSatisfied;
                return (
                  <div key={g.id} className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-md ${
                        isComplete
                          ? "bg-emerald-100 text-emerald-900 font-extrabold"
                          : g.required
                            ? "bg-amber-100 text-amber-900 font-extrabold"
                            : "bg-muted/20 text-muted"
                      }`}
                    >
                      {stepNum}. {g.name}
                    </span>
                    {i < activeGroups.length - 1 && <ChevronRight className="size-3 text-muted shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scrollable Body with Multi-Level Groups */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Level 1: Choice of Size (Variants) */}
            {item.variants.length ? (
              <fieldset className="rounded-2xl border border-amber-300/40 bg-bg/50 p-4 shadow-2xs">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-border/50">
                  <legend className="text-sm font-black text-fg flex items-center gap-1.5">
                    <span>👑</span>
                    <span>{t("customize.size")}</span>
                  </legend>
                  <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800">
                    Required · Choose 1
                  </span>
                </div>
                <div className="space-y-2">
                  {item.variants.map((v) => {
                    const isSelected = variantId === v.id;
                    return (
                      <label
                        key={v.id}
                        className={`flex min-h-12 items-center justify-between rounded-xl px-3.5 py-2 transition-all cursor-pointer border ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/10 shadow-xs"
                            : "border-border/80 bg-surface hover:bg-bg"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="variant"
                            className="size-4 accent-amber-500"
                            checked={isSelected}
                            onChange={() => setVariantId(v.id)}
                            disabled={!v.available}
                          />
                          <div>
                            <span className={`text-sm ${isSelected ? "font-black text-fg" : "font-semibold text-muted"}`}>
                              {v.name}
                            </span>
                            {v.description && <p className="text-[11px] text-muted">{v.description}</p>}
                          </div>
                        </div>
                        <span className="tabular-nums font-mono text-sm font-black text-fg">
                          {formatPaise(v.pricePaise, { locale })}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}

            {/* Level 2 & Beyond: Nested Modifiers & Addon Groups */}
            {activeGroups.map((g, groupIndex) => {
              const groupAddonIds = g.addons.map((x) => x.id);
              const selectedCount = g.addons.filter((a) => addonIds.includes(a.id)).length;
              const isSingleChoice = g.maxSelect === 1;

              return (
                <fieldset
                  key={g.id}
                  className="rounded-2xl border border-amber-300/40 bg-bg/50 p-4 shadow-2xs space-y-3"
                  data-testid={`modifier-group-${g.id}`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <div>
                      <legend className="text-sm font-black text-fg flex items-center gap-1.5">
                        <span>✨</span>
                        <span>{g.name}</span>
                      </legend>
                      <p className="text-[11px] text-muted mt-0.5">
                        {isSingleChoice
                          ? "Select any 1 option"
                          : `Choose up to ${g.maxSelect} options${g.minSelect > 0 ? ` (min ${g.minSelect})` : ""}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          selectedCount >= (g.required ? Math.max(1, g.minSelect) : 0)
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-amber-100 text-amber-900 border border-amber-300"
                        }`}
                      >
                        {selectedCount} / {isSingleChoice ? 1 : g.maxSelect}
                      </span>
                      {g.required && (
                        <span className="rounded-full bg-rose-100 border border-rose-300 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-800">
                          Required
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {g.addons.map((a) => {
                      const isChecked = addonIds.includes(a.id);
                      return (
                        <div key={a.id} className="space-y-2">
                          <label
                            className={`flex min-h-12 items-center justify-between rounded-xl px-3.5 py-2 transition-all cursor-pointer border ${
                              isChecked
                                ? "border-amber-500 bg-amber-500/10 shadow-xs"
                                : "border-border/80 bg-surface hover:bg-bg"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type={isSingleChoice ? "radio" : "checkbox"}
                                name={`addon-group-${g.id}`}
                                className="size-4 accent-amber-500"
                                checked={isChecked}
                                onChange={() => toggleAddon(a.id, g.maxSelect, groupAddonIds)}
                                disabled={!a.available}
                              />
                              <div>
                                <span className={`text-sm ${isChecked ? "font-black text-fg" : "font-semibold text-muted"}`}>
                                  {a.name}
                                </span>
                                {a.description && <p className="text-[11px] text-muted">{a.description}</p>}
                              </div>
                            </div>
                            <span className="tabular-nums font-mono text-sm font-black text-fg">
                              {a.pricePaise > 0 ? `+${formatPaise(a.pricePaise, { locale })}` : "Free"}
                            </span>
                          </label>

                          {/* Nested Sub-Groups inside an Addon Option (e.g. Cheese Burst -> Choice of Cheese Blend) */}
                          {isChecked && a.nestedGroups && a.nestedGroups.length > 0 && (
                            <div className="ml-6 pl-3 border-l-2 border-amber-400 space-y-3 py-1">
                              {a.nestedGroups.map((subG) => (
                                <div key={subG.id} className="rounded-xl bg-surface/80 p-3 border border-border space-y-2">
                                  <div className="flex items-center justify-between text-xs font-bold text-fg">
                                    <span>↳ {subG.name}</span>
                                    <span className="text-[10px] text-muted">
                                      {subG.required ? "Required" : "Optional"}
                                    </span>
                                  </div>
                                  <div className="space-y-1.5">
                                    {subG.addons.map((subA) => {
                                      const isSubChecked = addonIds.includes(subA.id);
                                      return (
                                        <label
                                          key={subA.id}
                                          className={`flex min-h-10 items-center justify-between rounded-lg px-2.5 py-1.5 text-xs border cursor-pointer ${
                                            isSubChecked
                                              ? "border-amber-500 bg-amber-500/15 font-bold"
                                              : "border-border bg-bg"
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <input
                                              type={subG.maxSelect === 1 ? "radio" : "checkbox"}
                                              name={`sub-addon-${subG.id}`}
                                              className="size-3.5 accent-amber-500"
                                              checked={isSubChecked}
                                              onChange={() =>
                                                toggleAddon(
                                                  subA.id,
                                                  subG.maxSelect,
                                                  subG.addons.map((x) => x.id)
                                                )
                                              }
                                            />
                                            <span>{subA.name}</span>
                                          </div>
                                          <span>
                                            {subA.pricePaise > 0
                                              ? `+${formatPaise(subA.pricePaise, { locale })}`
                                              : "Free"}
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}

            {/* Special Instructions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-extrabold text-fg">
                  {t("customize.instructions")}
                </label>
                <button
                  type="button"
                  onClick={() => setShowChefModal(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 cursor-pointer"
                >
                  <ChefHat className="size-3.5" />
                  <span>Special Chef Request</span>
                </button>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 180))}
                placeholder={t("customize.instructionsPlaceholder")}
                className="min-h-18 w-full rounded-xl border border-border bg-surface p-3 text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Bottom Bar: Live Updated Total Price with Clear Visual Extras Indication */}
          <div className="border-t border-border bg-surface/95 backdrop-blur-md p-4 space-y-3 shrink-0 shadow-[0_-8px_20px_rgba(0,0,0,0.06)]">
            {/* Visual Indication of Added Extras */}
            {pricing.addedExtras.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs" data-testid="added-extras-container">
                <span className="shrink-0 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-950 dark:text-amber-300">
                  +₹{(pricing.extrasPricePaise / 100).toFixed(0)} Extras
                </span>
                <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto">
                  {pricing.addedExtras.map((extra) => (
                    <span
                      key={extra.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-bg border border-border px-2 py-0.5 text-[11px] font-bold text-fg tabular-nums"
                    >
                      <span>{extra.name}</span>
                      <span className="text-amber-600 dark:text-amber-400">
                        (+₹{(extra.pricePaise / 100).toFixed(0)})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Validation Banner if missing required options */}
            {!validation.isValid && validation.missingRequiredGroups.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-500/15 border border-amber-500/30 p-2 text-xs font-bold text-amber-950 dark:text-amber-200">
                <AlertCircle className="size-3.5 shrink-0 text-amber-600" />
                <span>Choose: {validation.missingRequiredGroups.join(", ")}</span>
              </div>
            )}

            {/* Price & Add to Cart Controls */}
            <div className="flex items-center justify-between gap-4">
              {/* Quantity Stepper */}
              <div className="flex items-center gap-2 rounded-2xl bg-bg border border-border p-1">
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-xl hover:bg-surface transition cursor-pointer"
                  aria-label={t("a11y.decreaseQty")}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-8 text-center tabular-nums font-mono font-black text-sm">{qty}</span>
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-xl hover:bg-surface transition cursor-pointer"
                  aria-label={t("a11y.increaseQty")}
                  onClick={() => setQty((q) => Math.min(20, q + 1))}
                >
                  <Plus className="size-4" />
                </button>
              </div>

              {/* Live Price Display & Confirm Button */}
              <div className="flex-1 flex items-center justify-end gap-3">
                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted block">
                    Total
                  </span>
                  <span
                    className="font-display text-xl font-black text-fg tabular-nums"
                    data-testid="customize-dialog-total-price"
                  >
                    {formatPaise(pricing.totalPricePaise, { locale })}
                  </span>
                </div>

                <Button
                  type="button"
                  size="lg"
                  disabled={!validation.isValid}
                  data-testid="customize-dialog-confirm-button"
                  onClick={() => {
                    const line: Omit<CartItem, "key"> = {
                      itemId: item.id,
                      variantId,
                      addonIds,
                      quantity: qty,
                      instructions: note.trim(),
                    };
                    onConfirm({ ...line, key: cartKey(line) });
                    onOpenChange(false);
                  }}
                  className={`rounded-2xl px-6 py-3 font-black text-stone-950 shadow-md transition-all active:scale-95 cursor-pointer ${
                    validation.isValid
                      ? "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 shadow-amber-500/25 border border-amber-300 hover:from-amber-600 hover:to-yellow-500"
                      : "bg-muted text-muted-foreground opacity-60 cursor-not-allowed"
                  }`}
                >
                  {validation.isValid
                    ? `Add ${qty > 1 ? `${qty} items` : "item"} · ${formatPaise(pricing.totalPricePaise, { locale })}`
                    : "Select Options"}
                </Button>
              </div>
            </div>
          </div>

          <CookingInstructionsModal
            isOpen={showChefModal}
            onClose={() => setShowChefModal(false)}
            itemName={item.name}
            initialInstructions={note}
            onSave={(instructions) => setNote(instructions)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
