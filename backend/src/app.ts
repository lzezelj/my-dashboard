import 'dotenv/config';
import express from 'express';
import eventRoutes from './routes/events.routes.js';
import authenticationRoutes from './routes/authentication.routes.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { apiRateLimiter } from './middleware/rateLimiters.js';

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: '6mb' }));
app.use(cookieParser());
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
