import type { NextFunction, Request, Response } from 'express';

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // The frontend and API are intentionally hosted on different sites.
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}

export function noStoreApiResponses(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  next();
}

export function verifyMutationOrigin(req: Request, res: Response, next: NextFunction) {
  if (!unsafeMethods.has(req.method) || process.env.NODE_ENV !== 'production') return next();

  const expectedOrigin = process.env.FRONTEND_ORIGIN;
  const suppliedOrigin = req.get('Origin');
  if (!expectedOrigin || suppliedOrigin !== expectedOrigin) {
    return res.status(403).json({ message: 'Request origin is not allowed' });
  }
  next();
}
