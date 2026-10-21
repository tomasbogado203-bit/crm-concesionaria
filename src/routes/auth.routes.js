import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { autenticarToken } from '../middlewares/auth.middleware.js';
import { validarSchema } from '../middlewares/validate.middleware.js';
import { registroSchema, loginSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post('/registro', validarSchema(registroSchema), authController.registro);
router.post('/login', validarSchema(loginSchema), authController.login);
router.get('/menu', autenticarToken, authController.miMenu);

export default router;

