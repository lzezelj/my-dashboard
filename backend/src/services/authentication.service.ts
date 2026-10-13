import { OAuth2Client } from 'google-auth-library';
import type { TokenPayload } from 'google-auth-library';
import { prisma } from '../lib/prisma.js';

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

export async function findOrCreateGoogleUser(payload: TokenPayload) {
  if (!payload.sub || !payload.email || !payload.email_verified) {
    throw new Error('Invalid Google account information');
  }

  const user = await prisma.user.upsert({
    where: {
      googleId: payload.sub,
    },
    update: {
      name: payload.name ?? null,
    },
    create: {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name ?? null,
    },
  });

  return user;
}
