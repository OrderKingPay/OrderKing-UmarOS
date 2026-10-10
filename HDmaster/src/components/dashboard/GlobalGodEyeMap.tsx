import { useState, useEffect, useRef, useMemo } from "react";
import { 
  Radio, 
  MapPin, 
  Layers, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Search, 
  Activity, 
  Zap, 
  ShieldCheck, 
  Navigation, 
  Bike, 
  Eye, 
  Flame, 
  Crosshair,
  TrendingUp,
  Cpu,
  Clock,
  BatteryCharging,
  Compass
} from "lucide-react";

export interface RiderTelemetry {
  id: string;
  name: string;
  phoneMasked: string;
  vehicle: string;
  status: "IN_TRANSIT" | "AT_MERCHANT" | "IDLE";
  lat: number;
  lng: number;
  x: number; // 0 - 100 percentage in viewport
  y: number; // 0 - 100 percentage in viewport
  vx: number; // velocity delta
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
  x: number; // center 0-100
  y: number;
  radius: number; // px / relative
  intensity: number; // 0.0 - 1.0
  ordersPerHour: number;
  surgeMultiplier: number;
  h3HexId: string;
}

export type MetroCluster = "BLR_CENTRAL" | "DEL_NCR" | "BOM_METRO" | "HYD_CYBER";

const CLUSTER_CONFIG: Record<MetroCluster, { 
  name: string; 
  centerLat: number; 
  centerLng: number; 
  zones: string[];
  boundsLabel: string;
}> = {
  BLR_CENTRAL: {
    name: "Bengaluru Hyper-Cluster",
    centerLat: 12.9716,
    centerLng: 77.5946,
    zones: ["Koramangala 4th Block", "Indiranagar 100ft Rd", "HSR Layout Sector 1", "MG Road Central", "Whitefield ITPL"],
    boundsLabel: "BBMP Zone 04 // 12.9716° N, 77.5946° E",
  },
  DEL_NCR: {
    name: "Delhi NCR Command Hub",
    centerLat: 28.6139,
    centerLng: 77.2090,
    zones: ["Connaught Place", "Cyber City Gurugram", "Hauz Khas Village", "Noida Sector 18", "Aerocity"],
    boundsLabel: "NCR Unified Corridor // 28.6139° N, 77.2090° E",
  },
  BOM_METRO: {
    name: "Mumbai Coastal Matrix",
    centerLat: 19.0760,
    centerLng: 72.8777,
    zones: ["Bandra Kurla Complex", "Bandra West Linking Rd", "Lower Parel Phoenix", "Andheri West Lokhandwala", "Powai Hiranandani"],
    boundsLabel: "MCGM Operational Grid // 19.0760° N, 72.8777° E",
  },
  HYD_CYBER: {
    name: "Hyderabad Cyber Corridor",
    centerLat: 17.3850,
    centerLng: 78.4867,
    zones: ["Hitec City Phase 2", "Madhapur Cyber Towers", "Gachibowli Financial Dist", "Jubilee Hills Rd 36"],
    boundsLabel: "GHMC Tech Geofence // 17.3850° N, 78.4867° E",
  },
};

