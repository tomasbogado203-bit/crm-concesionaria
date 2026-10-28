import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';

const mockPrisma = {
  $transaction: jest.fn(async (cb) => await cb(mockPrisma)),
  usuario: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  contacto: {
    create: jest.fn(),
  },
  perfil: {
    findFirst: jest.fn(),
  },
  perfilUsuario: {
    findMany: jest.fn(),
  },
  perfilMenuPrg: {
    findMany: jest.fn(),
  },
};

jest.unstable_mockModule('../../src/config/prisma.js', () => ({
  default: mockPrisma,
}));

const { registrarUsuario, crearUsuarioPorAdmin, iniciarSesion, obtenerMenuUsuario } =
  await import('../../src/services/auth.service.js');

describe('Auth Service - RBAC, Party Model y Seguridad', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registrarUsuario (Público)', () => {
    it('debe arrojar 409 si el mail ya se encuentra registrado', async () => {
      mockPrisma.usuario.findFirst.mockResolvedValue({ id: 1, mail: 'existe@test.com' });

      await expect(
        registrarUsuario({ nombre: 'Test', email: 'existe@test.com', password: 'password123' })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('debe crear contacto y usuario asignando obligatoriamente rol VENDEDOR', async () => {
      mockPrisma.usuario.findFirst.mockResolvedValue(null);
      mockPrisma.contacto.create.mockResolvedValue({ id: 10 });
      mockPrisma.perfil.findFirst.mockResolvedValue({ id: 2, nombrePerfil: 'VENDEDOR' });
      mockPrisma.usuario.create.mockResolvedValue({
        id: 5,
        mail: 'nuevo@test.com',
        nombreUsuario: 'nuevo',
      });

      const res = await registrarUsuario({
        nombre: 'Nuevo',
        email: 'nuevo@test.com',
        password: 'password123',
      });

      expect(res.id).toBe(5);
      expect(mockPrisma.perfil.findFirst).toHaveBeenCalledWith({
        where: { nombrePerfil: 'VENDEDOR' },
      });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('crearUsuarioPorAdmin', () => {
    it('debe permitir crear usuarios con roles especiales como ADMIN o FACTURADOR', async () => {
      mockPrisma.usuario.findFirst.mockResolvedValue(null);
      mockPrisma.contacto.create.mockResolvedValue({ id: 20 });
      mockPrisma.perfil.findFirst.mockResolvedValue({ id: 1, nombrePerfil: 'ADMIN' });
      mockPrisma.usuario.create.mockResolvedValue({
        id: 7,
        mail: 'admin2@test.com',
      });

      const res = await crearUsuarioPorAdmin({
        nombre: 'Super',
        email: 'admin2@test.com',
        password: 'passwordSeguro123',
        rol: 'ADMIN',
      });

      expect(res.id).toBe(7);
      expect(mockPrisma.perfil.findFirst).toHaveBeenCalledWith({
        where: { nombrePerfil: 'ADMIN' },
      });
    });
  });

  describe('iniciarSesion', () => {
    it('debe arrojar 401 si el usuario no existe', async () => {
      mockPrisma.usuario.findFirst.mockResolvedValue(null);

      await expect(
        iniciarSesion({ email: 'nadie@test.com', password: '123' })
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('debe arrojar 401 si la contraseña no coincide', async () => {
      const hashed = await bcrypt.hash('correcta123', 10);
      mockPrisma.usuario.findFirst.mockResolvedValue({
        id: 1,
        snActivo: true,
        password: hashed,
        contacto: { nombres: 'Test', apellido: 'User' },
        perfiles: [{ perfil: { nombrePerfil: 'VENDEDOR' } }],
      });

      await expect(
        iniciarSesion({ email: 'test@test.com', password: 'incorrecta' })
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('debe emitir token JWT y devolver datos de usuario con perfiles', async () => {
      const password = 'miPasswordSegura123';
      const hashed = await bcrypt.hash(password, 10);
      mockPrisma.usuario.findFirst.mockResolvedValue({
        id: 1,
        snActivo: true,
        mail: 'carlos@concesionaria.com',
        nombreUsuario: 'carlos',
        password: hashed,
        sucursal: 'Central',
        contacto: { id: 10, nombres: 'Carlos', apellido: 'Vendedor' },
        perfiles: [{ perfil: { nombrePerfil: 'VENDEDOR' } }],
      });

      const res = await iniciarSesion({ email: 'carlos@concesionaria.com', password });

      expect(res.token).toBeDefined();
      expect(res.usuario.perfiles).toContain('VENDEDOR');
      expect(res.usuario.email).toBe('carlos@concesionaria.com');
    });
  });

  describe('obtenerMenuUsuario', () => {
    it('devuelve array vacío si el usuario no tiene perfiles', async () => {
      mockPrisma.perfilUsuario.findMany.mockResolvedValue([]);

      const menu = await obtenerMenuUsuario(1);
      expect(menu).toEqual([]);
    });

    it('arma jerarquía de menús y PRGs según perfiles', async () => {
      mockPrisma.perfilUsuario.findMany.mockResolvedValue([{ perfilId: 1 }]);
      mockPrisma.perfilMenuPrg.findMany.mockResolvedValue([
        {
          menu: { id: 1, nombreMenu: 'Ventas', orden: 1, menuPadreId: null },
          prg: { codigoPrg: 'VENTAS_KANBAN', descripcion: 'Kanban' },
        },
      ]);

      const menu = await obtenerMenuUsuario(1);
      expect(menu).toHaveLength(1);
      expect(menu[0].nombre).toBe('Ventas');
      expect(menu[0].programas[0].codigo).toBe('VENTAS_KANBAN');
    });
  });
});
