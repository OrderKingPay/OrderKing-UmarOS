// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { CheckCircle2, MapPin, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/trips")({
  component: RiderTripsPage,
});

function RiderTripsPage() {
  const trips = [
    {
      id: "OK-9014",
      restaurant: "Royal Assam Kitchen (FSSAI: 10324001000492)",
      distanceKm: 3.5,
      shift: "Day Shift (12.0 km Circle)",
      basePaise: 3800,
      surgePaise: 1500,
      otpCode: "7391",
      gps: "24.8751° N, 92.3640° E",
      completedAt: "Today, 14:22 IST",
    },
    {
      id: "OK-8998",
      restaurant: "Barak Valley Biryani House (FSSAI: 20324001000811)",
      distanceKm: 2.1,
      shift: "Day Shift (12.0 km Circle)",
      basePaise: 3500,
      surgePaise: 1000,
      otpCode: "5184",
      gps: "24.8690° N, 92.3592° E",
      completedAt: "Today, 13:05 IST",
    },
  ];

  const fmt = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-5 space-y-4 text-slate-100">
        <div className="rounded-2xl border border-[#1E283D] bg-[#121723] p-5">
          <h1 className="text-base font-bold text-white">Verified Doorstep-OTP Trip History</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Every completed trip includes cryptographic 4-digit OTP proof and 90-day DPDP GPS telemetry.
          </p>
        </div>

        <div className="space-y-3">
          {trips.map((t) => (
            <div key={t.id} className="rounded-2xl border border-[#1E283D] bg-[#121723] p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-white">#{t.id}</span>
                <span className="rounded-md bg-emerald-500/20 px-2.5 py-0.5 font-bold text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" />
                  <span>OTP {t.otpCode} Verified</span>
                </span>
              </div>
              <div className="font-semibold text-slate-200">{t.restaurant}</div>
              <div className="flex flex-wrap gap-3 text-slate-400">
                <span>Distance: <strong className="text-white">{t.distanceKm} km</strong></span>
                <span>Shift: <strong className="text-white">{t.shift}</strong></span>
                <span>GPS: <strong className="font-mono text-slate-300">{t.gps}</strong></span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#1E283D]">
                <span className="text-slate-400">{t.completedAt}</span>
                <span className="font-mono text-sm font-bold text-[#E5A93C]">
                  {fmt(t.basePaise + t.surgePaise)} (Base {fmt(t.basePaise)} + Surge {fmt(t.surgePaise)})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
