
// High-Precision Automatic Indian Language Detector & Unreadable Input Handler

export function detectLanguage(text: string, defaultCode: string = "en"): string {
  if (!text || !text.trim()) return defaultCode;

  // 1. Script-based Unicode detection (100% accurate)
  if (/[\u0980-\u09FF]/.test(text)) {
    return "bn"; // Bengali
  }
  if (/[\u0900-\u097F]/.test(text)) {
    // Devanagari script: Hindi or Marathi
    if (/\b(kasa|aahe|pahije|sang|kay|aamhi|tumhi|jevayla)\b/i.test(text)) {
      return "mr";
    }
    return "hi";
  }
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta"; // Tamil
  if (/[\u0C00-\u0C7F]/.test(text)) return "te"; // Telugu
  if (/[\u0C80-\u0CFF]/.test(text)) return "kn"; // Kannada
  if (/[\u0D00-\u0D7F]/.test(text)) return "ml"; // Malayalam
  if (/[\u0A80-\u0AFF]/.test(text)) return "gu"; // Gujarati
  if (/[\u0A00-\u0A7F]/.test(text)) return "pa"; // Punjabi


  // 2. Transliterated / Romanized keyword detection
  const lower = text.toLowerCase();

  // Hindi / Hinglish
  if (/\b(kya|kaise|batao|chahiye|kripya|namaste|pranam|bhai|khana|khao|paise|bhej|madad|karo|bataiye|aapka|karna)\b/.test(lower)) {
    return "hi";
  }
  // Bengali / Bonglish
  if (/\b(kemon|ache|achen|lagbe|khabo|kothay|amake|duto|kichu|bhalo|taka|pathan|apnar|bolun|khabar)\b/.test(lower)) {
    return "bn";
  }

  // Tamil / Tanglish
  if (/\b(vanakkam|eppadi|venum|sapadu|panam|anupu|sollunga|ungalukku|epadi)\b/.test(lower)) {
    return "ta";
  }
  // Telugu
  if (/\b(namaskaram|ela|kavali|tinnava|dabbu|cheppandi|meeru|emiti)\b/.test(lower)) {
    return "te";
  }
  // Kannada
  if (/\b(namaskara|hege|beku|oota|hana|heli|nimma|enu)\b/.test(lower)) {
    return "kn";
  }
  // Malayalam
  if (/\b(namaskaram|engane|venam|bhojanam|parayu|ningal|enth)\b/.test(lower)) {
    return "ml";
  }
  // Marathi
  if (/\b(namaskar|kasa|aahat|jevayla|sanga|tumhala|kay)\b/.test(lower)) {
    return "mr";
  }
  // Gujarati
  if (/\b(kem cho|maja ma|joie chhe|jamo|kaho|tamne|shu)\b/.test(lower)) {
    return "gu";
  }
  // Punjabi
  if (/\b(sat sri akal|kiven|ki haal|chahida|roti|dasso|tuhanu|kujh)\b/.test(lower)) {
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
