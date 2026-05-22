import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createVendorSchema, updateVendorSchema } from '../types/index.js';
import * as vendorService from '../services/vendor.service.js';
import { qs, qn } from '../utils/query.js';

const router = Router();

// ─── RUTAS PÚBLICAS ──────────────────────────────

// GET /api/vendors — Listar vendedores activos
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await vendorService.listVendors({
        status: 'ACTIVE',
        search: qs(req.query.search),
        page: qn(req.query.page),
        limit: qn(req.query.limit),
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/vendors/:id — Obtener vendedor por ID
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vendor = await vendorService.getVendorById(req.params.id as string);
      res.json(vendor);
    } catch (error) {
      next(error);
    }
  },
);

// ─── RUTAS AUTENTICADAS ──────────────────────────

// POST /api/vendors/register — Registrarse como vendedor
router.post(
  '/register',
  authenticate,
  validate(createVendorSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vendor = await vendorService.registerVendor(req.user!.userId, req.body);
      res.status(201).json(vendor);
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/vendors/me/profile — Mi perfil de vendedor
router.get(
  '/me/profile',
  authenticate,
  authorize('VENDOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vendor = await vendorService.getMyVendorProfile(req.user!.userId);
      res.json(vendor);
    } catch (error) {
      next(error);
    }
  },
);

// PUT /api/vendors/:id — Actualizar vendedor
router.put(
  '/:id',
  authenticate,
  authorize('VENDOR', 'ADMIN'),
  validate(updateVendorSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isAdmin = req.user!.role === 'ADMIN';
      const vendor = await vendorService.updateVendor(
        req.params.id as string,
        req.user!.userId,
        req.body,
        isAdmin,
      );
      res.json(vendor);
    } catch (error) {
      next(error);
    }
  },
);

// ─── RUTAS ADMIN ─────────────────────────────────

// GET /api/vendors/admin/all — Listar todos (incluye pendientes/inactivos)
router.get(
  '/admin/all',
  authenticate,
  authorize('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await vendorService.listVendors({
        status: qs(req.query.status) as any,
        search: qs(req.query.search),
        page: qn(req.query.page),
        limit: qn(req.query.limit),
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /api/vendors/:id/status — Cambiar estado del vendedor (admin)
router.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body;
      if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
        res.status(400).json({ error: 'Estado inválido' });
        return;
      }
      const vendor = await vendorService.updateVendorStatus(req.params.id as string, status);
      res.json(vendor);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
