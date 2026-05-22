import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar rutas
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import vendorRoutes from './routes/vendors.js';
import quoteRoutes from './routes/quotes.js';
import uploadRoutes from './routes/upload.js';
import whatsappRoutes from './routes/whatsapp.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── MIDDLEWARE GLOBAL ───────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── ARCHIVOS ESTÁTICOS (imágenes subidas) ───────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── HEALTH CHECK ────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// ─── RUTAS DE LA API ─────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// ─── 404 ─────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ─── ERROR HANDLER ───────────────────────────────
app.use(errorHandler);

// ─── INICIAR SERVIDOR ────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   🥬 VerduleriApp Backend                    ║
  ║   🚀 Servidor corriendo en puerto ${PORT}       ║
  ║   📡 API: http://localhost:${PORT}/api         ║
  ║   ❤️  Health: http://localhost:${PORT}/api/health║
  ╚══════════════════════════════════════════════╝
  `);
});

export default app;
