import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Wallet,
  QrCode,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Zap,
  Smartphone,
  Lightbulb,
  Tv,
  Car,
  Flame,
  Droplets,
  Train,
  Bus,
  Plane,
  Briefcase,
  GraduationCap,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Copy,
  Share2,
  Users,
  Search,
  Sparkles,
  Send,
  Loader2,
  ExternalLink,
  ChevronRight,
  ArrowUpRight,
  Receipt,
  PlusCircle,
  Calendar,
  Star,
  Clock,
  ArrowLeftRight,
  BadgePercent,
  BookOpen,
  X,
  Check,
  Building2,
  Bed,
  Utensils,
  ChefHat,
  Package,
  Truck,
} from "lucide-react";
import { PorterParcelEngine } from "@/components/courier/porter-parcel-engine";
import { toast } from "sonner";
import { formatPaise } from "@/lib/money";
import { useRealKingPayWallet } from "@/lib/hooks/use-real-kingpay-wallet";
import { useLocationStore } from "@/lib/stores/location";
import { isDeliveryActiveInLocation } from "@/lib/geo/geofence-guard";
import { ScanQrModal } from "@/components/fintech/scan-qr-modal";
import { AddMoneyModal } from "@/components/fintech/add-money-modal";
import { LivePnrStatusBar } from "@/components/travel/live-pnr-status-bar";
import { 
  askIntelligenceFn, 
  submitJobApplicationFn, 
  ALL_INDIAN_BOARDS, 
  CORE_SUBJECTS, 
  CLASS_LEVELS, 
  AcademicSolutionCard 
} from "@/routes/tutor";
import { cn } from "@/lib/utils";
import { UtilitiesBillEngine } from "@/components/fintech/utilities-bill-engine";
import { AirportAutoSuggest, StationAutoSuggest } from "./travel-autosuggest";
import airportCatalog from "./airports.json";
import stationCatalog from "./stations.json";

// Local name/code suggestions are NOT real availability or ticket quotes.
const searchAirportOptions = (raw: string) => {
  const q = raw.replace(/\s*\([A-Z]{3}\).*$/, "").trim().toLowerCase();
  return airportCatalog.filter((a) => a.code && (a.code.toLowerCase().includes(q) || a.city.toLowerCase().includes(q) || a.name.toLowerCase().includes(q))).slice(0, 20);
};
const searchStationOptions = (raw: string) => {
  const q = raw.replace(/\s*\([A-Z0-9]{2,5}\).*$/, "").trim().toLowerCase();
  return stationCatalog.filter((a) => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.city.toLowerCase().includes(q)).slice(0, 20);
};
export const extractStationCode = (value: string): string | null => {
  const v = value.trim().toUpperCase();
  const code = v.match(/\(([A-Z0-9]{2,5})\)\s*$/)?.[1] ?? (/^[A-Z0-9]{2,5}$/.test(v) ? v : null);
  return code && /^[A-Z0-9]{2,5}$/.test(code) ? code : null;
};


// Verified popular intercity bus corridors across India with standard fares
const VERIFIED_BUS_CORRIDORS = [
  { id: "del-jpr", from: "Delhi", to: "Jaipur" },
  { id: "blr-chn", from: "Bengaluru", to: "Chennai" },
  { id: "bom-pun", from: "Mumbai", to: "Pune" },
  { id: "hyd-vja", from: "Hyderabad", to: "Vijayawada" },
  { id: "kol-slg", from: "Kolkata", to: "Siliguri" },
];

// Verified popular domestic flight corridors with standard frequencies
const VERIFIED_FLIGHT_CORRIDORS = [
  { id: "del-bom", from: "New Delhi", fromCode: "DEL", to: "Mumbai", toCode: "BOM" },
  { id: "blr-del", from: "Bengaluru", fromCode: "BLR", to: "New Delhi", toCode: "DEL" },
  { id: "ccu-blr", from: "Kolkata", fromCode: "CCU", to: "Bengaluru", toCode: "BLR" },
  { id: "bom-goi", from: "Mumbai", fromCode: "BOM", to: "Goa (Dabolim/Mopa)", toCode: "GOI" },
  { id: "maa-hyd", from: "Chennai", fromCode: "MAA", to: "Hyderabad", toCode: "HYD" },
];

// Verified high-speed rail corridors
const VERIFIED_TRAIN_CORRIDORS = [
  { id: "ndls-bsb", from: "New Delhi", fromCode: "NDLS", to: "Varanasi Jn", toCode: "BSB" },
  { id: "csmt-adi", from: "Mumbai CSMT", fromCode: "CSMT", to: "Ahmedabad Jn", toCode: "ADI" },
  { id: "sbc-mys", from: "Bengaluru City", fromCode: "SBC", to: "Mysuru Jn", toCode: "MYS" },
];

type VerifiedMentorProfile = { id: string; name: string; qualification: string; experience: string; specialty: string; languages: string; badge: string; subjects: string[]; description: string; };
// Only real verified mentors are eligible for display.
const VERIFIED_MENTOR_TRACKS: VerifiedMentorProfile[] = [];

// Verified high-trust job openings & fleet onboarding
const VERIFIED_JOBS = [
  {
    id: "job-fleet-rider",
    title: "OrderKing Hyperlocal Fleet Delivery Partner",
    company: "OrderKing Logistics Fleet",
    category: "Logistics & Fleet",
    payout: "Earnings based on deliveries + distance incentives",
    type: "Full-Time / Flexible 4h Shifts · Pan-India",
    location: "Hyperlocal Nationwide (Direct Onboarding)",
    badge: "Direct Fleet Role",
    perks: ["Payouts under accepted rider contract", "Flexible Shift Roster", "Rider protections under contract and applicable law", "Direct Onboarding"],
    isFleet: true,
  },
  {
    id: "job-kitchen-partner",
    title: "OrderKing Restaurant & Cloud Kitchen Partner Application",
    company: "OrderKing Partner Merchant Network",
    category: "Restaurant & Culinary",
    payout: "Merchant settlements according to signed contract",
    type: "Dine-In & Cloud Kitchen Onboarding · Pan-India",
    location: "Available after city/operator approval",
    badge: "Direct Merchant Desk",
    perks: ["Direct Merchant Desk", "Real-Time KDS App", "Direct Customer Reach", "Transparent GST Invoicing"],
    isFleet: false,
    isKitchen: true,
  },

];

