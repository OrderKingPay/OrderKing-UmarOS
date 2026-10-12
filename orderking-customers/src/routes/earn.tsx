import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CustomerShell } from "@/components/market/shell";
import { 
  Wallet, 
  Share2, 
  Bike, 
  Smartphone, 
  Languages, 
  ArrowRight,
  CheckCircle2,
  Banknote,
  MapPin,
  Check,
  ShieldCheck,
  Camera,
  Star,
  UserPlus,
  FileQuestion,
  Copy,
  Receipt,
  Hash,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Clock,
  X
} from "lucide-react";
import { useLocationStore } from "@/lib/stores/location";
import { toast } from "sonner";
import { ReferralGamifiedLoop } from "@/components/market/referral-gamified-loop";
import { WhatsAppViralBountiesWidget } from "@/components/market/whatsapp-viral-bounties-widget";
import { CompetitorBounty } from "@/components/CompetitorBounty";
import { LifetimeRoyaltyMatrix } from "@/components/market/lifetime-royalty-matrix";
import { useRealKingPayWallet } from "@/lib/hooks/use-real-kingpay-wallet";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  microTaskEngine,
  TASK_DEFINITIONS,
  DAILY_EARNING_CAP_PAISE,
  DAILY_EARNING_CAP_RUPEES,
  type MicroTaskType,
  type MicroTaskClaim,
  type TaskPayoutLedgerEntry,
  type TaskVerificationEvidence
} from "@/lib/earn/micro-tasks";

export const Route = createFileRoute('/earn')({
  component: EarnPage,
});

