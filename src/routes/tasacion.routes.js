import { Router } from 'express';
import * as tasacionController from '../controllers/tasacion.controller.js';
import { autenticarToken, requerirPerfil } from '../middlewares/auth.middleware.js';
import { validarSchema } from '../middlewares/validate.middleware.js';
import {
  solicitarTasacionSchema,
  peritarTasacionSchema,
  resolverTasacionSchema,
} from '../schemas/tasacion.schema.js';

const router = Router();

router.use(autenticarToken);

router.get('/', requerirPerfil('ADMIN', 'TASADOR', 'VENDEDOR'), tasacionController.listar);
router.post(
  '/',
  requerirPerfil('ADMIN', 'VENDEDOR', 'TASADOR'),
  validarSchema(solicitarTasacionSchema),
  tasacionController.solicitar
);
router.patch(
  '/:id/peritaje',
  requerirPerfil('ADMIN', 'TASADOR'),
  validarSchema(peritarTasacionSchema),
  tasacionController.peritar
);
router.patch(
  '/:id/resolver',
  requerirPerfil('ADMIN', 'TASADOR'),
  validarSchema(resolverTasacionSchema),
  tasacionController.resolver
);

export default router;
