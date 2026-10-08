import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI(); // Defaults to process.env.GEMINI_API_KEY

/**
 * Processes an audio file containing a customer's voice order and extracts structured order data.
 * 
 * @param audioBase64 The raw audio file encoded in base64.
 * @param mimeType The mime type of the audio (e.g., 'audio/mp3', 'audio/wav', 'audio/webm').
 * @returns The structured JSON response indicating intent and order items.
 */
export async function processAudioOrder(audioBase64: string, mimeType: string) {
    const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            intent: {
                type: Type.STRING,
                description: "The primary intent of the user, e.g., 'PLACE_ORDER'",
            },
            items: {
                type: Type.ARRAY,
                description: "List of items the user wants to order",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: {
                            type: Type.STRING,
                            description: "Name of the item being ordered",
                        },
                        quantity: {
                            type: Type.INTEGER,
                            description: "Quantity of the item being ordered",
                        },
                        custom_instructions: {
                            type: Type.STRING,
                            description: "Any special instructions or modifications for this item (e.g., 'no onions', 'extra spicy'). Empty if none.",
                        },
                    },
                    required: ["name", "quantity", "custom_instructions"],
                },
            },
        },
        required: ["intent", "items"],
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            {
                role: 'user',
                parts: [
                    { 
                        text: "Listen to the following audio and extract the customer's food order. Ensure you capture the items, quantities, and any specific instructions they mention." 
                    },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: audioBase64
                        }
                    }
                ]
            }
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.1, // Keep it highly deterministic for order extraction
        }
    });

    if (!response.text) {
        throw new Error("Failed to generate a valid response from the Gemini API");
    }

    return JSON.parse(response.text);
}
