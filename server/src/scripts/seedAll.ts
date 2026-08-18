import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { MedicalStore } from '../models/MedicalStore.js';
import Product from '../models/Product.js';
import { connectDB } from '../config/db.js';

export const seedDoctors = async (skipDisconnect = false) => {
  const doctorCount = await User.countDocuments({ role: 'doctor' });
  if (doctorCount > 0) {
    console.log(`ℹ️  Skipping doctor seeding — ${doctorCount} doctors already exist.`);
    return;
  }

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

  const generateCoords = () => ({
    lat: 26.8 + Math.random() * 0.1,
    lng: 80.9 + Math.random() * 0.1
  });

  const mockDoctors = fictionalDoctors.map((doc, i) => ({
    name: doc.name,
    email: `doctor${i+1}@medsummary.mock`,
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
  console.log(`✅ Seeded ${mockDoctors.length} mock doctors.`);
};

export const seedStores = async () => {
  const storeCount = await MedicalStore.countDocuments();
  if (storeCount > 0) {
    console.log(`ℹ️  Skipping store seeding — ${storeCount} stores already exist.`);
    return;
  }

  const lkLat = () => 26.8 + Math.random() * 0.12;
  const lkLng = () => 80.88 + Math.random() * 0.14;

  const pharmacies = [
    { name: 'Apollo Pharmacy - Hazratganj', address: 'Hazratganj, Lucknow', medicines: ['Paracetamol', 'Amoxicillin', 'Metformin', 'Atorvastatin', 'Omeprazole', 'Tab Tryptline', 'Tab Ovral-L', 'Vitamin D3', 'Folic Acid', 'Iron Tablets'] },
    { name: 'MedPlus - Gomti Nagar', address: 'Gomti Nagar, Lucknow', medicines: ['Ciprofloxacin', 'Azithromycin', 'Losartan', 'Pantoprazole', 'Cetirizine', 'Metoprolol', 'Aspirin', 'Clopidogrel', 'Insulin Glargine', 'Tab Tryptline'] },
    { name: 'Jan Aushadhi - Alambagh', address: 'Alambagh, Lucknow', medicines: ['Paracetamol', 'Amoxicillin', 'Ibuprofen', 'Metformin', 'Atenolol', 'Zest A2', 'BV-60k', 'Vitamin B12', 'Calcium Carbonate', 'Ranitidine'] },
    { name: 'Sahara Medical Store', address: 'Aliganj, Lucknow', medicines: ['Dolo 650', 'Azithromycin', 'Vitamin C', 'Zinc Tablets', 'Cetirizine', 'Tab Suide', 'Omeprazole', 'Losartan', 'Aspirin', 'Folic Acid'] },
    { name: 'City Pharmacy - Chowk', address: 'Chowk, Lucknow', medicines: ['Paracetamol', 'Ciprofloxacin', 'Metformin', 'Insulin', 'Lisinopril', 'Metoprolol', 'Tab Tryptline', 'Tab Ovral-L', 'Vitamin D3', 'Iron Tablets'] },
    { name: 'Green Cross Pharmacy', address: 'Indira Nagar, Lucknow', medicines: ['Amoxicillin', 'Ibuprofen', 'Omeprazole', 'Atorvastatin', 'Zest A2', 'BV-60k', 'Tab Suide', 'Folic Acid', 'Calcium Carbonate', 'Vitamin B12'] },
    { name: 'Life Care Medical', address: 'Rajajipuram, Lucknow', medicines: ['Paracetamol', 'Cetirizine', 'Metformin', 'Lisinopril', 'Aspirin', 'Azithromycin', 'Tab Tryptline', 'Tab Ovral-L', 'Vitamin D3', 'Iron Tablets'] },
    { name: 'Swasthya Pharma', address: 'Chinhat, Lucknow', medicines: ['Ciprofloxacin', 'Atenolol', 'Losartan', 'Pantoprazole', 'Dolo 650', 'Tab Suide', 'BV-60k', 'Zest A2', 'Vitamin B12', 'Calcium'] },
    { name: 'Wellness Pharmacy - Mahanagar', address: 'Mahanagar, Lucknow', medicines: ['Insulin', 'Metformin', 'Glibenclamide', 'Amoxicillin', 'Azithromycin', 'Tab Tryptline', 'Vitamin D3', 'Folic Acid', 'Iron Tablets', 'Ranitidine'] },
    { name: 'Prime Medicos - Vikas Nagar', address: 'Vikas Nagar, Lucknow', medicines: ['Paracetamol', 'Ibuprofen', 'Ciprofloxacin', 'Metoprolol', 'Aspirin', 'Tab Ovral-L', 'Zest A2', 'BV-60k', 'Vitamin C', 'Zinc Tablets'] },
  ];

  const bloodBanks = [
    { name: 'SGPGI Blood Bank', address: 'Raebareli Rd, Lucknow', groups: ['A+', 'A-', 'B+', 'O+', 'O-'] },
    { name: 'King George Medical University Blood Bank', address: 'Shah Mina Rd, Lucknow', groups: ['A+', 'B+', 'B-', 'AB+', 'O+', 'O-'] },
    { name: 'Balrampur Hospital Blood Bank', address: 'Golaganj, Lucknow', groups: ['A+', 'B+', 'O+', 'AB-'] },
    { name: 'Ram Manohar Lohia Blood Centre', address: 'Vibhuti Khand, Lucknow', groups: ['A+', 'A-', 'B+', 'B-', 'O+', 'AB+'] },
    { name: 'Sahara Blood Bank', address: 'Sahara Estate, Lucknow', groups: ['O+', 'O-', 'B+', 'A+'] },
  ];

  const diagnosticCenters = [
    {
      name: 'CityScan Imaging & Diagnostics', address: 'Gomti Nagar, Lucknow',
      tests: [
        { name: 'Whole Body PET-CT Scan', price: 25000, turnaroundTime: '48 Hours' },
        { name: 'Cardiac MRI', price: 12000, turnaroundTime: '24 Hours' },
        { name: 'Comprehensive Thyroid Panel', price: 1500, turnaroundTime: '12 Hours' },
        { name: 'BRCA1 & BRCA2 Genetic Testing', price: 18000, turnaroundTime: '7 Days' }
      ]
    },
    {
      name: 'Pioneer Genetic & Path Labs', address: 'Hazratganj, Lucknow',
      tests: [
        { name: 'Non-Invasive Prenatal Testing (NIPT)', price: 15000, turnaroundTime: '5 Days' },
        { name: 'Autoimmune Profile (ANA/ANCA)', price: 4500, turnaroundTime: '48 Hours' },
        { name: 'HbA1c & Fasting Insulin', price: 800, turnaroundTime: '12 Hours' },
        { name: 'Advanced Celiac Disease Panel', price: 5500, turnaroundTime: '72 Hours' }
      ]
    },
    {
      name: 'Apex Precision Diagnostics', address: 'Aliganj, Lucknow',
      tests: [
        { name: 'DEXA Bone Density Scan', price: 2500, turnaroundTime: '24 Hours' },
        { name: 'Pharmacogenomics (PGx) Panel', price: 22000, turnaroundTime: '10 Days' },
        { name: 'Sleep Apnea Polysomnography', price: 10000, turnaroundTime: '48 Hours' },
        { name: 'Cerebrospinal Fluid (CSF) Analysis', price: 3000, turnaroundTime: '24 Hours' }
      ]
    },
    {
      name: 'Nova Neurological Labs', address: 'Indira Nagar, Lucknow',
      tests: [
        { name: 'High-Resolution 3T MRI Brain', price: 9000, turnaroundTime: '24 Hours' },
        { name: 'Heavy Metals Toxicity Panel', price: 6000, turnaroundTime: '5 Days' },
        { name: 'Vitamin B12 & D3 Plus Panel', price: 1200, turnaroundTime: '12 Hours' }
      ]
    }
  ];

  const storeDocs = [
    ...pharmacies.map((p) => ({
      name: p.name,
      type: 'pharmacy',
      location: { lat: lkLat(), lng: lkLng(), address: p.address },
      phone: `98${Math.floor(10000000 + Math.random() * 89999999)}`,
      openHours: '8:00 AM – 10:00 PM',
      medicineInventory: p.medicines,
      bloodGroups: [],
      diagnosticTests: [],
    })),
    ...bloodBanks.map((b) => ({
      name: b.name,
      type: 'blood_bank',
      location: { lat: lkLat(), lng: lkLng(), address: b.address },
      phone: `98${Math.floor(10000000 + Math.random() * 89999999)}`,
      openHours: '24 Hours',
      medicineInventory: [],
      bloodGroups: b.groups,
      diagnosticTests: [],
    })),
    ...diagnosticCenters.map((d) => ({
      name: d.name,
      type: 'diagnostic_center',
      location: { lat: lkLat(), lng: lkLng(), address: d.address },
      phone: `98${Math.floor(10000000 + Math.random() * 89999999)}`,
      openHours: '7:00 AM – 9:00 PM',
      medicineInventory: [],
      bloodGroups: [],
      diagnosticTests: d.tests,
    })),
  ];

  await MedicalStore.insertMany(storeDocs);
  console.log(`✅ Seeded ${storeDocs.length} medical locations.`);
};

export const seedProducts = async () => {
  const productCount = await Product.countDocuments();
  if (productCount > 0) {
    console.log(`ℹ️  Skipping product seeding — ${productCount} products already exist.`);
    return;
  }

  const products = [
    { name: 'HydraGlow Moisturising Lotion SPF 15', category: 'Skin Care', price: 249, mrp: 299, description: 'Lightweight, non-greasy daily moisturiser with SPF 15 protection. Suitable for all Indian skin types.', isPrescriptionRequired: false, inStock: true, image: 'https://placehold.co/300x300/c7f5e0/0F2A2E?text=HydraGlow' },
    { name: 'AcneShield Salicylic Acid Face Wash', category: 'Skin Care', price: 189, mrp: 220, description: 'Gentle 2% salicylic acid face wash. Unclogs pores and reduces acne breakouts.', isPrescriptionRequired: false, inStock: true, image: 'https://placehold.co/300x300/ffd6c8/0F2A2E?text=AcneShield' },
    { name: 'DermaSoothe Calamine Lotion', category: 'Skin Care', price: 119, mrp: 145, description: 'Classic calamine lotion to soothe itching, rashes, and sunburn. Trusted dermatologist recommendation.', isPrescriptionRequired: false, inStock: true, image: 'https://placehold.co/300x300/d8f5ff/0F2A2E?text=DermaSoothe' },
    { name: 'VitaShine Vitamin C Serum 20%', category: 'Skin Care', price: 599, mrp: 749, description: 'Brightening vitamin C serum to reduce pigmentation and even skin tone.', isPrescriptionRequired: false, inStock: true, image: 'https://placehold.co/300x300/fff7c4/0F2A2E?text=VitaShine' },
    { name: 'NourishDerm Ceramide Night Cream', category: 'Skin Care', price: 449, mrp: 550, description: 'Overnight repair cream enriched with ceramides to restore the skin barrier.', isPrescriptionRequired: false, inStock: true, image: 'https://placehold.co/300x300/e0d5ff/0F2A2E?text=NourishDerm' },
    { name: 'PureBub Baby Wet Wipes (80 Sheets)', category: 'Baby Care', price: 199, mrp: 240, description: 'Alcohol-free, fragrance-free wet wipes with aloe vera. Gentle on newborn skin.', isPrescriptionRequired: false, inStock: true, image: 'https://placehold.co/300x300/d0f5e0/0F2A2E?text=PureBub' },
    { name: 'SoftStar Baby Diaper Pants (Large, 52 count)', category: 'Baby Care', price: 649, mrp: 799, description: 'Ultra-soft, leak-proof diaper pants for babies 9–14 kg. 12-hour protection.', isPrescriptionRequired: false, inStock: true, image: 'https://placehold.co/300x300/fce4d6/0F2A2E?text=SoftStar' },
    { name: 'TinyGrow Baby Hair Oil with Almond & Coconut', category: 'Baby Care', price: 159, mrp: 199, description: 'Non-sticky blend of sweet almond and coconut oil for baby scalp nourishment.', isPrescriptionRequired: false, inStock: true, image: 'https://placehold.co/300x300/fef3cc/0F2A2E?text=TinyGrow' },
    { name: 'GentleTouch Baby Rash Cream 50g', category: 'Baby Care', price: 175, mrp: 210, description: 'Zinc oxide barrier cream to soothe and protect baby skin from nappy rash.', isPrescriptionRequired: false, inStock: true, image: 'https://placehold.co/300x300/d4f0ff/0F2A2E?text=GentleTouch' },
    { name: 'MilkDrop Infant Formula Stage 1 (400g)', category: 'Baby Care', price: 890, mrp: 999, description: 'Nutritionally complete starter formula for babies 0–6 months with DHA & ARA.', isPrescriptionRequired: false, inStock: true, image: 'https://placehold.co/300x300/fde8ff/0F2A2E?text=MilkDrop' },
    { name: 'SafeShield Ultra Thin Condoms (Pack of 10)', category: 'Sexual Wellness', price: 249, mrp: 299, description: 'Ultra-thin for heightened sensitivity. Electronically tested & FDA approved.', isPrescriptionRequired: false, inStock: true, image: 'https://placehold.co/300x300/d0eaff/0F2A2E?text=SafeShield' },
    { name: 'LoveSync Personal Lubricant Gel 50ml', category: 'Sexual Wellness', price: 299, mrp: 350, description: 'Water-based, pH-balanced intimate lubricant. Condom compatible and hypoallergenic.', isPrescriptionRequired: false, inStock: true, image: 'https://placehold.co/300x300/ffd6f0/0F2A2E?text=LoveSync' },
    { name: 'PrenaVit Folic Acid 400mcg (90 Tablets)', category: 'Sexual Wellness', price: 199, mrp: 249, description: 'Daily folic acid supplement for women planning pregnancy to support foetal neural development.', isPrescriptionRequired: false, inStock: true, image: 'https://placehold.co/300x300/e6ffd6/0F2A2E?text=PrenaVit' },
    { name: 'Ashwaveda Ashwagandha KSM-66 (60 Caps)', category: 'Ayurveda', price: 449, mrp: 549, description: 'Clinically-dosed KSM-66 ashwagandha root extract to reduce cortisol and ease daily stress.', isPrescriptionRequired: false, inStock: true, image: 'https://placehold.co/300x300/f3e6ca/0F2A2E?text=Ashwaveda' },
    { name: 'TriphalaPlus Digestive Tonic 200ml', category: 'Ayurveda', price: 189, mrp: 220, description: 'Traditional triphala blend with giloy for gut health, immunity, and gentle detox.', isPrescriptionRequired: false, inStock: true, image: 'https://placehold.co/300x300/d4f0dc/0F2A2E?text=TriphalaPlus' },
    { name: 'Brahmi Mind Balance Capsules (60 Caps)', category: 'Ayurveda', price: 349, mrp: 420, description: 'Brahmi extract for memory support, cognitive function, and test-prep focus.', isPrescriptionRequired: false, inStock: true, image: 'https://placehold.co/300x300/d5e8ff/0F2A2E?text=Brahmi' },
    { name: 'TurmeriGold Curcumin 95% (30 Tabs)', category: 'Ayurveda', price: 299, mrp: 369, description: 'High-absorption curcumin with black pepper extract (Bioperine) for joint inflammation.', isPrescriptionRequired: false, inStock: true, image: 'https://placehold.co/300x300/fff0c4/0F2A2E?text=TurmeriGold' },
    { name: 'VitalEdge Daily Multivitamin (60 Tabs)', category: 'Multivitamins', price: 399, mrp: 499, description: 'Complete once-daily multivitamin with 23 essential nutrients. Made in India for Indian lifestyle.', isPrescriptionRequired: false, inStock: true, image: 'https://placehold.co/300x300/ccefff/0F2A2E?text=VitalEdge' },
    { name: 'SunVite D3 60000 IU Weekly Supplement (4 Tabs)', category: 'Multivitamins', price: 149, mrp: 185, description: 'High-dose vitamin D3 for correcting deficiency. Once-weekly tablet as per ICMR guidance.', isPrescriptionRequired: false, inStock: true, image: 'https://placehold.co/300x300/fff8cc/0F2A2E?text=SunVite' },
    { name: 'OmegaCore Fish Oil 1000mg (60 Softgels)', category: 'Multivitamins', price: 549, mrp: 649, description: 'Purified EPA+DHA omega-3 fish oil for heart, brain, and joint health. Burpless formula.', isPrescriptionRequired: false, inStock: true, image: 'https://placehold.co/300x300/dce8ff/0F2A2E?text=OmegaCore' },
    { name: 'ZincGuard Zinc + Vitamin C (60 Tabs)', category: 'Multivitamins', price: 229, mrp: 275, description: 'Immune-boosting zinc chelate with natural vitamin C. Ideal during monsoon and flu season.', isPrescriptionRequired: false, inStock: true, image: 'https://placehold.co/300x300/d6ffee/0F2A2E?text=ZincGuard' },
    { name: 'IronForce Ferrous Bisglycinate 27mg (90 Tabs)', category: 'Multivitamins', price: 329, mrp: 399, description: 'Gentle, highly-absorbable iron supplement for women, anaemia, and fatigue. No stomach upset.', isPrescriptionRequired: false, inStock: true, image: 'https://placehold.co/300x300/ffd6d6/0F2A2E?text=IronForce' },
    { name: 'Paracetamol 650mg Tablet (Strip of 10)', category: 'Prescription Medicines', price: 22, mrp: 27, description: 'Widely-used analgesic and antipyretic for fever and mild-to-moderate pain. Common brand: Dolo 650.', isPrescriptionRequired: true, inStock: true, image: 'https://placehold.co/300x300/e8f5e9/0F2A2E?text=Paracetamol' },
    { name: 'Amoxicillin 500mg Capsule (Strip of 10)', category: 'Prescription Medicines', price: 89, mrp: 110, description: 'Broad-spectrum antibiotic for bacterial infections of the respiratory tract, skin, and ear.', isPrescriptionRequired: true, inStock: true, image: 'https://placehold.co/300x300/e8eaff/0F2A2E?text=Amoxicillin' },
    { name: 'Metformin 500mg Tablet (Strip of 10)', category: 'Prescription Medicines', price: 29, mrp: 35, description: 'First-line oral antidiabetic for Type 2 diabetes management. Reduces blood glucose effectively.', isPrescriptionRequired: true, inStock: true, image: 'https://placehold.co/300x300/ffe8d6/0F2A2E?text=Metformin' },
    { name: 'Losartan 50mg Tablet (Strip of 15)', category: 'Prescription Medicines', price: 75, mrp: 92, description: 'ARB antihypertensive for blood pressure control and kidney protection in diabetics.', isPrescriptionRequired: true, inStock: true, image: 'https://placehold.co/300x300/ffd6e8/0F2A2E?text=Losartan' },
    { name: 'Azithromycin 500mg Tablet (3 Tablets)', category: 'Prescription Medicines', price: 65, mrp: 80, description: '3-day macrolide antibiotic course for respiratory tract and skin infections.', isPrescriptionRequired: true, inStock: true, image: 'https://placehold.co/300x300/f0e8ff/0F2A2E?text=Azithromycin' },
    { name: 'Atorvastatin 20mg Tablet (Strip of 15)', category: 'Prescription Medicines', price: 59, mrp: 74, description: 'Statin for lowering LDL cholesterol and reducing risk of heart disease.', isPrescriptionRequired: true, inStock: true, image: 'https://placehold.co/300x300/e0f8ee/0F2A2E?text=Atorvastatin' },
    { name: 'Pantoprazole 40mg Tablet (Strip of 10)', category: 'Prescription Medicines', price: 43, mrp: 55, description: 'Proton pump inhibitor for acidity, GERD, and ulcer protection with NSAIDs.', isPrescriptionRequired: true, inStock: true, image: 'https://placehold.co/300x300/fefacc/0F2A2E?text=Pantoprazole' },
    { name: 'Cetirizine 10mg Tablet (Strip of 10)', category: 'Prescription Medicines', price: 18, mrp: 24, description: 'Non-drowsy antihistamine for allergic rhinitis, urticaria, and seasonal allergies.', isPrescriptionRequired: true, inStock: false, image: 'https://placehold.co/300x300/d6fef8/0F2A2E?text=Cetirizine' }
  ];

  await Product.insertMany(products);
  console.log(`✅ Seeded ${products.length} products.`);
};

export const autoSeedAll = async (force = false) => {
  const shouldForce = force || process.env.FORCE_SEED === 'true';

  if (shouldForce) {
    console.log('⚡ FORCE_SEED=true — clearing all seeded collections and re-seeding...');
    // Only wipe mock doctors (not real patients!)
    await User.deleteMany({ email: { $regex: '@medsummary.mock' } });
    await MedicalStore.deleteMany({});
    await Product.deleteMany({});
    console.log('🗑️  Old seed data cleared.');
  }

  await seedDoctors();
  await seedStores();
  await seedProducts();
};

if (import.meta.url === `file://${process.argv[1]}`) {
  connectDB().then(async () => {
    await autoSeedAll();
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
