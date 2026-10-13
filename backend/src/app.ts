import express from 'express';
import eventRoutes from './routes/events.routes.js';
import cors from 'cors';

const app = express();
const PORT = 3000;

app.use(
  cors({
    origin: 'http://localhost:5173',
  }),
);
app.use(express.json());
app.use('/api/events', eventRoutes);
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is running',
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
