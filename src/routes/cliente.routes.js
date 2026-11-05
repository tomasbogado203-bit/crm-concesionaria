import { Router } from 'express';
import * as clienteController from '../controllers/cliente.controller.js';
import { autenticarToken, requerirPerfil } from '../middlewares/auth.middleware.js';
import { validarSchema } from '../middlewares/validate.middleware.js';
import {
  crearClienteSchema,
  actualizarClienteSchema,
  crearInteraccionSchema,
  enviarCorreoClienteSchema,
} from '../schemas/cliente.schema.js';

const router = Router();

// Todas las rutas de clientes requieren estar autenticado
router.use(autenticarToken);

router.get('/', requerirPerfil('ADMIN', 'VENDEDOR', 'FACTURADOR'), clienteController.obtenerClientes);
router.post('/', requerirPerfil('ADMIN', 'VENDEDOR'), validarSchema(crearClienteSchema), clienteController.crearNuevoCliente);

router.get('/:id', requerirPerfil('ADMIN', 'VENDEDOR', 'FACTURADOR'), clienteController.obtenerFichaCliente);
router.put('/:id', requerirPerfil('ADMIN', 'VENDEDOR'), validarSchema(actualizarClienteSchema), clienteController.actualizarCliente);
router.delete('/:id', requerirPerfil('ADMIN'), clienteController.eliminarCliente);
router.post(
  '/:id/interacciones',
  requerirPerfil('ADMIN', 'VENDEDOR'),
  validarSchema(crearInteraccionSchema),
  clienteController.registrarInteraccion
);
router.post(
  '/:id/enviar-correo',
  requerirPerfil('ADMIN', 'VENDEDOR'),
  validarSchema(enviarCorreoClienteSchema),
  clienteController.enviarCorreoCliente
);

export default router;
