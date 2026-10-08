import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});

export async function parseVoiceToPrompt(base64Audio: string, mimeType: string = 'audio/mp3'): Promise<string> {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            data: base64Audio,
                            mimeType: mimeType
                        }
                    },
                    {
                        text: 'Analyze this audio and create a detailed image/video generation prompt based on its contents.'
                    }
                ]
            }
        ]
    });
    
    return response.text || 'A beautiful cinematic scene';
}
