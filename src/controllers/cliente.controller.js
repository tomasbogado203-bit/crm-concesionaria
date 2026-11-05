import * as clienteService from '../services/cliente.service.js';

export const obtenerClientes = async (req, res, next) => {
  try {
    const esAdmin = req.user?.perfiles?.includes('ADMIN');
    const clientes = await clienteService.listarClientes(req.user.id, esAdmin);
    res.status(200).json(clientes);
  } catch (error) {
    next(error);
  }
};

export const crearNuevoCliente = async (req, res, next) => {
  try {
    const nuevoCliente = await clienteService.crearCliente(req.body);
    res.status(201).json({
      mensaje: 'Cliente creado exitosamente',
      cliente: nuevoCliente,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerFichaCliente = async (req, res, next) => {
  try {
    const esAdmin = req.user?.perfiles?.includes('ADMIN');
    const cliente = await clienteService.obtenerClientePorId(req.params.id, req.user.id, esAdmin);
    res.status(200).json(cliente);
  } catch (error) {
    next(error);
  }
};

export const actualizarCliente = async (req, res, next) => {
  try {
    const esAdmin = req.user?.perfiles?.includes('ADMIN');
    const actualizado = await clienteService.actualizarCliente(req.params.id, req.body, req.user.id, esAdmin);
    res.status(200).json({
      mensaje: 'Cliente actualizado exitosamente',
      cliente: actualizado,
    });
  } catch (error) {
    next(error);
  }
};

export const eliminarCliente = async (req, res, next) => {
  try {
    await clienteService.eliminarCliente(req.params.id, req.user.id, true);
    res.status(200).json({
      mensaje: 'Cliente dado de baja exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

export const registrarInteraccion = async (req, res, next) => {
  try {
    const esAdmin = req.user?.perfiles?.includes('ADMIN');
    const interaccion = await clienteService.registrarInteraccion(
      req.params.id,
      req.body,
      req.user.id,
      esAdmin
    );
    res.status(201).json({
      mensaje: 'Interacción registrada en la ficha del cliente',
      interaccion,
    });
  } catch (error) {
    next(error);
  }
};

export const enviarCorreoCliente = async (req, res, next) => {
  try {
    const esAdmin = req.user?.perfiles?.includes('ADMIN');
    const resultado = await clienteService.enviarCorreoACliente(
      req.params.id,
      req.body,
      req.user.id,
      esAdmin
    );
    res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
};
