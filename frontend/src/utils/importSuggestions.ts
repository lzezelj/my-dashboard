import type { EventCategory } from '../types/events';

const categoryKeywords: Array<[EventCategory, string[]]> = [
  ['BIRTHDAY', ['birthday', 'birth day', 'bday', 'born']],
  ['APPOINTMENT', ['appointment', 'dentist', 'doctor', 'therapy', 'check-up', 'checkup']],
  ['TRAVEL', ['travel', 'trip', 'flight', 'airport', 'train', 'vacation', 'hotel']],
  ['SCHOOL', ['school', 'university', 'college', 'exam', 'class', 'assignment', 'homework']],
  ['WORK', ['work', 'office', 'client', 'deadline', 'shift', 'business meeting']],
  ['TV_SHOW', ['tv show', 'television', 'episode', 'season premiere', 'series finale']],
  ['MOVIE', ['movie', 'film', 'cinema', 'screening']],
  ['GAME', ['video game', 'gaming', 'game release', 'game night']],
  ['TODO', ['todo', 'to-do', 'task', 'reminder']],
  ['EVENT', ['concert', 'festival', 'conference', 'wedding', 'party']],
];

export function suggestCategory(title: string, description?: string | null) {
  const titleText = title.toLocaleLowerCase();
  const descriptionText = (description ?? '').toLocaleLowerCase();
  for (const [category, keywords] of categoryKeywords) {
    const keyword = keywords.find(
      (candidate) => titleText.includes(candidate) || descriptionText.includes(candidate),
    );
    if (keyword) return { category, keyword };
  }
  return null;
}

export function plainTextDescription(value: string) {
  const document = new DOMParser().parseFromString(value, 'text/html');
  return (document.body.textContent ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .trim();
}

export type DescriptionTemplate = { prefix: string[]; suffix: string[] };

export function detectDescriptionTemplate(descriptions: string[]): DescriptionTemplate | null {
  const tokenized = descriptions
    .map(plainTextDescription)
    .filter(Boolean)
    .map((description) => description.split(/\s+/));
  if (tokenized.length < 3) return null;

  const shortest = Math.min(...tokenized.map((tokens) => tokens.length));
  let prefixLength = 0;
  while (
    prefixLength < shortest &&
    tokenized.every(
      (tokens) =>
        tokens[prefixLength]?.toLocaleLowerCase() ===
        tokenized[0]![prefixLength]?.toLocaleLowerCase(),
    )
  )
    prefixLength += 1;

  let suffixLength = 0;
  while (
    suffixLength < shortest - prefixLength &&
    tokenized.every(
      (tokens) =>
        tokens[tokens.length - 1 - suffixLength]?.toLocaleLowerCase() ===
        tokenized[0]![tokenized[0]!.length - 1 - suffixLength]?.toLocaleLowerCase(),
    )
  )
    suffixLength += 1;

  if (prefixLength + suffixLength < 2) return null;
  return {
    prefix: tokenized[0]!.slice(0, prefixLength),
    suffix: suffixLength ? tokenized[0]!.slice(-suffixLength) : [],
  };
}

export function suggestedDescription(
  value: string | null | undefined,
  title: string,
  template: DescriptionTemplate | null,
) {
  if (!value) return null;
  const plain = plainTextDescription(value);
  let suggestion = plain;
  if (template) {
    const tokens = plain.split(/\s+/);
    suggestion = tokens
      .slice(template.prefix.length, template.suffix.length ? -template.suffix.length : undefined)
      .join(' ')
      .trim();
  }
  if (suggestion.toLocaleLowerCase() === title.trim().toLocaleLowerCase()) suggestion = '';
  return suggestion === value ? null : suggestion;
}
