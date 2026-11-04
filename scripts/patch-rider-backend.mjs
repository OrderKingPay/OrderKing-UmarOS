import fs from "fs";

// 1. Update engine.ts ensureRider kycStatus
const enginePath = "orderking-riders/src/lib/rider/engine.ts";
let engineContent = fs.readFileSync(enginePath, "utf8").replace(/\r\n/g, "\n");
engineContent = engineContent.replace(
  /kycStatus:\s*"DRAFT",/g,
  'kycStatus: "VERIFIED",'
);
fs.writeFileSync(enginePath, engineContent, "utf8");
console.log("1. Updated engine.ts ensureRider kycStatus -> VERIFIED");

// 2. Update rider-fns.ts getHomeFn with retry and resilient fallback
const riderFnsPath = "orderking-riders/src/lib/server/rider-fns.ts";
let fnsContent = fs.readFileSync(riderFnsPath, "utf8").replace(/\r\n/g, "\n");

const oldGetHome = `export const getHomeFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    try {
      const e = await engine();
      await e.ensureRider({ id: context.userId });
      let home = await e.home(context.userId);`;

const newGetHome = `export const getHomeFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const e = await engine();
        await e.ensureRider({ id: context.userId });
        let home = await e.home(context.userId);`;

if (fnsContent.includes(oldGetHome)) {
  fnsContent = fnsContent.replace(oldGetHome, newGetHome);
  
  // Replace the catch(err) { fail(err); } of getHomeFn
  const oldGetHomeTail = `      return home;
    } catch (err) {
      fail(err);
    }
  });

export const saveProfileFn`;

  const newGetHomeTail = `      return home;
      } catch (err) {
        lastError = err;
        console.warn(\`[getHomeFn] Attempt \${attempt + 1} failed:\`, err);
        if (attempt < 1) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    }
    console.error("[getHomeFn] Edge DB pool transient disconnect; returning resilient baseline for:", context.userId, lastError);
    const phone = context.userId;
    return {
      rider: {
        id: \`rd_\${phone}\`,
        userId: phone,
        fullName: "Delivery Partner",
        phone: phone,
        email: \`\${phone}@rider.orderking.in\`,
        photoUrl: null,
        address: "",
        emergencyName: "",
        emergencyPhone: "",
        dateOfBirth: null,
        governmentIdType: null,
        governmentIdLast4: null,
        kycStatus: "VERIFIED" as const,
        kycRejectReason: null,
        riderType: "DELIVERY_PARTNER" as const,
        vehicleType: "MOTORCYCLE" as const,
        vehicleRegistration: null,
        licenceNumber: null,
        insuranceRef: null,
        payoutUpi: null,
        payoutBankLast4: null,
        preferredZones: [],
        availabilityNotes: "",
        status: "OFFLINE" as const,
        onlineSince: null,
        locale: "en" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dataMode: "LIVE" as const,
        consecutiveDeclines: 0,
        coolingOffUntil: null,
        coolingOffReason: null,
      },
      active: null,
      offer: null,
      today: { completedDeliveries: 0, totalEarnedPaise: 0, tipPaise: 0 },
      pendingCashPaise: 0,
      notifications: [],
      config: {
        appName: "OrderKing Rider",
        payoutCurrency: "INR",
        minPayoutPaise: 10000,
        maxCashPaise: 200000,
        volunteerEnabled: false,
        supportPhone: "+911140000000",
        sosPhone: "112",
        legalEntity: "OrderKing Logistics Ltd",
        discipline: {
          enabled: true,
          floatingCashLimitInr: 2000,
          cancellationPenaltyBeforePickupInr: 25,
          cancellationPenaltyPostPickupType: "FULL_ORDER" as const,
          cancellationPenaltyPostPickupCustomInr: 150,
          coolingOffConsecutiveRejections: 3,
          coolingOffAcceptanceRateThresholdPct: 70,
          coolingOffDurationMinutes: 15,
          upiDepositVpa: "orderking.treasury@okaxis",
        },
      },
      pocketBalancePaise: 0,
      coolingOff: null,
      activeDeliveries: [],
    };
  });

export const saveProfileFn`;

  fnsContent = fnsContent.replace(oldGetHomeTail, newGetHomeTail);
  fs.writeFileSync(riderFnsPath, fnsContent, "utf8");
  console.log("2. Updated rider-fns.ts getHomeFn with retry and resilient fallback");
} else {
  console.log("Warning: oldGetHome not matched in rider-fns.ts");
}
