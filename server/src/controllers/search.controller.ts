import { type Response } from 'express';
import { type AuthRequest } from '../middleware/auth.middleware.js';
import { Report } from '../models/Report.js';
import { MedicalEvent } from '../models/MedicalEvent.js';

export async function globalSearch(req: AuthRequest, res: Response) {
  const q = req.query.q as string;
  if (!q || !q.trim()) {
    res.json({ reports: [], events: [] });
    return;
  }

  const regex = new RegExp(q.trim(), 'i');

  const [reports, events] = await Promise.all([
    Report.find({
      userId: req.userId,
      $or: [
        { fileName: regex },
        { reportType: regex },
        { extractedText: regex },
      ],
    })
      .select('_id fileName reportType createdAt')
      .limit(10)
      .lean(),

    MedicalEvent.find({
      userId: req.userId,
      $or: [
        { title: regex },
        { type: regex },
        { description: regex },
        { symptoms: regex },
        { doctorName: regex },
        { hospitalName: regex },
      ],
    })
      .select('_id title type date')
      .limit(10)
      .lean(),
  ]);

  res.json({ reports, events });
}
