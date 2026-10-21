import * as testdriveService from '../services/testdrive.service.js';

export const listar = async (req, res, next) => {
  try {
    const esAdmin = req.user?.perfiles?.includes('ADMIN');
    const pruebas = await testdriveService.listarTestDrives(req.user.id, esAdmin);
    res.status(200).json(pruebas);
  } catch (error) {
    next(error);
  }
};

export const agendar = async (req, res, next) => {
  try {
    const nuevaPrueba = await testdriveService.agendarTestDrive(req.body, req.user.id);
    res.status(201).json({
      mensaje: 'Prueba de manejo programada exitosamente',
      pruebaManejo: nuevaPrueba,
    });
  } catch (error) {
    next(error);
  }
};

export const registrarFeedback = async (req, res, next) => {
  try {
    const esAdmin = req.user?.perfiles?.includes('ADMIN');
    const actualizada = await testdriveService.registrarFeedback(
      req.params.id,
      req.body,
      req.user.id,
      esAdmin
    );
    res.status(200).json({
      mensaje: 'Feedback de prueba de manejo registrado',
      pruebaManejo: actualizada,
    });
  } catch (error) {
    next(error);
  }
};
