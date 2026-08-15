import { connectDB } from '../config/db.js';
import { MedicalStore } from '../models/MedicalStore.js';

// ============================================================
// MOCK SEED DATA — All inventory and store details below are
// SIMULATED for demonstration purposes only. In production,
// replace with real pharmacy APIs (e.g., Google Places) and
// government blood bank registry integrations.
// ============================================================

const seedStores = async () => {
  await connectDB();
  await MedicalStore.deleteMany({});

  // Lucknow-area random coords
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
  console.log(`✅ Seeded ${storeDocs.length} medical locations (${pharmacies.length} pharmacies, ${bloodBanks.length} blood banks, ${diagnosticCenters.length} diagnostic centers).`);
  process.exit(0);
};

seedStores().catch((e) => { console.error(e); process.exit(1); });
