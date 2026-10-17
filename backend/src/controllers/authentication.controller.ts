import type { NextFunction, Request, Response } from 'express';
import type { TokenPayload } from 'google-auth-library';
import type { AuthenticatedRequest } from '../middleware/authenticationMiddleware.js';
import {
  authenticateDemoUser,
  createDemoUser,
  deleteDemoUser,
  findGoogleUser,
  listDemoUsers,
  normalizeDemoUsername,
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
  user: {
    id: number;
    email: string | null;
    name: string | null;
    googleId?: string | null;
    isDemo?: boolean;
    sessionVersion?: number;
  },
) => {
  const token = generateJwt(user.id, user.sessionVersion ?? 0);
  res.cookie('auth_token', token, {
    ...sessionCookieOptions(),
    maxAge: 24 * 60 * 60 * 1000,
  });
  return res.status(200).json({
    message: 'Authentication successful',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isDemo: user.isDemo === true,
      canManageDemoAccounts:
        Boolean(user.googleId) && user.email?.toLowerCase() === getOwnerGoogleEmail(),
    },
  });
};

const getOwnerGoogleEmail = () =>
  (process.env.OWNER_GOOGLE_EMAIL ?? 'lovro.zezelj@gmail.com').trim().toLowerCase();

const isValidDemoUsername = (username: string) =>
  /^[a-z0-9][a-z0-9._-]{2,63}$/.test(normalizeDemoUsername(username));

const isPrismaUniqueConstraintError = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';

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

export const loginWithDemoAccount = async (req: Request, res: Response) => {
  const { username, password } = req.body ?? {};
  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    !isValidDemoUsername(username) ||
    password.length < 12 ||
    password.length > 128
  ) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  try {
    const user = await authenticateDemoUser(username, password);
    if (!user) return res.status(401).json({ message: 'Invalid username or password' });
    return createSession(res, user);
  } catch (error) {
    console.error('Could not log in to demo account:', error);
    return res.status(500).json({ message: 'Could not complete login' });
  }
};

export const requireDemoAccountOwner = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.userId === undefined) return res.status(401).json({ message: 'Authentication required' });

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { email: true, googleId: true },
    });
    if (!user?.googleId || user.email?.toLowerCase() !== getOwnerGoogleEmail()) {
      return res.status(403).json({ message: 'Owner access required' });
    }
    next();
  } catch (error) {
    console.error('Could not verify demo-account owner:', error);
    return res.status(500).json({ message: 'Could not verify owner access' });
  }
};

export const createDemoAccount = async (req: Request, res: Response) => {
  const { username, label, salutation, position, source, companyAddress } = req.body ?? {};
  if (typeof username !== 'string' || !isValidDemoUsername(username)) {
    return res.status(400).json({
      message:
        'Username must be 3-64 characters using letters, numbers, dots, dashes or underscores',
    });
  }
  if (label !== undefined && (typeof label !== 'string' || label.trim().length > 100)) {
    return res.status(400).json({ message: 'Label must be 100 characters or fewer' });
  }
  for (const [field, value, maximum] of [
    ['Salutation', salutation, 150],
    ['Position', position, 150],
    ['Source', source, 300],
    ['Company address', companyAddress, 500],
  ] as const) {
    if (value !== undefined && (typeof value !== 'string' || value.trim().length > maximum)) {
      return res.status(400).json({ message: `${field} must be ${maximum} characters or fewer` });
    }
  }

  try {
    const result = await createDemoUser(username, label?.trim() || null, {
      salutation: salutation?.trim() || null,
      position: position?.trim() || null,
      source: source?.trim() || null,
      companyAddress: companyAddress?.trim() || null,
    });
    return res.status(201).json({
      account: {
        ...result.user,
        eventCount: 0,
      },
      password: result.password,
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      return res.status(409).json({ message: 'That demo username is already in use' });
    }
    console.error('Could not create demo account:', error);
    return res.status(500).json({ message: 'Could not create demo account' });
  }
};

export const getDemoAccounts = async (_req: Request, res: Response) => {
  try {
    const accounts = (await listDemoUsers()).map(({ _count, ...account }) => ({
      ...account,
      eventCount: _count.events,
    }));
    return res.status(200).json({ accounts });
  } catch (error) {
    console.error('Could not list demo accounts:', error);
    return res.status(500).json({ message: 'Could not list demo accounts' });
  }
};

export const removeDemoAccount = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid demo account id' });
  }

  try {
    const result = await deleteDemoUser(id);
    if (result.count === 0) return res.status(404).json({ message: 'Demo account not found' });
    return res.status(204).send();
  } catch (error) {
    console.error('Could not delete demo account:', error);
    return res.status(500).json({ message: 'Could not delete demo account' });
  }
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  if (req.userId === undefined) return res.status(401).json({ message: 'Authentication required' });
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, googleId: true, isDemo: true },
    });
    if (!user) return res.status(401).json({ message: 'User no longer exists' });
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isDemo: user.isDemo,
        canManageDemoAccounts:
          Boolean(user.googleId) && user.email?.toLowerCase() === getOwnerGoogleEmail(),
      },
    });
  } catch (error) {
    console.error('Failed to retrieve current user:', error);
    return res.status(500).json({ message: 'Could not retrieve user' });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  if (req.userId !== undefined) {
    await prisma.user.updateMany({
      where: { id: req.userId },
      data: { sessionVersion: { increment: 1 } },
    });
  }
  res.clearCookie('auth_token', sessionCookieOptions());
  return res.status(200).json({ message: 'Logged out successfully' });
};

export const deleteAccount = async (req: AuthenticatedRequest, res: Response) => {
  if (req.userId === undefined) return res.status(401).json({ message: 'Authentication required' });
  const fifteenMinutes = 15 * 60;
  if (!req.authIssuedAt || Math.floor(Date.now() / 1000) - req.authIssuedAt > fifteenMinutes) {
    return res.status(401).json({ message: 'Please sign in again before deleting your account' });
  }
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
