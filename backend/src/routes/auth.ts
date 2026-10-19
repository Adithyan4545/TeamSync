import { Router, Request, Response } from 'express';
import passport from 'passport';
import { register, login, logout, verifyEmail, requestPasswordReset, resetPassword, refreshAccessToken } from '../services/authService';
import { generateAccessToken, generateRefreshToken } from '../utils/tokenUtils';
import { IUser } from '../models/User';

const router = Router();

router.post('/refresh-token', async (req: Request, res: Response): Promise<any> => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'No refresh token provided' });
    }
    const result = await refreshAccessToken(refreshToken);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 401).json({ success: false, message: err.message });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    const result = await register(name, email, password, role);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.json({ success: false, message: err.message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;
    const result = await login(email, password, !!rememberMe);
    res.cookie('refreshToken', result.refreshToken, result.cookieOptions);
    res.json({ success: true, data: { accessToken: result.accessToken } });
  } catch (err: any) {
    res.status(err.statusCode || 401).json({ success: false, message: err.message });
  }
});

// Initiate Google OAuth login via Passport
router.get('/google', (req: Request, res: Response, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({
      success: false,
      message: 'Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are not configured in backend environment.',
    });
  }
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

// Google OAuth callback endpoint
router.get('/google/callback', (req: Request, res: Response, next) => {
  passport.authenticate('google', { session: false }, async (err: any, user: IUser | false) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (err || !user) {
      const errorMsg = err?.message || 'Google authentication failed';
      return res.redirect(`${frontendUrl}/auth/login?error=${encodeURIComponent(errorMsg)}`);
    }

    try {
      const accessToken = generateAccessToken({ id: user.id, role: user.role });
      const { token: refreshToken, expires } = generateRefreshToken();

      if (!user.refreshTokens) user.refreshTokens = [];
      user.refreshTokens.push({ token: refreshToken, expires });
      await user.save();

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        expires,
      };

      res.cookie('refreshToken', refreshToken, cookieOptions);
      return res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
    } catch (error: any) {
      return res.redirect(`${frontendUrl}/auth/login?error=${encodeURIComponent(error.message || 'Login failed')}`);
    }
  })(req, res, next);
});

router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    const { googleLogin } = await import('../services/authService');
    const result = await googleLogin(credential);
    res.cookie('refreshToken', result.refreshToken, result.cookieOptions);
    res.json({ success: true, data: { accessToken: result.accessToken } });
  } catch (err: any) {
    res.status(err.statusCode || 401).json({ success: false, message: err.message });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
    const result = await logout(typeof refreshToken === 'string' ? refreshToken : undefined);
    res.clearCookie('refreshToken');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/verify-email', async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    const result = await verifyEmail(token);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

router.post('/request-password-reset', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const result = await requestPasswordReset(email);
    res.json({ success: true, message: result.message });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    const result = await resetPassword(token, newPassword);
    res.json({ success: true, message: result.message });
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

export default router;
