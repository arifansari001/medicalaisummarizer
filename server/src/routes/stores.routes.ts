import { Router } from 'express';
import { getStores } from '../controllers/stores.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/', authenticate, getStores);

export default router;
