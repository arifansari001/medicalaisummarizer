import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { uploadMiddleware } from '../middleware/upload.middleware.js';
import {
  handleChatMessage,
  handleDiagnosisChat,
  getPatientChatLogs,
  reviewChatLog,
} from '../controllers/chat.controller.js';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

// Main conversational message endpoint (Section 2)
// Accepts multipart/form-data with optional image attachment
router.post('/message', uploadMiddleware.single('image'), handleChatMessage);

// Doctor: view a patient's health-related chat exchanges (Section 5)
router.get('/logs/:patientId', getPatientChatLogs);

// Doctor: mark a bot response as confirmed or flagged (Section 5)
router.patch('/logs/:logId/review', reviewChatLog);

// Legacy endpoint — kept for ChatbotModal.tsx backwards compatibility
router.post('/route', handleDiagnosisChat);

export default router;
