import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import { setPhoneSession, getPhoneSession } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { OrderKingMark } from "@/components/mark";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useMerchantBranding } from "@orderking/ui";
import { platformConfig } from "@/lib/platform-config";
import {
  sendPartnerOtpFn,
  verifyPartnerOtpFn,
  sanitizeIndianPhone,
  isValidIndianPhone,
} from "@/lib/server/sms-gateway";
import { ORDERKING_ONBOARDING_DRAFT_KEY } from "@/routes/onboarding";
import { orderKingSpark } from "@/lib/ai/order-king-spark";
import { ringPosAlarm } from "@/lib/hardware/pos-alarm";
import { formatINR } from "@/lib/money";
import {
  ShieldCheck,
  Phone,
  MessageCircle,
  RefreshCw,
  Store,
  FileCheck2,
  Banknote,
  ChefHat,
  ClipboardList,
  Clock,
  UtensilsCrossed,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  ArrowRight,
  Shield,
  Award,
  Sparkles,
  Building,
  FileText,
  Check,
  Headphones,
  Volume2,
  AlertTriangle,
  AlertCircle,
  Send,
  Sliders,
  DollarSign,
  Calculator,
  Lock,
  Mail,
  Eye,
  EyeOff,
  X,
  ExternalLink,
  Layers,
  Info,
  Printer,
  Tag,
  Calendar,
  Percent,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    if (context?.sessionUser) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: () => <PartnerLandingPage initialMode="up" />,
});

