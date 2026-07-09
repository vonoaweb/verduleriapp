// ─── Stripe Service ──────────────────────────────
// Pasarela de pagos real. Usa la API REST de Stripe directamente (sin SDK).
// Requiere STRIPE_SECRET_KEY en el entorno (Render → Environment).
// Si no está configurada, la app cae automáticamente al modo demo.

import crypto from 'crypto';

const STRIPE_API = 'https://api.stripe.com/v1';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
// Cuenta de EE. UU. cobrando en pesos: Stripe US soporta MXN (deposita en USD)
const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY || 'mxn').toLowerCase();

export function stripeEnabled(): boolean {
  return Boolean(STRIPE_SECRET_KEY);
}

// Llamada genérica a la API de Stripe (form-encoded, como exige Stripe)
async function stripeRequest(
  method: 'GET' | 'POST',
  path: string,
  params?: Record<string, string>,
): Promise<any> {
  const url =
    method === 'GET' && params
      ? `${STRIPE_API}${path}?${new URLSearchParams(params)}`
      : `${STRIPE_API}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: method === 'POST' && params ? new URLSearchParams(params).toString() : undefined,
  });

  const data = (await response.json()) as any;
  if (!response.ok) {
    console.error('Stripe API error:', response.status, JSON.stringify(data));
    throw new Error(data?.error?.message || 'Error de Stripe');
  }
  return data;
}

interface QuoteForCheckout {
  id: string;
  customerName: string;
  total: number;
  items: Array<{
    quantity: number;
    price: number;
    unit: string;
    product: { name: string };
  }>;
}

// Crea una sesión de Stripe Checkout y devuelve la URL de pago
export async function createCheckoutSession(
  quote: QuoteForCheckout,
  frontendUrl: string,
): Promise<{ id: string; url: string }> {
  const description = quote.items
    .map(i => `${i.product.name} x${i.quantity} ${i.unit}`)
    .join(', ')
    .slice(0, 500);

  const session = await stripeRequest('POST', '/checkout/sessions', {
    mode: 'payment',
    client_reference_id: quote.id,
    'metadata[quoteId]': quote.id,
    // Un solo line item con el total (las cantidades pueden ser decimales, ej. 1.5 kg)
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': STRIPE_CURRENCY,
    'line_items[0][price_data][unit_amount]': String(Math.round(quote.total * 100)),
    'line_items[0][price_data][product_data][name]': `Pedido Kampo`,
    'line_items[0][price_data][product_data][description]': description,
    success_url: `${frontendUrl}/pago/${quote.id}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/pago/${quote.id}`,
  });

  return { id: session.id, url: session.url };
}

// Consulta una sesión de Checkout (para confirmar el pago al volver del redirect)
export async function getCheckoutSession(sessionId: string): Promise<{
  id: string;
  payment_status: string;
  metadata?: { quoteId?: string };
  client_reference_id?: string;
}> {
  return stripeRequest('GET', `/checkout/sessions/${encodeURIComponent(sessionId)}`);
}

// Verifica la firma del webhook de Stripe (HMAC-SHA256 sobre el body crudo)
export function verifyWebhookSignature(payload: Buffer | string, sigHeader: string): boolean {
  if (!STRIPE_WEBHOOK_SECRET) return false;
  const parts = Object.fromEntries(
    sigHeader.split(',').map(kv => kv.split('=') as [string, string]),
  );
  const timestamp = parts['t'];
  const signature = parts['v1'];
  if (!timestamp || !signature) return false;

  // Tolerancia de 5 minutos contra replay attacks
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const signedPayload = `${timestamp}.${typeof payload === 'string' ? payload : payload.toString('utf8')}`;
  const expected = crypto
    .createHmac('sha256', STRIPE_WEBHOOK_SECRET)
    .update(signedPayload)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
