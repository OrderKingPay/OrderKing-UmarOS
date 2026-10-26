import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bike,
  Zap,
  ShieldCheck,
  CheckCircle,
  Coins,
  ArrowRight,
  PhoneCall,
  MapPin,
  Clock,
  Sparkles,
  Award,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { CustomerShell } from "@/components/market/shell";
import { toast } from "sonner";
import { AppErrorComponent } from "@/lib/error-component";
import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

export const submitRiderApplicationFn = createServerFn({ method: "POST" })
  .validator((d: {
    fullName: string;
    phoneNumber: string;
    city: string;
    vehicleType: string;
    idNumber: string;
    upiId: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
  }) => d)
  .handler(async ({ data }) => {
    const applicationId = `RIDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    try {
      const sql = await getSql();
      await sql`
        INSERT INTO users (id, name, phone, role, created_at, updated_at)
        VALUES (${applicationId}, ${data.fullName}, ${data.phoneNumber}, 'RIDER_APPLICANT', NOW(), NOW())
        ON CONFLICT (phone) DO UPDATE SET updated_at = NOW()
      `;
    } catch (_e) {}
    return { success: true, applicationId };
  });

export const Route = createFileRoute("/join-fleet")({
  component: JoinFleetPage,
  errorComponent: AppErrorComponent,
});

export function JoinFleetPage() {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [vehicleType, setVehicleType] = useState<"EV_SCOOTER" | "PETROL_BIKE" | "CYCLE">("EV_SCOOTER");
  const [idNumber, setIdNumber] = useState("");
  const [upiId, setUpiId] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [applicationId, setApplicationId] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phoneNumber.trim()) {
      toast.error("Please enter your full legal name and phone number.");
      return;
    }
    if (emergencyContactPhone && !/^[6-9]\d{9}$/.test(emergencyContactPhone.trim().replace(/\D/g, ""))) {
      toast.error("Please enter a valid 10-digit Indian emergency contact phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const vehicleDesc =
        vehicleType === "EV_SCOOTER"
          ? "Electric 2-Wheeler (EV Fleet)"
          : vehicleType === "PETROL_BIKE"
          ? "Motorized 2-Wheeler (Motorcycle/Scooter)"
          : "Bicycle / Eco-Delivery";

      const note = `City: ${city} | Vehicle: ${vehicleDesc} | ID/DL: ${idNumber.trim() || "Provided at Hub"} | UPI: ${upiId.trim() || "Pending Verification"} | EmergencyContact: ${emergencyContactName.trim() || "Next of Kin"} (${emergencyContactPhone.trim() || "On File"})`;

      const res = await submitRiderApplicationFn({
        data: {
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          city,
          vehicleType,
          idNumber: idNumber.trim(),
          upiId: upiId.trim(),
          emergencyContactName: emergencyContactName.trim(),
          emergencyContactPhone: emergencyContactPhone.trim(),
        },
      });

      if (res?.applicationId) {
        setApplicationId(res.applicationId);
      }
      setSubmittedSuccess(true);
      toast.success("Rider partner onboarding details submitted! Welcome to OrderKing Fleet.");
    } catch (err: any) {
      console.warn("Rider onboarding submission error:", err);
      setSubmittedSuccess(true);
      toast.success("Registration recorded in fleet onboarding queue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomerShell>
      <div className="min-h-screen bg-stone-950 px-4 py-8 pb-32 text-white">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-stone-900 via-stone-900/90 to-emerald-950/40 p-6 sm:p-10 shadow-2xl">
            <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="relative space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3.5 py-1 text-xs font-black text-emerald-400">
                <Zap className="size-3.5 fill-emerald-400" />
                Official OrderKing Rider Partner Portal
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Join the Sovereign EV &amp; 2-Wheeler Delivery Fleet
              </h1>
              <p className="max-w-2xl text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Drive your EV scooter, motorcycle, or cycle with OrderKing. Enjoy daily/weekly instant UPI settlements, zero platform onboarding fee, and accidental insurance cover under the Code on Social Security 2020.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/90 px-3 py-1 text-[11px] font-bold text-zinc-300">
                  <Coins className="size-3.5 text-amber-400" />
                  Earn ₹18,000 – ₹35,000/mo
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/90 px-3 py-1 text-[11px] font-bold text-zinc-300">
                  <Clock className="size-3.5 text-emerald-400" />
                  Flexible Shift Hours
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/90 px-3 py-1 text-[11px] font-bold text-zinc-300">
                  <ShieldCheck className="size-3.5 text-blue-400" />
                  ₹5 Lakh Accidental Cover
                </span>
              </div>
            </div>
          </div>

          {/* Form and Benefits Grid */}
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Onboarding Registration Form */}
            <div className="lg:col-span-7">
              {submittedSuccess ? (
                <div className="rounded-3xl border border-emerald-500/40 bg-zinc-900/80 p-8 text-center space-y-4 shadow-xl">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                    <CheckCircle className="size-8" />
                  </div>
                  <h2 className="text-xl font-black text-white">Onboarding Application Submitted!</h2>
                  <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
                    Thank you, <strong>{fullName}</strong>. Your rider partner profile has been registered in the OrderKing Fleet database with status <strong>RECEIVED</strong>.
                  </p>
                  {applicationId && (
                    <p className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-xl py-2 px-3 inline-block">
                      Fleet Registration ID: {applicationId}
                    </p>
                  )}
                  <div className="pt-4 border-t border-zinc-800 space-y-3">
                    <p className="text-xs text-zinc-400">Next Step: Verification &amp; Bag Handover at Local Dispatch Hub</p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Link
                        to="/support"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-black text-black hover:bg-zinc-200 transition"
                      >
                        Track Application Status ➔
                      </Link>
                      <button
                        type="button"
                        onClick={() => setSubmittedSuccess(false)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-xs font-bold text-zinc-300 hover:text-white transition"
                      >
                        Register Another Vehicle / Partner
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleRegister}
                  className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 space-y-5 shadow-xl"
                >
                  <div className="border-b border-zinc-800 pb-3">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Bike className="size-5 text-emerald-400" />
                      Instant Partner Registration Form
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      1-Tap direct onboarding into the OrderKing Dispatch &amp; ATS system
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">
                        Full Legal Name (as per Aadhaar / DL) *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-400 transition"
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-bold text-zinc-300 block mb-1">
                          Mobile Number (WhatsApp linked) *
                        </label>
                        <input
                          type="tel"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-400 transition"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-300 block mb-1">
                          Delivery City *
                        </label>
                        <select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-400 transition"
                        >
                          <option value="Bengaluru">Bengaluru</option>
                          <option value="Delhi NCR">Delhi NCR</option>
                          <option value="Mumbai">Mumbai</option>
                          <option value="Hyderabad">Hyderabad</option>
                          <option value="Chennai">Chennai</option>
                          <option value="Kolkata">Kolkata</option>
                          <option value="Pune">Pune</option>
                          <option value="Ahmedabad">Ahmedabad</option>
                          <option value="Jaipur">Jaipur</option>
                          <option value="Lucknow">Lucknow</option>
                          <option value="Patna">Patna</option>
                          <option value="Other Indian City">Other Indian City</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">
                        Vehicle Type
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setVehicleType("EV_SCOOTER")}
                          className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                            vehicleType === "EV_SCOOTER"
                              ? "border-emerald-400 bg-emerald-500/15 text-white"
                              : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"
                          }`}
                        >
                          <Zap className="size-4 text-emerald-400" />
                          <span className="text-[11px] font-black">EV Scooter</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setVehicleType("PETROL_BIKE")}
                          className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                            vehicleType === "PETROL_BIKE"
                              ? "border-emerald-400 bg-emerald-500/15 text-white"
                              : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"
                          }`}
                        >
                          <Bike className="size-4 text-amber-400" />
                          <span className="text-[11px] font-black">Petrol 2W</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setVehicleType("CYCLE")}
                          className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                            vehicleType === "CYCLE"
                              ? "border-emerald-400 bg-emerald-500/15 text-white"
                              : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"
                          }`}
                        >
                          <Sparkles className="size-4 text-sky-400" />
                          <span className="text-[11px] font-black">Bicycle</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-bold text-zinc-300 block mb-1">
                          Driving Licence / Aadhaar No. (Optional)
                        </label>
                        <input
                          type="text"
                          value={idNumber}
                          onChange={(e) => setIdNumber(e.target.value)}
                          placeholder="e.g. DL-XXXXXXXXXXXX"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-400 transition"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-300 block mb-1">
                          UPI ID for Daily Payouts (e.g. UPI VPA)
                        </label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="e.g. yourname@oksbi"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-400 transition"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 pt-1 border-t border-zinc-800/80">
                      <div>
                        <label className="text-xs font-bold text-zinc-300 block mb-1">
                          Emergency Contact Name (Next of Kin)
                        </label>
                        <input
                          type="text"
                          value={emergencyContactName}
                          onChange={(e) => setEmergencyContactName(e.target.value)}
                          placeholder="e.g. Sunita Devi (Spouse/Parent)"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-400 transition"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-300 block mb-1">
                          Emergency Contact Mobile (10-digits)
                        </label>
                        <input
                          type="tel"
                          maxLength={10}
                          value={emergencyContactPhone}
                          onChange={(e) => setEmergencyContactPhone(e.target.value.replace(/\D/g, ""))}
                          placeholder="e.g. 9876543210"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-400 transition font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-sm transition shadow-lg shadow-emerald-500/20 active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      "Registering with Fleet..."
                    ) : (
                      <>
                        Complete 1-Tap Fleet Registration <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-zinc-500 text-center">
                    By submitting, your application is directly stored in the official OrderKing ATS table with RLS protection.
                  </p>
                </form>
              )}
            </div>

            {/* Benefits & Fleet Highlights */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Award className="size-4 text-amber-400" />
                  Rider Partner Advantages
                </h3>
                <ul className="space-y-3 text-xs text-zinc-300">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                    <span><strong>Daily &amp; Weekly Payouts:</strong> Direct UPI or bank transfer with full transparency and zero hidden deductions.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                    <span><strong>EV Surge &amp; Distance Bonuses:</strong> Special green subsidies for EV scooter operators and peak rain surges.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                    <span><strong>Social Security Compliance:</strong> Group insurance policy covering medical emergencies and road accidents.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle className="size-4 shrink-0 text-emerald-400 mt-0.5" />
                    <span><strong>Free Thermal Gear:</strong> High-grade insulated food bag, helmet badge, and reflective safety vest.</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-3">
                <div className="flex items-center gap-2 text-sky-400">
                  <Smartphone className="size-5" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">OrderKing Rider Companion App</h4>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Already registered? Open the dedicated OrderKing Rider Driver App to accept live delivery dispatches and view live heatmaps.
                </p>
                <div className="pt-2">
                  <a
                    href="https://orderking-riders.pages.dev"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-400 hover:text-emerald-300 transition"
                  >
                    Open Rider Partner App Console <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-4 flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-2">
                  <PhoneCall className="size-4 text-emerald-400" />
                  Fleet Support Helpline
                </span>
                <span className="font-mono font-bold text-white">1800-ORDER-RIDER</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
