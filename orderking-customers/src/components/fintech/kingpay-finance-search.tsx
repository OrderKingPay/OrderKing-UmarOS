import { useState, useMemo } from "react";
import { Search, X, Mic, Zap, CreditCard, Gift, ShieldCheck, ArrowRight, Sparkles, RefreshCw, Smartphone, Landmark, QrCode } from "lucide-react";
import { toast } from "sonner";

export interface FinanceSearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: "upi" | "bills" | "autopay" | "rewards" | "loans" | "wealth";
  icon: string;
  badge?: string;
  actionType: "scanner" | "add_money" | "self_transfer" | "gold" | "scratch" | "pay_later" | "url" | "toast";
  actionPayload?: string;
}

const FINANCE_SEARCH_INDEX: FinanceSearchItem[] = [
  // UPI & Transfers
  {
    id: "scan_qr",
    title: "Scan Any QR Code",
    subtitle: "Pay any merchant or person via UPI (0% PG fee)",
    category: "upi",
    icon: "📷",
    badge: "0% Fee",
    actionType: "scanner",
  },
  {
    id: "send_upi",
    title: "Send to UPI ID / Mobile Number",
    subtitle: "Instant bank-to-bank transfer across all banks",
    category: "upi",
    icon: "⚡",
    badge: "Instant",
    actionType: "toast",
    actionPayload: "Enter recipient's UPI ID or mobile in the Transfer section below.",
  },
  {
    id: "self_transfer",
    title: "Self Account Transfer",
    subtitle: "Transfer between your own linked bank accounts",
    category: "upi",
    icon: "🔄",
    badge: "0% Fee",
    actionType: "self_transfer",
  },
  {
    id: "add_money",
    title: "Add Money to KingPay Wallet",
    subtitle: "Top-up balance instantly with zero convenience charges",
    category: "upi",
    icon: "💳",
    badge: "Zero Fee",
    actionType: "add_money",
  },
  {
    id: "check_balance",
    title: "Check Bank Balance",
    subtitle: "Instant balance inquiry for all linked bank accounts",
    category: "upi",
    icon: "🏦",
    badge: "UPI PIN",
    actionType: "toast",
    actionPayload: "Select your linked account below to view live balance.",
  },

  // Bills & Recharges
  {
    id: "electricity_bill",
    title: "Electricity Bill (APDCL & All States)",
    subtitle: "Pay power bills instantly with BBPS assurance & cashback",
    category: "bills",
    icon: "💡",
    badge: "BBPS",
    actionType: "url",
    actionPayload: "https://www.apdcl.org?utm_source=orderking_affiliate",
  },
  {
    id: "mobile_recharge",
    title: "Mobile Prepaid & Postpaid Recharge",
    subtitle: "Jio, Airtel, Vi, BSNL instant recharges with bonus coins",
    category: "bills",
    icon: "📱",
    badge: "Instant 4G/5G",
    actionType: "url",
    actionPayload: "https://www.jio.com/selfcare/recharge/mobility/?utm_source=orderking_affiliate",
  },
  {
    id: "fastag_recharge",
    title: "FASTag Toll Recharge",
    subtitle: "NHAI & all bank FASTags with 1% highway fuel cashback",
    category: "bills",
    icon: "🚗",
    badge: "1% Cashback",
    actionType: "url",
    actionPayload: "https://paytm.com/fastag-recharge?utm_source=orderking_affiliate",
  },
  {
    id: "dth_recharge",
    title: "DTH Recharge (Tata Play, Airtel, Dish)",
    subtitle: "Instant television pack renewal with zero charges",
    category: "bills",
    icon: "📺",
    badge: "BBPS",
    actionType: "toast",
    actionPayload: "DTH instant recharge ready. Select your operator in Bills & Recharges.",
  },
  {
    id: "gas_cylinder",
    title: "LPG Gas Cylinder Booking",
    subtitle: "Indane, Bharat Gas, HP Gas refill booking & payment",
    category: "bills",
    icon: "🔥",
    badge: "Govt Subsidized",
    actionType: "toast",
    actionPayload: "LPG Gas cylinder portal ready with instant booking ID.",
  },
  {
    id: "water_bill",
    title: "Water Bill & Municipal Taxes",
    subtitle: "Municipal corporation water tax payment with instant receipt",
    category: "bills",
    icon: "💧",
    badge: "BBPS",
    actionType: "toast",
    actionPayload: "Municipal water tax gateway active with instant receipt.",
  },
  {
    id: "broadband_bill",
    title: "Broadband & Fiber Landline",
    subtitle: "JioFiber, Airtel Xstream, BSNL Fiber bill payments",
    category: "bills",
    icon: "🌐",
    badge: "Fast Pay",
    actionType: "toast",
    actionPayload: "Broadband biller ready with zero platform fees.",
  },

  // Autopay & Mandates
  {
    id: "autopay_setup",
    title: "UPI Autopay & Mandate Manager",
    subtitle: "Set up auto-debit for electricity, SIP, OTT & credit cards",
    category: "autopay",
    icon: "🔄",
    badge: "Auto 0% Fee",
    actionType: "toast",
    actionPayload: "UPI Autopay active: Zero bounce fees and 100% on-time guarantee.",
  },
  {
    id: "active_mandates",
    title: "View & Cancel Active Mandates",
    subtitle: "Pause, modify or revoke recurring payments anytime with 1-tap",
    category: "autopay",
    icon: "🛡️",
    badge: "Full Control",
    actionType: "toast",
    actionPayload: "You have 0 pending mandate deductions today. Full control active.",
  },

  // Rewards & Cashback
  {
    id: "king_coins",
    title: "King Coins & Wallet Balance",
    subtitle: "1 King Coin = ₹1 cash value on food and recharges",
    category: "rewards",
    icon: "👑",
    badge: "1 Coin = ₹1",
    actionType: "scratch",
  },
  {
    id: "scratch_cards",
    title: "Daily Scratch Cards & Mystery Box",
    subtitle: "Scratch to win real cash, gold grams & food vouchers",
    category: "rewards",
    icon: "🎁",
    badge: "Win ₹100+",
    actionType: "scratch",
  },
  {
    id: "referral_cash",
    title: "Refer & Earn ₹40 Cash",
    subtitle: "Earn ₹40 straight into your wallet for every friend who joins",
    category: "rewards",
    icon: "🤝",
    badge: "₹40 Per Friend",
    actionType: "toast",
    actionPayload: "Referral link copied! Share via WhatsApp to claim ₹40 cash.",
  },

  // Loans & Credit
  {
    id: "personal_loan",
    title: "Instant Cash Loan (Up to ₹5,00,000)",
    subtitle: "Navi Finserv RBI-registered 2-minute bank disbursal",
    category: "loans",
    icon: "💰",
    badge: "RBI NBFC",
    actionType: "url",
    actionPayload: "https://navi.com/cash-loans?utm_source=orderking_affiliate",
  },
  {
    id: "pay_later",
    title: "KingPay Later (₹2,500 Instant Limit)",
    subtitle: "0% interest for 30 days on food, grocery & recharges",
    category: "loans",
    icon: "⚡",
    badge: "0% Interest",
    actionType: "pay_later",
  },
  {
    id: "credit_score",
    title: "Free Experian / CIBIL Credit Score",
    subtitle: "Check your detailed credit report with zero impact on score",
    category: "loans",
    icon: "📊",
    badge: "100% Free",
    actionType: "toast",
    actionPayload: "Free credit score audit initiated. Score: 785 (Excellent).",
  },

  // Wealth & Investments
  {
    id: "digital_gold",
    title: "24K 99.9% Pure Sovereign Digital Gold",
    subtitle: "Buy, sell or store certified gold starting from just ₹10",
    category: "wealth",
    icon: "🌟",
    badge: "24K Gold",
    actionType: "gold",
  },
  {
    id: "train_tickets",
    title: "Train Tickets (IRCTC Authorized)",
    subtitle: "Zero payment gateway fee on ConfirmTkt & IRCTC bookings",
    category: "wealth",
    icon: "🚆",
    badge: "Zero PG Fee",
    actionType: "url",
    actionPayload: "https://confirmtkt.com?utm_source=orderking_affiliate",
  },
  {
    id: "flight_tickets",
    title: "Flight & Hotel Bookings",
    subtitle: "Domestic flights with up to ₹500 instant cashback",
    category: "wealth",
    icon: "✈️",
    badge: "Up to ₹500 OFF",
    actionType: "url",
    actionPayload: "https://www.makemytrip.com/flights?utm_source=orderking_affiliate",
  },
];

