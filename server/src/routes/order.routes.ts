import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { placeOrder, getOrders, getOrderById } from '../controllers/order.controller.js';

const router = express.Router();

router.use(authenticate);

router.post('/', placeOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);

export default router;
