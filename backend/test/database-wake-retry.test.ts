import { afterEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
}));

vi.mock('../src/lib/prisma.js', () => ({ prisma: prismaMock }));

import { findGoogleUser } from '../src/services/authentication.service.js';

describe('database wake-up retry', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('retries a transient connection failure', async () => {
    vi.useFakeTimers();
    prismaMock.user.findUnique
      .mockRejectedValueOnce(Object.assign(new Error('Cannot connect'), { code: 'P1001' }))
      .mockResolvedValueOnce({ id: 1 });

    const result = findGoogleUser('google-id');
    await vi.advanceTimersByTimeAsync(400);

    await expect(result).resolves.toEqual({ id: 1 });
    expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(2);
  });

  it('does not retry a non-transient query error', async () => {
    const error = Object.assign(new Error('Invalid query'), { code: 'P2009' });
    prismaMock.user.findUnique.mockRejectedValueOnce(error);

    await expect(findGoogleUser('google-id')).rejects.toBe(error);
    expect(prismaMock.user.findUnique).toHaveBeenCalledOnce();
  });
});
