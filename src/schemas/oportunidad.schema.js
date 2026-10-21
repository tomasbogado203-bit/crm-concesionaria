import { z } from 'zod';

export const crearOportunidadSchema = z.object({
  clienteId: z.number().int().positive('ID de cliente inválido'),
  vehiculoId: z.number().int().positive('ID de vehículo inválido'),
  montoEstimado: z.number().positive('El monto estimado debe ser mayor a 0'),
  etapa: z
    .enum(['PROSPECTO', 'TEST_DRIVE', 'NEGOCIACION', 'RESERVADO', 'GANADA', 'PERDIDA'])
    .default('PROSPECTO'),
});

export const cambiarEtapaSchema = z.object({
  etapa: z.enum(['PROSPECTO', 'TEST_DRIVE', 'NEGOCIACION', 'RESERVADO', 'GANADA', 'PERDIDA']),
  motivoPerdida: z.string().optional(),
});
