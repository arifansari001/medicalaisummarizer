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
  origin: [
    'https://medicalaisummarizer.vercel.app',
    'http://localhost:5173'
  ],
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
