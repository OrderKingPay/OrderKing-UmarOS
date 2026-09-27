/**
 * HDmaster AI - Multilingual & Localization Core.
 *
 * Production rule: this module never calls an unapproved third-party fallback.
 * Translation is delegated to the configured HDmaster AI service; if that service
 * is unavailable, the operation fails closed instead of writing invented text.
 */

import { supabase } from "../db-cloud";

const HDMASTER_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_HDMASTER_URL) ||
  "https://hdmaster.vercel.app";

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

    const response = await fetch(`${HDMASTER_URL}/api/ai/chat`, {
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
    const { error } = await supabase.from("localized_menus").insert({
      restaurant_id: restaurantId,
      original_text: cleanText,
      ai_translation_matrix: translationResult,
      status: "AUTO_LOCALIZED_BY_HDMASTER",
    });

    if (error) {
      throw new Error(`Localized menu persistence failed: ${error.message}`);
    }

    return translationResult;
  }

  static async autonomousRiderCommunication(
    riderMessageStr: string,
    riderLanguageCode: string,
  ) {
    const message = riderMessageStr.trim();
    if (!message) throw new Error("Rider message cannot be empty.");
    if (riderLanguageCode === "en") return message;

    const response = await fetch(`${HDMASTER_URL}/api/ai/chat`, {
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
