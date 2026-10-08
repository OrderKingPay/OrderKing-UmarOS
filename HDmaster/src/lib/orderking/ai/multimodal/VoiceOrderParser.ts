import OpenAI from 'openai';

export interface ParsedCartItem {
  name: string;
  quantity: number;
  modifiers?: string[];
}

export class VoiceOrderParser {
  private openaiClient: OpenAI;
  private model: string;

  constructor(client?: OpenAI, model: string = "gpt-4o") {
    this.openaiClient = client || new OpenAI();
    this.model = model;
  }

  /**
   * Parses transcribed speech into structured cart items using OpenAI tool calling.
   * @param transcribedText The speech-to-text string, e.g., "I want two biryanis and a coke to my home"
   */
  public async parseOrder(transcribedText: string): Promise<ParsedCartItem[]> {
    const response = await this.openaiClient.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: "You are an AI order parsing assistant for a restaurant. Extract the ordered items, their quantities, and any modifiers from the user's spoken text. Return them exactly."
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
            description: "Extracts items the user wants to order.",
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
      throw new Error("Failed to parse order from text.");
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
