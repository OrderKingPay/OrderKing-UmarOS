import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AddressTag = "HOME" | "WORK" | "OTHER";

export type SavedAddress = {
  id: string;
  tag: AddressTag;
  title: string;
  houseNo?: string;
  area: string;
  landmark?: string;
  line1: string;
  cityName: string;
  cityId?: string;
  zoneName?: string;
  zoneId?: string;
  lat: number;
  lng: number;
  isDefault?: boolean;
};

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
  cityId: "del",
  cityName: "New Delhi",
  zoneId: "del-cp",
  zoneName: "Connaught Place",
  label: "Connaught Place, New Delhi",
  line1: "Inner Circle, Connaught Place, New Delhi",
  lat: 28.6315,
  lng: 77.2167,
};

export const DEFAULT_SAVED_ADDRESSES: SavedAddress[] = [
  {
    id: "addr-home",
    tag: "HOME",
    title: "Home",
    houseNo: "Flat 4B, Silver Oak Heights",
    area: "Park Street",
    landmark: "Near St. Xavier's College",
    line1: "Flat 4B, Silver Oak Heights, Park Street",
    cityName: "Kolkata",
    cityId: "kolkata",
    zoneName: "Park Street",
    zoneId: "kol-park",
    lat: 22.55,
    lng: 88.35,
    isDefault: true,
  },
  {
    id: "addr-work",
    tag: "WORK",
    title: "Office",
    houseNo: "Tower 2, 7th Floor, Ecospace IT Park",
    area: "New Town",
    landmark: "Opposite Convention Center",
    line1: "Tower 2, 7th Floor, Ecospace IT Park, New Town",
    cityName: "Kolkata",
    cityId: "kolkata",
    zoneName: "New Town",
    zoneId: "kol-newtown",
    lat: 22.58,
    lng: 88.47,
  },
];

type State = {
  location: SelectedLocation;
  setLocation: (location: SelectedLocation) => void;
  savedAddresses: SavedAddress[];
  addSavedAddress: (addr: Omit<SavedAddress, "id">) => SavedAddress;
  updateSavedAddress: (id: string, updates: Partial<SavedAddress>) => void;
  deleteSavedAddress: (id: string) => void;
  selectSavedAddress: (id: string) => void;
};

export const useLocationStore = create<State>()(
  persist(
    (set, get) => ({
      location: DEFAULT_LOCATION,
      setLocation: (location) => set({ location }),
      savedAddresses: DEFAULT_SAVED_ADDRESSES,
      addSavedAddress: (addr) => {
        const newAddress: SavedAddress = {
          ...addr,
          id: `addr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        };
        set((state) => ({
          savedAddresses: [newAddress, ...state.savedAddresses],
        }));
        return newAddress;
      },
      updateSavedAddress: (id, updates) => {
        set((state) => ({
          savedAddresses: state.savedAddresses.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }));
      },
      deleteSavedAddress: (id) => {
        set((state) => ({
          savedAddresses: state.savedAddresses.filter((a) => a.id !== id),
        }));
      },
      selectSavedAddress: (id) => {
        const addr = get().savedAddresses.find((a) => a.id === id);
        if (addr) {
          set({
            location: {
              cityId: addr.cityId || "",
              cityName: addr.cityName,
              zoneId: addr.zoneId || "",
              zoneName: addr.zoneName || addr.area,
              label: `${addr.title} (${addr.area})`,
              line1: addr.line1,
              lat: addr.lat,
              lng: addr.lng,
              addressId: addr.id,
            },
          });
        }
      },
    }),
    {
      name: "marketplace-location",
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (
          !state.location ||
          !state.location.cityName ||
          state.location.cityName === "Locating..." ||
          state.location.lat === 0 ||
          isNaN(state.location.lat)
        ) {
          state.location = DEFAULT_LOCATION;
        }
      },
    },
  ),
);

export { DEFAULT_LOCATION };
