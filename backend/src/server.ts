import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import { casesRouter } from './api/cases';
import { sarRouter } from './api/sar';
import { auditRouter } from './api/audit';

const app = express();

app.use(cors());
app.use(json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/cases', casesRouter);
app.use('/sar', sarRouter);
app.use('/audit', auditRouter);

// Basic error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`ProtoMind backend listening on http://localhost:${port}`);
});

