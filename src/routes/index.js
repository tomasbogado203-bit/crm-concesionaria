import { Router } from 'express';
import authRoutes from './auth.routes.js';
import clienteRoutes from './cliente.routes.js';
import vehiculoRoutes from './vehiculo.routes.js';
import oportunidadRoutes from './oportunidad.routes.js';
import facturaRoutes from './factura.routes.js';
import testdriveRoutes from './testdrive.routes.js';
import tasacionRoutes from './tasacion.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/clientes', clienteRoutes);
router.use('/vehiculos', vehiculoRoutes);
router.use('/oportunidades', oportunidadRoutes);
router.use('/facturas', facturaRoutes);
router.use('/test-drives', testdriveRoutes);
router.use('/tasaciones', tasacionRoutes);

export default router;



