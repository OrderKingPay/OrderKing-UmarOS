// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/rider/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCheck, Bike, CheckCircle2, LogOut, Trash2 } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: RiderProfilePage,
});

function RiderProfilePage() {
  const [fullName, setFullName] = useState("Delivery Partner");
  const [phone, setPhone] = useState("");
  const [cityZone, setCityZone] = useState("Guwahati");
  const [vehicle, setVehicle] = useState("BIKE");
  const [upiId, setUpiId] = useState("");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("orderking_rider_profile_v1");
      if (raw) {
        const d = JSON.parse(raw);
        if (d.fullName) setFullName(d.fullName);
        if (d.phone) setPhone(d.phone);
        if (d.cityZone) setCityZone(d.cityZone);
        if (d.vehicle) setVehicle(d.vehicle);
        if (d.upiId) setUpiId(d.upiId);
      }
    } catch {}
  }, []);

  function handleSave(e: any) {
    e.preventDefault();
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(
          "orderking_rider_profile_v1",
          JSON.stringify({ fullName, phone, cityZone, vehicle, upiId, updatedAt: new Date().toISOString() })
        );
      } catch {}
    }
    setSavedMsg("Profile saved.");
  }

  function handleSignOut() {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("orderking_authenticated_user");
        window.localStorage.removeItem("orderking_phone_session");
        window.localStorage.removeItem("orderking_auth_session_v1");
      } catch {}
      window.location.assign("/login");
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-5 space-y-4 text-slate-100">
        <div className="rounded-2xl border border-[#1E283D] bg-[#121723] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#E5A93C]/20 text-[#E5A93C]">
              <UserCheck className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">{fullName}</h1>
              <p className="text-xs text-slate-400">{cityZone} · Vehicle: {vehicle}</p>
            </div>
          </div>
          <Link
            to="/onboarding"
            className="rounded-xl border border-[#1E283D] bg-[#0E121B] px-3.5 py-2 text-xs font-semibold text-slate-200"
          >
            KYC &amp; Bank Setup
          </Link>
        </div>

        {savedMsg && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-400" />
            <span>{savedMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="rounded-2xl border border-[#1E283D] bg-[#121723] p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-slate-300">Full Name</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 h-11 bg-[#0E121B] border-[#1E283D] text-white"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Mobile Number</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
                className="mt-1 h-11 bg-[#0E121B] border-[#1E283D] text-white font-mono"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Delivery Zone / City</Label>
              <Input
                value={cityZone}
                onChange={(e) => setCityZone(e.target.value)}
                className="mt-1 h-11 bg-[#0E121B] border-[#1E283D] text-white"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Payout UPI ID</Label>
              <Input
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="mobile@upi"
                className="mt-1 h-11 bg-[#0E121B] border-[#1E283D] text-white font-mono"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              type="submit"
              className="h-11 px-6 bg-[#E5A93C] hover:bg-amber-400 text-black font-bold rounded-xl"
            >
              Save Profile
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSignOut}
                className="h-10 px-4 border-[#1E283D] bg-[#0E121B] text-slate-200 rounded-xl flex items-center gap-1.5 text-xs"
              >
                <LogOut className="size-3.5" />
                <span>Sign Out</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.localStorage.clear();
                    window.location.assign("/login");
                  }
                }}
                className="h-10 px-3.5 border-rose-500/30 bg-rose-950/30 text-rose-300 rounded-xl flex items-center gap-1.5 text-xs"
              >
                <Trash2 className="size-3.5" />
                <span>Delete Account</span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