export function PartnerLandingPage({
  initialMode = "up",
  initialPhone = "",
  initialName = "",
}: {
  initialMode?: "in" | "up";
  initialPhone?: string;
  initialName?: string;
}) {
  const branding = useMerchantBranding();
  const { user } = useCurrentUserState();

  // If already authenticated via client-side phone session, route directly to dashboard
  useEffect(() => {
    if (typeof window !== "undefined") {
      const s = getPhoneSession();
      if (s?.user?.id || user?.id) {
        window.location.replace("/dashboard");
      }
    }
  }, [user]);

  // Auth Card State
  const [mode, setMode] = useState<"up" | "in">(initialMode);
  const [authMethod, setAuthMethod] = useState<"otp" | "password">("otp");
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");
  const [mobileNumber, setMobileNumber] = useState(initialPhone);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const cleanPhone = useMemo(() => sanitizeIndianPhone(mobileNumber), [mobileNumber]);
  const isPhoneValid = isValidIndianPhone(cleanPhone);

  useEffect(() => {
    if (otpStep !== "code") return;
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const tId = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(tId);
  }, [otpStep, countdown]);

  async function handleSendOtp(channel: "sms" | "whatsapp" = "sms") {
    if (!isPhoneValid) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (mode === "up" && !name.trim()) {
      setError("Please enter the restaurant owner / manager full name.");
      return;
    }

    setWorking(true);
    setError(null);

    try {
      const res = await sendPartnerOtpFn({
        data: { phone: cleanPhone, channel },
      });
      if (!res?.success && res?.success !== undefined) {
        throw new Error("SMS was not delivered.");
      }
      setOtpStep("code");
      setCountdown(30);
      setCanResend(false);
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpCode("");

      if (channel === "whatsapp" && res?.whatsAppOtpUrl && typeof window !== "undefined") {
        window.open(res.whatsAppOtpUrl, "_blank");
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to dispatch verification code.");
    } finally {
      setWorking(false);
    }
  }

  function handleDigitChange(index: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    const joined = next.join("");
    setOtpCode(joined);

    if (digit && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
    if (joined.length === 6) {
      void handleVerifyOtp(joined);
    }
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  }

  function handlePasteOtp(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasteData) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasteData.length; i++) {
      next[i] = pasteData[i];
    }
    setOtpDigits(next);
    const joined = next.join("");
    setOtpCode(joined);
    if (pasteData.length === 6) {
      void handleVerifyOtp(joined);
    } else if (pasteData.length < 6) {
      digitRefs.current[pasteData.length]?.focus();
    }
  }

  async function handleVerifyOtp(codeToVerify?: string) {
    const code = (codeToVerify || otpCode).replace(/\D/g, "").trim();
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setWorking(true);
    setError(null);

    try {
      const verifyRes = await verifyPartnerOtpFn({
        data: { phone: cleanPhone, otp: code },
      });

      if (!verifyRes.success) {
        throw new Error("Invalid verification code. Please check or tap Resend.");
      }

      const verifiedEmail = verifyRes.email;
      const partnerDisplayName = name.trim() || `Partner ${cleanPhone.slice(-4)}`;

      setPhoneSession({
        id: "prt_" + cleanPhone,
        phone: cleanPhone,
        email: verifiedEmail,
        name: partnerDisplayName,
        role: "partner",
      });

      const hasRestaurant = Boolean((verifyRes as any)?.hasRestaurant);
      const shouldOnboard = !hasRestaurant || verifyRes.isNewUser;

      if (shouldOnboard) {
        if (typeof window !== "undefined") {
          try {
            const rawDraft = window.localStorage.getItem(ORDERKING_ONBOARDING_DRAFT_KEY);
            const prev = rawDraft ? JSON.parse(rawDraft) : {};
            window.localStorage.setItem(
              ORDERKING_ONBOARDING_DRAFT_KEY,
              JSON.stringify({
                ...prev,
                phone: cleanPhone,
                ownerName: name.trim() || prev.ownerName || "",
                name: prev.name || "",
                savedAt: new Date().toISOString(),
              })
            );
          } catch {}
        }
        window.location.assign("/onboarding");
      } else {
        window.location.assign("/dashboard");
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Verification failed. Please check the code.");
    } finally {
      setWorking(false);
    }
  }

  function handleInstantTour() {
    setPhoneSession({
      id: "prt_9395065587",
      phone: "9395065587",
      email: "partner@grandbiryani.in",
      name: "Grand Biryani House (Verified)",
      role: "partner",
    });
    window.location.assign("/dashboard");
  }

  // ── Commercial Calculator State ───────────────────────────────────────────
  const [aov, setAov] = useState(350);
  const [dailyOrders, setDailyOrders] = useState(45);
  const monthlyOrders = dailyOrders * 30;
  const monthlyGmv = monthlyOrders * aov;
  const platformCommissionPaise = Math.round(monthlyGmv * 0.20 * 100);
  const sec9_5GstPaise = Math.round(monthlyGmv * 0.05 * 100);
  const paymentGatewayPaise = Math.round(monthlyGmv * 0.0184 * 100);
  const netMonthlyPayoutPaise = Math.round(
    monthlyGmv * 100 - platformCommissionPaise - sec9_5GstPaise - paymentGatewayPaise
  );
  const netDailyPayoutPaise = Math.round(netMonthlyPayoutPaise / 30);

  // ── Interactive Facility Test-Bench State ─────────────────────────────────
  const [activeTab, setActiveTab] = useState<"kds" | "menu" | "hours" | "settlements" | "reviews" | "spark">("kds");

  // KDS Interactive State
  const [kdsPrepMinutes, setKdsPrepMinutes] = useState(20);
  const [kdsOrderStatus, setKdsOrderStatus] = useState<"PREPARING" | "READY" | "PICKED_UP">("PREPARING");
  const [kdsRiderOtp, setKdsRiderOtp] = useState("");
  const [sirenPlaying, setSirenPlaying] = useState(false);
  const [showThermalReceipt, setShowThermalReceipt] = useState(false);

  async function handleTestSiren() {
    setSirenPlaying(true);
    try {
      await ringPosAlarm(1400);
    } catch {}
    setSirenPlaying(false);
  }

  // Menu Studio Interactive State
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>("ALL");
  const [sampleDishes, setSampleDishes] = useState([
    { id: "1", name: "Special Mutton Dum Biryani", category: "Biryani", diet: "NON_VEG", price: 380, available: true, portion: "Standard 750g Handi" },
    { id: "2", name: "Murgh Tikka Butter Masala", category: "Curries", diet: "NON_VEG", price: 290, available: true, portion: "Full 4 Pcs Boneless" },
    { id: "3", name: "Paneer Butter Masala", category: "Curries", diet: "VEG", price: 240, available: true, portion: "Full 300ml Box" },
    { id: "4", name: "Garlic Butter Naan", category: "Breads", diet: "VEG", price: 60, available: true, portion: "Tandoori Fresh 2 Pcs" },
    { id: "5", name: "Shahi Firni (Clay Pot)", category: "Desserts", diet: "VEG", price: 120, available: false, portion: "Authentic Matka 150ml" },
  ]);

  function toggleDishStock(id: string) {
    setSampleDishes((prev) =>
      prev.map((d) => (d.id === id ? { ...d, available: !d.available } : d))
    );
  }

  function updateDishPrice(id: string, newPrice: number) {
    if (isNaN(newPrice) || newPrice < 10) return;
    setSampleDishes((prev) =>
      prev.map((d) => (d.id === id ? { ...d, price: newPrice } : d))
    );
  }

  const filteredDishes = useMemo(() => {
    if (menuCategoryFilter === "ALL") return sampleDishes;
    return sampleDishes.filter((d) => d.category.toUpperCase() === menuCategoryFilter.toUpperCase());
  }, [sampleDishes, menuCategoryFilter]);

  // Kitchen Hours Interactive State
  const [kitchenOnline, setKitchenOnline] = useState(true);
  const [pauseReason, setPauseReason] = useState("Kitchen Rush (High Orders)");
  const [pauseDuration, setPauseDuration] = useState("30 Minutes");

  const WEEKLY_SCHEDULE = [
    { day: "Monday", lunch: "11:30 AM - 3:30 PM", dinner: "6:30 PM - 11:00 PM", status: "Active" },
    { day: "Tuesday", lunch: "11:30 AM - 3:30 PM", dinner: "6:30 PM - 11:00 PM", status: "Active" },
    { day: "Wednesday", lunch: "11:30 AM - 3:30 PM", dinner: "6:30 PM - 11:00 PM", status: "Active" },
    { day: "Thursday", lunch: "11:30 AM - 3:30 PM", dinner: "6:30 PM - 11:00 PM", status: "Active" },
    { day: "Friday", lunch: "11:30 AM - 3:30 PM", dinner: "6:30 PM - 11:30 PM", status: "Active (Late Shift)" },
    { day: "Saturday", lunch: "11:30 AM - 4:00 PM", dinner: "6:30 PM - 11:30 PM", status: "Active (Weekend)" },
    { day: "Sunday", lunch: "11:30 AM - 4:00 PM", dinner: "6:30 PM - 11:30 PM", status: "Active (Weekend)" },
  ];

  // Settlements Interactive State
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);

  // Dispute Protection Interactive State
  const [disputeScenario, setDisputeScenario] = useState<"spill" | "missing" | "taste">("spill");

  // King Spark AI Interactive State
  const [sparkInput, setSparkInput] = useState("");
  const [sparkResponse, setSparkResponse] = useState<string | null>(null);
  const [sparkActionType, setSparkActionType] = useState<string | null>(null);
  const [sparkBusy, setSparkBusy] = useState(false);

  function runSparkQuery(query: string) {
    setSparkBusy(true);
    setSparkInput(query);
    try {
      const res = orderKingSpark.handleRestaurantQuery(query);
      setSparkResponse(res.text);
      setSparkActionType(res.actionCard?.type || null);
    } catch {
      setSparkResponse("OrderKing Spark processed request and confirmed zero merchant liability under statutory policy.");
      setSparkActionType(null);
    } finally {
      setSparkBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans flex flex-col justify-between selection:bg-red-500 selection:text-white">
      {/* 1. Header (Zomato for Business Standard) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <OrderKingMark className="size-9 text-[#E23744] transition-transform group-hover:scale-105" />
            <div>
              <div className="font-display text-xl font-black tracking-tight text-gray-900 flex items-center gap-1.5">
                <span>{branding.appName || platformConfig.brand.appName}</span>
                <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E23744]">
                  Partner
                </span>
              </div>
              <div className="text-[11px] text-gray-500 font-medium leading-none">
                Restaurant Partner Portal
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 transition-colors cursor-pointer"
            >
              <HelpCircle className="size-3.5 text-[#E23744]" />
              <span>Need Help?</span>
            </button>
            <a
              href="tel:+919395065587"
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 transition-colors"
            >
              <Headphones className="size-3.5 text-[#E23744]" />
              <span>+91 9395065587</span>
            </a>
            <button
              type="button"
              onClick={() => {
                setMode(mode === "in" ? "up" : "in");
                setError(null);
                setOtpStep("phone");
              }}
              className="text-xs font-bold text-[#E23744] hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              {mode === "in" ? "Register Restaurant" : "Partner Sign In"}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section: Operational Overview + Interactive Auth Card */}
      <section className="border-b border-gray-200 bg-white py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left 7 Columns: Operational Value & 3-Step Clear Path */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-bold text-[#E23744]">
                <Store className="size-3.5" />
                <span>Restaurant Partner Network</span>
              </div>

              <div className="space-y-3">
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-gray-900 leading-tight">
                  Partner with OrderKing to grow your restaurant business
                </h1>
                <p className="text-base text-gray-600 leading-relaxed max-w-2xl">
                  Receive online delivery orders, manage kitchen preparation in real time with our Kitchen Display System, and receive automated daily bank payouts.
                </p>
              </div>

              {/* 3 Clear Operational Steps */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-black text-[#E23744]">
                    1
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Register your restaurant</div>
                    <div className="text-xs text-gray-500">Provide outlet address, 14-digit FSSAI food license, and bank account for daily payouts.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-black text-[#E23744]">
                    2
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Configure menu &amp; operating hours</div>
                    <div className="text-xs text-gray-500">Set dish prices, veg/non-veg tags, standard preparation time (KPT), and opening timings.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-black text-[#E23744]">
                    3
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Go live &amp; receive orders</div>
                    <div className="text-xs text-gray-500">Receive live orders with acoustic siren alerts, rider pickup verification, and daily direct bank settlements.</div>
                  </div>
                </div>
              </div>

              {/* Statutory Integrity Badges */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Food Safety</div>
                  <div className="text-xs font-bold text-gray-900 mt-0.5">14-Digit FSSAI</div>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Tax Remittance</div>
                  <div className="text-xs font-bold text-gray-900 mt-0.5">Section 9(5) CGST</div>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Settlements</div>
                  <div className="text-xs font-bold text-emerald-700 mt-0.5">Daily T+1 Payouts</div>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Interactive Multi-Mode Sign-In / Register Card */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xl">
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      {mode === "up" ? "New Restaurant Registration" : "Partner Portal Sign In"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMode(mode === "in" ? "up" : "in");
                        setError(null);
                        setOtpStep("phone");
                      }}
                      className="text-xs font-bold text-[#E23744] hover:underline cursor-pointer"
                    >
                      {mode === "in" ? "Register outlet →" : "Sign in instead →"}
                    </button>
                  </div>
                  <h2 className="font-display text-2xl font-black text-gray-900">
                    {mode === "up" ? "Partner with OrderKing" : "Sign In to Your Kitchen"}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {mode === "up"
                      ? "Enter your mobile number to begin digital restaurant onboarding."
                      : "Access your live kitchen queue, menu studio, and daily settlements."}
                  </p>
                </div>

                {/* Mode Selector Tabs (Mobile OTP vs Corporate Password) */}
                {mode === "in" && (
                  <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 mb-4 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod("otp");
                        setError(null);
                      }}
                      className={`py-2 rounded-lg transition-all cursor-pointer ${
                        authMethod === "otp"
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      Mobile OTP
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod("password");
                        setError(null);
                      }}
                      className={`py-2 rounded-lg transition-all cursor-pointer ${
                        authMethod === "password"
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      Email &amp; Password
                    </button>
                  </div>
                )}

                {/* Flow A: Mobile Phone OTP Flow */}
                {authMethod === "otp" ? (
                  otpStep === "phone" ? (
                    <div className="space-y-4">
                      {mode === "up" && (
                        <div>
                          <Label htmlFor="owner-name" className="text-xs font-semibold text-gray-700">
                            Owner / Manager Full Name *
                          </Label>
                          <Input
                            id="owner-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Full name as on PAN card"
                            className="mt-1 border-gray-300 bg-white text-gray-900 h-12 text-sm focus:border-[#E23744] rounded-xl"
                          />
                        </div>
                      )}

                      <div>
                        <Label htmlFor="reg-phone" className="text-xs font-semibold text-gray-700">
                          10-Digit Mobile Number *
                        </Label>
                        <div className="relative mt-1 flex items-center">
                          <span className="absolute left-3 text-xs font-bold text-gray-500">+91</span>
                          <Input
                            id="reg-phone"
                            type="tel"
                            maxLength={10}
                            autoFocus
                            value={mobileNumber}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              setMobileNumber(val.startsWith("91") && val.length > 10 ? val.slice(2, 12) : val.slice(0, 10));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && isPhoneValid && !working) {
                                void handleSendOtp("sms");
                              }
                            }}
                            placeholder="Enter mobile number"
                            className="pl-12 border-gray-300 bg-white text-gray-900 h-12 font-mono text-base focus:border-[#E23744] rounded-xl"
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-gray-400">
                          We will send a 6-digit verification code to this phone number.
                        </p>
                      </div>

                      {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                          {error}
                        </div>
                      )}

                      <Button
                        type="button"
                        disabled={working || !isPhoneValid}
                        onClick={() => void handleSendOtp("sms")}
                        className="w-full h-12 bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-500/20 text-sm cursor-pointer transition-all"
                      >
                        {working ? <RefreshCw className="size-4 animate-spin" /> : <Phone className="size-4" />}
                        <span>Continue with OTP</span>
                      </Button>

                      <div className="pt-2 flex flex-col items-center gap-2 text-center">
                        <button
                          type="button"
                          disabled={working || !isPhoneValid}
                          onClick={() => void handleSendOtp("whatsapp")}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline cursor-pointer disabled:opacity-50"
                        >
                          <MessageCircle className="size-3.5" />
                          <span>Get OTP on WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleInstantTour}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <ChefHat className="size-3 text-[#E23744]" />
                          <span>Explore Partner Portal (Instant Verified Tour)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Step 2: OTP Verification Code with Individual 6 Digits */
                    <div className="space-y-4">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] text-gray-500">OTP dispatched to:</div>
                          <div className="text-sm font-bold text-gray-900 font-mono">+91 {cleanPhone}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpStep("phone");
                            setError(null);
                            setOtpCode("");
                            setOtpDigits(["", "", "", "", "", ""]);
                          }}
                          className="text-xs font-bold text-[#E23744] hover:underline cursor-pointer"
                        >
                          Change
                        </button>
                      </div>

                      <div>
                        <Label className="text-xs font-semibold text-gray-700 block mb-2">
                          Enter 6-Digit Verification Code
                        </Label>

                        {/* 6 Individual Digit Inputs with Auto-Advance */}
                        <div className="grid grid-cols-6 gap-2">
                          {otpDigits.map((digit, idx) => (
                            <input
                              key={idx}
                              ref={(el) => {
                                digitRefs.current[idx] = el;
                              }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              autoFocus={idx === 0}
                              value={digit}
                              onChange={(e) => handleDigitChange(idx, e.target.value)}
                              onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                              onPaste={idx === 0 ? handlePasteOtp : undefined}
                              className="w-full h-13 text-center font-mono text-xl font-bold rounded-xl border border-gray-300 bg-white text-gray-900 focus:border-[#E23744] focus:ring-2 focus:ring-red-100 outline-none transition-all"
                            />
                          ))}
                        </div>
                        <p className="mt-1 text-[11px] text-gray-400 text-center">
                          Auto-advances as you type. Paste supported.
                        </p>
                      </div>

                      {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                          {error}
                        </div>
                      )}

                      <Button
                        type="button"
                        disabled={working || otpCode.length !== 6}
                        onClick={() => void handleVerifyOtp()}
                        className="w-full h-12 bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-500/20 text-sm cursor-pointer transition-all"
                      >
                        {working ? <RefreshCw className="size-4 animate-spin" /> : <ShieldCheck className="size-5" />}
                        <span>Verify &amp; Open Portal</span>
                      </Button>

                      <div className="pt-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100">
                        <button
                          type="button"
                          disabled={working}
                          onClick={() => void handleSendOtp("whatsapp")}
                          className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          <MessageCircle className="size-3.5" />
                          <span>Send on WhatsApp</span>
                        </button>

                        {canResend ? (
                          <button
                            type="button"
                            onClick={() => void handleSendOtp("sms")}
                            className="font-bold text-[#E23744] hover:underline cursor-pointer"
                          >
                            Resend SMS
                          </button>
                        ) : (
                          <span className="font-mono text-gray-400">Resend in {countdown}s</span>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  /* Flow B: Corporate Email & Password Sign In */
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="corporate-email" className="text-xs font-semibold text-gray-700">
                        Corporate / Registered Business Email *
                      </Label>
                      <div className="relative mt-1 flex items-center">
                        <Mail className="size-4 absolute left-3 text-gray-400" />
                        <Input
                          id="corporate-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="partner@restaurant.com"
                          className="pl-10 border-gray-300 bg-white text-gray-900 h-12 text-sm focus:border-[#E23744] rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="corporate-password" className="text-xs font-semibold text-gray-700">
                          Password *
                        </Label>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMethod("otp");
                            setError("Enter your phone number to sign in via verified OTP.");
                          }}
                          className="text-[11px] font-semibold text-[#E23744] hover:underline cursor-pointer"
                        >
                          Sign in with OTP instead
                        </button>
                      </div>
                      <div className="relative mt-1 flex items-center">
                        <Lock className="size-4 absolute left-3 text-gray-400" />
                        <Input
                          id="corporate-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="pl-10 pr-10 border-gray-300 bg-white text-gray-900 h-12 text-sm focus:border-[#E23744] rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                        {error}
                      </div>
                    )}

                    <Button
                      type="button"
                      disabled={working || !email || !password}
                      onClick={() => {
                        setError("For maximum operational security, restaurant accounts use direct mobile phone OTP authentication. Switch to Mobile OTP tab to sign in.");
                      }}
                      className="w-full h-12 bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-500/20 text-sm cursor-pointer transition-all"
                    >
                      <Lock className="size-4" />
                      <span>Sign In with Password</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Step-by-Step Onboarding Walkthrough */}
      <section className="py-12 lg:py-16 bg-[#F8F9FA] border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-black text-gray-900">
              How to register your restaurant in 3 simple steps
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Complete your online registration in under 10 minutes. Go live once your FSSAI license and bank details are verified.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-[#E23744]">
                <Store className="size-5" />
              </div>
              <div className="font-display text-lg font-bold text-gray-900">
                1. Restaurant Information &amp; Location
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Enter your restaurant trade name, owner/manager contact info, street address, and pin your kitchen location on the map for rider navigation.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FileCheck2 className="size-5" />
              </div>
              <div className="font-display text-lg font-bold text-gray-900">
                2. Legal Documents &amp; Bank Details
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Provide your 14-digit FSSAI food safety license number, PAN card details, and bank account with IFSC code for automated daily T+1 payouts.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <UtensilsCrossed className="size-5" />
              </div>
              <div className="font-display text-lg font-bold text-gray-900">
                3. Menu Studio, Timings &amp; Go Live
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Upload your menu dishes with prices, set standard preparation time (KPT: 15/20/25/30m), packaging charges, and go live to receive orders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Commercial Transparency Calculator (AOV & Net Payout Math) */}
      <section className="py-12 lg:py-16 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 mb-2">
              <Calculator className="size-3.5" />
              <span>Commercial Transparency Calculator</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-gray-900">
              Calculate your restaurant earnings &amp; daily payouts
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              OrderKing operates with complete financial transparency. Zero hidden deductions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-gray-50 border border-gray-200 rounded-3xl p-6 sm:p-10">
            {/* Left 6 Cols: Sliders */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <div className="flex items-center justify-between text-sm font-bold text-gray-900 mb-2">
                  <span>Average Order Value (AOV)</span>
                  <span className="font-mono text-base text-[#E23744]">₹{aov}</span>
                </div>
                <input
                  type="range"
                  min={150}
                  max={1200}
                  step={25}
                  value={aov}
                  onChange={(e) => setAov(parseInt(e.target.value, 10))}
                  className="w-full accent-[#E23744] h-2 bg-gray-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                  <span>₹150 (Fast Food)</span>
                  <span>₹350 (Casual Dining)</span>
                  <span>₹1,200 (Fine Dining)</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm font-bold text-gray-900 mb-2">
                  <span>Estimated Orders per Day</span>
                  <span className="font-mono text-base text-[#E23744]">{dailyOrders} orders</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={250}
                  step={5}
                  value={dailyOrders}
                  onChange={(e) => setDailyOrders(parseInt(e.target.value, 10))}
                  className="w-full accent-[#E23744] h-2 bg-gray-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                  <span>10 orders/day</span>
                  <span>50 orders/day</span>
                  <span>250 orders/day</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2 text-xs text-gray-600">
                <div className="font-bold text-gray-900 flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  <span>Statutory Section 9(5) CGST Protection</span>
                </div>
                <p className="leading-relaxed">
                  As an Electronic Commerce Operator, OrderKing directly collects and remits the 5% GST to the Government. You carry zero merchant liability for GST on delivery food sales.
                </p>
              </div>
            </div>

            {/* Right 6 Cols: Mathematical Ledger Output */}
            <div className="lg:col-span-6 bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="border-b border-gray-100 pb-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Estimated Monthly Performance
                </div>
                <div className="text-2xl font-black text-gray-900 font-mono mt-0.5">
                  {formatINR(monthlyGmv * 100)} GMV
                </div>
                <div className="text-xs text-gray-500">Based on {monthlyOrders} completed orders / month</div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Monthly Gross Sales (Food Subtotal):</span>
                  <span className="font-bold text-gray-900 font-mono">{formatINR(monthlyGmv * 100)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Platform Commission (20% Base Rate):</span>
                  <span className="font-bold text-red-700 font-mono">- {formatINR(platformCommissionPaise)}</span>
                </div>

                <div className="flex justify-between text-emerald-700 bg-emerald-50/70 p-2 rounded-lg">
                  <span>5% GST Remitted to Govt under §9(5) CGST:</span>
                  <span className="font-bold font-mono">- {formatINR(sec9_5GstPaise)} (Zero Merchant Liability)</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Payment Gateway &amp; Processing (1.84%):</span>
                  <span className="font-bold text-gray-900 font-mono">- {formatINR(paymentGatewayPaise)}</span>
                </div>

                <div className="border-t-2 border-gray-200 pt-3 flex items-baseline justify-between">
                  <div>
                    <div className="text-sm font-black text-gray-900">Estimated Net Bank Settlement:</div>
                    <div className="text-[11px] text-emerald-700 font-semibold">T+1 Daily Direct NEFT/IMPS Transfer</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-emerald-700 font-mono">
                      {formatINR(netMonthlyPayoutPaise)}
                    </div>
                    <div className="text-[11px] text-gray-500 font-mono">~ {formatINR(netDailyPayoutPaise)} / day</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Live Interactive Feature Test-Bench (Explore 6 Core Facilities) */}
      <section className="py-12 lg:py-16 bg-[#F8F9FA] border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-3 py-1 text-xs font-bold text-gray-800 mb-2">
              <ChefHat className="size-3.5 text-[#E23744]" />
              <span>Interactive Operational Facility Explorer</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900">
              Test every partner feature in real time
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Click through the 6 core operational modules built for restaurant owners, kitchen managers, and chefs.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {[
              { id: "kds", label: "1. KDS & Siren Alert", icon: ClipboardList },
              { id: "menu", label: "2. Menu Studio & Stockout", icon: UtensilsCrossed },
              { id: "hours", label: "3. Operating Hours", icon: Clock },
              { id: "settlements", label: "4. Daily T+1 Payouts", icon: Banknote },
              { id: "reviews", label: "5. Dispute Protection", icon: ShieldCheck },
              { id: "spark", label: "6. King Spark AI", icon: Sparkles },
            ].map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-[#E23744] text-white shadow-md shadow-red-500/20"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: KDS & ACOUSTIC SIREN ALERT + THERMAL KOT PREVIEW */}
          {activeTab === "kds" && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="font-display text-xl font-black text-gray-900 flex items-center gap-2">
                    <ClipboardList className="size-5 text-[#E23744]" />
                    <span>Real-Time Kitchen Display System (KDS) &amp; Acoustic Siren</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Audio alerts ring on incoming orders until accepted. KPT preparation timers count down to ensure zero delivery rider wait times.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    onClick={() => setShowThermalReceipt(!showThermalReceipt)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs h-10 px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="size-4 text-gray-600" />
                    <span>{showThermalReceipt ? "Hide KOT" : "View 80mm KOT"}</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleTestSiren()}
                    disabled={sirenPlaying}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs h-10 px-4 rounded-xl flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Volume2 className="size-4" />
                    <span>{sirenPlaying ? "Sounding 880Hz Siren..." : "Test Audio Siren Alert"}</span>
                  </Button>
                </div>
              </div>

              {/* Simulated Live Order Card */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-8 rounded-2xl border-2 border-red-500/30 bg-red-50/20 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-black text-gray-900">Order #OK-8492</span>
                      <span className="bg-red-100 text-[#E23744] text-[10px] font-bold uppercase px-2 py-0.5 rounded-md">
                        Delivery Order
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-red-600 bg-white border border-red-200 px-2.5 py-1 rounded-lg">
                      ⏱ KPT: {kdsPrepMinutes} mins left
                    </span>
                  </div>

                  <div className="space-y-2 text-xs border-y border-gray-200 py-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">2x Special Mutton Dum Biryani (Non-Veg)</span>
                      <span className="font-mono font-bold text-gray-900">₹760</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">1x Murgh Tikka Butter Masala (Non-Veg)</span>
                      <span className="font-mono font-bold text-gray-900">₹290</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">2x Garlic Butter Naan (Veg)</span>
                      <span className="font-mono font-bold text-gray-900">₹120</span>
                    </div>
                    <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg font-medium">
                      Cooking Note: Extra spicy gravy, please pack curry in leakproof container.
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-600">Adjust KPT SLA:</span>
                      {[15, 20, 25, 30].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setKdsPrepMinutes(mins)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                            kdsPrepMinutes === mins
                              ? "bg-gray-900 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      {kdsOrderStatus === "PREPARING" && (
                        <Button
                          type="button"
                          onClick={() => setKdsOrderStatus("READY")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 rounded-xl font-bold cursor-pointer"
                        >
                          Mark Food Ready
                        </Button>
                      )}
                      {kdsOrderStatus === "READY" && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            maxLength={4}
                            value={kdsRiderOtp}
                            onChange={(e) => setKdsRiderOtp(e.target.value.replace(/\D/g, ""))}
                            placeholder="Rider OTP"
                            className="w-24 text-center font-mono text-xs h-9 bg-white border-gray-300"
                          />
                          <Button
                            type="button"
                            disabled={kdsRiderOtp.length !== 4}
                            onClick={() => {
                              setKdsOrderStatus("PICKED_UP");
                              setKdsRiderOtp("");
                            }}
                            className="bg-gray-900 hover:bg-black text-white text-xs h-9 px-3 rounded-xl font-bold cursor-pointer"
                          >
                            Verify Pickup
                          </Button>
                        </div>
                      )}
                      {kdsOrderStatus === "PICKED_UP" && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                          <CheckCircle2 className="size-4" /> Picked up by Rider
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4 space-y-4">
                  {/* Delivery Rider Telemetry */}
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-3 text-xs">
                    <div className="font-bold text-gray-900 text-sm">Delivery Rider Telemetry</div>
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-red-100 flex items-center justify-center font-bold text-[#E23744]">
                        RD
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">Rahul Das (Fleet Rider)</div>
                        <div className="text-[11px] text-gray-500 font-mono">AS-01-ET-8492</div>
                      </div>
                    </div>
                    <div className="space-y-1 text-gray-600 border-t border-gray-200 pt-3">
                      <div className="flex justify-between">
                        <span>Rider Distance:</span>
                        <span className="font-bold text-gray-900">0.8 km (Arriving in 3m)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transit Insurance:</span>
                        <span className="font-bold text-emerald-700">OrderKing Spillage Shield Active</span>
                      </div>
                    </div>
                  </div>

                  {/* 80mm ESC/POS Receipt Ticket Preview */}
                  {showThermalReceipt && (
                    <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-amber-50/50 p-4 font-mono text-[11px] text-gray-800 space-y-2 shadow-inner">
                      <div className="text-center font-bold pb-1 border-b border-gray-300">
                        <div>=== ORDERKING KOT ===</div>
                        <div className="text-xs">GRAND BIRYANI HOUSE</div>
                        <div className="text-[10px] text-gray-500">KOT #8492 • DELIVERY</div>
                      </div>
                      <div className="space-y-1 text-[10px]">
                        <div className="flex justify-between">
                          <span>2x Mutton Dum Biryani</span>
                          <span>760.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>1x Murgh Tikka Masala</span>
                          <span>290.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>2x Garlic Butter Naan</span>
                          <span>120.00</span>
                        </div>
                      </div>
                      <div className="border-t border-gray-300 pt-1 flex justify-between font-bold text-xs">
                        <span>TOTAL VALUE:</span>
                        <span>INR 1,170.00</span>
                      </div>
                      <div className="text-[9px] text-gray-600 border-t border-gray-300 pt-1">
                        * Note: Extra spicy gravy, leakproof container.
                      </div>
                      <div className="text-center text-[9px] text-emerald-800 font-sans font-bold bg-emerald-100/70 p-1 rounded-sm mt-1">
                        ECO Section 9(5) CGST Remitted by OrderKing
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MENU STUDIO & 1-TAP STOCKOUT */}
          {activeTab === "menu" && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="font-display text-xl font-black text-gray-900 flex items-center gap-2">
                    <UtensilsCrossed className="size-5 text-[#E23744]" />
                    <span>Menu Studio &amp; 1-Tap Stockout (06:00 AM Auto-Reset)</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Instant stockout toggles reflect on the customer app within 500 milliseconds. Items marked "Sold Out for Today" automatically turn back on at 06:00 AM next morning.
                  </p>
                </div>

                {/* Category Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {["ALL", "BIRYANI", "CURRIES", "BREADS", "DESSERTS"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setMenuCategoryFilter(cat)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        menuCategoryFilter === cat
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
                {filteredDishes.map((dish) => (
                  <div key={dish.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/70 transition-colors">
                    <div className="flex items-start gap-3">
                      <span
                        className={`size-3.5 mt-0.5 rounded-xs border-2 shrink-0 flex items-center justify-center ${
                          dish.diet === "VEG" ? "border-emerald-600" : "border-red-600"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            dish.diet === "VEG" ? "bg-emerald-600" : "bg-red-600"
                          }`}
                        />
                      </span>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{dish.name}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          {dish.category} • {dish.portion}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                      {/* Price editor */}
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>Price: ₹</span>
                        <input
                          type="number"
                          value={dish.price}
                          onChange={(e) => updateDishPrice(dish.id, parseInt(e.target.value, 10))}
                          className="w-16 h-8 text-center font-mono font-bold text-gray-900 bg-gray-50 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          dish.available
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {dish.available ? "In Stock" : "Sold Out Today"}
                      </span>
                      <Button
                        type="button"
                        onClick={() => toggleDishStock(dish.id)}
                        className={`text-xs font-bold h-9 px-3.5 rounded-xl cursor-pointer ${
                          dish.available
                            ? "bg-red-50 hover:bg-red-100 text-[#E23744] border border-red-200"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        {dish.available ? "Mark Sold Out" : "Mark In Stock"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: OPERATING HOURS & EMERGENCY SWITCH */}
          {activeTab === "hours" && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="font-display text-xl font-black text-gray-900 flex items-center gap-2">
                  <Clock className="size-5 text-[#E23744]" />
                  <span>Kitchen Availability &amp; Emergency Rush Control</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Pause incoming orders instantly during sudden rain surges, extreme kitchen load, or equipment issues without penalty.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">Live Kitchen Status</span>
                    <span
                      className={`text-xs font-black px-3 py-1 rounded-full ${
                        kitchenOnline
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {kitchenOnline ? "ONLINE • RECEIVING ORDERS" : `PAUSED (${pauseDuration.toUpperCase()})`}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    {kitchenOnline
                      ? "Your restaurant is visible to customers across your delivery radius. Live KDS queue is accepting orders."
                      : `Storefront temporarily paused due to: ${pauseReason}. Automatic resumption at end of timer.`}
                  </p>

                  <Button
                    type="button"
                    onClick={() => setKitchenOnline(!kitchenOnline)}
                    className={`w-full h-11 text-xs font-bold rounded-xl cursor-pointer ${
                      kitchenOnline
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    {kitchenOnline ? "Pause Kitchen (Toggle Offline)" : "Resume Online Operations"}
                  </Button>

                  <div className="space-y-3 pt-2">
                    <div>
                      <Label className="text-xs font-semibold text-gray-700">Pause Reason</Label>
                      <select
                        value={pauseReason}
                        onChange={(e) => setPauseReason(e.target.value)}
                        className="mt-1 w-full h-11 border border-gray-300 bg-white rounded-xl px-3 text-xs font-medium text-gray-900"
                      >
                        <option>Kitchen Rush (High Orders)</option>
                        <option>Heavy Rain &amp; Logistics Surge</option>
                        <option>Raw Material Stockout</option>
                        <option>Power / Gas Line Maintenance</option>
                        <option>Kitchen Deep Cleaning</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-gray-700">Pause Duration</Label>
                      <select
                        value={pauseDuration}
                        onChange={(e) => setPauseDuration(e.target.value)}
                        className="mt-1 w-full h-11 border border-gray-300 bg-white rounded-xl px-3 text-xs font-medium text-gray-900"
                      >
                        <option>15 Minutes</option>
                        <option>30 Minutes</option>
                        <option>1 Hour</option>
                        <option>2 Hours</option>
                        <option>Rest of the Day</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Standard Weekly Schedule Grid */}
                <div className="rounded-2xl border border-gray-200 p-5 space-y-3 bg-white">
                  <div className="font-bold text-gray-900 text-sm flex items-center justify-between">
                    <span>Standard Weekly Operating Timings</span>
                    <span className="text-[11px] text-gray-500 font-normal">Dual Shift Slots</span>
                  </div>

                  <div className="divide-y divide-gray-100 text-xs">
                    {WEEKLY_SCHEDULE.map((slot) => (
                      <div key={slot.day} className="py-2 flex items-center justify-between">
                        <span className="font-bold text-gray-800 w-24">{slot.day}</span>
                        <div className="text-[11px] text-gray-500 font-mono">
                          {slot.lunch} &bull; {slot.dinner}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {slot.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SETTLEMENTS & DAILY T+1 LEDGER */}
          {activeTab === "settlements" && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-xl font-black text-gray-900 flex items-center gap-2">
                    <Banknote className="size-5 text-[#E23744]" />
                    <span>Daily T+1 Bank Payouts &amp; Statutory Reconciliation</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Order-by-order itemized settlement slips. Funds transferred automatically to your verified bank account via NEFT/RTGS/IMPS every business day.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setShowTaxBreakdown(!showTaxBreakdown)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold h-9 px-3 rounded-xl shrink-0 cursor-pointer"
                >
                  {showTaxBreakdown ? "Hide Tax Rule" : "View §9(5) Tax Rule"}
                </Button>
              </div>

              <div className="rounded-2xl border border-gray-200 p-5 space-y-4 bg-gray-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Batch Transfer Reference: OKB-20261124-7492
                    </div>
                    <div className="text-lg font-black text-gray-900 font-mono">
                      Net Bank Transfer: ₹26,471.52
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full shrink-0">
                    <CheckCircle2 className="size-3.5" /> SETTLED • UTR: HDFC928471928374
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <div className="text-gray-500">Gross Food Sales</div>
                    <div className="font-mono font-bold text-gray-900 mt-0.5">₹36,000.00</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Restaurant Packaging Fee</div>
                    <div className="font-mono font-bold text-emerald-700 mt-0.5">+ ₹1,200.00</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Platform Fee (20%)</div>
                    <div className="font-mono font-bold text-red-700 mt-0.5">- ₹7,440.00</div>
                  </div>
                  <div>
                    <div className="text-gray-500">GST §9(5) Remitted to Govt</div>
                    <div className="font-mono font-bold text-emerald-700 mt-0.5">
                      - ₹1,860.00 <span className="text-[10px]">(0 Tax to Pay)</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Payment Gateway (1.84%)</div>
                    <div className="font-mono font-bold text-gray-700 mt-0.5">- ₹684.48</div>
                  </div>
                  <div>
                    <div className="text-gray-500">TDS u/s 194-O (1%)</div>
                    <div className="font-mono font-bold text-gray-700 mt-0.5">- ₹372.00</div>
                  </div>
                  <div>
                    <div className="text-gray-500">TCS u/s 52 (1%)</div>
                    <div className="font-mono font-bold text-gray-700 mt-0.5">- ₹372.00</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Credited to Bank Account</div>
                    <div className="font-mono font-black text-emerald-700 mt-0.5">HDFC Bank ••••••4920</div>
                  </div>
                </div>

                {showTaxBreakdown && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1 mt-2">
                    <div className="font-bold">Statutory Section 9(5) CGST Rule for Restaurants:</div>
                    <p className="leading-relaxed">
                      Under Notification No. 17/2021 - Central Tax (Rate), Electronic Commerce Operators like OrderKing are mandated to pay GST on restaurant delivery services. As a restaurant partner, you do not need to report or pay GST on these orders. OrderKing directly files GSTR-3B and remits the 5% tax.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: DISPUTE & SPILLAGE LIABILITY PROTECTION */}
          {activeTab === "reviews" && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-xl font-black text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="size-5 text-[#E23744]" />
                    <span>Customer Reviews &amp; Spillage Liability Protection</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    OrderKing protects restaurant partners against delivery damage. Spillage during transit is covered 100% by platform delivery liability.
                  </p>
                </div>

                {/* Scenario switcher */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setDisputeScenario("spill")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      disputeScenario === "spill" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500"
                    }`}
                  >
                    1. Transit Spill
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisputeScenario("missing")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      disputeScenario === "missing" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500"
                    }`}
                  >
                    2. Missing Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisputeScenario("taste")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      disputeScenario === "taste" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500"
                    }`}
                  >
                    3. Taste Complaint
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 p-5 space-y-4 bg-gray-50/50">
                {disputeScenario === "spill" && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-mono font-bold text-gray-900">Dispute Claim #DISP-9842 (Order #OK-7192)</div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                        Protected • Zero Deduction
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5 text-gray-700">
                      <p>
                        <strong className="text-gray-900">Customer Claim:</strong> "Gravy container opened and spilled inside delivery bag during bike transit."
                      </p>
                      <p>
                        <strong className="text-gray-900">OrderKing Policy Arbitration:</strong> Food container was securely sealed with restaurant tape upon kitchen handover. Spillage occurred due to vehicle transit deceleration.
                      </p>
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium">
                        Arbitration Result: 100% Logistics Liability. ₹0 deducted from restaurant payout. Full order value credited to partner bank settlement.
                      </div>
                    </div>
                  </>
                )}

                {disputeScenario === "missing" && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-mono font-bold text-gray-900">Dispute Claim #DISP-9843 (Order #OK-7195)</div>
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                        Merchant Adjustment • ₹60.00
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5 text-gray-700">
                      <p>
                        <strong className="text-gray-900">Customer Claim:</strong> "1x Garlic Butter Naan missing from parcel."
                      </p>
                      <p>
                        <strong className="text-gray-900">OrderKing Policy Arbitration:</strong> KOT packing checklist showed Naan was not checked off by kitchen station. Item cost refunded to customer.
                      </p>
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-medium">
                        Arbitration Result: Merchant Liability for missing dish only. ₹60 deducted from settlement with 5% GST adjustment (-₹3.00 GST reversal).
                      </div>
                    </div>
                  </>
                )}

                {disputeScenario === "taste" && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-mono font-bold text-gray-900">Dispute Claim #DISP-9844 (Order #OK-7201)</div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                        Customer Claim Rejected • Zero Deduction
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5 text-gray-700">
                      <p>
                        <strong className="text-gray-900">Customer Claim:</strong> "Biryani wasn't spicy enough for my personal taste."
                      </p>
                      <p>
                        <strong className="text-gray-900">OrderKing Policy Arbitration:</strong> Dish was prepared to standard restaurant recipe without specific customer instructions. Subjective taste preferences do not qualify for refund.
                      </p>
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium">
                        Arbitration Result: Platform Rejected. ₹0 deducted from restaurant. Merchant payout 100% protected.
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: KING SPARK AI (ZOMATO SPARK 1:1 PARITY) */}
          {activeTab === "spark" && (
            <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-xl font-black text-gray-900 flex items-center gap-2">
                    <Sparkles className="size-5 text-[#E23744]" />
                    <span>King Spark AI Partner Assistant (Zomato Spark Parity)</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Autonomous AI assistant for dispute arbitration, dynamic pricing recommendations, menu combos, and daily shift reconciliation.
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full shrink-0">
                  Spark 24/7 Engine Active
                </span>
              </div>

              {/* Quick Prompt Pills */}
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { label: "Arbitrate Spillage Claim", query: "Arbitrate food spillage claim" },
                  { label: "Daily Shift Closing Recon", query: "shift recon" },
                  { label: "Optimize Pricing for Biryani", query: "Optimize pricing for Mutton Dum Biryani" },
                  { label: "Generate Lunch Meal Combos", query: "Generate high-margin combos for lunch" },
                  { label: "Audit Late Food Prep Anomalies", query: "Kitchen prep SLA anomalies" },
                  { label: "Explain Section 9(5) CGST", query: "How does Section 9(5) CGST work?" },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => runSparkQuery(p.query)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Spark Response Console */}
              <div className="rounded-2xl border border-gray-200 bg-gray-900 text-gray-100 p-5 space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between text-gray-400 text-[11px] border-b border-gray-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-amber-400" />
                    <span>King Spark Intelligence Response</span>
                  </span>
                  <span>{sparkBusy ? "Processing..." : "Ready"}</span>
                </div>

                <div className="whitespace-pre-wrap leading-relaxed text-gray-200 max-h-72 overflow-y-auto">
                  {sparkResponse || (
                    <span className="text-gray-400 font-sans">
                      Select any quick prompt above or type a query to test King Spark AI partner operations in real time.
                    </span>
                  )}
                </div>

                {/* Structured Action Cards Rendered Below Text */}
                {sparkActionType === "menu_intelligence" && (
                  <div className="rounded-xl bg-gray-800 border border-gray-700 p-3.5 text-xs text-gray-100 space-y-2">
                    <div className="flex items-center justify-between font-bold text-emerald-400">
                      <span>Dynamic Pricing Recommendation</span>
                      <span>Projected Margin: +62%</span>
                    </div>
                    <div className="text-gray-300">
                      Adjust Special Mutton Dum Biryani from ₹380 to ₹410. Local demand elasticity indicates zero volume drop with +₹30 pure margin expansion.
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        updateDishPrice("1", 410);
                        alert("Price updated to ₹410 for Special Mutton Dum Biryani!");
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 rounded-lg"
                    >
                      Apply Recommended Price (₹410)
                    </Button>
                  </div>
                )}

                {sparkActionType === "dispute_arbitration" && (
                  <div className="rounded-xl bg-gray-800 border border-emerald-500/40 p-3.5 text-xs text-gray-100 space-y-2">
                    <div className="flex items-center justify-between font-bold text-emerald-400">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="size-4" /> 100% Logistics Liability Confirmed
                      </span>
                      <span>₹0 Merchant Deduction</span>
                    </div>
                    <div className="text-gray-300">
                      In-transit spillage covered under OrderKing Delivery Logistics Insurance. ₹0 deducted from partner settlement.
                    </div>
                  </div>
                )}
              </div>

              {/* Spark Input Box */}
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={sparkInput}
                  onChange={(e) => setSparkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && sparkInput.trim()) {
                      runSparkQuery(sparkInput.trim());
                    }
                  }}
                  placeholder="Ask Spark AI (e.g. 'How does Section 9(5) CGST work?' or 'Suggest high-margin dinner combo')"
                  className="bg-white border-gray-300 text-gray-900 text-xs h-11"
                />
                <Button
                  type="button"
                  disabled={!sparkInput.trim() || sparkBusy}
                  onClick={() => runSparkQuery(sparkInput.trim())}
                  className="bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold text-xs h-11 px-4 rounded-xl cursor-pointer"
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 6. Documents Required Checklist */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-black text-gray-900">
              Documents required to register your restaurant
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Keep these details ready for fast digital verification and immediate activation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-2">
              <div className="text-xs font-bold text-[#E23744]">1. FSSAI License</div>
              <div className="text-xs font-semibold text-gray-900">14-Digit Food License</div>
              <p className="text-[11px] text-gray-500">Valid registration or state license certificate number.</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-2">
              <div className="text-xs font-bold text-[#E23744]">2. Bank Account</div>
              <div className="text-xs font-semibold text-gray-900">Account No &amp; IFSC</div>
              <p className="text-[11px] text-gray-500">Current or Savings account for daily T+1 automated payouts.</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-2">
              <div className="text-xs font-bold text-[#E23744]">3. PAN Card</div>
              <div className="text-xs font-semibold text-gray-900">Restaurant / Owner PAN</div>
              <p className="text-[11px] text-gray-500">Permanent Account Number matching bank account details.</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-2">
              <div className="text-xs font-bold text-[#E23744]">4. GSTIN / Exemption</div>
              <div className="text-xs font-semibold text-gray-900">GST Registration</div>
              <p className="text-[11px] text-gray-500">15-digit GSTIN, or turnover &lt; ₹20L exemption declaration.</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-2">
              <div className="text-xs font-bold text-[#E23744]">5. Menu Copy</div>
              <div className="text-xs font-semibold text-gray-900">Dishes &amp; Prices</div>
              <p className="text-[11px] text-gray-500">List of food items, prices in ₹, and veg/non-veg tags.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Operational Frequently Asked Questions (FAQ) */}
      <section className="py-12 bg-[#F8F9FA] border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-black text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Straightforward operational details for restaurant owners.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-1.5 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900">How long does it take for my restaurant to go live?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Once you submit your 14-digit FSSAI license and bank details during onboarding, document verification takes 24 to 48 hours. Once verified, your kitchen status can be toggled Online immediately.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-1.5 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900">When and how do I receive payouts for completed orders?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Settlements are processed on a daily T+1 schedule directly into your registered bank account via NEFT/RTGS/IMPS. You can view order-by-order itemized settlement ledgers in the Settlements tab.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-1.5 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900">How is GST handled under Section 9(5) CGST?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                For online restaurant food deliveries, OrderKing is legally classified as an Electronic Commerce Operator (ECO) under Section 9(5) of the CGST Act. OrderKing directly collects and remits the 5% GST on food sales to the Government. Restaurant partners carry no GST liability for online orders.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-1.5 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900">Can I pause incoming orders if my kitchen gets overloaded?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Yes. You can toggle your kitchen offline with a single tap from the dashboard or Kitchen Display System. You can select pause durations such as 30 minutes, 1 hour, or until the next shift.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-1.5 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900">What happens if an order spills or is damaged during transit?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                OrderKing provides delivery liability protection. In-transit spillage is classified as a logistics delivery fault. ₹0 is deducted from the restaurant's payout as long as containers are securely sealed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Statutory Compliance Footer */}
      <footer className="bg-white py-6 border-t border-gray-200 text-xs text-gray-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <OrderKingMark className="size-5 text-[#E23744]" />
            <span className="font-bold text-gray-900">OrderKing Restaurant Partner Portal</span>
          </div>
          <div className="text-center sm:text-right">
            <div>Order King Foods Private Limited • GSTIN: 18AFXPH9838M1Z9 • Assam - 788710</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Section 9(5) CGST Compliance • SAC 996331 Restaurant Services</div>
          </div>
        </div>
      </footer>

      {/* 9. "Need Help Signing In?" Drawer / Modal */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-display text-lg font-black text-gray-900 flex items-center gap-2">
                <HelpCircle className="size-5 text-[#E23744]" />
                <span>Partner Login Assistance</span>
              </h3>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                <div className="font-bold text-gray-900">1. Did your registered phone number change?</div>
                <p>Submit your outlet GSTIN and 14-digit FSSAI certificate to our merchant verification team to update your primary login phone.</p>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                <div className="font-bold text-gray-900">2. Delay in receiving SMS OTP?</div>
                <p>Use the "Get OTP on WhatsApp" button for instant delivery over data connection.</p>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                <div className="font-bold text-gray-900">3. Multi-Outlet Corporate Accounts</div>
                <p>If you manage multiple kitchen locations under a brand, use your primary registered mobile number to access all connected outlets.</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2">
              <a
                href="tel:+919395065587"
                className="w-full h-11 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <Phone className="size-4" />
                <span>Call Partner Helpline: +91 9395065587</span>
              </a>
              <a
                href="https://wa.me/919395065587?text=Hello%20OrderKing%20Partner%20Support,%20I%20need%20assistance%20logging%20into%20my%20restaurant%20portal."
                target="_blank"
                rel="noreferrer"
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <MessageCircle className="size-4" />
                <span>Chat on WhatsApp Support</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
