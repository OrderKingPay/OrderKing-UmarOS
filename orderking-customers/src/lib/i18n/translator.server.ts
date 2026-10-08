import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});

// In-memory cache
// Map: <language> -> <text> -> <translated_text>
const cache = new Map<string, Map<string, string>>();

/**
 * Translates a food menu item or description into the target language.
 * Uses an in-memory cache to prevent duplicate translations of identical strings.
 * 
 * Supported target languages: Hindi ('hi'), Tamil ('ta'), Telugu ('te'), Arabic ('ar').
 */
export async function translate(text: string, targetLang: 'hi' | 'ta' | 'te' | 'ar'): Promise<string> {
  if (!text) return text;

  if (!cache.has(targetLang)) {
    cache.set(targetLang, new Map<string, string>());
  }

  const langCache = cache.get(targetLang)!;
  if (langCache.has(text)) {
    return langCache.get(text)!;
  }

  const langName = getLanguageName(targetLang);
  const prompt = `Translate the following food menu item or description into ${langName}. Provide ONLY the translation, no extra text or markdown formatting.\n\nText: ${text}`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.1,
      }
    });

    const translation = response.text?.trim();
    if (translation) {
      langCache.set(text, translation);
      return translation;
    }
    
    return text; // Fallback to original text if translation is empty
  } catch (error) {
    console.error('Translation failed:', error);
    return text; // Fallback to original text on error
  }
}

function getLanguageName(code: string): string {
  switch (code) {
    case 'hi': return 'Hindi';
    case 'ta': return 'Tamil';
    case 'te': return 'Telugu';
    case 'ar': return 'Arabic';
    default: return 'English';
  }
}
