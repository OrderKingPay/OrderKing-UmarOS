
import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import type { CartLineInput } from "@/lib/market-types";
import { canAddToCart, cartCount, cartKey, mergeItem, toCartItem, type CartItem } from "@/lib/cart-logic";

export type { CartItem };

const offlineCartStorage: StateStorage = {
  getItem: (name: string) => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    if (typeof window !== "undefined") window.localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    if (typeof window !== "undefined") window.localStorage.removeItem(name);
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
      remove: (key) => set({ items: get().items.filter((i) => i.key !== key) }),
      setCoupon: (code) => set({ coupon: code }),
      clear: () => set({ restaurantId: null, restaurantName: "", items: [], coupon: "" }),
    }),
    { 
      name: "marketplace-cart",
      storage: createJSONStorage(() => offlineCartStorage),
    },
  ),
);

export { cartKey, cartCount, toCartItem };
