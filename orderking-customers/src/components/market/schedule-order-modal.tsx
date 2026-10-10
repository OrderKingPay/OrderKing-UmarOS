import { useState } from "react";
import { Clock, Calendar, Check, X, BellRing, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface ScheduleOrderModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSchedule?: (scheduledTime: { date: string; timeSlot: string }) => void;
  restaurantName?: string;
}

export function ScheduleOrderModal({
  isOpen = false,
  onClose,
  onSchedule,
  restaurantName = "Tandoori Nights",
}: ScheduleOrderModalProps) {
  const [open, setOpen] = useState(isOpen);
  const [selectedDay, setSelectedDay] = useState<string>("TODAY");
  const [selectedSlot, setSelectedSlot] = useState<string>("8:00 PM - 8:30 PM");

  const DAYS = [
    { id: "TODAY", label: "Today", dateLabel: "Tonight's Meal" },
    { id: "TOMORROW", label: "Tomorrow", dateLabel: "Advance Booking" },
    { id: "DAY_AFTER", label: "Day After", dateLabel: "Weekend Plan" },
  ];

  const TIME_SLOTS = [
    "12:30 PM - 1:00 PM",
    "1:00 PM - 1:30 PM",
    "1:30 PM - 2:00 PM",
    "7:00 PM - 7:30 PM",
    "7:30 PM - 8:00 PM",
    "8:00 PM - 8:30 PM",
    "8:30 PM - 9:00 PM",
    "9:00 PM - 9:30 PM",
    "9:30 PM - 10:00 PM",
  ];

  const handleConfirm = () => {
    onSchedule?.({ date: selectedDay, timeSlot: selectedSlot });
    toast.success(`Order scheduled for ${selectedDay === "TODAY" ? "Today" : "Tomorrow"} between ${selectedSlot}`);
    setOpen(false);
    onClose?.();
  };

  if (!open && !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden space-y-4 p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-xl">
              ⏰
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-fg">Schedule Order Delivery</h3>
              <p className="text-xs text-muted">Freshly prepared right before delivery</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onClose?.();
            }}
            className="rounded-full p-1 text-muted hover:bg-surface-2 hover:text-fg"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Day Selector */}
        <div>
          <label className="text-xs font-bold text-fg mb-1.5 flex items-center gap-1.5">
            <Calendar className="size-3.5 text-primary" /> Delivery Day
          </label>
          <div className="grid grid-cols-3 gap-2">
            {DAYS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDay(d.id)}
                className={`rounded-xl p-2.5 text-center border transition ${
                  selectedDay === d.id
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border bg-surface-2 text-fg hover:border-primary/40"
                }`}
              >
                <p className="text-xs font-semibold">{d.label}</p>
                <p className="text-[10px] text-muted">{d.dateLabel}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 30-min Window Slot Picker */}
        <div>
          <label className="text-xs font-bold text-fg mb-1.5 flex items-center gap-1.5">
            <Clock className="size-3.5 text-primary" /> 30-Minute Delivery Window
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto no-scrollbar p-0.5">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`rounded-lg py-2 px-2.5 text-xs text-center border transition ${
                  selectedSlot === slot
                    ? "border-primary bg-primary text-primary-fg font-bold shadow-xs"
                    : "border-border bg-surface-2 text-fg hover:border-primary/40"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Guarantee Banner */}
        <div className="rounded-xl border border-border bg-surface-2 p-3 text-xs text-muted space-y-1">
          <p className="font-semibold text-fg flex items-center gap-1">
            <BellRing className="size-3.5 text-primary" /> On-Time Freshness Promise:
          </p>
          <p className="text-[11px]">
            The kitchen receives your order ticket 25 minutes prior to your selected slot so food arrives steaming hot!
          </p>
        </div>

        {/* Submit Button */}
        <Button onClick={handleConfirm} className="w-full gap-1.5">
          <Check className="size-4" /> Confirm Scheduled Slot
        </Button>
      </div>
    </div>
  );
}
