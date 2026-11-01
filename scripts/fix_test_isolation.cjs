const fs = require('fs');

// 1. Restore search.ts catch block to 503 so search-connaught-place.test.ts passes
let searchCode = fs.readFileSync('orderking-customers/src/routes/api/search.ts', 'utf8').replace(/\r\n/g, '\n');

const currentCatch = `        } catch (error) {
          console.error("GET /api/search: live catalog edge fallback active", error);
          const fallback = CURATED_RESTAURANTS;
          return new Response(JSON.stringify({
            restaurants: fallback,
            dishes: [],
            deliveryAvailable: true,
            sections: {
              offers: fallback.filter((c) => c.hasOffer).slice(0, 8),
              popular: [...fallback].sort((a, b) => (b.ratingAvg ?? 4.0) - (a.ratingAvg ?? 4.0)).slice(0, 8),
              fast: fallback.filter((c) => c.etaMinutes <= 25).slice(0, 8),
              budget: [...fallback].sort((a, b) => a.minOrderPaise - b.minOrderPaise).slice(0, 8),
              veg: fallback.filter((c) => c.vegOnly),
              newKitchens: fallback.slice(0, 6),
            },
          }), { status: 200, headers: { "content-type": "application/json" } });
        }`;

const failClosedCatch = `        } catch (error) {
          console.error("GET /api/search: live catalog unavailable", error);
          return new Response(JSON.stringify({
            error: "RESTAURANT_CATALOG_UNAVAILABLE",
            restaurants: [], dishes: [], deliveryAvailable: false,
            sections: { offers: [], popular: [], fast: [], budget: [], veg: [], newKitchens: [] },
          }), { status: 503, headers: { "content-type": "application/json" } });
        }`;

if (searchCode.includes(currentCatch)) {
  searchCode = searchCode.replace(currentCatch, failClosedCatch);
  fs.writeFileSync('orderking-customers/src/routes/api/search.ts', searchCode, 'utf8');
  console.log('SUCCESS: search.ts catch block restored to 503 fail-closed');
}

// 2. Patch parcel-order-db.test.ts to isolate unconfigured state
let parcelTest = fs.readFileSync('orderking-customers/src/test/parcel-order-db.test.ts', 'utf8').replace(/\r\n/g, '\n');

const oldParcelTest = `  it("refuses Razorpay order creation without verified provider integration", async () => {
    await expect(prepareParcelRazorpayOrder({
      data: {
        distanceKm: 5.0,
        packageType: "DOCUMENTS",
        isNight: false,
        receipt: \`rcpt_test_\${Date.now()}\`,
      },
    })).rejects.toThrow("Secure online parcel payment");
  });`;

const newParcelTest = `  it("refuses Razorpay order creation without verified provider integration", async () => {
    const origKey = process.env.RAZORPAY_KEY_ID;
    const origSecret = process.env.RAZORPAY_KEY_SECRET;
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
    try {
      await expect(prepareParcelRazorpayOrder({
        data: {
          distanceKm: 5.0,
          packageType: "DOCUMENTS",
          isNight: false,
          receipt: \`rcpt_test_\${Date.now()}\`,
        },
      })).rejects.toThrow("Secure online parcel payment");
    } finally {
      if (origKey) process.env.RAZORPAY_KEY_ID = origKey;
      if (origSecret) process.env.RAZORPAY_KEY_SECRET = origSecret;
    }
  });`;

if (parcelTest.includes(oldParcelTest)) {
  parcelTest = parcelTest.replace(oldParcelTest, newParcelTest);
  fs.writeFileSync('orderking-customers/src/test/parcel-order-db.test.ts', parcelTest, 'utf8');
  console.log('SUCCESS: parcel-order-db.test.ts patched with env isolation');
}

// 3. Patch phone-auth.test.ts to isolate unconfigured state in test 4
let phoneTest = fs.readFileSync('orderking-customers/src/test/phone-auth.test.ts', 'utf8').replace(/\r\n/g, '\n');

const oldPhoneTest = `  it("4. falls back to resilient zero-lockout emergency mode when keys are unconfigured", async () => {
    const result = await dispatchOtpSms({
      phone: "9395065587",
      otp: "654321",
      channel: "sms",
    });

    expect(result.success).toBe(true);
    expect(result.provider).toBe("resilient_fallback");
    expect(result.debugOtp).toBe("654321");
    expect(result.whatsAppOtpUrl).toBeDefined();
  });`;

const newPhoneTest = `  it("4. falls back to resilient zero-lockout emergency mode when keys are unconfigured", async () => {
    const envBackup = { ...process.env };
    delete process.env.FAST2SMS_API_KEY;
    delete process.env.TWOFACTOR_API_KEY;
    delete process.env.OTP_2FACTOR_API_KEY;
    delete process.env.META_WHATSAPP_TOKEN;
    try {
      const result = await dispatchOtpSms({
        phone: "9395065587",
        otp: "654321",
        channel: "sms",
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe("resilient_fallback");
      expect(result.debugOtp).toBe("654321");
      expect(result.whatsAppOtpUrl).toBeDefined();
    } finally {
      process.env = envBackup;
    }
  });`;

if (phoneTest.includes(oldPhoneTest)) {
  phoneTest = phoneTest.replace(oldPhoneTest, newPhoneTest);
  fs.writeFileSync('orderking-customers/src/test/phone-auth.test.ts', phoneTest, 'utf8');
  console.log('SUCCESS: phone-auth.test.ts patched with env isolation');
}
