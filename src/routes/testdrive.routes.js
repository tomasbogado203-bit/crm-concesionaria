import { Router } from 'express';
import * as testdriveController from '../controllers/testdrive.controller.js';
import { autenticarToken, autorizarPerfiles } from '../middlewares/auth.middleware.js';
import { validarSchema } from '../middlewares/validate.middleware.js';
import { agendarTestDriveSchema, feedbackTestDriveSchema } from '../schemas/testdrive.schema.js';

const router = Router();

router.use(autenticarToken);

router.get('/', autorizarPerfiles('ADMIN', 'VENDEDOR'), testdriveController.listar);
router.post(
  '/',
  autorizarPerfiles('ADMIN', 'VENDEDOR'),
  validarSchema(agendarTestDriveSchema),
  testdriveController.agendar
);
router.patch(
  '/:id/feedback',
  autorizarPerfiles('ADMIN', 'VENDEDOR'),
  validarSchema(feedbackTestDriveSchema),
  testdriveController.registrarFeedback
);

export default router;
