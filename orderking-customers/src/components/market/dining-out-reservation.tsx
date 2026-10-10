import { useState } from "react";
import { Calendar, Clock, Users, Utensils, CheckCircle2, X, Sparkles, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface DiningOutReservationModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  restaurantId?: string;
  restaurantName?: string;
  restaurantArea?: string;
  cuisineSummary?: string;
}

export function DiningOutReservationModal({
  isOpen = false,
  onClose,
  restaurantId,
  restaurantName = "Royal Tandoor & Grill",
  restaurantArea = "GS Road, Central",
  cuisineSummary = "North Indian · Mughlai · Kebabs",
}: DiningOutReservationModalProps) {
  const [open, setOpen] = useState(isOpen);
  const [guestCount, setGuestCount] = useState<number>(2);
  const [selectedDate, setSelectedDate] = useState<string>("TODAY");
  const [selectedSlot, setSelectedSlot] = useState<string>("8:00 PM");
  const [seatingArea, setSeatingArea] = useState<"INDOOR" | "ROOFTOP" | "OUTDOOR" | "PRIVATE">("ROOFTOP");
  const [specialOccasion, setSpecialOccasion] = useState<string>("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

  const TIME_SLOTS = [
    { time: "12:30 PM", period: "Lunch" },
    { time: "1:00 PM", period: "Lunch" },
    { time: "1:30 PM", period: "Lunch" },
    { time: "7:00 PM", period: "Dinner" },
    { time: "7:30 PM", period: "Dinner" },
    { time: "8:00 PM", period: "Dinner" },
    { time: "8:30 PM", period: "Dinner" },
    { time: "9:00 PM", period: "Dinner" },
    { time: "9:30 PM", period: "Dinner" },
  ];

  const handleConfirm = () => {
    if (!guestName.trim()) {
      toast.error("Please enter guest name");
      return;
    }
    const code = `TB-${Math.floor(100000 + Math.random() * 900000)}`;
    setBookingRef(code);
    setIsConfirmed(true);
    toast.success("Table reservation confirmed! SMS sent.");
  };

  const handleClose = () => {
    setOpen(false);
    setIsConfirmed(false);
    onClose?.();
  };

  if (!open && !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface-2 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🥂</span>
              <h3 className="font-display text-base font-bold text-fg">Book a Table (Dining Out)</h3>
            </div>
            <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
              <MapPin className="size-3" /> {restaurantName} · {restaurantArea}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1.5 text-muted hover:bg-surface hover:text-fg transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs no-scrollbar">
          {isConfirmed ? (
            <div className="text-center py-6 space-y-3">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-8 stroke-[2.5]" />
              </div>
              <h4 className="font-display text-lg font-bold text-fg">Table Reserved Successfully!</h4>
              <p className="text-xs text-muted">
                Your reservation at <strong className="text-fg">{restaurantName}</strong> is confirmed.
              </p>
              <div className="mx-auto max-w-xs rounded-xl border border-dashed border-primary/50 bg-primary/5 p-3 text-xs space-y-1">
                <p className="text-muted">Booking Reference:</p>
                <p className="font-mono text-base font-bold text-primary">{bookingRef}</p>
                <p className="text-[11px] text-muted">
                  {guestCount} Guests · {selectedDate === "TODAY" ? "Today" : "Tomorrow"} at {selectedSlot}
                </p>
                <p className="text-[10px] text-muted capitalize">Area: {seatingArea.toLowerCase()} Seating</p>
              </div>
              <div className="rounded-lg bg-surface-2 p-3 text-[11px] text-muted text-left">
                <p className="font-semibold text-fg">👑 OrderKing Dining Guarantee:</p>
                <p className="mt-1">
                  Table is held for up to 15 minutes past reservation time. Simply show your booking SMS or reference at the reception.
                </p>
              </div>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          ) : (
            <>
              {/* Number of Guests */}
              <div>
                <label className="block text-xs font-bold text-fg mb-1.5 flex items-center gap-1.5">
                  <Users className="size-3.5 text-primary" /> Select Number of Guests
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setGuestCount(num)}
                      className={`size-9 shrink-0 rounded-xl font-bold text-xs transition ${
                        guestCount === num
                          ? "bg-primary text-primary-fg shadow-xs scale-105"
                          : "border border-border bg-surface-2 text-fg hover:border-primary/50"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-xs font-bold text-fg mb-1.5 flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-primary" /> Select Date
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "TODAY", label: "Today", sub: "Instant Seat" },
                    { id: "TOMORROW", label: "Tomorrow", sub: "Pre-book" },
                    { id: "WEEKEND", label: "This Weekend", sub: "Special" },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedDate(d.id)}
                      className={`rounded-xl p-2.5 text-center border transition ${
                        selectedDate === d.id
                          ? "border-primary bg-primary/10 text-primary font-bold"
                          : "border-border bg-surface-2 text-fg hover:border-primary/40"
                      }`}
                    >
                      <p className="text-xs font-semibold">{d.label}</p>
                      <p className="text-[10px] text-muted">{d.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slot Selection */}
              <div>
                <label className="block text-xs font-bold text-fg mb-1.5 flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" /> Select Time Slot
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setSelectedSlot(slot.time)}
                      className={`rounded-lg py-2 text-center text-xs border transition ${
                        selectedSlot === slot.time
                          ? "border-primary bg-primary text-primary-fg font-bold"
                          : "border-border bg-surface-2 text-fg hover:border-primary/40"
                      }`}
                    >
                      <span>{slot.time}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Seating Preference */}
              <div>
                <label className="block text-xs font-bold text-fg mb-1.5 flex items-center gap-1.5">
                  <Utensils className="size-3.5 text-primary" /> Seating Area
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "ROOFTOP", label: "✨ Rooftop Ambience" },
                    { id: "INDOOR", label: "❄️ AC Indoor Hall" },
                    { id: "OUTDOOR", label: "🌿 Garden Terrace" },
                    { id: "PRIVATE", label: "🥂 Private Dining Cabana" },
                  ].map((area) => (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => setSeatingArea(area.id as any)}
                      className={`rounded-xl p-2 text-left border text-xs transition ${
                        seatingArea === area.id
                          ? "border-primary bg-primary/10 text-primary font-bold"
                          : "border-border bg-surface-2 text-fg hover:border-primary/40"
                      }`}
                    >
                      {area.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Occasion / Notes */}
              <div>
                <label className="block text-xs font-bold text-fg mb-1.5">Special Occasion (Optional)</label>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {["🎂 Birthday", "💍 Anniversary", "💼 Business Dinner", "🕯️ Candlelight Date"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSpecialOccasion(specialOccasion === tag ? "" : tag)}
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] transition ${
                        specialOccasion === tag
                          ? "border-primary bg-primary text-primary-fg font-semibold"
                          : "border-border bg-surface-2 text-muted hover:text-fg"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] text-muted mb-1">Guest Full Name</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-muted mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!isConfirmed && (
          <div className="border-t border-border bg-surface px-5 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted">Zero Cancellation Fee</p>
              <p className="font-bold text-xs text-fg">Instant Confirmation</p>
            </div>
            <Button onClick={handleConfirm} className="gap-1.5">
              <Sparkles className="size-3.5" /> Confirm Table
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
