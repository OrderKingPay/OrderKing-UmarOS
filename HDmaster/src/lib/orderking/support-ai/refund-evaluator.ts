import { getSql } from '../../db';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function evaluateRefund(orderId: string, complaintText: string) {
    const sql = await getSql();
    const order = await sql`SELECT * FROM orders WHERE id = ${orderId}`;
    
    if (!order || order.length === 0) {
        throw new Error('Order not found');
    }
    
    const orderAgeDays = (Date.now() - new Date((order[0] as any).created_at as string).getTime()) / (1000 * 60 * 60 * 24);
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Evaluate this refund request. Order age is ${orderAgeDays} days. Complaint: ${complaintText}`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    approve: { type: Type.BOOLEAN },
                    reason: { type: Type.STRING }
                },
                required: ['approve', 'reason']
            }
        }
    });
    
    return JSON.parse(response.text || '{}');
}
