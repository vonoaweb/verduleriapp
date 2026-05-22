// ─── WhatsApp Integration Service ────────────────
// Soporta dos modos:
// 1. wa.me links (gratis, el cliente abre WhatsApp)
// 2. WhatsApp Business API (de pago, envío automático)

interface QuoteMessage {
  vendorWhatsapp: string;
  vendorName: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    unit: string;
  }>;
  total: number;
  quoteId: string;
  notes?: string;
}

// ─── Generar link wa.me (modo gratuito) ──────────
export function generateWhatsAppLink(data: QuoteMessage): string {
  const phone = data.vendorWhatsapp.replace(/[^0-9]/g, '');

  const itemLines = data.items.map((item, i) =>
    `${i + 1}. ${item.name} - ${item.quantity} ${item.unit} x $${item.price.toLocaleString('es-CL')} = $${(item.quantity * item.price).toLocaleString('es-CL')}`
  ).join('\n');

  const message = [
    `🥬 *Nueva Cotización - VerduleriApp*`,
    ``,
    `📋 *Cotización #${data.quoteId}*`,
    `👤 Cliente: ${data.customerName}`,
    `📞 Teléfono: ${data.customerPhone}`,
    ``,
    `🛒 *Productos:*`,
    itemLines,
    ``,
    `💰 *Total: $${data.total.toLocaleString('es-CL')}*`,
    data.notes ? `\n📝 Nota: ${data.notes}` : '',
    ``,
    `_Cotización generada por VerduleriApp_`,
  ].filter(Boolean).join('\n');

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

// ─── WhatsApp Business API (modo premium) ────────
// Requiere: WHATSAPP_PHONE_ID y WHATSAPP_ACCESS_TOKEN en .env
const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

export async function sendWhatsAppMessage(data: QuoteMessage): Promise<{ success: boolean; messageId?: string; waLink?: string }> {
  // Si no hay credenciales de la API, retornar link wa.me
  if (!WHATSAPP_PHONE_ID || !WHATSAPP_ACCESS_TOKEN) {
    return {
      success: true,
      waLink: generateWhatsAppLink(data),
    };
  }

  // Enviar mediante WhatsApp Business API
  try {
    const phone = data.vendorWhatsapp.replace(/[^0-9]/g, '');

    const itemText = data.items.map((item, i) =>
      `${i + 1}. ${item.name} - ${item.quantity} ${item.unit} x $${item.price.toLocaleString('es-CL')}`
    ).join('\n');

    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'template',
          template: {
            name: 'new_quote_notification',
            language: { code: 'es' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: data.customerName },
                  { type: 'text', text: data.quoteId },
                  { type: 'text', text: itemText },
                  { type: 'text', text: `$${data.total.toLocaleString('es-CL')}` },
                ],
              },
            ],
          },
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('WhatsApp API error:', error);
      // Fallback a wa.me link
      return {
        success: true,
        waLink: generateWhatsAppLink(data),
      };
    }

    const result = await response.json() as { messages?: Array<{ id: string }> };
    return {
      success: true,
      messageId: result.messages?.[0]?.id,
    };
  } catch (error) {
    console.error('WhatsApp send error:', error);
    // Fallback a wa.me link
    return {
      success: true,
      waLink: generateWhatsAppLink(data),
    };
  }
}

// ─── Webhook para recibir respuestas de WhatsApp ──
export function verifyWebhook(mode: string, token: string, challenge: string): string | null {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'verduleriapp-webhook-token';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return challenge;
  }
  return null;
}

export interface WhatsAppWebhookEntry {
  changes: Array<{
    value: {
      messages?: Array<{
        from: string;
        text?: { body: string };
        timestamp: string;
        type: string;
      }>;
      statuses?: Array<{
        id: string;
        status: 'sent' | 'delivered' | 'read';
        timestamp: string;
      }>;
    };
  }>;
}

export function processWebhookEntry(entry: WhatsAppWebhookEntry) {
  for (const change of entry.changes) {
    const { messages, statuses } = change.value;

    if (messages) {
      for (const msg of messages) {
        console.log(`📩 Mensaje de ${msg.from}: ${msg.text?.body || '[media]'}`);
        // Aquí podrías actualizar el estado de la cotización
        // o notificar al vendedor en el dashboard
      }
    }

    if (statuses) {
      for (const status of statuses) {
        console.log(`📊 Estado mensaje ${status.id}: ${status.status}`);
      }
    }
  }
}
