import { Router } from 'express';
import * as oportunidadController from '../controllers/oportunidad.controller.js';
import { autenticarToken, autorizarPerfiles } from '../middlewares/auth.middleware.js';
import { validarSchema } from '../middlewares/validate.middleware.js';
import {
  crearOportunidadSchema,
  cambiarEtapaSchema,
  registrarSeniaSchema,
} from '../schemas/oportunidad.schema.js';

const router = Router();

router.use(autenticarToken);

router.get('/', autorizarPerfiles('ADMIN', 'VENDEDOR'), oportunidadController.listar);
router.post(
  '/',
  autorizarPerfiles('ADMIN', 'VENDEDOR'),
  validarSchema(crearOportunidadSchema),
  oportunidadController.crear
);
router.patch(
  '/:id/etapa',
  autorizarPerfiles('ADMIN', 'VENDEDOR'),
  validarSchema(cambiarEtapaSchema),
  oportunidadController.cambiarEtapa
);
router.post(
  '/:id/senia',
  autorizarPerfiles('ADMIN', 'VENDEDOR'),
  validarSchema(registrarSeniaSchema),
  oportunidadController.registrarSenia
);

export default router;
