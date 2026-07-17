import { Router, Request, Response } from 'express';
import { verifyWebhook, verifyMetaSignature } from '../services/whatsapp.service.js';
import { handleIncomingMessage } from '../services/bot.service.js';

const router = Router();

// GET /api/whatsapp/webhook — Verificación del webhook (Meta lo llama al configurar)
router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  const result = verifyWebhook(mode, token, challenge);
  if (result) {
    console.log('✅ Webhook verificado');
    res.status(200).send(result);
  } else {
    res.status(403).send('Forbidden');
  }
});

// POST /api/whatsapp/webhook — Recibir mensajes entrantes
router.post('/webhook', (req: Request, res: Response) => {
  // Verificar que el mensaje venga realmente de Meta (si hay app secret)
  const signature = req.header('x-hub-signature-256');
  if (!verifyMetaSignature((req as any).rawBody, signature)) {
    console.warn('⛔ Webhook con firma inválida — mensaje descartado');
    res.status(403).send('Forbidden');
    return;
  }

  const body = req.body;

  // Responder 200 de inmediato (Meta exige respuesta rápida)
  res.status(200).send('OK');

  if (body.object !== 'whatsapp_business_account') return;

  // Procesar los mensajes de forma asíncrona (no bloquear la respuesta)
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const messages = change.value?.messages;
      if (!messages) continue;

      for (const msg of messages) {
        const phone = msg.from as string;
        if (msg.type === 'text' && msg.text?.body) {
          handleIncomingMessage(phone, { text: msg.text.body as string }).catch(err =>
            console.error('Error procesando mensaje del bot:', err),
          );
        } else if (msg.type === 'location' && msg.location) {
          // El cliente compartió su ubicación de entrega 📍
          handleIncomingMessage(phone, { location: msg.location }).catch(err =>
            console.error('Error procesando ubicación del bot:', err),
          );
        } else if (msg.type === 'order' && msg.order) {
          // El cliente hizo un pedido desde el carrito del catálogo de WhatsApp 🛒
          handleIncomingMessage(phone, { order: msg.order }).catch(err =>
            console.error('Error procesando pedido del carrito:', err),
          );
        }
      }
    }
  }
});

export default router;
