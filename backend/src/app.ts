import 'dotenv/config';
import express from 'express';
import eventRoutes from './routes/events.routes.js';
import authenticationRoutes from './routes/authentication.routes.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';

export const app = express();
const PORT = 3000;

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json({ limit: '6mb' }));
app.use(cookieParser());
app.use('/api/events', eventRoutes);
app.use('/api/auth', authenticationRoutes);
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is running',
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
