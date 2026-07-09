import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import { createQuoteSchema, updateQuoteStatusSchema } from '../types/index.js';
import * as quoteService from '../services/quote.service.js';
import { qs, qn } from '../utils/query.js';
import { sendWhatsAppMessage, generateWhatsAppLink } from '../services/whatsapp.service.js';
import * as stripeService from '../services/stripe.service.js';
import QRCode from 'qrcode';

const router = Router();

// ─── CREAR COTIZACIÓN (público o autenticado) ────
// POST /api/quotes
router.post(
  '/',
  optionalAuth,
  validate(createQuoteSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quote = await quoteService.createQuote(
        req.body,
        req.user?.userId,
      );

      // Agrupar items por vendedor y generar links/mensajes de WhatsApp
      const vendorGroups = new Map<string, typeof quote.items>();
      for (const item of quote.items) {
        const key = item.vendorId;
        if (!vendorGroups.has(key)) vendorGroups.set(key, []);
        vendorGroups.get(key)!.push(item);
      }

      const whatsappLinks: Array<{ vendorName: string; link: string }> = [];

      for (const [, items] of vendorGroups) {
        const vendor = items[0].vendor;
        const vendorTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

        const result = await sendWhatsAppMessage({
          vendorWhatsapp: vendor.whatsapp,
          vendorName: vendor.businessName,
          customerName: quote.customerName,
          customerPhone: quote.customerPhone,
          items: items.map(i => ({
            name: i.product.name,
            quantity: i.quantity,
            price: i.price,
            unit: i.unit,
          })),
          total: vendorTotal,
          quoteId: quote.id,
          notes: quote.notes || undefined,
        });

        if (result.waLink) {
          whatsappLinks.push({
            vendorName: vendor.businessName,
            link: result.waLink,
          });
        }
      }

      res.status(201).json({ ...quote, whatsappLinks });
    } catch (error) {
      next(error);
    }
  },
);

// ─── PAGOS (pasarela) ────────────────────────────

