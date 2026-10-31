import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import {
  sanitizeIndianPhone,
  isValidIndianPhone,
  sendOtpFast2SMS,
  sendOtp2Factor,
  sendOtp,
} from '../../../services/otp';

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

  describe('2. sendOtpFast2SMS (Modern Fast2SMS v2 OTP)', () => {
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

      const success = await sendOtpFast2SMS('+91 98765 43210', '482910');

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

    it('handles network error in Fast2SMS without crashing', async () => {
      process.env.FAST2SMS_API_KEY = 'test_key';
      vi.mocked(axios.post).mockRejectedValueOnce(new Error('Network timeout'));

      const success = await sendOtpFast2SMS('9876543210', '123456');
      expect(success).toBe(false);
    });
  });

  describe('3. sendOtp2Factor & Duplicate Key Fallback Protection', () => {
    it('returns false and skips dispatch when OTP_2FACTOR_API_KEY equals FAST2SMS_API_KEY', async () => {
      const sharedKey = '8N1WpYHWBVeiCvSqiH0AoYYF8xXp227bvOF3RDFeBBg4QVf4Gx8cACyYk7aiUNowVGPVaj9GePXTJcfU';
      process.env.FAST2SMS_API_KEY = sharedKey;
      process.env.OTP_2FACTOR_API_KEY = sharedKey;

      const success = await sendOtp2Factor('9876543210', '123456');

      expect(success).toBe(false);
      // axios.get must NOT be called with the Fast2SMS key to prevent 2Factor error
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('returns false when 2Factor API key is not configured or is a placeholder', async () => {
      process.env.FAST2SMS_API_KEY = 'f2s_key';
      process.env.OTP_2FACTOR_API_KEY = 'xxx';

      const success = await sendOtp2Factor('9876543210', '123456');
      expect(success).toBe(false);
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('dispatches to 2Factor.in when independently configured with distinct key', async () => {
      process.env.FAST2SMS_API_KEY = 'f2s_key_123';
      process.env.OTP_2FACTOR_API_KEY = '2factor_independent_uuid_key';

      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { Status: 'Success', Details: '2F_SESSION_UUID_999' },
      });

      const success = await sendOtp2Factor('9876543210', '654321');

      expect(success).toBe(true);
      expect(axios.get).toHaveBeenCalledTimes(1);
      const [url] = vi.mocked(axios.get).mock.calls[0];
      expect(url).toContain('https://2factor.in/API/V1/2factor_independent_uuid_key/SMS/9876543210/654321');
    });
  });

  describe('4. Master sendOtp Dispatcher with Automatic Failover', () => {
    it('dispatches via Fast2SMS v2 when Fast2SMS succeeds', async () => {
      process.env.FAST2SMS_API_KEY = 'f2s_key';
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: { return: true, request_id: 'REQ_SUCCESS_1' },
      });

      const res = await sendOtp('9876543210', '112233');

      expect(res.success).toBe(true);
      expect(res.provider).toBe('fast2sms');
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('fails over to 2Factor when Fast2SMS fails and 2Factor is independently configured', async () => {
      process.env.FAST2SMS_API_KEY = 'f2s_key';
      process.env.OTP_2FACTOR_API_KEY = '2factor_independent_key';

      // Fast2SMS fails
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: { return: false },
      });
      // 2Factor succeeds
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { Status: 'Success' },
      });

      const res = await sendOtp('9876543210', '998877');

      expect(res.success).toBe(true);
      expect(res.provider).toBe('2factor');
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it('safely falls back without calling 2Factor when OTP_2FACTOR_API_KEY matches FAST2SMS_API_KEY', async () => {
      const mirrorKey = 'mirror_key_8899';
      process.env.FAST2SMS_API_KEY = mirrorKey;
      process.env.OTP_2FACTOR_API_KEY = mirrorKey;

      // Fast2SMS fails
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: { return: false },
      });

      const res = await sendOtp('9876543210', '556677');

      expect(res.success).toBe(true);
      expect(res.provider).toBe('fallback_logged');
      expect(axios.get).not.toHaveBeenCalled();
    });
  });
});
