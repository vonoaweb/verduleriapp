import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { CreateVendorInput, UpdateVendorInput } from '../types/index.js';

// ─── REGISTRAR COMO VENDEDOR ─────────────────────
export async function registerVendor(userId: string, input: CreateVendorInput) {
  // Verificar que el usuario no sea ya vendedor
  const existing = await prisma.vendor.findUnique({ where: { userId } });
  if (existing) {
    throw new AppError(409, 'Ya tienes un perfil de vendedor');
  }

  // Crear perfil de vendedor y actualizar rol del usuario
  const [vendor] = await prisma.$transaction([
    prisma.vendor.create({
      data: {
        userId,
        businessName: input.businessName,
        description: input.description,
        address: input.address,
        whatsapp: input.whatsapp,
        categories: input.categories,
        status: 'PENDING', // Requiere aprobación del admin
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { role: 'VENDOR' },
    }),
  ]);

  return vendor;
}

// ─── LISTAR VENDEDORES (público) ─────────────────
export async function listVendors(filters: {
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { status, search, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { businessName: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true, avatarUrl: true },
        },
        _count: { select: { products: true } },
      },
      orderBy: { rating: 'desc' },
      skip,
      take: limit,
    }),
    prisma.vendor.count({ where }),
  ]);

  return {
    vendors,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── OBTENER VENDEDOR POR ID ─────────────────────
export async function getVendorById(id: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      user: {
        select: { name: true, email: true, avatarUrl: true },
      },
      products: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { products: true, quoteItems: true } },
    },
  });

  if (!vendor) {
    throw new AppError(404, 'Vendedor no encontrado');
  }

  return vendor;
}

// ─── OBTENER MI PERFIL DE VENDEDOR ───────────────
export async function getMyVendorProfile(userId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { userId },
    include: {
      _count: { select: { products: true, quoteItems: true } },
    },
  });

  if (!vendor) {
    throw new AppError(404, 'No tienes perfil de vendedor');
  }

  return vendor;
}

// ─── ACTUALIZAR VENDEDOR ─────────────────────────
export async function updateVendor(vendorId: string, userId: string, input: UpdateVendorInput, isAdmin = false) {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) {
    throw new AppError(404, 'Vendedor no encontrado');
  }

  if (!isAdmin && vendor.userId !== userId) {
    throw new AppError(403, 'No tienes permisos para editar este vendedor');
  }

  return prisma.vendor.update({
    where: { id: vendorId },
    data: input,
  });
}

// ─── APROBAR/RECHAZAR VENDEDOR (admin) ───────────
export async function updateVendorStatus(vendorId: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) {
    throw new AppError(404, 'Vendedor no encontrado');
  }

  return prisma.vendor.update({
    where: { id: vendorId },
    data: { status },
  });
}
