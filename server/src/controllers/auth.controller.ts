import { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { registerSchema, loginSchema } from '../utils/validators.js';
import { env } from '../config/env.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

function generateToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '24h' });
}

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);

  const existing = await User.findOne({ email: data.email });
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await User.create({
    name: data.name,
    email: data.email,
    passwordHash,
    role: data.role,
    specialty: data.specialty,
    clinicName: data.clinicName,
    consultationFee: data.consultationFee,
  });

  const token = generateToken(user._id.toString());
  res.status(201).json({ user: user.toJSON(), token });
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);

  const user = await User.findOne({ email: data.email }).select('+passwordHash');
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const isMatch = await bcrypt.compare(data.password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = generateToken(user._id.toString());
  res.json({ user: user.toJSON(), token });
}

export async function getMe(req: AuthRequest, res: Response) {
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user: user.toJSON() });
}
