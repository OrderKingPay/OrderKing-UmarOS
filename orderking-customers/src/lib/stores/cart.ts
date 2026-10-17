
import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import type { CartLineInput } from "@/lib/market-types";
import { canAddToCart, cartCount, cartKey, mergeItem, toCartItem, type CartItem } from "@/lib/cart-logic";
import { supabase } from "@/lib/db-cloud";

export type { CartItem };

// The cloud cart is optional. Never contact the placeholder Supabase endpoint
// when credentials have not been configured; keep a truthful device-local cart.
const cloudCartConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL?.startsWith("https://") &&
  !import.meta.env.VITE_SUPABASE_URL?.includes("unconfigured.supabase.co") &&
  !import.meta.env.VITE_SUPABASE_URL?.includes("placeholder.supabase.co") &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_ANON_KEY !== "unconfigured-key" &&
  import.meta.env.VITE_SUPABASE_ANON_KEY !== "placeholder-key"
);

function readDeviceCart(name: string): string | null {
  try { return localStorage.getItem(name); }
  catch { return null; }
}
function getCartDeviceId(): string | null {
  try {
    let id = localStorage.getItem("device_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("device_id", id);
    }
    return id;
  } catch { return null; }
}

const supabaseStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const localCopy = readDeviceCart(name);
    if (!cloudCartConfigured) return localCopy;
    const deviceId = getCartDeviceId();
    if (!deviceId) return localCopy;
    try {
      const { data, error } = await supabase.from("customer_carts")
        .select("cart_state").eq("id", deviceId).maybeSingle();
      if (error || typeof data?.cart_state !== "string") return localCopy;
      try { localStorage.setItem(name, data.cart_state); } catch { /* storage restricted */ }
      return data.cart_state;
    } catch { return localCopy; }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    // Keep the cart usable offline. Cloud sync is attempted only when configured.
    try { localStorage.setItem(name, value); } catch { /* storage restricted */ }
    if (!cloudCartConfigured) return;
    const deviceId = getCartDeviceId();
    if (!deviceId) return;
    try {
      await supabase.from("customer_carts").upsert({ id: deviceId, cart_state: value });
    } catch { /* device-local copy remains available */ }
  },
  removeItem: async (name: string): Promise<void> => {
    try { localStorage.removeItem(name); } catch { /* storage restricted */ }
    if (!cloudCartConfigured) return;
    const deviceId = getCartDeviceId();
    if (!deviceId) return;
    try {
      await supabase.from("customer_carts").delete().eq("id", deviceId);
    } catch { /* never invent a successful cloud deletion */ }
  },
};

type State = {
  restaurantId: string | null;
  restaurantName: string;
  coupon: string;
  items: CartItem[];
  setRestaurant: (id: string, name: string) => void;
  addItem: (restaurantId: string, restaurantName: string, item: CartItem) => "ok" | "replace";
  replaceAndAdd: (restaurantId: string, restaurantName: string, item: CartItem) => void;
  replaceCart: (restaurantId: string, restaurantName: string, lines: CartLineInput[]) => void;
  updateQty: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  addAddonToItem: (itemKey: string, addonId: string) => void;
  removeAddonFromItem: (itemKey: string, addonId: string) => void;
  setCoupon: (code: string) => void;
  clear: () => void;
};

export const useCartStore = create<State>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantName: "",
      coupon: "",
      items: [],
      setRestaurant: (id, name) => set({ restaurantId: id, restaurantName: name }),
      addItem: (restaurantId, restaurantName, item) => {
        const cur = get();
        if (canAddToCart(cur.restaurantId, cur.items.length, restaurantId) === "replace") return "replace";
        set({
          restaurantId,
          restaurantName,
          items: mergeItem(cur.restaurantId === restaurantId ? cur.items : [], item),
        });
        return "ok";
      },
      replaceAndAdd: (restaurantId, restaurantName, item) => {
        set({ restaurantId, restaurantName, items: [item], coupon: "" });
      },
      replaceCart: (restaurantId, restaurantName, lines) => {
        set({
          restaurantId,
          restaurantName,
          items: lines.map(toCartItem),
          coupon: "",
        });
      },
      updateQty: (key, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.key !== key) });
          return;
        }
        set({ items: get().items.map((i) => (i.key === key ? { ...i, quantity } : i)) });
      },
      remove: (key: string) => set({ items: get().items.filter((i) => i.key !== key) }),
      addAddonToItem: (itemKey: string, addonId: string) => {
        const cur = get();
        const target = cur.items.find((i) => i.key === itemKey);
        if (!target || target.addonIds.includes(addonId)) return;
        const newAddonIds = [...target.addonIds, addonId].sort();
        const newKey = cartKey({ ...target, addonIds: newAddonIds });
        set({
          items: cur.items.map((i) =>
            i.key === itemKey ? { ...i, addonIds: newAddonIds, key: newKey } : i,
          ),
        });
      },
      removeAddonFromItem: (itemKey: string, addonId: string) => {
        const cur = get();
        const target = cur.items.find((i) => i.key === itemKey);
        if (!target || !target.addonIds.includes(addonId)) return;
        const newAddonIds = target.addonIds.filter((id) => id !== addonId);
        const newKey = cartKey({ ...target, addonIds: newAddonIds });
        set({
          items: cur.items.map((i) =>
            i.key === itemKey ? { ...i, addonIds: newAddonIds, key: newKey } : i,
          ),
        });
      },
      setCoupon: (code) => set({ coupon: code }),
      clear: () => set({ restaurantId: null, restaurantName: "", items: [], coupon: "" }),
    }),
    { 
      name: "marketplace-cart",
      storage: createJSONStorage(() => supabaseStorage),
    },
  ),
);

export function detectCartConflict(
  currentRestaurantId: string | null,
  itemCount: number,
  targetRestaurantId: string
): boolean {
  return Boolean(currentRestaurantId && currentRestaurantId !== targetRestaurantId && itemCount > 0);
}

export { cartKey, cartCount, toCartItem, canAddToCart };
