import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import apiRouter, { seedDefaultDatabase } from './server/routes/api';

const PORT = 3000;

async function startServer() {
  const app = express();

  // Set trust proxy so express-rate-limit can accurately detect client IP behind Cloud Run
  app.set('trust proxy', 1);

  // MIDDLEWARES
  app.use(express.json());
  app.use(cors());

  // Use helmet with relaxation for iframe and scripts
  app.use(helmet({
    contentSecurityPolicy: false, // relaxed for preview inside iframe
    crossOriginEmbedderPolicy: false,
  }));

  // Logging
  app.use(morgan('dev'));

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per windowMs
    message: { success: false, message: 'Too many requests, please try again later.' },
    validate: { trustProxy: false }, // Disable trust proxy warning checks
  });
  app.use('/api/', limiter);

  // SUPABASE SEEDING (Graceful)
  try {
    console.log('Initializing and seeding default Supabase database...');
    await seedDefaultDatabase();
    console.log('✅ Supabase database initialization/checks complete.');
  } catch (err: any) {
    console.error('❌ Supabase initialization error:', err.message || err);
  }

  // API ROUTES (FIRST)
  app.use('/api', apiRouter);

  // VITE MIDDLEWARE OR STATIC SERVING (AFTER API ROUTES)
  if (process.env.NODE_ENV !== 'production') {
    console.log('Starting server in DEVELOPMENT mode with Vite Middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Starting server in PRODUCTION mode...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Full-stack application running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Onstart Error:', err);
});
