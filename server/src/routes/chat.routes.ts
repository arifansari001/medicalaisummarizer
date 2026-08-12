import { Router } from 'express';
import { handleDiagnosisChat } from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/route', authenticate, handleDiagnosisChat);

export default router;
