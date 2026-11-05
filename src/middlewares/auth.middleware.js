import jwt from 'jsonwebtoken';

const PERMISOS_POR_PERFIL = Object.freeze({
  ADMIN: ['*'],
  VENDEDOR: [
    'DASHBOARD_VENTAS',
    'CONTACTO_LISTAR',
    'CONTACTO_CREAR',
    'CONTACTO_EDITAR',
    'INTERACCION_REGISTRAR',
    'VENTAS_KANBAN_VER',
    'VENTAS_LEAD_CREAR',
    'VENTAS_CAMBIAR_ETAPA',
    'AUTO_CATALOGO_VER',
    'TESTDRIVE_AGENDAR',
    'TESTDRIVE_FEEDBACK',
    'TASACION_LISTAR_PEND',
    'TASACION_PERITAR',
    'TASACION_APROBAR_VALOR',
  ],
  FACTURADOR: [
    'CONTACTO_LISTAR',
    'CONTACTO_CREAR',
    'CONTACTO_EDITAR',
    'AUTO_CATALOGO_VER',
    'FACT_VENTAS_EMITIR',
    'FACT_VENTAS_ANULAR',
    'FACT_VENTAS_LISTAR',
    'COBRO_REGISTRAR',
    'COBRO_CONSULTAR_SALDO',
  ],
  TASADOR: [
    'AUTO_CATALOGO_VER',
    'TASACION_LISTAR_PEND',
    'TASACION_PERITAR',
    'TASACION_APROBAR_VALOR',
  ],
});

const normalizarPerfiles = (perfiles = []) => {
  if (!Array.isArray(perfiles)) return [];

  return [...new Set(perfiles.map((perfil) => String(perfil).trim().toUpperCase()).filter(Boolean))];
};

export const obtenerPermisosUsuario = (req) => {
  if (!req?.user) return [];

  const perfiles = normalizarPerfiles(req.user.perfiles);
  const permisosDirectos = Array.isArray(req.user.permisos)
    ? req.user.permisos.map((codigo) => String(codigo).trim().toUpperCase()).filter(Boolean)
    : [];

  const permisosPorPerfil = perfiles.flatMap((perfil) => {
    const permisos = PERMISOS_POR_PERFIL[perfil];
    return Array.isArray(permisos) ? permisos : [];
  });

  return [...new Set([...permisosDirectos, ...permisosPorPerfil])];
};

export const autenticarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Acceso no autorizado: Token no proporcionado',
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secreto_default');
    req.user = payload;
    next();
  } catch (error) {
    return res.status(403).json({
      error: 'Token inválido o expirado',
    });
  }
};

export const requerirPerfil = (...perfilesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !Array.isArray(req.user.perfiles)) {
      return res.status(403).json({
        error: 'Acceso denegado: El usuario no cuenta con perfiles asociados',
      });
    }

    const perfiles = normalizarPerfiles(req.user.perfiles);
    const esAdmin = perfiles.includes('ADMIN');
    const tienePerfil = perfilesPermitidos.some((perfil) =>
      perfiles.includes(String(perfil).trim().toUpperCase())
    );

    if (!esAdmin && !tienePerfil) {
      return res.status(403).json({
        error: `Acceso denegado: Se requiere uno de los siguientes perfiles: ${perfilesPermitidos.join(', ')}`,
      });
    }

    next();
  };
};

export const requerirPermiso = (...codigosRequeridos) => {
  return (req, res, next) => {
    if (!req.user || !Array.isArray(req.user.perfiles)) {
      return res.status(403).json({
        error: 'Acceso denegado: El usuario no cuenta con perfiles asociados',
      });
    }

    const perfiles = normalizarPerfiles(req.user.perfiles);
    const permisosUsuario = obtenerPermisosUsuario(req);
    const esAdmin = perfiles.includes('ADMIN');

    const faltantes = codigosRequeridos.filter(
      (codigo) => !esAdmin && !permisosUsuario.includes(String(codigo).trim().toUpperCase())
    );

    if (faltantes.length > 0) {
      return res.status(403).json({
        error: `Acceso denegado: faltan permisos de la matriz RBAC: ${faltantes.join(', ')}`,
      });
    }

    next();
  };
};

export const autorizarPerfiles = (...perfilesPermitidos) => requerirPerfil(...perfilesPermitidos);
