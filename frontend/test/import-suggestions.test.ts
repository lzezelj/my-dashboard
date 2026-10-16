import { describe, expect, it } from 'vitest';
import {
  detectDescriptionTemplate,
  plainTextDescription,
  suggestedDescription,
  suggestCategory,
} from '../src/utils/importSuggestions';

describe('import suggestions', () => {
  it('suggests a category from an unclassified event title or description', () => {
    expect(suggestCategory('Alex', 'This is Alex birthday!')?.category).toBe('BIRTHDAY');
    expect(suggestCategory('Flight to Berlin', null)?.category).toBe('TRAVEL');
  });

  it('converts imported HTML descriptions to plain text', () => {
    expect(
      plainTextDescription('This is <a href="https://example.com/alex">Alex</a> birthday!'),
    ).toBe('This is Alex birthday!');
  });

  it('detects and removes a repeated description template', () => {
    const descriptions = [
      'This is <a href="/alex">Alex</a> birthday!',
      'This is <a href="/sam">Sam</a> birthday!',
      'This is <a href="/jordan">Jordan</a> birthday!',
    ];
    const template = detectDescriptionTemplate(descriptions);
    expect(suggestedDescription(descriptions[0], 'Alex', template)).toBe('');
    expect(suggestedDescription(descriptions[1], 'Someone else', template)).toBe('Sam');
  });
});
