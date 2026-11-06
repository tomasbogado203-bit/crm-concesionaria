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
  costoCompra: z.number().nonnegative().optional(),
  costoReacondicionamiento: z.number().nonnegative().optional(),
  fechaIngresoStock: z.coerce.date().optional().nullable(),
  consignado: z.boolean().optional().default(false),
  consignacionPorcentaje: z.number().min(0).max(100).optional(),
  consignacionMonto: z.number().nonnegative().optional(),
  estado: z.enum(['DISPONIBLE', 'RESERVADO', 'VENDIDO']).default('DISPONIBLE'),
  imagenUrl: z.string().optional().nullable().or(z.literal('')),
});

export const actualizarVehiculoSchema = crearVehiculoSchema.partial();

export const solicitudPublicaSchema = z.object({
  tipo: z.enum(['TEST_DRIVE', 'CONSULTA', 'COTIZACION', 'PERMUTA']).default('CONSULTA'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().optional().nullable(),
  telefono: z.string().min(6, 'El teléfono es obligatorio'),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  dni: z.string().optional().nullable(),
  vehiculoId: z.number().int().positive('ID de vehículo inválido'),
  mensaje: z.string().optional().nullable(),
  fechaPreferencia: z.string().optional().nullable(),
  permutaMarca: z.string().optional().nullable(),
  permutaModelo: z.string().optional().nullable(),
  permutaAnio: z.number().optional().nullable(),
  permutaKilometraje: z.number().optional().nullable(),
});
