// ─── Gemini AI Service ───────────────────────────
// Cerebro conversacional del bot. Usa Google Gemini (free tier).
// Requiere GEMINI_API_KEY en .env (gratis en https://aistudio.google.com)

import { zonesSummary } from '../config/zones.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: string;
}

// Construye el "system prompt" con el catálogo en tiempo real
function buildSystemPrompt(catalog: CatalogProduct[]): string {
  const catalogText = catalog
    .map(p => `- ${p.name} | $${p.price.toLocaleString('es-MX')} por ${p.unit} (id: ${p.id})`)
    .join('\n');

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Mexico_City',
  });

  return `Eres "Verdy" 🥬, el asistente de WhatsApp de VerduleriApp, una verdulería online que entrega en la Zona Metropolitana de Guadalajara (ZMG).
Hablas en español mexicano, con un tono cercano, amable y breve. Usa emojis con moderación.
Hoy es ${today}.

Tu trabajo es ayudar al cliente a armar un pedido de frutas y verduras con entrega a domicilio.

CATÁLOGO DISPONIBLE HOY (precios reales, en tiempo real):
${catalogText}

ZONAS DE ENTREGA (solo entregamos en estas colonias, cada ruta tiene sus días):
${zonesSummary()}

REGLAS:
1. Solo puedes cotizar productos del catálogo de arriba. Si piden algo que no está, dilo amablemente y sugiere alternativas.
2. Cuando el cliente pida productos, confirma cantidades y muestra el subtotal de cada uno y el total.
3. Los precios son los del catálogo. Nunca inventes precios.
4. Antes de cerrar el pedido necesitas: (a) NOMBRE del cliente, (b) COLONIA (debe estar en las zonas de entrega), (c) DIRECCIÓN: número de casa y referencias (o su ubicación de WhatsApp 📎 → Ubicación), y (d) DÍA y HORARIO de entrega.
5. La COLONIA es obligatoria. Si la colonia del cliente NO está en las zonas de entrega, díselo con amabilidad, menciona las zonas donde sí llegamos y NO cierres el pedido.
6. El DÍA de entrega debe ser uno de los días de la ruta de su colonia (ej. si su colonia es de la Ruta Centro, ofrece martes o viernes). Ofrece el día más próximo y los horarios disponibles (9:00 a 13:00 o 16:00 a 20:00).
7. Si el cliente comparte su ubicación de WhatsApp, agradécela y solo pide lo que falte (colonia, número de casa, día).
8. Cuando el cliente CONFIRME su pedido final (con nombre, colonia válida, dirección y día/horario), responde con tu mensaje de confirmación y AL FINAL agrega un bloque técnico EXACTAMENTE con este formato (el cliente no lo verá):
[COTIZACION]{"customerName":"NOMBRE","colonia":"COLONIA","address":"NUMERO DE CASA Y REFERENCIAS","deliveryDate":"DIA DE ENTREGA (ej. jueves 2 de julio)","deliverySlot":"HORARIO (ej. 9:00 a 13:00)","items":[{"id":"ID_PRODUCTO","quantity":CANTIDAD}]}[/COTIZACION]
9. No agregues el bloque [COTIZACION] hasta que el cliente confirme explícitamente y ya tengas todos los datos.
10. Si el cliente pregunta por sus pedidos anteriores, dile que escriba *mis pedidos*.
11. Mantén las respuestas cortas, como un chat de WhatsApp real.`;
}

// Resultado del bot: el texto a enviar y, si aplica, la cotización detectada
export interface BotResponse {
  reply: string;
  quote?: {
    customerName: string;
    colonia?: string;
    address?: string;
    deliveryDate?: string;
    deliverySlot?: string;
    items: Array<{ id: string; quantity: number }>;
  };
}

// Extrae el bloque [COTIZACION]...[/COTIZACION] del texto del modelo
function extractQuote(text: string): {
  cleanText: string;
  quote?: BotResponse['quote'];
} {
  const match = text.match(/\[COTIZACION\]([\s\S]*?)\[\/COTIZACION\]/);
  if (!match) return { cleanText: text.trim() };

  const cleanText = text.replace(match[0], '').trim();
  try {
    const parsed = JSON.parse(match[1].trim());
    if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
      return {
        cleanText,
        quote: {
          customerName: String(parsed.customerName || 'Cliente WhatsApp'),
          colonia: parsed.colonia ? String(parsed.colonia) : undefined,
          address: parsed.address ? String(parsed.address) : undefined,
          deliveryDate: parsed.deliveryDate ? String(parsed.deliveryDate) : undefined,
          deliverySlot: parsed.deliverySlot ? String(parsed.deliverySlot) : undefined,
          items: parsed.items
            .filter((i: any) => i && i.id && i.quantity > 0)
            .map((i: any) => ({ id: String(i.id), quantity: Number(i.quantity) })),
        },
      };
    }
  } catch {
    // JSON malformado: ignorar el bloque
  }
  return { cleanText };
}

// Llama a Gemini con el historial y el catálogo
export async function generateBotReply(
  history: ChatMessage[],
  catalog: CatalogProduct[],
): Promise<BotResponse> {
  if (!GEMINI_API_KEY) {
    return {
      reply:
        '⚙️ El bot todavía no está configurado (falta la clave de IA). Por favor contacta al negocio directamente.',
    };
  }

  const contents = history.map(m => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: buildSystemPrompt(catalog) }] },
      contents,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 800,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Gemini API error:', response.status, err);
    return {
      reply: 'Disculpa, tuve un problemita técnico 😅. ¿Podrías repetir tu mensaje?',
    };
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const rawText =
    data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';

  if (!rawText) {
    return { reply: 'Disculpa, no entendí bien 😅. ¿Me lo repites?' };
  }

  const { cleanText, quote } = extractQuote(rawText);
  return { reply: cleanText, quote };
}
