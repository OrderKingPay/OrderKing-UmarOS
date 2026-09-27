import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { RiderEngine } from "@/lib/rider/engine";
import { PgStore } from "@/lib/rider/pg-store";
import { OpenAIProvider } from "@/lib/ai/providers/openai-provider";

const POLICY = `
You are the OrderKing Rider Co-Pilot.
Use only the authorized rider snapshot supplied by the server.
Never invent earnings, payouts, addresses, OTPs, customer names, order states, reassignments, refunds, incentives, or policy outcomes.
If a fact is absent, say that it is unavailable.
Never encourage speeding, phone use while riding, ignoring traffic law, or unsafe riding.
When the rider is busy, answer briefly and prioritize safety.
Do not claim that an action was executed unless a server action confirms it.
`;

type Snapshot = Awaited<ReturnType<RiderEngine["snapshotForAssistant"]>>;

export const askAssistantFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { question: string; busy: boolean }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const engine = new RiderEngine(new PgStore(sql));
    await engine.ensureRider({ id: context.userId });

    const snapshot = await engine.snapshotForAssistant(context.userId);
    const question = data.question.trim().slice(0, 1000);
    if (!question) throw new Error("Ask a question.");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        code: "AI_UNAVAILABLE" as const,
        text: "Rider AI is not configured on this deployment. No simulated answer will be shown.",
      };
    }

    const provider = new OpenAIProvider(apiKey);
    const response = await provider.chat({
      model: process.env.OPENAI_RIDER_MODEL || "gpt-5.6-luna",
      systemPrompt: `${POLICY}
Authorized rider snapshot:
${JSON.stringify(snapshot)}
`,
      messages: [
        { role: "user", content: question },
      ],
      temperature: 0.2,
      maxTokens: data.busy ? 260 : 600,
    });

    const text = response.text.trim();
    if (!text) {
      return {
        ok: false as const,
        code: "EMPTY_AI_RESPONSE" as const,
        text: "Rider AI returned no answer.",
      };
    }

    return {
      ok: true as const,
      text,
      provider: response.provider,
      model: response.model,
    };
  });
