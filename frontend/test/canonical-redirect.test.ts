import { describe, expect, it } from 'vitest';
import { getCanonicalRedirect } from '../src/utils/canonicalRedirect';

describe('canonical frontend redirect', () => {
  it('preserves the path, query, and fragment on the legacy Worker address', () => {
    expect(
      getCanonicalRedirect(
        {
          hostname: 'my-dashboard.lovro-zezelj.workers.dev',
          pathname: '/events',
          search: '?page=3',
          hash: '#selected',
        },
        'https://calendar.example.com',
      ),
    ).toBe('https://calendar.example.com/events?page=3#selected');
  });

  it('does not redirect requests already using another hostname', () => {
    expect(
      getCanonicalRedirect(
        {
          hostname: 'calendar.example.com',
          pathname: '/events',
          search: '',
          hash: '',
        },
        'https://calendar.example.com',
      ),
    ).toBeNull();
  });

  it.each(['', 'not-a-url', 'http://calendar.example.com', 'https://my-dashboard.lovro-zezelj.workers.dev'])(
    'rejects an unsafe or incomplete canonical origin: %s',
    (origin) => {
      expect(
        getCanonicalRedirect(
          {
            hostname: 'my-dashboard.lovro-zezelj.workers.dev',
            pathname: '/',
            search: '',
            hash: '',
          },
          origin,
        ),
      ).toBeNull();
    },
  );
});
