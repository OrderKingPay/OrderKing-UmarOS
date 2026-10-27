import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  TBO_APPLICATION_ID,
  TBO_TRADE_NAME,
  TBO_GSTIN,
  TBO_GST_ADDRESS,
  TBO_GST_CONTACT,
  TBO_GST_EMAIL,
  TBO_DEFAULT_ENDPOINT,
  getTboCredentials,
  serializeTboAuthRequest,
  mapTboCabinClass,
  serializeTboFlightSearchRequest,
  serializeTboFareQuoteRequest,
  serializeTboFareRuleRequest,
  serializeTboSSRRequest,
  serializeTboPassengers,
  serializeTboBookRequest,
  serializeTboTicketRequest,
  serializeTboGetBookingDetailsRequest,
  calculateTboFounderMargin,
  authenticateTbo,
  searchTboFlights,
  fareQuoteTbo,
  fareRuleTbo,
  ssrTbo,
  ticketTboFlight,
  bookTboFlight,
  getTboBookingDetails,
  type TboFlightSearchQuery,
  type TboPassenger,
  type TboTicketRequestParams,
} from "../lib/travel/tbo-client";

describe("TBO B2B Wholesale Client (#187051) & Production Serializers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.TBO_CLIENT_ID;
    delete process.env.TBO_AGENCY_CODE;
    delete process.env.TBO_USERNAME;
    delete process.env.TBO_USER_NAME;
    delete process.env.TBO_PASSWORD;
    delete process.env.TBO_ENDPOINT;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("1. Environment Credentials Resolution & Fail-Closed KYC Gates", () => {
    it("fails closed returning null when TBO username or password is not provided", () => {
      const creds = getTboCredentials();
      expect(creds).toBeNull();
    });

    it("resolves credentials and defaults agencyCode to official Application #187051 when omitted", () => {
      process.env.TBO_USERNAME = "orderking_founder";
      process.env.TBO_PASSWORD = "SecretTboPassword123!";

      const creds = getTboCredentials();
      expect(creds).not.toBeNull();
      expect(creds?.agencyCode).toBe(TBO_APPLICATION_ID); // "187051"
      expect(creds?.userName).toBe("orderking_founder");
      expect(creds?.password).toBe("SecretTboPassword123!");
      expect(creds?.endpoint).toBe(TBO_DEFAULT_ENDPOINT);
    });

    it("accepts explicit TBO_CLIENT_ID and custom endpoint", () => {
      process.env.TBO_CLIENT_ID = "187051";
      process.env.TBO_USERNAME = "umar_admin";
      process.env.TBO_PASSWORD = "StrongPassword789$";
      process.env.TBO_ENDPOINT = "http://api.tektravels.com";

      const creds = getTboCredentials();
      expect(creds?.agencyCode).toBe("187051");
      expect(creds?.userName).toBe("umar_admin");
      expect(creds?.endpoint).toBe("http://api.tektravels.com");
    });

    it("returns status 'pending_credentials' with Application #187051 KYC message when keys are unset", async () => {
      const auth = await authenticateTbo();
      expect(auth.authenticated).toBe(false);
      expect(auth.status).toBe("pending_credentials");
      expect(auth.message).toContain("Application #187051 is currently under KYC review");
    });
  });

  describe("2. AirService Search JSON Serializer", () => {
    it("maps cabin classes accurately to TBO numeric values", () => {
      expect(mapTboCabinClass("Economy")).toBe(1);
      expect(mapTboCabinClass("PremiumEconomy")).toBe(3);
      expect(mapTboCabinClass("Business")).toBe(4);
    });

    it("serializes single-adult one-way domestic flight search to exact TBO schema", () => {
      const query: TboFlightSearchQuery = {
        adultCount: 1,
        journeyType: "OneWay",
        cabinClass: "Economy",
        origin: "del",
        destination: "bom",
        preferredDepartureTime: "2026-11-01T06:00:00",
        directFlight: true,
        oneStopFlight: false,
        preferredAirlines: ["6E", "AI"],
      };

      const payload = serializeTboFlightSearchRequest(query, "TBO-TOKEN-XYZ", "192.168.1.100");

      expect(payload).toEqual({
        EndUserIp: "192.168.1.100",
        TokenId: "TBO-TOKEN-XYZ",
        AdultCount: 1,
        ChildCount: 0,
        InfantCount: 0,
        DirectFlight: true,
        OneStopFlight: false,
        JourneyType: 1,
        PreferredAirlines: ["6E", "AI"],
        Segments: [
          {
            Origin: "DEL",
            Destination: "BOM",
            FlightCabinClass: 1,
            PreferredDepartureTime: "2026-11-01T06:00:00",
          },
        ],
        Sources: null,
      });
    });

    it("serializes multi-passenger family search with children and infants", () => {
      const query: TboFlightSearchQuery = {
        adultCount: 2,
        childCount: 1,
        infantCount: 1,
        journeyType: "Return",
        cabinClass: "Business",
        origin: "BLR",
        destination: "DEL",
        preferredDepartureTime: "2026-11-10T14:30:00",
      };

      const payload = serializeTboFlightSearchRequest(query, "TBO-TOKEN-FAM");

      expect(payload.AdultCount).toBe(2);
      expect(payload.ChildCount).toBe(1);
      expect(payload.InfantCount).toBe(1);
      expect(payload.JourneyType).toBe(2); // Return
      expect(payload.Segments[0].FlightCabinClass).toBe(4); // Business
      expect(payload.PreferredAirlines).toBeNull();
    });
  });

  describe("3. FareQuote, FareRule, and SSR Request Serializers", () => {
    it("serializes FareQuote request accurately to verify re-priced fare", () => {
      const quotePayload = serializeTboFareQuoteRequest(
        { traceId: "TRACE-AIR-9921", resultIndex: "OB12" },
        "AUTH-TOKEN-111"
      );

      expect(quotePayload).toEqual({
        EndUserIp: "127.0.0.1",
        TokenId: "AUTH-TOKEN-111",
        TraceId: "TRACE-AIR-9921",
        ResultIndex: "OB12",
      });
    });

    it("serializes FareRule and SSR requests accurately", () => {
      const rulePayload = serializeTboFareRuleRequest(
        { traceId: "TRACE-AIR-9921", resultIndex: "OB12" },
        "AUTH-TOKEN-111"
      );
      expect(rulePayload.TraceId).toBe("TRACE-AIR-9921");
      expect(rulePayload.ResultIndex).toBe("OB12");

      const ssrPayload = serializeTboSSRRequest(
        { traceId: "TRACE-AIR-9921", resultIndex: "OB12" },
        "AUTH-TOKEN-111"
      );
      expect(ssrPayload.TraceId).toBe("TRACE-AIR-9921");
    });
  });

  describe("4. Passenger Manifest & Instant Live Ticket Request Serializers", () => {
    it("serializes passenger manifest with statutory Orderkingpay GSTIN 18AFXPH9838M1Z9", () => {
      const passengers: TboPassenger[] = [
        {
          title: "Mr",
          firstName: "Vikram",
          lastName: "Sharma",
          paxType: 1,
          dateOfBirth: "1992-06-15T00:00:00",
          gender: 1,
          contactNo: "9395065587",
          email: "vikram@example.com",
          isLeadPax: true,
          city: "Guwahati",
        },
        {
          title: "Mrs",
          firstName: "Pooja",
          lastName: "Sharma",
          paxType: 1,
          gender: 2,
          contactNo: "9395065587",
          email: "pooja@example.com",
          isLeadPax: false,
        },
      ];

      const serialized = serializeTboPassengers(passengers);

      expect(serialized).toHaveLength(2);
      expect(serialized[0].Title).toBe("Mr");
      expect(serialized[0].FirstName).toBe("Vikram");
      expect(serialized[0].IsLeadPax).toBe(true);
      expect(serialized[0].GSTNumber).toBe(TBO_GSTIN); // "18AFXPH9838M1Z9"
      expect(serialized[0].GSTCompanyName).toBe(TBO_TRADE_NAME); // "Orderkingpay"
      expect(serialized[0].GSTCompanyAddress).toBe(TBO_GST_ADDRESS);

      expect(serialized[1].Title).toBe("Mrs");
      expect(serialized[1].IsLeadPax).toBe(false);
      expect(serialized[1].GSTNumber).toBe(TBO_GSTIN);
    });

    it("serializes live Ticket request for instant LCC issuance", () => {
      const ticketParams: TboTicketRequestParams = {
        traceId: "TRACE-TICKET-5555",
        resultIndex: "OB1",
        passengers: [
          {
            title: "Mr",
            firstName: "Aarav",
            lastName: "Singhania",
            paxType: 1,
            gender: 1,
            contactNo: "9876543210",
            email: "aarav@orderking.com",
            isLeadPax: true,
          },
        ],
      };

      const ticketPayload = serializeTboTicketRequest(ticketParams, "VALID-TOKEN-888");

      expect(ticketPayload.TokenId).toBe("VALID-TOKEN-888");
      expect(ticketPayload.TraceId).toBe("TRACE-TICKET-5555");
      expect(ticketPayload.ResultIndex).toBe("OB1");
      expect(ticketPayload.Passengers[0].FirstName).toBe("Aarav");
      expect(ticketPayload.Passengers[0].GSTNumber).toBe("18AFXPH9838M1Z9");
    });

    it("serializes GetBookingDetails request for authoritative PNR status lookup", () => {
      const details = serializeTboGetBookingDetailsRequest("OKAIR1", 204981, "TOKEN-777");
      expect(details.PNR).toBe("OKAIR1");
      expect(details.BookingId).toBe(204981);
      expect(details.TokenId).toBe("TOKEN-777");
    });
  });

  describe("5. Exact Integer-Paise Founder Margin Calculations", () => {
    it("calculates exact integer-paise founder gross margin and net retained margin with 2% customer rebate", () => {
      // Scenario:
      // Published price (MRP/Retail): ₹5,000.00 (500,000 paise)
      // Wholesale cost (TBO B2B net): ₹4,600.00 (460,000 paise)
      // Base fare: ₹4,000.00 (400,000 paise)
      // Customer rebate (200 bps = 2% on base fare): floor(400,000 * 200 / 10,000) = 8,000 paise (₹80.00)
      // Founder Gross Margin: 500,000 - 460,000 = 40,000 paise (₹400.00)
      // Founder Net Retained Margin: 40,000 - 8,000 = 32,000 paise (₹320.00)
      const margin = calculateTboFounderMargin({
        publishedPriceInrOrPaise: 5000,
        offeredPriceInrOrPaise: 4600,
        baseFareInrOrPaise: 4000,
        passengerCount: 1,
        customerRebateBps: 200,
        goldRatePerGramRupees: 7500,
      });

      expect(margin.passengerCount).toBe(1);
      expect(margin.publishedPricePaiseTotal).toBe(500000);
      expect(margin.wholesaleCostPaiseTotal).toBe(460000);
      expect(margin.founderGrossMarginPaise).toBe(40000); // ₹400.00 gross margin
      expect(margin.customerRebatePaiseTotal).toBe(8000);  // ₹80.00 rebate to customer food wallet
      expect(margin.founderNetRetainedMarginPaise).toBe(32000); // ₹320.00 clean founder net profit
      expect(margin.isProfitable).toBe(true);

      // Gold: (8000 / 100) / 7500 * 1000 = (80 / 7500) * 1000 = 10.666... => round to 11 mg
      expect(margin.rebateGoldMilligrams).toBe(11);
    });

    it("scales margin calculations proportionally for multi-passenger bookings", () => {
      // 3 Passengers
      const margin = calculateTboFounderMargin({
        publishedPriceInrOrPaise: 5000,
        offeredPriceInrOrPaise: 4600,
        baseFareInrOrPaise: 4000,
        passengerCount: 3,
        customerRebateBps: 200,
      });

      expect(margin.passengerCount).toBe(3);
      expect(margin.publishedPricePaiseTotal).toBe(1500000); // ₹15,000.00
      expect(margin.wholesaleCostPaiseTotal).toBe(1380000); // ₹13,800.00
      expect(margin.founderGrossMarginPaise).toBe(120000);  // ₹1,200.00
      expect(margin.customerRebatePaiseTotal).toBe(24000);  // ₹240.00
      expect(margin.founderNetRetainedMarginPaise).toBe(96000); // ₹960.00
      expect(margin.isProfitable).toBe(true);
    });

    it("preserves integer arithmetic with fractional rupee input without float precision loss", () => {
      // Published: ₹4,199.50, Wholesale: ₹3,850.25, Base Fare: ₹3,600.00
      const margin = calculateTboFounderMargin({
        publishedPriceInrOrPaise: 4199.5,
        offeredPriceInrOrPaise: 3850.25,
        baseFareInrOrPaise: 3600,
        passengerCount: 1,
        customerRebateBps: 200,
      });

      expect(margin.publishedPricePaiseTotal).toBe(419950);
      expect(margin.wholesaleCostPaiseTotal).toBe(385025);
      expect(margin.founderGrossMarginPaise).toBe(419950 - 385025); // 34925 paise (₹349.25)
      expect(margin.customerRebatePaiseTotal).toBe(7200); // floor(360,000 * 0.02) = 7,200 paise (₹72.00)
      expect(margin.founderNetRetainedMarginPaise).toBe(34925 - 7200); // 27725 paise (₹277.25)
      expect(Number.isInteger(margin.founderNetRetainedMarginPaise)).toBe(true);
    });

    it("accepts direct integer paise values when isInputInPaise is true", () => {
      const margin = calculateTboFounderMargin({
        publishedPriceInrOrPaise: 650000, // 650,000 paise
        offeredPriceInrOrPaise: 610000,   // 610,000 paise
        baseFareInrOrPaise: 550000,       // 550,000 paise
        isInputInPaise: true,
        passengerCount: 2,
        customerRebateBps: 250, // 2.5%
      });

      expect(margin.publishedPricePaiseTotal).toBe(1300000);
      expect(margin.wholesaleCostPaiseTotal).toBe(1220000);
      expect(margin.founderGrossMarginPaise).toBe(80000);
      // customer rebate: floor(1,100,000 * 250 / 10,000) = 27,500 paise
      expect(margin.customerRebatePaiseTotal).toBe(27500);
      expect(margin.founderNetRetainedMarginPaise).toBe(80000 - 27500); // 52,500 paise
    });
  });

  describe("6. Gateway Handshake & Response Parsers", () => {
    it("authenticates and parses TBO token when valid credentials provided", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          Status: 1,
          TokenId: "TBO-MOCK-TOKEN-777",
          Member: { MemberId: "MEM-01", AgencyId: "187051" },
        }),
      });
      globalThis.fetch = mockFetch as any;

      process.env.TBO_USERNAME = "valid_user";
      process.env.TBO_PASSWORD = "valid_password";

      const res = await authenticateTbo();
      expect(res.authenticated).toBe(true);
      expect(res.token).toBe("TBO-MOCK-TOKEN-777");
      expect(res.agencyId).toBe("187051");
      expect(res.status).toBe("active");
    });

    it("handles FareQuote with IsPriceChanged flag gracefully", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          Response: {
            IsPriceChanged: true,
            Results: {
              ResultIndex: "OB1",
              Fare: { BaseFare: 4200, Tax: 650, PublishedPrice: 4850, OfferedPrice: 4500 },
            },
          },
        }),
      });
      globalThis.fetch = mockFetch as any;

      process.env.TBO_USERNAME = "valid_user";
      process.env.TBO_PASSWORD = "valid_password";

      const res = await fareQuoteTbo({ traceId: "TRACE-1", resultIndex: "OB1" }, "MOCK-TOKEN");
      expect(res.success).toBe(true);
      expect(res.isPriceChanged).toBe(true);
      expect(res.fareQuote?.Fare?.PublishedPrice).toBe(4850);
    });

    it("issues live ticket returning PNR and BookingId on successful carrier response", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          Response: {
            Response: {
              BookingId: 984512,
              PNR: "6E-CONF-1234",
              TicketStatus: 1,
            },
          },
        }),
      });
      globalThis.fetch = mockFetch as any;

      process.env.TBO_USERNAME = "valid_user";
      process.env.TBO_PASSWORD = "valid_password";

      const res = await ticketTboFlight(
        {
          traceId: "TRACE-1",
          resultIndex: "OB1",
          passengers: [
            {
              title: "Mr",
              firstName: "Rahul",
              lastName: "Verma",
              paxType: 1,
              gender: 1,
              contactNo: "9395065587",
              email: "rahul@example.com",
              isLeadPax: true,
            },
          ],
        },
        "MOCK-TOKEN"
      );

      expect(res.success).toBe(true);
      expect(res.pnr).toBe("6E-CONF-1234");
      expect(res.bookingId).toBe(984512);
      expect(res.ticketStatus).toBe("CONFIRMED");
    });
  });
});
