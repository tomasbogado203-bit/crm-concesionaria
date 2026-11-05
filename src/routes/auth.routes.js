import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller.js';
import { autenticarToken, requerirPerfil } from '../middlewares/auth.middleware.js';
import { validarSchema } from '../middlewares/validate.middleware.js';
import { loginSchema, crearUsuarioAdminSchema } from '../schemas/auth.schema.js';

const router = Router();

// Rate limiting específico para mitigar ataques de fuerza bruta en el inicio de sesión
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Probá de nuevo en 15 minutos.' },
});

// Registro público deshabilitado: el alta de usuarios es exclusiva del Administrador
router.post('/registro', (req, res) => {
  return res.status(403).json({
    error: 'El registro público está deshabilitado por políticas de seguridad de la concesionaria. La creación de nuevos usuarios debe ser realizada por un Administrador desde el panel de Gestión de Usuarios.',
  });
});

// Login con rate limiter y JWT
router.post('/login', loginLimiter, validarSchema(loginSchema), authController.login);

// Menú dinámico RBAC
router.get('/menu', autenticarToken, authController.miMenu);

// Gestión de usuarios y personal (exclusivo para ADMIN)
router.get(
  '/usuarios',
  autenticarToken,
  requerirPerfil('ADMIN'),
  authController.listarUsuarios
);

router.post(
  '/usuarios',
  autenticarToken,
  requerirPerfil('ADMIN'),
  validarSchema(crearUsuarioAdminSchema),
  authController.crearUsuarioPorAdmin
);

router.patch(
  '/usuarios/:id/estado',
  autenticarToken,
  requerirPerfil('ADMIN'),
  authController.cambiarEstadoUsuario
);

export default router;
