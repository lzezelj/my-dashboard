import { describe, expect, it } from 'vitest';
import {
  hashDemoPassword,
  normalizeDemoUsername,
  verifyDemoPassword,
} from '../src/services/authentication.service.js';

describe('demo account passwords', () => {
  it('stores a salted scrypt hash and verifies only the correct password', async () => {
    const hash = await hashDemoPassword('correct horse battery staple');

    expect(hash).toMatch(/^scrypt\$[a-f0-9]+\$[a-f0-9]+$/);
    expect(hash).not.toContain('correct horse battery staple');
    await expect(verifyDemoPassword('correct horse battery staple', hash)).resolves.toBe(true);
    await expect(verifyDemoPassword('incorrect password', hash)).resolves.toBe(false);
  });

  it('normalizes demo usernames consistently', () => {
    expect(normalizeDemoUsername('  Example-Company  ')).toBe('example-company');
  });
});
