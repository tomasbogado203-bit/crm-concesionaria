import { Router } from 'express';
import * as facturaController from '../controllers/factura.controller.js';
import { autenticarToken, requerirPerfil, requerirPermiso } from '../middlewares/auth.middleware.js';
import { validarSchema } from '../middlewares/validate.middleware.js';
import { emitirFacturaSchema, registrarPagoSchema } from '../schemas/factura.schema.js';

const router = Router();

router.use(autenticarToken);

router.get('/', requerirPerfil('ADMIN', 'FACTURADOR'), requerirPermiso('FACT_VENTAS_LISTAR'), facturaController.listar);
router.get('/:id', requerirPerfil('ADMIN', 'FACTURADOR'), requerirPermiso('FACT_VENTAS_LISTAR'), facturaController.obtenerPorId);
router.post('/', requerirPerfil('ADMIN', 'FACTURADOR'), requerirPermiso('FACT_VENTAS_EMITIR'), validarSchema(emitirFacturaSchema), facturaController.emitir);
router.post('/:id/pagos', requerirPerfil('ADMIN', 'FACTURADOR'), requerirPermiso('COBRO_REGISTRAR'), validarSchema(registrarPagoSchema), facturaController.registrarPago);
router.patch('/:id/anular', requerirPerfil('ADMIN', 'FACTURADOR'), requerirPermiso('FACT_VENTAS_ANULAR'), facturaController.anular);

export default router;
