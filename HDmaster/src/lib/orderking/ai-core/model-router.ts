import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI();

export async function routePrompt(prompt: string, requirement: 'speed' | 'reasoning' | 'multimodal') {
  let modelName = 'gemini-2.5-flash';
  
  if (requirement === 'reasoning') {
    modelName = 'gemini-2.5-pro';
  } else if (requirement === 'multimodal' || requirement === 'speed') {
    modelName = 'gemini-2.5-flash';
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
  });

  return response.text;
}
