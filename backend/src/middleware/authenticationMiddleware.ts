import type { Request, Response, NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

export interface AuthenticatedRequest extends Request {
  userId?: number;
  authIssuedAt?: number;
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.auth_token;

  if (typeof token !== 'string') {
    res.status(401).json({
      message: 'Authentication required',
    });
    return;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error('JWT_SECRET is not defined');
    res.status(500).json({
      message: 'Server configuration error',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    }) as JwtPayload;

    if (
      typeof decoded !== 'object' ||
      typeof decoded.userId !== 'number' ||
      !Number.isSafeInteger(decoded.userId) ||
      decoded.userId <= 0 ||
      !Number.isSafeInteger(decoded.sessionVersion) ||
      Number(decoded.sessionVersion) < 0 ||
      !Number.isSafeInteger(decoded.iat)
    ) {
      res.status(401).json({
        message: 'Invalid authentication token',
      });
      return;
    }

    const issuedAt = decoded.iat as number;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { sessionVersion: true },
    });
    if (!user || user.sessionVersion !== decoded.sessionVersion) {
      res.status(401).json({ message: 'Session is no longer valid' });
      return;
    }

    req.userId = decoded.userId;
    req.authIssuedAt = issuedAt;
    next();
  } catch {
    res.status(401).json({
      message: 'Invalid or expired authentication token',
    });
  }
};
