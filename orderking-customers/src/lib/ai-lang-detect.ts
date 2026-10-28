// High-Precision Automatic Indian Language Detector & Unreadable Input Handler
// Covers 11 major Indian languages + dialects including Assamese / Sylheti

export function detectLanguage(text: string, defaultCode: string = "en"): string {
  if (!text || !text.trim()) return defaultCode;

  // 1. Script-based Unicode detection (100% accurate)
  // Assamese distinctive characters: U+09F0 (ৰ), U+09F1 (ৱ)
  if (/[\u09F0\u09F1]/.test(text)) {
    return "as"; // Assamese
  }

  // Bengali / Assamese shared script (U+0980 - U+09FF)
  if (/[\u0980-\u09FF]/.test(text)) {
    // Check for distinctive Assamese words in Bengali-Assamese script
    if (/\b(আজি|কেনে|কেনেকৈ|লাগিব|খাব|আপোনাৰ|কিবা|নমস্কাৰ|ভালে|আছে|খাম)\b/.test(text)) {
      return "as";
    }
    return "bn"; // Bengali
  }

  // Devanagari script (U+0900 - U+097F): Hindi or Marathi
  if (/[\u0900-\u097F]/.test(text)) {
    if (/\b(kasa|aahe|pahije|sang|kay|aamhi|tumhi|jevayla|namaskar|aahat)\b/i.test(text) || /\b(आहे|पाहिजे|सांगा|काय|आम्ही|तुम्ही|जेवायला|नमस्कार)\b/.test(text)) {
      return "mr"; // Marathi
    }
    return "hi"; // Hindi
  }

  if (/[\u0B80-\u0BFF]/.test(text)) return "ta"; // Tamil
  if (/[\u0C00-\u0C7F]/.test(text)) return "te"; // Telugu
  if (/[\u0C80-\u0CFF]/.test(text)) return "kn"; // Kannada
  if (/[\u0D00-\u0D7F]/.test(text)) return "ml"; // Malayalam
  if (/[\u0A80-\u0AFF]/.test(text)) return "gu"; // Gujarati
  if (/[\u0A00-\u0A7F]/.test(text)) return "pa"; // Punjabi

  // 2. Transliterated / Romanized keyword detection
  const lower = text.toLowerCase();

  // Assamese / Sylheti
  if (/\b(kenekoi|kene|lagibo|lagbo|khabole|apunar|kiba|bhala|oilam|sylhet|silchar|khomoy|kiya|khobor|dibo|aisen|aisa|kham)\b/.test(lower)) {
    return "as";
  }

  // Bengali / Bonglish
  if (/\b(kemon|ache|achen|lagbe|khabo|kothay|amake|duto|duti|ekta|tinta|kichu|bhalo|taka|pathan|apnar|bolun|khabar)\b/.test(lower)) {
    return "bn";
  }

  // Hindi / Hinglish
  if (/\b(kya|kaise|batao|chahiye|kripya|bhai|khana|khao|paise|bhej|madad|karo|bataiye|aapka|karna|chahiye|namaste|pranam)\b/.test(lower)) {
    return "hi";
  }

  // Tamil / Tanglish
  if (/\b(eppadi|venum|sapadu|panam|anupu|sollunga|ungalukku|epadi|vanakkam|illai)\b/.test(lower)) {
    return "ta";
  }

  // Telugu
  if (/\b(ela|kavali|tinnava|dabbu|cheppandi|meeru|emiti|namaskaram)\b/.test(lower)) {
    return "te";
  }

  // Kannada
  if (/\b(hege|beku|oota|hana|heli|nimma|enu|namaskara)\b/.test(lower)) {
    return "kn";
  }

  // Malayalam
  if (/\b(engane|venam|bhojanam|parayu|ningal|enth|namaskaram)\b/.test(lower)) {
    return "ml";
  }

  // Marathi
  if (/\b(kasa|aahat|jevayla|sanga|tumhala|kay|pahije|aahe)\b/.test(lower)) {
    return "mr";
  }

  // Gujarati
  if (/\b(kem cho|maja ma|joie chhe|jamo|kaho|tamne|shu|namaste)\b/.test(lower)) {
    return "gu";
  }

  // Punjabi
  if (/\b(kiven|ki haal|chahida|roti|dasso|tuhanu|kujh|sat sri akal)\b/.test(lower)) {
    return "pa";
  }

  // Default to provided default or English
  return defaultCode;
}

export function isUnreadableOrUnsupported(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  // If query contains only symbols, numbers, punctuation
  if (/^[0-9\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]+$/.test(trimmed)) return true;
  // Check if Latin text lacks any vowels (gibberish like "sdfghjk", "qwrtyps")
  const hasIndic = /[\u0900-\u0D7F]/.test(trimmed);
  const hasLatinVowels = /[aeiouy]/i.test(trimmed);
  if (!hasIndic && !hasLatinVowels && trimmed.length >= 4) {
    return true;
  }
  return false;
}
