import { Response } from 'express';
import { type AuthRequest } from '../middleware/auth.middleware.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

export const placeOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { deliveryAddress, deliveryMethod, paymentStatus, prescriptionReportId } = req.body;

    if (!deliveryAddress) {
      return res.status(400).json({ message: 'Delivery address is required.' });
    }

    const cart = await Cart.findOne({ userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Your shopping cart is empty.' });
    }

    // Check if any product requires a prescription
    let requiresPrescription = false;
    for (const item of cart.items) {
      const prod = item.product as any;
      if (prod.isPrescriptionRequired) {
        requiresPrescription = true;
        break;
      }
    }

    if (requiresPrescription && !prescriptionReportId) {
      return res.status(400).json({ 
        message: 'Prescription is required for some items in your cart. Please link one of your uploaded reports.' 
      });
    }

    const orderItems = cart.items.map(item => {
      const prod = item.product as any;
      return {
        product: prod._id,
        quantity: item.quantity,
        priceAtOrder: prod.price
      };
    });

    const totalAmount = cart.items.reduce((sum, item) => {
      const prod = item.product as any;
      return sum + (prod.price * item.quantity);
    }, 0);

    const order = await Order.create({
      userId,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      deliveryMethod: deliveryMethod || 'standard',
      paymentStatus: paymentStatus || 'cod',
      orderStatus: 'placed',
      prescriptionReportId: prescriptionReportId || null
    });

    // Clear user's cart
    cart.items = [];
    await cart.save();

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error('placeOrder error:', error);
    res.status(500).json({ message: 'Failed to place order.' });
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const orders = await Order.find({ userId })
      .populate('items.product')
      .populate('prescriptionReportId')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ orders });
  } catch (error) {
    console.error('getOrders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders.' });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const order = await Order.findOne({ _id: id, userId })
      .populate('items.product')
      .populate('prescriptionReportId')
      .lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.json({ order });
  } catch (error) {
    console.error('getOrderById error:', error);
    res.status(500).json({ message: 'Failed to fetch order details.' });
  }
};
