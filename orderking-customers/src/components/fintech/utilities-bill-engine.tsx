import { useState, useMemo } from "react";
import {
  Lightbulb,
  Smartphone,
  Tv,
  Car,
  Flame,
  Droplets,
  Search,
  X,
  CheckCircle2,
  Copy,
  ExternalLink,
  CreditCard,
  QrCode,
  Zap,
  ArrowRight,
  ShieldCheck,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buildNPCIUpiIntentUrl, generateAppDeepLink } from "@/lib/payments/npci-upi-intent";

export type UtilityCategory =
  | "electricity"
  | "mobile"
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
    label: "Mobile Prepaid & Postpaid",
    sublabel: "Jio, Airtel, Vi, BSNL",
    icon: Smartphone,
  },
  {
    id: "dth",
    label: "DTH & Cable",
    sublabel: "Tata Play, Airtel, Sun Direct",
    icon: Tv,
  },
  {
    id: "fastag",
    label: "FASTag",
    sublabel: "NETC All Banks",
    icon: Car,
  },
  {
    id: "lpg",
    label: "LPG Cylinder",
    sublabel: "Indane, Bharat, HP Gas",
    icon: Flame,
  },
  {
    id: "water",
    label: "Water & Municipal",
    sublabel: "Municipal Boards",
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
    name: "Jio - Reliance Jio Infocomm (Prepaid & Postpaid)",
    category: "mobile",
    state: "All India",
    code: "JIO",
    accountLabel: "10-Digit Mobile Number",
    accountPlaceholder: "e.g. 9864012345",
    defaultAmount: 299,
  },
  {
    id: "airtel-telecom",
    name: "Airtel - Bharti Airtel (Prepaid & Postpaid)",
    category: "mobile",
    state: "All India",
    code: "AIRTEL",
    accountLabel: "10-Digit Mobile Number",
    accountPlaceholder: "e.g. 9810012345",
    defaultAmount: 349,
  },
  {
    id: "vi-telecom",
    name: "Vi - Vodafone Idea (Prepaid & Postpaid)",
    category: "mobile",
    state: "All India",
    code: "VI",
    accountLabel: "10-Digit Mobile Number",
    accountPlaceholder: "e.g. 9820012345",
    defaultAmount: 299,
  },
  {
    id: "bsnl-telecom",
    name: "BSNL - Bharat Sanchar Nigam Ltd (Prepaid & Postpaid)",
    category: "mobile",
    state: "All India",
    code: "BSNL",
    accountLabel: "10-Digit Mobile Number",
    accountPlaceholder: "e.g. 9435012345",
    defaultAmount: 199,
  },

  // DTH & Cable (Tata Play, Airtel, Sun Direct)
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

  // FASTag (NETC All Banks)
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

  // LPG Cylinder (Indane, Bharat, HP Gas)
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

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];

