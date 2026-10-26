/**
 * 👑 ORDERKING AUTONOMOUS DISPATCH ENGINE
 * WhatsApp Kitchen, Pharmacy, & Dispatch GPS Auto-Bridge (wa.me)
 *
 * Automatically captures customer GPS coordinates via `navigator.geolocation`
 * and generates a high-fidelity WhatsApp dispatch payload (wa.me) routing
 * orders directly to the Kitchen, Pharmacy, or Dispatch fleet coordinator
 * without requiring manual dispatchers.
 */

export interface WhatsAppDispatchParams {
  storeType?: "kitchen" | "pharmacy" | "dispatch";
  recipientPhone?: string; // Optional phone e.g. "919876543210" (default: founder/dispatch line)
  orderId: string;
  publicId?: string;
  storeName: string;
  customerName?: string;
  customerPhone?: string;
  items: Array<{ name: string; quantity: number; unitPricePaise?: number }>;
  totalPaise: number;
  deliveryAddress: string;
  deliveryInstructions?: string;
  paymentMethod: string;
  paymentRef?: string;
  coordinates?: { lat: number; lng: number } | null;
}

export interface GeolocationResult {
  lat: number;
  lng: number;
  accuracyMeters?: number;
}

/**
 * Default Dispatch Coordinator phone numbers in India (+91)
 */
export const DEFAULT_DISPATCH_PHONE = "919876543210";
export const FOUNDER_UPI_VPA = "9395065587@ybl";
export const FOUNDER_MERCHANT_NAME = "OrderKingPay";

export const FOUNDER_UPI_VPAS = {
  phonepe: "9395065587@ybl",
  paytm: "9395065587@pthdfc",
  cred: "9395065587@yescred",
  bhim: "9395065587@upi",
  amazonpay: "9395065587@apl",
  universal: "9395065587@ybl",
} as const;

/**
 * Obtains live browser GPS coordinates with a 5000ms safety timeout.
 * Rejects gracefully or returns null if user declines location permission.
 */
export async function getLiveCustomerCoordinates(): Promise<GeolocationResult | null> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(null);
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracyMeters: Math.round(pos.coords.accuracy),
        });
      },
      (_err) => {
        clearTimeout(timer);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 4500,
        maximumAge: 30000,
      }
    );
  });
}

/**
 * Builds standard WhatsApp dispatch text message formatted for Indian kitchen / pharmacy / rider dispatch.
 */
export function formatWhatsAppDispatchMessage(params: WhatsAppDispatchParams): string {
  const code = params.publicId || params.orderId;
  const storeLabel =
    params.storeType === "pharmacy"
      ? "🏥 PHARMACY EMERGENCY DISPATCH"
      : params.storeType === "dispatch"
        ? "🛵 EXPRESS FLEET DISPATCH"
        : "🍳 KITCHEN LIVE ORDER";

  const totalRupees = (params.totalPaise / 100).toFixed(2);
  const itemsText = params.items
    .map((item, idx) => `${idx + 1}. ${item.quantity}x ${item.name}`)
    .join("\n");

  const lines: string[] = [
    `👑 *ORDERKING AUTONOMOUS DISPATCH AUTO-BRIDGE*`,
    `----------------------------------------`,
    `⚡ *${storeLabel}*`,
    `📦 *Order ID:* #${code}`,
    `🏪 *Store / Kitchen:* ${params.storeName}`,
    ``,
    `📋 *ORDERED ITEMS:*`,
    itemsText || "• Standard Order Package",
    ``,
    `💰 *BILL TOTAL:* ₹${totalRupees}`,
    `💳 *PAYMENT:* ${params.paymentMethod} (Direct Settlement - standard fee)`,
  ];

  if (params.paymentRef) {
    lines.push(`🔑 *Txn Ref:* ${params.paymentRef}`);
  }

  lines.push(``);
  lines.push(`📍 *DELIVERY DESTINATION:*`);
  lines.push(`🏠 *Address:* ${params.deliveryAddress}`);

  if (params.coordinates) {
    const mapsLink = `https://www.google.com/maps?q=${params.coordinates.lat},${params.coordinates.lng}`;
    lines.push(`🛰️ *Live GPS Coordinates:* ${params.coordinates.lat}, ${params.coordinates.lng}`);
    lines.push(`🗺️ *Rider Google Maps Pin:* ${mapsLink}`);
  } else {
    lines.push(`🗺️ *Rider Maps:* Address navigation mode`);
  }

  if (params.customerName || params.customerPhone) {
    lines.push(`👤 *Customer:* ${params.customerName || "Customer"} (${params.customerPhone || "In-App"})`);
  }

  if (params.deliveryInstructions) {
    lines.push(`📝 *Instructions:* ${params.deliveryInstructions}`);
  }

  lines.push(`----------------------------------------`);
  lines.push(`🚀 *Action:* Auto-Dispatch triggered. Partner pickup initiated immediately.`);

  return lines.join("\n");
}

/**
 * Generates an actionable wa.me URL for one-tap WhatsApp Dispatch Auto-Bridge.
 */
export function generateWhatsAppDispatchUrl(params: WhatsAppDispatchParams): string {
  const cleanPhone = (params.recipientPhone || DEFAULT_DISPATCH_PHONE).replace(/[^0-9]/g, "");
  const text = formatWhatsAppDispatchMessage(params);
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

/**
 * High-level auto-bridge trigger:
 * 1. Checks for existing GPS or acquires fresh GPS coordinates via `navigator.geolocation`
 * 2. Formats dispatch message
 * 3. Opens WhatsApp deep link in new tab or native app
 */
export async function triggerWhatsAppDispatchWithGps(
  params: WhatsAppDispatchParams,
  onCoordsAcquired?: (coords: GeolocationResult) => void
): Promise<{ url: string; coordinates: GeolocationResult | null }> {
  let coords = params.coordinates || null;

  if (!coords) {
    const liveCoords = await getLiveCustomerCoordinates();
    if (liveCoords) {
      coords = liveCoords;
      if (onCoordsAcquired) {
        onCoordsAcquired(liveCoords);
      }
    }
  }

  const url = generateWhatsAppDispatchUrl({
    ...params,
    coordinates: coords,
  });

  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return { url, coordinates: coords };
}
