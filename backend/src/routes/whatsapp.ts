import { Router, Request, Response } from 'express';
import { verifyWebhook, processWebhookEntry, type WhatsAppWebhookEntry } from '../services/whatsapp.service.js';

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

// POST /api/whatsapp/webhook — Recibir mensajes/estados
router.post('/webhook', (req: Request, res: Response) => {
  const body = req.body;

  if (body.object === 'whatsapp_business_account') {
    for (const entry of body.entry || []) {
      processWebhookEntry(entry as WhatsAppWebhookEntry);
    }
    res.status(200).send('OK');
  } else {
    res.status(404).send('Not Found');
  }
});

export default router;
