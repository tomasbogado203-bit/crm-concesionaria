import { jest } from '@jest/globals';

const mockPrisma = {
  $transaction: jest.fn(async (cb) => await cb(mockPrisma)),
  factura: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  contacto: { findFirst: jest.fn() },
  vehiculo: { findUnique: jest.fn(), update: jest.fn() },
  oportunidad: { findUnique: jest.fn(), update: jest.fn() },
  transicionEtapa: { create: jest.fn() },
  pagoCobro: { create: jest.fn() },
  usuario: { findUnique: jest.fn() },
};

jest.unstable_mockModule('../../src/config/prisma.js', () => ({
  default: mockPrisma,
}));

const { emitirFactura, registrarPago, anularFactura, obtenerFacturaPorId } =
  await import('../../src/services/factura.service.js');

describe('Factura Service - Emisión Fiscal, CAE, Cobranzas y Transaccionalidad', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('emitirFactura', () => {
    it('debe arrojar 404 si el cliente receptor no existe o está inactivo', async () => {
      mockPrisma.contacto.findFirst.mockResolvedValue(null);

      await expect(
        emitirFactura({ clienteId: 99, items: [{ descripcion: 'Item', precioUnitario: 100 }] }, 1)
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('debe arrojar 409 Conflict si algún vehículo en los ítems ya fue vendido', async () => {
      mockPrisma.contacto.findFirst.mockResolvedValue({ id: 1, snActivo: true });
      mockPrisma.factura.count.mockResolvedValue(5);
      mockPrisma.vehiculo.findUnique.mockResolvedValue({ id: 10, marca: 'Ford', modelo: 'Fiesta', estado: 'VENDIDO' });

      await expect(
        emitirFactura(
          {
            clienteId: 1,
            items: [{ vehiculoId: 10, descripcion: 'Ford Fiesta', precioUnitario: 5000000 }],
          },
          1
        )
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('debe emitir factura con CAE AFIP y marcar vehículo como VENDIDO', async () => {
      mockPrisma.contacto.findFirst.mockResolvedValue({ id: 1, snActivo: true });
      mockPrisma.factura.count.mockResolvedValue(10);
      mockPrisma.vehiculo.findUnique.mockResolvedValue({ id: 2, estado: 'DISPONIBLE' });
      mockPrisma.vehiculo.update.mockResolvedValue({});
      mockPrisma.factura.create.mockResolvedValue({
        id: 100,
        puntoVenta: '0001',
        numeroComprobante: '00000011',
        caeAfip: '74123456789012',
        total: 10000000,
      });

      const res = await emitirFactura(
        {
          clienteId: 1,
          items: [{ vehiculoId: 2, descripcion: 'Auto 0km', precioUnitario: 10000000 }],
        },
        1
      );

      expect(res.id).toBe(100);
      expect(mockPrisma.vehiculo.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { estado: 'VENDIDO' },
      });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('comisiones de vendedor', () => {
    it('debe calcular la comisión sobre el total de la factura emitida y guardar el monto', async () => {
      mockPrisma.contacto.findFirst.mockResolvedValue({ id: 1, snActivo: true });
      mockPrisma.usuario.findUnique.mockResolvedValue({ id: 1, comisionPorcentaje: 5 });
      mockPrisma.factura.count.mockResolvedValue(10);
      mockPrisma.vehiculo.findUnique.mockResolvedValue({ id: 2, estado: 'DISPONIBLE' });
      mockPrisma.vehiculo.update.mockResolvedValue({});
      mockPrisma.factura.create.mockResolvedValue({
        id: 100,
        total: 100000,
        comisionPorcentaje: 5,
        comisionMonto: 5000,
      });

      const res = await emitirFactura(
        {
          clienteId: 1,
          items: [{ vehiculoId: 2, descripcion: 'Auto 0km', precioUnitario: 100000 }],
          comisionPorcentaje: 5,
        },
        1
      );

      expect(res.comisionMonto).toBe(5000);
      expect(res.comisionPorcentaje).toBe(5);
      expect(mockPrisma.factura.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            comisionPorcentaje: 5,
            comisionMonto: 5000,
          }),
        })
      );
    });
  });

  describe('registrarPago', () => {
    it('debe arrojar 404 si la factura no existe', async () => {
      mockPrisma.factura.findUnique.mockResolvedValue(null);

      await expect(registrarPago(999, { monto: 100, metodoPago: 'EFECTIVO' })).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('debe arrojar 409 si la factura está ANULADA', async () => {
      mockPrisma.factura.findUnique.mockResolvedValue({ id: 1, estado: 'ANULADA', pagos: [] });

      await expect(registrarPago(1, { monto: 100, metodoPago: 'EFECTIVO' })).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it('debe arrojar 400 si el pago supera el saldo total adeudado', async () => {
      mockPrisma.factura.findUnique.mockResolvedValue({
        id: 1,
        total: 1000,
        estado: 'EMITIDA',
        pagos: [{ monto: 800 }],
      });

      await expect(registrarPago(1, { monto: 300, metodoPago: 'EFECTIVO' })).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('debe registrar el cobro y cambiar estado a PAGADA si cubre la totalidad', async () => {
      mockPrisma.factura.findUnique.mockResolvedValue({
        id: 1,
        total: 1000,
        estado: 'EMITIDA',
        pagos: [{ monto: 500 }],
      });
      mockPrisma.pagoCobro.create.mockResolvedValue({ id: 1, monto: 500 });
      mockPrisma.factura.update.mockResolvedValue({});

      await registrarPago(1, { monto: 500, metodoPago: 'TRANSFERENCIA' });

      expect(mockPrisma.factura.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { estado: 'PAGADA' },
      });
    });
  });

  describe('anularFactura', () => {
    it('debe arrojar 409 si la factura ya está anulada', async () => {
      mockPrisma.factura.findUnique.mockResolvedValue({
        id: 1,
        estado: 'ANULADA',
        detalles: [],
        pagos: [],
      });

      await expect(anularFactura(1)).rejects.toMatchObject({ statusCode: 409 });
    });

    it('debe anular la factura y liberar los vehículos a DISPONIBLE', async () => {
      mockPrisma.factura.findUnique.mockResolvedValue({
        id: 1,
        estado: 'EMITIDA',
        detalles: [{ vehiculoId: 8 }],
        pagos: [],
      });
      mockPrisma.factura.update.mockResolvedValue({ id: 1, estado: 'ANULADA' });
      mockPrisma.vehiculo.update.mockResolvedValue({});

      const res = await anularFactura(1);

      expect(res.estado).toBe('ANULADA');
      expect(mockPrisma.vehiculo.update).toHaveBeenCalledWith({
        where: { id: 8 },
        data: { estado: 'DISPONIBLE' },
      });
    });
  });

  describe('obtenerFacturaPorId', () => {
    it('calcula correctamente saldo pendiente y total pagado', async () => {
      mockPrisma.factura.findUnique.mockResolvedValue({
        id: 10,
        total: 50000,
        pagos: [{ monto: 20000 }, { monto: 10000 }],
      });

      const res = await obtenerFacturaPorId(10);
      expect(res.totalPagado).toBe(30000);
      expect(res.saldoPendiente).toBe(20000);
    });
  });
});
