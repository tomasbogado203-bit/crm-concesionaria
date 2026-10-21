import * as facturaService from '../services/factura.service.js';

export const listar = async (req, res, next) => {
  try {
    const facturas = await facturaService.listarFacturas();
    res.status(200).json(facturas);
  } catch (error) {
    next(error);
  }
};

export const obtenerPorId = async (req, res, next) => {
  try {
    const factura = await facturaService.obtenerFacturaPorId(req.params.id);
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
    const pago = await facturaService.registrarPago(req.params.id, req.body);
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
    const anulada = await facturaService.anularFactura(req.params.id);
    res.status(200).json({
      mensaje: 'Factura anulada exitosamente y vehículo liberado al stock',
      factura: anulada,
    });
  } catch (error) {
    next(error);
  }
};
