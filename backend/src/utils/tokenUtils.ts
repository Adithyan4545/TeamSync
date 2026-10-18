import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } from '../config/jwt';

/**
 * Generate a JWT access token.
 * Payload includes user id and role.
 */
export const generateAccessToken = (payload: { id: string; role: string }): string => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
};

/**
 * Generate a refresh token (random UUID) and its expiration date.
 * The token itself is not a JWT; we store it in DB and send as HTTP‑only cookie.
 */
export const generateRefreshToken = () => {
  const token = uuidv4();
  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // default 7 days
  return { token, expires };
};

/**
 * Verify a refresh token against the secret (optional, not used when token is UUID).
 * If you later switch to JWT refresh tokens, you can use this.
 */
export const verifyRefreshToken = (token: string): boolean => {
  // For UUID based tokens, verification is done by DB lookup.
  return typeof token === 'string' && token.length > 0;
};
