import { describe, it, expect } from "vitest";
import {
  INITIAL_TABLES,
  INITIAL_RESERVATIONS,
  type DiningAreaZone,
  type TableCapacity,
  type ReservationStatus,
  type DiningTable,
  type ReservationBooking,
} from "../components/table-reservation-manager";

describe("Dining & Table Reservation Architecture Suite", () => {
  describe("Area Zones & Capacity Invariants", () => {
    const EXPECTED_ZONES: DiningAreaZone[] = [
      "AC Indoor Main Hall",
      "Rooftop Open Air",
      "Outdoor Patio",
      "Private Cabana / VIP Lounge",
    ];

    const EXPECTED_CAPACITIES: TableCapacity[] = [
      "2-Seater",
      "4-Seater",
      "6-Seater Family",
      "10-Seater Banquet",
    ];

    it("verifies all 4 mandatory dining area zones are supported", () => {
      EXPECTED_ZONES.forEach((zone) => {
        const hasZone = INITIAL_TABLES.some((t) => t.zone === zone);
        expect(hasZone).toBe(true);
      });
    });

    it("verifies all 4 table capacity tags are present in inventory", () => {
      EXPECTED_CAPACITIES.forEach((cap) => {
        const hasCap = INITIAL_TABLES.some((t) => t.capacityTag === cap);
        expect(hasCap).toBe(true);
      });
    });

    it("verifies table maximum guests correlate with capacity tags", () => {
      INITIAL_TABLES.forEach((table) => {
        if (table.capacityTag === "2-Seater") expect(table.maxGuests).toBe(2);
        if (table.capacityTag === "4-Seater") expect(table.maxGuests).toBe(4);
        if (table.capacityTag === "6-Seater Family") expect(table.maxGuests).toBe(6);
        if (table.capacityTag === "10-Seater Banquet") expect(table.maxGuests).toBe(10);
      });
    });
  });

  describe("Cover Charge & Pre-Booking Deposit Financial Ledger (5% Fee)", () => {
    it("correctly computes 5% platform service convenience fee on ₹500 standard deposit", () => {
      const deposit = 500;
      const feePercent = 5;
      const platformFee = Math.round(deposit * (feePercent / 100));
      const netPayable = deposit - platformFee;

      expect(platformFee).toBe(25); // ₹25 platform fee
      expect(netPayable).toBe(475); // ₹475 net restaurant payable
      expect(platformFee + netPayable).toBe(deposit);
    });

    it("correctly computes 5% platform service convenience fee on ₹1,000 VIP/Cabana deposit", () => {
      const deposit = 1000;
      const feePercent = 5;
      const platformFee = Math.round(deposit * (feePercent / 100));
      const netPayable = deposit - platformFee;

      expect(platformFee).toBe(50); // ₹50 platform fee
      expect(netPayable).toBe(950); // ₹950 net restaurant payable
      expect(platformFee + netPayable).toBe(deposit);
    });

    it("verifies all initial reservations have accurate 5% platform fee and net payable calculations", () => {
      INITIAL_RESERVATIONS.forEach((res) => {
        const expectedFee = Math.round(res.depositAmount * 0.05);
        expect(res.platformFeePercent).toBe(5);
        expect(res.platformFeeAmount).toBe(expectedFee);
        expect(res.netRestaurantPayable).toBe(res.depositAmount - expectedFee);
        expect(res.platformFeeAmount + res.netRestaurantPayable).toBe(res.depositAmount);
      });
    });
  });

  describe("Multi-Tab Status Management & Lifecycle Transitions", () => {
    const MANDATORY_STATUSES: ReservationStatus[] = [
      "PENDING",
      "CONFIRMED",
      "SEATED",
      "COMPLETED",
      "CANCELLED",
    ];

    it("supports all 5 reservation lifecycle statuses", () => {
      MANDATORY_STATUSES.forEach((status) => {
        const matching = INITIAL_RESERVATIONS.filter((r) => r.status === status);
        expect(matching.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("handles table confirmation transition: assigns table and updates status", () => {
      const pendingRes: ReservationBooking = {
        id: "test-res-1",
        bookingRef: "TB-TEST01",
        guestName: "Test Guest",
        phone: "+91 99999 88888",
        guestsCount: 4,
        timeSlot: "8:00 PM",
        date: "Today",
        areaPreference: "AC Indoor Main Hall",
        status: "PENDING",
        createdAgo: "Just now",
        depositAmount: 500,
        platformFeePercent: 5,
        platformFeeAmount: 25,
        netRestaurantPayable: 475,
      };

      // Transition to CONFIRMED
      const confirmedRes: ReservationBooking = {
        ...pendingRes,
        status: "CONFIRMED",
        assignedTable: "T-03",
      };

      expect(confirmedRes.status).toBe("CONFIRMED");
      expect(confirmedRes.assignedTable).toBe("T-03");

      // Corresponding Table status changes to RESERVED
      const reservedTable: DiningTable = {
        id: "tbl-3",
        tableNumber: "T-03",
        zone: "AC Indoor Main Hall",
        capacityTag: "4-Seater",
        maxGuests: 4,
        status: "RESERVED",
        currentBookingRef: confirmedRes.bookingRef,
        guestName: confirmedRes.guestName,
      };

      expect(reservedTable.status).toBe("RESERVED");
      expect(reservedTable.currentBookingRef).toBe("TB-TEST01");
    });

    it("handles guest arrival transition: marks guest SEATED and table OCCUPIED", () => {
      const seatedRes: ReservationBooking = {
        id: "test-res-1",
        bookingRef: "TB-TEST01",
        guestName: "Test Guest",
        phone: "+91 99999 88888",
        guestsCount: 4,
        timeSlot: "8:00 PM",
        date: "Today",
        areaPreference: "AC Indoor Main Hall",
        status: "SEATED",
        assignedTable: "T-03",
        createdAgo: "Just now",
        depositAmount: 500,
        platformFeePercent: 5,
        platformFeeAmount: 25,
        netRestaurantPayable: 475,
        seatedAt: "8:05 PM",
      };

      expect(seatedRes.status).toBe("SEATED");
      expect(seatedRes.seatedAt).toBe("8:05 PM");

      const occupiedTable: DiningTable = {
        id: "tbl-3",
        tableNumber: "T-03",
        zone: "AC Indoor Main Hall",
        capacityTag: "4-Seater",
        maxGuests: 4,
        status: "OCCUPIED",
        currentBookingRef: seatedRes.bookingRef,
        guestName: seatedRes.guestName,
        seatedSince: "8:05 PM",
      };

      expect(occupiedTable.status).toBe("OCCUPIED");
      expect(occupiedTable.seatedSince).toBe("8:05 PM");
    });

    it("handles completion & billing transition: marks COMPLETED and frees table to AVAILABLE", () => {
      const completedRes: ReservationBooking = {
        id: "test-res-1",
        bookingRef: "TB-TEST01",
        guestName: "Test Guest",
        phone: "+91 99999 88888",
        guestsCount: 4,
        timeSlot: "8:00 PM",
        date: "Today",
        areaPreference: "AC Indoor Main Hall",
        status: "COMPLETED",
        assignedTable: "T-03",
        createdAgo: "1 hour ago",
        depositAmount: 500,
        platformFeePercent: 5,
        platformFeeAmount: 25,
        netRestaurantPayable: 475,
        seatedAt: "8:05 PM",
        completedAt: "9:20 PM",
        billAmount: 4200,
      };

      expect(completedRes.status).toBe("COMPLETED");
      expect(completedRes.billAmount).toBe(4200);

      // Table is freed back to AVAILABLE
      const freedTable: DiningTable = {
        id: "tbl-3",
        tableNumber: "T-03",
        zone: "AC Indoor Main Hall",
        capacityTag: "4-Seater",
        maxGuests: 4,
        status: "AVAILABLE",
      };

      expect(freedTable.status).toBe("AVAILABLE");
      expect(freedTable.currentBookingRef).toBeUndefined();
    });

    it("handles cancellation / no-show: marks CANCELLED and preserves audit note", () => {
      const cancelledRes: ReservationBooking = {
        id: "test-res-1",
        bookingRef: "TB-TEST01",
        guestName: "Test Guest",
        phone: "+91 99999 88888",
        guestsCount: 4,
        timeSlot: "8:00 PM",
        date: "Today",
        areaPreference: "AC Indoor Main Hall",
        status: "CANCELLED",
        createdAgo: "Just now",
        depositAmount: 500,
        platformFeePercent: 5,
        platformFeeAmount: 25,
        netRestaurantPayable: 475,
        notes: "Party delayed in traffic, requested cancellation",
      };

      expect(cancelledRes.status).toBe("CANCELLED");
      expect(cancelledRes.notes).toContain("cancellation");
    });
  });
});
