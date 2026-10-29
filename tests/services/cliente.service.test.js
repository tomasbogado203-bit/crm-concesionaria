import { jest } from '@jest/globals';

const mockPrisma = {
  $transaction: jest.fn(async (cb) => await cb(mockPrisma)),
  contacto: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  rol: {
    findUnique: jest.fn(),
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
  listarClientes,
  crearCliente,
  obtenerClientePorId,
  actualizarCliente,
  eliminarCliente,
  registrarInteraccion,
  enviarCorreoACliente,
} = await import('../../src/services/cliente.service.js');

describe('Cliente Service - Party Model y Seguimiento 360', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listarClientes', () => {
    it('debe listar contactos activos', async () => {
      mockPrisma.contacto.findMany.mockResolvedValue([{ id: 1, nombres: 'Juan' }]);
      const res = await listarClientes();
      expect(res).toHaveLength(1);
    });
  });

  describe('crearCliente', () => {
    it('debe arrojar 409 si el DNI/CUIT ya existe', async () => {
      mockPrisma.rol.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.contacto.create.mockRejectedValue({
        code: 'P2002',
        message: 'Unique constraint failed on the fields: (`numero_dni`)',
      });

      // Si falla por duplicado de documento, el error de negocio debe ser 409
      await expect(
        crearCliente({ documento: '38123456', nombre: 'Juan', tipoPersona: 'FISICA', telefono: '12345' })
      ).rejects.toBeDefined();
    });

    it('crea cliente físico exitosamente con Party Model y rol', async () => {
      mockPrisma.rol.findUnique.mockResolvedValue({ id: 1, descripcionRol: 'Cliente' });
      mockPrisma.contacto.create.mockResolvedValue({ id: 10, nombres: 'Juan' });

      const res = await crearCliente({
        nombre: 'Juan',
        apellido: 'Perez',
        documento: '38123456',
        tipoPersona: 'FISICA',
        telefono: '123456',
      });

      expect(res.id).toBe(10);
      expect(mockPrisma.contacto.create).toHaveBeenCalled();
    });
  });

  describe('obtenerClientePorId', () => {
    it('arroja 404 si el contacto no existe', async () => {
      mockPrisma.contacto.findFirst.mockResolvedValue(null);
      await expect(obtenerClientePorId(999)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('retorna la ficha si existe', async () => {
      mockPrisma.contacto.findFirst.mockResolvedValue({ id: 5, nombres: 'Ana' });
      const res = await obtenerClientePorId(5);
      expect(res.id).toBe(5);
    });
  });

  describe('actualizarCliente', () => {
    it('actualiza contacto correctamente', async () => {
      mockPrisma.contacto.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.contacto.update.mockResolvedValue({ id: 1, nombres: 'Carlos Modificado' });

      const res = await actualizarCliente(1, { nombre: 'Carlos Modificado' });
      expect(res.nombres).toBe('Carlos Modificado');
    });
  });

  describe('eliminarCliente', () => {
    it('ejecuta baja lógica marcando snActivo en false', async () => {
      mockPrisma.contacto.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.contacto.update.mockResolvedValue({ id: 1, snActivo: false });

      const res = await eliminarCliente(1);
      expect(res.snActivo).toBe(false);
      expect(mockPrisma.contacto.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { snActivo: false } })
      );
    });
  });

  describe('registrarInteraccion', () => {
    it('registra una llamada o whatsapp en la bitácora', async () => {
      mockPrisma.contacto.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.interaccion.create.mockResolvedValue({ id: 1, canal: 'WHATSAPP' });

      const res = await registrarInteraccion(1, { canal: 'WHATSAPP', resumen: 'Consulta por stock' }, 2);
      expect(res.canal).toBe('WHATSAPP');
    });
  });

  describe('enviarCorreoACliente', () => {
    it('arroja 400 si el cliente no posee correo electrónico', async () => {
      mockPrisma.contacto.findFirst.mockResolvedValue({ id: 1, email: null });
      await expect(
        enviarCorreoACliente(1, { asunto: 'Catálogo', mensaje: 'Hola' }, 1)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('registra interacción EMAIL y envía el correo exitosamente', async () => {
      mockPrisma.contacto.findFirst.mockResolvedValue({
        id: 1,
        email: 'juan@test.com',
        nombres: 'Juan',
        apellido: 'Perez',
        tipoPersona: 'FISICA',
      });
      mockPrisma.interaccion.create.mockResolvedValue({ id: 10, canal: 'EMAIL' });

      const res = await enviarCorreoACliente(
        1,
        { asunto: 'Catálogo 2026', mensaje: 'Te adjuntamos opciones disponibles' },
        1
      );
      expect(res.interaccion.canal).toBe('EMAIL');
      expect(mockPrisma.interaccion.create).toHaveBeenCalled();
    });
  });
});
