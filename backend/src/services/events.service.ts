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
  recurring?: Recurrence | null;
  numberOfRecurrences?: number | null;
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
      !Number.isInteger(input.numberOfRecurrences) ||
      input.numberOfRecurrences! < 1
    )
      invalid('Recurrence requires a positive numberOfRecurrences.');
  } else if (input.numberOfRecurrences !== undefined && input.numberOfRecurrences !== null)
    invalid('numberOfRecurrences must be null without recurrence.');
  return { ...input, title: input.title?.trim() };
}
const toData = (input: EventInput) => ({
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
  recurring: input.recurring,
  numberOfRecurrences: input.numberOfRecurrences,
  allowCompletion: input.allowCompletion,
  completed: input.completed,
});

export async function getEventsService(
  filters: { category?: EventCategory; from?: string; to?: string },
  userId: number,
) {
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
    .flatMap(expandEvent)
    .filter(
      ({ occurrenceDate }) =>
        occurrenceDate >= (filters.from ?? '0001-01-01') &&
        occurrenceDate <= (filters.to ?? '9999-12-31'),
    );
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
export async function updateEventService(id: number, input: EventInput, userId: number) {
  const current = await getEventService(id, userId);
  if (!current) return null;
  const existing: EventInput = {
    category: current.category,
    title: current.title,
    date: current.date?.toISOString().slice(0, 10) ?? null,
    startTime: current.startTime?.toISOString() ?? null,
    endTime: current.endTime?.toISOString() ?? null,
    description: current.description,
    recurring: current.recurring,
    numberOfRecurrences: current.numberOfRecurrences,
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
  const occurrenceDateValue = parseDate(occurrence);
  const validOccurrence = expandEvent({ ...event, occurrenceOverrides: [] }).some(
    (item) => item.occurrenceDate === occurrence,
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
export function expandEvent(event: EventWithOverrides): EventOccurrence[] {
  const original = event.date ?? event.startTime;
  if (!original) return [];
  const count = event.recurring ? (event.numberOfRecurrences ?? 0) : 1;
  return Array.from({ length: count }, (_unused, index) => {
    const date = event.recurring ? occurrenceDate(original, event.recurring, index) : original;
    const sourceOccurrenceDate = date.toISOString().slice(0, 10);
    const override = event.occurrenceOverrides.find(
      (item) => item.occurrenceDate.toISOString().slice(0, 10) === sourceOccurrenceDate,
    );
    const { occurrenceOverrides, ...baseEvent } = event;
    return {
      ...baseEvent,
      description: override?.description ?? event.description,
      occurrenceDate: override?.date?.toISOString().slice(0, 10) ?? sourceOccurrenceDate,
      sourceOccurrenceDate,
    };
  });
}
