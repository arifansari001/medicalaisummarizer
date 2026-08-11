import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import {
  createShare,
  getPatientShares,
  revokeShare,
  getDoctorShares,
  getDoctorSharedRecord,
  getPublicShare,
} from '../controllers/share.controller.js';

const router = Router();

router.get('/public/:token', getPublicShare);

router.use(authenticate);

router.post('/', requireRole('patient'), createShare);
router.get('/patient', requireRole('patient'), getPatientShares);
router.delete('/:id', requireRole('patient'), revokeShare);
router.get('/doctor', requireRole('doctor'), getDoctorShares);
router.get('/doctor/:id', requireRole('doctor'), getDoctorSharedRecord);

export default router;
