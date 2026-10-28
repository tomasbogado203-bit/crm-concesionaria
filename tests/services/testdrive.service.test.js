import { jest } from '@jest/globals';

const mockPrisma = {
  pruebaManejo: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  contacto: { findFirst: jest.fn() },
  vehiculo: { findUnique: jest.fn() },
  interaccion: { create: jest.fn() },
};

jest.unstable_mockModule('../../src/config/prisma.js', () => ({
  default: mockPrisma,
}));

const { agendarTestDrive, registrarFeedback, listarTestDrives } =
  await import('../../src/services/testdrive.service.js');

describe('TestDrive Service - Agendamiento y Experiencia de Manejo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('agendarTestDrive', () => {
    it('debe arrojar 404 si el cliente no existe', async () => {
      mockPrisma.contacto.findFirst.mockResolvedValue(null);
      await expect(
        agendarTestDrive({ clienteId: 99, vehiculoId: 1, fechaHora: new Date(), licenciaConducir: '123' }, 1)
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('debe agendar cita correctamente', async () => {
      mockPrisma.contacto.findFirst.mockResolvedValue({ id: 1, snActivo: true });
      mockPrisma.vehiculo.findUnique.mockResolvedValue({ id: 2, estado: 'DISPONIBLE' });
      mockPrisma.pruebaManejo.create.mockResolvedValue({ id: 5, estado: 'PROGRAMADO' });

      const res = await agendarTestDrive(
        { clienteId: 1, vehiculoId: 2, fechaHora: new Date(), licenciaConducir: 'B1-123' },
        1
      );
      expect(res.id).toBe(5);
    });
  });

  describe('registrarFeedback', () => {
    it('debe arrojar 404 si la prueba de manejo no existe', async () => {
      mockPrisma.pruebaManejo.findUnique.mockResolvedValue(null);
      await expect(
        registrarFeedback(999, { feedback: 'Muy bueno', calificacion: 5 }, 1)
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('actualiza el feedback y calificacion', async () => {
      mockPrisma.pruebaManejo.findUnique.mockResolvedValue({ id: 5, usuarioId: 1, vehiculo: { marca: 'Toyota', modelo: 'Corolla' } });
      mockPrisma.pruebaManejo.update.mockResolvedValue({ id: 5, estado: 'COMPLETADO', calificacion: 5 });
      mockPrisma.interaccion.create.mockResolvedValue({});

      const res = await registrarFeedback(5, { feedback: 'Excelente andar', calificacion: 5 }, 1);
      expect(res.estado).toBe('COMPLETADO');
    });
  });

  describe('listarTestDrives', () => {
    it('lista todas las pruebas', async () => {
      mockPrisma.pruebaManejo.findMany.mockResolvedValue([{ id: 1 }]);
      const res = await listarTestDrives();
      expect(res).toHaveLength(1);
    });
  });
});
