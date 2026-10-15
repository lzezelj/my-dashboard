import type { Request, Response } from 'express';
import type { TokenPayload } from 'google-auth-library';
import type { AuthenticatedRequest } from '../middleware/authenticationMiddleware.js';
import {
  findGoogleUser,
  registerGoogleUser,
  verifyGoogleToken,
} from '../services/authentication.service.js';
import { generateJwt } from '../services/jwt.service.js';
import { prisma } from '../lib/prisma.js';

const getGooglePayload = async (req: Request, res: Response): Promise<TokenPayload | null> => {
  const { credential } = req.body ?? {};
  if (typeof credential !== 'string' || !credential) {
    res.status(400).json({ message: 'Google credential is required' });
    return null;
  }

  try {
    const payload = await verifyGoogleToken(credential);

    if (!payload?.sub || !payload.email || !payload.email_verified) {
      res.status(401).json({ message: 'Invalid Google account information' });
      return null;
    }
    const allowedEmails = (process.env.ALLOWED_GOOGLE_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    if (allowedEmails.length > 0 && !allowedEmails.includes(payload.email.toLowerCase())) {
      res.status(403).json({ message: 'This application is currently private' });
      return null;
    }
    return payload;
  } catch (error) {
    console.error('Google token verification failed:', error);
    res.status(401).json({ message: 'Invalid Google credential' });
    return null;
  }
};

const createSession = (
  res: Response,
  user: { id: number; email: string | null; name: string | null },
) => {
  const token = generateJwt(user.id);
  res.cookie('auth_token', token, {
    ...sessionCookieOptions(),
    maxAge: 24 * 60 * 60 * 1000,
  });
  return res.status(200).json({ message: 'Google authentication successful', user });
};

const sessionCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true as const,
    secure: isProduction,
    sameSite: isProduction ? ('none' as const) : ('lax' as const),
    path: '/',
  };
};

export const loginWithGoogle = async (req: Request, res: Response) => {
  const payload = await getGooglePayload(req, res);
  if (!payload) return;

  try {
    const user = await findGoogleUser(payload.sub!);
    if (!user) return res.status(404).json({ message: 'Google account is not registered' });
    return createSession(res, user);
  } catch (error) {
    console.error('Could not log in:', error);
    return res.status(500).json({ message: 'Could not complete login' });
  }
};

export const registerWithGoogle = async (req: Request, res: Response) => {
  const payload = await getGooglePayload(req, res);
  if (!payload) return;

  try {
    const existingUser = await findGoogleUser(payload.sub!);
    if (existingUser)
      return res.status(409).json({ message: 'Google account is already registered' });
    return createSession(res, await registerGoogleUser(payload));
  } catch (error) {
    console.error('Could not register user:', error);
    return res.status(500).json({ message: 'Could not complete registration' });
  }
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  if (req.userId === undefined) return res.status(401).json({ message: 'Authentication required' });
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) return res.status(401).json({ message: 'User no longer exists' });
    return res.status(200).json({ user });
  } catch (error) {
    console.error('Failed to retrieve current user:', error);
    return res.status(500).json({ message: 'Could not retrieve user' });
  }
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie('auth_token', sessionCookieOptions());
  return res.status(200).json({ message: 'Logged out successfully' });
};

export const deleteAccount = async (req: AuthenticatedRequest, res: Response) => {
  if (req.userId === undefined) return res.status(401).json({ message: 'Authentication required' });
  const userId = req.userId;

  try {
    // Delete owned events first so their occurrence overrides are removed by the
    // database cascade. Keeping this in one transaction prevents partial deletion.
    await prisma.$transaction(async (transaction) => {
      await transaction.event.deleteMany({ where: { userId } });
      await transaction.user.delete({ where: { id: userId } });
    });

    res.clearCookie('auth_token', sessionCookieOptions());
    return res.status(204).send();
  } catch (error) {
    console.error('Could not delete account:', error);
    return res.status(500).json({ message: 'Could not delete account' });
  }
};
