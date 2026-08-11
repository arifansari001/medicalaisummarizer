import { type Response } from 'express';
import bcrypt from 'bcryptjs';
import { type AuthRequest } from '../middleware/auth.middleware.js';
import { User } from '../models/User.js';
import { MedicalEvent } from '../models/MedicalEvent.js';
import { Report } from '../models/Report.js';
import { Analysis } from '../models/Analysis.js';
import { storageService } from '../services/storage.service.js';
import { updateProfileSchema, changePasswordSchema } from '../utils/validators.js';

export async function getProfile(req: AuthRequest, res: Response) {
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user: user.toJSON() });
}

export async function updateProfile(req: AuthRequest, res: Response) {
  const data = updateProfileSchema.parse(req.body);

  const updateObj: any = {};
  if (data.name) updateObj.name = data.name;
  if (data.gender) updateObj.gender = data.gender;
  if (data.dateOfBirth) updateObj.dateOfBirth = new Date(data.dateOfBirth);

  const user = await User.findByIdAndUpdate(req.userId, updateObj, { new: true });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ user: user.toJSON() });
}

export async function changePassword(req: AuthRequest, res: Response) {
  const data = changePasswordSchema.parse(req.body);

  const user = await User.findById(req.userId).select('+passwordHash');
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const isMatch = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!isMatch) {
    res.status(400).json({ error: 'Current password is incorrect' });
    return;
  }

  user.passwordHash = await bcrypt.hash(data.newPassword, 12);
  await user.save();

  res.json({ message: 'Password updated successfully' });
}

export async function exportUserData(req: AuthRequest, res: Response) {
  const [user, events, reports] = await Promise.all([
    User.findById(req.userId).lean(),
    MedicalEvent.find({ userId: req.userId }).lean(),
    Report.find({ userId: req.userId }).lean(),
  ]);

  const reportIds = reports.map(r => r._id);
  const analyses = await Analysis.find({ reportId: { $in: reportIds } }).lean();

  res.json({
    exportDate: new Date().toISOString(),
    user,
    medicalEvents: events,
    reports,
    analyses,
  });
}

export async function deleteAccount(req: AuthRequest, res: Response) {
  const reports = await Report.find({ userId: req.userId });

  // Delete all physical files
  for (const report of reports) {
    try {
      await storageService.deleteFile(report.filePath);
    } catch (err) {
      console.warn(`Failed to delete physical file for report ${report._id}:`, err);
    }
    await Analysis.deleteOne({ reportId: report._id });
  }

  await Report.deleteMany({ userId: req.userId });
  await MedicalEvent.deleteMany({ userId: req.userId });
  await User.deleteOne({ _id: req.userId });

  res.json({ message: 'Account and all associated health records deleted permanently' });
}
