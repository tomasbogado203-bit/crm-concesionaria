import * as facturaService from '../services/factura.service.js';

export const listar = async (req, res, next) => {
  try {
    const esAdmin = req.user?.perfiles?.includes('ADMIN');
    const facturas = await facturaService.listarFacturas(req.user.id, esAdmin);
    res.status(200).json(facturas);
  } catch (error) {
    next(error);
  }
};

export const obtenerPorId = async (req, res, next) => {
  try {
    const esAdmin = req.user?.perfiles?.includes('ADMIN');
    const factura = await facturaService.obtenerFacturaPorId(req.params.id, req.user.id, esAdmin);
    res.status(200).json(factura);
  } catch (error) {
    next(error);
  }
};

export const emitir = async (req, res, next) => {
  try {
    const nuevaFactura = await facturaService.emitirFactura(req.body, req.user.id);
    res.status(201).json({
      mensaje: 'Comprobante emitido exitosamente con CAE AFIP',
      factura: nuevaFactura,
    });
  } catch (error) {
    next(error);
  }
};

export const registrarPago = async (req, res, next) => {
  try {
    const esAdmin = req.user?.perfiles?.includes('ADMIN');
    const pago = await facturaService.registrarPago(req.params.id, req.body, req.user.id, esAdmin);
    res.status(201).json({
      mensaje: 'Cobro registrado exitosamente en caja',
      pago,
    });
  } catch (error) {
    next(error);
  }
};

export const anular = async (req, res, next) => {
  try {
    const esAdmin = req.user?.perfiles?.includes('ADMIN');
    const anulada = await facturaService.anularFactura(req.params.id, req.user.id, esAdmin);
    res.status(200).json({
      mensaje: 'Factura anulada exitosamente y vehículo liberado al stock',
      factura: anulada,
    });
  } catch (error) {
    next(error);
  }
};
