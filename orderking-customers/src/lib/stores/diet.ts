import { create } from "zustand";

export type DietPreference = "all" | "veg";

type DietState = {
  dietFilter: DietPreference;
  setDietFilter: (filter: DietPreference) => void;
  toggleVeg: () => void;
};

export const useDietStore = create<DietState>()((set) => ({
  dietFilter: "all",
  setDietFilter: (filter) => set({ dietFilter: filter }),
  toggleVeg: () =>
    set((state) => ({ dietFilter: state.dietFilter === "veg" ? "all" : "veg" })),
}));
