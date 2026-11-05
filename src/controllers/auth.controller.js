import * as authService from '../services/auth.service.js';

export const registro = async (req, res, next) => {
  try {
    const rolSolicitado = String(req.body?.rol || '').trim().toUpperCase();
    if (rolSolicitado === 'ADMIN') {
      return res.status(403).json({
        error: 'No está permitido crear usuarios con perfil ADMIN desde registro público.',
      });
    }

    const usuario = await authService.registrarUsuario({
      ...req.body,
      rol: 'VENDEDOR',
    });

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente con rol comercial',
      usuario,
    });
  } catch (error) {
    next(error);
  }
};

export const crearUsuarioPorAdmin = async (req, res, next) => {
  try {
    const usuario = await authService.crearUsuarioPorAdmin(req.body);
    res.status(201).json({
      mensaje: 'Usuario creado exitosamente',
      usuario,
    });
  } catch (error) {
    next(error);
  }
};

export const listarUsuarios = async (req, res, next) => {
  try {
    const usuarios = await authService.listarUsuarios();
    res.status(200).json(usuarios);
  } catch (error) {
    next(error);
  }
};

export const cambiarEstadoUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { snActivo } = req.body;
    const usuario = await authService.cambiarEstadoUsuario(Number(id), { snActivo }, req.user.id);
    res.status(200).json({
      mensaje: 'Estado del usuario actualizado exitosamente',
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
