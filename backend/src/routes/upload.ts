import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = Router();

// Obtener directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads', 'products');

// Crear directorio si no existe
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configurar multer para guardar en disco
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || `.${file.mimetype.split('/')[1]}`;
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPEG, PNG, WebP, AVIF)'));
    }
  },
});

// POST /api/upload/image — Subir imagen de producto
router.post(
  '/image',
  authenticate,
  authorize('VENDOR', 'ADMIN'),
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No se envió ninguna imagen' });
        return;
      }

      // URL pública para acceder a la imagen
      const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
      const imageUrl = `${baseUrl}/uploads/products/${req.file.filename}`;

      res.json({
        url: imageUrl,
        path: req.file.filename,
      });
    } catch (error) {
      next(error);
    }
  },
);

// DELETE /api/upload/image — Eliminar imagen
router.delete(
  '/image',
  authenticate,
  authorize('VENDOR', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { path: filePath } = req.body;
      if (!filePath) {
        res.status(400).json({ error: 'Ruta de la imagen requerida' });
        return;
      }

      const fullPath = path.join(UPLOADS_DIR, path.basename(filePath));
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      res.json({ message: 'Imagen eliminada' });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
