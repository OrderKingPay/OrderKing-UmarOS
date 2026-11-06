// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/rider/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bike, MapPin, ShieldCheck, CheckCircle2, Lock, AlertTriangle, Clock, Wallet } from "lucide-react";

export const Route = createFileRoute("/")({
  component: RiderLiveDispatchConsole,
});

function getIstShiftPolicy() {
  const istMs = Date.now() + 330 * 60 * 1000;
  const istHour = new Date(istMs).getUTCHours();
  if (istHour >= 6 && istHour < 18) {
    return { shiftName: "Day Shift (06:00 - 18:00 IST)", radiusKm: 12.0 };
  }
  if (istHour >= 18 && istHour < 23) {
    return { shiftName: "Evening Shift (18:00 - 23:00 IST)", radiusKm: 7.5 };
  }
  return { shiftName: "Late-Night Shift (23:00 - 06:00 IST)", radiusKm: 3.5 };
}

function RiderLiveDispatchConsole() {
  const shiftPolicy = getIstShiftPolicy();
  const [isOnline, setIsOnline] = useState(true);
  const [countdown, setCountdown] = useState<number>(30);
  const [orderState, setOrderState] = useState<"OFFER_RINGING" | "PICKUP_EN_ROUTE" | "ON_THE_WAY" | "DELIVERED">("OFFER_RINGING");
  const [pickupPinInput, setPickupPinInput] = useState("");
  const [doorstepOtpInput, setDoorstepOtpInput] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [walletPaise, setWalletPaise] = useState<number>(48500); // ₹485.00
  const [gpsStatus, setGpsStatus] = useState<string>("24.8672° N, 92.3558° E (Karimganj / Guwahati Active Circle)");

  const activeOffer = {
    orderId: "OK-9014",
    restaurantName: "Royal Assam Kitchen (FSSAI: 10324001000492)",
    pickupDistanceKm: 1.1,
    dropDistanceKm: 2.4,
    basePayoutPaise: 3800, // ₹38.00
    surgeIncentivePaise: 1500, // ₹15.00 Rain/Peak Surge
    expectedPickupPin: "4821",
    expectedDoorstepOtp: "7391",
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem("orderking_rider_wallet_paise_v1");
      if (saved) setWalletPaise(parseInt(saved, 10) || 48500);
    } catch {}
  }, []);

  useEffect(() => {
    if (!isOnline || orderState !== "OFFER_RINGING") return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 30));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOnline, orderState]);

  function handleVerifyPickupPin() {
    if (pickupPinInput.trim() !== activeOffer.expectedPickupPin && pickupPinInput.trim().length !== 4) {
      setOtpError("Enter the 4-digit restaurant pickup PIN (4821) to confirm food pickup.");
      return;
    }
    setOtpError(null);
    setOrderState("ON_THE_WAY");
  }

  function handleVerifyDoorstepOtp() {
    const clean = doorstepOtpInput.trim();
    if (clean !== activeOffer.expectedDoorstepOtp) {
      setOtpError(
        `DOORSTEP_OTP_LOCKED: Invalid 4-digit OTP ("${clean || "empty"}"). Order remains strictly locked in 'ON_THE_WAY'. Ask customer for OTP 7391.`
      );
      return;
    }
    setOtpError(null);
    setOrderState("DELIVERED");
    const totalEarnedPaise = activeOffer.basePayoutPaise + activeOffer.surgeIncentivePaise;
    const nextWallet = walletPaise + totalEarnedPaise;
    setWalletPaise(nextWallet);
    setGpsStatus(`Delivered GPS Logged: 24.8751° N, 92.3640° E at ${new Date().toLocaleTimeString()} (90-Day DPDP Auto-Purge)`);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("orderking_rider_wallet_paise_v1", String(nextWallet));
      } catch {}
    }
  }

  const fmt = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-5 space-y-4 text-slate-100">
        {/* Top Shift & Geofence Status Bar */}
        <div className="rounded-2xl border border-[#1E283D] bg-[#121723] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{shiftPolicy.shiftName}</span>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                Geofence: {shiftPolicy.radiusKm.toFixed(1)} km Radius
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <MapPin className="size-3.5 text-[#E5A93C]" />
              <span>{gpsStatus}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/settlements"
              className="rounded-xl bg-[#0E121B] border border-[#1E283D] px-3 py-2 text-xs font-bold text-[#E5A93C] flex items-center gap-1.5"
            >
              <Wallet className="size-3.5" />
              <span>{fmt(walletPaise)}</span>
            </Link>
            <Button
              type="button"
              onClick={() => setIsOnline(!isOnline)}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold ${
                isOnline ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300"
              }`}
            >
              {isOnline ? "ON DUTY" : "OFF DUTY"}
            </Button>
          </div>
        </div>

        {/* Shift Geofence Rules Summary Card */}
        <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
          <div className="rounded-xl border border-[#1E283D] bg-[#121723] p-2.5">
            <div className="text-slate-400 text-[11px]">Day (06:00–18:00)</div>
            <div className="font-bold text-white mt-0.5">12.0 km Radius</div>
          </div>
          <div className="rounded-xl border border-[#1E283D] bg-[#121723] p-2.5">
            <div className="text-slate-400 text-[11px]">Evening (18:00–23:00)</div>
            <div className="font-bold text-white mt-0.5">7.5 km Radius</div>
          </div>
          <div className="rounded-xl border border-[#1E283D] bg-[#121723] p-2.5">
            <div className="text-slate-400 text-[11px]">Late-Night (23:00–06:00)</div>
            <div className="font-bold text-white mt-0.5">3.5 km Radius</div>
          </div>
        </div>

        {/* Dispatch Offer Card with 30-Second Countdown */}
        {orderState === "OFFER_RINGING" && (
          <div className="rounded-2xl border-2 border-[#E5A93C] bg-[#121723] p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-[#E5A93C]/20 px-2.5 py-1 text-xs font-bold text-[#E5A93C]">
                LIVE DISPATCH OFFER · #{activeOffer.orderId}
              </span>
              <span className="font-mono text-sm font-bold text-amber-300 flex items-center gap-1">
                <Clock className="size-4" />
                <span>{countdown}s to Accept</span>
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-base font-bold text-white">{activeOffer.restaurantName}</div>
              <div className="text-xs text-slate-300">
                Pickup: <strong>{activeOffer.pickupDistanceKm} km</strong> · Delivery Drop: <strong>{activeOffer.dropDistanceKm} km</strong> (Within {shiftPolicy.radiusKm} km Shift Circle)
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 rounded-xl bg-[#0E121B] p-3 border border-[#1E283D] text-xs">
              <div>
                <div className="text-slate-400">Guaranteed Base</div>
                <div className="font-mono font-bold text-white text-sm">{fmt(activeOffer.basePayoutPaise)}</div>
              </div>
              <div>
                <div className="text-slate-400">Rain / Surge Bonus</div>
                <div className="font-mono font-bold text-emerald-400 text-sm">+{fmt(activeOffer.surgeIncentivePaise)}</div>
              </div>
              <div>
                <div className="text-slate-400">Total Trip Earning</div>
                <div className="font-mono font-bold text-[#E5A93C] text-sm">
                  {fmt(activeOffer.basePayoutPaise + activeOffer.surgeIncentivePaise)}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => setOrderState("PICKUP_EN_ROUTE")}
                className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm"
              >
                Accept Dispatch ({countdown}s)
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCountdown(30)}
                className="h-11 px-4 border-[#1E283D] bg-[#0E121B] text-slate-300 rounded-xl text-xs font-semibold"
              >
                Pass
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Restaurant Pickup Verification */}
        {orderState === "PICKUP_EN_ROUTE" && (
          <div className="rounded-2xl border border-[#1E283D] bg-[#121723] p-5 space-y-4">
            <div className="text-sm font-bold text-white">
              Step 1/2: Arrive at {activeOffer.restaurantName} &amp; Verify 4-Digit Pickup PIN
            </div>
            <div className="flex gap-2">
              <Input
                value={pickupPinInput}
                onChange={(e) => setPickupPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="Enter 4-digit Pickup PIN (4821)"
                className="h-11 bg-[#0E121B] border-[#1E283D] text-white font-mono"
              />
              <Button
                type="button"
                onClick={handleVerifyPickupPin}
                className="h-11 px-5 bg-[#E5A93C] text-black font-bold rounded-xl shrink-0"
              >
                Confirm Pickup
              </Button>
            </div>
            {otpError && <div className="text-xs text-rose-400 font-semibold">{otpError}</div>}
          </div>
        )}

        {/* Step 3: Mandatory 4-Digit Doorstep Delivery OTP Lock */}
        {orderState === "ON_THE_WAY" && (
          <div className="rounded-2xl border-2 border-amber-500/60 bg-[#121723] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Lock className="size-3.5" />
                <span>STATUS LOCKED: ON_THE_WAY (Awaiting 4-Digit Doorstep OTP)</span>
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Ask customer for their 4-digit Doorstep Delivery OTP (Demo OTP: <strong className="font-mono text-white">7391</strong>). Invalid OTP keeps the order strictly locked in <code>ON_THE_WAY</code>.
            </p>
            <div className="flex gap-2">
              <Input
                value={doorstepOtpInput}
                onChange={(e) => setDoorstepOtpInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="Enter 4-digit Customer OTP (7391)"
                className="h-11 bg-[#0E121B] border-[#1E283D] text-white font-mono text-base"
              />
              <Button
                type="button"
                onClick={handleVerifyDoorstepOtp}
                className="h-11 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shrink-0"
              >
                Verify OTP &amp; Complete
              </Button>
            </div>
            {otpError && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-200 flex items-center gap-2">
                <AlertTriangle className="size-4 text-rose-400 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Delivered & Earnings Released */}
        {orderState === "DELIVERED" && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
              <CheckCircle2 className="size-5 text-emerald-400" />
              <span>Order #{activeOffer.orderId} DELIVERED! +{fmt(activeOffer.basePayoutPaise + activeOffer.surgeIncentivePaise)} Credited to Digital Balance.</span>
            </div>
            <div className="text-xs text-slate-300">{gpsStatus}</div>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                onClick={() => {
                  setDoorstepOtpInput("");
                  setPickupPinInput("");
                  setOrderState("OFFER_RINGING");
                  setCountdown(30);
                }}
                className="h-9 px-4 bg-emerald-600 text-white text-xs font-bold rounded-xl"
              >
                Next Dispatch Offer
              </Button>
              <Link
                to="/settlements"
                className="h-9 px-4 rounded-xl bg-[#E5A93C] text-black text-xs font-bold inline-flex items-center"
              >
                Withdraw via Direct UPI / NEFT →
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
