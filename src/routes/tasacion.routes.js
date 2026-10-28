import { Router } from 'express';
import * as tasacionController from '../controllers/tasacion.controller.js';
import { autenticarToken, autorizarPerfiles } from '../middlewares/auth.middleware.js';
import { validarSchema } from '../middlewares/validate.middleware.js';
import {
  solicitarTasacionSchema,
  peritarTasacionSchema,
  resolverTasacionSchema,
} from '../schemas/tasacion.schema.js';

const router = Router();

router.use(autenticarToken);

router.get('/', autorizarPerfiles('ADMIN', 'TASADOR', 'VENDEDOR'), tasacionController.listar);
router.post(
  '/',
  autorizarPerfiles('ADMIN', 'VENDEDOR', 'TASADOR'),
  validarSchema(solicitarTasacionSchema),
  tasacionController.solicitar
);
router.patch(
  '/:id/peritaje',
  autorizarPerfiles('ADMIN', 'TASADOR'),
  validarSchema(peritarTasacionSchema),
  tasacionController.peritar
);
router.patch(
  '/:id/resolver',
  autorizarPerfiles('ADMIN', 'TASADOR'),
  validarSchema(resolverTasacionSchema),
  tasacionController.resolver
);

export default router;
