import express from 'express';
import { app } from './app';

const port = Number(process.env.PORT || 4000);

// Only start the HTTP server when running this file directly (local dev, scripts).
if (require.main === module) {
  app.listen(port, () => {
    console.log(`ProtoMind backend listening on http://localhost:${port}`);
  });
}

