// ─── Modo productor del bot de WhatsApp ──────────
// Los vendedores/productores se autentican con su código de acceso y pueden
// actualizar inventario, cambiar precios y pedir reportes de ventas en PDF,
// todo desde WhatsApp.

import { prisma } from '../config/prisma.js';
import { makeReportToken, type ReportPeriod } from './report.service.js';

const BACKEND_URL = process.env.BACKEND_URL || 'https://verduleriapp-api.onrender.com';
const VENDOR_SESSION_HOURS = 24; // la sesión de productor expira a las 24 h

export interface VendorBotResult {
  reply: string;
  // Actualización del estado de la conversación (se persiste en BotConversation)
  vendorId?: string | null;
  vendorAuthedAt?: Date | null;
  // Documento a enviar por WhatsApp (reportes PDF)
  document?: { link: string; filename: string; caption: string };
}

// Normaliza para comparar nombres de producto (sin acentos, minúsculas)
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

function helpText(businessName: string): string {
  return [
    `🧑‍🌾 *Modo productor — ${businessName}*`,
    '',
    'Comandos disponibles:',
    '• *productos* — ver tu inventario y precios',
    '• *precio <producto> <precio>* — cambiar precio (ej. _precio aguacate 45_)',
    '• *pausar <producto>* — ocultar del catálogo (sin stock)',
    '• *activar <producto>* — volver a publicar',
    '• *reporte hoy | semana | mes* — recibir PDF de ventas',
    '• *salir* — volver al modo cliente',
  ].join('\n');
}

// Busca un producto del vendedor por nombre (coincidencia flexible)
async function findVendorProduct(vendorId: string, nameInput: string) {
  const products = await prisma.product.findMany({
    where: { vendorId },
    select: { id: true, name: true, price: true, unit: true, status: true },
  });
  const target = norm(nameInput);
  return (
    products.find(p => norm(p.name) === target) ||
    products.find(p => norm(p.name).includes(target) || target.includes(norm(p.name))) ||
    null
  );
}

