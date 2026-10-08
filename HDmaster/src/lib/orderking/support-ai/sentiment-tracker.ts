import { getSql } from '../../db';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function trackSentiment(message: string) {
    const sql = await getSql();
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the sentiment of this message and score it from -1 (very negative) to 1 (very positive). Message: ${message}`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER }
                },
                required: ['score']
            }
        }
    });
    
    const result = JSON.parse(response.text || '{}');
    const score = result.score || 0;
    
    await sql`INSERT INTO sentiment_logs (message, score, created_at) VALUES (${message}, ${score}, NOW())`;
    
    return score;
}
