import jwt from 'jsonwebtoken';

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

/**
 * Middleware de Control de Acceso Basado en Roles (RBAC).
 * Verifica que el usuario autenticado posea al menos uno de los perfiles permitidos.
 * Los usuarios con perfil 'ADMIN' tienen bypass automático (superusuario).
 */
export const autorizarPerfiles = (...perfilesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !Array.isArray(req.user.perfiles)) {
      return res.status(403).json({
        error: 'Acceso denegado: El usuario no cuenta con perfiles asociados',
      });
    }

    const esAdmin = req.user.perfiles.includes('ADMIN');
    const tienePerfil = perfilesPermitidos.some((p) => req.user.perfiles.includes(p));

    if (!esAdmin && !tienePerfil) {
      return res.status(403).json({
        error: `Acceso denegado: Se requiere uno de los siguientes perfiles: ${perfilesPermitidos.join(', ')}`,
      });
    }

    next();
  };
};
