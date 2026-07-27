// ─── Reportes de ventas en PDF ───────────────────
// Genera reportes de ventas por vendedor y los expone en una URL firmada
// (el bot de WhatsApp envía esa URL como documento al productor).

import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { prisma } from '../config/prisma.js';

const SIGNING_SECRET = process.env.JWT_SECRET || 'verduleriapp-reports';

export type ReportPeriod = 'hoy' | 'semana' | 'mes';

// ─── Token firmado (para que la URL del PDF no sea pública) ──
export function makeReportToken(vendorId: string, period: ReportPeriod): string {
  const payload = Buffer.from(
    JSON.stringify({ v: vendorId, p: period, exp: Date.now() + 48 * 60 * 60 * 1000 }),
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SIGNING_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyReportToken(token: string): { vendorId: string; period: ReportPeriod } | null {
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = crypto.createHmac('sha256', SIGNING_SECRET).update(payload).digest('base64url');
  try {
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!data.v || !data.p || Date.now() > data.exp) return null;
    return { vendorId: data.v, period: data.p };
  } catch {
    return null;
  }
}

// ─── Datos del reporte ───────────────────────────
function periodStart(period: ReportPeriod): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (period === 'semana') d.setDate(d.getDate() - 7);
  if (period === 'mes') d.setMonth(d.getMonth() - 1);
  return d;
}

const PERIOD_LABEL: Record<ReportPeriod, string> = {
  hoy: 'Hoy',
  semana: 'Últimos 7 días',
  mes: 'Último mes',
};

