import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequestRateLimiter } from '../src/middleware/rateLimiters.js';

const testApp = (limit: number) => {
  const app = express();
  app.use(
    createRequestRateLimiter({
      identifier: 'test',
      limit,
      windowMs: 60_000,
      message: 'Test rate limit reached',
    }),
  );
  app.get('/resource', (_req, res) => res.json({ ok: true }));
  return app;
};

describe('API rate limiting', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('returns standard rate-limit headers and blocks requests over the limit', async () => {
    const app = testApp(2);

    const first = await request(app).get('/resource');
    const second = await request(app).get('/resource');
    const blocked = await request(app).get('/resource');

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.headers.ratelimit).toContain('"test"');
    expect(blocked.status).toBe(429);
    expect(blocked.headers['retry-after']).toBeDefined();
    expect(blocked.body).toEqual({ message: 'Test rate limit reached' });
  });

  it('keeps separate counters for different Railway client IPs in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const app = testApp(1);

    const firstClient = await request(app).get('/resource').set('X-Real-IP', '192.0.2.1');
    const secondClient = await request(app).get('/resource').set('X-Real-IP', '192.0.2.2');

    expect(firstClient.status).toBe(200);
    expect(secondClient.status).toBe(200);
  });
});
