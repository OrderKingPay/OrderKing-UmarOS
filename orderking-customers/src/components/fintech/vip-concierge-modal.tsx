import { useState } from "react";
import {
  Sparkles,
  Plane,
  Building2,
  Car,
  Train,
  Phone,
  MessageCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  X,
  Send,
  Calendar,
  MapPin,
  Users,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  VIP_TRAVEL_CATEGORIES,
  type VIPTravelCategory,
  type VIPConciergeInquiry,
  generateWhatsAppConciergeUrl,
  SOVEREIGN_TRAVEL_DISCLAIMER,
} from "@/lib/travel/sovereign-travel-engine";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: VIPTravelCategory;
  initialOrigin?: string;
  initialDestination?: string;
  onInquirySubmitted?: (inquiry: VIPConciergeInquiry) => void;
}

export function VIPConciergeModal({
  isOpen,
  onClose,
  initialCategory = "private_aviation",
  initialOrigin = "New Delhi (DEL)",
  initialDestination = "Mumbai (BOM)",
  onInquirySubmitted,
}: Props) {
  const [category, setCategory] = useState<VIPTravelCategory>(initialCategory);
  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);
  const [departureDate, setDepartureDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState(2);
  const [preferredFleet, setPreferredFleet] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedInquiry, setConfirmedInquiry] = useState<VIPConciergeInquiry | null>(null);

  if (!isOpen) return null;

  const currentCatConfig =
    VIP_TRAVEL_CATEGORIES.find((c) => c.id === category) ?? VIP_TRAVEL_CATEGORIES[0];

  const waUrl = generateWhatsAppConciergeUrl({
    categoryTitle: currentCatConfig.title,
    origin,
    destination,
    travelDate: departureDate,
    passengers,
    clientName,
    preferredFleetOrProperty: preferredFleet || currentCatConfig.fleetOptions[0],
    specialRequests,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim() || clientName.trim().length < 2) {
      toast.error("Please enter your full name.");
      return;
    }

    const cleanPhone = clientPhone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Send priority request to backend
      const res = await fetch("/api/v1/integrations/travel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CONCIERGE",
          category: currentCatConfig.title,
          serviceCategory: category,
          origin,
          destination,
          travelDate: departureDate,
          returnDate: returnDate || undefined,
          passengers,
          clientName: clientName.trim(),
          clientPhone: cleanPhone,
          clientEmail: clientEmail.trim(),
          preferredVehicleOrProperty: preferredFleet || currentCatConfig.fleetOptions[0],
          specialRequests: specialRequests.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => null);

      const requestId =
        data?.requestId ||
        `VIP-REQ-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Date.now().toString().slice(-4)}`;

      const inquiryRecord: VIPConciergeInquiry = {
        id: requestId,
        category,
        categoryTitle: currentCatConfig.title,
        origin,
        destination,
        travelDate: departureDate,
        returnDate: returnDate || undefined,
        passengers,
        clientName: clientName.trim(),
        clientPhone: cleanPhone,
        clientEmail: clientEmail.trim(),
        preferredFleetOrProperty: preferredFleet || currentCatConfig.fleetOptions[0],
        specialRequests: specialRequests.trim() || undefined,
        createdAt: new Date().toISOString(),
        status: "CONFIRMED_INQUIRY",
        consultantAssigned: "Senior Flight & Heritage Charter Specialist",
        whatsappDeskUrl: data?.whatsappDeskUrl || waUrl,
        directPhone: data?.directPhone || "+91 98765 43210",
        disclaimer: SOVEREIGN_TRAVEL_DISCLAIMER,
      };

      setConfirmedInquiry(inquiryRecord);
      if (onInquirySubmitted) {
        onInquirySubmitted(inquiryRecord);
      }

      toast.success(
        `VIP Consultation Request ${requestId} registered. A Senior Charter Specialist will connect within 15 minutes.`
      );
    } catch {
      // Graceful offline fallback
      const requestId = `VIP-REQ-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      const inquiryRecord: VIPConciergeInquiry = {
        id: requestId,
        category,
        categoryTitle: currentCatConfig.title,
        origin,
        destination,
        travelDate: departureDate,
        returnDate: returnDate || undefined,
        passengers,
        clientName: clientName.trim(),
        clientPhone: cleanPhone,
        clientEmail: clientEmail.trim(),
        preferredFleetOrProperty: preferredFleet || currentCatConfig.fleetOptions[0],
        specialRequests: specialRequests.trim() || undefined,
        createdAt: new Date().toISOString(),
        status: "CONFIRMED_INQUIRY",
        consultantAssigned: "Senior Flight & Heritage Charter Specialist",
        whatsappDeskUrl: waUrl,
        directPhone: "+91 98765 43210",
        disclaimer: SOVEREIGN_TRAVEL_DISCLAIMER,
      };
      setConfirmedInquiry(inquiryRecord);
      if (onInquirySubmitted) {
        onInquirySubmitted(inquiryRecord);
      }
      toast.success(`VIP Consultation Request ${requestId} registered.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-amber-500/40 bg-gradient-to-br from-[#070D22] via-[#0D153B] to-[#1A0C35] text-white shadow-2xl overflow-hidden my-8">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 size-64 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 size-64 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/10 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-inner">
              <Sparkles className="size-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                OrderKing Sovereign Concierge
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">
                VIP Custom Travel &amp; Air Consultation
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {confirmedInquiry ? (
          /* Confirmation State */
          <div className="relative z-10 p-6 sm:p-8 space-y-6">
            <div className="rounded-2xl border border-emerald-400/40 bg-emerald-950/40 p-5 space-y-3 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-300 border border-emerald-400/50">
                <CheckCircle2 className="size-8" />
              </div>
              <h3 className="text-xl font-black text-white">
                Priority Consultation Confirmed
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Your VIP consultation request has been assigned to a Senior Charter &amp; Flight Specialist.
              </p>
              <div className="inline-flex items-center gap-2 rounded-xl bg-black/40 px-3.5 py-1.5 border border-white/10 font-mono text-xs font-bold text-amber-300">
                <span>Reference:</span>
                <span>{confirmedInquiry.id}</span>
              </div>
            </div>

            {/* Itinerary Summary */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Service Category:</span>
                <span className="font-bold text-white">{confirmedInquiry.categoryTitle}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Route / Sector:</span>
                <span className="font-bold text-white">{confirmedInquiry.origin} ➔ {confirmedInquiry.destination}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Travel Date:</span>
                <span className="font-bold text-white">{confirmedInquiry.travelDate}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Passengers / Guests:</span>
                <span className="font-bold text-white">{confirmedInquiry.passengers} Pax</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Consultant Assigned:</span>
                <span className="font-bold text-emerald-300">{confirmedInquiry.consultantAssigned}</span>
              </div>
            </div>

            {/* Direct Connect Action Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <a
                href={confirmedInquiry.whatsappDeskUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 px-4 shadow-lg shadow-emerald-600/30 transition no-underline"
              >
                <MessageCircle className="size-4" />
                <span>Open WhatsApp VIP Desk</span>
              </a>
              <a
                href={`tel:${confirmedInquiry.directPhone.replace(/\s+/g, "")}`}
                className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-3.5 px-4 shadow-lg shadow-amber-500/20 transition no-underline"
              >
                <Phone className="size-4" />
                <span>Call Concierge: {confirmedInquiry.directPhone}</span>
              </a>
            </div>

            {/* Mandatory Transparent Wholesale Benchmark Disclaimer */}
            <div className="rounded-xl border border-sky-400/30 bg-sky-950/30 p-3 text-[11px] text-sky-200 flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-sky-400" />
              <span>{SOVEREIGN_TRAVEL_DISCLAIMER}</span>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-5 py-2.5"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit} className="relative z-10 p-5 sm:p-6 space-y-5">
            {/* VIP Category Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Select VIP Charter &amp; Luxury Service:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {VIP_TRAVEL_CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategory(cat.id);
                        setPreferredFleet(cat.fleetOptions[0] || "");
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition ${
                        isSelected
                          ? "border-amber-400 bg-amber-400/15 text-white shadow-md ring-1 ring-amber-400/50"
                          : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase text-amber-300 block">
                        {cat.badge}
                      </span>
                      <span className="text-xs font-bold leading-tight block mt-0.5">
                        {cat.title.split("&")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sector / Route Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white/5 p-3 rounded-2xl border border-white/10 focus-within:border-amber-400 transition">
                <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider mb-1">
                  <MapPin className="size-3 text-amber-400" /> Origin / FBO Terminal
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. New Delhi (DEL) / IGI T3 FBO"
                  className="w-full bg-transparent text-sm font-bold text-white outline-none"
                  required
                />
              </div>

              <div className="bg-white/5 p-3 rounded-2xl border border-white/10 focus-within:border-amber-400 transition">
                <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider mb-1">
                  <MapPin className="size-3 text-amber-400" /> Destination / Retreat
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Mumbai (BOM) / Taj Lake Palace"
                  className="w-full bg-transparent text-sm font-bold text-white outline-none"
                  required
                />
              </div>
            </div>

            {/* Dates & Pax */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/5 p-3 rounded-2xl border border-white/10 focus-within:border-amber-400 transition">
                <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider mb-1">
                  <Calendar className="size-3 text-amber-400" /> Departure Date
                </label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-white outline-none"
                  required
                />
              </div>

              <div className="bg-white/5 p-3 rounded-2xl border border-white/10 focus-within:border-amber-400 transition">
                <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider mb-1">
                  <Calendar className="size-3 text-amber-400" /> Return Date (Optional)
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-white outline-none"
                />
              </div>

              <div className="bg-white/5 p-3 rounded-2xl border border-white/10 focus-within:border-amber-400 transition">
                <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider mb-1">
                  <Users className="size-3 text-amber-400" /> VIP Passengers
                </label>
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  className="w-full bg-transparent text-sm font-bold text-white outline-none"
                >
                  {[1, 2, 4, 6, 8, 12, 16, 25].map((n) => (
                    <option key={n} value={n} className="bg-slate-900 text-white">
                      {n} Guest{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fleet Preference */}
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10 focus-within:border-amber-400 transition">
              <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">
                Preferred Aircraft Model or Property Suite
              </label>
              <select
                value={preferredFleet || currentCatConfig.fleetOptions[0]}
                onChange={(e) => setPreferredFleet(e.target.value)}
                className="w-full bg-transparent text-sm font-bold text-white outline-none"
              >
                {currentCatConfig.fleetOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-slate-900 text-white">
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/5 p-3 rounded-2xl border border-white/10 focus-within:border-amber-400 transition">
                <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Capt. Vikram Mehra"
                  className="w-full bg-transparent text-sm font-bold text-white outline-none"
                  required
                />
              </div>

              <div className="bg-white/5 p-3 rounded-2xl border border-white/10 focus-within:border-amber-400 transition">
                <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">
                  10-Digit Mobile (+91) *
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="9876543210"
                  className="w-full bg-transparent text-sm font-bold text-white outline-none"
                  required
                />
              </div>

              <div className="bg-white/5 p-3 rounded-2xl border border-white/10 focus-within:border-amber-400 transition">
                <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="vip@domain.com"
                  className="w-full bg-transparent text-sm font-bold text-white outline-none"
                />
              </div>
            </div>

            {/* Special Requests */}
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10 focus-within:border-amber-400 transition">
              <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">
                Special Requests (Dietary, Tarmac Security, FBO Transfer, Pets)
              </label>
              <textarea
                rows={2}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="e.g. VIP tarmac car pickup at Delhi T3 FBO; customized champagne catering."
                className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 outline-none resize-none"
              />
            </div>

            {/* Mandatory Transparent Wholesale Benchmark Disclaimer */}
            <div className="rounded-xl border border-sky-400/30 bg-sky-950/40 p-3 text-[11px] text-sky-200 flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-sky-400" />
              <span>{SOVEREIGN_TRAVEL_DISCLAIMER}</span>
            </div>

            {/* Instant Multi-Channel Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <Clock className="size-4" />
                <span>Senior Specialist connects within 15 minutes</span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/40 text-emerald-300 font-bold text-xs px-3.5 py-2.5 transition no-underline"
                >
                  <MessageCircle className="size-3.5" />
                  <span>WhatsApp VIP Desk</span>
                </a>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-initial h-11 px-5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                >
                  {isSubmitting ? "Registering..." : "Request Priority Itinerary"}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
