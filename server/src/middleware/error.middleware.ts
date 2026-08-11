import { type Request, type Response, type NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  console.error('Error:', err);

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}
