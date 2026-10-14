import { useState, useMemo } from "react";
import {
  Users,
  Calendar,
  Clock,
  Check,
  X,
  Phone,
  Utensils,
  AlertCircle,
  CalendarDays,
  DollarSign,
  CheckCircle2,
  SlidersHorizontal,
  UserPlus,
  Armchair,
  Receipt,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  XCircle,
  Plus,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SEATED"
  | "COMPLETED"
  | "CANCELLED";

export type DiningAreaZone =
  | "AC Indoor Main Hall"
  | "Rooftop Open Air"
  | "Outdoor Patio"
  | "Private Cabana / VIP Lounge";

export type LegacyAreaPreference =
  | "AC Indoor"
  | "Rooftop"
  | "Outdoor"
  | "Private Dining";

export type TableCapacity =
  | "2-Seater"
  | "4-Seater"
  | "6-Seater Family"
  | "10-Seater Banquet";

export type TableStatus = "AVAILABLE" | "RESERVED" | "OCCUPIED" | "BLOCKED";

export interface DiningTable {
  id: string;
  tableNumber: string;
  zone: DiningAreaZone;
  capacityTag: TableCapacity;
  maxGuests: number;
  status: TableStatus;
  currentBookingRef?: string;
  guestName?: string;
  seatedSince?: string;
}

export interface ReservationBooking {
  id: string;
  bookingRef: string;
  guestName: string;
  phone: string;
  guestsCount: number;
  timeSlot: string;
  date: string;
  areaPreference: DiningAreaZone | LegacyAreaPreference;
  occasion?: string;
  status: ReservationStatus;
  assignedTable?: string;
  createdAgo: string;
  depositAmount: number; // Cover charge deposit in INR
  platformFeePercent: number; // Platform fee percentage (5%)
  platformFeeAmount: number; // 5% fee in INR
  netRestaurantPayable: number; // Net payable to restaurant in INR
  seatedAt?: string;
  completedAt?: string;
  billAmount?: number;
  notes?: string;
  isWalkIn?: boolean;
}

export const INITIAL_TABLES: DiningTable[] = [
  // AC Indoor Main Hall
  { id: "tbl-1", tableNumber: "T-01", zone: "AC Indoor Main Hall", capacityTag: "2-Seater", maxGuests: 2, status: "AVAILABLE" },
  { id: "tbl-2", tableNumber: "T-02", zone: "AC Indoor Main Hall", capacityTag: "4-Seater", maxGuests: 4, status: "RESERVED", currentBookingRef: "TB-83419", guestName: "Rohan & Dev" },
  { id: "tbl-3", tableNumber: "T-03", zone: "AC Indoor Main Hall", capacityTag: "4-Seater", maxGuests: 4, status: "AVAILABLE" },
  { id: "tbl-4", tableNumber: "T-04", zone: "AC Indoor Main Hall", capacityTag: "6-Seater Family", maxGuests: 6, status: "OCCUPIED", currentBookingRef: "TB-78901", guestName: "Mehta Family", seatedSince: "7:10 PM" },
  { id: "tbl-5", tableNumber: "T-05", zone: "AC Indoor Main Hall", capacityTag: "10-Seater Banquet", maxGuests: 10, status: "AVAILABLE" },

  // Rooftop Open Air
  { id: "tbl-6", tableNumber: "R-01", zone: "Rooftop Open Air", capacityTag: "2-Seater", maxGuests: 2, status: "AVAILABLE" },
  { id: "tbl-7", tableNumber: "R-02", zone: "Rooftop Open Air", capacityTag: "4-Seater", maxGuests: 4, status: "AVAILABLE" },
  { id: "tbl-8", tableNumber: "R-03", zone: "Rooftop Open Air", capacityTag: "4-Seater", maxGuests: 4, status: "RESERVED", currentBookingRef: "TB-98241", guestName: "Ananya Roy" },
  { id: "tbl-9", tableNumber: "R-04", zone: "Rooftop Open Air", capacityTag: "6-Seater Family", maxGuests: 6, status: "AVAILABLE" },

  // Outdoor Patio
  { id: "tbl-10", tableNumber: "P-01", zone: "Outdoor Patio", capacityTag: "2-Seater", maxGuests: 2, status: "AVAILABLE" },
  { id: "tbl-11", tableNumber: "P-02", zone: "Outdoor Patio", capacityTag: "4-Seater", maxGuests: 4, status: "AVAILABLE" },
  { id: "tbl-12", tableNumber: "P-03", zone: "Outdoor Patio", capacityTag: "6-Seater Family", maxGuests: 6, status: "BLOCKED" },

  // Private Cabana / VIP Lounge
  { id: "tbl-13", tableNumber: "V-01", zone: "Private Cabana / VIP Lounge", capacityTag: "6-Seater Family", maxGuests: 6, status: "OCCUPIED", currentBookingRef: "TB-71104", guestName: "Sengupta Family", seatedSince: "7:35 PM" },
  { id: "tbl-14", tableNumber: "V-02", zone: "Private Cabana / VIP Lounge", capacityTag: "10-Seater Banquet", maxGuests: 10, status: "AVAILABLE" },
];

export const INITIAL_RESERVATIONS: ReservationBooking[] = [
  {
    id: "res-1",
    bookingRef: "TB-98241",
    guestName: "Ananya Roy",
    phone: "+91 98301 22345",
    guestsCount: 4,
    timeSlot: "8:00 PM",
    date: "Today",
    areaPreference: "Rooftop Open Air",
    occasion: "Birthday Celebration",
    status: "PENDING",
    createdAgo: "4 mins ago",
    depositAmount: 500,
    platformFeePercent: 5,
    platformFeeAmount: 25,
    netRestaurantPayable: 475,
  },
  {
    id: "res-2",
    bookingRef: "TB-83419",
    guestName: "Rohan & Dev",
    phone: "+91 91234 56789",
    guestsCount: 2,
    timeSlot: "8:30 PM",
    date: "Today",
    areaPreference: "AC Indoor Main Hall",
    occasion: "Candlelight Dinner",
    status: "CONFIRMED",
    assignedTable: "T-02",
    createdAgo: "18 mins ago",
    depositAmount: 500,
    platformFeePercent: 5,
    platformFeeAmount: 25,
    netRestaurantPayable: 475,
  },
  {
    id: "res-3",
    bookingRef: "TB-71104",
    guestName: "Sengupta Family",
    phone: "+91 98451 99120",
    guestsCount: 6,
    timeSlot: "7:30 PM",
    date: "Today",
    areaPreference: "Private Cabana / VIP Lounge",
    occasion: "Family Reunion",
    status: "SEATED",
    assignedTable: "V-01",
    createdAgo: "45 mins ago",
    seatedAt: "7:35 PM",
    depositAmount: 1000,
    platformFeePercent: 5,
    platformFeeAmount: 50,
    netRestaurantPayable: 950,
  },
  {
    id: "res-4",
    bookingRef: "TB-65280",
    guestName: "Vikram Malhotra & Team",
    phone: "+91 99001 12233",
    guestsCount: 8,
    timeSlot: "6:00 PM",
    date: "Today",
    areaPreference: "Private Cabana / VIP Lounge",
    occasion: "Corporate Deal Dinner",
    status: "COMPLETED",
    assignedTable: "V-02",
    createdAgo: "2 hours ago",
    seatedAt: "6:05 PM",
    completedAt: "7:45 PM",
    depositAmount: 1000,
    platformFeePercent: 5,
    platformFeeAmount: 50,
    netRestaurantPayable: 950,
    billAmount: 8450,
  },
  {
    id: "res-5",
    bookingRef: "TB-59012",
    guestName: "Pooja Hegde",
    phone: "+91 97112 33445",
    guestsCount: 2,
    timeSlot: "6:30 PM",
    date: "Today",
    areaPreference: "Outdoor Patio",
    occasion: "Casual Catchup",
    status: "CANCELLED",
    createdAgo: "3 hours ago",
    depositAmount: 500,
    platformFeePercent: 5,
    platformFeeAmount: 25,
    netRestaurantPayable: 475,
    notes: "Guest notified late arrival / cancelled table",
  },
];

export interface TableReservationHookState {
  reservations: ReservationBooking[];
  tables: DiningTable[];
  activeTab: ReservationStatus;
  setActiveTab: (tab: ReservationStatus) => void;
  selectedZoneFilter: DiningAreaZone | "ALL";
  setSelectedZoneFilter: (zone: DiningAreaZone | "ALL") => void;
  autoAcceptBookings: boolean;
  setAutoAcceptBookings: (val: boolean | ((prev: boolean) => boolean)) => void;
  handleConfirm: (id: string, tableNo?: string) => void;
  handleSeat: (id: string) => void;
  handleCompleteAndBill: (id: string, billAmount?: number) => void;
  handleCancelOrNoShow: (id: string, reason?: string) => void;
  handleAddWalkIn: (walkInData: {
    guestName: string;
    phone: string;
    guestsCount: number;
    zone: DiningAreaZone;
    tableNumber: string;
    depositAmount?: number;
    occasion?: string;
  }) => void;
  handleToggleTableStatus: (tableId: string) => void;
  // Metrics
  totalDeposits: number;
  totalPlatformFee: number;
  totalNetPayable: number;
  activeBookingsCount: number;
  seatedGuestsCount: number;
  availableTablesCount: number;
  occupiedTablesCount: number;
}

export function useTableReservations(): TableReservationHookState {
  const [reservations, setReservations] = useState<ReservationBooking[]>(INITIAL_RESERVATIONS);
  const [tables, setTables] = useState<DiningTable[]>(INITIAL_TABLES);
  const [activeTab, setActiveTab] = useState<ReservationStatus>("PENDING");
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<DiningAreaZone | "ALL">("ALL");
  const [autoAcceptBookings, setAutoAcceptBookings] = useState<boolean>(true);

  // Financial calculations
  const nonCancelled = useMemo(
    () => reservations.filter((r) => r.status !== "CANCELLED"),
    [reservations]
  );
  const totalDeposits = useMemo(
    () => nonCancelled.reduce((acc, r) => acc + r.depositAmount, 0),
    [nonCancelled]
  );
  const totalPlatformFee = useMemo(
    () => nonCancelled.reduce((acc, r) => acc + r.platformFeeAmount, 0),
    [nonCancelled]
  );
  const totalNetPayable = useMemo(
    () => nonCancelled.reduce((acc, r) => acc + r.netRestaurantPayable, 0),
    [nonCancelled]
  );

  const activeBookingsCount = useMemo(
    () => reservations.filter((r) => r.status === "PENDING" || r.status === "CONFIRMED" || r.status === "SEATED").length,
    [reservations]
  );

  const seatedGuestsCount = useMemo(
    () => reservations.filter((r) => r.status === "SEATED").reduce((acc, r) => acc + r.guestsCount, 0),
    [reservations]
  );

  const availableTablesCount = useMemo(
    () => tables.filter((t) => t.status === "AVAILABLE").length,
    [tables]
  );

  const occupiedTablesCount = useMemo(
    () => tables.filter((t) => t.status === "OCCUPIED").length,
    [tables]
  );

  const handleConfirm = (id: string, customTableNo?: string) => {
    const booking = reservations.find((r) => r.id === id);
    if (!booking) return;

    // Find available table in matching zone or fallback
    let tableToAssign = customTableNo;
    if (!tableToAssign) {
      const match = tables.find(
        (t) => t.status === "AVAILABLE" && (t.zone === booking.areaPreference || !booking.areaPreference) && t.maxGuests >= booking.guestsCount
      ) || tables.find((t) => t.status === "AVAILABLE");
      tableToAssign = match ? match.tableNumber : "T-01";
    }

    setReservations((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "CONFIRMED", assignedTable: tableToAssign } : r
      )
    );

    setTables((prev) =>
      prev.map((t) =>
        t.tableNumber === tableToAssign
          ? {
              ...t,
              status: "RESERVED",
              currentBookingRef: booking.bookingRef,
              guestName: booking.guestName,
            }
          : t
      )
    );
  };

  const handleSeat = (id: string) => {
    const booking = reservations.find((r) => r.id === id);
    if (!booking) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setReservations((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "SEATED", seatedAt: timeNow } : r
      )
    );

    if (booking.assignedTable) {
      setTables((prev) =>
        prev.map((t) =>
          t.tableNumber === booking.assignedTable
            ? {
                ...t,
                status: "OCCUPIED",
                seatedSince: timeNow,
                guestName: booking.guestName,
                currentBookingRef: booking.bookingRef,
              }
            : t
        )
      );
    }
  };

  const handleCompleteAndBill = (id: string, billAmount = 3500) => {
    const booking = reservations.find((r) => r.id === id);
    if (!booking) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setReservations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "COMPLETED",
              completedAt: timeNow,
              billAmount: billAmount,
            }
          : r
      )
    );

    if (booking.assignedTable) {
      setTables((prev) =>
        prev.map((t) =>
          t.tableNumber === booking.assignedTable
            ? {
                ...t,
                status: "AVAILABLE",
                currentBookingRef: undefined,
                guestName: undefined,
                seatedSince: undefined,
              }
            : t
        )
      );
    }
  };

  const handleCancelOrNoShow = (id: string, reason?: string) => {
    const booking = reservations.find((r) => r.id === id);
    if (!booking) return;

    setReservations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "CANCELLED",
              notes: reason || "Cancelled by restaurant / No-Show",
            }
          : r
      )
    );

    if (booking.assignedTable) {
      setTables((prev) =>
        prev.map((t) =>
          t.tableNumber === booking.assignedTable
            ? {
                ...t,
                status: "AVAILABLE",
                currentBookingRef: undefined,
                guestName: undefined,
                seatedSince: undefined,
              }
            : t
        )
      );
    }
  };

  const handleAddWalkIn = (walkInData: {
    guestName: string;
    phone: string;
    guestsCount: number;
    zone: DiningAreaZone;
    tableNumber: string;
    depositAmount?: number;
    occasion?: string;
  }) => {
    const ref = "WI-" + Math.floor(10000 + Math.random() * 90000);
    const deposit = walkInData.depositAmount ?? 500;
    const fee = Math.round(deposit * 0.05);
    const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newBooking: ReservationBooking = {
      id: "walkin-" + Date.now(),
      bookingRef: ref,
      guestName: walkInData.guestName,
      phone: walkInData.phone,
      guestsCount: walkInData.guestsCount,
      timeSlot: timeNow,
      date: "Today",
      areaPreference: walkInData.zone,
      occasion: walkInData.occasion || "Walk-In Dine",
      status: "SEATED",
      assignedTable: walkInData.tableNumber,
      createdAgo: "Just now",
      depositAmount: deposit,
      platformFeePercent: 5,
      platformFeeAmount: fee,
      netRestaurantPayable: deposit - fee,
      seatedAt: timeNow,
      isWalkIn: true,
    };

    setReservations((prev) => [newBooking, ...prev]);

    setTables((prev) =>
      prev.map((t) =>
        t.tableNumber === walkInData.tableNumber
          ? {
              ...t,
              status: "OCCUPIED",
              currentBookingRef: ref,
              guestName: walkInData.guestName,
              seatedSince: timeNow,
            }
          : t
      )
    );
  };

  const handleToggleTableStatus = (tableId: string) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        if (t.status === "BLOCKED") return { ...t, status: "AVAILABLE" };
        if (t.status === "AVAILABLE") return { ...t, status: "BLOCKED" };
        return t;
      })
    );
  };

  return {
    reservations,
    tables,
    activeTab,
    setActiveTab,
    selectedZoneFilter,
    setSelectedZoneFilter,
    autoAcceptBookings,
    setAutoAcceptBookings,
    handleConfirm,
    handleSeat,
    handleCompleteAndBill,
    handleCancelOrNoShow,
    handleAddWalkIn,
    handleToggleTableStatus,
    totalDeposits,
    totalPlatformFee,
    totalNetPayable,
    activeBookingsCount,
    seatedGuestsCount,
    availableTablesCount,
    occupiedTablesCount,
  };
}

