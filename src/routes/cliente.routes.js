import { Router } from 'express';
import * as clienteController from '../controllers/cliente.controller.js';
import { autenticarToken, autorizarPerfiles } from '../middlewares/auth.middleware.js';
import { validarSchema } from '../middlewares/validate.middleware.js';
import {
  crearClienteSchema,
  actualizarClienteSchema,
  crearInteraccionSchema,
} from '../schemas/cliente.schema.js';

const router = Router();

// Todas las rutas de clientes requieren estar autenticado
router.use(autenticarToken);

router.get('/', autorizarPerfiles('ADMIN', 'VENDEDOR', 'FACTURADOR'), clienteController.obtenerClientes);
router.post('/', autorizarPerfiles('ADMIN', 'VENDEDOR'), validarSchema(crearClienteSchema), clienteController.crearNuevoCliente);

router.get('/:id', autorizarPerfiles('ADMIN', 'VENDEDOR', 'FACTURADOR'), clienteController.obtenerFichaCliente);
router.put('/:id', autorizarPerfiles('ADMIN', 'VENDEDOR'), validarSchema(actualizarClienteSchema), clienteController.actualizarCliente);
router.delete('/:id', autorizarPerfiles('ADMIN'), clienteController.eliminarCliente);
router.post(
  '/:id/interacciones',
  autorizarPerfiles('ADMIN', 'VENDEDOR'),
  validarSchema(crearInteraccionSchema),
  clienteController.registrarInteraccion
);

export default router;
