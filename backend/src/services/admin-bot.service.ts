// ─── Modo dueño/admin del bot de WhatsApp ────────
// El número del dueño (OWNER_WHATSAPP) puede gestionar la operación desde el
// chat: ver los pedidos agrupados por coto/torre, el resumen de la ruta y los
// pagos. Solo intercepta comandos exactos: todo lo demás sigue al bot normal,
// así el dueño también puede pedir como cliente para probar.

import { prisma } from '../config/prisma.js';
import { nextDeliveryInfo } from '../config/zones.js';

const SIN_COLONIA = 'Sin coto';

function normalizePhone(p?: string | null): string {
  let x = (p || '').replace(/\D/g, '');
  // wa_id de México/Argentina trae un dígito extra (521.../549...)
  if (x.startsWith('521') && x.length === 13) x = '52' + x.slice(3);
  if (x.startsWith('549') && x.length === 13) x = '54' + x.slice(3);
  return x;
}

export function isOwnerPhone(phone: string): boolean {
  const owner = normalizePhone(process.env.OWNER_WHATSAPP);
  return Boolean(owner) && normalizePhone(phone) === owner;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

const money = (n: number) => `$${n.toLocaleString('es-MX')}`;

function ownerHelp(): string {
  return [
    '🧑‍💼 *Modo dueño — Kampo*',
    '',
    'Comandos disponibles:',
    '• *pedidos* — pedidos de la semana agrupados por coto/torre',
    '• *ruta* — resumen de la ruta (cuántos por coto y total)',
    '• *pagos* — quién ya pagó y quién no',
    '',
    '_Todo lo demás funciona como cliente normal (puedes hacer pedidos de prueba)._',
  ].join('\n');
}

// Pedidos activos de los últimos 7 días (los que entran a la ruta)
async function loadRecentQuotes() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return prisma.quote.findMany({
    where: { createdAt: { gte: since }, status: { not: 'CANCELLED' } },
    orderBy: { createdAt: 'asc' },
    include: { items: { include: { product: { select: { name: true } } } } },
  });
}

type QuoteWithItems = Awaited<ReturnType<typeof loadRecentQuotes>>[number];

function groupByColonia(quotes: QuoteWithItems[]): Map<string, QuoteWithItems[]> {
  const map = new Map<string, QuoteWithItems[]>();
  for (const q of quotes) {
    const key = q.deliveryColonia || SIN_COLONIA;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(q);
  }
  // Orden alfabético, "Sin coto" al final
  return new Map(
    [...map.entries()].sort((a, b) => {
      if (a[0] === SIN_COLONIA) return 1;
      if (b[0] === SIN_COLONIA) return -1;
      return a[0].localeCompare(b[0], 'es');
    }),
  );
}

// Intenta manejar el mensaje como comando del dueño.
// Devuelve null si no es un comando (sigue el flujo normal del bot).
export async function tryHandleOwnerMessage(text: string): Promise<string | null> {
  const t = norm(text);

  if (['admin', 'dueno', 'dueño', 'panel', 'comandos admin'].includes(t)) {
    return ownerHelp();
  }
  if (!['pedidos', 'ruta', 'resumen', 'pagos'].includes(t)) return null;

  const delivery = nextDeliveryInfo();
  const quotes = await loadRecentQuotes();

  if (quotes.length === 0) {
    return `📭 No hay pedidos en los últimos 7 días.\n\n🚚 Próxima entrega: ${delivery.dateLabel} (corte: ${delivery.cutoffLabel}).`;
  }

  const groups = groupByColonia(quotes);
  const total = quotes.reduce((s, q) => s + q.total, 0);
  const paid = quotes.filter(q => q.paymentStatus === 'PAID');

  const header = `🚚 *Entrega: ${delivery.dateLabel}, 9:00 a 13:00*\n_Corte: ${delivery.cutoffLabel}_\n`;

  // ── ruta / resumen: conteo por coto ──
  if (t === 'ruta' || t === 'resumen') {
    const lines = [...groups.entries()].map(([colonia, list]) => {
      const sub = list.reduce((s, q) => s + q.total, 0);
      const pagados = list.filter(q => q.paymentStatus === 'PAID').length;
      return `📍 *${colonia}*: ${list.length} ${list.length === 1 ? 'pedido' : 'pedidos'} · ${money(sub)} · ${pagados}/${list.length} pagados`;
    });
    return [
      header,
      '🗺️ *Resumen de la ruta:*',
      ...lines,
      '',
      `*Total: ${quotes.length} pedidos · ${money(total)}* (${paid.length} pagados)`,
    ].join('\n');
  }

  // ── pagos: quién pagó y quién no ──
  if (t === 'pagos') {
    const pending = quotes.filter(q => q.paymentStatus !== 'PAID');
    const lines = [
      header,
      `✅ *Pagados (${paid.length})*: ${money(paid.reduce((s, q) => s + q.total, 0))}`,
      ...paid.map(q => `  • ${q.customerName} — ${money(q.total)}`),
      '',
      `⏳ *Por cobrar (${pending.length})*: ${money(pending.reduce((s, q) => s + q.total, 0))}`,
      ...pending.map(q => `  • ${q.customerName} — ${money(q.total)} (${q.deliveryColonia || SIN_COLONIA})`),
    ];
    return lines.join('\n');
  }

  // ── pedidos: detalle agrupado por coto ──
  const blocks = [...groups.entries()].map(([colonia, list]) => {
    const sub = list.reduce((s, q) => s + q.total, 0);
    const rows = list.map(q => {
      const productos = q.items.map(i => `${i.product.name} x${i.quantity}`).join(', ');
      const pago = q.paymentStatus === 'PAID' ? '✅' : '⏳';
      const dir = q.deliveryAddress ? ` — 🏠 ${q.deliveryAddress}` : '';
      return `  ${pago} *${q.customerName}* — ${money(q.total)}${dir}\n     ${productos}`;
    });
    return `📍 *${colonia}* (${list.length} · ${money(sub)})\n${rows.join('\n')}`;
  });

  return [
    header,
    '📦 *Pedidos por coto/torre:*',
    '',
    blocks.join('\n\n'),
    '',
    `*Total: ${quotes.length} pedidos · ${money(total)}* (${paid.length} pagados)`,
    '_✅ pagado · ⏳ por cobrar_',
  ].join('\n');
}