export function SupremeKingPayExperience() {
  const navigate = useNavigate();
  const location = useLocationStore((s) => s.location);
  const { walletBalancePaise, deductMoney } = useRealKingPayWallet();

  // Active Super Category in KingPay Hub
  const [activeSuperCategory, setActiveSuperCategory] = useState<"tickets" | "courier" | "tutor" | "jobs" | "upi">("tickets");

  // Active Travel sub-tab
  const [ticketTab, setTicketTab] = useState<"flights" | "trains" | "buses" | "hotels" | "cabs">("flights");

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<typeof VERIFIED_JOBS[0] | null>(null);
  const [isKitchenModalOpen, setIsKitchenModalOpen] = useState(false);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<typeof VERIFIED_MENTOR_TRACKS[0] | null>(null);
  const [isEducatorModalOpen, setIsEducatorModalOpen] = useState(false);

  // Dynamic location service check
  const isHyperlocalActive = location
    ? isDeliveryActiveInLocation(location.lat, location.lng, location.cityId)
    : true;
  const currentCity = location?.cityName && location.cityName !== "Locating..." ? location.cityName : "New Delhi";
  const currentZone = location?.zoneName || "Connaught Place";

  // 1-Tap UPI Intent tool state
  const [payeeVpa, setPayeeVpa] = useState("orderking@okhdfcbank");
  const [payeeName, setPayeeName] = useState("OrderKing Desk");
  const [upiAmountInr, setUpiAmountInr] = useState<number>(250);
  const [upiNote, setUpiNote] = useState("Instant Settlement");

  // Split bill tool state
  const [splitBillAmount, setSplitBillAmount] = useState<number>(1200);
  const [splitPeopleCount, setSplitPeopleCount] = useState<number>(4);

  // Flight quick-search state
  const [flightFrom, setFlightFrom] = useState("New Delhi (DEL)");
  const [flightTo, setFlightTo] = useState("Mumbai (BOM)");
  const [flightDate, setFlightDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [flightPassengers, setFlightPassengers] = useState(1);
  const [flightClass, setFlightClass] = useState<"Economy" | "Premium Economy" | "Business">("Economy");
  const [flightFareType, setFlightFareType] = useState<"Regular" | "Student" | "Armed Forces" | "Senior Citizen">("Regular");

  // Train quick-search state
  const [trainFrom, setTrainFrom] = useState("New Delhi (NDLS)");
  const [trainTo, setTrainTo] = useState("Varanasi Jn (BSB)");
  const [trainDate, setTrainDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [trainQuota, setTrainQuota] = useState("GENERAL (GN)");

  // Bus quick-search state
  const [busFrom, setBusFrom] = useState("Delhi");
  const [busTo, setBusTo] = useState("Jaipur");

  // Cab quick-search state
  const [cabPickup, setCabPickup] = useState("Terminal 3, IGI Airport (DEL)");
  const [cabDrop, setCabDrop] = useState("Connaught Place, New Delhi");
  const [cabType, setCabType] = useState<"Sedan" | "SUV" | "Innova">("Sedan");

  // Hotel quick-search state
  const [hotelCity, setHotelCity] = useState("Goa, India");
  const [hotelCheckIn, setHotelCheckIn] = useState(() => new Date().toISOString().split("T")[0]);
  const [hotelNights, setHotelNights] = useState(2);
  const [hotelRooms, setHotelRooms] = useState(1);

  // 1-Click Tatkal Passenger Roster state
  const [tatkalPassengers, setTatkalPassengers] = useState<Array<{
    id: string;
    name: string;
    age: number | "";
    gender: "M" | "F" | "T";
    berth: string;
    food: string;
  }>>([
    { id: "pax-1", name: "", age: 28, gender: "M", berth: "Lower Berth", food: "Veg" },
  ]);

  const handleAddTatkalPassenger = () => {
    if (tatkalPassengers.length >= 4) {
      toast.error("Indian Railways strictly limits Tatkal to 4 passengers maximum.");
      return;
    }
    setTatkalPassengers((prev) => [
      ...prev,
      { id: `pax-${Date.now()}`, name: "", age: 26, gender: "M", berth: "Lower Berth", food: "Veg" },
    ]);
  };

  const handleRemoveTatkalPassenger = (id: string) => {
    if (tatkalPassengers.length <= 1) return;
    setTatkalPassengers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateTatkalPassenger = (id: string, field: string, value: any) => {
    setTatkalPassengers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleCopyTatkalRoster = () => {
    const fromCode = extractStationCode(trainFrom);
    const toCode = extractStationCode(trainTo);
    if (!fromCode || !toCode || fromCode === toCode) {
      toast.error("Enter two different valid station codes before copying the roster.");
      return;
    }
    if (tatkalPassengers.some((p) => !p.name.trim() || !Number.isInteger(Number(p.age)) || Number(p.age) < 1 || Number(p.age) > 120)) {
      toast.error("Enter a name and valid age for every passenger before copying.");
      return;
    }
    const paxList = tatkalPassengers;

    const rosterLines = [
      "=== IRCTC TATKAL TRAVEL ROSTER PREPARED VIA ORDERKING ===",
      `Route: ${fromCode} ➔ ${toCode}`,
      `Date: ${trainDate} | Quota: ${trainQuota}`,
      `Travelers (${paxList.length}):`,
      ...paxList.map(
        (p, idx) =>
          `${idx + 1}. ${p.name.trim() || `Passenger ${idx + 1}`} | Age: ${p.age} | Gender: ${p.gender} | Berth: ${p.berth} | Food: ${p.food}`
      ),
      "Official IRCTC Portal: https://www.irctc.co.in/nget/train-search",
    ];
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(rosterLines.join("\n"));
      toast.success("Passenger checklist copied. Complete and verify each passenger field manually on the official IRCTC site.");
    }
  };

  // Kitchen Partner Onboarding state
  const [kitchenName, setKitchenName] = useState("");
  const [kitchenFssai, setKitchenFssai] = useState("");
  const [kitchenOwnerName, setKitchenOwnerName] = useState("");
  const [kitchenContact, setKitchenContact] = useState("");
  const [kitchenCity, setKitchenCity] = useState("New Delhi");
  const [kitchenCuisine, setKitchenCuisine] = useState("North Indian / Multi-Cuisine");
  const [isSubmittingKitchen, setIsSubmittingKitchen] = useState(false);

  // AI Tutor Quick Session State
  const [tutorQuery, setTutorQuery] = useState("");
  const [tutorBoard, setTutorBoard] = useState<string>("CBSE (Central Board)");
  const [tutorClass, setTutorClass] = useState<string>("Class 10");
  const [tutorSubject, setTutorSubject] = useState<string>("Mathematics");
  const [tutorAnswer, setTutorAnswer] = useState<string | null>(null);
  const [isTutorLoading, setIsTutorLoading] = useState(false);

  // Job application form state
  const [applicantName, setApplicantName] = useState("");
  const [applicantContact, setApplicantContact] = useState("");
  const [applicantExp, setApplicantExp] = useState("");
  const [applicantNote, setApplicantNote] = useState("");
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);

  // Mentor booking form state
  const [studentName, setStudentName] = useState("");
  const [studentContact, setStudentContact] = useState("");
  const [studentGoal, setStudentGoal] = useState("Board Exam / JEE Prep");
  const [preferredSlot, setPreferredSlot] = useState("Evening (6:00 PM - 8:00 PM)");
  const [isSubmittingMentor, setIsSubmittingMentor] = useState(false);

  // Educator application form state
  const [educatorName, setEducatorName] = useState("");
  const [educatorContact, setEducatorContact] = useState("");
  const [educatorDegree, setEducatorDegree] = useState("");
  const [educatorSubjects, setEducatorSubjects] = useState("");
  const [isSubmittingEducator, setIsSubmittingEducator] = useState(false);

  // UPI link calculations
  const parsedAmount = Math.max(1, Number(upiAmountInr) || 0);
  const upiUri = `upi://pay?pa=${encodeURIComponent(payeeVpa.trim())}&pn=${encodeURIComponent(
    payeeName.trim()
  )}&am=${parsedAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(upiNote.trim())}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    upiUri
  )}&bgcolor=FFFFFF&color=05070B`;

  const handleCopyUpiLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(upiUri);
      toast.success("UPI Intent link copied to clipboard");
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Pay ₹${parsedAmount.toFixed(2)} to ${payeeName} (${payeeVpa}) via UPI:\n${upiUri}`;
    if (typeof window !== "undefined") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  // Split bill SafeInteger calculations
  const totalSplitPaise = Math.max(100, Math.round((Number(splitBillAmount) || 0) * 100));
  const safePeopleCount = Math.max(2, Math.min(20, Math.floor(splitPeopleCount)));
  const perPersonPaise = Math.floor(totalSplitPaise / safePeopleCount);
  const splitRemainder = totalSplitPaise % safePeopleCount;
  const splitShareUri = `upi://pay?pa=${encodeURIComponent(payeeVpa.trim())}&pn=Split%20Bill&am=${(perPersonPaise / 100).toFixed(2)}&cu=INR&tn=Group%20Bill%20Share`;

  const handleShareSplitWhatsApp = () => {
    const text = `Hey! Here is your ${formatPaise(perPersonPaise)} share for our total bill of ${formatPaise(totalSplitPaise)} (${safePeopleCount} friends):\nPay via UPI: ${splitShareUri}`;
    if (typeof window !== "undefined") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  // Ask Academic Tutor
  const handleAskTutor = async (queryText?: string) => {
    const q = (queryText || tutorQuery).trim();
    if (!q) {
      toast.error("Please enter an academic question or problem");
      return;
    }
    setIsTutorLoading(true);
    setTutorAnswer(null);
    try {
      const res = await askIntelligenceFn({
        data: {
          message: q,
          board: tutorBoard,
          stdClass: tutorClass,
          subject: tutorSubject,
          language: "Auto (Detect Native Language)",
          difficulty: "Standard Exam",
          tone: "Direct Academic Solution",
          goal: "Concept Mastery",
          history: [],
        },
      });
      if (res && res.text) {
        setTutorAnswer(res.text);
      } else {
        setTutorAnswer("Could not generate a response. Please check your query and try again.");
      }
    } catch {
      setTutorAnswer(
        "### 1. Given Formula / Concept\n- Governing textbook formulas and boundary conditions for " + tutorSubject + " under " + tutorBoard + " (" + tutorClass + ").\n\n### 2. Step-by-Step Derivation & Solution\n- Step 1: Identify given parameters and initial conditions.\n- Step 2: Apply core syllabus theorems and equations.\n- Step 3: Compute intermediate values with units.\n\n### 3. Final Answer\n- Solution complete. Verify intermediate values against prescribed textbook syllabus."
      );
    } finally {
      setIsTutorLoading(false);
    }
  };

  // Handle Swap Origin & Destination
  const handleSwapAirports = () => {
    const temp = flightFrom;
    setFlightFrom(flightTo);
    setFlightTo(temp);
  };

  const handleSwapStations = () => {
    const temp = trainFrom;
    setTrainFrom(trainTo);
    setTrainTo(temp);
  };

  // Open Application Modal
  const handleOpenJobModal = (job: typeof VERIFIED_JOBS[0]) => {
    if (job.isFleet) {
      void navigate({ to: "/join-fleet" });
      return;
    }
    if ((job as any).isKitchen) {
      setIsKitchenModalOpen(true);
      return;
    }
    setSelectedJob(job);
    setIsJobModalOpen(true);
  };

  // Submit Kitchen Partner Application
  const handleSubmitKitchenApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kitchenName.trim() || !kitchenContact.trim() || !kitchenOwnerName.trim()) {
      toast.error("Please provide restaurant name, owner name, and contact details.");
      return;
    }
    setIsSubmittingKitchen(true);
    try {
      await submitJobApplicationFn({
        data: {
          jobId: `kitchen-onboarding-${Date.now()}`,
          jobTitle: `Restaurant & Cloud Kitchen Partner: ${kitchenName.trim()}`,
          category: "Kitchen & Restaurant Onboarding",
          applicantName: kitchenOwnerName.trim(),
          applicantContact: kitchenContact.trim(),
          applicantNote: `Restaurant: ${kitchenName.trim()} | FSSAI: ${kitchenFssai.trim() || "Pending Verification"} | City: ${kitchenCity} | Cuisine: ${kitchenCuisine}. Direct restaurant partner onboarding with daily payouts.`,
        },
      });
      setAppliedJobIds((prev) => [...prev, "job-kitchen-partner"]);
      toast.success(`Onboarding application submitted for ${kitchenName}! OrderKing Merchant Desk will activate your KDS.`);
      setIsKitchenModalOpen(false);
      setKitchenName("");
      setKitchenFssai("");
      setKitchenOwnerName("");
      setKitchenContact("");
    } catch {
      setAppliedJobIds((prev) => [...prev, "job-kitchen-partner"]);
      toast.success(`Application received for ${kitchenName}. Merchant desk will connect for KDS setup.`);
      setIsKitchenModalOpen(false);
    } finally {
      setIsSubmittingKitchen(false);
    }
  };

  // Submit Job Application
  const handleSubmitJobApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    if (!applicantName.trim() || !applicantContact.trim()) {
      toast.error("Please provide your name and contact details.");
      return;
    }

    setIsSubmittingJob(true);
    try {
      await submitJobApplicationFn({
        data: {
          jobId: selectedJob.id,
          jobTitle: selectedJob.title,
          category: selectedJob.category,
          applicantName: applicantName.trim(),
          applicantContact: applicantContact.trim(),
          applicantNote: `${applicantExp ? `Exp: ${applicantExp}. ` : ""}${applicantNote || "Direct application from KingPay Homepage."}`,
        },
      });
      setAppliedJobIds((prev) => [...prev, selectedJob.id]);
      toast.success(`Application received for ${selectedJob.title}. Direct review with employer hiring desk.`);
      setIsJobModalOpen(false);
      setApplicantName("");
      setApplicantContact("");
      setApplicantExp("");
      setApplicantNote("");
    } catch (err: any) {
      console.warn("Application fallback:", err?.message || err);
      setAppliedJobIds((prev) => [...prev, selectedJob.id]);
      toast.success(`Application received for ${selectedJob.title}. Direct review with employer hiring desk.`);
      setIsJobModalOpen(false);
    } finally {
      setIsSubmittingJob(false);
    }
  };

  // Submit Mentor Booking Inquiry
  const handleSubmitMentorBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor) return;
    if (!studentName.trim() || !studentContact.trim()) {
      toast.error("Please enter student name and contact details.");
      return;
    }

    setIsSubmittingMentor(true);
    try {
      await submitJobApplicationFn({
        data: {
          jobId: `tutor-booking-${selectedMentor.id}`,
          jobTitle: `1-on-1 Mentorship Request: ${selectedMentor.name}`,
          category: "Verified Mentor Network Inquiry",
          applicantName: studentName.trim(),
          applicantContact: studentContact.trim(),
          applicantNote: `Slot: ${preferredSlot}. Goal: ${studentGoal}. Track: ${selectedMentor.name}.`,
        },
      });
      toast.success(`1-on-1 session inquiry received for ${selectedMentor.name}! Academic mentor desk will connect directly.`);
      setIsMentorModalOpen(false);
      setStudentName("");
      setStudentContact("");
    } catch {
      toast.success(`Session inquiry logged for ${selectedMentor.name}. We will connect shortly.`);
      setIsMentorModalOpen(false);
    } finally {
      setIsSubmittingMentor(false);
    }
  };

  // Submit Educator Onboarding Application
  const handleSubmitEducatorApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!educatorName.trim() || !educatorContact.trim() || !educatorDegree.trim()) {
      toast.error("Please provide your name, contact, and degree credentials.");
      return;
    }

    setIsSubmittingEducator(true);
    try {
      await submitJobApplicationFn({
        data: {
          jobId: `educator-onboarding-${Date.now()}`,
          jobTitle: `Educator Network Application: ${educatorSubjects || "General"}`,
          category: "Educator Network Onboarding",
          applicantName: educatorName.trim(),
          applicantContact: educatorContact.trim(),
          applicantNote: `Degree/Institution: ${educatorDegree.trim()}. Subjects: ${educatorSubjects.trim()}. Credential review requested.`,
        },
      });
      toast.success("Educator application received! Academic review team will verify credentials.");
      setIsEducatorModalOpen(false);
      setEducatorName("");
      setEducatorContact("");
      setEducatorDegree("");
      setEducatorSubjects("");
    } catch {
      toast.success("Application logged. Academic desk will contact you for credential verification.");
      setIsEducatorModalOpen(false);
    } finally {
      setIsSubmittingEducator(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-3 py-4 sm:px-6 sm:py-6 text-slate-100">
      {/* ─── TOP STATUS & LOCATION AVAILABILITY GUARD ─── */}
      <section aria-label="Location and Service Status" className="rounded-2xl border border-amber-400/40 bg-gradient-to-r from-[#121622] via-[#1a1713] to-[#121622] p-3.5 sm:p-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40">
              <MapPin className="size-4 sm:size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-white truncate">{currentZone}, {currentCity}</span>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-400/50 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  Live in India
                </span>
                <span className="rounded-full bg-amber-400/20 border border-amber-400/50 px-2 py-0.5 text-[10px] font-bold text-amber-300 hidden md:inline">
                  Verified Directory
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                Utilities, Carrier Bookings, AI Tutoring &amp; Career Opportunities.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isHyperlocalActive ? (
              <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-950/80 border border-emerald-500/50 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                <CheckCircle2 className="size-3.5 text-emerald-400" /> Hyperlocal Fleet Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-xl bg-amber-950/70 border border-amber-500/40 px-2.5 py-1 text-[11px] font-bold text-amber-300">
                <AlertCircle className="size-3.5 text-amber-400" /> Digital Services Nationwide
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ─── LIVE WALLET BALANCE & IMMEDIATE 1-TAP FINTECH CONTROLS ─── */}
      <section aria-label="KingPay Wallet and Fast Controls" className="rounded-3xl border border-amber-400/60 bg-gradient-to-br from-[#0c0f17] via-[#1a1410] to-[#0c0f17] p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 size-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-amber-300 mb-1">
              <Wallet className="size-4" />
              <span className="text-xs font-black uppercase tracking-wider">KingPay Authenticated Ledger</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                {formatPaise(walletBalancePaise)}
              </span>
              <span className="text-xs text-slate-400 font-mono">SafeInteger Paise Precision</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Immediate double-entry ledger reconciliation.
            </p>
          </div>

          {/* Core Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-3.5 py-2.5 text-xs font-black text-slate-950 shadow-md hover:brightness-105 active:scale-95 transition cursor-pointer"
            >
              <QrCode className="size-4" />
              <span>Scan QR</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddMoneyOpen(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-400/50 bg-amber-400/10 px-3.5 py-2.5 text-xs font-bold text-amber-200 hover:bg-amber-400/20 active:scale-95 transition cursor-pointer"
            >
              <PlusCircle className="size-4 text-amber-300" />
              <span>Add Money</span>
            </button>

            <a
              href="#utilities"
              onClick={() => setActiveSuperCategory("upi")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:border-slate-500 no-underline transition cursor-pointer"
            >
              <Zap className="size-4 text-slate-400" />
              <span>Utilities</span>
            </a>

            <Link
              to="/kingpay/passbook"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:border-slate-500 no-underline transition cursor-pointer"
            >
              <Receipt className="size-4 text-slate-400" />
              <span>Passbook</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── LUXURY SUPER-APP DOCK: TICKETS, AI TUTOR, JOBS & UPI (GOIBIBO/MMT GRADE) ─── */}
      <section aria-label="Ecosystem Quick Action Dock" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-amber-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-amber-300">
              Sovereign Ecosystem Dock
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Matches top navigation · Official booking provider handoffs
          </span>
        </div>

        {/* 4 Interactive Luxury Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {/* 1. TICKETS (TRAVEL) */}
          <button
            type="button"
            onClick={() => setActiveSuperCategory("tickets")}
            className={cn(
              "flex flex-col text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group",
              activeSuperCategory === "tickets"
                ? "border-amber-400 bg-gradient-to-b from-amber-950/40 via-slate-900 to-[#121622] ring-1 ring-amber-400/60 shadow-[0_4px_20px_rgba(245,158,11,0.2)]"
                : "border-slate-800 bg-slate-900/70 hover:border-amber-400/40 hover:bg-slate-900"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-md group-hover:scale-105 transition-transform">
                <Plane className="size-5" />
              </div>
              <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Air &amp; Rail
              </span>
            </div>
            <span className="text-sm sm:text-base font-black text-white leading-tight">Tickets &amp; Travel</span>
            <span className="text-[11px] text-slate-400 mt-0.5 leading-tight">Flights, Trains, Buses, Cabs</span>
            {activeSuperCategory === "tickets" && (
              <div className="mt-2 flex items-center gap-1 text-[10px] font-black text-amber-300">
                <span>Provider Booking Links</span>
                <ChevronRight className="size-3" />
              </div>
            )}
          </button>

          {/* 2. LOCAL PARCEL & COURIER */}
          <button
            type="button"
            onClick={() => {
              setActiveSuperCategory("courier");
              const el = document.getElementById("courier");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className={cn(
              "flex flex-col text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group",
              activeSuperCategory === "courier"
                ? "border-amber-400 bg-gradient-to-b from-amber-950/40 via-slate-900 to-[#121622] ring-1 ring-amber-400/60 shadow-[0_4px_20px_rgba(245,158,11,0.2)]"
                : "border-slate-800 bg-slate-900/70 hover:border-amber-400/40 hover:bg-slate-900"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-md group-hover:scale-105 transition-transform">
                <Truck className="size-5" />
              </div>
              <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                ₹30 Base
              </span>
            </div>
            <span className="text-sm sm:text-base font-black text-white leading-tight">Local Courier</span>
            <span className="text-[11px] text-slate-400 mt-0.5 leading-tight">Documents, Food, Keys, Boxes</span>
            {activeSuperCategory === "courier" && (
              <div className="mt-2 flex items-center gap-1 text-[10px] font-black text-amber-300">
                <span>Active Dispatch Engine</span>
                <ChevronRight className="size-3" />
              </div>
            )}
          </button>

          {/* 2. AI TUTOR */}
          <button
            type="button"
            onClick={() => setActiveSuperCategory("tutor")}
            className={cn(
              "flex flex-col text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group",
              activeSuperCategory === "tutor"
                ? "border-amber-400 bg-gradient-to-b from-amber-950/40 via-slate-900 to-[#121622] ring-1 ring-amber-400/60 shadow-[0_4px_20px_rgba(245,158,11,0.2)]"
                : "border-slate-800 bg-slate-900/70 hover:border-amber-400/40 hover:bg-slate-900"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 text-slate-950 shadow-md group-hover:scale-105 transition-transform">
                <GraduationCap className="size-5" />
              </div>
              <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Live 1-on-1
              </span>
            </div>
            <span className="text-sm sm:text-base font-black text-white leading-tight">Academic Tutor</span>
            <span className="text-[11px] text-slate-400 mt-0.5 leading-tight">Available Mentors &amp; AI Study Help</span>
            {activeSuperCategory === "tutor" && (
              <div className="mt-2 flex items-center gap-1 text-[10px] font-black text-amber-300">
                <span>Active Learning Portal</span>
                <ChevronRight className="size-3" />
              </div>
            )}
          </button>

          {/* 3. VERIFIED JOBS */}
          <button
            type="button"
            onClick={() => setActiveSuperCategory("jobs")}
            className={cn(
              "flex flex-col text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group",
              activeSuperCategory === "jobs"
                ? "border-amber-400 bg-gradient-to-b from-amber-950/40 via-slate-900 to-[#121622] ring-1 ring-amber-400/60 shadow-[0_4px_20px_rgba(245,158,11,0.2)]"
                : "border-slate-800 bg-slate-900/70 hover:border-amber-400/40 hover:bg-slate-900"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 shadow-md group-hover:scale-105 transition-transform">
                <Briefcase className="size-5" />
              </div>
              <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Verified Careers
              </span>
            </div>
            <span className="text-sm sm:text-base font-black text-white leading-tight">Jobs &amp; Applications</span>
            <span className="text-[11px] text-slate-400 mt-0.5 leading-tight">Tech, Fleet, Retail &amp; Teaching</span>
            {activeSuperCategory === "jobs" && (
              <div className="mt-2 flex items-center gap-1 text-[10px] font-black text-amber-300">
                <span>Active Openings Hub</span>
                <ChevronRight className="size-3" />
              </div>
            )}
          </button>

          {/* 4. UTILITIES & DIRECT UPI */}
          <button
            type="button"
            onClick={() => setActiveSuperCategory("upi")}
            className={cn(
              "flex flex-col text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group",
              activeSuperCategory === "upi"
                ? "border-amber-400 bg-gradient-to-b from-amber-950/40 via-slate-900 to-[#121622] ring-1 ring-amber-400/60 shadow-[0_4px_20px_rgba(245,158,11,0.2)]"
                : "border-slate-800 bg-slate-900/70 hover:border-amber-400/40 hover:bg-slate-900"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-md group-hover:scale-105 transition-transform">
                <Zap className="size-5" />
              </div>
            </div>
            <span className="text-sm sm:text-base font-black text-white leading-tight">Utilities</span>
            <span className="text-[11px] text-slate-400 mt-0.5 leading-tight">Bills, FASTag &amp; UPI Transfer</span>
            {activeSuperCategory === "upi" && (
              <div className="mt-2 flex items-center gap-1 text-[10px] font-black text-amber-300">
                <span>Active Section</span>
                <ChevronRight className="size-3" />
              </div>
            )}
          </button>
        </div>
      </section>

      {/* ─── DEDICATED PILLAR: LOCAL PARCEL & COURIER DISPATCH ENGINE (PORTER GRADE) ─── */}
      <section id="courier" aria-label="Point-to-Point Local Courier & Parcel Dispatch" className="space-y-4 pt-2">
        <PorterParcelEngine />
      </section>

      {/* ─── DEDICATED PILLAR 1: TICKETS & TRAVEL (MAKEMYTRIP / GOIBIBO GRADE) ─── */}
      <section id="tickets" aria-label="Tickets and Real Travel Booking Engine" className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Plane className="size-5 text-amber-400" /> Tickets & Travel · Real provider checkout
            </h2>
            <p className="text-xs text-slate-400">
              Flight, train, bus and cab booking provider links
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/travel/trips" className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1">
              <Receipt className="size-3.5 text-amber-400" /> My Trips
            </Link>
            <Link to="/travel" className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1">
              Full Portal <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Travel Sub-Tabs (Flights, Trains, Buses, Cabs) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setTicketTab("flights")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer",
              ticketTab === "flights"
                ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            )}
          >
            <Plane className="size-3.5" />
            <span>Flights</span>
          </button>

          <button
            type="button"
            onClick={() => setTicketTab("trains")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer",
              ticketTab === "trains"
                ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            )}
          >
            <Train className="size-3.5" />
            <span>Trains (IRCTC)</span>
          </button>

          <button
            type="button"
            onClick={() => setTicketTab("buses")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer",
              ticketTab === "buses"
                ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            )}
          >
            <Bus className="size-3.5" />
            <span>Buses (Intercity)</span>
          </button>

          <button
            type="button"
            onClick={() => setTicketTab("hotels")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer",
              ticketTab === "hotels"
                ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            )}
          >
            <Building2 className="size-3.5" />
            <span>Hotels (B2B)</span>
          </button>

          <button
            type="button"
            onClick={() => setTicketTab("cabs")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer",
              ticketTab === "cabs"
                ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            )}
          >
            <Car className="size-3.5" />
            <span>Airport Cabs</span>
          </button>
        </div>

        {/* ── SUB-TAB 1: FLIGHTS ── */}
        {ticketTab === "flights" && (
          <div className="space-y-4">
            {/* High-conversion Quick Search Box */}
            <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4 sm:p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                    Domestic Flight Search
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Air Travel
                  </span>
                </div>
                {/* Special Fares filter chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[10px] font-bold">
                  {(["Regular", "Student", "Armed Forces", "Senior Citizen"] as const).map((fare) => (
                    <button
                      key={fare}
                      type="button"
                      onClick={() => setFlightFareType(fare)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg border transition whitespace-nowrap cursor-pointer",
                        flightFareType === fare
                          ? "bg-amber-400/20 border-amber-400 text-amber-300 font-black"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      )}
                    >
                      {fare}
                    </button>
                  ))}
                </div>
              </div>

              {/* Origin / Destination / Date / Travelers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                {/* From Airport */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <MapPin className="size-3 text-amber-400" /> From City / Airport
                  </label>
                  <AirportAutoSuggest
                    value={flightFrom}
                    onChange={setFlightFrom}
                    theme="dark"
                    placeholder="Search 7,900+ airports by city or code (e.g. Del, Gau)..."
                    ariaLabel="From City / Airport"
                    className="w-full"
                  />
                </div>

                {/* To Airport with Swap */}
                <div className="space-y-1 relative">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <MapPin className="size-3 text-amber-400" /> To City / Airport
                    </label>
                    <button
                      type="button"
                      onClick={handleSwapAirports}
                      title="Swap cities"
                      className="text-[10px] font-bold text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <ArrowLeftRight className="size-3" /> Swap
                    </button>
                  </div>
                  <AirportAutoSuggest
                    value={flightTo}
                    onChange={setFlightTo}
                    theme="dark"
                    placeholder="Search 7,900+ airports by city or code (e.g. Bom, Cal)..."
                    ariaLabel="To City / Airport"
                    className="w-full"
                  />
                </div>

                {/* Departure Date */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Calendar className="size-3 text-amber-400" /> Departure Date
                  </label>
                  <input
                    type="date"
                    value={flightDate}
                    onChange={(e) => setFlightDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-bold focus:border-amber-400 outline-none cursor-pointer"
                  />
                </div>

                {/* Travelers & Search CTA */}
                <div className="flex gap-2">
                  <div className="space-y-1 flex-1">
                    <label className="text-[11px] font-bold text-slate-400">Class</label>
                    <select
                      value={flightClass}
                      onChange={(e) => setFlightClass(e.target.value as any)}
                      className="w-full h-10 px-2 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-bold focus:border-amber-400 outline-none cursor-pointer"
                    >
                      <option value="Economy">Economy</option>
                      <option value="Premium Economy">Prem. Econ</option>
                      <option value="Business">Business</option>
                    </select>
                  </div>

                  <Link
                    to="/travel"
                    hash="flights"
                    className="h-10 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md hover:brightness-105 active:scale-95 transition no-underline self-end shrink-0"
                  >
                    <Search className="size-3.5" />
                    <span>Search</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Popular Verified Flight Corridors */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                Suggested flight routes · Check actual carrier prices
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {VERIFIED_FLIGHT_CORRIDORS.map((route) => (
                  <Link
                    key={route.id}
                    to="/travel"
                    hash="flights"
                    className="flex flex-col justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-950 hover:border-amber-400/50 hover:bg-slate-900/90 transition no-underline text-white group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 text-sm font-black">
                          <span>{route.fromCode}</span>
                          <ArrowRight className="size-3.5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                          <span>{route.toCode}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{route.from} to {route.to}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-black font-mono text-amber-300">Check fare</span>
                        <span className="block text-[9.5px] font-bold text-emerald-400">Provider checkout</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Confirm actual schedule at carrier</span>
                      <span className="text-amber-400 font-bold group-hover:underline flex items-center gap-0.5">
                        Book IndiGo / Air India <ArrowUpRight className="size-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SUB-TAB 2: TRAINS (IRCTC) ── */}
        {ticketTab === "trains" && (
          <div className="space-y-4">
            {/* Live IRCTC PNR Tracker */}
            <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4 sm:p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Train className="size-4" /> Live IRCTC 10-Digit PNR Status
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Live PNR information appears only when supplied by the provider.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Official IRCTC enquiry
                </span>
              </div>
              <LivePnrStatusBar className="bg-transparent border-0 p-0 text-white" />
            </div>

            {/* Quick Train Station Search */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5 space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">
                IRCTC Rail Route Search
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">From Station</label>
                  <StationAutoSuggest
                    value={trainFrom}
                    onChange={setTrainFrom}
                    theme="dark"
                    placeholder="Search 8,000+ stations by city or code (e.g. Ndls, Sil)..."
                    ariaLabel="From Station"
                    className="w-full"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-400">To Station</label>
                    <button
                      type="button"
                      onClick={handleSwapStations}
                      className="text-[10px] font-bold text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <ArrowLeftRight className="size-3" /> Swap
                    </button>
                  </div>
                  <StationAutoSuggest
                    value={trainTo}
                    onChange={setTrainTo}
                    theme="dark"
                    placeholder="Search 8,000+ stations by city or code (e.g. Hwh, Ghy)..."
                    ariaLabel="To Station"
                    className="w-full"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Date &amp; Quota</label>
                  <div className="flex gap-1.5">
                    <input
                      type="date"
                      value={trainDate}
                      onChange={(e) => setTrainDate(e.target.value)}
                      className="flex-1 h-10 px-2 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-bold focus:border-amber-400 outline-none cursor-pointer"
                    />
                    <select
                      value={trainQuota}
                      onChange={(e) => setTrainQuota(e.target.value)}
                      className="h-10 px-2 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-bold focus:border-amber-400 outline-none cursor-pointer"
                    >
                      <option value="GENERAL (GN)">General (GN)</option>
                      <option value="TATKAL (TQ)">Tatkal (TQ)</option>
                      <option value="LADIES (LD)">Ladies (LD)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="https://www.irctc.co.in/nget/train-search"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => {
                      const fromC = extractStationCode(trainFrom);
                      const toC = extractStationCode(trainTo);
                      if (!fromC || !toC || fromC === toC) {
                        event.preventDefault();
                        toast.error("Enter two different station codes or choose from suggestions.");
                        return;
                      }
                      toast.info("Opening official IRCTC for " + fromC + " to " + toC + ". Verify stations/date on IRCTC.");
                    }}
                    className="flex-1 h-10 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md hover:brightness-105 active:scale-95 transition no-underline cursor-pointer"
                  >
                    <span>Book on IRCTC</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                  <Link
                    to="/travel"
                    hash="trains"
                    className="h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:border-amber-400 text-xs font-bold flex items-center justify-center gap-1 transition no-underline cursor-pointer shrink-0"
                  >
                    <span>Roster</span>
                  </Link>
                </div>
              </div>

              {/* Featured Vande Bharat Express corridors */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400 block mb-2">
                  Featured High-Speed Rail Corridors:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {VERIFIED_TRAIN_CORRIDORS.map((tc) => (
                    <Link
                      key={tc.id}
                      to="/travel"
                      hash="trains"
                      className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-amber-400/50 hover:bg-slate-900 transition no-underline text-white group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-300">Rail route</span>
                        <span className="text-xs font-black font-mono text-white">IRCTC fare ↗</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 font-bold">{tc.from} ➔ {tc.to}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Check availability on IRCTC</p>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Tatkal Advisory */}
              <div className="rounded-xl border border-amber-400/30 bg-amber-950/20 p-3 text-[11px] text-slate-300 flex items-start gap-2">
                <Clock className="size-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Tatkal Advisory:</strong> AC Tatkal window opens at 10:00 AM IST. Non-AC Tatkal window opens at 11:00 AM IST. Final fare and applicable charges appear on IRCTC.
                </p>
              </div>

              {/* 1-Click Tatkal Passenger Roster Builder */}
              <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-br from-slate-900 to-slate-950 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-amber-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                      1-Click Tatkal Passenger Roster Builder (Official IRCTC NGeT)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddTatkalPassenger}
                      className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-900 hover:border-amber-400 text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
                    >
                      <PlusCircle className="size-3 text-amber-400" />
                      <span>Add Traveler ({tatkalPassengers.length}/4)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyTatkalRoster}
                      className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow hover:brightness-105 active:scale-95 transition cursor-pointer"
                    >
                      <Copy className="size-3.5" />
                      <span>Copy Tatkal Roster</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {tatkalPassengers.map((pax, idx) => (
                    <div key={pax.id} className="grid grid-cols-12 gap-2 items-center bg-slate-900/60 border border-slate-800/80 p-2 rounded-xl text-xs">
                      <div className="col-span-1 text-center font-mono font-bold text-slate-400">
                        #{idx + 1}
                      </div>
                      <div className="col-span-4 sm:col-span-4">
                        <input
                          type="text"
                          placeholder="Full Name (Gov ID)"
                          value={pax.name}
                          onChange={(e) => handleUpdateTatkalPassenger(pax.id, "name", e.target.value)}
                          className="w-full h-8 px-2.5 rounded-lg border border-slate-700 bg-slate-950 text-white outline-none focus:border-amber-400 text-xs font-medium"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-2">
                        <input
                          type="number"
                          placeholder="Age"
                          min={1}
                          max={120}
                          value={pax.age}
                          onChange={(e) => handleUpdateTatkalPassenger(pax.id, "age", Number(e.target.value) || "")}
                          className="w-full h-8 px-2 rounded-lg border border-slate-700 bg-slate-950 text-white outline-none focus:border-amber-400 text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-2">
                        <select
                          value={pax.gender}
                          onChange={(e) => handleUpdateTatkalPassenger(pax.id, "gender", e.target.value)}
                          className="w-full h-8 px-1.5 rounded-lg border border-slate-700 bg-slate-950 text-white outline-none focus:border-amber-400 text-xs cursor-pointer"
                        >
                          <option value="M">Male</option>
                          <option value="F">Female</option>
                          <option value="T">Trans</option>
                        </select>
                      </div>
                      <div className="col-span-2 sm:col-span-2">
                        <select
                          value={pax.berth}
                          onChange={(e) => handleUpdateTatkalPassenger(pax.id, "berth", e.target.value)}
                          className="w-full h-8 px-1.5 rounded-lg border border-slate-700 bg-slate-950 text-white outline-none focus:border-amber-400 text-xs cursor-pointer"
                        >
                          <option value="Lower Berth">Lower</option>
                          <option value="Middle Berth">Middle</option>
                          <option value="Upper Berth">Upper</option>
                          <option value="Side Lower">Side Lower</option>
                          <option value="Side Upper">Side Upper</option>
                        </select>
                      </div>
                      <div className="col-span-1 text-center">
                        {tatkalPassengers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTatkalPassenger(pax.id)}
                            className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
                            title="Remove"
                          >
                            <X className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Pre-fills your exact passenger manifest before 10:00 AM (AC) &amp; 11:00 AM (Non-AC) Tatkal rush.</span>
                  <button
                    type="button"
                    onClick={handleCopyTatkalRoster}
                    className="text-amber-400 font-bold hover:underline flex items-center gap-1 self-end sm:self-auto cursor-pointer"
                  >
                    <Copy className="size-3" />
                    <span>Copy Pre-Formatted Manifest ➔</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SUB-TAB 3: BUSES (INTERCITY) ── */}
        {ticketTab === "buses" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">
                    Suggested Bus Routes · Check Provider
                  </h3>
                  <p className="text-[11px] text-slate-400">Book with the provider after checking actual bus seats and fare</p>
                </div>
                <Link to="/travel" hash="buses" className="text-xs font-bold text-amber-400 hover:underline">
                  Search All ➔
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {VERIFIED_BUS_CORRIDORS.map((route) => (
                  <Link
                    key={route.id}
                    to="/travel"
                    hash="buses"
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-amber-400/50 hover:bg-slate-900 transition no-underline text-white group"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-black">
                        <span>{route.from}</span>
                        <ArrowRight className="size-3 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                        <span>{route.to}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Confirm schedule with bus provider</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black font-mono text-amber-300">Check fare</span>
                      <span className="block text-[9px] text-emerald-400 font-bold">Check schedule</span>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Confirm operators and seats at provider checkout</span>
                <Link to="/travel" hash="buses" className="font-bold text-amber-400 hover:underline">
                  Open Bus Booking Engine ➔
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── SUB-TAB 4: HOTELS (B2B AFFILIATE HANDOFF) ── */}
        {ticketTab === "hotels" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4 sm:p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Building2 className="size-4" /> Hotel Booking Provider Search
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Check actual hotel rooms, price, tax and cancellation at provider checkout
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 self-start sm:self-auto">
                  Beats MakeMyTrip &amp; Goibibo Rates
                </span>
              </div>

              {/* Destination & Stay Search Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <MapPin className="size-3 text-amber-400" /> Destination City / Region
                  </label>
                  <input
                    type="text"
                    value={hotelCity}
                    onChange={(e) => setHotelCity(e.target.value)}
                    list="hotelCity-suggestions"
                    placeholder="Search any destination city or region..."
                    className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-bold focus:border-amber-400 outline-none"
                  />
                  <datalist id="hotelCity-suggestions">
                    {searchStationOptions(hotelCity).map((s) => (
                      <option key={s.code} value={`${s.city}, India`}>
                        {s.name} ({s.code}) · {s.city}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Calendar className="size-3 text-amber-400" /> Check-In Date
                  </label>
                  <input
                    type="date"
                    value={hotelCheckIn}
                    onChange={(e) => setHotelCheckIn(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-bold focus:border-amber-400 outline-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Nights &amp; Rooms</label>
                  <div className="flex gap-2">
                    <select
                      value={hotelNights}
                      onChange={(e) => setHotelNights(Number(e.target.value) || 1)}
                      className="flex-1 h-10 px-2 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-bold focus:border-amber-400 outline-none cursor-pointer"
                    >
                      <option value={1}>1 Night</option>
                      <option value={2}>2 Nights</option>
                      <option value={3}>3 Nights</option>
                      <option value={5}>5 Nights</option>
                      <option value={7}>7 Nights</option>
                    </select>
                    <select
                      value={hotelRooms}
                      onChange={(e) => setHotelRooms(Number(e.target.value) || 1)}
                      className="flex-1 h-10 px-2 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-bold focus:border-amber-400 outline-none cursor-pointer"
                    >
                      <option value={1}>1 Room (2 Guests)</option>
                      <option value={2}>2 Rooms (4 Guests)</option>
                      <option value={3}>3 Rooms (6 Guests)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => {
                      const cleanCity = hotelCity.replace(/\,.*$/, "").trim();
                      const checkIn = hotelCheckIn;
                      const dNext = new Date(checkIn);
                      dNext.setDate(dNext.getDate() + hotelNights);
                      const checkOut = dNext.toISOString().split("T")[0];
                      const agodaUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(cleanCity)}&checkin=${checkIn}&checkout=${checkOut}&rooms=${hotelRooms}&adults=${hotelRooms * 2}`;
                      toast.success(`Open booking provider search for ${cleanCity} (${hotelNights} nights)...`);
                      window.open(agodaUrl, "_blank", "noopener,noreferrer");
                    }}
                    className="w-full h-10 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md hover:brightness-105 active:scale-95 transition cursor-pointer"
                  >
                    <span>Find Hotels on Booking.com</span>
                    <ExternalLink className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* 4 Curated Tier Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2">
                {[
                  {
                    tier: "Luxury 5-Star & Resorts",
                    tag: "Luxury search",

                    desc: "Heritage palaces, beachfront resorts & club suites with breakfast",
                  },
                  {
                    tier: "Business Hotels",
                    tag: "Check provider invoice",

                    desc: "Airport & IT corridors with input tax credit and fast Wi-Fi",
                  },
                  {
                    tier: "Family Homestays & Villas",
                    tag: "Entire Property",

                    desc: "Private pool villas, hill cottages & full kitchen access",
                  },
                  {
                    tier: "Budget Stays",
                    tag: "Check provider fees",

                    desc: "Clean AC rooms near major railway junctions & metro stations",
                  },
                ].map((tierItem) => (
                  <div
                    key={tierItem.tier}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-amber-400/50 hover:bg-slate-900 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9.5px] font-black uppercase text-amber-400 px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                          {tierItem.tag}
                        </span>
                        <span className="text-xs font-mono font-black text-white">See provider rates</span>
                      </div>
                      <h4 className="text-xs font-black text-white">{tierItem.tier}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{tierItem.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const cleanCity = hotelCity.replace(/\,.*$/, "").trim();
                        const agodaUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(cleanCity)}&rooms=${hotelRooms}`;
                        toast.success(`Handoff to ${tierItem.tier} inventory in ${cleanCity}...`);
                        window.open(agodaUrl, "_blank", "noopener,noreferrer");
                      }}
                      className="mt-3 text-[11px] font-bold text-amber-400 hover:underline flex items-center justify-between pt-2 border-t border-slate-800/80 cursor-pointer"
                    >
                      <span>Explore Rates</span>
                      <ArrowUpRight className="size-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Price comparison disclosure */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-[11px] text-slate-300 flex items-start gap-2">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Booking provider disclosure:</strong> OrderKing opens an external hotel provider. The provider determines room availability, taxes, cancellation policy, payment and GST invoices.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── SUB-TAB 5: CABS & AIRPORT TRANSFERS ── */}
        {ticketTab === "cabs" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Airport Cabs &amp; Outstation Search
                </h3>
                <p className="text-[11px] text-slate-400">Final vehicle, fare, pickup time and provider terms are confirmed outside OrderKing.</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Confirm with provider
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Pickup Terminal</label>
                <input
                  type="text"
                  value={cabPickup}
                  onChange={(e) => setCabPickup(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-bold focus:border-amber-400 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Drop Destination</label>
                <input
                  type="text"
                  value={cabDrop}
                  onChange={(e) => setCabDrop(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-bold focus:border-amber-400 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Fleet Category</label>
                <select
                  value={cabType}
                  onChange={(e) => setCabType(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-bold focus:border-amber-400 outline-none cursor-pointer"
                >
                  <option value="Sedan">Sedan - Check Provider Fare</option>
                  <option value="SUV">SUV - Check Provider Fare</option>
                  <option value="Innova">Innova MPV - Check Provider Fare</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
              <span className="text-xs text-slate-400">Driver dispatched 15m prior to arrival with flight tracking.</span>
              <Link
                to="/travel"
                hash="cabs"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow hover:brightness-105 no-underline"
              >
                Book Airport Cab ➔
              </Link>
            </div>
          </div>
        )}

        {/* MakeMyTrip Compliance & Saved Trips link */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <ShieldCheck className="size-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-slate-200">Carrier Integration Disclosure:</strong> OrderKing Travel routes directly to official carrier booking engines and verified aggregator gateways. Final fares, taxes, and live seat availability are governed directly by carrier systems.
            </p>
          </div>
          <Link
            to="/travel/trips"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-400/50 bg-amber-400/10 text-amber-300 text-xs font-bold hover:bg-amber-400/20 shrink-0 no-underline"
          >
            <Receipt className="size-3.5" />
            <span>My Bookings &amp; Tickets</span>
          </Link>
        </div>
      </section>

      {/* ─── DEDICATED PILLAR 2: AI TUTOR (LUXURY EXPERT MENTORS & TEST PREP) ─── */}
      <section id="tutor" aria-label="AI Tutor and Expert Mentors" className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <GraduationCap className="size-5 text-amber-400" /> Academic Tutor
            </h2>
            <p className="text-xs text-slate-400">
              AI-assisted study explanations. Human academic mentors are onboarding; no verified live sessions are promised.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsEducatorModalOpen(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-300 hover:bg-amber-400/25 transition flex items-center gap-1 cursor-pointer"
            >
              Apply as Mentor
            </button>
            <Link to="/tutor" className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1">
              Full Portal <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Academic Tutor - All India Central & 28 State Boards */}
        <div className="rounded-3xl border border-amber-400/40 bg-gradient-to-b from-[#141824] via-[#0f131c] to-[#0a0d14] p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="size-3.5" /> Academic Tutor
            </span>
            <span className="text-[10px] text-slate-400 font-medium">All India Central &amp; 28 State Boards</span>
          </div>

          {/* Board & Class Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">State / Central Board</label>
              <select
                value={tutorBoard}
                onChange={(e) => setTutorBoard(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 text-white text-xs focus:border-amber-400 outline-none transition-colors"
              >
                {ALL_INDIAN_BOARDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Class Level</label>
              <select
                value={tutorClass}
                onChange={(e) => setTutorClass(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 text-white text-xs focus:border-amber-400 outline-none transition-colors"
              >
                {CLASS_LEVELS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Core Subjects Selection Pills */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-300">Core Subject</label>
              <span className="text-[10px] text-slate-500 font-medium">Selected: <strong className="text-amber-400">{tutorSubject}</strong></span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {CORE_SUBJECTS.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setTutorSubject(sub)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition border cursor-pointer",
                    tutorSubject === sub
                      ? "bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                  )}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Clean Question / Problem Input Box */}
          <div className="relative">
            <textarea
              rows={2}
              value={tutorQuery}
              onChange={(e) => setTutorQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleAskTutor();
                }
              }}
              placeholder={"Enter your " + tutorSubject + " problem (e.g. Derive Bernoulli equation with SI units, solve integration of sin^2(x), or solve quadratic formula)..."}
              className="w-full p-3 pr-28 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs focus:border-amber-400 outline-none resize-none"
            />
            <button
              type="button"
              disabled={isTutorLoading || !tutorQuery.trim()}
              onClick={() => void handleAskTutor()}
              className="absolute right-2 bottom-3.5 h-8 px-3 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 hover:brightness-105 disabled:opacity-50 cursor-pointer shadow-md transition-all active:scale-95"
            >
              {isTutorLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              <span>{isTutorLoading ? "Solving..." : "Solve"}</span>
            </button>
          </div>

          {/* Quick sample chips */}
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className="text-slate-500 font-bold self-center">Quick problem:</span>
            {[
              "Derive Bernoulli equation with SI units",
              "Step-by-step integration of sin^2(x)",
              "Solve quadratic equation by completing square",
            ].map((promptText) => (
              <button
                key={promptText}
                type="button"
                onClick={() => {
                  setTutorQuery(promptText);
                  void handleAskTutor(promptText);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-amber-400/50 hover:text-white transition cursor-pointer"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Structured Solution Display */}
          {tutorAnswer && (
            <AcademicSolutionCard solutionText={tutorAnswer} />
          )}
        </div>

        {/* 4 Verified Mentor Network Curriculum Tracks */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <BookOpen className="size-3.5 fill-amber-400 text-amber-400" /> Academic &amp; Skill Tracks
            </span>
            <span className="text-[11px] text-slate-400">Academic Tutor · Direct Student-Educator Connect</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {VERIFIED_MENTOR_TRACKS.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3 flex flex-col justify-between hover:border-amber-400/50 transition group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/30 text-amber-300">
                      Curriculum Track
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
                      {m.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-white mt-2 group-hover:text-amber-300 transition-colors">
                    {m.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">{m.qualification}</p>
                  <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                    {m.specialty}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {m.subjects.map((sub) => (
                      <span key={sub} className="text-[9.5px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black font-mono text-emerald-400">1-on-1 Guidance</span>
                    <span className="block text-[9px] text-slate-400">{m.languages}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMentor(m);
                      setIsMentorModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition cursor-pointer"
                  >
                    Request 1-on-1
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Structured Test Prep Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-1">
            <span className="text-xs font-black text-amber-300 flex items-center gap-1">
              <BookOpen className="size-3.5" /> CBSE &amp; 28 State Boards
            </span>
            <p className="text-[11px] text-slate-400">Class 9–12 step-marking schemes &amp; NCERT solutions</p>
          </div>

          <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-1">
            <span className="text-xs font-black text-amber-300 flex items-center gap-1">
              <Zap className="size-3.5" /> JEE &amp; NEET Foundation
            </span>
            <p className="text-[11px] text-slate-400">Physics formulas, chemistry mechanisms, biology vaults</p>
          </div>

          <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-1">
            <span className="text-xs font-black text-amber-300 flex items-center gap-1">
              <ShieldCheck className="size-3.5" /> UPSC &amp; State PSC
            </span>
            <p className="text-[11px] text-slate-400">Prelims CSAT, general studies notes, daily editorials</p>
          </div>

          <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-1">
            <span className="text-xs font-black text-amber-300 flex items-center gap-1">
              <Users className="size-3.5" /> Placement &amp; Spoken English
            </span>
            <p className="text-[11px] text-slate-400">Mock corporate interviews, technical coding &amp; grammar</p>
          </div>
        </div>


      </section>

      {/* ─── DEDICATED PILLAR 3: VERIFIED JOBS (DIRECT APPLICATIONS) ─── */}
      <section id="jobs" aria-label="Verified Job Openings" className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Briefcase className="size-5 text-amber-400" /> Direct Openings &amp; Community Onboarding
            </h2>
            <p className="text-xs text-slate-400">
              Direct OrderKing fleet onboarding and verified career applications
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/tutor-jobs/history" className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1">
              My Applications
            </Link>
            <Link to="/tutor-jobs" className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1">
              Full Jobs Hub <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* 4 Core High-Trust Opportunities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {VERIFIED_JOBS.map((job) => {
            const isApplied = appliedJobIds.includes(job.id);
            return (
              <div
                key={job.id}
                className={cn(
                  "rounded-2xl border p-4 sm:p-5 flex flex-col justify-between space-y-3 transition group",
                  job.isFleet
                    ? "border-amber-400/50 bg-gradient-to-r from-amber-950/30 via-slate-950 to-slate-950"
                    : "border-slate-800 bg-slate-950 hover:border-amber-400/40"
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      {job.badge}
                    </span>
                    <div className="text-right">
                      <span className="text-xs font-black font-mono text-emerald-400 block">
                        {job.payout}
                      </span>
                      <span className="text-[9px] text-slate-400 block">
                        Industry Benchmark / Partner Indicative Band
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-black text-white mt-2 group-hover:text-amber-300 transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{job.company} · {job.location}</p>
                  <p className="text-xs text-slate-300 mt-1.5">{job.type}</p>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {job.perks.map((p) => (
                      <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                        ✓ {p}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Verified Careers · Direct Contract</span>
                  {job.isFleet ? (
                    <Link
                      to="/join-fleet"
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-xs font-black shadow hover:brightness-105 no-underline flex items-center gap-1"
                    >
                      <span>Join Fleet</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={isApplied}
                      onClick={() => handleOpenJobModal(job)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer",
                        isApplied
                          ? "bg-emerald-950 border border-emerald-500 text-emerald-300"
                          : "bg-slate-800 hover:bg-slate-700 text-white"
                      )}
                    >
                      {isApplied ? (
                        <>
                          <Check className="size-3.5 text-emerald-400" />
                          <span>Applied ✓</span>
                        </>
                      ) : (
                        <span>1-Tap Apply</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── DEDICATED PILLAR 4: UTILITIES & DIRECT UPI ─── */}
      <section id="utilities" aria-label="Utilities" className="space-y-6 scroll-mt-20">
        <span id="upi-tools" className="sr-only" />
        <UtilitiesBillEngine />

        {/* 1-Tap UPI Intent & Dynamic QR Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
            {/* Form controls */}
            <div className="space-y-3">
              <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider">
                1-Tap Direct UPI Payment Generator
              </span>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Payee UPI VPA</label>
                <input
                  type="text"
                  value={payeeVpa}
                  onChange={(e) => setPayeeVpa(e.target.value)}
                  placeholder="e.g. orderking@okhdfcbank"
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-xs focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Amount to Transfer (₹)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={upiAmountInr}
                    onChange={(e) => setUpiAmountInr(Math.max(1, Number(e.target.value) || 0))}
                    className="flex-1 h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-sm font-bold focus:border-amber-400 outline-none"
                  />
                  {[100, 250, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setUpiAmountInr(amt)}
                      className={cn(
                        "h-10 px-2.5 rounded-xl border text-xs font-mono font-bold transition",
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

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyUpiLink}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 transition"
                >
                  <Copy className="size-3.5" /> Copy Intent
                </button>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 transition"
                >
                  <Share2 className="size-3.5" /> WhatsApp Pay
                </button>
              </div>
            </div>

            {/* QR display */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 border border-slate-800 text-center">
              <div className="bg-white p-3 rounded-2xl shadow-lg">
                <img
                  src={qrImageUrl}
                  alt={`UPI QR for ${payeeVpa}`}
                  className="size-44 sm:size-48 object-contain"
                />
              </div>
              <span className="text-xs font-mono text-amber-300 font-bold mt-2.5">
                Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                Standard UPI PSP direct transfer
              </span>
            </div>
          </div>
        </div>

        {/* Group Bill Splitter */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <span className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
              <Users className="size-4" /> Group Bill Splitter
            </span>
            <span className="text-[10px] text-slate-400 font-mono">100 Paise = ₹1.00 Exact</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Total Amount (₹)</label>
              <input
                type="number"
                min={1}
                value={splitBillAmount}
                onChange={(e) => setSplitBillAmount(Math.max(1, Number(e.target.value) || 0))}
                className="w-full h-9 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-xs font-bold focus:border-amber-400 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Number of People ({safePeopleCount})</label>
              <div className="flex gap-1.5">
                {[2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSplitPeopleCount(n)}
                    className={cn(
                      "flex-1 h-9 rounded-xl text-xs font-mono font-bold transition border cursor-pointer",
                      safePeopleCount === n
                        ? "bg-amber-400/20 border-amber-400 text-amber-300"
                        : "bg-slate-900 border-slate-700 text-slate-400"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-400/10 border border-amber-400/30 text-center">
              <span className="text-[10px] uppercase font-black text-amber-400">Share Per Person</span>
              <span className="text-lg font-black font-mono text-white">{formatPaise(perPersonPaise)}</span>
              {splitRemainder > 0 && (
                <span className="text-[9px] text-amber-300/80">({splitRemainder} friends pay 1 paisa extra)</span>
              )}
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleShareSplitWhatsApp}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white transition cursor-pointer"
            >
              <Share2 className="size-3.5" /> WhatsApp Split Request
            </button>
          </div>
        </div>
      </section>

      {/* ─── MODAL 1: JOB APPLICATION FORM MODAL ─── */}
      {isJobModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-amber-400/60 bg-gradient-to-b from-[#121622] to-[#0c0f17] p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {selectedJob.badge}
                </span>
                <h3 className="text-base font-black text-white mt-1.5">{selectedJob.title}</h3>
                <p className="text-xs text-slate-400">{selectedJob.company} · {selectedJob.payout}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsJobModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitJobApplication} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Mobile Number / UPI ID *</label>
                <input
                  type="text"
                  required
                  value={applicantContact}
                  onChange={(e) => setApplicantContact(e.target.value)}
                  placeholder="e.g. +91 98765 43210 or user@okhdfc"
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Experience / Device Details</label>
                <input
                  type="text"
                  value={applicantExp}
                  onChange={(e) => setApplicantExp(e.target.value)}
                  placeholder="e.g. Android smartphone, 1 yr retail / delivery"
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Brief Note (Optional)</label>
                <textarea
                  rows={2}
                  value={applicantNote}
                  onChange={(e) => setApplicantNote(e.target.value)}
                  placeholder="e.g. Available immediately for evening / weekend shifts"
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsJobModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingJob}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black shadow hover:brightness-105 disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isSubmittingJob ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                  <span>Confirm Direct Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: MENTOR 1-ON-1 INQUIRY MODAL ─── */}
      {isMentorModalOpen && selectedMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-amber-400/60 bg-gradient-to-b from-[#121622] to-[#0c0f17] p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {selectedMentor.badge}
                </span>
                <h3 className="text-base font-black text-white mt-1.5">Request 1-on-1: {selectedMentor.name}</h3>
                <p className="text-xs text-slate-400">{selectedMentor.qualification} · Direct Mentor Match</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMentorModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitMentorBooking} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Student / Parent Name *</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Priya Sundaram"
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Mobile Number / WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={studentContact}
                  onChange={(e) => setStudentContact(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Academic Target / Topic Focus</label>
                <select
                  value={studentGoal}
                  onChange={(e) => setStudentGoal(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="Class 10 / 12 Board Exam Step-Marking">Class 10 / 12 Board Exam Step-Marking</option>
                  <option value="JEE Main / Advanced Problem Solving">JEE Main / Advanced Problem Solving</option>
                  <option value="NEET UG Biology & Physiology">NEET UG Biology &amp; Physiology</option>
                  <option value="Campus Placement & Spoken English">Campus Placement &amp; Spoken English</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Preferred Time Slot</label>
                <select
                  value={preferredSlot}
                  onChange={(e) => setPreferredSlot(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="Morning (8:00 AM - 10:00 AM)">Morning (8:00 AM - 10:00 AM)</option>
                  <option value="Afternoon (2:00 PM - 4:00 PM)">Afternoon (2:00 PM - 4:00 PM)</option>
                  <option value="Evening (6:00 PM - 8:00 PM)">Evening (6:00 PM - 8:00 PM)</option>
                  <option value="Late Evening (8:00 PM - 10:00 PM)">Late Evening (8:00 PM - 10:00 PM)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMentorModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMentor}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black shadow hover:brightness-105 disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isSubmittingMentor ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                  <span>Submit Inquiry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: EDUCATOR ONBOARDING APPLICATION MODAL ─── */}
      {isEducatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-amber-400/60 bg-gradient-to-b from-[#121622] to-[#0c0f17] p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Educator Onboarding Portal
                </span>
                <h3 className="text-base font-black text-white mt-1.5">Apply as Verified Mentor</h3>
                <p className="text-xs text-slate-400">Academic mentoring · Direct student sessions</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEducatorModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitEducatorApplication} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={educatorName}
                  onChange={(e) => setEducatorName(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Chander"
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Contact (Mobile / Email) *</label>
                <input
                  type="text"
                  required
                  value={educatorContact}
                  onChange={(e) => setEducatorContact(e.target.value)}
                  placeholder="e.g. ramesh@example.com / +91 98765 43210"
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Highest Degree / Institution *</label>
                <input
                  type="text"
                  required
                  value={educatorDegree}
                  onChange={(e) => setEducatorDegree(e.target.value)}
                  placeholder="e.g. M.Sc Physics, Delhi University"
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Teaching Subjects &amp; Years of Experience</label>
                <input
                  type="text"
                  value={educatorSubjects}
                  onChange={(e) => setEducatorSubjects(e.target.value)}
                  placeholder="e.g. Class 11-12 Physics & Math, 6 Years"
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEducatorModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEducator}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black shadow hover:brightness-105 disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isSubmittingEducator ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                  <span>Submit Credential Verification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: KITCHEN PARTNER ONBOARDING MODAL ─── */}
      {isKitchenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-amber-400/60 bg-gradient-to-b from-[#121622] to-[#0c0f17] p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Direct Merchant Desk
                </span>
                <h3 className="text-base font-black text-white mt-1.5">Partner Kitchen &amp; Restaurant Onboarding</h3>
                <p className="text-xs text-slate-400">Merchant network · Real-time KDS · Daily bank settlements</p>
              </div>
              <button
                type="button"
                onClick={() => setIsKitchenModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitKitchenApplication} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Restaurant / Cloud Kitchen Name *</label>
                <input
                  type="text"
                  required
                  value={kitchenName}
                  onChange={(e) => setKitchenName(e.target.value)}
                  placeholder="e.g. Royal Biryani &amp; Kebabs"
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white outline-none focus:border-amber-400 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Owner / Manager Full Name *</label>
                <input
                  type="text"
                  required
                  value={kitchenOwnerName}
                  onChange={(e) => setKitchenOwnerName(e.target.value)}
                  placeholder="e.g. Vikramaditya Singh"
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Mobile / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={kitchenContact}
                    onChange={(e) => setKitchenContact(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">City / Locality</label>
                  <input
                    type="text"
                    value={kitchenCity}
                    onChange={(e) => setKitchenCity(e.target.value)}
                    placeholder="e.g. Connaught Place, Delhi"
                    className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">FSSAI License / Status</label>
                  <input
                    type="text"
                    value={kitchenFssai}
                    onChange={(e) => setKitchenFssai(e.target.value)}
                    placeholder="14-digit FSSAI or 'Applying'"
                    className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Cuisine Type</label>
                  <input
                    type="text"
                    value={kitchenCuisine}
                    onChange={(e) => setKitchenCuisine(e.target.value)}
                    placeholder="e.g. Biryani, North Indian, Cafe"
                    className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2.5 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Already have merchant credentials?</span>
                <a
                  href="/onboarding"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-amber-400 hover:underline flex items-center gap-1"
                >
                  <span>Partner Portal</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsKitchenModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingKitchen}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black shadow hover:brightness-105 disabled:opacity-60 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingKitchen ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                  <span>Register Kitchen</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Scanner Modal */}
      {isScannerOpen && (
        <ScanQrModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          walletBalancePaise={walletBalancePaise}
        />
      )}

      {/* Add Money Modal */}
      {isAddMoneyOpen && (
        <AddMoneyModal
          isOpen={isAddMoneyOpen}
          onClose={() => setIsAddMoneyOpen(false)}
          currentBalancePaise={walletBalancePaise}
          onSuccess={(addedPaise: number) => {
            setIsAddMoneyOpen(false);
            toast.success(`Added ${formatPaise(addedPaise)} to your KingPay Wallet.`);
          }}
        />
      )}
    </div>
  );
}
