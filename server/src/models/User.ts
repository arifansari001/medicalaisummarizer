import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
  profileImage: { type: String },
  role: { type: String, enum: ['patient', 'doctor'], default: 'patient' },
  // Doctor-specific fields
  specialty: { type: String },
  consultationFee: { type: Number },
  rating: { type: Number },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String }
  },
  clinicName: { type: String },
  opdSchedule: [{
    day: { type: String },
    startTime: { type: String },
    endTime: { type: String },
    avgWaitMinutes: { type: Number }
  }]
}, {
  timestamps: true,
});

userSchema.index({ email: 1 });

// Never return passwordHash in JSON
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const user = ret as Record<string, any>;
    delete user.passwordHash;
    delete user.__v;
    return user;
  },
});

export type IUser = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };
export const User = mongoose.model('User', userSchema);
