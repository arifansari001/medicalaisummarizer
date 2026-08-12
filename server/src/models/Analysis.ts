import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const testResultSchema = new Schema({
  name: { type: String, required: true },
  value: { type: String, required: true },
  unit: { type: String, default: '' },
  referenceRange: { type: String, default: '' },
  status: { type: String, enum: ['normal', 'below_range', 'above_range', 'unknown'], default: 'unknown' },
  sourceDocumentId: { type: Schema.Types.ObjectId, ref: 'Report', default: null },
  sourcePage: { type: Number, default: null },
}, { _id: false });

const medicalTermSchema = new Schema({
  term: { type: String, required: true },
  explanation: { type: String, required: true },
}, { _id: false });

const findingSchema = new Schema({
  description: { type: String, required: true },
  sourceDocumentId: { type: Schema.Types.ObjectId, ref: 'Report', default: null },
  sourcePage: { type: Number, default: null },
}, { _id: false });

const analysisSchema = new Schema({
  reportId: { type: Schema.Types.ObjectId, ref: 'Report', required: true, unique: true },
  reportType: { type: String, default: '' },
  summary: { type: String, required: true },
  findings: [findingSchema],
  testResults: [testResultSchema],
  medicalTerms: [medicalTermSchema],
  doctorQuestions: [{ type: String }],
  diagnoses: [{ type: String }],
  preventionTips: [{ type: String }],
  dietaryAdvice: {
    eat: [{ type: String }],
    avoid: [{ type: String }],
    generalOnly: { type: Boolean, default: false },
    disclaimer: { type: String, default: '' }
  },
  modelUsed: { type: String, default: 'llama-3.3-70b-versatile' },
}, {
  timestamps: true,
});

analysisSchema.index({ reportId: 1 });

export type IAnalysis = InferSchemaType<typeof analysisSchema> & { _id: mongoose.Types.ObjectId };
export const Analysis = mongoose.model('Analysis', analysisSchema);
