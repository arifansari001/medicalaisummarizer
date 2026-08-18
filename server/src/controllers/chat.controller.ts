import { type Response } from 'express';
import { type AuthRequest } from '../middleware/auth.middleware.js';
import Groq from 'groq-sdk';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { MedicalStore } from '../models/MedicalStore.js';
import { ChatLog } from '../models/ChatLog.js';
import { extractTextFromFile } from '../services/extraction.service.js';

// ─── Hardcoded Red-Flag / Emergency Patterns ─────────────────────────────────
//
// CRITICAL SAFETY RULE: This check runs BEFORE any AI call.
// If matched, we skip the AI entirely and return a static emergency escalation.
// These patterns are intentionally conservative — false positives are much safer
// than false negatives in an emergency context.
//
const EMERGENCY_PATTERNS: RegExp[] = [
  /chest\s*pain/i,
  /can'?t\s*breath/i,
  /cannot\s*breath/i,
  /difficulty\s*breath/i,
  /trouble\s*breath/i,
  /short\s*of\s*breath/i,
  /severe\s*bleed/i,
  /heavy\s*bleed/i,
  /unconscious/i,
  /not\s*breathing/i,
  /heart\s*attack/i,
  /stroke/i,
  /paralys/i,
  /seizure/i,
  /convuls/i,
  /sudden\s*(numbness|weakness|confusion|vision\s*loss)/i,
  /severe\s*allergic/i,
  /anaphylax/i,
  /suicid/i,
  /self[- ]harm/i,
  /want\s*to\s*die/i,
  /kill\s*(myself|me)/i,
  /overdos/i,
  /poisoning/i,
  /severe\s*pain/i,
  /emergency/i,
];

const EMERGENCY_RESPONSE = {
  content: '🚨 Based on what you described, this may be a medical emergency. Please STOP and take action immediately:\n\n• Call emergency services: **112** (India)\n• Go to the nearest emergency room\n• If possible, do not drive yourself — ask someone to take you or call an ambulance\n\nDo not wait for an online response. This AI cannot assess your condition in real time. Please seek emergency care right now.',
  certaintyLevel: 'emergency' as const,
  queryType: 'emergency',
  isEmergency: true,
};

function checkEmergency(text: string): boolean {
  return EMERGENCY_PATTERNS.some(pattern => pattern.test(text));
}

// ─── Conversational AI Handler ────────────────────────────────────────────────

