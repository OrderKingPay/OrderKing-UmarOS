/**
 * Real-World Telephony & Navigation Bridge for OrderKing Riders.
 *
 * Provides:
 * 1. Native Two-Wheeler Navigation (`openNativeTwoWheelerNavigation`) with Android intent
 *    (`google.navigation:q=lat,lng&mode=b`), iOS deep links, and Google Maps web fallback.
 * 2. Dual-Mode Cloud Telephony Bridge (`initiateCustomerCall`) with Exotel & Twilio support,
 *    and guaranteed automatic fallback to direct `tel:+91...` + 1-tap WhatsApp deep link.
 */

export interface NavigationOptions {
  platform?: "android" | "ios" | "web" | "auto";
  label?: string;
  autoLaunch?: boolean;
}

export interface NavigationBridgeResult {
  success: boolean;
  platform: "android" | "ios" | "web";
  androidIntent: string;
  androidIntentScheme: string;
  iosUri: string;
  appleMapsUri: string;
  webFallback: string;
  activeUri: string;
}

export interface ExotelCredentials {
  apiKey?: string;
  apiToken?: string;
  subdomain?: string;
  callerId?: string; // Virtual number (ExoPhone)
}

export interface TwilioCredentials {
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
}

export interface InitiateCustomerCallParams {
  orderId: string;
  riderPhone: string;
  customerPhone: string;
  customerName?: string;
  deliveryId?: string;
  preferredProvider?: "EXOTEL" | "TWILIO" | "AUTO" | "DIRECT";
  customMessage?: string;
  exotelConfig?: ExotelCredentials;
  twilioConfig?: TwilioCredentials;
  bridgeApiUrl?: string;
  autoLaunchDialer?: boolean;
  allowDirectFallback?: boolean; // explicit customer consent or authorized policy required
  fetchFn?: typeof fetch;
}

export interface CallBridgeResult {
  success: boolean;
  channel: "EXOTEL" | "TWILIO" | "DIRECT_FALLBACK";
  virtualProxyNumber?: string;
  maskedDisplay?: string;
  bridgeSessionId?: string;
  telUri: string;
  whatsAppUrl: string;
  fallbackTriggered: boolean;
  error?: string;
}

/**
 * Normalizes any phone number into standard E.164 format (+91 for 10-digit Indian numbers).
 */
export function normalizeIndianPhone(rawPhone: string): string {
  if (!rawPhone) return "";
  const cleaned = rawPhone.trim();
  const digitsOnly = cleaned.replace(/\D/g, "");

  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }
  if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    return `+91${digitsOnly.slice(1)}`;
  }
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return `+${digitsOnly}`;
  }
  if (cleaned.startsWith("+")) {
    return `+${digitsOnly}`;
  }
  return digitsOnly ? `+${digitsOnly}` : "";
}

/**
 * Extracts raw digits suitable for WhatsApp `wa.me/<number>` URL.
 */
export function getWhatsAppPhoneDigits(phone: string): string {
  const normalized = normalizeIndianPhone(phone);
  return normalized.replace(/\D/g, "");
}

/**
 * Generates a 1-tap WhatsApp deep link with a pre-filled delivery message.
 */
export function generateWhatsAppDirectUrl(phone: string, text: string): string {
  const digits = getWhatsAppPhoneDigits(phone);
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/**
 * Detects current client platform (Android, iOS, or Web/Desktop).
 */
export function detectPlatform(): "android" | "ios" | "web" {
  if (typeof navigator === "undefined") {
    return "web";
  }
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) {
    return "android";
  }
  if (/iphone|ipad|ipod/i.test(ua)) {
    return "ios";
  }
  return "web";
}

/**
 * Opens native turn-by-turn two-wheeler navigation:
 * - Android: launches native Google Maps two-wheeler intent `google.navigation:q=lat,lng&mode=b`
 * - iOS: launches Google Maps iOS URL or Apple Maps directions
 * - Web/Fallback: opens Google Maps two-wheeler web directions
 */
export function openNativeTwoWheelerNavigation(
  lat: number,
  lng: number,
  options?: NavigationOptions,
): NavigationBridgeResult {
  const safeLat = Number(lat) || 0;
  const safeLng = Number(lng) || 0;

  const androidIntent = `google.navigation:q=${safeLat},${safeLng}&mode=b`;
  const androidIntentScheme = `intent://maps.google.com/maps/dir/?api=1&destination=${safeLat},${safeLng}&travelmode=two-wheeler#Intent;scheme=https;package=com.google.android.apps.maps;end`;
  const iosUri = `comgooglemaps://?daddr=${safeLat},${safeLng}&directionsmode=bicycling`;
  const appleMapsUri = `https://maps.apple.com/?daddr=${safeLat},${safeLng}&dirflg=d`;
  const webFallback = `https://www.google.com/maps/dir/?api=1&destination=${safeLat},${safeLng}&travelmode=two-wheeler`;

  const detected = options?.platform && options.platform !== "auto"
    ? options.platform
    : detectPlatform();

  let activeUri = webFallback;
  if (detected === "android") {
    activeUri = androidIntent;
  } else if (detected === "ios") {
    activeUri = iosUri;
  }

  const shouldLaunch = options?.autoLaunch !== false && typeof window !== "undefined";

  if (shouldLaunch) {
    try {
      if (detected === "android" || detected === "ios") {
        window.location.href = activeUri;
      } else {
        window.open(webFallback, "_blank", "noopener,noreferrer");
      }
    } catch {
      // Graceful fallback to web URL
      if (typeof window !== "undefined") {
        window.location.href = webFallback;
      }
    }
  }

  return {
    success: true,
    platform: detected,
    androidIntent,
    androidIntentScheme,
    iosUri,
    appleMapsUri,
    webFallback,
    activeUri,
  };
}

