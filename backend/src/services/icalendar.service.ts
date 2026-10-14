import ICAL from 'ical.js';
import { EventCategory, Recurrence } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { importEventsService, type EventInput } from './events.service.js';

const MAX_ICS_BYTES = 5 * 1024 * 1024;
const MAX_EVENTS = 10_000;

export type IcsPreviewEvent = EventInput & {
  sourceIndex: number;
  warnings: string[];
};

const invalid = (message: string): never => {
  const error = new Error(message);
  error.name = 'ValidationError';
  throw error;
};

const timeValue = (time: InstanceType<typeof ICAL.Time>) =>
  time.isDate ? time.toString().slice(0, 10) : time.toJSDate().toISOString();

const rawValues = (component: InstanceType<typeof ICAL.Component>, name: string) =>
  component
    .getAllProperties(name)
    .flatMap((property) => property.getValues())
    .map((value) =>
      value && typeof value === 'object' && 'toICALString' in value
        ? String((value as { toICALString: () => string }).toICALString())
        : String(value),
    );

const categoryFrom = (value: unknown) => {
  if (typeof value !== 'string') return EventCategory.OTHER;
  const normalized = value.trim().toUpperCase().replaceAll(' ', '_');
  return Object.values(EventCategory).includes(normalized as EventCategory)
    ? (normalized as EventCategory)
    : EventCategory.OTHER;
};

export function parseIcsService(ics: string): IcsPreviewEvent[] {
  if (typeof ics !== 'string' || !ics.trim()) invalid('An ICS calendar is required.');
  if (Buffer.byteLength(ics, 'utf8') > MAX_ICS_BYTES) invalid('The ICS file exceeds 5 MB.');

  const calendar = (() => {
    try {
      return ICAL.Component.fromString(ics);
    } catch {
      return invalid('The file is not valid iCalendar data.');
    }
  })();
  if (calendar.name !== 'vcalendar') invalid('The file must contain a VCALENDAR component.');
  const components = calendar.getAllSubcomponents('vevent');
  if (components.length > MAX_EVENTS) invalid('The calendar contains more than 10,000 events.');

  return components.map((component, sourceIndex) => {
    const event = new ICAL.Event(component);
    const start = event.startDate;
    if (!start) invalid(`Event ${sourceIndex + 1} does not have DTSTART.`);
    const allDay = start.isDate;
    const recurrence = component.getFirstPropertyValue('rrule');
    const recurrenceRule = recurrence ? String(recurrence) : null;
    const recurrenceObject = recurrence instanceof ICAL.Recur ? recurrence : null;
    const simpleFrequency = recurrenceObject?.freq?.toUpperCase();
    const simpleRecurrence =
      simpleFrequency && Object.values(Recurrence).includes(simpleFrequency as Recurrence)
        ? (simpleFrequency as Recurrence)
        : null;
    const warnings: string[] = [];
    let details: Record<string, string> | null = null;
    const rawDetails = component.getFirstPropertyValue('x-personal-dashboard-details');
    if (typeof rawDetails === 'string') {
      try {
        const parsed = JSON.parse(rawDetails) as unknown;
        if (
          parsed &&
          typeof parsed === 'object' &&
          !Array.isArray(parsed) &&
          Object.values(parsed).every((value) => typeof value === 'string')
        )
          details = parsed as Record<string, string>;
        else warnings.push('Dashboard-specific category details could not be read.');
      } catch {
        warnings.push('Dashboard-specific category details could not be read.');
      }
    }
    if (recurrenceRule && !simpleRecurrence)
      warnings.push(
        'The recurrence rule is preserved, but the dashboard does not yet expand this rule.',
      );
    if (event.isRecurrenceException())
      warnings.push('This is a recurrence exception and is currently imported as a separate event.');

    return {
      sourceIndex: sourceIndex + 1,
      category: categoryFrom(component.getFirstPropertyValue('categories')),
      title: event.summary?.trim() || 'Untitled event',
      date: allDay ? timeValue(start) : null,
      startTime: allDay ? null : timeValue(start),
      endTime: allDay || !event.endDate ? null : timeValue(event.endDate),
      description: event.description || null,
      details,
      externalUid: event.uid || null,
      timeZone: allDay || start.zone?.tzid === 'floating' ? null : start.zone?.tzid || null,
      allDay,
      location: event.location || null,
      url: (component.getFirstPropertyValue('url') as string | null) ?? null,
      recurrenceRule,
      status: (component.getFirstPropertyValue('status') as string | null) ?? null,
      sequence: event.sequence ?? null,
      originalIcs: component.toString(),
      recurrenceDates: rawValues(component, 'rdate'),
      exclusionDates: rawValues(component, 'exdate'),
      recurring: simpleRecurrence,
      numberOfRecurrences: simpleRecurrence ? recurrenceObject?.count ?? null : null,
      recurrenceEndDate: recurrenceObject?.until
        ? recurrenceObject.until.toString().slice(0, 10)
        : null,
      allowCompletion: false,
      completed: false,
      warnings,
    };
  });
}

