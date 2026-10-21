import { Router } from 'express';
import * as facturaController from '../controllers/factura.controller.js';
import { autenticarToken } from '../middlewares/auth.middleware.js';
import { validarSchema } from '../middlewares/validate.middleware.js';
import { emitirFacturaSchema, registrarPagoSchema } from '../schemas/factura.schema.js';

const router = Router();

router.use(autenticarToken);

router.get('/', facturaController.listar);
router.get('/:id', facturaController.obtenerPorId);
router.post('/', validarSchema(emitirFacturaSchema), facturaController.emitir);
router.post('/:id/pagos', validarSchema(registrarPagoSchema), facturaController.registrarPago);
router.patch('/:id/anular', facturaController.anular);

export default router;
