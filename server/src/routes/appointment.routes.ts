import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createAppointment,
  getMyPatientAppointments,
  getMyDoctorAppointments,
} from '../controllers/appointment.controller.js';

const router = express.Router();

router.use(authenticate);

router.post('/', createAppointment);
router.get('/me', getMyPatientAppointments);
router.get('/doctor', getMyDoctorAppointments);

export default router;