const INITIAL_RIDERS: Record<MetroCluster, RiderTelemetry[]> = {
  BLR_CENTRAL: [
    {
      id: "RD-8102",
      name: "Ramesh Kannan",
      phoneMasked: "+91 9845X-XX102",
      vehicle: "Ather 450X (EV)",
      status: "IN_TRANSIT",
      lat: 12.9352,
      lng: 77.6245,
      x: 38,
      y: 62,
      vx: 0.18,
      vy: -0.12,
      speedKmh: 34.2,
      headingDeg: 315,
      batteryPct: 84,
      activeOrderId: "OK-8941",
      activeOrderRestName: "Meghana Foods (Koramangala)",
      activeOrderCustomerLoc: "Prestige Acropolis Apt",
      etaMins: 7,
      gpsLatencyMs: 14,
      h3HexId: "88618925d3fffff",
    },
    {
      id: "RD-7749",
      name: "Arjun Somanna",
      phoneMasked: "+91 9741X-XX749",
      vehicle: "TVS iQube (EV)",
      status: "IN_TRANSIT",
      lat: 12.9784,
      lng: 77.6408,
      x: 64,
      y: 35,
      vx: -0.14,
      vy: 0.20,
      speedKmh: 29.8,
      headingDeg: 125,
      batteryPct: 91,
      activeOrderId: "OK-8956",
      activeOrderRestName: "Toit Brewpub (Indiranagar)",
      activeOrderCustomerLoc: "Defence Colony Villa 14",
      etaMins: 5,
      gpsLatencyMs: 11,
      h3HexId: "88618925dbfffff",
    },
    {
      id: "RD-9214",
      name: "Manoj Gowda",
      phoneMasked: "+91 9900X-XX214",
      vehicle: "Bajaj Chetak EV",
      status: "AT_MERCHANT",
      lat: 12.9121,
      lng: 77.6446,
      x: 72,
      y: 78,
      vx: 0.02,
      vy: 0.01,
      speedKmh: 0.0,
      headingDeg: 90,
      batteryPct: 76,
      activeOrderId: "OK-8970",
      activeOrderRestName: "Truffles (HSR Layout)",
      activeOrderCustomerLoc: "Sector 3 Parkside Res",
      etaMins: 14,
      gpsLatencyMs: 19,
      h3HexId: "88618925c5fffff",
    },
    {
      id: "RD-6320",
      name: "Syed Nayeem",
      phoneMasked: "+91 9611X-XX320",
      vehicle: "Honda Activa 6G",
      status: "IN_TRANSIT",
      lat: 12.9756,
      lng: 77.6094,
      x: 48,
      y: 42,
      vx: 0.22,
      vy: 0.16,
      speedKmh: 38.6,
      headingDeg: 45,
      batteryPct: 62,
      activeOrderId: "OK-8962",
      activeOrderRestName: "Church Street Social",
      activeOrderCustomerLoc: "Lavelle Road Penthouse",
      etaMins: 4,
      gpsLatencyMs: 16,
      h3HexId: "88618925d7fffff",
    },
    {
      id: "RD-4401",
      name: "Pradeep Shetty",
      phoneMasked: "+91 9448X-XX401",
      vehicle: "Ola S1 Pro (EV)",
      status: "IDLE",
      lat: 12.9601,
      lng: 77.5802,
      x: 24,
      y: 50,
      vx: 0.05,
      vy: -0.04,
      speedKmh: 12.4,
      headingDeg: 270,
      batteryPct: 95,
      activeOrderId: null,
      activeOrderRestName: null,
      activeOrderCustomerLoc: null,
      etaMins: null,
      gpsLatencyMs: 12,
      h3HexId: "88618925c1fffff",
    },
    {
      id: "RD-5512",
      name: "Vikas Reddy",
      phoneMasked: "+91 9886X-XX512",
      vehicle: "Hero Splendor iSmart",
      status: "IN_TRANSIT",
      lat: 12.9850,
      lng: 77.7280,
      x: 85,
      y: 28,
      vx: -0.16,
      vy: 0.11,
      speedKmh: 42.1,
      headingDeg: 195,
      batteryPct: 58,
      activeOrderId: "OK-8985",
      activeOrderRestName: "Windmills Craftworks",
      activeOrderCustomerLoc: "Prestige Shantiniketan",
      etaMins: 9,
      gpsLatencyMs: 18,
      h3HexId: "88618925e9fffff",
    },
    {
      id: "RD-3180",
      name: "Kiran Kumar",
      phoneMasked: "+91 9731X-XX180",
      vehicle: "Ather 450S",
      status: "IN_TRANSIT",
      lat: 12.9279,
      lng: 77.6271,
      x: 44,
      y: 70,
      vx: 0.12,
      vy: 0.15,
      speedKmh: 26.5,
      headingDeg: 75,
      batteryPct: 69,
      activeOrderId: "OK-8991",
      activeOrderRestName: "Nagarjuna Restaurant",
      activeOrderCustomerLoc: "ST Bed Layout",
      etaMins: 6,
      gpsLatencyMs: 15,
      h3HexId: "88618925d1fffff",
    },
    {
      id: "RD-9055",
      name: "Deepak Yadav",
      phoneMasked: "+91 9980X-XX055",
      vehicle: "Revolt RV400 (EV)",
      status: "AT_MERCHANT",
      lat: 12.9698,
      lng: 77.6499,
      x: 68,
      y: 48,
      vx: 0.0,
      vy: 0.0,
      speedKmh: 0.0,
      headingDeg: 180,
      batteryPct: 78,
      activeOrderId: "OK-8997",
      activeOrderRestName: "Glen's Bakehouse",
      activeOrderCustomerLoc: "Domlur Stage 2",
      etaMins: 12,
      gpsLatencyMs: 13,
      h3HexId: "88618925d9fffff",
    },
  ],
  DEL_NCR: [
    {
      id: "RD-2010",
      name: "Rohit Sharma",
      phoneMasked: "+91 9811X-XX010",
      vehicle: "TVS iQube",
      status: "IN_TRANSIT",
      lat: 28.6304,
      lng: 77.2177,
      x: 52,
      y: 38,
      vx: 0.15,
      vy: 0.12,
      speedKmh: 36.4,
      headingDeg: 110,
      batteryPct: 89,
      activeOrderId: "OK-7712",
      activeOrderRestName: "Saravana Bhavan (CP)",
      activeOrderCustomerLoc: "Barakhamba Road Office 4B",
      etaMins: 6,
      gpsLatencyMs: 13,
      h3HexId: "883da11231fffff",
    },
    {
      id: "RD-2045",
      name: "Amit Choudhary",
      phoneMasked: "+91 9910X-XX045",
      vehicle: "Ather 450X",
      status: "IN_TRANSIT",
      lat: 28.4947,
      lng: 77.0886,
      x: 25,
      y: 75,
      vx: 0.18,
      vy: -0.15,
      speedKmh: 41.2,
      headingDeg: 330,
      batteryPct: 74,
      activeOrderId: "OK-7729",
      activeOrderRestName: "Burma Burma (CyberHub)",
      activeOrderCustomerLoc: "DLF Phase 2 Tower C",
      etaMins: 8,
      gpsLatencyMs: 15,
      h3HexId: "883da11239fffff",
    },
    {
      id: "RD-2088",
      name: "Jaspreet Singh",
      phoneMasked: "+91 9871X-XX088",
      vehicle: "Hero Splendor",
      status: "AT_MERCHANT",
      lat: 28.5535,
      lng: 77.2069,
      x: 46,
      y: 65,
      vx: 0.01,
      vy: 0.02,
      speedKmh: 0.0,
      headingDeg: 0,
      batteryPct: 92,
      activeOrderId: "OK-7734",
      activeOrderRestName: "Imperfecto (Hauz Khas)",
      activeOrderCustomerLoc: "Green Park Main",
      etaMins: 11,
      gpsLatencyMs: 12,
      h3HexId: "883da11235fffff",
    },
    {
      id: "RD-2104",
      name: "Gaurav Tyagi",
      phoneMasked: "+91 9899X-XX104",
      vehicle: "Bajaj Chetak EV",
      status: "IDLE",
      lat: 28.5700,
      lng: 77.3200,
      x: 82,
      y: 55,
      vx: 0.04,
      vy: 0.04,
      speedKmh: 14.5,
      headingDeg: 45,
      batteryPct: 83,
      activeOrderId: null,
      activeOrderRestName: null,
      activeOrderCustomerLoc: null,
      etaMins: null,
      gpsLatencyMs: 17,
      h3HexId: "883da1123dfffff",
    },
  ],
  BOM_METRO: [
    {
      id: "RD-3011",
      name: "Siddhesh Jadhav",
      phoneMasked: "+91 9820X-XX011",
      vehicle: "Ather 450X",
      status: "IN_TRANSIT",
      lat: 19.0657,
      lng: 72.8683,
      x: 58,
      y: 44,
      vx: -0.16,
      vy: 0.14,
      speedKmh: 33.5,
      headingDeg: 210,
      batteryPct: 87,
      activeOrderId: "OK-6120",
      activeOrderRestName: "Yauatcha (BKC)",
      activeOrderCustomerLoc: "ONE BKC Tower B, Fl 11",
      etaMins: 5,
      gpsLatencyMs: 14,
      h3HexId: "8860145ab3fffff",
    },
    {
      id: "RD-3042",
      name: "Prathamesh Sawant",
      phoneMasked: "+91 9833X-XX042",
      vehicle: "Ola S1 Pro",
      status: "IN_TRANSIT",
      lat: 19.0596,
      lng: 72.8295,
      x: 32,
      y: 52,
      vx: 0.20,
      vy: -0.10,
      speedKmh: 37.8,
      headingDeg: 290,
      batteryPct: 69,
      activeOrderId: "OK-6145",
      activeOrderRestName: "Bastian (Bandra West)",
      activeOrderCustomerLoc: "Pali Hill Villa Horizon",
      etaMins: 4,
      gpsLatencyMs: 12,
      h3HexId: "8860145ab7fffff",
    },
    {
      id: "RD-3099",
      name: "Nilesh Parab",
      phoneMasked: "+91 9920X-XX099",
      vehicle: "Honda Activa",
      status: "AT_MERCHANT",
      lat: 19.0016,
      lng: 72.8302,
      x: 35,
      y: 78,
      vx: 0.0,
      vy: 0.0,
      speedKmh: 0.0,
      headingDeg: 90,
      batteryPct: 81,
      activeOrderId: "OK-6158",
      activeOrderRestName: "The Bombay Canteen",
      activeOrderCustomerLoc: "Kamala Mills Compound",
      etaMins: 15,
      gpsLatencyMs: 16,
      h3HexId: "8860145abdfffff",
    },
  ],
  HYD_CYBER: [
    {
      id: "RD-4001",
      name: "Karthik Varma",
      phoneMasked: "+91 9848X-XX001",
      vehicle: "Ather 450X",
      status: "IN_TRANSIT",
      lat: 17.4474,
      lng: 78.3762,
      x: 42,
      y: 40,
      vx: 0.21,
      vy: 0.12,
      speedKmh: 39.4,
      headingDeg: 60,
      batteryPct: 90,
      activeOrderId: "OK-5012",
      activeOrderRestName: "Pista House (Hitec City)",
      activeOrderCustomerLoc: "Mindspace IT Park Building 9",
      etaMins: 6,
      gpsLatencyMs: 11,
      h3HexId: "8861e93891fffff",
    },
    {
      id: "RD-4022",
      name: "Siva Krishna",
      phoneMasked: "+91 9949X-XX022",
      vehicle: "TVS iQube",
      status: "IN_TRANSIT",
      lat: 17.4325,
      lng: 78.4070,
      x: 65,
      y: 55,
      vx: -0.15,
      vy: -0.18,
      speedKmh: 35.1,
      headingDeg: 235,
      batteryPct: 77,
      activeOrderId: "OK-5034",
      activeOrderRestName: "Chutneys (Jubilee Hills)",
      activeOrderCustomerLoc: "Road No 45 Skyview Res",
      etaMins: 7,
      gpsLatencyMs: 14,
      h3HexId: "8861e93897fffff",
    },
  ],
};

