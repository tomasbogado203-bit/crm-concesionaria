import { Router } from 'express';
import * as oportunidadController from '../controllers/oportunidad.controller.js';
import { autenticarToken } from '../middlewares/auth.middleware.js';
import { validarSchema } from '../middlewares/validate.middleware.js';
import { crearOportunidadSchema, cambiarEtapaSchema } from '../schemas/oportunidad.schema.js';

const router = Router();

router.use(autenticarToken);

router.get('/', oportunidadController.listar);
router.post('/', validarSchema(crearOportunidadSchema), oportunidadController.crear);
router.patch('/:id/etapa', validarSchema(cambiarEtapaSchema), oportunidadController.cambiarEtapa);

export default router;
