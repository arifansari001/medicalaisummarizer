import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import Product from '../models/Product.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_ai';

const products = [
  // ─── Skin Care ───────────────────────────────────────────────────────────────
  {
    name: 'HydraGlow Moisturising Lotion SPF 15',
    category: 'Skin Care',
    price: 249,
    mrp: 299,
    description: 'Lightweight, non-greasy daily moisturiser with SPF 15 protection. Suitable for all Indian skin types.',
    isPrescriptionRequired: false,
    inStock: true,
    image: 'https://placehold.co/300x300/c7f5e0/0F2A2E?text=HydraGlow'
  },
  {
    name: 'AcneShield Salicylic Acid Face Wash',
    category: 'Skin Care',
    price: 189,
    mrp: 220,
    description: 'Gentle 2% salicylic acid face wash. Unclogs pores and reduces acne breakouts.',
    isPrescriptionRequired: false,
    inStock: true,
    image: 'https://placehold.co/300x300/ffd6c8/0F2A2E?text=AcneShield'
  },
  {
    name: 'DermaSoothe Calamine Lotion',
    category: 'Skin Care',
    price: 119,
    mrp: 145,
    description: 'Classic calamine lotion to soothe itching, rashes, and sunburn. Trusted dermatologist recommendation.',
    isPrescriptionRequired: false,
    inStock: true,
    image: 'https://placehold.co/300x300/d8f5ff/0F2A2E?text=DermaSoothe'
  },
  {
    name: 'VitaShine Vitamin C Serum 20%',
    category: 'Skin Care',
    price: 599,
    mrp: 749,
    description: 'Brightening vitamin C serum to reduce pigmentation and even skin tone.',
    isPrescriptionRequired: false,
    inStock: true,
    image: 'https://placehold.co/300x300/fff7c4/0F2A2E?text=VitaShine'
  },
  {
    name: 'NourishDerm Ceramide Night Cream',
    category: 'Skin Care',
    price: 449,
    mrp: 550,
    description: 'Overnight repair cream enriched with ceramides to restore the skin barrier.',
    isPrescriptionRequired: false,
    inStock: true,
    image: 'https://placehold.co/300x300/e0d5ff/0F2A2E?text=NourishDerm'
  },

  // ─── Baby Care ────────────────────────────────────────────────────────────────
  {
    name: 'PureBub Baby Wet Wipes (80 Sheets)',
    category: 'Baby Care',
    price: 199,
    mrp: 240,
    description: 'Alcohol-free, fragrance-free wet wipes with aloe vera. Gentle on newborn skin.',
    isPrescriptionRequired: false,
    inStock: true,
    image: 'https://placehold.co/300x300/d0f5e0/0F2A2E?text=PureBub'
  },
  {
    name: 'SoftStar Baby Diaper Pants (Large, 52 count)',
    category: 'Baby Care',
    price: 649,
    mrp: 799,
    description: 'Ultra-soft, leak-proof diaper pants for babies 9–14 kg. 12-hour protection.',
    isPrescriptionRequired: false,
    inStock: true,
    image: 'https://placehold.co/300x300/fce4d6/0F2A2E?text=SoftStar'
  },
  {
    name: 'TinyGrow Baby Hair Oil with Almond & Coconut',
    category: 'Baby Care',
    price: 159,
    mrp: 199,
    description: 'Non-sticky blend of sweet almond and coconut oil for baby scalp nourishment.',
    isPrescriptionRequired: false,
    inStock: true,
    image: 'https://placehold.co/300x300/fef3cc/0F2A2E?text=TinyGrow'
  },
  {
    name: 'GentleTouch Baby Rash Cream 50g',
    category: 'Baby Care',
    price: 175,
    mrp: 210,
    description: 'Zinc oxide barrier cream to soothe and protect baby skin from nappy rash.',
    isPrescriptionRequired: false,
    inStock: true,
    image: 'https://placehold.co/300x300/d4f0ff/0F2A2E?text=GentleTouch'
  },
  {
    name: 'MilkDrop Infant Formula Stage 1 (400g)',
    category: 'Baby Care',
    price: 890,
    mrp: 999,
    description: 'Nutritionally complete starter formula for babies 0–6 months with DHA & ARA.',
    isPrescriptionRequired: false,
    inStock: true,
    image: 'https://placehold.co/300x300/fde8ff/0F2A2E?text=MilkDrop'
  },

  // ─── Sexual Wellness ──────────────────────────────────────────────────────────
  {
    name: 'SafeShield Ultra Thin Condoms (Pack of 10)',
    category: 'Sexual Wellness',
    price: 249,
    mrp: 299,
    description: 'Ultra-thin for heightened sensitivity. Electronically tested & FDA approved.',
    isPrescriptionRequired: false,
    inStock: true,
    image: 'https://placehold.co/300x300/d0eaff/0F2A2E?text=SafeShield'
  },
  {
    name: 'LoveSync Personal Lubricant Gel 50ml',
    category: 'Sexual Wellness',
    price: 299,
    mrp: 350,
    description: 'Water-based, pH-balanced intimate lubricant. Condom compatible and hypoallergenic.',
    isPrescriptionRequired: false,
    inStock: true,
    image: 'https://placehold.co/300x300/ffd6f0/0F2A2E?text=LoveSync'
  },
  {
    name: 'PrenaVit Folic Acid 400mcg (90 Tablets)',
    category: 'Sexual Wellness',
    price: 199,
    mrp: 249,
    description: 'Daily folic acid supplement for women planning pregnancy to support foetal neural development.',
    isPrescriptionRequired: false,
    inStock: true,
    image: 'https://placehold.co/300x300/e6ffd6/0F2A2E?text=PrenaVit'
  },

  // ─── Ayurveda ─────────────────────────────────────────────────────────────────
  {
    name: 'Ashwaveda Ashwagandha KSM-66 (60 Caps)',
    category: 'Ayurveda',
    price: 449,
    mrp: 549,
    description: 'Clinically-dosed KSM-66 ashwagandha root extract to reduce cortisol and ease daily stress.',
    isPrescriptionRequired: false,
    inStock: true,
    image: 'https://placehold.co/300x300/f3e6ca/0F2A2E?text=Ashwaveda'
  },
  {
    name: 'TriphalaPlus Digestive Tonic 200ml',
    category: 'Ayurveda',
    price: 189,
    mrp: 220,
    description: 'Traditional triphala blend with giloy for gut health, immunity, and gentle detox.',
    isPrescriptionRequired: false,
    inStock: true,
    image: 'https://placehold.co/300x300/d4f0dc/0F2A2E?text=TriphalaPlus'
  },
  {
    name: 'Brahmi Mind Balance Capsules (60 Caps)',
    category: 'Ayurveda',
    price: 349,
    mrp: 420,
    description: 'Brahmi extract for memory support, cognitive function, and test-prep focus.',
    isPrescriptionRequired: false,
    inStock: true,
    image: 'https://placehold.co/300x300/d5e8ff/0F2A2E?text=Brahmi'
  },
  {
    name: 'TurmeriGold Curcumin 95% (30 Tabs)',
    category: 'Ayurveda',
    price: 299,
    mrp: 369,
    description: 'High-absorption curcumin with black pepper extract (Bioperine) for joint inflammation.',
    isPrescriptionRequired: false,
    inStock: true,
    image: 'https://placehold.co/300x300/fff0c4/0F2A2E?text=TurmeriGold'
  },

  // ─── Multivitamins ────────────────────────────────────────────────────────────
  {
    name: 'VitalEdge Daily Multivitamin (60 Tabs)',
    category: 'Multivitamins',
    price: 399,
    mrp: 499,
    description: 'Complete once-daily multivitamin with 23 essential nutrients. Made in India for Indian lifestyle.',
    isPrescriptionRequired: false,
    inStock: true,
    image: 'https://placehold.co/300x300/ccefff/0F2A2E?text=VitalEdge'
  },
  {
    name: 'SunVite D3 60000 IU Weekly Supplement (4 Tabs)',
    category: 'Multivitamins',
    price: 149,
    mrp: 185,
    description: 'High-dose vitamin D3 for correcting deficiency. Once-weekly tablet as per ICMR guidance.',
    isPrescriptionRequired: false,
    inStock: true,
    image: 'https://placehold.co/300x300/fff8cc/0F2A2E?text=SunVite'
  },
  {
    name: 'OmegaCore Fish Oil 1000mg (60 Softgels)',
    category: 'Multivitamins',
    price: 549,
    mrp: 649,
    description: 'Purified EPA+DHA omega-3 fish oil for heart, brain, and joint health. Burpless formula.',
    isPrescriptionRequired: false,
    inStock: true,
    image: 'https://placehold.co/300x300/dce8ff/0F2A2E?text=OmegaCore'
  },
  {
    name: 'ZincGuard Zinc + Vitamin C (60 Tabs)',
    category: 'Multivitamins',
    price: 229,
    mrp: 275,
    description: 'Immune-boosting zinc chelate with natural vitamin C. Ideal during monsoon and flu season.',
    isPrescriptionRequired: false,
    inStock: true,
    image: 'https://placehold.co/300x300/d6ffee/0F2A2E?text=ZincGuard'
  },
  {
    name: 'IronForce Ferrous Bisglycinate 27mg (90 Tabs)',
    category: 'Multivitamins',
    price: 329,
    mrp: 399,
    description: 'Gentle, highly-absorbable iron supplement for women, anaemia, and fatigue. No stomach upset.',
    isPrescriptionRequired: false,
    inStock: true,
    image: 'https://placehold.co/300x300/ffd6d6/0F2A2E?text=IronForce'
  },

  // ─── Prescription Medicines ───────────────────────────────────────────────────
  {
    name: 'Paracetamol 650mg Tablet (Strip of 10)',
    category: 'Prescription Medicines',
    price: 22,
    mrp: 27,
    description: 'Widely-used analgesic and antipyretic for fever and mild-to-moderate pain. Common brand: Dolo 650.',
    isPrescriptionRequired: true,
    inStock: true,
    image: 'https://placehold.co/300x300/e8f5e9/0F2A2E?text=Paracetamol'
  },
  {
    name: 'Amoxicillin 500mg Capsule (Strip of 10)',
    category: 'Prescription Medicines',
    price: 89,
    mrp: 110,
    description: 'Broad-spectrum antibiotic for bacterial infections of the respiratory tract, skin, and ear.',
    isPrescriptionRequired: true,
    inStock: true,
    image: 'https://placehold.co/300x300/e8eaff/0F2A2E?text=Amoxicillin'
  },
  {
    name: 'Metformin 500mg Tablet (Strip of 10)',
    category: 'Prescription Medicines',
    price: 29,
    mrp: 35,
    description: 'First-line oral antidiabetic for Type 2 diabetes management. Reduces blood glucose effectively.',
    isPrescriptionRequired: true,
    inStock: true,
    image: 'https://placehold.co/300x300/ffe8d6/0F2A2E?text=Metformin'
  },
  {
    name: 'Losartan 50mg Tablet (Strip of 15)',
    category: 'Prescription Medicines',
    price: 75,
    mrp: 92,
    description: 'ARB antihypertensive for blood pressure control and kidney protection in diabetics.',
    isPrescriptionRequired: true,
    inStock: true,
    image: 'https://placehold.co/300x300/ffd6e8/0F2A2E?text=Losartan'
  },
  {
    name: 'Azithromycin 500mg Tablet (3 Tablets)',
    category: 'Prescription Medicines',
    price: 65,
    mrp: 80,
    description: '3-day macrolide antibiotic course for respiratory tract and skin infections.',
    isPrescriptionRequired: true,
    inStock: true,
    image: 'https://placehold.co/300x300/f0e8ff/0F2A2E?text=Azithromycin'
  },
  {
    name: 'Atorvastatin 20mg Tablet (Strip of 15)',
    category: 'Prescription Medicines',
    price: 59,
    mrp: 74,
    description: 'Statin for lowering LDL cholesterol and reducing risk of heart disease.',
    isPrescriptionRequired: true,
    inStock: true,
    image: 'https://placehold.co/300x300/e0f8ee/0F2A2E?text=Atorvastatin'
  },
  {
    name: 'Pantoprazole 40mg Tablet (Strip of 10)',
    category: 'Prescription Medicines',
    price: 43,
    mrp: 55,
    description: 'Proton pump inhibitor for acidity, GERD, and ulcer protection with NSAIDs.',
    isPrescriptionRequired: true,
    inStock: true,
    image: 'https://placehold.co/300x300/fefacc/0F2A2E?text=Pantoprazole'
  },
  {
    name: 'Cetirizine 10mg Tablet (Strip of 10)',
    category: 'Prescription Medicines',
    price: 18,
    mrp: 24,
    description: 'Non-drowsy antihistamine for allergic rhinitis, urticaria, and seasonal allergies.',
    isPrescriptionRequired: true,
    inStock: false,
    image: 'https://placehold.co/300x300/d6fef8/0F2A2E?text=Cetirizine'
  }
];

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);

  console.log('🗑️  Clearing old products...');
  await Product.deleteMany({});

  console.log(`💊 Seeding ${products.length} products...`);
  await Product.insertMany(products);

  console.log('✅ Products seeded successfully!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
