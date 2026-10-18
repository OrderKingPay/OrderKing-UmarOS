import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { MoneyText } from "@/components/money-text";
import { useT } from "@/components/use-t";
import { useVendor } from "@/components/use-vendor";
import { can } from "@/lib/rbac";
import { rupeesToPaise } from "@/lib/money";
import {
  duplicateItem,
  getMenu,
  getMenuItemUploadUrl,
  reorderCategories,
  saveAddon,
  saveCategory,
  saveItem,
  setAvailability,
  type ModifierGroup,
  type ModifierOption,
} from "@/lib/server/api-menu";
import { OneTapStockToggle } from "@/components/one-tap-stock-toggle";
import { FssaiExpiryBanner } from "@/components/fssai-expiry-banner";
import { orderKingSpark } from "@/lib/ai/order-king-spark";
import { toast } from "sonner";
import { supabaseCloud } from "@/lib/db-cloud";
import { LocalStockoutScheduler, formatStockoutRemaining } from "@/lib/menu/timed-stockout";
import { useKitchenRushStore } from "@/lib/orders/kitchen-rush";
import {
  CULINARY_STUDIO_LIGHTING_PRESETS,
  CulinaryStudioLightingStyle,
  matchDishCulinaryTaxonomy,
  generateProceduralCulinaryCanvas,
} from "@/lib/ai/culinary-photo-studio";
import { digitizeMenuFromOcr, type DigitizedMenuCatalog } from "@/lib/server/autonomous-onboarding";
import { DietaryAllergenEditor } from "@/components/dietary-allergen-editor";
import {
  Search,
  Flame,
  Sparkles,
  RotateCcw,
  Zap,
  CheckCircle2,
  XCircle,
  FileText,
  Lock,
  ShieldCheck,
  X,
  Plus,
  Clock,
  Camera,
  SlidersHorizontal,
  Trash2,
  Eye,
  ArrowUp,
  ArrowDown,
  Pencil,
  Download,
  Check,
  Layers,
  Receipt,
  Wand2,
  Image as ImageIcon,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/menu")({ component: MenuPage });

type MenuFilterType = "ALL" | "IN_STOCK" | "OUT_OF_STOCK" | "VEG_ONLY" | "NONVEG_EGG";

type StudioLightingSettings = {
  brightness: number; // -20 to +30 (default 8)
  contrast: number; // 0.90 to 1.35 (default 1.12)
  saturation: number; // 0.90 to 1.40 (default 1.16)
  warmth: number; // 0.95 to 1.12 (default 1.04)
};

const DEFAULT_STUDIO_LIGHTING: StudioLightingSettings = {
  brightness: 8,
  contrast: 1.12,
  saturation: 1.16,
  warmth: 1.04,
};

type DishEditorState = {
  id?: string;
  categoryId: string;
  name: string;
  description: string;
  diet: "VEG" | "NONVEG" | "EGG";
  recommended: boolean;
  prepMinutes: number;
  servingSize: string;
  imageUrl?: string | null;
  originalImageUrl?: string | null;
  enhancedImageUrl?: string | null;
  activePhotoMode: "original" | "enhanced";
  photoModified: boolean;
  photoAttested: boolean;
  addonIds: string[];
  variants: { id?: string; name: string; price: string }[];
  aiGenerated?: boolean;
  studioStyle?: CulinaryStudioLightingStyle;
  availableVisualAngles?: string[];
  modifierGroups: ModifierGroup[];
};

const QUICK_CATEGORY_TEMPLATES = [
  "Recommended & Combos",
  "Starters & Tandoor",
  "Main Course & Curries",
  "Biryani & Rice",
  "Indian Breads (Roti / Naan)",
  "Beverages & Desserts",
] as const;

const PORTION_PORTFOLIO_TAG_PILLS = [
  "Serves 1 (250g)",
  "Serves 1-2 (350g)",
  "Serves 2-3 (500g)",
  "Family Pack (Serves 4)",
  "🌱 Pure Veg",
  "🥑 Vegan",
  "🕉️ Jain Friendly",
  "🌙 Halal Certified",
  "🌾 Gluten-Free",
  "🥛 Contains Dairy / Ghee",
  "🥜 Contains Peanuts",
  "🌰 Contains Cashew / Tree Nuts",
  "🥚 Contains Egg",
  "🟡 Contains Mustard",
  "🌱 Contains Soy",
  "🌶️ Mild Spicy",
  "🌶️🌶️ Medium Spicy",
  "🌶️🌶️🌶️ Extra Spicy",
] as const;

/**
 * Standard Indian FSSAI Statutory Dietary Indicator (Green / Brown-Red / Amber dot in square)
 */
function FssaiDietBadge({ diet, showLabel = false }: { diet: string; showLabel?: boolean }) {
  const norm = diet?.toUpperCase() || "NONVEG";
  const isVeg = norm === "VEG" || norm === "VEGAN";
  const isEgg = norm === "EGG";

  const borderColor = isVeg
    ? "border-emerald-500"
    : isEgg
    ? "border-amber-500"
    : "border-rose-500";
  const dotColor = isVeg
    ? "bg-emerald-500"
    : isEgg
    ? "bg-amber-500"
    : "bg-rose-500";
  const labelText = isVeg ? "Veg" : isEgg ? "Egg" : "Non-Veg";

  return (
    <span className="inline-flex items-center gap-1.5" title={`FSSAI ${labelText} Classification`}>
      <span
        className={`inline-flex size-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] bg-black/30 ${borderColor}`}
      >
        <span className={`size-2 rounded-full ${dotColor}`} />
      </span>
      {showLabel && (
        <span
          className={`text-xs font-semibold ${
            isVeg ? "text-emerald-400" : isEgg ? "text-amber-400" : "text-rose-400"
          }`}
        >
          {labelText}
        </span>
      )}
    </span>
  );
}

/**
 * Client-side HTML5 Canvas Dish Photo Processor:
 * Performs 100% real pixel processing on the merchant's uploaded photograph:
 * - Standard 4:3 culinary aspect ratio center-crop framing (up to 800x600)
 * - Studio lighting enhancement: warm 3500K culinary color balance, contrast S-curve,
 *   brightness lift, and saturation adjustment without inventing or altering food items.
 */
async function processDishPhotoWithCanvas(
  sourceFileOrDataUrl: File | string,
  lighting: StudioLightingSettings = DEFAULT_STUDIO_LIGHTING
): Promise<{ originalDataUrl: string; enhancedDataUrl: string; enhancedBlob: Blob | null }> {
  const dataUrl =
    typeof sourceFileOrDataUrl === "string"
      ? sourceFileOrDataUrl
      : await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("Failed to read image file"));
          reader.readAsDataURL(sourceFileOrDataUrl);
        });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Failed to decode image for studio enhancement"));
    el.src = dataUrl;
  });

  // Compute standard 4:3 center crop on source image
  const targetAspect = 4 / 3;
  const srcW = img.naturalWidth || img.width || 800;
  const srcH = img.naturalHeight || img.height || 600;
  const srcAspect = srcW / srcH;

  let cropW = srcW;
  let cropH = srcH;
  let cropX = 0;
  let cropY = 0;

  if (srcAspect > targetAspect) {
    cropW = Math.round(srcH * targetAspect);
    cropX = Math.round((srcW - cropW) / 2);
  } else if (srcAspect < targetAspect) {
    cropH = Math.round(srcW / targetAspect);
    cropY = Math.round((srcH - cropH) / 2);
  }

  const outW = Math.min(800, cropW);
  const outH = Math.round(outW / targetAspect);

  // 1. Render Original (4:3 framed, unmodified pixels)
  const origCanvas = document.createElement("canvas");
  origCanvas.width = outW;
  origCanvas.height = outH;
  const origCtx = origCanvas.getContext("2d");
  if (!origCtx) {
    return { originalDataUrl: dataUrl, enhancedDataUrl: dataUrl, enhancedBlob: null };
  }
  origCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outW, outH);
  const originalDataUrl = origCanvas.toDataURL("image/jpeg", 0.88);

  // 2. Render Studio Enhanced (Warm Culinary Lighting, Contrast, Saturation & Clarity)
  const enhCanvas = document.createElement("canvas");
  enhCanvas.width = outW;
  enhCanvas.height = outH;
  const enhCtx = enhCanvas.getContext("2d");
  if (!enhCtx) {
    return { originalDataUrl, enhancedDataUrl: originalDataUrl, enhancedBlob: null };
  }
  enhCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

  const imageData = enhCtx.getImageData(0, 0, outW, outH);
  const data = imageData.data;
  const contrastFactor = lighting.contrast;
  const brightnessOffset = lighting.brightness;
  const saturationBoost = lighting.saturation;
  const warmthFactor = lighting.warmth;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Warm 3500K culinary lighting balance
    r = r * warmthFactor + brightnessOffset;
    g = g * (1 + (warmthFactor - 1) * 0.35) + brightnessOffset;
    b = b * (1 - (warmthFactor - 1) * 0.65) + brightnessOffset;

    // Contrast around midpoint 128
    r = (r - 128) * contrastFactor + 128;
    g = (g - 128) * contrastFactor + 128;
    b = (b - 128) * contrastFactor + 128;

    // Rec. 709 luma-preserving saturation boost
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = luma + (r - luma) * saturationBoost;
    g = luma + (g - luma) * saturationBoost;
    b = luma + (b - luma) * saturationBoost;

    data[i] = Math.max(0, Math.min(255, Math.round(r)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
    data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
  }

  enhCtx.putImageData(imageData, 0, 0);
  const enhancedDataUrl = enhCanvas.toDataURL("image/jpeg", 0.9);
  const enhancedBlob = await new Promise<Blob | null>((resolve) =>
    enhCanvas.toBlob((b) => resolve(b), "image/jpeg", 0.9)
  );

  return { originalDataUrl, enhancedDataUrl, enhancedBlob };
}

