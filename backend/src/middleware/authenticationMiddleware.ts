import type { Request, Response, NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  userId?: number;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
      decoded.userId <= 0
    ) {
      res.status(401).json({
        message: 'Invalid authentication token',
      });
      return;
    }

    req.userId = decoded.userId;

    next();
  } catch {
    res.status(401).json({
      message: 'Invalid or expired authentication token',
    });
  }
};
