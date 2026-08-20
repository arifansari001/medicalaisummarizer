import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const boundingBoxSchema = new Schema({
  page: { type: Number },
  x: { type: Number },
  y: { type: Number },
  width: { type: Number },
  height: { type: Number },
  confidenceScore: { type: Number, min: 0, max: 100 }
}, { _id: false });

const testResultSchema = new Schema({
  name: { type: String, required: true },
  value: { type: String, required: true },
  unit: { type: String, default: '' },
  referenceRange: { type: String, default: '' },
  status: { type: String, enum: ['normal', 'below_range', 'above_range', 'unknown'], default: 'unknown' },
  sourceDocumentId: { type: Schema.Types.ObjectId, ref: 'Report', default: null },
  sourcePage: { type: Number, default: null },
  boundingBox: boundingBoxSchema,
  verifiedByDoctor: { type: Boolean, default: false },
  correctedValue: { type: String }
}, { _id: false });

const medicalTermSchema = new Schema({
  term: { type: String, required: true },
  explanation: { type: String, required: true },
}, { _id: false });

const findingSchema = new Schema({
  description: { type: String, required: true },
  sourceDocumentId: { type: Schema.Types.ObjectId, ref: 'Report', default: null },
  sourcePage: { type: Number, default: null },
  boundingBox: boundingBoxSchema,
  verifiedByDoctor: { type: Boolean, default: false },
  correctedValue: { type: String }
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
    disclaimer: { type: String, default: 'This is an explanation, not a diagnosis.' }
  },
  carePathwaySuggestion: {
    recommendedProviderTypes: [{ type: String }],
    nextSteps: [{ type: String }]
  },
  modelUsed: { type: String, default: 'gemini-2.5-flash' },
}, {
  timestamps: true,
});

analysisSchema.index({ reportId: 1 });

export type IAnalysis = InferSchemaType<typeof analysisSchema> & { _id: mongoose.Types.ObjectId };
export const Analysis = mongoose.model('Analysis', analysisSchema);
