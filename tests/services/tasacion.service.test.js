import { jest } from '@jest/globals';

const mockPrisma = {
  $transaction: jest.fn(async (cb) => await cb(mockPrisma)),
  tasacion: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  contacto: { findFirst: jest.fn() },
  vehiculo: { create: jest.fn() },
  interaccion: { create: jest.fn() },
};

jest.unstable_mockModule('../../src/config/prisma.js', () => ({
  default: mockPrisma,
}));

const { solicitarTasacion, registrarPeritaje, resolverTasacion, listarTasaciones } =
  await import('../../src/services/tasacion.service.js');

describe('Tasacion Service - Inspección y Permuta de Usados', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('solicitarTasacion', () => {
    it('arroja 404 si el cliente no existe', async () => {
      mockPrisma.contacto.findFirst.mockResolvedValue(null);
      await expect(
        solicitarTasacion({ clienteId: 99, dominio: 'AA123BB', marca: 'Ford', modelo: 'Ka', anio: 2018, kilometraje: 50000 }, 1)
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('crea solicitud de tasación con estado SOLICITADA', async () => {
      mockPrisma.contacto.findFirst.mockResolvedValue({ id: 1, snActivo: true });
      mockPrisma.tasacion.create.mockResolvedValue({ id: 10, estado: 'SOLICITADA' });

      const res = await solicitarTasacion(
        { clienteId: 1, dominio: 'AA123BB', marca: 'Ford', modelo: 'Ka', anio: 2018, kilometraje: 50000 },
        1
      );
      expect(res.id).toBe(10);
    });
  });

  describe('registrarPeritaje', () => {
    it('arroja 404 si la tasación no existe', async () => {
      mockPrisma.tasacion.findUnique.mockResolvedValue(null);
      await expect(registrarPeritaje(999, { valorTasado: 5000000 }, 1)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('actualiza estado a EN_PERITAJE con detalles técnicos', async () => {
      mockPrisma.tasacion.findUnique.mockResolvedValue({ id: 1, dominio: 'AA123', marca: 'Ford', modelo: 'Ka' });
      mockPrisma.tasacion.update.mockResolvedValue({ id: 1, estado: 'EN_PERITAJE', valorTasado: 6000000 });
      mockPrisma.interaccion.create.mockResolvedValue({});

      const res = await registrarPeritaje(1, {
        estadoCarroceria: 'BUENO',
        estadoMecanica: 'BUENO',
        valorTasado: 6000000,
      }, 1);
      expect(res.estado).toBe('EN_PERITAJE');
    });
  });

  describe('resolverTasacion', () => {
    it('si se aprueba con ingresarAStock, crea el vehículo e ingresa al stock', async () => {
      mockPrisma.tasacion.findUnique.mockResolvedValue({
        id: 1,
        clienteId: 5,
        dominio: 'AB123CD',
        marca: 'Peugeot',
        modelo: '208',
        anio: 2020,
        kilometraje: 45000,
        estado: 'EN_PERITAJE',
        valorTasado: 8000000,
      });
      mockPrisma.vehiculo.create.mockResolvedValue({ id: 88, vin: 'PERMUTA-AB123CD-1234' });
      mockPrisma.tasacion.update.mockResolvedValue({ id: 1, estado: 'INGRESADO_STOCK', vehiculoIngresadoId: 88 });
      mockPrisma.interaccion.create.mockResolvedValue({});

      const res = await resolverTasacion(1, { valorAceptado: 8000000, ingresarAStock: true }, 1);

      expect(res.estado).toBe('INGRESADO_STOCK');
      expect(mockPrisma.vehiculo.create).toHaveBeenCalled();
    });

    it('si se rechaza, actualiza a RECHAZADA', async () => {
      mockPrisma.tasacion.findUnique.mockResolvedValue({
        id: 1,
        clienteId: 5,
        dominio: 'AB123CD',
        marca: 'Peugeot',
        modelo: '208',
      });
      mockPrisma.tasacion.update.mockResolvedValue({ id: 1, estado: 'RECHAZADA' });
      mockPrisma.interaccion.create.mockResolvedValue({});

      const res = await resolverTasacion(1, { estado: 'RECHAZADA', motivoRechazo: 'Precio no acordado' }, 1);
      expect(res.estado).toBe('RECHAZADA');
    });
  });

  describe('listarTasaciones', () => {
    it('lista todas las tasaciones', async () => {
      mockPrisma.tasacion.findMany.mockResolvedValue([{ id: 1 }]);
      const res = await listarTasaciones();
      expect(res).toHaveLength(1);
    });
  });
});
