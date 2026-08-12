import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { connectDB } from '../config/db.js';

const seedDoctors = async () => {
  try {
    await connectDB();
    
    // Clear existing mock doctors (optional, based on email domain)
    await User.deleteMany({ email: { $regex: '@medsummary.mock' } });

    const passwordHash = await bcrypt.hash('password123', 10);

    const specialties = ['Cardiology', 'Nephrology', 'General Medicine', 'Orthopedics', 'Pediatrics', 'Gynecology', 'Dermatology', 'Neurology', 'Endocrinology'];
    
    // Lucknow coordinates range roughly lat: 26.80 to 26.90, lng: 80.90 to 81.00
    const generateCoords = () => ({
      lat: 26.8 + Math.random() * 0.1,
      lng: 80.9 + Math.random() * 0.1
    });

    const mockDoctors = Array.from({ length: 20 }).map((_, i) => {
      const spec = specialties[i % specialties.length];
      return {
        name: `Dr. Mock ${spec} ${i+1}`,
        email: `doctor${i+1}@medsummary.mock`,
        passwordHash,
        role: 'doctor',
        specialty: spec,
        consultationFee: 500 + Math.floor(Math.random() * 10) * 50, // 500 to 1000
        rating: Number((3.5 + Math.random() * 1.5).toFixed(1)), // 3.5 to 5.0
        location: {
          ...generateCoords(),
          address: `Mock Clinic ${i+1}, Lucknow`
        },
        clinicName: `${spec} Care Center`,
        opdSchedule: [
          { day: 'Monday', startTime: '10:00', endTime: '14:00', avgWaitMinutes: Math.floor(Math.random() * 30) },
          { day: 'Wednesday', startTime: '14:00', endTime: '18:00', avgWaitMinutes: Math.floor(Math.random() * 30) }
        ]
      };
    });

    await User.insertMany(mockDoctors);
    console.log(`✅ Seeded ${mockDoctors.length} mock doctors.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDoctors();
