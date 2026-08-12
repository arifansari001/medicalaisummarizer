import { Router } from 'express';
import { getDoctors } from '../controllers/doctors.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, getDoctors);

export default router;
