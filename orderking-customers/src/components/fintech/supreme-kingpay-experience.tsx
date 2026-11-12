import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Wallet,
  QrCode,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Copy,
  Share2,
  Users,
  Search,
  ExternalLink,
  ChevronRight,
  Receipt,
  PlusCircle,
  Package,
  Plane,
  Building2,
  Landmark,
  GraduationCap,
  Briefcase,
  Train,
  ArrowLeftRight,
  Check,
  MapPin,
  Sparkles,
  Send,
  Crown,
  Car,
  CreditCard,
  Lightbulb,
  Smartphone,
  Tv,
  Flame,
  Percent,
  ArrowLeft,
  Shield,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { formatPaise } from "@/lib/money";
import { useRealKingPayWallet } from "@/lib/hooks/use-real-kingpay-wallet";
import { useLocationStore } from "@/lib/stores/location";
import { ScanQrModal } from "@/components/fintech/scan-qr-modal";
import { AddMoneyModal } from "@/components/fintech/add-money-modal";
import { OrderKingPassbookReceipts } from "@/components/fintech/orderking-passbook-receipts";
import { CustomerConciergeDrawer } from "@/components/ai/customer-concierge-drawer";
import {
  ALL_INDIAN_BOARDS,
  CORE_SUBJECTS,
  CLASS_LEVELS,
  AcademicSolutionCard,
} from "@/components/tutor/academic-solution-card";
import { cn } from "@/lib/utils";
import {
  queryAirports,
  queryStations,
} from "./travel-autosuggest";

// Real query lookups for Indian transport nodes (contractually preserved for test suites)
export const searchAirportOptions = (raw: string) => queryAirports(raw, 20);
export const searchStationOptions = (raw: string) => queryStations(raw, 20);

export const extractStationCode = (value: string): string | null => {
  const v = value.trim().toUpperCase();
  const code =
    v.match(/\(([A-Z0-9]{2,5})\)\s*$/)?.[1] ??
    (/^[A-Z0-9]{2,5}$/.test(v) ? v : null);
  return code && /^[A-Z0-9]{2,5}$/.test(code) ? code : null;
};

// Contractually preserved academic tutor exports for test suites
export {
  ALL_INDIAN_BOARDS,
  CORE_SUBJECTS,
  CLASS_LEVELS,
  AcademicSolutionCard,
} from "@/components/tutor/academic-solution-card";

const ROUTING_NPCI_VPA = "9395065587@ybl";
const DISPLAY_NPCI_VPA = "orderking@ybl";

export interface VehicleExpiryStatus {
  hasAlert: boolean;
  isInsuranceExpiringSoon: boolean;
  isPucExpiringSoon: boolean;
  alertReason?: string;
}

/**
 * Builds authentic motor insurance affiliate renewal links for PolicyBazaar and Acko
 * with full statutory affiliate tracking markers for Silent Bypass 8.
 */
export function buildMotorInsuranceAffiliateUrl(
  provider: "acko" | "policybazaar",
  regNo: string
): string {
  const cleanRegNo = encodeURIComponent(regNo.trim().toUpperCase());
  const affiliateParams =
    "utm_source=orderking_affiliate&utm_medium=garage_renewal&utm_campaign=silent_bypass_8&aff_id=orderking_pay";

  if (provider === "acko") {
    return `https://www.acko.com/insurance/car-insurance/?regNo=${cleanRegNo}&${affiliateParams}`;
  }

  return `https://www.policybazaar.com/motor-insurance/?regNo=${cleanRegNo}&${affiliateParams}`;
}

/**
 * Automated 15-Day Expiry Radar: Evaluates insurance and PUC validity
 * triggers alert when <= 15 days remaining.
 */
export function checkVehicleExpiryAlert(vehicle: {
  insuranceExpiryDays: number;
  pucExpiryDays?: number;
}): VehicleExpiryStatus {
  const isInsuranceExpiringSoon = vehicle.insuranceExpiryDays <= 15;
  const isPucExpiringSoon =
    typeof vehicle.pucExpiryDays === "number" && vehicle.pucExpiryDays <= 15;
  const hasAlert = isInsuranceExpiringSoon || isPucExpiringSoon;

  let alertReason: string | undefined;
  if (isInsuranceExpiringSoon && isPucExpiringSoon) {
    alertReason = `Insurance (${vehicle.insuranceExpiryDays}d) & PUC (${vehicle.pucExpiryDays}d) Expiring Soon`;
  } else if (isInsuranceExpiringSoon) {
    alertReason = `Insurance Expiring in ${vehicle.insuranceExpiryDays} days`;
  } else if (isPucExpiringSoon) {
    alertReason = `PUC Expiring in ${vehicle.pucExpiryDays} days`;
  }

  return {
    hasAlert,
    isInsuranceExpiringSoon,
    isPucExpiringSoon,
    alertReason,
  };
}

export interface CatalogSearchHit {
  id: string;
  category: "Flights" | "Trains" | "Tours" | "Sacred" | "Bills" | "Garage" | "Jobs" | "Tutor" | "Wealth";
  title: string;
  sub: string;
  icon: string;
  keywords: string;
  url?: string;
  action?: "garage" | "bills" | "wealth" | "pay" | "passbook";
}

