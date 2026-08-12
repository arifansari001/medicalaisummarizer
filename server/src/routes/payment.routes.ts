import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { createOrder, verifyPayment } from '../controllers/payment.controller.js';

const router = express.Router();

router.use(authenticate);

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);

export default router;
