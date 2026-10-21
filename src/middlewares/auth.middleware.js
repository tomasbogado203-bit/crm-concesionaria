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
