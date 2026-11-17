import type { GeoPoint } from "./types.ts";

/** Karimganj / Sribhumi reference points — public geography, not competitor data. */
export const KARIMGANJ: GeoPoint = { lat: 24.869, lng: 92.355 };

export const ZONES = [
  "Station Road",
  "Main Road",
  "Court Road",
  "Longai Road",
  "Sribhumi Chowk",
  "Badarpur Road",
];

export interface OperationalPocket {
  id: string;
  name: string;
  capacityStatus: "OPEN" | "HIGH_DEMAND" | "FULL";
  activeRiderCap: number;
}

export interface OperationalHub {
  id: string;
  name: string;
  city: string;
  pockets: OperationalPocket[];
}

export const OPERATIONAL_HUBS: OperationalHub[] = [
  {
    id: "hub-karimganj-central",
    name: "Karimganj Central Hub",
    city: "Karimganj",
    pockets: [
      { id: "kj-stn", name: "Station Road Pocket", capacityStatus: "OPEN", activeRiderCap: 25 },
      { id: "kj-main", name: "Main Bazar Pocket", capacityStatus: "HIGH_DEMAND", activeRiderCap: 35 },
      { id: "kj-court", name: "Court Road Pocket", capacityStatus: "OPEN", activeRiderCap: 20 },
      { id: "kj-longai", name: "Longai Road Pocket", capacityStatus: "OPEN", activeRiderCap: 15 },
      { id: "kj-badarpur", name: "Badarpur Road Pocket", capacityStatus: "HIGH_DEMAND", activeRiderCap: 30 },
    ],
  },
  {
    id: "hub-silchar-central",
    name: "Silchar Central Hub",
    city: "Silchar",
    pockets: [
      { id: "sil-central", name: "Central Point Pocket", capacityStatus: "HIGH_DEMAND", activeRiderCap: 50 },
      { id: "sil-hospital", name: "Hospital Road Pocket", capacityStatus: "OPEN", activeRiderCap: 30 },
      { id: "sil-tarapur", name: "Tarapur Railway Pocket", capacityStatus: "OPEN", activeRiderCap: 25 },
      { id: "sil-rangirkhari", name: "Rangirkhari Pocket", capacityStatus: "HIGH_DEMAND", activeRiderCap: 40 },
    ],
  },
  {
    id: "hub-hailakandi-south",
    name: "Hailakandi South Hub",
    city: "Hailakandi",
    pockets: [
      { id: "hld-bazar", name: "Central Bazar Pocket", capacityStatus: "OPEN", activeRiderCap: 20 },
      { id: "hld-college", name: "College Road Pocket", capacityStatus: "OPEN", activeRiderCap: 15 },
      { id: "hld-town", name: "Hailakandi Town Pocket", capacityStatus: "HIGH_DEMAND", activeRiderCap: 25 },
    ],
  },
  {
    id: "hub-guwahati-east",
    name: "Guwahati East Hub",
    city: "Guwahati",
    pockets: [
      { id: "gwy-gsroad", name: "GS Road Pocket", capacityStatus: "HIGH_DEMAND", activeRiderCap: 60 },
      { id: "gwy-dispur", name: "Dispur Capital Pocket", capacityStatus: "OPEN", activeRiderCap: 45 },
      { id: "gwy-sixmile", name: "Six Mile Pocket", capacityStatus: "OPEN", activeRiderCap: 35 },
      { id: "gwy-khanapara", name: "Khanapara Border Pocket", capacityStatus: "OPEN", activeRiderCap: 30 },
    ],
  },
];
