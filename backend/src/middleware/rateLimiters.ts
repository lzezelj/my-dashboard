import type { Request } from 'express';
import { isIP } from 'node:net';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

type LimiterOptions = {
  identifier: string;
  limit: number;
  message: string;
  windowMs: number;
};

const positiveIntegerFromEnvironment = (name: string, fallback: number) => {
  const configured = process.env[name];
  if (configured === undefined) return fallback;

  const value = Number(configured);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
};

const clientIpKey = (req: Request) => {
  const railwayIpHeader = process.env.NODE_ENV === 'production' ? req.get('x-real-ip') : undefined;
  const railwayIp = railwayIpHeader?.split(',')[0]?.trim();
  const ip = railwayIp && isIP(railwayIp) ? railwayIp : req.ip || req.socket.remoteAddress;
  return ipKeyGenerator(ip || 'unknown');
};

export const createRequestRateLimiter = ({
  identifier,
  limit,
  message,
  windowMs,
}: LimiterOptions) =>
  rateLimit({
    identifier,
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: clientIpKey,
    handler: (_req, res) => res.status(429).json({ message }),
  });

const windowMs = positiveIntegerFromEnvironment('API_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000);

export const apiRateLimiter = createRequestRateLimiter({
  identifier: 'api',
  windowMs,
  limit: positiveIntegerFromEnvironment('API_RATE_LIMIT_MAX', 300),
  message: 'Too many API requests. Please try again later.',
});

export const authenticationRateLimiter = createRequestRateLimiter({
  identifier: 'authentication',
  windowMs,
  limit: positiveIntegerFromEnvironment('AUTH_RATE_LIMIT_MAX', 20),
  message: 'Too many authentication attempts. Please try again later.',
});
