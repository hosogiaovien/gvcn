import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import userHandler from './api/users/index';
import updateUserHandler from './api/users/update';
import resetPasswordHandler from './api/users/reset-password';
import statusHandler from './api/users/status';
import seedHandler from './api/seed';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// API Routes compatible with Vercel Serverless
app.all('/api/users/reset-password', (req, res) => {
  resetPasswordHandler(req as any, res as any);
});

app.all('/api/users/status', (req, res) => {
  statusHandler(req as any, res as any);
});

app.all('/api/users/update', (req, res) => {
  updateUserHandler(req as any, res as any);
});

app.all('/api/users', (req, res) => {
  userHandler(req as any, res as any);
});

app.all('/api/seed', (req, res) => {
  seedHandler(req as any, res as any);
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Mount Vite middleware in development
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
