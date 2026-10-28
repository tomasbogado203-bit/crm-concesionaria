import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller.js';
import { autenticarToken, autorizarPerfiles } from '../middlewares/auth.middleware.js';
import { validarSchema } from '../middlewares/validate.middleware.js';
import { registroSchema, loginSchema, crearUsuarioAdminSchema } from '../schemas/auth.schema.js';

const router = Router();

// Rate limiting específico para mitigar ataques de fuerza bruta en el inicio de sesión
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Probá de nuevo en 15 minutos.' },
});

// Registro público (siempre crea rol VENDEDOR, nunca permite escalada a ADMIN)
router.post('/registro', validarSchema(registroSchema), authController.registro);

// Login con rate limiter y JWT
router.post('/login', loginLimiter, validarSchema(loginSchema), authController.login);

// Menú dinámico RBAC
router.get('/menu', autenticarToken, authController.miMenu);

// Creación de usuarios con roles específicos (exclusivo para ADMIN)
router.post(
  '/usuarios',
  autenticarToken,
  autorizarPerfiles('ADMIN'),
  validarSchema(crearUsuarioAdminSchema),
  authController.crearUsuarioPorAdmin
);

export default router;