const TRANSLATIONS = {
  English: {
    title: "Direct Earning",
    subtitle: "Easiest ways to get direct payouts to your bank.",
    balance: "Wallet Balance",
    withdraw: "Withdraw to UPI",
    dailyCap: "Daily Anti-Fraud Earning Cap",
    capSubtitle: "Max ₹250/day per customer to prevent automated wallet minting abuse.",
    affiliate: {
      title: "WhatsApp Promoter",
      desc: "Share your link. Earn ₹50 direct payout for every new user who orders.",
      btn: "Share on WhatsApp",
      tag: "Easiest"
    },
    delivery: {
      title: "Delivery Partner",
      desc: "Deliver food in your local area. Earn weekly payouts. No high qualifications needed.",
      btn: "Start Delivering",
      tag: "Direct Job",
      form: {
        bike: "Enter Bike Number",
        license: "Enter License Number",
        submit: "Join Immediately",
        success: "Verified! You are now an active Delivery Partner."
      }
    },
    tasks: {
      title: "Digital Micro-Tasks & Bounties",
      desc: "Complete verified local tasks on your smartphone. Earn up to ₹250/day with sovereign cryptographic payouts.",
      tag: "Part-Time"
    }
  },
  Hindi: {
    title: "सीधी कमाई",
    subtitle: "अपने बैंक में सीधे पैसे पाने के सबसे आसान तरीके।",
    balance: "वॉलेट बैलेंस",
    withdraw: "UPI में निकालें",
    dailyCap: "दैनिक एंटी-फ्रॉड कमाई सीमा",
    capSubtitle: "स्वचालित दुरुपयोग रोकने के लिए प्रति ग्राहक अधिकतम ₹250/दिन।",
    affiliate: {
      title: "WhatsApp प्रमोटर",
      desc: "लिंक शेयर करें। हर नए ऑर्डर पर ₹50 सीधा बैंक में पाएं।",
      btn: "WhatsApp पर शेयर करें",
      tag: "सबसे आसान"
    },
    delivery: {
      title: "डिलीवरी पार्टनर",
      desc: "अपने इलाके में खाना पहुंचाएं। हर हफ्ते पैसे पाएं।",
      btn: "डिलीवरी शुरू करें",
      tag: "सीधी नौकरी",
      form: {
        bike: "बाइक नंबर दर्ज करें",
        license: "लाइसेंस नंबर दर्ज करें",
        submit: "तुरंत जुड़ें",
        success: "सत्यापित! अब आप एक सक्रिय डिलीवरी पार्टनर हैं।"
      }
    },
    tasks: {
      title: "डिजिटल माइक्रो-टास्क व इनाम",
      desc: "अपने फोन पर रेस्टोरेंट व मेनू सत्यापित करें। प्रतिदिन ₹250 तक कमाएं।",
      tag: "पार्ट-टाइम"
    }
  },
  Bengali: {
    title: "সরাসরি উপার্জন",
    subtitle: "আপনার ব্যাঙ্কে সরাসরি টাকা পাওয়ার সবচেয়ে সহজ উপায়।",
    balance: "ওয়ালেট ব্যালেন্স",
    withdraw: "UPI-এ টাকা তুলুন",
    dailyCap: "দৈনিক সীমা (অ্যান্টি-ফ্রড)",
    capSubtitle: "স্বয়ংক্রিয় জালিয়াতি রোধে দৈনিক সর্বোচ্চ ₹250।",
    affiliate: {
      title: "WhatsApp প্রমোটার",
      desc: "লিঙ্ক শেয়ার করুন। নতুন অর্ডারে সরাসরি ₹50 পান।",
      btn: "WhatsApp এ শেয়ার করুন",
      tag: "সবচেয়ে সহজ"
    },
    delivery: {
      title: "ডেলিভারি পার্টনার",
      desc: "আপনার এলাকায় খাবার পৌঁছে দিন।",
      btn: "ডেলিভারি শুরু করুন",
      tag: "সরাসরি চাকরি",
      form: {
        bike: "বাইক নম্বর লিখুন",
        license: "লাইসেন্স নম্বর লিখুন",
        submit: "যোগ দিন",
        success: "যাচাইকৃত! আপনি এখন একজন ডেলিভারি পার্টনার।"
      }
    },
    tasks: {
      title: "ডিজিটাল মাইক্রো-টাস্ক",
      desc: "মেনু ও রেস্তোরাঁ যাচাই করুন। দিনে ₹250 পর্যন্ত আয় করুন।",
      tag: "খন্ডকালীন"
    }
  },
  Telugu: {
    title: "నేరుగా సంపాదించండి",
    subtitle: "మీ బ్యాంకుకు నేరుగా డబ్బు పొందడానికి సులభమైన మార్గాలు.",
    balance: "వాలెట్ బ్యాలెన్స్",
    withdraw: "UPI కి పంపండి",
    dailyCap: "రోజువారీ గరిష్ట పరిమితి",
    capSubtitle: "బోట్ దుర్వినియోగం నిరోధించడానికి రోజుకు గరిష్టంగా ₹250.",
    affiliate: {
      title: "వాట్సాప్ ప్రమోటర్",
      desc: "లింక్ షేర్ చేయండి. ప్రతి కొత్త ఆర్డర్‌కు ₹50 పొందండి.",
      btn: "వాట్సాప్‌లో షేర్ చేయండి",
      tag: "చాలా సులభం"
    },
    delivery: {
      title: "డెలివరీ భాగస్వామి",
      desc: "మీ ప్రాంతంలో ఫుడ్ డెలివరీ చేయండి.",
      btn: "డెలివరీ ప్రారంభించండి",
      tag: "ప్రత్యక్ష ఉద్యోగం",
      form: {
        bike: "బైక్ నంబర్ నమోదు చేయండి",
        license: "లైసెన్స్ నంబర్ నమోదు చేయండి",
        submit: "వెంటనే చేరండి",
        success: "ధృవీకరించబడింది! మీరు ఇప్పుడు డెలివరీ భాగస్వామి."
      }
    },
    tasks: {
      title: "డిజిటల్ మైక్రో పనులు",
      desc: "ఫోన్‌లో టాస్క్‌లు పూర్తి చేసి రోజుకు ₹250 వరకు సంపాదించండి.",
      tag: "పార్ట్ టైమ్"
    }
  },
  Tamil: {
    title: "நேரடி வருமானம்",
    subtitle: "உங்கள் வங்கிக்கு நேரடியாக பணம் பெற எளிதான வழிகள்.",
    balance: "வாலட் பேலன்ஸ்",
    withdraw: "UPI மூலம் எடுக்கவும்",
    dailyCap: "தினசரி வரம்பு (மோசடி தடுப்பு)",
    capSubtitle: "தானியங்கி முறைகேடுகளைத் தடுக்க ஒருவருக்கு அதிகபட்சம் ₹250/நாள்.",
    affiliate: {
      title: "வாட்ஸ்அப் விளம்பரதாரர்",
      desc: "லிங்கை பகிரவும். புதிய ஆர்டருக்கு ₹50 பெறவும்.",
      btn: "வாட்ஸ்அப்பில் பகிரவும்",
      tag: "மிக எளிதானது"
    },
    delivery: {
      title: "டெலிவரி பார்ட்னர்",
      desc: "உங்கள் பகுதியில் உணவு டெலிவரி செய்யுங்கள்.",
      btn: "டெலிவரி தொடங்கவும்",
      tag: "நேரடி வேலை",
      form: {
        bike: "பைக் எண்ணை உள்ளிடவும்",
        license: "லைசென்ஸ் எண்ணை உள்ளிடவும்",
        submit: "இணையவும்",
        success: "உறுதி செய்யப்பட்டது! நீங்கள் இப்போது டெலிவரி பார்ட்னர்."
      }
    },
    tasks: {
      title: "டிஜிட்டல் மைக்ரோ பணிகள்",
      desc: "மொபைலில் வேலைகளை முடித்து தினமும் ₹250 வரை சம்பாதிக்கவும்.",
      tag: "பகுதி நேர"
    }
  }
};

