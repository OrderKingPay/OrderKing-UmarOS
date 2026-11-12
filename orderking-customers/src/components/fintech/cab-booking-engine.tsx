import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Car,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Calendar,
  Clock,
  Star,
  CheckCircle2,
  Navigation,
  ArrowLeftRight,
  RotateCcw,
  X,
  Phone,
  CreditCard,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPaise } from "@/lib/money";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { toast } from "sonner";
import {
  searchCabQuotes,
  type CabQuote,
} from "@/lib/travel/in-app-booking-service";
import {
  prepareCabRazorpayOrder,
  submitCabRideOrder,
  type CabVehicleTier,
  type CabRideResult,
} from "@/lib/server/cab-order";

interface Props {
  walletBalance?: number;
  onDeductWallet?: (amount: number, description: string) => boolean;
  initialPickup?: string;
  initialDrop?: string;
}

function mapQuoteToTier(quoteId: string): CabVehicleTier {
  if (quoteId.includes("suv")) return "SUV";
  if (quoteId.includes("ev")) return "EV";
  if (quoteId.includes("mini")) return "MINI";
  return "SEDAN";
}

async function ensureRazorpayLoaded(): Promise<any> {
  if (typeof window === "undefined") return null;
  const win = window as any;
  if (win.Razorpay) return win.Razorpay;
  return new Promise((resolve) => {
    const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).Razorpay || null));
      existing.addEventListener("error", () => resolve(null));
      setTimeout(() => resolve((window as any).Razorpay || null), 1500);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve((window as any).Razorpay || null);
    script.onerror = () => resolve(null);
    document.body.appendChild(script);
  });
}

