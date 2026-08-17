import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { bookTest, getBookings, updateBookingStatus } from '../controllers/testBooking.controller.js';

const router = express.Router();

router.use(authenticate);

router.post('/', bookTest);
router.get('/', getBookings);
router.patch('/:id', updateBookingStatus);

export default router;
