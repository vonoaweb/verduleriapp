import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { CreateQuoteInput } from '../types/index.js';

// ─── CREAR COTIZACIÓN ────────────────────────────
export async function createQuote(input: CreateQuoteInput, userId?: string) {
  // Validar productos y usar el precio REAL de la base de datos
  // (nunca confiar en el precio que envía el cliente)
  const productIds = [...new Set(input.items.map(i => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: 'ACTIVE' },
    select: { id: true, price: true, unit: true, vendorId: true },
  });
  const productMap = new Map(products.map(p => [p.id, p]));

  // Construir items con precios verificados
  const validatedItems = input.items.map(item => {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new AppError(400, `Producto no disponible: ${item.productId}`);
    }
    return {
      productId: product.id,
      vendorId: product.vendorId, // vendedor real del producto, no el del cliente
      quantity: item.quantity,
      price: product.price,        // precio real de la BD
      unit: product.unit,          // unidad real de la BD
    };
  });

  // Calcular total con precios verificados
  const total = validatedItems.reduce(
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
      deliveryAddress: input.deliveryAddress,
      deliveryColonia: input.deliveryColonia,
      deliveryZone: input.deliveryZone,
      deliveryDate: input.deliveryDate,
      deliverySlot: input.deliverySlot,
      latitude: input.latitude,
      longitude: input.longitude,
      total,
      items: {
        create: validatedItems,
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

  // Si es vendedor, recalcular el total de cada cotización
  // usando SOLO sus propios items (no los de otros vendedores)
  const adjustedQuotes = vendorId
    ? quotes.map(q => ({
        ...q,
        total: q.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      }))
    : quotes;

  return {
    quotes: adjustedQuotes,
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

// ─── PAGOS (pasarela) ────────────────────────────

// Info pública del pedido para la página de pago (sin auth, por ID)
export async function getQuoteForPayment(quoteId: string) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: {
      id: true,
      customerName: true,
      total: true,
      status: true,
      paymentStatus: true,
      items: {
        select: {
          quantity: true,
          price: true,
          unit: true,
          product: { select: { name: true } },
        },
      },
    },
  });
  if (!quote) {
    throw new AppError(404, 'Pedido no encontrado');
  }
  return quote;
}

// Marca el pedido como pagado.
// DEMO: simula el cobro (no procesa tarjeta real). Para producción se
// reemplaza por la confirmación real de Stripe / Mercado Pago.
export async function markQuotePaid(quoteId: string, method = 'demo') {
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) {
    throw new AppError(404, 'Pedido no encontrado');
  }
  if (quote.paymentStatus === 'PAID') {
    return quote; // ya estaba pagado (idempotente)
  }
  return prisma.quote.update({
    where: { id: quoteId },
    data: {
      paymentStatus: 'PAID',
      paymentMethod: method,
      paidAt: new Date(),
      status: 'COMPLETED',
    },
  });
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

  let monthlyRevenue: number;

  if (vendorId) {
    // Vendedor: sumar SOLO sus items de cotizaciones completadas del mes
    const items = await prisma.quoteItem.findMany({
      where: {
        vendorId,
        quote: {
          status: 'COMPLETED',
          createdAt: { gte: startOfMonth },
        },
      },
      select: { price: true, quantity: true },
    });
    monthlyRevenue = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  } else {
    // Admin: total completo de cotizaciones completadas del mes
    const monthlyQuotes = await prisma.quote.findMany({
      where: {
        ...where,
        status: 'COMPLETED',
        createdAt: { gte: startOfMonth },
      },
      select: { total: true },
    });
    monthlyRevenue = monthlyQuotes.reduce((sum, q) => sum + q.total, 0);
  }

  return {
    total,
    pending,
    responded,
    completed,
    monthlyRevenue,
  };
}
