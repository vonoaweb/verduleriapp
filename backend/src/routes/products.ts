import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import { createProductSchema, updateProductSchema } from '../types/index.js';
import * as productService from '../services/product.service.js';
import { qs, qn } from '../utils/query.js';

const router = Router();

// ─── RUTAS PÚBLICAS ──────────────────────────────

// GET /api/products — Listar productos (catálogo público)
router.get(
  '/',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await productService.listProducts({
        category: qs(req.query.category) as any,
        vendorId: qs(req.query.vendorId),
        search: qs(req.query.search),
        featured: qs(req.query.featured) === 'true' ? true : undefined,
        page: qn(req.query.page),
        limit: qn(req.query.limit),
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/products/:id — Obtener producto por ID
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await productService.getProductById(req.params.id as string);
      res.json(product);
    } catch (error) {
      next(error);
    }
  },
);

// ─── RUTAS DE VENDEDOR ───────────────────────────

// GET /api/products/vendor/mine — Productos del vendedor autenticado
router.get(
  '/vendor/mine',
  authenticate,
  authorize('VENDOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Obtener vendorId del usuario
      const { prisma } = await import('../config/prisma.js');
      const vendor = await prisma.vendor.findUnique({
        where: { userId: req.user!.userId },
        select: { id: true },
      });

      if (!vendor) {
        res.status(404).json({ error: 'Perfil de vendedor no encontrado' });
        return;
      }

      const products = await productService.getVendorProducts(vendor.id);
      res.json(products);
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/products — Crear producto (solo vendedores)
router.post(
  '/',
  authenticate,
  authorize('VENDOR', 'ADMIN'),
  validate(createProductSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prisma } = await import('../config/prisma.js');
      const vendor = await prisma.vendor.findUnique({
        where: { userId: req.user!.userId },
        select: { id: true },
      });

      if (!vendor) {
        res.status(404).json({ error: 'Perfil de vendedor no encontrado' });
        return;
      }

      const product = await productService.createProduct(vendor.id, req.body);
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  },
);

// PUT /api/products/:id — Actualizar producto
router.put(
  '/:id',
  authenticate,
  authorize('VENDOR', 'ADMIN'),
  validate(updateProductSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prisma } = await import('../config/prisma.js');
      const vendor = await prisma.vendor.findUnique({
        where: { userId: req.user!.userId },
        select: { id: true },
      });

      const isAdmin = req.user!.role === 'ADMIN';
      const product = await productService.updateProduct(
        req.params.id as string,
        vendor?.id || '',
        req.body,
        isAdmin,
      );
      res.json(product);
    } catch (error) {
      next(error);
    }
  },
);

// DELETE /api/products/:id — Eliminar producto
router.delete(
  '/:id',
  authenticate,
  authorize('VENDOR', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prisma } = await import('../config/prisma.js');
      const vendor = await prisma.vendor.findUnique({
        where: { userId: req.user!.userId },
        select: { id: true },
      });

      const isAdmin = req.user!.role === 'ADMIN';
      const result = await productService.deleteProduct(
        req.params.id as string,
        vendor?.id || '',
        isAdmin,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
