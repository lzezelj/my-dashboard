import type { NextFunction, Request, Response } from 'express';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 20;
const attempts = new Map<string, { count: number; resetsAt: number }>();

export const demoLoginRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const current = attempts.get(key);

  if (!current || current.resetsAt <= now) {
    attempts.set(key, { count: 1, resetsAt: now + WINDOW_MS });
    next();
    return;
  }

  current.count += 1;
  if (current.count > MAX_ATTEMPTS) {
    res.setHeader('Retry-After', Math.ceil((current.resetsAt - now) / 1000));
    res.status(429).json({ message: 'Too many login attempts. Please try again later.' });
    return;
  }

  next();
};

export const resetDemoLoginRateLimitForTests = () => attempts.clear();
