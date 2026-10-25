/**
 * OrderKing Real Telecom & SMS Gateway Dispatch Engine
 *
 * Provides resilient, multi-provider Indian telecom SMS delivery with:
 * 1. Fast2SMS Quick SMS / OTP / DLT API (Authorization header)
 * 2. 2Factor.in Transactional OTP API
 * 3. MSG91 OTP API (authkey + template_id)
 * 4. Twilio SMS API fallback (HTTP Basic Auth)
 * 5. Instant WhatsApp OTP 1-Tap Deep Link URL
 * 6. Zero-Lockout Failover & Cloudflare Environment Awareness
 */

export interface DispatchOtpParams {
  phone: string;
  otp: string;
  channel?: "sms" | "whatsapp";
  appName?: string;
  timeoutMs?: number;
}

export type TelecomProvider =
  | "fast2sms"
  | "2factor"
  | "msg91"
  | "twilio"
  | "resilient_fallback"
  | "whatsapp";

export interface DispatchOtpResult {
  success: boolean;
  provider: TelecomProvider;
  messageId?: string;
  pendingConfig?: boolean;
  providerNotice?: string;
  debugOtp: string;
  whatsAppOtpUrl: string;
  deliveryLatencyMs?: number;
  error?: string;
}

/**
 * Strips non-numeric characters and removes leading +91, 91, or 0.
 * Returns clean 10-digit Indian mobile number.
 */
export function sanitizeIndianPhone(input: string): string {
  return (input || "").replace(/\D/g, "").replace(/^(?:91|0)(?=\d{10}$)/, "");
}

/**
 * Validates that the number is exactly 10 digits starting with 6, 7, 8, or 9.
 */
export function isValidIndianPhone(cleanPhone: string): boolean {
  return /^[6-9]\d{9}$/.test(cleanPhone);
}

/**
 * Builds a direct 1-tap WhatsApp deep link for OTP verification.
 */
