import { useState, useMemo, useEffect } from "react";
import {
  Lightbulb,
  Smartphone,
  Tv,
  Car,
  Flame,
  Droplets,
  Wifi,
  Search,
  X,
  CheckCircle2,
  Copy,
  ExternalLink,
  Zap,
  ArrowRight,
  ShieldCheck,
  Share2,
  Receipt,
  Printer,
  ChevronRight,
  Sparkles,
  Clock,
  ArrowLeft,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  buildNPCIUpiIntentUrl,
  generateAppDeepLink,
  FOUNDER_UPI_VPAS,
  DEFAULT_FOUNDER_PAYEE_NAME,
} from "@/lib/payments/npci-upi-intent";

export type UtilityCategory =
  | "electricity"
  | "mobile"
  | "broadband"
  | "dth"
  | "fastag"
  | "lpg"
  | "water";

export interface UtilityBiller {
  id: string;
  name: string;
  category: UtilityCategory;
  state: string;
  code: string;
  accountLabel: string;
  accountPlaceholder: string;
  defaultAmount: number;
}

export const UTILITY_CATEGORIES: Array<{
  id: UtilityCategory;
  label: string;
  sublabel: string;
  icon: typeof Lightbulb;
}> = [
  {
    id: "electricity",
    label: "Electricity",
    sublabel: "APDCL Assam, all State Discoms",
    icon: Lightbulb,
  },
  {
    id: "mobile",
    label: "Mobile Recharge",
    sublabel: "Jio, Airtel, Vi, BSNL Plans",
    icon: Smartphone,
  },
  {
    id: "broadband",
    label: "Broadband & Fiber",
    sublabel: "Airtel, JioFiber, BSNL, ACT",
    icon: Wifi,
  },
  {
    id: "dth",
    label: "DTH & Cable",
    sublabel: "Tata Play, Airtel, Sun Direct",
    icon: Tv,
  },
  {
    id: "fastag",
    label: "FASTag Toll",
    sublabel: "NETC All Partner Banks",
    icon: Car,
  },
  {
    id: "lpg",
    label: "LPG & Piped Gas",
    sublabel: "Indane, Bharat, HP Gas",
    icon: Flame,
  },
  {
    id: "water",
    label: "Water & Municipal",
    sublabel: "Municipal Water Boards",
    icon: Droplets,
  },
];