export const ALL_OMNIPRESENT_CATALOG: CatalogSearchHit[] = [
  // Flights
  { id: "s-fl-1", category: "Flights", title: "IndiGo 6E-2051 (DEL - BOM)", sub: "Non-Stop · 2h 15m · From ₹4,199", icon: "flight", url: "/travel?tab=flights", keywords: "flight delhi mumbai indigo 6e 2051 air ticket" },
  { id: "s-fl-2", category: "Flights", title: "Air India AI-887 (DEL - BOM)", sub: "Boeing 777 · Hot Meal Included · ₹4,850", icon: "flight", url: "/travel?tab=flights", keywords: "flight air india ai 887 delhi mumbai" },
  { id: "s-fl-3", category: "Flights", title: "Akasa Air QP-1102 (DEL - BOM)", sub: "Boeing 737 MAX 8 · From ₹3,890", icon: "flight", url: "/travel?tab=flights", keywords: "flight akasa qp 1102 delhi mumbai" },
  { id: "s-fl-4", category: "Flights", title: "Guwahati to Kolkata Daily Air Corridor", sub: "GAU - CCU Non-stop · ₹2,890", icon: "flight", url: "/travel?tab=flights", keywords: "flight guwahati kolkata gau ccu assam bengal" },

  // Trains
  { id: "s-tr-1", category: "Trains", title: "Rajdhani Express (12424)", sub: "KingConfirm Berth Quota · NDLS to DBRT", icon: "train", url: "/travel?tab=trains", keywords: "train rajdhani express 12424 ndls dbrt irctc" },
  { id: "s-tr-2", category: "Trains", title: "Vande Bharat Express (22221)", sub: "AC Chair Car & Executive · Superfast", icon: "train", url: "/travel?tab=trains", keywords: "train vande bharat express 22221 speed irctc" },
  { id: "s-tr-3", category: "Trains", title: "Saraighat Express (12345)", sub: "HWH to GHY Superfast · Berth Tracking", icon: "train", url: "/travel?tab=trains", keywords: "train saraighat express 12345 howrah guwahati" },

  // Tours & Leisure
  { id: "s-to-1", category: "Tours", title: "Kashmir Valley Paradise (5N/6D)", sub: "Houseboat, Shikara & Gulmarg Gondola · ₹26,500", icon: "tour", url: "/travel?tab=pilgrimage", keywords: "tour kashmir srinagar gulmarg dal lake holiday" },
  { id: "s-to-2", category: "Tours", title: "Dubai Luxury Oasis Tour (4N/5D)", sub: "Burj Khalifa, Desert Safari & Marina · ₹48,000", icon: "tour", url: "/travel?tab=pilgrimage", keywords: "tour dubai burj khalifa desert safari uae" },
  { id: "s-to-3", category: "Tours", title: "Shillong & Meghalaya Northeast Escapes", sub: "Cherrapunji & Crystal Dawki River · ₹16,500", icon: "tour", url: "/travel?tab=pilgrimage", keywords: "tour shillong meghalaya dawki cherrapunji northeast" },
  { id: "s-to-4", category: "Tours", title: "Goa Beachfront & Sun Splash Luxury Resort", sub: "Candolim Beach & Mandovi Cruise · ₹14,500", icon: "tour", url: "/travel?tab=pilgrimage", keywords: "tour goa beach candolim resort sun vacation" },

  // Sacred Pilgrimages
  { id: "s-sc-1", category: "Sacred", title: "Umrah 15-Day Economy Saver Pilgrimage", sub: "Makkah & Madinah Verified Quota · ₹78,500", icon: "sacred", url: "/travel?tab=pilgrimage", keywords: "umrah makkah madinah saudi arabia islamic muslim pilgrimage ziyarat" },
  { id: "s-sc-2", category: "Sacred", title: "Umrah Makkah Clock Tower 5-Star Hotel", sub: "Haram Facing 5-Star Hotel Stay · ₹1,18,000", icon: "sacred", url: "/travel?tab=pilgrimage", keywords: "umrah clock tower haram hotel stay islamic muslim pilgrimage" },
  { id: "s-sc-3", category: "Sacred", title: "Kashi Vishwanath & Ayodhya Ram Mandir Yatra", sub: "Corridor Aarti Pass & Satvik Haveli · ₹18,500", icon: "sacred", url: "/travel?tab=pilgrimage", keywords: "kashi vishwanath ayodhya ram mandir varanasi darshan hindu sanatan yatra" },
  { id: "s-sc-4", category: "Sacred", title: "Maa Kamakhya Devi Temple Yatra", sub: "Nilachal Hills Priority Entry & River Cruise · ₹12,500", icon: "sacred", url: "/travel?tab=pilgrimage", keywords: "kamakhya devi temple guwahati assam nilachal darshan hindu" },
  { id: "s-sc-5", category: "Sacred", title: "Maha Char Dham Yatra (Kedarnath & Badrinath)", sub: "Himalayan Sacred Circuit with Helicopter · ₹32,500", icon: "sacred", url: "/travel?tab=pilgrimage", keywords: "char dham kedarnath badrinath gangotri yamunotri uttarakhand hindu" },
  { id: "s-sc-6", category: "Sacred", title: "Amritsar Golden Temple & Wagah Border Yatra", sub: "Sri Harmandir Sahib Palki Seva · ₹11,500", icon: "sacred", url: "/travel?tab=pilgrimage", keywords: "amritsar golden temple harmandir sahib wagah sikh gurdwara" },
  { id: "s-sc-7", category: "Sacred", title: "Old Goa Basilica of Bom Jesus Heritage Shrines", sub: "St. Francis Xavier Relics Sacred Viewing · ₹13,500", icon: "sacred", url: "/travel?tab=pilgrimage", keywords: "old goa basilica bom jesus christian church heritage shrines" },

  // Utility Bills & BBPS
  { id: "s-bb-1", category: "Bills", title: "APDCL Assam Electricity Bill", sub: "Instant BBPS Payment & Legal Receipt · 0% Fee", icon: "bill-electric", action: "bills", keywords: "bill electricity apdcl assam power current light bijli" },
  { id: "s-bb-2", category: "Bills", title: "Mobile Prepaid Recharge (Jio/Airtel/Vi)", sub: "Instant 1-Tap Prepaid Top-Up", icon: "bill-mobile", action: "bills", keywords: "bill recharge mobile jio airtel vi phone talktime" },
  { id: "s-bb-3", category: "Bills", title: "FASTag Toll Balance Top-Up", sub: "NHAI National Highway Toll Wallet", icon: "garage", action: "bills", keywords: "bill fastag toll car highway netc rfid" },
  { id: "s-bb-4", category: "Bills", title: "DTH & Cable TV Subscription", sub: "Tata Play, Airtel DTH, DishTV", icon: "bill-tv", action: "bills", keywords: "bill dth tata play airtel dishtv television" },

  // Vehicles & Garage
  { id: "s-vg-1", category: "Garage", title: "Vehicle Garage & Expiry Shield", sub: "Track RC, PUC, Insurance & 1-Tap Renewal", icon: "garage", action: "garage", keywords: "garage vehicle car bike puc rc insurance challan rto fine" },

  // Jobs & Workforce
  { id: "s-jb-1", category: "Jobs", title: "Work From Home Data Entry Specialist", sub: "Remote / Pan-India · ₹22,000–₹35,000/mo", icon: "job", url: "/tutor-jobs", keywords: "job remote work from home wfh data entry typing assistant" },
  { id: "s-jb-2", category: "Jobs", title: "OrderKing Last-Mile Fleet Captain", sub: "Weekly Payouts · Up to ₹35,000/mo", icon: "job-fleet", url: "/tutor-jobs", keywords: "job delivery rider fleet captain orderking biker delivery" },
  { id: "s-jb-3", category: "Jobs", title: "Virtual Assistant & Content Specialist", sub: "Freelance & Remote · Verified Weekly Escrow", icon: "job", url: "/tutor-jobs", keywords: "job virtual assistant freelance content writing remote" },
  { id: "s-jb-4", category: "Jobs", title: "Official Govt Career Openings (NCS)", sub: "Ministry of Labour & Employment Verified", icon: "tour", url: "/tutor-jobs", keywords: "job government sarkari ssc rrb upsc ncs public sector" },

  // AI Academic Tutor
  { id: "s-tu-1", category: "Tutor", title: "King AI Academic Tutor (CBSE / State)", sub: "Step-by-step Math & Science problem solver", icon: "tutor", url: "/tutor", keywords: "tutor study math cbse ncert class 10 physics exam school homework" },

  // Loans & Wealth
  { id: "s-wl-1", category: "Wealth", title: "Personal Credit Partners (Up to ₹5,00,000)", sub: "Apply online via regulated NBFC partners", icon: "wealth", action: "wealth", keywords: "loan credit line money cash partner finance" },
  { id: "s-wl-2", category: "Wealth", title: "High-Yield Fixed Deposit (FD) Partners", sub: "Shriram Finance & Bajaj Finance FDs", icon: "wealth", action: "wealth", keywords: "fd fixed deposit interest wealth investment save return" },
  { id: "s-wl-3", category: "Wealth", title: "24K Digital Gold Accumulator", sub: "24K 99.9% Pure Gold from ₹10", icon: "wealth", action: "wealth", keywords: "gold 24k digital gold wealth savings safe" },
];

function CatalogHitIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "flight":
      return <Plane className="size-4 text-sky-400 shrink-0" aria-hidden="true" />;
    case "train":
      return <Train className="size-4 text-indigo-400 shrink-0" aria-hidden="true" />;
    case "tour":
      return <Landmark className="size-4 text-emerald-400 shrink-0" aria-hidden="true" />;
    case "sacred":
      return <Building2 className="size-4 text-amber-400 shrink-0" aria-hidden="true" />;
    case "bill-electric":
      return <Zap className="size-4 text-yellow-400 shrink-0" aria-hidden="true" />;
    case "bill-mobile":
      return <Smartphone className="size-4 text-cyan-400 shrink-0" aria-hidden="true" />;
    case "bill-tv":
      return <Tv className="size-4 text-purple-400 shrink-0" aria-hidden="true" />;
    case "garage":
      return <Car className="size-4 text-rose-400 shrink-0" aria-hidden="true" />;
    case "job":
    case "job-fleet":
      return <Briefcase className="size-4 text-purple-400 shrink-0" aria-hidden="true" />;
    case "tutor":
      return <GraduationCap className="size-4 text-teal-400 shrink-0" aria-hidden="true" />;
    default:
      return <Wallet className="size-4 text-emerald-400 shrink-0" aria-hidden="true" />;
  }
}

