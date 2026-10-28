import { Router } from 'express';
import * as facturaController from '../controllers/factura.controller.js';
import { autenticarToken, autorizarPerfiles } from '../middlewares/auth.middleware.js';
import { validarSchema } from '../middlewares/validate.middleware.js';
import { emitirFacturaSchema, registrarPagoSchema } from '../schemas/factura.schema.js';

const router = Router();

router.use(autenticarToken);

router.get('/', autorizarPerfiles('ADMIN', 'FACTURADOR', 'VENDEDOR'), facturaController.listar);
router.get('/:id', autorizarPerfiles('ADMIN', 'FACTURADOR', 'VENDEDOR'), facturaController.obtenerPorId);
router.post('/', autorizarPerfiles('ADMIN', 'FACTURADOR'), validarSchema(emitirFacturaSchema), facturaController.emitir);
router.post('/:id/pagos', autorizarPerfiles('ADMIN', 'FACTURADOR'), validarSchema(registrarPagoSchema), facturaController.registrarPago);
router.patch('/:id/anular', autorizarPerfiles('ADMIN', 'FACTURADOR'), facturaController.anular);

export default router;
