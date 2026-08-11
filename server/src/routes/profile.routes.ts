import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getProfile,
  updateProfile,
  changePassword,
  exportUserData,
  deleteAccount,
} from '../controllers/profile.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/password', changePassword);
router.get('/export', exportUserData);
router.delete('/', deleteAccount);

export default router;
