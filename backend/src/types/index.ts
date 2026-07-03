import { z } from 'zod/v4';

// ─── AUTH SCHEMAS ────────────────────────────────
export const registerSchema = z.object({
  email: z.email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().optional(),
  role: z.enum(['CUSTOMER', 'VENDOR']).default('CUSTOMER'),
});

export const loginSchema = z.object({
  email: z.email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

// ─── VENDOR SCHEMAS ──────────────────────────────
export const createVendorSchema = z.object({
  businessName: z.string().min(2, 'El nombre del negocio es requerido'),
  description: z.string().optional(),
  address: z.string().optional(),
  whatsapp: z.string().min(8, 'Número de WhatsApp inválido'),
  categories: z.array(z.string()).default([]),
});

export const updateVendorSchema = createVendorSchema.partial();

// ─── PRODUCT SCHEMAS ─────────────────────────────
export const createProductSchema = z.object({
  name: z.string().min(2, 'El nombre del producto es requerido'),
  category: z.enum(['FRUIT', 'VEGETABLE']),
  price: z.number().positive('El precio debe ser mayor a 0'),
  unit: z.string().min(1, 'La unidad es requerida'),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  featured: z.boolean().default(false),
});

export const updateProductSchema = createProductSchema.partial();

// ─── QUOTE SCHEMAS ───────────────────────────────
export const createQuoteSchema = z.object({
  customerName: z.string().min(2, 'El nombre es requerido'),
  customerPhone: z.string().min(8, 'Teléfono inválido'),
  customerEmail: z.email().optional(),
  notes: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryColonia: z.string().optional(),
  deliveryZone: z.string().optional(),
  deliveryDate: z.string().optional(),
  deliverySlot: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  items: z.array(z.object({
    productId: z.string(),
    vendorId: z.string(),
    quantity: z.number().positive(),
    price: z.number().positive(),
    unit: z.string(),
  })).min(1, 'Debe incluir al menos un producto'),
});

export const updateQuoteStatusSchema = z.object({
  status: z.enum(['PENDING', 'RESPONDED', 'COMPLETED', 'CANCELLED']),
});

// ─── TIPOS INFERIDOS ─────────────────────────────
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;

// ─── JWT PAYLOAD ─────────────────────────────────
export interface JwtPayload {
  userId: string;
  email: string;
  role: 'CUSTOMER' | 'VENDOR' | 'ADMIN';
}

// ─── EXPRESS EXTENSIONS ──────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
