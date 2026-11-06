// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/rider/app-shell";
import { Wallet, Award, MapPin, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/earnings")({
  component: RiderEarningsPage,
});

function RiderEarningsPage() {
  const [walletPaise, setWalletPaise] = useState<number>(53800); // ₹538.00
  const [tripsCompleted, setTripsCompleted] = useState<number>(6);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem("orderking_rider_wallet_paise_v1");
      if (saved) setWalletPaise(parseInt(saved, 10) || 53800);
    } catch {}
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-5 space-y-4 text-slate-100">
        <div className="rounded-2xl border border-[#1E283D] bg-[#121723] p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Verified Digital Earnings Balance</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
              ₹{(walletPaise / 100).toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {tripsCompleted} completed doorstep-OTP trips today · 100% tips retained
            </div>
          </div>
          <Link
            to="/settlements"
            className="rounded-xl bg-[#E5A93C] hover:bg-amber-400 text-black font-bold text-xs px-4 py-2.5 inline-flex items-center gap-1.5"
          >
            <Wallet className="size-4" />
            <span>Withdraw UPI / NEFT →</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-[#1E283D] bg-[#121723] p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Award className="size-4 text-[#E5A93C]" />
            <span>Daily Shift Target Milestones</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-[#1E283D] bg-[#0E121B] p-3.5">
              <div className="font-bold text-white">8 Orders Target</div>
              <div className="text-[#E5A93C] font-semibold mt-0.5">+₹100.00 Milestone Bonus</div>
              <div className="text-emerald-400 text-[11px] mt-1">Progress: {tripsCompleted} / 8 orders</div>
            </div>
            <div className="rounded-xl border border-[#1E283D] bg-[#0E121B] p-3.5">
              <div className="font-bold text-white">14 Orders Target</div>
              <div className="text-[#E5A93C] font-semibold mt-0.5">+₹220.00 Milestone Bonus</div>
              <div className="text-slate-400 text-[11px] mt-1">Progress: {tripsCompleted} / 14 orders</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#1E283D] bg-[#121723] p-5 space-y-2.5 text-xs">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <MapPin className="size-4 text-[#E5A93C]" />
            <span>IST Shift Geofence &amp; Payout Rate Card</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#1E283D]">
            <span className="text-slate-300">Day Shift (06:00 - 18:00 IST) Operational Radius</span>
            <span className="font-mono font-bold text-white">12.0 km</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#1E283D]">
            <span className="text-slate-300">Evening Shift (18:00 - 23:00 IST) Operational Radius</span>
            <span className="font-mono font-bold text-white">7.5 km</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#1E283D]">
            <span className="text-slate-300">Late-Night Shift (23:00 - 06:00 IST) Operational Radius</span>
            <span className="font-mono font-bold text-white">3.5 km</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#1E283D]">
            <span className="text-slate-300">Guaranteed Base Pay + Distance Slab</span>
            <span className="font-mono font-bold text-white">₹35 base + ₹12/km (&gt;2 km)</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-slate-300">Doorstep Delivery OTP Release</span>
            <span className="font-mono font-bold text-emerald-400">Instant on 4-Digit Match</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
