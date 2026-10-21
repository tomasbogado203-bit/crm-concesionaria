import * as clienteService from '../services/cliente.service.js';

export const obtenerClientes = async (req, res, next) => {
  try {
    const clientes = await clienteService.listarClientes(req.user.id);
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
    const cliente = await clienteService.obtenerClientePorId(req.params.id);
    res.status(200).json(cliente);
  } catch (error) {
    next(error);
  }
};

export const actualizarCliente = async (req, res, next) => {
  try {
    const actualizado = await clienteService.actualizarCliente(req.params.id, req.body);
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
    await clienteService.eliminarCliente(req.params.id);
    res.status(200).json({
      mensaje: 'Cliente dado de baja exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

export const registrarInteraccion = async (req, res, next) => {
  try {
    const interaccion = await clienteService.registrarInteraccion(
      req.params.id,
      req.body,
      req.user.id
    );
    res.status(201).json({
      mensaje: 'Interacción registrada en la ficha del cliente',
      interaccion,
    });
  } catch (error) {
    next(error);
  }
};

