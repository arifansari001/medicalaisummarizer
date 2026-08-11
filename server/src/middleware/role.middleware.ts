// server/src/middleware/role.middleware.ts
import { type Request, type Response, type NextFunction } from 'express';
import { User } from '../models/User.js';

/**
 * Middleware to enforce that the authenticated user has the required role.
 * Usage: `app.use(requireRole('doctor'))` or `app.use(requireRole('patient'))`.
 */
export function requireRole(role: 'patient' | 'doctor') {
  return async function (req: Request, res: Response, next: NextFunction) {
    // `authenticate` middleware attaches `userId` to the request object.
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      if (user.role !== role) {
        return res.status(403).json({ error: `Forbidden: ${role} role required` });
      }
      next();
    } catch (err) {
      console.error('Role middleware error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
