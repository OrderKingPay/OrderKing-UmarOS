import { create } from "zustand";

export interface HomeFilterState {
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  filterFast: boolean;
  setFilterFast: (fast: boolean) => void;
  filterRating: boolean;
  setFilterRating: (rating: boolean) => void;
  filterOffers: boolean;
  setFilterOffers: (offers: boolean) => void;
  filterBudget: boolean;
  setFilterBudget: (budget: boolean) => void;
  resetFilters: () => void;
}

export const useHomeFilterStore = create<HomeFilterState>((set) => ({
  selectedCategory: null,
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  filterFast: false,
  setFilterFast: (filterFast) => set({ filterFast }),
  filterRating: false,
  setFilterRating: (filterRating) => set({ filterRating }),
  filterOffers: false,
  setFilterOffers: (filterOffers) => set({ filterOffers }),
  filterBudget: false,
  setFilterBudget: (filterBudget) => set({ filterBudget }),
  resetFilters: () =>
    set({
      selectedCategory: null,
      filterFast: false,
      filterRating: false,
      filterOffers: false,
      filterBudget: false,
    }),
}));
