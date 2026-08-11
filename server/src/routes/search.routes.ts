import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { globalSearch } from '../controllers/search.controller.js';

const router = Router();

router.use(authenticate);
router.get('/', globalSearch);

export default router;