export function UtilitiesBillEngine() {
  const [selectedCategory, setSelectedCategory] = useState<UtilityCategory>("electricity");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBiller, setSelectedBiller] = useState<UtilityBiller>(ALL_UTILITY_BILLERS[0]);
  const [accountNumber, setAccountNumber] = useState("");
  const [amountRupees, setAmountRupees] = useState<number>(ALL_UTILITY_BILLERS[0].defaultAmount);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "razorpay">("upi");
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [activeTxnRef, setActiveTxnRef] = useState("");

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

  const handleSelectCategory = (cat: UtilityCategory) => {
    setSelectedCategory(cat);
    setSearchQuery("");
    const firstBiller = ALL_UTILITY_BILLERS.find((b) => b.category === cat);
    if (firstBiller) {
      setSelectedBiller(firstBiller);
      setAmountRupees(firstBiller.defaultAmount);
      setAccountNumber("");
    }
  };

  const handleSelectBiller = (biller: UtilityBiller) => {
    setSelectedBiller(biller);
    setSelectedCategory(biller.category);
    setAmountRupees(biller.defaultAmount);
  };

  const cleanAmount = Math.max(1, Number(amountRupees) || 0);

  // Generate UPI Intent URL
  const txnRef = `UTIL-${selectedBiller.code}-${Date.now().toString().slice(-6)}`;
  const upiIntentUri = useMemo(() => {
    return buildNPCIUpiIntentUrl({
      vpa: "orderking@okhdfcbank",
      payeeName: "OrderKing Utilities",
      amountInRupees: cleanAmount,
      currency: "INR",
      transactionRef: txnRef,
      transactionNote: `${selectedBiller.code} ${accountNumber.trim() || "Utility Bill"}`.slice(0, 45),
      merchantCategoryCode: "4900", // Utilities
      mode: "02",
    });
  }, [cleanAmount, selectedBiller.code, accountNumber, txnRef]);

  const qrImageUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
      upiIntentUri
    )}&bgcolor=FFFFFF&color=05070B`;
  }, [upiIntentUri]);

  const handleProceedToPay = () => {
    if (!accountNumber.trim()) {
      toast.error(`Please enter your ${selectedBiller.accountLabel}`);
      return;
    }
    if (cleanAmount < 1) {
      toast.error("Please enter a valid bill amount");
      return;
    }

    const currentTxn = `UTIL-${selectedBiller.code}-${Date.now().toString().slice(-6)}`;
    setActiveTxnRef(currentTxn);

    if (paymentMethod === "upi") {
      // Open UPI checkout modal and attempt direct deep link
      setIsCheckoutModalOpen(true);
      if (typeof window !== "undefined" && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
        window.location.href = upiIntentUri;
      }
    } else {
      // Razorpay checkout routing
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        try {
          const rzp = new (window as any).Razorpay({
            key: "rzp_test_OrderKingFintech",
            amount: cleanAmount * 100,
            currency: "INR",
            name: "OrderKing Utilities",
            description: `${selectedBiller.name} - ${accountNumber.trim()}`,
            handler: function () {
              toast.success(`Payment verified for ${selectedBiller.name}!`);
            },
            prefill: {
              contact: "9864012345",
            },
            theme: {
              color: "#F59E0B",
            },
          });
          rzp.open();
          return;
        } catch {
          // Fallback to interactive modal
        }
      }
      setIsCheckoutModalOpen(true);
    }
  };

  const handleCopyUpi = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(upiIntentUri);
      toast.success("UPI payment intent copied to clipboard");
    }
  };

  const handleShareWhatsApp = () => {
    if (typeof window !== "undefined") {
      const text = `Utility bill payment for ${selectedBiller.name} (${accountNumber}):\nAmount: ₹${cleanAmount}\nUPI Payment Link:\n${upiIntentUri}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  return (
    <div className="space-y-5">
      {/* ─── Strictly Named Section Header: Utilities ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Zap className="size-5 text-amber-400" /> Utilities
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Electricity, mobile, DTH, FASTag, gas, and water bill payments
          </p>
        </div>

        {/* Live Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search biller (e.g. APDCL, Assam, Jio)..."
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

      {/* ─── 6 Category Grid ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {UTILITY_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id && !searchQuery;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelectCategory(cat.id)}
              className={cn(
                "flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group",
                isSelected
                  ? "border-amber-400 bg-gradient-to-b from-amber-950/40 via-slate-900 to-[#10141E] ring-1 ring-amber-400/50 shadow-[0_4px_20px_rgba(245,158,11,0.15)]"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
              )}
            >
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl mb-2.5 transition-transform group-hover:scale-105",
                  isSelected
                    ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                    : "bg-slate-800 text-slate-300 border border-slate-700/60"
                )}
              >
                <Icon className="size-4" />
              </div>
              <span className="text-xs font-bold text-white leading-tight">
                {cat.label}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                {cat.sublabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── Biller Selector (Filtered list) ─── */}
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
                <div className="text-[11px] font-medium text-slate-200 truncate">
                  {b.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Consumer Account & Amount Form ─── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Account Details */}
          <div className="space-y-3.5">
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
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(Math.max(1, Number(e.target.value) || 0))}
                  className="flex-1 h-11 px-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-sm font-bold focus:border-amber-400 outline-none"
                />
              </div>

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

          {/* Payment Method & Checkout Action */}
          <div className="flex flex-col justify-between space-y-4 rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                Payment Channel
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("upi")}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition cursor-pointer",
                    paymentMethod === "upi"
                      ? "border-amber-400 bg-amber-400/10 text-white"
                      : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                  )}
                >
                  <Zap className="size-4 text-amber-400" />
                  <span>UPI Instant</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("razorpay")}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition cursor-pointer",
                    paymentMethod === "razorpay"
                      ? "border-amber-400 bg-amber-400/10 text-white"
                      : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                  )}
                >
                  <CreditCard className="size-4 text-amber-400" />
                  <span>Razorpay</span>
                </button>
              </div>

              {/* Selected Biller Summary Card */}
              <div className="mt-3.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Biller</span>
                  <span className="font-bold text-white">{selectedBiller.name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Account</span>
                  <span className="font-mono text-amber-300">
                    {accountNumber.trim() || "Not entered"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                  <span>Payable</span>
                  <span className="font-mono font-bold text-white text-sm">
                    ₹{cleanAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceedToPay}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-105 active:scale-[0.98] text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              <span>
                Pay ₹{cleanAmount} via {paymentMethod === "upi" ? "UPI" : "Razorpay"}
              </span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Clean Checkout Modal (UPI / Razorpay Routing) ─── */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-5 sm:p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/30">
                  {paymentMethod === "upi" ? "UPI Instant Payment" : "Razorpay Gateway"}
                </span>
                <h3 className="text-base font-black text-white mt-1.5">{selectedBiller.name}</h3>
                <p className="text-xs text-slate-400">
                  Account: {accountNumber} · Amount: ₹{cleanAmount.toFixed(2)}
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

            {paymentMethod === "upi" ? (
              <div className="space-y-4">
                {/* QR Code Presentation */}
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-slate-800 text-center">
                  <div className="bg-white p-3 rounded-2xl shadow-lg">
                    <img
                      src={qrImageUrl}
                      alt={`UPI Payment for ${selectedBiller.name}`}
                      className="size-44 sm:size-48 object-contain"
                    />
                  </div>
                  <span className="text-xs font-mono text-amber-300 font-bold mt-2.5">
                    Scan with Google Pay, PhonePe, Paytm, or BHIM
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    Reference: {activeTxnRef || txnRef}
                  </span>
                </div>

                {/* Direct App Deep Links */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <a
                    href={generateAppDeepLink("gpay", {
                      vpa: "orderking@okhdfcbank",
                      payeeName: "OrderKing Utilities",
                      amountInRupees: cleanAmount,
                      transactionRef: activeTxnRef || txnRef,
                    })}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold transition no-underline"
                  >
                    Google Pay
                  </a>
                  <a
                    href={generateAppDeepLink("phonepe", {
                      vpa: "orderking@okhdfcbank",
                      payeeName: "OrderKing Utilities",
                      amountInRupees: cleanAmount,
                      transactionRef: activeTxnRef || txnRef,
                    })}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold transition no-underline"
                  >
                    PhonePe
                  </a>
                  <a
                    href={generateAppDeepLink("paytm", {
                      vpa: "orderking@okhdfcbank",
                      payeeName: "OrderKing Utilities",
                      amountInRupees: cleanAmount,
                      transactionRef: activeTxnRef || txnRef,
                    })}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold transition no-underline"
                  >
                    Paytm
                  </a>
                  <a
                    href={generateAppDeepLink("bhim", {
                      vpa: "orderking@okhdfcbank",
                      payeeName: "OrderKing Utilities",
                      amountInRupees: cleanAmount,
                      transactionRef: activeTxnRef || txnRef,
                    })}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold transition no-underline"
                  >
                    BHIM
                  </a>
                </div>

                {/* Action Buttons */}
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
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
                  <CreditCard className="size-8 text-amber-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Razorpay Secure Checkout</h4>
                  <p className="text-xs text-slate-400">
                    Routing settlement for {selectedBiller.name} (₹{cleanAmount.toFixed(2)})
                  </p>
                  <div className="text-[11px] font-mono text-slate-500 pt-1">
                    Gateway Reference: {activeTxnRef || txnRef}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    toast.success(
                      `Receipt generated for ${selectedBiller.name}: ₹${cleanAmount} (Ref: ${activeTxnRef || txnRef})`
                    );
                    setIsCheckoutModalOpen(false);
                  }}
                  className="w-full h-11 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Confirm &amp; Record Receipt
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
