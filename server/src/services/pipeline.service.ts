import { Report } from '../models/Report.js';
import { Analysis } from '../models/Analysis.js';
import { MedicalEvent } from '../models/MedicalEvent.js';
import { storageService } from './storage.service.js';
import { extractTextFromFile } from './extraction.service.js';
import { analyzeMedicalText } from './ai.service.js';

export async function processReportPipeline(reportId: string): Promise<void> {
  console.log(`[Pipeline] Starting processing for reportId: ${reportId}`);
  const report = await Report.findById(reportId);
  if (!report) {
    console.error(`[Pipeline] Report ${reportId} not found`);
    return;
  }

  try {
    // Stage 1: Extract Text
    report.processingStatus = 'extracting';
    await report.save();

    const buffer = await storageService.getFile(report.filePath);
    const text = await extractTextFromFile(buffer, report.fileType);

    if (!text || text.trim().length === 0) {
      throw new Error('No readable text could be extracted from this document.');
    }

    report.extractedText = text;

    // Stage 2: Analyze Text via LLM
    report.processingStatus = 'analyzing';
    await report.save();

    const analysisOutput = await analyzeMedicalText(text, report.fileType);

    // Save Analysis Document
    report.reportType = analysisOutput.reportType || 'General Medical Report';
    
    // Save metadata
    if (analysisOutput.metadata) {
      report.metadata = {
        date: analysisOutput.metadata.date,
        location: analysisOutput.metadata.location,
        hospitalName: analysisOutput.metadata.hospitalName,
        doctorName: analysisOutput.metadata.doctorName,
        contactDetails: analysisOutput.metadata.contactDetails,
        patientName: analysisOutput.metadata.patientName,
        appointmentTime: analysisOutput.metadata.appointmentTime,
      };
    }

    const mappedFindings = (analysisOutput.findings || []).map((f: any) => {
      if (typeof f === 'object' && f !== null) {
        return {
          description: f.description,
          sourceDocumentId: report._id,
          sourcePage: f.sourcePage || null,
          boundingBox: f.boundingBox || null
        };
      }
      return {
        description: String(f),
        sourceDocumentId: report._id,
        sourcePage: null,
      };
    });

    const mappedTestResults = (analysisOutput.testResults || []).map((r: any) => ({
      name: r.name,
      value: r.value,
      unit: r.unit || '',
      referenceRange: r.referenceRange || '',
      status: r.status || 'unknown',
      sourceDocumentId: report._id,
      sourcePage: r.sourcePage || null,
      boundingBox: r.boundingBox || null
    }));

    await Analysis.findOneAndUpdate(
      { reportId: report._id },
      {
        reportId: report._id,
        reportType: analysisOutput.reportType,
        summary: analysisOutput.summary,
        findings: mappedFindings,
        testResults: mappedTestResults,
        medicalTerms: analysisOutput.medicalTerms || [],
        doctorQuestions: analysisOutput.doctorQuestions || [],
        diagnoses: analysisOutput.diagnoses || [],
        preventionTips: analysisOutput.preventionTips || [],
        dietaryAdvice: analysisOutput.dietaryAdvice || { eat: [], avoid: [] },
        carePathwaySuggestion: analysisOutput.carePathwaySuggestion,
        modelUsed: 'gemini-2.5-flash',
      },
      { upsert: true, new: true }
    );

    // Auto-create a MedicalEvent for the history timeline
    if (analysisOutput.metadata) {
      const eventDate = analysisOutput.metadata.date ? new Date(analysisOutput.metadata.date) : new Date();
      
      const newEvent = new MedicalEvent({
        userId: report.userId,
        type: 'medical_test',
        title: analysisOutput.reportType || 'Medical Report Uploaded',
        date: isNaN(eventDate.getTime()) ? new Date() : eventDate,
        description: analysisOutput.summary,
        doctorName: analysisOutput.metadata.doctorName,
        hospitalName: analysisOutput.metadata.hospitalName,
        status: 'active',
        attachedReports: [report._id],
        labResults: mappedTestResults.map(tr => ({
          testName: tr.name,
          value: parseFloat(tr.value) || 0,
          unit: tr.unit,
          referenceRange: tr.referenceRange,
          date: isNaN(eventDate.getTime()) ? new Date() : eventDate,
          specimenType: analysisOutput.reportType
        }))
      });
      
      await newEvent.save();
      
      // Link the event to the report
      report.eventId = newEvent._id;
    }

    report.processingStatus = 'completed';
    report.processingError = undefined;
    await report.save();
    console.log(`[Pipeline] Report ${reportId} successfully processed!`);
  } catch (error: any) {
    console.error(`[Pipeline Error] Processing failed for report ${reportId}:`, error);
    report.processingStatus = 'failed';
    report.processingError = error.message || 'An error occurred during text extraction or AI analysis';
    await report.save();
  }
}
