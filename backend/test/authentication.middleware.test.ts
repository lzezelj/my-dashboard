import type { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  authMiddleware,
  type AuthenticatedRequest,
} from '../src/middleware/authenticationMiddleware.js';
import { generateJwt } from '../src/services/jwt.service.js';

const response = () => {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res as unknown as Response;
};

describe('authentication middleware', () => {
  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', 'test-secret-that-is-not-used-in-production');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('rejects requests without an authentication cookie', () => {
    const req = { cookies: {} } as AuthenticatedRequest;
    const res = response();
    const next = vi.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts a valid session and attaches its user id', () => {
    const req = { cookies: { auth_token: generateJwt(42) } } as unknown as AuthenticatedRequest;
    const res = response();
    const next = vi.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(req.userId).toBe(42);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it.each([
    ['a token signed with another secret', () => jwt.sign({ userId: 42 }, 'wrong-secret')],
    [
      'an expired token',
      () =>
        jwt.sign({ userId: 42 }, process.env.JWT_SECRET!, {
          expiresIn: -1,
          algorithm: 'HS256',
        }),
    ],
    [
      'a token using a disallowed algorithm',
      () => jwt.sign({ userId: 42 }, process.env.JWT_SECRET!, { algorithm: 'HS384' }),
    ],
  ])('rejects %s', (_description, createToken) => {
    const req = {
      cookies: { auth_token: createToken() },
    } as unknown as AuthenticatedRequest;
    const res = response();
    const next = vi.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired authentication token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a validly signed token with an invalid user id', () => {
    const token = jwt.sign({ userId: -1 }, process.env.JWT_SECRET!, { algorithm: 'HS256' });
    const req = { cookies: { auth_token: token } } as unknown as AuthenticatedRequest;
    const res = response();
    const next = vi.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid authentication token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('fails closed when the JWT secret is missing', () => {
    vi.stubEnv('JWT_SECRET', '');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const req = { cookies: { auth_token: 'anything' } } as unknown as AuthenticatedRequest;
    const res = response();
    const next = vi.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Server configuration error' });
    expect(next).not.toHaveBeenCalled();
  });
});
