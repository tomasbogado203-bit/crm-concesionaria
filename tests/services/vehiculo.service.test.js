import { jest } from '@jest/globals';

const mockPrisma = {
  vehiculo: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

jest.unstable_mockModule('../../src/config/prisma.js', () => ({
  default: mockPrisma,
}));

const { listarVehiculos, obtenerVehiculoPorId, crearVehiculo, actualizarVehiculo } =
  await import('../../src/services/vehiculo.service.js');

describe('Vehiculo Service - Catálogo y Control de Precios/Stock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listarVehiculos', () => {
    it('controla costoCompra en el select según permisos de costos', async () => {
      mockPrisma.vehiculo.findMany.mockResolvedValue([
        { id: 1, marca: 'Toyota', precioVenta: 1000 },
      ]);

      await listarVehiculos({}, false);
      expect(mockPrisma.vehiculo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({ costoCompra: false }),
        })
      );

      await listarVehiculos({}, true);
      expect(mockPrisma.vehiculo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({ costoCompra: true }),
        })
      );
    });
  });

  describe('crearVehiculo', () => {
    it('arroja 409 si el VIN ya existe en el sistema', async () => {
      mockPrisma.vehiculo.findUnique.mockResolvedValue({ id: 1, vin: 'VIN123' });

      await expect(
        crearVehiculo({ vin: 'VIN123', marca: 'Toyota', modelo: 'Corolla' })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('crea vehículo exitosamente', async () => {
      mockPrisma.vehiculo.findUnique.mockResolvedValue(null);
      mockPrisma.vehiculo.create.mockResolvedValue({ id: 10, vin: 'VIN999' });

      const res = await crearVehiculo({
        vin: 'VIN999',
        marca: 'Toyota',
        modelo: 'Corolla',
        version: 'XEI',
        anio: 2024,
        precioVenta: 25000000,
      });

      expect(res.id).toBe(10);
    });
  });

  describe('actualizarVehiculo', () => {
    it('arroja 404 si el vehículo no existe', async () => {
      mockPrisma.vehiculo.findUnique.mockResolvedValue(null);

      await expect(actualizarVehiculo(999, { precioVenta: 1200 })).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('actualiza datos correctamente', async () => {
      mockPrisma.vehiculo.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.vehiculo.update.mockResolvedValue({ id: 1, precioVenta: 1500 });

      const res = await actualizarVehiculo(1, { precioVenta: 1500 });
      expect(res.precioVenta).toBe(1500);
    });
  });
});
