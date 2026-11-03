import * as vehiculoService from '../services/vehiculo.service.js';

export const listar = async (req, res, next) => {
  try {
    const esAdmin = req.user?.perfiles?.includes('ADMIN');
    const vehiculos = await vehiculoService.listarVehiculos(req.query, esAdmin);
    res.status(200).json(vehiculos);
  } catch (error) {
    next(error);
  }
};

export const listarPublico = async (req, res, next) => {
  try {
    const vehiculos = await vehiculoService.listarCatalogoPublico(req.query);
    res.status(200).json(vehiculos);
  } catch (error) {
    next(error);
  }
};

export const obtenerPorId = async (req, res, next) => {
  try {
    const esAdmin = req.user?.perfiles?.includes('ADMIN');
    const vehiculo = await vehiculoService.obtenerVehiculoPorId(req.params.id, esAdmin);
    res.status(200).json(vehiculo);
  } catch (error) {
    next(error);
  }
};

export const crear = async (req, res, next) => {
  try {
    const nuevo = await vehiculoService.crearVehiculo(req.body);
    res.status(201).json({
      mensaje: 'Vehículo incorporado al stock exitosamente',
      vehiculo: nuevo,
    });
  } catch (error) {
    next(error);
  }
};

export const actualizar = async (req, res, next) => {
  try {
    const actualizado = await vehiculoService.actualizarVehiculo(req.params.id, req.body);
    res.status(200).json({
      mensaje: 'Vehículo actualizado exitosamente',
      vehiculo: actualizado,
    });
  } catch (error) {
    next(error);
  }
};
