import { Router } from 'express';
import {
  createEvent,
  deleteEvent,
  getEvent,
  getEvents,
  updateEvent,
} from '../controllers/events.controller.js';
import { authMiddleware } from '../middleware/authenticationMiddleware.js';
const router = Router();
router.use(authMiddleware);
router.get('/', getEvents);
router.get('/:id', getEvent);
router.post('/', createEvent);
router.patch('/:id', updateEvent);
router.delete('/:id', deleteEvent);
export default router;
