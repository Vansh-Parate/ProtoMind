import { app } from '../backend/src/app';

export default function handler(req: any, res: any) {
  // When deployed, this function is mounted under `/api/*`.
  // Our Express app routes are defined without the `/api` prefix.
  if (typeof req.url === 'string' && req.url.startsWith('/api')) {
    req.url = req.url.slice('/api'.length) || '/';
  }

  return app(req as any, res as any);
}

