import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import {
  getJwtAccessSecret,
  getJwtRefreshSecret,
  validateJwtConfig,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
} from '../src/config/jwt';
import { generateAccessToken } from '../src/utils/tokenUtils';
import { verifyAccessToken, optionalAccessToken, AuthRequest } from '../src/middleware/authMiddleware';

describe('JWT Security & Configuration Suite', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Configuration Validation & Insecure Fallback Prevention', () => {
    it('throws clear error when JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;
      expect(() => getJwtAccessSecret()).toThrow('JWT configuration error: JWT_SECRET environment variable is missing or empty.');
    });

    it('throws clear error when JWT_SECRET is an empty string or whitespace', () => {
      process.env.JWT_SECRET = '   ';
      expect(() => getJwtAccessSecret()).toThrow('JWT configuration error: JWT_SECRET environment variable is missing or empty.');
    });

    it('does not leak secret values in error messages or logs', () => {
      delete process.env.JWT_SECRET;
      try {
        getJwtAccessSecret();
        fail('Expected error to be thrown');
      } catch (err: any) {
        expect(err.message).toContain('JWT_SECRET');
        expect(err.message).not.toContain('default_access_secret');
      }
    });

    it('falls back to JWT_SECRET for refresh secret when JWT_REFRESH_SECRET is unset', () => {
      process.env.JWT_SECRET = 'active_jwt_secret_key_12345';
      delete process.env.JWT_REFRESH_SECRET;
      expect(getJwtRefreshSecret()).toBe('active_jwt_secret_key_12345');
    });

    it('prefers explicit JWT_REFRESH_SECRET over JWT_SECRET when both are set', () => {
      process.env.JWT_SECRET = 'active_jwt_secret_key_12345';
      process.env.JWT_REFRESH_SECRET = 'distinct_refresh_secret_98765';
      expect(getJwtRefreshSecret()).toBe('distinct_refresh_secret_98765');
    });

    it('throws when both JWT_REFRESH_SECRET and JWT_SECRET are missing', () => {
      delete process.env.JWT_SECRET;
      delete process.env.JWT_REFRESH_SECRET;
      expect(() => getJwtRefreshSecret()).toThrow('JWT configuration error: JWT_REFRESH_SECRET (or JWT_SECRET) environment variable is missing or empty.');
    });

    it('validateJwtConfig succeeds when valid secret is configured', () => {
      process.env.JWT_SECRET = 'test_secret_for_validation_12345';
      delete process.env.JWT_REFRESH_SECRET;
      const config = validateJwtConfig();
      expect(config.accessSecret).toBe('test_secret_for_validation_12345');
      expect(config.refreshSecret).toBe('test_secret_for_validation_12345');
    });

    it('dynamic getter JWT_ACCESS_SECRET throws when secret is deleted from environment', () => {
      delete process.env.JWT_SECRET;
      expect(() => JWT_ACCESS_SECRET).toThrow('JWT configuration error: JWT_SECRET environment variable is missing or empty.');
    });

    it('rejects old insecure default secrets when valid secret is configured', () => {
      process.env.JWT_SECRET = 'secure_production_secret_key_abcdef';
      // Token signed with the old hardcoded fallback 'default_access_secret'
      const forgedToken = jwt.sign({ id: 'user123', role: 'admin' }, 'default_access_secret');

      expect(() => {
        jwt.verify(forgedToken, JWT_ACCESS_SECRET);
      }).toThrow(jwt.JsonWebTokenError);
    });
  });

  describe('Valid Token Flow', () => {
    beforeEach(() => {
      process.env.JWT_SECRET = 'strong_test_access_secret_0123456789';
    });

    it('generates a valid JWT access token with expected payload and expiration', () => {
      const payload = { id: 'user_test_id', role: 'student' };
      const token = generateAccessToken(payload);

      expect(typeof token).toBe('string');
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as any;
      expect(decoded.id).toBe('user_test_id');
      expect(decoded.role).toBe('student');
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    it('verifyAccessToken attaches user payload and calls next() on valid token', () => {
      const token = generateAccessToken({ id: 'user_456', role: 'leader' });
      const req: Partial<AuthRequest> = {
        headers: { authorization: `Bearer ${token}` },
      };
      const res: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      verifyAccessToken(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toEqual({ id: 'user_456', role: 'leader' });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('optionalAccessToken attaches user payload on valid token', () => {
      const token = generateAccessToken({ id: 'user_789', role: 'student' });
      const req: Partial<AuthRequest> = {
        headers: { authorization: `Bearer ${token}` },
      };
      const res: Partial<Response> = {};
      const next = jest.fn();

      optionalAccessToken(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toEqual({ id: 'user_789', role: 'student' });
    });
  });

  describe('Invalid Token Flow', () => {
    beforeEach(() => {
      process.env.JWT_SECRET = 'strong_test_access_secret_0123456789';
    });

    it('verifyAccessToken returns 401 when Authorization header is missing', () => {
      const req: Partial<AuthRequest> = { headers: {} };
      const jsonMock = jest.fn();
      const res: Partial<Response> = {
        status: jest.fn().mockReturnValue({ json: jsonMock }),
      };
      const next = jest.fn();

      verifyAccessToken(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ success: false, message: 'Access token missing' });
      expect(next).not.toHaveBeenCalled();
    });

    it('verifyAccessToken returns 401 when token is malformed', () => {
      const req: Partial<AuthRequest> = {
        headers: { authorization: 'Bearer not.a.valid.jwt' },
      };
      const jsonMock = jest.fn();
      const res: Partial<Response> = {
        status: jest.fn().mockReturnValue({ json: jsonMock }),
      };
      const next = jest.fn();

      verifyAccessToken(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ success: false, message: 'Invalid or expired access token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('verifyAccessToken returns 401 when token signature is forged with wrong secret', () => {
      const forgedToken = jwt.sign({ id: 'attacker', role: 'admin' }, 'different_secret_key');
      const req: Partial<AuthRequest> = {
        headers: { authorization: `Bearer ${forgedToken}` },
      };
      const jsonMock = jest.fn();
      const res: Partial<Response> = {
        status: jest.fn().mockReturnValue({ json: jsonMock }),
      };
      const next = jest.fn();

      verifyAccessToken(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ success: false, message: 'Invalid or expired access token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('optionalAccessToken proceeds as guest without setting req.user on invalid token', () => {
      const req: Partial<AuthRequest> = {
        headers: { authorization: 'Bearer invalid_signature_token' },
      };
      const res: Partial<Response> = {};
      const next = jest.fn();

      optionalAccessToken(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeUndefined();
    });

    it('optionalAccessToken proceeds as guest when Authorization header is absent', () => {
      const req: Partial<AuthRequest> = { headers: {} };
      const res: Partial<Response> = {};
      const next = jest.fn();

      optionalAccessToken(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeUndefined();
    });
  });

  describe('Token Expiration Flow', () => {
    beforeEach(() => {
      process.env.JWT_SECRET = 'strong_test_access_secret_0123456789';
    });

    it('throws TokenExpiredError when token is expired', () => {
      const expiredToken = jwt.sign(
        { id: 'expired_user', role: 'student' },
        JWT_ACCESS_SECRET,
        { expiresIn: '-1s' }
      );

      expect(() => {
        jwt.verify(expiredToken, JWT_ACCESS_SECRET);
      }).toThrow(jwt.TokenExpiredError);
    });

    it('verifyAccessToken returns 401 for an expired token', () => {
      const expiredToken = jwt.sign(
        { id: 'expired_user', role: 'student' },
        JWT_ACCESS_SECRET,
        { expiresIn: '-1s' }
      );
      const req: Partial<AuthRequest> = {
        headers: { authorization: `Bearer ${expiredToken}` },
      };
      const jsonMock = jest.fn();
      const res: Partial<Response> = {
        status: jest.fn().mockReturnValue({ json: jsonMock }),
      };
      const next = jest.fn();

      verifyAccessToken(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ success: false, message: 'Invalid or expired access token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('optionalAccessToken proceeds as guest on expired token', () => {
      const expiredToken = jwt.sign(
        { id: 'expired_user', role: 'student' },
        JWT_ACCESS_SECRET,
        { expiresIn: '-1s' }
      );
      const req: Partial<AuthRequest> = {
        headers: { authorization: `Bearer ${expiredToken}` },
      };
      const res: Partial<Response> = {};
      const next = jest.fn();

      optionalAccessToken(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeUndefined();
    });
  });

  describe('Configuration Failure in Middleware', () => {
    it('verifyAccessToken passes configuration error to next(err) if JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;
      const validLookingToken = jwt.sign({ id: 'u1', role: 'student' }, 'any_secret');
      const req: Partial<AuthRequest> = {
        headers: { authorization: `Bearer ${validLookingToken}` },
      };
      const res: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      verifyAccessToken(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      const errorPassed = next.mock.calls[0][0];
      expect(errorPassed).toBeInstanceOf(Error);
      expect(errorPassed.message).toContain('JWT configuration error: JWT_SECRET');
    });
  });
});
