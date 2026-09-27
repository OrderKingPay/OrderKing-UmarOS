import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export class AICustomerSupportEngine {
  /**
   * Resolves customer complaints autonomously.
   * Replaces Tier 1 and Tier 2 human customer support.
   */
  static async resolveComplaint(customerId: string, orderId: string, issueText: string, imageUrl?: string) {
    const systemPrompt = `You are the Supreme AI Support Agent for OrderKing.
Your goal is to resolve customer complaints instantly without human intervention.
You have the authority to issue refunds up to $50 autonomously.
Rules:
1. If the food is cold, late by >30 mins, or missing items, apologize and issue a partial or full refund.
2. If the customer is abusive, warn them and flag the account.
3. Output MUST be valid JSON: { "resolution": "refund" | "apology" | "flag", "refundAmount": number, "customerMessage": "string" }`;

    const { text } = await generateText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      prompt: `Order: ${orderId}\nIssue: ${issueText}\nImage Proof: ${imageUrl ? 'Provided' : 'None'}`,
    });

    try {
      const decision = JSON.parse(text);
      
      if (decision.resolution === 'refund' && decision.refundAmount > 0) {
        await this.processRefund(orderId, decision.refundAmount);
      }

      return decision;
    } catch (e) {
      return { resolution: 'escalate_to_human', customerMessage: "We are reviewing your issue.", refundAmount: 0 };
    }
  }

  private static async processRefund(orderId: string, amount: number) {
    console.log(`[AI FINANCE] Autonomously refunding $${amount} for order ${orderId}`);
    // Simulate database transaction
  }
}