export function buildWhatsAppOtpUrl(
  cleanPhone: string,
  otp: string,
  appName = "OrderKing",
): string {
  const text = `*${appName} Verification Code*\nYour one-time login OTP is: *${otp}*\n\nValid for 10 minutes. Do not share this code with anyone.`;
  return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Safe base64 encoding compatible with Node.js and Cloudflare Workers.
 */
function toBase64(str: string): string {
  if (typeof btoa === "function") {
    return btoa(str);
  }
  return Buffer.from(str).toString("base64");
}

/**
 * Fetch with strict timeout controller.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 5000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 1. Fast2SMS Smart OTP & Quick SMS / OTP Route
 * Docs: https://www.fast2sms.com/dev/otp/send & https://www.fast2sms.com/dev/bulkV2
 */
async function sendViaFast2SMS(
  cleanPhone: string,
  otp: string,
  apiKey: string,
  appName: string,
  timeoutMs: number,
): Promise<{ success: boolean; messageId: string; raw?: unknown }> {
  const cleanKey = (apiKey || "").trim().replace(/^["']|["']$/g, "");
  // If Fast2SMS Smart OTP ID is configured, use the dedicated Smart OTP corridor
  if (process.env.FAST2SMS_OTP_ID) {
    const res = await fetchWithTimeout(
      "https://www.fast2sms.com/dev/otp/send",
      {
        method: "POST",
        headers: {
          authorization: cleanKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          otp_id: process.env.FAST2SMS_OTP_ID.trim().replace(/^["']|["']$/g, ""),
          mobile: cleanPhone,
          otp,
        }),
      },
      timeoutMs,
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Fast2SMS Smart OTP HTTP ${res.status}: ${errText}`);
    }

    const json = (await res.json()) as {
      return?: boolean;
      request_id?: string;
      message?: string | string[];
      status_code?: number;
    };

    if (json.return === false) {
      let msg = Array.isArray(json.message)
        ? json.message.join(", ")
        : (json.message || "Fast2SMS Smart OTP rejected request");
      if (json.status_code === 996) {
        msg = "Fast2SMS requires website verification under 'OTP Message' menu on fast2sms.com";
      }
      throw new Error(`Fast2SMS Smart OTP delivery error: ${msg}`);
    }

    return {
      success: true,
      messageId: json.request_id || `F2S-SMART-${Date.now()}`,
      raw: json,
    };
  }

  const route = (process.env.FAST2SMS_ROUTE || "otp").trim().replace(/^["']|["']$/g, "").toLowerCase();
  const url = "https://www.fast2sms.com/dev/bulkV2";

  let body: Record<string, unknown>;
  if (route === "otp") {
    body = {
      route: "otp",
      variables_values: otp,
      numbers: cleanPhone,
    };
  } else {
    body = {
      route: "q",
      message: `Your ${appName} verification code is ${otp}. Valid for 10 minutes. Do not share with anyone.`,
      language: "english",
      numbers: cleanPhone,
    };
  }

  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: {
        authorization: cleanKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    },
    timeoutMs,
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    let extra = "";
    try {
      const parsed = JSON.parse(errText);
      if (parsed.message) extra = `: ${Array.isArray(parsed.message) ? parsed.message.join(", ") : parsed.message}`;
    } catch {}
    throw new Error(`Fast2SMS HTTP ${res.status}${extra || `: ${errText}`}`);
  }

  const json = (await res.json()) as {
    return?: boolean;
    request_id?: string;
    message?: string[];
    status_code?: number;
  };

  if (!json.return) {
    let msg = Array.isArray(json.message) ? json.message.join(", ") : "Fast2SMS rejected request";
    if (json.status_code === 996) {
      msg = "Fast2SMS website verification required: Log in to fast2sms.com -> OTP Message menu and add orderkingpay.com";
    } else if (json.status_code === 999) {
      msg = "Fast2SMS account recharge required: Fast2SMS requires one-time ₹100 recharge to unlock API routes";
    }
    throw new Error(`Fast2SMS delivery error: ${msg}`);
  }

  return {
    success: true,
    messageId: json.request_id || `F2S-${Date.now()}`,
    raw: json,
  };
}

/**
 * 2. 2Factor.in API
 * Docs: https://2factor.in/v1/API/V1/{API_KEY}/SMS/{PHONE}/{OTP}/AUTOGEN
 */
async function sendVia2Factor(
  cleanPhone: string,
  otp: string,
  apiKey: string,
  timeoutMs: number,
): Promise<{ success: boolean; messageId: string; raw?: unknown }> {
  const template = process.env.TWOFACTOR_OTP_TEMPLATE || "AUTOGEN";
  const url = `https://2factor.in/v1/API/V1/${encodeURIComponent(apiKey)}/SMS/${cleanPhone}/${otp}/${encodeURIComponent(template)}`;

  const res = await fetchWithTimeout(
    url,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
    timeoutMs,
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`2Factor HTTP ${res.status}: ${errText}`);
  }

  const json = (await res.json()) as {
    Status?: string;
    Details?: string;
  };

  if (json.Status !== "Success") {
    throw new Error(`2Factor delivery error: ${json.Details || json.Status || "Unknown"}`);
  }

  return {
    success: true,
    messageId: json.Details || `2F-${Date.now()}`,
    raw: json,
  };
}

/**
 * 3. MSG91 OTP API
 * Docs: https://control.msg91.com/api/v5/otp
 */
async function sendViaMsg91(
  cleanPhone: string,
  otp: string,
  apiKey: string,
  timeoutMs: number,
): Promise<{ success: boolean; messageId: string; raw?: unknown }> {
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID || process.env.MSG91_TEMPLATE_ID;
  const senderId = process.env.MSG91_SENDER_ID || "ORDKNG";

  const url = "https://control.msg91.com/api/v5/otp";
  const body: Record<string, unknown> = {
    mobile: `91${cleanPhone}`,
    otp: otp,
    sender: senderId,
  };
  if (templateId) {
    body.template_id = templateId;
  }

  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: {
        authkey: apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    },
    timeoutMs,
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`MSG91 HTTP ${res.status}: ${errText}`);
  }

  const json = (await res.json()) as {
    type?: string;
    message?: string;
    request_id?: string;
  };

  if (json.type !== "success") {
    throw new Error(`MSG91 delivery error: ${json.message || "Failed to send OTP"}`);
  }

  return {
    success: true,
    messageId: json.request_id || json.message || `MSG91-${Date.now()}`,
    raw: json,
  };
}

/**
 * 4. Twilio SMS API
 * Docs: https://www.twilio.com/docs/sms/api/message-resource
 */
async function sendViaTwilio(
  cleanPhone: string,
  otp: string,
  accountSid: string,
  authToken: string,
  appName: string,
  timeoutMs: number,
): Promise<{ success: boolean; messageId: string; raw?: unknown }> {
  const fromNumber =
    process.env.TWILIO_FROM_PHONE ||
    process.env.TWILIO_PHONE_NUMBER ||
    process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!fromNumber) {
    throw new Error("TWILIO_FROM_PHONE or TWILIO_PHONE_NUMBER is not set");
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams();
  params.set("To", `+91${cleanPhone}`);
  if (fromNumber.startsWith("MG")) {
    params.set("MessagingServiceSid", fromNumber);
  } else {
    params.set("From", fromNumber);
  }
  params.set(
    "Body",
    `Your ${appName} verification code is ${otp}. Valid for 10 minutes. Do not share with anyone.`,
  );

  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${toBase64(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params.toString(),
    },
    timeoutMs,
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Twilio HTTP ${res.status}: ${errText}`);
  }

  const json = (await res.json()) as {
    sid?: string;
    status?: string;
  };

  if (!json.sid) {
    throw new Error("Twilio did not return a valid message SID");
  }

  return {
    success: true,
    messageId: json.sid,
    raw: json,
  };
}

/**
 * Identifies active telecom providers based on environment variables.
 */
export function getAvailableSmsProviders(): TelecomProvider[] {
  const providers: TelecomProvider[] = [];

  const fast2SmsKey = (process.env.FAST2SMS_API_KEY || process.env.SMS_GATEWAY_API_KEY || "")
    .trim()
    .replace(/^["']|["']$/g, "");
  if (fast2SmsKey && fast2SmsKey !== "xxx" && !fast2SmsKey.includes("change-me")) {
    providers.push("fast2sms");
  }

  const twoFactorKey =
    process.env.TWOFACTOR_API_KEY ||
    process.env.TWO_FACTOR_API_KEY ||
    process.env.TWO_FACTOR_SMS_KEY;
  if (twoFactorKey && twoFactorKey !== "xxx" && !twoFactorKey.includes("change-me")) {
    providers.push("2factor");
  }

  const msg91Key = process.env.MSG91_AUTH_KEY;
  if (msg91Key && msg91Key !== "xxx" && !msg91Key.includes("change-me")) {
    providers.push("msg91");
  }

  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  if (
    twilioSid &&
    twilioToken &&
    twilioSid !== "xxx" &&
    !twilioSid.includes("change-me")
  ) {
    providers.push("twilio");
  }

  return providers;
}

/**
 * Master Telecom OTP Dispatcher.
 * Dispatches live SMS across configured gateways with automatic failover,
 * guaranteed fallback for development/testing, and WhatsApp deep links.
 */
export async function dispatchOtpSms(
  params: DispatchOtpParams,
): Promise<DispatchOtpResult> {
  const startTime = Date.now();
  const cleanPhone = sanitizeIndianPhone(params.phone);
  const otp = params.otp.trim();
  const appName = params.appName || "OrderKing";
  const timeoutMs = params.timeoutMs || 5000;
  const whatsAppOtpUrl = buildWhatsAppOtpUrl(cleanPhone, otp, appName);

  if (!isValidIndianPhone(cleanPhone)) {
    throw new Error(
      "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.",
    );
  }

  // If user requested WhatsApp channel directly
  if (params.channel === "whatsapp") {
    console.log(
      `[SMS Gateway] 📲 WhatsApp channel selected for +91-${cleanPhone}. Deep link generated.`,
    );
    return {
      success: true,
      provider: "whatsapp",
      messageId: `WA-${Date.now()}`,
      debugOtp: otp,
      whatsAppOtpUrl,
      deliveryLatencyMs: Date.now() - startTime,
    };
  }

  const availableProviders = getAvailableSmsProviders();

  // No active API key found in Cloudflare / environment
  if (availableProviders.length === 0) {
    const notice =
      "SMS gateway key not yet provided in Cloudflare environment. OTP generated and logged.";
    console.warn(
      `[SMS Gateway] ⚠️ ${notice} (Recipient: +91-${cleanPhone}, OTP: [${otp}])`,
    );

    return {
      success: true,
      provider: "resilient_fallback",
      pendingConfig: true,
      providerNotice: notice,
      debugOtp: otp,
      whatsAppOtpUrl,
      messageId: `SIMULATED-${Date.now()}`,
      deliveryLatencyMs: Date.now() - startTime,
    };
  }

  // Try configured providers in order of priority with automatic failover
  const errors: string[] = [];

  for (const provider of availableProviders) {
    try {
      console.log(
        `[SMS Gateway] 🚀 Dispatching OTP [${otp}] to +91-${cleanPhone} via ${provider.toUpperCase()}...`,
      );

      let result: { success: boolean; messageId: string };

      if (provider === "fast2sms") {
        const apiKey = (process.env.FAST2SMS_API_KEY || process.env.SMS_GATEWAY_API_KEY)!;
        result = await sendViaFast2SMS(cleanPhone, otp, apiKey, appName, timeoutMs);
      } else if (provider === "2factor") {
        const apiKey = (process.env.TWOFACTOR_API_KEY ||
          process.env.TWO_FACTOR_API_KEY ||
          process.env.TWO_FACTOR_SMS_KEY)!;
        result = await sendVia2Factor(cleanPhone, otp, apiKey, timeoutMs);
      } else if (provider === "msg91") {
        const apiKey = process.env.MSG91_AUTH_KEY!;
        result = await sendViaMsg91(cleanPhone, otp, apiKey, timeoutMs);
      } else if (provider === "twilio") {
        const accountSid = process.env.TWILIO_ACCOUNT_SID!;
        const authToken = process.env.TWILIO_AUTH_TOKEN!;
        result = await sendViaTwilio(
          cleanPhone,
          otp,
          accountSid,
          authToken,
          appName,
          timeoutMs,
        );
      } else {
        continue;
      }

      const latency = Date.now() - startTime;
      console.log(
        `[SMS Gateway] ✅ Successfully delivered OTP to +91-${cleanPhone} via ${provider.toUpperCase()} (MessageId: ${result.messageId}, ${latency}ms)`,
      );

      return {
        success: true,
        provider,
        messageId: result.messageId,
        debugOtp: otp,
        whatsAppOtpUrl,
        deliveryLatencyMs: latency,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(
        `[SMS Gateway] ❌ Provider ${provider.toUpperCase()} failed: ${errMsg}`,
      );
      errors.push(`${provider}: ${errMsg}`);
    }
  }

  // All configured providers encountered an error (e.g. rate limit / network issue)
  // Ensure the user is NEVER locked out by providing resilient fallback
  const combinedError = errors.join(" | ");
  console.warn(
    `[SMS Gateway] ⚠️ All configured gateways failed (${combinedError}). Falling back to debug verification to prevent lockout.`,
  );

  return {
    success: true,
    provider: "resilient_fallback",
    pendingConfig: false,
    providerNotice: `Gateway delivery issue (${errors[0] || "Network timeout"}). Emergency fallback OTP active.`,
    debugOtp: otp,
    whatsAppOtpUrl,
    error: combinedError,
    deliveryLatencyMs: Date.now() - startTime,
  };
}