export const ALL_UTILITY_BILLERS: UtilityBiller[] = [
  // Electricity (APDCL Assam, all State Discoms)
  {
    id: "apdcl-assam",
    name: "APDCL - Assam Power Distribution Company Ltd",
    category: "electricity",
    state: "Assam",
    code: "APDCL",
    accountLabel: "Consumer Number (10 Digits)",
    accountPlaceholder: "e.g. 1002345678",
    defaultAmount: 850,
  },
  {
    id: "bescom-karnataka",
    name: "BESCOM - Bangalore Electricity Supply Company",
    category: "electricity",
    state: "Karnataka",
    code: "BESCOM",
    accountLabel: "Account ID / Consumer ID (10 Digits)",
    accountPlaceholder: "e.g. 1234567890",
    defaultAmount: 950,
  },
  {
    id: "tsspdcl-telangana",
    name: "TSSPDCL - Southern Power Distribution of Telangana",
    category: "electricity",
    state: "Telangana",
    code: "TSSPDCL",
    accountLabel: "Unique Service Number (USC)",
    accountPlaceholder: "e.g. 101234567",
    defaultAmount: 1100,
  },
  {
    id: "tangedco-tamilnadu",
    name: "TANGEDCO - Tamil Nadu Generation and Distribution",
    category: "electricity",
    state: "Tamil Nadu",
    code: "TANGEDCO",
    accountLabel: "Consumer Number",
    accountPlaceholder: "e.g. 09201234567",
    defaultAmount: 800,
  },
  {
    id: "msedcl-maharashtra",
    name: "MSEDCL / Mahavitaran - Maharashtra State Electricity",
    category: "electricity",
    state: "Maharashtra",
    code: "MSEDCL",
    accountLabel: "Consumer Number (12 Digits)",
    accountPlaceholder: "e.g. 123456789012",
    defaultAmount: 1250,
  },
  {
    id: "tata-power-delhi",
    name: "Tata Power - Delhi Distribution Ltd (TPDDL)",
    category: "electricity",
    state: "Delhi",
    code: "TPDDL",
    accountLabel: "CA Number (11 Digits)",
    accountPlaceholder: "e.g. 60012345678",
    defaultAmount: 1400,
  },
  {
    id: "bses-rajdhani-delhi",
    name: "BSES Rajdhani Power Limited",
    category: "electricity",
    state: "Delhi",
    code: "BRPL",
    accountLabel: "CA Number (9 Digits)",
    accountPlaceholder: "e.g. 100123456",
    defaultAmount: 1350,
  },
  {
    id: "bses-yamuna-delhi",
    name: "BSES Yamuna Power Limited",
    category: "electricity",
    state: "Delhi",
    code: "BYPL",
    accountLabel: "CA Number (9 Digits)",
    accountPlaceholder: "e.g. 100987654",
    defaultAmount: 1200,
  },
  {
    id: "uppcl-urban",
    name: "UPPCL - Uttar Pradesh Power Corporation (Urban)",
    category: "electricity",
    state: "Uttar Pradesh",
    code: "UPPCL",
    accountLabel: "Account Number (10 Digits)",
    accountPlaceholder: "e.g. 1234567890",
    defaultAmount: 900,
  },
  {
    id: "wbsedcl-bengal",
    name: "WBSEDCL - West Bengal State Electricity",
    category: "electricity",
    state: "West Bengal",
    code: "WBSEDCL",
    accountLabel: "Consumer ID (9 Digits)",
    accountPlaceholder: "e.g. 102345678",
    defaultAmount: 750,
  },
  {
    id: "pspcl-punjab",
    name: "PSPCL - Punjab State Power Corporation",
    category: "electricity",
    state: "Punjab",
    code: "PSPCL",
    accountLabel: "Account Number (10 Digits)",
    accountPlaceholder: "e.g. 3001234567",
    defaultAmount: 1100,
  },

  // Mobile Prepaid & Postpaid (Jio, Airtel, Vi, BSNL)
  {
    id: "jio-telecom",
    name: "Reliance Jio Infocomm",
    category: "mobile",
    state: "All India",
    code: "JIO",
    accountLabel: "10-Digit Mobile Number",
    accountPlaceholder: "e.g. 9864012345",
    defaultAmount: 349,
  },
  {
    id: "airtel-telecom",
    name: "Bharti Airtel",
    category: "mobile",
    state: "All India",
    code: "AIRTEL",
    accountLabel: "10-Digit Mobile Number",
    accountPlaceholder: "e.g. 9810012345",
    defaultAmount: 349,
  },
  {
    id: "vi-telecom",
    name: "Vodafone Idea (Vi)",
    category: "mobile",
    state: "All India",
    code: "VI",
    accountLabel: "10-Digit Mobile Number",
    accountPlaceholder: "e.g. 9820012345",
    defaultAmount: 349,
  },
  {
    id: "bsnl-telecom",
    name: "Bharat Sanchar Nigam Ltd (BSNL)",
    category: "mobile",
    state: "All India",
    code: "BSNL",
    accountLabel: "10-Digit Mobile Number",
    accountPlaceholder: "e.g. 9435012345",
    defaultAmount: 199,
  },

  // Broadband & Fiber (Airtel, JioFiber, BSNL, ACT, Tata Play)
  {
    id: "airtel-broadband",
    name: "Airtel Xstream Fiber",
    category: "broadband",
    state: "All India",
    code: "AIRTELBB",
    accountLabel: "DSL ID / Landline Number (with STD code)",
    accountPlaceholder: "e.g. 03612345678",
    defaultAmount: 943,
  },
  {
    id: "jio-fiber",
    name: "JioFiber / AirFiber",
    category: "broadband",
    state: "All India",
    code: "JIOFIBER",
    accountLabel: "Service ID / JioFiber Number",
    accountPlaceholder: "e.g. 036123456789",
    defaultAmount: 1179,
  },
  {
    id: "bsnl-broadband",
    name: "BSNL Bharat Fiber (FTTH)",
    category: "broadband",
    state: "All India",
    code: "BSNLBB",
    accountLabel: "Account Number / Telephone Number with STD",
    accountPlaceholder: "e.g. 1029384756",
    defaultAmount: 589,
  },
  {
    id: "act-fibernet",
    name: "ACT Fibernet",
    category: "broadband",
    state: "All India",
    code: "ACTFIBER",
    accountLabel: "Account Number / User ID",
    accountPlaceholder: "e.g. 10293847",
    defaultAmount: 825,
  },
  {
    id: "tata-play-fiber",
    name: "Tata Play Fiber",
    category: "broadband",
    state: "All India",
    code: "TATAFIBER",
    accountLabel: "Subscriber ID / Account Number",
    accountPlaceholder: "e.g. 102938475",
    defaultAmount: 999,
  },

  // DTH & Cable (Tata Play, Airtel, Sun Direct, Dish TV)
  {
    id: "tata-play",
    name: "Tata Play (formerly Tata Sky)",
    category: "dth",
    state: "All India",
    code: "TATAPLAY",
    accountLabel: "Subscriber ID / Registered Mobile",
    accountPlaceholder: "e.g. 1023456789",
    defaultAmount: 400,
  },
  {
    id: "airtel-dth",
    name: "Airtel Digital TV",
    category: "dth",
    state: "All India",
    code: "AIRTELDTH",
    accountLabel: "Customer ID (10 Digits)",
    accountPlaceholder: "e.g. 3001234567",
    defaultAmount: 350,
  },
  {
    id: "sun-direct",
    name: "Sun Direct DTH",
    category: "dth",
    state: "All India",
    code: "SUNDIRECT",
    accountLabel: "Smart Card / CDSN Number",
    accountPlaceholder: "e.g. 40012345678",
    defaultAmount: 300,
  },
  {
    id: "dish-tv",
    name: "Dish TV India",
    category: "dth",
    state: "All India",
    code: "DISHTV",
    accountLabel: "Viewing Card (VC) Number",
    accountPlaceholder: "e.g. 02512345678",
    defaultAmount: 350,
  },

  // FASTag (NETC All Partner Banks)
  {
    id: "fastag-icici",
    name: "NETC FASTag - ICICI Bank",
    category: "fastag",
    state: "All India",
    code: "ICICIFASTAG",
    accountLabel: "Vehicle Registration Number",
    accountPlaceholder: "e.g. AS01AB1234",
    defaultAmount: 500,
  },
  {
    id: "fastag-hdfc",
    name: "NETC FASTag - HDFC Bank",
    category: "fastag",
    state: "All India",
    code: "HDFCFASTAG",
    accountLabel: "Vehicle Registration Number",
    accountPlaceholder: "e.g. DL01AB1234",
    defaultAmount: 500,
  },
  {
    id: "fastag-sbi",
    name: "NETC FASTag - State Bank of India (SBI)",
    category: "fastag",
    state: "All India",
    code: "SBIFASTAG",
    accountLabel: "Vehicle Registration Number",
    accountPlaceholder: "e.g. MH01AB1234",
    defaultAmount: 500,
  },
  {
    id: "fastag-axis",
    name: "NETC FASTag - Axis Bank",
    category: "fastag",
    state: "All India",
    code: "AXISFASTAG",
    accountLabel: "Vehicle Registration Number",
    accountPlaceholder: "e.g. KA01AB1234",
    defaultAmount: 500,
  },
  {
    id: "fastag-paytm",
    name: "NETC FASTag - All Partner Banks",
    category: "fastag",
    state: "All India",
    code: "NETCFASTAG",
    accountLabel: "Vehicle Registration Number",
    accountPlaceholder: "e.g. WB01AB1234",
    defaultAmount: 500,
  },

  // LPG & Gas (Indane, Bharat, HP Gas)
  {
    id: "lpg-indane",
    name: "Indane Gas (Indian Oil)",
    category: "lpg",
    state: "All India",
    code: "INDANE",
    accountLabel: "Registered Mobile Number / 17-digit LPG ID",
    accountPlaceholder: "e.g. 9864012345 or 17-digit ID",
    defaultAmount: 850,
  },
  {
    id: "lpg-bharat",
    name: "Bharat Gas (BPCL)",
    category: "lpg",
    state: "All India",
    code: "BHARATGAS",
    accountLabel: "Registered Mobile Number / 17-digit LPG ID",
    accountPlaceholder: "e.g. 9810012345 or 17-digit ID",
    defaultAmount: 850,
  },
  {
    id: "lpg-hp",
    name: "HP Gas (HPCL)",
    category: "lpg",
    state: "All India",
    code: "HPGAS",
    accountLabel: "Registered Mobile Number / 17-digit LPG ID",
    accountPlaceholder: "e.g. 9820012345 or 17-digit ID",
    defaultAmount: 850,
  },

  // Water & Municipal
  {
    id: "water-gmc",
    name: "Guwahati Municipal Corporation & Jal Board",
    category: "water",
    state: "Assam",
    code: "GMCWATER",
    accountLabel: "Consumer Holding / Connection Number",
    accountPlaceholder: "e.g. GMC-102938",
    defaultAmount: 450,
  },
  {
    id: "water-djb",
    name: "Delhi Jal Board (DJB)",
    category: "water",
    state: "Delhi",
    code: "DJB",
    accountLabel: "K No / Consumer Identification",
    accountPlaceholder: "e.g. 1029384756",
    defaultAmount: 550,
  },
  {
    id: "water-bwssb",
    name: "Bangalore Water Supply and Sewerage Board (BWSSB)",
    category: "water",
    state: "Karnataka",
    code: "BWSSB",
    accountLabel: "Consumer RR Number",
    accountPlaceholder: "e.g. W-102938",
    defaultAmount: 600,
  },
  {
    id: "water-bmc",
    name: "Brihanmumbai Municipal Corporation - Water",
    category: "water",
    state: "Maharashtra",
    code: "BMCWATER",
    accountLabel: "CCN Number / Consumer Code",
    accountPlaceholder: "e.g. 102938475",
    defaultAmount: 650,
  },
  {
    id: "water-cmwssb",
    name: "Chennai Metro Water (CMWSSB)",
    category: "water",
    state: "Tamil Nadu",
    code: "CMWSSB",
    accountLabel: "Bill Number / Area Code & Consumer ID",
    accountPlaceholder: "e.g. 05-123-45678",
    defaultAmount: 500,
  },
];

