import { jest } from '@jest/globals';
import { requerirPerfil, requerirPermiso } from '../src/middlewares/auth.middleware.js';

describe('Matriz RBAC de permisos por perfil y PRG', () => {
  const crearRespuesta = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it('permite el acceso de administrador aun sin permisos explícitos', () => {
    const req = {
      user: {
        perfiles: ['ADMIN'],
        permisos: [],
      },
    };
    const res = crearRespuesta();
    const next = jest.fn();

    requerirPerfil('ADMIN')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rechaza un perfil válido si le faltan permisos del programa requerido', () => {
    const req = {
      user: {
        perfiles: ['VENDEDOR'],
        permisos: ['CONTACTO_LISTAR'],
      },
    };
    const res = crearRespuesta();
    const next = jest.fn();

    requerirPermiso('FACT_VENTAS_LISTAR')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('faltan permisos de la matriz RBAC'),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('permite el acceso cuando el usuario tiene el perfil y el PRG requerido', () => {
    const req = {
      user: {
        perfiles: ['FACTURADOR'],
        permisos: ['FACT_VENTAS_LISTAR', 'COBRO_REGISTRAR'],
      },
    };
    const res = crearRespuesta();
    const next = jest.fn();

    requerirPerfil('FACTURADOR');
    requerirPermiso('FACT_VENTAS_LISTAR')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('deniega cuando el perfil no está autorizado aunque el usuario tenga otros permisos', () => {
    const req = {
      user: {
        perfiles: ['VENDEDOR'],
        permisos: ['COBRO_REGISTRAR'],
      },
    };
    const res = crearRespuesta();
    const next = jest.fn();

    requerirPerfil('FACTURADOR')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Se requiere uno de los siguientes perfiles: FACTURADOR'),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
