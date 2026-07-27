// ─── Bot Orchestrator ────────────────────────────
// Une todo: recibe un mensaje de WhatsApp, detecta si es un productor o un
// cliente, consulta el catálogo en tiempo real, pasa por la IA (Gemini),
// valida la zona de entrega, guarda la cotización y responde.

import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { generateBotReply, type ChatMessage, type CatalogProduct } from './gemini.service.js';
import { createQuote } from './quote.service.js';
import { sendTextMessage, sendDocumentMessage } from './whatsapp.service.js';
import { tryHandleVendorMessage } from './vendor-bot.service.js';
import { isOwnerPhone, tryHandleOwnerMessage } from './admin-bot.service.js';
import { findZoneByColonia, outOfZoneMessage, nextDeliveryInfo } from '../config/zones.js';

const MAX_HISTORY = 20; // Cuántos mensajes recordar por conversación
const OWNER_WHATSAPP = process.env.OWNER_WHATSAPP; // Número del dueño para avisarle de pedidos nuevos
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://verduleriapp.vercel.app'; // Para el link de pago

// Obtiene el catálogo activo en tiempo real desde la BD
async function getLiveCatalog(): Promise<CatalogProduct[]> {
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE', vendor: { status: 'ACTIVE' } },
    select: { id: true, name: true, price: true, unit: true, category: true },
    orderBy: { name: 'asc' },
  });
  return products.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    unit: p.unit,
    category: p.category,
  }));
}

// ─── Historial de pedidos del cliente ("mis pedidos") ──
const PAY_STATUS_LABEL: Record<string, string> = { PAID: '✅ pagado', UNPAID: '⏳ pendiente de pago' };
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'recibido',
  RESPONDED: 'en preparación',
  COMPLETED: 'entregado',
  CANCELLED: 'cancelado',
};

async function buildOrderHistoryReply(phone: string): Promise<string> {
  const quotes = await prisma.quote.findMany({
    where: { customerPhone: phone },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { items: { include: { product: { select: { name: true } } } } },
  });
  if (quotes.length === 0) {
    return '📭 Aún no tienes pedidos con nosotros. ¡Dime qué frutas o verduras necesitas y armamos el primero! 🥬';
  }
  const blocks = quotes.map(q => {
    const date = q.createdAt.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      timeZone: 'America/Mexico_City',
    });
    const products = q.items.map(i => `${i.product.name} x${i.quantity}`).join(', ');
    const lines = [
      `🗓️ *${date}* — $${q.total.toLocaleString('es-MX')} (${PAY_STATUS_LABEL[q.paymentStatus] || q.paymentStatus})`,
      `   ${products}`,
      `   Estado: ${STATUS_LABEL[q.status] || q.status}`,
    ];
    if (q.deliveryDate) lines.push(`   Entrega: ${q.deliveryDate}${q.deliverySlot ? `, ${q.deliverySlot}` : ''}`);
    if (q.paymentStatus === 'UNPAID') lines.push(`   💳 Pagar: ${FRONTEND_URL}/pago/${q.id}`);
    return lines.join('\n');
  });
  return `🧾 *Tus últimos pedidos:*\n\n${blocks.join('\n\n')}`;
}

function isHistoryCommand(text: string): boolean {
  const t = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
  return ['mis pedidos', 'historial', 'mis compras', 'pedidos anteriores', 'mi historial'].includes(t);
}

interface IncomingLocation {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}
// Pedido que llega del carrito del catálogo nativo de WhatsApp (mensaje "order")
interface IncomingOrderItem {
  product_retailer_id: string;
  quantity: string | number;
  item_price?: string | number;
  currency?: string;
}
interface IncomingOrder {
  catalog_id?: string;
  product_items: IncomingOrderItem[];
  text?: string; // nota opcional que el cliente escribe en el carrito
}
interface IncomingInput {
  text?: string;
  location?: IncomingLocation;
  order?: IncomingOrder;
}

// Convierte un pedido del carrito de WhatsApp en un mensaje de texto para que
// el bot (Verdy) lo procese con todo su flujo: valida colonia, pide dirección,
// guarda el pedido, avisa al dueño y manda el link de pago.
async function orderToText(order: IncomingOrder): Promise<string | null> {
  const items = order.product_items || [];
  if (items.length === 0) return null;

  // Mapear cada producto del catálogo de Meta a un producto de la app
  const retailerIds = items.map(i => String(i.product_retailer_id));
  const products = await prisma.product.findMany({
    where: { metaRetailerId: { in: retailerIds } },
    select: { name: true, unit: true, metaRetailerId: true },
  });
  const byRetailer = new Map(products.map(p => [p.metaRetailerId as string, p]));

  const lines: string[] = [];
  for (const it of items) {
    const p = byRetailer.get(String(it.product_retailer_id));
    const qty = Number(it.quantity) || 1;
    if (p) {
      lines.push(`${qty} ${p.unit} de ${p.name}`);
    } else {
      // No lo tenemos mapeado: lo incluimos con el precio que trae el carrito
      const price = it.item_price ? ` (aprox. $${Number(it.item_price)})` : '';
      lines.push(`${qty} x producto del catálogo${price}`);
    }
  }

  const nota = order.text ? ` Nota: ${order.text}.` : '';
  return (
    `🛒 Hice un pedido desde el catálogo de WhatsApp: ${lines.join(', ')}.${nota} ` +
    `Confírmame el total y ayúdame a completarlo con mis datos de entrega, por favor.`
  );
}

