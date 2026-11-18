import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FeatureFlags {
  enableFlightsAndTrains: boolean;
  enableBillPayments: boolean;
  enableVehicleGarage: boolean;
  toggleFeature: (feature: keyof Omit<FeatureFlags, "toggleFeature" | "setFeatures">) => void;
  setFeatures: (features: Partial<Omit<FeatureFlags, "toggleFeature" | "setFeatures">>) => void;
}

export const useFeatureFlags = create<FeatureFlags>()(
  persist(
    (set) => ({
      enableFlightsAndTrains: true,
      enableBillPayments: true,
      enableVehicleGarage: true,
      toggleFeature: (feature) => set((state) => ({ [feature]: !state[feature] as boolean })),
      setFeatures: (features) => set((state) => ({ ...state, ...features })),
    }),
    {
      name: "feature-flags-storage",
    }
  )
);
