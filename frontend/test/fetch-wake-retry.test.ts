import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWithWakeRetry } from '../src/utils/fetchWithWakeRetry';

describe('serverless wake-up fetch retry', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('retries once after Railway returns a cold-start gateway error', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 502 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const responsePromise = fetchWithWakeRetry('/api/auth/me');
    await vi.advanceTimersByTimeAsync(1_500);

    await expect(responsePromise).resolves.toMatchObject({ status: 200 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry an ordinary authentication response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchWithWakeRetry('/api/auth/me')).resolves.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
