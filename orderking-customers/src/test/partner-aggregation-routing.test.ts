import { describe, it, expect } from "vitest";
import {
  generateKiwiFlightLink,
  generateSkyscannerFlightLink,
  generateConfirmTktTrainLink,
  generateIrctcTrainLink,
  generateRedBusLink,
  generateBookingComHotelLink,
  generateAgodaHotelLink,
  generatePartnerLink,
  createSignedTrackingToken,
  verifySignedTrackingToken,
  isAllowedPartnerUrl,
  ALLOWED_PARTNER_HOSTS,
  type PartnerHandshakePayload,
} from "@/lib/travel/partner-aggregators";
import { Route as PartnerHandshakeRoute } from "@/routes/api/travel/partner-handshake";

describe("👑 B2B Partner Aggregation & Deep-Link Routing Suite", () => {
  // --------------------------------------------------------------------------
  // 1. FLIGHTS: KIWI.COM & SKYSCANNER
  // --------------------------------------------------------------------------
  describe("Flights Deep-Linking (Kiwi.com & Skyscanner)", () => {
    it("generates verified Kiwi.com affiliate deep link with live route params and currency=INR", () => {
      const result = generateKiwiFlightLink({
        origin: "DEL",
        destination: "BOM",
        departureDate: "2026-11-15",
        passengers: 2,
        currency: "INR",
        subId: "ok_campaign_festive",
        affiliateId: "orderking_kiwi_live",
      });

      expect(result.partner).toBe("kiwi");
      expect(result.travelMode).toBe("flight");
      expect(result.platformMarkupPaise).toBe(0); // Strict zero-markup mandate
      expect(result.expectedCommissionBps).toBe(300); // 3.0%

      const targetUrl = new URL(result.targetUrl);
      expect(targetUrl.origin).toBe("https://www.kiwi.com");
      expect(targetUrl.pathname).toBe("/deep");
      expect(targetUrl.searchParams.get("from")).toBe("DEL");
      expect(targetUrl.searchParams.get("to")).toBe("BOM");
      expect(targetUrl.searchParams.get("departure")).toBe("2026-11-15");
      expect(targetUrl.searchParams.get("passengers")).toBe("2");
      expect(targetUrl.searchParams.get("currency")).toBe("INR");
      expect(targetUrl.searchParams.get("affilid")).toBe("orderking_kiwi_live");
      expect(targetUrl.searchParams.get("sub_id")).toBe("ok_campaign_festive");

      // Verify handshake URL contains a valid signed token
      expect(result.handshakeUrl).toContain("/api/travel/partner-handshake?token=");
      const verification = verifySignedTrackingToken(result.signedToken);
      expect(verification.valid).toBe(true);
      expect(verification.payload?.targetUrl).toBe(result.targetUrl);
    });

    it("generates verified Skyscanner affiliate deep link with live route params and cabin class", () => {
      const result = generateSkyscannerFlightLink({
        origin: "New Delhi (DEL)",
        destination: "Bengaluru (BLR)",
        departureDate: "2026-12-01",
        returnDate: "2026-12-05",
        passengers: 3,
        cabinClass: "BUSINESS",
        currency: "INR",
        subId: "ok_sub_corp",
        affiliateId: "orderking_skyscanner",
      });

      expect(result.partner).toBe("skyscanner");
      expect(result.travelMode).toBe("flight");
      expect(result.platformMarkupPaise).toBe(0);

      const targetUrl = new URL(result.targetUrl);
      expect(targetUrl.hostname).toBe("www.skyscanner.co.in");
      // Format 2026-12-01 -> 261201, 2026-12-05 -> 261205
      expect(targetUrl.pathname).toContain("/transport/flights/del/blr/261201/261205/");
      expect(targetUrl.searchParams.get("adultsv2")).toBe("3");
      expect(targetUrl.searchParams.get("cabinclass")).toBe("business");
      expect(targetUrl.searchParams.get("currency")).toBe("INR");
      expect(targetUrl.searchParams.get("rtn")).toBe("1");
      expect(targetUrl.searchParams.get("associateid")).toBe("orderking_skyscanner");
      expect(targetUrl.searchParams.get("utm_source")).toBe("ok_sub_corp");
    });
  });

  // --------------------------------------------------------------------------
  // 2. TRAINS: CONFIRMTKT & IRCTC
  // --------------------------------------------------------------------------
  describe("Trains Deep-Linking (ConfirmTkt & IRCTC)", () => {
    it("generates ConfirmTkt 10-digit PNR prefill deep link", () => {
      const result = generateConfirmTktTrainLink({
        pnr: "2847291048",
        subId: "ok_pnr_tracker",
      });

      expect(result.partner).toBe("confirmtkt");
      expect(result.travelMode).toBe("train");
      expect(result.targetUrl).toContain("https://www.confirmtkt.com/pnr-status/2847291048");
      expect(result.targetUrl).toContain("partner=orderking");
      expect(result.targetUrl).toContain("subId=ok_pnr_tracker");
    });

    it("rejects malformed PNR strings for ConfirmTkt", () => {
      expect(() => {
        generateConfirmTktTrainLink({
          pnr: "12345", // Only 5 digits
        });
      }).toThrow(/Invalid Indian Railways PNR/);
    });

    it("generates ConfirmTkt station pair routing with Tatkal quota", () => {
      const result = generateConfirmTktTrainLink({
        fromStation: "New Delhi (NDLS)",
        toStation: "Kanpur Central (CNB)",
        travelDate: "2026-11-20",
        quota: "TATKAL",
        subId: "ok_tatkal_lead",
      });

      expect(result.partner).toBe("confirmtkt");
      expect(result.targetUrl).toContain("/trains/ndls-to-cnb");
      expect(result.targetUrl).toContain("date=20-11-2026");
      expect(result.targetUrl).toContain("quota=TQ");
      expect(result.targetUrl).toContain("subId=ok_tatkal_lead");
    });

    it("generates official IRCTC NextGen station pair search deep link", () => {
      const result = generateIrctcTrainLink({
        fromStation: "NDLS",
        toStation: "MMCT",
        travelDate: "2026-11-25",
        quota: "GENERAL",
      });

      expect(result.partner).toBe("irctc");
      expect(result.travelMode).toBe("train");

      const targetUrl = new URL(result.targetUrl);
      expect(targetUrl.hostname).toBe("www.irctc.co.in");
      expect(targetUrl.pathname).toBe("/nget/train-search");
      expect(targetUrl.searchParams.get("fromStation")).toBe("NDLS");
      expect(targetUrl.searchParams.get("toStation")).toBe("MMCT");
      expect(targetUrl.searchParams.get("journeyDate")).toBe("25/11/2026");
      expect(targetUrl.searchParams.get("journeyQuota")).toBe("GENERAL");
    });

    it("generates IRCTC PNR enquiry deep link", () => {
      const result = generateIrctcTrainLink({
        pnr: "4529182740",
      });

      expect(result.partner).toBe("irctc");
      expect(result.targetUrl).toBe("https://www.irctc.co.in/nget/enquiry/pnr/4529182740");
    });
  });

  // --------------------------------------------------------------------------
  // 3. BUSES: REDBUS
  // --------------------------------------------------------------------------
  describe("Buses Deep-Linking (RedBus)", () => {
    it("generates verified RedBus live route affiliate link with normalized city slugs and date", () => {
      const result = generateRedBusLink({
        sourceCity: "Bengaluru",
        destinationCity: "Goa (Panaji)",
        journeyDate: "2026-10-25",
        busType: "volvo",
        subId: "ok_weekend_getaway",
        affiliateId: "orderking_redbus_live",
      });

      expect(result.partner).toBe("redbus");
      expect(result.travelMode).toBe("bus");
      expect(result.platformMarkupPaise).toBe(0);
      expect(result.expectedCommissionBps).toBe(300); // 3.0%

      const targetUrl = new URL(result.targetUrl);
      expect(targetUrl.hostname).toBe("www.redbus.in");
      expect(targetUrl.pathname).toBe("/bus-tickets/bangalore-to-goa");
      expect(targetUrl.searchParams.get("doj")).toBe("25-Oct-2026");
      expect(targetUrl.searchParams.get("busType")).toBe("volvo");
      expect(targetUrl.searchParams.get("utm_source")).toBe("orderking");
      expect(targetUrl.searchParams.get("utm_medium")).toBe("affiliate");
      expect(targetUrl.searchParams.get("affId")).toBe("orderking_redbus_live");
      expect(targetUrl.searchParams.get("subId")).toBe("ok_weekend_getaway");
    });
  });

  // --------------------------------------------------------------------------
  // 4. HOTELS: BOOKING.COM & AGODA
  // --------------------------------------------------------------------------
  describe("Hotels Deep-Linking (Booking.com & Agoda)", () => {
    it("generates verified Booking.com affiliate link with city, checkin, checkout, and guests", () => {
      const result = generateBookingComHotelLink({
        cityOrLocation: "Jaipur, Rajasthan",
        checkInDate: "2026-12-10",
        checkOutDate: "2026-12-14",
        guests: 4,
        rooms: 2,
        subId: "ok_heritage_trip",
        affiliateId: "orderking_booking_live",
      });

      expect(result.partner).toBe("booking_com");
      expect(result.travelMode).toBe("hotel");
      expect(result.platformMarkupPaise).toBe(0);
      expect(result.expectedCommissionBps).toBe(400); // 4.0%

      const targetUrl = new URL(result.targetUrl);
      expect(targetUrl.hostname).toBe("www.booking.com");
      expect(targetUrl.pathname).toBe("/searchresults.html");
      expect(targetUrl.searchParams.get("ss")).toBe("Jaipur, Rajasthan");
      expect(targetUrl.searchParams.get("checkin")).toBe("2026-12-10");
      expect(targetUrl.searchParams.get("checkout")).toBe("2026-12-14");
      expect(targetUrl.searchParams.get("group_adults")).toBe("4");
      expect(targetUrl.searchParams.get("no_rooms")).toBe("2");
      expect(targetUrl.searchParams.get("selected_currency")).toBe("INR");
      expect(targetUrl.searchParams.get("aid")).toBe("orderking_booking_live");
      expect(targetUrl.searchParams.get("label")).toBe("ok_heritage_trip");
    });

    it("generates verified Agoda affiliate link with city, checkin, checkout, and guests", () => {
      const result = generateAgodaHotelLink({
        cityOrLocation: "Goa, India",
        checkInDate: "2026-12-24",
        checkOutDate: "2026-12-28",
        guests: 2,
        rooms: 1,
        subId: "ok_nye_beach",
        affiliateId: "1994821",
      });

      expect(result.partner).toBe("agoda");
      expect(result.travelMode).toBe("hotel");
      expect(result.platformMarkupPaise).toBe(0);
      expect(result.expectedCommissionBps).toBe(500); // 5.0%

      const targetUrl = new URL(result.targetUrl);
      expect(targetUrl.hostname).toBe("www.agoda.com");
      expect(targetUrl.pathname).toBe("/search");
      expect(targetUrl.searchParams.get("city")).toBe("Goa, India");
      expect(targetUrl.searchParams.get("checkIn")).toBe("2026-12-24");
      expect(targetUrl.searchParams.get("checkOut")).toBe("2026-12-28");
      expect(targetUrl.searchParams.get("rooms")).toBe("1");
      expect(targetUrl.searchParams.get("adults")).toBe("2");
      expect(targetUrl.searchParams.get("cur")).toBe("INR");
      expect(targetUrl.searchParams.get("cid")).toBe("1994821");
      expect(targetUrl.searchParams.get("tag")).toBe("ok_nye_beach");
    });
  });

  // --------------------------------------------------------------------------
  // 5. SECURITY, TAMPER RESISTANCE & HOST WHITELIST
  // --------------------------------------------------------------------------
  describe("Security, Tamper Resistance & Domain Whitelist", () => {
    it("validates official partner hostnames and rejects arbitrary untrusted hosts", () => {
      expect(isAllowedPartnerUrl("https://www.kiwi.com/deep?affilid=test")).toBe(true);
      expect(isAllowedPartnerUrl("https://www.skyscanner.co.in/transport/flights")).toBe(true);
      expect(isAllowedPartnerUrl("https://www.confirmtkt.com/pnr-status/1234567890")).toBe(true);
      expect(isAllowedPartnerUrl("https://www.irctc.co.in/nget/train-search")).toBe(true);
      expect(isAllowedPartnerUrl("https://www.redbus.in/bus-tickets/bangalore-to-goa")).toBe(true);
      expect(isAllowedPartnerUrl("https://www.booking.com/searchresults.html")).toBe(true);
      expect(isAllowedPartnerUrl("https://www.agoda.com/search")).toBe(true);

      // Malicious or unauthorized external domains must fail
      expect(isAllowedPartnerUrl("https://evil-phishing-travel.com/steal-creds")).toBe(false);
      expect(isAllowedPartnerUrl("javascript:alert(1)")).toBe(false);
      expect(isAllowedPartnerUrl("file:///etc/passwd")).toBe(false);
    });

    it("detects tampered payload data in HMAC-SHA256 tracking tokens", () => {
      const payload: PartnerHandshakePayload = {
        clickId: "clk_test_123",
        partner: "kiwi",
        travelMode: "flight",
        targetUrl: "https://www.kiwi.com/deep?test=1",
        userId: "usr_42",
        expectedCommissionBps: 300,
        issuedAt: Date.now(),
        expiresAt: Date.now() + 3600000,
      };

      const token = createSignedTrackingToken(payload);
      expect(verifySignedTrackingToken(token).valid).toBe(true);

      // Tamper with the base64url payload
      const [b64, sig] = token.split(".");
      const decoded = JSON.parse(Buffer.from(b64, "base64url").toString("utf-8"));
      decoded.targetUrl = "https://evil-hacker.com/redirect"; // Tampered URL
      const tamperedB64 = Buffer.from(JSON.stringify(decoded)).toString("base64url");
      const tamperedToken = `${tamperedB64}.${sig}`;

      const tamperedVerification = verifySignedTrackingToken(tamperedToken);
      expect(tamperedVerification.valid).toBe(false);
      expect(tamperedVerification.error).toBe("Cryptographic signature mismatch.");
    });

    it("rejects expired tracking tokens", () => {
      const expiredPayload: PartnerHandshakePayload = {
        clickId: "clk_test_expired",
        partner: "redbus",
        travelMode: "bus",
        targetUrl: "https://www.redbus.in/bus-tickets/bangalore-to-goa",
        expectedCommissionBps: 300,
        issuedAt: Date.now() - 7200000,
        expiresAt: Date.now() - 3600000, // Expired 1 hour ago
      };

      const token = createSignedTrackingToken(expiredPayload);
      const verification = verifySignedTrackingToken(token);
      expect(verification.valid).toBe(false);
      expect(verification.error).toBe("Tracking token has expired.");
    });
  });

  // --------------------------------------------------------------------------
  // 6. PARTNER HANDSHAKE API ROUTE VERIFICATION
  // --------------------------------------------------------------------------
  describe("Partner Handshake API Route Execution", () => {
    it("handles GET request with valid signed tracking token and returns 302 Redirect", async () => {
      const flightResult = generateKiwiFlightLink({
        origin: "DEL",
        destination: "BOM",
        departureDate: "2026-11-15",
      });

      const getUrl = `https://customer.orderking.app/api/travel/partner-handshake?token=${encodeURIComponent(
        flightResult.signedToken
      )}`;
      const request = new Request(getUrl, { method: "GET" });

      const response = await (PartnerHandshakeRoute as any).options.server.handlers.GET({ request });
      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe(flightResult.targetUrl);
      expect(response.headers.get("X-OrderKing-Markup")).toBe("0-paise-guarantee");
    });

    it("rejects GET request with invalid token with HTTP 400", async () => {
      const request = new Request(
        "https://customer.orderking.app/api/travel/partner-handshake?token=invalid.token.here",
        { method: "GET" }
      );

      const response = await (PartnerHandshakeRoute as any).options.server.handlers.GET({ request });
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.code).toBe("INVALID_HANDSHAKE_TOKEN");
    });

    it("handles POST request to programmatically generate partner link and token", async () => {
      const postRequest = new Request("https://customer.orderking.app/api/travel/partner-handshake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partner: "booking_com",
          mode: "hotel",
          city: "Udaipur, Rajasthan",
          checkIn: "2026-11-20",
          checkOut: "2026-11-23",
          guests: 2,
          rooms: 1,
        }),
      });

      const response = await (PartnerHandshakeRoute as any).options.server.handlers.POST({ request: postRequest });
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data.partner).toBe("booking_com");
      expect(json.data.travelMode).toBe("hotel");
      expect(json.data.targetUrl).toContain("https://www.booking.com/searchresults.html");
      expect(json.data.handshakeUrl).toContain("/api/travel/partner-handshake?token=");
      expect(json.data.signedToken).toBeTruthy();
      expect(json.data.platformMarkupPaise).toBe(0);
    });
  });
});
