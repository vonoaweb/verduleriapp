import { Request, Response, NextFunction } from 'express';

// ─── Error personalizado con código HTTP ─────────
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// ─── Middleware global de manejo de errores ───────
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('Error:', err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  // Error de Prisma - registro no encontrado
  if (err.name === 'NotFoundError') {
    res.status(404).json({ error: 'Recurso no encontrado' });
    return;
  }

  // Error de Prisma - constraint único violado
  if ((err as any).code === 'P2002') {
    res.status(409).json({ error: 'Ya existe un registro con esos datos' });
    return;
  }

  // Error genérico
  res.status(500).json({
    error: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Error interno del servidor',
  });
}
