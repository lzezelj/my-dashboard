import {
  EventCategory,
  Recurrence,
  Prisma,
  type Event,
  type EventOccurrenceOverride,
} from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';

export type EventInput = {
  category: EventCategory;
  title: string;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  description?: string | null;
  details?: Record<string, string> | null;
  externalUid?: string | null;
  timeZone?: string | null;
  allDay?: boolean;
  location?: string | null;
  url?: string | null;
  recurrenceRule?: string | null;
  status?: string | null;
  sequence?: number | null;
  originalIcs?: string | null;
  recurrenceDates?: string[];
  exclusionDates?: string[];
  recurring?: Recurrence | null;
  numberOfRecurrences?: number | null;
  recurrenceEndDate?: string | null;
  allowCompletion?: boolean;
  completed?: boolean;
};
export type EventOccurrence = Event & { occurrenceDate: string; sourceOccurrenceDate: string };
type EventWithOverrides = Event & { occurrenceOverrides: EventOccurrenceOverride[] };
const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
const invalid = (message: string): never => {
  const error = new Error(message);
  error.name = 'ValidationError';
  throw error;
};
const parseDate = (value: string) => {
  if (!dateOnly.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`)))
    invalid('date must be a valid YYYY-MM-DD value.');
  return new Date(`${value}T00:00:00.000Z`);
};
const parseTimestamp = (value: string, field: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) invalid(`${field} must be a valid ISO timestamp.`);
  return date;
};

export function validateEventInput(input: EventInput, partial = false): EventInput {
  if (
    (!partial || input.category !== undefined) &&
    !Object.values(EventCategory).includes(input.category)
  )
    invalid('category is invalid.');
  if (
    (!partial || input.title !== undefined) &&
    (typeof input.title !== 'string' || !input.title.trim())
  )
    invalid('title is required.');
  if (input.date !== undefined && input.date !== null && typeof input.date !== 'string')
    invalid('date must be a string.');
  if (
    input.startTime !== undefined &&
    input.startTime !== null &&
    typeof input.startTime !== 'string'
  )
    invalid('startTime must be a string.');
  if (input.endTime !== undefined && input.endTime !== null && typeof input.endTime !== 'string')
    invalid('endTime must be a string.');
  if (input.date && (input.startTime || input.endTime))
    invalid('Date-only events cannot also include startTime or endTime.');
  if (!partial && !input.date && !input.startTime)
    invalid('An event requires either date or startTime.');
  if (input.date) parseDate(input.date);
  if (input.startTime) parseTimestamp(input.startTime, 'startTime');
  if (
    input.endTime &&
    input.startTime &&
    parseTimestamp(input.endTime, 'endTime') <= parseTimestamp(input.startTime, 'startTime')
  )
    invalid('endTime must be after startTime.');
  if (input.recurring) {
    if (
      !Object.values(Recurrence).includes(input.recurring) ||
      (input.numberOfRecurrences !== undefined &&
        input.numberOfRecurrences !== null &&
        (!Number.isInteger(input.numberOfRecurrences) || input.numberOfRecurrences < 1))
    )
      invalid('numberOfRecurrences must be a positive integer when provided.');
    if (input.recurrenceEndDate) parseDate(input.recurrenceEndDate);
    const recurrenceStart = input.date ?? input.startTime?.slice(0, 10);
    if (input.recurrenceEndDate && recurrenceStart && input.recurrenceEndDate < recurrenceStart)
      invalid('recurrenceEndDate cannot be before the event starts.');
    if (input.numberOfRecurrences && input.recurrenceEndDate)
      invalid('Recurrence can end by count or date, but not both.');
  } else if (
    (input.numberOfRecurrences !== undefined && input.numberOfRecurrences !== null) ||
    (input.recurrenceEndDate !== undefined && input.recurrenceEndDate !== null)
  )
    invalid('Recurrence limits must be null without recurrence.');
  for (const [field, value] of [
    ['externalUid', input.externalUid],
    ['timeZone', input.timeZone],
    ['location', input.location],
    ['url', input.url],
    ['recurrenceRule', input.recurrenceRule],
    ['status', input.status],
    ['originalIcs', input.originalIcs],
  ] as const)
    if (value !== undefined && value !== null && typeof value !== 'string')
      invalid(`${field} must be a string.`);
  if (input.url) {
    try {
      const url = new URL(input.url);
      if (url.protocol !== 'http:' && url.protocol !== 'https:')
        invalid('url must use HTTP or HTTPS.');
    } catch {
      invalid('url must be a valid HTTP or HTTPS URL.');
    }
  }
  if (input.allDay !== undefined && typeof input.allDay !== 'boolean')
    invalid('allDay must be a boolean.');
  if (
    input.sequence !== undefined &&
    input.sequence !== null &&
    (!Number.isInteger(input.sequence) || input.sequence < 0)
  )
    invalid('sequence must be a non-negative integer.');
  for (const [field, value] of [
    ['recurrenceDates', input.recurrenceDates],
    ['exclusionDates', input.exclusionDates],
  ] as const)
    if (
      value !== undefined &&
      (!Array.isArray(value) || value.some((item) => typeof item !== 'string'))
    )
      invalid(`${field} must be an array of strings.`);
  if (
    input.details !== undefined &&
    input.details !== null &&
    (typeof input.details !== 'object' ||
      Array.isArray(input.details) ||
      Object.values(input.details).some((value) => typeof value !== 'string'))
  )
    invalid('details must be an object containing string values.');
  return { ...input, title: input.title?.trim() };
}
const toData = (input: Partial<EventInput>) => ({
  category: input.category,
  title: input.title,
  date: input.date === undefined ? undefined : input.date === null ? null : parseDate(input.date),
  startTime:
    input.startTime === undefined
      ? undefined
      : input.startTime === null
        ? null
        : parseTimestamp(input.startTime, 'startTime'),
  endTime:
    input.endTime === undefined
      ? undefined
      : input.endTime === null
        ? null
        : parseTimestamp(input.endTime, 'endTime'),
  description: input.description,
  details:
    input.details === undefined
      ? undefined
      : input.details === null
        ? Prisma.JsonNull
        : input.details,
  externalUid: input.externalUid,
  timeZone: input.timeZone,
  allDay: input.allDay ?? (input.date ? true : undefined),
  location: input.location,
  url: input.url,
  recurrenceRule: input.recurrenceRule,
  status: input.status,
  sequence: input.sequence,
  originalIcs: input.originalIcs,
  recurring: input.recurring,
  numberOfRecurrences: input.numberOfRecurrences,
  recurrenceEndDate:
    input.recurrenceEndDate === undefined
      ? undefined
      : input.recurrenceEndDate === null
        ? null
        : parseDate(input.recurrenceEndDate),
  allowCompletion: input.allowCompletion,
  completed: input.completed,
});

export async function getEventsService(
  filters: { category?: EventCategory; from?: string; to?: string; upcoming?: boolean },
  userId: number,
): Promise<Array<Event | EventOccurrence>> {
  const events = await prisma.event.findMany({
    where: {
      userId,
      ...(filters.category ? { category: filters.category } : {}),
    },
    include: { occurrenceOverrides: true },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });
  if (!filters.from && !filters.to)
    return events.map(({ occurrenceOverrides: _occurrenceOverrides, ...event }) => event);
  return events
    .flatMap((event) => expandEvent(event, filters))
    .filter(
      ({ occurrenceDate }) =>
        occurrenceDate >= (filters.from ?? '0001-01-01') &&
        occurrenceDate <= (filters.to ?? '9999-12-31'),
    );
}
export async function exportEventsService(userId: number) {
  const events = await prisma.event.findMany({
    where: { userId },
    include: { occurrenceOverrides: true, recurrenceDates: true, exclusionDates: true },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    events: events.map((event) => ({
      category: event.category,
      title: event.title,
      date: event.date?.toISOString().slice(0, 10) ?? null,
      startTime: event.startTime?.toISOString() ?? null,
      endTime: event.endTime?.toISOString() ?? null,
      description: event.description,
      details: event.details,
      externalUid: event.externalUid,
      timeZone: event.timeZone,
      allDay: event.allDay,
      location: event.location,
      url: event.url,
      recurrenceRule: event.recurrenceRule,
      status: event.status,
      sequence: event.sequence,
      originalIcs: event.originalIcs,
      recurrenceDates: event.recurrenceDates.map(({ value }) => value),
      exclusionDates: event.exclusionDates.map(({ value }) => value),
      recurring: event.recurring,
      numberOfRecurrences: event.numberOfRecurrences,
      recurrenceEndDate: event.recurrenceEndDate?.toISOString().slice(0, 10) ?? null,
      allowCompletion: event.allowCompletion,
      completed: event.completed,
      occurrenceOverrides: event.occurrenceOverrides.map((override) => ({
        occurrenceDate: override.occurrenceDate.toISOString().slice(0, 10),
        date: override.date?.toISOString().slice(0, 10) ?? null,
        description: override.description,
      })),
    })),
  };
}
export async function findImportDuplicatesService(
  importedEvents: Array<{ title?: unknown; date?: unknown; startTime?: unknown }>,
  userId: number,
) {
  const existing = await prisma.event.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      category: true,
      date: true,
      startTime: true,
      description: true,
    },
  });
  const key = (title: string, date: string) => `${title.trim().toLocaleLowerCase()}\u0000${date}`;
  const existingByKey = new Map(
    existing.flatMap((event) => {
      const date =
        event.date?.toISOString().slice(0, 10) ?? event.startTime?.toISOString().slice(0, 10);
      return date
        ? [
            [
              key(event.title, date),
              {
                ...event,
                date: event.date?.toISOString() ?? null,
                startTime: event.startTime?.toISOString() ?? null,
              },
            ] as const,
          ]
        : [];
    }),
  );
  const seenKeys = new Map<string, number>();
  const duplicates: number[] = [];
  const matches: Array<{
    index: number;
    existing: (typeof existingByKey extends Map<string, infer V> ? V : never) | null;
    duplicateOfIndex: number | null;
  }> = [];
  importedEvents.forEach((event, index) => {
    const date =
      typeof event.date === 'string'
        ? event.date
        : typeof event.startTime === 'string'
          ? event.startTime.slice(0, 10)
          : null;
    if (typeof event.title !== 'string' || !date) return;
    const eventKey = key(event.title, date);
    const saved = existingByKey.get(eventKey) ?? null;
    const duplicateOfIndex = seenKeys.get(eventKey) ?? null;
    if (saved || duplicateOfIndex !== null) {
      duplicates.push(index);
      matches.push({ index, existing: saved, duplicateOfIndex });
    }
    if (!seenKeys.has(eventKey)) seenKeys.set(eventKey, index);
  });
  return { duplicates, matches };
}

type ImportOccurrenceOverride = {
  occurrenceDate: string;
  date: string | null;
  description: string | null;
};

type ImportItem = {
  sourceIndex?: unknown;
  event?: unknown;
  preserveOverrides?: unknown;
};

function parseImportOverrides(
  value: unknown,
  event: EventInput,
  preserveOverrides: boolean,
): ImportOccurrenceOverride[] {
  if (!preserveOverrides) return [];
  if (value === undefined) return [];
  if (!Array.isArray(value)) invalid('occurrenceOverrides must be an array.');
  const rawOverrides = value as unknown[];
  if (rawOverrides.length === 0) return [];
  if (!event.recurring) invalid('Only recurring events can contain occurrence overrides.');

  const original = event.date
    ? parseDate(event.date)
    : event.startTime
      ? parseTimestamp(event.startTime, 'startTime')
      : null;
  if (!original) invalid('An event requires either date or startTime.');
  const recurrenceStart = original as Date;
  const seen = new Set<string>();

  return rawOverrides.map((item, index) => {
    if (!item || typeof item !== 'object')
      invalid(`Occurrence override ${index + 1} must be an object.`);
    const override = item as Record<string, unknown>;
    if (
      typeof override.occurrenceDate !== 'string' ||
      !isOccurrenceDate(
        recurrenceStart,
        event.recurring!,
        override.occurrenceDate,
        event.numberOfRecurrences,
        event.recurrenceEndDate,
        event.timeZone,
      )
    )
      invalid(`Occurrence override ${index + 1} has an invalid occurrenceDate.`);
    const sourceDate = override.occurrenceDate as string;
    if (seen.has(sourceDate))
      invalid(`Occurrence override ${index + 1} duplicates an occurrence date.`);
    seen.add(sourceDate);
    if (override.date !== undefined && override.date !== null && typeof override.date !== 'string')
      invalid(`Occurrence override ${index + 1} has an invalid date.`);
    if (
      override.description !== undefined &&
      override.description !== null &&
      typeof override.description !== 'string'
    )
      invalid(`Occurrence override ${index + 1} has an invalid description.`);
    if (typeof override.date === 'string') parseDate(override.date);
    return {
      occurrenceDate: sourceDate,
      date: typeof override.date === 'string' ? override.date : null,
      description:
        typeof override.description === 'string' ? override.description.trim() || null : null,
    };
  });
}

export async function importEventsService(items: unknown[], userId: number) {
  const skipped: Array<{ index: number; message: string }> = [];
  let imported = 0;

  for (const [position, rawItem] of items.entries()) {
    const fallbackIndex = position + 1;
    let sourceIndex = fallbackIndex;
    try {
      if (!rawItem || typeof rawItem !== 'object') invalid('Import entry must be an object.');
      const item = rawItem as ImportItem;
      if (Number.isInteger(item.sourceIndex) && Number(item.sourceIndex) > 0)
        sourceIndex = Number(item.sourceIndex);
      if (!item.event || typeof item.event !== 'object') invalid('Event data is missing.');
      const rawEvent = item.event as Record<string, unknown>;
      const event: EventInput = {
        category: rawEvent.category as EventCategory,
        title: rawEvent.title as string,
        date: (rawEvent.date ?? null) as string | null,
        startTime: (rawEvent.startTime ?? null) as string | null,
        endTime: (rawEvent.endTime ?? null) as string | null,
        description: (rawEvent.description ?? null) as string | null,
        details: (rawEvent.details ?? null) as Record<string, string> | null,
        externalUid: (rawEvent.externalUid ?? null) as string | null,
        timeZone: (rawEvent.timeZone ?? null) as string | null,
        allDay: (rawEvent.allDay ?? Boolean(rawEvent.date)) as boolean,
        location: (rawEvent.location ?? null) as string | null,
        url: (rawEvent.url ?? null) as string | null,
        recurrenceRule: (rawEvent.recurrenceRule ?? null) as string | null,
        status: (rawEvent.status ?? null) as string | null,
        sequence: (rawEvent.sequence ?? null) as number | null,
        originalIcs: (rawEvent.originalIcs ?? null) as string | null,
        recurrenceDates: (rawEvent.recurrenceDates ?? []) as string[],
        exclusionDates: (rawEvent.exclusionDates ?? []) as string[],
        recurring: (rawEvent.recurring ?? null) as Recurrence | null,
        numberOfRecurrences: (rawEvent.numberOfRecurrences ?? null) as number | null,
        recurrenceEndDate: (rawEvent.recurrenceEndDate ?? null) as string | null,
        allowCompletion: (rawEvent.allowCompletion ?? false) as boolean,
        completed: (rawEvent.completed ?? false) as boolean,
      };
      validateEventInput(event);
      if (
        event.description !== undefined &&
        event.description !== null &&
        typeof event.description !== 'string'
      )
        invalid('description must be a string.');
      if (event.allowCompletion !== undefined && typeof event.allowCompletion !== 'boolean')
        invalid('allowCompletion must be a boolean.');
      if (event.completed !== undefined && typeof event.completed !== 'boolean')
        invalid('completed must be a boolean.');
      const overrides = parseImportOverrides(
        rawEvent.occurrenceOverrides,
        event,
        item.preserveOverrides === true,
      );

      await prisma.$transaction(async (transaction) => {
        const data = toData(event) as Prisma.EventCreateInput;
        data.user = { connect: { id: userId } };
        data.occurrenceOverrides = {
          create: overrides.map((override) => ({
            occurrenceDate: parseDate(override.occurrenceDate),
            date: override.date ? parseDate(override.date) : null,
            description: override.description,
          })),
        };
        data.recurrenceDates = {
          create: (event.recurrenceDates ?? []).map((value) => ({ value })),
        };
        data.exclusionDates = {
          create: (event.exclusionDates ?? []).map((value) => ({ value })),
        };
        await transaction.event.create({ data });
      });
      imported += 1;
    } catch (error) {
      skipped.push({
        index: sourceIndex,
        message: error instanceof Error ? error.message : 'Invalid event.',
      });
    }
  }

  return { imported, skipped };
}

export const getEventService = (id: number, userId: number) =>
  prisma.event.findFirst({ where: { id, userId } });
export async function getEventOccurrencesService(id: number, userId: number) {
  const event = await prisma.event.findFirst({
    where: { id, userId },
    include: { occurrenceOverrides: true },
  });
  if (!event) return null;
  if (!event.recurring) invalid('Only recurring events have occurrences.');
  return expandEvent(event);
}
export async function createEventService(input: EventInput, userId: number) {
  validateEventInput(input);
  const data = toData(input) as Prisma.EventCreateInput;
  data.user = { connect: { id: userId } };
  return prisma.event.create({ data });
}
export async function updateEventService(id: number, input: Partial<EventInput>, userId: number) {
  const current = await getEventService(id, userId);
  if (!current) return null;
  const existing: EventInput = {
    category: current.category,
    title: current.title,
    date: current.date?.toISOString().slice(0, 10) ?? null,
    startTime: current.startTime?.toISOString() ?? null,
    endTime: current.endTime?.toISOString() ?? null,
    description: current.description,
    details:
      current.details && typeof current.details === 'object' && !Array.isArray(current.details)
        ? (current.details as Record<string, string>)
        : null,
    externalUid: current.externalUid,
    timeZone: current.timeZone,
    allDay: current.allDay,
    location: current.location,
    url: current.url,
    recurrenceRule: current.recurrenceRule,
    status: current.status,
    sequence: current.sequence,
    originalIcs: current.originalIcs,
    recurring: current.recurring,
    numberOfRecurrences: current.numberOfRecurrences,
    recurrenceEndDate: current.recurrenceEndDate?.toISOString().slice(0, 10) ?? null,
    allowCompletion: current.allowCompletion,
    completed: current.completed,
  };
  validateEventInput({ ...existing, ...input });
  return prisma.event.update({ where: { id }, data: toData(input) as Prisma.EventUpdateInput });
}
export async function deleteEventService(id: number, userId: number) {
  const current = await getEventService(id, userId);
  if (!current) return null;
  await prisma.event.delete({ where: { id } });
  return current;
}
export async function deleteEventsService(ids: unknown, userId: number) {
  if (!Array.isArray(ids) || ids.length === 0) invalid('ids must be a non-empty array.');
  const eventIds = ids as unknown[];
  if (
    eventIds.length > 10_000 ||
    eventIds.some((id) => !Number.isSafeInteger(id) || Number(id) <= 0)
  )
    invalid('ids must contain valid event ids.');
  const uniqueIds = [...new Set(eventIds as number[])];
  return prisma.event.deleteMany({ where: { userId, id: { in: uniqueIds } } });
}

export const deleteAllEventsService = (userId: number) =>
  prisma.event.deleteMany({ where: { userId } });
export async function updateOccurrenceService(
  id: number,
  occurrence: string,
  input: { description?: unknown; date?: unknown },
  userId: number,
) {
  if (!dateOnly.test(occurrence)) invalid('occurrence date must be a valid YYYY-MM-DD value.');
  if (
    input.description !== undefined &&
    input.description !== null &&
    typeof input.description !== 'string'
  )
    invalid('description must be a string.');
  if (input.date !== undefined && input.date !== null && typeof input.date !== 'string')
    invalid('date must be a valid YYYY-MM-DD value.');
  const descriptionValue =
    input.description === undefined
      ? undefined
      : typeof input.description === 'string'
        ? input.description.trim() || null
        : null;
  const dateValue =
    input.date === undefined
      ? undefined
      : input.date === null
        ? null
        : parseDate(input.date as string);
  const event = await getEventService(id, userId);
  if (!event) return null;
  if (!event.recurring) invalid('Only recurring events can have occurrence descriptions.');
  const recurrence = event.recurring as Recurrence;
  const occurrenceDateValue = parseDate(occurrence);
  const original = event.date ?? event.startTime;
  const validOccurrence = Boolean(
    original &&
    isOccurrenceDate(
      original,
      recurrence,
      occurrence,
      event.numberOfRecurrences,
      event.recurrenceEndDate?.toISOString().slice(0, 10),
      event.timeZone,
    ),
  );
  if (!validOccurrence) invalid('The occurrence does not belong to this event.');
  await prisma.eventOccurrenceOverride.upsert({
    where: { eventId_occurrenceDate: { eventId: id, occurrenceDate: occurrenceDateValue } },
    create: {
      eventId: id,
      occurrenceDate: occurrenceDateValue,
      description: descriptionValue ?? null,
      date: dateValue ?? null,
    },
    update: {
      ...(descriptionValue === undefined ? {} : { description: descriptionValue }),
      ...(dateValue === undefined ? {} : { date: dateValue }),
    },
  });
  const updatedEvent = await prisma.event.findFirst({
    where: { id, userId },
    include: { occurrenceOverrides: true },
  });
  return updatedEvent
    ? expandEvent(updatedEvent).find((item) => item.sourceOccurrenceDate === occurrence)
    : null;
}

function occurrenceDate(original: Date, recurrence: Recurrence, index: number) {
  const year = original.getUTCFullYear(),
    month = original.getUTCMonth(),
    day = original.getUTCDate(),
    hour = original.getUTCHours(),
    minute = original.getUTCMinutes(),
    second = original.getUTCSeconds();
  if (recurrence === Recurrence.DAILY || recurrence === Recurrence.WEEKLY)
    return new Date(
      Date.UTC(
        year,
        month,
        day + index * (recurrence === Recurrence.DAILY ? 1 : 7),
        hour,
        minute,
        second,
      ),
    );
  const targetYear =
      recurrence === Recurrence.YEARLY ? year + index : year + Math.floor((month + index) / 12),
    targetMonth = recurrence === Recurrence.YEARLY ? month : (month + index) % 12;
  return new Date(
    Date.UTC(
      targetYear,
      targetMonth,
      Math.min(day, new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate()),
      hour,
      minute,
      second,
    ),
  );
}

function eventDateKey(value: Date, timeZone?: string | null) {
  if (!timeZone) return value.toISOString().slice(0, 10);
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(value);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((item) => item.type === type)?.value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  } catch {
    return value.toISOString().slice(0, 10);
  }
}

function isOccurrenceDate(
  original: Date,
  recurrence: Recurrence,
  target: string,
  count?: number | null,
  endDate?: string | null,
  timeZone?: string | null,
) {
  const maximum = count ?? 100_000;
  for (let index = 0; index < maximum; index += 1) {
    const candidate = eventDateKey(occurrenceDate(original, recurrence, index), timeZone);
    if (endDate && candidate > endDate) return false;
    if (candidate === target) return true;
    if (candidate > target) return false;
  }
  return false;
}

export function expandEvent(
  event: EventWithOverrides,
  filters: { from?: string; to?: string; upcoming?: boolean } = {},
): EventOccurrence[] {
  const original = event.date ?? event.startTime;
  if (!original) return [];
  const maximum = event.recurring ? (event.numberOfRecurrences ?? 100_000) : 1;
  const occurrences: EventOccurrence[] = [];
  for (let index = 0; index < maximum; index += 1) {
    const date = event.recurring ? occurrenceDate(original, event.recurring, index) : original;
    const sourceOccurrenceDate = eventDateKey(date, event.timeZone);
    const recurrenceEndDate = event.recurrenceEndDate?.toISOString().slice(0, 10);
    if (recurrenceEndDate && sourceOccurrenceDate > recurrenceEndDate) break;
    if (filters.to && sourceOccurrenceDate > filters.to) break;
    const override = event.occurrenceOverrides.find(
      (item) => item.occurrenceDate.toISOString().slice(0, 10) === sourceOccurrenceDate,
    );
    const { occurrenceOverrides, ...baseEvent } = event;
    const occurrence = {
      ...baseEvent,
      description: override?.description ?? event.description,
      occurrenceDate: override?.date?.toISOString().slice(0, 10) ?? sourceOccurrenceDate,
      sourceOccurrenceDate,
    };
    if (
      occurrence.occurrenceDate >= (filters.from ?? '0001-01-01') &&
      occurrence.occurrenceDate <= (filters.to ?? '9999-12-31')
    )
      occurrences.push(occurrence);
    const upcomingLimit =
      event.recurring === Recurrence.DAILY
        ? 30
        : event.recurring === Recurrence.WEEKLY
          ? 4
          : event.recurring === Recurrence.MONTHLY || event.recurring === Recurrence.YEARLY
            ? 1
            : 1;
    if (!filters.to && occurrences.length >= (filters.upcoming ? upcomingLimit : 100)) break;
  }
  return occurrences;
}
