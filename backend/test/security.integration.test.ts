import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { EventCategory } from '../src/generated/prisma/client.js';
import { validateEventInput } from '../src/services/events.service.js';

describe('HTTP security configuration', () => {
  it('allows credentialed requests from the configured frontend origin', async () => {
    const response = await request(app)
      .options('/api/events')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('does not authorize a different browser origin', async () => {
    const response = await request(app).get('/api/health').set('Origin', 'https://attacker.test');

    expect(response.headers['access-control-allow-origin']).not.toBe('https://attacker.test');
  });

  it('rejects JSON request bodies over six megabytes', async () => {
    const response = await request(app)
      .post('/api/auth/google/login')
      .set('Content-Type', 'application/json')
      .send({ credential: 'x'.repeat(6 * 1024 * 1024 + 1) });

    expect(response.status).toBe(413);
  });
});

describe('event input validation', () => {
  it('rejects invalid categories, dates, recurrence limits, and unsafe URLs', () => {
    expect(() =>
      validateEventInput({
        category: 'INVALID' as EventCategory,
        title: 'Bad category',
        date: '2026-10-14',
      }),
    ).toThrow('category is invalid');
    expect(() =>
      validateEventInput({
        category: EventCategory.OTHER,
        title: 'Bad date',
        date: 'not-a-date',
      }),
    ).toThrow('valid YYYY-MM-DD');
    expect(() =>
      validateEventInput({
        category: EventCategory.OTHER,
        title: 'Bad recurrence',
        date: '2026-10-14',
        recurring: 'DAILY',
        numberOfRecurrences: 0,
      }),
    ).toThrow('positive integer');
    expect(() =>
      validateEventInput({
        category: EventCategory.OTHER,
        title: 'Unsafe URL',
        date: '2026-10-14',
        url: 'javascript:alert(1)',
      }),
    ).toThrow('HTTP or HTTPS');
  });
});
