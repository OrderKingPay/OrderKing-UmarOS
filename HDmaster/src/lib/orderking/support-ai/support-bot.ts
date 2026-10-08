import { getSql } from '../../db';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function handleCustomerQuery(userId: string, message: string) {
    const sql = await getSql();
    const recentOrders = await sql`SELECT * FROM orders WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 5`;
    
    const context = JSON.stringify(recentOrders);
    const systemPrompt = `You are a helpful customer support bot for OrderKing. Here are the user's recent orders for context: ${context}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            { role: 'user', parts: [{ text: message }] }
        ],
        config: {
            systemInstruction: systemPrompt
        }
    });
    
    return response.text;
}
