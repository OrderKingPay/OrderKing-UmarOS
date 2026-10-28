import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  detectLanguage,
  detectIntent,
  generateBotCareResponse,
  buildBookingConfirmationMessages,
  buildPnrTrackingMessages,
  createOtpChallenge,
  verifyOtpChallenge,
  validateDriverTelemetry,
  OTP_VALIDITY_MS,
  VELOCITY_CAPS_KMH,
  type TelemetryPoint,
} from "./telecom-care-bot.ts";

describe("Sovereign Telecom Care & Zero-Employee Dispatch Suite", () => {
  describe("1. Multilingual Language & Dialect Detector", () => {
    it("identifies English query correctly", () => {
      assert.equal(detectLanguage("Where is my order?"), "en");
      assert.equal(detectLanguage("Track my flight ticket"), "en");
    });

    it("identifies Hindi query via Devanagari script", () => {
      assert.equal(detectLanguage("मेरा आर्डर कहाँ है?"), "hi");
      assert.equal(detectLanguage("पीएनआर स्टेटस चेक करना है"), "hi");
    });

    it("identifies standard Bengali query", () => {
      assert.equal(detectLanguage("আমার খাবার কোথায়?"), "bn");
      assert.equal(detectLanguage("ট্রেনের টিকিট কনফার্মেশন পাঠান"), "bn");
    });

    it("identifies Sylheti dialect query across distinctive phonetic markers", () => {
      assert.equal(detectLanguage("আমার বিরিয়ানি কনে?"), "syl");
      assert.equal(detectLanguage("অর্ডার আইলো না ক্যনে?"), "syl");
      assert.equal(detectLanguage("গাড়ির খবর কিতা?"), "syl");
      assert.equal(detectLanguage("রাইডার কনে পৌছাইলো?"), "syl");
      assert.equal(detectLanguage("kone gela bhai?"), "syl");
    });
  });

  describe("2. Intent Recognition Engine", () => {
    it("classifies emergency / SOS beacon", () => {
      assert.equal(detectIntent("Emergency accident on highway!"), "SAFETY_SOS");
      assert.equal(detectIntent("বিপদ সাহায্য চাই পুলিশ পাঠান"), "SAFETY_SOS");
      assert.equal(detectIntent("मदद चाहिए एक्सीडेंट हो गया"), "SAFETY_SOS");
    });

    it("classifies PNR tracking inquiries", () => {
      assert.equal(detectIntent("What is the status of PNR 2847291048?"), "PNR_TRACKING");
      assert.equal(detectIntent("পিএনআর স্ট্যাটাস দেখাও 1234567890"), "PNR_TRACKING");
      assert.equal(detectIntent("पीएनआर 9876543210 चेक करो"), "PNR_TRACKING");
    });

    it("classifies booking confirmation requests", () => {
      assert.equal(detectIntent("Send my flight booking confirmation ticket"), "BOOKING_CONFIRMATION");
      assert.equal(detectIntent("বুকিং কনফার্মেশন টিকেট স্লিপ"), "BOOKING_CONFIRMATION");
      assert.equal(detectIntent("मेरी बस बुकिंग का कन्फर्मेशन दो"), "BOOKING_CONFIRMATION");
    });

    it("classifies rider ETA & dispatch inquiries", () => {
      assert.equal(detectIntent("When will the delivery boy arrive?"), "RIDER_DISPATCH_ETA");
      assert.equal(detectIntent("রাইডার কনে পৌছাইলো কতদূর?"), "RIDER_DISPATCH_ETA");
      assert.equal(detectIntent("राइडर कितनी देर में पहुँचेगा?"), "RIDER_DISPATCH_ETA");
    });

    it("classifies refund and cancellation requests", () => {
      assert.equal(detectIntent("I want to cancel my order and get a refund"), "REFUND_CANCELLATION");
      assert.equal(detectIntent("অর্ডার বাতিল করে টাকা ফেরত দিন"), "REFUND_CANCELLATION");
      assert.equal(detectIntent("रिफंड कब आएगा पैसे वापस करो"), "REFUND_CANCELLATION");
    });
  });

  describe("3. 24/7 Zero-Employee Self-Service Care Bot Responses", () => {
    it("generates native Sylheti response with live order tracking link", () => {
      const res = generateBotCareResponse("আমার অর্ডার কনে আইলো না ক্যনে?", {
        orderId: "OK-SYL-9001",
        orderStatus: "OUT_FOR_DELIVERY",
        etaMinutes: 12,
      });

      assert.equal(res.language, "syl");
      assert.equal(res.intent, "ORDER_STATUS");
      assert.match(res.replyText, /অর্ডার বর্তমানে/);
      assert.match(res.replyText, /OUT_FOR_DELIVERY/);
      assert.equal(res.quickActionUri, "https://orderkingpay.com/orders/OK-SYL-9001");
    });

    it("generates native Bengali response for live PNR inquiry", () => {
      const res = generateBotCareResponse("পিএনআর স্ট্যাটাস 2847291048", {
        pnrNumber: "2847291048",
      });

      assert.equal(res.language, "bn");
      assert.equal(res.intent, "PNR_TRACKING");
      assert.match(res.replyText, /পিএনআর স্ট্যাটাস/);
      assert.match(res.replyText, /2847291048/);
      assert.equal(res.quickActionUri, "https://orderkingpay.com/travel/trips?pnr=2847291048");
    });

    it("generates native Hindi response for rider ETA inquiry", () => {
      const res = generateBotCareResponse("राइडर कितनी देर में आएगा?", {
        orderId: "OK-HND-5501",
        riderName: "Rahul Sharma",
        etaMinutes: 8,
      });

      assert.equal(res.language, "hi");
      assert.equal(res.intent, "RIDER_DISPATCH_ETA");
      assert.match(res.replyText, /राइडर ईटीए/);
      assert.match(res.replyText, /Rahul Sharma/);
      assert.match(res.replyText, /8 mins/);
    });

    it("triggers emergency SOS flow with direct 112 dialer link", () => {
      const res = generateBotCareResponse("Help accident emergency road blocked!");
      assert.equal(res.intent, "SAFETY_SOS");
      assert.equal(res.emergencyTriggered, true);
      assert.equal(res.quickActionUri, "tel:112");
      assert.match(res.replyText, /EMERGENCY ALERT/);
    });
  });

  describe("4. Automated WhatsApp & Fast2SMS Booking Confirmation Dispatch", () => {
    it("generates compliant SMS and 1-tap WhatsApp deep link for confirmed bookings", () => {
      const messages = buildBookingConfirmationMessages({
        recipientPhone: "+91 9395065587",
        bookingId: "TRIP-7788",
        pnrNumber: "6E-2041",
        customerName: "Sayed Umar",
        serviceType: "FLIGHT",
        origin: "Silchar (IXS)",
        destination: "Kolkata (CCU)",
        scheduledTime: "28 Oct 2026, 14:30 IST",
        totalPaidPaise: 425000, // ₹4,250.00
      });

      assert.equal(messages.totalInr, "4250.00");
      assert.match(messages.smsMessage, /TRIP-7788/);
      assert.match(messages.smsMessage, /Rs\.4250\.00/);
      assert.match(messages.smsMessage, /PNR:6E-2041/);

      assert.match(messages.whatsAppDeepLink, /https:\/\/wa\.me\/919395065587\?text=/);
      assert.match(decodeURIComponent(messages.whatsAppDeepLink), /Sayed Umar/);
      assert.match(decodeURIComponent(messages.whatsAppDeepLink), /Silchar \(IXS\) ➔ Kolkata \(CCU\)/);
      assert.match(decodeURIComponent(messages.whatsAppDeepLink), /₹4250\.00/);
    });
  });

  describe("5. Live PNR Tracking Status Broadcast", () => {
    it("compiles verified PNR status updates with official carrier deep links", () => {
      const pnrUpdate = buildPnrTrackingMessages({
        recipientPhone: "9876543210",
        pnrNumber: "2847291048",
        trainOrFlightNumber: "15617 / Barak-Brahmaputra Express",
        currentStatus: "CNF",
        coachBerth: "B2 - 34 (Lower)",
        departureTime: "22:15 IST",
      });

      assert.match(pnrUpdate.smsMessage, /PNR 2847291048/);
      assert.match(pnrUpdate.smsMessage, /CNF/);
      assert.match(pnrUpdate.smsMessage, /B2 - 34/);

      assert.match(pnrUpdate.whatsAppDeepLink, /https:\/\/wa\.me\/919876543210/);
      assert.match(decodeURIComponent(pnrUpdate.whatsAppDeepLink), /Barak-Brahmaputra Express/);
      assert.match(decodeURIComponent(pnrUpdate.whatsAppDeepLink), /B2 - 34 \(Lower\)/);
    });
  });

  describe("6. Phone Auth & WhatsApp 1-Tap OTP Fallback", () => {
    it("creates a secure 6-digit challenge with 10-minute expiry", () => {
      const challenge = createOtpChallenge("9395065587", "whatsapp");
      assert.equal(challenge.phone, "9395065587");
      assert.match(challenge.otp, /^\d{6}$/);
      assert.equal(challenge.channel, "whatsapp");
      assert.ok(challenge.expiresAt > Date.now());
      assert.ok(challenge.expiresAt <= Date.now() + OTP_VALIDITY_MS);
    });

    it("verifies valid OTP within the 10-minute validity window", () => {
      const challenge = createOtpChallenge("9395065587");
      const res = verifyOtpChallenge(challenge, challenge.otp);
      assert.equal(res.valid, true);
    });

    it("rejects expired OTP exceeding 10 minutes", () => {
      const expiredChallenge = {
        phone: "9395065587",
        otp: "482910",
        expiresAt: Date.now() - 1000, // 1 second ago
        channel: "sms" as const,
      };
      const res = verifyOtpChallenge(expiredChallenge, "482910");
      assert.equal(res.valid, false);
      assert.match(res.reason!, /OTP_EXPIRED/);
    });

    it("rejects incorrect OTP codes", () => {
      const challenge = createOtpChallenge("9395065587");
      const res = verifyOtpChallenge(challenge, "000000");
      assert.equal(res.valid, false);
      assert.match(res.reason!, /OTP_MISMATCH/);
    });
  });

  describe("7. Driver Telemetry & Anti-Spoofing Velocity Thresholds", () => {
    const karimganjCore: TelemetryPoint = {
      lat: 24.8688,
      lng: 92.3511,
      timestamp: 1793110000000,
    };

    it("rejects hardware reporting mock GPS provider", () => {
      const mockPing: TelemetryPoint = {
        lat: 24.8688,
        lng: 92.3511,
        timestamp: 1793110000000,
        isMock: true,
      };
      const res = validateDriverTelemetry(null, mockPing, "MOTORCYCLE");
      assert.equal(res.valid, false);
      assert.equal(res.code, "MOCK_GPS_DETECTED");
    });

    it("rejects out-of-bounds coordinates breaching India sovereign geofence", () => {
      const oobPing: TelemetryPoint = {
        lat: 51.5074, // London
        lng: -0.1278,
        timestamp: 1793110000000,
      };
      const res = validateDriverTelemetry(null, oobPing, "MOTORCYCLE");
      assert.equal(res.valid, false);
      assert.equal(res.code, "GEOFENCE_BREACH");
    });

    it("rejects instant teleportation jumps (>50m with zero elapsed time)", () => {
      const teleportPing: TelemetryPoint = {
        lat: 24.8900, // ~2.5km away
        lng: 92.3700,
        timestamp: karimganjCore.timestamp, // Zero elapsed time!
      };
      const res = validateDriverTelemetry(karimganjCore, teleportPing, "MOTORCYCLE");
      assert.equal(res.valid, false);
      assert.equal(res.code, "FAKE_GPS_TELEPORT");
    });

    it("enforces vehicle-specific velocity caps (Motorcycle 80 km/h, Bicycle 30 km/h, Walking 15 km/h)", () => {
      // 10km away in 6 minutes = 100 km/h
      const sixMinutesMs = 6 * 60 * 1000;
      const highSpeedPing: TelemetryPoint = {
        lat: 24.9588, // ~10km north
        lng: 92.3511,
        timestamp: karimganjCore.timestamp + sixMinutesMs,
      };

      // Motorcycle cap is 80 km/h -> 100 km/h must fail
      const motoRes = validateDriverTelemetry(karimganjCore, highSpeedPing, "MOTORCYCLE");
      assert.equal(motoRes.valid, false);
      assert.equal(motoRes.code, "SPEED_CAP_BREACH");
      assert.ok(motoRes.speedKmh! > VELOCITY_CAPS_KMH.MOTORCYCLE);

      // 3km away in 5 minutes = 36 km/h
      const fiveMinsMs = 5 * 60 * 1000;
      const bicyclePing: TelemetryPoint = {
        lat: 24.8958, // ~3km away
        lng: 92.3511,
        timestamp: karimganjCore.timestamp + fiveMinsMs,
      };

      // Bicycle cap is 30 km/h -> 36 km/h must fail
      const bikeRes = validateDriverTelemetry(karimganjCore, bicyclePing, "BICYCLE");
      assert.equal(bikeRes.valid, false);
      assert.equal(bikeRes.code, "SPEED_CAP_BREACH");

      // Plausible 40 km/h motorcycle trip (2km in 3 minutes)
      const threeMinsMs = 3 * 60 * 1000;
      const validMotoPing: TelemetryPoint = {
        lat: 24.8868, // ~2km away
        lng: 92.3511,
        timestamp: karimganjCore.timestamp + threeMinsMs,
      };
      const validMotoRes = validateDriverTelemetry(karimganjCore, validMotoPing, "MOTORCYCLE");
      assert.equal(validMotoRes.valid, true);
      assert.equal(validMotoRes.code, "OK");
    });
  });
});
