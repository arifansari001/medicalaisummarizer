import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { MedicalStore } from '../models/MedicalStore.js';
import Product from '../models/Product.js';

export async function autoSeedDatabase() {
  try {
    // 1. Auto Seed Doctors if no doctors exist
    const doctorCount = await User.countDocuments({ role: 'doctor' });
    if (doctorCount === 0) {
      console.log('🌱 No doctors found in database. Auto-seeding doctor accounts...');
      const passwordHash = await bcrypt.hash('password123', 10);
      const fictionalDoctors = [
        { name: 'Dr. Priya Sharma', clinicName: 'Sharma Heart & Rhythm Clinic', specialty: 'Cardiology' },
        { name: 'Dr. Rajesh Khanna', clinicName: 'Lucknow Heart Institute', specialty: 'Cardiology' },
        { name: 'Dr. Amit Trivedi', clinicName: 'Trivedi Kidney Care', specialty: 'Nephrology' },
        { name: 'Dr. Sneha Gupta', clinicName: 'Advanced Renal Center', specialty: 'Nephrology' },
        { name: 'Dr. Vikram Singh', clinicName: 'Singh Family Clinic', specialty: 'General Medicine' },
        { name: 'Dr. Ananya Verma', clinicName: 'Verma Multispecialty Clinic', specialty: 'General Medicine' },
        { name: 'Dr. Sanjay Patel', clinicName: 'Patel Bone & Joint Care', specialty: 'Orthopedics' },
        { name: 'Dr. Neha Desai', clinicName: 'Desai Ortho Clinic', specialty: 'Orthopedics' },
        { name: 'Dr. Rohan Mehra', clinicName: "Mehra Children's Hospital", specialty: 'Pediatrics' },
        { name: 'Dr. Kavita Joshi', clinicName: 'Little Smiles Clinic', specialty: 'Pediatrics' },
        { name: 'Dr. Meera Reddy', clinicName: "Reddy Women's Health", specialty: 'Gynecology' },
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

      const generateCoords = () => ({
        lat: 26.8 + Math.random() * 0.1,
        lng: 80.9 + Math.random() * 0.1
      });

      const mockDoctors = fictionalDoctors.map((doc, i) => ({
        name: doc.name,
        email: `doctor${i + 1}@medsummary.mock`,
        passwordHash,
        role: 'doctor',
        specialty: doc.specialty,
        consultationFee: 500 + Math.floor(Math.random() * 10) * 50,
        rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
        location: {
          ...generateCoords(),
          address: `${doc.clinicName}, Lucknow`
        },
        clinicName: doc.clinicName,
        opdSchedule: [
          { day: 'Monday', startTime: '10:00', endTime: '14:00', avgWaitMinutes: Math.floor(Math.random() * 30) },
          { day: 'Wednesday', startTime: '14:00', endTime: '18:00', avgWaitMinutes: Math.floor(Math.random() * 30) }
        ]
      }));

      await User.insertMany(mockDoctors);
      console.log(`✅ Auto-seeded ${mockDoctors.length} doctors.`);
    }

    // 2. Auto Seed Medical Stores / Diagnostic Centers if empty
    const storeCount = await MedicalStore.countDocuments({});
    if (storeCount === 0) {
      console.log('🌱 No medical stores/diagnostic centers found. Auto-seeding stores...');
      const storeDocs = [
        {
          name: 'Apollo Pharmacy Express',
          type: 'pharmacy',
          location: { lat: 26.852, lng: 80.948, address: 'Hazratganj, Lucknow' },
          phone: '+91 98765 43210',
          openHours: '24/7 Open',
          medicineInventory: ['Paracetamol 650mg', 'Amoxicillin 500mg', 'Metformin 500mg', 'Losartan 50mg', 'Azithromycin 500mg', 'Cetrininge 10mg', 'Dolo 650']
        },
        {
          name: 'Sanjivani Medicos',
          type: 'pharmacy',
          location: { lat: 26.845, lng: 80.935, address: 'Charbagh, Lucknow' },
          phone: '+91 98765 43211',
          openHours: '8:00 AM - 11:00 PM',
          medicineInventory: ['Paracetamol 650mg', 'Pantoprazole 40mg', 'Atorvastatin 20mg', 'Cetirizine 10mg']
        },
        {
          name: 'City Care Blood Bank',
          type: 'blood_bank',
          location: { lat: 26.861, lng: 80.952, address: 'Mahanagar, Lucknow' },
          phone: '+91 98765 43212',
          openHours: '24/7 Emergency Blood Supply',
          bloodGroups: ['A+', 'B+', 'O+', 'AB+', 'O-', 'A-']
        },
        {
          name: 'Red Cross Blood Center',
          type: 'blood_bank',
          location: { lat: 26.838, lng: 80.922, address: 'Alambagh, Lucknow' },
          phone: '+91 98765 43213',
          openHours: '24/7 Open',
          bloodGroups: ['B+', 'O+', 'AB-', 'B-']
        },
        {
          name: 'Thyrocare Pathology Lab & Diagnostic Center',
          type: 'diagnostic_center',
          location: { lat: 26.855, lng: 80.961, address: 'Gomti Nagar, Lucknow' },
          phone: '+91 98765 43214',
          openHours: '7:00 AM - 9:00 PM',
          diagnosticTests: [
            { name: 'Complete Blood Count (CBC)', price: 350, turnaroundTime: '6 Hours' },
            { name: 'HbA1c Glycated Hemoglobin', price: 450, turnaroundTime: '12 Hours' },
            { name: 'Lipid Profile Screen', price: 650, turnaroundTime: '12 Hours' },
            { name: 'Liver Function Test (LFT)', price: 750, turnaroundTime: '12 Hours' },
            { name: 'Thyroid Profile (T3, T4, TSH)', price: 550, turnaroundTime: '8 Hours' }
          ]
        },
        {
          name: 'Max Health Diagnostic & Imaging Center',
          type: 'diagnostic_center',
          location: { lat: 26.848, lng: 80.942, address: 'Civil Lines, Lucknow' },
          phone: '+91 98765 43215',
          openHours: '8:00 AM - 8:00 PM',
          diagnosticTests: [
            { name: 'Vitamin D3 & B12 Combo', price: 990, turnaroundTime: '24 Hours' },
            { name: 'Kidney Function Test (KFT)', price: 600, turnaroundTime: '8 Hours' },
            { name: 'Fast Blood Sugar (FBS)', price: 150, turnaroundTime: '4 Hours' },
            { name: 'ECG Cardiac Scan', price: 300, turnaroundTime: '1 Hour' }
          ]
        }
      ];

      await MedicalStore.insertMany(storeDocs);
      console.log(`✅ Auto-seeded ${storeDocs.length} medical stores & diagnostic centers.`);
    }

    // 3. Auto Seed Products if empty
    const productCount = await Product.countDocuments({});
    if (productCount === 0) {
      console.log('🌱 No products found in database. Auto-seeding pharmacy products...');
      const products = [
        {
          name: 'HydraGlow Moisturising Lotion SPF 15',
          category: 'Skin Care',
          price: 249,
          mrp: 299,
          description: 'Lightweight, non-greasy daily moisturiser with SPF 15 protection.',
          isPrescriptionRequired: false,
          inStock: true,
          image: 'https://placehold.co/300x300/c7f5e0/0F2A2E?text=HydraGlow'
        },
        {
          name: 'AcneShield Salicylic Acid Face Wash',
          category: 'Skin Care',
          price: 189,
          mrp: 220,
          description: 'Gentle 2% salicylic acid face wash for clear skin.',
          isPrescriptionRequired: false,
          inStock: true,
          image: 'https://placehold.co/300x300/ffd6c8/0F2A2E?text=AcneShield'
        },
        {
          name: 'PureBub Baby Wet Wipes (80 Sheets)',
          category: 'Baby Care',
          price: 199,
          mrp: 240,
          description: 'Alcohol-free, fragrance-free wet wipes with aloe vera.',
          isPrescriptionRequired: false,
          inStock: true,
          image: 'https://placehold.co/300x300/d0f5e0/0F2A2E?text=PureBub'
        },
        {
          name: 'Ashwaveda Ashwagandha KSM-66 (60 Caps)',
          category: 'Ayurveda',
          price: 449,
          mrp: 549,
          description: 'KSM-66 ashwagandha root extract to reduce stress.',
          isPrescriptionRequired: false,
          inStock: true,
          image: 'https://placehold.co/300x300/f3e6ca/0F2A2E?text=Ashwaveda'
        },
        {
          name: 'VitalEdge Daily Multivitamin (60 Tabs)',
          category: 'Multivitamins',
          price: 399,
          mrp: 499,
          description: 'Complete once-daily multivitamin with 23 essential nutrients.',
          isPrescriptionRequired: false,
          inStock: true,
          image: 'https://placehold.co/300x300/ccefff/0F2A2E?text=VitalEdge'
        },
        {
          name: 'Paracetamol 650mg Tablet (Strip of 10)',
          category: 'Prescription Medicines',
          price: 22,
          mrp: 27,
          description: 'Analgesic and antipyretic for fever and mild pain.',
          isPrescriptionRequired: true,
          inStock: true,
          image: 'https://placehold.co/300x300/e8f5e9/0F2A2E?text=Paracetamol'
        },
        {
          name: 'Amoxicillin 500mg Capsule (Strip of 10)',
          category: 'Prescription Medicines',
          price: 89,
          mrp: 110,
          description: 'Broad-spectrum antibiotic for bacterial infections.',
          isPrescriptionRequired: true,
          inStock: true,
          image: 'https://placehold.co/300x300/e8eaff/0F2A2E?text=Amoxicillin'
        },
        {
          name: 'Metformin 500mg Tablet (Strip of 10)',
          category: 'Prescription Medicines',
          price: 29,
          mrp: 35,
          description: 'Oral antidiabetic for Type 2 diabetes management.',
          isPrescriptionRequired: true,
          inStock: true,
          image: 'https://placehold.co/300x300/ffe8d6/0F2A2E?text=Metformin'
        }
      ];

      await Product.insertMany(products);
      console.log(`✅ Auto-seeded ${products.length} pharmacy products.`);
    }
  } catch (error) {
    console.error('⚠️ Auto-seed check failed:', error);
  }
}