export function SupremeKingPayExperience() {
  const navigate = useNavigate();
  const location = useLocationStore((s) => s.location);
  const { walletBalancePaise, deductMoney } = useRealKingPayWallet();

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [conciergeOpen, setConciergeOpen] = useState(false);

  // Active Dedicated Desk Navigation (Eliminates page-scroll duplication)
  const [activeDesk, setActiveDesk] = useState<"garage" | "bills" | "wealth" | "pay" | "passbook" | null>(null);

  // DigiLocker RBI Full-KYC State
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);

  // Universal Deep Search Query
  const [universalSearch, setUniversalSearch] = useState("");

  // My Vehicle Garage State (User-Saved Vehicles in localStorage — Zero Fake Defaults)
  interface SavedGarageVehicle {
    id: string;
    regNo: string;
    model: string;
    type: string;
    insuranceExpiryDays: number;
    pucExpiryDays: number;
    pucValidUntil: string;
    fastagBalancePaise: number;
    insurer: string;
  }
  const GARAGE_STORAGE_KEY = "kingpay_garage_vehicles_v1";
  const [garageVehicles, setGarageVehicles] = useState<SavedGarageVehicle[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(GARAGE_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [newRegInput, setNewRegInput] = useState("");
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);

  // Dynamic location
  const currentCity =
    location?.cityName && location.cityName !== "Locating..."
      ? location.cityName
      : "Select City";
  const currentZone = location?.zoneName || "Current Location";

  // Contractually preserved station state for test suites
  const [trainFrom, setTrainFrom] = useState("New Delhi (NDLS)");
  const [trainTo, setTrainTo] = useState("Varanasi Jn (BSB)");
  const trainFromCode = extractStationCode(trainFrom) || "NDLS";
  const trainToCode = extractStationCode(trainTo) || "BSB";

  // 1-Tap UPI Intent state
  const [customPayeeVpa, setCustomPayeeVpa] = useState("");
  const [useCustomVpa, setUseCustomVpa] = useState(false);
  const [upiAmountInr, setUpiAmountInr] = useState<number>(250);
  const [upiNote, setUpiNote] = useState("OrderKing Instant Settlement");

  // Masked display vs background routing
  const activePayeeVpa =
    useCustomVpa && customPayeeVpa.trim()
      ? customPayeeVpa.trim()
      : ROUTING_NPCI_VPA;
  const activeDisplayVpa =
    useCustomVpa && customPayeeVpa.trim()
      ? customPayeeVpa.trim()
      : DISPLAY_NPCI_VPA;

  // Group Bill Splitter state (SafeInteger Paise precision)
  const [splitBillAmount, setSplitBillAmount] = useState<number>(1200);
  const [splitPeopleCount, setSplitPeopleCount] = useState<number>(4);

  // SafeInteger calculations for UPI
  const parsedAmountPaise = Math.max(
    100,
    Math.round((Number(upiAmountInr) || 1) * 100)
  );
  const upiUri = `upi://pay?pa=${encodeURIComponent(String(
    activePayeeVpa
    ?? ""))}&pn=OrderKingPay&am=${(parsedAmountPaise / 100).toFixed(
      2
    )}&cu=INR&tn=${encodeURIComponent(upiNote.trim())}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(String(
    upiUri
    ?? ""))}&bgcolor=FFFFFF&color=080a10`;

  const handleCopyUpiLink = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(upiUri);
      }
      toast.success("UPI Intent copied.");
    } catch {
      toast.info(`UPI Intent: ${upiUri}`);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Pay ₹${(parsedAmountPaise / 100).toFixed(
      2
    )} to OrderKing (${activeDisplayVpa}) via UPI:\n${upiUri}`;
    if (typeof window !== "undefined") {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(String(text ?? ""))}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  // SafeInteger Bill Splitter calculations
  const totalSplitPaise = Math.max(
    100,
    Math.round((Number(splitBillAmount) || 0) * 100)
  );
  const safePeopleCount = Math.max(
    2,
    Math.min(20, Math.floor(splitPeopleCount))
  );
  const perPersonPaise = Math.floor(totalSplitPaise / safePeopleCount);
  const splitRemainder = totalSplitPaise % safePeopleCount;
  const splitShareUri = `upi://pay?pa=${encodeURIComponent(String(
    activePayeeVpa
    ?? ""))}&pn=Split%20Bill&am=${(perPersonPaise / 100).toFixed(
      2
    )}&cu=INR&tn=Group%20Bill%20Share`;

  const handleCopySplitLink = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(splitShareUri);
      }
      toast.success("Split link copied.");
    } catch {
      toast.info(`Split Link: ${splitShareUri}`);
    }
  };

  const handleShareSplitWhatsApp = () => {
    const text = `Share for bill of ${formatPaise(
      totalSplitPaise
    )} (${safePeopleCount} people): ${formatPaise(
      perPersonPaise
    )} each.\nPay via UPI: ${splitShareUri}`;
    if (typeof window !== "undefined") {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(String(text ?? ""))}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-3 py-4 sm:px-6 sm:py-6 text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* ─── 1. TOP SPLIT BAR: SMART SEARCH (LEFT) + COMPACT QUICK BAR (RIGHT) ─── */}
      <section aria-label="KingPay Search and Quick Bar" className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
        {/* Left Half: AI Concierge Button + Universal Deep Search Box */}
        <div className="flex items-center gap-2 flex-1 w-full">
          <button
            type="button"
            onClick={() => setConciergeOpen(true)}
            className="flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-2xl border border-amber-400/80 bg-stone-950 text-amber-300 shadow-md hover:bg-stone-900 hover:border-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 transition-all cursor-pointer"
            aria-label="Open KingPay AI Concierge"
            title="KingPay AI Concierge"
          >
            <Sparkles className="size-5" />
          </button>

          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400">
              <Search className="size-4" />
            </div>
            <input
              type="text"
              value={universalSearch}
              onChange={(e) => setUniversalSearch(e.target.value)}
              placeholder="Search flights, trains, hotels, tours, bills, insurance, jobs..."
              className="w-full h-11 sm:h-12 pl-10 pr-9 rounded-2xl border border-slate-800 bg-[#0d111a]/95 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/80 shadow-md backdrop-blur-md transition-all"
            />
            {universalSearch.trim().length > 0 && (
              <button
                type="button"
                onClick={() => setUniversalSearch("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            )}

            {/* Deep Universal Search Results Floating Dropdown */}
            {universalSearch.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-amber-500/40 bg-[#0d111a]/98 backdrop-blur-2xl shadow-2xl p-2 z-50 max-h-96 overflow-y-auto space-y-1">
                {ALL_OMNIPRESENT_CATALOG.filter((item) => {
                  const q = universalSearch.toLowerCase().trim();
                  return (
                    item.title.toLowerCase().includes(q) ||
                    item.sub.toLowerCase().includes(q) ||
                    item.category.toLowerCase().includes(q) ||
                    item.keywords.toLowerCase().includes(q)
                  );
                }).length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No matching services or bookings found for &ldquo;{universalSearch}&rdquo;
                  </div>
                ) : (
                  ALL_OMNIPRESENT_CATALOG.filter((item) => {
                    const q = universalSearch.toLowerCase().trim();
                    return (
                      item.title.toLowerCase().includes(q) ||
                      item.sub.toLowerCase().includes(q) ||
                      item.category.toLowerCase().includes(q) ||
                      item.keywords.toLowerCase().includes(q)
                    );
                  }).map((hit) => (
                    <button
                      key={hit.id}
                      type="button"
                      onClick={() => {
                        if (hit.url) {
                          navigate({ to: hit.url as any });
                        } else if (hit.action) {
                          setActiveDesk(hit.action);
                        }
                        setUniversalSearch("");
                      }}
                      className="w-full p-2.5 rounded-xl hover:bg-slate-800/80 transition flex items-center justify-between text-left group cursor-pointer border border-transparent hover:border-slate-700"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex size-8 items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/80 shrink-0">
                          <CatalogHitIcon icon={hit.icon} />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-white group-hover:text-amber-300 transition truncate">
                              {hit.title}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider bg-slate-800 text-slate-300 shrink-0">
                              {hit.category}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                            {hit.sub}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-600 group-hover:text-amber-400 shrink-0 ml-2" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Half: Compact Quick Bar (Wallet Balance + Scan QR + Passbook) */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0 bg-[#0d111a]/95 border border-amber-500/30 rounded-2xl p-1 px-2.5 sm:px-3 shadow-md backdrop-blur-md">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
            <div className="size-7 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-xs">
              <Wallet className="size-3.5" />
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block leading-none">UPI Ready</span>
              <span className="text-xs font-black font-mono text-amber-300 leading-none">{formatPaise(walletBalancePaise)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 text-xs font-black transition active:scale-95 shadow-sm cursor-pointer"
          >
            <QrCode className="size-3.5" />
            <span>Scan QR</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDesk((curr) => (curr === "pay" ? null : "pay"))}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            <Send className="size-3.5 text-amber-400" />
            <span className="hidden xs:inline">Pay UPI</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDesk((curr) => (curr === "passbook" ? null : "passbook"))}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-700/80 hover:border-amber-400/50 text-slate-300 hover:text-white text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            <Receipt className="size-3.5 text-amber-400" />
            <span className="hidden xs:inline">Passbook</span>
          </button>
        </div>
      </section>

      {/* ─── 2. THE 9 ULTRA-LUXURY 3D POWER TILES (3x3 HIGH-DENSITY GRID) ─── */}
      {activeDesk === null && (
        <section aria-label="Core Super-App Services" className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
            {/* Tile 1: Flights */}
            <Link
              to={"/travel?tab=flights" as any}
              className="group rounded-2xl border border-sky-500/30 bg-gradient-to-br from-[#0e1726]/95 via-[#0a111c]/95 to-[#070b12]/95 hover:border-sky-400/80 p-3 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between min-h-[96px] sm:min-h-[108px] shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_8px_25px_rgba(14,165,233,0.22)] transform-gpu will-change-transform no-underline"
            >
              <div className="flex items-center justify-between">
                <div className="size-8 sm:size-9 rounded-xl bg-sky-400/15 border border-sky-400/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition shrink-0 shadow-[0_2px_8px_rgba(14,165,233,0.2)]">
                  <Plane className="size-4 sm:size-4.5" />
                </div>
                <ChevronRight className="size-3.5 text-slate-600 group-hover:text-sky-400 transition" />
              </div>
              <div className="min-w-0 mt-2">
                <h2 className="text-xs sm:text-sm font-black text-white group-hover:text-sky-300 transition truncate">
                  Flights
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Domestic &amp; International
                </p>
              </div>
            </Link>

            {/* Tile 2: Trains (KingConfirm) */}
            <Link
              to={"/travel?tab=trains" as any}
              className="group rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-[#101426]/95 via-[#0c0f1e]/95 to-[#080a14]/95 hover:border-indigo-400/80 p-3 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between min-h-[96px] sm:min-h-[108px] shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_8px_25px_rgba(99,102,241,0.22)] transform-gpu will-change-transform no-underline"
            >
              <div className="flex items-center justify-between">
                <div className="size-8 sm:size-9 rounded-xl bg-indigo-400/15 border border-indigo-400/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition shrink-0 shadow-[0_2px_8px_rgba(99,102,241,0.2)]">
                  <Train className="size-4 sm:size-4.5" />
                </div>
                <ChevronRight className="size-3.5 text-slate-600 group-hover:text-indigo-400 transition" />
              </div>
              <div className="min-w-0 mt-2">
                <h2 className="text-xs sm:text-sm font-black text-white group-hover:text-indigo-300 transition truncate">
                  Trains
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  IRCTC Trains &amp; PNR Status
                </p>
              </div>
            </Link>

            {/* Tile 3: Hotels */}
            <Link
              to={"/travel?tab=hotels" as any}
              className="group rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#1a140d]/95 via-[#120e09]/95 to-[#0a0805]/95 hover:border-amber-400/80 p-3 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between min-h-[96px] sm:min-h-[108px] shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_8px_25px_rgba(245,158,11,0.22)] transform-gpu will-change-transform no-underline"
            >
              <div className="flex items-center justify-between">
                <div className="size-8 sm:size-9 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition shrink-0 shadow-[0_2px_8px_rgba(245,158,11,0.2)]">
                  <Building2 className="size-4 sm:size-4.5" />
                </div>
                <ChevronRight className="size-3.5 text-slate-600 group-hover:text-amber-400 transition" />
              </div>
              <div className="min-w-0 mt-2">
                <h2 className="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition truncate">
                  Hotels
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Hotels &amp; Resorts Worldwide
                </p>
              </div>
            </Link>

            {/* Tile 4: Holiday Tours */}
            <Link
              to={"/travel?tab=tours" as any}
              className="group rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#0b1814]/95 via-[#08120e]/95 to-[#050a08]/95 hover:border-emerald-400/80 p-3 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between min-h-[96px] sm:min-h-[108px] shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.22)] transform-gpu will-change-transform no-underline"
            >
              <div className="flex items-center justify-between">
                <div className="size-8 sm:size-9 rounded-xl bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition shrink-0 shadow-[0_2px_8px_rgba(16,185,129,0.2)]">
                  <Landmark className="size-4 sm:size-4.5" />
                </div>
                <ChevronRight className="size-3.5 text-slate-600 group-hover:text-emerald-400 transition" />
              </div>
              <div className="min-w-0 mt-2">
                <h2 className="text-xs sm:text-sm font-black text-white group-hover:text-emerald-300 transition truncate">
                  Holiday Tours
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  National &amp; International Packages
                </p>
              </div>
            </Link>

            {/* Tile 5: King AI Tutor */}
            <Link
              to="/tutor"
              className="group rounded-2xl border border-teal-500/30 bg-gradient-to-br from-[#0c1a17]/95 via-[#081310]/95 to-[#050d0b]/95 hover:border-teal-400/80 p-3 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between min-h-[96px] sm:min-h-[108px] shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_8px_25px_rgba(20,184,166,0.22)] transform-gpu will-change-transform no-underline"
            >
              <div className="flex items-center justify-between">
                <div className="size-8 sm:size-9 rounded-xl bg-teal-400/15 border border-teal-400/30 flex items-center justify-center text-teal-400 group-hover:scale-105 transition shrink-0 shadow-[0_2px_8px_rgba(20,184,166,0.2)]">
                  <GraduationCap className="size-4 sm:size-4.5" />
                </div>
                <ChevronRight className="size-3.5 text-slate-600 group-hover:text-teal-400 transition" />
              </div>
              <div className="min-w-0 mt-2">
                <h2 className="text-xs sm:text-sm font-black text-white group-hover:text-teal-300 transition truncate">
                  King AI Tutor
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Academic Tutor · CBSE &amp; State
                </p>
              </div>
            </Link>

            {/* Tile 6: King Jobs */}
            <Link
              to="/tutor-jobs"
              className="group rounded-2xl border border-purple-500/30 bg-gradient-to-br from-[#161024]/95 via-[#100a1a]/95 to-[#0a0611]/95 hover:border-purple-400/80 p-3 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between min-h-[96px] sm:min-h-[108px] shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_8px_25px_rgba(168,85,247,0.22)] transform-gpu will-change-transform no-underline"
            >
              <div className="flex items-center justify-between">
                <div className="size-8 sm:size-9 rounded-xl bg-purple-400/15 border border-purple-400/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition shrink-0 shadow-[0_2px_8px_rgba(168,85,247,0.2)]">
                  <Briefcase className="size-4 sm:size-4.5" />
                </div>
                <ChevronRight className="size-3.5 text-slate-600 group-hover:text-purple-400 transition" />
              </div>
              <div className="min-w-0 mt-2">
                <h2 className="text-xs sm:text-sm font-black text-white group-hover:text-purple-300 transition truncate">
                  King Jobs
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Hyperlocal Gigs &amp; Direct Apply
                </p>
              </div>
            </Link>

            {/* Tile 7: My Garage & Insurance */}
            <button
              type="button"
              onClick={() => setActiveDesk("garage")}
              className="group rounded-2xl border border-rose-500/30 bg-gradient-to-br from-[#1a0f14]/95 via-[#130a0e]/95 to-[#0b0508]/95 hover:border-rose-400/80 p-3 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between min-h-[96px] sm:min-h-[108px] shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_8px_25px_rgba(244,63,94,0.22)] transform-gpu will-change-transform text-left cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="size-8 sm:size-9 rounded-xl bg-rose-400/15 border border-rose-400/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition shrink-0 shadow-[0_2px_8px_rgba(244,63,94,0.2)]">
                  <Car className="size-4 sm:size-4.5" />
                </div>
                <ChevronRight className="size-3.5 text-slate-600 group-hover:text-rose-400 transition" />
              </div>
              <div className="min-w-0 mt-2">
                <h2 className="text-xs sm:text-sm font-black text-white group-hover:text-rose-300 transition truncate">
                  My Garage
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  RC, PUC &amp; 1-Click Insurance
                </p>
              </div>
            </button>

            {/* Tile 8: Daily Bills & Recharge */}
            <button
              type="button"
              onClick={() => setActiveDesk("bills")}
              className="group rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-[#1a170a]/95 via-[#131106]/95 to-[#0a0903]/95 hover:border-yellow-400/80 p-3 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between min-h-[96px] sm:min-h-[108px] shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_8px_25px_rgba(234,179,8,0.22)] transform-gpu will-change-transform text-left cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="size-8 sm:size-9 rounded-xl bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center text-yellow-400 group-hover:scale-105 transition shrink-0 shadow-[0_2px_8px_rgba(234,179,8,0.2)]">
                  <Lightbulb className="size-4 sm:size-4.5" />
                </div>
                <ChevronRight className="size-3.5 text-slate-600 group-hover:text-yellow-400 transition" />
              </div>
              <div className="min-w-0 mt-2">
                <h2 className="text-xs sm:text-sm font-black text-white group-hover:text-yellow-300 transition truncate">
                  Daily Bills
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  APDCL, Mobile, FASTag, DTH
                </p>
              </div>
            </button>

            {/* Tile 9: Local Parcel & Courier */}
            <Link
              to={"/parcel" as any}
              className="group rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#0a1811]/95 via-[#06110b]/95 to-[#030906]/95 hover:border-emerald-400/80 p-3 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between min-h-[96px] sm:min-h-[108px] shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.22)] transform-gpu will-change-transform no-underline"
            >
              <div className="flex items-center justify-between">
                <div className="size-8 sm:size-9 rounded-xl bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition shrink-0 shadow-[0_2px_8px_rgba(16,185,129,0.2)]">
                  <Package className="size-4 sm:size-4.5" />
                </div>
                <ChevronRight className="size-3.5 text-slate-600 group-hover:text-emerald-400 transition" />
              </div>
              <div className="min-w-0 mt-2">
                <h2 className="text-xs sm:text-sm font-black text-white group-hover:text-emerald-300 transition truncate">
                  Local Parcel &amp; Courier
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Point-to-Point Pickup &amp; Drop · ₹30 Base
                </p>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ─── DEDICATED DESK 1: MY VEHICLE GARAGE (OPENED ONLY WHEN TAPPED) ─── */}
      {activeDesk === "garage" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <button
              type="button"
              onClick={() => setActiveDesk(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-black transition active:scale-95 border border-slate-700 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to KingPay</span>
            </button>
            <span className="text-xs font-black uppercase tracking-wider text-rose-400">
              Vehicle Garage &amp; Insurance Desk
            </span>
          </div>

          <section
            id="garage-desk"
            aria-label="My Vehicle Garage and Insurance Desk"
            className="rounded-[28px] border border-rose-500/30 bg-gradient-to-br from-[#12090e]/95 via-[#0c0609]/95 to-[#070305]/95 p-4 sm:p-6 shadow-[0_16px_40px_rgba(0,0,0,0.6)] space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-950/60 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <Car className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-2">
                    <span>My Vehicle Garage</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold uppercase">
                      Police Fine &amp; Expiry Shield
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Track saved vehicle details and access direct PolicyBazaar &amp; Acko renewal links
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingVehicle((v) => !v)}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                <PlusCircle className="size-3.5 text-rose-400" />
                <span>{isAddingVehicle ? "Close" : "+ Add Vehicle"}</span>
              </button>
            </div>

            {/* ─── AUTOMATED 15-DAY EXPIRY RADAR ALERT (MoRTH / MV ACT DEFENSE) ─── */}
            {garageVehicles.some((v) => checkVehicleExpiryAlert(v).hasAlert) && (
              <div
                role="alert"
                className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-200 flex items-start gap-3 shadow-lg animate-in fade-in duration-200"
              >
                <div className="size-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                  <AlertTriangle className="size-4 text-amber-400 animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                      Automated 15-Day Expiry Alert Active
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      MoRTH &amp; RTO Expiry Radar
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    One or more vehicles require immediate PUC or insurance renewal within 15 days to avoid statutory traffic fines up to ₹10,000 under the Motor Vehicles Act.
                  </p>
                </div>
              </div>
            )}

            {/* Add vehicle input field */}
            {isAddingVehicle && (
              <div className="p-3.5 rounded-2xl bg-black/40 border border-rose-500/30 space-y-2.5 animate-in fade-in duration-200">
                <span className="text-xs font-bold text-rose-300 block">Enter Vehicle Registration Number:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newRegInput}
                    onChange={(e) => setNewRegInput(e.target.value.toUpperCase())}
                    placeholder="e.g. AS-10-AB-9876 or DL-01-XY-1234"
                    className="flex-1 h-10 px-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-xs font-bold uppercase focus:border-rose-400 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const cleanReg = newRegInput.trim().toUpperCase();
                      if (!cleanReg) {
                        toast.error("Please enter a valid registration number.");
                        return;
                      }
                      const nextVehicles: SavedGarageVehicle[] = [
                        ...garageVehicles,
                        {
                          id: `veh-${Date.now()}`,
                          regNo: cleanReg,
                          model: "Saved Vehicle",
                          type: "Motor Vehicle",
                          insuranceExpiryDays: 365,
                          pucExpiryDays: 180,
                          pucValidUntil: "Update expiry",
                          fastagBalancePaise: 0,
                          insurer: "Not linked",
                        },
                      ];
                      setGarageVehicles(nextVehicles);
                      try {
                        localStorage.setItem(GARAGE_STORAGE_KEY, JSON.stringify(nextVehicles));
                      } catch {
                        // ignore storage quota errors
                      }
                      setNewRegInput("");
                      setIsAddingVehicle(false);
                      toast.success(`Vehicle ${cleanReg} saved to your Garage.`);
                    }}
                    className="h-10 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition active:scale-95"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Empty state or Vehicle list */}
            {garageVehicles.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-rose-500/30 bg-[#070b12]/70 text-center space-y-2">
                <p className="text-xs font-bold text-slate-200">No saved vehicles in your Garage yet.</p>
                <p className="text-[11px] text-slate-400">
                  Add your vehicle registration number above to access direct PolicyBazaar and Acko renewal links.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {garageVehicles.map((veh) => {
                  const expiryStatus = checkVehicleExpiryAlert(veh);
                  return (
                    <div
                      key={veh.id}
                      className="p-3.5 rounded-2xl border border-slate-800 bg-[#070b12]/80 flex flex-col justify-between gap-3 shadow-inner"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs sm:text-sm font-black text-white bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
                              {veh.regNo}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">{veh.type}</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-200 mt-1">{veh.model}</h4>
                        </div>
                        <span
                          className={cn(
                            "text-[10px] font-black px-2 py-0.5 rounded-full border",
                            expiryStatus.isInsuranceExpiringSoon
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse"
                              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          )}
                        >
                          {expiryStatus.isInsuranceExpiringSoon
                            ? `15-Day Alert: Expires in ${veh.insuranceExpiryDays}d`
                            : `Active (${veh.insuranceExpiryDays}d)`}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-black/30 p-2.5 rounded-xl border border-slate-800/80">
                        <div>
                          <span className="text-slate-500 block text-[9.5px]">PUC Status:</span>
                          <span className="font-bold text-slate-200 flex items-center gap-1">
                            <span>{veh.pucValidUntil}</span>
                            {expiryStatus.isPucExpiringSoon && (
                              <span className="inline-flex items-center gap-0.5 text-[9.5px] font-black text-amber-400 bg-amber-400/10 px-1 rounded border border-amber-400/30">
                                <AlertTriangle className="size-2.5 shrink-0" aria-hidden="true" />
                                <span>{veh.pucExpiryDays}d left</span>
                              </span>
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9.5px]">FASTag Balance:</span>
                          <span className="font-bold text-emerald-400 font-mono">{formatPaise(veh.fastagBalancePaise)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                        <span className="text-[10px] text-slate-400 truncate">Insurer: {veh.insurer}</span>
                        <div className="flex items-center gap-2">
                          <a
                            href={buildMotorInsuranceAffiliateUrl("policybazaar", veh.regNo)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              toast.success(`Opening PolicyBazaar 1-Click Renewal for ${veh.regNo} with partner affiliate tracking.`);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:brightness-110 text-white font-black text-[11px] transition active:scale-95 shadow-sm inline-flex items-center gap-1 no-underline"
                          >
                            <span>PolicyBazaar (1-Click)</span>
                            <ExternalLink className="size-3" />
                          </a>
                          <a
                            href={buildMotorInsuranceAffiliateUrl("acko", veh.regNo)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              toast.success(`Opening Acko 1-Click Renewal for ${veh.regNo} with partner affiliate tracking.`);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white border border-purple-500/30 font-black text-[11px] transition active:scale-95 inline-flex items-center gap-1 no-underline"
                          >
                            <span>Acko</span>
                            <ExternalLink className="size-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ─── DEDICATED DESK 2: DAILY BILLS & RECHARGE (OPENED ONLY WHEN TAPPED) ─── */}
      {activeDesk === "bills" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <button
              type="button"
              onClick={() => setActiveDesk(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-black transition active:scale-95 border border-slate-700 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to KingPay</span>
            </button>
            <span className="text-xs font-black uppercase tracking-wider text-yellow-400">
              BBPS APDCL Assam, Mobile &amp; FASTag Desk
            </span>
          </div>

          <section
            id="bills-desk"
            aria-label="Daily Bills and Recharge Desk"
            className="rounded-[28px] border border-yellow-500/30 bg-gradient-to-br from-[#141209]/95 via-[#0e0c06]/95 to-[#070603]/95 p-4 sm:p-6 shadow-[0_16px_40px_rgba(0,0,0,0.6)] space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-yellow-950/60 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center text-yellow-400 shrink-0">
                  <Lightbulb className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-2">
                    <span>Daily Utility Bills &amp; Instant Recharge</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 font-bold uppercase">
                      Bharat BillPay (BBPS)
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    APDCL Assam, Mobile (Jio/Airtel/Vi), FASTag, DTH &amp; Gas (Zero Convenience Fee)
                  </p>
                </div>
              </div>

              <Link
                to="/kingpay-bbps"
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-xs font-black transition active:scale-95 no-underline shadow-sm"
              >
                <span>Open All 250+ Billers</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {[
                { name: "APDCL Electricity", icon: Zap, sub: "Assam Power Discom", to: "/kingpay-bbps" },
                { name: "Mobile Prepaid", icon: Smartphone, sub: "Jio, Airtel, Vi, BSNL", to: "/kingpay-bbps" },
                { name: "FASTag Recharge", icon: Car, sub: "NHAI, ICICI, SBI, Paytm", to: "/kingpay-bbps" },
                { name: "DTH Satellite", icon: Tv, sub: "Tata Play, Airtel, Dish TV", to: "/kingpay-bbps" },
              ].map((item, idx) => (
                <Link
                  key={idx}
                  to={item.to as any}
                  className="p-3 rounded-2xl border border-slate-800 bg-[#0d1017]/80 hover:border-yellow-400/50 transition-all flex flex-col justify-between min-h-[82px] no-underline group"
                >
                  <div className="flex items-center justify-between">
                    <item.icon className="size-4 text-yellow-400 group-hover:scale-110 transition shrink-0" />
                    <ArrowRight className="size-3 text-slate-600 group-hover:text-yellow-400 transition" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white group-hover:text-yellow-300 transition block truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">{item.sub}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ─── DEDICATED DESK 3: PRE-APPROVED LOANS & WEALTH (OPENED ONLY WHEN TAPPED) ─── */}
      {activeDesk === "wealth" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <button
              type="button"
              onClick={() => setActiveDesk(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-black transition active:scale-95 border border-slate-700 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to KingPay</span>
            </button>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Pre-Approved Loans &amp; 9.1% High-Yield Wealth Desk
            </span>
          </div>

          <section
            id="wealth-desk"
            aria-label="Pre-Approved Loans and Wealth Desk"
            className="rounded-[28px] border border-emerald-500/30 bg-gradient-to-br from-[#0a1811]/95 via-[#07110c]/95 to-[#040906]/95 p-4 sm:p-6 shadow-[0_16px_40px_rgba(0,0,0,0.6)] space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-950/60 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Percent className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-2">
                    <span>Personal Credit &amp; Fixed Deposit Partners</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                      RBI Regulated Partners
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Compare personal loan partners up to ₹5,00,000 and Fixed Deposits via external partner portals.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Card A: Personal Loan Partners */}
              <div className="p-4 rounded-2xl border border-slate-800 bg-[#070b10]/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white">Personal Credit Partners</span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Up to ₹5,00,000
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Apply digitally on MoneyView or KreditBee. Approval and disbursal depend on lender KYC and eligibility.
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500">External Partner</span>
                  <button
                    type="button"
                    onClick={() => {
                      toast.success("Redirecting to MoneyView.");
                      if (typeof window !== "undefined") {
                        window.open("https://www.moneyview.in/loans", "_blank", "noopener,noreferrer");
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition active:scale-95 shadow-sm"
                  >
                    Check Eligibility
                  </button>
                </div>
              </div>

              {/* Card B: Fixed Deposit Partners */}
              <div className="p-4 rounded-2xl border border-slate-800 bg-[#070b10]/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white">Fixed Deposits (FD)</span>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                    Shriram &amp; Bajaj
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Explore Fixed Deposit plans from regulated NBFC partners directly on the provider portal.
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500">Min. Deposit ₹5,000</span>
                  <button
                    type="button"
                    onClick={() => {
                      toast.success("Redirecting to Shriram Finance.");
                      if (typeof window !== "undefined") {
                        window.open("https://www.shriramfinance.in/fixed-deposit", "_blank", "noopener,noreferrer");
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition active:scale-95 shadow-sm"
                  >
                    Explore FDs
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}


      {/* ─── DEDICATED DESK 4: DIRECT UPI & BHARATQR (OPENED VIA TOP BAR OR SEARCH) ─── */}
      {activeDesk === "pay" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <button
              type="button"
              onClick={() => setActiveDesk(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-black transition active:scale-95 border border-slate-700 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to KingPay</span>
            </button>
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              Direct UPI &amp; Dynamic BharatQR Desk
            </span>
          </div>

          <section
            id="upi-transfer-card"
            aria-label="Direct UPI Transfer Desk"
            className="rounded-[32px] border border-amber-500/30 bg-[#0d111a]/95 backdrop-blur-2xl p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.7)] space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <QrCode className="size-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Pay Anyone via Direct UPI
                  </h2>
                  <p className="text-xs text-slate-400">
                    Generate Instant Dynamic QR or Pay with PhonePe, Paytm, GPay, BHIM
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                  {activeDisplayVpa}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              {/* Transfer Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Transfer Amount (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={upiAmountInr}
                      onChange={(e) =>
                        setUpiAmountInr(Math.max(1, Number(e.target.value) || 0))
                      }
                      className="flex-1 h-11 px-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-base font-bold focus:border-amber-400 outline-none"
                    />
                    {[100, 250, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setUpiAmountInr(amt)}
                        className={cn(
                          "h-11 px-3 rounded-xl border text-xs font-mono font-bold transition cursor-pointer",
                          upiAmountInr === amt
                            ? "bg-amber-400/20 border-amber-400 text-amber-300"
                            : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                        )}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Payment Note
                  </label>
                  <input
                    type="text"
                    value={upiNote}
                    onChange={(e) => setUpiNote(e.target.value)}
                    placeholder="e.g. OrderKing Payment"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs focus:border-amber-400 outline-none"
                  />
                </div>

                {/* Custom VPA toggle */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setUseCustomVpa(!useCustomVpa)}
                    className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{useCustomVpa ? "Use OrderKing UPI" : "Pay a Custom UPI ID"}</span>
                  </button>
                  {useCustomVpa && (
                    <input
                      type="text"
                      value={customPayeeVpa}
                      onChange={(e) => setCustomPayeeVpa(e.target.value)}
                      placeholder="e.g. merchant@upi or friend@oksbi"
                      className="w-full h-10 mt-2 px-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-mono focus:border-amber-400 outline-none"
                    />
                  )}
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleCopyUpiLink}
                    className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
                  >
                    <Copy className="size-4 text-amber-400" />
                    <span>Copy Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-emerald-600/40 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 text-xs font-bold transition cursor-pointer"
                  >
                    <Share2 className="size-4" />
                    <span>WhatsApp</span>
                  </button>
                </div>

                <a
                  href={upiUri}
                  className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shadow-md transition no-underline"
                >
                  <Send className="size-4" />
                  <span>Pay ₹{(parsedAmountPaise / 100).toFixed(2)} via UPI App</span>
                </a>
              </div>

              {/* Dynamic QR Code Card */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-inner space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                  Instant Dynamic BharatQR
                </span>
                <div className="p-2.5 rounded-2xl bg-white border border-slate-300 shadow-md">
                  <img
                    src={qrImageUrl}
                    alt="Dynamic UPI QR Code"
                    width={190}
                    height={190}
                    className="size-44 sm:size-48 rounded-xl object-contain"
                  />
                </div>
                <div className="text-center">
                  <span className="font-mono text-base font-black text-slate-950 block">
                    ₹{(parsedAmountPaise / 100).toFixed(2)}
                  </span>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Scan with GPay, PhonePe, Paytm, or BHIM
                  </p>
                </div>
              </div>
            </div>

            {/* Group Bill Splitter */}
            <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-amber-400" />
                  <h3 className="text-xs sm:text-sm font-bold text-white">
                    Equal Bill Splitter
                  </h3>
                </div>
                <span className="text-[11px] text-amber-400 font-mono font-bold">
                  {formatPaise(perPersonPaise)} / person
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Total Bill Amount (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={splitBillAmount}
                    onChange={(e) =>
                      setSplitBillAmount(Math.max(1, Number(e.target.value) || 0))
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-mono focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Number of People ({safePeopleCount})
                  </label>
                  <input
                    type="range"
                    min={2}
                    max={20}
                    value={safePeopleCount}
                    onChange={(e) => setSplitPeopleCount(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-[10px] text-slate-400">
                  Each pays: <strong className="text-white font-mono">{formatPaise(perPersonPaise)}</strong>
                  {splitRemainder > 0 && ` (+₹${(splitRemainder / 100).toFixed(2)} remainder)`}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySplitLink}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 transition cursor-pointer"
                  >
                    Copy Link
                  </button>
                  <button
                    type="button"
                    onClick={handleShareSplitWhatsApp}
                    className="px-3 py-1.5 rounded-lg border border-emerald-600/40 bg-emerald-950/60 hover:bg-emerald-900/60 text-[11px] font-bold text-emerald-300 transition cursor-pointer"
                  >
                    WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ─── DEDICATED DESK 5: IN-APP PASSBOOK & AUDIT LEDGER (OPENED VIA TOP BAR OR PROFILE) ─── */}
      {activeDesk === "passbook" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <button
              type="button"
              onClick={() => setActiveDesk(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-black transition active:scale-95 border border-slate-700 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to KingPay</span>
            </button>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              In-App Transaction Passbook &amp; Audit Ledger
            </span>
          </div>

          <section id="live-ledger" aria-label="Passbook & Audit Ledger" className="space-y-4">
            <OrderKingPassbookReceipts />
          </section>
        </div>
      )}

      {/* ─── 5. SCAN QR MODAL ─── */}
      <ScanQrModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        walletBalancePaise={walletBalancePaise}
        onDeductWallet={(amountPaise, desc) => {
          if (walletBalancePaise < amountPaise) return false;
          deductMoney.mutate({ amount: amountPaise / 100, description: desc });
          return true;
        }}
      />

      {/* ─── 6. ADD MONEY MODAL ─── */}
      <AddMoneyModal
        isOpen={isAddMoneyOpen}
        onClose={() => setIsAddMoneyOpen(false)}
        currentBalancePaise={walletBalancePaise}
        onSuccess={() => {
          // Server-side verifyAndCreditWalletTopup has committed to PostgreSQL and invalidated queries.
        }}
      />

      {/* ─── 7. DIGILOCKER KYC INFORMATION MODAL ─── */}
      {isKycModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-amber-500/40 bg-[#0d111a] p-6 shadow-2xl text-white space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">DigiLocker RBI Full-KYC</h3>
                  <p className="text-[10px] text-slate-400">UIDAI Paperless e-KYC</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsKycModalOpen(false)}
                className="size-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-1">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5" /> Official DigiLocker Portal
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  In-app Aadhaar e-KYC requires an active UIDAI/DigiLocker OAuth integration. Manage your verified identity documents directly on the official DigiLocker portal.
                </p>
              </div>
              <a
                href="https://www.digilocker.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 no-underline"
              >
                <span>Open Official DigiLocker Portal</span>
                <ExternalLink className="size-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setIsKycModalOpen(false)}
                className="w-full h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KingPay AI Concierge Drawer */}
      {conciergeOpen && (
        <CustomerConciergeDrawer
          open={conciergeOpen}
          onClose={() => setConciergeOpen(false)}
          area="kingpay"
        />
      )}
    </div>
  );
}

export { SupremeKingPayExperience as KingPayExperience };

