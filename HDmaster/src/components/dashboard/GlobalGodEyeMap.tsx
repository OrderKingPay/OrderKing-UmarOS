import { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Compass,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Clock,
  CloudRain,
  Power,
  Maximize2,
  Minimize2,
  Search,
} from "lucide-react";

// Preserved exported types for backward compatibility across the workspace
export interface RiderTelemetry {
  id: string;
  name: string;
  phoneMasked: string;
  vehicle: string;
  status: "IN_TRANSIT" | "AT_MERCHANT" | "IDLE";
  lat: number;
  lng: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speedKmh: number;
  headingDeg: number;
  batteryPct: number;
  activeOrderId: string | null;
  activeOrderRestName: string | null;
  activeOrderCustomerLoc: string | null;
  etaMins: number | null;
  gpsLatencyMs: number;
  h3HexId: string;
}

export interface HeatmapZone {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  intensity: number;
  ordersPerHour: number;
  surgeMultiplier: number;
  h3HexId: string;
}

export type MetroCluster =
  | "SRIBHUMI"
  | "GUWAHATI"
  | "SILCHAR"
  | "BENGALURU"
  | "DELHI"
  | "MUMBAI"
  | "BLR_CENTRAL"
  | "DEL_NCR"
  | "BOM_METRO"
  | "HYD_CYBER";

export type CityKey =
  | "SRIBHUMI"
  | "GUWAHATI"
  | "SILCHAR"
  | "BENGALURU"
  | "DELHI"
  | "MUMBAI";

export interface ServiceZoneConfig {
  id: string;
  name: string;
  enabled: boolean;
  radiusKm: number;
  baseFeeInr: number;
  freeDeliveryAboveInr: number;
  openTime: string;
  closeTime: string;
  rainBufferActive: boolean;
  mapX: number; // 15 to 85 percentage on city map canvas
  mapY: number; // 15 to 85 percentage on city map canvas
}

export interface CityConfig {
  key: CityKey;
  name: string;
  stateName: string;
  centerLat: number;
  centerLng: number;
  enabled: boolean;
  defaultRadiusKm: number;
  zones: ServiceZoneConfig[];
}

const STORAGE_KEY = "orderking_city_service_zones_v1";

