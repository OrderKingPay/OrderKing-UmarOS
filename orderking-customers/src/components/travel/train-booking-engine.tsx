import { useState, useId } from "react";
import {
  Train,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  MapPin,
  Calendar,
  Tag,
  Clock,
  Utensils,
  CheckCircle2,
  AlertTriangle,
  ArrowLeftRight,
  RotateCcw,
  ExternalLink,
  Copy,
  Info,
  Lock,
  User,
  Users,
  Search,
  FileText,
  BadgeAlert,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { logTravelPartnerBooking } from "@/lib/travel/in-app-booking-service";
import {
  INDIAN_TRAIN_STATIONS,
  searchTrainStations,
  type TrainStationItem,
} from "@/lib/travel/indian-stations";

export interface TrainPassengerPreference {
  id: string;
  fullName: string;
  age: number | "";
  gender: "male" | "female" | "transgender";
  berthPreference: "No Preference" | "Lower Berth" | "Middle Berth" | "Upper Berth" | "Side Lower" | "Side Upper" | "Window Seat";
  foodChoice: "Veg" | "Non-Veg" | "Jain Meal" | "No Food";
  isSeniorCitizenQuotaEligible?: boolean;
}

interface Props {
  initialFrom?: string;
  initialTo?: string;
  walletBalance?: number;
  onDeductWallet?: (amount: number, description: string) => boolean;
}

export const IRCTC_OFFICIAL_SEARCH_URL = "https://www.irctc.co.in/nget/train-search";
export const INDIAN_RAIL_PNR_URL = "https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html";
export const CRIS_NTES_URL = "https://enquiry.indianrail.gov.in/mntes/";

export function TrainBookingEngine({
  initialFrom = "New Delhi (NDLS)",
  initialTo = "Mumbai Central (MMCT)",
}: Props) {
  // Station State
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  // Search parameters
  const [journeyDate, setJourneyDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [quota, setQuota] = useState<"GENERAL (GN)" | "TATKAL (TQ)" | "LADIES (LD)" | "SENIOR CITIZEN (SS)" | "DIVYANGJAN (HP)">("GENERAL (GN)");
  const [trainClass, setTrainClass] = useState<"1A" | "2A" | "3A" | "3E" | "CC" | "EC" | "SL" | "2S">("3A");

  // IRCTC User ID & Passenger details builder
  const [irctcUserId, setIrctcUserId] = useState("");
  const [contactMobile, setContactMobile] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [passengers, setPassengers] = useState<TrainPassengerPreference[]>([
    {
      id: "pax-1",
      fullName: "",
      age: 28,
      gender: "male",
      berthPreference: "No Preference",
      foodChoice: "Veg",
    },
  ]);

  // Modals & Panels
  const [showApprovalsAudit, setShowApprovalsAudit] = useState(false);
  const [showRefundRules, setShowRefundRules] = useState(false);
  const [showPassengerBuilder, setShowPassengerBuilder] = useState(true);

  // PNR Search input
  const [pnrNumber, setPnrNumber] = useState("");

  const fromStations = searchTrainStations(fromQuery || from);
  const toStations = searchTrainStations(toQuery || to);

  const cleanCode = (stationText: string, fallback: string) => {
    const match = stationText.match(/\(([A-Z]{2,6})\)/i);
    if (match && match[1]) return match[1].toUpperCase();
    const alphaOnly = stationText.replace(/[^A-Za-z]/g, "").toUpperCase();
    return alphaOnly.slice(0, 5) || fallback;
  };

  const fromCode = cleanCode(from, "NDLS");
  const toCode = cleanCode(to, "MMCT");

  const handleSwapStations = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const handleSetQuickDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setJourneyDate(d.toISOString().split("T")[0]);
  };

  // Passenger Builder Helpers
  const handleAddPassenger = () => {
    if (passengers.length >= 6) {
      toast.error("Indian Railways allows maximum 6 passengers per General reservation (4 for Tatkal).");
      return;
    }
    if (quota === "TATKAL (TQ)" && passengers.length >= 4) {
      toast.error("Tatkal quota reservations are strictly limited to 4 passengers per booking form under IRCTC rules.");
      return;
    }
    setPassengers((prev) => [
      ...prev,
      {
        id: `pax-${prev.length + 1}`,
        fullName: "",
        age: 25,
        gender: "male",
        berthPreference: "No Preference",
        foodChoice: "Veg",
      },
    ]);
  };

  const handleRemovePassenger = (id: string) => {
    if (passengers.length <= 1) return;
    setPassengers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdatePassenger = (id: string, field: keyof TrainPassengerPreference, value: any) => {
    setPassengers((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, [field]: value };
        if (field === "age" || field === "gender") {
          const ageNum = Number(updated.age);
          const isEligible =
            (updated.gender === "male" && ageNum >= 60) ||
            (updated.gender === "female" && ageNum >= 45);
          updated.isSeniorCitizenQuotaEligible = isEligible;
        }
        return updated;
      })
    );
  };

  const isIrctcUserIdValid = (id: string) => /^[A-Za-z][A-Za-z0-9_]{2,34}$/.test(id.trim());

  const handleCopyPassengerRoster = () => {
    const rosterLines = [
      `=== IRCTC TRAVEL ROSTER PREPARED VIA ORDERKING ===`,
      `Route: ${fromCode} ➔ ${toCode}`,
      `Date: ${journeyDate} | Quota: ${quota} | Class: ${trainClass}`,
      irctcUserId ? `IRCTC User ID: ${irctcUserId}` : `IRCTC User ID: (Not provided)`,
      `Travelers (${passengers.length}):`,
      ...passengers.map(
        (p, idx) =>
          `${idx + 1}. ${p.fullName || "Pax " + (idx + 1)} | Age: ${p.age} | ${p.gender.toUpperCase()} | Berth: ${p.berthPreference} | Food: ${p.foodChoice}`
      ),
      `\nOfficial Booking URL: ${IRCTC_OFFICIAL_SEARCH_URL}?from=${fromCode}&to=${toCode}&date=${journeyDate}`,
    ];
    navigator.clipboard.writeText(rosterLines.join("\n"));
    toast.success("Passenger details copied to clipboard. Paste easily into IRCTC NGeT booking form!");
  };

  const handleOfficialIrctcHandoff = () => {
    if (quota === "TATKAL (TQ)" && passengers.length > 4) {
      toast.error("Indian Railways limits Tatkal bookings to 4 passengers maximum.");
      return;
    }
    const irctcUrl = `${IRCTC_OFFICIAL_SEARCH_URL}?from=${encodeURIComponent(fromCode)}&to=${encodeURIComponent(toCode)}&date=${encodeURIComponent(journeyDate)}`;
    toast.success(`Redirecting to official IRCTC e-Ticketing System (NGeT) for ${fromCode} ➔ ${toCode}...`);
    logTravelPartnerBooking({
      bookingType: "TRAIN",
      partnerProvider: "TRAVELPAYOUTS",
      carrierName: "Indian Railways (IRCTC)",
      routeSummary: `${fromCode} ➔ ${toCode}`,
      fareAmountInr: 0,
      affiliateDeepLink: irctcUrl,
      bookingStatus: "HANDOFF_COMPLETED",
    }).catch(() => {});
    window.open(irctcUrl, "_blank", "noopener,noreferrer");
  };

  const handleOfficialPnrCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pnrNumber.replace(/\D/g, "");
    if (clean.length !== 10) {
      toast.error("Indian Railways PNR must contain exactly 10 numeric digits.");
      return;
    }
    const officialPnrUrl = `${INDIAN_RAIL_PNR_URL}?pnrno=${clean}`;
    toast.success(`Opening official CRIS Indian Railways PNR verification for PNR ${clean}...`);
    window.open(officialPnrUrl, "_blank", "noopener,noreferrer");
  };

  const irctcDirectSearchUrl = `${IRCTC_OFFICIAL_SEARCH_URL}?from=${encodeURIComponent(fromCode)}&to=${encodeURIComponent(toCode)}&date=${encodeURIComponent(journeyDate)}`;

  const handleCopySearchLink = () => {
    navigator.clipboard.writeText(irctcDirectSearchUrl);
    toast.success("Direct official IRCTC search link copied to clipboard!");
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* PSP Authorization & Compliance Header */}
      <div className="rounded-3xl border border-amber-300/40 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-400/20 text-amber-300 border border-amber-400/40">
                <Lock className="size-3.5" />
                IRCTC PSP Status: Discovery &amp; Preparation Mode
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                <CheckCircle2 className="size-3" />
                Zero Agent Markup Handoff
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Official Indian Railways &amp; IRCTC Rail Gateway
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              OrderKing prepares your passenger roster, verifies station pairs, checks quota rules, and seamlessly transfers your booking directly to the official IRCTC Next Generation e-Ticketing System (NGeT). Direct in-app ticket issuance remains locked until STQC application certification and CRIS PRS peering are completed.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowApprovalsAudit(!showApprovalsAudit)}
              className="rounded-xl border-amber-300/30 bg-white/10 hover:bg-white/20 text-amber-200 text-xs font-bold"
            >
              <Info className="size-3.5 mr-1 text-amber-300" />
              {showApprovalsAudit ? "Hide Approvals Audit" : "Provider Compliance Audit"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRefundRules(!showRefundRules)}
              className="rounded-xl border-white/20 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold"
            >
              <FileText className="size-3.5 mr-1 text-sky-300" />
              {showRefundRules ? "Hide Refund Rules" : "Refunds & TDR Rules 2015"}
            </Button>
          </div>
        </div>

        {/* Missing Approvals Audit Drawer */}
        {showApprovalsAudit && (
          <div className="mt-5 pt-4 border-t border-white/15 rounded-2xl bg-slate-900/90 p-4.5 space-y-3 text-xs text-slate-200">
            <div className="flex items-center gap-2 text-amber-300 font-black">
              <ShieldAlert className="size-4" />
              <span>IRCTC / CRIS Authorization Audit Checklist (Mandatory for In-App Direct PRS Issuance)</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Under Indian Railways e-Ticketing Policy and CRIS (Centre for Railway Information Systems) Guidelines, no third-party platform may issue live Indian Railways tickets or simulate synthetic PNRs without the following five legal &amp; technical authorizations:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-1">
                <span className="font-extrabold text-amber-300 block">1. IRCTC PSP / B2C Agreement</span>
                <span className="text-slate-400">Formal agreement executed with IRCTC (Indian Railway Catering and Tourism Corp.) under Principal Service Provider B2C scheme.</span>
                <span className="text-[10px] text-emerald-400 font-bold block">Status: Official IRCTC Portal Handoff Active</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-1">
                <span className="font-extrabold text-amber-300 block">2. CRIS Security Architecture Audit</span>
                <span className="text-slate-400">CRIS cybersecurity audit clearance for API handoffs, bot prevention, and anti-scraping CAPTCHA integration.</span>
                <span className="text-[10px] text-emerald-400 font-bold block">Status: Official IRCTC Portal Protocol</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-1">
                <span className="font-extrabold text-amber-300 block">3. STQC Application Certification</span>
                <span className="text-slate-400">Directorate of Standardisation Testing and Quality Certification (MeitY) certifying application security, load, and reservation logic.</span>
                <span className="text-[10px] text-emerald-400 font-bold block">Status: Direct Government Network Routing</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-1">
                <span className="font-extrabold text-amber-300 block">4. Dedicated MPLS VPN &amp; DSC Signing</span>
                <span className="text-slate-400">Dedicated leased line peering directly with CRIS PRS servers with Class 3 Digital Signature Certificate (DSC) request signing.</span>
                <span className="text-[10px] text-emerald-400 font-bold block">Status: Official Government Network Routing</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/30 text-[11px] text-slate-300">
              <span className="font-extrabold text-amber-300 block mb-0.5">5. Rolling Bank Guarantee with IRCTC</span>
              <span>Maintenance of cash rolling deposit or irrevocable bank guarantee with IRCTC for continuous real-time inventory debit.</span>
            </div>
          </div>
        )}

        {/* Indian Railways Refund Rules 2015 Transparency Drawer */}
        {showRefundRules && (
          <div className="mt-5 pt-4 border-t border-white/15 rounded-2xl bg-slate-900/90 p-4.5 space-y-3 text-xs text-slate-200">
            <div className="flex items-center gap-2 text-sky-300 font-black">
              <FileText className="size-4" />
              <span>Official Indian Railways Refund Rules (Gazette Notification 2015)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div className="space-y-2 bg-slate-950/80 p-3 rounded-xl border border-white/10">
                <span className="font-bold text-white block">Confirmed Ticket Cancellation Charges (Before Chart Preparation):</span>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li><strong>&gt; 48 hours before departure:</strong> Flat clerkage per passenger:
                    <br />• AC 1st / Executive: ₹240 + GST
                    <br />• AC 2 Tier / First: ₹200 + GST
                    <br />• AC 3 Tier / AC Chair / 3E: ₹180 + GST
                    <br />• Sleeper Class: ₹120
                    <br />• Second Class (2S): ₹60
                  </li>
                  <li><strong>Between 48 hours &amp; 12 hours:</strong> 25% of the fare subject to minimum flat cancellation charge.</li>
                  <li><strong>Between 12 hours &amp; 4 hours (up to Charting):</strong> 50% of the fare subject to minimum flat charge.</li>
                  <li><strong>Less than 4 hours / Post Charting:</strong> No refund on confirmed e-tickets.</li>
                </ul>
              </div>

              <div className="space-y-2 bg-slate-950/80 p-3 rounded-xl border border-white/10">
                <span className="font-bold text-white block">RAC, Waitlist &amp; TDR (Ticket Deposit Receipt) Guidelines:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li><strong>RAC / Waitlist:</strong> Can be cancelled up to 30 mins before scheduled departure. Flat clerkage ₹60 + GST per passenger.</li>
                  <li><strong>Train Cancelled by Railways:</strong> 100% full refund automatically credited to your original bank/UPI account. No TDR filing required.</li>
                  <li><strong>Train Running Late &gt; 3 Hours:</strong> Full fare refund admissible if passenger does not travel; file TDR on IRCTC before actual departure.</li>
                  <li><strong>AC Failure in Coach:</strong> File TDR on IRCTC with GC (Guard Certificate) for fare difference refund between AC and Non-AC.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Train Route, Date & Quota Selector */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Train className="size-5 text-indigo-600" />
            <h3 className="text-base font-black text-slate-900">
              Select Stations, Quota &amp; Journey Date
            </h3>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Authentic CRIS PRS Station Codes
            </span>
            <a
              href={irctcDirectSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => toast.success(`Redirecting to official IRCTC portal for ${fromCode} ➔ ${toCode}...`)}
              className="h-8 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs inline-flex items-center gap-1.5 transition no-underline shadow-sm"
            >
              <span>Search on IRCTC</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
          {/* Origin Station */}
          <div className="relative bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition">
            <label className="text-[10px] font-bold text-slate-500 flex items-center justify-between mb-1 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><MapPin className="size-3 text-indigo-600" /> From Station</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setFromQuery(e.target.value);
                  setShowFromSuggestions(true);
                }}
                onFocus={() => setShowFromSuggestions(true)}
                className="w-full bg-transparent text-sm font-black outline-none text-slate-900 placeholder:text-slate-400"
                placeholder="Station or code"
              />
              <button
                type="button"
                onClick={handleSwapStations}
                title="Swap stations"
                className="size-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 transition"
              >
                <ArrowLeftRight className="size-3.5" />
              </button>
            </div>

            {showFromSuggestions && fromStations.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-30 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                {fromStations.map((st) => (
                  <button
                    key={st.code}
                    type="button"
                    onClick={() => {
                      setFrom(`${st.city} (${st.code})`);
                      setShowFromSuggestions(false);
                    }}
                    className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-left text-xs hover:bg-indigo-50 transition"
                  >
                    <span className="font-bold text-slate-900">{st.city}</span>
                    <span className="font-mono text-[10px] font-black bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                      {st.code}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Destination Station */}
          <div className="relative bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition">
            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <MapPin className="size-3 text-indigo-600" /> To Station
            </label>
            <input
              type="text"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setToQuery(e.target.value);
                setShowToSuggestions(true);
              }}
              onFocus={() => setShowToSuggestions(true)}
              className="w-full bg-transparent text-sm font-black outline-none text-slate-900 placeholder:text-slate-400"
              placeholder="Station or code"
            />

            {showToSuggestions && toStations.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-30 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                {toStations.map((st) => (
                  <button
                    key={st.code}
                    type="button"
                    onClick={() => {
                      setTo(`${st.city} (${st.code})`);
                      setShowToSuggestions(false);
                    }}
                    className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-left text-xs hover:bg-indigo-50 transition"
                  >
                    <span className="font-bold text-slate-900">{st.city}</span>
                    <span className="font-mono text-[10px] font-black bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                      {st.code}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Journey Date */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition">
            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <Calendar className="size-3 text-indigo-600" /> Journey Date
            </label>
            <input
              type="date"
              value={journeyDate}
              onChange={(e) => setJourneyDate(e.target.value)}
              className="w-full bg-transparent text-sm font-black outline-none text-slate-900"
            />
          </div>

          {/* Quota */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition">
            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <Tag className="size-3 text-indigo-600" /> Quota
            </label>
            <select
              value={quota}
              onChange={(e) => setQuota(e.target.value as any)}
              className="w-full bg-transparent text-sm font-black outline-none text-slate-900 cursor-pointer"
            >
              <option value="GENERAL (GN)">General (GN)</option>
              <option value="TATKAL (TQ)">Tatkal (TQ)</option>
              <option value="LADIES (LD)">Ladies (LD)</option>
              <option value="SENIOR CITIZEN (SS)">Senior Citizen (SS)</option>
              <option value="DIVYANGJAN (HP)">Divyangjan (HP)</option>
            </select>
          </div>

          {/* Class */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition">
            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <Train className="size-3 text-indigo-600" /> Class
            </label>
            <select
              value={trainClass}
              onChange={(e) => setTrainClass(e.target.value as any)}
              className="w-full bg-transparent text-sm font-black outline-none text-slate-900 cursor-pointer"
            >
              <option value="3A">AC 3 Tier (3A)</option>
              <option value="2A">AC 2 Tier (2A)</option>
              <option value="1A">AC 1st Class (1A)</option>
              <option value="3E">AC 3 Economy (3E)</option>
              <option value="CC">AC Chair Car (CC)</option>
              <option value="EC">Exec. Chair Car (EC)</option>
              <option value="SL">Sleeper (SL)</option>
              <option value="2S">Second Sitting (2S)</option>
            </select>
          </div>
        </div>

        {/* Quick Date Shortcuts */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-400 text-[11px]">Quick Dates:</span>
            <button
              type="button"
              onClick={() => handleSetQuickDate(0)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-[11px]"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleSetQuickDate(1)}
              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition text-[11px]"
            >
              Tomorrow (Tatkal Window)
            </button>
            <button
              type="button"
              onClick={() => handleSetQuickDate(7)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-[11px]"
            >
              Next Week (+7d)
            </button>
            <button
              type="button"
              onClick={() => handleSetQuickDate(120)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-[11px]"
            >
              ARP Limit (+120d)
            </button>
          </div>

          {quota === "TATKAL (TQ)" && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
              <Clock className="size-3.5 text-amber-600" />
              <span>Tatkal Timings: 10:00 AM IST (AC) / 11:00 AM IST (Non-AC) on day prior</span>
            </div>
          )}
        </div>
      </div>

      {/* Primary Frictionless Action: Prominent Official IRCTC Handoff Card */}
      <div className="rounded-3xl border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl space-y-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <ShieldCheck className="size-3.5" />
                Primary Action: Official IRCTC Direct Handoff
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                <Tag className="size-3" />
                ₹0 OrderKing Booking Markup
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Train className="size-6 text-indigo-400" />
              <span>Real-Time PRS Reservation ({fromCode} ➔ {toCode})</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time seat inventory, dynamic Tatkal quotas, waitlist status, and confirmed reservations are managed exclusively by Indian Railways PRS on the official IRCTC portal. OrderKing provides zero-friction direct handoff with ₹0 platform markup.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <a
              href={irctcDirectSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                toast.success(`Redirecting to official IRCTC NGeT portal for ${fromCode} ➔ ${toCode}...`);
                logTravelPartnerBooking({
                  bookingType: "TRAIN",
                  partnerProvider: "TRAVELPAYOUTS",
                  carrierName: "Indian Railways (IRCTC)",
                  routeSummary: `${fromCode} ➔ ${toCode}`,
                  fareAmountInr: 0,
                  affiliateDeepLink: irctcDirectSearchUrl,
                  bookingStatus: "HANDOFF_COMPLETED",
                }).catch(() => {});
              }}
              className="h-13 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-black text-sm shadow-lg shadow-indigo-600/30 inline-flex items-center justify-center gap-2 transition no-underline"
            >
              <span>Search &amp; Book on Official IRCTC</span>
              <ArrowRight className="size-4" />
            </a>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopySearchLink}
                className="flex-1 rounded-xl border-white/20 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold"
              >
                <ExternalLink className="size-3.5 mr-1 text-sky-300" /> Copy Search URL
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyPassengerRoster}
                className="flex-1 rounded-xl border-white/20 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold"
              >
                <Copy className="size-3.5 mr-1 text-emerald-300" /> Copy Roster
              </Button>
            </div>
          </div>
        </div>

        {/* Live Query Parameters Strip */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-400/20 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="font-mono text-slate-400 text-[11px]">
              Direct Search Parameters:
            </span>
            <span className="font-bold text-amber-300 text-[11px]">
              Class: {trainClass} · Quota: {quota} · Date: {journeyDate}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-white/10 font-mono text-xs text-indigo-300 overflow-x-auto">
            <span className="truncate">{irctcDirectSearchUrl}</span>
            <button
              type="button"
              onClick={handleCopySearchLink}
              className="text-[11px] text-white hover:text-indigo-200 font-sans font-bold underline shrink-0 ml-2"
            >
              Copy
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-300 pt-1">
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 text-amber-400 shrink-0" />
              <span><strong>Tatkal AC:</strong> 10:00 AM IST Journey Eve</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 text-amber-400 shrink-0" />
              <span><strong>Tatkal Non-AC:</strong> 11:00 AM IST Journey Eve</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-emerald-400 shrink-0" />
              <span><strong>Charting:</strong> 4h &amp; 30m prior to departure</span>
            </div>
          </div>
        </div>
      </div>

      {/* Passenger Details & IRCTC Roster Builder */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600">
              Pre-Booking Preparation
            </span>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mt-0.5">
              <Users className="size-5 text-indigo-600" />
              Passenger Details &amp; IRCTC User Builder
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyPassengerRoster}
              className="rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-bold"
            >
              <Copy className="size-3.5 mr-1" /> Copy Roster for IRCTC
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPassengerBuilder(!showPassengerBuilder)}
              className="rounded-xl text-slate-600 text-xs font-bold"
            >
              {showPassengerBuilder ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          </div>
        </div>

        {showPassengerBuilder && (
          <div className="space-y-4">
            {/* IRCTC User ID & Contact Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  IRCTC User ID (Mandatory for Login)
                </label>
                <input
                  type="text"
                  value={irctcUserId}
                  onChange={(e) => setIrctcUserId(e.target.value.trim())}
                  placeholder="e.g. sharma_rail24"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold font-mono text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
                {irctcUserId.length > 0 && !isIrctcUserIdValid(irctcUserId) && (
                  <span className="text-[10px] text-rose-600 font-semibold block mt-0.5">
                    Must start with a letter, 3-35 alphanumeric/underscore characters.
                  </span>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Passenger Mobile (For SMS Charting Alerts)
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={contactMobile}
                  onChange={(e) => setContactMobile(e.target.value.replace(/\D/g, ""))}
                  placeholder="10-digit mobile"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold font-mono text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Passenger Email (For E-Ticket PDF)
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value.trim())}
                  placeholder="name@example.com"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Passenger Rows */}
            <div className="space-y-3">
              {passengers.map((pax, idx) => (
                <div
                  key={pax.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-200 transition space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span className="size-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      Traveler #{idx + 1}
                      {pax.isSeniorCitizenQuotaEligible && (
                        <span className="text-[10px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                          Senior Citizen Quota Eligible (Lower Berth Recommended)
                        </span>
                      )}
                    </span>
                    {passengers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePassenger(pax.id)}
                        className="text-xs text-rose-600 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Full Name (As on Govt ID)
                      </label>
                      <input
                        type="text"
                        value={pax.fullName}
                        onChange={(e) => handleUpdatePassenger(pax.id, "fullName", e.target.value)}
                        placeholder="e.g. Ramesh Chandra"
                        className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Age
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={pax.age}
                        onChange={(e) => handleUpdatePassenger(pax.id, "age", e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Gender
                      </label>
                      <select
                        value={pax.gender}
                        onChange={(e) => handleUpdatePassenger(pax.id, "gender", e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="transgender">Transgender</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Berth Preference
                      </label>
                      <select
                        value={pax.berthPreference}
                        onChange={(e) => handleUpdatePassenger(pax.id, "berthPreference", e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="No Preference">No Preference</option>
                        <option value="Lower Berth">Lower Berth</option>
                        <option value="Middle Berth">Middle Berth</option>
                        <option value="Upper Berth">Upper Berth</option>
                        <option value="Side Lower">Side Lower</option>
                        <option value="Side Upper">Side Upper</option>
                        <option value="Window Seat">Window Seat (CC)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Food Choice (Catering)
                      </label>
                      <select
                        value={pax.foodChoice}
                        onChange={(e) => handleUpdatePassenger(pax.id, "foodChoice", e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="Veg">Vegetarian</option>
                        <option value="Non-Veg">Non-Vegetarian</option>
                        <option value="Jain Meal">Jain Meal</option>
                        <option value="No Food">No Food (Opt-Out)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPassenger}
                disabled={passengers.length >= (quota === "TATKAL (TQ)" ? 4 : 6)}
                className="rounded-xl border-dashed border-slate-300 text-slate-700 text-xs font-bold"
              >
                + Add Another Passenger ({passengers.length}/{quota === "TATKAL (TQ)" ? 4 : 6})
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={handleCopyPassengerRoster}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black"
                >
                  <Copy className="size-3.5 mr-1.5" />
                  Copy Roster
                </Button>
                <Button
                  type="button"
                  onClick={handleOfficialIrctcHandoff}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20"
                >
                  <span>Proceed to IRCTC NGeT</span>
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Official Indian Railways PNR Status & CRIS NTES Live Tracking Strip */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">
              Official Indian Railways Reference Services
            </span>
            <h3 className="text-sm font-black text-slate-900">
              Live PNR Verification &amp; CRIS NTES Live Train Tracker
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            Government CRIS PRS Direct Endpoints
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* 10-digit PNR direct verification */}
          <form onSubmit={handleOfficialPnrCheck} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="text-[11px] font-bold text-slate-700 block">
              Official 10-Digit PNR Status (CRIS PRS Enquiry)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={10}
                value={pnrNumber}
                onChange={(e) => setPnrNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 10-digit PNR"
                className="flex-1 h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
              <Button
                type="submit"
                disabled={pnrNumber.length !== 10}
                className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-black shrink-0"
              >
                <span>Check on IndianRail.gov.in</span>
                <ExternalLink className="size-3.5 ml-1" />
              </Button>
            </div>
            <span className="text-[10px] text-slate-500 block">
              Official Indian Railways PNR status verified directly on indianrail.gov.in with live railway records.
            </span>
          </form>

          {/* CRIS NTES Live Train Running Status */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-700 block">
                CRIS NTES Live Train Running Status &amp; Spot Your Train
              </span>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Track live platform announcements, delay minutes, and upcoming stations directly on the National Train Enquiry System.
              </p>
            </div>
            <a
              href={CRIS_NTES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black inline-flex items-center justify-center gap-1.5 no-underline transition"
            >
              <span>Open CRIS NTES Live Running Status</span>
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
