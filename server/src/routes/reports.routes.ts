import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { uploadMiddleware } from '../middleware/upload.middleware.js';
import {
  uploadReport,
  getReports,
  getReportById,
  deleteReport,
  triggerAnalysis,
  getAnalysis,
  correctAnalysis,
} from '../controllers/reports.controller.js';

const router = Router();

router.use(authenticate);

router.post('/upload', uploadMiddleware.single('file'), uploadReport);
router.get('/', getReports);
router.get('/:id', getReportById);
router.delete('/:id', deleteReport);
router.post('/:id/analyze', triggerAnalysis);
router.get('/:id/analysis', getAnalysis);
router.post('/:id/analysis/correct', requireRole('doctor'), correctAnalysis);

export default router;
