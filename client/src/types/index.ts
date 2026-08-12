// User types
export interface User {
  _id: string;
  name: string;
  email: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  profileImage?: string;
  role: 'patient' | 'doctor';
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'patient' | 'doctor';
}

// Medical Event types
export type EventType = 
  | 'illness' | 'injury' | 'surgery' | 'allergy' | 'hospitalization'
  | 'doctor_visit' | 'vaccination' | 'medical_test' | 'medication' | 'other';

export type EventStatus = 'active' | 'ongoing' | 'recovered' | 'resolved' | 'chronic';

export interface MedicalEvent {
  _id: string;
  userId: string;
  type: EventType;
  title: string;
  date: string;
  description?: string;
  symptoms: string[];
  treatment?: string;
  doctorName?: string;
  hospitalName?: string;
  status: EventStatus;
  notes?: string;
  attachedReports: string[] | Report[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventData {
  type: EventType;
  title: string;
  date: string;
  description?: string;
  symptoms?: string[];
  treatment?: string;
  doctorName?: string;
  hospitalName?: string;
  status?: EventStatus;
  notes?: string;
  attachedReports?: string[];
}

// Report types
export type ProcessingStatus = 'uploaded' | 'extracting' | 'analyzing' | 'completed' | 'failed';

export interface Report {
  _id: string;
  userId: string;
  eventId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  extractedText: string;
  reportType: string;
  processingStatus: ProcessingStatus;
  processingError?: string;
  metadata?: {
    date?: string;
    location?: string;
    hospitalName?: string;
    doctorName?: string;
    contactDetails?: string;
    patientName?: string;
    appointmentTime?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Analysis types
export interface TestResult {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'below_range' | 'above_range' | 'unknown';
  sourceDocumentId?: string;
  sourcePage?: number | null;
}

export interface MedicalTerm {
  term: string;
  explanation: string;
}

export interface Finding {
  description: string;
  sourceDocumentId?: string;
  sourcePage?: number | null;
}

export interface Analysis {
  _id: string;
  reportId: string;
  reportType: string;
  summary: string;
  findings: Finding[];
  testResults: TestResult[];
  medicalTerms: MedicalTerm[];
  doctorQuestions: string[];
  diagnoses: string[];
  preventionTips: string[];
  dietaryAdvice: {
    eat: string[];
    avoid: string[];
    generalOnly: boolean;
    disclaimer: string;
  };
  modelUsed: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShareRecord {
  _id: string;
  patientId: string | User;
  doctorEmail: string;
  doctorId?: string | User | null;
  sharedEventIds: string[];
  sharedReportIds: string[];
  accessToken: string;
  expiresAt: string;
  revokedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// API response types
export interface ApiError {
  error: string;
  details?: { path: string; message: string }[];
}
