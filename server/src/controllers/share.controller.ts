import { type Response, type Request } from 'express';
import crypto from 'crypto';
import { ShareRecord } from '../models/ShareRecord.js';
import { User } from '../models/User.js';
import { MedicalEvent } from '../models/MedicalEvent.js';
import { Report } from '../models/Report.js';
import { Analysis } from '../models/Analysis.js';
import { createShareSchema } from '../utils/validators.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { sendShareEmail } from '../services/email.service.js';

export async function createShare(req: AuthRequest, res: Response) {
  const patientId = req.userId;
  const data = createShareSchema.parse(req.body);

  // Verify that the patient owns all shared events and reports
  if (data.sharedEventIds.length > 0) {
    const eventsCount = await MedicalEvent.countDocuments({
      _id: { $in: data.sharedEventIds },
      userId: patientId,
    });
    if (eventsCount !== data.sharedEventIds.length) {
      res.status(403).json({ error: 'You do not own all of the selected medical events' });
      return;
    }
  }

  if (data.sharedReportIds.length > 0) {
    const reportsCount = await Report.countDocuments({
      _id: { $in: data.sharedReportIds },
      userId: patientId,
    });
    if (reportsCount !== data.sharedReportIds.length) {
      res.status(403).json({ error: 'You do not own all of the selected reports' });
      return;
    }
  }

  // Find doctor by email (case-insensitive)
  const doctor = await User.findOne({ email: data.doctorEmail.toLowerCase(), role: 'doctor' });
  const doctorId = doctor ? doctor._id : null;

  // Calculate expiration date (default to 720 hours / 30 days if not provided)
  const hours = data.expiresInHours || 720;
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + hours);

  const accessToken = crypto.randomBytes(32).toString('hex');

  const share = await ShareRecord.create({
    patientId,
    doctorEmail: data.doctorEmail.toLowerCase(),
    doctorId,
    sharedEventIds: data.sharedEventIds,
    sharedReportIds: data.sharedReportIds,
    accessToken,
    expiresAt,
  });

  // Send email notification to the doctor with the share link
  const patient = await User.findById(patientId).select('name');
  const patientName = patient?.name || 'A patient';

  // Build share link — prefer the explicitly set APP_BASE_URL if it's not a local dev URL
  const configuredBase = process.env.APP_BASE_URL || '';
  const isLocal = configuredBase.includes('localhost') || configuredBase.includes('127.0.0.1');
  const appBase = (configuredBase && !isLocal)
    ? configuredBase.replace(/\/$/, '')
    : (process.env.FRONTEND_URL || 'https://medicalaisummarizer.vercel.app');
  const shareLink = `${appBase}/shared/${accessToken}`;

  // Send email in the background to prevent blocking the HTTP response
  sendShareEmail({
    toEmail: data.doctorEmail,
    patientName,
    shareLink,
    expiresAt,
  }).catch((emailErr) => {
    console.error('⚠️ Email sending failed (share still created):', emailErr);
  });

  res.status(201).json({ share });
}

export async function getPatientShares(req: AuthRequest, res: Response) {
  const patientId = req.userId;

  const shares = await ShareRecord.find({ patientId })
    .populate('doctorId', 'name email profileImage')
    .sort({ createdAt: -1 });

  res.json({ shares });
}

export async function revokeShare(req: AuthRequest, res: Response) {
  const patientId = req.userId;
  const { id } = req.params;

  const share = await ShareRecord.findOne({ _id: id, patientId });
  if (!share) {
    res.status(404).json({ error: 'Share record not found' });
    return;
  }

  share.revokedAt = new Date();
  await share.save();

  res.json({ message: 'Share access revoked successfully', share });
}

export async function getDoctorShares(req: AuthRequest, res: Response) {
  const doctorId = req.userId;
  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== 'doctor') {
    res.status(403).json({ error: 'Access denied. Doctor account required.' });
    return;
  }

  // Find by doctorEmail OR doctorId
  const shares = await ShareRecord.find({
    $or: [
      { doctorEmail: doctor.email.toLowerCase() },
      { doctorId: doctor._id }
    ],
    expiresAt: { $gt: new Date() },
    revokedAt: null,
  })
    .populate('patientId', 'name email dateOfBirth gender')
    .sort({ createdAt: -1 });

  res.json({ shares });
}

export async function getDoctorSharedRecord(req: AuthRequest, res: Response) {
  const doctorId = req.userId;
  const { id } = req.params; // ShareRecord ID

  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== 'doctor') {
    res.status(403).json({ error: 'Access denied. Doctor account required.' });
    return;
  }

  // Find share record
  const share = await ShareRecord.findOne({
    _id: id,
    $or: [
      { doctorEmail: doctor.email.toLowerCase() },
      { doctorId: doctor._id }
    ],
  }).populate('patientId', 'name email dateOfBirth gender');

  if (!share) {
    res.status(404).json({ error: 'Shared record not found or access expired' });
    return;
  }

  // Verify not expired or revoked
  if (share.expiresAt < new Date() || share.revokedAt !== null) {
    res.status(403).json({ error: 'Access to this shared record has expired or was revoked by the patient' });
    return;
  }

  // If doctorId was not set (doctor signed up after the share was created), set it now
  if (!share.doctorId) {
    share.doctorId = doctor._id;
    await share.save();
  }

  // Fetch the shared medical events and reports
  const events = await MedicalEvent.find({
    _id: { $in: share.sharedEventIds },
    userId: share.patientId,
  }).sort({ date: -1 });

  const reports = await Report.find({
    _id: { $in: share.sharedReportIds },
    userId: share.patientId,
  }).sort({ createdAt: -1 });

  // Fetch analyses for these reports
  const analyses = await Analysis.find({
    reportId: { $in: share.sharedReportIds },
  });

  res.json({
    share,
    patient: share.patientId,
    events,
    reports,
    analyses,
  });
}

export async function getPublicShare(req: Request, res: Response) {
  const { token } = req.params;

  const share = await ShareRecord.findOne({ accessToken: token });
  if (!share) {
    res.status(404).json({ error: 'Share link is invalid or has expired' });
    return;
  }

  if (share.expiresAt < new Date() || share.revokedAt !== null) {
    res.status(403).json({ error: 'This share link has expired or was revoked' });
    return;
  }

  const reports = await Report.find({ _id: { $in: share.sharedReportIds } }).lean();
  const analyses = await Analysis.find({ reportId: { $in: share.sharedReportIds } }).lean();

  const formattedReports = reports.map(r => {
    const analysis = analyses.find(a => String(a.reportId) === String(r._id));
    return {
      _id: r._id,
      title: r.fileName,
      createdAt: r.createdAt,
      aiSummary: analysis ? analysis.summary : 'No summary available',
      originalFileUrl: `/uploads/${r.userId}/${r.filePath.split(/[\\/]/).pop()}`,
    };
  });

  res.json({
    expiresAt: share.expiresAt,
    reports: formattedReports,
  });
}
