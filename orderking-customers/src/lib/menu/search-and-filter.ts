import type { MenuItemView } from "@/lib/market-types";

export interface MenuSearchMatchResult {
  isMatch: boolean;
  nameMatches: boolean;
  descriptionMatches: boolean;
}

/**
 * Checks if a menu item matches the search query (case-insensitive across name and description).
 */
export function matchesMenuQuery(item: MenuItemView, query: string): MenuSearchMatchResult {
  const clean = query.trim().toLowerCase();
  if (!clean) {
    return { isMatch: true, nameMatches: false, descriptionMatches: false };
  }
  const nameMatches = item.name.toLowerCase().includes(clean);
  const descriptionMatches = Boolean(item.description && item.description.toLowerCase().includes(clean));
  return {
    isMatch: nameMatches || descriptionMatches,
    nameMatches,
    descriptionMatches,
  };
}

/**
 * Splits text into segments with match flags for visual highlighting.
 */
export function getHighlightedSegments(
  text: string,
  query: string
): Array<{ text: string; isMatch: boolean }> {
  const clean = query.trim();
  if (!clean || !text) {
    return [{ text, isMatch: false }];
  }
  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return parts.map((part) => ({
    text: part,
    isMatch: part.toLowerCase() === clean.toLowerCase(),
  }));
}

export interface MenuCategoryWithItems {
  id: string;
  name: string;
  items: MenuItemView[];
}

/**
 * Filters menu categories and items based on search query, veg-only filter, and bestseller filter.
 */
export function filterMenuCategories(
  categories: MenuCategoryWithItems[],
  query: string,
  options: { vegOnly?: boolean; bestsellersOnly?: boolean } = {}
): MenuCategoryWithItems[] {
  return categories
    .map((category) => {
      const filteredItems = category.items.filter((item) => {
        if (options.vegOnly && !item.veg) return false;
        if (options.bestsellersOnly && !item.bestseller) return false;
        if (query.trim() && !matchesMenuQuery(item, query).isMatch) return false;
        return true;
      });
      return {
        ...category,
        items: filteredItems,
      };
    })
    .filter((category) => category.items.length > 0);
}
