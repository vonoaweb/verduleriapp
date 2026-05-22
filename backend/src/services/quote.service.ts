import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { CreateQuoteInput } from '../types/index.js';

// ─── CREAR COTIZACIÓN ────────────────────────────
export async function createQuote(input: CreateQuoteInput, userId?: string) {
  // Calcular total
  const total = input.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const quote = await prisma.quote.create({
    data: {
      userId: userId || null,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      notes: input.notes,
      total,
      items: {
        create: input.items.map(item => ({
          productId: item.productId,
          vendorId: item.vendorId,
          quantity: item.quantity,
          price: item.price,
          unit: item.unit,
        })),
      },
    },
    include: {
      items: {
        include: {
          product: { select: { name: true, imageUrl: true } },
          vendor: { select: { businessName: true, whatsapp: true } },
        },
      },
    },
  });

  return quote;
}

// ─── LISTAR COTIZACIONES (admin) ─────────────────
export async function listQuotes(filters: {
  status?: string;
  vendorId?: string;
  page?: number;
  limit?: number;
}) {
  const { status, vendorId, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status;

  // Si es vendedor, solo ver cotizaciones con sus productos
  if (vendorId) {
    where.items = {
      some: { vendorId },
    };
  }

  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      include: {
        items: {
          include: {
            product: { select: { name: true, imageUrl: true } },
            vendor: { select: { businessName: true, whatsapp: true } },
          },
          // Si es vendedor, solo mostrar sus items
          ...(vendorId ? { where: { vendorId } } : {}),
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.quote.count({ where }),
  ]);

  return {
    quotes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── OBTENER COTIZACIÓN POR ID ───────────────────
export async function getQuoteById(quoteId: string, vendorId?: string) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      items: {
        include: {
          product: { select: { name: true, imageUrl: true, category: true } },
          vendor: { select: { businessName: true, whatsapp: true } },
        },
      },
    },
  });

  if (!quote) {
    throw new AppError(404, 'Cotización no encontrada');
  }

  // Si es vendedor, verificar que tenga items de sus productos
  if (vendorId) {
    const hasVendorItems = quote.items.some(item => item.vendorId === vendorId);
    if (!hasVendorItems) {
      throw new AppError(403, 'No tienes acceso a esta cotización');
    }
  }

  return quote;
}

// ─── ACTUALIZAR ESTADO DE COTIZACIÓN ─────────────
export async function updateQuoteStatus(
  quoteId: string,
  status: 'PENDING' | 'RESPONDED' | 'COMPLETED' | 'CANCELLED',
  vendorId?: string,
) {
  // Verificar acceso
  if (vendorId) {
    await getQuoteById(quoteId, vendorId);
  }

  return prisma.quote.update({
    where: { id: quoteId },
    data: { status },
  });
}

// ─── ESTADÍSTICAS DE COTIZACIONES (para dashboard) ──
export async function getQuoteStats(vendorId?: string) {
  const where: any = {};
  if (vendorId) {
    where.items = { some: { vendorId } };
  }

  const [total, pending, responded, completed] = await Promise.all([
    prisma.quote.count({ where }),
    prisma.quote.count({ where: { ...where, status: 'PENDING' } }),
    prisma.quote.count({ where: { ...where, status: 'RESPONDED' } }),
    prisma.quote.count({ where: { ...where, status: 'COMPLETED' } }),
  ]);

  // Ingresos del mes actual
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyQuotes = await prisma.quote.findMany({
    where: {
      ...where,
      status: 'COMPLETED',
      createdAt: { gte: startOfMonth },
    },
    select: { total: true },
  });

  const monthlyRevenue = monthlyQuotes.reduce((sum, q) => sum + q.total, 0);

  return {
    total,
    pending,
    responded,
    completed,
    monthlyRevenue,
  };
}
