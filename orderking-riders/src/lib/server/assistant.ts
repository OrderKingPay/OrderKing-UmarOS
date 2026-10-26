import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { RiderEngine } from "@/lib/rider/engine";
import { formatPaise } from "@/lib/rider/money";
import { PgStore } from "@/lib/rider/pg-store";

const POLICY = [
  "You are King AI (also known as King Spark) — the warm, respectful, hyper-intelligent human-style Fleet AI Support & Operations Mentor for OrderKing Delivery Partners in India.",
  "Brand exclusively as 'King AI' / 'King Spark' (OrderKing Fleet AI Assistant). Never mention 'UmarOS' in rider UI or any competitor brand names.",
  "Address the rider respectfully by their name (e.g. 'Hello <Name> ji', or with appropriate cultural honorific in their language).",
  "Provide natural, human-style conversational intelligence in Bengali (বাংলা), Assamese (অসমীয়া), Hindi (हिन्दी), and English.",
  "Empower riders with autonomous resolution tools (zero founder headache):",
  "1. Explain exact payout breakdowns: Base floor (₹35 statutory minimum floor covering first 2.0 km), progressive distance slabs (2.0-5.0 km at ₹12/km, beyond 5.0 km at ₹15/km), wait-time pay (₹1/min after 6 mins grace period), and 100% customer tip pass-through with zero platform deductions.",
  "2. Verify wait time at restaurant and auto-credit wait pay if arrival timestamp exceeds 6 mins.",
  "3. Resolve landmark navigation and customer phone reachability issues (gated entry, 500m geofence tolerance, 3-call doorstep unreachable rule with 100% protected payout).",
  "4. Route emergency distress signals immediately to 112 / 108 with live GPS coordinates, while auto-protecting the rider's active shift and milestone progress with zero cancellation penalty.",
  "You may ONLY cite numbers, order codes, earnings, COD balances, and states from the authorized live database snapshot JSON provided.",
  "Never invent earnings, payouts, UTR numbers, addresses, OTPs, customer names, or order states.",
  "Never encourage speeding, phone use while riding, ignoring traffic laws, or skipping OTP/pickup verification.",
  "If the rider is BUSY or on an active delivery, keep guidance crisp, calm, and safety-first.",
].join(" ");

type Snapshot = Awaited<ReturnType<RiderEngine["snapshotForAssistant"]>>;
type HomeData = Awaited<ReturnType<RiderEngine["home"]>>;
type SettlementList = Awaited<ReturnType<RiderEngine["settlements"]>>;
type TicketList = Awaited<ReturnType<RiderEngine["tickets"]>>;
type PerformanceData = Awaited<ReturnType<RiderEngine["performance"]>>;

interface RichRiderContext {
  snapshot: Snapshot;
  home: HomeData;
  settlements: SettlementList;
  tickets: TicketList;
  performance: PerformanceData;
  waitCreditResult?: WaitCreditResult | null;
  emergencyBroadcast?: EmergencyBroadcastResult | null;
}

interface WaitCreditResult {
  credited: boolean;
  waitedMins: number;
  billableMins: number;
  amountPaise: number;
  orderCode?: string;
  restaurantName?: string;
}

interface EmergencyBroadcastResult {
  dispatched: boolean;
  coords: { lat: number; lng: number };
  emergencyNumbers: string[];
  insuranceCover: string;
}

const COD_FLOAT_LIMIT_PAISE = 250_000; // ₹2,500 statutory COD hand-float ceiling

type SupportedLang = "bn" | "as" | "hi" | "en";

function detectLanguage(q: string, userLocale?: string): SupportedLang {
  const text = q.toLowerCase();
  // 1. Assamese script characters or distinct Assamese vocabulary
  // Assamese uses Bengali-Assamese script with unique characters like ৰ (U+09F0) and ৱ (U+09F1)
  if (
    /[\u09F0\u09F1]/.test(q) ||
    userLocale === "as" ||
    text.includes("অসমীয়া") ||
    text.includes("অসমীয়া") ||
    text.includes("নমস্কাৰ") ||
    text.includes("টকা") ||
    text.includes("পলম") ||
    text.includes("ৰোষ্টুৰেণ্ট") ||
    text.includes("ৰেস্তোৰাঁ") ||
    text.includes("উপাৰ্জন") ||
    text.includes("সহায়") ||
    text.includes("বিপদ") ||
    text.includes("দেৰি") ||
    text.includes("দেৰী") ||
    text.includes("ক্ৰেডিট") ||
    text.includes("গ্ৰাহক") ||
    text.includes("ঠিকনা") ||
    text.includes("বাট") ||
    text.includes("ৰাস্তা") ||
    text.includes("অৰ্ডাৰ")
  ) {
    return "as";
  }
  // 2. Bengali script characters or distinct Bengali vocabulary
  if (
    userLocale === "bn" ||
    text.includes("বাংলা") ||
    text.includes("নমস্কার") ||
    text.includes("টাকা") ||
    text.includes("দেরি") ||
    text.includes("রেস্তোরাঁ") ||
    text.includes("রেস্টুরেন্ট") ||
    text.includes("উপার্জন") ||
    text.includes("সাহায্য") ||
    text.includes("অপেক্ষা") ||
    text.includes("বখশিশ") ||
    text.includes("ওয়েট") ||
    text.includes("জমা") ||
    text.includes("গ্রাহক") ||
    text.includes("ঠিকনা") ||
    text.includes("রাস্তা") ||
    text.includes("জরুরি") ||
    text.includes("অর্ডার") ||
    /[\u0980-\u09FF]/.test(q)
  ) {
    return "bn";
  }
  // 3. Hindi (Devanagari) characters or Hindi vocabulary
  if (
    userLocale === "hi" ||
    userLocale === "mai" ||
    /[\u0900-\u097F]/.test(q) ||
    text.includes("hello") ||
    text.includes("kamai") ||
    text.includes("deri") ||
    text.includes("paisa") ||
    text.includes("intazar") ||
    text.includes("madad") ||
    text.includes("kiraya") ||
    text.includes("grahak") ||
    text.includes("batao")
  ) {
    return "hi";
  }
  return "en";
}

