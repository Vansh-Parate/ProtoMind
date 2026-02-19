import 'dotenv/config';

// BigInt cannot be serialized by JSON.stringify by default.
// Supabase/PostgreSQL returns BigInt IDs which need this polyfill.
(BigInt.prototype as any).toJSON = function () {
  return String(this);
};

import express from 'express';
import cors from 'cors';
import { casesRouter } from './api/cases';
import { sarRouter } from './api/sar';
import { auditRouter } from './api/audit';

const app = express();

app.use(
  cors({
    origin: ['https://proto-mind.vercel.app', 'http://localhost:5173','https://protomind-backend.onrender.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.options('*', cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/cases', casesRouter);
app.use('/sar', sarRouter);
app.use('/audit', auditRouter);

// Basic error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const isDbUnreachable =
    err?.name === 'PrismaClientInitializationError' ||
    (err?.message && String(err.message).includes("Can't reach database server"));

  if (isDbUnreachable) {
    console.error('Database unreachable:', err?.message ?? err);
    res.status(503).json({
      message:
        'Database unavailable. Check that your Supabase project is active and the connection strings are correct.'
    });
    return;
  }

  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

export { app };


