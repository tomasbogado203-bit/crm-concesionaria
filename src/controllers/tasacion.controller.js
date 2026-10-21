import * as tasacionService from '../services/tasacion.service.js';

export const listar = async (req, res, next) => {
  try {
    const esAdminOTasador = req.user?.perfiles?.some((p) => ['ADMIN', 'TASADOR'].includes(p));
    const tasaciones = await tasacionService.listarTasaciones(req.user.id, esAdminOTasador);
    res.status(200).json(tasaciones);
  } catch (error) {
    next(error);
  }
};

export const solicitar = async (req, res, next) => {
  try {
    const nuevaTasacion = await tasacionService.solicitarTasacion(req.body, req.user.id);
    res.status(201).json({
      mensaje: 'Solicitud de tasación creada exitosamente',
      tasacion: nuevaTasacion,
    });
  } catch (error) {
    next(error);
  }
};

export const peritar = async (req, res, next) => {
  try {
    const actualizada = await tasacionService.registrarPeritaje(req.params.id, req.body, req.user.id);
    res.status(200).json({
      mensaje: 'Informe de peritaje técnico registrado',
      tasacion: actualizada,
    });
  } catch (error) {
    next(error);
  }
};

export const resolver = async (req, res, next) => {
  try {
    const resuelta = await tasacionService.resolverTasacion(req.params.id, req.body, req.user.id);
    res.status(200).json({
      mensaje: `Tasación ${resuelta.estado === 'RECHAZADA' ? 'rechazada' : 'aprobada y procesada exitosamente'}`,
      tasacion: resuelta,
    });
  } catch (error) {
    next(error);
  }
};
