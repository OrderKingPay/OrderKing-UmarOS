
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SelectedLocation = {
  cityId: string;
  cityName: string;
  zoneId: string;
  zoneName: string;
  label: string;
  line1: string;
  lat: number;
  lng: number;
  addressId?: string;
};

const DEFAULT_LOCATION: SelectedLocation = {
  cityId: "",
  cityName: "Locating...",
  zoneId: "",
  zoneName: "",
  label: "Tap to set location",
  line1: "Please set your delivery address",
  lat: 0,
  lng: 0,
};

type State = {
  location: SelectedLocation;
  setLocation: (location: SelectedLocation) => void;
};

export const useLocationStore = create<State>()(
  persist(
    (set) => ({
      location: DEFAULT_LOCATION,
      setLocation: (location) => set({ location }),
    }),
    { name: "marketplace-location" },
  ),
);

export { DEFAULT_LOCATION };
