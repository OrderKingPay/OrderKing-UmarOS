import { createFileRoute } from "@tanstack/react-router";

// @ts-ignore: Router tree is generated during build
export const Route = createFileRoute("/api/v1/integrations/openai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { prompt } = await request.json();
          if (typeof prompt !== "string" || !prompt.trim()) return Response.json({ error: "prompt is required" }, { status: 400 });
          if (!process.env.OPENAI_API_KEY?.trim()) {
            return Response.json({ success: false, status: "PENDING_EXTERNAL_PROVIDER", message: "OpenAI provider is not configured; no AI response is simulated." }, { status: 503 });
          }
          return Response.json({ success: false, status: "PENDING_PROVIDER_ADAPTER", message: "OpenAI credentials are present but this endpoint does not expose a verified adapter yet." }, { status: 503 });
        } catch {
          return Response.json({ success: false, error: "Invalid AI request" }, { status: 400 });
        }
      },
    },
  },
});
