import { describe, expect, it } from 'vitest';
import { createGermanCoverLetter } from '../src/utils/createGermanCoverLetter';

describe('German cover-letter generator', () => {
  it('includes application details and the one-time demo credentials', () => {
    const letter = createGermanCoverLetter(
      {
        account: {
          id: 1,
          demoUsername: 'beispiel-gmbh',
          name: 'Beispiel GmbH',
          createdAt: '2026-10-17T00:00:00.000Z',
          eventCount: 0,
          applicationSalutation: 'Sehr geehrte Frau Müller',
          applicationPosition: 'Junior Softwareentwickler',
          applicationSource: 'Ihre Stellenanzeige auf der Firmenwebsite',
          applicationCompanyAddress: 'Musterstraße 1\n12345 Musterstadt',
        },
        password: 'one-time-password',
      },
      'https://calendar.example',
      new Date('2026-10-17T12:00:00Z'),
    );

    expect(letter).toContain('Bewerbung als Junior Softwareentwickler');
    expect(letter).toContain('Sehr geehrte Frau Müller,');
    expect(letter).toContain('Calendar Dashboard');
    expect(letter).toContain('Website: https://calendar.example');
    expect(letter).toContain('Benutzername: beispiel-gmbh');
    expect(letter).toContain('Passwort: one-time-password');
  });
});
