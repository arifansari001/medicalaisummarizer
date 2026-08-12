import { Response } from 'express';
import Appointment from '../models/Appointment.js';
import { User } from '../models/User.js';
import { ShareRecord } from '../models/ShareRecord.js';
import { Report } from '../models/Report.js';
import { MedicalEvent } from '../models/MedicalEvent.js';
import crypto from 'crypto';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { doctorId, date, timeSlot, reason } = req.body;
    const patientId = req.userId;

    if (!patientId || !doctorId || !date || !timeSlot) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    const newAppointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      date,
      timeSlot,
      reason,
      status: 'confirmed',
    });

    await newAppointment.save();

    // Feature 7: Automate ShareRecord read access for booked appointments
    // Grant doctor 72 hours of access starting from the appointment date
    const reports = await Report.find({ userId: patientId }).select('_id');
    const events = await MedicalEvent.find({ userId: patientId }).select('_id');
    
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(date);
    expiresAt.setHours(expiresAt.getHours() + 72); // 72 hours after appointment

    const shareRecord = new ShareRecord({
      patientId,
      doctorId: doctor._id,
      doctorEmail: doctor.email,
      sharedReportIds: reports.map(r => r._id),
      sharedEventIds: events.map(e => e._id),
      accessToken: token,
      expiresAt,
    });
    
    await shareRecord.save();

    res.status(201).json({
      message: 'Appointment booked successfully.',
      appointment: newAppointment,
      shareRecord: {
        token: shareRecord.accessToken,
        expiresAt: shareRecord.expiresAt,
      }
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Failed to create appointment.' });
  }
};

export const getMyPatientAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const patientId = req.userId;
    const appointments = await Appointment.find({ patient: patientId })
      .populate('doctor', 'name email specialty clinicName location')
      .sort({ date: 1 });
    res.json({ appointments });
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({ message: 'Failed to fetch appointments.' });
  }
};

export const getMyDoctorAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const doctorId = req.userId;
    const appointments = await Appointment.find({ doctor: doctorId })
      .populate('patient', 'name email')
      .sort({ date: 1 });
    res.json({ appointments });
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ message: 'Failed to fetch appointments.' });
  }
};
