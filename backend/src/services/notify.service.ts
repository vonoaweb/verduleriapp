// ─── Avisos de pedidos (WhatsApp) ────────────────
// Regla del negocio (Rodrigo, 8-jul-2026): un pedido NO se levanta si no está
// pagado. Por eso:
//   • Al dueño se le avisa SOLO cuando el pedido ya se pagó.
//   • Si el cliente dejó cosas en la canasta y no pagó, se le recuerda que
//     complete el checkout (no se manda a preparar).

import { prisma } from '../config/prisma.js';
import { sendTextMessage } from './whatsapp.service.js';

const OWNER_WHATSAPP = process.env.OWNER_WHATSAPP;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://verduleriapp.vercel.app';

const money = (n: number) => `$${n.toLocaleString('es-MX')}`;

// ─── Aviso al dueño de un pedido PAGADO ──────────
// Idempotente: si ya se avisó (ownerNotifiedAt), no se repite.
export async function notifyOwnerPaidOrder(quoteId: string): Promise<void> {
  if (!OWNER_WHATSAPP) return;

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: { include: { product: { select: { name: true } } } } },
  });
  if (!quote || quote.paymentStatus !== 'PAID' || quote.ownerNotifiedAt) return;

  const itemLines = quote.items
    .map(
      (i, idx) =>
        `${idx + 1}. ${i.product.name} - ${i.quantity} ${i.unit} x ${money(i.price)} = ${money(i.quantity * i.price)}`,
    )
    .join('\n');

  const lines = [
    '💰 *PEDIDO PAGADO - Kampo*',
    '',
    `👤 Cliente: ${quote.customerName}`,
    `📞 Teléfono: ${quote.customerPhone}`,
  ];
  if (quote.deliveryColonia) {
    lines.push(`🏘️ Coto/Torre: ${quote.deliveryColonia}${quote.deliveryZone ? ` (${quote.deliveryZone})` : ''}`);
  }
  if (quote.deliveryAddress) lines.push(`🏠 Dirección: ${quote.deliveryAddress}`);
  if (quote.deliveryDate) {
    lines.push(`🚚 Entrega: ${quote.deliveryDate}${quote.deliverySlot ? `, ${quote.deliverySlot}` : ''}`);
  }
  if (quote.latitude && quote.longitude) {
    lines.push(`📍 Mapa: https://maps.google.com/?q=${quote.latitude},${quote.longitude}`);
  }
  lines.push(
    '',
    '🛒 *Productos:*',
    itemLines,
    '',
    `✅ *Pagado: ${money(quote.total)}*${quote.paymentMethod ? ` (${quote.paymentMethod})` : ''}`,
    '',
    `_Pedido #${quote.id} · este pedido SÍ va a preparación_`,
  );

  const ok = await sendTextMessage(OWNER_WHATSAPP, lines.join('\n')).catch(e => {
    console.error('Error avisando al dueño del pedido pagado:', e);
    return false;
  });
  if (ok) {
    await prisma.quote.update({
      where: { id: quoteId },
      data: { ownerNotifiedAt: new Date() },
    });
  }
}

// Confirmación al cliente de que su pago se registró
export async function notifyCustomerPaid(quoteId: string): Promise<void> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: {
      customerPhone: true, customerName: true, total: true,
      deliveryDate: true, deliverySlot: true, deliveryColonia: true,
    },
  });
  if (!quote?.customerPhone) return;

  const lines = [
    `✅ ¡Listo, ${quote.customerName}! Recibimos tu pago de *${money(quote.total)}*.`,
    '',
    'Tu pedido ya está confirmado y va a preparación 🥬',
  ];
  if (quote.deliveryDate) {
    lines.push('', `🚚 Entrega: *${quote.deliveryDate}*${quote.deliverySlot ? `, ${quote.deliverySlot}` : ''}`);
  }
  if (quote.deliveryColonia) lines.push(`🏘️ ${quote.deliveryColonia}`);
  lines.push('', '_Gracias por tu compra 💚_');

  await sendTextMessage(quote.customerPhone, lines.join('\n')).catch(e =>
    console.error('Error confirmando pago al cliente:', e),
  );
}

// ─── Recordatorio de checkout ────────────────────
// Busca carritos sin pagar con cierta antigüedad y le recuerda al cliente que
// complete el pago. Solo una vez por pedido (reminderSentAt).
const REMINDER_AFTER_MIN = 45;   // recordar 45 min después de crear el carrito
const REMINDER_WINDOW_HOURS = 24; // no recordar carritos más viejos que esto

export async function sendCheckoutReminders(): Promise<number> {
  const now = Date.now();
  const olderThan = new Date(now - REMINDER_AFTER_MIN * 60 * 1000);
  const newerThan = new Date(now - REMINDER_WINDOW_HOURS * 60 * 60 * 1000);

  const pendientes = await prisma.quote.findMany({
    where: {
      paymentStatus: 'UNPAID',
      status: { notIn: ['CANCELLED', 'COMPLETED'] },
      reminderSentAt: null,
      createdAt: { lte: olderThan, gte: newerThan },
    },
    include: { items: { include: { product: { select: { name: true } } } } },
    take: 25,
  });

  let enviados = 0;
  for (const q of pendientes) {
    const productos = q.items.map(i => `${i.product.name} x${i.quantity}`).join(', ');
    const msg = [
      `👋 Hola ${q.customerName}, dejaste tu pedido a medias:`,
      '',
      `🛒 ${productos}`,
      `💰 Total: *${money(q.total)}*`,
      '',
      '⚠️ *Aún no lo mandamos a preparar porque falta completar el pago.*',
      '',
      `💳 Complétalo aquí:\n${FRONTEND_URL}/pago/${q.id}`,
      '',
      '_Si ya no lo quieres, ignora este mensaje 😊_',
    ].join('\n');

    const ok = await sendTextMessage(q.customerPhone, msg).catch(() => false);
    await prisma.quote.update({
      where: { id: q.id },
      data: { reminderSentAt: new Date() },
    });
    if (ok) enviados++;
  }

  if (enviados > 0) console.log(`🔔 Recordatorios de checkout enviados: ${enviados}`);
  return enviados;
}