export interface MobileRechargePlan {
  id: string;
  operatorCode: "JIO" | "AIRTEL" | "VI" | "BSNL";
  priceRupees: number;
  validity: string;
  data: string;
  voice: string;
  sms: string;
  category: "popular" | "5g" | "daily" | "annual" | "addon";
  badge?: string;
  perks?: string;
}

export const POPULAR_RECHARGE_PLANS: MobileRechargePlan[] = [
  // Jio Plans
  {
    id: "jio-199",
    operatorCode: "JIO",
    priceRupees: 199,
    validity: "23 Days",
    data: "1.5 GB/Day",
    voice: "Unlimited",
    sms: "100/Day",
    category: "popular",
    badge: "Best Saver",
    perks: "JioTV, JioCinema",
  },
  {
    id: "jio-299",
    operatorCode: "JIO",
    priceRupees: 299,
    validity: "28 Days",
    data: "2.0 GB/Day",
    voice: "Unlimited",
    sms: "100/Day",
    category: "popular",
    badge: "Hero Pack",
    perks: "JioTV, JioCinema",
  },
  {
    id: "jio-349",
    operatorCode: "JIO",
    priceRupees: 349,
    validity: "28 Days",
    data: "2.5 GB/Day",
    voice: "Unlimited",
    sms: "100/Day",
    category: "5g",
    badge: "🔥 True 5G Unlimited",
    perks: "Unlimited True 5G Data, JioCinema, JioTV",
  },
  {
    id: "jio-666",
    operatorCode: "JIO",
    priceRupees: 666,
    validity: "70 Days",
    data: "1.5 GB/Day",
    voice: "Unlimited",
    sms: "100/Day",
    category: "5g",
    badge: "⚡ 70 Days Value",
    perks: "Unlimited 5G Data, JioCloud",
  },
  {
    id: "jio-2999",
    operatorCode: "JIO",
    priceRupees: 2999,
    validity: "365 Days",
    data: "2.5 GB/Day",
    voice: "Unlimited",
    sms: "100/Day",
    category: "annual",
    badge: "👑 365 Days Annual",
    perks: "Full 1 Year Uncapped 5G (912.5 GB total)",
  },
  {
    id: "jio-19",
    operatorCode: "JIO",
    priceRupees: 19,
    validity: "Base Plan",
    data: "1.0 GB",
    voice: "NA",
    sms: "NA",
    category: "addon",
    badge: "Data Booster",
    perks: "High-speed 4G/5G booster",
  },
  {
    id: "jio-29",
    operatorCode: "JIO",
    priceRupees: 29,
    validity: "Base Plan",
    data: "2.0 GB",
    voice: "NA",
    sms: "NA",
    category: "addon",
    badge: "Data Booster",
    perks: "High-speed 4G/5G booster",
  },

  // Airtel Plans
  {
    id: "airtel-199",
    operatorCode: "AIRTEL",
    priceRupees: 199,
    validity: "24 Days",
    data: "1.5 GB/Day",
    voice: "Unlimited",
    sms: "100/Day",
    category: "popular",
    badge: "Standard Saver",
    perks: "Free Hellotunes, Wynk Music",
  },
  {
    id: "airtel-299",
    operatorCode: "AIRTEL",
    priceRupees: 299,
    validity: "28 Days",
    data: "1.5 GB/Day",
    voice: "Unlimited",
    sms: "100/Day",
    category: "popular",
    badge: "Trending",
    perks: "Wynk Music, Free Hellotunes",
  },
  {
    id: "airtel-349",
    operatorCode: "AIRTEL",
    priceRupees: 349,
    validity: "28 Days",
    data: "2.0 GB/Day",
    voice: "Unlimited",
    sms: "100/Day",
    category: "5g",
    badge: "🔥 Unlimited 5G",
    perks: "Unlimited 5G Data, Airtel Xstream Play",
  },
  {
    id: "airtel-666",
    operatorCode: "AIRTEL",
    priceRupees: 666,
    validity: "77 Days",
    data: "1.5 GB/Day",
    voice: "Unlimited",
    sms: "100/Day",
    category: "5g",
    badge: "⚡ 77 Days Long",
    perks: "Unlimited 5G Data, Apollo 24|7",
  },
  {
    id: "airtel-2999",
    operatorCode: "AIRTEL",
    priceRupees: 2999,
    validity: "365 Days",
    data: "2.0 GB/Day",
    voice: "Unlimited",
    sms: "100/Day",
    category: "annual",
    badge: "👑 365 Days Annual",
    perks: "Unlimited 5G, 730 GB Total, Wynk Music",
  },
  {
    id: "airtel-22",
    operatorCode: "AIRTEL",
    priceRupees: 22,
    validity: "1 Day",
    data: "1.0 GB",
    voice: "NA",
    sms: "NA",
    category: "addon",
    badge: "Instant 1GB",
    perks: "Emergency data add-on",
  },
  {
    id: "airtel-65",
    operatorCode: "AIRTEL",
    priceRupees: 65,
    validity: "Base Plan",
    data: "4.0 GB",
    voice: "NA",
    sms: "NA",
    category: "addon",
    badge: "4GB Pack",
    perks: "Bulk data add-on",
  },

  // Vi Plans
  {
    id: "vi-199",
    operatorCode: "VI",
    priceRupees: 199,
    validity: "21 Days",
    data: "1.0 GB/Day",
    voice: "Unlimited",
    sms: "100/Day",
    category: "popular",
    badge: "Starter",
    perks: "Vi Movies & TV",
  },
  {
    id: "vi-299",
    operatorCode: "VI",
    priceRupees: 299,
    validity: "28 Days",
    data: "1.5 GB/Day",
    voice: "Unlimited",
    sms: "100/Day",
    category: "popular",
    badge: "Binge All Night",
    perks: "Night Data (12-6 AM), Weekend Rollover",
  },
  {
    id: "vi-349",
    operatorCode: "VI",
    priceRupees: 349,
    validity: "28 Days",
    data: "2.0 GB/Day",
    voice: "Unlimited",
    sms: "100/Day",
    category: "5g",
    badge: "🔥 Hero Unlimited",
    perks: "Binge All Night, Weekend Rollover, Data Delight",
  },
  {
    id: "vi-666",
    operatorCode: "VI",
    priceRupees: 666,
    validity: "70 Days",
    data: "1.5 GB/Day",
    voice: "Unlimited",
    sms: "100/Day",
    category: "popular",
    badge: "⚡ 70 Days Value",
    perks: "Binge All Night, Weekend Rollover",
  },
  {
    id: "vi-2999",
    operatorCode: "VI",
    priceRupees: 2999,
    validity: "365 Days",
    data: "850 GB Bulk",
    voice: "Unlimited",
    sms: "100/Day",
    category: "annual",
    badge: "👑 365 Days Full Year",
    perks: "No Daily Data Cap, Binge All Night",
  },
  {
    id: "vi-19",
    operatorCode: "VI",
    priceRupees: 19,
    validity: "1 Day",
    data: "1.0 GB",
    voice: "NA",
    sms: "NA",
    category: "addon",
    badge: "Data Booster",
    perks: "Instant 1GB 24hr pack",
  },

  // BSNL Plans
  {
    id: "bsnl-199",
    operatorCode: "BSNL",
    priceRupees: 199,
    validity: "30 Days",
    data: "2.0 GB/Day",
    voice: "Unlimited",
    sms: "100/Day",
    category: "popular",
    badge: "🔥 30 Days Full Month",
    perks: "True 30-day billing cycle",
  },
  {
    id: "bsnl-299",
    operatorCode: "BSNL",
    priceRupees: 299,
    validity: "30 Days",
    data: "3.0 GB/Day",
    voice: "Unlimited",
    sms: "100/Day",
    category: "popular",
    badge: "Heavy Data Pack",
    perks: "3GB/Day high-speed data",
  },
  {
    id: "bsnl-349",
    operatorCode: "BSNL",
    priceRupees: 349,
    validity: "54 Days",
    data: "2.0 GB/Day",
    voice: "Unlimited",
    sms: "100/Day",
    category: "5g",
    badge: "⚡ 54 Days Value",
    perks: "Long validity daily data",
  },
  {
    id: "bsnl-666",
    operatorCode: "BSNL",
    priceRupees: 666,
    validity: "105 Days",
    data: "2.0 GB/Day",
    voice: "Unlimited",
    sms: "100/Day",
    category: "popular",
    badge: "🚀 105 Days Long",
    perks: "Over 3 months coverage",
  },
  {
    id: "bsnl-2999",
    operatorCode: "BSNL",
    priceRupees: 2999,
    validity: "395 Days",
    data: "3.0 GB/Day",
    voice: "Unlimited",
    sms: "100/Day",
    category: "annual",
    badge: "👑 395 Days Super Annual",
    perks: "Extra 30 days validity free (1,185 GB total)",
  },
];

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];

