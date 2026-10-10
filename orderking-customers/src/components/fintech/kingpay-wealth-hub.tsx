import { useState, useMemo } from "react";
import {
  CreditCard,
  Sparkles,
  Zap,
  ShieldCheck,
  Share2,
  Gem,
  ArrowRight,
  TrendingUp,
  Gift,
  Briefcase,
  ChevronRight,
  CheckCircle2,
  MapPin,
  Store,
  Landmark,
  Coins,
  Scale,
  Percent,
  ArrowUpRight,
  Lock,
  Calculator,
  Building2,
  Check,
  Copy,
  ExternalLink,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ==========================================
// LEGAL AFFILIATE TYPE DEFINITIONS & REGISTRY
// ==========================================

export type LegalAffiliateCategory =
  | "all"
  | "digital_gold"
  | "fixed_deposits"
  | "credit_cards"
  | "micro_loans"
  | "investments"
  | "franchise"
  | "merchant_capital";

export interface LegalAffiliateCategoryOption {
  id: LegalAffiliateCategory;
  label: string;
  icon: string;
  badge?: string;
}

export interface DigitalGoldOption {
  id: string;
  partnerName: string;
  purity: string;
  vaultCustodian: string;
  trustee: string;
  liveRatePerGram: number;
  minInvestment: number;
  features: string[];
  affiliateUrl: string;
  regulatoryTag: string;
}

export interface FixedDepositOption {
  id: string;
  institutionName: string;
  institutionType: "Bank" | "NBFC";
  maxInterestRate: number;
  seniorCitizenRate: number;
  ratingOrInsurance: string;
  minDeposit: number;
  minTenureMonths: number;
  maxTenureMonths: number;
  features: string[];
  affiliateUrl: string;
  compoundingFrequency: string;
}

export interface CreditCardOption {
  id: "hdfc" | "sbi";
  name: string;
  tag: string;
  colorTheme: "indigo" | "cyan";
  features: string[];
  buttonText: string;
  affiliateUrl: string;
}

// Immutable base registries for legal affiliate products (non-destructive)
export const LEGAL_AFFILIATE_CATEGORIES: LegalAffiliateCategoryOption[] = [
  { id: "all", label: "All Products", icon: "✨" },
  { id: "digital_gold", label: "Digital Gold", icon: "🪙", badge: "24K 99.9%" },
  { id: "fixed_deposits", label: "Fixed Deposits", icon: "🏛️", badge: "Up to 9.10%" },
  { id: "credit_cards", label: "Credit Cards", icon: "💳", badge: "Pre-Approved" },
  { id: "micro_loans", label: "Micro Loans", icon: "⚡", badge: "0% Interest" },
  { id: "investments", label: "Mutual Funds & Protection", icon: "🛡️" },
  { id: "franchise", label: "Territory Franchise", icon: "📍", badge: "1% Royalty" },
  { id: "merchant_capital", label: "Merchant Capital", icon: "🏪", badge: "14% APY" },
];

export const DIGITAL_GOLD_PRODUCTS: DigitalGoldOption[] = [
  {
    id: "safegold",
    partnerName: "SafeGold (Digital Gold India)",
    purity: "24K 99.9% Pure Gold",
    vaultCustodian: "Brink's India Secure Bullion Vaults",
    trustee: "IDBI Trusteeship Services Ltd",
    liveRatePerGram: 7450,
    minInvestment: 10,
    features: [
      "1:1 physical gold stored in institutional Brink's vaults",
      "Instant buy and sell at live market rates 24x7",
      "Zero making charges on digital accumulation",
      "Home delivery of BIS hallmarked coins and bars",
    ],
    affiliateUrl: "https://www.safegold.com?utm_source=orderking_affiliate",
    regulatoryTag: "BIS Hallmarked & Insured",
  },
  {
    id: "augmont",
    partnerName: "Augmont Gold For All",
    purity: "24K 99.9% Fine Bullion",
    vaultCustodian: "Sequel Logistics High-Security Vaults",
    trustee: "Beacon Trusteeship Ltd",
    liveRatePerGram: 7455,
    minInvestment: 10,
    features: [
      "NABH and BIS certified sovereign bullion refinery",
      "Automated daily, weekly, or monthly Gold SIP",
      "Direct bank withdrawal or doorstep gold delivery",
      "Complete transparency with live spot price integration",
    ],
    affiliateUrl: "https://www.augmont.com?utm_source=orderking_affiliate",
    regulatoryTag: "NABL Certified Refinery",
  },
];

export const FIXED_DEPOSIT_PRODUCTS: FixedDepositOption[] = [
  {
    id: "unity_sfb",
    institutionName: "Unity Small Finance Bank",
    institutionType: "Bank",
    maxInterestRate: 9.0,
    seniorCitizenRate: 9.5,
    ratingOrInsurance: "DICGC Insured up to ₹5,00,000",
    minDeposit: 10000,
    minTenureMonths: 12,
    maxTenureMonths: 60,
    features: [
      "Scheduled Commercial Bank backed by RBI regulation",
      "Deposits insured up to ₹5 Lakhs by DICGC (RBI Subsidiary)",
      "High return tenure: 1001 days @ 9.00% p.a.",
      "100% digital onboarding with Aadhaar e-KYC in 3 minutes",
    ],
    affiliateUrl: "https://unitybank.co.in/fixed-deposits?utm_source=orderking_affiliate",
    compoundingFrequency: "Quarterly Compounded",
  },
  {
    id: "shriram_finance",
    institutionName: "Shriram Finance Fixed Deposit",
    institutionType: "NBFC",
    maxInterestRate: 8.8,
    seniorCitizenRate: 9.3,
    ratingOrInsurance: "CRISIL AAA & ICRA AA+ Rated",
    minDeposit: 5000,
    minTenureMonths: 12,
    maxTenureMonths: 60,
    features: [
      "Highest safety rating with over 45 years of financial track record",
      "Extra 0.50% p.a. for Senior Citizens & 0.10% for Women Depositors",
      "Flexible payout choices: Monthly, Quarterly, or Cumulative",
      "Zero penalty on renewal with nationwide branch support",
    ],
    affiliateUrl: "https://www.shriramfinance.in/fixed-deposit?utm_source=orderking_affiliate",
    compoundingFrequency: "Quarterly Compounded",
  },
  {
    id: "bajaj_finance",
    institutionName: "Bajaj Finance Fixed Deposit",
    institutionType: "NBFC",
    maxInterestRate: 8.6,
    seniorCitizenRate: 8.85,
    ratingOrInsurance: "CRISIL AAA & ICRA AAA Highest Safety",
    minDeposit: 15000,
    minTenureMonths: 12,
    maxTenureMonths: 60,
    features: [
      "Top-tier CRISIL AAA and ICRA AAA ratings indicating lowest credit risk",
      "Digital paperless booking with instant FD receipt generation",
      "Multi-deposit facility with single online payment",
      "Premature liquidation available after statutory 3-month lock-in",
    ],
    affiliateUrl: "https://www.bajajfinserv.in/fixed-deposit?utm_source=orderking_affiliate",
    compoundingFrequency: "Quarterly Compounded",
  },
  {
    id: "suryoday_sfb",
    institutionName: "Suryoday Small Finance Bank",
    institutionType: "Bank",
    maxInterestRate: 8.65,
    seniorCitizenRate: 9.15,
    ratingOrInsurance: "DICGC Insured up to ₹5,00,000",
    minDeposit: 10000,
    minTenureMonths: 12,
    maxTenureMonths: 60,
    features: [
      "RBI Licensed Scheduled Commercial Bank with nationwide branches",
      "Protected under RBI's DICGC insurance scheme",
      "Attractive 2-year and 3-year term deposit yields",
      "Instant paperless verification via Video KYC",
    ],
    affiliateUrl: "https://www.suryodaybank.com/fixed-deposits?utm_source=orderking_affiliate",
    compoundingFrequency: "Quarterly Compounded",
  },
];

export const CREDIT_CARD_PRODUCTS: CreditCardOption[] = [
  {
    id: "hdfc",
    name: "HDFC INFINIA",
    tag: "INVITE ONLY",
    colorTheme: "indigo",
    features: [
      "Unlimited Lounge Access",
      "5% Cashback on OrderKing",
      "Zero Forex Markup",
    ],
    buttonText: "Apply Now",
    affiliateUrl: "https://www.hdfcbank.com/personal/pay/cards/credit-cards?utm_source=orderking_affiliate",
  },
  {
    id: "sbi",
    name: "SBI ELITE",
    tag: "PRE-APPROVED",
    colorTheme: "cyan",
    features: [
      "₹5,000 Welcome Voucher",
      "2.5% Reward Rate",
      "Free Movie Tickets Monthly",
    ],
    buttonText: "Claim Card",
    affiliateUrl: "https://www.sbicard.com/en/personal/credit-cards.page?utm_source=orderking_affiliate",
  },
];

export function KingPayWealthHub() {
  const [activeCard, setActiveCard] = useState<"hdfc" | "sbi" | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<LegalAffiliateCategory>("all");

  // Digital Gold State & Interactive Logic
  const [selectedGoldPartner, setSelectedGoldPartner] = useState<string>("safegold");
  const [goldPurchaseMode, setGoldPurchaseMode] = useState<"buy" | "sip">("buy");
  const [goldAmount, setGoldAmount] = useState<number>(1000);

  // Fixed Deposits State & Interactive Logic
  const [selectedFdId, setSelectedFdId] = useState<string>("unity_sfb");
  const [fdAmount, setFdAmount] = useState<number>(50000);
  const [fdTenureMonths, setFdTenureMonths] = useState<number>(36);
  const [isSeniorCitizen, setIsSeniorCitizen] = useState<boolean>(false);

  // Active Partner Data
  const currentGoldProduct = useMemo(
    () => DIGITAL_GOLD_PRODUCTS.find((p) => p.id === selectedGoldPartner) || DIGITAL_GOLD_PRODUCTS[0],
    [selectedGoldPartner]
  );

  const currentFdProduct = useMemo(
    () => FIXED_DEPOSIT_PRODUCTS.find((f) => f.id === selectedFdId) || FIXED_DEPOSIT_PRODUCTS[0],
    [selectedFdId]
  );

  // Digital Gold Calculated Weight
  const calculatedGoldGrams = useMemo(() => {
    if (!currentGoldProduct.liveRatePerGram || currentGoldProduct.liveRatePerGram <= 0) return 0;
    return Number((goldAmount / currentGoldProduct.liveRatePerGram).toFixed(4));
  }, [goldAmount, currentGoldProduct]);

  // Fixed Deposit Returns Calculator (Quarterly Compounding Formula)
  // Maturity = Principal * (1 + (Rate / 400)) ^ (4 * (TenureMonths / 12))
  const fdCalculation = useMemo(() => {
    const rate = isSeniorCitizen ? currentFdProduct.seniorCitizenRate : currentFdProduct.maxInterestRate;
    const quarters = (fdTenureMonths / 12) * 4;
    const ratePerQuarter = rate / 400;
    const maturityAmount = Math.round(fdAmount * Math.pow(1 + ratePerQuarter, quarters));
    const interestEarned = maturityAmount - fdAmount;
    const effectiveYield = Number((((interestEarned / fdAmount) / (fdTenureMonths / 12)) * 100).toFixed(2));

    return {
      rate,
      maturityAmount,
      interestEarned,
      effectiveYield,
    };
  }, [fdAmount, fdTenureMonths, isSeniorCitizen, currentFdProduct]);

  // Action Handlers
  const handleOpenAffiliate = (url: string, partnerName: string) => {
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    toast.success(`Redirecting to ${partnerName} verified portal`, {
      description: "OrderKing royalty tracking code attached.",
    });
  };

  const handleCopyReferral = () => {
    const referralLink = "https://orderking.com/vip/ref_842X9A";
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(referralLink);
      toast.success("VIP Referral Link Copied!", {
        description: "Share with contacts to earn lifetime royalties.",
      });
    }
  };

  const shouldShowSection = (sectionCategory: LegalAffiliateCategory) => {
    return selectedCategory === "all" || selectedCategory === sectionCategory;
  };

  return (
    <div className="space-y-6 text-fg p-4 md:p-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col items-center justify-center text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <Gem className="size-3.5" /> Premium Financial Services
        </div>
        <h2 className="font-display text-3xl sm:text-4xl font-black text-fg tracking-tight">
          Wealth &amp; <span className="text-amber-500">Privilege</span>
        </h2>
        <p className="text-muted text-sm sm:text-base font-medium max-w-md">
          Unlock exclusive financial products designed for OrderKing royalty. Build wealth, access credit, and earn passive income.
        </p>

        {/* Category Navigation Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4 max-w-2xl">
          {LEGAL_AFFILIATE_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-105"
                    : "bg-surface-2 border border-border text-muted hover:text-fg hover:border-amber-500/40"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                {cat.badge && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[9px] font-extrabold ${
                      isActive ? "bg-black/20 text-black" : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {cat.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. DIGITAL GOLD BULLION & SAVINGS VAULT (ENHANCEMENT)    */}
      {/* ========================================================= */}
      {shouldShowSection("digital_gold") && (
        <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-br from-[#1a1500] via-surface to-amber-950/20 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Coins className="size-56 text-amber-400" />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/30 mb-2">
                  <Coins className="size-3.5" /> 24K 99.9% Sovereign Bullion
                </div>
                <h3 className="text-2xl font-black text-fg flex items-center gap-2">
                  24K Sovereign Digital Gold
                  <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    BIS Hallmarked
                  </span>
                </h3>
                <p className="text-sm text-muted max-w-xl mt-1">
                  Accumulate certified pure 24 Karat gold starting from just ₹10. Stored in institutional Brink's and Sequel high-security vaults, protected by IDBI Trusteeship.
                </p>
              </div>

              {/* Live Gold Rate Banner */}
              <div className="bg-surface-2/90 border border-amber-500/30 rounded-2xl p-4 shrink-0 shadow-lg flex items-center gap-4">
                <div className="size-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <TrendingUp className="size-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted tracking-wider">Live 24K Gold Price</div>
                  <div className="text-xl font-black text-amber-400 font-mono">
                    ₹{currentGoldProduct.liveRatePerGram.toLocaleString("en-IN")}/gm
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Live Institutional Spot Rate
                  </div>
                </div>
              </div>
            </div>

            {/* Partner Selection & Interactive Calculator */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Partner Cards */}
              <div className="lg:col-span-2 space-y-4">
                <div className="text-xs font-bold text-muted uppercase tracking-wider">Select Institutional Custodian</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {DIGITAL_GOLD_PRODUCTS.map((partner) => {
                    const isSelected = selectedGoldPartner === partner.id;
                    return (
                      <div
                        key={partner.id}
                        onClick={() => setSelectedGoldPartner(partner.id)}
                        className={`rounded-2xl border-2 p-5 cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                            : "border-border/60 bg-surface-2 hover:border-amber-500/40"
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-black text-fg text-base">{partner.partnerName}</h4>
                              <span className="text-[10px] font-bold text-amber-400">{partner.purity}</span>
                            </div>
                            <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                              {partner.regulatoryTag}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs text-muted mb-4">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
                              <span className="truncate">{partner.vaultCustodian}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Lock className="size-3.5 text-blue-400 shrink-0" />
                              <span className="truncate">Trustee: {partner.trustee}</span>
                            </div>
                          </div>

                          <ul className="space-y-1.5 mb-5 text-[11px] text-muted">
                            {partner.features.map((feat, idx) => (
                              <li key={idx} className="flex items-center gap-1.5">
                                <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAffiliate(partner.affiliateUrl, partner.partnerName);
                          }}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl shadow-md text-xs py-2"
                        >
                          Visit Official Bullion Vault <ExternalLink className="size-3.5 ml-1.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Instant Purchase & SIP Simulator */}
              <div className="bg-surface rounded-2xl border border-amber-500/30 p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                      <Calculator className="size-3.5" /> Gold Accumulator
                    </span>
                    <div className="flex rounded-lg bg-surface-2 p-0.5 border border-border text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setGoldPurchaseMode("buy")}
                        className={`px-2.5 py-1 rounded-md transition ${
                          goldPurchaseMode === "buy" ? "bg-amber-500 text-black" : "text-muted hover:text-fg"
                        }`}
                      >
                        One-Time
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoldPurchaseMode("sip")}
                        className={`px-2.5 py-1 rounded-md transition ${
                          goldPurchaseMode === "sip" ? "bg-amber-500 text-black" : "text-muted hover:text-fg"
                        }`}
                      >
                        Gold SIP
                      </button>
                    </div>
                  </div>

                  {/* Preset Amount Chips */}
                  <div className="mb-4">
                    <label className="block text-[11px] font-semibold text-muted mb-2">Select Investment Amount (₹)</label>
                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                      {[100, 500, 1000, 2500, 5000, 10000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setGoldAmount(amt)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-bold font-mono transition border ${
                            goldAmount === amt
                              ? "bg-amber-500/20 border-amber-500 text-amber-400"
                              : "bg-surface-2 border-border/60 text-muted hover:border-amber-500/40"
                          }`}
                        >
                          ₹{amt.toLocaleString("en-IN")}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted font-bold text-sm">₹</span>
                      <input
                        type="number"
                        min="10"
                        step="50"
                        value={goldAmount}
                        onChange={(e) => setGoldAmount(Math.max(10, Number(e.target.value) || 0))}
                        className="w-full rounded-xl border border-border bg-bg pl-7 pr-3 py-2 text-sm font-mono font-bold text-fg focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Converted Grams Display */}
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3.5 mb-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted">Estimated 24K Gold</span>
                      <span className="font-mono font-black text-amber-400 text-sm">
                        {calculatedGoldGrams} Grams
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-muted mt-1">
                      <span>Vault Purity Standard</span>
                      <span className="font-semibold text-fg">999.0 Fine Bullion</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-muted mt-0.5">
                      <span>Storage Charges</span>
                      <span className="font-semibold text-emerald-400">₹0 (Free for 5 Years)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Button
                    type="button"
                    onClick={() => handleOpenAffiliate(currentGoldProduct.affiliateUrl, currentGoldProduct.partnerName)}
                    className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black rounded-xl shadow-lg py-5 text-sm"
                  >
                    {goldPurchaseMode === "buy" ? "Instant Buy 24K Gold" : "Start Daily Gold SIP"}
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                  <p className="text-[10px] text-center text-muted mt-2">
                    Physical gold delivered to doorstep on request · 100% paperless
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-[11px] text-muted border-t border-border/40">
              <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-emerald-500" /> BIS Hallmarked 99.9% Pure</span>
              <span className="flex items-center gap-1.5"><Lock className="size-3.5 text-emerald-500" /> 100% Insured in Brink's Vaults</span>
              <span className="flex items-center gap-1.5"><Zap className="size-3.5 text-emerald-500" /> Instant Bank Sellback Liquidity</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. HIGH-YIELD FIXED DEPOSITS SECTION (ENHANCEMENT)        */}
      {/* ========================================================= */}
      {shouldShowSection("fixed_deposits") && (
        <div className="rounded-3xl border border-sky-500/30 bg-gradient-to-br from-surface via-[#0a1628] to-sky-950/20 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Landmark className="size-64 text-sky-400" />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 px-3 py-1 text-xs font-bold text-sky-400 border border-sky-500/30 mb-2">
                  <Landmark className="size-3.5" /> Guaranteed Wealth Growth
                </div>
                <h3 className="text-2xl font-black text-fg flex items-center gap-2">
                  High-Yield Fixed Deposits
                  <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    Up to 9.50% p.a.
                  </span>
                </h3>
                <p className="text-sm text-muted max-w-xl mt-1">
                  Lock in sovereign-level high yields with RBI-regulated Scheduled Commercial Banks and CRISIL AAA-rated corporate deposit issuers.
                </p>
              </div>

              {/* DICGC Protection Badge */}
              <div className="bg-surface-2 border border-sky-500/30 rounded-2xl p-4 shrink-0 shadow-lg flex items-center gap-3">
                <div className="size-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted tracking-wider">Deposit Insurance</div>
                  <div className="text-sm font-black text-sky-400">DICGC Insured ₹5 Lakhs</div>
                  <div className="text-[10px] text-muted">Per Depositor per Bank (RBI Subsidiary)</div>
                </div>
              </div>
            </div>

            {/* FD Comparison & Calculator Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* FD Partner List */}
              <div className="lg:col-span-2 space-y-3">
                <div className="text-xs font-bold text-muted uppercase tracking-wider">Top Regulated Issuers</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {FIXED_DEPOSIT_PRODUCTS.map((fd) => {
                    const isSelected = selectedFdId === fd.id;
                    const effectiveRate = isSeniorCitizen ? fd.seniorCitizenRate : fd.maxInterestRate;

                    return (
                      <div
                        key={fd.id}
                        onClick={() => setSelectedFdId(fd.id)}
                        className={`rounded-2xl border-2 p-4 cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-sky-500 bg-sky-500/10 shadow-[0_0_20px_rgba(14,165,233,0.2)]"
                            : "border-border/60 bg-surface-2 hover:border-sky-500/40"
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-black text-fg text-sm">{fd.institutionName}</h4>
                              <span className="text-[10px] font-bold text-sky-400">{fd.institutionType} Deposit</span>
                            </div>
                            <div className="text-right">
                              <span className="text-base font-black text-emerald-400 font-mono">
                                {effectiveRate}%
                              </span>
                              <div className="text-[9px] text-muted">p.a.</div>
                            </div>
                          </div>

                          <div className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-300 border border-sky-500/20 mb-3">
                            <Award className="size-3" /> {fd.ratingOrInsurance}
                          </div>

                          <ul className="space-y-1 mb-4 text-[11px] text-muted">
                            {fd.features.slice(0, 3).map((feat, idx) => (
                              <li key={idx} className="flex items-center gap-1.5">
                                <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                                <span className="truncate">{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAffiliate(fd.affiliateUrl, fd.institutionName);
                          }}
                          className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md text-xs py-2"
                        >
                          Book FD Directly <ExternalLink className="size-3.5 ml-1.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interactive FD Maturity Calculator */}
              <div className="bg-surface rounded-2xl border border-sky-500/30 p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black uppercase text-sky-400 tracking-wider flex items-center gap-1.5">
                      <Calculator className="size-3.5" /> Maturity Calculator
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSeniorCitizen(!isSeniorCitizen)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-md border transition ${
                        isSeniorCitizen
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                          : "bg-surface-2 border-border text-muted hover:text-fg"
                      }`}
                    >
                      Senior Citizen: {isSeniorCitizen ? "YES (+0.5%)" : "NO"}
                    </button>
                  </div>

                  {/* Principal Presets */}
                  <div className="mb-4">
                    <label className="block text-[11px] font-semibold text-muted mb-2">Deposit Amount (₹)</label>
                    <div className="grid grid-cols-3 gap-1.5 mb-2">
                      {[25000, 50000, 100000, 250000, 500000, 1000000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setFdAmount(amt)}
                          className={`py-1 px-1.5 rounded-lg text-xs font-bold font-mono transition border ${
                            fdAmount === amt
                              ? "bg-sky-500/20 border-sky-500 text-sky-400"
                              : "bg-surface-2 border-border/60 text-muted hover:border-sky-500/40"
                          }`}
                        >
                          ₹{(amt / 1000).toFixed(0)}K
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-2 text-muted font-bold text-sm">₹</span>
                      <input
                        type="number"
                        min="5000"
                        step="5000"
                        value={fdAmount}
                        onChange={(e) => setFdAmount(Math.max(5000, Number(e.target.value) || 0))}
                        className="w-full rounded-xl border border-border bg-bg pl-7 pr-3 py-1.5 text-sm font-mono font-bold text-fg focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Tenure Selector */}
                  <div className="mb-4">
                    <label className="block text-[11px] font-semibold text-muted mb-1.5">Tenure</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[12, 24, 36, 60].map((months) => (
                        <button
                          key={months}
                          type="button"
                          onClick={() => setFdTenureMonths(months)}
                          className={`py-1.5 rounded-lg text-xs font-bold transition border ${
                            fdTenureMonths === months
                              ? "bg-sky-500 text-white border-sky-500"
                              : "bg-surface-2 border-border/60 text-muted hover:border-sky-500/40"
                          }`}
                        >
                          {months} Mo
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Return Summary */}
                  <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 p-3.5 mb-4 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted">Interest Rate Applied</span>
                      <span className="font-mono font-bold text-emerald-400">{fdCalculation.rate}% p.a.</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted">Total Interest Earned</span>
                      <span className="font-mono font-bold text-sky-400">
                        +₹{fdCalculation.interestEarned.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-1.5 border-t border-sky-500/20">
                      <span className="font-bold text-fg">Maturity Payout</span>
                      <span className="font-mono font-black text-emerald-400 text-base">
                        ₹{fdCalculation.maturityAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <Button
                    type="button"
                    onClick={() => handleOpenAffiliate(currentFdProduct.affiliateUrl, currentFdProduct.institutionName)}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-black rounded-xl shadow-lg py-5 text-sm"
                  >
                    Open Fixed Deposit with {currentFdProduct.institutionName.split(" ")[0]}
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                  <p className="text-[10px] text-center text-muted mt-2">
                    Quarterly compound interest · Zero market fluctuation risk
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-[11px] text-muted border-t border-border/40">
              <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-emerald-500" /> DICGC Insured up to ₹5,00,000</span>
              <span className="flex items-center gap-1.5"><Building2 className="size-3.5 text-sky-400" /> Scheduled Commercial Bank &amp; AAA NBFCs</span>
              <span className="flex items-center gap-1.5"><Percent className="size-3.5 text-amber-400" /> Extra Senior Citizen Bonus (+0.50%)</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. PREMIUM CREDIT CARDS SECTION (PRESERVED & ENHANCED)    */}
      {/* ========================================================= */}
      {shouldShowSection("credit_cards") && (
        <div className="rounded-3xl border border-border bg-gradient-to-br from-surface to-slate-900 overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 right-0 p-34 opacity-5 pointer-events-none">
            <CreditCard className="size-64" />
          </div>
          <div className="p-6 sm:p-8 relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="size-5 text-amber-400" />
              <h3 className="text-xl font-black text-fg">Premium Credit Cards</h3>
            </div>
            <p className="text-sm text-muted mb-6">Pre-approved limits up to ₹10 Lakhs. Lifetime free for top KingPay users.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* HDFC Card */}
              <div 
                className={`rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${activeCard === "hdfc" ? "border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-amber-500/5" : "border-border/50 bg-surface-2 hover:border-amber-500/50"}`}
                onClick={() => setActiveCard("hdfc")}
              >
                <div className="p-5 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-lg font-black text-indigo-400 tracking-wider">HDFC INFINIA</span>
                      <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">INVITE ONLY</span>
                    </div>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-emerald-500" /> Unlimited Lounge Access</li>
                      <li className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-emerald-500" /> 5% Cashback on OrderKing</li>
                      <li className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-emerald-500" /> Zero Forex Markup</li>
                    </ul>
                  </div>
                  <Button 
                    onClick={() => handleOpenAffiliate("https://www.hdfcbank.com/personal/pay/cards/credit-cards?utm_source=orderking_affiliate", "HDFC Bank Infinia")}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md font-bold"
                  >
                    Apply Now <ArrowRight className="size-4 ml-2" />
                  </Button>
                </div>
              </div>

              {/* SBI Card */}
              <div 
                className={`rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${activeCard === "sbi" ? "border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-amber-500/5" : "border-border/50 bg-surface-2 hover:border-amber-500/50"}`}
                onClick={() => setActiveCard("sbi")}
              >
                <div className="p-5 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-lg font-black text-cyan-400 tracking-wider">SBI ELITE</span>
                      <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">PRE-APPROVED</span>
                    </div>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-emerald-500" /> ₹5,000 Welcome Voucher</li>
                      <li className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-emerald-500" /> 2.5% Reward Rate</li>
                      <li className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-emerald-500" /> Free Movie Tickets Monthly</li>
                    </ul>
                  </div>
                  <Button 
                    onClick={() => handleOpenAffiliate("https://www.sbicard.com/en/personal/credit-cards.page?utm_source=orderking_affiliate", "SBI Card Elite")}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-md font-bold"
                  >
                    Claim Card <ArrowRight className="size-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-muted uppercase tracking-wider font-semibold">
              <ShieldCheck className="size-3.5 text-emerald-500" /> Bank-grade security. 100% paperless process.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. ZERO-INTEREST MICRO LOANS (PRESERVED & ENHANCED)       */}
      {/* ========================================================= */}
      {shouldShowSection("micro_loans") && (
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-500">
              <Zap className="size-3.5" /> Instant Liquidity
            </div>
            <h3 className="text-2xl font-black text-emerald-400">Zero-Interest Micro Loans</h3>
            <p className="text-sm text-muted">
              Need cash fast? Get up to ₹50,000 instantly credited to your KingPay wallet. Repay in 30 days with <strong className="text-fg">0% interest</strong> and zero hidden fees.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600/80">
                <CheckCircle2 className="size-3.5" /> No Credit Check
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600/80">
                <CheckCircle2 className="size-3.5" /> 60-Second Disbursal
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600/80">
                <CheckCircle2 className="size-3.5" /> RBI Compliant
              </span>
            </div>
          </div>
          <div className="w-full md:w-auto shrink-0">
            <div className="bg-surface rounded-2xl p-5 border border-emerald-500/20 text-center shadow-lg">
              <h4 className="text-xs font-bold text-muted mb-1">Available Limit</h4>
              <div className="text-3xl font-black text-fg mb-4">₹50,000</div>
              <Button 
                onClick={() => {
                  toast.success("KingPay Micro Loan Eligibility Verified!", {
                    description: "Your pre-approved ₹50,000 credit line is ready for disbursal.",
                  });
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-fg font-bold rounded-xl shadow-[0_0_15px_rgba(5,150,105,0.4)] transition-all hover:scale-105 active:scale-95"
              >
                Withdraw Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. REFERRAL WEALTH NETWORK (PRESERVED & ENHANCED)         */}
      {/* ========================================================= */}
      {shouldShowSection("all") && (
        <div className="rounded-3xl border border-primary/30 bg-gradient-to-b from-primary/10 to-transparent p-6 sm:p-8 shadow-lg">
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="size-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
              <TrendingUp className="size-8 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-fg mb-2">Referral Wealth Network</h3>
              <p className="text-sm text-muted max-w-md mx-auto">
                Transform your network into net worth. Invite friends to OrderKing and earn lifetime royalties on every transaction they make.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-surface-2/50 border border-border/50 rounded-2xl p-5 text-center">
              <Share2 className="size-6 text-primary mx-auto mb-3" />
              <h4 className="text-sm font-bold text-fg mb-1">1. Invite Friends</h4>
              <p className="text-[10px] text-muted">Share your unique VIP link with your contacts.</p>
            </div>
            <div className="bg-surface-2/50 border border-border/50 rounded-2xl p-5 text-center">
              <Gift className="size-6 text-primary mx-auto mb-3" />
              <h4 className="text-sm font-bold text-fg mb-1">2. Instant Bonus</h4>
              <p className="text-[10px] text-muted">Get ₹500 instantly when they make their first order.</p>
            </div>
            <div className="bg-surface-2/50 border border-border/50 rounded-2xl p-5 text-center">
              <Briefcase className="size-6 text-primary mx-auto mb-3" />
              <h4 className="text-sm font-bold text-fg mb-1">3. Lifetime Royalties</h4>
              <p className="text-[10px] text-muted">Earn 1% cashback on every future purchase they make.</p>
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-primary/20 p-2 pl-4 flex items-center justify-between">
            <div className="text-xs font-mono font-bold text-muted truncate">
              https://orderking.com/vip/ref_842X9A
            </div>
            <Button 
              onClick={handleCopyReferral}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl ml-2 shadow-md"
            >
              Copy Link
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. INSTITUTIONAL INVESTMENTS & TERM INSURANCE (PRESERVED) */}
      {/* ========================================================= */}
      {shouldShowSection("investments") && (
        <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="size-5 text-blue-400" />
            <h3 className="text-xl font-black text-fg">Institutional Investment &amp; Protection</h3>
          </div>
          <p className="text-sm text-muted mb-6">
            Access curated mutual funds and premium term insurance. Build a secure portfolio seamlessly through KingPay.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mutual Funds */}
            <div className="rounded-2xl border border-blue-500/20 bg-surface-2 p-5 flex flex-col justify-between hover:border-blue-500/50 transition-all">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-lg font-black text-blue-400 tracking-wider">MUTUAL FUNDS</span>
                  <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">HIGH YIELD</span>
                </div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-blue-500" /> Top Performing Index Funds</li>
                  <li className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-blue-500" /> Automated SIPs via KingPay</li>
                  <li className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-blue-500" /> Zero Commission Direct Plans</li>
                </ul>
              </div>
              <Button 
                onClick={() => handleOpenAffiliate("https://groww.in/mutual-funds?utm_source=orderking_affiliate", "Direct Mutual Funds")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md font-bold"
              >
                Explore Funds <ChevronRight className="size-4 ml-2" />
              </Button>
            </div>

            {/* Term Insurance */}
            <div className="rounded-2xl border border-sky-500/20 bg-surface-2 p-5 flex flex-col justify-between hover:border-sky-500/50 transition-all">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-lg font-black text-sky-400 tracking-wider">TERM INSURANCE</span>
                  <span className="text-[10px] font-bold bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full">PROTECTION</span>
                </div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-sky-500" /> Coverage up to ₹5 Crores</li>
                  <li className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-sky-500" /> Tax Benefits under 80C</li>
                  <li className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-sky-500" /> Top-Tier Industry Providers</li>
                </ul>
              </div>
              <Button 
                onClick={() => handleOpenAffiliate("https://www.policybazaar.com/term-insurance/?utm_source=orderking_affiliate", "Term Life Insurance")}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md font-bold"
              >
                Get Quote <ChevronRight className="size-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. DIGITAL TERRITORY FRANCHISE (PRESERVED & ENHANCED)     */}
      {/* ========================================================= */}
      {shouldShowSection("franchise") && (
        <div className="rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-transparent p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-500">
                <MapPin className="size-3.5" /> Geographical Strategy
              </div>
              <h3 className="text-2xl font-black text-violet-400">Digital Territory Franchise</h3>
              <p className="text-sm text-muted">
                Claim a localized PIN Code and earn <strong className="text-fg">1% royalty</strong> on every OrderKing transaction within that zone. Become a digital landlord in the KingPay ecosystem.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-violet-500/80">
                  <CheckCircle2 className="size-3.5" /> High-Yield Passive Income
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-violet-500/80">
                  <CheckCircle2 className="size-3.5" /> Exclusive Ownership
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-violet-500/80">
                  <CheckCircle2 className="size-3.5" /> Mutual Area Growth
                </span>
              </div>
            </div>
            <div className="w-full md:w-auto shrink-0">
              <div className="bg-surface rounded-2xl p-5 border border-violet-500/20 text-center shadow-lg">
                <h4 className="text-xs font-bold text-muted mb-1">Franchise Fee Starts At</h4>
                <div className="text-3xl font-black text-fg mb-4">₹25,000</div>
                <Button 
                  onClick={() => {
                    toast.success("PIN Code Reservation Portal", {
                      description: "Enter your 6-digit postal code to check digital territory availability.",
                    });
                  }}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all hover:scale-105 active:scale-95"
                >
                  Claim PIN Code
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. MERCHANT CAPITAL FUND (PRESERVED & ENHANCED)           */}
      {/* ========================================================= */}
      {shouldShowSection("merchant_capital") && (
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-tr from-amber-500/5 to-transparent p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <Store className="size-5 text-amber-500" />
            <h3 className="text-xl font-black text-fg">Merchant Capital Fund</h3>
          </div>
          <p className="text-sm text-muted mb-6">
            Invest directly in verified local restaurants and kitchens. Earn stable yields while helping local businesses expand their operations.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-amber-500/20 bg-surface-2 p-5 flex flex-col justify-between hover:border-amber-500/50 transition-all">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-lg font-black text-amber-500 tracking-wider">KITCHEN UPGRADE</span>
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full">12% APY</span>
                </div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-amber-500" /> Equipment Financing</li>
                  <li className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-amber-500" /> 6-Month Lock-in</li>
                  <li className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-amber-500" /> Daily Payouts</li>
                </ul>
              </div>
              <Button 
                onClick={() => {
                  toast.success("Merchant Capital Allocation Initialized", {
                    description: "Select an active restaurant kitchen ledger to participate.",
                  });
                }}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md font-bold"
              >
                Invest Now
              </Button>
            </div>

            <div className="rounded-2xl border border-orange-500/20 bg-surface-2 p-5 flex flex-col justify-between hover:border-orange-500/50 transition-all">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-lg font-black text-orange-500 tracking-wider">EXPANSION FUND</span>
                  <span className="text-[10px] font-bold bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded-full">14% APY</span>
                </div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-orange-500" /> New Branch Capital</li>
                  <li className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-orange-500" /> 12-Month Lock-in</li>
                  <li className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-orange-500" /> KingPay Guaranteed</li>
                </ul>
              </div>
              <Button 
                onClick={() => {
                  toast.success("Merchant Expansion Fund Initialized", {
                    description: "High-yield commercial culinary allocation enabled.",
                  });
                }}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-md font-bold"
              >
                Invest Now
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
