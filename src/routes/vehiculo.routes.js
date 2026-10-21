import { Router } from 'express';
import * as vehiculoController from '../controllers/vehiculo.controller.js';
import { autenticarToken } from '../middlewares/auth.middleware.js';
import { validarSchema } from '../middlewares/validate.middleware.js';
import { crearVehiculoSchema, actualizarVehiculoSchema } from '../schemas/vehiculo.schema.js';

const router = Router();

router.use(autenticarToken);

router.get('/', vehiculoController.listar);
router.get('/:id', vehiculoController.obtenerPorId);
router.post('/', validarSchema(crearVehiculoSchema), vehiculoController.crear);
router.put('/:id', validarSchema(actualizarVehiculoSchema), vehiculoController.actualizar);

export default router;
