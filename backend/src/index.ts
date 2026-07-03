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
import reportRoutes from './routes/reports.js';
import { verifyWebhookSignature } from './services/stripe.service.js';
import { markQuotePaid } from './services/quote.service.js';
import { ensureVendorAccessCodes } from './services/vendor-bot.service.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── WEBHOOK DE STRIPE ───────────────────────────
// Va ANTES de express.json() porque la firma se verifica sobre el body crudo.
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string | undefined;
    if (!sig || !verifyWebhookSignature(req.body, sig)) {
      res.status(400).json({ error: 'Firma inválida' });
      return;
    }
    try {
      const event = JSON.parse(req.body.toString('utf8'));
      if (event.type === 'checkout.session.completed') {
        const session = event.data?.object;
        const quoteId = session?.metadata?.quoteId || session?.client_reference_id;
        if (quoteId && session?.payment_status === 'paid') {
          await markQuotePaid(quoteId, 'stripe');
          console.log(`💳 Pago confirmado por webhook de Stripe: pedido ${quoteId}`);
        }
      }
      res.json({ received: true });
    } catch (err) {
      console.error('Error procesando webhook de Stripe:', err);
      res.status(500).json({ error: 'Error interno' });
    }
  },
);

// ─── MIDDLEWARE GLOBAL ───────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000',
    ].filter(Boolean) as string[];

    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.some(allowed => origin.startsWith(allowed)) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  credentials: true,
}));
// Guardamos el body crudo para poder verificar la firma del webhook de Meta
app.use(express.json({
  verify: (req, _res, buf) => {
    (req as any).rawBody = buf;
  },
}));
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
app.use('/api/reports', reportRoutes);

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
  // Generar códigos de productor para vendedores que no tengan
  ensureVendorAccessCodes().catch(err =>
    console.error('Error generando códigos de productor:', err),
  );
});

export default app;
