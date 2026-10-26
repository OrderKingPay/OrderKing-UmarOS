import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { VendorShell } from "@/components/vendor-shell";
import {
  TableReservationManager,
  useTableReservations,
} from "@/components/table-reservation-manager";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useT } from "@/components/use-t";
import { useVendor } from "@/components/use-vendor";
import {
  Armchair,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  HelpCircle,
  Receipt,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  UserPlus,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommissionTokens } from "@orderking/ui";

export const Route = createFileRoute("/dining")({ component: DiningPage });

function DiningPage() {
  const t = useT();
  const vendor = useVendor();
  const commissionTokens = useCommissionTokens();
  const dineInCommissionDisplay =
    commissionTokens.dineInBps === 0 ? "0%" : `${(commissionTokens.dineInBps / 100).toFixed(0)}%`;
  const reservationState = useTableReservations(vendor.restaurantId);

  const {
    activeBookingsCount,
    seatedGuestsCount,
    availableTablesCount,
    occupiedTablesCount,
    tables,
    totalDeposits,
    totalPlatformFee,
    totalNetPayable,
    autoAcceptBookings,
    setAutoAcceptBookings,
    handleAddWalkIn,
  } = reservationState;

  // Local modals controlled at route header level
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [floorSettingsModalOpen, setFloorSettingsModalOpen] = useState(false);

  // Quick Walk-In Form State
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [pax, setPax] = useState(2);
  const [zone, setZone] = useState<
    | "AC Indoor Main Hall"
    | "Rooftop Open Air"
    | "Outdoor Patio"
    | "Private Cabana / VIP Lounge"
  >("AC Indoor Main Hall");
  const [tableNo, setTableNo] = useState("");
  const [deposit, setDeposit] = useState(500);

  const availableForZone = tables.filter(
    (t) => t.status === "AVAILABLE" && t.zone === zone
  );

  const handleWalkInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !phone.trim()) return;
    const assigned = tableNo || availableForZone[0]?.tableNumber || "T-01";
    handleAddWalkIn({
      guestName: guestName.trim(),
      phone: phone.trim(),
      guestsCount: pax,
      zone,
      tableNumber: assigned,
      depositAmount: Number(deposit) || 500,
    });
    setGuestName("");
    setPhone("");
    setTableNo("");
    setWalkInModalOpen(false);
  };

  const occupancyRate = Math.round(
    (occupiedTablesCount / (tables.length || 1)) * 100
  );

  return (
    <VendorShell
      title={t("nav.dining") || "Dining & Table Reservations"}
      dataLabel={vendor.dataLabel}
      restaurantName={vendor.selected?.restaurantName}
    >
      <div className="space-y-6">
        {/* TOP STATION BANNER & LIVE REVENUE LEDGER */}
        <div className="rounded-[28px] border border-slate-800 bg-slate-900/90 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-950 p-5 sm:p-6 shadow-xl space-y-5">
          {/* Header Title & Quick Action Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <UtensilsCrossed className="size-5" />
                </div>
                <div>
                  <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-100 flex flex-wrap items-center gap-2">
                    Order King Dining &amp; Table Reservations
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      {dineInCommissionDisplay} MERCHANT COMMISSION
                    </span>
                    <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                      5% GUEST CONVENIENCE FEE
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400">
                    Live guest seating orchestration across AC, Rooftop, Patio &amp; Cabana zones with {dineInCommissionDisplay} merchant commission on all dine-in covers.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions (Add Walk-In Guest, Floor Plan Settings, Toggle Auto-Accept Bookings) */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Toggle Auto-Accept Bookings */}
              <button
                type="button"
                onClick={() => setAutoAcceptBookings((prev) => !prev)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition border",
                  autoAcceptBookings
                    ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/70"
                    : "bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                )}
                title="Toggle Auto-Accept Bookings"
              >
                {autoAcceptBookings ? (
                  <ToggleRight className="size-4 text-emerald-400" />
                ) : (
                  <ToggleLeft className="size-4 text-slate-400" />
                )}
                <span>Auto-Accept Bookings:</span>
                <span className={autoAcceptBookings ? "text-emerald-400 font-extrabold" : "text-slate-400"}>
                  {autoAcceptBookings ? "ON" : "MANUAL"}
                </span>
              </button>

              {/* Add Walk-In Guest */}
              <Button
                size="sm"
                onClick={() => setWalkInModalOpen(true)}
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20"
              >
                <UserPlus className="size-3.5" />
                Add Walk-In Guest
              </Button>

              {/* Floor Plan Settings */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFloorSettingsModalOpen(true)}
                className="gap-1.5 text-xs border-slate-700 bg-slate-900/80 text-slate-300 hover:bg-slate-800"
              >
                <SlidersHorizontal className="size-3.5" />
                Floor Plan Settings
              </Button>
            </div>
          </div>

          {/* ACTIVE BOOKINGS COUNTER & LIVE REVENUE LEDGER GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Active Bookings Counter */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Active Reservations</span>
                <CalendarDays className="size-4 text-amber-400" />
              </div>
              <div className="font-display text-2xl font-black text-slate-100 flex items-baseline gap-1.5">
                {activeBookingsCount}
                <span className="text-[11px] font-mono text-slate-400 font-normal">
                  ({seatedGuestsCount} seated diners)
                </span>
              </div>
              <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <span>{availableTablesCount} of {tables.length} tables free</span>
                <span className="text-slate-600">•</span>
                <span>{occupancyRate}% occupancy</span>
              </div>
            </div>

            {/* 2. Total Pre-Booking Cover Charges Collected */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
                <span>Cover Charges Collected</span>
                <DollarSign className="size-4 text-emerald-400" />
              </div>
              <div className="font-display text-2xl font-black text-slate-100">
                ₹{totalDeposits.toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-emerald-300/80">
                Advance deposits held for guest arrival
              </div>
            </div>

            {/* 3. Live Platform Revenue Ledger (5% Platform Fee) */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
                <span>5% Guest Platform Fee</span>
                <Sparkles className="size-4 text-amber-400" />
              </div>
              <div className="font-display text-2xl font-black text-amber-400">
                ₹{totalPlatformFee.toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-amber-300/80">
                Guest booking concierge (0% restaurant fee)
              </div>
            </div>

            {/* 4. Net Restaurant Settlement Payable */}
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-indigo-400 text-xs font-semibold">
                <span>Net Restaurant Credit</span>
                <Receipt className="size-4 text-indigo-400" />
              </div>
              <div className="font-display text-2xl font-black text-indigo-300">
                ₹{totalNetPayable.toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-indigo-300/80">
                100% credited against dine-in table bills
              </div>
            </div>
          </div>

          {/* ORDER KING RESTAURATEUR COMMITMENT STRIP */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-950/30 px-4 py-3 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
              <span>
                <strong className="text-emerald-300">Order King Hospitality Promise:</strong> {dineInCommissionDisplay} merchant commission on all dine-in reservations. You retain 100% of guest food &amp; beverage bills.
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400 shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                {dineInCommissionDisplay} Dine-In Commission
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-amber-400" />
                5% Guest Platform Fee
              </span>
            </div>
          </div>
        </div>

        {/* MAIN DINING & TABLE RESERVATION MANAGER COMPONENT */}
        <TableReservationManager
          restaurantId={vendor.restaurantId}
          hookState={reservationState}
          onOpenWalkInModal={() => setWalkInModalOpen(true)}
          onOpenFloorSettings={() => setFloorSettingsModalOpen(true)}
        />

        {/* HEADER ROUTE WALK-IN MODAL */}
        {walkInModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <UserPlus className="size-4 text-emerald-400" />
                  Quick Walk-In Seating
                </h3>
                <button
                  type="button"
                  onClick={() => setWalkInModalOpen(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleWalkInSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Guest Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sneha Sengupta"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98301 00000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Party Size (Pax)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={pax}
                      onChange={(e) => setPax(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Area Zone
                  </label>
                  <select
                    value={zone}
                    onChange={(e) => {
                      setZone(
                        e.target.value as
                          | "AC Indoor Main Hall"
                          | "Rooftop Open Air"
                          | "Outdoor Patio"
                          | "Private Cabana / VIP Lounge"
                      );
                      setTableNo("");
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="AC Indoor Main Hall">AC Indoor Main Hall (AC)</option>
                    <option value="Rooftop Open Air">Rooftop Open Air (Rooftop)</option>
                    <option value="Outdoor Patio">Outdoor Patio (Patio)</option>
                    <option value="Private Cabana / VIP Lounge">
                      Private Cabana / VIP Lounge (Cabana)
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Assign Table
                    </label>
                    <select
                      value={tableNo}
                      onChange={(e) => setTableNo(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-400 focus:outline-none"
                    >
                      <option value="">Auto-Pick Available Table</option>
                      {availableForZone.map((t) => (
                        <option key={t.id} value={t.tableNumber}>
                          {t.tableNumber} ({t.capacityTag})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Cover Deposit
                    </label>
                    <select
                      value={deposit}
                      onChange={(e) => setDeposit(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-400 focus:outline-none"
                    >
                      <option value={500}>₹500 (Standard Table Deposit)</option>
                      <option value={1000}>₹1,000 (VIP / Cabana Deposit)</option>
                      <option value={0}>₹0 (Walk-In Direct - No Deposit)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setWalkInModalOpen(false)}
                    className="text-xs text-slate-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    Seat Guest Now
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* HEADER ROUTE FLOOR SETTINGS MODAL */}
        {floorSettingsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-amber-400" />
                  Floor Plan &amp; Table Settings
                </h3>
                <button
                  type="button"
                  onClick={() => setFloorSettingsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <div>
                    <div className="font-bold text-slate-100">
                      Auto-Accept Bookings
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Instantly confirm reservations when free tables match party size
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoAcceptBookings}
                    onChange={(e) => setAutoAcceptBookings(e.target.checked)}
                    className="size-4 accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-[11px] text-amber-300 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-amber-200">
                    <ShieldCheck className="size-3.5 text-amber-400" /> Order King Table Reservation Management
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Order King manages table reservations directly with verified guests. Guests pay a nominal platform fee for instant table confirmation and automated concierge SMS. Net cover deposits are credited straight into guest dining settlements.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end border-t border-slate-800">
                <Button
                  size="sm"
                  onClick={() => setFloorSettingsModalOpen(false)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Close &amp; Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </VendorShell>
  );
}