export const handleChatMessage = async (req: AuthRequest, res: Response) => {
  const patientId = req.userId;
  if (!patientId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const message: string = (req.body.message as string) || '';
    const historyRaw: string = (req.body.history as string) || '[]';
    const history: { role: string; content: string }[] = JSON.parse(historyRaw);

    // Extract OCR text from attachment if present (reuse existing extraction pipeline)
    let ocrText = '';
    let hasAttachment = false;
    if (req.file) {
      hasAttachment = true;
      try {
        // Multer memoryStorage: file is in req.file.buffer (no disk path needed)
        ocrText = await extractTextFromFile(req.file.buffer, req.file.mimetype);
      } catch (e) {
        console.warn('[Chat] OCR extraction failed:', e);
        ocrText = '';
      }
    }

    const fullMessage = [message, ocrText ? `\n\n[Attached document text]\n${ocrText}` : ''].join('');

    if (!fullMessage.trim()) {
      return res.status(400).json({ message: 'Message or attachment required' });
    }

    // ── STEP 1: Hardcoded emergency check — this CANNOT be overridden by the AI ──
    if (checkEmergency(fullMessage)) {
      // Still log the exchange for doctor visibility
      await ChatLog.create({
        patientId,
        patientMessage: fullMessage,
        botResponse: EMERGENCY_RESPONSE.content,
        certaintyLevel: EMERGENCY_RESPONSE.certaintyLevel,
        queryType: EMERGENCY_RESPONSE.queryType,
        isEmergency: true,
        hasAttachment,
      });

      return res.json({ ...EMERGENCY_RESPONSE, doctors: [], stores: [] });
    }

    // ── STEP 2: Build conversational prompt with safety rules baked in ──────────
    const groq = new Groq({ apiKey: env.GROQ_API_KEY });

    const conversationHistory = history.slice(-8).map(h => ({
      role: (h.role === 'patient' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: h.content,
    }));

    const systemPrompt = `You are MedSummary AI's health assistant. Your ONLY job is to provide general educational health information. You are NOT a doctor and must NEVER:
- Diagnose a condition as definitive fact
- Prescribe medication or suggest dosages
- Suggest stopping or changing prescribed medication
- Make the patient feel their condition is certainly serious or certainly benign

REQUIRED RESPONSE FORMAT — respond with a valid JSON object only, no markdown:
{
  "content": "Your conversational, empathetic response in plain language (1–3 paragraphs). Always phrase findings as 'this may be related to...' or 'these symptoms are sometimes associated with...' — never as facts. End with an explicit recommendation to confirm with a doctor.",
  "certaintyLevel": "well_established" | "worth_confirming" | "seek_professional",
  "suggestedSpecialty": "Specialty name (Cardiology, Neurology, General Medicine, Orthopedics, Pediatrics, Gynecology, Dermatology, Nephrology, Endocrinology, Gastroenterology, Pulmonology, Psychiatry) or null if not applicable",
  "queryType": "medicine" | "bloodbank" | "test" | "general" | "none"
}

Certainty guidelines:
- "well_established": Basic, widely-known health information with strong medical consensus
- "worth_confirming": Possible association between symptoms and conditions, but needs professional evaluation
- "seek_professional": Complex, unusual, or concerning symptoms that clearly need a doctor visit

queryType guidelines:
- "medicine": Patient asking about a specific medicine or medication availability
- "bloodbank": Patient asking about blood availability or blood group
- "test": Patient asking about a lab test or where to get tested
- "general": General health questions, symptom discussions, report explanations
- "none": Greetings, unrelated questions`;

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: fullMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 600,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) throw new Error('Empty response from AI');

    let parsed: {
      content: string;
      certaintyLevel: 'well_established' | 'worth_confirming' | 'seek_professional';
      suggestedSpecialty: string | null;
      queryType: string;
    };
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = {
        content: responseText,
        certaintyLevel: 'worth_confirming',
        suggestedSpecialty: null,
        queryType: 'general',
      };
    }

    // ── STEP 3: Fetch inline results based on queryType / specialty ──────────────
    let doctors: any[] = [];
    let stores: any[] = [];

    if (parsed.suggestedSpecialty) {
      // MOCK DATA — In production replace with real geospatial query using patient's location
      doctors = await User.find({ role: 'doctor', specialty: parsed.suggestedSpecialty })
        .select('name specialty rating consultationFee clinicName location')
        .sort({ rating: -1 })
        .limit(4)
        .lean();

      // Fallback: try case-insensitive match
      if (doctors.length === 0) {
        doctors = await User.find({
          role: 'doctor',
          specialty: { $regex: new RegExp(parsed.suggestedSpecialty, 'i') }
        })
          .select('name specialty rating consultationFee clinicName location')
          .sort({ rating: -1 })
          .limit(4)
          .lean();
      }
    }

    if (parsed.queryType === 'medicine' || parsed.queryType === 'test') {
      // MOCK DATA — In production replace with real pharmacy inventory API
      stores = await MedicalStore.find({ type: 'pharmacy' })
        .sort({ name: 1 })
        .limit(3)
        .lean();
    } else if (parsed.queryType === 'bloodbank') {
      // MOCK DATA — In production replace with real blood bank registry API
      stores = await MedicalStore.find({ type: 'blood_bank' })
        .sort({ name: 1 })
        .limit(3)
        .lean();
    }

    // ── STEP 4: Persist to ChatLog for doctor visibility ─────────────────────────
    const logEntry = await ChatLog.create({
      patientId,
      patientMessage: message || '[Image attachment]',
      botResponse: parsed.content,
      certaintyLevel: parsed.certaintyLevel,
      suggestedSpecialty: parsed.suggestedSpecialty,
      queryType: parsed.queryType,
      isEmergency: false,
      hasAttachment,
    });

    return res.json({
      content: parsed.content,
      certaintyLevel: parsed.certaintyLevel,
      suggestedSpecialty: parsed.suggestedSpecialty,
      queryType: parsed.queryType,
      isEmergency: false,
      doctors,
      stores,
      logId: logEntry._id.toString(),
    });

  } catch (error) {
    console.error('[Chat] Error:', error);
    return res.status(500).json({ message: 'Failed to process message. Please try again.' });
  }
};

// ─── Doctor: Get patient's chat logs ─────────────────────────────────────────

export const getPatientChatLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    // Only fetch logs that include health interpretation (certaintyLevel present)
    const logs = await ChatLog.find({
      patientId,
      certaintyLevel: { $ne: null },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({ logs });
  } catch (error) {
    console.error('[Chat] getPatientChatLogs error:', error);
    return res.status(500).json({ message: 'Failed to fetch chat logs' });
  }
};

// ─── Doctor: Review (confirm/flag) a bot response ────────────────────────────

export const reviewChatLog = async (req: AuthRequest, res: Response) => {
  try {
    const { logId } = req.params;
    const { status, note } = req.body as { status: 'confirmed' | 'flagged'; note?: string };

    if (!['confirmed', 'flagged'].includes(status)) {
      return res.status(400).json({ message: 'status must be confirmed or flagged' });
    }

    const log = await ChatLog.findByIdAndUpdate(
      logId,
      {
        'doctorReview.status': status,
        'doctorReview.note': note || null,
        'doctorReview.reviewedBy': req.userId,
        'doctorReview.reviewedAt': new Date(),
      },
      { new: true }
    );

    if (!log) return res.status(404).json({ message: 'Log not found' });

    return res.json({ log });
  } catch (error) {
    console.error('[Chat] reviewChatLog error:', error);
    return res.status(500).json({ message: 'Failed to update review' });
  }
};

// ─── Legacy endpoint (kept for backwards compatibility) ───────────────────────

export const handleDiagnosisChat = async (req: AuthRequest, res: Response) => {
  const { symptoms } = req.body;
  if (!symptoms) return res.status(400).json({ message: 'Symptoms are required' });

  req.body.message = symptoms;
  return handleChatMessage(req, res);
};
