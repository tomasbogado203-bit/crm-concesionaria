import * as oportunidadService from '../services/oportunidad.service.js';

export const listar = async (req, res, next) => {
  try {
    const esAdmin = req.user?.perfiles?.includes('ADMIN');
    const lista = await oportunidadService.listarOportunidades(req.user.id, esAdmin);
    res.status(200).json(lista);
  } catch (error) {
    next(error);
  }
};

export const crear = async (req, res, next) => {
  try {
    const nueva = await oportunidadService.crearOportunidad(req.body, req.user.id);
    res.status(201).json({
      mensaje: 'Oportunidad creada exitosamente',
      oportunidad: nueva,
    });
  } catch (error) {
    next(error);
  }
};

export const cambiarEtapa = async (req, res, next) => {
  try {
    const esAdmin = req.user?.perfiles?.includes('ADMIN');
    const { etapa, motivoPerdida } = req.body;
    const actualizada = await oportunidadService.cambiarEtapa(
      req.params.id,
      etapa,
      req.user.id,
      esAdmin,
      motivoPerdida
    );
    res.status(200).json({
      mensaje: `Oportunidad actualizada a etapa ${etapa}`,
      oportunidad: actualizada,
    });
  } catch (error) {
    next(error);
  }
};
