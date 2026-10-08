import { getSql } from '../../db';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MAX_REFUND_AMOUNT = 50.00; // Strict financial limit

export async function evaluateRefund(orderId: string, complaintText: string) {
    const sql = await getSql();
    const order = await sql`SELECT * FROM orders WHERE id = ${orderId}`;
    
    if (!order || order.length === 0) {
        throw new Error('Order not found');
    }
    
    const orderAgeDays = (Date.now() - new Date((order[0] as any).created_at as string).getTime()) / (1000 * 60 * 60 * 24);
    const orderTotal = parseFloat((order[0] as any).total || '0');
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Evaluate this refund request. Order age is ${orderAgeDays} days. Order total is $${orderTotal}. Complaint: ${complaintText}. Determine if a refund is warranted and specify the refund amount.`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    approve: { type: Type.BOOLEAN },
                    reason: { type: Type.STRING },
                    amount: { type: Type.NUMBER }
                },
                required: ['approve', 'reason', 'amount']
            }
        }
    });
    
    const result = JSON.parse(response.text || '{}');
    
    if (result.approve) {
        // Enforce strict financial limits
        let safeAmount = typeof result.amount === 'number' ? result.amount : 0;
        safeAmount = Math.min(safeAmount, MAX_REFUND_AMOUNT, orderTotal);
        result.amount = safeAmount;
        
        if (safeAmount <= 0) {
            result.approve = false;
            result.reason = 'Calculated refund amount was zero or invalid.';
        }
    } else {
        result.amount = 0;
    }
    
    return result;
}
