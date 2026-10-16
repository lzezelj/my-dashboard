import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { EventCategory, Recurrence } from '../src/generated/prisma/client.js';
import { prisma } from '../src/lib/prisma.js';
import {
  createEventService,
  deleteAllEventsService,
  deleteEventService,
  deleteEventsService,
  exportEventsService,
  getEventService,
  getEventsService,
  importEventsService,
  updateEventService,
} from '../src/services/events.service.js';
import {
  exportIcsService,
  importIcsService,
  parseIcsService,
} from '../src/services/icalendar.service.js';

const createUser = (suffix: string) =>
  prisma.user.create({ data: { email: `${suffix}@example.com`, googleId: `google-${suffix}` } });

if (!process.env.TEST_DATABASE_URL)
  throw new Error('TEST_DATABASE_URL is required for integration tests.');
const testDatabaseName = new URL(process.env.TEST_DATABASE_URL).pathname.replace(/^\//, '');
if (!/(?:^|_)test(?:_|$)/i.test(testDatabaseName))
  throw new Error('Refusing to run tests against a database without "test" in its name.');

beforeAll(async () => {
  const result = await prisma.$queryRaw<
    Array<{ current_database: string; current_schema: string }>
  >`SELECT current_database(), current_schema()`;
  if (result[0]?.current_database !== testDatabaseName || result[0]?.current_schema !== 'public')
    throw new Error(`Refusing to run integration tests outside ${testDatabaseName}.public`);
});

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { endsWith: '@example.com' } } });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('event ownership and CRUD', () => {
  it('creates and retrieves every event category with complete shared data', async () => {
    const user = await createUser('all-categories');

    for (const [index, category] of Object.values(EventCategory).entries()) {
      const created = await createEventService(
        {
          category,
          title: `${category} example`,
          date: `2026-11-${String(index + 1).padStart(2, '0')}`,
          description: `Complete ${category} description`,
          location: `${category} location`,
          url: `https://example.com/${category.toLowerCase()}`,
          details: { testField: `${category} detail` },
          recurring: Recurrence.YEARLY,
          numberOfRecurrences: 2,
        },
        user.id,
      );

      expect(await getEventService(created.id, user.id)).toMatchObject({
        category,
        title: `${category} example`,
        description: `Complete ${category} description`,
        location: `${category} location`,
        details: { testField: `${category} detail` },
        recurring: Recurrence.YEARLY,
        numberOfRecurrences: 2,
      });
    }
  });
  it('prevents users from reading, editing, or deleting another user’s event', async () => {
    const owner = await createUser('owner');
    const stranger = await createUser('stranger');
    const event = await createEventService(
      { category: EventCategory.OTHER, title: 'Private', date: '2026-10-14' },
      owner.id,
    );

    expect(await getEventService(event.id, stranger.id)).toBeNull();
    expect(await updateEventService(event.id, { title: 'Stolen' }, stranger.id)).toBeNull();
    expect(await deleteEventService(event.id, stranger.id)).toBeNull();
    expect(await getEventService(event.id, owner.id)).toMatchObject({ title: 'Private' });
  });

  it('creates, retrieves, updates, and deletes an owned event', async () => {
    const user = await createUser('crud');
    const created = await createEventService(
      {
        category: EventCategory.APPOINTMENT,
        title: 'Dentist',
        date: '2026-10-20',
        location: 'Clinic',
      },
      user.id,
    );
    expect(await getEventService(created.id, user.id)).toMatchObject({ title: 'Dentist' });

    const updated = await updateEventService(created.id, { title: 'Doctor' }, user.id);
    expect(updated).toMatchObject({ title: 'Doctor' });
    expect(await deleteEventService(created.id, user.id)).toMatchObject({ id: created.id });
    expect(await getEventService(created.id, user.id)).toBeNull();
  });

  it('deletes individual selections without touching another user', async () => {
    const user = await createUser('bulk-owner');
    const other = await createUser('bulk-other');
    const first = await createEventService(
      { category: EventCategory.OTHER, title: 'First', date: '2026-10-14' },
      user.id,
    );
    const second = await createEventService(
      { category: EventCategory.OTHER, title: 'Second', date: '2026-10-15' },
      user.id,
    );
    const foreign = await createEventService(
      { category: EventCategory.OTHER, title: 'Foreign', date: '2026-10-16' },
      other.id,
    );

    expect(await deleteEventsService([first.id, foreign.id], user.id)).toMatchObject({ count: 1 });
    expect(await getEventService(second.id, user.id)).not.toBeNull();
    expect(await getEventService(foreign.id, other.id)).not.toBeNull();
  });

  it('deletes all events belonging only to the selected user', async () => {
    const user = await createUser('all-owner');
    const other = await createUser('all-other');
    await createEventService(
      { category: EventCategory.OTHER, title: 'One', date: '2026-10-14' },
      user.id,
    );
    await createEventService(
      { category: EventCategory.OTHER, title: 'Two', date: '2026-10-15' },
      user.id,
    );
    await createEventService(
      { category: EventCategory.OTHER, title: 'Keep', date: '2026-10-16' },
      other.id,
    );

    expect(await deleteAllEventsService(user.id)).toMatchObject({ count: 2 });
    expect(await getEventsService({}, user.id)).toHaveLength(0);
    expect(await getEventsService({}, other.id)).toHaveLength(1);
  });
});

