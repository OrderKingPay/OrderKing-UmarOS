import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Zap,
  ArrowRight,
  Wallet,
  CreditCard,
  Share2,
  Receipt,
  Printer,
  Check,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatPaise } from "@/lib/money";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  buildNPCIUpiIntentUrl,
  generateAppDeepLink,
} from "@/lib/payments/npci-upi-intent";
import {
  prepareUtilityBillRazorpayOrder,
  verifyAndRecordUtilityBillPayment,
  payUtilityBillWithWallet,
  listMyUtilityBills,
} from "@/lib/server/kingpay";

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
    accountPlaceholder: "Enter 10-digit Consumer ID",
    defaultAmount: 950,
  },
  {
    id: "tsspdcl-telangana",
    name: "TSSPDCL - Southern Power Distribution of Telangana",
    category: "electricity",
    state: "Telangana",
    code: "TSSPDCL",
    accountLabel: "Unique Service Number (USC)",
    accountPlaceholder: "Enter USC number",
    defaultAmount: 1100,
  },
  {
    id: "tangedco-tamilnadu",
    name: "TANGEDCO - Tamil Nadu Generation and Distribution",
    category: "electricity",
    state: "Tamil Nadu",
    code: "TANGEDCO",
    accountLabel: "Consumer Number",
    accountPlaceholder: "Enter consumer number",
    defaultAmount: 800,
  },
  {
    id: "msedcl-maharashtra",
    name: "MSEDCL / Mahavitaran - Maharashtra State Electricity",
    category: "electricity",
    state: "Maharashtra",
    code: "MSEDCL",
    accountLabel: "Consumer Number (12 Digits)",
    accountPlaceholder: "Enter 12-digit Consumer Number",
    defaultAmount: 1250,
  },
  {
    id: "tata-power-delhi",
    name: "Tata Power - Delhi Distribution Ltd (TPDDL)",
    category: "electricity",
    state: "Delhi",
    code: "TPDDL",
    accountLabel: "CA Number (11 Digits)",
    accountPlaceholder: "Enter 11-digit CA Number",
    defaultAmount: 1400,
  },
  {
    id: "bses-rajdhani-delhi",
    name: "BSES Rajdhani Power Limited",
    category: "electricity",
    state: "Delhi",
    code: "BRPL",
    accountLabel: "CA Number (9 Digits)",
    accountPlaceholder: "Enter 9-digit CA Number",
    defaultAmount: 1350,
  },
  {
    id: "bses-yamuna-delhi",
    name: "BSES Yamuna Power Limited",
    category: "electricity",
    state: "Delhi",
    code: "BYPL",
    accountLabel: "CA Number (9 Digits)",
    accountPlaceholder: "Enter 9-digit CA Number",
    defaultAmount: 1200,
  },
  {
    id: "uppcl-urban",
    name: "UPPCL - Uttar Pradesh Power Corporation (Urban)",
    category: "electricity",
    state: "Uttar Pradesh",
    code: "UPPCL",
    accountLabel: "Account Number (10 Digits)",
    accountPlaceholder: "Enter 10-digit Account Number",
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
    badge: "365 Days Annual",
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
    perks: "Hellotunes, Wynk Music (Bundled)",
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
    perks: "Wynk Music, Hellotunes (Bundled)",
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
    badge: "365 Days Annual",
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
    badge: "365 Days Full Year",
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
    badge: "395 Days Super Annual",
    perks: "Extra 30 days validity included (1,185 GB total)",
  },
];

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];

