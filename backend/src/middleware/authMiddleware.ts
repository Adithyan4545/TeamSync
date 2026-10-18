import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } from '../config/jwt';

declare global {
  namespace Express {
    interface User {
      id: string;
      role: string;
    }
  }
}

export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

/**
 * Middleware to verify JWT access token.
 * Expects token in Authorization header as 'Bearer <token>'.
 */
export const verifyAccessToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access token missing' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET) as { id: string; role: string };
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired access token' });
  }
};

/**
 * Role based guard. Pass allowed roles as arguments.
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }
    const userRole = req.user.role.toLowerCase();
    const allowed = allowedRoles.map(r => r.toLowerCase());
    
    if (!allowed.includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
    }
    next();
  };
};

/**
 * Optional JWT verification middleware.
 * Populates req.user if valid token present, otherwise continues as guest.
 */
export const optionalAccessToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, JWT_ACCESS_SECRET) as { id: string; role: string };
      req.user = { id: payload.id, role: payload.role };
    } catch (err) {
      // Ignore invalid token for optional auth
    }
  }
  next();
};
