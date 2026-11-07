import React from "react";
import type { AppLanguage } from "@/lib/platform-config";

interface KingPaySoundboxEngineProps {
  merchantId: string;
  defaultLang?: AppLanguage;
}

export function buildSoundboxSpeechAlert(lang: AppLanguage, amountRs: number): string {
  switch (lang) {
    case "hi":
      return `ऑर्डर किंग पर ${amountRs} रुपये प्राप्त हुए।`;
    case "bn":
      return `অর্ডার কিং-এ ${amountRs} টাকা পাওয়া গেছে।`;
    case "gu":
      return `ઓર્ડર કિંગ પર ${amountRs} રૂપિયા મળ્યા.`;
    case "kn":
      return `ಆರ್ಡರ್ ಕಿಂಗ್ ನಲ್ಲಿ ${amountRs} ರೂಪಾಯಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ.`;
    case "ml":
      return `ഓർഡർ കിംഗിൽ ${amountRs} രൂപ ലഭിച്ചു.`;
    case "mr":
      return `ऑर्डर किंग वर ${amountRs} रुपये मिळाले.`;
    case "pa":
      return `ਆਰਡਰ ਕਿੰਗ 'ਤੇ ${amountRs} ਰੁਪਏ ਪ੍ਰਾਪਤ ਹੋਏ।`;
    case "ta":
      return `ஆர்டர் கிங்-யில் ${amountRs} ரூபாய் பெறப்பட்டது.`;
    case "te":
      return `ఆర్డర్ కింగ్ లో ${amountRs} రూపాయలు వచ్చాయి.`;
    case "en":
    default:
      return `Received ₹${amountRs} on OrderKing.`;
  }
}

export const KingPaySoundboxEngine: React.FC<KingPaySoundboxEngineProps> = () => {
  // Headless operational sound engine for incoming order announcements
  return null;
};

export default KingPaySoundboxEngine;
