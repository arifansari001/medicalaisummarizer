import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  priceAtOrder: number;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  deliveryMethod: 'standard' | 'express_19min';
  paymentStatus: 'pending' | 'paid' | 'cod';
  orderStatus: 'placed' | 'packing' | 'out_for_delivery' | 'delivered';
  prescriptionReportId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        priceAtOrder: {
          type: Number,
          required: true
        }
      }
    ],
    totalAmount: {
      type: Number,
      required: true
    },
    deliveryAddress: {
      type: String,
      required: true
    },
    deliveryMethod: {
      type: String,
      enum: ['standard', 'express_19min'],
      default: 'standard'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'cod'],
      default: 'cod'
    },
    orderStatus: {
      type: String,
      enum: ['placed', 'packing', 'out_for_delivery', 'delivered'],
      default: 'placed',
      index: true
    },
    prescriptionReportId: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>('Order', orderSchema);