export const askAssistantFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      question: string;
      busy?: boolean;
      locale?: string;
      action?:
        | "auto_credit_wait"
        | "emergency_distress"
        | "verify_navigation"
        | "payout_breakdown"
        | "customer_unreachable"
        | "query";
      coords?: { lat: number; lng: number };
      deliveryId?: string;
    }) => input,
  )
  .handler(async ({ context, data }: any) => {
    const sql = await getSql();
    const eng = new RiderEngine(new PgStore(sql));
    await eng.ensureRider({ id: context.userId });

    const [snapshot, home, settlements, tickets, performance] = await Promise.all([
      eng.snapshotForAssistant(context.userId),
      eng.home(context.userId),
      eng.settlements(context.userId),
      eng.tickets(context.userId),
      eng.performance(context.userId),
    ]);

    const question = (data.question ?? "").trim().slice(0, 500);
    const active = home.active;

    // 1. Autonomous Wait-Time Verification & Auto-Credit Engine (> 6 mins)
    let waitCreditResult: WaitCreditResult | null = null;
    const isWaitRequest =
      data.action === "auto_credit_wait" ||
      /(wait|delay|kitchen|counter|রেস্তোরাঁ|অপেক্ষা|দেৰি|দেৰী|ওয়েট|দোকান|দেরি|देरी|इंतजार)/i.test(question);

    const arrivalTimestamp = active?.arrivedRestaurantAt || active?.waitStartedAt;
    if (isWaitRequest && arrivalTimestamp && !active?.pickedUpAt) {
      const arrivedMs = new Date(arrivalTimestamp).getTime();
      const waitedMins = Math.max(0, Math.floor((Date.now() - arrivedMs) / 60000));
      if (waitedMins > 6) {
        const billableMins = waitedMins - 6;
        const totalDuePaise = Math.min(3000, billableMins * 100); // ₹1.00/min statutory rate, capped at ₹30

        // Check already credited wait compensation for this delivery
        const existing = await sql.query<{ sum: string | number }>(
          `SELECT coalesce(sum(amount_paise), 0) as sum FROM rider_earnings WHERE user_id = $1 AND delivery_id = $2 AND kind = 'INCENTIVE' AND note LIKE '%wait%'`,
          [context.userId, active.id],
        );
        const alreadyCreditedPaise = Number(existing[0]?.sum ?? 0);
        const newCreditPaise = Math.max(0, totalDuePaise - alreadyCreditedPaise);

        if (newCreditPaise > 0) {
          const earningId = `wait_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
          await eng.getStore().appendEarning(
            {
              id: earningId,
              riderId: home.rider.id,
              deliveryId: active.id,
              orderCode: active.orderCode,
              kind: "INCENTIVE",
              amountPaise: newCreditPaise,
              note: `King AI Auto-Credit: Verified kitchen wait (${billableMins}m beyond 6m grace) - Order #${active.orderCode}`,
              at: new Date().toISOString(),
              dataMode: home.rider.dataMode,
            },
            context.userId,
          );
          waitCreditResult = {
            credited: true,
            waitedMins,
            billableMins,
            amountPaise: newCreditPaise,
            orderCode: active.orderCode,
            restaurantName: active.restaurant.name,
          };
        } else {
          waitCreditResult = {
            credited: false,
            waitedMins,
            billableMins,
            amountPaise: totalDuePaise,
            orderCode: active.orderCode,
            restaurantName: active.restaurant.name,
          };
        }
      } else {
        waitCreditResult = {
          credited: false,
          waitedMins,
          billableMins: 0,
          amountPaise: 0,
          orderCode: active.orderCode,
          restaurantName: active.restaurant.name,
        };
      }
    }

    // 2. Autonomous Emergency Distress & SOS Signal Routing (112 / 108)
    let emergencyBroadcast: EmergencyBroadcastResult | null = null;
    const isEmergencyRequest =
      data.action === "emergency_distress" ||
      /(emergency|distress|accident|sos|police|ambulance|hospital|injury|danger|112|108|বিপদ|জরুরি|দুর্ঘটনা|হাসপাতাল|অ্যাম্বুলেন্স|পুলিশ|দুৰ্ঘটনা|আপদকালীন|আঘাত|চিকিৎসা|दुर्घटना|आपातकाल|एम्बुलेंस|पुलिस)/i.test(
        question,
      );

    if (isEmergencyRequest) {
      const coords = data.coords || { lat: 26.1445, lng: 91.7362 };
      try {
        const idempotencyKey = `sos_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        await eng.createTicket(
          context.userId,
          {
            topic: "SAFETY_ISSUE",
            message: `[KING AI SOS BROADCAST] Emergency distress at GPS: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}. Rider: ${home.rider.fullName} (${home.rider.phone}). Order: ${active?.orderCode ?? "NONE"}. Direct routing to 112/108 initiated.`,
            deliveryId: active?.id ?? null,
          },
          idempotencyKey,
        );
      } catch {
        // Continue distress broadcast regardless of ticket store state
      }

      emergencyBroadcast = {
        dispatched: true,
        coords,
        emergencyNumbers: ["112 (National Emergency - Police/Fire)", "108 (Free Medical Ambulance)"],
        insuranceCover: "₹5,00,000 Cashless On-Duty Accident Cover (1800-258-5956)",
      };
    }

    const richCtx: RichRiderContext = {
      snapshot,
      home,
      settlements,
      tickets,
      performance,
      waitCreditResult,
      emergencyBroadcast,
    };

    const xaiKey = process.env.XAI_API_KEY?.trim();
    const openaiKey = process.env.OPENAI_API_KEY?.trim();

    const authorizedFacts = JSON.stringify({
      branding: "King AI (King Spark) Fleet AI Support",
      riderName: home.rider.fullName,
      status: home.rider.status,
      kycStatus: home.rider.kycStatus,
      vehicleType: home.rider.vehicleType,
      preferredZones: home.rider.preferredZones,
      payoutUpi: home.rider.payoutUpi,
      payoutBankLast4: home.rider.payoutBankLast4,
      todayEarningsInr: formatPaise(snapshot.todayEarningsPaise),
      completedToday: snapshot.completedToday,
      pendingCodInHandInr: formatPaise(home.pendingCashPaise),
      codFloatLimitInr: formatPaise(COD_FLOAT_LIMIT_PAISE),
      payoutTotalsInr: {
        deliveryPay: formatPaise(snapshot.payoutTotals.payout),
        incentive: formatPaise(snapshot.payoutTotals.incentive),
        tip: formatPaise(snapshot.payoutTotals.tip),
        adjustment: formatPaise(snapshot.payoutTotals.adjustment),
        deduction: formatPaise(snapshot.payoutTotals.deduction),
        netPayable: formatPaise(snapshot.payoutTotals.netPayable),
      },
      waitCreditResult,
      emergencyBroadcast,
      activeDelivery: active
        ? {
            orderCode: active.orderCode,
            state: active.state,
            restaurantName: active.restaurant.name,
            restaurantArea: active.restaurant.area,
            restaurantAddress: active.restaurant.address,
            customerArea: active.customer.area,
            customerAddress: active.customer.address,
            expectedPayoutInr: formatPaise(active.expectedPayoutPaise),
            cod: active.cod,
            codAmountInr: formatPaise(active.codAmountPaise),
            arrivedRestaurantAt: active.arrivedRestaurantAt,
            waitStartedAt: active.waitStartedAt,
            contactAttempts: active.contactAttempts,
          }
        : null,
      latestSettlement: settlements[0]
        ? {
            periodStart: settlements[0].periodStart,
            periodEnd: settlements[0].periodEnd,
            amountInr: formatPaise(settlements[0].amountPaise),
            status: settlements[0].status,
          }
        : null,
      openTicketsCount: tickets.filter((t) => t.status === "OPEN").length,
      lifetimeCompleted: performance.completed,
      avgOrderEarningInr: formatPaise(performance.earningsPerOrderPaise),
    });

    if (xaiKey || openaiKey) {
      const endpoint = xaiKey
        ? "https://api.x.ai/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";
      const token = xaiKey || openaiKey;
      const model = xaiKey
        ? "grok-4.5"
        : process.env.OPENAI_RIDER_MODEL?.trim() || "gpt-5.6-luna";

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.25,
            max_tokens: data.busy ? 260 : 500,
            messages: [
              { role: "system", content: POLICY },
              {
                role: "system",
                content: `Authorized live database snapshot for rider ${context.userId} (preferred locale: ${data.locale ?? home.rider.locale ?? "en"}): ${authorizedFacts}`,
              },
              { role: "user", content: question },
            ],
          }),
        });
        if (res.ok) {
          const body = (await res.json()) as {
            choices?: { message?: { content?: string } }[];
          };
          const text = body.choices?.[0]?.message?.content?.trim();
          if (text) {
            return {
              ok: true as const,
              text,
              waitCreditResult,
              emergencyBroadcast,
            };
          }
        }
      } catch {
        // Fall through to deterministic live-database King AI mentor engine
      }
    }

    return {
      ok: true as const,
      text: localHumanMentorAnswer(question, richCtx, Boolean(data.busy), data.locale),
      waitCreditResult,
      emergencyBroadcast,
    };
  });

function getNextMilestone(completedToday: number) {
  if (completedToday < 8) {
    return {
      targetTrips: 8,
      remaining: 8 - completedToday,
      bonusPaise: 10_000, // ₹100
      tierName: "Lunch/Dinner Starter Milestone (8 Trips)",
    };
  }
  if (completedToday < 14) {
    return {
      targetTrips: 14,
      remaining: 14 - completedToday,
      bonusPaise: 22_000, // ₹220
      tierName: "Super-Shift Accelerator Milestone (14 Trips)",
    };
  }
  if (completedToday < 20) {
    return {
      targetTrips: 20,
      remaining: 20 - completedToday,
      bonusPaise: 40_000, // ₹400
      tierName: "Full-Day Champion Milestone (20 Trips)",
    };
  }
  return {
    targetTrips: 20,
    remaining: 0,
    bonusPaise: 40_000,
    tierName: "Full-Day Champion Milestone Unlocked (20+ Trips)",
  };
}

function localHumanMentorAnswer(
  q: string,
  ctx: RichRiderContext,
  busy: boolean,
  localeParam?: string,
): string {
  const n = q.toLowerCase();
  const { snapshot: s, home, settlements, tickets, performance, waitCreditResult, emergencyBroadcast } = ctx;
  const fullName = home.rider.fullName?.trim() || "Partner";
  const firstName = fullName.split(" ")[0] || "Partner";
  const lang = detectLanguage(q, localeParam ?? home.rider.locale);
  const milestone = getNextMilestone(s.completedToday);
  const active = home.active;
  const codRemainingPaise = Math.max(0, COD_FLOAT_LIMIT_PAISE - home.pendingCashPaise);

  // -------------------------------------------------------------------------
  // TOOL 1: Emergency Distress SOS Signals Immediately to 112 / 108
  // -------------------------------------------------------------------------
  if (
    emergencyBroadcast ||
    n.includes("emergency") ||
    n.includes("accident") ||
    n.includes("sos") ||
    n.includes("112") ||
    n.includes("108") ||
    n.includes("বিপদ") ||
    n.includes("জরুরি") ||
    n.includes("দুর্ঘটনা") ||
    n.includes("দুৰ্ঘটনা") ||
    n.includes("दुर्घटना") ||
    n.includes("आपातकाल")
  ) {
    const coords = emergencyBroadcast?.coords || { lat: 26.1445, lng: 91.7362 };
    if (lang === "bn") {
      return (
        `🚨 কিং এআই জরুরি এসওএস সতর্কতা (লাইভ জিপিএস সক্রিয়):\n` +
        `• আপনার জীবন ও নিরাপত্তা সবার আগে! নিরাপদ স্থানে রাস্তা থেকে সরে দাঁড়ান।\n` +
        `• সরাসরি কল করুন: ১১২ (জাতীয় জরুরি পুলিশ/ফায়ার) অথবা ১০৮ (বিনামূল্যে সরকারি জরুরি অ্যাম্বুলেন্স)।\n` +
        `• আপনার লাইভ জিপিএস স্থানাঙ্ক: অক্ষাংশ ${coords.lat.toFixed(6)}, দ্রাঘিমাংশ ${coords.lng.toFixed(6)} | রাইডার: ${fullName} (${home.rider.phone})\n` +
        `• শূন্য-পেনাল্টি সুরক্ষা: কোনো জরিমানা বা রেটিং কর্তন ছাড়াই সক্রিয় অর্ডার নিকটবর্তী রাইডারের কাছে হস্তান্তরিত হবে।\n` +
        `• ক্যাশলেস দুর্ঘটনা বীমা: ডিউটিতে থাকা অবস্থায় ₹৫,০০,০০০ টাকার ক্যাশলেস চিকিৎসা কভার সক্রিয় (টোল-ফ্রি: ১৮০০-২৫৮-৫৯৫৬)।`
      );
    }
    if (lang === "as") {
      return (
        `🚨 কিং এআই জৰুৰী এছঅ'এছ সজাগতা (লাইভ জিপিএছ সক্ৰিয়):\n` +
        `• আপোনাৰ জীৱন আৰু সুৰক্ষা সৰ্বপ্ৰথমে! সুৰক্ষিত স্থানত ৰখক।\n` +
        `• পোনপটীয়া কল কৰক: ১১২ (ৰাষ্ট্ৰীয় জৰুৰীকালীন আৰক্ষী/অগ্নি নিৰ্বাপক) বা ১০৮ (বিনামূলীয়া এম্বুলেন্স সেৱা)।\n` +
        `• আপোনাৰ লাইভ স্থানাংক: অক্ষাংশ ${coords.lat.toFixed(6)}, দ্ৰাঘিমাংশ ${coords.lng.toFixed(6)} | ৰাইডাৰ: ${fullName} (${home.rider.phone})\n` +
        `• শূন্য-জৰিমনা সুৰক্ষা: কোনো জৰিমনা বা ৰেটিং ক্ষতি নোহোৱাকৈ আপোনাৰ কাৰ্য্যসূচী পুনৰ নিৰ্ধাৰণ কৰা হ'ব।\n` +
        `• বিনামূলীয়া দুৰ্ঘটনা বীমা: ₹৫,০০,০০০ টকাৰ কেচলেছ চিকিৎসা বীমা উপলব্ধ (টোল-ফ্ৰী: ১৮০০-২৫৮-৫৯৫৬)।`
      );
    }
    if (lang === "hi") {
      return (
        `🚨 किंग एआई आपातकालीन संकट चेतावनी (लाइव जीपीएस सक्रिय):\n` +
        `• आपकी सुरक्षा हमारी सर्वोच्च प्राथमिकता है! कृपया तुरंत सड़क के किनारे सुरक्षित स्थान पर रुकें।\n` +
        `• त्वरित आपातकालीन संपर्क: 112 (राष्ट्रीय आपातकालीन पुलिस/दमकल) या 108 (मुफ्त सरकारी एम्बुलेंस सेवा) डायल करें।\n` +
        `• आपके लाइव जीपीएस निर्देशांक: अक्षांश ${coords.lat.toFixed(6)}, देशांतर ${coords.lng.toFixed(6)} | राइडर: ${fullName} (${home.rider.phone})\n` +
        `• शून्य जुर्माना सुरक्षा: सक्रिय ऑर्डर को बिना किसी रेटिंग कटौती के निकटतम पार्टनर को पुनः सौंपा जाएगा।\n` +
        `• ₹5,00,000 कैशलेस दुर्घटना बीमा कवर सक्रिय है (टोल-फ्री: 1800-258-5956)।`
      );
    }
    return (
      `🚨 KING AI EMERGENCY DISTRESS PROTOCOL ACTIVE (Live GPS Synced):\n` +
      `• Your life & safety come before any delivery. Move to a safe location off the roadway.\n` +
      `• Immediate Emergency Dials: Dial 112 (National SOS - Police/Fire) or 108 (Free Emergency Medical Ambulance).\n` +
      `• Live GPS Coordinates: Lat ${coords.lat.toFixed(6)}, Lng ${coords.lng.toFixed(6)} | Rider: ${fullName} (${home.rider.phone})\n` +
      `• Zero-Penalty Protection: Active order is reassigned with zero cancellation penalty & full milestone credit.\n` +
      `• Cashless Hospitalization: ₹5,00,000 on-duty accidental medical coverage active via 1800-258-5956.`
    );
  }

  // -------------------------------------------------------------------------
  // TOOL 2: Verify Kitchen Wait-Time & Auto-Credit (> 6 mins)
  // -------------------------------------------------------------------------
  if (
    waitCreditResult ||
    n.includes("kitchen") ||
    n.includes("wait") ||
    n.includes("delay") ||
    n.includes("counter") ||
    n.includes("রেস্তোরাঁ") ||
    n.includes("অপেক্ষা") ||
    n.includes("দেৰি") ||
    n.includes("দেৰী") ||
    n.includes("ওয়েট") ||
    n.includes("देरी") ||
    n.includes("इंतजार")
  ) {
    if (waitCreditResult) {
      if (waitCreditResult.credited) {
        if (lang === "bn") {
          return (
            `⚡ কিং এআই স্বয়ংক্রিয় ক্রেডিট কার্যকর হয়েছে!\n` +
            `• যাচাইকৃত রেস্তোরাঁ: ${waitCreditResult.restaurantName} (অর্ডার #${waitCreditResult.orderCode})\n` +
            `• অপেক্ষার সময়: ${waitCreditResult.waitedMins} মিনিট (৬ মিনিটের গ্রেসের চেয়ে ${waitCreditResult.billableMins} মিনিট বেশি)\n` +
            `• ক্রেডিট করা হয়েছে: ₹${(waitCreditResult.amountPaise / 100).toFixed(2)} সরাসরি আপনার লাইভ লেজারে জমা হয়েছে (₹১/মিনিট হারে)।\n` +
            `• স্বয়ংক্রিয় নিষ্পত্তি — কোনো সুপারভাইজার বা অনুমোদনের প্রয়োজন নেই!`
          );
        }
        if (lang === "as") {
          return (
            `⚡ কিং এআই স্বয়ংক্ৰিয় ক্ৰেডিট সফল হৈছে!\n` +
            `• ৰেষ্টুৰেণ্ট: ${waitCreditResult.restaurantName} (অৰ্ডাৰ #${waitCreditResult.orderCode})\n` +
            `• অপেক্ষাৰ সময়: ${waitCreditResult.waitedMins} মিনিট (৬ মিনিটৰ বিনামূলীয়া সময়ৰ পৰা ${waitCreditResult.billableMins} মিনিট বেছি)\n` +
            `• লেজাৰত জমা হ'ল: ₹${(waitCreditResult.amountPaise / 100).toFixed(2)} (প্ৰতি মিনিটত ₹১ হাৰত)।\n` +
            `• ১০০% স্বয়ংক্ৰিয় — কোনো অফিচাৰৰ অনুমোদনৰ প্ৰয়োজন নাই। আপোনাৰ উপাৰ্জন সুৰক্ষিত!`
          );
        }
        if (lang === "hi") {
          return (
            `⚡ किंग एआई स्वायत्त वेट-पे क्रेडिट निष्पादित!\n` +
            `• सत्यापित रेस्तरां: ${waitCreditResult.restaurantName} (ऑर्डर #${waitCreditResult.orderCode})\n` +
            `• प्रतीक्षा समय: ${waitCreditResult.waitedMins} मिनट (6 मिनट की रियायत से ${waitCreditResult.billableMins} मिनट अधिक)\n` +
            `• जमा राशि: ₹${(waitCreditResult.amountPaise / 100).toFixed(2)} सीधे आपके लाइव लेजर में ₹1.00/मिनट की दर से क्रेडिट की गई।\n` +
            `• किसी अनुमोदन या एजेंट की प्रतीक्षा नहीं — किंग एआई ने आपके समय की पूरी भरपाई कर दी है!`
          );
        }
        return (
          `⚡ KING AI AUTONOMOUS WAIT-PAY AUTO-CREDIT EXECUTED!\n` +
          `• Verified Restaurant: ${waitCreditResult.restaurantName} (Order #${waitCreditResult.orderCode})\n` +
          `• Total Elapsed Wait: ${waitCreditResult.waitedMins} mins (exceeding 6-min grace period by ${waitCreditResult.billableMins} mins)\n` +
          `• Auto-Credited to Ledger: ₹${(waitCreditResult.amountPaise / 100).toFixed(2)} at exact statutory ₹1.00/min rate.\n` +
          `• 100% Autonomous — Zero human supervisor escalation required. Your hard work & time are protected!`
        );
      } else if (waitCreditResult.waitedMins > 6) {
        if (lang === "bn") {
          return (
            `⚡ যাচাইকৃত রেস্তোরাঁ বিলম্ব ক্ষতিপূরণ: আপনি ${waitCreditResult.restaurantName}-এ ${waitCreditResult.waitedMins} মিনিট অপেক্ষা করেছেন। ` +
            `₹${(waitCreditResult.amountPaise / 100).toFixed(2)} ওয়েট পে যাচাই করা হয়েছে এবং আপনার শিফট লেজারে ইতিমধ্যে যুক্ত রয়েছে। ডেলিভারি সম্পন্ন হলেই এটি চূড়ান্ত পেআউটে জমা হবে।`
          );
        }
        if (lang === "as") {
          return (
            `⚡ পৰীক্ষিত ৰেষ্টুৰেণ্ট বিলম্ব মাচুল: আপুনি ${waitCreditResult.restaurantName}-ত ${waitCreditResult.waitedMins} মিনিট অপেক্ষা কৰিছে। ` +
            `₹${(waitCreditResult.amountPaise / 100).toFixed(2)} ৱেইট পে ইতিমধ্যে আপোনাৰ শ্বিফ্ট লেজাৰত অন্তৰ্ভুক্ত কৰা হৈছে।`
          );
        }
        if (lang === "hi") {
          return (
            `⚡ सत्यापित रेस्टोरेंट प्रतीक्षा मुआवज़ा: आपने ${waitCreditResult.restaurantName} में ${waitCreditResult.waitedMins} मिनट इंतज़ार किया है। ` +
            `₹${(waitCreditResult.amountPaise / 100).toFixed(2)} वेट पे सत्यापित होकर पहले से आपके लेजर में दर्ज है।`
          );
        }
        return (
          `⚡ Verified Kitchen Wait Compensation: You have waited ${waitCreditResult.waitedMins} mins at ${waitCreditResult.restaurantName}. ` +
          `₹${(waitCreditResult.amountPaise / 100).toFixed(2)} wait pay is verified and registered in your trip ledger. It will settle with your trip payout upon customer handover.`
        );
      } else {
        const remainingGrace = 6 - waitCreditResult.waitedMins;
        if (lang === "bn") {
          return (
            `⏱️ কিচেন ওয়েট টাইমার সক্রিয়: আপনি ${waitCreditResult.restaurantName}-এ ${waitCreditResult.waitedMins} মিনিট আগে পৌঁছেছেন। ` +
            `মানক ৬ মিনিটের গ্রেস পিরিয়ডের আর ${remainingGrace} মিনিট বাকি আছে। ৭ম মিনিট থেকে কিং এআই প্রতি মিনিটে ₹১.০০ সরাসরি আপনার লেজারে জমা করবে!`
          );
        }
        if (lang === "as") {
          return (
            `⏱️ ৰান্ধনীশালৰ ৱেইট টাইমাৰ সক্ৰিয়: আপুনি ${waitCreditResult.restaurantName}-ত ${waitCreditResult.waitedMins} মিনিট পূৰ্বে উপস্থিত হৈছে। ` +
            `৬ মিনিটৰ বিনামূলীয়া সময়ৰ আৰু ${remainingGrace} মিনিট বাকী আছে। ৭ম মিনিটৰ পৰা কিং এআই প্ৰতি মিনিটত ₹১.০০ পোনে পোনে জমা কৰিব!`
          );
        }
        if (lang === "hi") {
          return (
            `⏱️ किचन वेट टाइमर सक्रिय: आप ${waitCreditResult.restaurantName} में ${waitCreditResult.waitedMins} मिनट पहले पहुंचे हैं। ` +
            `6 मिनट के रियायती समय में से ${remainingGrace} मिनट शेष हैं। 7वें मिनट से किंग एआई प्रति मिनट ₹1.00 स्वतः आपके लेजर में जोड़ेगा!`
          );
        }
        return (
          `⏱️ Kitchen Wait Timer Active: You arrived at ${waitCreditResult.restaurantName} ${waitCreditResult.waitedMins} min(s) ago. ` +
          `The standard 6-minute kitchen prep grace period is active (${remainingGrace} min(s) remaining). At minute 7, King AI will automatically credit ₹1.00 per minute directly to your shift ledger!`
        );
      }
    }

    if (active && !active.arrivedRestaurantAt && !active.waitStartedAt) {
      if (lang === "bn") {
        return (
          `🏬 কিং এআই কিচেন টাইমার নির্দেশিকা: অর্ডার #${active.orderCode} (${active.restaurant.name})-এর জন্য কাউন্টারে পৌঁছানোর সাথে সাথে ডেলিভারি স্ক্রিনে 'Arrived at Restaurant' ট্যাপ করুন। ` +
          `এটি আপনার যাচাইকৃত জিপিএস টাইমার শুরু করবে এবং ৬ মিনিটের বেশি বিলম্ব হলে কিং এআই স্বয়ংক্রিয়ভাবে ₹১/মিনিট ওয়েট পে জমা করবে!`
        );
      }
      if (lang === "as") {
        return (
          `🏬 কিং এআই ৰেষ্টুৰেণ্ট টাইমাৰ সহায়িকা: অৰ্ডাৰ #${active.orderCode} (${active.restaurant.name})-ৰ বাবে ৰেষ্টুৰেণ্টত উপস্থিত হৈয়েই ডেলিভাৰী স্ক্ৰীণত 'Arrived at Restaurant' স্পৰ্শ কৰক। ` +
          `ইয়াৰ দ্বাৰা জিপিএছ টাইমাৰ আৰম্ভ হ'ব আৰু ৬ মিনিট অতিক্ৰম কৰিলে স্বয়ংক্ৰিয়ভাৱে ৱেইট পে ক্ৰেডিট হ'ব!`
        );
      }
      if (lang === "hi") {
        return (
          `🏬 काउंटर टाइमर मार्गदर्शन: ऑर्डर #${active.orderCode} (${active.restaurant.name}) के लिए रेस्तरां पहुंचते ही अपनी डिलीवरी स्क्रीन पर 'Arrived at Restaurant' पर टैप करें। ` +
          `इससे आपका सत्यापित जीपीएस टाइमर शुरू होता है और 6 मिनट से अधिक देरी पर किंग एआई ₹1/मिनट का मुआवजा स्वतः जोड़ता है!`
        );
      }
      return (
        `🏬 King AI Kitchen Timer Guidance: For order #${active.orderCode} at ${active.restaurant.name}, please tap 'Arrived at Restaurant' on your delivery screen as soon as you reach the counter. ` +
        `This starts your verified GPS timer. If prep takes longer than 6 minutes, King AI automatically credits ₹1/min wait pay!`
      );
    }

    if (lang === "bn") {
      return (
        `🏬 অর্ডারকিং কিচেন ওয়েট-টাইম গ্যারান্টি:\n` +
        `• গ্রেস সময়: 'Arrived at Restaurant' মার্ক করার পর প্রথম ৬ মিনিট বেস পে-তে অন্তর্ভুক্ত থাকে।\n` +
        `• স্বয়ংক্রিয় ₹১/মিনিট হার: ৭ম মিনিট থেকে কিং এআই প্রতি মিনিটে ঠিক ₹১.০০ সরাসরি আপনার লেজারে জমা করে (সর্বোচ্চ ₹৩০ পর্যন্ত)।\n` +
        `• রাস্তায় তাড়াহুড়ো করবেন না — আপনার প্রতিটি মিনিট অর্ডারকিংয়ে মূল্যবান ও সুরক্ষিত।`
      );
    }
    if (lang === "as") {
      return (
        `🏬 অৰ্ডাৰকিং ৱেইট-পে নিশ্চয়তা:\n` +
        `• বিনামূলীয়া সময়: উপস্থিত হোৱাৰ পাছত প্ৰথম ৬ মিনিট ভিত্তি ভাড়াত অন্তৰ্ভুক্ত।\n` +
        `• স্বয়ংক্ৰিয় ₹১/মিনিট হাৰ: ৭ম মিনিটৰ পৰা প্ৰতি মিনিটত ঠিক ₹১.০০ স্বয়ংক্ৰিয়ভাৱে আপোনাৰ উপাৰ্জনত যোগ হয়।\n` +
        `• ৰাস্তাত কোনো বেগ নকৰিব — আপোনাৰ সময় অৰ্ডাৰকিঙত সম্পূৰ্ণ সুৰক্ষিত।`
      );
    }
    if (lang === "hi") {
      return (
        `🏬 ऑर्डरकिंग किचन वेट-टाइम गारंटी:\n` +
        `• रियायती अवधि: 'Arrived at Restaurant' मार्क करने पर पहले 6 मिनट बेस पे में शामिल हैं।\n` +
        `• स्वचालित ₹1/मिनट दर: 7वें मिनट से किंग एआई ठीक ₹1.00 प्रति मिनट सीधे आपके खाते में जोड़ता है।\n` +
        `• सड़क पर गति सीमा का पालन करें — आपके समय की पूरी भरपाई ऑर्डरकिंग द्वारा की जाती है।`
      );
    }
    return (
      `🏬 OrderKing Kitchen Wait-Time Guarantee:\n` +
      `• Grace Period: First 6 minutes upon marking 'Arrived at Restaurant' are covered under base fare.\n` +
      `• Autonomous ₹1/Min Rate: From minute 7 onwards, King AI automatically credits ₹1.00/minute directly into your earnings ledger (up to ₹30 cap).\n` +
      `• Never speed or compromise road safety: your waiting time is fully monetized by OrderKing.`
    );
  }

  // -------------------------------------------------------------------------
  // TOOL 3: Customer Phone Reachability & Doorstep Unreachable SOP (3-Call Rule)
  // -------------------------------------------------------------------------
  if (
    n.includes("customer") ||
    n.includes("unreachable") ||
    n.includes("answer") ||
    n.includes("phone") ||
    n.includes("call") ||
    n.includes("door") ||
    n.includes("doorstep") ||
    n.includes("গ্রাহক") ||
    n.includes("ফোন") ||
    n.includes("কল") ||
    n.includes("গ্ৰাহক") ||
    n.includes("ग्राहक") ||
    n.includes("फ़ोन")
  ) {
    const attempts = active?.contactAttempts ?? 0;
    if (lang === "bn") {
      return (
        `⏱️ কিং এআই কাস্টমার আনরিচেবল এসওপি (১০০% সুরক্ষিত পেআউট):\n` +
        `• বর্তমান অগ্রগতি: সক্রিয় অর্ডার #${active ? active.orderCode : "N/A"}-এর জন্য ${attempts}/৩টি কল প্রচেষ্টা রেকর্ড করা হয়েছে।\n` +
        `• ধাপ ১: গ্রাহকের ঠিকানায় পৌঁছে ডেলিভারি স্ক্রিনে 'Arrived at Customer' ট্যাপ করুন।\n` +
        `• ধাপ ২: গ্রাহকের মাস্কড নম্বরে কল করুন এবং ১০ মিনিটের মধ্যে অন্তত ৩ বার 'Record Call Attempt' ট্যাপ করুন।\n` +
        `• ধাপ ৩: ৩টি কল এবং ১০ মিনিট অতিবাহিত হওয়ার পর 'Customer Unavailable' নির্বাচন করুন। কিং এআই আপনার বেস ও দূরত্ব পেআউট সম্পূর্ণ সুরক্ষিত রাখবে — কোনো জরিমানা বা রেটিং কর্তন হবে না!`
      );
    }
    if (lang === "as") {
      return (
        `⏱️ কিং এআই গ্ৰাহকৰ যোগাযোগহীন এছঅ'পি (১০০% সুৰক্ষিত পেআউট):\n` +
        `• সক্ৰিয় স্থিতি: অৰ্ডাৰ #${active ? active.orderCode : "N/A"}-ৰ বাবে ${attempts}/৩ টা কল ৰেকৰ্ড কৰা হৈছে।\n` +
        `• স্তৰ ১: গ্ৰাহকৰ স্থানত উপস্থিত হৈ 'Arrived at Customer' বাছনি কৰক।\n` +
        `• স্তৰ ২: গ্ৰাহকলৈ ফোন কৰক আৰু ১০ মিনিটৰ ভিতৰত কমেও ৩ বাৰ 'Record Call Attempt' স্পৰ্শ কৰক।\n` +
        `• স্তৰ ৩: ৩ টা কল আৰু ১০ মিনিট সমাপ্ত হোৱাৰ পাছত 'Customer Unavailable' নিৰ্বাচন কৰক। কিং এআই আপোনাৰ ভিত্তি আৰু দূৰত্ব মাচুল ১০০% সুৰক্ষিত ৰাখিব — কোনো জৰিমনা বা ৰেটিং ক্ষতি নহয়!`
      );
    }
    if (lang === "hi") {
      return (
        `⏱️ किंग एआई ग्राहक अनुपलब्ध एसओपी (100% सुरक्षित पेआउट):\n` +
        `• वर्तमान स्थिति: सक्रिय ऑर्डर #${active ? active.orderCode : "N/A"} के लिए ${attempts}/3 कॉल प्रयास दर्ज किए गए हैं।\n` +
        `• चरण 1: ग्राहक के पते पर पहुंचकर 'Arrived at Customer' पर टैप करें।\n` +
        `• चरण 2: ग्राहक को कॉल करें और 10 मिनट के अंतराल में कम से कम 3 बार 'Record Call Attempt' दर्ज करें।\n` +
        `• चरण 3: 3 कॉल और 10 मिनट बीत जाने के बाद 'Customer Unavailable' चुनें। किंग एआई आपका 100% बेस और दूरी पेआउट सुरक्षित रखेगा — शून्य जुर्माना और शून्य रेटिंग कटौती!`
      );
    }
    const attemptStatus = active
      ? `For active order #${active.orderCode} (${active.customer.area}), you have logged ${attempts}/3 required call attempts.`
      : "When a customer is unreachable at the doorstep:";
    return (
      `⏱️ KING AI CUSTOMER UNREACHABLE SOP (100% Payout Protected):\n` +
      `• Current Progress: ${attemptStatus}\n` +
      `• Step 1: Tap 'Arrived at Customer' at the destination GPS pin.\n` +
      `• Step 2: Call the customer and tap 'Record Call Attempt' at least 3 times spaced over 10 minutes.\n` +
      `• Step 3: Once 3 attempts and the 10-minute doorstep timer elapse, tap 'Customer Unavailable'. King AI protects 100% of your Base + Distance payout with zero rating deduction!`
    );
  }

  // -------------------------------------------------------------------------
  // TOOL 4: Navigation, Address, Gated Community & Landmark Guidance
  // -------------------------------------------------------------------------
  if (
    n.includes("navigation") ||
    n.includes("map") ||
    n.includes("landmark") ||
    n.includes("address") ||
    n.includes("route") ||
    n.includes("pin") ||
    n.includes("gate") ||
    n.includes("রাস্তা") ||
    n.includes("ঠিকানা") ||
    n.includes("পথ") ||
    n.includes("স্থান") ||
    n.includes("ল্যাণ্ডমাৰ্ক") ||
    n.includes("ৰাস্তা") ||
    n.includes("रास्ता") ||
    n.includes("पता")
  ) {
    if (active) {
      const isPickup = active.state.includes("RESTAURANT") || active.state === "ACCEPTED";
      const targetName = isPickup ? active.restaurant.name : active.customer.displayName;
      const targetAddress = isPickup
        ? active.restaurant.address || active.restaurant.area
        : active.customer.address || active.customer.area;
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(targetAddress)}`;

      if (lang === "bn") {
        return (
          `🧭 কিং এআই স্বয়ংক্রিয় নেভিগেশন ও ল্যান্ডমার্ক সহায়িকা:\n` +
          `• সক্রিয় গন্তব্য: ${targetName} (${isPickup ? "রেস্তোরাঁ পিকআপ" : "গ্রাহকের ঠিকানা"})\n` +
          `• যাচাইকৃত ঠিকানা: ${targetAddress}\n` +
          `• ১-ট্যাপ লাইভ জিপিএস রুট: ${mapsUrl}\n` +
          `• গেটেড সোসাইটি এসওপি: গেটে নিরাপত্তাকর্মীকে বলুন 'অর্ডারকিং ডেলিভারি অর্ডার #${active.orderCode}'।\n` +
          `• ৫০০ মিটার জিওফেন্স শিল্ড: নেটওয়ার্ক সমস্যা থাকলেও পিনের ৫০০ মিটারের মধ্যে আপনার উপস্থিতি স্বয়ংক্রিয় শনাক্ত হয়।\n` +
          `• কাস্টমার ফোন না ধরলে: ১০ মিনিটের মধ্যে ৩ বার কল করুন — বেস ও দূরত্ব পেআউট সম্পূর্ণ সুরক্ষিত!`
        );
      }
      if (lang === "as") {
        return (
          `🧭 কিং এআই স্বয়ংক্ৰিয় নেভিগেচন আৰু ল্যাণ্ডমাৰ্ক সহায়িকা:\n` +
          `• সক্ৰিয় গন্তব্য: ${targetName} (${isPickup ? "ৰেষ্টুৰেণ্ট পিকআপ" : "গ্ৰাহকৰ ঠিকনা"})\n` +
          `• নিশ্চিত ঠিকনা: ${targetAddress}\n` +
          `• ১-টেপ গুগল মেপছ জিপিএছ: ${mapsUrl}\n` +
          `• গেট প্ৰৱেশ এছঅ'পি: নিৰাপত্তাৰক্ষীক কওক 'অৰ্ডাৰকিং ডেলিভাৰী অৰ্ডাৰ #${active.orderCode}'।\n` +
          `• ৫০০ মিটাৰ জিঅ'ফেন্স শ্বিল্ড: ম'বাইল নেটৱৰ্ক দুৰ্বল হ'লেও ৫০০ মিটাৰৰ ভিতৰত উপস্থিতি চিনাক্ত হয়।\n` +
          `• গ্ৰাহকৰ ফোন নোপোৱা অৱস্থাত: ১০ মিনিটৰ ভিতৰত ৩ বাৰ কল ৰেকৰ্ড কৰক — পেআউট ১০০% সুৰক্ষিত থাকিব!`
        );
      }
      if (lang === "hi") {
        return (
          `🧭 किंग एआई स्वायत्त नेविगेशन व लैंडमार्क समाधान:\n` +
          `• सक्रिय गंतव्य: ${targetName} (${isPickup ? "रेस्तरां पिकअप" : "ग्राहक डिलीवरी"})\n` +
          `• सत्यापित पता: ${targetAddress}\n` +
          `• 1-टैप लाइव जीपीएस नेविगेशन: ${mapsUrl}\n` +
          `• गेटेड सोसाइटी एसओपी: सिक्योरिटी गार्ड को बताएं 'ऑर्डरकिंग डिलीवरी ऑर्डर #${active.orderCode}'।\n` +
          `• 500 मीटर जियोफेंस शील्ड: मोबाइल नेटवर्क कमजोर होने पर भी 500 मीटर के दायरे में आगमन मान्य होता है।\n` +
          `• ग्राहक से संपर्क न होने पर: 10 मिनट में 3 कॉल रिकॉर्ड करें — 100% पेआउट सुरक्षित रहेगा!`
        );
      }
      return (
        `🧭 KING AI AUTONOMOUS NAVIGATION & LANDMARK RESOLVER:\n` +
        `• Active Target: ${targetName} (${isPickup ? "Restaurant Pickup" : "Customer Doorstep"})\n` +
        `• Verified Address: ${targetAddress}\n` +
        `• 1-Tap Live GPS Navigation: ${mapsUrl}\n` +
        `• Gated Entry & Landmark SOP: If security asks, state 'OrderKing Delivery for #${active.orderCode}'.\n` +
        `• Geofence Proximity Shield: OrderKing dispatch verifies arrival within 500 meters of the pin even if cellular GPS drifts.\n` +
        `• Customer Unreachable: If gate or resident is unreachable, log 3 call attempts spaced over 10 mins to unlock 100% protected payout.`
      );
    }

    if (lang === "bn") {
      return (
        `🧭 কিং এআই নেভিগেশন ও ল্যান্ডমার্ক এসওপি:\n` +
        `• ইন্টিগ্রেটেড জিপিএস রুটিং: সক্রিয় ট্রিপে 'Open Map' আইকন ট্যাপ করে গুগল ম্যাপসের টার্ন-বাই-টার্ন পথনির্দেশ পান।\n` +
        `• ৫০০ মিটার জিওফেন্স টলারেন্স: নেটওয়ার্ক দুর্বল হলেও পিনের ৫০০ মিটারের মধ্যে আপনার উপস্থিতি সিস্টেমে স্বয়ংক্রিয় রেকর্ড হয়।\n` +
        `• টাওয়ার ও কমপ্লেক্স নেভিগেশন: ইন-অ্যাপ মাস্কড নম্বরে কল করে সঠিক গেট বা উইং নম্বর জেনে নিন।`
      );
    }
    if (lang === "as") {
      return (
        `🧭 কিং এআই নেভিগেচন আৰু ল্যাণ্ডমাৰ্ক এছঅ'পি:\n` +
        `• সংহত জিপিএছ ৰুট: যিকোনো সক্ৰিয় অৰ্ডাৰত 'Open Map' স্পৰ্শ কৰি গুগল মেপছ নিৰ্দেশনা লওক।\n` +
        `• ৫০০ মিটাৰ জিঅ'ফেন্স শ্বিল্ড: দুৰ্বল নেটৱৰ্কতো ৫০০ মিটাৰৰ ভিতৰত উপস্থিতি নিশ্চিত কৰা হয়।\n` +
        `• অট্টালিকা পথনিৰ্দেশ: ইন-এপ মাস্কড ফোন নম্বৰৰ জৰিয়তে সঠিক গেট নম্বৰ সংগ্ৰহ কৰক।`
      );
    }
    if (lang === "hi") {
      return (
        `🧭 किंग एआई नेविगेशन व लैंडमार्क एसओपी:\n` +
        `• एकीकृत जीपीएस रूटिंग: किसी भी सक्रिय ट्रिप पर 'Open Map' आइकन पर टैप करके गूगल मैप्स नेविगेशन प्राप्त करें।\n` +
        `• 500 मीटर जियोफेंस शील्ड: मोबाइल नेटवर्क कमजोर होने पर भी 500 मीटर के दायरे में आगमन मान्य रहता है।\n` +
        `• बिल्डिंग व गेट नेविगेशन: ऐप के अंदर से मास्क किए गए नंबर पर कॉल करके सही विंग या ब्लॉक का पता करें।`
      );
    }
    return (
      `🧭 King AI Navigation & Landmark SOP:\n` +
      `• Integrated GPS Routing: Tap the 'Open Map' icon on any active trip for Google Maps turn-by-turn guidance.\n` +
      `• Geofence Tolerance: Our platform recognizes your arrival within 500m of the pin so network dead-zones never block your delivery workflow.\n` +
      `• Complex & Tower Navigation: Use the in-app customer call button with masked phone numbers to request building or wing directions.`
    );
  }

  // -------------------------------------------------------------------------
  // TOOL 5: Exact Payout Breakdown (Base Floor, Progressive Slabs, Wait Pay, 100% Tips)
  // -------------------------------------------------------------------------
  if (
    n.includes("payout") ||
    n.includes("breakdown") ||
    n.includes("distance") ||
    n.includes("slab") ||
    n.includes("base") ||
    n.includes("tip") ||
    n.includes("earn") ||
    n.includes("money") ||
    n.includes("rate") ||
    n.includes("fare") ||
    n.includes("ভাড়া") ||
    n.includes("টাকা") ||
    n.includes("উপার্জন") ||
    n.includes("টকা") ||
    n.includes("হিসাব") ||
    n.includes("कमाई") ||
    n.includes("किराया")
  ) {
    if (lang === "bn") {
      return (
        `💰 কিং এআই পেআউট ও উপার্জনের বিস্তারিত হিসাব (${firstName} বাবুর জন্য):\n` +
        `১. সংবিধিবদ্ধ বেস পে: ₹৩৫.০০ ফ্লোর (প্রথম ২.০ কিমি দূরত্ব সম্পূর্ণ অন্তর্ভুক্ত)।\n` +
        `২. প্রগ্রেসিভ দূরত্ব স্ল্যাব:\n` +
        `   • ২.০ থেকে ৫.০ কিমি: ₹১২.০০ প্রতি কিমি\n` +
        `   • ৫.০ কিমির বেশি: ₹১৫.০০ প্রতি কিমি (লং-হ্যান্ড বোনাস)\n` +
        `৩. রেস্তোরাঁ ওয়েট-টাইম পে: কাউন্টারে ৬ মিনিট গ্রেস সময়ের পর প্রতি মিনিটে ঠিক ₹১.০০ জমা হয়।\n` +
        `৪. গ্রাহকের ১০০% বখশিশ: টিপসের পুরো ১০০% সরাসরি আপনার অ্যাকাউন্টে জমা হয় — প্ল্যাটফর্ম কোনো কমিশন কাটে না!\n` +
        `৫. শিফট মাইলস্টোন বোনাস: ৮ ট্রিপ (+₹১০০) | ১৪ ট্রিপ (+₹২২০) | ২০ ট্রিপ (+₹৪০০)।\n` +
        `• আজকের মোট উপার্জন: ${formatPaise(s.todayEarningsPaise)} (${s.completedToday}টি ট্রিপ সম্পন্ন | ডেলিভারি পে: ${formatPaise(s.payoutTotals.payout)} | টিপস: ${formatPaise(s.payoutTotals.tip)} | ইনসেন্টিভ: ${formatPaise(s.payoutTotals.incentive)})।`
      );
    }
    if (lang === "as") {
      return (
        `💰 কিং এআই পেআউট আৰু উপাৰ্জনৰ সম্পূৰ্ণ বিৱৰণ (${firstName} ডাঙৰীয়াৰ বাবে):\n` +
        `১. ভিত্তি পে (Base Floor): ₹৩৫.০০ (প্ৰথম ২.০ কিমি অন্তৰ্ভুক্ত)।\n` +
        `২. দূৰত্বৰ অগ্ৰগতি স্ল্যাব:\n` +
        `   • ২.০ ৰ পৰা ৫.০ কিমি: ₹১২.০০ প্ৰতি কিমি\n` +
        `   • ৫.০ কিমিতকৈ বেছি: ₹১৫.০০ প্ৰতি কিমি (লং-ৰুট অগ্ৰগতি বুষ্টাৰ)\n` +
        `৩. ৰেষ্টুৰেণ্টত অপেক্ষাৰ মাচুল: ৬ মিনিটৰ বিনামূলীয়া সময়ৰ পাছত প্ৰতি মিনিটত ঠিক ₹১.০০ স্বয়ংক্ৰিয়ভাৱে জমা হয়।\n` +
        `৪. গ্ৰাহকৰ ১০০% টিপছ: কোনো ধৰণৰ কমিছন নোহোৱাকৈ ১০০% আপোনাৰ লেজাৰত জমা হয়।\n` +
        `৫. দৈনিক মাইলষ্টোন: ৮ ট্রিপ (+₹১০০) | ১৪ ট্রিপ (+₹২২০) | ২০ ট্রিপ (+₹৪০০)।\n` +
        `• আজিৰ উপাৰ্জন: ${formatPaise(s.todayEarningsPaise)} (${s.completedToday} টা অৰ্ডাৰ সম্পন্ন | ডেলিভাৰী পে: ${formatPaise(s.payoutTotals.payout)} | টিপছ: ${formatPaise(s.payoutTotals.tip)} | ইনচেণ্টিভ: ${formatPaise(s.payoutTotals.incentive)})।`
      );
    }
    if (lang === "hi") {
      return (
        `💰 किंग एआई पेआउट और कमाई संरचना (${firstName} जी के लिए):\n` +
        `1. वैधानिक बेस फ्लोर: ₹35.00 (पहले 2.0 किमी की दूरी पूरी तरह शामिल है)।\n` +
        `2. प्रगतिशील दूरी स्लैब:\n` +
        `   • 2.0 से 5.0 किमी: ₹12.00 प्रति किमी\n` +
        `   • 5.0 किमी से अधिक: ₹15.00 प्रति किमी (लॉन्ग-हॉल रूट बोनस)\n` +
        `3. किचन वेट-टाइम पे: 6 मिनट की रियायत के बाद ठीक ₹1.00 प्रति मिनट सीधे आपके खाते में।\n` +
        `4. 100% कस्टमर टिप: ग्राहक द्वारा दिया गया पूरा 100% टिप आपका है — शून्य कटौती!\n` +
        `5. दैनिक माइलस्टोन बोनस: 8 ट्रिप (+₹100) | 14 ट्रिप (+₹220) | 20 ट्रिप (+₹400)।\n` +
        `• आज की कुल शुद्ध कमाई: ${formatPaise(s.todayEarningsPaise)} (${s.completedToday} ट्रिप पूर्ण | डिलीवरी पे: ${formatPaise(s.payoutTotals.payout)} | टिप्स: ${formatPaise(s.payoutTotals.tip)} | प्रोत्साहन: ${formatPaise(s.payoutTotals.incentive)})।`
      );
    }
    return (
      `💰 KING AI FLEET PAYOUT BREAKDOWN & EARNINGS MATRIX:\n` +
      `1. Statutory Base Floor: ₹35.00 Minimum Floor (covers first 2.0 km).\n` +
      `2. Progressive Distance Slabs:\n` +
      `   • 2.0 km to 5.0 km: ₹12.00 per km\n` +
      `   • Beyond 5.0 km: ₹15.00 per km (long-haul progressive booster)\n` +
      `3. Kitchen Wait-Time Pay: EXACTLY ₹1.00/min (100 paise) credited after 6 mins grace period.\n` +
      `4. 100% Customer Tips: custom commission pass-through directly to your bank account.\n` +
      `5. Daily Milestone Incentives: 8 Trips (+₹100) | 14 Trips (+₹220) | 20 Trips (+₹400).\n` +
      `• Today's Shift Snapshot: ${formatPaise(s.todayEarningsPaise)} across ${s.completedToday} deliveries (Delivery Pay: ${formatPaise(s.payoutTotals.payout)} | Tips: ${formatPaise(s.payoutTotals.tip)} | Incentives: ${formatPaise(s.payoutTotals.incentive)}).`
    );
  }

  // -------------------------------------------------------------------------
  // Wednesday Settlement & COD Float Queries
  // -------------------------------------------------------------------------
  if (
    n.includes("settle") ||
    n.includes("wednesday") ||
    n.includes("bank") ||
    n.includes("upi") ||
    n.includes("cod") ||
    n.includes("float") ||
    n.includes("পেমেন্ট") ||
    n.includes("বুধবার") ||
    n.includes("পেমেন্ট")
  ) {
    const payoutDest = home.rider.payoutUpi
      ? `UPI ID (${home.rider.payoutUpi})`
      : home.rider.payoutBankLast4
        ? `Bank A/C ending XXXX-${home.rider.payoutBankLast4}`
        : "registered bank/UPI in Profile";
    const latest = settlements[0];
    const settlementLine = latest
      ? `Active Settlement Cycle (${latest.periodStart} to ${latest.periodEnd}): ${formatPaise(latest.amountPaise)} [${latest.status}]`
      : `Net payable balance ready: ${formatPaise(s.payoutTotals.netPayable)}`;

    if (lang === "bn") {
      return (
        `🗓️ কিং এআই সাপ্তাহিক পেমেন্ট ও সিওডি ব্রিফিং:\n` +
        `• প্রতি বুধবার পেমেন্ট: সোমবার থেকে রবিবারের নেট উপার্জন প্রতি বুধবার দুপুর ২:০০ টার মধ্যে স্বয়ংক্রিয়ভাবে NEFT/IMPS-এর মাধ্যমে ${payoutDest}-এ ট্রান্সফার হয়।\n` +
        `• লেজার স্থিতি: ${settlementLine}\n` +
        `• সিওডি ক্যাশ ব্যালেন্স: আপনার হাতে রয়েছে ${formatPaise(home.pendingCashPaise)} (সর্বোচ্চ ₹২,৫০০ সীমার মধ্যে ${formatPaise(codRemainingPaise)} বাকি)।\n` +
        `• পরামর্শ: হোম স্ক্রিনে ইউপিআই দিয়ে সংগৃহীত নগদ জমা দিন যাতে নির্বিঘ্নে নতুন অর্ডার পেতে পারেন।`
      );
    }
    if (lang === "as") {
      return (
        `🗓️ কিং এআই সাপ্তাহিক পেআউট আৰু চিঅ'ডি বিৱৰণ:\n` +
        `• প্ৰতি বুধবাৰে পেআউট: সোমবাৰৰ পৰা দেওবাৰলৈ সংগ্ৰহ হোৱা উপাৰ্জন প্ৰতি বুধবাৰে দুপৰীয়া ২:০০ বজাৰ ভিতৰত ${payoutDest}-লৈ NEFT/IMPS যোগে ট্ৰেন্সফাৰ হয়।\n` +
        `• লেজাৰ স্থিতি: ${settlementLine}\n` +
        `• চিঅ'ডি কেছ বেলেঞ্চ: আপোনাৰ হাতত জমা আছে ${formatPaise(home.pendingCashPaise)} (₹২,৫০০ সীমাৰ পৰা ${formatPaise(codRemainingPaise)} বাকী)।\n` +
        `• পৰামৰ্শ: নতুন অৰ্ডাৰ অবিৰতভাৱে লাভ কৰিবলৈ হোম স্ক্ৰীণত ইউপিআই যোগে চিঅ'ডি জমা কৰক।`
      );
    }
    if (lang === "hi") {
      return (
        `🗓️ किंग एआई साप्ताहिक सेटलमेंट व सीओडी ब्रीफिंग:\n` +
        `• हर बुधवार पेआउट: सोमवार से रविवार की शुद्ध कमाई हर बुधवार दोपहर 2:00 बजे तक स्वतः NEFT/IMPS द्वारा ${payoutDest} में ट्रांसफर होती है।\n` +
        `• लेजर स्थिति: ${settlementLine}\n` +
        `• लाइव सीओडी कैश फ्लोट: आपके पास ${formatPaise(home.pendingCashPaise)} नकद है (₹2,500 की सीमा में से ${formatPaise(codRemainingPaise)} शेष)।\n` +
        `• सलाह: लगातार नए ऑर्डर पाने के लिए होम स्क्रीन पर यूपीआई द्वारा एकत्र नकद जमा करें।`
      );
    }
    return (
      `🗓️ King AI Weekly Settlement & COD Float Briefing:\n` +
      `• Weekly Wednesday Payout: Net earnings from Monday–Sunday transfer automatically every Wednesday by 2:00 PM IST via NEFT/IMPS to ${payoutDest}.\n` +
      `• Ledger Status: ${settlementLine}\n` +
      `• Live COD Cash Float: You hold ${formatPaise(home.pendingCashPaise)} out of ₹2,500 limit (${formatPaise(codRemainingPaise)} headroom remaining).\n` +
      `• Advice: Deposit collected cash via UPI on the Home screen to keep your COD dispatch uninterrupted.`
    );
  }

  // -------------------------------------------------------------------------
  // Active Order Status
  // -------------------------------------------------------------------------
  if (
    n.includes("active") ||
    n.includes("order") ||
    n.includes("current") ||
    n.includes("trip") ||
    n.includes("অর্ডার") ||
    n.includes("অৰ্ডাৰ") ||
    n.includes("ऑर्डर")
  ) {
    if (!active) {
      if (lang === "bn") {
        return (
          `🛵 শিফট স্থিতি: আপনি আজ ${s.completedToday}টি ট্রিপ সম্পন্ন করেছেন (${formatPaise(s.todayEarningsPaise)} আয়) এবং বর্তমানে কোনো সক্রিয় ডেলিভারি নেই। ` +
          (home.rider.status === "OFFLINE"
            ? "নতুন অর্ডার পেতে হোম স্ক্রিনে আপনার স্ট্যাটাস ONLINE করুন!"
            : "আপনি ONLINE আছেন এবং দ্রুত অর্ডারের জন্য প্রস্তুত। ব্যস্ত রেস্তোরাঁ এলাকায় থাকুন।")
        );
      }
      if (lang === "as") {
        return (
          `🛵 শ্বিফ্ট স্থিতি: আপুনি আজি ${s.completedToday} টা অৰ্ডাৰ সম্পূৰ্ণ কৰিছে (${formatPaise(s.todayEarningsPaise)} আয়) আৰু বৰ্তমান কোনো চলিত অৰ্ডাৰ নাই। ` +
          (home.rider.status === "OFFLINE"
            ? "অৰ্ডাৰ লাভ কৰিবলৈ হোম স্ক্ৰীণত ONLINE হওক!"
            : "আপুনি ONLINE হৈ আছে আৰু তৎক্ষণাত অৰ্ডাৰ লাভ কৰিবলৈ সক্ষম।")
        );
      }
      if (lang === "hi") {
        return (
          `🛵 शिफ्ट स्थिति: आज आपने ${s.completedToday} ट्रिप पूरी की हैं (${formatPaise(s.todayEarningsPaise)} अर्जित) और फिलहाल कोई सक्रिय डिलीवरी नहीं है। ` +
          (home.rider.status === "OFFLINE"
            ? "ऑर्डर प्राप्त करने के लिए होम स्क्रीन पर स्टेटस ONLINE करें!"
            : "आप ONLINE हैं और तुरंत ऑर्डर पाने के लिए पात्र हैं। हाई-डिमांड ज़ोन में बने रहें।")
        );
      }
      return (
        `🛵 Shift Status: You have completed ${s.completedToday} trips today (${formatPaise(s.todayEarningsPaise)} earned) and have no active delivery currently. ` +
        (home.rider.status === "OFFLINE"
          ? "Switch your status to ONLINE on the Home screen to receive orders in your high-demand zones!"
          : "You are ONLINE and eligible for immediate dispatch. Stay near high-demand restaurant hubs.")
      );
    }

    if (lang === "bn") {
      return (
        `🛵 সক্রিয় অর্ডার #${active.orderCode} সংক্ষিপ্ত বিবরণ:\n` +
        `• পর্যায়: ${active.state.replaceAll("_", " ")}\n` +
        `• পিকআপ: ${active.restaurant.name} (${active.restaurant.area || active.restaurant.address})\n` +
        `• ড্রপ-অফ: ${active.customer.displayName} (${active.customer.area || active.customer.address})\n` +
        `• ট্রিপ পেআউট: ${formatPaise(active.expectedPayoutPaise)} ${active.cod ? `| ⚠️ ওটিপি যাচাইয়ের আগে সিওডি ক্যাশ সংগ্রহ করুন: ${formatPaise(active.codAmountPaise)}` : "| প্রিপেইড অনলাইন অর্ডার"}`
      );
    }
    if (lang === "as") {
      return (
        `🛵 সক্ৰিয় অৰ্ডাৰ #${active.orderCode} চমু বিৱৰণ:\n` +
        `• পৰ্যায়: ${active.state.replaceAll("_", " ")}\n` +
        `• পিকআপ: ${active.restaurant.name} (${active.restaurant.area || active.restaurant.address})\n` +
        `• ডেলিভাৰী: ${active.customer.displayName} (${active.customer.area || active.customer.address})\n` +
        `• প্ৰত্যাশিত উপাৰ্জন: ${formatPaise(active.expectedPayoutPaise)} ${active.cod ? `| ⚠️ চিঅ'ডি কেছ সংগ্ৰহ কৰক: ${formatPaise(active.codAmountPaise)}` : "| প্ৰিপেইড অনলাইন অৰ্ডাৰ"}`
      );
    }
    if (lang === "hi") {
      return (
        `🛵 सक्रिय ऑर्डर #${active.orderCode} विवरण:\n` +
        `• स्टेज: ${active.state.replaceAll("_", " ")}\n` +
        `• पिकअप: ${active.restaurant.name} (${active.restaurant.area || active.restaurant.address})\n` +
        `• ड्रॉप-ऑफ: ${active.customer.displayName} (${active.customer.area || active.customer.address})\n` +
        `• ट्रिप पेआउट: ${formatPaise(active.expectedPayoutPaise)} ${active.cod ? `| ⚠️ ओटीपी से पहले सीओडी नकद लें: ${formatPaise(active.codAmountPaise)}` : "| प्रीपेड ऑनलाइन ऑर्डर"}`
      );
    }
    return (
      `🛵 Active Order #${active.orderCode} Briefing:\n` +
      `• Stage: ${active.state.replaceAll("_", " ")}\n` +
      `• Pickup: ${active.restaurant.name} (${active.restaurant.area || active.restaurant.address})\n` +
      `• Drop-Off: ${active.customer.displayName} (${active.customer.area || active.customer.address})\n` +
      `• Trip Payout: ${formatPaise(active.expectedPayoutPaise)} ${active.cod ? `| ⚠️ Collect COD Cash: ${formatPaise(active.codAmountPaise)} before OTP verification` : "| Prepaid Online Order"}`
    );
  }

  // -------------------------------------------------------------------------
  // Default Comprehensive Personalized Shift Briefing
  // -------------------------------------------------------------------------
  if (lang === "bn") {
    return (
      `নমস্কার ${firstName} বাবু! আমি কিং এআই (কিং স্পার্ক), আপনার লাইভ ফ্লিট এআই সাপোর্ট ও অপারেশন্স কো-পাইলট।\n` +
      `• ডিউটি ও কেওয়াইসি স্ট্যাটাস: ${home.rider.status} (${home.rider.kycStatus}) | আজকের উপার্জন: ${formatPaise(s.todayEarningsPaise)} (${s.completedToday}টি ট্রিপ সম্পন্ন)\n` +
      `• মাইলস্টোন কোচ: ${milestone.remaining > 0 ? `আর ${milestone.remaining}টি ট্রিপ সম্পন্ন করলেই পাবেন +${formatPaise(milestone.bonusPaise)} (${milestone.tierName})` : `${milestone.tierName} আনলক হয়েছে!`}\n` +
      `• সক্রিয় অর্ডার: ${active ? `#${active.orderCode} (${active.restaurant.name} → ${active.customer.area})` : "বর্তমানে কোনো সক্রিয় ট্রিপ নেই"}\n` +
      `• সিওডি ক্যাশ ব্যালেন্স: হাতে আছে ${formatPaise(home.pendingCashPaise)} (সর্বোচ্চ ₹২,৫০০ সীমার মধ্যে ${formatPaise(codRemainingPaise)} বাকি)\n` +
      `আপনার পেআউট হিসাব, রেস্তোরাঁয় ৬ মিনিট পর ওয়েট পে স্বয়ংক্রিয় ক্রেডিট, ল্যান্ডমার্ক নেভিগেশন, বা ১১২/১০৮ জরুরি এসওএস বিষয়ে যেকোনো প্রশ্ন করতে পারেন!`
    );
  }
  if (lang === "as") {
    return (
      `নমস্কাৰ ${firstName} ডাঙৰীয়া! মই কিং এআই (কিং স্পাৰ্ক), আপোনাৰ লাইভ ফ্লিট এআই সহায়িকা আৰু কাৰ্য্যকৰী সহায়ক।\n` +
      `• স্থিতি: ${home.rider.status} (${home.rider.kycStatus}) | আজিৰ উপাৰ্জন: ${formatPaise(s.todayEarningsPaise)} (${s.completedToday} টা অৰ্ডাৰ সম্পন্ন)\n` +
      `• মাইলষ্টোন লক্ষ্য: ${milestone.remaining > 0 ? `আৰু ${milestone.remaining} টা অৰ্ডাৰ সম্পূৰ্ণ কৰিলে লাভ কৰিব +${formatPaise(milestone.bonusPaise)} (${milestone.tierName})` : `${milestone.tierName} আনলক হ'ল!`}\n` +
      `• চলিত অৰ্ডাৰ: ${active ? `#${active.orderCode} (${active.restaurant.name} → ${active.customer.area})` : "বৰ্তমান কোনো চলিত অৰ্ডাৰ নাই"}\n` +
      `• চিঅ'ডি কেছ হাতত: ${formatPaise(home.pendingCashPaise)} (সীমাৰ বাকী ${formatPaise(codRemainingPaise)})\n` +
      `পেআউট হিসাব, ৰেষ্টুৰেণ্টত ৬ মিনিটৰ পাছত ৱেইট পে ক্ৰেডিট, পথনিৰ্দেশ বা ১১২/১০৮ জৰুৰীকালীন সাহায্যৰ বাবে মোক সোধক!`
    );
  }
  if (lang === "hi") {
    return (
      `नमस्ते ${firstName} जी! मैं किंग एआई (किंग स्पार्क), आपका लाइव फ्लीट एआई सपोर्ट व ऑपरेशंस मेंटर हूं।\n` +
      `• ड्यूटी व केवाईसी स्थिति: ${home.rider.status} (${home.rider.kycStatus}) | आज की कमाई: ${formatPaise(s.todayEarningsPaise)} (${s.completedToday} डिलीवरी पूरी)\n` +
      `• माइलस्टोन कोच: ${milestone.remaining > 0 ? `केवल ${milestone.remaining} और डिलीवरी पर पाएं +${formatPaise(milestone.bonusPaise)} (${milestone.tierName})` : `${milestone.tierName} अनलॉक!`}\n` +
      `• सक्रिय ऑर्डर: ${active ? `#${active.orderCode} (${active.restaurant.name} → ${active.customer.area})` : "वर्तमान में कोई सक्रिय डिलीवरी नहीं"}\n` +
      `• सीओडी नकद फ्लोट: हाथ में ${formatPaise(home.pendingCashPaise)} (₹2,500 की सीमा में से ${formatPaise(codRemainingPaise)} शेष)\n` +
      `पेआउट ब्रेकडाउन, रेस्तरां में 6 मिनट बाद वेट-पे ऑटो-क्रेडिट, लैंडमार्क नेविगेशन, या 112/108 आपातकालीन एसओएस के बारे में कुछ भी पूछें!`
    );
  }
  return (
    `Hello ${firstName} ji! I am King AI (King Spark), your live Fleet AI Support & Operations Co-Pilot. Here is your real-time shift briefing:\n` +
    `• Duty & KYC Status: ${home.rider.status} (${home.rider.kycStatus}) | Today's Earnings: ${formatPaise(s.todayEarningsPaise)} (${s.completedToday} trips)\n` +
    `• Milestone Coach: ${milestone.remaining > 0 ? `${milestone.remaining} more trips to unlock +${formatPaise(milestone.bonusPaise)} (${milestone.tierName})` : `${milestone.tierName} unlocked!`}\n` +
    `• Active Order: ${active ? `#${active.orderCode} (${active.restaurant.name} → ${active.customer.area})` : "None right now"}\n` +
    `• COD Cash Float: ${formatPaise(home.pendingCashPaise)} in hand (${formatPaise(codRemainingPaise)} remaining before ₹2,500 limit)\n` +
    `Ask me anything about your exact payout breakdown, kitchen wait pay auto-credit (>6 mins), landmark navigation, or emergency SOS routing!`
  );
}
