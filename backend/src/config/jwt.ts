import { config } from 'dotenv';
config();

/**
 * Validates that an environment secret is configured as a non-empty string.
 * Fails clearly without exposing any secret value in logs or error messages.
 */
function validateSecret(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`JWT configuration error: ${name} environment variable is missing or empty.`);
  }
  return value;
}

/**
 * Retrieves and validates the JWT access token secret.
 * Throws a clear error if the secret is missing or empty.
 * Never logs or prints the secret value.
 */
export const getJwtAccessSecret = (): string => {
  return validateSecret(process.env.JWT_SECRET, 'JWT_SECRET');
};

/**
 * Retrieves and validates the JWT refresh token secret.
 * Uses JWT_REFRESH_SECRET if defined, falling back to JWT_SECRET.
 * Throws a clear error if neither is configured.
 * Never logs or prints the secret value.
 */
export const getJwtRefreshSecret = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  return validateSecret(secret, 'JWT_REFRESH_SECRET (or JWT_SECRET)');
};

export const ACCESS_TOKEN_EXPIRES_IN = '15m'; // 15 minutes
export const REFRESH_TOKEN_EXPIRES_IN = '7d'; // 7 days

/**
 * Eagerly validates the JWT configuration.
 * Call this during application startup to fail early if secrets are missing.
 */
export const validateJwtConfig = (): { accessSecret: string; refreshSecret: string } => {
  return {
    accessSecret: getJwtAccessSecret(),
    refreshSecret: getJwtRefreshSecret(),
  };
};

// Export getters as named exports so existing code using JWT_ACCESS_SECRET / JWT_REFRESH_SECRET
// continues to work transparently, dynamically validating against process.env.
export let JWT_ACCESS_SECRET: string;
export let JWT_REFRESH_SECRET: string;

Object.defineProperty(exports, 'JWT_ACCESS_SECRET', {
  get: () => getJwtAccessSecret(),
  enumerable: true,
  configurable: true,
});

Object.defineProperty(exports, 'JWT_REFRESH_SECRET', {
  get: () => getJwtRefreshSecret(),
  enumerable: true,
  configurable: true,
});