const INITIAL_HEATMAP: Record<MetroCluster, HeatmapZone[]> = {
  BLR_CENTRAL: [
    { id: "HM-1", name: "Koramangala 4th-7th Block", x: 42, y: 64, radius: 110, intensity: 0.94, ordersPerHour: 184, surgeMultiplier: 1.85, h3HexId: "88618925d3fffff" },
    { id: "HM-2", name: "Indiranagar 100ft & 12th Main", x: 62, y: 38, radius: 95, intensity: 0.88, ordersPerHour: 152, surgeMultiplier: 1.60, h3HexId: "88618925dbfffff" },
    { id: "HM-3", name: "HSR Layout Sectors 1-4", x: 70, y: 76, radius: 85, intensity: 0.79, ordersPerHour: 118, surgeMultiplier: 1.40, h3HexId: "88618925c5fffff" },
    { id: "HM-4", name: "MG Road & Church Street", x: 48, y: 44, radius: 80, intensity: 0.82, ordersPerHour: 130, surgeMultiplier: 1.45, h3HexId: "88618925d7fffff" },
    { id: "HM-5", name: "Whitefield ITPL Hub", x: 84, y: 30, radius: 75, intensity: 0.65, ordersPerHour: 86, surgeMultiplier: 1.20, h3HexId: "88618925e9fffff" },
  ],
  DEL_NCR: [
    { id: "HM-D1", name: "Connaught Place Inner Circle", x: 50, y: 40, radius: 100, intensity: 0.92, ordersPerHour: 176, surgeMultiplier: 1.80, h3HexId: "883da11231fffff" },
    { id: "HM-D2", name: "CyberHub Gurgaon", x: 26, y: 74, radius: 90, intensity: 0.89, ordersPerHour: 164, surgeMultiplier: 1.70, h3HexId: "883da11239fffff" },
    { id: "HM-D3", name: "Hauz Khas & Green Park", x: 47, y: 64, radius: 80, intensity: 0.75, ordersPerHour: 110, surgeMultiplier: 1.35, h3HexId: "883da11235fffff" },
    { id: "HM-D4", name: "Noida Sector 18 Atta Market", x: 80, y: 56, radius: 75, intensity: 0.71, ordersPerHour: 98, surgeMultiplier: 1.25, h3HexId: "883da1123dfffff" },
  ],
  BOM_METRO: [
    { id: "HM-M1", name: "Bandra Kurla Complex (BKC)", x: 56, y: 46, radius: 105, intensity: 0.95, ordersPerHour: 196, surgeMultiplier: 1.95, h3HexId: "8860145ab3fffff" },
    { id: "HM-M2", name: "Bandra West (Pali Hill / Carter)", x: 33, y: 54, radius: 90, intensity: 0.86, ordersPerHour: 148, surgeMultiplier: 1.55, h3HexId: "8860145ab7fffff" },
    { id: "HM-M3", name: "Lower Parel Commercial Towers", x: 36, y: 76, radius: 85, intensity: 0.81, ordersPerHour: 134, surgeMultiplier: 1.50, h3HexId: "8860145abdfffff" },
  ],
  HYD_CYBER: [
    { id: "HM-H1", name: "Hitec City Cyber Towers", x: 44, y: 42, radius: 100, intensity: 0.91, ordersPerHour: 168, surgeMultiplier: 1.75, h3HexId: "8861e93891fffff" },
    { id: "HM-H2", name: "Jubilee Hills Road 36 & 45", x: 63, y: 54, radius: 85, intensity: 0.83, ordersPerHour: 136, surgeMultiplier: 1.50, h3HexId: "8861e93897fffff" },
  ],
};