export function getBillerOfficialPortal(biller: UtilityBiller): string {
  const portalMap: Record<string, string> = {
    "apdcl-assam": "https://www.apdcl.org/",
    "bescom-karnataka": "https://bescom.karnataka.gov.in/",
    "tsspdcl-telangana": "https://www.tssouthernpower.com/",
    "tangedco-tamilnadu": "https://www.tnebnet.org/",
    "msedcl-maharashtra": "https://www.mahadiscom.in/",
    "tata-power-delhi": "https://www.tatapower-ddl.com/",
    "bses-rajdhani-delhi": "https://www.bsesdelhi.com/",
    "bses-yamuna-delhi": "https://www.bsesdelhi.com/",
    "uppcl-urban": "https://www.upenergy.in/",
    "wbsedcl-bengal": "https://www.wbsedcl.in/",
    "pspcl-punjab": "https://pspcl.in/",
    "jio-telecom": "https://www.jio.com/selfcare/recharge/mobility/",
    "airtel-telecom": "https://www.airtel.in/recharge-online",
    "vi-telecom": "https://www.myvi.in/prepaid/online-mobile-recharge",
    "bsnl-telecom": "https://portal2.bsnl.in/",
    "airtel-broadband": "https://www.airtel.in/broadband",
    "jio-fiber": "https://www.jio.com/fiber",
    "bsnl-broadband": "https://portal2.bsnl.in/",
    "act-fibernet": "https://www.actcorp.in/",
    "tata-play-fiber": "https://www.tataplayfiber.com/",
    "tata-play": "https://www.tataplay.com/quick-recharge",
    "airtel-dth": "https://www.airtel.in/dth-recharge",
    "sun-direct": "https://www.sundirect.in/recharge",
    "dish-tv": "https://www.dishtv.in/",
    "fastag-icici": "https://ihmcl.co.in/",
    "fastag-hdfc": "https://ihmcl.co.in/",
    "fastag-sbi": "https://ihmcl.co.in/",
    "fastag-axis": "https://ihmcl.co.in/",
    "fastag-paytm": "https://ihmcl.co.in/",
    "lpg-indane": "https://cx.indianoil.in/",
    "lpg-bharat": "https://my.ebharatgas.com/",
    "lpg-hp": "https://myhpgas.in/",
    "water-gmc": "https://gmc.assam.gov.in/",
    "water-djb": "https://djb.gov.in/",
    "water-bwssb": "https://bwssb.karnataka.gov.in/",
    "water-bmc": "https://portal.mcgm.gov.in/",
    "water-cmwssb": "https://chennaimetrowater.tn.gov.in/",
  };
  return portalMap[biller.id] || "https://www.bharatbillpay.com/";
}

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
          <span className="text-[9px] font-black tracking-wider text-orange-300 leading-none">
            BSNL
          </span>
        </div>
      );
    default:
      return (
        <div
          className={cn(
            "rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-orange-400 shrink-0 font-black text-xs select-none",
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

async function ensureRazorpayLoaded(): Promise<any> {
  if (typeof window === "undefined") return null;
  const win = window as any;
  if (win.Razorpay) return win.Razorpay;
  return new Promise((resolve) => {
    const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).Razorpay || null));
      existing.addEventListener("error", () => resolve(null));
      setTimeout(() => resolve((window as any).Razorpay || null), 1500);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve((window as any).Razorpay || null);
    script.onerror = () => resolve(null);
    document.body.appendChild(script);
  });
}

