import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getTimeline,
} from '../controllers/events.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', createEvent);
router.get('/timeline', getTimeline);
router.get('/', getEvents);
router.get('/:id', getEventById);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;