interface TelemetryPingLog {
  timestamp: string;
  riderId: string;
  lat: number;
  lng: number;
  speed: number;
  activeOrder: string | null;
  status: string;
}

export function GlobalGodEyeMap() {
  const [currentCluster, setCurrentCluster] = useState<MetroCluster>("BLR_CENTRAL");
  const [riders, setRiders] = useState<RiderTelemetry[]>(INITIAL_RIDERS.BLR_CENTRAL);
  const [heatmaps, setHeatmaps] = useState<HeatmapZone[]>(INITIAL_HEATMAP.BLR_CENTRAL);
  const [selectedRider, setSelectedRider] = useState<RiderTelemetry | null>(null);
  const [selectedZone, setSelectedZone] = useState<HeatmapZone | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Layer toggles
  const [showRiders, setShowRiders] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showHexGrid, setShowHexGrid] = useState(true);
  const [showCorridors, setShowCorridors] = useState(true);
  
  // Filter
  const [riderFilter, setRiderFilter] = useState<"ALL" | "IN_TRANSIT" | "AT_MERCHANT" | "IDLE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Real-time telemetry feed
  const [pingLogs, setPingLogs] = useState<TelemetryPingLog[]>([]);
  const [lastHeartbeat, setLastHeartbeat] = useState<string>(new Date().toLocaleTimeString('en-US', { hour12: false }));
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Sync cluster change
  useEffect(() => {
    setRiders(INITIAL_RIDERS[currentCluster]);
    setHeatmaps(INITIAL_HEATMAP[currentCluster]);
    setSelectedRider(null);
    setSelectedZone(null);
  }, [currentCluster]);

  // Live telemetry physics simulation engine (updates positions every 1.5s with micro-jitter and vector heading)
  useEffect(() => {
    const interval = setInterval(() => {
      setRiders((prevRiders) => {
        const updated = prevRiders.map((r) => {
          if (r.status === "AT_MERCHANT") {
            // Slight jitter at merchant location
            return {
              ...r,
              gpsLatencyMs: 10 + Math.floor(Math.random() * 8),
              batteryPct: Math.max(12, r.batteryPct - (Math.random() > 0.95 ? 1 : 0)),
            };
          }

          // Advance position along velocity vector
          let nextX = r.x + r.vx;
          let nextY = r.y + r.vy;
          let nextVx = r.vx;
          let nextVy = r.vy;

          // Soft boundary bounce within viewport box (10% to 90%)
          if (nextX < 12 || nextX > 88) {
            nextVx = -nextVx;
            nextX = Math.max(12, Math.min(88, nextX));
          }
          if (nextY < 15 || nextY > 85) {
            nextVy = -nextVy;
            nextY = Math.max(15, Math.min(85, nextY));
          }

          // Micro speed modulation
          const speedMod = (Math.random() - 0.5) * 3;
          const nextSpeed = Math.max(18, Math.min(48, +(r.speedKmh + speedMod).toFixed(1)));
          const nextHeading = Math.round((Math.atan2(nextVy, nextVx) * 180) / Math.PI + 90);

          return {
            ...r,
            x: +nextX.toFixed(2),
            y: +nextY.toFixed(2),
            vx: nextVx,
            vy: nextVy,
            speedKmh: nextSpeed,
            headingDeg: nextHeading >= 0 ? nextHeading : nextHeading + 360,
            gpsLatencyMs: 9 + Math.floor(Math.random() * 12),
            batteryPct: Math.max(8, r.batteryPct - (Math.random() > 0.92 ? 1 : 0)),
          };
        });

        // Add a random ping log
        const randomRider = updated[Math.floor(Math.random() * updated.length)];
        if (randomRider) {
          const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false }) + "." + String(Math.floor(Math.random() * 900) + 100);
          setPingLogs((logs) => [
            {
              timestamp: nowStr,
              riderId: randomRider.id,
              lat: +(randomRider.lat + (randomRider.x - 50) * 0.001).toFixed(4),
              lng: +(randomRider.lng + (randomRider.y - 50) * 0.001).toFixed(4),
              speed: randomRider.speedKmh,
              activeOrder: randomRider.activeOrderId,
              status: randomRider.status,
            },
            ...logs.slice(0, 7),
          ]);
        }

        return updated;
      });

      setLastHeartbeat(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1500);

    return () => clearInterval(interval);
  }, [currentCluster]);

  // Keep selected rider updated if rider moves
  useEffect(() => {
    if (selectedRider) {
      const match = riders.find((r) => r.id === selectedRider.id);
      if (match) setSelectedRider(match);
    }
  }, [riders, selectedRider]);

  const filteredRiders = useMemo(() => {
    return riders.filter((r) => {
      if (riderFilter !== "ALL" && r.status !== riderFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.id.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.vehicle.toLowerCase().includes(q) ||
          (r.activeOrderId && r.activeOrderId.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [riders, riderFilter, searchQuery]);

  const fleetStats = useMemo(() => {
    const total = riders.length;
    const inTransit = riders.filter((r) => r.status === "IN_TRANSIT").length;
    const atMerchant = riders.filter((r) => r.status === "AT_MERCHANT").length;
    const idle = riders.filter((r) => r.status === "IDLE").length;
    const avgSpeed = (riders.reduce((acc, r) => acc + r.speedKmh, 0) / (total || 1)).toFixed(1);
    const avgLatency = Math.round(riders.reduce((acc, r) => acc + r.gpsLatencyMs, 0) / (total || 1));
    const totalOrders = heatmaps.reduce((acc, z) => acc + z.ordersPerHour, 0);
    const maxSurge = Math.max(...heatmaps.map((z) => z.surgeMultiplier), 1.0);

    return { total, inTransit, atMerchant, idle, avgSpeed, avgLatency, totalOrders, maxSurge };
  }, [riders, heatmaps]);

  return (
    <div 
      className={`relative bg-slate-950 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 font-sans ${
        isFullscreen ? "fixed inset-2 z-50 rounded-xl" : "w-full"
      }`}
    >
      {/* High-Tech Tactical Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-emerald-500/20 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Title & Live Status */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wider uppercase text-white flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-emerald-400" />
                GLOBAL FLEET RADAR // LIVE GEOSPATIAL DISPATCH
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 tracking-widest animate-pulse">
                SUB-SECOND TELEMETRY
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              {CLUSTER_CONFIG[currentCluster].boundsLabel} • PING: <span className="text-emerald-400 font-bold">{fleetStats.avgLatency}ms</span> • SYNC: {lastHeartbeat}
            </p>
          </div>
        </div>

        {/* Cluster / Metro Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5">
            {(Object.keys(CLUSTER_CONFIG) as MetroCluster[]).map((cKey) => (
              <button
                key={cKey}
                onClick={() => setCurrentCluster(cKey)}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition-all ${
                  currentCluster === cKey
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {cKey.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Layer Quick Toggles */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-900/80 border border-slate-800/80 rounded-lg p-1 text-xs font-mono">
            <button
              onClick={() => setShowRiders(!showRiders)}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                showRiders ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-slate-500 line-through"
              }`}
              title="Toggle Rider Telemetry Markers"
            >
              <Bike className="w-3 h-3" /> Riders
            </button>
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                showHeatmap ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-slate-500 line-through"
              }`}
              title="Toggle Order Density Heatmap Contours"
            >
              <Flame className="w-3 h-3" /> Heatmap
            </button>
            <button
              onClick={() => setShowHexGrid(!showHexGrid)}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                showHexGrid ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-500 line-through"
              }`}
              title="Toggle H3 Geospatial Hexagonal Partitioning"
            >
              <Layers className="w-3 h-3" /> H3 Hex
            </button>
            <button
              onClick={() => setShowCorridors(!showCorridors)}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                showCorridors ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-slate-500 line-through"
              }`}
              title="Toggle In-Transit Dispatch Vector Corridors"
            >
              <Navigation className="w-3 h-3" /> Corridors
            </button>
          </div>

          {/* Fullscreen & Reset Zoom */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoomLevel((z) => (z >= 1.5 ? 1 : +(z + 0.25).toFixed(2)))}
              className="px-2 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded text-xs font-mono"
              title="Zoom Level"
            >
              {zoomLevel}x
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded"
              title="Toggle Fullscreen Canvas"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Metric Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 border-b border-white/5 bg-slate-950/80 text-xs font-mono divide-x divide-white/5">
        <div className="px-4 py-2.5 flex flex-col">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ACTIVE FLEET</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold text-emerald-400">{fleetStats.total}</span>
            <span className="text-[10px] text-slate-400">ONLINE</span>
          </div>
        </div>
        <div className="px-4 py-2.5 flex flex-col">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">IN TRANSIT</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold text-cyan-400">{fleetStats.inTransit}</span>
            <span className="text-[10px] text-cyan-500/80">DISPATCHED</span>
          </div>
        </div>
        <div className="px-4 py-2.5 flex flex-col">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AT RESTAURANT</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold text-amber-400">{fleetStats.atMerchant}</span>
            <span className="text-[10px] text-amber-500/80">PICKING UP</span>
          </div>
        </div>
        <div className="px-4 py-2.5 flex flex-col">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AVG VELOCITY</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold text-slate-200">{fleetStats.avgSpeed}</span>
            <span className="text-[10px] text-slate-400">KM/H</span>
          </div>
        </div>
        <div className="px-4 py-2.5 flex flex-col">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">DEMAND INTENSITY</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold text-indigo-400">{fleetStats.totalOrders}</span>
            <span className="text-[10px] text-indigo-400/80">ORDERS/HR</span>
          </div>
        </div>
        <div className="px-4 py-2.5 flex flex-col">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">PEAK SURGE</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold text-rose-400">{fleetStats.maxSurge}x</span>
            <span className="text-[10px] text-rose-400/80">SURGE CAP</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Map Canvas Container */}
      <div className="relative w-full h-[520px] bg-[#030712] overflow-hidden select-none">
        
        {/* Subtle Cyber Radar Grid Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-30" 
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.08) 0%, transparent 70%),
              linear-gradient(rgba(31, 41, 55, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(31, 41, 55, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: "100% 100%, 40px 40px, 40px 40px"
          }}
        />

        {/* Radar Concentric Rings centered on core metro area */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[300px] h-[300px] rounded-full border border-emerald-500/10" />
          <div className="w-[520px] h-[520px] rounded-full border border-emerald-500/5" />
          <div className="w-[740px] h-[740px] rounded-full border border-emerald-500/[0.03]" />
          
          {/* Sweeping Radar Scanner Line */}
          <div 
            className="absolute w-[460px] h-[460px] rounded-full pointer-events-none opacity-20"
            style={{
              background: "conic-gradient(from 0deg at 50% 50%, rgba(16, 185, 129, 0.4) 0deg, transparent 60deg, transparent 360deg)",
              animation: "spin 12s linear infinite",
            }}
          />
        </div>

        {/* Vector SVG Layer: Arterial Delivery Corridors & H3 Hexagonal Grid */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1000 600" 
          preserveAspectRatio="none"
        >
          <defs>
            {/* Radiant Heatmap Radial Gradients */}
            {heatmaps.map((hm) => (
              <radialGradient key={`grad-${hm.id}`} id={`grad-${hm.id}`}>
                <stop offset="0%" stopColor="#ef4444" stopOpacity={hm.intensity * 0.55} />
                <stop offset="35%" stopColor="#f59e0b" stopOpacity={hm.intensity * 0.38} />
                <stop offset="70%" stopColor="#06b6d4" stopOpacity={hm.intensity * 0.20} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </radialGradient>
            ))}
            
            {/* Animated Corridor Stroke Pattern */}
            <linearGradient id="corridorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Layer: Order Density Heatmap Fields */}
          {showHeatmap && heatmaps.map((hm) => {
            const cx = hm.x * 10;
            const cy = hm.y * 6;
            return (
              <g key={`heat-field-${hm.id}`} className="transition-all duration-700">
                <circle
                  cx={cx}
                  cy={cy}
                  r={hm.radius * 1.5}
                  fill={`url(#grad-${hm.id})`}
                  className="filter blur-xl"
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={hm.radius * 0.8}
                  fill={`url(#grad-${hm.id})`}
                  className="filter blur-md animate-pulse"
                  style={{ animationDuration: "3s" }}
                />
              </g>
            );
          })}

          {/* Layer: H3 Hexagonal Mesh Simulation */}
          {showHexGrid && (
            <g stroke="rgba(6, 182, 212, 0.15)" strokeWidth="1" fill="none">
              {/* Simulated H3 Level-8 Hexagonal Cells */}
              {[
                { cx: 380, cy: 370 }, { cx: 460, cy: 370 }, { cx: 540, cy: 370 },
                { cx: 340, cy: 300 }, { cx: 420, cy: 300 }, { cx: 500, cy: 300 }, { cx: 580, cy: 300 },
                { cx: 380, cy: 230 }, { cx: 460, cy: 230 }, { cx: 540, cy: 230 }, { cx: 620, cy: 230 },
                { cx: 660, cy: 190 }, { cx: 740, cy: 190 }, { cx: 700, cy: 260 }, { cx: 780, cy: 260 },
                { cx: 220, cy: 430 }, { cx: 300, cy: 430 }, { cx: 380, cy: 430 }, { cx: 460, cy: 430 }
              ].map((hex, i) => {
                const r = 42;
                const points = Array.from({ length: 6 }).map((_, ptIdx) => {
                  const angle = (ptIdx * 60 * Math.PI) / 180;
                  return `${hex.cx + r * Math.cos(angle)},${hex.cy + r * Math.sin(angle)}`;
                }).join(" ");
                return (
                  <polygon 
                    key={`h3-${i}`} 
                    points={points} 
                    className="hover:stroke-cyan-400 hover:fill-cyan-500/10 transition-colors pointer-events-auto cursor-crosshair" 
                  />
                );
              })}
            </g>
          )}

          {/* Layer: Animated Transit Corridors */}
          {showCorridors && (
            <g>
              {/* Simulated arterial corridors connecting major restaurants to customer delivery vectors */}
              <path
                d="M 380 370 Q 420 320 540 230 T 640 210"
                stroke="url(#corridorGrad)"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                fill="none"
                className="opacity-70 animate-[dash_20s_linear_infinite]"
              />
              <path
                d="M 480 250 Q 550 310 680 440"
                stroke="url(#corridorGrad)"
                strokeWidth="2"
                strokeDasharray="5 5"
                fill="none"
                className="opacity-50"
              />
              <path
                d="M 240 300 Q 340 370 480 360"
                stroke="url(#corridorGrad)"
                strokeWidth="2"
                strokeDasharray="4 4"
                fill="none"
                className="opacity-60"
              />
            </g>
          )}
        </svg>

        {/* Heatmap Zone Badges (Interactive clickable zone nodes) */}
        {showHeatmap && heatmaps.map((hm) => (
          <div
            key={hm.id}
            onClick={() => setSelectedZone(hm)}
            style={{ left: `${hm.x}%`, top: `${hm.y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 transition-transform hover:scale-110 ${
              selectedZone?.id === hm.id ? "scale-110 z-20" : ""
            }`}
          >
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/90 border border-amber-500/60 shadow-lg shadow-amber-950/40 text-[10px] font-mono text-amber-300 whitespace-nowrap">
                <Flame className="w-3 h-3 text-amber-400 animate-bounce" />
                <span className="font-bold">{hm.name.split(" ")[0]}</span>
                <span className="text-rose-400 font-extrabold bg-rose-950/80 px-1 rounded">{hm.surgeMultiplier}x</span>
              </div>
              <span className="text-[9px] font-mono text-slate-400 bg-black/60 px-1 rounded mt-0.5">
                {hm.ordersPerHour} ord/hr
              </span>
            </div>
          </div>
        ))}

        {/* Rider Markers (Interactive, smoothly moving telemetry nodes) */}
        {showRiders && filteredRiders.map((r) => {
          const isSelected = selectedRider?.id === r.id;
          const statusBg = 
            r.status === "IN_TRANSIT" 
              ? "bg-emerald-500 shadow-emerald-500/50" 
              : r.status === "AT_MERCHANT" 
              ? "bg-amber-500 shadow-amber-500/50" 
              : "bg-cyan-500 shadow-cyan-500/50";

          return (
            <div
              key={r.id}
              onClick={() => setSelectedRider(r)}
              style={{ 
                left: `${r.x}%`, 
                top: `${r.y}%`,
                transition: "left 1.4s ease-out, top 1.4s ease-out"
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group transition-transform ${
                isSelected ? "scale-125 z-30" : "hover:scale-115"
              }`}
            >
              {/* Radar beacon pulsing wave around active rider */}
              <div 
                className={`absolute -inset-2 rounded-full opacity-40 animate-ping ${
                  r.status === "IN_TRANSIT" ? "bg-emerald-400" : r.status === "AT_MERCHANT" ? "bg-amber-400" : "bg-cyan-400"
                }`}
              />

              {/* Rider Marker Pin */}
              <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-slate-950 text-slate-950 font-bold shadow-lg ${statusBg}`}>
                <Bike className="w-4 h-4 text-slate-950" />
                
                {/* Heading Direction Arrow */}
                <div 
                  className="absolute -top-1.5 w-2 h-2 border-l-2 border-t-2 border-white transform rotate-45"
                  style={{ transform: `rotate(${r.headingDeg}deg) translateY(-8px)` }}
                />
              </div>

              {/* Miniature Tag below marker */}
              <div className="absolute top-8 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-slate-950/90 border border-slate-800 rounded text-[9px] font-mono text-slate-200 whitespace-nowrap shadow-md pointer-events-none">
                {r.id} • {r.speedKmh > 0 ? `${r.speedKmh}k` : "IDLE"}
              </div>

              {/* Hover Tactical Tooltip */}
              <div className="absolute bottom-9 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-slate-900 border border-emerald-500/60 p-2 rounded-lg text-xs font-mono text-white shadow-2xl z-40 w-48 pointer-events-none">
                <div className="flex justify-between items-center border-b border-slate-800 pb-1 mb-1">
                  <span className="font-bold text-emerald-400">{r.id}</span>
                  <span className="text-[10px] text-slate-400">{r.vehicle.split(" ")[0]}</span>
                </div>
                <div className="text-[11px] text-slate-200 font-semibold">{r.name}</div>
                <div className="text-[10px] text-slate-400 flex justify-between mt-1">
                  <span>Speed: {r.speedKmh} km/h</span>
                  <span>Bat: {r.batteryPct}%</span>
                </div>
                {r.activeOrderId && (
                  <div className="text-[10px] text-cyan-300 mt-1 border-t border-slate-800 pt-1">
                    Order: {r.activeOrderId} ({r.etaMins}m ETA)
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Selected Rider Tactical HUD Side-Card */}
        {selectedRider && (
          <div className="absolute top-4 right-4 z-40 w-80 bg-slate-900/95 border border-emerald-500/60 rounded-xl p-4 shadow-2xl backdrop-blur-xl font-mono text-xs text-white animate-in fade-in slide-in-from-right duration-200">
            <div className="flex justify-between items-start border-b border-white/10 pb-2.5 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-emerald-400">{selectedRider.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedRider.status === "IN_TRANSIT" 
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800" 
                      : selectedRider.status === "AT_MERCHANT"
                      ? "bg-amber-950 text-amber-300 border border-amber-800"
                      : "bg-cyan-950 text-cyan-300 border border-cyan-800"
                  }`}>
                    {selectedRider.status}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-200 mt-0.5">{selectedRider.name}</div>
                <div className="text-[11px] text-slate-400">{selectedRider.phoneMasked}</div>
              </div>
              <button 
                onClick={() => setSelectedRider(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between p-1.5 rounded bg-slate-950/60 border border-white/5">
                <span className="text-slate-400 flex items-center gap-1"><Compass className="w-3 h-3 text-cyan-400" /> Vehicle:</span>
                <span className="font-semibold text-cyan-300">{selectedRider.vehicle}</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-slate-950/60 border border-white/5">
                <span className="text-slate-400 flex items-center gap-1"><Activity className="w-3 h-3 text-emerald-400" /> Live Velocity:</span>
                <span className="font-semibold text-emerald-300">{selectedRider.speedKmh} km/h (Heading {selectedRider.headingDeg}°)</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-slate-950/60 border border-white/5">
                <span className="text-slate-400 flex items-center gap-1"><BatteryCharging className="w-3 h-3 text-amber-400" /> Battery / Fuel:</span>
                <span className="font-semibold text-amber-300">{selectedRider.batteryPct}% (Telemetry Latency: {selectedRider.gpsLatencyMs}ms)</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-slate-950/60 border border-white/5">
                <span className="text-slate-400 flex items-center gap-1"><Layers className="w-3 h-3 text-indigo-400" /> H3 Hex Cell:</span>
                <span className="font-semibold text-indigo-300">#{selectedRider.h3HexId.slice(0, 10)}...</span>
              </div>

              {selectedRider.activeOrderId ? (
                <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                  <div className="flex justify-between text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                    <span>ACTIVE ASSIGNMENT</span>
                    <span>ETA: {selectedRider.etaMins} MINS</span>
                  </div>
                  <div className="text-xs font-bold text-white">Order #{selectedRider.activeOrderId}</div>
                  <div className="text-[11px] text-slate-300">From: {selectedRider.activeOrderRestName}</div>
                  <div className="text-[11px] text-slate-400">To: {selectedRider.activeOrderCustomerLoc}</div>
                </div>
              ) : (
                <div className="mt-3 p-2.5 rounded-lg bg-slate-950/60 border border-white/10 text-center text-slate-400">
                  Fleet unit is standing by in hot-zone. Available for automated batch dispatch.
                </div>
              )}
            </div>

            {/* Tactical Override Actions */}
            <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
              <button 
                onClick={() => alert(`[DISPATCH TELEMETRY] High-frequency GPS ping sent to ${selectedRider.id}. Telemetry refresh synchronized.`)}
                className="px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] tracking-wider uppercase transition shadow"
              >
                Ping Telemetry
              </button>
              <button 
                onClick={() => alert(`[DISPATCH AUDIT] Routing trajectory logs for ${selectedRider.id} exported to institutional ledger.`)}
                className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] tracking-wider uppercase transition"
              >
                Inspect Logs
              </button>
            </div>
          </div>
        )}

        {/* Selected Zone Heatmap HUD Card */}
        {selectedZone && !selectedRider && (
          <div className="absolute top-4 right-4 z-40 w-72 bg-slate-900/95 border border-amber-500/60 rounded-xl p-4 shadow-2xl backdrop-blur-xl font-mono text-xs text-white animate-in fade-in slide-in-from-right duration-200">
            <div className="flex justify-between items-start border-b border-white/10 pb-2 mb-2">
              <div>
                <span className="text-[10px] text-amber-400 font-bold tracking-wider uppercase">DEMAND HOTSPOT CLUSTER</span>
                <div className="text-sm font-bold text-white mt-0.5">{selectedZone.name}</div>
              </div>
              <button onClick={() => setSelectedZone(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between p-1.5 rounded bg-slate-950/60">
                <span className="text-slate-400">Surge Multiplier:</span>
                <span className="font-bold text-rose-400">{selectedZone.surgeMultiplier}x Surge</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-slate-950/60">
                <span className="text-slate-400">Order Velocity:</span>
                <span className="font-bold text-amber-300">{selectedZone.ordersPerHour} orders / hour</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-slate-950/60">
                <span className="text-slate-400">Thermal Intensity:</span>
                <span className="font-bold text-emerald-300">{(selectedZone.intensity * 100).toFixed(0)}% Saturated</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-slate-950/60">
                <span className="text-slate-400">H3 Partition Cell:</span>
                <span className="font-mono text-cyan-300">#{selectedZone.h3HexId}</span>
              </div>
            </div>
            <button 
              onClick={() => alert(`[ALGORITHMIC DISPATCH] Fleet rebalancing dispatch triggered for ${selectedZone.name}. Idle riders routed.`)}
              className="mt-3 w-full py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] uppercase tracking-wider transition"
            >
              Rebalance Fleet Supply
            </button>
          </div>
        )}

        {/* Search & Filter Toolbar Float in Bottom-Left */}
        <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2 bg-slate-950/90 border border-slate-800 rounded-lg p-1.5 backdrop-blur-md">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search rider ID, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44"
            />
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono">
            {(["ALL", "IN_TRANSIT", "AT_MERCHANT", "IDLE"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setRiderFilter(filter)}
                className={`px-2 py-1 rounded transition-all ${
                  riderFilter === filter
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {filter === "ALL" ? "All" : filter.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Real-time Sub-Second Telemetry Audit Stream Footer */}
      <div className="bg-slate-950 border-t border-white/10 px-5 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-3 overflow-x-auto w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold shrink-0">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>LIVE PING FEED:</span>
          </div>
          {pingLogs.length > 0 ? (
            <div className="text-slate-300 truncate text-[11px]">
              <span className="text-slate-500">[{pingLogs[0].timestamp}]</span>{" "}
              <span className="text-emerald-400 font-bold">{pingLogs[0].riderId}</span>{" "}
              <span className="text-slate-400">({pingLogs[0].lat}, {pingLogs[0].lng})</span>{" "}
              <span className="text-cyan-300">{pingLogs[0].speed} km/h</span>{" "}
              <span className="text-slate-500">
                {pingLogs[0].activeOrder ? `// Order #${pingLogs[0].activeOrder}` : "// Fleet Patrol"}
              </span>
            </div>
          ) : (
            <span className="text-slate-500 text-[11px]">Synchronizing sub-second GPS packets...</span>
          )}
        </div>

        <div className="flex items-center gap-4 text-[10px] text-slate-500 shrink-0">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> GEOFENCE INTEGRITY: 100%
          </span>
          <span>CLUSTER: {CLUSTER_CONFIG[currentCluster].name.split(" ")[0]}</span>
        </div>
      </div>
    </div>
  );
}
