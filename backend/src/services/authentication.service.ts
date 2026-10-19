import { OAuth2Client } from 'google-auth-library';
import type { TokenPayload } from 'google-auth-library';
import { promisify } from 'node:util';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { prisma } from '../lib/prisma.js';

const scrypt = promisify(scryptCallback);
const PASSWORD_KEY_LENGTH = 64;
const DATABASE_WAKE_DELAYS_MS = [400, 800, 1_200];
const TRANSIENT_DATABASE_CODES = new Set([
  'P1001',
  'P1002',
  'P1017',
  'P2024',
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  '08001',
  '08006',
  '57P03',
]);

const transientDatabaseError = (error: unknown) => {
  let current = error;
  for (let depth = 0; depth < 4 && current && typeof current === 'object'; depth += 1) {
    const candidate = current as { code?: unknown; message?: unknown; cause?: unknown };
    if (typeof candidate.code === 'string' && TRANSIENT_DATABASE_CODES.has(candidate.code))
      return true;
    if (
      typeof candidate.message === 'string' &&
      /connect|connection.*(?:closed|refused|reset|terminated)|database system is starting up/i.test(
        candidate.message,
      )
    )
      return true;
    current = candidate.cause;
  }
  return false;
};

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

async function withDatabaseWakeRetry<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const delay = DATABASE_WAKE_DELAYS_MS[attempt];
      if (delay === undefined || !transientDatabaseError(error)) throw error;
      await wait(delay);
    }
  }
}

const derivePasswordKey = async (password: string, salt: string) =>
  (await scrypt(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;

export const normalizeDemoUsername = (username: string) => username.trim().toLowerCase();

export const hashDemoPassword = async (password: string) => {
  const salt = randomBytes(16).toString('hex');
  const key = await derivePasswordKey(password, salt);
  return `scrypt$${salt}$${key.toString('hex')}`;
};

export const verifyDemoPassword = async (password: string, storedHash: string | null) => {
  const [, salt, expectedHex] = storedHash?.split('$') ?? [];
  if (!salt || !expectedHex) {
    await derivePasswordKey(password, 'invalid-demo-account');
    return false;
  }

  const expected = Buffer.from(expectedHex, 'hex');
  const actual = await derivePasswordKey(password, salt);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};

export async function verifyGoogleToken(idToken: string) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    throw new Error('GOOGLE_CLIENT_ID is not defined');
  }

  const client = new OAuth2Client(googleClientId);

  const ticket = await client.verifyIdToken({
    idToken,
    audience: googleClientId,
  });

  return ticket.getPayload();
}

export async function findGoogleUser(googleId: string) {
  return withDatabaseWakeRetry(() => prisma.user.findUnique({ where: { googleId } }));
}

export async function registerGoogleUser(payload: TokenPayload) {
  if (!payload.sub || !payload.email || !payload.email_verified) {
    throw new Error('Invalid Google account information');
  }

  return prisma.user.create({
    data: {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name ?? null,
    },
  });
}

export async function authenticateDemoUser(username: string, password: string) {
  const user = await withDatabaseWakeRetry(() =>
    prisma.user.findUnique({
      where: { demoUsername: normalizeDemoUsername(username) },
    }),
  );

  if (!user?.isDemo || !(await verifyDemoPassword(password, user.passwordHash))) return null;
  return user;
}

export type DemoApplicationDetails = {
  salutation: string | null;
  position: string | null;
  source: string | null;
  companyAddress: string | null;
};

export async function createDemoUser(
  username: string,
  label: string | null,
  application: DemoApplicationDetails,
) {
  const password = randomBytes(18).toString('base64url');
  const user = await prisma.user.create({
    data: {
      demoUsername: normalizeDemoUsername(username),
      passwordHash: await hashDemoPassword(password),
      isDemo: true,
      name: label,
      applicationSalutation: application.salutation,
      applicationPosition: application.position,
      applicationSource: application.source,
      applicationCompanyAddress: application.companyAddress,
    },
    select: {
      id: true,
      demoUsername: true,
      name: true,
      createdAt: true,
      applicationSalutation: true,
      applicationPosition: true,
      applicationSource: true,
      applicationCompanyAddress: true,
    },
  });

  return { user, password };
}

export function listDemoUsers() {
  return prisma.user.findMany({
    where: { isDemo: true },
    select: {
      id: true,
      demoUsername: true,
      name: true,
      createdAt: true,
      applicationSalutation: true,
      applicationPosition: true,
      applicationSource: true,
      applicationCompanyAddress: true,
      _count: { select: { events: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export function deleteDemoUser(id: number) {
  return prisma.user.deleteMany({ where: { id, isDemo: true } });
}
