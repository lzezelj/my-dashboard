import { Router } from 'express';
import {
  createEvent,
  checkImportDuplicates,
  deleteEvent,
  deleteAllEvents,
  deleteEvents,
  exportEvents,
  exportIcs,
  getEvent,
  getEventOccurrences,
  getEvents,
  importEvents,
  importIcs,
  previewIcsImport,
  updateEvent,
  updateOccurrence,
} from '../controllers/events.controller.js';
import { authMiddleware } from '../middleware/authenticationMiddleware.js';
const router = Router();
router.use(authMiddleware);
router.get('/', getEvents);
router.get('/export', exportEvents);
router.get('/export/ics', exportIcs);
router.post('/import/duplicates', checkImportDuplicates);
router.post('/import/ics/preview', previewIcsImport);
router.post('/import/ics', importIcs);
router.post('/import', importEvents);
router.delete('/bulk', deleteEvents);
router.delete('/all', deleteAllEvents);
router.get('/:id', getEvent);
router.get('/:id/occurrences', getEventOccurrences);
router.post('/', createEvent);
router.patch('/:id/occurrences/:occurrenceDate', updateOccurrence);
router.patch('/:id', updateEvent);
router.delete('/:id', deleteEvent);
export default router;
