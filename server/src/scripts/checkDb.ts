import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { MedicalStore } from '../models/MedicalStore.js';
import Product from '../models/Product.js';

dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_ai';

async function check() {
  await mongoose.connect(MONGODB_URI);
  const doctorCount = await User.countDocuments({ role: 'doctor' });
  const storeCount = await MedicalStore.countDocuments({});
  const productCount = await Product.countDocuments({});
  const allUsersCount = await User.countDocuments({});

  console.log('--- DATABASE STATS ---');
  console.log(`URI: ${MONGODB_URI}`);
  console.log(`Total Users: ${allUsersCount}`);
  console.log(`Doctor Accounts: ${doctorCount}`);
  console.log(`Medical Stores: ${storeCount}`);
  console.log(`Products: ${productCount}`);

  if (doctorCount > 0) {
    const docs = await User.find({ role: 'doctor' }).limit(3).lean();
    console.log('Sample Doctors:', docs.map(d => ({ name: d.name, specialty: d.specialty, rating: d.rating })));
  }

  await mongoose.disconnect();
}

check().catch(console.error);
