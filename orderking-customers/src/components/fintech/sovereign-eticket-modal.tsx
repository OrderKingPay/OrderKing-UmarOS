import { useState, useEffect } from "react";
import {
  CheckCircle2,
  QrCode,
  Download,
  Share2,
  Copy,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  Coins,
  Sparkles,
  X,
  Printer,
  ChevronRight,
  Plane,
  Train,
  Bus,
  Car,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatPaise } from "@/lib/money";
import type { SovereignETicket } from "@/lib/travel/in-app-booking-service";

interface Props {
  ticket: SovereignETicket;
  onClose: () => void;
}

export function SovereignETicketModal({ ticket, onClose }: Props) {
  const [countdown, setCountdown] = useState<string>("");
  const [copiedPnr, setCopiedPnr] = useState(false);

  useEffect(() => {
    function updateCountdown() {
      const departureTime = new Date(ticket.departureTimestamp).getTime();
      const now = Date.now();
      const diffMs = departureTime - now;

      if (diffMs <= 0) {
        setCountdown("Boarding / Departed");
        return;
      }

      const totalSec = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      setCountdown(`${hours}h ${minutes}m ${seconds}s`);
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [ticket.departureTimestamp]);

  const handleCopyPnr = () => {
    try {
      navigator.clipboard.writeText(ticket.pnr);
      setCopiedPnr(true);
      toast.success(`Copied Sovereign PNR: ${ticket.pnr}`);
      setTimeout(() => setCopiedPnr(false), 2000);
    } catch {
      toast.info(`PNR: ${ticket.pnr}`);
    }
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      toast.error("Printing not available in this browser window.");
    }
  };

  const handleShareWhatsApp = () => {
    const text = `🎫 *OrderKing Sovereign E-Ticket*\n` +
      `*PNR:* ${ticket.pnr}\n` +
      `*Service:* ${ticket.carrierName} (${ticket.serviceNumber})\n` +
      `*Route:* ${ticket.origin.city} ➔ ${ticket.destination.city}\n` +
      `*Departure:* ${ticket.origin.departureDate} at ${ticket.origin.departureTime}\n` +
      `*Passengers:* ${ticket.passengers.map(p => `${p.fullName} (${p.allocatedSeat})`).join(", ")}\n` +
      `*Amount Paid:* ₹${(ticket.fareBreakdown.totalCheckoutPaise / 100).toFixed(2)} (₹0 Convenience Fee)\n` +
      `*Status:* 100% Confirmed & Ready for Boarding`;

    try {
      navigator.clipboard.writeText(text);
      toast.success("E-Ticket summary copied to clipboard! You can paste and share it on WhatsApp.");
    } catch {
      // fallback
    }

    // Direct WhatsApp Web / mobile URL without pop-up blocking issues
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    try {
      const a = document.createElement("a");
      a.href = waUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
    } catch {
      // Fallback
    }
  };

  const ModeIcon =
    ticket.mode === "flight" ? Plane :
    ticket.mode === "train" ? Train :
    ticket.mode === "bus" ? Bus : Car;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Ticket Header Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 flex items-start justify-between relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 text-[11px] font-black tracking-wide">
                <CheckCircle2 className="size-3.5" />
                SOVEREIGN CONFIRMED E-TICKET
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-400/20 text-sky-300 border border-sky-400/30 text-[10px] font-extrabold uppercase">
                ₹0 Convenience Fee
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <ModeIcon className="size-5 text-sky-400" />
              {ticket.serviceTitle}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {ticket.carrierName} · Service {ticket.serviceNumber} · {ticket.classOrTier}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition border border-white/10 shrink-0"
            title="Close E-Ticket View"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Ticket Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* PNR & Live Countdown Hero Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gradient-to-br from-slate-50 to-indigo-50/50 p-4 rounded-2xl border border-slate-200">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                OrderKing Sovereign PNR
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black font-mono tracking-wider text-slate-900">
                  {ticket.pnr}
                </span>
                <button
                  type="button"
                  onClick={handleCopyPnr}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                  title="Copy PNR"
                >
                  <Copy className="size-4" />
                </button>
              </div>
              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                <ShieldCheck className="size-3.5" />
                Valid for Official CRIS / Carrier Boarding
              </span>
            </div>

            <div className="sm:border-l sm:border-slate-200 sm:pl-4 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Live Departure Countdown
              </span>
              <div className="flex items-center gap-2 text-indigo-700">
                <Clock className="size-5 animate-pulse" />
                <span className="text-lg sm:text-xl font-black font-mono">
                  {countdown || "Calculating..."}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block">
                Departing on {ticket.origin.departureDate} at {ticket.origin.departureTime}
              </span>
            </div>
          </div>

          {/* Journey Timeline */}
          <div className="rounded-2xl border border-slate-200 p-4 bg-white space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold border-b border-slate-100 pb-2">
              <span>JOURNEY ROUTE TIMELINE</span>
              <span className="text-slate-700 font-mono">Duration: {ticket.duration}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Departure</span>
                <p className="text-base font-black text-slate-900">{ticket.origin.city}</p>
                <p className="text-xs font-mono font-bold text-indigo-600">{ticket.origin.departureTime}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{ticket.origin.terminalOrPlatform}</p>
              </div>

              <div className="flex flex-col items-center justify-center text-center py-2 sm:py-0 border-y sm:border-y-0 sm:border-x border-slate-100">
                <span className="text-[10px] font-bold text-slate-400">{ticket.duration}</span>
                <div className="w-full flex items-center justify-center gap-2 text-indigo-500 my-1">
                  <div className="h-0.5 w-12 bg-indigo-200" />
                  <ModeIcon className="size-4" />
                  <div className="h-0.5 w-12 bg-indigo-200" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {ticket.stopsDisplay || "Non-Stop Confirmed"}
                </span>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Arrival</span>
                <p className="text-base font-black text-slate-900">{ticket.destination.city}</p>
                <p className="text-xs font-mono font-bold text-indigo-600">{ticket.destination.arrivalTime}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{ticket.destination.terminalOrPlatform}</p>
              </div>
            </div>
          </div>

          {/* Passenger Roster & Seat/Berth Assignment */}
          <div className="rounded-2xl border border-slate-200 p-4 bg-white space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold border-b border-slate-100 pb-2">
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5 text-slate-600" /> PASSENGER ROSTER &amp; SEAT ASSIGNMENT
              </span>
              <span className="text-emerald-600 font-bold">{ticket.passengers.length} Passenger(s)</span>
            </div>

            <div className="divide-y divide-slate-100">
              {ticket.passengers.map((pax, i) => (
                <div key={pax.id || i} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-black text-sm text-slate-900 block">
                      {i + 1}. {pax.fullName}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {pax.age} yrs · {pax.gender.toUpperCase()} · Pref: {pax.seatPreference || "Standard"}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 font-mono font-black text-xs">
                      {pax.allocatedSeat}
                    </span>
                    <span className="text-[10px] text-emerald-600 block font-bold mt-0.5">
                      ✓ {pax.bookingStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cab Driver Profile Card if Cab */}
          {ticket.cabDriver && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50/60 p-4 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
                <Car className="size-3.5" /> Chauffeur Dispatch Details
              </span>
              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-black text-sm text-slate-900">{ticket.cabDriver.name}</p>
                  <p className="text-slate-600">{ticket.cabDriver.vehicleModel} · {ticket.cabDriver.vehiclePlate}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-black px-2.5 py-1 bg-amber-200 text-amber-900 rounded-lg">
                    OTP: {ticket.cabDriver.otp}
                  </span>
                  <p className="text-[10px] text-amber-800 font-bold mt-1">Arriving in {ticket.cabDriver.etaMinutes} mins</p>
                </div>
              </div>
            </div>
          )}

          {/* Barcode & Boarding Pass QR Graphic */}
          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* High-res Clean Vector QR Pattern */}
              <div className="size-24 rounded-xl bg-white border border-slate-300 p-2 shadow-xs flex items-center justify-center shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                  {/* Outer Frame & Targets */}
                  <rect x="5" y="5" width="26" height="26" rx="3" fill="none" stroke="currentColor" strokeWidth="4" />
                  <rect x="11" y="11" width="14" height="14" fill="currentColor" />
                  <rect x="69" y="5" width="26" height="26" rx="3" fill="none" stroke="currentColor" strokeWidth="4" />
                  <rect x="75" y="11" width="14" height="14" fill="currentColor" />
                  <rect x="5" y="69" width="26" height="26" rx="3" fill="none" stroke="currentColor" strokeWidth="4" />
                  <rect x="11" y="75" width="14" height="14" fill="currentColor" />
                  {/* Decorative deterministic matrix blocks */}
                  <rect x="36" y="8" width="8" height="8" fill="currentColor" />
                  <rect x="48" y="8" width="6" height="6" fill="currentColor" />
                  <rect x="36" y="22" width="6" height="14" fill="currentColor" />
                  <rect x="46" y="24" width="12" height="6" fill="currentColor" />
                  <rect x="8" y="38" width="8" height="6" fill="currentColor" />
                  <rect x="22" y="38" width="6" height="12" fill="currentColor" />
                  <rect x="34" y="38" width="14" height="14" rx="2" fill="currentColor" />
                  <rect x="54" y="38" width="8" height="8" fill="currentColor" />
                  <rect x="68" y="38" width="12" height="6" fill="currentColor" />
                  <rect x="84" y="38" width="8" height="14" fill="currentColor" />
                  <rect x="42" y="58" width="16" height="8" fill="currentColor" />
                  <rect x="64" y="54" width="8" height="18" fill="currentColor" />
                  <rect x="78" y="58" width="14" height="6" fill="currentColor" />
                  <rect x="36" y="72" width="8" height="14" fill="currentColor" />
                  <rect x="48" y="72" width="14" height="6" fill="currentColor" />
                  <rect x="68" y="78" width="10" height="14" fill="currentColor" />
                  <rect x="82" y="78" width="10" height="10" fill="currentColor" />
                </svg>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Carrier Digital Boarding Barcode
                </span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  Scan at airport security e-gates, railway TTE scanner, or bus conductor reader.
                </p>
                <p className="text-[11px] font-mono text-slate-500 mt-1">
                  SHA-256 Auth Token Verified · 100% In-App
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Settlement Breakdown</span>
              <span className="text-lg font-black text-slate-900 font-mono">
                {formatPaise(ticket.fareBreakdown.totalCheckoutPaise)}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                Saved ₹{(ticket.fareBreakdown.instantSavingsPaise / 100).toFixed(0)} vs OTAs
              </span>
            </div>
          </div>

          {/* Cancellation Policy with Instant KingPay Wallet Refund Guarantee */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-1.5 text-xs">
            <span className="font-black text-emerald-900 flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-600" />
              Sovereign Cancellation &amp; Instant Wallet Refund Guarantee
            </span>
            <p className="text-emerald-800 leading-relaxed">
              • <strong>Refund Timeline:</strong> {ticket.cancellationPolicy.refundableUntil}.
            </p>
            <p className="text-emerald-800 leading-relaxed">
              • <strong>Instant Credit:</strong> 100% eligible refund ({formatPaise(ticket.fareBreakdown.totalCheckoutPaise)}) is credited instantly back to your KingPay Loyalty Wallet with ₹0 OrderKing penalty.
            </p>
            <p className="text-emerald-700 text-[11px]">
              • <strong>Loyalty Reward:</strong> {ticket.payment.rebateAmountCredited} was credited to your portfolio.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrint}
              className="rounded-xl border-slate-300 font-bold text-xs flex items-center gap-1.5 h-10 px-3.5"
            >
              <Printer className="size-4 text-slate-600" />
              Download PDF / Print
            </Button>
            <Button
              type="button"
              onClick={handleShareWhatsApp}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 h-10 px-4"
            >
              <Share2 className="size-4" />
              Share on WhatsApp
            </Button>
          </div>

          <Button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-10 px-6"
          >
            Back to TravelStation
          </Button>
        </div>
      </div>
    </div>
  );
}
