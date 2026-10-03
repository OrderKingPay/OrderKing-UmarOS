import { createFileRoute } from "@tanstack/react-router";

/**
 * OpenAI integration is fail-closed until a real server-side provider
 * configuration exists. Never return a fabricated AI response.
 */
export const APIRoute = createAPIFileRoute('/api/v1/integrations/openai')({
  POST: async ({ request }) => {
    try {
      const body = (await request.json()) as { prompt?: unknown };
      const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

      if (!prompt) {
        return Response.json({ error: 'A prompt is required.' }, { status: 400 });
      }

      const apiKey = process.env.OPENAI_API_KEY;
      const model = process.env.OPENAI_MODEL;

      if (!apiKey || !model) {
        return Response.json(
          {
            error: 'OpenAI is not configured. Configure OPENAI_API_KEY and OPENAI_MODEL in Cloudflare secrets.',
            code: 'AI_PROVIDER_NOT_CONFIGURED',
          },
          { status: 503, headers: { 'Cache-Control': 'no-store' } },
        );
      }

      return Response.json(
        {
          error: 'OpenAI transport is not yet wired to the production AI gateway.',
          code: 'AI_PROVIDER_PENDING',
          provider: 'openai',
          model,
        },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    } catch {
      return Response.json(
        { error: 'Invalid request body.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }
  },
});
