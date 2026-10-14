import { Router } from 'express';
import {
  createEvent,
  deleteEvent,
  getEvent,
  getEventOccurrences,
  getEvents,
  updateEvent,
  updateOccurrence,
} from '../controllers/events.controller.js';
import { authMiddleware } from '../middleware/authenticationMiddleware.js';
const router = Router();
router.use(authMiddleware);
router.get('/', getEvents);
router.get('/:id', getEvent);
router.get('/:id/occurrences', getEventOccurrences);
router.post('/', createEvent);
router.patch('/:id/occurrences/:occurrenceDate', updateOccurrence);
router.patch('/:id', updateEvent);
router.delete('/:id', deleteEvent);
export default router;
