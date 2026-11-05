/**
 * Universal Multi-Carrier Telecom Dispatcher (sms-gateway.ts)
 * Entity: Orderkingpay | GSTIN: 18AFXPH9838M1Z9 (Assam - 788710)
 * Strict Invariant: SMS-ONLY OTP & Transactional Dispatch (Fast2SMS Primary -> 2Factor.in Failover)
 * ZERO VOICE CALLS PERMITTED.
 */

export interface TelecomCarrierConfig {
  fast2smsApiKey: string;
  twoFactorApiKey: string;
  senderId: string;
  dltEntityId: string;
  dltTemplateIdOtp: string;
  dltTemplateIdTransactional: string;
  primaryCarrier: 'FAST2SMS' | 'TWOFACTOR';
  timeoutMs: number;
}

export interface SmsDispatchRequest {
  recipientPhone: string; // 10-digit Indian mobile or +91 format
  purpose: 'AUTH_OTP' | 'DELIVERY_DOORSTEP_OTP' | 'ORDER_STATUS_ALERT' | 'SETTLEMENT_UTR_ALERT';
  otpCode?: string;
  variablesValues?: string;
  idempotencyKey: string;
}

export interface SmsDispatchResult {
  success: boolean;
  carrierUsed: 'FAST2SMS' | 'TWOFACTOR';
  failoverTriggered: boolean;
  providerMessageId: string;
  normalizedPhone: string;
  channelEnforced: 'SMS_ONLY_ZERO_VOICE';
  latencyMs: number;
  timestampIso: string;
  errorDetails?: string;
}

export function normalizeIndianPhone(rawPhone: string): string {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  const tenDigits = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  if (!/^[6-9]\d{9}$/.test(tenDigits)) {
    throw new Error(`INVALID_INDIAN_MOBILE_NUMBER: ${rawPhone} must be a valid 10-digit Indian mobile number starting with 6-9.`);
  }
  return tenDigits;
}

export class MultiCarrierSmsDispatcher {
  private readonly config: TelecomCarrierConfig;
  private readonly fetchImpl: typeof fetch;

  constructor(config: TelecomCarrierConfig, fetchImpl: typeof fetch = globalThis.fetch) {
    if (!config.fast2smsApiKey && !config.twoFactorApiKey) {
      throw new Error('TELECOM_CONFIG_ERROR: At least one carrier API key (Fast2SMS or 2Factor.in) must be configured.');
    }
    this.config = {
      ...config,
      senderId: config.senderId || 'ORDKNG',
      timeoutMs: config.timeoutMs || 4500,
    };
    this.fetchImpl = fetchImpl;
  }

  public async dispatchSms(req: SmsDispatchRequest): Promise<SmsDispatchResult> {
    const startMs = Date.now();
    const normalizedPhone = normalizeIndianPhone(req.recipientPhone);

    if ((req.purpose === 'AUTH_OTP' || req.purpose === 'DELIVERY_DOORSTEP_OTP') && (!req.otpCode || !/^\d{4,6}$/.test(req.otpCode))) {
      throw new Error('INVALID_OTP_CODE: OTP must be a 4 to 6 digit numeric string.');
    }

    const order: Array<'FAST2SMS' | 'TWOFACTOR'> =
      this.config.primaryCarrier === 'TWOFACTOR' ? ['TWOFACTOR', 'FAST2SMS'] : ['FAST2SMS', 'TWOFACTOR'];

    let primaryError = '';

    for (let i = 0; i < order.length; i++) {
      const carrier = order[i];
      const failoverTriggered = i > 0;
      try {
        const providerMessageId =
          carrier === 'FAST2SMS'
            ? await this.sendViaFast2Sms(normalizedPhone, req)
            : await this.sendViaTwoFactorSmsOnly(normalizedPhone, req);

        return {
          success: true,
          carrierUsed: carrier,
          failoverTriggered,
          providerMessageId,
          normalizedPhone,
          channelEnforced: 'SMS_ONLY_ZERO_VOICE',
          latencyMs: Date.now() - startMs,
          timestampIso: new Date().toISOString(),
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (i === 0) {
          primaryError = msg;
        } else {
          return {
            success: false,
            carrierUsed: carrier,
            failoverTriggered: true,
            providerMessageId: '',
            normalizedPhone,
            channelEnforced: 'SMS_ONLY_ZERO_VOICE',
            latencyMs: Date.now() - startMs,
            timestampIso: new Date().toISOString(),
            errorDetails: `Primary (${order[0]}) failed: ${primaryError} | Failover (${carrier}) failed: ${msg}`,
          };
        }
      }
    }

    throw new Error('UNREACHABLE_TELECOM_STATE');
  }

  private async sendViaFast2Sms(phone: string, req: SmsDispatchRequest): Promise<string> {
    if (!this.config.fast2smsApiKey) {
      throw new Error('FAST2SMS_KEY_MISSING');
    }
    const isOtp = req.purpose === 'AUTH_OTP' || req.purpose === 'DELIVERY_DOORSTEP_OTP';
    const payload = isOtp
      ? {
          route: 'otp',
          variables_values: req.otpCode,
          numbers: phone,
          flash: '0',
        }
      : {
          route: 'dlt',
          sender_id: this.config.senderId,
          message: this.config.dltTemplateIdTransactional,
          variables_values: req.variablesValues || '',
          numbers: phone,
          flash: '0',
        };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await this.fetchImpl('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: this.config.fast2smsApiKey,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': req.idempotencyKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`FAST2SMS_HTTP_${response.status}`);
      }

      const data = (await response.json()) as { return?: boolean; request_id?: string; message?: string[] | string };
      if (!data.return) {
        throw new Error(`FAST2SMS_REJECTED: ${JSON.stringify(data.message || 'Unknown error')}`);
      }

      return data.request_id || `f2s_${req.idempotencyKey}`;
    } finally {
      clearTimeout(timer);
    }
  }

  private async sendViaTwoFactorSmsOnly(phone: string, req: SmsDispatchRequest): Promise<string> {
    if (!this.config.twoFactorApiKey) {
      throw new Error('TWOFACTOR_KEY_MISSING');
    }

    // Strict SMS-only endpoint: /SMS/+91{phone}/{otp}/{template} (NEVER /VOICE/)
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const isOtp = req.purpose === 'AUTH_OTP' || req.purpose === 'DELIVERY_DOORSTEP_OTP';
      const endpoint = isOtp
        ? `https://2factor.in/API/V1/${encodeURIComponent(this.config.twoFactorApiKey)}/SMS/+91${phone}/${encodeURIComponent(req.otpCode || '')}/${encodeURIComponent(this.config.dltTemplateIdOtp || 'OrderKingOTP')}`
        : `https://2factor.in/API/V1/${encodeURIComponent(this.config.twoFactorApiKey)}/ADDON_SERVICES/SEND/TSMS`;

      const response = await this.fetchImpl(
        endpoint,
        isOtp
          ? { method: 'GET', signal: controller.signal }
          : {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                From: this.config.senderId,
                To: phone,
                TemplateName: this.config.dltTemplateIdTransactional,
                VAR1: req.variablesValues || '',
              }),
              signal: controller.signal,
            }
      );

      if (!response.ok) {
        throw new Error(`TWOFACTOR_HTTP_${response.status}`);
      }

      const data = (await response.json()) as { Status?: string; Details?: string };
      if (data.Status !== 'Success') {
        throw new Error(`TWOFACTOR_REJECTED: ${data.Details || 'Unknown error'}`);
      }

      return data.Details || `2f_${req.idempotencyKey}`;
    } finally {
      clearTimeout(timer);
    }
  }
}
