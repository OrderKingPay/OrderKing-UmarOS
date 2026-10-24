import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Route } from './health';

// Mock the db module
vi.mock('@/lib/db', () => ({
  getSql: vi.fn(),
  getDatabaseUrl: vi.fn(),
}));

import { getSql, getDatabaseUrl } from '@/lib/db';

describe('HDmaster /api/health Endpoint Suite', () => {
  const originalEnv = { ...process.env };
  const handlers = (Route.options as any).server?.handlers;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('HEAD Handler', () => {
    it('responds with 200 OK, empty body and anti-caching headers', async () => {
      const response = await handlers.HEAD();
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/json');
      expect(response.headers.get('cache-control')).toBe('no-store, no-cache, must-revalidate');
      const text = await response.text();
      expect(text).toBe('');
    });
  });

  describe('GET Handler', () => {
    it('returns healthy status when DB is connected and all secrets are configured', async () => {
      process.env.BETTER_AUTH_SECRET = 'test-secret';
      process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
      vi.mocked(getDatabaseUrl).mockReturnValue('postgres://user:pass@localhost:5432/db');

      const mockQuery = vi.fn().mockResolvedValue([{ '?column?': 1 }]);
      vi.mocked(getSql).mockResolvedValue({ query: mockQuery } as any);

      const response = await handlers.GET();
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/json');
      expect(response.headers.get('cache-control')).toBe('no-store, no-cache, must-revalidate');

      const body = await response.json();
      expect(body.status).toBe('healthy');
      expect(body.database).toBe('connected');
      expect(body.secrets.auth).toBe(true);
      expect(body.secrets.db).toBe(true);
      expect(body.timestamp).toBeDefined();
    });

    it('returns degraded status (200 OK) when database is unconfigured', async () => {
      process.env.BETTER_AUTH_SECRET = 'test-secret';
      delete process.env.DATABASE_URL;
      delete process.env.VITE_PG_LITE_URL;
      vi.mocked(getDatabaseUrl).mockReturnValue(undefined as unknown as string);

      const response = await handlers.GET();
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.status).toBe('degraded');
      expect(body.database).toBe('unconfigured');
      expect(body.secrets.db).toBe(false);
    });

    it('returns degraded status (200 OK) when database query throws an error', async () => {
      process.env.BETTER_AUTH_SECRET = 'test-secret';
      process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
      vi.mocked(getDatabaseUrl).mockReturnValue('postgres://user:pass@localhost:5432/db');

      vi.mocked(getSql).mockRejectedValue(new Error('Connection refused'));

      const response = await handlers.GET();
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.status).toBe('degraded');
      expect(body.database).toContain('Connection refused');
    });

    it('returns unhealthy status in 200 payload if an unexpected internal exception occurs', async () => {
      vi.mocked(getDatabaseUrl).mockImplementation(() => {
        throw new Error('Fatal panic');
      });

      const response = await handlers.GET();
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.status).toBe('unhealthy');
      expect(body.error).toContain('Fatal panic');
    });
  });
});
