import React, { useState } from "react";
import {
  Package,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Loader2,
  FileText,
  Smartphone,
  UtensilsCrossed,
  Shirt,
  HeartPulse,
  Box,
} from "lucide-react";
import { toast } from "sonner";
import { computeParcelFare, createParcelOrderFn } from "@/lib/server/parcel";

export const PARCEL_CATEGORIES = [
  { id: "documents", label: "Documents", icon: FileText, desc: "Paperwork, legal files, passports" },
  { id: "food", label: "Food & Groceries", icon: UtensilsCrossed, desc: "Packed meals, tiffins, provisions" },
  { id: "electronics", label: "Electronics", icon: Smartphone, desc: "Phones, cables, accessories" },
  { id: "clothes", label: "Clothes & Gifts", icon: Shirt, desc: "Apparel, parcels, gifts" },
  { id: "medical", label: "Medicines", icon: HeartPulse, desc: "Prescriptions & health supplies" },
  { id: "other", label: "General Goods", icon: Box, desc: "Boxes & miscellaneous items" },
] as const;

export function LocalParcelEstimator() {
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [category, setCategory] = useState<string>("documents");
  const [distanceKm, setDistanceKm] = useState<number>(3.5);
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  const fare = computeParcelFare(distanceKm);

  const handleRequestDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup.trim() || !drop.trim()) {
      toast.error("Please enter both pickup and drop addresses.");
      return;
    }
    if (pickup.trim().toLowerCase() === drop.trim().toLowerCase()) {
      toast.error("Pickup and drop addresses must be different.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createParcelOrderFn({
        data: {
          pickup: pickup.trim(),
          drop: drop.trim(),
          category,
          distanceKm,
          senderName: senderName.trim(),
          senderPhone: senderPhone.trim(),
          receiverName: receiverName.trim(),
          receiverPhone: receiverPhone.trim(),
        },
      });
      setConfirmedOrder(res);
      toast.success(`Parcel dispatch request logged: ${res.publicId}`);
    } catch (err: any) {
      toast.error("Could not place parcel dispatch request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-[#121622] p-4 sm:p-6 text-slate-100 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
            <Package className="size-4" />
            <span>Local Courier</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
            Local Parcel Pickup &amp; Drop Estimator
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Point-to-point courier service · Transparent base fare ₹30 + ₹10/km
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          <Clock className="size-3.5 text-amber-400" />
          <span>Same-Day Hyperlocal Dispatch</span>
        </div>
      </div>

      {confirmedOrder ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 space-y-4">
          <div className="flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="size-6 shrink-0" />
            <div>
              <h4 className="text-base font-black text-white">Courier Dispatch Request Confirmed</h4>
              <p className="text-xs text-slate-300 font-mono">Tracking Ref: {confirmedOrder.publicId}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400 block mb-0.5 font-bold">Pickup Address</span>
              <p className="font-semibold text-white">{confirmedOrder.pickup}</p>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-bold">Drop Address</span>
              <p className="font-semibold text-white">{confirmedOrder.drop}</p>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-bold">Category</span>
              <p className="font-semibold text-white capitalize">{confirmedOrder.category}</p>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-bold">Estimated Distance &amp; Fare</span>
              <p className="font-semibold text-amber-400">{confirmedOrder.distanceKm} km · ₹{confirmedOrder.totalInr}</p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                setConfirmedOrder(null);
                setPickup("");
                setDrop("");
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition"
            >
              New Parcel Calculation
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleRequestDispatch} className="space-y-5">
          {/* Pickup and Drop Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <MapPin className="size-3.5 text-emerald-400" /> Pickup Location *
              </label>
              <input
                type="text"
                required
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="Shop / House / Office pickup landmark"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-semibold focus:border-amber-400 outline-none placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <MapPin className="size-3.5 text-rose-400" /> Delivery Location *
              </label>
              <input
                type="text"
                required
                value={drop}
                onChange={(e) => setDrop(e.target.value)}
                placeholder="Recipient address or landmark"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-semibold focus:border-amber-400 outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Parcel Category Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">
              Item Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {PARCEL_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col items-start gap-1 cursor-pointer ${
                      isSelected
                        ? "border-amber-400 bg-amber-400/10 text-white"
                        : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <Icon className={`size-4 ${isSelected ? "text-amber-400" : "text-slate-400"}`} />
                    <span className="text-xs font-bold leading-tight mt-0.5">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Distance Slider & Calculations */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="distance-slider" className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Estimated Delivery Distance
              </label>
              <span className="text-sm font-black text-amber-400 font-mono">
                {distanceKm} km
              </span>
            </div>
            <input
              id="distance-slider"
              type="range"
              min="0.5"
              max="35"
              step="0.5"
              value={distanceKm}
              onChange={(e) => setDistanceKm(parseFloat(e.target.value) || 1)}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-bold">
              <span>Hyperlocal (1 km)</span>
              <span>City Metro (15 km)</span>
              <span>Regional Hub (35 km)</span>
            </div>
          </div>

          {/* Transparent Fare Ledger */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Rate Breakdown
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Base Dispatch Fare</span>
                <span className="font-mono font-semibold">₹30</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Distance Rate ({distanceKm} km × ₹10/km)</span>
                <span className="font-mono font-semibold">₹{fare.distanceFareInr}</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-sm font-black text-white">
                <span>Total Estimated Fare</span>
                <span className="text-lg font-black text-amber-400 font-mono">₹{fare.totalInr}</span>
              </div>
            </div>
          </div>

          {/* Contact Details (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <input
              type="text"
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              placeholder="Sender Contact Number (Optional)"
              className="h-10 px-3 rounded-xl border border-slate-800 bg-slate-900 text-white text-xs outline-none focus:border-amber-400 placeholder:text-slate-500"
            />
            <input
              type="text"
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
              placeholder="Recipient Contact Number (Optional)"
              className="h-10 px-3 rounded-xl border border-slate-800 bg-slate-900 text-white text-xs outline-none focus:border-amber-400 placeholder:text-slate-500"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 px-6 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Logging Request...</span>
                </>
              ) : (
                <>
                  <span>Request Courier Pickup · ₹{fare.totalInr}</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
