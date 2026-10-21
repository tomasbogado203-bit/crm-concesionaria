import { Router } from 'express';
import * as tasacionController from '../controllers/tasacion.controller.js';
import { autenticarToken } from '../middlewares/auth.middleware.js';
import { validarSchema } from '../middlewares/validate.middleware.js';
import {
  solicitarTasacionSchema,
  peritarTasacionSchema,
  resolverTasacionSchema,
} from '../schemas/tasacion.schema.js';

const router = Router();

router.use(autenticarToken);

router.get('/', tasacionController.listar);
router.post('/', validarSchema(solicitarTasacionSchema), tasacionController.solicitar);
router.patch('/:id/peritaje', validarSchema(peritarTasacionSchema), tasacionController.peritar);
router.patch('/:id/resolver', validarSchema(resolverTasacionSchema), tasacionController.resolver);

export default router;
