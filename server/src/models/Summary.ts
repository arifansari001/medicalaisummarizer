// server/src/models/Summary.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IBoundingBox {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IFinding {
  statement: string;
  originalValue?: string;
  referenceRange?: string;
  confidenceScore?: number;
  boundingBox?: IBoundingBox;
  disclaimer?: string;
  verifiedByDoctor?: boolean;
  correctedValue?: string;
}

export interface ISummary extends Document {
  originalText: string;
  summary: string;
  findings: IFinding[];
  createdAt: Date;
  version?: number;
  feedbackScore?: number;
  tags?: string[];
  carePathwaySuggestion?: {
    terminologies: { term: string; meaning: string }[];
    questionsForDoctor: string[];
    recommendedProviderTypes: string[];
  };
}

const FindingSchema = new Schema<IFinding>({
  statement: { type: String, required: true },
  originalValue: { type: String },
  referenceRange: { type: String },
  confidenceScore: { type: Number, min: 0, max: 100 },
  boundingBox: {
    page: { type: Number },
    x: { type: Number },
    y: { type: Number },
    width: { type: Number },
    height: { type: Number },
  },
  disclaimer: { type: String, default: "This is an explanation, not a diagnosis." },
  verifiedByDoctor: { type: Boolean, default: false },
  correctedValue: { type: String },
});

const SummarySchema = new Schema<ISummary>(
  {
    originalText: { type: String, required: true },
    summary: { type: String, required: true },
    findings: [FindingSchema],
    createdAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
    feedbackScore: { type: Number, min: 0, max: 5 },
    tags: [{ type: String }],
    carePathwaySuggestion: {
      terminologies: [{ term: String, meaning: String }],
      questionsForDoctor: [{ type: String }],
      recommendedProviderTypes: [{ type: String }],
    }
  },
  { collection: 'summaries' }
);

export const Summary = model<ISummary>('Summary', SummarySchema);
