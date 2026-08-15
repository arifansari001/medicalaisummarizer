import mongoose, { Schema, type InferSchemaType } from 'mongoose';

/**
 * ChatLog model — persists every AI health conversation exchange
 * so doctors can review what the bot told their patients.
 *
 * In production: this data would be encrypted at rest and access-controlled
 * so only the patient's assigned doctor(s) can view it.
 */
const chatLogSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // The patient's message
  patientMessage: { type: String, required: true },

  // The bot's text response
  botResponse: { type: String, required: true },

  // Structured fields returned by the AI
  certaintyLevel: {
    type: String,
    enum: ['well_established', 'worth_confirming', 'seek_professional', 'emergency', null],
    default: null,
  },
  suggestedSpecialty: { type: String, default: null },
  queryType: {
    type: String,
    enum: ['medicine', 'bloodbank', 'test', 'general', 'none', 'emergency'],
    default: 'none',
  },
  isEmergency: { type: Boolean, default: false },

  // Whether an image/file was attached by the patient
  hasAttachment: { type: Boolean, default: false },

  // Doctor review — doctors can mark any bot response as confirmed or flagged
  doctorReview: {
    status: { type: String, enum: ['confirmed', 'flagged'], default: null },
    note: { type: String, default: null },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
}, { timestamps: true });

export type IChatLog = InferSchemaType<typeof chatLogSchema> & { _id: mongoose.Types.ObjectId };
export const ChatLog = mongoose.model('ChatLog', chatLogSchema);
