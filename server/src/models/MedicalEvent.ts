import mongoose, { Schema, type InferSchemaType } from 'mongoose';

export const EVENT_TYPES = [
  'illness', 'injury', 'surgery', 'allergy', 'hospitalization',
  'doctor_visit', 'vaccination', 'medical_test', 'medication', 'other'
] as const;

export const EVENT_STATUSES = [
  'active', 'ongoing', 'recovered', 'resolved', 'chronic'
] as const;

const medicalEventSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: EVENT_TYPES, required: true },
  title: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  description: { type: String, trim: true },
  symptoms: [{ type: String, trim: true }],
  treatment: { type: String, trim: true },
  doctorName: { type: String, trim: true },
  hospitalName: { type: String, trim: true },
  status: { type: String, enum: EVENT_STATUSES, default: 'active' },
  notes: { type: String, trim: true },
  attachedReports: [{ type: Schema.Types.ObjectId, ref: 'Report' }],
}, {
  timestamps: true,
});

medicalEventSchema.index({ userId: 1, date: -1 });
medicalEventSchema.index({ userId: 1, type: 1 });
medicalEventSchema.index({ title: 'text', description: 'text', notes: 'text' });

export type IMedicalEvent = InferSchemaType<typeof medicalEventSchema> & { _id: mongoose.Types.ObjectId };
export const MedicalEvent = mongoose.model('MedicalEvent', medicalEventSchema);
