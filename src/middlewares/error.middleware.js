import { ZodError } from 'zod';

export const manejadorErrores = (err, req, res, next) => {
  const esProduccion = process.env.NODE_ENV === 'production';

  // Solo loguear en desarrollo para no saturar los logs de prod
  if (!esProduccion) {
    console.error('Error capturado:', err);
  }

  // Errores de validación Zod → 400 con detalle de campos
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Error de validación',
      detalles: err.errors.map((e) => ({
        campo: e.path.join('.'),
        mensaje: e.message,
      })),
    });
  }

  // En producción nunca exponemos el mensaje interno de errores no esperados
  const statusCode = err.statusCode || 500;
  const mensaje =
    esProduccion && statusCode === 500
      ? 'Error interno del servidor'
      : err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    error: mensaje,
  });
};
