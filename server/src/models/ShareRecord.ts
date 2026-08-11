import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const shareRecordSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctorEmail: { type: String, required: true, lowercase: true, trim: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  sharedEventIds: [{ type: Schema.Types.ObjectId, ref: 'MedicalEvent' }],
  sharedReportIds: [{ type: Schema.Types.ObjectId, ref: 'Report' }],
  accessToken: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },
}, {
  timestamps: true,
});

shareRecordSchema.index({ doctorEmail: 1, expiresAt: 1 });
shareRecordSchema.index({ patientId: 1, createdAt: -1 });

export type IShareRecord = InferSchemaType<typeof shareRecordSchema> & { _id: mongoose.Types.ObjectId };
export const ShareRecord = mongoose.model('ShareRecord', shareRecordSchema);
