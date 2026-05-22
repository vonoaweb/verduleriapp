import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { CreateProductInput, UpdateProductInput } from '../types/index.js';

// ─── LISTAR PRODUCTOS (público) ──────────────────
export async function listProducts(filters: {
  category?: 'FRUIT' | 'VEGETABLE';
  vendorId?: string;
  search?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
}) {
  const { category, vendorId, search, featured, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {
    status: 'ACTIVE',
    vendor: { status: 'ACTIVE' },
  };

  if (category) where.category = category;
  if (vendorId) where.vendorId = vendorId;
  if (featured !== undefined) where.featured = featured;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            whatsapp: true,
            rating: true,
          },
        },
        images: true,
      },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── OBTENER PRODUCTO POR ID ─────────────────────
export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      vendor: {
        select: {
          id: true,
          businessName: true,
          whatsapp: true,
          rating: true,
          description: true,
        },
      },
      images: true,
    },
  });

  if (!product) {
    throw new AppError(404, 'Producto no encontrado');
  }

  return product;
}

// ─── CREAR PRODUCTO (vendedor) ───────────────────
export async function createProduct(vendorId: string, input: CreateProductInput) {
  // Verificar que el vendedor existe y está activo
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor || vendor.status !== 'ACTIVE') {
    throw new AppError(403, 'Vendedor no encontrado o inactivo');
  }

  const product = await prisma.product.create({
    data: {
      ...input,
      vendorId,
    },
    include: {
      vendor: {
        select: {
          id: true,
          businessName: true,
          whatsapp: true,
        },
      },
    },
  });

  return product;
}

// ─── ACTUALIZAR PRODUCTO (vendedor/admin) ────────
export async function updateProduct(
  productId: string,
  vendorId: string,
  input: UpdateProductInput,
  isAdmin: boolean = false,
) {
  // Verificar propiedad del producto
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new AppError(404, 'Producto no encontrado');
  }

  if (!isAdmin && product.vendorId !== vendorId) {
    throw new AppError(403, 'No tienes permisos para editar este producto');
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: input,
    include: {
      vendor: {
        select: {
          id: true,
          businessName: true,
          whatsapp: true,
        },
      },
    },
  });

  return updated;
}

// ─── ELIMINAR PRODUCTO (vendedor/admin) ──────────
export async function deleteProduct(
  productId: string,
  vendorId: string,
  isAdmin: boolean = false,
) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new AppError(404, 'Producto no encontrado');
  }

  if (!isAdmin && product.vendorId !== vendorId) {
    throw new AppError(403, 'No tienes permisos para eliminar este producto');
  }

  await prisma.product.delete({ where: { id: productId } });
  return { message: 'Producto eliminado exitosamente' };
}

// ─── PRODUCTOS DEL VENDEDOR ──────────────────────
export async function getVendorProducts(vendorId: string, includeInactive = true) {
  const where: any = { vendorId };
  if (!includeInactive) {
    where.status = 'ACTIVE';
  }

  return prisma.product.findMany({
    where,
    include: { images: true },
    orderBy: { createdAt: 'desc' },
  });
}
