import prisma from '../config/prisma.js';

export const listarOportunidades = async (usuarioId, esAdmin = false) => {
  const where = {};
  if (!esAdmin) {
    where.usuarioId = Number(usuarioId);
  }

  return await prisma.oportunidad.findMany({
    where,
    include: {
      cliente: {
        select: {
          id: true,
          nombres: true,
          apellido: true,
          razonSocial: true,
          telefono: true,
          email: true,
          tipoPersona: true,
        },
      },
      vehiculo: {
        select: {
          id: true,
          vin: true,
          marca: true,
          modelo: true,
          version: true,
          anio: true,
          precioVenta: true,
          estado: true,
        },
      },
      usuario: {
        select: {
          id: true,
          nombreUsuario: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const crearOportunidad = async (datos, usuarioId) => {
  // 1. Validar cliente
  const cliente = await prisma.contacto.findFirst({
    where: { id: datos.clienteId, snActivo: true },
  });

  if (!cliente) {
    const error = new Error('Cliente no encontrado o inactivo');
    error.statusCode = 404;
    throw error;
  }

  // 2. Validar vehículo
  const vehiculo = await prisma.vehiculo.findUnique({
    where: { id: datos.vehiculoId },
  });

  if (!vehiculo) {
    const error = new Error('Vehículo no encontrado');
    error.statusCode = 404;
    throw error;
  }

  if (vehiculo.estado === 'VENDIDO') {
    const error = new Error('El vehículo ya fue vendido');
    error.statusCode = 400;
    throw error;
  }

  // 3. Crear oportunidad
  const nuevaOportunidad = await prisma.oportunidad.create({
    data: {
      clienteId: datos.clienteId,
      vehiculoId: datos.vehiculoId,
      usuarioId: Number(usuarioId),
      etapa: datos.etapa || 'PROSPECTO',
      montoEstimado: datos.montoEstimado,
    },
    include: {
      cliente: true,
      vehiculo: true,
    },
  });

  // Si se crea directo en estado RESERVADO, bloquea el auto
  if (datos.etapa === 'RESERVADO') {
    await prisma.vehiculo.update({
      where: { id: datos.vehiculoId },
      data: { estado: 'RESERVADO' },
    });
  }

  return nuevaOportunidad;
};

export const cambiarEtapa = async (id, nuevaEtapa, usuarioId, esAdmin = false, motivoPerdida = null) => {
  const oportunidad = await prisma.oportunidad.findUnique({
    where: { id: Number(id) },
    include: { vehiculo: true },
  });

  if (!oportunidad) {
    const error = new Error('Oportunidad no encontrada');
    error.statusCode = 404;
    throw error;
  }

  // Verificar pertenencia si no es Admin
  if (!esAdmin && oportunidad.usuarioId !== Number(usuarioId)) {
    const error = new Error('No tiene permisos para modificar esta oportunidad');
    error.statusCode = 403;
    throw error;
  }

  // Actualizar estado del vehículo según la nueva etapa
  if (nuevaEtapa === 'RESERVADO' || nuevaEtapa === 'GANADA') {
    await prisma.vehiculo.update({
      where: { id: oportunidad.vehiculoId },
      data: { estado: 'RESERVADO' },
    });
  } else if (nuevaEtapa === 'PERDIDA' || nuevaEtapa === 'PROSPECTO' || nuevaEtapa === 'TEST_DRIVE' || nuevaEtapa === 'NEGOCIACION') {
    // Si sale de RESERVADO o GANADA hacia una etapa previa o perdida, se libera el auto
    await prisma.vehiculo.update({
      where: { id: oportunidad.vehiculoId },
      data: { estado: 'DISPONIBLE' },
    });
  }

  return await prisma.oportunidad.update({
    where: { id: Number(id) },
    data: {
      etapa: nuevaEtapa,
      motivoPerdida: nuevaEtapa === 'PERDIDA' ? motivoPerdida || 'Sin motivo especificado' : null,
    },
    include: {
      cliente: true,
      vehiculo: true,
    },
  });
};

