import Groq from 'groq-sdk';
import { env } from '../config/env.js';

export interface AnalysisOutput {
  reportType: string;
  summary: string;
  findings: Array<{
    description: string;
    sourcePage?: number | null;
    boundingBox?: { page: number, x: number, y: number, width: number, height: number, confidenceScore: number } | null;
  }>;
  testResults: Array<{
    name: string;
    value: string;
    unit: string;
    referenceRange: string;
    status: 'normal' | 'below_range' | 'above_range' | 'unknown';
    sourcePage?: number | null;
    boundingBox?: { page: number, x: number, y: number, width: number, height: number, confidenceScore: number } | null;
  }>;
  medicalTerms: Array<{
    term: string;
    explanation: string;
  }>;
  doctorQuestions: string[];
  diagnoses: string[];
  metadata: {
    date: string;
    location: string;
    hospitalName: string;
    doctorName: string;
    contactDetails: string;
    patientName: string;
    appointmentTime: string;
  };
  preventionTips: string[];
  dietaryAdvice: {
    eat: string[];
    avoid: string[];
    generalOnly: boolean;
    disclaimer: string;
  };
  carePathwaySuggestion?: {
    recommendedProviderTypes: string[];
    nextSteps: string[];
  };
}

const SCHEMA_DESCRIPTION = `
Return ONLY a valid JSON object (no markdown, no code fences, no extra commentary) with EXACTLY this structure:

{
  "reportType": string,
  "summary": string,
  "findings": [
    {
      "description": string,
      "sourcePage": number | null,
      "boundingBox": { "page": number, "x": number, "y": number, "width": number, "height": number, "confidenceScore": number } | null
    }
  ],
  "testResults": [
    {
      "name": string,
      "value": string,
      "unit": string,
      "referenceRange": string,
      "status": "normal" | "below_range" | "above_range" | "unknown",
      "sourcePage": number | null,
      "boundingBox": { "page": number, "x": number, "y": number, "width": number, "height": number, "confidenceScore": number } | null
    }
  ],
  "medicalTerms": [
    { "term": string, "explanation": string }
  ],
  "doctorQuestions": string[],
  "diagnoses": string[],
  "metadata": {
    "date": string,
    "location": string,
    "hospitalName": string,
    "doctorName": string,
    "contactDetails": string,
    "patientName": string,
    "appointmentTime": string
  },
  "preventionTips": string[],
  "dietaryAdvice": {
    "eat": string[],
    "avoid": string[],
    "generalOnly": boolean,
    "disclaimer": string
  },
  "carePathwaySuggestion": {
    "recommendedProviderTypes": string[],
    "nextSteps": string[]
  }
}

All top-level fields are required. findings, testResults, medicalTerms, and doctorQuestions must be arrays (use [] if nothing applies).
`;

export async function analyzeMedicalText(extractedText: string, fileType?: string): Promise<AnalysisOutput> {
  // Use env key first, fall back to hardcoded key so it can never fail
  const groqApiKey = env.GROQ_API_KEY;

  const groq = new Groq({ apiKey: groqApiKey });

  const isPrescription = fileType && (fileType.startsWith('image/'));

  const prescriptionExtra = isPrescription ? `
IMPORTANT - IMAGE-BASED DOCUMENT: This text was extracted via OCR from a photograph or scan of a medical document (such as a doctor's prescription, handwritten note, or printed report).
- The OCR may have introduced typos, garbled characters, or spacing errors. Use your medical knowledge to interpret likely abbreviations and errors.
- For prescriptions: extract each medication as a "finding" with its dosage and instructions in plain language.
- Common prescription abbreviations: OD=once daily, BD/BID=twice daily, TDS/TID=three times daily, QDS/QID=four times daily, PO=by mouth, PRN=as needed, SOS=if needed, mg=milligrams, ml=millilitres, tab=tablet, cap=capsule, AC=before meals, PC=after meals, HS=at bedtime.
- Set reportType to "Doctor's Prescription" if this appears to be a prescription.
` : '';

  const prompt = `You are an expert AI medical document parsing system. Analyze the following text extracted from a medical document.
${prescriptionExtra}
INSTRUCTIONS:
1. Identify the document type (prescription, lab report, X-ray, blood test, discharge summary, etc.).
2. Write a clear, empathetic plain-language summary for a layperson patient.
3. For lab reports: extract all numerical test results with units and reference ranges. Flag abnormal values.
4. For prescriptions: list each medication as a finding with dosage and instructions in plain English.
5. List key clinical findings using conservative, non-diagnostic wording.
6. Translate technical medical terms, abbreviations, and Latin phrases into plain English.
7. Provide 3-5 thoughtful questions the patient can ask their doctor.
8. SOURCE TRACING: If the text contains page markers like "[Page X]", include the sourcePage integer. Otherwise set sourcePage to null. Set boundingBox to null (OCR coordinates not available via text-only extraction).
9. CRITICAL SAFETY DIRECTIVE: DO NOT diagnose disease, prescribe medication, suggest dosage, or advise stopping treatment. All explanations must be informational only. Include the disclaimer string.
10. Identify the disease or health issue and extract it into the 'diagnoses' array.
11. Extract all available metadata (date, location, hospital, doctor, patient name, contact, appointment time). Use empty string if not found.
12. Based on the diagnosis, provide prevention tips and dietary advice (what to eat and what to avoid).
13. CARE PATHWAY: Suggest recommended provider types (e.g., Endocrinologist) and immediate non-diagnostic next steps.

${SCHEMA_DESCRIPTION}

EXTRACTED DOCUMENT TEXT:
"""
${extractedText}
"""`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a precise medical document parsing assistant. You understand lab reports, prescriptions, radiology reports, and all types of medical documents. You always respond with valid JSON only, matching the exact schema given. Never include markdown code fences or any text outside the JSON object.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    max_tokens: 4096,
  });

  const responseText = chatCompletion.choices[0]?.message?.content;

  if (!responseText) {
    throw new Error('Empty response from Groq API');
  }

  // Strip markdown fences if model wraps in them despite instructions
  const cleaned = responseText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const parsedData = JSON.parse(cleaned) as AnalysisOutput;
  return parsedData;
}
