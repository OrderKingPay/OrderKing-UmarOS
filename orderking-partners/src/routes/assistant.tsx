import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/assistant")({
  component: () => <Navigate to="/kitchen" replace />,
});

export type IndianLanguageSpec = {
  code: string;
  bcp47: string;
  name: string;
  nativeName: string;
  region: string;
};

export const INDIAN_CONSTITUTIONAL_LANGUAGES: readonly IndianLanguageSpec[] = [
  { code: "en", bcp47: "en-IN", name: "English", nativeName: "English", region: "Pan-India" },
  { code: "hi", bcp47: "hi-IN", name: "Hindi", nativeName: "हिन्दी", region: "North & Central India" },
  { code: "bn", bcp47: "bn-IN", name: "Bengali", nativeName: "বাংলা", region: "West Bengal & Tripura" },
  { code: "gu", bcp47: "gu-IN", name: "Gujarati", nativeName: "ગુજરાતી", region: "Gujarat" },
  { code: "kn", bcp47: "kn-IN", name: "Kannada", nativeName: "ಕನ್ನಡ", region: "Karnataka" },
  { code: "ml", bcp47: "ml-IN", name: "Malayalam", nativeName: "മലയാളം", region: "Kerala" },
  { code: "mr", bcp47: "mr-IN", name: "Marathi", nativeName: "मराठी", region: "Maharashtra" },
  { code: "pa", bcp47: "pa-IN", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", region: "Punjab" },
  { code: "ta", bcp47: "ta-IN", name: "Tamil", nativeName: "தமிழ்", region: "Tamil Nadu" },
  { code: "te", bcp47: "te-IN", name: "Telugu", nativeName: "తెలుగు", region: "Andhra & Telangana" },
];
