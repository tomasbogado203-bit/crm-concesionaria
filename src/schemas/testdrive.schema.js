import { z } from 'zod';

export const agendarTestDriveSchema = z.object({
  clienteId: z.number().int().positive('ID de cliente inválido'),
  vehiculoId: z.number().int().positive('ID de vehículo inválido'),
  fechaHora: z.string().min(1, 'La fecha y hora del turno es obligatoria'),
  licenciaConducir: z.string().min(4, 'El número de licencia de conducir es obligatorio'),
});

export const feedbackTestDriveSchema = z.object({
  estado: z.enum(['PROGRAMADO', 'COMPLETADO', 'CANCELADO']).default('COMPLETADO'),
  feedback: z.string().optional(),
  calificacion: z.number().int().min(1).max(5).optional(),
});