// Intenta manejar el mensaje como comando de productor.
// Devuelve null si el mensaje NO es del flujo de productor (sigue al bot normal).
export async function tryHandleVendorMessage(
  text: string,
  conversation: { vendorId?: string | null; vendorAuthedAt?: Date | null } | null,
): Promise<VendorBotResult | null> {
  const msg = text.trim();

  // ── 1. Autenticación: "clave ABC123" o "#ABC123" ──
  const authMatch = msg.match(/^(?:#|clave\s+|codigo\s+|código\s+)(\S+)$/i);
  if (authMatch) {
    const code = authMatch[1].toUpperCase();
    const vendor = await prisma.vendor.findFirst({
      where: { accessCode: code, status: 'ACTIVE' },
      select: { id: true, businessName: true },
    });
    if (!vendor) {
      return {
        reply: '❌ Código no válido. Verifica tu código de productor o contacta al administrador.',
      };
    }
    return {
      reply: `✅ ¡Hola, *${vendor.businessName}*! Ya estás en modo productor.\n\n${helpText(vendor.businessName)}`,
      vendorId: vendor.id,
      vendorAuthedAt: new Date(),
    };
  }

  // ── 2. ¿Hay sesión de productor activa? ──
  const authedAt = conversation?.vendorAuthedAt ? new Date(conversation.vendorAuthedAt) : null;
  const sessionActive =
    conversation?.vendorId &&
    authedAt &&
    Date.now() - authedAt.getTime() < VENDOR_SESSION_HOURS * 60 * 60 * 1000;

  if (!sessionActive) return null; // no es productor → sigue el bot de clientes

  const vendorId = conversation!.vendorId as string;
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true, businessName: true },
  });
  if (!vendor) return null;

  const lower = norm(msg);

  // ── salir ──
  if (lower === 'salir' || lower === 'exit') {
    return {
      reply: '👋 Saliste del modo productor. Ya puedes pedir como cliente normal.',
      vendorId: null,
      vendorAuthedAt: null,
    };
  }

  // ── ayuda / menu ──
  if (['ayuda', 'menu', 'menú', 'help', 'comandos'].includes(lower)) {
    return { reply: helpText(vendor.businessName) };
  }

  // ── productos / inventario ──
  if (['productos', 'inventario', 'mis productos', 'catalogo', 'catálogo'].includes(lower)) {
    const products = await prisma.product.findMany({
      where: { vendorId },
      orderBy: { name: 'asc' },
      select: { name: true, price: true, unit: true, status: true },
    });
    if (products.length === 0) {
      return { reply: '📦 Aún no tienes productos registrados.' };
    }
    const lines = products.map(
      p => `${p.status === 'ACTIVE' ? '🟢' : '⏸️'} ${p.name} — $${p.price.toLocaleString('es-MX')} / ${p.unit}`,
    );
    return {
      reply: `📦 *Tu inventario (${vendor.businessName}):*\n\n${lines.join('\n')}\n\n_🟢 activo · ⏸️ pausado_`,
    };
  }

  // ── precio <producto> <precio> ──
  const priceMatch = msg.match(/^precio\s+(.+?)\s+a?\s*\$?([\d]+(?:[.,]\d{1,2})?)$/i);
  if (priceMatch) {
    const product = await findVendorProduct(vendorId, priceMatch[1]);
    if (!product) {
      return { reply: `🤔 No encontré "${priceMatch[1]}" en tus productos. Escribe *productos* para ver tu lista.` };
    }
    const newPrice = Number(priceMatch[2].replace(',', '.'));
    if (!Number.isFinite(newPrice) || newPrice <= 0) {
      return { reply: '❌ Ese precio no es válido. Ejemplo: _precio aguacate 45_' };
    }
    await prisma.product.update({ where: { id: product.id }, data: { price: newPrice } });
    return {
      reply: `💲 Listo: *${product.name}* ahora cuesta *$${newPrice.toLocaleString('es-MX')} / ${product.unit}* (antes $${product.price.toLocaleString('es-MX')}).`,
    };
  }

  // ── pausar / activar <producto> ──
  const statusMatch = msg.match(/^(pausar|activar|apagar|prender)\s+(.+)$/i);
  if (statusMatch) {
    const activate = ['activar', 'prender'].includes(statusMatch[1].toLowerCase());
    const product = await findVendorProduct(vendorId, statusMatch[2]);
    if (!product) {
      return { reply: `🤔 No encontré "${statusMatch[2]}" en tus productos. Escribe *productos* para ver tu lista.` };
    }
    await prisma.product.update({
      where: { id: product.id },
      data: { status: activate ? 'ACTIVE' : 'INACTIVE' },
    });
    return {
      reply: activate
        ? `🟢 *${product.name}* está de nuevo disponible en el catálogo.`
        : `⏸️ *${product.name}* quedó pausado (no aparece en el catálogo ni lo cotiza el bot).`,
    };
  }

  // ── reporte [hoy|semana|mes] ──
  const reportMatch = msg.match(/^reporte(?:\s+(hoy|semana|mes))?$/i);
  if (reportMatch) {
    const period = (reportMatch[1]?.toLowerCase() || 'semana') as ReportPeriod;
    const token = makeReportToken(vendorId, period);
    const link = `${BACKEND_URL}/api/reports/sales?token=${token}`;
    return {
      reply: `📊 Generando tu reporte de ventas (*${period}*)… te lo envío en un momento.`,
      document: {
        link,
        filename: `reporte-ventas-${period}.pdf`,
        caption: `📊 Reporte de ventas (${period}) — ${vendor.businessName}`,
      },
    };
  }

  // ── comando no reconocido (pero está en modo productor) ──
  return {
    reply: `🤔 No entendí ese comando.\n\n${helpText(vendor.businessName)}`,
  };
}

// ─── Códigos de acceso ───────────────────────────
// Genera códigos para los vendedores activos que aún no tienen (se corre al arrancar)
export async function ensureVendorAccessCodes(): Promise<void> {
  const vendors = await prisma.vendor.findMany({
    where: { accessCode: null },
    select: { id: true, businessName: true },
  });
  for (const v of vendors) {
    const prefix = v.businessName
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z]/g, '')
      .slice(0, 4)
      .toUpperCase() || 'PROD';
    let code = '';
    // Reintenta hasta encontrar un código libre
    for (let i = 0; i < 10; i++) {
      code = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
      const exists = await prisma.vendor.findFirst({ where: { accessCode: code }, select: { id: true } });
      if (!exists) break;
    }
    await prisma.vendor.update({ where: { id: v.id }, data: { accessCode: code } });
    console.log(`🔑 Código de productor generado para ${v.businessName}: ${code}`);
  }
}
