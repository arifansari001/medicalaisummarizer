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
    
    const fictionalDoctors = [
      { name: 'Dr. Priya Sharma', clinicName: 'Sharma Heart & Rhythm Clinic', specialty: 'Cardiology' },
      { name: 'Dr. Rajesh Khanna', clinicName: 'Lucknow Heart Institute', specialty: 'Cardiology' },
      { name: 'Dr. Amit Trivedi', clinicName: 'Trivedi Kidney Care', specialty: 'Nephrology' },
      { name: 'Dr. Sneha Gupta', clinicName: 'Advanced Renal Center', specialty: 'Nephrology' },
      { name: 'Dr. Vikram Singh', clinicName: 'Singh Family Clinic', specialty: 'General Medicine' },
      { name: 'Dr. Ananya Verma', clinicName: 'Verma Multispecialty Clinic', specialty: 'General Medicine' },
      { name: 'Dr. Sanjay Patel', clinicName: 'Patel Bone & Joint Care', specialty: 'Orthopedics' },
      { name: 'Dr. Neha Desai', clinicName: 'Desai Ortho Clinic', specialty: 'Orthopedics' },
      { name: 'Dr. Rohan Mehra', clinicName: 'Mehra Children\'s Hospital', specialty: 'Pediatrics' },
      { name: 'Dr. Kavita Joshi', clinicName: 'Little Smiles Clinic', specialty: 'Pediatrics' },
      { name: 'Dr. Meera Reddy', clinicName: 'Reddy Women\'s Health', specialty: 'Gynecology' },
      { name: 'Dr. Pooja Agarwal', clinicName: 'Agarwal Maternity Center', specialty: 'Gynecology' },
      { name: 'Dr. Anil Kumar', clinicName: 'Kumar Skin & Hair Clinic', specialty: 'Dermatology' },
      { name: 'Dr. Riya Kapoor', clinicName: 'Kapoor Derma Center', specialty: 'Dermatology' },
      { name: 'Dr. Suresh Nair', clinicName: 'Nair Brain & Spine Institute', specialty: 'Neurology' },
      { name: 'Dr. Divya Iyer', clinicName: 'Iyer Neuro Clinic', specialty: 'Neurology' },
      { name: 'Dr. Manish Gupta', clinicName: 'Gupta Diabetes & Hormone Center', specialty: 'Endocrinology' },
      { name: 'Dr. Nisha Bhatia', clinicName: 'Bhatia Endocrine Care', specialty: 'Endocrinology' },
      { name: 'Dr. Rahul Das', clinicName: 'Das General Healthcare', specialty: 'General Medicine' },
      { name: 'Dr. Anjali Menon', clinicName: 'Menon Heart Care', specialty: 'Cardiology' }
    ];

    // Lucknow coordinates range roughly lat: 26.80 to 26.90, lng: 80.90 to 81.00
    const generateCoords = () => ({
      lat: 26.8 + Math.random() * 0.1,
      lng: 80.9 + Math.random() * 0.1
    });

    const mockDoctors = fictionalDoctors.map((doc, i) => {
      return {
        name: doc.name,
        email: `doctor${i+1}@medsummary.mock`,
        passwordHash,
        role: 'doctor',
        specialty: doc.specialty,
        consultationFee: 500 + Math.floor(Math.random() * 10) * 50, // 500 to 1000
        rating: Number((3.5 + Math.random() * 1.5).toFixed(1)), // 3.5 to 5.0
        location: {
          ...generateCoords(),
          address: `${doc.clinicName}, Lucknow`
        },
        clinicName: doc.clinicName,
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
