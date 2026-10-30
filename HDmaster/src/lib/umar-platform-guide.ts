export interface PlatformModuleGuide {
  id: string;
  name: string;
  navigationPath: string;
  description: string;
  editableFields: string[];
  troubleshooting: string;
}
export const UMAROS_PLATFORM_DIRECTORY: PlatformModuleGuide[] = [
  {
    id: "sms_otp",
    name: "SMS, Voice & WhatsApp OTP Gateway",
    navigationPath: "UmarOS Top Nav → App UI & Platform Settings → SMS & OTP Gateway",
    description: "Controls 2Factor.in SMS (AUTOGEN & DLT Template), 2Factor Voice Call OTP backup, Fast2SMS, and WhatsApp verification across Customer, Partner, Rider, and Admin apps.",
    editableFields: ["TWO_FACTOR_API_KEY", "TWOFACTOR_OTP_TEMPLATE", "FAST2SMS_API_KEY", "Default OTP Channel (SMS + Voice / Voice / WhatsApp)"],
    troubleshooting: "If Indian telecom DLT blocks custom SMS text, leave TWOFACTOR_OTP_TEMPLATE blank to use 2Factor AUTOGEN + automatic Voice Call backup, or enter your approved 6-character DLT Template Name."
  },
  {
    id: "maps_geo",
    name: "Live Maps, OpenStreetMap & Geofencing",
    navigationPath: "UmarOS Top Nav → Live Radar (GodEye Map) & Zone Geofence",
    description: "Provides keyless OpenStreetMap street tiles + Nominatim address search & GPS reverse-geocoding, plus optional Mapbox GL vector rendering.",
    editableFields: ["Default Hub Coordinates (Guwahati 26.1445, 91.7362)", "Delivery Radius (km)", "Base Delivery Fee (₹)", "Per-Km Rider Payout (₹)", "VITE_MAPBOX_ACCESS_TOKEN"],
    troubleshooting: "OpenStreetMap + Nominatim works immediately with zero API key. Use the GPS crosshairs button on any map to jump to your live coordinates."
  },
  {
    id: "payments_kingpay",
    name: "Razorpay, UPI & KingPay Wallet Ledger",
    navigationPath: "UmarOS Top Nav → Finance / Clearinghouse & App Settings",
    description: "Manages Razorpay checkout keys, UPI QR settlement, Partner commission %, Rider payout rules, and Customer KingPay wallet balances.",
    editableFields: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "Merchant Commission %", "Free Delivery Threshold (₹)", "COD Enabled Toggle"],
    troubleshooting: "Verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Cloudflare environment variables or embedded worker config."
  },
  {
    id: "apps_ecosystem",
    name: "4-App Ecosystem (Customers, Partners, Riders, UmarOS Admin)",
    navigationPath: "UmarOS Top Nav → Overview / App UI Settings",
    description: "Live control over orderkingpay.com (Customers), orderking-partners.pages.dev (Merchants), orderking-riders.pages.dev (Fleet), and orderking-hdmaster.pages.dev (UmarOS).",
    editableFields: ["Announcement Banner", "Minimum Order Value (₹)", "Support Phone & WhatsApp", "Category Visibility", "Surge Multiplier"],
    troubleshooting: "Changes saved in App UI Settings sync to Supabase platform_settings and apply immediately across connected apps."
  }
];
export function answerFounderPlatformQuestion(prompt: string): string | null {
  const q = String(prompt || "").toLowerCase();
  if (q.includes("where") || q.includes("setting") || q.includes("sms") || q.includes("otp") || q.includes("map") || q.includes("how to") || q.includes("fix") || q.includes("help") || q.includes("control")) {
    const lines = [
      "### UmarOS Founder Control & Platform Directory",
      "Here is where every control is located and how to adjust it immediately:",
      ""
    ];
    for (const mod of UMAROS_PLATFORM_DIRECTORY) {
      lines.push(`**${mod.name}**`);
      lines.push(`- **Where to find it:** ${mod.navigationPath}`);
      lines.push(`- **What you can edit:** ${mod.editableFields.join(", ")}`);
      lines.push(`- **Practical tip:** ${mod.troubleshooting}`);
      lines.push("");
    }
    return lines.join("\n");
  }
  return null;
}
