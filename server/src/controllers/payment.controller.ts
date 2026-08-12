import { Request, Response } from 'express';
import Appointment from '../models/Appointment.js';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    
    // Simulate generating a Razorpay Order ID
    const orderId = 'order_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    
    res.json({
      orderId,
      amount,
      currency: 'INR'
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ message: 'Failed to create payment order.' });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { appointmentId, paymentId, orderId } = req.body;
    
    // In a real integration, we would verify the Razorpay signature here using the secret key
    // Since this is a test mode mock, we assume success if paymentId is provided
    
    if (!paymentId) {
      return res.status(400).json({ message: 'Payment ID is required.' });
    }

    // Update appointment status to paid
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    appointment.paymentStatus = 'paid';
    await appointment.save();

    res.json({ success: true, message: 'Payment verified successfully.' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Failed to verify payment.' });
  }
};