export interface TableReservationManagerProps {
  hookState?: TableReservationHookState;
  onOpenWalkInModal?: () => void;
  onOpenFloorSettings?: () => void;
}

export function TableReservationManager({
  hookState: externalState,
  onOpenWalkInModal,
  onOpenFloorSettings,
}: TableReservationManagerProps = {}) {
  const localState = useTableReservations();
  const state = externalState ?? localState;

  const {
    reservations,
    tables,
    activeTab,
    setActiveTab,
    selectedZoneFilter,
    setSelectedZoneFilter,
    autoAcceptBookings,
    setAutoAcceptBookings,
    handleConfirm,
    handleSeat,
    handleCompleteAndBill,
    handleCancelOrNoShow,
    handleAddWalkIn,
    handleToggleTableStatus,
    totalDeposits,
    totalPlatformFee,
    totalNetPayable,
    availableTablesCount,
    occupiedTablesCount,
  } = state;

  const [tableInput, setTableInput] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<"BOOKINGS" | "FLOOR_PLAN" | "FINANCIAL_LEDGER">("BOOKINGS");
  const [walkInDialogOpen, setWalkInDialogOpen] = useState(false);
  const [floorSettingsOpen, setFloorSettingsOpen] = useState(false);

  // Walk-in form state
  const [wiName, setWiName] = useState("");
  const [wiPhone, setWiPhone] = useState("");
  const [wiGuests, setWiGuests] = useState(2);
  const [wiZone, setWiZone] = useState<DiningAreaZone>("AC Indoor Main Hall");
  const [wiTable, setWiTable] = useState("");
  const [wiDeposit, setWiDeposit] = useState(500);

  // Filtered reservations
  const filteredReservations = reservations.filter((r) => r.status === activeTab);

  // Available tables matching current zone or all
  const filteredTables = useMemo(() => {
    if (selectedZoneFilter === "ALL") return tables;
    return tables.filter((t) => t.zone === selectedZoneFilter);
  }, [tables, selectedZoneFilter]);

  const availableTablesForWalkIn = useMemo(() => {
    return tables.filter((t) => t.status === "AVAILABLE" && t.zone === wiZone);
  }, [tables, wiZone]);

  const submitWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wiName.trim() || !wiPhone.trim()) return;
    const assigned = wiTable || availableTablesForWalkIn[0]?.tableNumber || "T-01";
    handleAddWalkIn({
      guestName: wiName.trim(),
      phone: wiPhone.trim(),
      guestsCount: wiGuests,
      zone: wiZone,
      tableNumber: assigned,
      depositAmount: Number(wiDeposit) || 500,
    });
    setWiName("");
    setWiPhone("");
    setWiTable("");
    setWalkInDialogOpen(false);
  };

  const ZONES: DiningAreaZone[] = [
    "AC Indoor Main Hall",
    "Rooftop Open Air",
    "Outdoor Patio",
    "Private Cabana / VIP Lounge",
  ];

  return (
    <div className="space-y-6">
      {/* Top Main Navigation / View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSection("BOOKINGS")}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs",
              activeSection === "BOOKINGS"
                ? "bg-amber-500 text-slate-950 font-extrabold shadow-amber-500/20"
                : "bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
            )}
          >
            <CalendarDays className="size-4" />
            <span>Table Reservations</span>
            <span className="rounded-full bg-slate-950/20 px-1.5 py-0.5 text-[11px] font-black">
              {reservations.filter((r) => r.status === "PENDING" || r.status === "CONFIRMED").length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("FLOOR_PLAN")}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs",
              activeSection === "FLOOR_PLAN"
                ? "bg-emerald-500 text-slate-950 font-extrabold shadow-emerald-500/20"
                : "bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
            )}
          >
            <Armchair className="size-4" />
            <span>Floor Plan & Inventory</span>
            <span className="rounded-full bg-slate-950/20 px-1.5 py-0.5 text-[11px] font-black">
              {tables.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("FINANCIAL_LEDGER")}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs",
              activeSection === "FINANCIAL_LEDGER"
                ? "bg-indigo-500 text-slate-950 font-extrabold shadow-indigo-500/20"
                : "bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
            )}
          >
            <Receipt className="size-4" />
            <span>Cover Charge Ledger (5% Fee)</span>
            <span className="rounded-full bg-slate-950/20 px-1.5 py-0.5 text-[11px] font-black">
              ₹{totalDeposits.toLocaleString("en-IN")}
            </span>
          </button>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => (onOpenWalkInModal ? onOpenWalkInModal() : setWalkInDialogOpen(true))}
            className="text-xs bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50"
          >
            <UserPlus className="size-3.5 mr-1" />
            Add Walk-In Guest
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => (onOpenFloorSettings ? onOpenFloorSettings() : setFloorSettingsOpen(true))}
            className="text-xs border-slate-700 bg-slate-900/80 text-slate-300 hover:bg-slate-800"
          >
            <SlidersHorizontal className="size-3.5 mr-1" />
            Floor Settings
          </Button>
        </div>
      </div>

      {/* SECTION 1: RESERVATIONS TABBED MANAGER */}
      {activeSection === "BOOKINGS" && (
        <div className="space-y-4">
          {/* Status Filter Tabs (All 5 mandatory statuses) */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/70 pb-3">
            {(
              [
                { id: "PENDING", label: "Pending Approval", emoji: "⏳", color: "text-amber-400" },
                { id: "CONFIRMED", label: "Confirmed Tables", emoji: "✅", color: "text-emerald-400" },
                { id: "SEATED", label: "Currently Seated", emoji: "🍽️", color: "text-indigo-400" },
                { id: "COMPLETED", label: "Completed & Billed", emoji: "🧾", color: "text-blue-400" },
                { id: "CANCELLED", label: "Cancelled / No-Show", emoji: "❌", color: "text-rose-400" },
              ] as const
            ).map((tab) => {
              const count = reservations.filter((r) => r.status === tab.id).length;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition",
                    isActive
                      ? "bg-chili text-white shadow-md shadow-chili/30"
                      : "bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-100 border border-slate-800"
                  )}
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-black",
                      isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-300"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Reservations Cards List */}
          <div className="grid gap-3.5">
            {filteredReservations.length === 0 ? (
              <Card className="border-slate-800 bg-slate-900/40 p-12 text-center text-xs text-slate-400">
                <Armchair className="size-8 mx-auto mb-2 text-slate-600 opacity-60" />
                No reservations found under &apos;{activeTab}&apos;.
              </Card>
            ) : (
              filteredReservations.map((res) => (
                <Card
                  key={res.id}
                  className="border-slate-800 bg-slate-900/70 p-4 space-y-3.5 hover:border-slate-700 transition"
                >
                  {/* Top Bar: Guest Info & Zone Details */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-black text-sm">
                        {res.guestsCount}P
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-100">{res.guestName}</h3>
                          {res.isWalkIn && (
                            <span className="rounded-md bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.2 text-[9.5px] font-bold text-emerald-300">
                              WALK-IN
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-slate-400">
                            {res.bookingRef}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <Phone className="size-3 text-emerald-400" />
                          <span>{res.phone}</span>
                          <span className="text-slate-600">•</span>
                          <span>Requested {res.createdAgo}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-xl bg-slate-950/80 border border-slate-800 px-2.5 py-1 font-semibold text-slate-200 flex items-center gap-1.5">
                        <Clock className="size-3.5 text-amber-400" />
                        <span>{res.timeSlot} ({res.date})</span>
                      </span>

                      <span className="rounded-xl bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1 font-semibold text-indigo-300">
                        📍 {res.areaPreference}
                      </span>

                      {res.assignedTable && (
                        <span className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 font-bold text-emerald-300 flex items-center gap-1">
                          <Armchair className="size-3.5" />
                          Table {res.assignedTable}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Occasion / Notes & Pre-booking Financial Line */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {res.occasion && (
                        <span className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-400 flex items-center gap-1">
                          🎉 {res.occasion}
                        </span>
                      )}
                      {res.notes && (
                        <span className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300 italic">
                          &ldquo;{res.notes}&rdquo;
                        </span>
                      )}
                      {res.seatedAt && (
                        <span className="text-xs text-indigo-400 font-medium">
                          Seated at {res.seatedAt}
                        </span>
                      )}
                      {res.completedAt && (
                        <span className="text-xs text-blue-400 font-medium">
                          Billed & Vacated at {res.completedAt}
                        </span>
                      )}
                    </div>

                    {/* Pre-Booking Cover Charge Pill */}
                    <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-1 text-xs">
                      <span className="text-slate-400">Cover Deposit:</span>
                      <span className="font-bold text-emerald-400">₹{res.depositAmount}</span>
                      <span className="text-slate-500 text-[10px]">
                        (Platform 5%: ₹{res.platformFeeAmount} | Net: ₹{res.netRestaurantPayable})
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                    <div className="text-xs text-slate-400">
                      {res.status === "PENDING" && "Assign an available table and confirm booking"}
                      {res.status === "CONFIRMED" && "Table locked. Mark guest seated when party arrives"}
                      {res.status === "SEATED" && "Party currently dining. Complete & bill when finished"}
                      {res.status === "COMPLETED" && (
                        <span className="text-blue-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="size-3.5" /> Total Bill: ₹{res.billAmount ?? 3500} (₹{res.depositAmount} cover credit applied)
                        </span>
                      )}
                      {res.status === "CANCELLED" && (
                        <span className="text-rose-400 font-semibold flex items-center gap-1">
                          <XCircle className="size-3.5" /> Cancelled / Released
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* PENDING ACTIONS */}
                      {res.status === "PENDING" && (
                        <>
                          <select
                            value={tableInput[res.id] || ""}
                            onChange={(e) =>
                              setTableInput((prev) => ({ ...prev, [res.id]: e.target.value }))
                            }
                            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-400"
                          >
                            <option value="">Auto-Pick Available Table</option>
                            {tables
                              .filter((t) => t.status === "AVAILABLE")
                              .map((t) => (
                                <option key={t.id} value={t.tableNumber}>
                                  {t.tableNumber} ({t.capacityTag} - {t.zone})
                                </option>
                              ))}
                          </select>

                          <Button
                            size="sm"
                            onClick={() => handleConfirm(res.id, tableInput[res.id])}
                            className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                          >
                            <Check className="size-3.5" /> Confirm Table
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelOrNoShow(res.id, "Declined by restaurant")}
                            className="text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                          >
                            <X className="size-3.5" /> Cancel / No-Show
                          </Button>
                        </>
                      )}

                      {/* CONFIRMED ACTIONS */}
                      {res.status === "CONFIRMED" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSeat(res.id)}
                            className="gap-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-amber-500/20"
                          >
                            <Utensils className="size-3.5" /> Seat Guests
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelOrNoShow(res.id, "Customer No-Show")}
                            className="text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                          >
                            <X className="size-3.5" /> Cancel / No-Show
                          </Button>
                        </>
                      )}

                      {/* SEATED ACTIONS */}
                      {res.status === "SEATED" && (
                        <Button
                          size="sm"
                          onClick={() => handleCompleteAndBill(res.id)}
                          className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                        >
                          <Receipt className="size-3.5" /> Complete & Bill
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: TABLE INVENTORY & FLOOR PLAN SECTION */}
      {activeSection === "FLOOR_PLAN" && (
        <div className="space-y-4">
          {/* Floor Plan Header & Zone Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Armchair className="size-4 text-emerald-400" />
                Live Restaurant Floor Plan & Seating Grid
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Total {tables.length} Tables · {availableTablesCount} Available · {occupiedTablesCount} Occupied · {tables.filter((t) => t.status === "RESERVED").length} Reserved
              </p>
            </div>

            {/* Zone Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedZoneFilter("ALL")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                  selectedZoneFilter === "ALL"
                    ? "bg-slate-100 text-slate-950"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                )}
              >
                All Zones ({tables.length})
              </button>
              {ZONES.map((zone) => {
                const count = tables.filter((t) => t.zone === zone).length;
                return (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => setSelectedZoneFilter(zone)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                      selectedZoneFilter === zone
                        ? "bg-emerald-500 text-slate-950 font-bold"
                        : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
                    )}
                  >
                    {zone} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filteredTables.map((tbl) => {
              const isAvail = tbl.status === "AVAILABLE";
              const isRes = tbl.status === "RESERVED";
              const isOcc = tbl.status === "OCCUPIED";
              const isBlk = tbl.status === "BLOCKED";

              return (
                <Card
                  key={tbl.id}
                  className={cn(
                    "relative border p-4 space-y-3 transition duration-200",
                    isAvail && "border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-500/70",
                    isRes && "border-amber-500/40 bg-amber-950/20 hover:border-amber-500/70",
                    isOcc && "border-indigo-500/40 bg-indigo-950/20 hover:border-indigo-500/70",
                    isBlk && "border-slate-700/60 bg-slate-900/40 opacity-70"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-lg font-black text-slate-100">
                          {tbl.tableNumber}
                        </span>
                        <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                          {tbl.capacityTag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{tbl.zone}</p>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
                        isAvail && "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
                        isRes && "bg-amber-500/20 text-amber-300 border border-amber-500/40",
                        isOcc && "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40",
                        isBlk && "bg-slate-800 text-slate-400 border border-slate-700"
                      )}
                    >
                      {tbl.status}
                    </span>
                  </div>

                  {/* Occupant / Booking Info */}
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5 text-xs space-y-1">
                    {tbl.guestName ? (
                      <>
                        <div className="font-bold text-slate-200 truncate flex items-center justify-between">
                          <span>{tbl.guestName}</span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {tbl.currentBookingRef}
                          </span>
                        </div>
                        {tbl.seatedSince && (
                          <div className="text-[11px] text-indigo-400 flex items-center gap-1">
                            <Clock className="size-3" /> Seated since {tbl.seatedSince}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-slate-500 text-[11px] italic">
                        {isBlk ? "Table temporarily maintenance locked" : "Ready for immediate walk-in / booking"}
                      </div>
                    )}
                  </div>

                  {/* Table Control Quick Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-semibold text-slate-400">
                      Capacity: {tbl.maxGuests} Guests
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleTableStatus(tbl.id)}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-200 underline decoration-dotted"
                    >
                      {tbl.status === "BLOCKED" ? "Unblock" : tbl.status === "AVAILABLE" ? "Block" : "Locked"}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: COVER CHARGE & PRE-BOOKING DEPOSIT FINANCIAL LEDGER */}
      {activeSection === "FINANCIAL_LEDGER" && (
        <div className="space-y-5">
          {/* Financial KPI Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Card className="border-emerald-500/30 bg-emerald-950/20 p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                  Total Pre-Booking Deposits
                </span>
                <DollarSign className="size-4 text-emerald-400" />
              </div>
              <div className="font-display text-2xl font-black text-slate-100">
                ₹{totalDeposits.toLocaleString("en-IN")}
              </div>
              <p className="text-[11px] text-emerald-400/80">
                Guaranteed advance reservations revenue
              </p>
            </Card>

            <Card className="border-amber-500/30 bg-amber-950/20 p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                  Platform Convenience Fee (5%)
                </span>
                <Sparkles className="size-4 text-amber-400" />
              </div>
              <div className="font-display text-2xl font-black text-amber-400">
                ₹{totalPlatformFee.toLocaleString("en-IN")}
              </div>
              <p className="text-[11px] text-amber-400/80">
                Platform founder revenue stream (5% pre-booking fee)
              </p>
            </Card>

            <Card className="border-indigo-500/30 bg-indigo-950/20 p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">
                  Net Restaurant Payable
                </span>
                <Receipt className="size-4 text-indigo-400" />
              </div>
              <div className="font-display text-2xl font-black text-indigo-300">
                ₹{totalNetPayable.toLocaleString("en-IN")}
              </div>
              <p className="text-[11px] text-indigo-300/80">
                Credited directly to restaurant settlement ledger
              </p>
            </Card>
          </div>

          {/* Financial Ledger Table */}
          <Card className="border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Receipt className="size-4 text-emerald-400" />
                  Pre-Booking Cover Charges Settlement Statement
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Itemized ledger of table deposits collected, 5% platform fee deductions, and dine-in bill credits.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400">
                  <tr>
                    <th className="py-2.5 px-3">Booking Ref</th>
                    <th className="py-2.5 px-3">Guest Details</th>
                    <th className="py-2.5 px-3">Zone & Table</th>
                    <th className="py-2.5 px-3 text-right">Deposit Collected</th>
                    <th className="py-2.5 px-3 text-right">Platform Fee (5%)</th>
                    <th className="py-2.5 px-3 text-right">Net Payable</th>
                    <th className="py-2.5 px-3 text-center">Settlement Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {reservations.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-bold text-slate-200">
                        {r.bookingRef}
                        {r.isWalkIn && (
                          <span className="ml-1.5 text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded font-sans">
                            Walk-In
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <div className="font-bold text-slate-200">{r.guestName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{r.phone}</div>
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className="text-slate-200">{r.areaPreference}</span>
                        {r.assignedTable && (
                          <span className="ml-1 text-emerald-400 font-bold">({r.assignedTable})</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-100">
                        ₹{r.depositAmount}
                      </td>
                      <td className="py-3 px-3 text-right text-amber-400 font-bold">
                        -₹{r.platformFeeAmount}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-emerald-400">
                        ₹{r.netRestaurantPayable}
                      </td>
                      <td className="py-3 px-3 text-center font-sans">
                        {r.status === "COMPLETED" && (
                          <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                            Redeemed in Bill
                          </span>
                        )}
                        {r.status === "SEATED" && (
                          <span className="rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                            Holding at Table
                          </span>
                        )}
                        {r.status === "CONFIRMED" && (
                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                            Pre-Reserved
                          </span>
                        )}
                        {r.status === "PENDING" && (
                          <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                            Deposit In Escrow
                          </span>
                        )}
                        {r.status === "CANCELLED" && (
                          <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                            Cancelled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* WALK-IN GUEST MODAL */}
      {walkInDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <UserPlus className="size-4 text-emerald-400" />
                Add Walk-In Guest & Immediate Seating
              </h3>
              <button
                type="button"
                onClick={() => setWalkInDialogOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={submitWalkIn} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Guest Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={wiName}
                  onChange={(e) => setWiName(e.target.value)}
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
                    placeholder="+91 98765 43210"
                    value={wiPhone}
                    onChange={(e) => setWiPhone(e.target.value)}
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
                    value={wiGuests}
                    onChange={(e) => setWiGuests(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Dining Area Zone
                </label>
                <select
                  value={wiZone}
                  onChange={(e) => {
                    setWiZone(e.target.value as DiningAreaZone);
                    setWiTable("");
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-400 focus:outline-none"
                >
                  {ZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Select Available Table
                  </label>
                  <select
                    value={wiTable}
                    onChange={(e) => setWiTable(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="">Auto-Assign Best Table</option>
                    {availableTablesForWalkIn.map((t) => (
                      <option key={t.id} value={t.tableNumber}>
                        {t.tableNumber} ({t.capacityTag})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Cover Deposit (₹)
                  </label>
                  <select
                    value={wiDeposit}
                    onChange={(e) => setWiDeposit(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-400 focus:outline-none"
                  >
                    <option value={500}>₹500 (Standard Table)</option>
                    <option value={1000}>₹1,000 (VIP / Cabana)</option>
                    <option value={0}>₹0 (No Deposit Required)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setWalkInDialogOpen(false)}
                  className="text-xs text-slate-400"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  <Check className="size-3.5 mr-1" /> Seat Walk-In Guest
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLOOR PLAN SETTINGS MODAL */}
      {floorSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-amber-400" />
                Floor Plan & Reservation Settings
              </h3>
              <button
                type="button"
                onClick={() => setFloorSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div>
                  <div className="font-bold text-slate-100">Auto-Accept Bookings</div>
                  <div className="text-slate-400 text-[11px]">
                    Instantly confirm incoming reservations when tables are free
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoAcceptBookings}
                  onChange={(e) => setAutoAcceptBookings(e.target.checked)}
                  className="size-4 accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">
                  Target Table Turn Duration
                </label>
                <select className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none">
                  <option value="60">60 Minutes (Fast Casual)</option>
                  <option value="90" selected>90 Minutes (Standard Fine Dine)</option>
                  <option value="120">120 Minutes (Cabana / Leisure)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">
                  No-Show Auto-Release Window
                </label>
                <select className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none">
                  <option value="15" selected>15 Minutes past reservation time</option>
                  <option value="30">30 Minutes past reservation time</option>
                </select>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5" /> 5% Pre-Booking Platform Revenue
                </div>
                <p>
                  Every table reservation collects a pre-booking cover charge. 5% is retained as a platform service fee, and 95% is credited to your restaurant settlement to be redeemed against the guest&apos;s food bill.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-800">
              <Button
                size="sm"
                onClick={() => setFloorSettingsOpen(false)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
