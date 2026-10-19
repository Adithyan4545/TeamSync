import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, IUser } from '../models/User';
import { generateAccessToken, generateRefreshToken } from '../utils/tokenUtils';
import { emailTransporter } from '../config/email';
import { Request, Response } from 'express';

// Password policy regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

/**
 * Register a new user.
 */
export const register = async (name: string, email: string, password: string, role: string = 'student') => {
  if (typeof name !== 'string' || !name.trim()) {
    const err: any = new Error('Name is required');
    err.statusCode = 400;
    throw err;
  }

  if (typeof email !== 'string' || !email.trim() || !email.includes('@')) {
    const err: any = new Error('A valid email address is required');
    err.statusCode = 400;
    throw err;
  }

  if (typeof password !== 'string' || !password) {
    const err: any = new Error('Password is required');
    err.statusCode = 400;
    throw err;
  }

  // Validate password strength
  if (!PASSWORD_REGEX.test(password)) {
    const err: any = new Error('Password does not meet security requirements');
    err.statusCode = 400;
    throw err;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    const err: any = new Error('Email already in use');
    err.statusCode = 409;
    throw err;
  }

  // Prevent privilege escalation on public self-registration (always default to student)
  const assignedRole = 'student';

  const hashed = await bcrypt.hash(password, 12);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  const user = new User({
    name: name.trim(),
    email: normalizedEmail,
    password: hashed,
    role: assignedRole,
    verificationToken,
    verificationTokenExpires,
  });
  await user.save();
  // Send verification email (fallback to console if transport not ready)
  const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email/${verificationToken}`;
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: normalizedEmail,
    subject: 'TeamSync Email Verification',
    html: `<p>Hello ${name.trim()},</p><p>Please verify your email by clicking <a href="${verificationUrl}">this link</a>. This link expires in 24 hours.</p>`,
  };
  emailTransporter.sendMail(mailOptions, (err: any, info: any) => {
    if (err) {
      console.warn('Verification email delivery failed');
      if (process.env.NODE_ENV === 'development') {
        console.log('Verification URL:', verificationUrl);
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('Verification email sent:', info?.response);
      }
    }
  });
  return { message: 'Registration successful, verification email sent' };
};

/**
 * Login a user and issue tokens.
 */
export const login = async (email: string, password: string, rememberMe: boolean) => {
  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
    const err: any = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail, isDeleted: { $ne: true } });
  if (!user) {
    const err: any = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }
  if (!user.password) {
    const err: any = new Error("This account uses Google Sign-In. Please sign in with Google or set a password using 'Forgot Password?'.");
    err.statusCode = 401;
    throw err;
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    const err: any = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }
  // if (!user.isVerified) {
  //   const err: any = new Error('Email not verified');
  //   err.statusCode = 403;
  //   throw err;
  // }
  const accessToken = generateAccessToken({ id: user.id, role: user.role });
  const { token: refreshToken, expires } = generateRefreshToken();
  // Store refresh token in DB
  if (!user.refreshTokens) user.refreshTokens = [];
  user.refreshTokens.push({ token: refreshToken, expires });
  await user.save();
  // Set HttpOnly cookie
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    expires,
  };
  return { accessToken, refreshToken, cookieOptions };
};

import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (credential: string) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid Google token');
    }

    const { email, name, picture } = payload;
    const normalizedEmail = (email || '').trim().toLowerCase();

    let user = await User.findOne({ email: normalizedEmail, isDeleted: { $ne: true } });

    if (!user) {
      // Create a new user automatically
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashed = await bcrypt.hash(randomPassword, 12);
      user = new User({
        name: name || 'Google User',
        email: normalizedEmail,
        password: hashed,
        role: 'student',
        isVerified: true,
        avatarUrl: picture
      });
      await user.save();
    } else {
      // Ensure user is verified if logging in via Google
      if (!user.isVerified) {
        user.isVerified = true;
      }
      if (!user.avatarUrl && picture) {
        user.avatarUrl = picture;
      }
      await user.save();
    }

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

    return { accessToken, refreshToken, cookieOptions };
  } catch (error) {
    console.error('Google verification error:', error);
    const err: any = new Error('Google authentication failed');
    err.statusCode = 401;
    throw err;
  }
};

/**
 * Logout: invalidate a single presented refresh token.
 * Ordinary logout is strictly incapable of revoking all sessions;
 * the authenticated /api/users/logout-all endpoint is the dedicated way to revoke all sessions.
 */
export const logout = async (refreshToken?: string, legacyToken?: string) => {
  // Support both logout(refreshToken) and legacy/compatibility logout(undefined, refreshToken) callers
  const tokenToRevoke = typeof refreshToken === 'string' && refreshToken.length > 0
    ? refreshToken
    : (typeof legacyToken === 'string' && legacyToken.length > 0 ? legacyToken : undefined);

  if (tokenToRevoke) {
    await User.updateOne(
      { 'refreshTokens.token': tokenToRevoke },
      { $pull: { refreshTokens: { token: tokenToRevoke } } }
    );
  }
  return { message: 'Logged out successfully' };
};

/**
 * Dedicated service to revoke all refresh tokens for an authenticated user.
 */
export const logoutAll = async (userId: string) => {
  await User.updateOne({ _id: userId }, { $set: { refreshTokens: [] } });
  return { message: 'Logged out from all devices' };
};

/**
 * Verify email using token.
 */
export const verifyEmail = async (token: string) => {
  const user = await User.findOne({ verificationToken: token, verificationTokenExpires: { $gt: new Date() }, isDeleted: { $ne: true } });
  if (!user) {
    const err: any = new Error('Invalid or expired verification token');
    err.statusCode = 400;
    throw err;
  }
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();
  return { message: 'Email verified successfully' };
};

/**
 * Request password reset – send email with token.
 */
export const requestPasswordReset = async (email: string) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail, isDeleted: { $ne: true } });
  if (!user) {
    // Do not reveal user existence
    return { message: 'If that email exists, a reset link has been sent' };
  }
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  user.resetPasswordToken = token;
  user.resetPasswordExpires = expires;
  await user.save();
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password/${token}`;
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: normalizedEmail,
    subject: 'TeamSync Password Reset',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
  };
  emailTransporter.sendMail(mailOptions, (err: any) => {
    if (err) {
      console.warn('Password reset email delivery failed');
      if (process.env.NODE_ENV === 'development') {
        console.log('Reset URL:', resetUrl);
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('Password reset email sent');
      }
    }
  });
  return { message: 'If that email exists, a reset link has been sent' };
};

/**
 * Reset password using token.
 */
export const resetPassword = async (token: string, newPassword: string) => {
  if (!PASSWORD_REGEX.test(newPassword)) {
    const err: any = new Error('Password does not meet security requirements');
    err.statusCode = 400;
    throw err;
  }
  const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() }, isDeleted: { $ne: true } });
  if (!user) {
    const err: any = new Error('Invalid or expired reset token');
    err.statusCode = 400;
    throw err;
  }
  const hashed = await bcrypt.hash(newPassword, 12);
  user.password = hashed;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  return { message: 'Password reset successful' };
};

/**
 * Refresh access token using stored refresh token.
 */
export const refreshAccessToken = async (refreshToken: string) => {
  const user = await User.findOne({ 'refreshTokens.token': refreshToken, 'refreshTokens.expires': { $gt: new Date() }, isDeleted: { $ne: true } });
  if (!user) {
    const err: any = new Error('Invalid refresh token');
    err.statusCode = 401;
    throw err;
  }
  const accessToken = generateAccessToken({ id: user.id, role: user.role });
  return { accessToken };
};
