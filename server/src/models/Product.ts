import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  category: 'Skin Care' | 'Baby Care' | 'Sexual Wellness' | 'Ayurveda' | 'Multivitamins' | 'Prescription Medicines';
  price: number;
  mrp: number;
  description: string;
  isPrescriptionRequired: boolean;
  inStock: boolean;
  image: string;
}

const productSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    category: {
      type: String,
      enum: ['Skin Care', 'Baby Care', 'Sexual Wellness', 'Ayurveda', 'Multivitamins', 'Prescription Medicines'],
      required: true,
      index: true
    },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    description: { type: String, default: '' },
    isPrescriptionRequired: { type: Boolean, default: false },
    inStock: { type: Boolean, default: true },
    image: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<IProduct>('Product', productSchema);