// PhonePe-Style Operator Logos
export function OperatorBadge({
  code,
  className = "size-8",
}: {
  code: string;
  className?: string;
}) {
  switch (code.toUpperCase()) {
    case "JIO":
      return (
        <div
          className={cn(
            "rounded-full bg-[#0047FF] flex items-center justify-center font-black text-white shrink-0 shadow-sm border border-blue-300/40 select-none",
            className
          )}
        >
          <span className="text-[11px] font-black tracking-tight leading-none">Jio</span>
        </div>
      );
    case "AIRTEL":
      return (
        <div
          className={cn(
            "rounded-xl bg-[#E40000] flex items-center justify-center font-bold text-white shrink-0 shadow-sm border border-red-400/40 select-none",
            className
          )}
        >
          <span className="text-[10px] font-black lowercase tracking-tighter leading-none">
            airtel
          </span>
        </div>
      );
    case "VI":
      return (
        <div
          className={cn(
            "rounded-xl bg-[#E60000] flex items-center justify-center text-white shrink-0 relative overflow-hidden shadow-sm border border-red-400/40 select-none",
            className
          )}
        >
          <span className="text-[12px] font-black tracking-tighter leading-none">!vi</span>
          <div className="absolute top-1 right-1 size-1 rounded-full bg-[#FFD200]" />
        </div>
      );
    case "BSNL":
      return (
        <div
          className={cn(
            "rounded-full bg-[#003399] border border-blue-400/50 flex items-center justify-center text-white shrink-0 relative overflow-hidden shadow-sm select-none",
            className
          )}
        >
          <span className="text-[9px] font-black tracking-wider text-amber-300 leading-none">
            BSNL
          </span>
        </div>
      );
    default:
      return (
        <div
          className={cn(
            "rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0 font-black text-xs select-none",
            className
          )}
        >
          <span>{code.slice(0, 3)}</span>
        </div>
      );
  }
}

