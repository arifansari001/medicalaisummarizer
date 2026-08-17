import { Response } from 'express';
import { type AuthRequest } from '../middleware/auth.middleware.js';
import TestBooking from '../models/TestBooking.js';

export const bookTest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { centerId, testName, price, scheduledDate, sampleCollection } = req.body;

    if (!centerId || !testName || !price || !scheduledDate || !sampleCollection) {
      return res.status(400).json({ message: 'All booking fields are required.' });
    }

    const booking = await TestBooking.create({
      userId,
      centerId,
      testName,
      price,
      scheduledDate,
      sampleCollection,
      status: 'pending'
    });

    res.status(201).json({ success: true, booking });
  } catch (error) {
    console.error('bookTest error:', error);
    res.status(500).json({ message: 'Failed to book test.' });
  }
};

export const getBookings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const bookings = await TestBooking.find({ userId })
      .populate('centerId')
      .sort({ scheduledDate: -1 })
      .lean();

    res.json({ bookings });
  } catch (error) {
    console.error('getBookings error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings.' });
  }
};

export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'collected', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Valid status required.' });
    }

    const booking = await TestBooking.findOne({ _id: id, userId });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    booking.status = status;
    await booking.save();

    res.json({ success: true, booking });
  } catch (error) {
    console.error('updateBookingStatus error:', error);
    res.status(500).json({ message: 'Failed to update booking.' });
  }
};
