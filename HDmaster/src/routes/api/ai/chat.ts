import { createAPIFileRoute } from '@tanstack/start/api';
import { AgentExecutorEngine } from '@/lib/orderking/ai/agent-executor.server';
import { checkRateLimit } from '@/lib/orderking/security/rate-limiter';

export const APIRoute = createAPIFileRoute('/api/ai/chat')({
  POST: async ({ request }) => {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const limitRes = checkRateLimit(ip, 5, 60000);
    
    if (!limitRes.allowed) {
      return new Response(JSON.stringify(limitRes), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }

    try {
      const { message, conversationId } = await request.json();
      const response = await AgentExecutorEngine.execute(message, conversationId);
      return new Response(JSON.stringify({ response }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }
});
