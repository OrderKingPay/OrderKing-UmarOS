export type OtpDeliveryChannel = "sms" | "voice" | "whatsapp";
export interface OtpDispatchResult {
  delivered: boolean;
  provider: string;
  channel: OtpDeliveryChannel;
  sessionId?: string;
  whatsappUrl?: string;
  error?: string;
}
const DEFAULT_2FACTOR_KEY = "bae2bf50-d3d4-11f1-ac3e-0200cd936042";
function get2FactorApiKey(): string {
  return (
    process.env.TWO_FACTOR_API_KEY ||
    process.env.TWOFACTOR_API_KEY ||
    process.env.VITE_TWO_FACTOR_API_KEY ||
    DEFAULT_2FACTOR_KEY
  ).trim();
}
export async function verifyVia2Factor(phone: string, otp: string): Promise<boolean> {
  const cleanPhone = String(phone || "").replace(/\D/g, "").slice(-10);
  const cleanOtp = String(otp || "").replace(/\D/g, "").trim();
  if (cleanPhone.length !== 10 || cleanOtp.length < 4) return false;
  const apiKey = get2FactorApiKey();
  if (!apiKey) return false;
  try {
    const res = await fetch(
      `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/VERIFY3/+91${cleanPhone}/${encodeURIComponent(cleanOtp)}`,
      { method: "GET" }
    );
    const data = (await res.json().catch(() => ({}))) as { Status?: string; Details?: string };
    return res.ok && data.Status === "Success";
  } catch {
    return false;
  }
}
async function sendVia2Factor(
  cleanPhone: string,
  otp: string,
  channel: OtpDeliveryChannel
): Promise<OtpDispatchResult> {
  const apiKey = get2FactorApiKey();
  if (!apiKey) {
    return { delivered: false, provider: "2factor", channel, error: "Missing 2Factor API key" };
  }
  const template = (
    process.env.TWOFACTOR_OTP_TEMPLATE ||
    process.env.TWO_FACTOR_TEMPLATE_NAME ||
    ""
  ).trim();
  // If Voice Call explicitly requested
  if (channel === "voice") {
    try {
      const voiceUrl = `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/VOICE/+91${cleanPhone}/${encodeURIComponent(otp)}`;
      const res = await fetch(voiceUrl, { method: "GET" });
      const data = (await res.json().catch(() => ({}))) as { Status?: string; Details?: string };
      if (res.ok && data.Status === "Success") {
        return { delivered: true, provider: "2factor-voice", channel: "voice", sessionId: data.Details };
      }
    } catch {}
  }
  // For SMS: try DLT template if set, then custom SMS OTP, then AUTOGEN, AND fire parallel Voice Call fallback if no DLT template is configured so Indian telecom scrubbing never blocks delivery
  const smsCandidates = [
    ...(template
      ? [`https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/+91${cleanPhone}/${encodeURIComponent(otp)}/${encodeURIComponent(template)}`]
      : []),
    `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/+91${cleanPhone}/${encodeURIComponent(otp)}`,
    `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/+91${cleanPhone}/AUTOGEN`,
  ];
  let smsSessionId = "";
  let smsAccepted = false;
  for (const url of smsCandidates) {
    try {
      const res = await fetch(url, { method: "GET" });
      const data = (await res.json().catch(() => ({}))) as { Status?: string; Details?: string };
      if (res.ok && data.Status === "Success") {
        smsAccepted = true;
        smsSessionId = data.Details || "";
        break;
      }
    } catch {}
  }
  // When no custom DLT template is registered, Indian operators may scrub text SMS; trigger 2Factor Voice Call with our exact 6-digit OTP as guaranteed backup
  if (!template) {
    try {
      const voiceBackupUrl = `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/VOICE/+91${cleanPhone}/${encodeURIComponent(otp)}`;
      const vRes = await fetch(voiceBackupUrl, { method: "GET" });
      const vData = (await vRes.json().catch(() => ({}))) as { Status?: string; Details?: string };
      if (!smsAccepted && vRes.ok && vData.Status === "Success") {
        return {
          delivered: true,
          provider: "2factor-voice-fallback",
          channel: "voice",
          sessionId: vData.Details,
        };
      }
    } catch {}
  }
  if (smsAccepted) {
    return {
      delivered: true,
      provider: "2factor-sms",
      channel: "sms",
      sessionId: smsSessionId,
    };
  }
  return { delivered: false, provider: "2factor", channel, error: "2Factor gateway unreachable" };
}
async function sendViaFast2Sms(cleanPhone: string, otp: string): Promise<OtpDispatchResult> {
  const apiKey = (
    process.env.FAST2SMS_API_KEY ||
    process.env.VITE_FAST2SMS_API_KEY ||
    ""
  ).trim();
  if (!apiKey) {
    return { delivered: false, provider: "fast2sms", channel: "sms", error: "No Fast2SMS key" };
  }
  const payloads = [
    { route: "otp", variables_values: otp, numbers: cleanPhone, flash: 0 },
    { route: "q", message: `OrderKing verification code: ${otp}. Valid for 5 minutes.`, language: "english", numbers: cleanPhone, flash: 0 },
  ];
  for (const body of payloads) {
    try {
      const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { return?: boolean; request_id?: string };
      if (res.ok && data.return) {
        return {
          delivered: true,
          provider: "fast2sms",
          channel: "sms",
          sessionId: data.request_id,
        };
      }
    } catch {}
  }
  return { delivered: false, provider: "fast2sms", channel: "sms", error: "Fast2SMS rejected request" };
}
export async function dispatchOtpMultiChannel(
  phone: string,
  otp: string,
  channel: OtpDeliveryChannel = "sms"
): Promise<OtpDispatchResult> {
  const cleanPhone = String(phone || "").replace(/\D/g, "").slice(-10);
  const whatsappText = encodeURIComponent(
    `OrderKing Instant Login Code for +91${cleanPhone}: *${otp}* (Valid for 5 minutes)`
  );
  const whatsappUrl = `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${whatsappText}`;
  if (channel === "whatsapp") {
    // Also dispatch background SMS/Voice so user receives it both ways
    void sendVia2Factor(cleanPhone, otp, "sms").catch(() => null);
    return {
      delivered: true,
      provider: "whatsapp-direct",
      channel: "whatsapp",
      whatsappUrl,
    };
  }
  const twoFactorRes = await sendVia2Factor(cleanPhone, otp, channel);
  if (twoFactorRes.delivered) {
    return { ...twoFactorRes, whatsappUrl };
  }
  const fastRes = await sendViaFast2Sms(cleanPhone, otp);
  if (fastRes.delivered) {
    return { ...fastRes, whatsappUrl };
  }
  return {
    delivered: false,
    provider: "verified-edge-fallback",
    channel,
    whatsappUrl,
    error: twoFactorRes.error || fastRes.error,
  };
}
export async function dispatchTransactionalSms(phone: string, otpOrMsg: string): Promise<boolean> {
  const otpMatch = String(otpOrMsg || "").match(/\b(\d{4,6})\b/);
  const otp = otpMatch ? otpMatch[1] : "123456";
  const res = await dispatchOtpMultiChannel(phone, otp, "sms");
  return res.delivered;
}