export function UtilitiesBillEngine({ initialCategory }: UtilitiesBillEngineProps) {
  const { user } = useCurrentUserState();
  const queryClient = useQueryClient();
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

  // Mobile Recharge Specific State
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
  const [confirmedRef, setConfirmedRef] = useState("");
  const [confirmedGateway, setConfirmedGateway] = useState("");
  const [completedTimestamp, setCompletedTimestamp] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  const billHistoryQuery = useQuery({
    queryKey: ["utility_bills_history", user?.id],
    queryFn: () => listMyUtilityBills(),
    enabled: Boolean(user),
  });

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
      if (cleanPhone.length !== 10) {
        toast.error("Please enter a valid 10-digit mobile number");
        return;
      }
    } else {
      if (!accountNumber.trim() || accountNumber.trim().length < 4) {
        toast.error(`Please enter a valid ${selectedBiller.accountLabel}`);
        return;
      }
    }

    const newRef = `UTIL-${selectedBiller.code}-${Date.now().toString().slice(-6)}`;
    setActiveTxnRef(newRef);
    setPaymentCompleted(false);
    setConfirmedRef("");
    setConfirmedGateway("");
    setIsCheckoutModalOpen(true);
  };

  const handlePayViaRazorpay = async () => {
    toast.info("BBPS utility bill clearing is currently offline awaiting official regulatory certification. Real money payment collection is disabled for customer fund safety.");
    return;
  };

  const handlePayWithWallet = async () => {
    toast.info("BBPS utility bill clearing is currently offline awaiting official regulatory certification. Wallet deductions are disabled for customer fund safety.");
    return;
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
            <Zap className="size-5 text-orange-400" /> Utilities
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
            className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-800 bg-slate-900/90 text-white text-xs placeholder:text-slate-500 focus:border-orange-400/80 focus:bg-slate-900 outline-none transition"
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

      {/* ─── BBPS AGGREGATOR OFFLINE CLEARANCE NOTICE ─── */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 text-amber-200 space-y-2">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="size-5 text-amber-400 shrink-0" />
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black text-white tracking-tight">
              Bharat BillPay (BBPS) Integration Status: Offline Awaiting Clearing Certification
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40 uppercase">
              Regulatory Clearance in Progress
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          OrderKing is currently completing regulatory onboarding with authorized BBPS Operating Units (BOU). In adherence to statutory consumer protection standards (Orderkingpay, Assam - 788710, GSTIN: 18AFXPH9838M1Z9), <strong>real-money payment collection for utility bills is strictly disabled</strong> until official clearing rails are certified. Please utilize your biller&apos;s official portal below for direct settlements.
        </p>
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
                  ? "border-orange-400 bg-gradient-to-b from-orange-950/40 via-slate-900 to-[#10141E] ring-1 ring-orange-400/50 shadow-[0_4px_20px_rgba(245,158,11,0.15)]"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
              )}
            >
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-xl mb-2 transition-transform group-hover:scale-105",
                  isSelected
                    ? "bg-orange-400/20 text-orange-300 border border-orange-400/40"
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
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                ⚡ Mobile Recharge
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
                        ? "border-orange-400 bg-orange-400/15 text-white shadow-sm ring-1 ring-orange-400/30"
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
              <div className="flex items-center rounded-xl border border-slate-700 bg-slate-900 focus-within:border-orange-400 transition overflow-hidden">
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
                className="w-full h-11 px-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-bold outline-none focus:border-orange-400 cursor-pointer"
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
              <span className="text-[11px] text-orange-400 font-bold">
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
                      ? "border-orange-400 bg-orange-400/20 text-orange-300"
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
                        ? "border-orange-400 bg-gradient-to-br from-orange-950/40 via-slate-900 to-slate-950 ring-1 ring-orange-400/50 shadow-lg"
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
                          <span className="text-[11px] font-bold text-orange-300">
                            {plan.validity}
                          </span>
                        </div>

                        {plan.badge && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-400/15 border border-orange-400/30 text-orange-300">
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
                            ? "bg-orange-400 border-orange-400 text-slate-950"
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
              className="w-full sm:w-auto px-8 h-12 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-300 hover:to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-98 transition cursor-pointer"
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
                Selected: <strong className="text-orange-400">{selectedBiller.code}</strong>
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
                        ? "border-orange-400 bg-orange-400/10 text-white"
                        : "border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-[11px] text-orange-300">{b.code}</span>
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
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-xs focus:border-orange-400 outline-none"
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
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-sm font-bold focus:border-orange-400 outline-none"
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
                            ? "bg-orange-400/20 border-orange-400 text-orange-300"
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
                      <span className="font-mono text-orange-300">
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
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-98 transition cursor-pointer"
                >
                  <AlertTriangle className="size-4" />
                  <span>View BBPS Status &amp; Official Biller Portal</span>
                  <ExternalLink className="size-4" />
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
                  {paymentCompleted ? "Payment Confirmed" : "BBPS Status & Official Settlement"}
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
              /* VIEW 1: BBPS STATUTORY CLEARANCE ADVISORY & DIRECT OFFICIAL PORTAL LINK */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4.5 text-amber-400 shrink-0" />
                    <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                      BBPS Aggregator Clearing In Regulatory Queue
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Direct automated clearing for <strong>{selectedBiller.name}</strong> is temporarily offline awaiting official regulatory certification of our BBPS Operating Unit connection.
                  </p>
                  <p className="text-[11px] text-amber-200/90 font-medium">
                    To safeguard customer funds and prevent un-cleared utility dues, OrderKing does not accept in-app payment collections until BBPS clearing rails are officially certified.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Selected Biller:</span>
                    <span className="font-bold text-white text-right">{selectedBiller.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Account / Mobile:</span>
                    <span className="font-mono text-orange-300">{accountNumber.trim() || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Indicative Due Amount:</span>
                    <span className="font-mono font-bold text-white">₹{cleanAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Convenience Fee:</span>
                    <span className="font-bold text-emerald-400">₹0 (Waived)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Clearing State:</span>
                    <span className="font-mono text-amber-400 font-bold">Offline (Awaiting BOU Clearance)</span>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                    <span>Statutory Entity:</span>
                    <span className="font-mono text-slate-300">Orderkingpay (Assam - 788710) · GSTIN 18AFXPH9838M1Z9</span>
                  </div>
                </div>

                {/* Direct Official Portal Link */}
                <a
                  href={getBillerOfficialPortal(selectedBiller)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 no-underline"
                >
                  <span>Pay on Official {selectedBiller.code} Portal</span>
                  <ExternalLink className="size-4" />
                </a>

                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="w-full h-10 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              /* VIEW 2: VERIFIED PAYMENT RECEIPT (ONLY SHOWN AFTER SERVER VERIFICATION) */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                  <CheckCircle2 className="size-8 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-black text-white">Payment Verified &amp; Recorded</h4>
                  <p className="text-xs text-slate-300">
                    Settled via {confirmedGateway || "Verified Gateway"}.
                  </p>
                </div>

                <div
                  id="printable-utility-receipt"
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-3 font-sans print:bg-white print:text-black print:p-0"
                >
                  <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="font-black text-base text-white tracking-tight block">
                        ORDERKING PAY
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Sribhumi / Karimganj, Assam - 788710 · GSTIN: 18AFXPH9838M1Z9
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 font-bold uppercase">
                        PAYMENT RECEIPT
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                        #{activeTxnRef}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] py-1 border-b border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Service &amp; Biller</span>
                      <span className="font-bold text-white">{selectedBiller.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Account / Mobile</span>
                      <span className="font-bold font-mono text-orange-300">
                        {accountNumber || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Verified Reference</span>
                      <span className="font-mono text-slate-300 break-all">{confirmedRef}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Date &amp; Time (IST)</span>
                      <span className="text-slate-300">{completedTimestamp}</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-slate-200 font-bold pt-2 text-sm">
                    <span>Total Amount Paid</span>
                    <span className="font-mono text-emerald-400">₹{cleanAmount.toFixed(2)}</span>
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
                    <span>Print Receipt</span>
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

      {/* ─── RECENT UTILITY & RECHARGE HISTORY (POSTGRESQL) ─── */}
      {user && (billHistoryQuery.data?.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Receipt className="size-4 text-orange-400" />
              <span>Recent Verified Utility Payments</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">PostgreSQL Ledger</span>
          </div>
          <div className="space-y-2">
            {(billHistoryQuery.data ?? []).map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3.5 py-2.5 text-xs"
              >
                <div>
                  <span className="font-bold text-white block">{bill.billerName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {bill.billerCode} · {bill.accountMasked} · Ref {bill.id}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-emerald-400 block">
                    {formatPaise(bill.amountPaise)}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">
                    {bill.gateway === "kingpay_wallet" ? "Wallet" : "Razorpay"} · {bill.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
