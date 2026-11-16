import { createAPIFileRoute } from "@/lib/createAPIFileRoute";
import { getSessionUser } from "@/lib/auth/verify.server";
import { isAuthorizedAdmin } from "@/lib/orderking/server/workspace.server";
import { OpenAIProvider } from "@/lib/orderking/ai/providers/openai-provider";

export const APIRoute = createAPIFileRoute("/api/v1/integrations/openai")({
  POST: async ({ request }: any) => {
    try {
      const session = await getSessionUser();
      if (!session?.id) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const isAuth = await isAuthorizedAdmin(session.id, session.email);
      if (!isAuth) {
        return new Response(
          JSON.stringify({ success: false, error: "Forbidden: Founder or Admin role required" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "OPENAI_API_KEY is not configured in server environment variables.",
          }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      }

      const body = await request.json().catch(() => ({}));
      const prompt = body?.prompt;
      if (!prompt || typeof prompt !== "string") {
        return new Response(JSON.stringify({ success: false, error: "prompt string required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const provider = new OpenAIProvider(apiKey);
      const res = await provider.chat({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
      });

      return new Response(JSON.stringify({ success: true, ai_response: res.text }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Internal Server Error",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
});
