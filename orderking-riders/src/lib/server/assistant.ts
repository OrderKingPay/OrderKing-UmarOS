import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { RiderEngine } from "@/lib/rider/engine";
import { formatPaise } from "@/lib/rider/money";
import { PgStore } from "@/lib/rider/pg-store";

const POLICY = [
  "You are Rider Spark AI — a warm, respectful, knowledgeable human-style Fleet Mentor & Operations Coordinator for OrderKing Delivery Partners in India.",
  "Address the rider respectfully by their name (e.g. 'Namaste <Name> ji').",
  "You may ONLY cite numbers, order codes, earnings, COD balances, and states from the authorized live database snapshot JSON provided.",
  "Never invent earnings, payouts, UTR numbers, addresses, OTPs, customer names, or order states.",
  "Never claim a platform mutation (crediting money, cancelling an order, reassigning a trip) already happened unless shown in the snapshot; instead explain the exact 1-tap button to press in the app.",
  "Never encourage speeding, phone use while riding, ignoring traffic laws, or skipping OTP/pickup verification.",
  "If the rider is BUSY or on an active delivery, keep guidance crisp, calm, and safety-first.",
  "When the rider asks in Hindi, Bengali, Assamese, or another Indian language, reply naturally and respectfully in that language.",
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
}

const COD_FLOAT_LIMIT_PAISE = 250_000; // ₹2,500 statutory COD hand-float ceiling