interface UtilitiesBillEngineProps {
  initialCategory?: UtilityCategory;
}

export function UtilitiesBillEngine({ initialCategory }: UtilitiesBillEngineProps) {
  const [selectedCategory, setSelectedCategory] = useState<UtilityCategory>(() => {
    if (initialCategory) return initialCategory;
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("category");
      if (param && UTILITY_CATEGORIES.some((c) => c.id === param)) {
        return param as UtilityCategory;
      }
    }
    return "electricity";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBiller, setSelectedBiller] = useState<UtilityBiller>(() => {
    const found = ALL_UTILITY_BILLERS.find((b) => b.category === selectedCategory);
    return found || ALL_UTILITY_BILLERS[0];
  });

  // Mobile Recharge Specific State (PhonePe Parity)
  const [mobileOperator, setMobileOperator] = useState<"JIO" | "AIRTEL" | "VI" | "BSNL">("JIO");
  const [mobileCircle, setMobileCircle] = useState("Assam & North East");
  const [planFilterTab, setPlanFilterTab] = useState<"popular" | "5g" | "daily" | "annual" | "addon">(
    "popular"
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string>("jio-349");

  const [accountNumber, setAccountNumber] = useState("");
  const [amountRupees, setAmountRupees] = useState<number>(() => selectedBiller.defaultAmount);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [activeTxnRef, setActiveTxnRef] = useState("");
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [confirmedUtr, setConfirmedUtr] = useState("");
  const [completedTimestamp, setCompletedTimestamp] = useState("");

  // Sync biller when category changes externally
  useEffect(() => {
    const firstBiller = ALL_UTILITY_BILLERS.find((b) => b.category === selectedCategory);
    if (firstBiller) {
      setSelectedBiller(firstBiller);
      if (selectedCategory === "mobile") {
        setAmountRupees(349);
      } else {
        setAmountRupees(firstBiller.defaultAmount);
      }
    }
  }, [selectedCategory]);

  // Filter billers based on live search or active category
  const filteredBillers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      return ALL_UTILITY_BILLERS.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.state.toLowerCase().includes(q) ||
          b.code.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q)
      );
    }
    return ALL_UTILITY_BILLERS.filter((b) => b.category === selectedCategory);
  }, [searchQuery, selectedCategory]);

  // Filter recharge plans for selected operator & tab
  const availablePlans = useMemo(() => {
    return POPULAR_RECHARGE_PLANS.filter((p) => {
      if (p.operatorCode !== mobileOperator) return false;
      if (planFilterTab === "popular") return true;
      if (planFilterTab === "5g") return p.category === "5g" || p.badge?.includes("5G");
      return p.category === planFilterTab;
    });
  }, [mobileOperator, planFilterTab]);

  const handleSelectCategory = (cat: UtilityCategory) => {
    setSelectedCategory(cat);
    setSearchQuery("");
    const firstBiller = ALL_UTILITY_BILLERS.find((b) => b.category === cat);
    if (firstBiller) {
      setSelectedBiller(firstBiller);
      setAccountNumber("");
      if (cat === "mobile") {
        setAmountRupees(349);
        setSelectedPlanId("jio-349");
      } else {
        setAmountRupees(firstBiller.defaultAmount);
      }
    }
  };

  const handleSelectBiller = (biller: UtilityBiller) => {
    setSelectedBiller(biller);
    setSelectedCategory(biller.category);
    setAmountRupees(biller.defaultAmount);
    if (biller.category === "mobile") {
      const op = biller.code as "JIO" | "AIRTEL" | "VI" | "BSNL";
      if (["JIO", "AIRTEL", "VI", "BSNL"].includes(op)) {
        setMobileOperator(op);
      }
    }
  };

  const handleSelectOperator = (op: "JIO" | "AIRTEL" | "VI" | "BSNL") => {
    setMobileOperator(op);
    const targetBiller = ALL_UTILITY_BILLERS.find((b) => b.code === op && b.category === "mobile");
    if (targetBiller) {
      setSelectedBiller(targetBiller);
    }
    const defaultPlan = POPULAR_RECHARGE_PLANS.find(
      (p) => p.operatorCode === op && p.priceRupees === 349
    ) || POPULAR_RECHARGE_PLANS.find((p) => p.operatorCode === op);
    if (defaultPlan) {
      setSelectedPlanId(defaultPlan.id);
      setAmountRupees(defaultPlan.priceRupees);
    }
  };

  const handleSelectPlan = (plan: MobileRechargePlan) => {
    setSelectedPlanId(plan.id);
    setAmountRupees(plan.priceRupees);
  };

  const cleanAmount = Math.max(1, Number(amountRupees) || 0);

  // Generate UPI Intent URL
  const txnRef = useMemo(() => {
    return activeTxnRef || `UTIL-${selectedBiller.code}-${Date.now().toString().slice(-6)}`;
  }, [activeTxnRef, selectedBiller.code]);

  const upiIntentUri = useMemo(() => {
    const isMobile = selectedCategory === "mobile";
    return buildNPCIUpiIntentUrl({
      vpa: "9395065587@ybl",
      payeeName: isMobile ? "OrderKing Telecom" : "OrderKing Utilities",
      amountInRupees: cleanAmount,
      currency: "INR",
      transactionRef: txnRef,
      transactionNote: `${selectedBiller.code} ${accountNumber.trim() || (isMobile ? "Recharge" : "Utility Bill")}`.slice(
        0,
        45
      ),
      merchantCategoryCode: isMobile ? "4814" : "4900",
      mode: "02",
    });
  }, [cleanAmount, selectedBiller.code, accountNumber, txnRef, selectedCategory]);

  const qrImageUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
      upiIntentUri
    )}&bgcolor=FFFFFF&color=05070B`;
  }, [upiIntentUri]);

  // Deep Links across Indian UPI apps
  const appLinks = useMemo(() => {
    const isMobile = selectedCategory === "mobile";
    const intentParams = {
      vpa: "9395065587@ybl",
      payeeName: isMobile ? "OrderKing Telecom" : "OrderKing Utilities",
      amountInRupees: cleanAmount,
      transactionRef: txnRef,
      transactionNote: `${selectedBiller.code} ${accountNumber.trim() || (isMobile ? "Recharge" : "Utility Bill")}`.slice(
        0,
        45
      ),
      merchantCategoryCode: isMobile ? "4814" : "4900",
      mode: "02",
    };

    return {
      phonepe: generateAppDeepLink("phonepe", intentParams),
      gpay: generateAppDeepLink("gpay", intentParams),
      paytm: generateAppDeepLink("paytm", intentParams),
      bhim: generateAppDeepLink("bhim", intentParams),
      universal: generateAppDeepLink("universal", intentParams),
    };
  }, [cleanAmount, txnRef, selectedBiller.code, accountNumber, selectedCategory]);

  const handleProceedToPay = () => {
    if (selectedCategory === "mobile") {
      const cleanPhone = accountNumber.replace(/\D/g, "");
      if (cleanPhone.length > 0 && cleanPhone.length !== 10) {
        toast.error("Please enter a valid 10-digit mobile number");
        return;
      }
    } else {
      if (!accountNumber.trim()) {
        toast.error(`Please enter your ${selectedBiller.accountLabel}`);
        return;
      }
    }

    const newRef = `UTIL-${selectedBiller.code}-${Date.now().toString().slice(-6)}`;
    setActiveTxnRef(newRef);
    setPaymentCompleted(false);
    setIsCheckoutModalOpen(true);
  };

  const handleConfirmPaid = () => {
    const utr = `6305${Math.floor(10000000 + Math.random() * 90000000)}`;
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    setConfirmedUtr(utr);
    setCompletedTimestamp(now);
    setPaymentCompleted(true);
    toast.success("Payment recorded. Official GST Tax Invoice generated!");
  };

  const handleCopyUpi = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(upiIntentUri);
      toast.success("UPI payment intent copied to clipboard");
    }
  };

  const handleShareWhatsApp = () => {
    if (typeof window !== "undefined") {
      const isMobile = selectedCategory === "mobile";
      const itemDesc = isMobile
        ? `Mobile Recharge for ${selectedBiller.name} (${accountNumber || "Prepaid"})`
        : `Utility bill payment for ${selectedBiller.name} (${accountNumber})`;
      const text = `${itemDesc}\nAmount: ₹${cleanAmount}\nUPI Payment Link:\n${upiIntentUri}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const handlePrintInvoice = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Header & Live Search ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Zap className="size-5 text-amber-400" /> Utilities
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Electricity, mobile recharge, broadband, DTH, FASTag, gas &amp; water bill payments
          </p>
        </div>

        {/* Live Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search biller (e.g. APDCL, Jio, Airtel, FASTag)..."
            className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-800 bg-slate-900/90 text-white text-xs placeholder:text-slate-500 focus:border-amber-400/80 focus:bg-slate-900 outline-none transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Category Selection Grid ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {UTILITY_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id && !searchQuery;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelectCategory(cat.id)}
              className={cn(
                "flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group",
                isSelected
                  ? "border-amber-400 bg-gradient-to-b from-amber-950/40 via-slate-900 to-[#10141E] ring-1 ring-amber-400/50 shadow-[0_4px_20px_rgba(245,158,11,0.15)]"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
              )}
            >
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-xl mb-2 transition-transform group-hover:scale-105",
                  isSelected
                    ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                    : "bg-slate-800 text-slate-300 border border-slate-700/60"
                )}
              >
                <Icon className="size-4" />
              </div>
              <span className="text-xs font-bold text-white leading-tight">{cat.label}</span>
              <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{cat.sublabel}</span>
            </button>
          );
        })}
      </div>

      {/* ─── SPECIALIZED SECTION A: MOBILE RECHARGE STUDIO (PhonePe Parity) ─── */}
      {selectedCategory === "mobile" && !searchQuery ? (
        <div className="space-y-5 rounded-3xl border border-slate-800 bg-slate-950 p-4 sm:p-6 shadow-2xl">
          {/* Header & Operator Switcher */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                ⚡ Instant Mobile Recharge
              </span>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Select Operator &amp; Mobile Number
              </h3>
            </div>

            {/* Operator Selection Pills */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { code: "JIO", name: "Jio" },
                { code: "AIRTEL", name: "Airtel" },
                { code: "VI", name: "Vi" },
                { code: "BSNL", name: "BSNL" },
              ].map((op) => {
                const isActive = mobileOperator === op.code;
                return (
                  <button
                    key={op.code}
                    type="button"
                    onClick={() => handleSelectOperator(op.code as any)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer",
                      isActive
                        ? "border-amber-400 bg-amber-400/15 text-white shadow-sm ring-1 ring-amber-400/30"
                        : "border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white hover:border-slate-700"
                    )}
                  >
                    <OperatorBadge code={op.code} className="size-6 text-[10px]" />
                    <span className="text-xs font-bold">{op.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Number & Circle Input Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-200 block mb-1.5">
                Mobile Number (10 Digits)
              </label>
              <div className="flex items-center rounded-xl border border-slate-700 bg-slate-900 focus-within:border-amber-400 transition overflow-hidden">
                <span className="px-3.5 text-xs font-mono font-bold text-slate-400 bg-slate-800/60 border-r border-slate-700 py-3">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 9864012345"
                  className="flex-1 h-11 px-3 bg-transparent text-white font-mono text-sm font-bold placeholder:text-slate-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-200 block mb-1.5">
                Telecom Circle / Region
              </label>
              <select
                value={mobileCircle}
                onChange={(e) => setMobileCircle(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-bold outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="Assam & North East">Assam &amp; North East</option>
                <option value="All India">All India</option>
                <option value="West Bengal & Kolkata">West Bengal &amp; Kolkata</option>
                <option value="Delhi NCR">Delhi NCR</option>
                <option value="Maharashtra & Goa">Maharashtra &amp; Goa</option>
                <option value="Karnataka & Bangalore">Karnataka &amp; Bangalore</option>
                <option value="Tamil Nadu & Chennai">Tamil Nadu &amp; Chennai</option>
              </select>
            </div>
          </div>

          {/* Plan Category Tabs (PhonePe Parity) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">
                Browse Plans for {selectedBiller.name}
              </span>
              <span className="text-[11px] text-amber-400 font-bold">
                {availablePlans.length} Plans Available
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {[
                { id: "popular", label: "🔥 Popular Plans" },
                { id: "5g", label: "⚡ True 5G Unlimited" },
                { id: "daily", label: "📶 Daily Data" },
                { id: "annual", label: "📅 Annual 365 Days" },
                { id: "addon", label: "➕ Data Add-ons" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPlanFilterTab(tab.id as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer border",
                    planFilterTab === tab.id
                      ? "border-amber-400 bg-amber-400/20 text-amber-300"
                      : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Popular Plans Grid (₹199, ₹299, ₹349, ₹666, ₹2999) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availablePlans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan)}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group",
                      isSelected
                        ? "border-amber-400 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 ring-1 ring-amber-400/50 shadow-lg"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
                    )}
                  >
                    {/* Top Row: Price, Validity, Badge */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="text-xl font-black text-white font-mono flex items-baseline gap-1">
                            <span>₹{plan.priceRupees}</span>
                            <span className="text-[10px] text-slate-400 font-sans font-normal">
                              ({(plan.priceRupees / Math.max(1, parseInt(plan.validity) || 1)).toFixed(1)}/day)
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-amber-300">
                            {plan.validity}
                          </span>
                        </div>

                        {plan.badge && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300">
                            {plan.badge}
                          </span>
                        )}
                      </div>

                      {/* Benefits Matrix */}
                      <div className="grid grid-cols-3 gap-1.5 py-2 my-2 border-y border-slate-800/80 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">Data</span>
                          <span className="font-bold text-white">{plan.data}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">Voice</span>
                          <span className="font-bold text-white">{plan.voice}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">SMS</span>
                          <span className="font-bold text-white">{plan.sms}</span>
                        </div>
                      </div>

                      {plan.perks && (
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-1">
                          🎁 {plan.perks}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <span className="text-[10px] text-slate-400">
                        {isSelected ? "Selected Plan" : "Tap to select"}
                      </span>
                      <div
                        className={cn(
                          "size-5 rounded-full flex items-center justify-center border transition",
                          isSelected
                            ? "bg-amber-400 border-amber-400 text-slate-950"
                            : "border-slate-700 text-transparent"
                        )}
                      >
                        <Check className="size-3 stroke-[3]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="text-left w-full sm:w-auto">
              <span className="text-[11px] text-slate-400 block">Total Payable:</span>
              <span className="text-xl font-black text-white font-mono">
                ₹{cleanAmount.toFixed(2)}
              </span>
              <span className="text-[10px] text-emerald-400 block font-medium">
                ✓ 0% Platform Markup · Direct UPI Settlement
              </span>
            </div>

            <button
              type="button"
              onClick={handleProceedToPay}
              className="w-full sm:w-auto px-8 h-12 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition cursor-pointer"
            >
              <span>Recharge ₹{cleanAmount} via UPI</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        /* ─── SECTION B: UTILITIES & BILL PAYMENTS (Electricity, Water, Gas, etc.) ─── */
        <div className="space-y-5">
          {/* Biller Selector Bar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">
                {searchQuery
                  ? `Search Results (${filteredBillers.length})`
                  : `Select Biller (${filteredBillers.length})`}
              </span>
              <span className="text-[11px] text-slate-400">
                Selected: <strong className="text-amber-400">{selectedBiller.code}</strong>
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {filteredBillers.map((b) => {
                const isCurrent = selectedBiller.id === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelectBiller(b)}
                    className={cn(
                      "shrink-0 px-3.5 py-2.5 rounded-xl border text-left text-xs transition cursor-pointer max-w-[220px]",
                      isCurrent
                        ? "border-amber-400 bg-amber-400/10 text-white"
                        : "border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-[11px] text-amber-300">{b.code}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {b.state}
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-200 truncate">{b.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Details & Amount Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Account Form */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      {selectedBiller.accountLabel}
                    </label>
                    <span className="text-[10px] text-slate-400">{selectedBiller.state}</span>
                  </div>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder={selectedBiller.accountPlaceholder}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-xs focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-200">Bill Amount (₹)</label>
                    <span className="text-[10px] text-slate-400 font-mono">INR</span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={amountRupees}
                    onChange={(e) => setAmountRupees(Math.max(1, Number(e.target.value) || 0))}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-sm font-bold focus:border-amber-400 outline-none"
                  />

                  {/* Preset Amount Chips */}
                  <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                    {PRESET_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmountRupees(amt)}
                        className={cn(
                          "h-8 px-2.5 rounded-lg border text-xs font-mono font-bold transition shrink-0 cursor-pointer",
                          amountRupees === amt
                            ? "bg-amber-400/20 border-amber-400 text-amber-300"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                        )}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Biller Preview & Direct Checkout Action */}
              <div className="flex flex-col justify-between space-y-4 rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                    Bill Summary &amp; Status
                  </span>

                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2">
                    <div className="flex justify-between text-slate-400">
                      <span>Biller Provider</span>
                      <span className="font-bold text-white text-right">{selectedBiller.name}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Consumer Account</span>
                      <span className="font-mono text-amber-300">
                        {accountNumber.trim() || "Pending input"}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Settlement Channel</span>
                      <span className="font-bold text-emerald-400">NPCI Direct UPI</span>
                    </div>
                    <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                      <span>Total Payable</span>
                      <span className="font-mono font-bold text-white text-base">
                        ₹{cleanAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToPay}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition cursor-pointer"
                >
                  <span>Pay ₹{cleanAmount.toFixed(2)} via UPI</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CLEAN CHECKOUT & POST-PAYMENT GST INVOICE MODAL ─── */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950 p-5 sm:p-6 shadow-2xl text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/30">
                  {paymentCompleted ? "Payment Confirmed" : "UPI Instant Checkout"}
                </span>
                <h3 className="text-base font-black text-white mt-1.5">{selectedBiller.name}</h3>
                <p className="text-xs text-slate-400">
                  {selectedCategory === "mobile" ? "Mobile Number" : "Account"}:{" "}
                  {accountNumber || "N/A"} · Amount: ₹{cleanAmount.toFixed(2)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {!paymentCompleted ? (
              /* VIEW 1: ACTIVE PAYMENT ROUTING (PhonePe, GPay, Paytm, QR) */
              <div className="space-y-4">
                {/* Dynamic QR Presentation */}
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-slate-800 text-center">
                  <div className="bg-white p-3 rounded-2xl shadow-lg">
                    <img
                      src={qrImageUrl}
                      alt={`UPI Payment for ${selectedBiller.name}`}
                      loading="lazy"
                      decoding="async"
                      className="size-44 sm:size-48 object-contain"
                    />
                  </div>
                  <span className="text-xs font-mono text-amber-300 font-bold mt-2.5">
                    Scan with PhonePe, Google Pay, Paytm, or BHIM
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    Ref: {activeTxnRef || txnRef} · VPA: 9395065587@ybl
                  </span>
                </div>

                {/* Direct App Launch Grid (PhonePe Parity) */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Launch Direct UPI App
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* PhonePe Direct */}
                    <a
                      href={appLinks.phonepe}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 font-bold transition no-underline cursor-pointer"
                    >
                      <div className="size-4 rounded-full bg-[#5f259f] flex items-center justify-center text-[9px] font-black text-white">
                        पे
                      </div>
                      <span>PhonePe</span>
                    </a>

                    {/* Google Pay Direct */}
                    <a
                      href={appLinks.gpay}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl border border-blue-500/40 bg-blue-950/40 hover:bg-blue-900/60 text-blue-200 font-bold transition no-underline cursor-pointer"
                    >
                      <div className="size-4 rounded-full bg-white text-blue-600 flex items-center justify-center text-[10px] font-black">
                        G
                      </div>
                      <span>Google Pay</span>
                    </a>

                    {/* Paytm Direct */}
                    <a
                      href={appLinks.paytm}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl border border-sky-500/40 bg-sky-950/40 hover:bg-sky-900/60 text-sky-200 font-bold transition no-underline cursor-pointer"
                    >
                      <div className="size-4 rounded-full bg-[#002e6e] text-[#00baf2] flex items-center justify-center text-[9px] font-black">
                        Pay
                      </div>
                      <span>Paytm</span>
                    </a>

                    {/* Generic / Universal UPI Intent */}
                    <a
                      href={appLinks.universal}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold transition no-underline cursor-pointer"
                    >
                      <Zap className="size-3.5 text-amber-400" />
                      <span>Any UPI App</span>
                    </a>
                  </div>
                </div>

                {/* Copy Intent & WhatsApp Sharing */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 transition cursor-pointer"
                  >
                    <Copy className="size-3.5" /> Copy Intent
                  </button>
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 transition cursor-pointer"
                  >
                    <Share2 className="size-3.5" /> WhatsApp
                  </button>
                </div>

                {/* Mark as Paid -> Generate GST Invoice */}
                <div className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleConfirmPaid}
                    className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="size-4" />
                    <span>I Have Completed Payment</span>
                  </button>
                </div>
              </div>
            ) : (
              /* VIEW 2: OFFICIAL GST TAX INVOICE & RECEIPT GENERATOR */
              <div className="space-y-4">
                {/* Success Indicator */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                  <CheckCircle2 className="size-8 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-black text-white">Payment Confirmed &amp; Settled</h4>
                  <p className="text-xs text-slate-300">
                    Your transaction has been processed via NPCI UPI Direct Gateway.
                  </p>
                </div>

                {/* Official Printable GST Invoice Card */}
                <div
                  id="printable-gst-invoice"
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-3 font-sans print:bg-white print:text-black print:p-0"
                >
                  {/* Invoice Header */}
                  <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="font-black text-base text-white tracking-tight block">
                        ORDERKING PAY
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        GSTIN: <strong className="text-slate-300 font-mono">18AFXPH9838M1Z9</strong>
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Sribhumi / Karimganj, Assam - 788710
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 font-bold uppercase">
                        TAX INVOICE
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                        #{activeTxnRef}
                      </span>
                    </div>
                  </div>

                  {/* Transaction Metadata */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] py-1 border-b border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Service &amp; Biller</span>
                      <span className="font-bold text-white">{selectedBiller.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Account / Mobile</span>
                      <span className="font-bold font-mono text-amber-300">
                        {accountNumber || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Bank UTR Reference</span>
                      <span className="font-mono text-slate-300">{confirmedUtr}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Date &amp; Time (IST)</span>
                      <span className="text-slate-300">{completedTimestamp}</span>
                    </div>
                  </div>

                  {/* Statutory Tax Breakdown (18% GST on facilitation/service) */}
                  <div className="space-y-1.5 py-1 text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Base Value / Recharge Tariff</span>
                      <span className="font-mono font-bold text-white">
                        ₹{(cleanAmount / 1.18).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[10px]">
                      <span>CGST @ 9% (SAC {selectedCategory === "mobile" ? "9984" : "9985"})</span>
                      <span className="font-mono">
                        ₹{(((cleanAmount - cleanAmount / 1.18) / 2) || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[10px]">
                      <span>SGST @ 9% (SAC {selectedCategory === "mobile" ? "9984" : "9985"})</span>
                      <span className="font-mono">
                        ₹{(((cleanAmount - cleanAmount / 1.18) / 2) || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-200 font-bold pt-2 border-t border-slate-800 text-sm">
                      <span>Total Amount Paid</span>
                      <span className="font-mono text-emerald-400">₹{cleanAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/60 leading-tight">
                    This is an electronically generated statutory tax invoice emitted under Section
                    31 of the CGST Act, 2017. OrderKing Pay operates under GSTIN 18AFXPH9838M1Z9.
                  </div>
                </div>

                {/* Print & Share Controls */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePrintInvoice}
                    className="flex-1 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Printer className="size-4" />
                    <span>Print Invoice</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Share2 className="size-4" />
                    <span>WhatsApp</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCheckoutModalOpen(false);
                    setPaymentCompleted(false);
                  }}
                  className="w-full h-10 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Make Another Payment
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
