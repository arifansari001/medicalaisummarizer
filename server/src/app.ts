import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import eventsRoutes from './routes/events.routes.js';
import profileRoutes from './routes/profile.routes.js';
import searchRoutes from './routes/search.routes.js';
import shareRoutes from './routes/share.routes.js';
import chatRoutes from './routes/chat.routes.js';
import doctorsRoutes from './routes/doctors.routes.js';
import storesRoutes from './routes/stores.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import testBookingRoutes from './routes/testBooking.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// CORS & Parsing Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow all Vercel deployments + local dev
    if (
      origin.endsWith('.vercel.app') ||
      origin === 'https://medicalaisummarizer.vercel.app' ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static upload files
app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Admin: Force re-seed (protected by ADMIN_SECRET header)
app.post('/api/admin/reseed', async (req, res) => {
  const secret = req.headers['x-admin-secret'];
  const expectedSecret = process.env.ADMIN_SECRET || 'medsummary-admin-seed-2025';
  if (secret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const { autoSeedAll } = await import('./scripts/seedAll.js');
    await autoSeedAll(true); // force = true
    res.json({ success: true, message: 'Database re-seeded successfully.' });
  } catch (err: any) {
    console.error('Reseed error:', err);
    res.status(500).json({ error: err.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/medical-events', eventsRoutes);
app.use('/api/users/profile', profileRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/test-bookings', testBookingRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
