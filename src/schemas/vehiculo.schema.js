import { z } from 'zod';

export const crearVehiculoSchema = z.object({
  vin: z.string().min(5, 'El número de chasis / VIN es obligatorio'),
  marca: z.string().min(2, 'La marca es obligatoria'),
  modelo: z.string().min(1, 'El modelo es obligatorio'),
  version: z.string().min(1, 'La versión es obligatoria'),
  anio: z.number().int().min(1980).max(2030),
  condicion: z.enum(['CERO_KM', 'USADO']).default('CERO_KM'),
  kilometraje: z.number().int().nonnegative().optional().default(0),
  precioVenta: z.number().positive('El precio de venta debe ser positivo'),
  costoCompra: z.number().positive().optional(),
  estado: z.enum(['DISPONIBLE', 'RESERVADO', 'VENDIDO']).default('DISPONIBLE'),
  imagenUrl: z.string().optional().nullable().or(z.literal('')),
});

export const actualizarVehiculoSchema = crearVehiculoSchema.partial();
