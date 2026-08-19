import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';

export interface AnalysisOutput {
  reportType: string;
  summary: string;
  findings: Array<{
    description: string;
    sourcePage?: number | null;
  }>;
  testResults: Array<{
    name: string;
    value: string;
    unit: string;
    referenceRange: string;
    status: 'normal' | 'below_range' | 'above_range' | 'unknown';
    sourcePage?: number | null;
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
}

const SCHEMA_DESCRIPTION = `
Return ONLY a valid JSON object (no markdown, no code fences, no extra commentary) with EXACTLY this structure:

{
  "reportType": string, // e.g. "Complete Blood Count", "Lipid Panel", "X-Ray", "Doctor's Prescription", "Radiology Report"
  "summary": string, // plain language summary of the report for a patient
  "findings": [
    {
      "description": string, // key clinical finding or prescribed medication in plain language
      "sourcePage": number | null
    }
  ],
  "testResults": [
    {
      "name": string,
      "value": string,
      "unit": string,
      "referenceRange": string,
      "status": "normal" | "below_range" | "above_range" | "unknown",
      "sourcePage": number | null
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
    "eat": string[], // general wellness-level suggestions only, no specific quantities or medical diet plans
    "avoid": string[], // general wellness-level suggestions only, no specific quantities or medical diet plans
    "generalOnly": boolean, // true if the condition is complex/high-risk (kidney, liver, cancer, heart, pregnancy) - keep tips broad in that case
    "disclaimer": string // e.g. "This is general wellness guidance, not medical advice. Please consult your doctor or a registered dietitian before making dietary changes."
  }
}

All top-level fields are required. findings, testResults, medicalTerms, and doctorQuestions must be arrays (use an empty array [] if genuinely nothing applies).
`;

export async function analyzeMedicalText(extractedText: string, fileType?: string): Promise<AnalysisOutput> {
  const geminiApiKey = env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json',
    }
  });

  const isPrescription = fileType && (fileType.startsWith('image/'));
  
  const prescriptionExtra = isPrescription ? `
IMPORTANT - IMAGE-BASED DOCUMENT: This text was extracted via OCR from a photograph or scan of a medical document (such as a doctor's prescription, handwritten note, or printed report).
- The OCR may have introduced typos, garbled characters, or spacing errors. Use your medical knowledge to interpret likely abbreviations and errors.
- For prescriptions: extract each medication as a "finding" with its dosage and instructions in plain language.
- Common prescription abbreviations: OD=once daily, BD/BID=twice daily, TDS/TID=three times daily, QDS/QID=four times daily, PO=by mouth, PRN=as needed, SOS=if needed, mg=milligrams, ml=millilitres, tab=tablet, cap=capsule, AC=before meals, PC=after meals, HS=at bedtime.
- Set reportType to "Doctor's Prescription" if this appears to be a prescription.
` : '';

  const systemInstruction = 'You are a precise medical document parsing assistant. You understand lab reports, prescriptions, radiology reports, and all types of medical documents. You always respond with valid JSON only, matching the exact schema given.';

  const prompt = `
${systemInstruction}

You are an expert AI medical document parsing system. Analyze the following text extracted from a medical document.
${prescriptionExtra}
INSTRUCTIONS:
1. Identify the document type (prescription, lab report, X-ray, blood test, discharge summary, etc.).
2. Write a clear, empathetic plain-language summary for a layperson patient.
3. For lab reports: extract all numerical test results with units and reference ranges. Flag abnormal values.
4. For prescriptions: list each medication as a finding with dosage and instructions in plain English.
5. List key clinical findings using conservative, non-diagnostic wording.
6. Translate technical medical terms, abbreviations, and Latin phrases into plain English.
7. Provide 3-5 thoughtful questions the patient can ask their doctor.
8. SOURCE TRACING: If the text contains page markers like "[Page X]", include the sourcePage integer for findings and test results. Otherwise set sourcePage to null.
9. CRITICAL SAFETY DIRECTIVE: DO NOT diagnose disease, prescribe medication, suggest dosage, or advise stopping treatment. All explanations must be informational only.
10. Identify the disease or health issue and extract it into the 'diagnoses' array.
11. Extract all available metadata (date, location, hospital, doctor, patient name, contact, appointment time). If not found, use an empty string.
12. Based on the diagnosis, provide prevention tips and dietary advice (what to eat and what to avoid).

${SCHEMA_DESCRIPTION}

EXTRACTED DOCUMENT TEXT:
"""
${extractedText}
"""
`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  if (!responseText) {
    throw new Error('Empty response from Gemini API');
  }

  const parsedData = JSON.parse(responseText) as AnalysisOutput;
  return parsedData;
}