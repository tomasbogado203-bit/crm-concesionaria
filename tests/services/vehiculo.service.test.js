import { jest } from '@jest/globals';

const mockPrisma = {
  $transaction: jest.fn(async (cb) => await cb(mockPrisma)),
  vehiculo: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  usuario: {
    findFirst: jest.fn(),
  },
  rol: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  contacto: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  oportunidad: {
    create: jest.fn(),
  },
  transicionEtapa: {
    create: jest.fn(),
  },
  pruebaManejo: {
    create: jest.fn(),
  },
  tasacion: {
    create: jest.fn(),
  },
  interaccion: {
    create: jest.fn(),
  },
};

jest.unstable_mockModule('../../src/config/prisma.js', () => ({
  default: mockPrisma,
}));

const {
  listarVehiculos,
  obtenerVehiculoPorId,
  crearVehiculo,
  actualizarVehiculo,
  crearSolicitudPublica,
} = await import('../../src/services/vehiculo.service.js');

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

    it('incluye costos de reacondicionamiento, stock y consignación en el select', async () => {
      mockPrisma.vehiculo.findMany.mockResolvedValue([
        { id: 2, marca: 'Ford', precioVenta: 1500 },
      ]);

      await listarVehiculos({}, true);

      expect(mockPrisma.vehiculo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            costoCompra: true,
            costoReacondicionamiento: true,
            fechaIngresoStock: true,
            consignado: true,
            consignacionPorcentaje: true,
            consignacionMonto: true,
          }),
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

  describe('crearSolicitudPublica (Ingesta comercial desde Salón Virtual)', () => {
    it('arroja 404 si el vehículo solicitado no existe', async () => {
      mockPrisma.vehiculo.findUnique.mockResolvedValue(null);

      await expect(
        crearSolicitudPublica({
          vehiculoId: 999,
          nombre: 'Juan Perez',
          telefono: '1123456789',
        })
      ).rejects.toMatchObject({ statusCode: 404, message: 'Vehículo no encontrado' });
    });

    it('crea lead, oportunidad, prueba de manejo e interacción para solicitud TEST_DRIVE', async () => {
      mockPrisma.vehiculo.findUnique.mockResolvedValue({
        id: 5,
        marca: 'Volkswagen',
        modelo: 'Taos',
        version: 'Highline',
        anio: 2024,
        precioVenta: 35000000,
      });
      mockPrisma.usuario.findFirst.mockResolvedValue({ id: 3 });
      mockPrisma.rol.findUnique.mockResolvedValue({ id: 1, descripcionRol: 'Cliente' });
      mockPrisma.contacto.findFirst.mockResolvedValue(null);
      mockPrisma.contacto.create.mockResolvedValue({
        id: 42,
        nombres: 'Carlos',
        apellido: 'Gomez',
        telefono: '1144445555',
      });
      mockPrisma.oportunidad.create.mockResolvedValue({ id: 101, etapa: 'TEST_DRIVE' });
      mockPrisma.transicionEtapa.create.mockResolvedValue({ id: 1 });
      mockPrisma.pruebaManejo.create.mockResolvedValue({ id: 10 });
      mockPrisma.interaccion.create.mockResolvedValue({ id: 20 });

      const res = await crearSolicitudPublica({
        tipo: 'TEST_DRIVE',
        vehiculoId: 5,
        nombre: 'Carlos Gomez',
        telefono: '1144445555',
        mensaje: 'Quiero probarla el sábado',
      });

      expect(res.exito).toBe(true);
      expect(res.codigoReferencia).toBe('SOL-0101');
      expect(mockPrisma.pruebaManejo.create).toHaveBeenCalled();
      expect(mockPrisma.transicionEtapa.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            oportunidadId: 101,
            etapaDestino: 'TEST_DRIVE',
          }),
        })
      );
      expect(mockPrisma.interaccion.create).toHaveBeenCalled();
    });

    it('crea solicitud de tasación si el tipo es PERMUTA', async () => {
      mockPrisma.vehiculo.findUnique.mockResolvedValue({
        id: 7,
        marca: 'Toyota',
        modelo: 'Corolla Cross',
        version: 'SEG',
        anio: 2023,
        precioVenta: 32000000,
      });
      mockPrisma.usuario.findFirst.mockResolvedValue({ id: 2 });
      mockPrisma.rol.findUnique.mockResolvedValue({ id: 1, descripcionRol: 'Cliente' });
      mockPrisma.contacto.findFirst.mockResolvedValue({ id: 50, nombres: 'Ana' });
      mockPrisma.oportunidad.create.mockResolvedValue({ id: 102, etapa: 'PROSPECTO' });
      mockPrisma.transicionEtapa.create.mockResolvedValue({ id: 2 });
      mockPrisma.tasacion.create.mockResolvedValue({ id: 15 });
      mockPrisma.interaccion.create.mockResolvedValue({ id: 21 });

      const res = await crearSolicitudPublica({
        tipo: 'PERMUTA',
        vehiculoId: 7,
        nombre: 'Ana Lopez',
        telefono: '1199998888',
        permutaMarca: 'Chevrolet',
        permutaModelo: 'Cruze',
        permutaAnio: 2019,
        permutaKilometraje: 65000,
      });

      expect(res.exito).toBe(true);
      expect(mockPrisma.tasacion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            marca: 'Chevrolet',
            modelo: 'Cruze',
            anio: 2019,
            kilometraje: 65000,
          }),
        })
      );
    });
  });
});