describe('JSON and ICS portability', () => {
  it('preserves ISO timestamps and timezone identifiers through JSON v2', async () => {
    const user = await createUser('json-timezone');
    await createEventService(
      {
        category: EventCategory.TRAVEL,
        title: 'Berlin departure',
        startTime: '2026-07-15T08:00:00.000Z',
        endTime: '2026-07-15T09:30:00.000Z',
        timeZone: 'Europe/Berlin',
      },
      user.id,
    );

    const exported = await exportEventsService(user.id);
    expect(exported.events[0]).toMatchObject({
      startTime: '2026-07-15T08:00:00.000Z',
      endTime: '2026-07-15T09:30:00.000Z',
      timeZone: 'Europe/Berlin',
    });
    const exportedIcs = await exportIcsService(user.id);
    expect(exportedIcs).toContain('DTSTART:20260715T080000Z');
    expect(exportedIcs).toContain('DTEND:20260715T093000Z');
  });

  it('parses UTC ICS timestamps without shifting them', () => {
    const [event] = parseIcsService(
      [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        'UID:utc@example.com',
        'DTSTART:20260715T080000Z',
        'DTEND:20260715T093000Z',
        'SUMMARY:UTC event',
        'END:VEVENT',
        'END:VCALENDAR',
        '',
      ].join('\r\n'),
    );

    expect(event).toMatchObject({
      startTime: '2026-07-15T08:00:00.000Z',
      endTime: '2026-07-15T09:30:00.000Z',
      timeZone: 'UTC',
    });
  });

  it('applies Europe/Berlin winter and summer offsets from ICS timezone data', () => {
    const events = parseIcsService(
      [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VTIMEZONE',
        'TZID:Europe/Berlin',
        'BEGIN:STANDARD',
        'DTSTART:19701025T030000',
        'TZOFFSETFROM:+0200',
        'TZOFFSETTO:+0100',
        'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
        'END:STANDARD',
        'BEGIN:DAYLIGHT',
        'DTSTART:19700329T020000',
        'TZOFFSETFROM:+0100',
        'TZOFFSETTO:+0200',
        'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
        'END:DAYLIGHT',
        'END:VTIMEZONE',
        'BEGIN:VEVENT',
        'UID:winter@example.com',
        'DTSTART;TZID=Europe/Berlin:20260115T100000',
        'SUMMARY:Winter event',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'UID:summer@example.com',
        'DTSTART;TZID=Europe/Berlin:20260715T100000',
        'SUMMARY:Summer event',
        'END:VEVENT',
        'END:VCALENDAR',
        '',
      ].join('\r\n'),
    );

    expect(events[0]).toMatchObject({
      startTime: '2026-01-15T09:00:00.000Z',
      timeZone: 'Europe/Berlin',
    });
    expect(events[1]).toMatchObject({
      startTime: '2026-07-15T08:00:00.000Z',
      timeZone: 'Europe/Berlin',
    });
  });

  it('keeps date-only ICS events on the same calendar day', () => {
    const [event] = parseIcsService(
      [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        'UID:date-only@example.com',
        'DTSTART;VALUE=DATE:20260329',
        'SUMMARY:DST date-only event',
        'END:VEVENT',
        'END:VCALENDAR',
        '',
      ].join('\r\n'),
    );

    expect(event).toMatchObject({
      date: '2026-03-29',
      startTime: null,
      timeZone: null,
      allDay: true,
    });
  });

  it('round-trips all event data through JSON v2', async () => {
    const user = await createUser('json');
    await createEventService(
      {
        category: EventCategory.MOVIE,
        title: 'Example movie',
        date: '2026-11-01',
        description: 'Watch this',
        location: 'Cinema',
        details: { director: 'Director', genre: 'Drama' },
      },
      user.id,
    );
    const exported = await exportEventsService(user.id);
    expect(exported.version).toBe(2);
    await deleteAllEventsService(user.id);

    const result = await importEventsService(
      exported.events.map((event, index) => ({
        sourceIndex: index + 1,
        event,
        preserveOverrides: true,
      })),
      user.id,
    );

    expect(result).toEqual({ imported: 1, skipped: [] });
    expect(await getEventsService({}, user.id)).toEqual([
      expect.objectContaining({
        title: 'Example movie',
        location: 'Cinema',
        details: { director: 'Director', genre: 'Drama' },
      }),
    ]);
  });

  it('parses, imports, and exports an ICS calendar', async () => {
    const user = await createUser('ics');
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'UID:test-event@example.com',
      'DTSTAMP:20261014T120000Z',
      'DTSTART;VALUE=DATE:20261105',
      'SUMMARY:Imported event',
      'LOCATION:Town Hall',
      'END:VEVENT',
      'END:VCALENDAR',
      '',
    ].join('\r\n');

    expect(parseIcsService(ics)).toEqual([
      expect.objectContaining({ title: 'Imported event', date: '2026-11-05' }),
    ]);
    expect(await importIcsService(ics, [1], user.id)).toEqual({ imported: 1, skipped: [] });
    expect(await prisma.user.findUnique({ where: { id: user.id } })).toMatchObject({
      id: user.id,
      email: user.email,
    });
    const exported = await exportIcsService(user.id);
    expect(exported).toContain('SUMMARY:Imported event');
    expect(parseIcsService(exported)).toHaveLength(1);
  });

  it('rejects malformed and oversized ICS input', () => {
    expect(() => parseIcsService('not a calendar')).toThrow('valid iCalendar');
    expect(() => parseIcsService('x'.repeat(5 * 1024 * 1024 + 1))).toThrow('exceeds 5 MB');
  });
});

