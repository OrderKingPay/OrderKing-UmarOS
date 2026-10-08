import OpenAI from 'openai';
import { ParsedCartItem } from './VoiceOrderParser';

export class RegionalVoiceParser {
  private openaiClient: OpenAI;
  private model: string;

  constructor(client?: OpenAI, model: string = "gpt-4o") {
    this.openaiClient = client || new OpenAI();
    this.model = model;
  }

  /**
   * Parses transcribed speech from regional Indian dialects (Hindi, Telugu, etc.) into structured cart items.
   * Targets Tier-2/Tier-3 user bases.
   * @param transcribedText The speech-to-text string in a regional dialect or mix.
   */
  public async parseRegionalOrder(transcribedText: string): Promise<ParsedCartItem[]> {
    const response = await this.openaiClient.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: "You are an AI order parsing assistant specialized in Indian regional languages (Hindi, Marathi, Telugu, Tamil, etc.) and mixed-language (e.g., Hinglish). Extract the ordered items, their quantities, and any modifiers from the user's spoken text. Return them exactly, translating item names to English where standard, but preserving well-known Indian dish names (e.g., 'biryani', 'paneer butter masala')."
        },
        {
          role: "user",
          content: transcribedText
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_cart_items",
            description: "Extracts items the user wants to order from a regional dialect input.",
            parameters: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                        description: "The name of the item ordered (e.g. 'biryani', 'coke')"
                      },
                      quantity: {
                        type: "number",
                        description: "The quantity ordered"
                      },
                      modifiers: {
                        type: "array",
                        items: {
                          type: "string"
                        },
                        description: "Any modifiers or special instructions (e.g. 'extra spicy', 'no ice')"
                      }
                    },
                    required: ["name", "quantity"],
                    additionalProperties: false
                  }
                }
              },
              required: ["items"],
              additionalProperties: false
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "extract_cart_items" } }
    });

    const toolCalls = response.choices[0]?.message?.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
      throw new Error("Failed to parse regional order from text.");
    }

    try {
      const firstCall = toolCalls[0];
      if (firstCall.type !== 'function') throw new Error('Expected a function call.');
      const parsedArgs = JSON.parse(firstCall.function.arguments);
      return parsedArgs.items as ParsedCartItem[];
    } catch (error) {
      throw new Error(`Error parsing function arguments: ${error}`);
    }
  }
}
