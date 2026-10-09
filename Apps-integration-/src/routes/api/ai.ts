import { createAPIFileRoute } from "@/lib/createAPIFileRoute";
import { GoogleGenAI } from "@google/genai/web";

export const Route = createAPIFileRoute("/api/ai")({
  server: {
    handlers: {
      GET: async () => {
        // Evaluate available providers based on environment securely
        const availableModels = [];
        
        if (process.env.GEMINI_API_KEY) {
           availableModels.push({
              id: "gemini-1.5-pro",
              provider: "google",
              name: "Google Gemini 1.5 Pro",
              capabilities: ["reasoning", "multimodal"],
              tier: "high"
           });
           availableModels.push({
              id: "gemini-1.5-flash",
              provider: "google",
              name: "Google Gemini 1.5 Flash",
              capabilities: ["speed", "multimodal"],
              tier: "fast"
           });
        }
        
        if (process.env.OPENAI_API_KEY) {
           availableModels.push({
              id: "gpt-4o",
              provider: "openai",
              name: "OpenAI GPT-4o",
              capabilities: ["reasoning", "multimodal"],
              tier: "high"
           });
        }

        return new Response(JSON.stringify({ 
          models: availableModels,
          status: availableModels.length > 0 ? 'online' : 'offline',
          message: availableModels.length === 0 ? "No AI providers configured. Add API keys to environment." : "AI subsystem operational."
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      },
      
      POST: async ({ request }: any) => {
        try {
          const body = await request.json();
          const { message, context, history, intent } = body;
          
          if (!message) {
            return new Response(JSON.stringify({ error: "Message is required" }), { status: 400 });
          }

          // Intelligent routing logic
          const needsSpeed = intent === 'support_triage' || intent === 'quick_reply';
          const defaultModel = needsSpeed ? "gemini-1.5-flash" : "gemini-1.5-pro";

          if (!process.env.GEMINI_API_KEY) {
             return new Response(JSON.stringify({
               text: "The AI router is currently offline. To activate predictive analytics and intelligent routing, the Founder must inject secure provider keys (e.g. GEMINI_API_KEY) into the environment.",
               routedTo: "fallback",
               success: true
             }), { status: 200, headers: { "Content-Type": "application/json" } });
          }

          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          
          const systemInstruction = `You are an elite FoodTech AI embedded within UMAR OS (OrderKing).
Context: ${JSON.stringify(context || {})}.
Be highly actionable, strictly factual, and prioritize platform profitability and operational efficiency.`;

          const response = await ai.models.generateContent({
            model: defaultModel,
            contents: message,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.7,
            }
          });

          return new Response(JSON.stringify({ 
            text: response.text,
            routedTo: defaultModel,
            success: true
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (error: any) {
          console.error("[AI Router] Fault:", error);
          return new Response(JSON.stringify({ error: "AI execution fault", details: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      },
    },
  },
});