/**
 * Dual-Mode Cloud Telephony Bridge (Exotel + Twilio) with guaranteed automatic fallback
 * to direct `tel:+91...` and 1-tap WhatsApp deep link.
 */
export async function initiateCustomerCall(
  params: InitiateCustomerCallParams,
): Promise<CallBridgeResult> {
  const {
    orderId,
    riderPhone,
    customerPhone,
    customerName = "Customer",
    deliveryId,
    preferredProvider = "AUTO",
    customMessage,
    exotelConfig,
    twilioConfig,
    bridgeApiUrl,
    autoLaunchDialer = true,
    allowDirectFallback = false,
    fetchFn = typeof fetch !== "undefined" ? fetch : undefined,
  } = params;

  const normalizedCustomer = normalizeIndianPhone(customerPhone);
  const normalizedRider = normalizeIndianPhone(riderPhone);
  const fallbackTelUri = `tel:${normalizedCustomer}`;

  const messageText = customMessage ||
    `Namaste ${customerName}! I am your OrderKing delivery partner regarding order #${orderId}. I am arriving with your order. Please keep your delivery OTP ready.`;

  const whatsAppUrl = allowDirectFallback ? generateWhatsAppDirectUrl(normalizedCustomer, messageText) : "";

  // If rider explicitly requested direct calling, skip bridge
  if(preferredProvider==="DIRECT"&&!allowDirectFallback){return {success:false,channel:"DIRECT_FALLBACK",telUri:"",whatsAppUrl:"",fallbackTriggered:false,error:"Direct contact is not authorized."};}
  if (preferredProvider === "DIRECT") {
    if (autoLaunchDialer && typeof window !== "undefined") {
      window.location.href = fallbackTelUri;
    }
    return {
      success: true,
      channel: "DIRECT_FALLBACK",
      telUri: fallbackTelUri,
      whatsAppUrl,
      fallbackTriggered: true,
    };
  }

  if(!bridgeApiUrl){
    if(allowDirectFallback){
      if(autoLaunchDialer&&typeof window!=="undefined") window.location.href=fallbackTelUri;
      return {success:true,channel:"DIRECT_FALLBACK",telUri:fallbackTelUri,whatsAppUrl,fallbackTriggered:true,error:"Direct contact explicitly authorized; masked bridge not configured."};
    }
    return {success:false,channel:"DIRECT_FALLBACK",telUri:"",whatsAppUrl:"",fallbackTriggered:false,error:"Secure masked-calling backend is not configured."};
  }
  let lastError: string | undefined;

  // 1. Try Exotel Bridge (if preferred or AUTO)
  if (
    (preferredProvider === "AUTO" || preferredProvider === "EXOTEL") &&
    (exotelConfig?.apiKey || bridgeApiUrl)
  ) {
    try {
      if (bridgeApiUrl && fetchFn) {
        const resp = await fetchFn(bridgeApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: "EXOTEL",
            orderId,
            deliveryId,
            from: normalizedRider,
            to: normalizedCustomer,
          }),
        });
        if (resp.ok) {
          const data = (await resp.json()) as any;
          const proxyNumber = data.virtualProxyNumber || data.callerId || exotelConfig?.callerId;
          if (!proxyNumber) throw new Error("Provider did not return a masked proxy number.");
          const proxyTel = proxyNumber ? `tel:${normalizeIndianPhone(proxyNumber)}` : fallbackTelUri;
          if (autoLaunchDialer && typeof window !== "undefined") {
            window.location.href = proxyTel;
          }
          return {
            success: true,
            channel: "EXOTEL",
            virtualProxyNumber: proxyNumber,
            maskedDisplay: data.maskedDisplay || proxyNumber,
            bridgeSessionId: data.bridgeSessionId || `exo_${Date.now()}`,
            telUri: proxyTel,
            whatsAppUrl,
            fallbackTriggered: false,
          };
        }
        lastError = `Exotel bridge HTTP status ${resp.status}`;
      } else if (exotelConfig?.apiKey && exotelConfig?.apiToken && exotelConfig?.subdomain && fetchFn) {
        // Direct Exotel REST API call
        const auth = typeof btoa !== "undefined"
          ? btoa(`${exotelConfig.apiKey}:${exotelConfig.apiToken}`)
          : Buffer.from(`${exotelConfig.apiKey}:${exotelConfig.apiToken}`).toString("base64");

        const exotelUrl = `https://api.exotel.com/v1/Accounts/${exotelConfig.subdomain}/Calls/connect.json`;
        const bodyParams = new URLSearchParams({
          From: normalizedRider,
          To: normalizedCustomer,
          CallerId: exotelConfig.callerId || "08045671234",
          CallType: "trans",
        });

        const resp = await fetchFn(exotelUrl, {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: bodyParams.toString(),
        });

        if (resp.ok) {
          const data = (await resp.json()) as any;
          const proxyNumber = exotelConfig.callerId || "08045671234";
          const proxyTel = `tel:${normalizeIndianPhone(proxyNumber)}`;
          if (autoLaunchDialer && typeof window !== "undefined") {
            window.location.href = proxyTel;
          }
          return {
            success: true,
            channel: "EXOTEL",
            virtualProxyNumber: proxyNumber,
            maskedDisplay: proxyNumber,
            bridgeSessionId: data?.Call?.Sid || `exo_${Date.now()}`,
            telUri: proxyTel,
            whatsAppUrl,
            fallbackTriggered: false,
          };
        }
        lastError = `Exotel direct call HTTP error: ${resp.status}`;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  // 2. Try Twilio Bridge (if preferred, or as failover from Exotel)
  if (
    (preferredProvider === "AUTO" || preferredProvider === "TWILIO") &&
    (twilioConfig?.accountSid || bridgeApiUrl)
  ) {
    try {
      if (bridgeApiUrl && fetchFn) {
        const resp = await fetchFn(bridgeApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: "TWILIO",
            orderId,
            deliveryId,
            from: normalizedRider,
            to: normalizedCustomer,
          }),
        });
        if (resp.ok) {
          const data = (await resp.json()) as any;
          const proxyNumber = data.virtualProxyNumber || twilioConfig?.fromNumber;
          if (!proxyNumber) throw new Error("Provider did not return a masked proxy number.");
          const proxyTel = proxyNumber ? `tel:${normalizeIndianPhone(proxyNumber)}` : fallbackTelUri;
          if (autoLaunchDialer && typeof window !== "undefined") {
            window.location.href = proxyTel;
          }
          return {
            success: true,
            channel: "TWILIO",
            virtualProxyNumber: proxyNumber,
            maskedDisplay: data.maskedDisplay || proxyNumber,
            bridgeSessionId: data.bridgeSessionId || `twi_${Date.now()}`,
            telUri: proxyTel,
            whatsAppUrl,
            fallbackTriggered: false,
          };
        }
        lastError = `Twilio bridge HTTP status ${resp.status}`;
      } else if (twilioConfig?.accountSid && twilioConfig?.authToken && fetchFn) {
        // Direct Twilio REST API call
        const auth = typeof btoa !== "undefined"
          ? btoa(`${twilioConfig.accountSid}:${twilioConfig.authToken}`)
          : Buffer.from(`${twilioConfig.accountSid}:${twilioConfig.authToken}`).toString("base64");

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioConfig.accountSid}/Calls.json`;
        const bodyParams = new URLSearchParams({
          From: twilioConfig.fromNumber || "+918045671234",
          To: normalizedCustomer,
          Url: `https://handler.twilio.com/twiml/EH${orderId}`,
        });

        const resp = await fetchFn(twilioUrl, {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: bodyParams.toString(),
        });

        if (resp.ok) {
          const data = (await resp.json()) as any;
          const proxyNumber = twilioConfig.fromNumber || "+918045671234";
          const proxyTel = `tel:${normalizeIndianPhone(proxyNumber)}`;
          if (autoLaunchDialer && typeof window !== "undefined") {
            window.location.href = proxyTel;
          }
          return {
            success: true,
            channel: "TWILIO",
            virtualProxyNumber: proxyNumber,
            maskedDisplay: proxyNumber,
            bridgeSessionId: data?.sid || `twi_${Date.now()}`,
            telUri: proxyTel,
            whatsAppUrl,
            fallbackTriggered: false,
          };
        }
        lastError = `Twilio direct call HTTP error: ${resp.status}`;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  // Never disclose the customer phone number silently after a bridge error.
  if(!allowDirectFallback)return {success:false,channel:"DIRECT_FALLBACK",telUri:"",whatsAppUrl:"",fallbackTriggered:false,error:lastError||"Masked calling unavailable; request support."};
  if(autoLaunchDialer&&typeof window!=="undefined")window.location.href=fallbackTelUri;
  return {success:true,channel:"DIRECT_FALLBACK",telUri:fallbackTelUri,whatsAppUrl,fallbackTriggered:true,error:lastError||"Explicit direct fallback selected."};
}
