import type { Response } from 'express';
import { EventCategory } from '../generated/prisma/client.js';
import type { AuthenticatedRequest } from '../middleware/authenticationMiddleware.js';
import {
  createEventService,
  deleteEventService,
  getEventService,
  getEventsService,
  updateEventService,
} from '../services/events.service.js';
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
