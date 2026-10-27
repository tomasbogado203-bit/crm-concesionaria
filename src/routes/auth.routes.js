import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller.js';
import { autenticarToken } from '../middlewares/auth.middleware.js';
import { validarSchema } from '../middlewares/validate.middleware.js';
import { registroSchema, loginSchema } from '../schemas/auth.schema.js';

const router = Router();

// Rate limiting específico para mitigar ataques de fuerza bruta en el inicio de sesión
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Probá de nuevo en 15 minutos.' },
});

router.post('/registro', validarSchema(registroSchema), authController.registro);
router.post('/login', loginLimiter, validarSchema(loginSchema), authController.login);
router.get('/menu', autenticarToken, authController.miMenu);

export default router;

