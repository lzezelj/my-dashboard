import type { Response } from 'express';
import { EventCategory } from '../generated/prisma/client.js';
import type { AuthenticatedRequest } from '../middleware/authenticationMiddleware.js';
import {
  createEventService,
  deleteEventService,
  deleteAllEventsService,
  deleteEventsService,
  exportEventsService,
  findImportDuplicatesService,
  getEventService,
  getEventOccurrencesService,
  getEventsService,
  importEventsService,
  updateEventService,
  updateOccurrenceService,
} from '../services/events.service.js';
import {
  exportIcsService,
  importIcsService,
  parseIcsService,
} from '../services/icalendar.service.js';
const eventId = (value: string) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};
const fail = (res: Response, error: unknown) =>
  res.status(error instanceof Error && error.name === 'ValidationError' ? 400 : 500).json({
    message:
      error instanceof Error && error.name === 'ValidationError'
        ? error.message
        : 'Unexpected event error',
  });
const getUserId = (req: AuthenticatedRequest, res: Response) => {
  if (req.userId === undefined) {
    res.status(401).json({ message: 'Authentication required' });
    return null;
  }

  return req.userId;
};

export async function getEvents(req: AuthenticatedRequest, res: Response) {
  const userId = getUserId(req, res);
  if (userId === null) return;

  try {
    const category =
      typeof req.query.category === 'string' ? (req.query.category as EventCategory) : undefined;
    if (category && !Object.values(EventCategory).includes(category))
      return res.status(400).json({ message: 'category is invalid.' });
    const filters: { category?: EventCategory; from?: string; to?: string } = {};
    if (category) filters.category = category;
    if (typeof req.query.from === 'string') filters.from = req.query.from;
    if (typeof req.query.to === 'string') filters.to = req.query.to;
    return res.json(await getEventsService(filters, userId));
  } catch (error) {
    return fail(res, error);
  }
}
export async function exportEvents(req: AuthenticatedRequest, res: Response) {
  const userId = getUserId(req, res);
  if (userId === null) return;
  try {
    res.setHeader('Content-Disposition', 'attachment; filename="dashboard-events.json"');
    return res.json(await exportEventsService(userId));
  } catch (error) {
    return fail(res, error);
  }
}
export async function exportIcs(req: AuthenticatedRequest, res: Response) {
  const userId = getUserId(req, res);
  if (userId === null) return;
  try {
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="dashboard-events.ics"');
    return res.send(await exportIcsService(userId));
  } catch (error) {
    return fail(res, error);
  }
}
export async function previewIcsImport(req: AuthenticatedRequest, res: Response) {
  if (getUserId(req, res) === null) return;
  try {
    return res.json({ events: parseIcsService(req.body?.ics) });
  } catch (error) {
    return fail(res, error);
  }
}
export async function importIcs(req: AuthenticatedRequest, res: Response) {
  const userId = getUserId(req, res);
  if (userId === null) return;
  if (!Array.isArray(req.body?.selectedIndexes))
    return res.status(400).json({ message: 'selectedIndexes must be an array.' });
  try {
    return res
      .status(201)
      .json(await importIcsService(req.body.ics, req.body.selectedIndexes, userId));
  } catch (error) {
    return fail(res, error);
  }
}
export async function checkImportDuplicates(req: AuthenticatedRequest, res: Response) {
  const userId = getUserId(req, res);
  if (userId === null) return;
  if (!Array.isArray(req.body.events))
    return res.status(400).json({ message: 'events must be an array.' });
  try {
    return res.json({ duplicates: await findImportDuplicatesService(req.body.events, userId) });
  } catch (error) {
    return fail(res, error);
  }
}

export async function importEvents(req: AuthenticatedRequest, res: Response) {
  const userId = getUserId(req, res);
  if (userId === null) return;
  if (!Array.isArray(req.body.events))
    return res.status(400).json({ message: 'events must be an array.' });
  try {
    return res.status(201).json(await importEventsService(req.body.events, userId));
  } catch (error) {
    return fail(res, error);
  }
}

export async function getEvent(req: AuthenticatedRequest, res: Response) {
  const userId = getUserId(req, res);
  if (userId === null) return;

  const id = eventId(typeof req.params.id === 'string' ? req.params.id : '');
  if (!id) return res.status(400).json({ message: 'Invalid event id.' });
  try {
    const event = await getEventService(id, userId);
    return event ? res.json(event) : res.status(404).json({ message: 'Event not found.' });
  } catch (error) {
    return fail(res, error);
  }
}
export async function getEventOccurrences(req: AuthenticatedRequest, res: Response) {
  const userId = getUserId(req, res);
  if (userId === null) return;
  const id = eventId(typeof req.params.id === 'string' ? req.params.id : '');
  if (!id) return res.status(400).json({ message: 'Invalid event id.' });
  try {
    const occurrences = await getEventOccurrencesService(id, userId);
    return occurrences
      ? res.json(occurrences)
      : res.status(404).json({ message: 'Event not found.' });
  } catch (error) {
    return fail(res, error);
  }
}
export async function createEvent(req: AuthenticatedRequest, res: Response) {
  const userId = getUserId(req, res);
  if (userId === null) return;

  try {
    return res.status(201).json(await createEventService(req.body, userId));
  } catch (error) {
    return fail(res, error);
  }
}
export async function updateEvent(req: AuthenticatedRequest, res: Response) {
  const userId = getUserId(req, res);
  if (userId === null) return;

  const id = eventId(typeof req.params.id === 'string' ? req.params.id : '');
  if (!id) return res.status(400).json({ message: 'Invalid event id.' });
  try {
    const event = await updateEventService(id, req.body, userId);
    return event ? res.json(event) : res.status(404).json({ message: 'Event not found.' });
  } catch (error) {
    return fail(res, error);
  }
}
export async function updateOccurrence(req: AuthenticatedRequest, res: Response) {
  const userId = getUserId(req, res);
  if (userId === null) return;
  const id = eventId(typeof req.params.id === 'string' ? req.params.id : '');
  const occurrence = typeof req.params.occurrenceDate === 'string' ? req.params.occurrenceDate : '';
  if (!id) return res.status(400).json({ message: 'Invalid event id.' });
  try {
    const event = await updateOccurrenceService(id, occurrence, req.body, userId);
    return event ? res.json(event) : res.status(404).json({ message: 'Event not found.' });
  } catch (error) {
    return fail(res, error);
  }
}
export async function deleteEvent(req: AuthenticatedRequest, res: Response) {
  const userId = getUserId(req, res);
  if (userId === null) return;

  const id = eventId(typeof req.params.id === 'string' ? req.params.id : '');
  if (!id) return res.status(400).json({ message: 'Invalid event id.' });
  try {
    return (await deleteEventService(id, userId))
      ? res.status(204).send()
      : res.status(404).json({ message: 'Event not found.' });
  } catch (error) {
    return fail(res, error);
  }
}
export async function deleteEvents(req: AuthenticatedRequest, res: Response) {
  const userId = getUserId(req, res);
  if (userId === null) return;
  try {
    return res.json(await deleteEventsService(req.body?.ids, userId));
  } catch (error) {
    return fail(res, error);
  }
}

export async function deleteAllEvents(req: AuthenticatedRequest, res: Response) {
  const userId = getUserId(req, res);
  if (userId === null) return;
  try {
    return res.json(await deleteAllEventsService(userId));
  } catch (error) {
    return fail(res, error);
  }
}
