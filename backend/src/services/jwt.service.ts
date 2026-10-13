import jwt from 'jsonwebtoken';

export function generateJwt(userId: number): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign({ userId }, jwtSecret, { expiresIn: '1d', algorithm: 'HS256' });
}
