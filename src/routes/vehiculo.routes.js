import { Router } from 'express';
import * as vehiculoController from '../controllers/vehiculo.controller.js';
import { autenticarToken, requerirPerfil } from '../middlewares/auth.middleware.js';
import { validarSchema } from '../middlewares/validate.middleware.js';
import {
  crearVehiculoSchema,
  actualizarVehiculoSchema,
  solicitudPublicaSchema,
} from '../schemas/vehiculo.schema.js';

const router = Router();

// RUTAS PÚBLICAS: Salón virtual para clientes y visitantes (no requieren token)
router.get('/publico', vehiculoController.listarPublico);
router.post('/publico/solicitud', validarSchema(solicitudPublicaSchema), vehiculoController.crearSolicitudPublica);

router.use(autenticarToken);

router.get('/', requerirPerfil('ADMIN', 'VENDEDOR', 'FACTURADOR', 'TASADOR'), vehiculoController.listar);
router.get('/:id', requerirPerfil('ADMIN', 'VENDEDOR', 'FACTURADOR', 'TASADOR'), vehiculoController.obtenerPorId);
router.post('/', requerirPerfil('ADMIN', 'TASADOR'), validarSchema(crearVehiculoSchema), vehiculoController.crear);
router.put('/:id', requerirPerfil('ADMIN'), validarSchema(actualizarVehiculoSchema), vehiculoController.actualizar);

export default router;
