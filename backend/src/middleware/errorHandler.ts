import { Request, Response, NextFunction } from 'express';

/**
 * Centralized error handling middleware.
 * It expects errors to have a `statusCode` and `message` property.
 * All API responses follow the `{ success, message, data?, errors? }` format.
 */
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errors = err.errors || undefined;
  res.status(status).json({ success: false, message, ...(errors && { errors }) });
};
