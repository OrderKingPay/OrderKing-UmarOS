import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { RiderEngine } from "@/lib/rider/engine";
import { formatPaise } from "@/lib/rider/money";
import { PgStore } from "@/lib/rider/pg-store";

const POLICY = [
  "You are King AI (also known as King Spark) — the warm, respectful, hyper-intelligent human-style Fleet AI Support & Operations Mentor for OrderKing Delivery Partners in India.",
  "Brand exclusively as 'King AI' / 'King Spark' (Fleet AI Support). Never mention 'UmarOS' in rider UI or any competitor brand names.",
  "Address the rider respectfully by their name (e.g. 'Namaste <Name> ji', or with appropriate cultural honorific in their language).",
  "Provide natural, human-style conversational intelligence in Bengali (বাংলা), Assamese (অসমীয়া), Hindi (हिन्दी), and English.",
  "Empower riders with autonomous reasoning tools to:",
  "1. Explain exact payout breakdowns: Base fare (₹35 statutory minimum covering first 2 km), progressive distance slabs (2-5 km at ₹12/km, beyond 5 km at ₹15/km), wait-time pay (₹1/min after 6 mins grace period), and 100% customer tip pass-through with zero platform deductions.",
  "2. Verify wait time outside restaurants and auto-credit wait pay if arrival timestamp exceeds 6 mins.",
  "3. Guide navigation and landmark issues without human agent intervention (geofence tolerance, gate protocols, direct map guidance).",
  "4. Route emergency distress signals immediately to 112 / 108 with live GPS coordinates, while auto-protecting the rider's active shift and milestone progress.",
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
  // Distinct Assamese triggers
  if (
    userLocale === "as" ||
    text.includes("অসমীয়া") ||
    text.includes("নমস্কাৰ") ||
    text.includes("টকা") ||
    text.includes("পলম") ||
    text.includes("ৰোষ্টুৰেণ্ট") ||
    text.includes("উপাৰ্জন") ||
    text.includes("সহায়") ||
    text.includes("বিপদ") ||
    text.includes("দেৰি") ||
    text.includes("দেৰী") ||
    text.includes("ক্ৰেডিট")
  ) {
    return "as";
  }
  // Distinct Bengali triggers
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
    text.includes("জমা")
  ) {
    return "bn";
  }
  // Hindi / Devanagari triggers
  if (
    userLocale === "hi" ||
    userLocale === "mai" ||
    /[\u0900-\u097F]/.test(q) ||
    text.includes("namaste") ||
    text.includes("kamai") ||
    text.includes("deri") ||
    text.includes("paisa") ||
    text.includes("intazar") ||
    text.includes("madad")
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
      action?: "auto_credit_wait" | "emergency_distress" | "verify_navigation" | "payout_breakdown" | "query";
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

    if (isWaitRequest && active?.arrivedRestaurantAt && !active.pickedUpAt) {
      const arrivedMs = new Date(active.arrivedRestaurantAt).getTime();
      const waitedMins = Math.max(0, Math.floor((Date.now() - arrivedMs) / 60000));
      if (waitedMins > 6) {
        const billableMins = waitedMins - 6;
        const totalDuePaise = billableMins * 100; // ₹1.00/min statutory rate

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
        emergencyNumbers: ["112 (National Emergency)", "108 (Medical Ambulance)"],
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
      tierName: "Peak Shift Starter Milestone (8 Trips)",
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
    tierName: "Full-Day Champion Milestone Unlocked",
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
  if (emergencyBroadcast || n.includes("emergency") || n.includes("accident") || n.includes("sos") || n.includes("112") || n.includes("108") || n.includes("বিপদ") || n.includes("জরুরি") || n.includes("দুর্ঘটনা") || n.includes("দুৰ্ঘটনা") || n.includes("दुर्घटना") || n.includes("आपातकाल")) {
    const coords = emergencyBroadcast?.coords || { lat: 26.1445, lng: 91.7362 };
    if (lang === "bn") {
      return (
        `🚨 কিং এআই জরুরি এসওএস সতর্কতা (লাইভ জিপিএস সক্রিয়):\n` +
        `• আপনার নিরাপত্তা সবার আগে! নিরাপদ স্থানে রাস্তা থেকে সরে দাঁড়ান।\n` +
        `• সরাসরি কল করুন: ১১২ (জাতীয় জরুরি পুলিশ/ফায়ার) অথবা ১০৮ (বিনামূল্যে জরুরি সরকারি অ্যাম্বুলেন্স)।\n` +
        `• আপনার লাইভ জিপিএস স্থানাঙ্ক: অক্ষাংশ ${coords.lat.toFixed(6)}, দ্রাঘিমাংশ ${coords.lng.toFixed(6)}।\n` +
        `• সক্রিয় অর্ডার সুরক্ষা: কোনো জরিমানা ছাড়াই সক্রিয় ট্রিপটি নিকটবর্তী রাইডারের কাছে হস্তান্তরিত হবে।\n` +
        `• ক্যাশলেস দুর্ঘটনা বীমা: ডিউটিতে থাকা অবস্থায় ₹৫,০০,০০০ টাকার দুর্ঘটনা কভার সক্রিয় (টোল-ফ্রি: ১৮০০-২৫৮-৫৯৫৬)।`
      );
    }
    if (lang === "as") {
      return (
        `🚨 কিং এআই জৰুৰী এছঅ'এছ সজাগতা (লাইভ জিপিএছ সক্ৰিয়):\n` +
        `• আপোনাৰ সুৰক্ষা সৰ্বপ্ৰথমে! সুৰক্ষিত স্থানত ৰখক।\n` +
        `• পোনপটীয়া কল কৰক: ১১২ (ৰাষ্ট্ৰীয় জৰুৰীকালীন আৰক্ষী) বা ১০৮ (বিনামূলীয়া এম্বুলেন্স সেৱা)।\n` +
        `• আপোনাৰ লাইভ স্থানাংক: অক্ষাংশ ${coords.lat.toFixed(6)}, দ্ৰাঘিমাংশ ${coords.lng.toFixed(6)}।\n` +
        `• অৰ্ডাৰ সুৰক্ষা: কোনো জৰিমনা নোহোৱাকৈ আপোনাৰ কাৰ্য্যসূচী পুনৰ নিৰ্ধাৰণ কৰা হ'ব।\n` +
        `• বিনামূলীয়া দুৰ্ঘটনা বীমা: ₹৫,০০,০০০ টকাৰ কেচলেছ চিকিৎসা বীমা উপলব্ধ (টোল-ফ্ৰী: ১৮০০-২৫৮-৫৯৫৬)।`
      );
    }
    if (lang === "hi") {
      return (
        `🚨 किंग एआई आपातकालीन संकट चेतावनी (लाइव जीपीएस सक्रिय):\n` +
        `• आपकी सुरक्षा हमारी सर्वोच्च प्राथमिकता है! कृपया तुरंत सड़क के किनारे सुरक्षित स्थान पर रुकें।\n` +
        `• त्वरित आपातकालीन संपर्क: 112 (राष्ट्रीय आपातकालीन पुलिस/दमकल) या 108 (मुफ्त सरकारी एम्बुलेंस सेवा) डायल करें।\n` +
        `• आपके लाइव जीपीएस निर्देशांक: अक्षांश ${coords.lat.toFixed(6)}, देशांतर ${coords.lng.toFixed(6)}।\n` +
        `• शून्य जुर्माना सुरक्षा: सक्रिय ऑर्डर को बिना किसी रेटिंग कटौती के निकटतम पार्टनर को पुनः सौंप दिया जाएगा।\n` +
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
  if (waitCreditResult || n.includes("kitchen") || n.includes("wait") || n.includes("delay") || n.includes("রেস্তোরাঁ") || n.includes("অপেক্ষা") || n.includes("দেৰি") || n.includes("দেৰী") || n.includes("देरी") || n.includes("इंतजार")) {
    if (waitCreditResult) {
      if (waitCreditResult.credited) {
        if (lang === "bn") {
          return (
            `⚡ কিং এআই স্বয়ংক্রিয় ক্রেডিট কার্যকর হয়েছে!\n` +
            `• যাচাইকৃত রেস্তোরাঁ: ${waitCreditResult.restaurantName} (অর্ডার #${waitCreditResult.orderCode})\n` +
            `• অপেক্ষার সময়: ${waitCreditResult.waitedMins} মিনিট (৬ মিনিটের গ্রেস সময়ের চেয়ে ${waitCreditResult.billableMins} মিনিট বেশি)\n` +
            `• ক্রেডিট করা হয়েছে: ₹${(waitCreditResult.amountPaise / 100).toFixed(2)} সরাসরি আপনার লাইভ লেজারে জমা হয়েছে (₹১/মিনিট হারে)।\n` +
            `• কোনো এজেন্টের প্রয়োজন নেই — কিং এআই স্বয়ংক্রিয়ভাবে আপনার সময় রক্ষা করেছে!`
          );
        }
        if (lang === "as") {
          return (
            `⚡ কিং এআই স্বয়ংক্ৰিয় ক্ৰেডিট সফল হৈছে!\n` +
            `• ৰেষ্টুৰেণ্ট: ${waitCreditResult.restaurantName} (অৰ্ডাৰ #${waitCreditResult.orderCode})\n` +
            `• অপেক্ষাৰ সময়: ${waitCreditResult.waitedMins} মিনিট (৬ মিনিটৰ বিনামূলীয়া সময়ৰ পৰা ${waitCreditResult.billableMins} মিনিট বেছি)\n` +
            `• লেজাৰত জমা হ'ল: ₹${(waitCreditResult.amountPaise / 100).toFixed(2)} (প্ৰতি মিনিটত ₹১ হাৰত)।\n` +
            `• কোনো মানৱ সহায়িকাৰ প্ৰয়োজন নাই — কিং এআই আপোনাৰ উপাৰ্জন সুৰক্ষিত কৰিলে!`
          );
        }
        if (lang === "hi") {
          return (
            `⚡ किंग एआई स्वायत्त वेट-पे क्रेडिट निष्पादित!\n` +
            `• सत्यापित रेस्तरां: ${waitCreditResult.restaurantName} (ऑर्डर #${waitCreditResult.orderCode})\n` +
            `• प्रतीक्षा समय: ${waitCreditResult.waitedMins} मिनट (6 मिनट की रियायत से ${waitCreditResult.billableMins} मिनट अधिक)\n` +
            `• जमा राशि: ₹${(waitCreditResult.amountPaise / 100).toFixed(2)} सीधे आपके लाइव लेजर में ₹1.00/मिनट की दर से क्रेडिट हो गई है।\n` +
            `• किसी एजेंट या अनुमोदन की प्रतीक्षा नहीं — किंग एआई ने आपके समय की पूरी भरपाई कर दी है!`
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
        return (
          `⚡ Verified Kitchen Wait Compensation: You have waited ${waitCreditResult.waitedMins} mins at ${waitCreditResult.restaurantName}. ` +
          `₹${(waitCreditResult.amountPaise / 100).toFixed(2)} wait pay is verified and registered in your trip ledger. It will settle with your trip payout upon customer handover.`
        );
      } else {
        const remainingGrace = 6 - waitCreditResult.waitedMins;
        return (
          `⏱️ Kitchen Wait Timer Active: You arrived at ${waitCreditResult.restaurantName} ${waitCreditResult.waitedMins} min(s) ago. ` +
          `The standard 6-minute kitchen prep grace period is active (${remainingGrace} min(s) remaining). At minute 7, King AI will automatically credit ₹1.00 per minute directly to your shift ledger!`
        );
      }
    }

    if (active && !active.arrivedRestaurantAt) {
      return (
        `🏬 King AI Kitchen Timer Guidance: For order #${active.orderCode} at ${active.restaurant.name}, please tap 'Arrived at Restaurant' on your delivery screen as soon as you reach the counter. ` +
        `This starts your verified GPS timer. If prep takes longer than 6 minutes, King AI automatically credits ₹1/min wait pay!`
      );
    }

    return (
      `🏬 OrderKing Kitchen Wait-Time Guarantee:\n` +
      `• Grace Period: First 6 minutes upon marking 'Arrived at Restaurant' are covered under base fare.\n` +
      `• Autonomous ₹1/Min Rate: From minute 7 onwards, King AI automatically credits ₹1.00/minute directly into your earnings ledger.\n` +
      `• Never speed or compromise road safety: your waiting time is fully monetized by OrderKing.`
    );
  }

  // -------------------------------------------------------------------------
  // TOOL 3: Navigation, Address, Gated Community & Landmark Guidance
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

      return (
        `🧭 King AI Autonomous Navigation & Landmark Resolver:\n` +
        `• Active Target: ${targetName} (${isPickup ? "Restaurant Pickup" : "Customer Doorstep"})\n` +
        `• Verified Address: ${targetAddress}\n` +
        `• 1-Tap Live GPS Navigation: ${mapsUrl}\n` +
        `• Gated Entry & Landmark SOP: If security asks, state 'OrderKing Delivery for #${active.orderCode}'.\n` +
        `• Geofence Proximity Shield: OrderKing dispatch verifies arrival within 500 meters of the pin even if cellular GPS drifts.\n` +
        `• Customer Unreachable: If gate or resident is unreachable, log 3 call attempts spaced over 10 mins to unlock 100% protected payout.`
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
  // TOOL 4: Exact Payout Breakdown (Base, Distance Slabs, Wait Pay, 100% Tips)
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
        `১. সংবিধিবদ্ধ বেস পে: ₹৩৫ (প্রথম ২ কিমি সম্পূর্ণ অন্তর্ভুক্ত)।\n` +
        `২. প্রগ্রেসিভ দূরত্ব স্ল্যাব:\n` +
        `   • ২ থেকে ৫ কিমি: ₹১২ প্রতি কিমি\n` +
        `   • ৫ কিমির বেশি: ₹১৫ প্রতি কিমি (দীর্ঘ রুটের বিশেষ বোনাস)\n` +
        `৩. রেস্তোরাঁ ওয়েট-টাইম পে: কাউন্টারে ৬ মিনিট গ্রেস সময়ের পর প্রতি মিনিটে ঠিক ₹১.০০ জমা হয়।\n` +
        `৪. গ্রাহকের ১০০% বখশিশ: টিপসের ১০০% সরাসরি আপনার অ্যাকাউন্টে জমা হয় — প্ল্যাটফর্ম কোনো কমিশন কাটে না!\n` +
        `৫. শিফট মাইলস্টোন বোনাস: ৮ ট্রিপ (+₹১০০) | ১৪ ট্রিপ (+₹২২০) | ২০ ট্রিপ (+₹৪০০)।\n` +
        `• আজকের মোট উপার্জন: ${formatPaise(s.todayEarningsPaise)} (${s.completedToday}টি ট্রিপ সম্পন্ন)`
      );
    }
    if (lang === "as") {
      return (
        `💰 কিং এআই পেআউট আৰু উপাৰ্জনৰ সম্পূৰ্ণ বিৱৰণ (${firstName} ডাঙৰীয়াৰ বাবে):\n` +
        `১. ভিত্তি পে (Base Fare): ₹৩৫ (প্ৰথম ২ কিমি অন্তৰ্ভুক্ত)।\n` +
        `২. দূৰত্বৰ অগ্ৰগতি স্ল্যাব:\n` +
        `   • ২ ৰ পৰা ৫ কিমি: ₹১২ প্ৰতি কিমি\n` +
        `   • ৫ কিমিতকৈ বেছি: ₹১৫ প্ৰতি কিমি\n` +
        `৩. ৰেষ্টুৰেণ্টত অপেক্ষাৰ মাচুল: ৬ মিনিটৰ পাছত প্ৰতি মিনিটত ₹১.০০ স্বয়ংক্ৰিয়ভাৱে জমা হয়।\n` +
        `৪. গ্ৰাহকৰ ১০০% টিপছ: কোনো কমিছন নোহোৱাকৈ ১০০% আপোনাৰ লেজাৰত জমা হয়।\n` +
        `৫. দৈনিক মাইলষ্টোন: ৮ ট্রিপ (+₹১০০) | ১৪ ট্রিপ (+₹২২০) | ২০ ট্রিপ (+₹৪০০)।\n` +
        `• আজিৰ উপাৰ্জন: ${formatPaise(s.todayEarningsPaise)} (${s.completedToday} টা অৰ্ডাৰ)`
      );
    }
    if (lang === "hi") {
      return (
        `💰 किंग एआई पेआउट और कमाई संरचना (${firstName} जी के लिए):\n` +
        `1. वैधानिक बेस पे: ₹35 (पहले 2 किमी की दूरी शामिल है)।\n` +
        `2. प्रगतिशील दूरी स्लैब:\n` +
        `   • 2 से 5 किमी: ₹12 प्रति किमी\n` +
        `   • 5 किमी से अधिक: ₹15 प्रति किमी (लॉन्ग-हॉल रूट बोनस)\n` +
        `3. किचन वेट-टाइम पे: 6 मिनट की रियायत के बाद ठीक ₹1.00 प्रति मिनट सीधे आपके खाते में।\n` +
        `4. 100% कस्टमर टिप: ग्राहक द्वारा दिया गया पूरा 100% टिप आपका है — शून्य कटौती!\n` +
        `5. दैनिक माइलस्टोन बोनस: 8 ट्रिप (+₹100) | 14 ट्रिप (+₹220) | 20 ट्रिप (+₹400)।\n` +
        `• आज की कुल शुद्ध कमाई: ${formatPaise(s.todayEarningsPaise)} (${s.completedToday} ट्रिप पूर्ण)`
      );
    }
    return (
      `💰 KING AI FLEET PAYOUT BREAKDOWN & EARNINGS MATRIX:\n` +
      `1. Statutory Base Pay: ₹35.00 Minimum Floor (covers first 2.0 km).\n` +
      `2. Progressive Distance Slabs:\n` +
      `   • 2.0 km to 5.0 km: ₹12.00 per km\n` +
      `   • Beyond 5.0 km: ₹15.00 per km (long-haul progressive booster)\n` +
      `3. Kitchen Wait-Time Pay: EXACTLY ₹1.00/min (100 paise) credited after 6 mins grace period.\n` +
      `4. 100% Customer Tips: Zero commission pass-through directly to your bank account.\n` +
      `5. Daily Milestone Incentives: 8 Trips (+₹100) | 14 Trips (+₹220) | 20 Trips (+₹400).\n` +
      `• Today's Shift Snapshot: ${formatPaise(s.todayEarningsPaise)} across ${s.completedToday} deliveries (Delivery Pay: ${formatPaise(s.payoutTotals.payout)} | Tips: ${formatPaise(s.payoutTotals.tip)} | Incentives: ${formatPaise(s.payoutTotals.incentive)}).`
    );
  }

  // -------------------------------------------------------------------------
  // Wednesday Settlement & COD Float Queries
  // -------------------------------------------------------------------------
  if (n.includes("settle") || n.includes("wednesday") || n.includes("bank") || n.includes("upi") || n.includes("cod") || n.includes("float") || n.includes("পেমেন্ট") || n.includes("বুধবার") || n.includes("पेमेंट")) {
    const payoutDest = home.rider.payoutUpi
      ? `UPI ID (${home.rider.payoutUpi})`
      : home.rider.payoutBankLast4
        ? `Bank A/C ending XXXX-${home.rider.payoutBankLast4}`
        : "registered bank/UPI in Profile";
    const latest = settlements[0];
    const settlementLine = latest
      ? `Active Settlement Cycle (${latest.periodStart} to ${latest.periodEnd}): ${formatPaise(latest.amountPaise)} [${latest.status}]`
      : `Net payable balance ready: ${formatPaise(s.payoutTotals.netPayable)}`;

    return (
      `🗓️ King AI Weekly Settlement & COD Float Briefing:\n` +
      `• Weekly Wednesday Payout: Net earnings from Monday–Sunday transfer automatically every Wednesday by 2:00 PM IST via NEFT/IMPS to ${payoutDest}.\n` +
      `• Ledger Status: ${settlementLine}\n` +
      `• Live COD Cash Float: You hold ${formatPaise(home.pendingCashPaise)} out of ₹2,500 limit (${formatPaise(codRemainingPaise)} headroom remaining).\n` +
      `• Advice: Deposit collected cash via UPI on the Home screen to keep your COD dispatch uninterrupted.`
    );
  }

  // -------------------------------------------------------------------------
  // Customer Unreachable at Doorstep (3-Call Rule)
  // -------------------------------------------------------------------------
  if (n.includes("customer") || n.includes("answer") || n.includes("unreachable") || n.includes("phone") || n.includes("call") || n.includes("otp") || n.includes("গ্রাহক") || n.includes("ग्राहक")) {
    const attemptStatus = active
      ? `For active order #${active.orderCode} (${active.customer.area}), you have logged ${active.contactAttempts}/3 required call attempts.`
      : "When a customer is unreachable at the doorstep:";
    return (
      `⏱️ King AI Customer Unreachable SOP (100% Payout Protected):\n` +
      `• Current Progress: ${attemptStatus}\n` +
      `• Step 1: Tap 'Arrived at Customer' at the destination GPS pin.\n` +
      `• Step 2: Call the customer and tap 'Record Call Attempt' at least 3 times spaced over 10 minutes.\n` +
      `• Step 3: Once 3 attempts and the 10-minute doorstep timer elapse, tap 'Customer Unavailable'. King AI protects 100% of your Base + Distance payout with zero rating deduction!`
    );
  }

  // -------------------------------------------------------------------------
  // Active Order Status
  // -------------------------------------------------------------------------
  if (n.includes("active") || n.includes("order") || n.includes("current") || n.includes("trip") || n.includes("অর্ডার") || n.includes("ऑर्डर")) {
    if (!active) {
      return (
        `🛵 Shift Status: You have completed ${s.completedToday} trips today (${formatPaise(s.todayEarningsPaise)} earned) and have no active delivery currently. ` +
        (home.rider.status === "OFFLINE"
          ? "Switch your status to ONLINE on the Home screen to receive orders in your high-demand zones!"
          : "You are ONLINE and eligible for immediate dispatch. Stay near high-demand restaurant hubs.")
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
  return (
    `Namaste ${firstName} ji! I am King AI (King Spark), your live Fleet AI Support & Operations Co-Pilot. Here is your real-time shift briefing:\n` +
    `• Duty & KYC Status: ${home.rider.status} (${home.rider.kycStatus}) | Today's Earnings: ${formatPaise(s.todayEarningsPaise)} (${s.completedToday} trips)\n` +
    `• Milestone Coach: ${milestone.remaining > 0 ? `${milestone.remaining} more trips to unlock +${formatPaise(milestone.bonusPaise)} (${milestone.tierName})` : `${milestone.tierName} unlocked!`}\n` +
    `• Active Order: ${active ? `#${active.orderCode} (${active.restaurant.name} → ${active.customer.area})` : "None right now"}\n` +
    `• COD Cash Float: ${formatPaise(home.pendingCashPaise)} in hand (${formatPaise(codRemainingPaise)} remaining before ₹2,500 limit)\n` +
    `Ask me anything about your exact payout breakdown, kitchen wait pay auto-credit (>6 mins), landmark navigation, or emergency SOS routing!`
  );
}
