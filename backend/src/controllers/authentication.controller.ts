import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/authenticationMiddleware.js';
import { verifyGoogleToken, findOrCreateGoogleUser } from '../services/authentication.service.js';
import { generateJwt } from '../services/jwt.service.js';
import { prisma } from '../lib/prisma.js';

export const googleLogin = async (req: Request, res: Response) => {
  const { credential } = req.body ?? {};

  if (typeof credential !== 'string' || !credential) {
    return res.status(400).json({
      message: 'Google credential is required',
    });
  }

  let payload;

  try {
    payload = await verifyGoogleToken(credential);
  } catch (error) {
    console.error('Google token verification failed:', error);

    return res.status(401).json({
      message: 'Invalid Google credential',
    });
  }

  if (!payload?.sub || !payload.email || !payload.email_verified) {
    return res.status(401).json({
      message: 'Invalid Google account information',
    });
  }

  try {
    const user = await findOrCreateGoogleUser(payload);
    const token = generateJwt(user.id);
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.status(200).json({
      message: 'Google authentication successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Could not create or retrieve user:', error);

    return res.status(500).json({
      message: 'Could not complete authentication',
    });
  }
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  if (req.userId === undefined) {
    return res.status(401).json({
      message: 'Authentication required',
    });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: 'User no longer exists',
      });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Failed to retrieve current user:', error);

    return res.status(500).json({
      message: 'Could not retrieve user',
    });
  }
};
export const logout = (req: Request, res: Response) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return res.status(200).json({
    message: 'Logged out successfully',
  });
};
