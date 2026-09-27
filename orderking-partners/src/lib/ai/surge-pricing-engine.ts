import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export class SurgePricingEngine {
  /**
   * Evaluates if surge pricing should be applied based on real-time factors.
   * Replaces human pricing analysts.
   */
  static async calculateSurge(restaurantId: string, currentDemand: number, activeRiders: number, weatherConditions: string) {
    const systemPrompt = `You are the Supreme Pricing AI for OrderKing.
Analyze the current market conditions and decide if surge pricing (dynamic delivery fee multiplier) should be active.
Output valid JSON: { "multiplier": number, "reason": "string" }
Rules:
- Base multiplier is 1.0.
- If demand outpaces riders by 2x, multiplier should be 1.5 to 2.5.
- Bad weather (rain, storm) adds +0.5 to multiplier.
- Max multiplier is 3.0.`;

    const { text } = await generateText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      prompt: `Restaurant: ${restaurantId}\nDemand (orders/hr): ${currentDemand}\nRiders in area: ${activeRiders}\nWeather: ${weatherConditions}`,
    });

    try {
      return JSON.parse(text);
    } catch (e) {
      return { multiplier: 1.0, reason: "Default baseline" };
    }
  }
}
