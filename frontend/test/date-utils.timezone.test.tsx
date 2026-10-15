import { describe, expect, it } from 'vitest';
import {
  dateOnlyToDisplay,
  dateTimeToISOString,
  isoToDateInputValue,
  isoToTimeInputValue,
} from '../src/utils/dateUtils';

describe('date and timezone conversion', () => {
  it.each([
    ['2026-01-15', '10:00'],
    ['2026-07-15', '10:00'],
  ])('round-trips the local wall time for %s', (date, time) => {
    const iso = dateTimeToISOString(date, time);

    expect(isoToTimeInputValue(iso)).toBe(time);
  });

  it('does not shift date-only values through a timezone conversion', () => {
    expect(isoToDateInputValue('2026-03-29T00:00:00.000Z')).toBe('2026-03-29');
    expect(dateOnlyToDisplay('2026-03-29')).toBe('29/03/2026');
  });

  it('displays an explicit UTC instant using the browser local time', () => {
    const instant = '2026-07-15T08:00:00.000Z';
    const expected = new Date(instant);
    const localTime = `${String(expected.getHours()).padStart(2, '0')}:${String(expected.getMinutes()).padStart(2, '0')}`;

    expect(isoToTimeInputValue(instant)).toBe(localTime);
  });
});
