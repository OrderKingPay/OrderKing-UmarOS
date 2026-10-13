import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export type ConciergeArea = "food" | "kingpay" | "travel";

type Input = {
  message: string;
  area: ConciergeArea;
  history: { role: "user" | "assistant"; content: string }[];
};

const buckets = new Map<string, number[]>();
function allowCall(userId: string): boolean {
  const now = Date.now();
  const recent = (buckets.get(userId) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= 6) return false;
  recent.push(now);
  buckets.set(userId, recent);
  return true;
}

/** No administrative tools, no money transfers, no database writes, no status claims. */
export const askReadOnlyConcierge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: Input) => data)
  .handler(async ({ context, data }: any): Promise<{ reply: string; available: boolean }> => {
    const message = typeof data.message === "string" ? data.message.trim() : "";
    if (!message || message.length > 1200) {
      return { reply: "Enter a question up to 1,200 characters.", available: false };
    }
    if (!allowCall(context.userId)) {
      return { reply: "Please wait a minute before sending another question.", available: false };
    }
    const area: ConciergeArea = ["food", "kingpay", "travel"].includes(data.area) ? data.area : "food";
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return { reply: "Live AI chat isn't configured at the moment. You can still use the Orders and Support pages.", available: false };
    }
    const recentHistory = Array.isArray(data.history)
      ? data.history.slice(-6).filter((m: any) =>
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" && m.content.length <= 1200)
      : [];
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.3,
          max_tokens: 420,
          messages: [
            { role: "system", content:
              "You are OrderKing's read-only customer concierge. Service: " + area +
              ". Be helpful in the customer's language and conversational about any topic. " +
              "Never claim to have changed a setting, issued a refund, booked travel, tracked live orders, sent payment, approved a wallet, or accessed records. " +
              "You have no live account tools and no privileged functions. " +
              "For personal transaction status, guide the customer to their authenticated Orders or Support page. " +
              "If live provider availability or verified funding is unknown, say so clearly. " +
              "Never promise cash credits or guaranteed provider service. Keep answers concise." },
            ...recentHistory,
            { role: "user", content: message },
          ],
        }),
      });
      if (!response.ok) return { reply: "AI chat is temporarily unavailable. Please use Support for account assistance.", available: false };
      const body: any = await response.json();
      const text = body?.choices?.[0]?.message?.content;
      if (typeof text !== "string" || !text.trim()) {
        return { reply: "I couldn't get an answer right now. Please try again.", available: false };
      }
      return { reply: text.slice(0, 3000), available: true };
    } catch {
      return { reply: "AI chat is unavailable right now. No account action was taken.", available: false };
    }
  });
