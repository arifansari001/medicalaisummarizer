// server/src/models/Summary.ts
import { Schema, model, Document } from 'mongoose';

export interface ISummary extends Document {
  originalText: string; // Full extracted medical report text
  summary: string; // AI‑generated plain‑language summary
  createdAt: Date;
  // Optional fields for future phases (e.g., user feedback, versioning)
  version?: number; // Increment for edited summaries
  feedbackScore?: number; // User‑provided rating (0‑5)
  tags?: string[]; // Keywords extracted from the report
}

const SummarySchema = new Schema<ISummary>(
  {
    originalText: { type: String, required: true },
    summary: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
    feedbackScore: { type: Number, min: 0, max: 5 },
    tags: [{ type: String }],
  },
  { collection: 'summaries' }
);

export const Summary = model<ISummary>('Summary', SummarySchema);
