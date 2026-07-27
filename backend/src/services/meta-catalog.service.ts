// ─── Sincronización con el catálogo de Meta/WhatsApp ──
// El catálogo nativo de WhatsApp (el ícono 🛍️) es una copia que vive en Meta.
// Cuando el productor cambia un precio o pausa un producto desde el bot, hay
// que reflejarlo allá o el cliente vería precios viejos.
//
// Requiere:
//   META_CATALOG_ID     — id del catálogo (Commerce Manager)
//   META_CATALOG_TOKEN  — token con permiso catalog_management
//                         (si no está, se intenta con WHATSAPP_ACCESS_TOKEN)
// Si no hay credenciales o el token no tiene permisos, se registra el aviso y
// la app sigue funcionando: la BD siempre es la fuente de verdad para el bot.

import { prisma } from '../config/prisma.js';

const GRAPH_URL = 'https://graph.facebook.com/v21.0';
const META_CATALOG_ID = process.env.META_CATALOG_ID;
const META_CATALOG_TOKEN = process.env.META_CATALOG_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
const CURRENCY = (process.env.STRIPE_CURRENCY || 'MXN').toUpperCase();

export function metaCatalogEnabled(): boolean {
  return Boolean(META_CATALOG_ID && META_CATALOG_TOKEN);
}

// Actualiza precio y disponibilidad de un producto en el catálogo de Meta.
// No lanza: si falla, solo lo deja en los logs (la venta no se detiene).
export async function syncProductToMeta(productId: string): Promise<boolean> {
  if (!metaCatalogEnabled()) return false;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true, price: true, status: true, metaRetailerId: true },
  });
  // Solo se sincronizan los productos que existen en el catálogo de Meta
  if (!product?.metaRetailerId) return false;

  try {
    const response = await fetch(`${GRAPH_URL}/${META_CATALOG_ID}/items_batch`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${META_CATALOG_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        item_type: 'PRODUCT_ITEM',
        requests: [
          {
            method: 'UPDATE',
            retailer_id: product.metaRetailerId,
            data: {
              price: `${product.price.toFixed(2)} ${CURRENCY}`,
              availability: product.status === 'ACTIVE' ? 'in stock' : 'out of stock',
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.warn(
        `⚠️ No se pudo sincronizar "${product.name}" con el catálogo de Meta (${response.status}): ${err.slice(0, 200)}`,
      );
      return false;
    }
    console.log(
      `🔄 Catálogo de Meta actualizado: ${product.name} → $${product.price} (${product.status === 'ACTIVE' ? 'disponible' : 'agotado'})`,
    );
    return true;
  } catch (error) {
    console.warn('⚠️ Error sincronizando con el catálogo de Meta:', error);
    return false;
  }
}