export async function buildSalesReportPdf(vendorId: string, period: ReportPeriod): Promise<Buffer> {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { businessName: true },
  });
  if (!vendor) throw new Error('Vendedor no encontrado');

  const since = periodStart(period);
  const items = await prisma.quoteItem.findMany({
    where: { vendorId, quote: { createdAt: { gte: since } } },
    include: {
      product: { select: { name: true } },
      quote: { select: { createdAt: true, paymentStatus: true, status: true, customerName: true } },
    },
    orderBy: { quote: { createdAt: 'desc' } },
  });

  // Agregado por producto — SOLO lo PAGADO cuenta como venta.
  // Lo no pagado se reporta aparte como "pendiente de cobro" para que no se
  // confunda con ventas reales (pedido de Rodrigo, 8-jul-2026).
  const byProduct = new Map<string, { qty: number; unit: string; revenue: number }>();
  let paidRevenue = 0;
  let unpaidRevenue = 0;
  const paidQuoteIds = new Set<string>();
  const unpaidQuotes = new Map<string, { customerName: string; total: number }>();

  for (const it of items) {
    const importe = it.quantity * it.price;
    if (it.quote.paymentStatus === 'PAID') {
      const key = it.product.name;
      const entry = byProduct.get(key) || { qty: 0, unit: it.unit, revenue: 0 };
      entry.qty += it.quantity;
      entry.revenue += importe;
      byProduct.set(key, entry);
      paidRevenue += importe;
      paidQuoteIds.add(it.quoteId);
    } else {
      unpaidRevenue += importe;
      const prev = unpaidQuotes.get(it.quoteId);
      unpaidQuotes.set(it.quoteId, {
        customerName: it.quote.customerName,
        total: (prev?.total || 0) + importe,
      });
    }
  }

  // ─── Generar el PDF ───
  const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>(resolve => doc.on('end', () => resolve(Buffer.concat(chunks))));

  const green = '#2D6A4F';
  const dark = '#2B3A29';
  const gray = '#5C6F5A';
  const money = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

  // Encabezado
  doc.rect(0, 0, doc.page.width, 90).fill(green);
  doc.fill('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('Kampo', 50, 28);
  doc.fontSize(11).font('Helvetica').text('Reporte de ventas', 50, 58);
  doc.fill(dark);

  doc.fontSize(16).font('Helvetica-Bold').text(vendor.businessName, 50, 115);
  doc.fontSize(10).font('Helvetica').fill(gray)
    .text(`Periodo: ${PERIOD_LABEL[period]}  ·  Generado: ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`);
  doc.moveDown(1.5);

  // Resumen — la VENTA es solo lo cobrado
  doc.fill(dark).fontSize(12).font('Helvetica-Bold').text('Resumen');
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica').fill(gray);
  doc.text(`Pedidos pagados: ${paidQuoteIds.size}`);
  doc.moveDown(0.2);
  doc.fontSize(13).font('Helvetica-Bold').fill(green)
    .text(`Ventas cobradas: ${money(paidRevenue)}`);
  doc.moveDown(0.2);
  doc.fontSize(10).font('Helvetica').fill(gray)
    .text('(solo se cuentan los pedidos con pago confirmado)');
  doc.moveDown(1);

  // Tabla por producto (solo pagado)
  doc.fill(dark).fontSize(12).font('Helvetica-Bold').text('Ventas cobradas por producto');
  doc.moveDown(0.5);

  const tableTop = doc.y;
  const col = { name: 50, qty: 280, unit: 360, revenue: 440 };
  doc.fontSize(9).font('Helvetica-Bold').fill(gray);
  doc.text('Producto', col.name, tableTop);
  doc.text('Cantidad', col.qty, tableTop);
  doc.text('Unidad', col.unit, tableTop);
  doc.text('Ingresos', col.revenue, tableTop);
  doc.moveTo(50, tableTop + 14).lineTo(562, tableTop + 14).strokeColor('#D9E2D7').stroke();

  let y = tableTop + 22;
  doc.font('Helvetica').fill(dark);
  if (byProduct.size === 0) {
    doc.fontSize(10).fill(gray).text('Sin ventas cobradas en este periodo.', col.name, y);
    y += 20;
  }
  for (const [name, data] of [...byProduct.entries()].sort((a, b) => b[1].revenue - a[1].revenue)) {
    if (y > doc.page.height - 80) {
      doc.addPage();
      y = 50;
    }
    doc.fontSize(9);
    doc.text(name, col.name, y, { width: 220 });
    doc.text(String(Math.round(data.qty * 100) / 100), col.qty, y);
    doc.text(data.unit, col.unit, y);
    doc.text(money(data.revenue), col.revenue, y);
    y += 18;
  }

  // Total cobrado
  doc.moveTo(50, y + 8).lineTo(562, y + 8).strokeColor('#D9E2D7').stroke();
  doc.fontSize(11).font('Helvetica-Bold').fill(green)
    .text(`Total cobrado: ${money(paidRevenue)}`, col.revenue - 140, y + 16, { width: 252, align: 'right' });
  y += 44;

  // ─── Pendiente de cobro (NO es venta) ───
  if (unpaidQuotes.size > 0) {
    if (y > doc.page.height - 160) {
      doc.addPage();
      y = 50;
    }
    doc.fontSize(12).font('Helvetica-Bold').fill('#B26A00')
      .text('Pendiente de cobro — NO cuenta como venta', 50, y);
    y += 18;
    doc.fontSize(9).font('Helvetica').fill(gray)
      .text('Estos pedidos no se han pagado, por lo que no se mandan a preparar.', 50, y);
    y += 18;

    for (const [, q] of unpaidQuotes) {
      if (y > doc.page.height - 80) {
        doc.addPage();
        y = 50;
      }
      doc.fontSize(9).fill(dark).text(q.customerName, col.name, y, { width: 220 });
      doc.text(money(q.total), col.revenue, y);
      y += 16;
    }

    doc.moveTo(50, y + 6).lineTo(562, y + 6).strokeColor('#F4A261').stroke();
    doc.fontSize(10).font('Helvetica-Bold').fill('#B26A00')
      .text(`Total pendiente: ${money(unpaidRevenue)}`, col.revenue - 140, y + 14, { width: 252, align: 'right' });
  }

  doc.fontSize(8).font('Helvetica').fill('#95A893')
    .text('Generado automáticamente por Verdy, el bot de Kampo.', 50, doc.page.height - 60);

  doc.end();
  return done;
}
