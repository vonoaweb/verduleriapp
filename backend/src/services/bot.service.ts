// ─── Bot Orchestrator ────────────────────────────
// Une todo: recibe un mensaje de WhatsApp, consulta el catálogo en tiempo real,
// pasa por la IA (Gemini), guarda la cotización si aplica y responde al cliente.

import { prisma } from '../config/prisma.js';
import { generateBotReply, type ChatMessage, type CatalogProduct } from './gemini.service.js';
import { createQuote } from './quote.service.js';
import { sendTextMessage } from './whatsapp.service.js';

const MAX_HISTORY = 20; // Cuántos mensajes recordar por conversación
const OWNER_WHATSAPP = process.env.OWNER_WHATSAPP; // Número del dueño para avisarle de pedidos nuevos

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

// Procesa un mensaje entrante y responde por WhatsApp
export async function handleIncomingMessage(phone: string, text: string): Promise<void> {
  // 1. Cargar (o crear) la conversación
  const conversation = await prisma.botConversation.findUnique({ where: { phone } });
  const history: ChatMessage[] = Array.isArray(conversation?.messages)
    ? (conversation!.messages as unknown as ChatMessage[])
    : [];

  // 2. Agregar el mensaje del cliente
  history.push({ role: 'user', text });

  // 3. Catálogo en tiempo real
  const catalog = await getLiveCatalog();

  // 4. Pedir respuesta a la IA
  const botResponse = await generateBotReply(history.slice(-MAX_HISTORY), catalog);

  // 5. Si la IA detectó una cotización confirmada, guardarla en la BD
  let lastQuoteId = conversation?.lastQuote ?? null;
  if (botResponse.quote && botResponse.quote.items.length > 0) {
    try {
      const quote = await createQuote(
        {
          customerName: botResponse.quote.customerName,
          customerPhone: phone,
          notes: 'Cotización generada por el bot de WhatsApp 🤖',
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

      // 5b. Avisar al DUEÑO por WhatsApp del nuevo pedido (además del panel)
      if (OWNER_WHATSAPP) {
        const itemLines = quote.items
          .map(
            (i, idx) =>
              `${idx + 1}. ${i.product.name} - ${i.quantity} ${i.unit} x $${i.price.toLocaleString('es-CO')} = $${(i.quantity * i.price).toLocaleString('es-CO')}`,
          )
          .join('\n');
        const ownerMsg = [
          '🔔 *NUEVO PEDIDO - VerduleriApp*',
          '',
          `👤 Cliente: ${quote.customerName}`,
          `📞 Teléfono: ${quote.customerPhone}`,
          '',
          '🛒 *Productos:*',
          itemLines,
          '',
          `💰 *Total: $${quote.total.toLocaleString('es-CO')}*`,
          '',
          `_Pedido #${quote.id} · revísalo también en el panel_`,
        ].join('\n');
        await sendTextMessage(OWNER_WHATSAPP, ownerMsg).catch(e =>
          console.error('Error avisando al dueño:', e),
        );
      }
    } catch (err) {
      console.error('Error guardando cotización del bot:', err);
    }
  }

  // 6. Guardar la respuesta de la IA en el historial
  history.push({ role: 'model', text: botResponse.reply });

  // 7. Persistir la conversación (recortada)
  await prisma.botConversation.upsert({
    where: { phone },
    create: {
      phone,
      messages: history.slice(-MAX_HISTORY) as unknown as object,
      lastQuote: lastQuoteId,
    },
    update: {
      messages: history.slice(-MAX_HISTORY) as unknown as object,
      lastQuote: lastQuoteId,
    },
  });

  // 8. Responder al cliente por WhatsApp
  await sendTextMessage(phone, botResponse.reply);
}
