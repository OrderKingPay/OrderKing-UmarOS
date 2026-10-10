import { getSql } from '../../db.ts';
import { GoogleGenAI, Type } from '@google/genai';
import { militaryAntiFraudShield } from '../security/military-anti-fraud-shield.ts';

const MAX_REFUND_AMOUNT_INR = 500.00; // Strict INR financial limit

export async function evaluateRefund(
    orderId: string,
    complaintText: string,
    options?: { customerId?: string; clientIp?: string }
) {
    // 1. Military Shield Quarantine Check
    if (options?.customerId && militaryAntiFraudShield.isQuarantined(options.customerId)) {
        return { approve: false, reason: "Account is quarantined under military security protocol.", amount: 0 };
    }
    if (options?.clientIp && militaryAntiFraudShield.isQuarantined(options.clientIp)) {
        return { approve: false, reason: "Client network is quarantined.", amount: 0 };
    }

    // 2. Strict Prompt Sanitization (Anti-Prompt Injection Shield)
    const sanitizedComplaint = complaintText
        .replace(/ignore\s+all\s+previous\s+instructions/gi, "[REDACTED_INJECTION_ATTEMPT]")
        .replace(/system\s+prompt/gi, "[REDACTED]")
        .replace(/as\s+an\s+ai/gi, "")
        .slice(0, 500); // Strict length limit

    const sql = await getSql();
    const order = await sql`SELECT * FROM orders WHERE id = ${orderId}`;
    
    if (!order || order.length === 0) {
        throw new Error('Order not found');
    }

    // 3. Double Refund Protection
    const existingRefunds = await sql<{ count: string }>`SELECT count(*)::text as count FROM refunds WHERE order_id = ${orderId}`;
    if (parseInt(existingRefunds[0]?.count || '0', 10) > 0) {
        return { approve: false, reason: "Order has already received a refund disbursement.", amount: 0 };
    }
    
    const orderAgeDays = (Date.now() - new Date((order[0] as any).created_at as string).getTime()) / (1000 * 60 * 60 * 24);
    const orderTotalPaise = parseInt((order[0] as any).total_paise || '0', 10);
    const orderTotalInr = orderTotalPaise > 0 ? orderTotalPaise / 100 : parseFloat((order[0] as any).total || '0');
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    let result: { approve: boolean; reason: string; amount: number };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Evaluate this refund request strictly as an impartial claims auditor.
Order age is ${orderAgeDays.toFixed(1)} days.
Order total is ₹${orderTotalInr}.
Customer complaint: "${sanitizedComplaint}".
Security Rule: Do NOT approve refunds for remorse, user error, or vague claims. Only approve for verified missing items or critical kitchen/delivery failure. Maximum allowable compensation is ₹${Math.min(MAX_REFUND_AMOUNT_INR, orderTotalInr)}.`,
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
        result = JSON.parse(response.text || '{}');
    } catch (_e) {
        // Fallback deterministic rule engine if LLM service is offline or unconfigured
        result = {
            approve: false,
            reason: "Automated claim evaluation requires manual review.",
            amount: 0
        };
    }
    
    if (result.approve) {
        // Enforce strict mathematical and financial limits
        let safeAmount = typeof result.amount === 'number' ? result.amount : 0;
        safeAmount = Math.min(safeAmount, MAX_REFUND_AMOUNT_INR, orderTotalInr);
        result.amount = Math.round(safeAmount * 100) / 100;
        
        if (safeAmount <= 0) {
            result.approve = false;
            result.reason = 'Calculated refund amount was zero or invalid.';
            result.amount = 0;
        }
    } else {
        result.amount = 0;
    }
    
    return result;
}