describe('recurrence expansion', () => {
  it('limits each recurring series for the upcoming-events view', async () => {
    const user = await createUser('upcoming-limits');
    const recurrences = [
      [Recurrence.DAILY, 30],
      [Recurrence.WEEKLY, 4],
      [Recurrence.MONTHLY, 1],
      [Recurrence.YEARLY, 1],
    ] as const;

    for (const [recurring] of recurrences) {
      await createEventService(
        {
          category: EventCategory.OTHER,
          title: recurring,
          date: '2026-10-01',
          recurring,
        },
        user.id,
      );
    }

    const events = await getEventsService({ from: '2026-10-15', upcoming: true }, user.id);
    for (const [recurring, expectedCount] of recurrences) {
      expect(events.filter((event) => event.recurring === recurring)).toHaveLength(expectedCount);
    }
  });

  it('expands finite recurrence', async () => {
    const user = await createUser('finite');
    await createEventService(
      {
        category: EventCategory.OTHER,
        title: 'Finite',
        date: '2026-10-01',
        recurring: Recurrence.WEEKLY,
        numberOfRecurrences: 3,
      },
      user.id,
    );
    expect(await getEventsService({ from: '2026-10-01', to: '2026-10-31' }, user.id)).toHaveLength(
      3,
    );
  });

  it('stops date-limited recurrence on its end date', async () => {
    const user = await createUser('date-limited');
    await createEventService(
      {
        category: EventCategory.OTHER,
        title: 'Limited',
        date: '2026-10-01',
        recurring: Recurrence.DAILY,
        recurrenceEndDate: '2026-10-03',
      },
      user.id,
    );
    expect(await getEventsService({ from: '2026-10-01', to: '2026-10-31' }, user.id)).toHaveLength(
      3,
    );
  });

  it('bounds infinite recurrence to the requested date range', async () => {
    const user = await createUser('infinite');
    await createEventService(
      {
        category: EventCategory.OTHER,
        title: 'Infinite',
        date: '2026-01-01',
        recurring: Recurrence.MONTHLY,
      },
      user.id,
    );
    const events = await getEventsService({ from: '2026-10-01', to: '2026-12-31' }, user.id);
    expect(
      events.map((event) => ('occurrenceDate' in event ? event.occurrenceDate : null)),
    ).toEqual(['2026-10-01', '2026-11-01', '2026-12-01']);
  });
});
