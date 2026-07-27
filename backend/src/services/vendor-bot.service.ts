// ─── Modo productor del bot de WhatsApp ──────────
// Los vendedores/productores se autentican con su código de acceso y pueden
// actualizar inventario, cambiar precios y pedir reportes de ventas en PDF,
// todo desde WhatsApp y hablando normal (no hace falta memorizar comandos).
// Los cambios que tocan dinero o disponibilidad se confirman antes de aplicarse.

import { prisma } from '../config/prisma.js';
import { makeReportToken, type ReportPeriod } from './report.service.js';
import { interpretVendorCommand } from './gemini.service.js';

const BACKEND_URL = process.env.BACKEND_URL || 'https://verduleriapp-api.onrender.com';
const VENDOR_SESSION_HOURS = 24; // la sesión de productor expira a las 24 h

// Acción esperando un "sí" del productor
export interface PendingAction {
  type: 'price' | 'pause' | 'activate';
  productId: string;
  productName: string;
  unit: string;
  oldPrice?: number;
  newPrice?: number;
  askedAt: string; // ISO
}

const PENDING_TTL_MIN = 15; // una confirmación pendiente caduca a los 15 min

export interface VendorBotResult {
  reply: string;
  // Actualización del estado de la conversación (se persiste en BotConversation)
  vendorId?: string | null;
  vendorAuthedAt?: Date | null;
  pendingAction?: PendingAction | null;
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

const money = (n: number) => `$${n.toLocaleString('es-MX')}`;

function helpText(businessName: string): string {
  return [
    `🧑‍🌾 *Modo productor — ${businessName}*`,
    '',
    'Puedes escribirme normal, por ejemplo:',
    '• _"¿cómo van mis productos?"_ — ver inventario y precios',
    '• _"cámbiale el precio a la piña a 18 pesos el kilo"_',
    '• _"ya se me acabó el aguacate"_ — pausar un producto',
    '• _"vuelve a activar la piña"_',
    '• _"mándame el reporte de la semana"_ — PDF de ventas',
    '• _"salir"_ — volver al modo cliente',
    '',
    '_Los cambios de precio y las pausas te los confirmo antes de aplicarlos._',
  ].join('\n');
}

// Busca un producto del vendedor por nombre (coincidencia flexible)
async function findVendorProduct(vendorId: string, nameInput: string) {
  const products = await prisma.product.findMany({
    where: { vendorId },
    select: { id: true, name: true, price: true, unit: true, status: true },
  });
  const target = norm(nameInput);
  if (!target) return null;
  return (
    products.find(p => norm(p.name) === target) ||
    products.find(p => norm(p.name).includes(target) || target.includes(norm(p.name))) ||
    // último intento: por palabra suelta (ej. "piña" → "Piña Golden")
    products.find(p => target.split(/\s+/).some(w => w.length > 3 && norm(p.name).includes(w))) ||
    null
  );
}

function notFoundMsg(name: string): string {
  return `🤔 No encontré "${name}" en tus productos. Escríbeme *productos* para ver tu lista.`;
}

// ─── Construir la pregunta de confirmación ───────
function confirmText(a: PendingAction): string {
  if (a.type === 'price') {
    return (
      `❓ ¿Confirmas este cambio?\n\n` +
      `*${a.productName}*\n` +
      `Precio actual: ${money(a.oldPrice || 0)} / ${a.unit}\n` +
      `Precio nuevo: *${money(a.newPrice || 0)} / ${a.unit}*\n\n` +
      `Responde *sí* para aplicarlo o *no* para cancelar.`
    );
  }
  if (a.type === 'pause') {
    return (
      `❓ ¿Confirmas pausar *${a.productName}*?\n\n` +
      `Dejará de aparecer en el catálogo y el bot ya no lo va a cotizar.\n\n` +
      `Responde *sí* para pausarlo o *no* para cancelar.`
    );
  }
  return (
    `❓ ¿Confirmas activar *${a.productName}*?\n\n` +
    `Volverá a aparecer en el catálogo.\n\n` +
    `Responde *sí* para activarlo o *no* para cancelar.`
  );
}

// ─── Aplicar la acción ya confirmada ─────────────
async function applyAction(a: PendingAction): Promise<string> {
  if (a.type === 'price') {
    await prisma.product.update({ where: { id: a.productId }, data: { price: a.newPrice as number } });
    return (
      `✅ Listo. *${a.productName}* ahora cuesta *${money(a.newPrice || 0)} / ${a.unit}* ` +
      `(antes ${money(a.oldPrice || 0)}).\n\nYa está actualizado en el catálogo y el bot lo cotiza con el precio nuevo.`
    );
  }
  if (a.type === 'pause') {
    await prisma.product.update({ where: { id: a.productId }, data: { status: 'INACTIVE' } });
    return `⏸️ Listo. *${a.productName}* quedó pausado: ya no aparece en el catálogo.`;
  }
  await prisma.product.update({ where: { id: a.productId }, data: { status: 'ACTIVE' } });
  return `🟢 Listo. *${a.productName}* está de nuevo disponible en el catálogo.`;
}

const YES = ['si', 'sí', 'sale', 'va', 'dale', 'ok', 'okay', 'confirmo', 'correcto', 'adelante', 'aplicalo', 'aplícalo', 'hazlo', 'yes', 'simon', 'claro'];
const NO = ['no', 'cancela', 'cancelar', 'mejor no', 'nel', 'espera', 'olvidalo', 'olvídalo', 'nada'];

// Intenta manejar el mensaje como comando de productor.
// Devuelve null si el mensaje NO es del flujo de productor (sigue al bot normal).
export async function tryHandleVendorMessage(
  text: string,
  conversation: {
    vendorId?: string | null;
    vendorAuthedAt?: Date | null;
    pendingAction?: unknown;
  } | null,
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
      pendingAction: null,
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

  // ── 3. ¿Está respondiendo a una confirmación pendiente? ──
  const pending = (conversation?.pendingAction as PendingAction | null) ?? null;
  if (pending && pending.productId) {
    const fresh = Date.now() - new Date(pending.askedAt).getTime() < PENDING_TTL_MIN * 60 * 1000;
    if (fresh) {
      if (YES.includes(lower)) {
        const reply = await applyAction(pending);
        return { reply, pendingAction: null };
      }
      if (NO.includes(lower)) {
        return {
          reply: `👍 Cancelado, no cambié nada.\n\n¿Necesitas algo más?`,
          pendingAction: null,
        };
      }
      // No dijo sí ni no: si es otro comando lo procesamos y descartamos el pendiente
    }
  }

  // ── 4. Comandos rápidos exactos ──
  if (['salir', 'exit', 'salirme', 'ya termine', 'ya terminé'].includes(lower)) {
    return {
      reply: '👋 Saliste del modo productor. Ya puedes pedir como cliente normal.',
      vendorId: null,
      vendorAuthedAt: null,
      pendingAction: null,
    };
  }

  if (['ayuda', 'menu', 'menú', 'help', 'comandos', 'que puedo hacer', 'qué puedo hacer'].includes(lower)) {
    return { reply: helpText(vendor.businessName), pendingAction: null };
  }

  // ── 5. Interpretar el mensaje (regex rápido, y si no, la IA) ──
  let intent: { action: string; product?: string; price?: number; period?: string } | null = null;

  if (['productos', 'inventario', 'mis productos', 'catalogo', 'catálogo', 'precios', 'mis precios'].includes(lower)) {
    intent = { action: 'list' };
  }
  const priceMatch = msg.match(/^precio\s+(.+?)\s+a?\s*\$?([\d]+(?:[.,]\d{1,2})?)$/i);
  if (!intent && priceMatch) {
    intent = { action: 'price', product: priceMatch[1], price: Number(priceMatch[2].replace(',', '.')) };
  }
  const statusMatch = msg.match(/^(pausar|activar|apagar|prender)\s+(.+)$/i);
  if (!intent && statusMatch) {
    const activate = ['activar', 'prender'].includes(statusMatch[1].toLowerCase());
    intent = { action: activate ? 'activate' : 'pause', product: statusMatch[2] };
  }
  const reportMatch = msg.match(/^reporte(?:\s+(hoy|semana|mes))?$/i);
  if (!intent && reportMatch) {
    intent = { action: 'report', period: reportMatch[1]?.toLowerCase() || 'semana' };
  }

  // Nada hizo match → que la IA interprete el lenguaje natural
  if (!intent) {
    const products = await prisma.product.findMany({
      where: { vendorId },
      select: { name: true },
    });
    intent = await interpretVendorCommand(msg, products.map(p => p.name));
  }

  // ── 6. Ejecutar la intención ──
  switch (intent.action) {
    case 'list': {
      const products = await prisma.product.findMany({
        where: { vendorId },
        orderBy: { name: 'asc' },
        select: { name: true, price: true, unit: true, status: true },
      });
      if (products.length === 0) {
        return { reply: '📦 Aún no tienes productos registrados.', pendingAction: null };
      }
      const lines = products.map(
        p => `${p.status === 'ACTIVE' ? '🟢' : '⏸️'} ${p.name} — ${money(p.price)} / ${p.unit}`,
      );
      return {
        reply: `📦 *Tu inventario (${vendor.businessName}):*\n\n${lines.join('\n')}\n\n_🟢 activo · ⏸️ pausado_`,
        pendingAction: null,
      };
    }

    case 'price': {
      if (!intent.product) {
        return { reply: '🤔 ¿A qué producto le cambio el precio? Ej. _"la piña a 18 el kilo"_.', pendingAction: null };
      }
      const product = await findVendorProduct(vendorId, intent.product);
      if (!product) return { reply: notFoundMsg(intent.product), pendingAction: null };
      if (!intent.price || intent.price <= 0) {
        return {
          reply: `🤔 ¿A qué precio dejo *${product.name}*? Ahora está en ${money(product.price)} / ${product.unit}.`,
          pendingAction: null,
        };
      }
      const action: PendingAction = {
        type: 'price',
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        oldPrice: product.price,
        newPrice: intent.price,
        askedAt: new Date().toISOString(),
      };
      return { reply: confirmText(action), pendingAction: action };
    }

    case 'pause':
    case 'activate': {
      if (!intent.product) {
        return {
          reply: `🤔 ¿Qué producto quieres ${intent.action === 'pause' ? 'pausar' : 'activar'}?`,
          pendingAction: null,
        };
      }
      const product = await findVendorProduct(vendorId, intent.product);
      if (!product) return { reply: notFoundMsg(intent.product), pendingAction: null };

      // Si ya está en ese estado, avisamos sin pedir confirmación
      if (intent.action === 'pause' && product.status === 'INACTIVE') {
        return { reply: `⏸️ *${product.name}* ya estaba pausado.`, pendingAction: null };
      }
      if (intent.action === 'activate' && product.status === 'ACTIVE') {
        return { reply: `🟢 *${product.name}* ya está activo en el catálogo.`, pendingAction: null };
      }

      const action: PendingAction = {
        type: intent.action as 'pause' | 'activate',
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        askedAt: new Date().toISOString(),
      };
      return { reply: confirmText(action), pendingAction: action };
    }

    case 'report': {
      const period = (intent.period || 'semana') as ReportPeriod;
      const token = makeReportToken(vendorId, period);
      const link = `${BACKEND_URL}/api/reports/sales?token=${token}`;
      return {
        reply: `📊 Va tu reporte de ventas (*${period}*), te lo mando en un momento…`,
        pendingAction: null,
        document: {
          link,
          filename: `reporte-ventas-${period}.pdf`,
          caption: `📊 Reporte de ventas (${period}) — ${vendor.businessName}`,
        },
      };
    }

    case 'exit':
      return {
        reply: '👋 Saliste del modo productor. Ya puedes pedir como cliente normal.',
        vendorId: null,
        vendorAuthedAt: null,
        pendingAction: null,
      };

    case 'help':
      return { reply: helpText(vendor.businessName), pendingAction: null };

    default:
      return {
        reply: `🤔 No te entendí bien.\n\n${helpText(vendor.businessName)}`,
        pendingAction: null,
      };
  }
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
