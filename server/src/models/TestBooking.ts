import mongoose, { Schema, Document } from 'mongoose';

export interface ITestBooking extends Document {
  userId: mongoose.Types.ObjectId;
  centerId: mongoose.Types.ObjectId;
  testName: string;
  price: number;
  scheduledDate: Date;
  sampleCollection: 'home' | 'lab_visit';
  status: 'pending' | 'collected' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const testBookingSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    centerId: {
      type: Schema.Types.ObjectId,
      ref: 'MedicalStore',
      required: true
    },
    testName: {
      type: String,
      required: true,
      index: true
    },
    price: {
      type: Number,
      required: true
    },
    scheduledDate: {
      type: Date,
      required: true
    },
    sampleCollection: {
      type: String,
      enum: ['home', 'lab_visit'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'collected', 'completed', 'cancelled'],
      default: 'pending',
      index: true
    }
  },
  { timestamps: true }
);

export default mongoose.model<ITestBooking>('TestBooking', testBookingSchema);
