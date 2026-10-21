import { Router } from 'express';
import * as testdriveController from '../controllers/testdrive.controller.js';
import { autenticarToken } from '../middlewares/auth.middleware.js';
import { validarSchema } from '../middlewares/validate.middleware.js';
import { agendarTestDriveSchema, feedbackTestDriveSchema } from '../schemas/testdrive.schema.js';

const router = Router();

router.use(autenticarToken);

router.get('/', testdriveController.listar);
router.post('/', validarSchema(agendarTestDriveSchema), testdriveController.agendar);
router.patch('/:id/feedback', validarSchema(feedbackTestDriveSchema), testdriveController.registrarFeedback);

export default router;