const MAX_INPUT_LEN = 1000; // los mensajes de WhatsApp son cortos; cap contra payloads gigantes

// Limpia el texto del cliente antes de usarlo: quita los marcadores del bloque
// técnico [COTIZACION] (para que nadie los inyecte pegándolos) y acota el largo.
function sanitizeUserText(text: string): string {
  return text
    .replace(/\[\s*\/?\s*COTIZACION\s*\]/gi, '')
    .slice(0, MAX_INPUT_LEN)
    .trim();
}

// Procesa un mensaje entrante (texto o ubicación) y responde por WhatsApp
export async function handleIncomingMessage(phone: string, input: IncomingInput): Promise<void> {
  // 0a. Pedido del carrito del catálogo de WhatsApp → lo convertimos en texto
  // para que el bot lo procese con su flujo normal (cliente, no dueño/productor).
  if (input.order) {
    const orderText = await orderToText(input.order);
    if (!orderText) {
      await sendTextMessage(phone, '🤔 Recibí tu pedido del catálogo pero venía vacío. ¿Me dices qué necesitas?');
      return;
    }
    input = { text: orderText }; // se procesa como mensaje de cliente
  }

  // 0b. Sanear el texto entrante (anti prompt-injection)
  if (input.text) input.text = sanitizeUserText(input.text);

  // 1. Cargar (o crear) la conversación
  const conversation = await prisma.botConversation.findUnique({ where: { phone } });
  const history: ChatMessage[] = Array.isArray(conversation?.messages)
    ? (conversation!.messages as unknown as ChatMessage[])
    : [];

  // 1a. ¿Es el DUEÑO con un comando de gestión? (pedidos / ruta / pagos)
  if (input.text && isOwnerPhone(phone)) {
    const ownerReply = await tryHandleOwnerMessage(input.text);
    if (ownerReply) {
      history.push({ role: 'user', text: input.text });
      history.push({ role: 'model', text: ownerReply });
      await prisma.botConversation.upsert({
        where: { phone },
        create: { phone, messages: history.slice(-MAX_HISTORY) as unknown as object },
        update: { messages: history.slice(-MAX_HISTORY) as unknown as object },
      });
      await sendTextMessage(phone, ownerReply);
      return;
    }
  }

  // 1b. ¿Es un PRODUCTOR? (código de acceso o sesión de productor activa)
  if (input.text) {
    const vendorResult = await tryHandleVendorMessage(input.text, conversation);
    if (vendorResult) {
      history.push({ role: 'user', text: input.text });
      history.push({ role: 'model', text: vendorResult.reply });
      await prisma.botConversation.upsert({
        where: { phone },
        create: {
          phone,
          messages: history.slice(-MAX_HISTORY) as unknown as object,
          vendorId: vendorResult.vendorId !== undefined ? vendorResult.vendorId : undefined,
          vendorAuthedAt: vendorResult.vendorAuthedAt !== undefined ? vendorResult.vendorAuthedAt : undefined,
          pendingAction: (vendorResult.pendingAction as unknown as object) ?? undefined,
        },
        update: {
          messages: history.slice(-MAX_HISTORY) as unknown as object,
          ...(vendorResult.vendorId !== undefined ? { vendorId: vendorResult.vendorId } : {}),
          ...(vendorResult.vendorAuthedAt !== undefined ? { vendorAuthedAt: vendorResult.vendorAuthedAt } : {}),
          ...(vendorResult.pendingAction !== undefined
            ? { pendingAction: (vendorResult.pendingAction as unknown as object) ?? Prisma.DbNull }
            : {}),
        },
      });
      await sendTextMessage(phone, vendorResult.reply);
      // Si pidió un reporte, enviar el PDF como documento
      if (vendorResult.document) {
        await sendDocumentMessage(
          phone,
          vendorResult.document.link,
          vendorResult.document.filename,
          vendorResult.document.caption,
        ).catch(e => console.error('Error enviando reporte PDF:', e));
      }
      return;
    }

    // 1c. ¿Pidió su historial de pedidos? (respuesta directa, sin IA)
    if (isHistoryCommand(input.text)) {
      const reply = await buildOrderHistoryReply(phone);
      history.push({ role: 'user', text: input.text });
      history.push({ role: 'model', text: reply });
      await prisma.botConversation.upsert({
        where: { phone },
        create: { phone, messages: history.slice(-MAX_HISTORY) as unknown as object },
        update: { messages: history.slice(-MAX_HISTORY) as unknown as object },
      });
      await sendTextMessage(phone, reply);
      return;
    }
  }

  // 2. Procesar entrada: texto o ubicación compartida 📍
  let savedLocation = (conversation?.lastLocation as IncomingLocation | null) ?? null;
  if (input.location) {
    savedLocation = input.location; // recordamos la ubicación para el pedido
    const ref = input.location.address || input.location.name || '';
    history.push({
      role: 'user',
      text: `📍 (Compartí mi ubicación de entrega${ref ? ': ' + ref : ''}). Lat ${input.location.latitude}, Lng ${input.location.longitude}`,
    });
  } else {
    history.push({ role: 'user', text: input.text || '' });
  }

  // 3. Catálogo en tiempo real
  const catalog = await getLiveCatalog();

  // 4. Pedir respuesta a la IA
  const botResponse = await generateBotReply(history.slice(-MAX_HISTORY), catalog);
  let replyText = botResponse.reply;

  // 5. Si la IA detectó una cotización confirmada, validar zona y guardarla
  let lastQuoteId = conversation?.lastQuote ?? null;
  let payLink: string | null = null; // link de pago si se creó un pedido
  if (botResponse.quote && botResponse.quote.items.length > 0) {
    // 5a. Validar la colonia contra las zonas de servicio (verificación dura,
    // por si la IA cierra un pedido fuera de zona)
    const zoneMatch = botResponse.quote.colonia
      ? findZoneByColonia(botResponse.quote.colonia)
      : null;

    if (botResponse.quote.colonia && !zoneMatch) {
      // Fuera de zona: NO se crea el pedido
      replyText = outOfZoneMessage(botResponse.quote.colonia);
    } else {
      try {
        // La fecha de entrega la fija el sistema (jueves con corte mié 7 pm),
        // no la IA: así ningún pedido queda con un día equivocado.
        const delivery = nextDeliveryInfo();
        const quote = await createQuote(
          {
            customerName: botResponse.quote.customerName,
            customerPhone: phone,
            notes: 'Cotización generada por el bot de WhatsApp 🤖',
            deliveryAddress: botResponse.quote.address || undefined,
            deliveryColonia: zoneMatch?.colonia || botResponse.quote.colonia,
            deliveryZone: zoneMatch?.zone.name,
            deliveryDate: delivery.dateLabel,
            deliverySlot: delivery.slot,
            latitude: savedLocation?.latitude,
            longitude: savedLocation?.longitude,
            items: botResponse.quote.items.map(i => ({
              productId: i.id,
              vendorId: '',  // el servicio lo resuelve desde la BD
              quantity: i.quantity,
              price: 0,      // el servicio usa el precio real de la BD
              unit: '',      // el servicio usa la unidad real de la BD
            })),
          },
          undefined,
        );
        lastQuoteId = quote.id;
        payLink = `${FRONTEND_URL}/pago/${quote.id}`; // link para que el cliente pague

        // 5b. NO se avisa al dueño todavía: el pedido solo se levanta cuando
        // está PAGADO (regla del negocio). El aviso sale desde markQuotePaid().
        console.log(`🧺 Carrito creado (pendiente de pago): ${quote.id} — ${quote.customerName}`);
      } catch (err) {
        console.error('Error guardando cotización del bot:', err);
      }
    }
  }

  // 6. Guardar la respuesta en el historial
  history.push({ role: 'model', text: replyText });

  // 7. Persistir la conversación (recortada)
  await prisma.botConversation.upsert({
    where: { phone },
    create: {
      phone,
      messages: history.slice(-MAX_HISTORY) as unknown as object,
      lastQuote: lastQuoteId,
      lastLocation: (savedLocation as unknown as object) ?? undefined,
    },
    update: {
      messages: history.slice(-MAX_HISTORY) as unknown as object,
      lastQuote: lastQuoteId,
      lastLocation: (savedLocation as unknown as object) ?? undefined,
    },
  });

  // 8. Responder al cliente. Si hay carrito, dejar MUY claro que el pedido
  // solo queda apartado cuando paga (no se levanta un pedido sin pagar).
  const customerReply = payLink
    ? `${replyText}\n\n💳 *Para apartar tu pedido, complétalo aquí:*\n${payLink}\n\n_Tu pedido se confirma cuando se registra el pago. Si no lo completas, no lo mandamos a preparar._`
    : replyText;
  await sendTextMessage(phone, customerReply);
}
