// @ts-nocheck
import { createAPIFileRoute } from '@/lib/createAPIFileRoute';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});

export const Route = createAPIFileRoute("/api/ai")({
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const body = await request.json();
          const { message, context, history } = body;
          
          if (!message) {
            return new Response(JSON.stringify({ error: "Message is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }

          const systemInstruction = `You are an elite FoodTech growth advisor for OrderKing (UMAR OS).
Your goal is to provide predictive analytics, operational insights, and restaurant growth strategies to restaurant partners and admins.
Context provided: ${JSON.stringify(context || {})}.
Act as the AI Tutor and Restaurant Growth engine.
Be concise, analytical, and highly actionable. Base recommendations on real-world restaurant metrics.`;

          const response = await ai.models.generateContent({
            model: "gemini-3.1-pro",
            contents: message,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.7,
            }
          });

          return new Response(JSON.stringify({ 
            text: response.text,
            success: true
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (error: any) {
          console.error("[AI Tutor Engine] API Error:", error);
          return new Response(JSON.stringify({ error: "Failed to generate AI response", details: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      },
    },
  },
});
