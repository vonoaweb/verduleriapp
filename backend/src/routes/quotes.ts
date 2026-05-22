import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import { createQuoteSchema, updateQuoteStatusSchema } from '../types/index.js';
import * as quoteService from '../services/quote.service.js';
import { qs, qn } from '../utils/query.js';
import { sendWhatsAppMessage, generateWhatsAppLink } from '../services/whatsapp.service.js';

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
