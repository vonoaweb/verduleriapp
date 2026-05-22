import { Request, Response, NextFunction } from 'express';
import { z } from 'zod/v4';

// ─── Middleware de validación con Zod ─────────────
// Valida body, params, o query según el schema proporcionado
export function validate(schema: z.ZodType, source: 'body' | 'params' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = req[source];
    const result = schema.safeParse(data);

    if (!result.success) {
      const errors = result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      res.status(400).json({
        error: 'Datos inválidos',
        details: errors,
      });
      return;
    }

    // Reemplazar con datos validados y transformados
    if (source === 'body') {
      req.body = result.data;
    }

    next();
  };
}
