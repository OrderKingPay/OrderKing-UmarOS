
import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import type { CartLineInput } from "@/lib/market-types";
import { canAddToCart, cartCount, cartKey, mergeItem, toCartItem, type CartItem } from "@/lib/cart-logic";
import { supabase } from "@/lib/db-cloud";

export type { CartItem };

const supabaseStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("device_id", deviceId);
    }
    const { data } = await supabase.from("customer_carts").select("cart_state").eq("id", deviceId).single();
    return data ? data.cart_state : null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("device_id", deviceId);
    }
    await supabase.from("customer_carts").upsert({ id: deviceId, cart_state: value });
  },
  removeItem: async (name: string): Promise<void> => {
    let deviceId = localStorage.getItem("device_id");
    if (deviceId) {
      await supabase.from("customer_carts").delete().eq("id", deviceId);
    }
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

export { cartKey, cartCount, toCartItem };