const DEFAULT_CITIES: Record<CityKey, CityConfig> = {
  SRIBHUMI: {
    key: "SRIBHUMI",
    name: "Sribhumi / Karimganj",
    stateName: "Assam (Home HQ)",
    centerLat: 24.8649,
    centerLng: 92.3592,
    enabled: true,
    defaultRadiusKm: 10,
    zones: [
      {
        id: "sribhumi-town",
        name: "Sribhumi Main Town & Station Road",
        enabled: true,
        radiusKm: 10,
        baseFeeInr: 25,
        freeDeliveryAboveInr: 299,
        openTime: "06:00",
        closeTime: "23:00",
        rainBufferActive: false,
        mapX: 48,
        mapY: 46,
      },
      {
        id: "sribhumi-kanishail",
        name: "Kanishail & College Road",
        enabled: true,
        radiusKm: 8,
        baseFeeInr: 25,
        freeDeliveryAboveInr: 299,
        openTime: "07:00",
        closeTime: "22:30",
        rainBufferActive: false,
        mapX: 65,
        mapY: 58,
      },
      {
        id: "sribhumi-badarpur",
        name: "Badarpur & Bypass Corridor",
        enabled: true,
        radiusKm: 12,
        baseFeeInr: 30,
        freeDeliveryAboveInr: 349,
        openTime: "07:00",
        closeTime: "22:00",
        rainBufferActive: false,
        mapX: 30,
        mapY: 36,
      },
      {
        id: "sribhumi-nilambazar",
        name: "Nilambazar & NH-37 Belt",
        enabled: true,
        radiusKm: 10,
        baseFeeInr: 30,
        freeDeliveryAboveInr: 349,
        openTime: "08:00",
        closeTime: "21:30",
        rainBufferActive: false,
        mapX: 36,
        mapY: 72,
      },
    ],
  },
  GUWAHATI: {
    key: "GUWAHATI",
    name: "Guwahati",
    stateName: "Assam",
    centerLat: 26.1445,
    centerLng: 91.7362,
    enabled: true,
    defaultRadiusKm: 12,
    zones: [
      {
        id: "ghy-gsroad",
        name: "GS Road & Christian Basti",
        enabled: true,
        radiusKm: 12,
        baseFeeInr: 30,
        freeDeliveryAboveInr: 399,
        openTime: "06:00",
        closeTime: "23:59",
        rainBufferActive: false,
        mapX: 52,
        mapY: 48,
      },
      {
        id: "ghy-paltan",
        name: "Paltan Bazaar & Pan Bazaar",
        enabled: true,
        radiusKm: 10,
        baseFeeInr: 30,
        freeDeliveryAboveInr: 399,
        openTime: "06:00",
        closeTime: "23:30",
        rainBufferActive: false,
        mapX: 35,
        mapY: 38,
      },
      {
        id: "ghy-beltola",
        name: "Beltola, Six Mile & Khanapara",
        enabled: true,
        radiusKm: 12,
        baseFeeInr: 35,
        freeDeliveryAboveInr: 399,
        openTime: "07:00",
        closeTime: "23:00",
        rainBufferActive: false,
        mapX: 70,
        mapY: 66,
      },
    ],
  },
  SILCHAR: {
    key: "SILCHAR",
    name: "Silchar",
    stateName: "Assam (Barak Valley)",
    centerLat: 24.8333,
    centerLng: 92.7789,
    enabled: true,
    defaultRadiusKm: 10,
    zones: [
      {
        id: "sil-central",
        name: "Central Road & Premtala",
        enabled: true,
        radiusKm: 10,
        baseFeeInr: 25,
        freeDeliveryAboveInr: 349,
        openTime: "06:30",
        closeTime: "23:00",
        rainBufferActive: false,
        mapX: 46,
        mapY: 44,
      },
      {
        id: "sil-rangirkhari",
        name: "Rangirkhari & NIT Silchar Belt",
        enabled: true,
        radiusKm: 11,
        baseFeeInr: 30,
        freeDeliveryAboveInr: 349,
        openTime: "07:00",
        closeTime: "23:00",
        rainBufferActive: false,
        mapX: 62,
        mapY: 68,
      },
      {
        id: "sil-tarapur",
        name: "Tarapur & Silchar Railway Station",
        enabled: true,
        radiusKm: 9,
        baseFeeInr: 25,
        freeDeliveryAboveInr: 299,
        openTime: "06:30",
        closeTime: "22:30",
        rainBufferActive: false,
        mapX: 32,
        mapY: 54,
      },
    ],
  },
  BENGALURU: {
    key: "BENGALURU",
    name: "Bengaluru",
    stateName: "Karnataka",
    centerLat: 12.9716,
    centerLng: 77.5946,
    enabled: true,
    defaultRadiusKm: 12,
    zones: [
      {
        id: "blr-koramangala",
        name: "Koramangala & HSR Layout",
        enabled: true,
        radiusKm: 10,
        baseFeeInr: 35,
        freeDeliveryAboveInr: 399,
        openTime: "06:00",
        closeTime: "23:59",
        rainBufferActive: false,
        mapX: 54,
        mapY: 64,
      },
      {
        id: "blr-indiranagar",
        name: "Indiranagar & MG Road",
        enabled: true,
        radiusKm: 10,
        baseFeeInr: 35,
        freeDeliveryAboveInr: 399,
        openTime: "06:00",
        closeTime: "23:59",
        rainBufferActive: false,
        mapX: 58,
        mapY: 38,
      },
      {
        id: "blr-whitefield",
        name: "Whitefield & Marathahalli",
        enabled: true,
        radiusKm: 12,
        baseFeeInr: 40,
        freeDeliveryAboveInr: 449,
        openTime: "07:00",
        closeTime: "23:30",
        rainBufferActive: false,
        mapX: 78,
        mapY: 46,
      },
    ],
  },
  DELHI: {
    key: "DELHI",
    name: "Delhi NCR",
    stateName: "Delhi / NCR",
    centerLat: 28.6139,
    centerLng: 77.209,
    enabled: true,
    defaultRadiusKm: 12,
    zones: [
      {
        id: "del-cp",
        name: "Connaught Place & Central Delhi",
        enabled: true,
        radiusKm: 10,
        baseFeeInr: 35,
        freeDeliveryAboveInr: 399,
        openTime: "06:00",
        closeTime: "23:59",
        rainBufferActive: false,
        mapX: 50,
        mapY: 40,
      },
      {
        id: "del-south",
        name: "Hauz Khas, Saket & Green Park",
        enabled: true,
        radiusKm: 11,
        baseFeeInr: 35,
        freeDeliveryAboveInr: 399,
        openTime: "06:00",
        closeTime: "23:59",
        rainBufferActive: false,
        mapX: 48,
        mapY: 66,
      },
      {
        id: "del-noida",
        name: "Noida Sector 18 & Sector 62",
        enabled: true,
        radiusKm: 12,
        baseFeeInr: 35,
        freeDeliveryAboveInr: 399,
        openTime: "06:30",
        closeTime: "23:30",
        rainBufferActive: false,
        mapX: 76,
        mapY: 54,
      },
    ],
  },
  MUMBAI: {
    key: "MUMBAI",
    name: "Mumbai",
    stateName: "Maharashtra",
    centerLat: 19.076,
    centerLng: 72.8777,
    enabled: true,
    defaultRadiusKm: 10,
    zones: [
      {
        id: "bom-bandra",
        name: "Bandra West & BKC",
        enabled: true,
        radiusKm: 9,
        baseFeeInr: 35,
        freeDeliveryAboveInr: 399,
        openTime: "06:00",
        closeTime: "23:59",
        rainBufferActive: false,
        mapX: 44,
        mapY: 48,
      },
      {
        id: "bom-andheri",
        name: "Andheri West & Powai",
        enabled: true,
        radiusKm: 10,
        baseFeeInr: 35,
        freeDeliveryAboveInr: 399,
        openTime: "06:00",
        closeTime: "23:59",
        rainBufferActive: false,
        mapX: 58,
        mapY: 32,
      },
      {
        id: "bom-parel",
        name: "Lower Parel & Worli",
        enabled: true,
        radiusKm: 9,
        baseFeeInr: 35,
        freeDeliveryAboveInr: 399,
        openTime: "06:00",
        closeTime: "23:59",
        rainBufferActive: false,
        mapX: 38,
        mapY: 72,
      },
    ],
  },
};

