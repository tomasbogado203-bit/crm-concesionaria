import { jest } from '@jest/globals';

// Mock de prisma
const mockPrisma = {
  $transaction: jest.fn(async (callback) => await callback(mockPrisma)),
  contacto: { findFirst: jest.fn() },
  vehiculo: { findUnique: jest.fn(), update: jest.fn() },
  oportunidad: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  transicionEtapa: { create: jest.fn() },
  interaccion: { create: jest.fn() },
};

jest.unstable_mockModule('../../src/config/prisma.js', () => ({
  default: mockPrisma,
}));

const { crearOportunidad, cambiarEtapa, registrarSenia, listarOportunidades } =
  await import('../../src/services/oportunidad.service.js');

describe('Oportunidad Service - Reglas de Negocio, Transaccionalidad y Conflictos 409', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('crearOportunidad', () => {
    it('debe arrojar 404 si el contacto/cliente no existe o está inactivo', async () => {
      mockPrisma.contacto.findFirst.mockResolvedValue(null);

      await expect(
        crearOportunidad({ clienteId: 99, vehiculoId: 1, montoEstimado: 1000 }, 1)
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('debe arrojar 404 si el vehículo no existe', async () => {
      mockPrisma.contacto.findFirst.mockResolvedValue({ id: 1, snActivo: true });
      mockPrisma.vehiculo.findUnique.mockResolvedValue(null);

      await expect(
        crearOportunidad({ clienteId: 1, vehiculoId: 99, montoEstimado: 1000 }, 1)
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('debe arrojar 409 Conflict si el vehículo ya fue vendido', async () => {
      mockPrisma.contacto.findFirst.mockResolvedValue({ id: 1, snActivo: true });
      mockPrisma.vehiculo.findUnique.mockResolvedValue({ id: 1, estado: 'VENDIDO' });

      await expect(
        crearOportunidad({ clienteId: 1, vehiculoId: 1, montoEstimado: 1000 }, 1)
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('debe arrojar 409 Conflict si se crea como RESERVADO y el vehículo ya está reservado', async () => {
      mockPrisma.contacto.findFirst.mockResolvedValue({ id: 1, snActivo: true });
      mockPrisma.vehiculo.findUnique.mockResolvedValue({ id: 1, estado: 'RESERVADO' });

      await expect(
        crearOportunidad({ clienteId: 1, vehiculoId: 1, etapa: 'RESERVADO', montoEstimado: 1000 }, 1)
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('debe crear la oportunidad y registrar la transición inicial de forma transaccional', async () => {
      mockPrisma.contacto.findFirst.mockResolvedValue({ id: 1, snActivo: true });
      mockPrisma.vehiculo.findUnique.mockResolvedValue({ id: 1, estado: 'DISPONIBLE' });
      mockPrisma.oportunidad.create.mockResolvedValue({ id: 50, etapa: 'PROSPECTO' });
      mockPrisma.transicionEtapa.create.mockResolvedValue({ id: 1 });

      const res = await crearOportunidad({ clienteId: 1, vehiculoId: 1, montoEstimado: 50000 }, 1);

      expect(res.id).toBe(50);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.transicionEtapa.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            oportunidadId: 50,
            etapaOrigen: 'PROSPECTO',
            etapaDestino: 'PROSPECTO',
          }),
        })
      );
    });
  });

  describe('cambiarEtapa', () => {
    it('debe arrojar 404 si la oportunidad no existe', async () => {
      mockPrisma.oportunidad.findUnique.mockResolvedValue(null);

      await expect(cambiarEtapa(999, 'TEST_DRIVE', 1)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('debe arrojar 403 si el vendedor no es dueño de la oportunidad ni ADMIN', async () => {
      mockPrisma.oportunidad.findUnique.mockResolvedValue({
        id: 10,
        usuarioId: 2, // Vendedor distinto
        etapa: 'PROSPECTO',
        vehiculo: { estado: 'DISPONIBLE' },
      });

      await expect(cambiarEtapa(10, 'TEST_DRIVE', 1, false)).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('debe arrojar 409 Conflict si la transición de etapa no está permitida', async () => {
      mockPrisma.oportunidad.findUnique.mockResolvedValue({
        id: 10,
        usuarioId: 1,
        etapa: 'PROSPECTO',
        vehiculo: { estado: 'DISPONIBLE' },
      });

      // Salto directo de PROSPECTO a GANADA sin negociación ni facturación previa
      await expect(cambiarEtapa(10, 'GANADA', 1, false)).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it('debe arrojar 409 Conflict si pasa a RESERVADO pero el auto ya fue vendido', async () => {
      mockPrisma.oportunidad.findUnique.mockResolvedValue({
        id: 10,
        usuarioId: 1,
        etapa: 'NEGOCIACION',
        vehiculo: { id: 5, estado: 'VENDIDO' },
      });

      await expect(cambiarEtapa(10, 'RESERVADO', 1, false)).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it('debe arrojar 409 Conflict si pasa a RESERVADO y el auto ya está reservado por otra oportunidad', async () => {
      mockPrisma.oportunidad.findUnique.mockResolvedValue({
        id: 10,
        usuarioId: 1,
        etapa: 'NEGOCIACION',
        vehiculo: { id: 5, estado: 'RESERVADO' },
      });
      // Simula otra oportunidad distinta activa con ese auto
      mockPrisma.oportunidad.findFirst.mockResolvedValue({ id: 99 });

      await expect(cambiarEtapa(10, 'RESERVADO', 1, false)).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it('debe ejecutar la transición y actualizar stock a RESERVADO correctamente', async () => {
      mockPrisma.oportunidad.findUnique.mockResolvedValue({
        id: 10,
        usuarioId: 1,
        vehiculoId: 5,
        etapa: 'NEGOCIACION',
        vehiculo: { id: 5, estado: 'DISPONIBLE' },
      });
      mockPrisma.vehiculo.update.mockResolvedValue({});
      mockPrisma.transicionEtapa.create.mockResolvedValue({});
      mockPrisma.oportunidad.update.mockResolvedValue({ id: 10, etapa: 'RESERVADO' });

      const res = await cambiarEtapa(10, 'RESERVADO', 1, false);

      expect(res.etapa).toBe('RESERVADO');
      expect(mockPrisma.vehiculo.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { estado: 'RESERVADO' },
      });
      expect(mockPrisma.transicionEtapa.create).toHaveBeenCalled();
    });

    it('debe liberar el vehículo a DISPONIBLE si la oportunidad pasa a PERDIDA', async () => {
      mockPrisma.oportunidad.findUnique.mockResolvedValue({
        id: 10,
        usuarioId: 1,
        vehiculoId: 5,
        etapa: 'RESERVADO',
        vehiculo: { id: 5, estado: 'RESERVADO' },
      });
      mockPrisma.vehiculo.update.mockResolvedValue({});
      mockPrisma.transicionEtapa.create.mockResolvedValue({});
      mockPrisma.oportunidad.update.mockResolvedValue({ id: 10, etapa: 'PERDIDA' });

      const res = await cambiarEtapa(10, 'PERDIDA', 1, false, 'Cliente desistió');

      expect(res.etapa).toBe('PERDIDA');
      expect(mockPrisma.vehiculo.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { estado: 'DISPONIBLE' },
      });
    });
  });

  describe('registrarSenia', () => {
    it('debe arrojar 409 si el vehículo ya fue vendido', async () => {
      mockPrisma.oportunidad.findUnique.mockResolvedValue({
        id: 1,
        usuarioId: 1,
        vehiculo: { estado: 'VENDIDO' },
      });

      await expect(
        registrarSenia(1, { montoSenia: 1000 }, 1, false)
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('debe arrojar 400 si el monto de seña supera el valor del vehículo', async () => {
      mockPrisma.oportunidad.findUnique.mockResolvedValue({
        id: 1,
        usuarioId: 1,
        vehiculo: { estado: 'DISPONIBLE', precioVenta: 1000000 },
      });

      await expect(
        registrarSenia(1, { montoSenia: 2000000 }, 1, false)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('debe registrar la seña, bloquear el auto y guardar interacción', async () => {
      mockPrisma.oportunidad.findUnique.mockResolvedValue({
        id: 1,
        usuarioId: 1,
        clienteId: 5,
        vehiculoId: 10,
        etapa: 'NEGOCIACION',
        vehiculo: { id: 10, marca: 'Toyota', modelo: 'Yaris', vin: 'VIN123', precioVenta: 20000000 },
      });
      mockPrisma.vehiculo.update.mockResolvedValue({});
      mockPrisma.transicionEtapa.create.mockResolvedValue({});
      mockPrisma.interaccion.create.mockResolvedValue({});
      mockPrisma.oportunidad.update.mockResolvedValue({ id: 1, etapa: 'RESERVADO', montoSenia: 1000000 });

      const res = await registrarSenia(1, { montoSenia: 1000000, metodoPago: 'TRANSFERENCIA' }, 1, false);

      expect(res.etapa).toBe('RESERVADO');
      expect(mockPrisma.vehiculo.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { estado: 'RESERVADO' },
      });
      expect(mockPrisma.interaccion.create).toHaveBeenCalled();
    });
  });

  describe('listarOportunidades', () => {
    it('filtra por usuarioId para vendedores y sin filtro para admin', async () => {
      mockPrisma.oportunidad.findMany.mockResolvedValue([{ id: 1 }]);

      await listarOportunidades(5, false);
      expect(mockPrisma.oportunidad.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { usuarioId: 5 } })
      );

      await listarOportunidades(5, true);
      expect(mockPrisma.oportunidad.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
    });
  });
});
