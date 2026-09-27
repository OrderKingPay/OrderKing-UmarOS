import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export class AIDispatchEngine {
  /**
   * Autonomously assigns orders to the most optimal rider.
   * Replaces human fleet managers and legacy dispatch algorithms.
   */
  static async optimizeDispatch(orderId: string, restaurantLocation: string, availableRiders: any[]) {
    const systemPrompt = `You are the Supreme Rider Dispatch AI for OrderKing.
Your goal is to assign the incoming order to the single best rider based on location, active jobs, and vehicle type.
Output valid JSON: { "assignedRiderId": "string", "etaMinutes": number, "reasoning": "string" }
Rules:
- Give preference to riders within 2km of the restaurant.
- Riders on a bicycle get shorter trips (<3km), motorcycles get longer trips.
- If multiple riders match, choose the one with zero active orders.`;

    const { text } = await generateText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      prompt: `Order ID: ${orderId}\nRestaurant Loc: ${restaurantLocation}\nRiders: ${JSON.stringify(availableRiders)}`,
    });

    try {
      const decision = JSON.parse(text);
      return decision;
    } catch (e) {
      // Fallback
      return { assignedRiderId: availableRiders[0]?.id || 'queue', etaMinutes: 30, reasoning: 'Fallback assignment' };
    }
  }
}
