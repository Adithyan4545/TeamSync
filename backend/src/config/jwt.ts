import { config } from 'dotenv';
config();

export const JWT_ACCESS_SECRET = process.env.JWT_SECRET || 'default_access_secret';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret';
export const ACCESS_TOKEN_EXPIRES_IN = '15m'; // 15 minutes
export const REFRESH_TOKEN_EXPIRES_IN = '7d'; // 7 days