export async function importIcsService(ics: string, selectedIndexes: number[], userId: number) {
  const events = parseIcsService(ics);
  const selected = new Set(selectedIndexes);
  return importEventsService(
    events
      .filter((event) => selected.has(event.sourceIndex))
      .map(({ sourceIndex, warnings: _warnings, ...event }) => ({
        sourceIndex,
        event,
        preserveOverrides: true,
      })),
    userId,
  );
}

const compactUtc = (value: Date) =>
  value.toISOString().replaceAll('-', '').replaceAll(':', '').replace(/\.\d{3}Z$/, 'Z');
const dateOnlyIcs = (value: Date) => value.toISOString().slice(0, 10).replaceAll('-', '');

export async function exportIcsService(userId: number) {
  const events = await prisma.event.findMany({
    where: { userId },
    include: { recurrenceDates: true, exclusionDates: true },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });
  const calendar = new ICAL.Component('vcalendar');
  calendar.addPropertyWithValue('version', '2.0');
  calendar.addPropertyWithValue('prodid', '-//Personal Dashboard//Calendar//EN');
  calendar.addPropertyWithValue('calscale', 'GREGORIAN');

  for (const event of events) {
    const component = new ICAL.Component('vevent');
    component.addPropertyWithValue('uid', event.externalUid || `event-${event.id}@personal-dashboard`);
    component.addPropertyWithValue('dtstamp', ICAL.Time.fromJSDate(event.updatedAt, true));
    component.addPropertyWithValue('summary', event.title);
    if (event.description) component.addPropertyWithValue('description', event.description);
    if (event.details && typeof event.details === 'object' && !Array.isArray(event.details))
      component.addPropertyWithValue(
        'x-personal-dashboard-details',
        JSON.stringify(event.details),
      );
    if (event.location) component.addPropertyWithValue('location', event.location);
    if (event.url) component.addPropertyWithValue('url', event.url);
    component.addPropertyWithValue('categories', event.category);
    if (event.status) component.addPropertyWithValue('status', event.status);
    if (event.sequence !== null) component.addPropertyWithValue('sequence', event.sequence);
    if (event.date) {
      component.addProperty(ICAL.Property.fromString(`DTSTART;VALUE=DATE:${dateOnlyIcs(event.date)}`));
    } else if (event.startTime) {
      component.addProperty(ICAL.Property.fromString(`DTSTART:${compactUtc(event.startTime)}`));
      if (event.endTime)
        component.addProperty(ICAL.Property.fromString(`DTEND:${compactUtc(event.endTime)}`));
    }
    const recurrenceRule =
      event.recurrenceRule ||
      (event.recurring
        ? [
            `FREQ=${event.recurring}`,
            event.numberOfRecurrences ? `COUNT=${event.numberOfRecurrences}` : null,
            event.recurrenceEndDate
              ? `UNTIL=${event.allDay ? dateOnlyIcs(event.recurrenceEndDate) : `${dateOnlyIcs(event.recurrenceEndDate)}T235959Z`}`
              : null,
          ]
            .filter(Boolean)
            .join(';')
        : null);
    if (recurrenceRule)
      component.addProperty(ICAL.Property.fromString(`RRULE:${recurrenceRule}`));
    for (const { value } of event.recurrenceDates)
      component.addProperty(ICAL.Property.fromString(`RDATE:${value}`));
    for (const { value } of event.exclusionDates)
      component.addProperty(ICAL.Property.fromString(`EXDATE:${value}`));
    calendar.addSubcomponent(component);
  }
  return calendar.toString();
}
