import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { RiderEngine } from "@/lib/rider/engine";
import { formatPaise } from "@/lib/rider/money";
import { PgStore } from "@/lib/rider/pg-store";

const POLICY = `You are the Order King Rider assistant. You may ONLY use the authorized snapshot JSON provided. Never invent earnings, payouts, addresses, OTPs, customer names, or order states. If a number is missing, say you do not have it. Never encourage speeding, phone use while riding, ignoring traffic law, or skipping safety steps. If the rider is BUSY or on an active delivery, keep answers short. Data is SIMULATED unless dataMode is LIVE. Answer in the rider's language if obvious, else English.`;

type Snapshot = Awaited<ReturnType<RiderEngine["snapshotForAssistant"]>>;

export const askAssistantFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { question: string; busy: boolean }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const eng = new RiderEngine(new PgStore(sql));
    await eng.ensureRider({ id: context.userId });
    const snapshot = await eng.snapshotForAssistant(context.userId);
    const openAiKey = process.env.OPENAI_API_KEY?.trim();
    const xAiKey = process.env.XAI_API_KEY?.trim();
    const facts = JSON.stringify(snapshot);
    const question = data.question.slice(0, 500);

    const systemPrompt = `You are the Order King Rider assistant. Use ONLY the authorized snapshot JSON. Never invent earnings, payouts, addresses, OTPs, customer names, order states, or policies. If a fact is absent, say it is unavailable. Never encourage speeding, phone use while riding, traffic-law violations, or unsafe behavior. If the rider is BUSY or on an active delivery, keep answers short. Answer in the rider's language when obvious, otherwise English. Data mode is ${snapshot.dataMode}; never imply simulated data is live.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "system", content: `Authorized snapshot for rider ${context.userId}: ${facts}` },
      { role: "user", content: question },
    ];

    if (openAiKey) {
      try {
        const res = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_RIDER_MODEL?.trim() || "gpt-5.6-terra",
            reasoning: { effort: data.busy ? "low" : "medium" },
            max_output_tokens: data.busy ? 220 : 500,
            store: false,
            input: messages,
          }),
        });
        if (res.ok) {
          const body = (await res.json()) as {
            output_text?: string;
            output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
          };
          const text = body.output_text?.trim() || body.output
            ?.flatMap((item) => item.content ?? [])
            .find((item) => item.type === "output_text" && item.text?.trim())?.text?.trim();
          if (text) return { ok: true as const, text, provider: "openai" as const };
        }
      } catch {
        // Fail over to another explicitly configured provider.
      }
    }

    if (xAiKey) {
      try {
        const res = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${xAiKey}`,
          },
          body: JSON.stringify({
            model: process.env.XAI_RIDER_MODEL?.trim() || "grok-4.5",
            max_tokens: data.busy ? 180 : 400,
            messages,
          }),
        });
        if (res.ok) {
          const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
          const text = body.choices?.[0]?.message?.content?.trim();
          if (text) return { ok: true as const, text, provider: "xai" as const };
        }
      } catch {
        // Fall through to deterministic, snapshot-only guidance.
      }
    }

    return { ok: true as const, text: localAnswer(question, snapshot, data.busy), provider: "data_only" as const };
  });

function localAnswer(q: string, s: Snapshot, busy: boolean): string {
  const n = q.toLowerCase();
  const prefix = s.dataMode === "SIMULATED" ? "SIMULATED data. " : "";
  const short = busy ? "Keep the phone mounted if you are moving. " : "";
  if (n.includes("earn") || n.includes("payout") || n.includes("আয়") || n.includes("পেআউট")) {
    return `${prefix}${short}Today's net is ${formatPaise(s.todayEarningsPaise)} across ${s.completedToday} completed deliveries. Payout ${formatPaise(s.payoutTotals.payout)}, incentives ${formatPaise(s.payoutTotals.incentive)}.`;
  }
  if (n.includes("tip") || n.includes("বখশিশ")) {
    return `${prefix}${short}100% of customer tips go directly to you without any platform commission, credited straight into your weekly payout.`;
  }
  if (n.includes("settle") || n.includes("wednesday") || n.includes("পেমেন্ট") || n.includes("বুধবার")) {
    return `${prefix}${short}Rider payouts are processed weekly every Wednesday for all Monday–Sunday orders, transferred directly to your registered bank account/UPI after reconciling cash collected.`;
  }
  if (n.includes("complet") || n.includes("how many") || n.includes("কত")) {
    return `${prefix}${short}You completed ${s.completedToday} deliveries today.`;
  }
  if (n.includes("current") || n.includes("where") || n.includes("order") || n.includes("অর্ডার")) {
    if (!s.currentDelivery) return `${prefix}${short}You do not have an active delivery.`;
    return `${prefix}${short}Order ${s.currentDelivery.orderCode} is ${s.currentDelivery.state.replaceAll("_", " ").toLowerCase()}. Pickup ${s.currentDelivery.restaurant}. Drop area ${s.currentDelivery.dropArea}.`;
  }
  if (n.includes("restaurant") || n.includes("ready") || n.includes("রেস্তোরাঁ")) {
    return `${prefix}${short}If the restaurant is not ready: tap Restaurant not ready, wait, do not leave with the wrong bag, and pick up only with the order code. Do not speed to make up time.`;
  }
  if (n.includes("customer") || n.includes("answer") || n.includes("unavailable") || n.includes("গ্রাহক")) {
    return `${prefix}${short}If the customer does not answer: record a contact attempt, wait, then mark Customer not available and contact support. Never mark delivered without OTP.`;
  }
  if (n.includes("breakdown") || n.includes("emergency") || n.includes("accident") || n.includes("vehicle") || n.includes("জরুরি") || n.includes("সাহায্য") || n.includes("বিপদ")) {
    return `${prefix}${short}Emergency protocol: Prioritize your personal safety. If injured or in danger, tap SOS (112). For mechanical breakdown, tap Report Issue in active order; dispatch reassigns delivery to a nearby rider without penalty to your rating or incentives.`;
  }
  if (n.includes("histor")) {
    const lines = s.history
      .slice(0, 5)
      .map((h) => `${h.orderCode} ${h.state} ${formatPaise(h.payoutPaise)}`)
      .join("; ");
    return `${prefix}${short}${lines || "No deliveries in this period."}`;
  }
  return `${prefix}${short}I can explain today's earnings, your current order, pickup waits, or what to do if a customer is unavailable — using only your authorized snapshot.`;
}
