import mongoose, { Schema, type InferSchemaType } from 'mongoose';

export const PROCESSING_STATUSES = [
  'uploaded', 'extracting', 'analyzing', 'completed', 'failed'
] as const;

const reportSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  eventId: { type: Schema.Types.ObjectId, ref: 'MedicalEvent', default: null },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  filePath: { type: String, required: true },
  extractedText: { type: String, default: '' },
  reportType: { type: String, default: '' },
  processingStatus: { type: String, enum: PROCESSING_STATUSES, default: 'uploaded' },
  processingError: { type: String },
  metadata: {
    date: { type: String },
    location: { type: String },
    hospitalName: { type: String },
    doctorName: { type: String },
    contactDetails: { type: String },
    patientName: { type: String },
    appointmentTime: { type: String },
  },
}, {
  timestamps: true,
});

reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ fileName: 'text', extractedText: 'text' });

export type IReport = InferSchemaType<typeof reportSchema> & { _id: mongoose.Types.ObjectId };
export const Report = mongoose.model('Report', reportSchema);
