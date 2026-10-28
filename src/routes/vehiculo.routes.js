import { Router } from 'express';
import * as vehiculoController from '../controllers/vehiculo.controller.js';
import { autenticarToken, autorizarPerfiles } from '../middlewares/auth.middleware.js';
import { validarSchema } from '../middlewares/validate.middleware.js';
import { crearVehiculoSchema, actualizarVehiculoSchema } from '../schemas/vehiculo.schema.js';

const router = Router();

router.use(autenticarToken);

router.get('/', autorizarPerfiles('ADMIN', 'VENDEDOR', 'FACTURADOR', 'TASADOR'), vehiculoController.listar);
router.get('/:id', autorizarPerfiles('ADMIN', 'VENDEDOR', 'FACTURADOR', 'TASADOR'), vehiculoController.obtenerPorId);
router.post('/', autorizarPerfiles('ADMIN', 'TASADOR'), validarSchema(crearVehiculoSchema), vehiculoController.crear);
router.put('/:id', autorizarPerfiles('ADMIN'), validarSchema(actualizarVehiculoSchema), vehiculoController.actualizar);

export default router;
