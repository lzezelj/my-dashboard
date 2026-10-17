import 'dotenv/config';
import express from 'express';
import eventRoutes from './routes/events.routes.js';
import authenticationRoutes from './routes/authentication.routes.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { apiRateLimiter } from './middleware/rateLimiters.js';
import {
  noStoreApiResponses,
  securityHeaders,
  verifyMutationOrigin,
} from './middleware/security.js';

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';

if (process.env.NODE_ENV === 'production') {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'GOOGLE_CLIENT_ID',
    'FRONTEND_ORIGIN',
    'ALLOWED_GOOGLE_EMAILS',
    'OWNER_GOOGLE_EMAIL',
  ];
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) throw new Error(`Missing required production configuration: ${missing.join(', ')}`);
  if ((process.env.JWT_SECRET?.length ?? 0) < 32) throw new Error('JWT_SECRET must be at least 32 characters');
}

app.disable('x-powered-by');
app.use(securityHeaders);
app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: '6mb' }));
app.use(cookieParser());
app.use('/api', noStoreApiResponses);
app.use('/api', verifyMutationOrigin);
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is running',
  });
});
app.use('/api', apiRateLimiter);
app.use('/api/events', eventRoutes);
app.use('/api/auth', authenticationRoutes);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
