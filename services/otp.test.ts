import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import {
  sanitizeIndianPhone,
  isValidIndianPhone,
  generateOtp,
  checkRateLimit,
  recordOtpAttempt,
  resetRateLimit,
  storeOtp,
  getStoredOtp,
  clearStoredOtp,
  sendOtpFast2SMS,
  sendOtp2Factor,
  sendVoiceOtp2Factor,
  sendOtp,
  requestOtp,
  verifyOtp,
} from './otp';

vi.mock('axios');

describe('Root Telecom OTP Service (services/otp.ts)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.FAST2SMS_API_KEY;
    delete process.env.OTP_2FACTOR_API_KEY;
    delete process.env.TWOFACTOR_API_KEY;
    delete process.env.TWO_FACTOR_API_KEY;
    delete process.env.TWOFACTOR_OTP_TEMPLATE;
    delete process.env.MSG91_AUTH_KEY;
    delete process.env.MSG91_TEMPLATE_ID;
    resetRateLimit('9876543210');
    clearStoredOtp('9876543210');
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('1. Phone Number Sanitization & Validation', () => {
    it('normalizes various input formats to 10-digit clean numbers', () => {
      expect(sanitizeIndianPhone('+91 98765 43210')).toBe('9876543210');
      expect(sanitizeIndianPhone('+91-98765-43210')).toBe('9876543210');
      expect(sanitizeIndianPhone('919876543210')).toBe('9876543210');
      expect(sanitizeIndianPhone('09876543210')).toBe('9876543210');
      expect(sanitizeIndianPhone('9876543210')).toBe('9876543210');
    });

    it('validates strictly 10-digit Indian numbers starting with 6, 7, 8, or 9', () => {
      expect(isValidIndianPhone('9876543210')).toBe(true);
      expect(isValidIndianPhone('8123456789')).toBe(true);
      expect(isValidIndianPhone('7012345678')).toBe(true);
      expect(isValidIndianPhone('6290123456')).toBe(true);

      expect(isValidIndianPhone('5123456789')).toBe(false);
      expect(isValidIndianPhone('987654321')).toBe(false);
      expect(isValidIndianPhone('98765432100')).toBe(false);
      expect(isValidIndianPhone('abcdefghij')).toBe(false);
    });
  });

  describe('2. OTP Generation, Rate Limiting & 5-Minute Expiration', () => {
    it('generates a cryptographically secure 6-digit OTP', () => {
      const otp = generateOtp(6);
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
    });

    it('enforces rate limit: max 3 attempts per phone per 10 minutes', () => {
      const phone = '9876543210';
      resetRateLimit(phone);

      expect(checkRateLimit(phone).allowed).toBe(true);
      recordOtpAttempt(phone);

      expect(checkRateLimit(phone).allowed).toBe(true);
      recordOtpAttempt(phone);

      expect(checkRateLimit(phone).allowed).toBe(true);
      recordOtpAttempt(phone);

      // 4th attempt must be blocked
      const limit = checkRateLimit(phone);
      expect(limit.allowed).toBe(false);
      expect(limit.remainingAttempts).toBe(0);
      expect(limit.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('stores and expires OTP after 5 minutes', () => {
      const phone = '9876543210';
      storeOtp(phone, '123456', 5 * 60 * 1000);

      const stored = getStoredOtp(phone);
      expect(stored).toBeDefined();
      expect(stored?.otp).toBe('123456');

      // Expired entry check
      storeOtp('9876543211', '654321', -1000);
      expect(getStoredOtp('9876543211')).toBeUndefined();
    });
  });

  describe('3. sendOtpFast2SMS (Primary Fast2SMS Bulk V2 OTP)', () => {
    it('throws if FAST2SMS_API_KEY is not set', async () => {
      await expect(sendOtpFast2SMS('9876543210', '123456')).rejects.toThrow(
        'FAST2SMS_API_KEY not set',
      );
    });

    it('throws if phone is invalid', async () => {
      process.env.FAST2SMS_API_KEY = 'test_f2s_key';
      await expect(sendOtpFast2SMS('12345', '123456')).rejects.toThrow(
        'Invalid Indian mobile number',
      );
    });

    it('dispatches to modern https://www.fast2sms.com/dev/bulkV2 with route: "otp"', async () => {
      process.env.FAST2SMS_API_KEY = 'mock_fast2sms_api_key_v2';

      vi.mocked(axios.post).mockResolvedValueOnce({
        data: {
          return: true,
          request_id: 'REQ_F2S_BULKV2_123',
          message: ['SMS sent successfully'],
        },
      });

      const success = await sendOtpFast2SMS('9876543210', '482910');

      expect(success).toBe(true);
      expect(axios.post).toHaveBeenCalledTimes(1);
      const [url, payload, config] = vi.mocked(axios.post).mock.calls[0];
      expect(url).toBe('https://www.fast2sms.com/dev/bulkV2');
      expect(payload).toEqual({
        route: 'otp',
        variables_values: '482910',
        numbers: '9876543210',
      });
      expect(config?.headers?.authorization).toBe('mock_fast2sms_api_key_v2');
      expect(config?.headers?.['Content-Type']).toBe('application/json');
    });

    it('handles Fast2SMS API rejection gracefully returning false', async () => {
      process.env.FAST2SMS_API_KEY = 'test_key';
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: { return: false, message: ['Invalid Route or Balance'] },
      });

      const success = await sendOtpFast2SMS('9876543210', '123456');
      expect(success).toBe(false);
    });

    it('falls back to route q when route otp fails with website verification notice (Error 996)', async () => {
      process.env.FAST2SMS_API_KEY = 'mock_f2s_key';

      // First call (route otp) returns 996 error
      vi.mocked(axios.post).mockRejectedValueOnce({
        response: {
          data: {
            status_code: 996,
            message: 'Before using OTP Message API, complete website verification.',
          },
        },
      });

      // Second call (route q) succeeds
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: {
          return: true,
          request_id: 'REQ_F2S_Q_456',
          message: ['SMS sent successfully'],
        },
      });

      const success = await sendOtpFast2SMS('9876543210', '123456');

      expect(success).toBe(true);
      expect(axios.post).toHaveBeenCalledTimes(2);
      const [, secondPayload] = vi.mocked(axios.post).mock.calls[1];
      expect((secondPayload as any).route).toBe('q');
      expect((secondPayload as any).message).toContain('123456');
    });
  });

  describe('4. sendOtp2Factor (Fallback Gateway with Key Collision Guard)', () => {
    it('gracefully skips 2Factor when TWOFACTOR_API_KEY matches FAST2SMS_API_KEY', async () => {
      const sharedKey = '8N1WpYHWBVeiCvSqiH0AoYYF8xXp227bvOF3RDFeBBg4QVf4Gx8cACyYk7aiUNowVGPVaj9GePXTJcfU';
      process.env.FAST2SMS_API_KEY = sharedKey;
      process.env.TWOFACTOR_API_KEY = sharedKey;

      const success = await sendOtp2Factor('9876543210', '123456');

      expect(success).toBe(false);
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('dispatches to standardized 2Factor URL when configured with distinct key', async () => {
      process.env.FAST2SMS_API_KEY = 'fast2sms_independent_key';
      process.env.TWOFACTOR_API_KEY = 'twofactor_distinct_uuid_key';

      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { Status: 'Success', Details: '2F_SESSION_UUID_999' },
      });

      const success = await sendOtp2Factor('9876543210', '654321');

      expect(success).toBe(true);
      expect(axios.get).toHaveBeenCalledTimes(1);
      const [url] = vi.mocked(axios.get).mock.calls[0];
      expect(url).toBe('https://2factor.in/API/V1/twofactor_distinct_uuid_key/SMS/9876543210/654321/AUTOGEN');
    });
  });

  describe('5. Master sendOtp Dispatcher Priority (Fast2SMS PRIMARY -> 2Factor Fallback)', () => {
    it('dispatches via Fast2SMS as PRIMARY', async () => {
      process.env.FAST2SMS_API_KEY = 'primary_f2s_key';
      process.env.TWOFACTOR_API_KEY = 'fallback_2f_key';

      vi.mocked(axios.post).mockResolvedValueOnce({
        data: { return: true, request_id: 'REQ_F2S_PRIMARY_1' },
      });

      const res = await sendOtp('9876543210', '112233');

      expect(res.success).toBe(true);
      expect(res.provider).toBe('fast2sms');
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('falls over to 2Factor FALLBACK when Fast2SMS fails', async () => {
      process.env.FAST2SMS_API_KEY = 'primary_f2s_key';
      process.env.TWOFACTOR_API_KEY = 'fallback_2f_distinct_key';

      // Fast2SMS fails both otp and q
      vi.mocked(axios.post).mockResolvedValueOnce({ data: { return: false } });
      vi.mocked(axios.post).mockResolvedValueOnce({ data: { return: false } });

      // 2Factor succeeds
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { Status: 'Success' },
      });

      const res = await sendOtp('9876543210', '998877');

      expect(res.success).toBe(true);
      expect(res.provider).toBe('2factor');
      expect(axios.post).toHaveBeenCalledTimes(2);
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it('gracefully skips 2Factor fallback when key matches Fast2SMS key', async () => {
      const duplicateKey = 'shared_key_12345';
      process.env.FAST2SMS_API_KEY = duplicateKey;
      process.env.OTP_2FACTOR_API_KEY = duplicateKey;

      // Fast2SMS fails
      vi.mocked(axios.post).mockResolvedValueOnce({ data: { return: false } });
      vi.mocked(axios.post).mockResolvedValueOnce({ data: { return: false } });

      const res = await sendOtp('9876543210', '556677');

      // 2Factor was skipped, no other gateway, returns failure (zero mocks)
      expect(res.success).toBe(false);
      expect(res.provider).toBeNull();
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  describe('6. End-to-End requestOtp and verifyOtp Flow', () => {
    it('executes full flow: generate 6 digits -> send -> store 5 min -> verify', async () => {
      process.env.FAST2SMS_API_KEY = 'test_f2s_live_key';
      resetRateLimit('9876543210');

      vi.mocked(axios.post).mockResolvedValueOnce({
        data: { return: true, request_id: 'REQ_E2E_999' },
      });

      const reqRes = await requestOtp('9876543210');
      expect(reqRes.success).toBe(true);
      expect(reqRes.expiresInSeconds).toBe(300);

      // Verify the generated OTP from store
      const stored = getStoredOtp('9876543210');
      expect(stored).toBeDefined();
      expect(stored?.otp).toHaveLength(6);

      // Successful verification
      const verifyRes = verifyOtp('9876543210', stored!.otp);
      expect(verifyRes.verified).toBe(true);

      // Replay prevention: OTP should be cleared after single verification
      expect(getStoredOtp('9876543210')).toBeUndefined();
      expect(() => verifyOtp('9876543210', stored!.otp)).toThrow('Verification code has expired or was not requested');
    });

    it('rejects incorrect OTP attempt and tracks attempts counter', () => {
      const phone = '9876543210';
      storeOtp(phone, '123456', 5 * 60 * 1000);

      expect(() => verifyOtp(phone, '000000')).toThrow('Invalid verification code');

      const stored = getStoredOtp(phone);
      expect(stored?.attempts).toBe(1);
    });

    it('locks out verification after 5 consecutive wrong attempts', () => {
      const phone = '9876543210';
      storeOtp(phone, '888888', 5 * 60 * 1000);

      for (let i = 0; i < 4; i++) {
        expect(() => verifyOtp(phone, '111111')).toThrow('Invalid verification code');
      }
      expect(() => verifyOtp(phone, '111111')).toThrow('Maximum incorrect verification attempts exceeded');

      // Stored OTP must be deleted on lockout
      expect(getStoredOtp(phone)).toBeUndefined();
    });
  });
});
