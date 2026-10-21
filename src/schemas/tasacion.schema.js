import { z } from 'zod';

export const solicitarTasacionSchema = z.object({
  clienteId: z.number({ required_error: 'El cliente es obligatorio' }).int().positive(),
  oportunidadId: z.number().int().positive().optional().nullable(),
  dominio: z.string().min(4, 'El dominio/patente debe tener al menos 4 caracteres').max(10),
  marca: z.string().min(2, 'La marca es obligatoria'),
  modelo: z.string().min(1, 'El modelo es obligatorio'),
  version: z.string().optional().nullable(),
  anio: z.number().int().min(1980, 'Año inválido').max(new Date().getFullYear() + 1, 'Año inválido'),
  kilometraje: z.number().int().min(0, 'El kilometraje no puede ser negativo'),
  combustible: z.string().optional().default('NAFTA'),
  detallesPeritaje: z.string().optional().nullable(),
});

export const peritarTasacionSchema = z.object({
  estadoCarroceria: z.enum(['EXCELENTE', 'BUENO', 'REGULAR', 'MALO']).default('BUENO'),
  estadoPintura: z.enum(['EXCELENTE', 'BUENO', 'REGULAR', 'MALO']).default('BUENO'),
  estadoMecanica: z.enum(['EXCELENTE', 'BUENO', 'REGULAR', 'MALO']).default('BUENO'),
  estadoCubiertas: z.enum(['EXCELENTE', 'BUENO', 'REGULAR', 'MALO']).default('BUENO'),
  detallesPeritaje: z.string().optional().nullable(),
  valorTasado: z.number().positive('El valor tasado debe ser mayor a 0'),
});

export const resolverTasacionSchema = z.object({
  estado: z.enum(['APROBADA', 'RECHAZADA']),
  valorAceptado: z.number().positive('El valor de toma acordado debe ser mayor a 0').optional().nullable(),
  ingresarAStock: z.boolean().optional().default(false),
});
