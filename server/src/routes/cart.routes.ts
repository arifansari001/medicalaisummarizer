import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getCart, addToCart, removeFromCart, clearCart } from '../controllers/cart.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getCart);
router.post('/add', addToCart);
router.post('/remove', removeFromCart);
router.post('/clear', clearCart);

export default router;