export function CabBookingEngine({
  walletBalance = 0,
  onDeductWallet,
  initialPickup = "Terminal 3, IGI Airport (DEL)",
  initialDrop = "Connaught Place, New Delhi",
}: Props) {
  const { user } = useCurrentUserState();
  const navigate = useNavigate();
  const [pickup, setPickup] = useState(initialPickup);
  const [drop, setDrop] = useState(initialDrop);
  const [category, setCategory] = useState<"City Taxi" | "Airport Transfer" | "Intercity One-Way" | "Hourly Rental">("Airport Transfer");
  const [travelDate, setTravelDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [pickupTime, setPickupTime] = useState("10:00");

  const [selectedQuote, setSelectedQuote] = useState<CabQuote | null>(null);
  const [passengerPhone, setPassengerPhone] = useState("");
  const [ridePaymentMethod, setRidePaymentMethod] = useState<"RAZORPAY_ONLINE" | "COD">("COD");
  const [isBookingRide, setIsBookingRide] = useState(false);
  const [confirmedRide, setConfirmedRide] = useState<CabRideResult | null>(null);

  // Live cab quotes
  const quotes = searchCabQuotes(pickup.trim() || "Terminal 3, IGI Airport (DEL)", drop.trim() || "Connaught Place, New Delhi", category);

  const handleSwapLocations = () => {
    const temp = pickup;
    setPickup(drop);
    setDrop(temp);
  };

  const handleOpenBooking = (quote: CabQuote) => {
    if (!user) {
      toast.error("Please sign in to book an OrderKing cab.");
      navigate({ to: "/login" });
      return;
    }
    setSelectedQuote(quote);
    setConfirmedRide(null);
  };

  const handleConfirmRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuote || !user) return;
    const cleanPhone = passengerPhone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      toast.error("Enter a valid 10-digit mobile number.");
      return;
    }
    const tier = mapQuoteToTier(selectedQuote.id);
    const idempotencyKey = `cab_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    setIsBookingRide(true);

    try {
      if (ridePaymentMethod === "RAZORPAY_ONLINE") {
        const prepared = await prepareCabRazorpayOrder({
          data: { tier, category, receipt: idempotencyKey },
        });
        const RazorpayCtor = await ensureRazorpayLoaded();
        if (!RazorpayCtor) {
          throw new Error("Razorpay checkout failed to load. Choose Pay to Driver.");
        }
        const rzp = new RazorpayCtor({
          key: prepared.keyId,
          amount: prepared.amountPaise,
          currency: prepared.currency,
          name: "OrderKing Cab",
          description: `${selectedQuote.title} · ${pickup} to ${drop}`,
          order_id: prepared.orderId,
          prefill: { name: user.displayName || "Passenger", contact: cleanPhone },
          handler: async (resp: {
            razorpay_order_id?: string;
            razorpay_payment_id?: string;
            razorpay_signature?: string;
          }) => {
            try {
              const booked = await submitCabRideOrder({
                data: {
                  tier,
                  category,
                  pickupAddress: pickup.trim(),
                  dropAddress: drop.trim(),
                  travelDate,
                  pickupTime,
                  passengerPhone: cleanPhone,
                  passengerName: user.displayName || "Passenger",
                  paymentMethod: "RAZORPAY_ONLINE",
                  idempotencyKey,
                  razorpayPayment: {
                    razorpayOrderId: resp.razorpay_order_id || prepared.orderId,
                    razorpayPaymentId: resp.razorpay_payment_id || "",
                    razorpaySignature: resp.razorpay_signature || "",
                    amountPaise: prepared.amountPaise,
                  },
                },
              });
              setConfirmedRide(booked);
              setSelectedQuote(null);
              toast.success(`Cab #${booked.publicId} requested.`);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Cab booking failed.");
            } finally {
              setIsBookingRide(false);
            }
          },
          modal: { ondismiss: () => setIsBookingRide(false) },
          theme: { color: "#F59E0B" },
        });
        rzp.on("payment.failed", (failResp: any) => {
          toast.error(failResp?.error?.description || "Payment declined.");
          setIsBookingRide(false);
        });
        rzp.open();
        return;
      }

      const booked = await submitCabRideOrder({
        data: {
          tier,
          category,
          pickupAddress: pickup.trim(),
          dropAddress: drop.trim(),
          travelDate,
          pickupTime,
          passengerPhone: cleanPhone,
          passengerName: user.displayName || "Passenger",
          paymentMethod: "COD",
          idempotencyKey,
        },
      });
      setConfirmedRide(booked);
      setSelectedQuote(null);
      toast.success(`Cab #${booked.publicId} booked.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to request cab.");
    } finally {
      if (ridePaymentMethod === "COD") setIsBookingRide(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Search Bar Card */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-[#1C1304] via-[#2A1D07] to-[#120F03] p-5 sm:p-8 shadow-xl text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30 shadow-md">
              <Car className="size-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                On-Demand Airport &amp; City Cabs
              </h2>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300">
                Book on OrderKing or compare with Uber &amp; Ola
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-emerald-500/20 border border-emerald-400/40 px-3 py-1.5 rounded-full text-emerald-300 text-xs font-extrabold">
            <ShieldCheck className="size-4" />
            <span>Regulated Taxi Tariff</span>
          </div>
        </div>

        {/* Category Pill Switcher */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(["Airport Transfer", "City Taxi", "Intercity One-Way", "Hourly Rental"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                category === cat
                  ? "bg-amber-400 text-slate-950 shadow-md"
                  : "bg-white/10 text-slate-200 hover:bg-white/20 border border-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Input Fields Grid with Location Swap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 focus-within:border-amber-400 transition relative">
            <label htmlFor="cab-search-pickup" className="text-[10px] font-bold text-slate-300 flex items-center justify-between mb-1 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><MapPin className="size-3 text-amber-400" /> Pickup Location</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="cab-search-pickup"
                type="text"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="w-full bg-transparent text-sm font-black outline-none text-white placeholder:text-slate-400"
                placeholder="e.g. Airport Terminal 3"
              />
              <button
                type="button"
                onClick={handleSwapLocations}
                title="Swap Pickup & Drop"
                className="size-7 rounded-lg bg-white/10 hover:bg-amber-500/30 text-amber-300 border border-white/10 flex items-center justify-center shrink-0 transition"
              >
                <ArrowLeftRight className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 focus-within:border-amber-400 transition">
            <label htmlFor="cab-search-drop" className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <Navigation className="size-3 text-amber-400" /> Drop Location
            </label>
            <input
              id="cab-search-drop"
              type="text"
              value={drop}
              onChange={(e) => setDrop(e.target.value)}
              className="w-full bg-transparent text-sm font-black outline-none text-white placeholder:text-slate-400"
              placeholder="e.g. Connaught Place"
            />
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 focus-within:border-amber-400 transition">
            <label htmlFor="cab-search-date" className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <Calendar className="size-3 text-amber-400" /> Date
            </label>
            <input
              id="cab-search-date"
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="w-full bg-transparent text-sm font-black outline-none text-white"
            />
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/15 focus-within:border-amber-400 transition">
            <label htmlFor="cab-search-time" className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              <Clock className="size-3 text-amber-400" /> Pickup Time
            </label>
            <input
              id="cab-search-time"
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full bg-transparent text-sm font-black outline-none text-white"
            />
          </div>
        </div>
      </div>

      {/* Live Cab Fleet Options */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <span>Available Rides ({quotes.length})</span>
          </h3>
          <span className="text-xs text-slate-500 font-bold hidden sm:inline">
            Driver &amp; vehicle assigned at dispatch
          </span>
        </div>

        {quotes.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center space-y-3">
            <div className="size-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Car className="size-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">No cabs available for this category right now</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try switching your service category or resetting to Delhi Airport Transfer.
            </p>
            <Button
              type="button"
              onClick={() => {
                setPickup("Terminal 3, IGI Airport (DEL)");
                setDrop("Connaught Place, New Delhi");
                setCategory("Airport Transfer");
              }}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
            >
              <RotateCcw className="size-3.5 mr-1" /> Reset to Airport Transfer
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quotes.map((q) => {
            const totalFare = q.baseFarePaise + q.carrierTaxesPaise;

            return (
              <div
                key={q.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 hover:border-amber-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900">
                      {q.vehicleType}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      ETA {q.etaMinutes} mins
                    </span>
                  </div>

                  <h4 className="text-base font-black text-slate-900">
                    {q.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{q.vehicleModel} · Up to {q.seatingCapacity} Passengers</p>

                  {/* Driver dispatch badge */}
                  <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{q.driverName}</span>
                      <span className="text-slate-500 text-[11px] font-mono">{q.vehiclePlate}</span>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                        <Star className="size-3 fill-amber-500" /> {q.driverRating}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div>
                    <span className="text-xl font-black font-mono text-slate-900 block">
                      {formatPaise(totalFare)}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold block">
                      Save ₹{(q.otaBenchmarkFeePaise / 100).toFixed(0)} vs Rideshare Surge
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenBooking(q)}
                      className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md inline-flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Book Ride</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                    <a
                      href={`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(String(drop ?? ""))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => toast.success(`Opening Uber dispatch for ${pickup} to ${drop}...`)}
                      className="h-10 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs inline-flex items-center gap-1 no-underline transition"
                    >
                      <span>Uber</span>
                    </a>
                    <a
                      href="https://www.olacabs.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => toast.success(`Opening Ola Cabs dispatch...`)}
                      className="h-10 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs inline-flex items-center gap-1 no-underline transition"
                    >
                      <span>Ola</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmed Cab Ride Banner (PostgreSQL Order Created) */}
      {confirmedRide && (
        <div className="rounded-3xl border border-emerald-300 bg-emerald-50 p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="size-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  Ride Requested · #{confirmedRide.publicId}
                </h4>
                <p className="text-xs text-slate-600">
                  Driver will be assigned shortly. Share Pickup OTP <strong className="font-mono text-emerald-800">{confirmedRide.rideOtp}</strong> on arrival.
                </p>
              </div>
            </div>
            <Link
              to="/orders/$id"
              params={{ id: confirmedRide.orderId }}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold no-underline shrink-0"
            >
              Track Ride
            </Link>
          </div>
        </div>
      )}

      {/* Cab Ride Booking Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <form
            onSubmit={handleConfirmRide}
            className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4 text-slate-900"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {selectedQuote.vehicleType} · {category}
                </span>
                <h3 className="text-lg font-black mt-1">{selectedQuote.title}</h3>
                <p className="text-xs text-slate-500">
                  {pickup} to {drop}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuote(null)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Passenger Mobile Number (10 Digits)
              </label>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
                <Phone className="size-4 text-slate-400 mr-2" />
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={passengerPhone}
                  onChange={(e) => setPassengerPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="10-digit mobile number"
                  className="w-full h-10 bg-transparent text-sm font-mono font-bold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRidePaymentMethod("COD")}
                className={`p-3 rounded-xl border text-left text-xs font-bold flex items-center gap-2 ${
                  ridePaymentMethod === "COD"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                <Banknote className="size-4 shrink-0" />
                <span>Cash / UPI to Driver</span>
              </button>
              <button
                type="button"
                onClick={() => setRidePaymentMethod("RAZORPAY_ONLINE")}
                className={`p-3 rounded-xl border text-left text-xs font-bold flex items-center gap-2 ${
                  ridePaymentMethod === "RAZORPAY_ONLINE"
                    ? "border-amber-500 bg-amber-50 text-amber-950"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                <CreditCard className="size-4 shrink-0" />
                <span>Pay Online</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div>
                <span className="text-[10px] text-slate-500 block">Total Fare (incl. 5% GST)</span>
                <span className="text-lg font-black font-mono">
                  {formatPaise(selectedQuote.baseFarePaise + selectedQuote.carrierTaxesPaise)}
                </span>
              </div>
              <Button
                type="submit"
                disabled={isBookingRide}
                className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs"
              >
                {isBookingRide ? "Requesting..." : "Confirm Cab Ride"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
