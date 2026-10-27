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

export const registrarSenia = async (id, datos, usuarioId, esAdmin = false) => {
  const oportunidad = await prisma.oportunidad.findUnique({
    where: { id: Number(id) },
    include: { vehiculo: true, cliente: true },
  });

  if (!oportunidad) {
    const error = new Error('Oportunidad no encontrada');
    error.statusCode = 404;
    throw error;
  }

  if (!esAdmin && oportunidad.usuarioId !== Number(usuarioId)) {
    const error = new Error('No tiene permisos para modificar esta oportunidad');
    error.statusCode = 403;
    throw error;
  }

  const montoSenia = Number(datos.montoSenia);
  const precioVehiculo = Number(oportunidad.vehiculo?.precioVenta || oportunidad.montoEstimado);
  if (montoSenia > precioVehiculo) {
    const error = new Error('El monto de la seña no puede superar el valor total del vehículo');
    error.statusCode = 400;
    throw error;
  }

  // Si no se especifica fecha de vencimiento, por regla de negocio son 72 hs hábiles (3 días)
  const fechaVencimiento = datos.fechaVencimiento
    ? new Date(datos.fechaVencimiento)
    : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  const nroReciboSenia = `RES-${String(oportunidad.id).padStart(4, '0')}-${Date.now().toString().slice(-4)}`;

  // 1. Bloquear el vehículo en stock
  await prisma.vehiculo.update({
    where: { id: oportunidad.vehiculoId },
    data: { estado: 'RESERVADO' },
  });

  // 2. Registrar en la bitácora del cliente la interacción automática
  try {
    await prisma.interaccion.create({
      data: {
        clienteId: oportunidad.clienteId,
        usuarioId: Number(usuarioId),
        canal: 'VISITA_SALON',
        resumen: `Seña registrada para el vehículo ${oportunidad.vehiculo.marca} ${oportunidad.vehiculo.modelo} (${oportunidad.vehiculo.vin}). Monto recibido: $${montoSenia.toLocaleString('es-AR')} vía ${datos.metodoPago || 'TRANSFERENCIA'}. Recibo Nº ${nroReciboSenia}. Vencimiento de reserva: ${fechaVencimiento.toLocaleDateString('es-AR')}.`,
      },
    });
  } catch (err) {
    console.warn('No se pudo registrar la interacción automática:', err);
  }

  // 3. Actualizar la oportunidad con los datos de la reserva
  return await prisma.oportunidad.update({
    where: { id: Number(id) },
    data: {
      etapa: 'RESERVADO',
      nroReciboSenia,
      montoSenia,
      metodoPagoSenia: datos.metodoPago || 'TRANSFERENCIA',
      comprobantePagoSenia: datos.comprobantePago || null,
      fechaVencimientoReserva: fechaVencimiento,
      observacionesReserva: datos.observaciones || null,
    },
    include: {
      cliente: true,
      vehiculo: true,
      usuario: {
        select: {
          id: true,
          nombreUsuario: true,
        },
      },
    },
  });
};


