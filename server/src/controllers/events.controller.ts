import { type Response } from 'express';
import { type AuthRequest } from '../middleware/auth.middleware.js';
import { MedicalEvent } from '../models/MedicalEvent.js';
import { createEventSchema, updateEventSchema } from '../utils/validators.js';

export async function createEvent(req: AuthRequest, res: Response) {
  const data = createEventSchema.parse(req.body);

  const event = await MedicalEvent.create({
    ...data,
    userId: req.userId,
    date: new Date(data.date),
  });

  res.status(201).json({ event });
}

export async function getEvents(req: AuthRequest, res: Response) {
  const { type, status, search, limit = '50', page = '1' } = req.query;

  const query: any = { userId: req.userId };
  if (type) query.type = type;
  if (status) query.status = status;
  if (search) {
    query.$text = { $search: search as string };
  }

  const limitNum = parseInt(limit as string, 10);
  const pageNum = parseInt(page as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const [events, total] = await Promise.all([
    MedicalEvent.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('attachedReports', 'fileName fileType reportType processingStatus createdAt')
      .lean(),
    MedicalEvent.countDocuments(query),
  ]);

  res.json({
    events,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  });
}

export async function getEventById(req: AuthRequest, res: Response) {
  const event = await MedicalEvent.findOne({ _id: req.params.id, userId: req.userId })
    .populate('attachedReports')
    .lean();

  if (!event) {
    res.status(404).json({ error: 'Medical event not found' });
    return;
  }

  res.json({ event });
}

export async function updateEvent(req: AuthRequest, res: Response) {
  const data = updateEventSchema.parse(req.body);

  const updateData: any = { ...data };
  if (data.date) {
    updateData.date = new Date(data.date);
  }

  const event = await MedicalEvent.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    updateData,
    { new: true, runValidators: true }
  ).populate('attachedReports');

  if (!event) {
    res.status(404).json({ error: 'Medical event not found' });
    return;
  }

  res.json({ event });
}

export async function deleteEvent(req: AuthRequest, res: Response) {
  const event = await MedicalEvent.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!event) {
    res.status(404).json({ error: 'Medical event not found' });
    return;
  }

  res.json({ message: 'Medical event deleted successfully' });
}