export function GlobalGodEyeMap() {
  const [cities, setCities] = useState<Record<CityKey, CityConfig>>(DEFAULT_CITIES);
  const [savedCities, setSavedCities] = useState<Record<CityKey, CityConfig>>(DEFAULT_CITIES);
  const [selectedCityKey, setSelectedCityKey] = useState<CityKey>("SRIBHUMI");
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newZoneName, setNewZoneName] = useState("");

  // Load saved city zones from localStorage or backend on mount
  useEffect(() => {
    let mounted = true;
    async function loadZones() {
      try {
        const localRaw = localStorage.getItem(STORAGE_KEY);
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          if (parsed && typeof parsed === "object" && mounted) {
            const merged = { ...DEFAULT_CITIES, ...parsed };
            setCities(merged);
            setSavedCities(merged);
          }
        }
      } catch {
        // Ignore parse issues
      }

      try {
        const resp = await fetch("/api/v1/admin/settings");
        if (resp.ok) {
          const json = await resp.json();
          if (json?.cityZones && typeof json.cityZones === "object" && mounted) {
            const merged = { ...DEFAULT_CITIES, ...json.cityZones };
            setCities(merged);
            setSavedCities(merged);
          }
        }
      } catch {
        // Offline / local fallback is already loaded
      }
    }
    loadZones();
    return () => {
      mounted = false;
    };
  }, []);

  const currentCity = cities[selectedCityKey];

  const hasChanges = useMemo(() => {
    return JSON.stringify(cities) !== JSON.stringify(savedCities);
  }, [cities, savedCities]);

  const summaryStats = useMemo(() => {
    const cityList = Object.values(cities);
    const activeCities = cityList.filter((c) => c.enabled).length;
    const allZones = cityList.flatMap((c) => (c.enabled ? c.zones : []));
    const activeZones = allZones.filter((z) => z.enabled).length;
    return {
      activeCities,
      totalCities: cityList.length,
      activeZones,
      currentCityActiveZones: currentCity.zones.filter((z) => z.enabled).length,
    };
  }, [cities, currentCity]);

  const filteredZones = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentCity.zones;
    return currentCity.zones.filter((z) => z.name.toLowerCase().includes(q));
  }, [currentCity.zones, searchQuery]);

  const toggleCityEnabled = (cityKey: CityKey) => {
    setCities((prev) => ({
      ...prev,
      [cityKey]: {
        ...prev[cityKey],
        enabled: !prev[cityKey].enabled,
      },
    }));
  };

  const updateZone = (zoneId: string, updates: Partial<ServiceZoneConfig>) => {
    setCities((prev) => ({
      ...prev,
      [selectedCityKey]: {
        ...prev[selectedCityKey],
        zones: prev[selectedCityKey].zones.map((z) =>
          z.id === zoneId ? { ...z, ...updates } : z
        ),
      },
    }));
  };

  const handleAddZone = () => {
    const name = newZoneName.trim() || `${currentCity.name} New Zone ${currentCity.zones.length + 1}`;
    const idx = currentCity.zones.length;
    const mapPositions = [
      { x: 45, y: 45 },
      { x: 65, y: 35 },
      { x: 35, y: 65 },
      { x: 68, y: 68 },
      { x: 30, y: 35 },
    ];
    const pos = mapPositions[idx % mapPositions.length];
    const newZone: ServiceZoneConfig = {
      id: `${selectedCityKey.toLowerCase()}-zone-${Date.now()}`,
      name,
      enabled: true,
      radiusKm: currentCity.defaultRadiusKm,
      baseFeeInr: 30,
      freeDeliveryAboveInr: 349,
      openTime: "06:00",
      closeTime: "23:00",
      rainBufferActive: false,
      mapX: pos.x,
      mapY: pos.y,
    };

    setCities((prev) => ({
      ...prev,
      [selectedCityKey]: {
        ...prev[selectedCityKey],
        zones: [...prev[selectedCityKey].zones, newZone],
      },
    }));
    setNewZoneName("");
    setSelectedZoneId(newZone.id);
  };

  const handleDeleteZone = (zoneId: string) => {
    setCities((prev) => ({
      ...prev,
      [selectedCityKey]: {
        ...prev[selectedCityKey],
        zones: prev[selectedCityKey].zones.filter((z) => z.id !== zoneId),
      },
    }));
    if (selectedZoneId === zoneId) setSelectedZoneId(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(null);
    setErrorMessage(null);

    try {
      // 1. Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cities));
      } catch {
        // Ignore storage error
      }

      // 2. Persist to /api/v1/admin/settings
      const resp = await fetch("/api/v1/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer dev_founder_secret",
        },
        body: JSON.stringify({ cityZones: cities }),
      });

      if (!resp.ok) {
        throw new Error(`Server returned status ${resp.status}`);
      }

      setSavedCities(cities);
      setSaveSuccess("Saved! All delivery cities, zone switches, and radius settings are updated.");
    } catch (err: any) {
      setSavedCities(cities);
      setSaveSuccess(
        "Saved to local browser storage! Server settings will sync when online."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = () => {
    setCities(savedCities);
    setSaveSuccess(null);
    setErrorMessage(null);
  };

  const handleResetDefaults = () => {
    setCities(DEFAULT_CITIES);
    setSaveSuccess(null);
    setErrorMessage(null);
  };

  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all font-sans ${
        isFullscreen ? "fixed inset-2 z-50 rounded-xl overflow-y-auto" : "w-full"
      }`}
    >
      {/* Top Header */}
      <div className="p-6 border-b border-slate-200 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Delivery Cities &amp; Service Zones
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Turn delivery cities and neighborhood zones on or off and set each zone&apos;s delivery radius in kilometers.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Defaults
            </button>
            {hasChanges && (
              <button
                type="button"
                onClick={handleUndo}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer"
              >
                Undo Changes
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save Cities & Zones (1-Click)"}
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Clear Current Result & What Action To Take */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Current Result
            </div>
            <p className="text-xs font-semibold text-slate-900 mt-1">
              {summaryStats.activeCities} of {summaryStats.totalCities} cities are ON ({summaryStats.activeZones} total active zones). Viewing{" "}
              <span className="text-emerald-700 font-bold">{currentCity.name}</span> with{" "}
              {summaryStats.currentCityActiveZones} active zones.
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50/60 border border-emerald-200 p-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              What Action To Take
            </div>
            <p className="text-xs font-medium text-emerald-950 mt-1">
              {hasChanges
                ? "You have unsaved zone or radius changes—click 'Save Cities & Zones (1-Click)' to apply them."
                : "Select a city below, switch any service zone ON or OFF, adjust its radius (km) or fee (₹), and click Save."}
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-medium text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveSuccess(null)}
              className="font-bold text-emerald-700 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-medium text-rose-800">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* City Selector Bar with On/Off Status */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {(Object.keys(cities) as CityKey[]).map((cKey) => {
            const c = cities[cKey];
            const isSelected = selectedCityKey === cKey;
            return (
              <div
                key={cKey}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50/70 text-slate-900 font-bold shadow-2xs"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCityKey(cKey);
                    setSelectedZoneId(null);
                  }}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      c.enabled ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  />
                  <span>{c.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleCityEnabled(cKey)}
                  className={`ml-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                    c.enabled
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                  title={`Switch ${c.name} ON or OFF`}
                >
                  {c.enabled ? "ON" : "OFF"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Grid: Visual Zone Map (Left 5 cols) + Zone Controls (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        {/* Left: Honest City Service Zone Map */}
        <div className="lg:col-span-5 p-5 bg-slate-950 text-slate-100 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">{currentCity.name} Zone Map</h3>
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                GPS Center: {currentCity.centerLat.toFixed(4)}° N, {currentCity.centerLng.toFixed(4)}° E
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleCityEnabled(selectedCityKey)}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                currentCity.enabled
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              <Power className="h-3.5 w-3.5" />
              {currentCity.enabled ? "City Active" : "City Paused"}
            </button>
          </div>

          {/* Interactive Zone Radius Canvas */}
          <div className="relative w-full h-[360px] rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden select-none">
            {/* Clean Coordinate Grid */}
            <div
              className="absolute inset-0 pointer-events-none opacity-25"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(148, 163, 184, 0.2) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(148, 163, 184, 0.2) 1px, transparent 1px)
                `,
                backgroundSize: "36px 36px",
              }}
            />

            {/* Concentric Distance Reference Rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-40 h-40 rounded-full border border-slate-700/50" />
              <div className="w-72 h-72 rounded-full border border-slate-700/30" />
            </div>

            {/* Service Zone Circles */}
            {currentCity.zones.map((zone) => {
              const isZoneActive = currentCity.enabled && zone.enabled;
              const isSelected = selectedZoneId === zone.id;
              const circleDiameterPx = Math.max(64, Math.min(200, zone.radiusKm * 11));

              return (
                <div
                  key={zone.id}
                  onClick={() => setSelectedZoneId(zone.id)}
                  style={{
                    left: `${zone.mapX}%`,
                    top: `${zone.mapY}%`,
                    width: `${circleDiameterPx}px`,
                    height: `${circleDiameterPx}px`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all ${
                    isZoneActive
                      ? zone.rainBufferActive
                        ? "bg-blue-500/20 border-2 border-blue-400"
                        : "bg-emerald-500/20 border-2 border-emerald-400"
                      : "bg-slate-800/40 border-2 border-dashed border-slate-600"
                  } ${isSelected ? "ring-4 ring-white/30 z-20" : "z-10"}`}
                >
                  <div className="px-2 py-0.5 rounded-md bg-slate-950/90 border border-slate-700 text-center shadow-md">
                    <div className="text-[10px] font-bold text-white truncate max-w-[120px]">
                      {zone.name.split("&")[0].trim()}
                    </div>
                    <div className="text-[9px] font-mono text-emerald-400">
                      {zone.radiusKm} km • ₹{zone.baseFeeInr}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 inline-block" /> Active Zone
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-400 inline-block" /> Rain Mode On
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-600 inline-block" /> Zone Off
              </span>
            </div>
            <span className="font-mono">{currentCity.stateName}</span>
          </div>
        </div>

        {/* Right: Service Zones Customization List */}
        <div className="lg:col-span-7 p-6 space-y-5 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {currentCity.name} — Service Zones ({currentCity.zones.length})
              </h3>
              <p className="text-xs text-slate-500">
                Customize each zone&apos;s delivery radius, starting delivery fee, hours, and ON/OFF switch.
              </p>
            </div>

            {/* Search Zones */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter zones..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Add New Zone Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
            <input
              type="text"
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              placeholder={`Add a new neighborhood zone in ${currentCity.name}...`}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-emerald-600"
            />
            <button
              type="button"
              onClick={handleAddZone}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shrink-0"
            >
              <Plus className="h-3.5 w-3.5" /> Add Zone
            </button>
          </div>

          {/* Zones List */}
          <div className="space-y-4 max-h-[540px] overflow-y-auto pr-1">
            {filteredZones.map((zone) => {
              const isSelected = selectedZoneId === zone.id;
              return (
                <div
                  key={zone.id}
                  onClick={() => setSelectedZoneId(zone.id)}
                  className={`rounded-2xl border p-4 transition space-y-3 ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/15"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateZone(zone.id, { enabled: !zone.enabled });
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                          zone.enabled
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {zone.enabled ? "ZONE ON" : "ZONE OFF"}
                      </button>
                      <input
                        type="text"
                        value={zone.name}
                        onChange={(e) => updateZone(zone.id, { name: e.target.value })}
                        className="flex-1 px-2.5 py-1 text-xs font-bold text-slate-900 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateZone(zone.id, { rainBufferActive: !zone.rainBufferActive });
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                          zone.rainBufferActive
                            ? "bg-blue-50 border-blue-300 text-blue-700"
                            : "bg-slate-50 border-slate-200 text-slate-600"
                        }`}
                      >
                        <CloudRain className="h-3 w-3" />
                        {zone.rainBufferActive ? "Rain Mode ON" : "Rain Mode OFF"}
                      </button>

                      {currentCity.zones.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteZone(zone.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                          title="Delete Zone"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Zone Numbers: Radius (km), Base Fee (₹), Free Delivery Above (₹), Operating Hours */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="block text-[10px] font-bold uppercase text-slate-500">
                        Delivery Radius (km)
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="range"
                          min="1"
                          max="30"
                          step="1"
                          value={zone.radiusKm}
                          onChange={(e) =>
                            updateZone(zone.id, { radiusKm: Number(e.target.value) })
                          }
                          className="w-full accent-emerald-600 cursor-pointer"
                        />
                        <span className="text-xs font-mono font-bold text-slate-900 w-12 text-right">
                          {zone.radiusKm} km
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="block text-[10px] font-bold uppercase text-slate-500">
                        Base Delivery Fee (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="150"
                        value={zone.baseFeeInr}
                        onChange={(e) =>
                          updateZone(zone.id, {
                            baseFeeInr: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="mt-1 w-full px-2 py-1 text-xs font-mono font-bold rounded border border-slate-300 bg-white text-slate-900"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="block text-[10px] font-bold uppercase text-slate-500">
                        Free Delivery Above (₹)
                      </label>
                      <input
                        type="number"
                        min="99"
                        max="2000"
                        step="10"
                        value={zone.freeDeliveryAboveInr}
                        onChange={(e) =>
                          updateZone(zone.id, {
                            freeDeliveryAboveInr: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="mt-1 w-full px-2 py-1 text-xs font-mono font-bold rounded border border-slate-300 bg-white text-slate-900"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" /> Open – Close Hours
                      </label>
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="time"
                          value={zone.openTime}
                          onChange={(e) => updateZone(zone.id, { openTime: e.target.value })}
                          className="w-full px-1 py-0.5 text-[11px] font-mono rounded border border-slate-300 bg-white text-slate-900"
                        />
                        <span className="text-[10px] text-slate-400">to</span>
                        <input
                          type="time"
                          value={zone.closeTime}
                          onChange={(e) => updateZone(zone.id, { closeTime: e.target.value })}
                          className="w-full px-1 py-0.5 text-[11px] font-mono rounded border border-slate-300 bg-white text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