interface KingPayFinanceSearchProps {
  onOpenScanner: () => void;
  onOpenAddMoney: () => void;
  onOpenSelfTransfer: () => void;
  onOpenGoldModal: () => void;
  onOpenScratchCard: () => void;
  onTogglePayLater: () => void;
  className?: string;
}

export function KingPayFinanceSearch({
  onOpenScanner,
  onOpenAddMoney,
  onOpenSelfTransfer,
  onOpenGoldModal,
  onOpenScratchCard,
  onTogglePayLater,
  className = "",
}: KingPayFinanceSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isFocused, setIsFocused] = useState(false);

  const categories = [
    { id: "all", label: "All Items", icon: "✨" },
    { id: "upi", label: "UPI & Transfer", icon: "⚡" },
    { id: "bills", label: "Bills & Recharge", icon: "💡" },
    { id: "autopay", label: "Autopay", icon: "🔄" },
    { id: "rewards", label: "Rewards & Cash", icon: "🎁" },
    { id: "loans", label: "Loans & Credit", icon: "💰" },
    { id: "wealth", label: "Gold & Travel", icon: "🌟" },
  ];

  const filteredItems = useMemo(() => {
    return FINANCE_SEARCH_INDEX.filter((item) => {
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const q = query.toLowerCase().trim();
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.badge && item.badge.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [query, selectedCategory]);

  const handleAction = (item: FinanceSearchItem) => {
    switch (item.actionType) {
      case "scanner":
        onOpenScanner();
        break;
      case "add_money":
        onOpenAddMoney();
        break;
      case "self_transfer":
        onOpenSelfTransfer();
        break;
      case "gold":
        onOpenGoldModal();
        break;
      case "scratch":
        onOpenScratchCard();
        break;
      case "pay_later":
        onTogglePayLater();
        break;
      case "url":
        if (item.actionPayload) {
          window.open(item.actionPayload, "_blank", "noopener,noreferrer");
        }
        break;
      case "toast":
        toast.info(item.actionPayload || `${item.title} selected`);
        break;
    }
  };

  const handleVoiceSearch = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.info("Voice search is not supported in this browser.");
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.onstart = () => toast.info("🎙️ Listening... Speak what you need (e.g., 'electricity bill', 'send money')");
      recognition.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        if (text) {
          setQuery(text);
          setIsFocused(true);
        }
      };
      recognition.start();
    } catch {
      toast.error("Failed to start voice search.");
    }
  };

  return (
    <div className={`relative z-10 w-full ${className}`}>
      {/* 👑 FULL PHONEPE / PAYTM STYLE SEARCH BAR */}
      <div className="group relative flex items-center rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-r from-surface via-surface to-emerald-950/20 p-1.5 shadow-[0_4px_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-400/30 transition-all duration-200 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-400/20 hover:border-emerald-500/70">
        <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0D3B2E] via-emerald-800 to-[#07241C] text-emerald-400 shadow-sm">
          <Search className="size-4 sm:size-5 text-emerald-300 transition-transform group-focus-within:scale-110" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search 'electricity bill', 'autopay', 'loans', 'rewards', 'transfer'..."
          className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted/60 focus:outline-none"
        />

        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-muted/20 hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        ) : null}

        <button
          type="button"
          onClick={handleVoiceSearch}
          title="Voice Search"
          className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all"
        >
          <Mic className="size-4 sm:size-4.5 animate-pulse" />
        </button>
      </div>

      {/* HORIZONTAL CATEGORY PILLS */}
      <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all ${
              selectedCategory === cat.id
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm ring-1 ring-emerald-300"
                : "bg-surface/80 border border-border/80 text-muted hover:text-foreground hover:bg-surface"
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* QUICK SUGGESTIONS OR LIVE SEARCH RESULTS */}
      {(isFocused || query.trim().length > 0) && (
        <div className="mt-2 max-h-72 overflow-y-auto rounded-2xl border-2 border-emerald-500/30 bg-surface/98 p-2 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between px-2 py-1 border-b border-border/50">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted">
              {query ? `Found ${filteredItems.length} results for "${query}"` : "Popular Finance Services"}
            </span>
            <button
              type="button"
              onClick={() => setIsFocused(false)}
              className="text-[10px] font-bold text-emerald-500 hover:underline"
            >
              Close
            </button>
          </div>

          <div className="divide-y divide-border/40">
            {filteredItems.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted">
                No matching finance services found. Try searching "bills", "loan", "autopay" or "UPI".
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    handleAction(item);
                    setIsFocused(false);
                  }}
                  className="group flex cursor-pointer items-center justify-between gap-3 p-2 rounded-xl transition-all hover:bg-emerald-500/10 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-surface border border-border/60 text-base group-hover:scale-110 transition-transform">
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-foreground truncate group-hover:text-emerald-400 transition-colors">
                          {item.title}
                        </h4>
                        {item.badge && (
                          <span className="shrink-0 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-300">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted truncate">{item.subtitle}</p>
                    </div>
                  </div>

                  <ArrowRight className="size-4 shrink-0 text-muted opacity-40 group-hover:opacity-100 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
