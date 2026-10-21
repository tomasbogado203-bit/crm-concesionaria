import { z } from 'zod';

export const emitirFacturaSchema = z.object({
  oportunidadId: z.number().int().positive().optional(),
  clienteId: z.number().int().positive('ID de cliente inválido'),
  tipoComprobante: z
    .enum(['FACTURA_A', 'FACTURA_B', 'FACTURA_C', 'RECIBO'])
    .default('FACTURA_B'),
  puntoVenta: z.string().min(1).default('0001'),
  items: z
    .array(
      z.object({
        vehiculoId: z.number().int().positive().optional(),
        descripcion: z.string().min(2, 'La descripción es obligatoria'),
        cantidad: z.number().int().positive().default(1),
        precioUnitario: z.number().positive('El precio unitario debe ser positivo'),
      })
    )
    .min(1, 'Debe incluir al menos un ítem a facturar'),
});

export const registrarPagoSchema = z.object({
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'PRENDARIO', 'PERMUTA']),
  monto: z.number().positive('El monto del cobro debe ser positivo'),
  nroComprobante: z.string().optional(),
});
