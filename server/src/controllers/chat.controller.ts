import { type Response } from 'express';
import { type AuthRequest } from '../middleware/auth.middleware.js';
import Groq from 'groq-sdk';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export const handleDiagnosisChat = async (req: AuthRequest, res: Response) => {
  try {
    const { symptoms } = req.body;
    
    if (!symptoms) {
      return res.status(400).json({ message: 'Symptoms are required' });
    }

    const groq = new Groq({ apiKey: env.GROQ_API_KEY });
    
    // AI prompt to map symptoms to diagnosis, specialty and provide an explanation
    const prompt = `
    You are a helpful medical triage assistant. A patient reports the following symptoms: "${symptoms}".
    
    1. Provide a brief, easy-to-understand possible diagnosis or explanation for these symptoms (1-2 sentences). Do not provide definitive medical advice, just a general idea.
    2. Determine the most relevant medical specialty a patient should consult for this issue. Choose exactly ONE from this list: Cardiology, Nephrology, General Medicine, Orthopedics, Pediatrics, Gynecology, Dermatology, Neurology, Endocrinology. If none fit perfectly, default to "General Medicine".

    Return your response strictly as a JSON object matching this schema:
    {
      "explanation": "your explanation here",
      "specialty": "Specialty Name"
    }
    `;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('Empty response from AI');
    }

    const parsedData = JSON.parse(responseText);
    const { explanation, specialty } = parsedData;

    // Fetch nearby doctors matching the specialty (mock sorting by rating for now)
    const doctors = await User.find({ role: 'doctor', specialty })
      .select('name specialty rating consultationFee clinicName location')
      .sort({ rating: -1 })
      .limit(5);

    res.json({
      explanation,
      specialty,
      recommendedDoctors: doctors
    });
  } catch (error) {
    console.error('Chat routing error:', error);
    res.status(500).json({ message: 'Failed to process chat request' });
  }
};