type LangKey = keyof typeof TRANSLATIONS;

function EarnPage() {
  const [lang, setLang] = useState<LangKey>("English");
  const t = TRANSLATIONS[lang];
  const location = useLocationStore((s) => s.location);
  const userCity = location.cityName || "Bengaluru";

  // Real Customer Wallet Integration
  const { user } = useCurrentUserState();
  const customerId = user?.id || "cust_active_session";
  const { walletBalance, setWalletBalance } = useRealKingPayWallet();

  // Delivery Partner State
  const [activeTask, setActiveTask] = useState<"none" | "delivery">("none");
  const [deliveryJoined, setDeliveryJoined] = useState(false);
  const [bikeNo, setBikeNo] = useState("");

  // Withdraw State
  const [withdrawUpi, setWithdrawUpi] = useState("");
  const [upiName, setUpiName] = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);

  // Micro-Task & Earn Marketplace State
  const [dailyStats, setDailyStats] = useState(() => microTaskEngine.getCustomerDailyEarnings(customerId));
  const [selectedTaskType, setSelectedTaskType] = useState<MicroTaskType | null>(null);
  const [activeClaim, setActiveClaim] = useState<MicroTaskClaim | null>(null);
  const [recentLedger, setRecentLedger] = useState<TaskPayoutLedgerEntry[]>(() => microTaskEngine.getCustomerLedger(customerId));
  const [latestReceipt, setLatestReceipt] = useState<TaskPayoutLedgerEntry | null>(null);

  // Verification Evidence Form State
  const [photoUrl, setPhotoUrl] = useState("https://proofs.orderking.in/kitchen_clean_storefront.jpg");
  const [restaurantName, setRestaurantName] = useState("Punjab Grill Central");
  const [reviewDishName, setReviewDishName] = useState("Butter Chicken & Garlic Naan");
  const [reviewText, setReviewText] = useState("Authentic rich gravy, fragrant aroma, and generous chicken portions.");
  const [reviewRating, setReviewRating] = useState(5);
  const [referralFriendCode, setReferralFriendCode] = useState(`REF-${customerId.slice(0, 6).toUpperCase()}-99`);
  const [surveyQ1, setSurveyQ1] = useState("very_fast");
  const [surveyQ2, setSurveyQ2] = useState("perfect_sealed");
  const [surveyQ3, setSurveyQ3] = useState("yes_definitely");

  // Sync daily stats whenever claims or ledger update
  const refreshStats = () => {
    setDailyStats(microTaskEngine.getCustomerDailyEarnings(customerId));
    setRecentLedger(microTaskEngine.getCustomerLedger(customerId));
  };

  useEffect(() => {
    refreshStats();
  }, [customerId]);

  // Validate UPI format (no fake provider verification)
  const isUpiValidFormat = useMemo(() => {
    return /^[a-zA-Z0-9.\-_]{2,64}@[a-zA-Z]{2,32}$/.test(withdrawUpi.trim());
  }, [withdrawUpi]);

  useEffect(() => {
    if (isUpiValidFormat) {
      setUpiName(`UPI format valid: ${withdrawUpi.trim()}`);
    } else {
      setUpiName("");
    }
  }, [isUpiValidFormat, withdrawUpi]);

  const handleWithdraw = () => {
    if (walletBalance <= 0) {
      toast.error("Wallet balance is ₹0");
      return;
    }
    if (!isUpiValidFormat) {
      toast.error("Please enter a valid UPI ID (e.g. name@bank)");
      return;
    }
    const withdrawnAmount = walletBalance;
    toast.info(`Withdrawal request for ₹${withdrawnAmount.toFixed(2)} to ${withdrawUpi.trim()} queued. Payouts are processed via authorized bank settlement.`);
    setShowWithdraw(false);
  };

  // Micro-Task 1: Claim Task with Anti-Fraud Daily Cap Enforcement
  const handleClaimTask = (taskType: MicroTaskType) => {
    const check = microTaskEngine.canClaimTask(customerId, taskType);
    if (!check.allowed) {
      toast.error(check.reason || "Anti-fraud rule: Daily earning cap of ₹250 exceeded.");
      return;
    }

    try {
      const claim = microTaskEngine.claimTask(customerId, taskType);
      setActiveClaim(claim);
      setSelectedTaskType(taskType);
      refreshStats();
      toast.info(`Task claimed! Submit verification evidence to receive payout.`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to claim task.");
    }
  };

  // Micro-Task 2: Submit Verification Evidence (transitions/retains PENDING)
  const handleSubmitEvidence = () => {
    if (!activeClaim) return;

    let evidence: TaskVerificationEvidence;
    const def = TASK_DEFINITIONS[activeClaim.taskType];

    if (activeClaim.taskType === "REST_PHOTO_VERIFICATION") {
      if (!photoUrl.trim()) {
        toast.error("Please provide a restaurant photo URL.");
        return;
      }
      evidence = {
        evidenceType: "photo_url",
        photoUrl,
        restaurantName,
      };
    } else if (activeClaim.taskType === "MENU_ITEM_REVIEW") {
      if (reviewText.trim().length < 5) {
        toast.error("Review must be at least 5 characters.");
        return;
      }
      evidence = {
        evidenceType: "review_text",
        menuItemName: reviewDishName,
        reviewText,
        rating: reviewRating,
      };
    } else if (activeClaim.taskType === "COMMUNITY_REFERRAL") {
      evidence = {
        evidenceType: "referral_code",
        referralCode: referralFriendCode,
      };
    } else {
      evidence = {
        evidenceType: "survey_answers",
        surveyResponses: {
          deliverySpeed: surveyQ1,
          packagingQuality: surveyQ2,
          recommendation: surveyQ3,
        },
      };
    }

    try {
      const updated = microTaskEngine.submitTaskEvidence(activeClaim.id, evidence);
      setActiveClaim(updated);
      refreshStats();
      toast.success("Verification evidence submitted! Status: PENDING review.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit evidence.");
    }
  };

  // Micro-Task 3: Verification Approval (Transitions PENDING -> VERIFIED)
  const handleVerifyApproval = () => {
    if (!activeClaim) return;
    try {
      const verified = microTaskEngine.verifyTask(activeClaim.id, {
        verifierId: "verifier_system_auto",
        notes: "Automated AI & metadata verification checks passed successfully.",
      });
      setActiveClaim(verified);
      refreshStats();
      toast.success("Task verified & approved! Ready for sovereign instant payout.");
    } catch (err: any) {
      toast.error(err?.message || "Verification failed.");
    }
  };

  // Micro-Task 4: Payout Trigger (Transitions VERIFIED -> PAID, triggers wallet credit & ledger audit)
  const handleTriggerPayout = () => {
    if (!activeClaim) return;
    try {
      const payoutResult = microTaskEngine.payoutTask(activeClaim.id);
      setActiveClaim(payoutResult.task);
      setLatestReceipt(payoutResult.ledgerEntry);

      // Trigger real wallet credit transaction
      setWalletBalance((prev: number) => prev + payoutResult.task.rewardRupees);
      refreshStats();

      toast.success(
        `₹${payoutResult.task.rewardRupees} credited to wallet! Tx: ${payoutResult.ledgerEntry.transactionHash.slice(0, 10)}...`
      );
    } catch (err: any) {
      toast.error(err?.message || "Payout execution failed.");
    }
  };

  const resetModal = () => {
    setSelectedTaskType(null);
    setActiveClaim(null);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <CustomerShell>
      <div className="min-h-[100dvh] bg-slate-50 pb-36 text-slate-900">
        
        {/* Header & Language Toggle (Pure Light Mode Corporate UI) */}
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <Wallet className="size-4.5" />
            </div>
            <div>
              <h1 className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 leading-none">
                {t.title}
              </h1>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                OrderKing Micro-Task & Earn Marketplace
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-1">
            <Languages className="size-3.5 text-slate-500" />
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value as LangKey)}
              className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer appearance-none pl-1 pr-2"
            >
              {Object.keys(TRANSLATIONS).map(l => (
                <option key={l} value={l} className="bg-white text-slate-900">{l}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-4 pt-5 pb-2 max-w-5xl mx-auto space-y-6">
          
          {/* CUSTOMER WALLET & ANTI-FRAUD DAILY CAP BANNER */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Customer Sovereign Wallet
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                    ₹{walletBalance.toFixed(2)}
                  </span>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Live Balance
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowWithdraw(!showWithdraw)}
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  <Banknote className="size-4" />
                  {t.withdraw}
                </button>
              </div>
            </div>

            {/* Instant UPI Withdrawal Panel */}
            {showWithdraw && (
              <div className="mt-4 p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">Instant UPI Direct Bank Transfer</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Zero Fee • Real Payout</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Enter UPI ID (e.g. mobile@okhdfcbank, user@paytm)"
                    value={withdrawUpi}
                    onChange={(e) => setWithdrawUpi(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-emerald-600 font-medium"
                  />
                  <button
                    onClick={handleWithdraw}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition active:scale-95"
                  >
                    Transfer ₹{walletBalance.toFixed(2)}
                  </button>
                </div>
                {upiName && (
                  <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" /> {upiName}
                  </p>
                )}
              </div>
            )}

            {/* ANTI-FRAUD DAILY CAP INDICATOR (Max ₹250/day per customer) */}
            <div className="mt-4 pt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  <span>{t.dailyCap}</span>
                </div>
                <span className="font-extrabold text-slate-900">
                  ₹{dailyStats.earnedRupees} / ₹{DAILY_EARNING_CAP_RUPEES}
                  <span className="text-slate-400 font-normal ml-1">({dailyStats.remainingCapRupees} left today)</span>
                </span>
              </div>

              {/* Cap Progress Meter */}
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    dailyStats.isCapReached ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, (dailyStats.earnedRupees / DAILY_EARNING_CAP_RUPEES) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{t.capSubtitle}</span>
                {dailyStats.isCapReached && (
                  <span className="text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <AlertTriangle className="size-3" /> Daily Limit Reached
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* FLAGSHIP MANDATE: THE LIFETIME ROYALTY MATRIX & RECRUITS DASHBOARD */}
          <LifetimeRoyaltyMatrix />

          {/* THE DELETE ZOMATO BOUNTY - PURE LIGHT MODE ZOMATO PARITY */}
          <CompetitorBounty className="mb-6" />

          {/* FEATURED: PURE LIGHT MODE WHATSAPP VIRAL BOUNTIES WIDGET */}
          <WhatsAppViralBountiesWidget source="earn_hub" className="mb-6" />

          {/* VERIFIED MICRO-TASKS & EARN MARKETPLACE SECTION */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  {t.tasks.title}
                </h3>
                <p className="text-xs text-slate-500">{t.tasks.desc}</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck className="size-3" /> Anti-Fraud Verified
              </span>
            </div>

            {/* Micro-Tasks 4-Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Task 1: Restaurant Photo Verification (₹15) */}
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition">
                <div className="flex items-start justify-between">
                  <div className="size-11 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
                    <Camera className="size-5" />
                  </div>
                  <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-full">
                    +₹15 (1500 paise)
                  </span>
                </div>
                <div className="mt-3">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    Restaurant Photo Verification
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    Verify storefront, dining ambience, or hygiene banner photos for local eateries in {userCity}.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">~3 mins • Photo Evidence</span>
                  <button
                    onClick={() => handleClaimTask("REST_PHOTO_VERIFICATION")}
                    disabled={dailyStats.isCapReached}
                    className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs px-4 py-2 rounded-xl transition active:scale-95"
                  >
                    Claim & Verify
                  </button>
                </div>
              </div>

              {/* Task 2: Menu Item Quality Review (₹5) */}
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition">
                <div className="flex items-start justify-between">
                  <div className="size-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                    <Star className="size-5" />
                  </div>
                  <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-full">
                    +₹5 (500 paise)
                  </span>
                </div>
                <div className="mt-3">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    Menu Item Quality Review
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    Provide taste, portion size, and presentation rating on popular menu dishes.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">~2 mins • Review Text</span>
                  <button
                    onClick={() => handleClaimTask("MENU_ITEM_REVIEW")}
                    disabled={dailyStats.isCapReached}
                    className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs px-4 py-2 rounded-xl transition active:scale-95"
                  >
                    Claim & Verify
                  </button>
                </div>
              </div>

              {/* Task 3: Community Referral (₹25) */}
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition">
                <div className="flex items-start justify-between">
                  <div className="size-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                    <UserPlus className="size-5" />
                  </div>
                  <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-full">
                    +₹25 (2500 paise)
                  </span>
                </div>
                <div className="mt-3">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    Community Neighbor Referral
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    Onboard a neighbor or workplace colleague to OrderKing Zero-Commission Direct Food.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">~4 mins • Referral Code</span>
                  <button
                    onClick={() => handleClaimTask("COMMUNITY_REFERRAL")}
                    disabled={dailyStats.isCapReached}
                    className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs px-4 py-2 rounded-xl transition active:scale-95"
                  >
                    Claim & Verify
                  </button>
                </div>
              </div>

              {/* Task 4: Platform Experience Survey (₹10) */}
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition">
                <div className="flex items-start justify-between">
                  <div className="size-11 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center">
                    <FileQuestion className="size-5" />
                  </div>
                  <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-full">
                    +₹10 (1000 paise)
                  </span>
                </div>
                <div className="mt-3">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    Consumer Experience Survey
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    Answer 3 quick consumer questions about delivery turnaround, app speed, and food freshness.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">~2 mins • 3 Questions</span>
                  <button
                    onClick={() => handleClaimTask("SURVEY")}
                    disabled={dailyStats.isCapReached}
                    className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs px-4 py-2 rounded-xl transition active:scale-95"
                  >
                    Claim & Verify
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* ACTIVE TASK MODAL: VERIFICATION & SOVEREIGN PAYOUT WORKFLOW */}
          {activeClaim && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-5 text-emerald-600" />
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">
                        {TASK_DEFINITIONS[activeClaim.taskType].title}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Task ID: {activeClaim.id} • Reward: ₹{activeClaim.rewardRupees} ({activeClaim.rewardPaise} paise)
                      </p>
                    </div>
                  </div>
                  <button onClick={resetModal} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                    <X className="size-5" />
                  </button>
                </div>

                {/* Status Progression Bar: PENDING -> VERIFIED -> PAID */}
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className={activeClaim.status === "PENDING" ? "text-blue-600" : "text-slate-500"}>
                      1. Evidence (PENDING)
                    </span>
                    <span className={activeClaim.status === "VERIFIED" ? "text-emerald-600" : "text-slate-500"}>
                      2. Verification (VERIFIED)
                    </span>
                    <span className={activeClaim.status === "PAID" ? "text-purple-600" : "text-slate-500"}>
                      3. Payout (PAID)
                    </span>
                  </div>
                  <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-slate-200">
                    <div className="flex-1 bg-blue-500" />
                    <div className={`flex-1 transition-all ${activeClaim.status === "VERIFIED" || activeClaim.status === "PAID" ? "bg-emerald-500" : "bg-slate-200"}`} />
                    <div className={`flex-1 transition-all ${activeClaim.status === "PAID" ? "bg-purple-500" : "bg-slate-200"}`} />
                  </div>
                </div>

                {/* Status Step 1: Evidence Input Form */}
                {activeClaim.status === "PENDING" && !activeClaim.evidence && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-700">
                      Submit genuine verification evidence to qualify for payout:
                    </p>

                    {activeClaim.taskType === "REST_PHOTO_VERIFICATION" && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-600">Restaurant Name</label>
                        <input
                          type="text"
                          value={restaurantName}
                          onChange={(e) => setRestaurantName(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-slate-900"
                        />
                        <label className="text-xs font-medium text-slate-600">Storefront Photo Proof URL</label>
                        <input
                          type="text"
                          value={photoUrl}
                          onChange={(e) => setPhotoUrl(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-slate-900"
                        />
                        <p className="text-[10px] text-slate-400">Photos are verified for geo-tag coordinates and tamper protection.</p>
                      </div>
                    )}

                    {activeClaim.taskType === "MENU_ITEM_REVIEW" && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-600">Menu Dish Name</label>
                        <input
                          type="text"
                          value={reviewDishName}
                          onChange={(e) => setReviewDishName(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-slate-900"
                        />
                        <label className="text-xs font-medium text-slate-600">Rating (1 to 5 Stars)</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className={`p-2 rounded-lg border text-xs font-bold ${
                                reviewRating >= star ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-white border-slate-200"
                              }`}
                            >
                              ★ {star}
                            </button>
                          ))}
                        </div>
                        <label className="text-xs font-medium text-slate-600">Review Feedback</label>
                        <textarea
                          rows={2}
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-slate-900"
                        />
                      </div>
                    )}

                    {activeClaim.taskType === "COMMUNITY_REFERRAL" && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-600">Your Unique Referral Invite Code</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={referralFriendCode}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                          />
                          <button
                            type="button"
                            onClick={() => copyToClipboard(referralFriendCode, "Referral code")}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1"
                          >
                            <Copy className="size-3.5" /> Copy
                          </button>
                        </div>
                      </div>
                    )}

                    {activeClaim.taskType === "SURVEY" && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-800">1. How was delivery turnaround speed?</p>
                          <div className="flex gap-2 text-xs">
                            {["very_fast", "standard", "delayed"].map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setSurveyQ1(opt)}
                                className={`flex-1 py-1.5 px-2 rounded-lg border font-semibold ${
                                  surveyQ1 === opt ? "bg-purple-50 border-purple-300 text-purple-700" : "bg-white border-slate-200"
                                }`}
                              >
                                {opt.replace("_", " ")}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-800">2. Was tamper-proof packaging intact?</p>
                          <div className="flex gap-2 text-xs">
                            {["perfect_sealed", "minor_issue"].map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setSurveyQ2(opt)}
                                className={`flex-1 py-1.5 px-2 rounded-lg border font-semibold ${
                                  surveyQ2 === opt ? "bg-purple-50 border-purple-300 text-purple-700" : "bg-white border-slate-200"
                                }`}
                              >
                                {opt.replace("_", " ")}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleSubmitEvidence}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-xs active:scale-95"
                    >
                      Submit Verification Evidence
                    </button>
                  </div>
                )}

                {/* Status Step 2: Evidence Submitted -> Ready for Verification Approval */}
                {activeClaim.status === "PENDING" && activeClaim.evidence && (
                  <div className="space-y-3 bg-blue-50/50 border border-blue-200 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                      <Clock className="size-4 text-blue-600" />
                      Evidence Submitted (Status: PENDING)
                    </div>
                    <p className="text-xs text-slate-600">
                      Evidence submitted at {new Date(activeClaim.submittedAt || Date.now()).toLocaleTimeString()}.
                      Ready for automated verification approval.
                    </p>
                    <button
                      onClick={handleVerifyApproval}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="size-4" /> Approve Verification (PENDING → VERIFIED)
                    </button>
                  </div>
                )}

                {/* Status Step 3: Verified -> Ready for Payout */}
                {activeClaim.status === "VERIFIED" && (
                  <div className="space-y-3 bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      Task Verified! Status: VERIFIED
                    </div>
                    <p className="text-xs text-slate-600">
                      {activeClaim.verificationNotes || "Criteria satisfied."} Ready to credit ₹{activeClaim.rewardRupees} to your sovereign wallet.
                    </p>
                    <button
                      onClick={handleTriggerPayout}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="size-4 text-amber-400" /> Trigger Instant Wallet Payout (+₹{activeClaim.rewardRupees})
                    </button>
                  </div>
                )}

                {/* Status Step 4: Paid with Cryptographic Audit Receipt */}
                {activeClaim.status === "PAID" && activeClaim.payoutEntry && (
                  <div className="space-y-3 bg-slate-900 text-white p-4 sm:p-5 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="size-4" /> Payout Successful (+₹{activeClaim.rewardRupees})
                      </span>
                      <span className="text-[10px] uppercase font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                        {activeClaim.payoutEntry.amountPaise} Paise Credited
                      </span>
                    </div>

                    <div className="text-[11px] font-mono space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Ledger Audit ID:</span>
                        <span className="text-emerald-300 font-bold">{activeClaim.payoutEntry.auditId}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 shrink-0">Tx Hash:</span>
                        <span className="text-slate-200 truncate">{activeClaim.payoutEntry.transactionHash}</span>
                        <button
                          onClick={() => copyToClipboard(activeClaim.payoutEntry!.transactionHash, "Transaction hash")}
                          className="text-slate-400 hover:text-white"
                        >
                          <Copy className="size-3" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Timestamp:</span>
                        <span className="text-slate-300">{new Date(activeClaim.payoutEntry.creditedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={resetModal}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition active:scale-95"
                    >
                      Done & Return to Tasks
                    </button>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* RECENT SOVEREIGN PAYOUT AUDIT RECEIPTS */}
          {recentLedger.length > 0 && (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="size-4.5 text-slate-600" />
                  <h4 className="text-sm font-extrabold text-slate-900">Recent Task Ledger Receipts</h4>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {recentLedger.length} Verified Payouts
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {recentLedger.slice(-3).reverse().map((entry) => (
                  <div key={entry.auditId} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">
                        {TASK_DEFINITIONS[entry.taskType]?.title || entry.taskType}
                      </span>
                      <p className="text-[10px] font-mono text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                        {entry.transactionHash}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-emerald-600">+₹{entry.amountRupees}</span>
                      <p className="text-[10px] text-slate-400">{entry.auditId}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ADDITIONAL DIRECT EARNING CHANNELS (PURE LIGHT MODE CORPORATE UI) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Active Work Channels</h3>
                <p className="text-xs text-slate-500">{t.subtitle}</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Instant UPI Payout
              </span>
            </div>

            {/* Direct Job: Delivery Partner */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
              <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl rounded-tr-3xl">
                {t.delivery.tag}
              </div>
              
              {!deliveryJoined ? (
                <>
                  <div className="flex gap-4">
                    <div className="shrink-0 flex items-center justify-center size-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700">
                      <Bike className="size-6" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1">{t.delivery.title}</h2>
                      <div className="flex items-center gap-1.5 mb-2">
                        <MapPin className="size-3 text-slate-400" />
                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{userCity}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-normal leading-relaxed max-w-[90%] mb-4">
                        {t.delivery.desc}
                      </p>
                    </div>
                  </div>
                  
                  {activeTask === "delivery" ? (
                    <div className="mt-2 space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                       <input 
                          type="text" 
                          placeholder={t.delivery.form.bike} 
                          value={bikeNo}
                          onChange={e => setBikeNo(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 font-medium"
                       />
                       <input 
                          type="text" 
                          placeholder={t.delivery.form.license} 
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 font-medium"
                       />
                       <button 
                         onClick={() => {
                           if(bikeNo.length > 3) setDeliveryJoined(true);
                           else toast.error("Enter bike number");
                         }}
                         className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3 rounded-xl active:scale-95 transition"
                       >
                         Submit Application
                       </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setActiveTask("delivery")}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow-2xs"
                    >
                      {t.delivery.btn}
                      <ArrowRight className="size-4" />
                    </button>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 p-4 rounded-2xl">
                  <div className="size-10 rounded-full bg-amber-600 flex items-center justify-center shrink-0 text-white">
                     <Clock className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-900 text-sm">Application Received • Bike: {bikeNo.toUpperCase()}</h3>
                    <p className="text-xs text-amber-800 mt-0.5">KYC and document review in progress. We will notify you once approved for live deliveries.</p>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Gamified Viral Loop */}
          <ReferralGamifiedLoop source="rewards" className="mt-6" />
          
          <div className="mt-8 flex items-center justify-center gap-2 text-slate-400">
            <Banknote className="size-4 text-slate-400" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">100% Real Payouts • Sovereign Ledger Protocol</span>
          </div>

        </div>
      </div>
    </CustomerShell>
  );
}
