import { Router } from 'express';
import * as clienteController from '../controllers/cliente.controller.js';
import { autenticarToken } from '../middlewares/auth.middleware.js';
import { validarSchema } from '../middlewares/validate.middleware.js';
import {
  crearClienteSchema,
  actualizarClienteSchema,
  crearInteraccionSchema,
} from '../schemas/cliente.schema.js';

const router = Router();

// Todas las rutas de clientes requieren estar autenticado
router.use(autenticarToken);

router.get('/', clienteController.obtenerClientes);
router.post('/', validarSchema(crearClienteSchema), clienteController.crearNuevoCliente);

router.get('/:id', clienteController.obtenerFichaCliente);
router.put('/:id', validarSchema(actualizarClienteSchema), clienteController.actualizarCliente);
router.delete('/:id', clienteController.eliminarCliente);
router.post('/:id/interacciones', validarSchema(crearInteraccionSchema), clienteController.registrarInteraccion);

export default router;

