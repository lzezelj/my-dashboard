import jwt from 'jsonwebtoken';

export function generateJwt(userId: number, sessionVersion = 0): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign({ userId, sessionVersion }, jwtSecret, { expiresIn: '1d', algorithm: 'HS256' });
}
