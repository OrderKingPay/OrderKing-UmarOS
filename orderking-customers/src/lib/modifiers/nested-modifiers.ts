import type { AddonGroupView, AddonView, MenuItemView, VariantView } from "@/lib/market-types";

export type AddedExtraItem = {
  id: string;
  name: string;
  pricePaise: number;
  groupName?: string;
};

export type ModifierPricingBreakdown = {
  basePricePaise: number;
  variantPricePaise: number;
  extrasPricePaise: number;
  unitPricePaise: number;
  totalPricePaise: number;
  addedExtras: AddedExtraItem[];
};

export type ModifierValidationResult = {
  isValid: boolean;
  errors: string[];
  missingRequiredGroups: string[];
  groupStatuses: Record<
    string,
    {
      name: string;
      currentCount: number;
      minSelect: number;
      maxSelect: number;
      isSatisfied: boolean;
      errorMessage?: string;
    }
  >;
};

/**
 * Traverses an item's top-level addon groups and recursively extracts nested sub-groups
 * triggered either by a selected variant or a selected addon option.
 */
export function extractEffectiveAddonGroups(
  item: MenuItemView,
  selectedVariantId: string | null,
  selectedAddonIds: string[]
): AddonGroupView[] {
  const effectiveGroups: AddonGroupView[] = [];
  const visitedGroupIds = new Set<string>();

  // 1. Variant-level nested groups (if variant has attached nested sub-groups)
  if (selectedVariantId) {
    const variant = item.variants.find((v) => v.id === selectedVariantId);
    const variantNested = (variant as any)?.nestedGroups as AddonGroupView[] | undefined;
    if (variantNested && Array.isArray(variantNested)) {
      for (const g of variantNested) {
        if (!visitedGroupIds.has(g.id)) {
          visitedGroupIds.add(g.id);
          effectiveGroups.push(g);
        }
      }
    }
  }

  // Helper to recursively collect from groups and options
  function collectFromGroup(group: AddonGroupView) {
    // Check if group is conditional on a parent option
    const parentOptionId = (group as any)?.parentOptionId as string | undefined;
    if (parentOptionId) {
      const isParentVariant = parentOptionId === selectedVariantId;
      const isParentAddon = selectedAddonIds.includes(parentOptionId);
      if (!isParentVariant && !isParentAddon) {
        return; // Skip inactive conditional group
      }
    }

    if (!visitedGroupIds.has(group.id)) {
      visitedGroupIds.add(group.id);
      effectiveGroups.push(group);
    }

    // Inspect nested sub-groups inside each selected addon option
    for (const addon of group.addons) {
      if (selectedAddonIds.includes(addon.id)) {
        const nested = (addon as any)?.nestedGroups as AddonGroupView[] | undefined;
        if (nested && Array.isArray(nested)) {
          for (const subGroup of nested) {
            collectFromGroup(subGroup);
          }
        }
      }
    }
  }

  // 2. Item-level top-level addon groups
  for (const group of item.addonGroups) {
    collectFromGroup(group);
  }

  return effectiveGroups;
}

/**
 * Calculates live pricing with itemized added extras breakdown.
 */
export function calculateModifierPricing(
  item: MenuItemView,
  selectedVariantId: string | null,
  selectedAddonIds: string[],
  quantity: number = 1
): ModifierPricingBreakdown {
  const qty = Math.max(1, quantity);
  const variant = selectedVariantId ? item.variants.find((v) => v.id === selectedVariantId) : null;
  const basePricePaise = item.basePricePaise;
  const variantPricePaise = variant ? variant.pricePaise : basePricePaise;

  // Collect all addons across both top-level and nested groups
  const allGroups = extractEffectiveAddonGroups(item, selectedVariantId, selectedAddonIds);
  const addonMap = new Map<string, { addon: AddonView; groupName: string }>();

  for (const group of allGroups) {
    for (const addon of group.addons) {
      addonMap.set(addon.id, { addon, groupName: group.name });
    }
  }

  const addedExtras: AddedExtraItem[] = [];
  let extrasPricePaise = 0;

  for (const addonId of selectedAddonIds) {
    const entry = addonMap.get(addonId);
    if (entry) {
      if (entry.addon.pricePaise > 0) {
        addedExtras.push({
          id: entry.addon.id,
          name: entry.addon.name,
          pricePaise: entry.addon.pricePaise,
          groupName: entry.groupName,
        });
      }
      extrasPricePaise += entry.addon.pricePaise;
    }
  }

  const unitPricePaise = variantPricePaise + extrasPricePaise;
  const totalPricePaise = unitPricePaise * qty;

  return {
    basePricePaise,
    variantPricePaise,
    extrasPricePaise,
    unitPricePaise,
    totalPricePaise,
    addedExtras,
  };
}

/**
 * Validates modifier selections against min/max selection bounds and required group constraints.
 */
export function validateModifierSelections(
  item: MenuItemView,
  selectedVariantId: string | null,
  selectedAddonIds: string[]
): ModifierValidationResult {
  const errors: string[] = [];
  const missingRequiredGroups: string[] = [];
  const groupStatuses: ModifierValidationResult["groupStatuses"] = {};

  // Variant requirement check
  if (item.variants.length > 0 && !selectedVariantId) {
    errors.push("Please select a size or variant.");
    missingRequiredGroups.push("Choice of Size");
  }

  const activeGroups = extractEffectiveAddonGroups(item, selectedVariantId, selectedAddonIds);

  for (const group of activeGroups) {
    const selectedInGroup = group.addons.filter((a) => selectedAddonIds.includes(a.id));
    const count = selectedInGroup.length;
    const min = group.required ? Math.max(1, group.minSelect) : group.minSelect;
    const max = group.maxSelect > 0 ? group.maxSelect : Infinity;

    let isSatisfied = true;
    let errorMessage: string | undefined;

    if (count < min) {
      isSatisfied = false;
      errorMessage =
        min === 1
          ? `Please select an option for '${group.name}'.`
          : `Please select at least ${min} options for '${group.name}' (current: ${count}).`;
      errors.push(errorMessage);
      missingRequiredGroups.push(group.name);
    } else if (count > max) {
      isSatisfied = false;
      errorMessage = `Maximum ${max} options allowed for '${group.name}' (selected: ${count}).`;
      errors.push(errorMessage);
    }

    groupStatuses[group.id] = {
      name: group.name,
      currentCount: count,
      minSelect: min,
      maxSelect: group.maxSelect,
      isSatisfied,
      errorMessage,
    };
  }

  return {
    isValid: errors.length === 0,
    errors,
    missingRequiredGroups,
    groupStatuses,
  };
}
