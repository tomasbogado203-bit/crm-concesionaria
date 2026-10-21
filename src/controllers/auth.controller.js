import * as authService from '../services/auth.service.js';

export const registro = async (req, res, next) => {
  try {
    const usuario = await authService.registrarUsuario(req.body);
    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const resultado = await authService.iniciarSesion(req.body);
    res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
};

export const miMenu = async (req, res, next) => {
  try {
    const menu = await authService.obtenerMenuUsuario(req.user.id);
    res.status(200).json(menu);
  } catch (error) {
    next(error);
  }
};

