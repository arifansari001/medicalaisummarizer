import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  role: z.enum(['patient', 'doctor']).optional().default('patient'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128),
});

export const createEventSchema = z.object({
  type: z.enum(['illness', 'injury', 'surgery', 'allergy', 'hospitalization', 'doctor_visit', 'vaccination', 'medical_test', 'medication', 'other']),
  title: z.string().min(1, 'Title is required').max(200),
  date: z.string().min(1, 'Date is required'),
  description: z.string().max(5000).optional().default(''),
  symptoms: z.array(z.string()).optional().default([]),
  treatment: z.string().max(2000).optional().default(''),
  doctorName: z.string().max(200).optional().default(''),
  hospitalName: z.string().max(200).optional().default(''),
  status: z.enum(['active', 'ongoing', 'recovered', 'resolved', 'chronic']).optional().default('active'),
  notes: z.string().max(5000).optional().default(''),
  attachedReports: z.array(z.string()).optional().default([]),
});

export const updateEventSchema = createEventSchema.partial();

export const createShareSchema = z.object({
  doctorEmail: z.string().email('Invalid email address'),
  sharedEventIds: z.array(z.string()).default([]),
  sharedReportIds: z.array(z.string()).default([]),
  expiresInHours: z.number().int().min(1).max(2160).optional(), // Max 90 days in hours // 1, 7, 30, etc. If missing, treat as indefinite/custom
});
