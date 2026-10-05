
/**
 * HDmaster AI - Multilingual & Localization Core.
 *
 * Production rule: this module never calls an unapproved third-party fallback.
 * Translation is delegated to the configured HDmaster AI service; if that service
 * is unavailable, the operation fails closed instead of writing invented text.
 */

const AI_CHAT_URL = "/api/ai/chat";

type TranslationResponse = {
  text?: string;
  error?: string;
};

export class HDmasterMultilingualCore {
  static async autoTranslateRestaurantMenu(restaurantId: string, itemText: string) {
    const cleanText = itemText.trim();
    if (!restaurantId.trim() || !cleanText) {
      throw new Error("Translation requires a restaurant ID and menu text.");
    }

    const response = await fetch(AI_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are the HDmaster culinary localization service. Return only accurate translations in Hindi, Bengali, and Tamil. Preserve food names, quantities, allergens, and brand terms; never invent missing information.",
          },
          {
            role: "user",
            content: `Translate this menu item into Hindi, Bengali, and Tamil as a compact JSON object with keys hindi, bengali, tamil: "${cleanText}"`,
          },
        ],
        modelId: "auto-supreme-orchestrator",
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as TranslationResponse;
    if (!response.ok || !payload.text?.trim()) {
      throw new Error(payload.error || `HDmaster translation unavailable (HTTP ${response.status}).`);
    }

    const translationResult = payload.text.trim();

    // The current authoritative Supabase schema does not contain a
    // `localized_menus` table, so never write through an anonymous browser
    // client or pretend persistence succeeded.
    return {
      text: translationResult,
      persistence: "NOT_ENABLED" as const,
      reason: "Menu translation persistence awaits an authenticated server-side localization table/service.",
    };

  }

  static async autonomousRiderCommunication(
    riderMessageStr: string,
    riderLanguageCode: string,
  ) {
    const message = riderMessageStr.trim();
    if (!message) throw new Error("Rider message cannot be empty.");
    if (riderLanguageCode === "en") return message;

    const response = await fetch(AI_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are HDmaster rider-support translation. Translate operational instructions accurately without inventing locations, order states, payments, or safety events.",
          },
          {
            role: "user",
            content: `Translate this rider message into language code ${riderLanguageCode}: "${message}"`,
          },
        ],
        modelId: "auto-supreme-orchestrator",
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as TranslationResponse;
    if (!response.ok || !payload.text?.trim()) {
      throw new Error(payload.error || `HDmaster rider translation unavailable (HTTP ${response.status}).`);
    }
    return payload.text.trim();
  }
}
