import mongoose, { Schema, type InferSchemaType } from 'mongoose';

// MOCK DATA MODEL — In production, replace with a real pharmacy/blood bank API integration
// (e.g., Google Places API for pharmacies, government blood bank registries)
const medicalStoreSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['pharmacy', 'blood_bank'], required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true },
  },
  phone: { type: String },
  openHours: { type: String },
  // For pharmacies: list of medicine names in stock (mock inventory)
  // In production, this would be a real-time inventory API
  medicineInventory: [{ type: String }],
  // For blood banks: available blood groups (mock)
  bloodGroups: [{ type: String }],
}, { timestamps: true });

export type IMedicalStore = InferSchemaType<typeof medicalStoreSchema> & { _id: mongoose.Types.ObjectId };
export const MedicalStore = mongoose.model('MedicalStore', medicalStoreSchema);
