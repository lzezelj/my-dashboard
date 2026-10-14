import { Router } from 'express';
import {
  createEvent,
  checkImportDuplicates,
  deleteEvent,
  exportEvents,
  getEvent,
  getEventOccurrences,
  getEvents,
  importEvents,
  updateEvent,
  updateOccurrence,
} from '../controllers/events.controller.js';
import { authMiddleware } from '../middleware/authenticationMiddleware.js';
const router = Router();
router.use(authMiddleware);
router.get('/', getEvents);
router.get('/export', exportEvents);
router.post('/import/duplicates', checkImportDuplicates);
router.post('/import', importEvents);
router.get('/:id', getEvent);
router.get('/:id/occurrences', getEventOccurrences);
router.post('/', createEvent);
router.patch('/:id/occurrences/:occurrenceDate', updateOccurrence);
router.patch('/:id', updateEvent);
router.delete('/:id', deleteEvent);
export default router;
