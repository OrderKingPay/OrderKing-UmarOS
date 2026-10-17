import { describe, it, expect } from 'vitest';
import { Route } from './ping';

describe('HDmaster /api/ping Endpoint Suite', () => {
  const handlers = (Route.options as any).server?.handlers;

  it('exposes GET and HEAD server handlers', () => {
    expect(handlers).toBeDefined();
    expect(typeof handlers.GET).toBe('function');
    expect(typeof handlers.HEAD).toBe('function');
  });

  describe('HEAD Handler', () => {
    it('responds with status 200, empty body, and anti-caching headers', async () => {
      const response = await handlers.HEAD();
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
      expect(response.headers.get('cache-control')).toBe('no-store, no-cache, must-revalidate');
      const text = await response.text();
      expect(text).toBe('');
    });
  });

  describe('GET Handler', () => {
    it('responds with status 200, "pong" text payload, and anti-caching headers', async () => {
      const response = await handlers.GET();
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
      expect(response.headers.get('cache-control')).toBe('no-store, no-cache, must-revalidate');
      const text = await response.text();
      expect(text).toBe('pong');
    });
  });
});
