import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  generateSovereignPnr,
  generateTransactionId,
  calculateFareBreakdown,
  validatePassenger,
  validatePassengers,
  validateContact,
  searchFlightQuotes,
  searchTrainQuotes,
  searchBusQuotes,
  searchCabQuotes,
  issueSovereignETicket,
  getStoredETickets,
  saveETicketToStorage,
  SOVEREIGN_ETICKETS_STORAGE_KEY,
  type Passenger,
  type BookingContact,
  type FlightQuote,
  type TrainQuote,
  type BusQuote,
  type CabQuote,
} from "../lib/travel/in-app-booking-service";

describe("In-App Travel Booking Service - Zero-Redirect Native Architecture", () => {
  describe("Mathematical Zero Convenience Fee & Rebate Calculations", () => {
    it("guarantees strictly 0 paise OrderKing desk fee on single and multi-passenger bookings", () => {
      const singlePaxFare = calculateFareBreakdown(419900, 65000, 1, 39900, 200, 7500);
      expect(singlePaxFare.orderKingDeskFeePaise).toBe(0);
      expect(singlePaxFare.totalCheckoutPaise).toBe(419900 + 65000);
      expect(singlePaxFare.instantSavingsPaise).toBe(39900);

      const multiPaxFare = calculateFareBreakdown(419900, 65000, 4, 39900, 200, 7500);
      expect(multiPaxFare.passengerCount).toBe(4);
      expect(multiPaxFare.orderKingDeskFeePaise).toBe(0);
      expect(multiPaxFare.baseFarePaiseTotal).toBe(419900 * 4);
      expect(multiPaxFare.taxesPaiseTotal).toBe(65000 * 4);
      expect(multiPaxFare.totalCheckoutPaise).toBe((419900 + 65000) * 4);
      expect(multiPaxFare.instantSavingsPaise).toBe(39900 * 4);
    });

    it("calculates partner rebates with integer precision for 24K gold and food wallet cashback", () => {
      const baseFare = 500000; // ₹5,000.00
      const bps = 250; // 2.5%
      const goldRate = 7500; // ₹7,500 / gram
      const fare = calculateFareBreakdown(baseFare, 50000, 1, 40000, bps, goldRate);

      // Rebate = floor((500,000 * 250) / 10,000) = floor(12,500) = 12500 paise (₹125.00)
      expect(fare.partnerRebatePaiseTotal).toBe(12500);
      expect(fare.rebateFoodWalletPaise).toBe(12500);

      // (12500 / 100) / 7500 * 1000 = (125 / 7500) * 1000 = 16.666... => round to 17 mg
      expect(fare.rebateGoldMilligrams).toBe(17);

      // Effective net cost = Total checkout - rebate
      expect(fare.effectiveNetCostPaise).toBe(fare.totalCheckoutPaise - fare.partnerRebatePaiseTotal);
    });
  });

  describe("Passenger & Contact Validation Rules", () => {
    it("validates passenger full name, age constraints (1-120), and gender", () => {
      // Valid passenger
      const validPax: Passenger = {
        id: "pax-1",
        fullName: "Vikramaditya Sharma",
        age: 32,
        gender: "male",
        seatPreference: "Window",
      };
      const validRes = validatePassenger(validPax);
      expect(validRes.valid).toBe(true);
      expect(Object.keys(validRes.errors)).toHaveLength(0);

      // Invalid passenger: name too short and invalid characters
      const invalidName = validatePassenger({ fullName: "A", age: 25, gender: "female" });
      expect(invalidName.valid).toBe(false);
      expect(invalidName.errors.fullName).toBeDefined();

      // Invalid age boundaries
      const infantZero = validatePassenger({ fullName: "Baby Doe", age: 0, gender: "female" });
      expect(infantZero.valid).toBe(false);
      expect(infantZero.errors.age).toBeDefined();

      const excessiveAge = validatePassenger({ fullName: "Elder Doe", age: 121, gender: "male" });
      expect(excessiveAge.valid).toBe(false);
      expect(excessiveAge.errors.age).toBeDefined();

      // Invalid gender
      const invalidGender = validatePassenger({ fullName: "Alex Smith", age: 28, gender: "unknown" as any });
      expect(invalidGender.valid).toBe(false);
      expect(invalidGender.errors.gender).toBeDefined();
    });

    it("validates multi-passenger lists", () => {
      const roster: Partial<Passenger>[] = [
        { fullName: "Aryan Khan", age: 29, gender: "male" },
        { fullName: "", age: 150, gender: "other" },
      ];
      const multiRes = validatePassengers(roster);
      expect(multiRes.valid).toBe(false);
      expect(multiRes.errors.length).toBeGreaterThan(0);

      const emptyRes = validatePassengers([]);
      expect(emptyRes.valid).toBe(false);
      expect(emptyRes.errors).toContain("At least one passenger must be specified.");
    });

    it("validates 10-digit Indian phone numbers, emails, and optional GSTIN formats", () => {
      const validContact: BookingContact = {
        phone: "9876543210",
        email: "traveler@orderking.com",
        gstin: "07AAAAA0000A1Z5",
      };
      const res = validateContact(validContact);
      expect(res.valid).toBe(true);
      expect(Object.keys(res.errors)).toHaveLength(0);

      // Invalid phone (9 digits)
      const invalidPhone = validateContact({ phone: "987654321", email: "test@example.com" });
      expect(invalidPhone.valid).toBe(false);
      expect(invalidPhone.errors.phone).toBeDefined();

      // Invalid email
      const invalidEmail = validateContact({ phone: "9876543210", email: "invalid-email" });
      expect(invalidEmail.valid).toBe(false);
      expect(invalidEmail.errors.email).toBeDefined();

      // Invalid GSTIN format
      const invalidGstin = validateContact({
        phone: "9876543210",
        email: "test@example.com",
        gstin: "INVALID-GST-NUMBER",
      });
      expect(invalidGstin.valid).toBe(false);
      expect(invalidGstin.errors.gstin).toBeDefined();
    });
  });

  describe("Live Carrier Quote Engine & Carrier Data Integrity", () => {
    it("retrieves live flight quotes across top Indian airlines with zero desk fees", () => {
      const quotes = searchFlightQuotes("New Delhi (DEL)", "Mumbai (BOM)");
      expect(quotes.length).toBeGreaterThanOrEqual(4);

      const carriers = quotes.map((q) => q.carrierName);
      expect(carriers).toContain("IndiGo Airlines");
      expect(carriers).toContain("Air India");
      expect(carriers).toContain("Akasa Air");
      expect(carriers).toContain("SpiceJet");

      quotes.forEach((q) => {
        expect(q.orderKingDeskFeePaise).toBe(0);
        expect(q.baseFarePaise).toBeGreaterThan(0);
        expect(q.carrierTaxesPaise).toBeGreaterThan(0);
        expect(q.seatsAvailable).toBeGreaterThan(0);
        expect(q.terminal).toBeDefined();
        expect(q.baggageAllowance).toBeDefined();
      });
    });

    it("retrieves train quotes with Vande Bharat, Rajdhani, Shatabdi, and Superfast express", () => {
      const quotes = searchTrainQuotes("New Delhi (NDLS)", "Mumbai Central (MMCT)", undefined, "GENERAL (GN)", "3A");
      expect(quotes.length).toBeGreaterThanOrEqual(4);

      const services = quotes.map((q) => q.serviceNumber);
      expect(services.some((s) => s.includes("VANDE BHARAT"))).toBe(true);
      expect(services.some((s) => s.includes("RAJDHANI"))).toBe(true);
      expect(services.some((s) => s.includes("SHATABDI"))).toBe(true);
      expect(services.some((s) => s.includes("KARNATAKA EXPRESS"))).toBe(true);

      quotes.forEach((q) => {
        expect(q.orderKingDeskFeePaise).toBe(0);
        expect(q.platform).toBeDefined();
        expect(q.availabilityStatus).toBeDefined();
      });
    });

    it("retrieves bus quotes with multi-axle luxury sleepers and interactive berth layouts", () => {
      const quotes = searchBusQuotes("Bengaluru (Kempegowda)", "Goa (Panaji)");
      expect(quotes.length).toBeGreaterThanOrEqual(4);

      quotes.forEach((q) => {
        expect(q.orderKingDeskFeePaise).toBe(0);
        expect(q.seats.length).toBe(24); // 12 lower + 12 upper berths
        expect(q.seats.some((s) => s.deck === "lower")).toBe(true);
        expect(q.seats.some((s) => s.deck === "upper")).toBe(true);
        expect(q.seats.some((s) => s.isWindow)).toBe(true);
      });
    });

    it("retrieves cab quotes with verified chauffeur details, vehicle models, and live ETA", () => {
      const quotes = searchCabQuotes("Terminal 3, IGI Airport (DEL)", "Connaught Place, New Delhi", "Airport Transfer");
      expect(quotes.length).toBeGreaterThanOrEqual(4);

      quotes.forEach((q) => {
        expect(q.orderKingDeskFeePaise).toBe(0);
        expect(q.driverName).toBeDefined();
        expect(q.driverRating).toBeGreaterThanOrEqual(4.5);
        expect(q.vehiclePlate).toBeDefined();
        expect(q.etaMinutes).toBeGreaterThan(0);
      });
    });
  });

  describe("Sovereign PNR & Sovereign Digital E-Ticket Generation", () => {
    it("generates mode-specific Sovereign PNR codes adhering to OrderKing format", () => {
      expect(generateSovereignPnr("flight")).toMatch(/^OK-FL-[A-Z0-9]{6}\d{4}$/);
      expect(generateSovereignPnr("train")).toMatch(/^OK-TR-[A-Z0-9]{6}\d{4}$/);
      expect(generateSovereignPnr("bus")).toMatch(/^OK-BS-[A-Z0-9]{6}\d{4}$/);
      expect(generateSovereignPnr("cab")).toMatch(/^OK-CB-[A-Z0-9]{6}\d{4}$/);
    });

    it("generates unique transaction IDs for KingPay Wallet and Razorpay gateways", () => {
      const walletTxn = generateTransactionId("kingpay_wallet");
      expect(walletTxn).toMatch(/^KP-WAL-\d{9}$/);

      const rzpTxn = generateTransactionId("razorpay_upi");
      expect(rzpTxn).toMatch(/^RZP-PAY-\d{9}$/);
    });

    it("refuses unverified travel ticket issuance", () => {
      const quote=searchFlightQuotes()[0];
      expect(()=>issueSovereignETicket({quote,passengers:[{id:"p1",fullName:"Test Passenger",age:30,gender:"male",seatPreference:"Window"}],contact:{phone:"9876543210",email:"test@example.com"},paymentMethod:"kingpay_wallet",rebateDestination:"food_wallet"})).toThrow(/supplier reservation|verified payment/i);
    });

    it("does not mint a fake cab PNR or driver dispatch", () => {
      const quote=searchCabQuotes()[0];
      expect(()=>issueSovereignETicket({quote,passengers:[{id:"p1",fullName:"Test Passenger",age:30,gender:"female",seatPreference:"Window"}],contact:{phone:"9876543210",email:"test@example.com"},paymentMethod:"razorpay_upi",rebateDestination:"food_wallet"})).toThrow(/supplier reservation|verified payment/i);
    });
  });

  describe("Storage Persistence & Offline Resilience", () => {
    beforeEach(() => {
      if (typeof window !== "undefined") {
        window.localStorage.clear();
      }
    });

    it("handles storage gracefully in node environments without throwing errors", () => {
      // In node environment without window, getStoredETickets should safely return empty array
      const tickets = getStoredETickets();
      expect(Array.isArray(tickets)).toBe(true);
    });

    it("does not persist any fake ticket without supplier confirmation", () => {
      const mockStorage:Record<string,string>={};
      vi.stubGlobal("window",{localStorage:{getItem:(key:string)=>mockStorage[key]||null,setItem:(key:string,val:string)=>{mockStorage[key]=val;},clear:()=>{}}});
      const quote=searchFlightQuotes()[0];
      expect(()=>issueSovereignETicket({quote,passengers:[{id:"p1",fullName:"Test",age:30,gender:"male",seatPreference:"Window"}],contact:{phone:"9876543210",email:"test@example.com"},paymentMethod:"kingpay_wallet",rebateDestination:"food_wallet"})).toThrow();
      expect(getStoredETickets()).toHaveLength(0);
      vi.unstubAllGlobals();
    });
  });
});