function MenuPage() {
  const t = useT();
  const vendor = useVendor();
  const qc = useQueryClient();
  const menu = useQuery({
    queryKey: ["menu", vendor.restaurantId],
    queryFn: () => getMenu({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId),
  });
  const isMenuLocked = Boolean(menu.data?.isMenuLocked);
  const menuStatus = menu.data?.menuStatus ?? "PENDING_VERIFICATION";
  const canEdit = vendor.role ? can(vendor.role, "menu.edit") && !isMenuLocked : false;
  const canAvail = vendor.role ? can(vendor.role, "availability.edit") && !isMenuLocked : false;

  const [catName, setCatName] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");

  const [addonName, setAddonName] = useState("");
  const [addonPrice, setAddonPrice] = useState("");
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
  const [editingAddonName, setEditingAddonName] = useState("");
  const [editingAddonPrice, setEditingAddonPrice] = useState("");

  const [selected, setSelected] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingAiPhoto, setGeneratingAiPhoto] = useState(false);
  const [activeStudioStyle, setActiveStudioStyle] = useState<CulinaryStudioLightingStyle>("warm_tandoor");
  const [savingDish, setSavingDish] = useState(false);
  const [editor, setEditor] = useState<DishEditorState | null>(null);
  const [studioLighting, setStudioLighting] = useState<StudioLightingSettings>(DEFAULT_STUDIO_LIGHTING);
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [rawOcrText, setRawOcrText] = useState("");
  const [digitizedCatalog, setDigitizedCatalog] = useState<DigitizedMenuCatalog | null>(null);
  const [importingOcr, setImportingOcr] = useState(false);
  const [showAllergenEditor, setShowAllergenEditor] = useState(false);

  const [quickDishInput, setQuickDishInput] = useState("");
  const [isAddingQuickDish, setIsAddingQuickDish] = useState(false);
  const [quickFeedback, setQuickFeedback] = useState<string | null>(null);

  const quickTaxonomy = useMemo(() => {
    if (!quickDishInput.trim()) return null;
    return matchDishCulinaryTaxonomy(quickDishInput.trim());
  }, [quickDishInput]);

  const [menuFilter, setMenuFilter] = useState<MenuFilterType>("ALL");
  const [searchFilter, setSearchFilter] = useState("");
  const kitchenRush = useKitchenRushStore();
  const kitchenRushMode = kitchenRush.isActive;
  const setKitchenRushMode = (on: boolean) => (on ? kitchenRush.activate(15) : kitchenRush.deactivate());

  const allItems = useMemo(() => menu.data?.items ?? [], [menu.data]);
  const timedOutOfStockItems = useMemo(
    () => allItems.filter((i) => i.availability === "temporarily_unavailable" && i.nextAvailableAt),
    [allItems]
  );

  // Local Time Scheduler & Supabase Timer for Timed Out-of-Stock Reactivation
  const schedulerRef = useRef<LocalStockoutScheduler | null>(null);

  useEffect(() => {
    if (!vendor.restaurantId) return;

    schedulerRef.current = new LocalStockoutScheduler(async (expiredIds) => {
      try {
        await setAvailability({
          data: {
            restaurantId: vendor.restaurantId,
            itemIds: expiredIds,
            status: "available",
            nextAvailableAt: null,
          },
        });
        toast.success(
          `⏰ Auto-Restored: ${expiredIds.length} timed out-of-stock dish(es) back IN STOCK!`,
        );
        void qc.invalidateQueries({ queryKey: ["menu"] });
        void qc.invalidateQueries({ queryKey: ["dashboard"] });
      } catch (err) {
        console.error("[TimedStockoutScheduler] Error auto-restoring dishes:", err);
      }
    });

    return () => {
      schedulerRef.current?.dispose();
      schedulerRef.current = null;
    };
  }, [vendor.restaurantId, qc]);

  useEffect(() => {
    if (!schedulerRef.current || !allItems.length) return;
    schedulerRef.current.sync(allItems);
  }, [allItems]);

  // Supabase Realtime subscription for live item_availability, items, and categories changes
  useEffect(() => {
    if (!vendor.restaurantId) return;

    const channel = supabaseCloud
      .channel(`partner-menu-sync-${vendor.restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "item_availability",
          filter: `restaurant_id=eq.${vendor.restaurantId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: ["menu"] });
          void qc.invalidateQueries({ queryKey: ["dashboard"] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items",
          filter: `restaurant_id=eq.${vendor.restaurantId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: ["menu"] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "categories",
          filter: `restaurant_id=eq.${vendor.restaurantId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: ["menu"] });
        },
      )
      .subscribe();

    return () => {
      void supabaseCloud.removeChannel(channel);
    };
  }, [vendor.restaurantId, qc]);
  const categories = useMemo(() => menu.data?.categories ?? [], [menu.data]);
  const inStockCount = useMemo(
    () => allItems.filter((i) => i.availability === "available").length,
    [allItems]
  );
  const outOfStockCount = useMemo(
    () => allItems.filter((i) => i.availability !== "available").length,
    [allItems]
  );
  const vegCount = useMemo(
    () =>
      allItems.filter((i) => {
        const d = i.diet?.toUpperCase();
        return d === "VEG" || d === "VEGAN";
      }).length,
    [allItems]
  );
  const nonVegEggCount = useMemo(
    () =>
      allItems.filter((i) => {
        const d = i.diet?.toUpperCase();
        return d !== "VEG" && d !== "VEGAN";
      }).length,
    [allItems]
  );

  const grouped = useMemo(() => {
    const cats = menu.data?.categories ?? [];
    const items = menu.data?.items ?? [];
    return cats
      .map((c) => {
        const catItems = items.filter((i) => {
          if (i.category_id !== c.id) return false;
          if (menuFilter === "IN_STOCK" && i.availability !== "available") return false;
          if (menuFilter === "OUT_OF_STOCK" && i.availability === "available") return false;
          if (menuFilter === "VEG_ONLY") {
            const d = i.diet?.toUpperCase();
            if (d !== "VEG" && d !== "VEGAN") return false;
          }
          if (menuFilter === "NONVEG_EGG") {
            const d = i.diet?.toUpperCase();
            if (d === "VEG" || d === "VEGAN") return false;
          }
          if (searchFilter.trim()) {
            const q = searchFilter.toLowerCase();
            const matchName = i.name.toLowerCase().includes(q);
            const matchDesc = i.description ? i.description.toLowerCase().includes(q) : false;
            const matchTags = i.tags ? i.tags.toLowerCase().includes(q) : false;
            return matchName || matchDesc || matchTags;
          }
          return true;
        });
        return { ...c, items: catItems };
      })
      .filter((c) => c.items.length > 0 || (!searchFilter.trim() && menuFilter === "ALL"));
  }, [menu.data, menuFilter, searchFilter]);

  async function bulk(status: "sold_out" | "available") {
    if (!selected.length) return;
    await setAvailability({
      data: { restaurantId: vendor.restaurantId, itemIds: selected, status },
    });
    setSelected([]);
    void qc.invalidateQueries({ queryKey: ["menu"] });
  }

  async function restoreAllOutOfStock() {
    const outOfStockIds = allItems.filter((i) => i.availability !== "available").map((i) => i.id);
    if (!outOfStockIds.length) return;
    await setAvailability({
      data: { restaurantId: vendor.restaurantId, itemIds: outOfStockIds, status: "available" },
    });
    void qc.invalidateQueries({ queryKey: ["menu"] });
  }

  async function handleMoveCategory(catId: string, direction: -1 | 1) {
    const orderedIds = categories.map((c) => c.id);
    const idx = orderedIds.indexOf(catId);
    const targetIdx = idx + direction;
    if (idx < 0 || targetIdx < 0 || targetIdx >= orderedIds.length) return;
    const swapped = [...orderedIds];
    const temp = swapped[idx];
    swapped[idx] = swapped[targetIdx];
    swapped[targetIdx] = temp;
    await reorderCategories({
      data: { restaurantId: vendor.restaurantId, orderedIds: swapped },
    });
    void qc.invalidateQueries({ queryKey: ["menu"] });
  }

  function exportCatalogCsv() {
    if (!allItems.length) return;
    const catMap = new Map(categories.map((c) => [c.id, c.name]));
    const rows = [
      [
        "Category",
        "Dish Name",
        "FSSAI Diet",
        "Prep Minutes",
        "Serving & Tags",
        "Variants & Prices (INR)",
        "Availability",
        "Recommended",
      ],
      ...allItems.map((item) => [
        catMap.get(item.category_id) ?? "Uncategorized",
        item.name,
        item.diet,
        String(item.prep_minutes ?? 20),
        item.tags || "",
        item.variants.map((v) => `${v.name}: Rs.${(v.pricePaise / 100).toFixed(2)}`).join(" | "),
        item.availability,
        item.recommended ? "Yes" : "No",
      ]),
    ];
    const csvContent = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orderking-menu-catalog-${vendor.restaurantId || "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const [applyingSparkItem, setApplyingSparkItem] = useState<string | null>(null);

  const sparkPricingRecommendations = useMemo(() => {
    if (!allItems.length) return [];
    return orderKingSpark.batchOptimizeMenuPricing(
      allItems.map((it) => ({
        id: it.id,
        name: it.name,
        pricePaise: it.variants[0]?.pricePaise ?? 0,
        category: categories.find((c) => c.id === it.category_id)?.name,
      }))
    );
  }, [allItems, categories]);

  const sparkComboRecommendations = useMemo(() => {
    if (!allItems.length) return [];
    return orderKingSpark.generateComboRecommendations(
      allItems.map((it) => ({
        id: it.id,
        name: it.name,
        pricePaise: it.variants[0]?.pricePaise ?? 0,
        category: categories.find((c) => c.id === it.category_id)?.name,
        diet: it.diet,
        prep_minutes: it.prep_minutes,
      }))
    );
  }, [allItems, categories]);

  async function handleApplySparkPrice(opt: ReturnType<typeof orderKingSpark.optimizeDishPricing>) {
    if (!vendor.restaurantId || applyingSparkItem) return;
    const targetItem = allItems.find((i) => i.id === opt.itemId);
    if (!targetItem) return;

    setApplyingSparkItem(opt.itemId);
    try {
      const updatedVariants = targetItem.variants.map((v, idx) => {
        if (idx === 0) {
          return { ...v, pricePaise: opt.recommendedPricePaise };
        }
        return v;
      });

      await saveItem({
        data: {
          restaurantId: vendor.restaurantId,
          id: targetItem.id,
          categoryId: targetItem.category_id,
          name: targetItem.name,
          description: targetItem.description,
          diet: (targetItem.diet as any) || "NONVEG",
          tags: targetItem.tags,
          recommended: targetItem.recommended,
          prepMinutes: targetItem.prep_minutes,
          imageUrl: targetItem.image_url,
          variants: updatedVariants.map((v) => ({
            id: v.id,
            name: v.name,
            pricePaise: v.pricePaise,
          })),
        },
      });

      toast.success(
        `Optimized ${opt.itemName} price to ₹${(opt.recommendedPricePaise / 100).toFixed(2)} (+${opt.projectedGmvLiftPercent}% GMV).`
      );
      void qc.invalidateQueries({ queryKey: ["menu"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update price");
    } finally {
      setApplyingSparkItem(null);
    }
  }

  async function handleApplySparkCombo(combo: ReturnType<typeof orderKingSpark.generateComboRecommendations>[number]) {
    if (!vendor.restaurantId || applyingSparkItem) return;
    setApplyingSparkItem(combo.id);

    try {
      let targetCatId = "";
      const existingCat = categories.find(
        (c) => c.name.toLowerCase().includes("combo") || c.name.toLowerCase().includes("recommended")
      );
      if (existingCat) {
        targetCatId = existingCat.id;
      } else {
        const catRes = await saveCategory({
          data: {
            restaurantId: vendor.restaurantId,
            name: "Recommended & Combos",
            sortOrder: 0,
          },
        });
        targetCatId = catRes.id;
      }

      await saveItem({
        data: {
          restaurantId: vendor.restaurantId,
          categoryId: targetCatId,
          name: combo.name,
          description: combo.description,
          diet: combo.diet,
          tags: "High Margin Combo · Value Meal · Serves 1-2",
          recommended: true,
          prepMinutes: combo.prepMinutes,
          variants: [
            {
              name: "Combo Meal",
              pricePaise: combo.bundlePricePaise,
            },
          ],
        },
      });

      toast.success(`✨ Added ${combo.name} to menu at ₹${(combo.bundlePricePaise / 100).toFixed(2)}!`);
      void qc.invalidateQueries({ queryKey: ["menu"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add combo");
    } finally {
      setApplyingSparkItem(null);
    }
  }

  function openNewDishDrawer(defaultCategoryId?: string) {
    const firstCatId = defaultCategoryId || categories[0]?.id || "";
    if (!firstCatId) return;
    setStudioLighting(DEFAULT_STUDIO_LIGHTING);
    setEditor({
      categoryId: firstCatId,
      name: "",
      description: "",
      diet: "VEG",
      recommended: false,
      prepMinutes: 20,
      servingSize: "Serves 1-2",
      imageUrl: null,
      originalImageUrl: null,
      enhancedImageUrl: null,
      activePhotoMode: "original",
      photoModified: false,
      photoAttested: false,
      aiGenerated: false,
      studioStyle: "warm_tandoor",
      availableVisualAngles: [],
      addonIds: [],
      variants: [{ name: "Regular", price: "" }],
      modifierGroups: [],
    });
  }

  function openEditDishDrawer(item: (typeof allItems)[number]) {
    const normalizedDiet = (item.diet?.toUpperCase() as "VEG" | "NONVEG" | "EGG") || "NONVEG";
    const taxonomy = matchDishCulinaryTaxonomy(item.name);
    setStudioLighting(DEFAULT_STUDIO_LIGHTING);
    setEditor({
      id: item.id,
      categoryId: item.category_id,
      name: item.name,
      description: item.description || "",
      diet:
        normalizedDiet === "VEG" || normalizedDiet === "NONVEG" || normalizedDiet === "EGG"
          ? normalizedDiet
          : "NONVEG",
      recommended: Boolean(item.recommended),
      prepMinutes: item.prep_minutes ?? 20,
      servingSize: item.tags || "",
      imageUrl: item.image_url,
      originalImageUrl: item.image_url,
      enhancedImageUrl: null,
      activePhotoMode: "original",
      photoModified: false,
      photoAttested: false,
      aiGenerated: false,
      studioStyle: "warm_tandoor",
      availableVisualAngles: [taxonomy.suggestedPhotoUrl, ...taxonomy.alternatePhotoUrls],
      addonIds: item.addonIds ?? [],
      variants:
        item.variants.length > 0
          ? item.variants.map((v) => ({
              id: v.id,
              name: v.name,
              price: String(v.pricePaise / 100),
            }))
          : [{ name: "Regular", price: "" }],
      modifierGroups: (item as any).modifierGroups ?? [],
    });
  }

  async function handleDishPhotoFileChange(file: File) {
    if (!editor) return;
    setUploadingImage(true);
    try {
      const processed = await processDishPhotoWithCanvas(file, studioLighting);
      let uploadedPublicUrl: string | null = null;
      try {
        const upload = await getMenuItemUploadUrl({
          data: {
            restaurantId: vendor.restaurantId,
            fileName: file.name,
            contentType: file.type || "image/jpeg",
            itemId: editor.id,
          },
        });
        if (upload.uploadUrl) {
          await fetch(upload.uploadUrl, {
            method: upload.method as string,
            headers: upload.headers as Record<string, string>,
            body: processed.enhancedBlob ?? file,
          });
          uploadedPublicUrl = upload.publicUrl;
        }
      } catch {
        // When cloud object storage credentials are not configured in local dev,
        // use the client-side HTML5 Canvas 4:3 processed JPEG data URL of the merchant's real photo.
        uploadedPublicUrl = null;
      }

      setEditor((cur) =>
        cur
          ? {
              ...cur,
              originalImageUrl: processed.originalDataUrl,
              enhancedImageUrl: processed.enhancedDataUrl,
              imageUrl: uploadedPublicUrl ?? processed.enhancedDataUrl,
              activePhotoMode: "enhanced",
              photoModified: true,
              photoAttested: false,
              aiGenerated: false,
            }
          : null
      );
    } catch (err) {
      console.error("Dish photo processing error:", err);
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleEnhanceExistingPhoto(customLighting?: StudioLightingSettings) {
    const sourceUrl = editor?.originalImageUrl || editor?.imageUrl;
    if (!sourceUrl) return;
    const activeLighting = customLighting ?? studioLighting;
    setUploadingImage(true);
    try {
      const processed = await processDishPhotoWithCanvas(sourceUrl, activeLighting);
      setEditor((cur) =>
        cur
          ? {
              ...cur,
              originalImageUrl: processed.originalDataUrl,
              enhancedImageUrl: processed.enhancedDataUrl,
              imageUrl: processed.enhancedDataUrl,
              activePhotoMode: "enhanced",
              photoModified: true,
              photoAttested: cur.aiGenerated ? true : false,
            }
          : null
      );
    } catch (err) {
      console.error("Studio enhancement error:", err);
    } finally {
      setUploadingImage(false);
    }
  }

  /**
   * 1-Tap King AI Automated Dish Photo Studio Plating:
   * Generates high-resolution studio-grade 4:3 culinary visual for the dish name,
   * sets both imageUrl & enhancedImageUrl, applies 3500K warm lighting, and pre-attests.
   */
  async function handleGenerateAiDishPhoto(
    overrideDishName?: string,
    overrideStyle?: CulinaryStudioLightingStyle,
    overridePhotoUrl?: string
  ) {
    const dishNameToUse = (overrideDishName || editor?.name || "Special Dish").trim();
    if (!dishNameToUse) return;

    setGeneratingAiPhoto(true);
    const styleToUse = overrideStyle || editor?.studioStyle || activeStudioStyle;
    const stylePreset = CULINARY_STUDIO_LIGHTING_PRESETS[styleToUse];
    const targetLighting: StudioLightingSettings = stylePreset.settings;
    setStudioLighting(targetLighting);

    try {
      const taxonomy = matchDishCulinaryTaxonomy(dishNameToUse);
      const chosenUrl = overridePhotoUrl || taxonomy.suggestedPhotoUrl;
      const allVisualAngles = [taxonomy.suggestedPhotoUrl, ...taxonomy.alternatePhotoUrls];

      let originalDataUrl = chosenUrl;
      let enhancedDataUrl = chosenUrl;

      try {
        const processed = await processDishPhotoWithCanvas(chosenUrl, targetLighting);
        originalDataUrl = processed.originalDataUrl;
        enhancedDataUrl = processed.enhancedDataUrl;
      } catch (canvasErr) {
        console.warn("Canvas cross-origin enhancement fallback, using direct visual:", canvasErr);
        if (!chosenUrl.startsWith("http")) {
          const procedural = generateProceduralCulinaryCanvas(
            dishNameToUse,
            editor?.diet || taxonomy.diet,
            styleToUse
          );
          originalDataUrl = procedural;
          enhancedDataUrl = procedural;
        } else {
          originalDataUrl = chosenUrl;
          enhancedDataUrl = chosenUrl;
        }
      }

      setEditor((cur) => {
        if (!cur) return null;
        return {
          ...cur,
          imageUrl: enhancedDataUrl,
          originalImageUrl: originalDataUrl,
          enhancedImageUrl: enhancedDataUrl,
          activePhotoMode: "enhanced",
          photoModified: true,
          photoAttested: true, // Auto-attested for King AI studio visuals
          aiGenerated: true,
          studioStyle: styleToUse,
          availableVisualAngles: allVisualAngles,
        };
      });
    } catch (err) {
      console.error("AI dish photo studio generation error:", err);
    } finally {
      setGeneratingAiPhoto(false);
    }
  }

  /**
   * 1-Tap Auto-Fill in Drawer:
   * Infers Category, FSSAI Diet, Sensory Description, Serving Tags, Prep SLA,
   * Benchmark Price, and plates an AI Studio Photo in a single tap!
   */
  function handleAutoFillDishDetails() {
    if (!editor || !editor.name.trim()) return;
    const rawName = editor.name.trim();
    const tax = matchDishCulinaryTaxonomy(rawName);

    const existingCat = categories.find(
      (c) => c.name.toLowerCase() === tax.category.toLowerCase()
    );
    const targetCatId = existingCat ? existingCat.id : editor.categoryId;

    const basePrice =
      editor.variants[0]?.price && Number(editor.variants[0].price) > 0
        ? editor.variants[0].price
        : String(tax.basePriceRupees);

    setEditor({
      ...editor,
      categoryId: targetCatId,
      diet: tax.diet,
      description: editor.description.trim() ? editor.description : tax.description,
      servingSize: editor.servingSize.trim() ? editor.servingSize : tax.servingSize,
      prepMinutes: tax.prepMinutes,
      variants: [{ name: "Regular", price: basePrice }],
      availableVisualAngles: [tax.suggestedPhotoUrl, ...tax.alternatePhotoUrls],
    });

    void handleGenerateAiDishPhoto(rawName, activeStudioStyle, tax.suggestedPhotoUrl);
  }

  /**
   * Express 1-Tap Menu Creator:
   * Instantly creates category if needed, assigns AI photo, tags diet, prices, and saves to menu.
   */
  async function handleQuickAddDish(dishNameOverride?: string) {
    const rawName = (dishNameOverride || quickDishInput).trim();
    if (!rawName || isAddingQuickDish) return;
    setIsAddingQuickDish(true);
    setQuickFeedback(null);

    try {
      const tax = matchDishCulinaryTaxonomy(rawName);

      // 1. Find or create matching category
      let targetCategoryId = "";
      const existingCat = categories.find(
        (c) => c.name.toLowerCase() === tax.category.toLowerCase()
      );
      if (existingCat) {
        targetCategoryId = existingCat.id;
      } else {
        const newCatRes = await saveCategory({
          data: {
            restaurantId: vendor.restaurantId,
            name: tax.category,
            sortOrder: categories.length,
          },
        });
        targetCategoryId = newCatRes.id;
      }

      // 2. Prepare 4:3 high-res photo
      let finalPhotoUrl = tax.suggestedPhotoUrl;
      try {
        const processed = await processDishPhotoWithCanvas(
          tax.suggestedPhotoUrl,
          CULINARY_STUDIO_LIGHTING_PRESETS.warm_tandoor.settings
        );
        finalPhotoUrl = processed.enhancedDataUrl || tax.suggestedPhotoUrl;
      } catch {
        finalPhotoUrl = tax.suggestedPhotoUrl;
      }

      // 3. Save dish item
      await saveItem({
        data: {
          restaurantId: vendor.restaurantId,
          categoryId: targetCategoryId,
          name: rawName,
          description: tax.description,
          diet: tax.diet,
          tags: tax.tags.join(" · "),
          recommended: false,
          prepMinutes: tax.prepMinutes,
          imageUrl: finalPhotoUrl,
          variants: [
            {
              name: "Regular",
              pricePaise: rupeesToPaise(tax.basePriceRupees),
            },
          ],
        },
      });

      setQuickDishInput("");
      setQuickFeedback(
        `✨ "${rawName}" added to "${tax.category}" with AI Studio photo & FSSAI ${tax.diet} badge!`
      );
      setTimeout(() => setQuickFeedback(null), 5000);
      void qc.invalidateQueries({ queryKey: ["menu"] });
    } catch (err) {
      console.error("Quick add dish failed:", err);
      setQuickFeedback("Failed to add dish. Please try again.");
    } finally {
      setIsAddingQuickDish(false);
    }
  }

  function handleDigitizeText() {
    if (!rawOcrText.trim()) return;
    const catalog = digitizeMenuFromOcr(rawOcrText);
    setDigitizedCatalog(catalog);
  }

  async function handleCommitDigitizedMenu() {
    if (!digitizedCatalog || !vendor.restaurantId || importingOcr) return;
    setImportingOcr(true);
    try {
      let createdDishes = 0;
      for (const cat of digitizedCatalog.categories) {
        let catId = "";
        const existingCat = categories.find((c) => c.name.toLowerCase() === cat.name.toLowerCase());
        if (existingCat) {
          catId = existingCat.id;
        } else {
          const res = await saveCategory({
            data: {
              restaurantId: vendor.restaurantId,
              name: cat.name,
              sortOrder: categories.length + cat.sortOrder,
            },
          });
          catId = res.id;
        }

        for (const item of cat.items) {
          await saveItem({
            data: {
              restaurantId: vendor.restaurantId,
              categoryId: catId,
              name: item.name,
              description: item.description,
              diet: item.diet === "VEG" || item.diet === "NONVEG" || item.diet === "EGG" ? item.diet : "VEG",
              tags: `${item.diet} · ${item.category}`,
              recommended: false,
              prepMinutes: item.prepMinutes,
              variants: [
                {
                  name: "Regular",
                  pricePaise: item.pricePaise,
                },
              ],
            },
          });
          createdDishes++;
        }
      }
      toast.success(`Successfully imported ${createdDishes} dishes from digitized menu!`);
      setOcrModalOpen(false);
      setRawOcrText("");
      setDigitizedCatalog(null);
      void qc.invalidateQueries({ queryKey: ["menu"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to import digitized menu");
    } finally {
      setImportingOcr(false);
    }
  }

  function handleOpenStudioForQuickDish(dishNameOverride?: string) {
    const rawName = (dishNameOverride || quickDishInput).trim();
    if (!rawName) return;
    const tax = matchDishCulinaryTaxonomy(rawName);
    const existingCat = categories.find(
      (c) => c.name.toLowerCase() === tax.category.toLowerCase()
    );
    const targetCatId = existingCat ? existingCat.id : categories[0]?.id || "";

    setStudioLighting(CULINARY_STUDIO_LIGHTING_PRESETS.warm_tandoor.settings);
    setEditor({
      categoryId: targetCatId,
      name: rawName,
      description: tax.description,
      diet: tax.diet,
      recommended: false,
      prepMinutes: tax.prepMinutes,
      servingSize: tax.servingSize,
      imageUrl: tax.suggestedPhotoUrl,
      originalImageUrl: tax.suggestedPhotoUrl,
      enhancedImageUrl: tax.suggestedPhotoUrl,
      activePhotoMode: "enhanced",
      photoModified: true,
      photoAttested: true,
      aiGenerated: true,
      studioStyle: "warm_tandoor",
      availableVisualAngles: [tax.suggestedPhotoUrl, ...tax.alternatePhotoUrls],
      addonIds: [],
      variants: [{ name: "Regular", price: String(tax.basePriceRupees) }],
      modifierGroups: [],
    });
  }

  async function handleGeneratePhotoForItem(item: (typeof allItems)[number]) {
    try {
      const tax = matchDishCulinaryTaxonomy(item.name);
      let photoUrl = tax.suggestedPhotoUrl;
      try {
        const processed = await processDishPhotoWithCanvas(
          tax.suggestedPhotoUrl,
          CULINARY_STUDIO_LIGHTING_PRESETS.warm_tandoor.settings
        );
        photoUrl = processed.enhancedDataUrl || tax.suggestedPhotoUrl;
      } catch {
        photoUrl = tax.suggestedPhotoUrl;
      }

      await saveItem({
        data: {
          restaurantId: vendor.restaurantId,
          id: item.id,
          categoryId: item.category_id,
          name: item.name,
          description: item.description || tax.description,
          diet: (item.diet as "VEG" | "NONVEG" | "EGG") || tax.diet,
          tags: item.tags || tax.tags.join(" · "),
          recommended: Boolean(item.recommended),
          prepMinutes: item.prep_minutes ?? tax.prepMinutes,
          imageUrl: photoUrl,
          addonIds: item.addonIds,
          variants: item.variants.map((v) => ({
            id: v.id,
            name: v.name,
            pricePaise: v.pricePaise,
          })),
        },
      });
      void qc.invalidateQueries({ queryKey: ["menu"] });
    } catch (err) {
      console.error("Failed to generate photo for item:", err);
    }
  }

  const baseSellingPrice = editor?.variants[0]?.price ?? "";
  const basePriceRupees = Number(baseSellingPrice) > 0 ? Number(baseSellingPrice) : 0;
  const gst5PercentRupees = Math.round(basePriceRupees * 5) / 100;
  const customerMenuTotalRupees = Math.round((basePriceRupees + gst5PercentRupees) * 100) / 100;

  const validVariants = useMemo(
    () =>
      (editor?.variants ?? []).filter(
        (v) => v.name.trim().length > 0 && v.price.trim().length > 0 && Number(v.price) > 0
      ),
    [editor?.variants]
  );
  const canSaveDish = Boolean(
    editor &&
      editor.name.trim().length > 0 &&
      editor.categoryId &&
      validVariants.length > 0 &&
      (!editor.photoModified || editor.photoAttested || editor.aiGenerated) &&
      !savingDish &&
      !uploadingImage &&
      !generatingAiPhoto
  );

  return (
    <VendorShell
      title={t("menu.title")}
      dataLabel={menu.data?.dataLabel ?? vendor.dataLabel}
      restaurantName={vendor.selected?.restaurantName}
    >
      {/* FSSAI Statutory Food Safety Regulatory Compliance Banner */}
      <FssaiExpiryBanner />

      {/* Statutory KYC Menu Locking Banner: Locked in PENDING_VERIFICATION */}
      {isMenuLocked && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2 text-amber-400 shrink-0">
                <Lock className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-block size-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                    MENU STATUS: LOCKED ({menuStatus})
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Statutory KYC Verification Pending
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Under Indian statutory regulations (FSSAI 14-digit registration, PAN, Bank IFSC, and GSTIN rules),
                  this restaurant's digital menu is locked in{" "}
                  <span className="font-mono font-semibold text-amber-300">PENDING_VERIFICATION</span> state.
                  Live customer catalogue display and item editing are locked until statutory KYC is approved.
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-500 text-white shrink-0 font-medium">
              <Link to="/onboarding">
                <ShieldCheck className="mr-1.5 size-4" /> Complete Statutory KYC
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Tier-1 Partner Menu Filter Bar & 1-Tap Stock Desk */}
      <div className="rounded-xl border border-border bg-surface-1 p-3.5 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search input to filter dishes by name/description in real time */}
          <div className="relative flex-1">
            <Search className="size-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search dishes by name, description, or portion tag (e.g. Butter Naan, Paneer, Biryani)..."
              className="w-full pl-9 pr-8 py-2 bg-background border border-border rounded-lg text-xs sm:text-sm placeholder:text-muted focus:outline-none focus:border-emerald-500 font-sans"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground text-xs"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Right: Quick Restore, Rush Mode, Export CSV & + New Dish */}
          <div className="flex items-center gap-2 flex-wrap">
            {canAvail && outOfStockCount > 0 && (
              <button
                type="button"
                onClick={() => void restoreAllOutOfStock()}
                title="1-Tap restore all sold-out items to in-stock"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center gap-1.5 font-mono"
              >
                <RotateCcw className="size-3.5" />
                Restore All ({outOfStockCount})
              </button>
            )}

            {canAvail && (
              <button
                type="button"
                onClick={() => setKitchenRushMode(!kitchenRushMode)}
                title="Toggle large tactile hit-targets for kitchen rush hours"
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 font-mono ${
                  kitchenRushMode
                    ? "bg-amber-500 text-black border-amber-400 shadow-md font-extrabold"
                    : "border-border bg-surface-2 text-muted hover:text-foreground"
                }`}
              >
                <Flame className="size-3.5" />
                {kitchenRushMode ? "Rush Mode ON" : "Rush Mode"}
              </button>
            )}

            {allItems.length > 0 && (
              <button
                type="button"
                onClick={exportCatalogCsv}
                title="Download complete menu catalog & pricing as CSV for POS / accounting"
                className="px-2.5 py-1.5 rounded-lg border border-border bg-surface-2 text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1.5 font-mono"
              >
                <Download className="size-3.5" />
                Export CSV
              </button>
            )}

            {canEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOcrModalOpen(true)}
                className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
                title="Digitize physical paper menu or raw dish text into structured catalog"
              >
                <FileText className="mr-1 size-3.5 text-emerald-400" />
                OCR / Bulk Text Import
              </Button>
            )}

            {canEdit && categories.length > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={() => openNewDishDrawer()}
                className="bg-chili hover:bg-chili/90 text-white font-bold text-xs"
              >
                <Plus className="mr-1 size-4" /> + New Dish
              </Button>
            )}
          </div>
        </div>

        {/* Partner Filter Pills: All Items, In Stock, Out of Stock, Veg Only, Non-Veg / Egg */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/60 font-mono">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1 mr-1">
            <Zap className="size-3.5 text-amber-500" />
            Filter Menu:
          </span>

          <button
            type="button"
            onClick={() => setMenuFilter("ALL")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
              menuFilter === "ALL"
                ? "bg-slate-800 text-white border border-slate-600 shadow-xs"
                : "bg-surface-2 text-muted hover:text-foreground border border-transparent"
            }`}
          >
            All Items ({allItems.length})
          </button>

          <button
            type="button"
            onClick={() => setMenuFilter("IN_STOCK")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              menuFilter === "IN_STOCK"
                ? "bg-emerald-950 text-emerald-300 border border-emerald-500/60 shadow-xs"
                : "bg-surface-2 text-emerald-400 hover:bg-emerald-500/10 border border-transparent"
            }`}
          >
            <CheckCircle2 className="size-3.5" />
            In Stock ({inStockCount})
          </button>

          <button
            type="button"
            onClick={() => setMenuFilter("OUT_OF_STOCK")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              menuFilter === "OUT_OF_STOCK"
                ? "bg-rose-950 text-rose-300 border border-rose-500/60 shadow-xs"
                : outOfStockCount > 0
                ? "text-rose-400 bg-rose-500/10 border border-rose-500/30"
                : "bg-surface-2 text-muted hover:text-foreground border border-transparent"
            }`}
          >
            <XCircle className="size-3.5" />
            Out of Stock ({outOfStockCount})
          </button>

          <button
            type="button"
            onClick={() => setMenuFilter("VEG_ONLY")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              menuFilter === "VEG_ONLY"
                ? "bg-emerald-950 text-emerald-300 border border-emerald-500/60 shadow-xs"
                : "bg-surface-2 text-slate-300 hover:text-white border border-transparent"
            }`}
          >
            <FssaiDietBadge diet="VEG" />
            Veg Only ({vegCount})
          </button>

          <button
            type="button"
            onClick={() => setMenuFilter("NONVEG_EGG")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              menuFilter === "NONVEG_EGG"
                ? "bg-rose-950 text-rose-200 border border-rose-500/60 shadow-xs"
                : "bg-surface-2 text-slate-300 hover:text-white border border-transparent"
            }`}
          >
            <FssaiDietBadge diet="NONVEG" />
            Non-Veg / Egg ({nonVegEggCount})
          </button>
        </div>
      </div>

      {/* Timed Out-of-Stock Status & Automated Inventory Replenishment Banner */}
      {timedOutOfStockItems.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-300 font-mono">
          <div className="flex items-center gap-2">
            <Clock className="size-4 shrink-0 text-amber-400" />
            <div>
              <span className="font-bold">
                {timedOutOfStockItems.length} Timed Out-of-Stock Dish(es) Active
              </span>
              <span className="text-[11px] opacity-85 ml-2 font-sans hidden sm:inline">
                (Automated Inventory Replenishment: automatically reactivates dishes when scheduled timer expires)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {timedOutOfStockItems.slice(0, 3).map((it) => (
              <span
                key={it.id}
                className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-700/60 text-[11px]"
              >
                {it.name}: {formatStockoutRemaining(it.nextAvailableAt)}
              </span>
            ))}
            {timedOutOfStockItems.length > 3 && (
              <span className="text-[11px] opacity-75">+{timedOutOfStockItems.length - 3} more</span>
            )}
          </div>
        </div>
      )}

      {/* Spark AI Dish Pricing & High-Margin Combo Engine */}
      {canEdit && (sparkPricingRecommendations.length > 0 || sparkComboRecommendations.length > 0) && (
        <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/25 via-slate-900/90 to-amber-950/25 p-4 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <Sparkles className="size-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Spark AI Dish Pricing &amp; High-Margin Combo Engine</h3>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 uppercase">
                    GMV &amp; Margin Optimization
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Data-driven price benchmarking and meal bundles calibrated to expand Average Order Value (AOV), merchant earnings, and platform commission.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 1. Smart Dish Price Optimization */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-amber-400">
                  <TrendingUp className="size-3.5" /> Price Benchmarking Opportunities ({sparkPricingRecommendations.length})
                </span>
                <span className="text-[11px] text-slate-400 font-mono">28% Standard Commission Tier</span>
              </div>

              {sparkPricingRecommendations.length === 0 ? (
                <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-400">
                  All active dishes are currently priced at optimal corridor benchmarks.
                </div>
              ) : (
                <div className="space-y-2">
                  {sparkPricingRecommendations.slice(0, 3).map((opt) => (
                    <div
                      key={opt.itemId}
                      className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-xs text-white">{opt.itemName}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            {opt.commercialRationale}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono font-bold text-emerald-400">
                            ₹{(opt.currentPricePaise / 100).toFixed(0)} → ₹{(opt.recommendedPricePaise / 100).toFixed(0)}
                          </div>
                          <div className="text-[10px] font-mono text-emerald-300 font-semibold">
                            +{opt.projectedGmvLiftPercent}% GMV Lift
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                        <div className="text-slate-400">
                          Est. Weekly GMV: <strong className="text-white">+₹{(opt.estimatedWeeklyGmvIncreasePaise / 100).toFixed(0)}</strong>
                          {" · "}
                          Platform Comm: <strong className="text-amber-400">+₹{(opt.estimatedWeeklyFounderCommissionIncreasePaise / 100).toFixed(0)}</strong>
                        </div>
                        <Button
                          size="sm"
                          type="button"
                          disabled={applyingSparkItem === opt.itemId}
                          onClick={() => void handleApplySparkPrice(opt)}
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold font-sans px-3"
                        >
                          {applyingSparkItem === opt.itemId ? "Applying..." : `Apply Price (₹${(opt.recommendedPricePaise / 100).toFixed(0)})`}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. High-Converting Meal Combos */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-amber-400">
                  <Layers className="size-3.5" /> High-Converting Meal Bundles ({sparkComboRecommendations.length})
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Boosts Cart AOV +24-38%</span>
              </div>

              {sparkComboRecommendations.length === 0 ? (
                <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-400">
                  Add more dishes to your menu to generate automated meal bundles.
                </div>
              ) : (
                <div className="space-y-2">
                  {sparkComboRecommendations.map((combo) => (
                    <div
                      key={combo.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 flex flex-col justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <FssaiDietBadge diet={combo.diet} />
                            <span className="font-semibold text-xs text-white">{combo.name}</span>
                          </div>
                          <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-mono font-bold">
                            Save {combo.customerSavingsPercent}%
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 mt-1">
                          Includes: {combo.includedItemNames.join(" + ")}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {combo.commercialRationale}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                        <div className="text-slate-300">
                          Bundle Price: <strong className="text-white text-xs">₹{(combo.bundlePricePaise / 100).toFixed(0)}</strong>
                          <span className="line-through text-slate-500 ml-1">₹{(combo.standaloneSumPaise / 100).toFixed(0)}</span>
                          {" · "}
                          Comm: <strong className="text-amber-400">₹{(combo.founderCommissionPaise / 100).toFixed(0)}</strong>
                        </div>
                        <Button
                          size="sm"
                          type="button"
                          disabled={applyingSparkItem === combo.id}
                          onClick={() => void handleApplySparkCombo(combo)}
                          className="h-7 text-xs bg-amber-600 hover:bg-amber-500 text-white font-semibold font-sans px-3"
                        >
                          {applyingSparkItem === combo.id ? "Adding..." : "+ Add Combo to Menu"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Self-Service Category Builder & Standard Templates */}
      {canEdit ? (
        <div className="rounded-xl border border-border bg-surface-1 p-3.5 space-y-2.5">
          <form
            className="flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!catName.trim()) return;
              await saveCategory({
                data: {
                  restaurantId: vendor.restaurantId,
                  name: catName,
                  sortOrder: categories.length,
                },
              });
              setCatName("");
              void qc.invalidateQueries({ queryKey: ["menu"] });
            }}
          >
            <Input
              placeholder={t("menu.addCategory")}
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
            />
            <Button type="submit">{t("menu.addCategory")}</Button>
          </form>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-muted flex items-center gap-1">
              <Layers className="size-3" /> Standard Categories:
            </span>
            {QUICK_CATEGORY_TEMPLATES.map((tpl) => {
              const exists = categories.some(
                (c) => c.name.toLowerCase() === tpl.toLowerCase()
              );
              return (
                <button
                  key={tpl}
                  type="button"
                  disabled={exists}
                  onClick={async () => {
                    if (exists) return;
                    await saveCategory({
                      data: {
                        restaurantId: vendor.restaurantId,
                        name: tpl,
                        sortOrder: categories.length,
                      },
                    });
                    void qc.invalidateQueries({ queryKey: ["menu"] });
                  }}
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${
                    exists
                      ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-400 cursor-default"
                      : "border-border bg-surface-2 text-slate-300 hover:border-amber-500/50 hover:text-white"
                  }`}
                >
                  {exists ? `✓ ${tpl}` : `+ ${tpl}`}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Fast Item Creator & Studio Visuals */}
      {canEdit && (
        <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-surface-2 border border-border text-foreground">
                <Sparkles className="size-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Fast Item Creator &amp; Studio Visuals</h3>
                  <span className="rounded-full bg-surface-2 border border-border px-2 py-0.5 text-[10px] font-mono font-bold text-muted uppercase">
                    Catalog Engine
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Type any dish name. Automatically infers category, FSSAI diet classification, corridor benchmark pricing, and studio 4:3 culinary visual.
                </p>
              </div>
            </div>
            {quickFeedback && (
              <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-lg">
                {quickFeedback}
              </span>
            )}
          </div>

          {/* Quick Input Bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Wand2 className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={quickDishInput}
                onChange={(e) => setQuickDishInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && quickDishInput.trim() && !isAddingQuickDish) {
                    e.preventDefault();
                    void handleQuickAddDish();
                  }
                }}
                placeholder="Create dish (e.g. Paneer Tikka, Chicken Biryani, Butter Naan, Masala Dosa)..."
                className="w-full pl-9 pr-8 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-sans shadow-inner"
              />
              {quickDishInput && (
                <button
                  type="button"
                  onClick={() => setQuickDishInput("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <Button
              type="button"
              disabled={!quickDishInput.trim() || isAddingQuickDish}
              onClick={() => void handleQuickAddDish()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 shadow-sm"
            >
              <Zap className="mr-1.5 size-3.5" />
              {isAddingQuickDish ? "Adding to Menu..." : "Add to Menu"}
            </Button>

            <Button
              type="button"
              variant="secondary"
              disabled={!quickDishInput.trim()}
              onClick={() => handleOpenStudioForQuickDish()}
              className="text-xs shrink-0"
            >
              <SlidersHorizontal className="mr-1.5 size-3.5 text-amber-400" />
              Customize in Studio
            </Button>
          </div>

          {/* Live AI Intelligence Pill when user is typing */}
          {quickTaxonomy && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-slate-950/80 p-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <FssaiDietBadge diet={quickTaxonomy.diet} showLabel />
                  {quickDishInput.trim()}
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-300">
                  Category: <strong className="text-amber-300">{quickTaxonomy.category}</strong>
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-300">
                  Suggested Price: <strong className="text-emerald-400">₹{quickTaxonomy.basePriceRupees}</strong>
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-300">
                  Prep: <strong className="text-slate-200">{quickTaxonomy.prepMinutes} mins</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-7 w-9 shrink-0 overflow-hidden rounded border border-amber-500/40 bg-black">
                  <img
                    src={quickTaxonomy.suggestedPhotoUrl}
                    alt="AI Plate Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="text-[11px] font-mono text-amber-400">Studio 4:3 Visual Ready</span>
              </div>
            </div>
          )}

          {/* 1-Tap Popular Signature Creations Pills */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Popular 1-Tap Signature Creations (Tap to add instantly with AI Photo):</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { name: "Paneer Tikka", diet: "VEG", price: 289 },
                { name: "Chicken Dum Biryani", diet: "NONVEG", price: 349 },
                { name: "Murgh Makhani (Butter Chicken)", diet: "NONVEG", price: 389 },
                { name: "Dal Makhani", diet: "VEG", price: 269 },
                { name: "Paneer Butter Masala", diet: "VEG", price: 299 },
                { name: "Butter Naan", diet: "VEG", price: 59 },
                { name: "Crispy Masala Dosa", diet: "VEG", price: 169 },
                { name: "Veg Hakka Noodles", diet: "VEG", price: 219 },
                { name: "Amritsari Chole Bhature", diet: "VEG", price: 199 },
                { name: "Hot Shahi Gulab Jamun", diet: "VEG", price: 99 },
                { name: "Cutting Masala Chai", diet: "VEG", price: 49 },
              ].map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  disabled={isAddingQuickDish}
                  onClick={() => void handleQuickAddDish(preset.name)}
                  className="rounded-full border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-xs text-slate-300 hover:border-amber-500/60 hover:bg-amber-950/30 hover:text-white transition flex items-center gap-1.5 group font-medium"
                >
                  <FssaiDietBadge diet={preset.diet} />
                  <span>{preset.name}</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">₹{preset.price}</span>
                  <span className="text-[10px] text-amber-400 group-hover:inline opacity-70">+ 1-Tap</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {canAvail && selected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3">
          <span className="text-xs font-mono font-bold text-amber-300 mr-2">
            {selected.length} Dish(es) Selected:
          </span>
          <Button variant="secondary" size="sm" onClick={() => void bulk("sold_out")}>
            {t("menu.bulkSoldOut")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void bulk("available")}>
            {t("menu.bulkAvailable")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
            Clear Selection
          </Button>
        </div>
      ) : null}

      {grouped.length === 0 ? (
        <Card className="text-sm text-muted">{t("menu.noItems")}</Card>
      ) : (
        grouped.map((cat) => {
          const catIndex = categories.findIndex((c) => c.id === cat.id);
          const isEditingCat = editingCatId === cat.id;

          return (
            <section key={cat.id} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isEditingCat && canEdit ? (
                    <form
                      className="flex items-center gap-1.5"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!editingCatName.trim()) return;
                        await saveCategory({
                          data: {
                            restaurantId: vendor.restaurantId,
                            id: cat.id,
                            name: editingCatName.trim(),
                            sortOrder: cat.sort_order,
                          },
                        });
                        setEditingCatId(null);
                        void qc.invalidateQueries({ queryKey: ["menu"] });
                      }}
                    >
                      <Input
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        className="h-8 text-sm w-52"
                      />
                      <Button type="submit" size="sm">
                        <Check className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingCatId(null)}
                      >
                        ✕
                      </Button>
                    </form>
                  ) : (
                    <>
                      <h2 className="font-display text-xl">{cat.name}</h2>
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-mono text-muted">
                        {cat.items.length}
                      </span>
                      {canEdit && (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCatId(cat.id);
                              setEditingCatName(cat.name);
                            }}
                            title="Rename category"
                            className="rounded p-1 text-muted hover:bg-surface-2 hover:text-white transition"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={catIndex <= 0}
                            onClick={() => void handleMoveCategory(cat.id, -1)}
                            title="Move category up"
                            className="rounded p-1 text-muted hover:bg-surface-2 hover:text-white disabled:opacity-30 transition"
                          >
                            <ArrowUp className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={catIndex < 0 || catIndex >= categories.length - 1}
                            onClick={() => void handleMoveCategory(cat.id, 1)}
                            title="Move category down"
                            className="rounded p-1 text-muted hover:bg-surface-2 hover:text-white disabled:opacity-30 transition"
                          >
                            <ArrowDown className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
                {canEdit ? (
                  <Button variant="secondary" onClick={() => openNewDishDrawer(cat.id)}>
                    <Plus className="mr-1 size-4" /> {t("menu.addItem")}
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-2">
                {cat.items.map((item) => (
                  <Card
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3.5 transition hover:border-slate-700"
                  >
                    <label className="flex min-h-11 items-start gap-3 flex-1 min-w-[240px]">
                      {canAvail ? (
                        <input
                          type="checkbox"
                          className="mt-1.5 size-4"
                          checked={selected.includes(item.id)}
                          onChange={(e) =>
                            setSelected((cur) =>
                              e.target.checked ? [...cur, item.id] : cur.filter((id) => id !== item.id)
                            )
                          }
                        />
                      ) : null}
                      {item.image_url ? (
                        <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-2 relative group">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : canEdit ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void handleGeneratePhotoForItem(item);
                          }}
                          className="h-16 w-20 shrink-0 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 p-1 flex flex-col items-center justify-center gap-0.5 text-amber-400 text-[10px] font-bold text-center transition cursor-pointer"
                          title="Generate Studio Photo with King AI (1-Tap)"
                        >
                          <Sparkles className="size-4 text-amber-400" />
                          <span>+ AI Photo</span>
                        </button>
                      ) : null}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 font-medium">
                          <FssaiDietBadge diet={item.diet} />
                          <span>{item.name}</span>
                          <span className="text-[11px] font-mono uppercase text-muted">
                            {item.diet}
                          </span>
                          {item.recommended ? (
                            <span className="rounded-full bg-chili/15 border border-chili/30 px-2 py-0.5 text-[11px] font-semibold text-chili">
                              {t("menu.recommended")}
                            </span>
                          ) : null}
                          {item.prep_minutes ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-mono text-muted">
                              <Clock className="size-3" /> {item.prep_minutes} mins
                            </span>
                          ) : null}
                          {item.tags ? (
                            <div className="flex flex-wrap items-center gap-1">
                              {item.tags.split("·").map((t, idx) => {
                                const cleanTag = t.trim();
                                if (!cleanTag) return null;
                                const isAllergen = cleanTag.includes("Contains") || cleanTag.includes("Dairy") || cleanTag.includes("Nuts") || cleanTag.includes("Gluten");
                                return (
                                  <span
                                    key={idx}
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                      isAllergen
                                        ? "bg-amber-950/40 border border-amber-500/30 text-amber-300 font-mono"
                                        : "bg-surface-2 border border-border/50 text-muted"
                                    }`}
                                  >
                                    {cleanTag}
                                  </span>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                        {item.description ? (
                          <div className="text-sm text-muted line-clamp-2">{item.description}</div>
                        ) : null}
                        <div className="mt-1 flex flex-wrap gap-2 text-sm">
                          {item.variants.map((v) => (
                            <span
                              key={v.id}
                              className="rounded-full bg-surface-2 border border-border/60 px-2.5 py-0.5 text-xs font-medium"
                            >
                              {v.name}: <MoneyText paise={v.pricePaise} />
                            </span>
                          ))}
                        </div>
                      </div>
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {canAvail ? (
                        <OneTapStockToggle
                          itemId={item.id}
                          itemName={item.name}
                          availability={item.availability as any}
                          nextAvailableAt={item.nextAvailableAt}
                          restaurantId={vendor.restaurantId}
                          size={kitchenRushMode ? "lg" : "md"}
                        />
                      ) : (
                        <span className="text-xs text-muted">
                          {item.availability === "available" ? "In Stock" : t("menu.soldOut")}
                        </span>
                      )}
                      {canEdit ? (
                        <>
                          <Button
                            variant="ghost"
                            onClick={() =>
                              void duplicateItem({
                                data: { restaurantId: vendor.restaurantId, itemId: item.id },
                              }).then(() => qc.invalidateQueries({ queryKey: ["menu"] }))
                            }
                          >
                            {t("menu.duplicate")}
                          </Button>
                          <Button variant="secondary" onClick={() => openEditDishDrawer(item)}>
                            {t("menu.edit")}
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          );
        })
      )}

      {/* Self-Service Add-ons Manager (Create & Inline Edit Add-on Name/Price) */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg">{t("menu.addons")}</h3>
          <span className="text-xs text-muted font-mono">
            {(menu.data?.addons ?? []).length} Configured
          </span>
        </div>
        <ul className="text-sm divide-y divide-line">
          {(menu.data?.addons ?? []).map((a) => {
            const isEditingThisAddon = editingAddonId === a.id;
            return (
              <li key={a.id} className="flex items-center justify-between gap-2 py-2.5">
                {isEditingThisAddon && canEdit ? (
                  <form
                    className="flex flex-1 items-center gap-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!editingAddonName.trim() || !editingAddonPrice) return;
                      await saveAddon({
                        data: {
                          restaurantId: vendor.restaurantId,
                          id: a.id,
                          name: editingAddonName.trim(),
                          pricePaise: rupeesToPaise(Number(editingAddonPrice)),
                        },
                      });
                      setEditingAddonId(null);
                      void qc.invalidateQueries({ queryKey: ["menu"] });
                    }}
                  >
                    <Input
                      value={editingAddonName}
                      onChange={(e) => setEditingAddonName(e.target.value)}
                      className="h-9 text-xs flex-1"
                    />
                    <Input
                      inputMode="decimal"
                      value={editingAddonPrice}
                      onChange={(e) => setEditingAddonPrice(e.target.value)}
                      className="h-9 text-xs w-28"
                    />
                    <Button type="submit" size="sm">
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingAddonId(null)}
                    >
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <>
                    <span className="font-medium">{a.name}</span>
                    <div className="flex items-center gap-3">
                      <MoneyText paise={a.pricePaise} />
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAddonId(a.id);
                            setEditingAddonName(a.name);
                            setEditingAddonPrice(String(a.pricePaise / 100));
                          }}
                          className="rounded p-1 text-xs text-muted hover:bg-surface-2 hover:text-white transition flex items-center gap-1"
                          title="Edit add-on name or price"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
        {canEdit ? (
          <form
            className="grid gap-2 md:grid-cols-[1fr_120px_auto]"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!addonName.trim() || !addonPrice) return;
              await saveAddon({
                data: {
                  restaurantId: vendor.restaurantId,
                  name: addonName,
                  pricePaise: rupeesToPaise(Number(addonPrice)),
                },
              });
              setAddonName("");
              setAddonPrice("");
              void qc.invalidateQueries({ queryKey: ["menu"] });
            }}
          >
            <Input
              placeholder={t("menu.addAddon")}
              value={addonName}
              onChange={(e) => setAddonName(e.target.value)}
            />
            <Input
              inputMode="decimal"
              placeholder={t("menu.price")}
              value={addonPrice}
              onChange={(e) => setAddonPrice(e.target.value)}
            />
            <Button type="submit">{t("menu.addAddon")}</Button>
          </form>
        ) : null}
      </Card>

      {/* Tier-1 Grade Dish Studio Modal / Slide-Over Drawer */}
      {editor ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dish-studio-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditor(null);
          }}
        >
          <div className="flex h-full w-full max-w-2xl flex-col border-l border-slate-800 bg-slate-950 text-slate-100 shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                    Tier-1 Grade Dish Studio
                  </span>
                  <FssaiDietBadge diet={editor.diet} showLabel />
                </div>
                <h3 id="dish-studio-title" className="font-display text-lg font-bold text-white mt-1">
                  {editor.id ? `${t("menu.edit")}: ${editor.name || "Dish"}` : "+ New Dish Studio"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditor(null)}
                className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                aria-label="Close Dish Studio"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Scrollable Drawer Body */}
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {/* 1. Core Dish Identity: Name & Category Selector */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between">
                    <Label>{t("menu.name")} *</Label>
                    {editor.name.trim() && (
                      <button
                        type="button"
                        onClick={handleAutoFillDishDetails}
                        className="text-[11px] text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        title="Auto-fill Category, Diet, Price & Plate AI Photo"
                      >
                        <Sparkles className="size-3" /> Auto-Fill &amp; AI Photo
                      </button>
                    )}
                  </div>
                  <Input
                    placeholder="e.g. Murgh Makhani (Butter Chicken)"
                    value={editor.name}
                    onChange={(e) => setEditor({ ...editor, name: e.target.value })}
                  />
                  {editor.name.trim() && (
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>
                        Taxonomy:{" "}
                        <strong className="text-amber-300">
                          {matchDishCulinaryTaxonomy(editor.name).category}
                        </strong>{" "}
                        ·{" "}
                        <strong className="text-emerald-400">
                          {matchDishCulinaryTaxonomy(editor.name).diet}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <Label>{t("menu.categories")} *</Label>
                  <select
                    className="h-11 w-full rounded-[12px] border border-line bg-surface px-3 text-sm"
                    value={editor.categoryId}
                    onChange={(e) => setEditor({ ...editor, categoryId: e.target.value })}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. FSSAI Dietary Classification (veg / non_veg / egg with standard dot indicators) */}
              <div className="space-y-2">
                <Label>{t("onboarding.vegStatus")} (FSSAI Statutory Classification)</Label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(
                    [
                      {
                        value: "VEG",
                        code: "veg",
                        label: t("menu.veg"),
                        sub: "Green Dot · 100% Vegetarian",
                        activeClass: "border-emerald-500 bg-emerald-950/40 text-emerald-200",
                      },
                      {
                        value: "NONVEG",
                        code: "non_veg",
                        label: t("menu.nonveg"),
                        sub: "Red/Brown Dot · Meat/Poultry",
                        activeClass: "border-rose-500 bg-rose-950/40 text-rose-200",
                      },
                      {
                        value: "EGG",
                        code: "egg",
                        label: t("menu.egg"),
                        sub: "Amber Dot · Contains Egg",
                        activeClass: "border-amber-500 bg-amber-950/40 text-amber-200",
                      },
                    ] as const
                  ).map((opt) => {
                    const active = editor.diet === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        data-diet-code={opt.code}
                        onClick={() => setEditor({ ...editor, diet: opt.value })}
                        className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${
                          active
                            ? `${opt.activeClass} font-bold shadow-sm`
                            : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FssaiDietBadge diet={opt.value} />
                          <span className="text-xs font-bold">{opt.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{opt.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Base Selling Price (₹), Prep Time (15 / 20 / 30 mins) & Serving Size Note */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-3">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label>Base Selling Price (₹) *</Label>
                    <Input
                      inputMode="decimal"
                      placeholder="e.g. 249"
                      value={baseSellingPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        const variants =
                          editor.variants.length > 0
                            ? [...editor.variants]
                            : [{ name: "Regular", price: val }];
                        variants[0] = { ...variants[0], price: val };
                        setEditor({ ...editor, variants });
                      }}
                    />
                    <span className="mt-1 block text-[10px] text-slate-400">
                      Primary ({editor.variants[0]?.name || "Regular"}) rate before GST
                    </span>
                  </div>

                  <div>
                    <Label>Kitchen Prep Time</Label>
                    <div className="mt-1 grid grid-cols-3 gap-1.5">
                      {[15, 20, 30].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setEditor({ ...editor, prepMinutes: mins })}
                          className={`rounded-lg border py-2 text-xs font-mono font-bold transition ${
                            editor.prepMinutes === mins
                              ? "border-amber-500 bg-amber-500/20 text-amber-300"
                              : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                          }`}
                        >
                          {mins} mins
                        </button>
                      ))}
                    </div>
                    <span className="mt-1 block text-[10px] text-slate-400">
                      Used for rider dispatch &amp; KDS SLA
                    </span>
                  </div>

                  <div>
                    <Label>Serving Size &amp; Portion</Label>
                    <Input
                      placeholder="e.g. Serves 1-2 (350g)"
                      value={editor.servingSize}
                      onChange={(e) => setEditor({ ...editor, servingSize: e.target.value })}
                    />
                    <span className="mt-1 block text-[10px] text-slate-400">
                      Displayed on customer dish card
                    </span>
                  </div>
                </div>

                {/* Quick Portion & Allergen Tag Pills */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-mono uppercase text-slate-400">
                    1-Tap Portion &amp; Allergen Tags:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const intel = orderKingSpark.suggestMenuIntelligence(editor.name || "Special Dish");
                      const currentTags = editor.servingSize.split("·").map((s) => s.trim()).filter(Boolean);
                      const combined = Array.from(new Set([
                        ...currentTags,
                        intel.portionStrategy.portionName,
                        ...intel.dietaryBadges,
                        ...intel.allergens.map((a) => `Contains ${a}`),
                      ]));
                      setEditor({
                        ...editor,
                        description: editor.description.trim() ? editor.description : intel.highConvertingDescription,
                        servingSize: combined.join(" · "),
                      });
                    }}
                    className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold hover:underline cursor-pointer"
                  >
                    <Sparkles className="size-3" /> Auto-Suggest AI Tags &amp; Description
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {PORTION_PORTFOLIO_TAG_PILLS.map((tag) => {
                    const active = editor.servingSize.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const current = editor.servingSize
                            .split("·")
                            .map((s) => s.trim())
                            .filter(Boolean);
                          const updated = active
                            ? current.filter((s) => s !== tag)
                            : [...current, tag];
                          setEditor({ ...editor, servingSize: updated.join(" · ") });
                        }}
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition ${
                          active
                            ? "border-amber-500/60 bg-amber-500/15 text-amber-300"
                            : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                        }`}
                      >
                        {active ? `✓ ${tag}` : `+ ${tag}`}
                      </button>
                    );
                  })}
                </div>

                {/* Live Statutory GST Sec 9(5) & Customer Menu Price Preview */}
                {basePriceRupees > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-3 py-2 text-[11px] font-mono">
                    <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                      <Receipt className="size-3.5" /> Statutory Customer Price Preview (CGST Sec 9(5)):
                    </span>
                    <div className="flex flex-wrap items-center gap-3 text-slate-300">
                      <span>Base: ₹{basePriceRupees.toFixed(2)}</span>
                      <span>+ 5% GST (2.5% CGST + 2.5% SGST): ₹{gst5PercentRupees.toFixed(2)}</span>
                      <span className="font-bold text-white">
                        Customer Menu Total: ₹{customerMenuTotalRupees.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. King AI Automated Dish Photo Studio & Studio Lighting */}
              <div className="rounded-xl border border-amber-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4 space-y-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-amber-400 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                        King AI Automated Dish Photo Studio
                      </span>
                      <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-mono text-amber-300">
                        4:3 Studio Grade
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      1-Tap automated studio culinary photography calibrated for Indian restaurant menus. Eliminates the need for expensive photo shoots.
                    </p>
                  </div>

                  {editor.imageUrl ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={uploadingImage || generatingAiPhoto}
                      onClick={() => void handleEnhanceExistingPhoto()}
                      className="text-xs"
                    >
                      <SlidersHorizontal className="mr-1.5 size-3.5 text-amber-400" />
                      {editor.enhancedImageUrl
                        ? "Re-Apply Studio Lighting"
                        : "Apply Studio Lighting & 4:3 Framing"}
                    </Button>
                  ) : null}
                </div>

                {/* Primary 1-Tap AI Photo Generator Button */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    disabled={generatingAiPhoto || uploadingImage || !editor.name.trim()}
                    onClick={() => void handleGenerateAiDishPhoto()}
                    className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-md"
                  >
                    {generatingAiPhoto ? (
                      <>
                        <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
                        Plating Studio Visual for "{editor.name || "Dish"}"...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-1.5 size-3.5" />
                        {editor.imageUrl
                          ? "✨ Regenerate Dish Photo with King AI (1-Tap)"
                          : "✨ Generate Dish Photo with King AI (1-Tap)"}
                      </>
                    )}
                  </Button>

                  {!editor.name.trim() && (
                    <span className="text-[11px] text-amber-400 font-mono">
                      (Enter a dish name above to enable 1-tap AI plating)
                    </span>
                  )}
                </div>

                {/* 4 Studio Lighting Atmosphere Presets */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                    <SlidersHorizontal className="size-3 text-amber-400" />
                    Studio Lighting Atmosphere:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {(
                      [
                        { id: "warm_tandoor", label: "Warm Tandoor", sub: "3500K Embers" },
                        { id: "fine_dining", label: "Dark Slate", sub: "Fine Dining" },
                        { id: "fresh_garden", label: "Daylight", sub: "Fresh Garden" },
                        { id: "royal_handi", label: "Royal Handi", sub: "Golden Sheen" },
                      ] as const
                    ).map((styleOpt) => {
                      const isSelected = (editor.studioStyle || activeStudioStyle) === styleOpt.id;
                      return (
                        <button
                          key={styleOpt.id}
                          type="button"
                          onClick={() => {
                            setActiveStudioStyle(styleOpt.id);
                            if (editor.imageUrl) {
                              void handleGenerateAiDishPhoto(editor.name, styleOpt.id);
                            }
                          }}
                          className={`rounded-lg border p-2 text-left transition ${
                            isSelected
                              ? "border-amber-500 bg-amber-500/20 text-white font-bold shadow-xs"
                              : "border-slate-800 bg-slate-900/70 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                          }`}
                        >
                          <div className="text-xs font-semibold">{styleOpt.label}</div>
                          <div className="text-[10px] text-amber-300/80">{styleOpt.sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Alternative Visual Angles / Platings (if available) */}
                {editor.availableVisualAngles && editor.availableVisualAngles.length > 1 && (
                  <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      Alternative Studio Platings (Tap to apply):
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {editor.availableVisualAngles.map((angleUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => void handleGenerateAiDishPhoto(editor.name, undefined, angleUrl)}
                          className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border transition ${
                            editor.originalImageUrl === angleUrl || editor.imageUrl === angleUrl
                              ? "border-amber-400 ring-2 ring-amber-400/30"
                              : "border-slate-700 hover:border-slate-500 opacity-80 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={angleUrl}
                            alt={`Visual Angle ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 text-[8px] font-mono text-amber-300">
                            Angle {idx + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Merchant's Own Camera Photo */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <Camera className="size-3.5 text-slate-400" />
                    <span className="text-xs text-slate-300">Or upload real kitchen photo:</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleDishPhotoFileChange(file);
                    }}
                    className="text-xs file:mr-2 file:rounded-md file:border file:border-slate-700 file:bg-slate-800 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-slate-200 hover:file:bg-slate-700"
                  />
                  {uploadingImage ? (
                    <span className="text-xs font-mono text-amber-400 animate-pulse">
                      Processing 4:3 studio lighting on canvas...
                    </span>
                  ) : null}
                </div>

                {/* Interactive Studio Lighting Fine-Tuning Sliders */}
                {editor.imageUrl ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-[11px]">
                    <label className="space-y-1">
                      <div className="flex justify-between font-mono text-slate-300">
                        <span>Brightness</span>
                        <span>
                          {studioLighting.brightness > 0 ? `+${studioLighting.brightness}` : studioLighting.brightness}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-15}
                        max={28}
                        step={1}
                        value={studioLighting.brightness}
                        onChange={(e) => {
                          const next = { ...studioLighting, brightness: Number(e.target.value) };
                          setStudioLighting(next);
                          void handleEnhanceExistingPhoto(next);
                        }}
                        className="w-full accent-amber-500"
                      />
                    </label>
                    <label className="space-y-1">
                      <div className="flex justify-between font-mono text-slate-300">
                        <span>Contrast</span>
                        <span>{Math.round(studioLighting.contrast * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0.95}
                        max={1.3}
                        step={0.01}
                        value={studioLighting.contrast}
                        onChange={(e) => {
                          const next = { ...studioLighting, contrast: Number(e.target.value) };
                          setStudioLighting(next);
                          void handleEnhanceExistingPhoto(next);
                        }}
                        className="w-full accent-amber-500"
                      />
                    </label>
                    <label className="space-y-1">
                      <div className="flex justify-between font-mono text-slate-300">
                        <span>Vibrance</span>
                        <span>{Math.round(studioLighting.saturation * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0.95}
                        max={1.35}
                        step={0.01}
                        value={studioLighting.saturation}
                        onChange={(e) => {
                          const next = { ...studioLighting, saturation: Number(e.target.value) };
                          setStudioLighting(next);
                          void handleEnhanceExistingPhoto(next);
                        }}
                        className="w-full accent-amber-500"
                      />
                    </label>
                    <label className="space-y-1">
                      <div className="flex justify-between font-mono text-slate-300">
                        <span>3500K Warmth</span>
                        <span>{Math.round(studioLighting.warmth * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0.98}
                        max={1.1}
                        step={0.01}
                        value={studioLighting.warmth}
                        onChange={(e) => {
                          const next = { ...studioLighting, warmth: Number(e.target.value) };
                          setStudioLighting(next);
                          void handleEnhanceExistingPhoto(next);
                        }}
                        className="w-full accent-amber-500"
                      />
                    </label>
                  </div>
                ) : null}

                {/* Preview Card */}
                {editor.imageUrl ? (
                  <div className="space-y-3">
                    {editor.originalImageUrl && editor.enhancedImageUrl ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                          <Eye className="size-3.5" /> Preview Mode:
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setEditor({
                              ...editor,
                              activePhotoMode: "original",
                              imageUrl: editor.originalImageUrl,
                            })
                          }
                          className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                            editor.activePhotoMode === "original"
                              ? "bg-slate-800 text-white border border-slate-600"
                              : "bg-slate-900 text-slate-400 hover:text-white"
                          }`}
                        >
                          Original Shot
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditor({
                              ...editor,
                              activePhotoMode: "enhanced",
                              imageUrl: editor.enhancedImageUrl,
                            })
                          }
                          className={`rounded-lg px-3 py-1 text-xs font-bold transition flex items-center gap-1 ${
                            editor.activePhotoMode === "enhanced"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                              : "bg-slate-900 text-slate-400 hover:text-white"
                          }`}
                        >
                          <Sparkles className="size-3" />
                          Studio Enhanced (4:3)
                        </button>
                      </div>
                    ) : null}

                    <div className="relative h-56 w-72 overflow-hidden rounded-xl border border-amber-500/40 bg-black shadow-lg">
                      <img
                        src={editor.imageUrl}
                        alt={editor.name || "Dish photo preview"}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute left-2 bottom-2 rounded-md bg-black/85 border border-amber-500/40 px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-amber-300 flex items-center gap-1">
                        <Sparkles className="size-2.5 text-amber-400" />
                        {editor.aiGenerated ? "King AI Studio Certified · 4:3" : "4:3 Studio Framing"}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditor({
                            ...editor,
                            imageUrl: null,
                            originalImageUrl: null,
                            enhancedImageUrl: null,
                            photoModified: false,
                            photoAttested: false,
                            aiGenerated: false,
                          })
                        }
                        className="absolute right-2 top-2 rounded-full bg-black/85 border border-slate-700 px-2 py-0.5 text-xs text-white hover:bg-rose-600 transition"
                        title="Remove photo"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Pre-Attested or Manual Authenticity Attestation */}
                {editor.imageUrl ? (
                  editor.aiGenerated ? (
                    <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-3 flex items-start gap-2.5">
                      <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5 text-xs">
                        <span className="font-bold text-emerald-300 block">
                          King AI Studio Certified Presentation
                        </span>
                        <span className="text-slate-300 block leading-relaxed">
                          This studio visual has been automatically calibrated to authentic portion sizes and standard culinary presentation. Pre-certified and ready for immediate catalog publishing.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-500/40 bg-amber-950/25 p-3">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-1 size-4 shrink-0 accent-amber-500"
                          checked={editor.photoAttested}
                          onChange={(e) =>
                            setEditor({ ...editor, photoAttested: e.target.checked })
                          }
                        />
                        <div className="space-y-1">
                          <span className="block text-xs font-bold text-amber-300">
                            FSSAI Culinary Presentation Attestation *
                          </span>
                          <span className="block text-xs text-slate-200 leading-relaxed">
                            "I attest that this photograph is an authentic representation of the actual dish portion and ingredients prepared by our kitchen."
                          </span>
                        </div>
                      </label>
                    </div>
                  )
                ) : null}
              </div>

              {/* 5. Description & Recommended Flag */}
              <div className="space-y-3">
                <div>
                  <Label>{t("menu.description")}</Label>
                  <Textarea
                    placeholder="Describe key ingredients, preparation style, and accompaniments..."
                    value={editor.description}
                    onChange={(e) => setEditor({ ...editor, description: e.target.value })}
                  />
                </div>
                <label className="flex min-h-10 items-center gap-2.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="size-4 accent-amber-500"
                    checked={editor.recommended}
                    onChange={(e) => setEditor({ ...editor, recommended: e.target.checked })}
                  />
                  <span className="font-medium">{t("menu.recommended")} (Highlight as Chef's Recommended Dish)</span>
                </label>

                {/* Dietary Classifications & Allergen Manager */}
                <div className="pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllergenEditor(!showAllergenEditor)}
                    className="border-slate-700 bg-slate-900 text-xs font-semibold text-slate-200 hover:text-white"
                  >
                    <span>🥗</span> {showAllergenEditor ? "Hide Dietary & Allergen Details" : "Configure Dietary Flags & Allergens"}
                  </Button>
                  {showAllergenEditor && (
                    <div className="mt-2.5">
                      <DietaryAllergenEditor
                        dishName={editor.name || "Dish"}
                        initialConfig={{
                          dietaryClassification: editor.diet === "VEG" ? "VEG" : editor.diet === "EGG" ? "EGG" : "NON_VEG",
                        }}
                        onSave={(cfg) => {
                          const mappedDiet: "VEG" | "NONVEG" | "EGG" =
                            cfg.dietaryClassification === "VEG" || cfg.dietaryClassification === "VEGAN" || cfg.dietaryClassification === "JAIN"
                              ? "VEG"
                              : cfg.dietaryClassification === "EGG"
                              ? "EGG"
                              : "NONVEG";
                          const allergenTags = cfg.allergens.length > 0 ? `Allergens: ${cfg.allergens.join(", ")}` : "";
                          const featureTags = [
                            cfg.isGlutenFree ? "Gluten-Free" : null,
                            cfg.isHighProtein ? "High-Protein" : null,
                            cfg.isDiabeticFriendly ? "Diabetic-Friendly" : null,
                            cfg.isKetoFriendly ? "Keto" : null,
                          ].filter(Boolean).join(" · ");
                          const extraTags = [allergenTags, featureTags].filter(Boolean).join(" | ");
                          setEditor({
                            ...editor,
                            diet: mappedDiet,
                            servingSize: editor.servingSize ? `${editor.servingSize} (${extraTags})` : extraTags,
                          });
                          setShowAllergenEditor(false);
                          toast.success("Dietary classifications & allergens applied to dish.");
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 6. Portion Variants (Regular / Half / Full / Family Pack) */}
              <div className="space-y-2.5 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label className="mb-0">{t("menu.variants")} (Portion Sizes &amp; ₹ Prices) *</Label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const base = Number(baseSellingPrice) || 200;
                        setEditor({
                          ...editor,
                          variants: [
                            { name: "Half Portion", price: String(Math.round(base * 0.6)) },
                            { name: "Full Portion", price: String(base) },
                          ],
                        });
                      }}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-mono text-slate-300 hover:border-amber-500/40 hover:text-white"
                    >
                      Preset: Half + Full
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const base = Number(baseSellingPrice) || 250;
                        setEditor({
                          ...editor,
                          variants: [
                            { name: "Regular (Serves 1)", price: String(base) },
                            { name: "Medium (Serves 2)", price: String(Math.round(base * 1.75)) },
                            { name: "Family Pack (Serves 4)", price: String(Math.round(base * 3.2)) },
                          ],
                        });
                      }}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-mono text-slate-300 hover:border-amber-500/40 hover:text-white"
                    >
                      Preset: Regular / Medium / Family
                    </button>
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={() =>
                        setEditor({
                          ...editor,
                          variants: [...editor.variants, { name: "", price: "" }],
                        })
                      }
                    >
                      <Plus className="mr-1 size-3.5" /> Add Variant
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {editor.variants.map((v, i) => (
                    <div key={i} className="grid grid-cols-[1fr_140px_auto] items-center gap-2">
                      <Input
                        placeholder="Variant name (e.g. Regular, Half, Full)"
                        value={v.name}
                        onChange={(e) => {
                          const variants = [...editor.variants];
                          variants[i] = { ...v, name: e.target.value };
                          setEditor({ ...editor, variants });
                        }}
                      />
                      <Input
                        inputMode="decimal"
                        placeholder={t("menu.price")}
                        value={v.price}
                        onChange={(e) => {
                          const variants = [...editor.variants];
                          variants[i] = { ...v, price: e.target.value };
                          setEditor({ ...editor, variants });
                        }}
                      />
                      {editor.variants.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => {
                            const variants = editor.variants.filter((_, idx) => idx !== i);
                            setEditor({ ...editor, variants });
                          }}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400"
                          title="Remove variant"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      ) : (
                        <span className="w-8" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. Linked Add-ons */}
              {(menu.data?.addons.length ?? 0) > 0 ? (
                <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                  <div className="flex items-center justify-between">
                    <Label className="mb-0">{t("menu.addons")}</Label>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() =>
                          setEditor({
                            ...editor,
                            addonIds: (menu.data?.addons ?? []).map((a) => a.id),
                          })
                        }
                        className="text-amber-400 hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-slate-600">·</span>
                      <button
                        type="button"
                        onClick={() => setEditor({ ...editor, addonIds: [] })}
                        className="text-slate-400 hover:text-white"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {menu.data?.addons.map((a) => (
                      <label
                        key={a.id}
                        className="flex min-h-10 items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs cursor-pointer hover:border-slate-700"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <input
                            type="checkbox"
                            className="size-4 accent-amber-500"
                            checked={editor.addonIds.includes(a.id)}
                            onChange={(e) =>
                              setEditor({
                                ...editor,
                                addonIds: e.target.checked
                                  ? [...editor.addonIds, a.id]
                                  : editor.addonIds.filter((id) => id !== a.id),
                              })
                            }
                          />
                          {a.name}
                        </span>
                        <MoneyText paise={a.pricePaise} />
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* 8. Nested Item Modifiers & Customization Groups */}
              <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <Layers className="size-4 text-amber-400" />
                      <Label className="mb-0 text-sm font-bold text-slate-100">
                        Customization &amp; Modifier Groups
                      </Label>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Configure nested modifier groups (Group Title, Min/Max limits, Radio vs Checkbox, and variant price adders like Extra Cheese +₹30 Regular / +₹60 Large).
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const newGroupId = `mod-grp-${Date.now()}`;
                      const newGroup: ModifierGroup = {
                        id: newGroupId,
                        title: "Customization Group",
                        type: "CHECKBOX",
                        minSelect: 0,
                        maxSelect: 3,
                        required: false,
                        options: [
                          {
                            id: `opt-${Date.now()}-1`,
                            name: "Extra Cheese",
                            price: "30",
                            pricePaise: 3000,
                            variantPriceAdders: {
                              Regular: 3000,
                              Large: 6000,
                            },
                          },
                        ],
                      };
                      setEditor({
                        ...editor,
                        modifierGroups: [...editor.modifierGroups, newGroup],
                      });
                    }}
                    className="border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold"
                  >
                    <Plus className="mr-1 size-3.5" />
                    Add Modifier Group
                  </Button>
                </div>

                {editor.modifierGroups.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-800 p-4 text-center space-y-2">
                    <p className="text-xs text-slate-400">
                      No custom modifier groups added yet. You can add crust choices, sauce levels, or variant-linked toppings.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const newGroup: ModifierGroup = {
                            id: `mod-grp-${Date.now()}`,
                            title: "Choose Crust / Base",
                            type: "RADIO",
                            minSelect: 1,
                            maxSelect: 1,
                            required: true,
                            options: [
                              { id: `opt-${Date.now()}-1`, name: "Pan Tossed", price: "0", pricePaise: 0 },
                              { id: `opt-${Date.now()}-2`, name: "Thin Crust", price: "20", pricePaise: 2000 },
                              {
                                id: `opt-${Date.now()}-3`,
                                name: "Cheese Burst",
                                price: "60",
                                pricePaise: 6000,
                                variantPriceAdders: { Regular: 4000, Large: 8000 },
                              },
                            ],
                          };
                          setEditor({ ...editor, modifierGroups: [...editor.modifierGroups, newGroup] });
                        }}
                        className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] text-slate-200 hover:bg-slate-700 hover:text-white"
                      >
                        + Choose Crust (Radio · Min 1, Max 1)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newGroup: ModifierGroup = {
                            id: `mod-grp-${Date.now()}`,
                            title: "Extra Cheese & Toppings",
                            type: "CHECKBOX",
                            minSelect: 0,
                            maxSelect: 4,
                            required: false,
                            options: [
                              {
                                id: `opt-${Date.now()}-1`,
                                name: "Extra Mozzarella Cheese",
                                price: "30",
                                pricePaise: 3000,
                                variantPriceAdders: { Regular: 3000, Large: 6000 },
                              },
                              { id: `opt-${Date.now()}-2`, name: "Black Olives", price: "25", pricePaise: 2500 },
                              { id: `opt-${Date.now()}-3`, name: "Jalapenos", price: "20", pricePaise: 2000 },
                            ],
                          };
                          setEditor({ ...editor, modifierGroups: [...editor.modifierGroups, newGroup] });
                        }}
                        className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] text-slate-200 hover:bg-slate-700 hover:text-white"
                      >
                        + Extra Cheese &amp; Toppings (Checkbox · Min 0, Max 4)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {editor.modifierGroups.map((group, grpIdx) => (
                      <div
                        key={group.id}
                        className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-3"
                      >
                        {/* Group Header Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex-1 min-w-[200px]">
                            <Input
                              value={group.title}
                              onChange={(e) => {
                                const updated = [...editor.modifierGroups];
                                updated[grpIdx] = { ...group, title: e.target.value };
                                setEditor({ ...editor, modifierGroups: updated });
                              }}
                              placeholder="Group Title (e.g. Choose Crust, Toppings)"
                              className="h-8 text-xs font-semibold bg-slate-900 border-slate-700 text-slate-100"
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Radio vs Checkbox Selector */}
                            <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...editor.modifierGroups];
                                  updated[grpIdx] = { ...group, type: "RADIO", maxSelect: 1 };
                                  setEditor({ ...editor, modifierGroups: updated });
                                }}
                                className={`rounded px-2 py-0.5 font-medium transition ${
                                  group.type === "RADIO"
                                    ? "bg-amber-500 text-slate-950 font-bold"
                                    : "text-slate-400 hover:text-white"
                                }`}
                              >
                                Radio (Single)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...editor.modifierGroups];
                                  updated[grpIdx] = { ...group, type: "CHECKBOX" };
                                  setEditor({ ...editor, modifierGroups: updated });
                                }}
                                className={`rounded px-2 py-0.5 font-medium transition ${
                                  group.type === "CHECKBOX"
                                    ? "bg-amber-500 text-slate-950 font-bold"
                                    : "text-slate-400 hover:text-white"
                                }`}
                              >
                                Checkbox (Multi)
                              </button>
                            </div>

                            {/* Min / Max Selection Limits */}
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                              <span>Min:</span>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                value={group.minSelect}
                                onChange={(e) => {
                                  const updated = [...editor.modifierGroups];
                                  updated[grpIdx] = { ...group, minSelect: Math.max(0, parseInt(e.target.value, 10) || 0) };
                                  setEditor({ ...editor, modifierGroups: updated });
                                }}
                                className="w-10 rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-center text-xs text-white"
                              />
                              <span>Max:</span>
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={group.maxSelect}
                                onChange={(e) => {
                                  const updated = [...editor.modifierGroups];
                                  updated[grpIdx] = { ...group, maxSelect: Math.max(1, parseInt(e.target.value, 10) || 1) };
                                  setEditor({ ...editor, modifierGroups: updated });
                                }}
                                className="w-10 rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-center text-xs text-white"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const updated = editor.modifierGroups.filter((_, idx) => idx !== grpIdx);
                                setEditor({ ...editor, modifierGroups: updated });
                              }}
                              className="text-slate-500 hover:text-rose-400 p-1"
                              title="Delete Modifier Group"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>

                        {/* Options List */}
                        <div className="space-y-2 border-t border-slate-800/80 pt-2">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            <span>Options &amp; Variant Price Adders</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...editor.modifierGroups];
                                const optId = `opt-${Date.now()}`;
                                updated[grpIdx].options.push({
                                  id: optId,
                                  name: "New Option",
                                  price: "0",
                                  pricePaise: 0,
                                  variantPriceAdders: {},
                                });
                                setEditor({ ...editor, modifierGroups: updated });
                              }}
                              className="text-amber-400 hover:underline font-bold"
                            >
                              + Add Option
                            </button>
                          </div>

                          {group.options.map((opt, optIdx) => (
                            <div
                              key={opt.id}
                              className="rounded-lg border border-slate-800 bg-slate-900/90 p-2.5 space-y-2"
                            >
                              <div className="flex items-center gap-2">
                                <Input
                                  value={opt.name}
                                  onChange={(e) => {
                                    const updated = [...editor.modifierGroups];
                                    updated[grpIdx].options[optIdx] = { ...opt, name: e.target.value };
                                    setEditor({ ...editor, modifierGroups: updated });
                                  }}
                                  placeholder="Option Name (e.g. Extra Cheese)"
                                  className="h-7 text-xs bg-slate-950 border-slate-800 text-slate-200 flex-1"
                                />
                                <div className="flex items-center gap-1 text-xs">
                                  <span className="text-slate-400">Base ₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={opt.price ?? String((opt.pricePaise ?? 0) / 100)}
                                    onChange={(e) => {
                                      const p = e.target.value;
                                      const updated = [...editor.modifierGroups];
                                      updated[grpIdx].options[optIdx] = {
                                        ...opt,
                                        price: p,
                                        pricePaise: Math.round((parseFloat(p) || 0) * 100),
                                      };
                                      setEditor({ ...editor, modifierGroups: updated });
                                    }}
                                    className="w-14 rounded border border-slate-800 bg-slate-950 px-1 py-0.5 text-xs text-right text-emerald-400 font-mono"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...editor.modifierGroups];
                                    updated[grpIdx].options = group.options.filter((_, idx) => idx !== optIdx);
                                    setEditor({ ...editor, modifierGroups: updated });
                                  }}
                                  className="text-slate-500 hover:text-rose-400"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>

                              {/* Variant Price Adders (e.g. Regular +₹30 / Large +₹60) */}
                              {editor.variants.length > 0 && (
                                <div className="rounded-md border border-slate-800/80 bg-slate-950/60 p-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                                  <span className="font-semibold text-slate-400">Variant Price Adders:</span>
                                  {editor.variants.map((v) => {
                                    const vName = v.name || "Variant";
                                    const currentAdderPaise = opt.variantPriceAdders?.[vName] ?? (opt.pricePaise ?? 0);
                                    const currentAdderRs = Math.round(currentAdderPaise / 100);
                                    return (
                                      <div
                                        key={v.id || vName}
                                        className="flex items-center gap-1 rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5"
                                      >
                                        <span className="text-slate-300 font-medium">{vName}:</span>
                                        <span className="text-emerald-400 font-mono">+₹</span>
                                        <input
                                          type="number"
                                          min="0"
                                          value={currentAdderRs}
                                          onChange={(e) => {
                                            const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                            const updated = [...editor.modifierGroups];
                                            const currentAdders = { ...(opt.variantPriceAdders || {}) };
                                            currentAdders[vName] = val * 100;
                                            updated[grpIdx].options[optIdx] = {
                                              ...opt,
                                              variantPriceAdders: currentAdders,
                                            };
                                            setEditor({ ...editor, modifierGroups: updated });
                                          }}
                                          className="w-12 bg-slate-950 border border-slate-800 text-right px-1 text-emerald-400 font-mono rounded"
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Drawer Footer */}
            <div className="border-t border-slate-800 bg-slate-900/95 px-5 py-3.5 space-y-2">
              {editor.photoModified && editor.imageUrl && !editor.photoAttested && !editor.aiGenerated ? (
                <p className="text-[11px] font-medium text-amber-400">
                  Please check the mandatory FSSAI &amp; Consumer Authenticity Attestation above to enable saving this modified dish image.
                </p>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <Button variant="ghost" type="button" onClick={() => setEditor(null)}>
                  {t("common.cancel")}
                </Button>
                <Button
                  type="button"
                  disabled={!canSaveDish}
                  onClick={async () => {
                    if (!canSaveDish) return;
                    setSavingDish(true);
                    try {
                      await saveItem({
                        data: {
                          restaurantId: vendor.restaurantId,
                          id: editor.id,
                          categoryId: editor.categoryId,
                          name: editor.name.trim(),
                          description: editor.description.trim(),
                          diet: editor.diet,
                          tags: editor.servingSize.trim(),
                          recommended: editor.recommended,
                          prepMinutes: editor.prepMinutes,
                          imageUrl: editor.imageUrl,
                          addonIds: editor.addonIds,
                          variants: validVariants.map((v) => ({
                            id: v.id,
                            name: v.name.trim(),
                            pricePaise: rupeesToPaise(Number(v.price)),
                          })),
                          modifierGroups: editor.modifierGroups,
                        },
                      });
                      setEditor(null);
                      void qc.invalidateQueries({ queryKey: ["menu"] });
                    } finally {
                      setSavingDish(false);
                    }
                  }}
                >
                  {savingDish ? "Saving Dish..." : t("menu.save")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* OCR / Bulk Menu Digitizer Modal */}
      {ocrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-emerald-400" />
                <h3 className="font-display text-base font-bold text-white">
                  Autonomous Menu Digitizer &amp; OCR Ingestion
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOcrModalOpen(false);
                  setDigitizedCatalog(null);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Paste raw OCR text from a physical printed menu, chalkboard photo, or billing printout.
              The autonomous parser will extract dish names, descriptions, section categories, FSSAI diet tags, and integer paise prices.
            </p>

            <Textarea
              rows={8}
              value={rawOcrText}
              onChange={(e) => setRawOcrText(e.target.value)}
              placeholder="Paste raw menu text or OCR output here... Example:&#10;&#10;STARTERS&#10;Paneer Tikka - ₹220&#10;Chicken Malai Kebab - ₹280 [NV]&#10;&#10;MAIN COURSE&#10;Butter Chicken - ₹340&#10;Dal Makhani - ₹210 [VEG]&#10;&#10;BREADS&#10;Butter Naan - ₹50"
              className="font-mono text-xs bg-slate-950 border-slate-800 text-slate-200"
            />

            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleDigitizeText}
                disabled={!rawOcrText.trim()}
                className="text-xs font-bold"
              >
                <Sparkles className="mr-1.5 size-3.5 text-amber-400" /> Parse &amp; Digitize Dishes
              </Button>

              {digitizedCatalog && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleCommitDigitizedMenu()}
                  disabled={importingOcr}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  <CheckCircle2 className="mr-1.5 size-3.5" />
                  {importingOcr ? "Importing to Database..." : `Import ${digitizedCatalog.totalDishesCount} Dishes to Menu`}
                </Button>
              )}
            </div>

            {digitizedCatalog && (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
                  <span>Extracted: {digitizedCatalog.totalDishesCount} Dishes in {digitizedCatalog.categories.length} Categories</span>
                  <span>🌱 {digitizedCatalog.vegDishesCount} Veg · 🍗 {digitizedCatalog.nonVegDishesCount} Non-Veg · 🥚 {digitizedCatalog.eggDishesCount} Egg</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-slate-800/60 text-xs">
                  {digitizedCatalog.categories.map((c) => (
                    <div key={c.id} className="pt-2">
                      <span className="font-bold text-slate-200 uppercase tracking-wide text-[11px] block">{c.name}</span>
                      <ul className="mt-1 space-y-1">
                        {c.items.map((it) => (
                          <li key={it.id} className="flex justify-between text-slate-300">
                            <span>{it.diet === "VEG" ? "🌱" : it.diet === "EGG" ? "🥚" : "🍗"} {it.name}</span>
                            <span className="font-mono text-emerald-400">{it.formattedPrice}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </VendorShell>
  );
}