// GET /api/quotes/:id/pay-info — Info pública del pedido para pagar (sin auth)
router.get(
  '/:id/pay-info',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quote = await quoteService.getQuoteForPayment(req.params.id as string);
      // stripeEnabled le dice al frontend si mostrar Stripe o el checkout demo
      res.json({ ...quote, stripeEnabled: stripeService.stripeEnabled() });
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/quotes/:id/qr.png — Código QR del pedido (para etiquetar paquetes)
// Se imprime y pega en la caja: al escanearlo abre la página del pedido con
// el nombre del cliente, los productos y el estado de pago.
router.get(
  '/:id/qr.png',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Valida que el pedido exista (404 si no)
      const quote = await quoteService.getQuoteForPayment(req.params.id as string);
      const frontendUrl = process.env.FRONTEND_URL || 'https://verduleriapp.vercel.app';
      const png = await QRCode.toBuffer(`${frontendUrl}/pago/${quote.id}`, {
        width: 380,
        margin: 1,
        color: { dark: '#1B4332', light: '#FFFFFF' },
      });
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `inline; filename="pedido-${quote.id}.png"`);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // el QR de un pedido no cambia
      res.send(png);
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/quotes/:id/checkout — Crear sesión de Stripe Checkout (sin auth)
// Devuelve la URL de Stripe a la que hay que redirigir al cliente.
router.post(
  '/:id/checkout',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quote = await quoteService.getQuoteForPayment(req.params.id as string);
      if (quote.paymentStatus === 'PAID') {
        res.json({ mode: 'paid' });
        return;
      }
      if (!stripeService.stripeEnabled()) {
        res.json({ mode: 'demo' }); // sin llaves de Stripe → checkout demo
        return;
      }
      const frontendUrl = process.env.FRONTEND_URL || 'https://verduleriapp.vercel.app';
      const session = await stripeService.createCheckoutSession(quote, frontendUrl);
      res.json({ mode: 'stripe', url: session.url });
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/quotes/:id/verify-payment?session_id=... — Confirmar pago al volver
// de Stripe (respaldo del webhook: funciona aunque el webhook no esté configurado)
router.get(
  '/:id/verify-payment',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quoteId = req.params.id as string;
      const sessionId = req.query.session_id as string;
      if (!sessionId || !stripeService.stripeEnabled()) {
        res.status(400).json({ error: 'Sesión de pago inválida' });
        return;
      }
      const session = await stripeService.getCheckoutSession(sessionId);
      const sessionQuoteId = session.metadata?.quoteId || session.client_reference_id;
      if (session.payment_status === 'paid' && sessionQuoteId === quoteId) {
        const quote = await quoteService.markQuotePaid(quoteId, 'stripe');
        res.json({ success: true, paymentStatus: quote.paymentStatus });
        return;
      }
      res.json({ success: false, paymentStatus: 'UNPAID' });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/quotes/:id/pay — Procesar el pago (DEMO: simulado, sin auth)
router.post(
  '/:id/pay',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Con Stripe activo, el pago demo queda deshabilitado (nadie puede
      // marcar un pedido como pagado sin pasar por Stripe)
      if (stripeService.stripeEnabled()) {
        res.status(400).json({ error: 'El pago demo está deshabilitado. Usa el checkout de Stripe.' });
        return;
      }
      const method = (req.body?.method as string) || 'demo';
      const quote = await quoteService.markQuotePaid(req.params.id as string, method);
      res.json({ success: true, paymentStatus: quote.paymentStatus, quoteId: quote.id });
    } catch (error) {
      next(error);
    }
  },
);

// ─── LISTAR COTIZACIONES ─────────────────────────

// GET /api/quotes — Admin ve todas, vendedor ve las suyas
router.get(
  '/',
  authenticate,
  authorize('VENDOR', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let vendorId: string | undefined;
      if (req.user!.role === 'VENDOR') {
        const { prisma } = await import('../config/prisma.js');
        const vendor = await prisma.vendor.findUnique({
          where: { userId: req.user!.userId },
          select: { id: true },
        });
        vendorId = vendor?.id;
      }

      const result = await quoteService.listQuotes({
        status: qs(req.query.status),
        vendorId,
        page: qn(req.query.page),
        limit: qn(req.query.limit),
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/quotes/stats — Estadísticas
router.get(
  '/stats',
  authenticate,
  authorize('VENDOR', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let vendorId: string | undefined;
      if (req.user!.role === 'VENDOR') {
        const { prisma } = await import('../config/prisma.js');
        const vendor = await prisma.vendor.findUnique({
          where: { userId: req.user!.userId },
          select: { id: true },
        });
        vendorId = vendor?.id;
      }

      const stats = await quoteService.getQuoteStats(vendorId);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/quotes/:id — Obtener cotización
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let vendorId: string | undefined;
      if (req.user!.role === 'VENDOR') {
        const { prisma } = await import('../config/prisma.js');
        const vendor = await prisma.vendor.findUnique({
          where: { userId: req.user!.userId },
          select: { id: true },
        });
        vendorId = vendor?.id;
      }

      const quote = await quoteService.getQuoteById(req.params.id as string, vendorId);
      res.json(quote);
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /api/quotes/:id/status — Cambiar estado
router.patch(
  '/:id/status',
  authenticate,
  authorize('VENDOR', 'ADMIN'),
  validate(updateQuoteStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let vendorId: string | undefined;
      if (req.user!.role === 'VENDOR') {
        const { prisma } = await import('../config/prisma.js');
        const vendor = await prisma.vendor.findUnique({
          where: { userId: req.user!.userId },
          select: { id: true },
        });
        vendorId = vendor?.id;
      }

      const quote = await quoteService.updateQuoteStatus(
        req.params.id as string,
        req.body.status,
        vendorId,
      );
      res.json(quote);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
