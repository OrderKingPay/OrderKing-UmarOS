import { useState } from "react";
import { Users, Calendar, Clock, Check, X, Phone, Utensils, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface ReservationBooking {
  id: string;
  bookingRef: string;
  guestName: string;
  phone: string;
  guestsCount: number;
  timeSlot: string;
  date: string;
  areaPreference: "AC Indoor" | "Rooftop" | "Outdoor" | "Private Dining";
  occasion?: string;
  status: "PENDING" | "CONFIRMED" | "SEATED" | "CANCELLED";
  assignedTable?: string;
  createdAgo: string;
}

export function TableReservationManager() {
  const [activeTab, setActiveTab] = useState<"PENDING" | "CONFIRMED" | "SEATED">("PENDING");
  const [reservations, setReservations] = useState<ReservationBooking[]>([
    {
      id: "res-1",
      bookingRef: "TB-98241",
      guestName: "Ananya Roy",
      phone: "+91 98301 22345",
      guestsCount: 4,
      timeSlot: "8:00 PM",
      date: "Today",
      areaPreference: "Rooftop",
      occasion: "Birthday Celebration",
      status: "PENDING",
      createdAgo: "4 mins ago",
    },
    {
      id: "res-2",
      bookingRef: "TB-83419",
      guestName: "Rohan & Dev",
      phone: "+91 91234 56789",
      guestsCount: 2,
      timeSlot: "8:30 PM",
      date: "Today",
      areaPreference: "AC Indoor",
      occasion: "Candlelight Dinner",
      status: "CONFIRMED",
      assignedTable: "T-04 (Corner AC)",
      createdAgo: "18 mins ago",
    },
    {
      id: "res-3",
      bookingRef: "TB-71104",
      guestName: "Sengupta Family",
      phone: "+91 98451 99120",
      guestsCount: 6,
      timeSlot: "7:30 PM",
      date: "Today",
      areaPreference: "Private Dining",
      occasion: "Family Reunion",
      status: "SEATED",
      assignedTable: "P-01 (Cabana)",
      createdAgo: "45 mins ago",
    },
  ]);

  const [tableInput, setTableInput] = useState<Record<string, string>>({});

  const handleConfirm = (id: string) => {
    const tableNo = tableInput[id] || "Table " + (Math.floor(Math.random() * 12) + 1);
    setReservations((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "CONFIRMED", assignedTable: tableNo } : r
      )
    );
  };

  const handleSeat = (id: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "SEATED" } : r))
    );
  };

  const handleDecline = (id: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "CANCELLED" } : r))
    );
  };

  const filtered = reservations.filter((r) => r.status === activeTab);

  return (
    <div className="space-y-4">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-surface-2/60 p-4">
        <div>
          <h2 className="text-base font-bold text-fg flex items-center gap-2">
            <span>🥂</span> Table Reservations (Dining Out)
          </h2>
          <p className="text-xs text-muted">
            Manage incoming dine-in guest reservations, assign tables, and monitor table turns.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-fg">
            Total Today: {reservations.length} Bookings
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {(["PENDING", "CONFIRMED", "SEATED"] as const).map((tab) => {
          const count = reservations.filter((r) => r.status === tab).length;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                activeTab === tab
                  ? "bg-primary text-primary-fg shadow-xs"
                  : "bg-surface-2 text-muted hover:text-fg"
              }`}
            >
              {tab === "PENDING" && "⏳ Pending Approval"}
              {tab === "CONFIRMED" && "✅ Confirmed Tables"}
              {tab === "SEATED" && "🍽️ Currently Seated"}
              <span className="ml-1.5 opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Reservation Cards List */}
      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center text-xs text-muted">
            No {activeTab.toLowerCase()} reservations at this time.
          </Card>
        ) : (
          filtered.map((res) => (
            <Card key={res.id} className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                    {res.guestsCount}P
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-fg">{res.guestName}</h3>
                    <p className="text-xs text-muted flex items-center gap-1.5">
                      <Phone className="size-3" /> {res.phone} · <span className="font-mono text-[11px]">{res.bookingRef}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-lg bg-surface-2 px-2 py-1 font-semibold text-fg border border-border">
                    🕒 {res.timeSlot} ({res.date})
                  </span>
                  <span className="rounded-lg bg-primary/10 px-2 py-1 font-semibold text-primary">
                    📍 {res.areaPreference}
                  </span>
                </div>
              </div>

              {res.occasion && (
                <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 rounded-lg px-2.5 py-1 inline-block font-medium">
                  🎉 Special: {res.occasion}
                </div>
              )}

              {/* Status Specific Action Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <div className="text-xs text-muted">
                  Requested {res.createdAgo}
                  {res.assignedTable && (
                    <span className="ml-2 font-bold text-fg">
                      Assigned: {res.assignedTable}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {res.status === "PENDING" && (
                    <>
                      <input
                        type="text"
                        placeholder="Table No (e.g. T-03)"
                        value={tableInput[res.id] || ""}
                        onChange={(e) =>
                          setTableInput((prev) => ({ ...prev, [res.id]: e.target.value }))
                        }
                        className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs w-32"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleConfirm(res.id)}
                        className="gap-1 text-xs"
                      >
                        <Check className="size-3.5" /> Accept & Reserve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDecline(res.id)}
                        className="text-xs text-danger hover:bg-danger/10"
                      >
                        <X className="size-3.5" /> Decline
                      </Button>
                    </>
                  )}

                  {res.status === "CONFIRMED" && (
                    <Button
                      size="sm"
                      onClick={() => handleSeat(res.id)}
                      className="gap-1 text-xs"
                    >
                      <Utensils className="size-3.5" /> Mark Guest Seated
                    </Button>
                  )}

                  {res.status === "SEATED" && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="size-3.5" /> Dining in progress
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
