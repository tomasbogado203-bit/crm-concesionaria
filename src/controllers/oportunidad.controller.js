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

    // 1. Respondo al usuario YA, no espero a N8N (Paso 6 - Clase 10).
    res.status(201).json({
      mensaje: 'Oportunidad creada exitosamente',
      oportunidad: nueva,
    });

    // 2. Aviso a N8N en segundo plano. Si falla, no rompe nada (Paso 6 - Clase 10).
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nWebhookUrl && process.env.NODE_ENV !== 'test') {
      const nombreCliente = nueva.cliente
        ? (nueva.cliente.tipoPersona === 'JURIDICA'
            ? (nueva.cliente.razonSocial || nueva.cliente.nombres)
            : `${nueva.cliente.nombres} ${nueva.cliente.apellido || ''}`.trim())
        : 'Cliente';

      const emailCliente = nueva.cliente?.email || '';

      fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreCliente,
          emailCliente,
          telefonoCliente: nueva.cliente?.telefono || '',
          oportunidadId: nueva.id,
          montoEstimado: nueva.montoEstimado,
          etapa: nueva.etapa,
          vehiculo: nueva.vehiculo ? `${nueva.vehiculo.marca} ${nueva.vehiculo.modelo} (${nueva.vehiculo.anio})` : null,
          fecha: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(3000),
      }).catch((error) => {
        console.error('Error llamando al webhook de N8N:', error.message);
      });
    }
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

export const registrarSenia = async (req, res, next) => {
  try {
    const esAdmin = req.user?.perfiles?.includes('ADMIN');
    const actualizada = await oportunidadService.registrarSenia(
      req.params.id,
      req.body,
      req.user.id,
      esAdmin
    );
    res.status(200).json({
      mensaje: 'Seña y reserva de unidad registradas con éxito',
      oportunidad: actualizada,
    });
  } catch (error) {
    next(error);
  }
};
