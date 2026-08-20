import { type Response } from 'express';
import { type AuthRequest } from '../middleware/auth.middleware.js';
import { Report } from '../models/Report.js';
import { Analysis } from '../models/Analysis.js';
import { MedicalEvent } from '../models/MedicalEvent.js';
import { storageService } from '../services/storage.service.js';
import { processReportPipeline } from '../services/pipeline.service.js';

export async function uploadReport(req: AuthRequest, res: Response) {
  if (!req.file) {
    res.status(400).json({ error: 'No file provided' });
    return;
  }

  const { eventId } = req.body;

  // Verify event belongs to user if provided
  if (eventId) {
    const event = await MedicalEvent.findOne({ _id: eventId, userId: req.userId });
    if (!event) {
      res.status(404).json({ error: 'Medical event not found' });
      return;
    }
  }

  // Save file locally
  const savedFile = await storageService.saveFile(
    req.userId!,
    req.file.originalname,
    req.file.buffer
  );

  // Create database report record
  const report = await Report.create({
    userId: req.userId,
    eventId: eventId || null,
    fileName: req.file.originalname,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
    filePath: savedFile.filePath,
    processingStatus: 'uploaded',
  });

  // Attach report to MedicalEvent if eventId was specified
  if (eventId) {
    await MedicalEvent.findByIdAndUpdate(eventId, {
      $addToSet: { attachedReports: report._id },
    });
  }

  // Trigger background extraction & AI pipeline
  processReportPipeline(report._id.toString()).catch(err => {
    console.error(`Background pipeline failed for ${report._id}:`, err);
  });

  res.status(202).json({
    message: 'Report uploaded and processing started',
    report,
  });
}

export async function getReports(req: AuthRequest, res: Response) {
  const { eventId, status, search, limit = '50', page = '1' } = req.query;

  const query: any = { userId: req.userId };
  if (eventId) query.eventId = eventId;
  if (status) query.processingStatus = status;
  if (search) {
    query.$text = { $search: search as string };
  }

  const limitNum = parseInt(limit as string, 10);
  const pageNum = parseInt(page as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const [reports, total] = await Promise.all([
    Report.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Report.countDocuments(query),
  ]);

  res.json({
    reports,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  });
}

export async function getReportById(req: AuthRequest, res: Response) {
  const report = await Report.findOne({ _id: req.params.id, userId: req.userId });
  if (!report) {
    res.status(404).json({ error: 'Report not found' });
    return;
  }

  const analysis = await Analysis.findOne({ reportId: report._id }).lean();

  res.json({
    report,
    analysis: analysis || null,
  });
}

export async function deleteReport(req: AuthRequest, res: Response) {
  const report = await Report.findOne({ _id: req.params.id, userId: req.userId });
  if (!report) {
    res.status(404).json({ error: 'Report not found' });
    return;
  }

  // Delete physical file
  await storageService.deleteFile(report.filePath);

  // Delete analysis
  await Analysis.deleteOne({ reportId: report._id });

  // Remove reference from medical events
  await MedicalEvent.updateMany(
    { attachedReports: report._id },
    { $pull: { attachedReports: report._id } }
  );

  // Delete report document
  await Report.deleteOne({ _id: report._id });

  res.json({ message: 'Report deleted successfully' });
}

export async function triggerAnalysis(req: AuthRequest, res: Response) {
  const report = await Report.findOne({ _id: req.params.id, userId: req.userId });
  if (!report) {
    res.status(404).json({ error: 'Report not found' });
    return;
  }

  processReportPipeline(report._id.toString()).catch(err => {
    console.error(`Re-analysis trigger failed for ${report._id}:`, err);
  });

  res.status(202).json({ message: 'Analysis triggered' });
}

export async function getAnalysis(req: AuthRequest, res: Response) {
  const report = await Report.findOne({ _id: req.params.id, userId: req.userId });
  if (!report) {
    res.status(404).json({ error: 'Report not found' });
    return;
  }

  const analysis = await Analysis.findOne({ reportId: report._id });
  if (!analysis) {
    res.status(404).json({ error: 'Analysis not found or still processing' });
    return;
  }

  res.json({ analysis });
}

export async function correctAnalysis(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { type, index, correctedValue } = req.body;

  const analysis = await Analysis.findOne({ reportId: id });
  if (!analysis) {
    res.status(404).json({ error: 'Analysis not found' });
    return;
  }

  if (type === 'finding') {
    if (analysis.findings && analysis.findings[index]) {
      analysis.findings[index].verifiedByDoctor = true;
      analysis.findings[index].correctedValue = correctedValue;
    }
  } else if (type === 'testResult') {
    if (analysis.testResults && analysis.testResults[index]) {
      analysis.testResults[index].verifiedByDoctor = true;
      analysis.testResults[index].correctedValue = correctedValue;
    }
  }

  await analysis.save();
  res.json({ message: 'Clinician verification saved', analysis });
}

