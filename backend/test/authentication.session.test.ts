import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authService = vi.hoisted(() => ({
  authenticateDemoUser: vi.fn(),
  createDemoUser: vi.fn(),
  deleteDemoUser: vi.fn(),
  verifyGoogleToken: vi.fn(),
  findGoogleUser: vi.fn(),
  listDemoUsers: vi.fn(),
  normalizeDemoUsername: (username: string) => username.trim().toLowerCase(),
  registerGoogleUser: vi.fn(),
}));

vi.mock('../src/services/authentication.service.js', () => authService);

import { loginWithGoogle, logout } from '../src/controllers/authentication.controller.js';

const response = () => {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  res.cookie.mockReturnValue(res);
  res.clearCookie.mockReturnValue(res);
  return res as unknown as Response;
};

describe('authentication sessions', () => {
  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', 'test-session-secret');
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('ALLOWED_GOOGLE_EMAILS', '');
    authService.verifyGoogleToken.mockReset();
    authService.findGoogleUser.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('creates an HTTP-only session cookie after Google login', async () => {
    authService.verifyGoogleToken.mockResolvedValue({
      sub: 'google-user-1',
      email: 'user@example.com',
      email_verified: true,
      name: 'Test User',
    });
    authService.findGoogleUser.mockResolvedValue({
      id: 7,
      email: 'user@example.com',
      name: 'Test User',
    });
    const req = { body: { credential: 'google-token' } } as Request;
    const res = response();

    await loginWithGoogle(req, res);

    expect(res.cookie).toHaveBeenCalledOnce();
    const [name, token, options] = (res.cookie as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0]!;
    expect(name).toBe('auth_token');
    expect(jwt.verify(token as string, process.env.JWT_SECRET!)).toMatchObject({ userId: 7 });
    expect(options).toMatchObject({
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 86_400_000,
      path: '/',
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('uses the Secure cookie flag in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    authService.verifyGoogleToken.mockResolvedValue({
      sub: 'google-user-1',
      email: 'user@example.com',
      email_verified: true,
    });
    authService.findGoogleUser.mockResolvedValue({ id: 7, email: 'user@example.com', name: null });
    const res = response();

    await loginWithGoogle({ body: { credential: 'google-token' } } as Request, res);

    expect((res.cookie as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![2]).toMatchObject({
      secure: true,
    });
  });

  it('rejects a missing Google credential without creating a session', async () => {
    const res = response();

    await loginWithGoogle({ body: {} } as Request, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Google credential is required' });
    expect(res.cookie).not.toHaveBeenCalled();
    expect(authService.verifyGoogleToken).not.toHaveBeenCalled();
  });

  it('rejects an invalid Google credential without creating a session', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    authService.verifyGoogleToken.mockRejectedValue(new Error('invalid token'));
    const res = response();

    await loginWithGoogle({ body: { credential: 'invalid' } } as Request, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid Google credential' });
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('clears the authentication cookie on logout', () => {
    const res = response();

    logout({} as Request, res);

    expect(res.clearCookie).toHaveBeenCalledWith('auth_token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
  });
});
