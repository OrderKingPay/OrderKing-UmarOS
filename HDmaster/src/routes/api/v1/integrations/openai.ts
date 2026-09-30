import OpenAI from "openai";
import { createAPIFileRoute } from "@tanstack/react-start/api";

const DEFAULT_MODEL = "gpt-5.6-luna";

export const APIRoute = createAPIFileRoute("/api/v1/integrations/openai")({
  POST: async ({ request }: any) => {
    try {
      const { prompt } = await request.json();
      const text = typeof prompt === "string" ? prompt.trim() : "";

      if (!text) {
        return new Response(JSON.stringify({ error: "prompt is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const apiKey = process.env.OPENAI_API_KEY?.trim();
      if (!apiKey) {
        return new Response(
          JSON.stringify({
            error: "OpenAI is not configured on this server.",
            code: "OPENAI_NOT_CONFIGURED",
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const client = new OpenAI({ apiKey });
      const response = await client.responses.create({
        model: process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL,
        input: text,
      });

      return new Response(
        JSON.stringify({
          success: true,
          model: response.model,
          ai_response: response.output_text,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("[openai] request failed:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "OpenAI request failed.",
          code: "OPENAI_REQUEST_FAILED",
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
});
