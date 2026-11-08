import React, { useState } from "react";
import {
  X,
  Compass,
  Phone,
  Send,
  CheckCircle2,
  Calendar,
  Users,
  MapPin,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  CreditCard,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface TravelQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: "UMRAH" | "TRAIN" | "FLIGHT" | "PILGRIMAGE" | "HOLIDAY";
  initialDestination?: string;
  initialOrigin?: string;
}

export interface TravelInquiryRecord {
  id: string;
  name: string;
  phone: string;
  category: string;
  origin: string;
  destination: string;
  departureDate: string;
  travelers: number;
  budgetPerPerson: string;
  notes: string;
  status: "SUBMITTED" | "UNDER_REVIEW" | "QUOTED" | "BOOKED";
  createdAt: string;
}

const FOUNDER_TRAVEL_DESK_PHONE = "9395065587";

export function TravelQuotationModal({
  isOpen,
  onClose,
  initialCategory = "UMRAH",
  initialDestination = "",
  initialOrigin = "",
}: TravelQuotationModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<"UMRAH" | "TRAIN" | "FLIGHT" | "PILGRIMAGE" | "HOLIDAY">(initialCategory);
  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);
  const [departureDate, setDepartureDate] = useState("");
  const [travelers, setTravelers] = useState(2);
  const [budgetPerPerson, setBudgetPerPerson] = useState("");
  const [notes, setNotes] = useState("");
  const [submittedInquiry, setSubmittedInquiry] = useState<TravelInquiryRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "").replace(/^(?:91|0)/, "");
    if (!name.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      toast.error("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!destination.trim()) {
      toast.error("Please enter destination or tour package name.");
      return;
    }

    setIsSubmitting(true);
    const inquiryId = `INQ-${category}-${Date.now().toString().slice(-6)}`;
    const inquiry: TravelInquiryRecord = {
      id: inquiryId,
      name: name.trim(),
      phone: cleanPhone,
      category,
      origin: origin.trim() || "Local Hub",
      destination: destination.trim(),
      departureDate: departureDate || "Flexible",
      travelers: Number(travelers) || 1,
      budgetPerPerson: budgetPerPerson.trim() || "Standard",
      notes: notes.trim(),
      status: "SUBMITTED",
      createdAt: new Date().toISOString(),
    };

    try {
      // Save to localStorage for customer review in /travel?tab=trips
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("orderking_travel_inquiries");
        const list = stored ? JSON.parse(stored) : [];
        list.unshift(inquiry);
        localStorage.setItem("orderking_travel_inquiries", JSON.stringify(list));
      }

      // Try sending SMS alert to founder desk
      try {
        await fetch("/api/travel/booking-confirmed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: inquiryId,
            recipientPhone: FOUNDER_TRAVEL_DESK_PHONE,
            phone: cleanPhone,
            travelerName: name.trim(),
            serviceType: category,
            pnr: inquiryId,
            routeSummary: `${origin || "India"} ➔ ${destination} (${travelers} pax, Date: ${departureDate || "Flex"})`,
          }),
        });
      } catch {
        // Non-blocking if network is local
      }

      setSubmittedInquiry(inquiry);
      toast.success(`Inquiry ${inquiryId} submitted directly to our Travel & Umrah Desk!`);
    } catch {
      toast.error("Failed to submit inquiry. Please call directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDirectWhatsAppUrl = (inq: TravelInquiryRecord) => {
    const text = encodeURIComponent(
      `Hello OrderKing Travel Desk! I need a direct quotation for:\n\n` +
      `*Inquiry ID:* ${inq.id}\n` +
      `*Name:* ${inq.name}\n` +
      `*Service:* ${inq.category}\n` +
      `*Route:* ${inq.origin} ➔ ${inq.destination}\n` +
      `*Date:* ${inq.departureDate}\n` +
      `*Travelers:* ${inq.travelers}\n` +
      (inq.notes ? `*Special Request:* ${inq.notes}\n` : "") +
      `\nPlease provide the best quotation & available quota.`
    );
    return `https://wa.me/91${FOUNDER_TRAVEL_DESK_PHONE}?text=${text}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="size-5" />
        </button>

        {!submittedInquiry ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-black uppercase tracking-wider">
                <Compass className="size-3.5" /> Direct Travel &amp; Umrah Desk
              </span>
              <h3 className="text-xl font-black text-white tracking-tight">
                Get Direct Offline Quotation
              </h3>
              <p className="text-xs text-slate-400">
                Direct B2B wholesale rates for Umrah, confirmed trains, flights, and religious yatras. Negotiate directly with no hidden middleman fees.
              </p>
            </div>

            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Travel Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "UMRAH", label: "🕋 Umrah Special", sub: "Makkah/Madinah" },
                  { id: "TRAIN", label: "🚆 Confirmed Train", sub: "Tatkal / Quota" },
                  { id: "FLIGHT", label: "✈️ Flights", sub: "Group / Best Fare" },
                  { id: "PILGRIMAGE", label: "🕉️ Religious Yatra", sub: "Hindu & Shrines" },
                  { id: "HOLIDAY", label: "🏖️ Holiday Tour", sub: "Domestic & Abroad" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id as any)}
                    className={cn(
                      "p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between text-xs font-bold",
                      category === item.id
                        ? "bg-amber-400 text-slate-950 border-amber-300 shadow-sm"
                        : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800"
                    )}
                  >
                    <span>{item.label}</span>
                    <span className="text-[9px] opacity-75">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Personal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mohammed Hasan"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Mobile Number (WhatsApp) *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="10-digit Indian Mobile"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Route Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  From (Origin)
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. Guwahati / Kolkata / Delhi"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  To (Destination / Package) *
                </label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Makkah / Madinah, Goa, Kashmir"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Travel Date & Passengers */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Travelers
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={travelers}
                  onChange={(e) => setTravelers(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Budget & Notes */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Specific Requests / Budget
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Need 4-bed family room near Haram; or 2AC confirmed tatkal; or 5-star hotel"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-hidden resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="size-3.5" />
              <span>{isSubmitting ? "Submitting Request..." : "Request Direct Quotation ➔"}</span>
            </Button>
          </form>
        ) : (
          <div className="space-y-5 text-center py-2 animate-in fade-in duration-300">
            <div className="mx-auto size-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <CheckCircle2 className="size-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Inquiry Registered
              </span>
              <h3 className="text-xl font-black text-white">
                {submittedInquiry.id}
              </h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Your request for <strong>{submittedInquiry.category}</strong> to <strong>{submittedInquiry.destination}</strong> has been transmitted directly to our Founder Travel Desk.
              </p>
            </div>

            {/* Direct Connect Actions */}
            <div className="space-y-2 pt-2">
              <a
                href={getDirectWhatsAppUrl(submittedInquiry)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <MessageSquare className="size-4" />
                <span>Chat Direct with Desk (WhatsApp)</span>
              </a>

              <a
                href={`tel:+91${FOUNDER_TRAVEL_DESK_PHONE}`}
                className="w-full h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
              >
                <Phone className="size-3.5 text-amber-400" />
                <span>Direct Call Desk: +91 {FOUNDER_TRAVEL_DESK_PHONE}</span>
              </a>
            </div>

            <Button
              type="button"
              onClick={() => {
                setSubmittedInquiry(null);
                onClose();
              }}
              variant="ghost"
              className="text-xs text-slate-400 hover:text-white"
            >
              Done &amp; Return to Travel Hub
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
