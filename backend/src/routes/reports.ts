// ─── Reportes de ventas (PDF) ────────────────────
// Sirve el PDF que el bot envía por WhatsApp. La URL lleva un token firmado
// (HMAC) con vencimiento de 48 h, así que no expone datos de otros vendedores.

import { Router, Request, Response, NextFunction } from 'express';
import { verifyReportToken, buildSalesReportPdf } from '../services/report.service.js';

const router = Router();

// GET /api/reports/sales?token=...
router.get('/sales', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.query.token as string;
    const data = token ? verifyReportToken(token) : null;
    if (!data) {
      res.status(403).json({ error: 'Enlace de reporte inválido o vencido' });
      return;
    }
    const pdf = await buildSalesReportPdf(data.vendorId, data.period);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="reporte-ventas-${data.period}.pdf"`,
    );
    res.send(pdf);
  } catch (error) {
    next(error);
  }
});

export default router;