export const askAssistantFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { question: string; busy: boolean; locale?: string }) => input)
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

    const richCtx: RichRiderContext = {
      snapshot,
      home,
      settlements,
      tickets,
      performance,
    };

    const question = (data.question ?? "").trim().slice(0, 500);
    const xaiKey = process.env.XAI_API_KEY?.trim();
    const openaiKey = process.env.OPENAI_API_KEY?.trim();

    const authorizedFacts = JSON.stringify({
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
      activeDelivery: home.active
        ? {
            orderCode: home.active.orderCode,
            state: home.active.state,
            restaurantName: home.active.restaurant.name,
            restaurantArea: home.active.restaurant.area,
            customerArea: home.active.customer.area,
            expectedPayoutInr: formatPaise(home.active.expectedPayoutPaise),
            cod: home.active.cod,
            codAmountInr: formatPaise(home.active.codAmountPaise),
            arrivedRestaurantAt: home.active.arrivedRestaurantAt,
            waitStartedAt: home.active.waitStartedAt,
            contactAttempts: home.active.contactAttempts,
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
      recentHistory: snapshot.history.slice(0, 5).map((h) => ({
        orderCode: h.orderCode,
        state: h.state,
        payoutInr: formatPaise(h.payoutPaise),
      })),
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
            max_tokens: data.busy ? 220 : 450,
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
            return { ok: true as const, text };
          }
        }
      } catch {
        // Fall through to deterministic live-database human mentor response
      }
    }

    return {
      ok: true as const,
      text: localHumanMentorAnswer(question, richCtx, Boolean(data.busy)),
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
): string {
  const n = q.toLowerCase();
  const { snapshot: s, home, settlements, tickets, performance } = ctx;
  const fullName = home.rider.fullName?.trim() || "Partner";
  const firstName = fullName.split(" ")[0] || "Partner";
  const safetyNote = busy
    ? "⚠️ Safety first: please keep your two-wheeler parked safely while reading or use the 🔊 Listen button. "
    : "";
  const milestone = getNextMilestone(s.completedToday);
  const active = home.active;
  const codRemainingPaise = Math.max(0, COD_FLOAT_LIMIT_PAISE - home.pendingCashPaise);

  // 1. Earnings, Tips, Incentives & Milestone Coaching
  if (
    n.includes("earn") ||
    n.includes("income") ||
    n.includes("money") ||
    n.includes("milestone") ||
    n.includes("bonus") ||
    n.includes("incentive") ||
    n.includes("कमाई") ||
    n.includes("আয়") ||
    n.includes("পেআউট")
  ) {
    const milestoneLine =
      milestone.remaining > 0
        ? `You are just ${milestone.remaining} ${milestone.remaining === 1 ? "trip" : "trips"} away from unlocking your ${milestone.tierName} (+${formatPaise(milestone.bonusPaise)} bonus).`
        : `Congratulations! You have completed ${s.completedToday} trips today and unlocked the ${milestone.tierName} (+${formatPaise(milestone.bonusPaise)}).`;

    const activeLine = active
      ? ` Right now, you are on active order #${active.orderCode} (${active.restaurant.name} → ${active.customer.area}) worth ${formatPaise(active.expectedPayoutPaise)}.`
      : "";

    return (
      `${safetyNote}Namaste ${firstName} ji! Here is your live earnings summary for today:\n` +
      `• Today's Net Earnings: ${formatPaise(s.todayEarningsPaise)} across ${s.completedToday} completed ${s.completedToday === 1 ? "delivery" : "deliveries"}\n` +
      `• Breakdown: Base + Distance Pay ${formatPaise(s.payoutTotals.payout)} | Customer Tips (100% yours): ${formatPaise(s.payoutTotals.tip)} | Wait & Surge Incentives: ${formatPaise(s.payoutTotals.incentive)}\n` +
      `• Next Milestone Coach: ${milestoneLine}\n` +
      `• Pro-Tip for Higher Take-Home: Stay online in ${home.rider.preferredZones || "your primary zone"} during Lunch Peak (12:00 PM – 3:00 PM) and Dinner Peak (7:00 PM – 11:00 PM) when order density and per-order surge are highest.${activeLine}`
    );
  }

  // 2. Customer Tips specific query
  if (n.includes("tip") || n.includes("বখশিশ") || n.includes("टिप")) {
    return (
      `${safetyNote}Namaste ${firstName} ji! Today you have earned ${formatPaise(s.payoutTotals.tip)} in customer tips across ${s.completedToday} completed trips. ` +
      `100% of every customer tip goes directly into your ledger with zero platform commission or deduction, and is settled in your weekly Wednesday bank/UPI payout.`
    );
  }

  // 3. Wednesday Settlement, Bank/UPI & Cash / COD Float Queries
  if (
    n.includes("settle") ||
    n.includes("wednesday") ||
    n.includes("payout") ||
    n.includes("bank") ||
    n.includes("upi") ||
    n.includes("neft") ||
    n.includes("cod") ||
    n.includes("cash") ||
    n.includes("float") ||
    n.includes("পেমেন্ট") ||
    n.includes("বুধবার") ||
    n.includes("पेमेंट")
  ) {
    const payoutDest = home.rider.payoutUpi
      ? `UPI ID (${home.rider.payoutUpi})`
      : home.rider.payoutBankLast4
        ? `Bank A/C ending XXXX-${home.rider.payoutBankLast4}`
        : "your registered bank/UPI account (update in Profile)";
    const latest = settlements[0];
    const settlementLine = latest
      ? `Your current settlement ledger record (${latest.periodStart} to ${latest.periodEnd}) stands at ${formatPaise(latest.amountPaise)} [${latest.status}].`
      : `Your net payable balance for today is ${formatPaise(s.payoutTotals.netPayable)}.`;

    return (
      `${safetyNote}Namaste ${firstName} ji! Here is your live Payout & COD Float status:\n` +
      `• Weekly Settlement Cycle: All Monday–Sunday net earnings are automatically transferred every Wednesday by 2:00 PM IST via NEFT/IMPS to ${payoutDest}.\n` +
      `• Ledger Snapshot: ${settlementLine}\n` +
      `• Live COD Cash-in-Hand: You currently hold ${formatPaise(home.pendingCashPaise)} in unreconciled COD cash out of your ${formatPaise(COD_FLOAT_LIMIT_PAISE)} limit (${formatPaise(codRemainingPaise)} remaining headroom).\n` +
      `• Action Advice: ${home.pendingCashPaise > 0 ? "Please deposit your collected COD cash via UPI on the Home or Earnings screen and log the reference so your dispatch never pauses." : "You have ₹0 pending COD debt — your full earnings will be credited without any cash offset."}`
    );
  }

  // 4. Restaurant Delay / Kitchen Taking Too Long
  if (
    n.includes("restaurant") ||
    n.includes("kitchen") ||
    n.includes("ready") ||
    n.includes("delay") ||
    n.includes("wait") ||
    n.includes("long") ||
    n.includes("রেস্তোরাঁ") ||
    n.includes("रेस्तरां") ||
    n.includes("देरी")
  ) {
    let waitDetail = "Once you tap 'Arrived at Restaurant', your live kitchen wait timer starts automatically.";
    if (active?.arrivedRestaurantAt && !active.pickedUpAt) {
      const waitedMins = Math.max(
        0,
        Math.floor((Date.now() - new Date(active.arrivedRestaurantAt).getTime()) / 60000),
      );
      const payableMins = Math.max(0, waitedMins - 10);
      waitDetail = `For your active order #${active.orderCode} at ${active.restaurant.name}, you have been waiting ${waitedMins} min(s) (${payableMins > 0 ? `accrued +₹${payableMins} wait bonus so far` : `${10 - waitedMins} min(s) until ₹1/min wait pay starts`}).`;
    }
    return (
      `${safetyNote}Namaste ${firstName} ji, don't worry about kitchen delays — your time is protected:\n` +
      `• ${waitDetail}\n` +
      `• Step 1: Tap 'Arrived at Restaurant' as soon as you reach the counter, and tap 'Restaurant Not Ready' if the parcel is still being cooked.\n` +
      `• Step 2: After a 10-minute grace period, you automatically earn ₹1 per minute of verified kitchen wait added to your order payout.\n` +
      `• Step 3: Always verify the 4-digit Order Code on the sealed thermal parcel before leaving, and never speed in traffic to make up for kitchen prep time.`
    );
  }

  // 5. Customer Not Answering / Unreachable at Drop
  if (
    n.includes("customer") ||
    n.includes("answer") ||
    n.includes("unavailable") ||
    n.includes("unreachable") ||
    n.includes("phone") ||
    n.includes("call") ||
    n.includes("otp") ||
    n.includes("গ্রাহক") ||
    n.includes("ग्राहक")
  ) {
    const attemptStatus = active
      ? `On active order #${active.orderCode} (${active.customer.area}), you have logged ${active.contactAttempts}/3 required call attempts so far.`
      : "When you reach a customer's drop location and they do not answer:";
    return (
      `${safetyNote}Namaste ${firstName} ji! Follow our zero-penalty Customer Unreachable SOP so your payout is 100% protected:\n` +
      `• Current Status: ${attemptStatus}\n` +
      `• Step 1: Tap 'Arrived at Customer' at the GPS drop pin.\n` +
      `• Step 2: Call the customer and tap 'Record Call Attempt' in your active delivery screen at least 3 times spaced over 10 minutes.\n` +
      `• Step 3: Once 3 attempts and the 10-minute doorstep wait timer complete, tap 'Customer Unavailable'. You will receive 100% of your Base + Distance payout with zero rating penalty, and return instructions will be logged.`
    );
  }

  // 6. Active Order / Current Delivery Status
  if (
    n.includes("current") ||
    n.includes("active") ||
    n.includes("where") ||
    n.includes("order") ||
    n.includes("trip") ||
    n.includes("অর্ডার") ||
    n.includes("ऑर्डर")
  ) {
    if (!active) {
      return (
        `${safetyNote}Namaste ${firstName} ji! You do not have an active delivery right now (current status: ${home.rider.status}). ` +
        `You have completed ${s.completedToday} ${s.completedToday === 1 ? "trip" : "trips"} today earning ${formatPaise(s.todayEarningsPaise)}. ` +
        (home.rider.status === "OFFLINE"
          ? "Toggle your status to ONLINE on the Home screen to start receiving live dispatch offers in your zone!"
          : "Stay in your high-demand zone — the dispatch engine is actively scanning for your next nearby order.")
      );
    }
    return (
      `${safetyNote}Namaste ${firstName} ji! You are currently handling active order #${active.orderCode}:\n` +
      `• Live Stage: ${active.state.replaceAll("_", " ")}\n` +
      `• Pickup: ${active.restaurant.name} (${active.restaurant.area || active.restaurant.address})\n` +
      `• Drop-Off: ${active.customer.displayName} (${active.customer.area || active.customer.address})\n` +
      `• Guaranteed Trip Payout: ${formatPaise(active.expectedPayoutPaise)} ${active.cod ? `| ⚠️ Collect COD Cash: ${formatPaise(active.codAmountPaise)} before entering OTP` : "| Prepaid Online Order (₹0 cash to collect)"}`
    );
  }

  // 7. Vehicle Breakdown, Accident, SOS or Safety
  if (
    n.includes("breakdown") ||
    n.includes("emergency") ||
    n.includes("accident") ||
    n.includes("vehicle") ||
    n.includes("puncture") ||
    n.includes("sos") ||
    n.includes("safety") ||
    n.includes("জরুরি") ||
    n.includes("সাহায্য") ||
    n.includes("বিপদ") ||
    n.includes("दुर्घटना") ||
    n.includes("आपातकालीन")
  ) {
    return (
      `🚨 Namaste ${firstName} ji — your life and safety come before every delivery:\n` +
      `• Immediate Medical/Police Help: Move to the side of the road away from traffic. Dial 112 (National SOS) or 108 (Free Government Ambulance) from the Safety tab.\n` +
      `• Active Order Reassignment (Zero Penalty): ${active ? `For your current order #${active.orderCode}, open the Delivery or Support screen and log 'Vehicle Problem / Safety Issue'.` : "If you have a puncture or breakdown on an active trip, log 'Vehicle Problem' in the app."} Dispatch will immediately reassign the parcel to a nearby partner with ZERO cancellation penalty and full protection of your daily milestone progress.\n` +
      `• Insurance Support: Cashless accidental medical cover (up to ₹5,00,000) is active while on duty via Toll-Free 1800-258-5956.`
    );
  }

  // 8. History or Past Orders
  if (n.includes("histor") || n.includes("past") || n.includes("completed") || n.includes("how many")) {
    const recent = s.history
      .slice(0, 5)
      .map((h) => `#${h.orderCode} (${h.state.replaceAll("_", " ")}) → ${formatPaise(h.payoutPaise)}`)
      .join(" | ");
    return (
      `${safetyNote}Namaste ${firstName} ji! You have completed ${s.completedToday} trips today (${formatPaise(s.todayEarningsPaise)} earned) and ${performance.completed} lifetime trips (averaging ${formatPaise(performance.earningsPerOrderPaise)} per order).\n` +
      `• Recent Today's Trips: ${recent || "No deliveries completed yet today."}\n` +
      `• Need a full CSV statement or per-trip Base/Distance/Wait/Tip audit? Open the History tab anytime.`
    );
  }

  // 9. Default Comprehensive Personalized Mentor Briefing
  return (
    `${safetyNote}Namaste ${firstName} ji! I am Rider Spark AI, your live Fleet Mentor & Operations Co-Pilot. Here is your real-time shift briefing:\n` +
    `• Duty & KYC Status: ${home.rider.status} (${home.rider.kycStatus}) | Today's Earnings: ${formatPaise(s.todayEarningsPaise)} (${s.completedToday} trips)\n` +
    `• Milestone Coach: ${milestone.remaining > 0 ? `${milestone.remaining} more ${milestone.remaining === 1 ? "trip" : "trips"} to unlock +${formatPaise(milestone.bonusPaise)} (${milestone.tierName})` : `${milestone.tierName} unlocked!`}\n` +
    `• Active Order: ${active ? `#${active.orderCode} (${active.restaurant.name} → ${active.customer.area}, ${active.state.replaceAll("_", " ")})` : "None right now"}\n` +
    `• COD Cash Float: ${formatPaise(home.pendingCashPaise)} in hand (${formatPaise(codRemainingPaise)} remaining before ₹2,500 limit) | Open Support Tickets: ${tickets.filter((t) => t.status === "OPEN").length}\n` +
    `Ask me anything about maximizing today's earnings, kitchen wait pay, customer unreachable steps, COD reconciliation, or Wednesday bank payouts!`
  );
}

