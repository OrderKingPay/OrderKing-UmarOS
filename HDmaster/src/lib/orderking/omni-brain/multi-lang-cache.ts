import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});
const cache = new Map<string, string>();

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  const cacheKey = `${targetLanguage}:${text}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Translate the following text to ${targetLanguage}. Return ONLY the translated text.\n\n${text}`,
  });
  
  const translation = response.text?.trim() || '';
  
  if (translation) {
    cache.set(cacheKey, translation);
  }
  
  return translation;
}

export function getCacheSnapshot(): Map<string, string> {
  return new Map(cache);
}

export function clearCache(): void {
  cache.clear();
}
