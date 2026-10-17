import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthenticatedRequest } from '../src/middleware/authenticationMiddleware.js';

const authService = vi.hoisted(() => ({
  authenticateDemoUser: vi.fn(),
  createDemoUser: vi.fn(),
  deleteDemoUser: vi.fn(),
  findGoogleUser: vi.fn(),
  listDemoUsers: vi.fn(),
  normalizeDemoUsername: (username: string) => username.trim().toLowerCase(),
  registerGoogleUser: vi.fn(),
  verifyGoogleToken: vi.fn(),
}));

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
}));

vi.mock('../src/services/authentication.service.js', () => authService);
vi.mock('../src/lib/prisma.js', () => ({ prisma: prismaMock }));

import {
  createDemoAccount,
  loginWithDemoAccount,
  requireDemoAccountOwner,
} from '../src/controllers/authentication.controller.js';

const response = () => {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
    cookie: vi.fn(),
    clearCookie: vi.fn(),
    send: vi.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  res.cookie.mockReturnValue(res);
  res.clearCookie.mockReturnValue(res);
  res.send.mockReturnValue(res);
  return res as unknown as Response;
};

describe('demo account authentication and owner access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('JWT_SECRET', 'demo-test-secret');
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('OWNER_GOOGLE_EMAIL', 'lovro.zezelj@gmail.com');
  });

  it('allows only the configured Google account to manage demo accounts', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      email: 'lovro.zezelj@gmail.com',
      googleId: 'owner-google-id',
    });
    const next = vi.fn();
    const res = response();

    await requireDemoAccountOwner({ userId: 1 } as AuthenticatedRequest, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects a demo user even if its record somehow contains the owner email', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      email: 'lovro.zezelj@gmail.com',
      googleId: null,
    });
    const next = vi.fn();
    const res = response();

    await requireDemoAccountOwner({ userId: 2 } as AuthenticatedRequest, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('creates a session for valid demo credentials without returning a password hash', async () => {
    authService.authenticateDemoUser.mockResolvedValue({
      id: 7,
      email: null,
      name: 'Example Company',
      googleId: null,
      isDemo: true,
      passwordHash: 'secret-hash',
    });
    const res = response();

    await loginWithDemoAccount(
      { body: { username: 'example-company', password: 'a-long-demo-password' } } as Request,
      res,
    );

    expect(res.cookie).toHaveBeenCalledOnce();
    expect(res.json).toHaveBeenCalledWith({
      message: 'Authentication successful',
      user: {
        id: 7,
        email: null,
        name: 'Example Company',
        isDemo: true,
        canManageDemoAccounts: false,
      },
    });
  });

  it('returns a generated password only when the owner creates an account', async () => {
    authService.createDemoUser.mockResolvedValue({
      user: {
        id: 8,
        demoUsername: 'example-company',
        name: 'Example Company',
        createdAt: new Date('2026-10-15T12:00:00Z'),
      },
      password: 'generated-password-value',
    });
    const res = response();

    await createDemoAccount(
      {
        body: {
          username: 'Example-Company',
          label: 'Example Company',
          salutation: 'Sehr geehrte Frau Beispiel',
          position: 'Softwareentwickler',
          source: 'Ihre Stellenanzeige auf der Firmenwebsite',
          companyAddress: 'Musterstraße 1',
        },
      } as Request,
      res,
    );

    expect(authService.createDemoUser).toHaveBeenCalledWith('Example-Company', 'Example Company', {
      salutation: 'Sehr geehrte Frau Beispiel',
      position: 'Softwareentwickler',
      source: 'Ihre Stellenanzeige auf der Firmenwebsite',
      companyAddress: 'Musterstraße 1',
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ password: 'generated-password-value' }),
    );
  });
});
