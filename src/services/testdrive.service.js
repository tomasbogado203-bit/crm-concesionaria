import prisma from '../config/prisma.js';

export const listarTestDrives = async (usuarioId, esAdmin = false) => {
  const where = {};
  if (!esAdmin && usuarioId) {
    where.usuarioId = Number(usuarioId);
  }

  return await prisma.pruebaManejo.findMany({
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
          numeroDni: true,
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
          condicion: true,
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
    orderBy: { fechaHora: 'desc' },
  });
};

export const agendarTestDrive = async (datos, usuarioId) => {
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
    const error = new Error('No se pueden programar pruebas en vehículos ya vendidos');
    error.statusCode = 400;
    throw error;
  }

  const fechaParseada = new Date(datos.fechaHora);

  const nuevaPrueba = await prisma.pruebaManejo.create({
    data: {
      clienteId: datos.clienteId,
      vehiculoId: datos.vehiculoId,
      usuarioId: Number(usuarioId),
      fechaHora: fechaParseada,
      licenciaConducir: datos.licenciaConducir,
      estado: 'PROGRAMADO',
    },
    include: {
      cliente: true,
      vehiculo: true,
    },
  });

  // Registrar en la cronología de interacciones del cliente (Historial 360°)
  try {
    await prisma.interaccion.create({
      data: {
        clienteId: datos.clienteId,
        usuarioId: Number(usuarioId),
        canal: 'VISITA_SALON',
        resumen: `[Test Drive Programado] ${vehiculo.marca} ${vehiculo.modelo}. Fecha: ${fechaParseada.toLocaleString('es-AR')}. Licencia: ${datos.licenciaConducir || 'N/A'}.`,
      },
    });
  } catch (err) {
    console.warn('No se pudo registrar la interacción automática:', err.message);
  }

  return nuevaPrueba;
};

export const registrarFeedback = async (id, datos, usuarioId, esAdmin = false) => {
  const prueba = await prisma.pruebaManejo.findUnique({
    where: { id: Number(id) },
  });

  if (!prueba) {
    const error = new Error('Prueba de manejo no encontrada');
    error.statusCode = 404;
    throw error;
  }

  if (!esAdmin && prueba.usuarioId !== Number(usuarioId)) {
    const error = new Error('No tiene permisos para modificar esta prueba');
    error.statusCode = 403;
    throw error;
  }

  const actualizada = await prisma.pruebaManejo.update({
    where: { id: Number(id) },
    data: {
      estado: datos.estado || 'COMPLETADO',
      feedback: datos.feedback || null,
      calificacion: datos.calificacion || null,
    },
    include: {
      cliente: true,
      vehiculo: true,
    },
  });

  // Registrar feedback en el historial de interacciones
  try {
    await prisma.interaccion.create({
      data: {
        clienteId: prueba.clienteId,
        usuarioId: Number(usuarioId),
        canal: 'VISITA_SALON',
        resumen: `[Test Drive ${datos.estado || 'COMPLETADO'}] Calificación: ${datos.calificacion || 5}/5. Feedback: ${datos.feedback || 'Sin observaciones'}.`,
      },
    });
  } catch (err) {
    console.warn('No se pudo registrar la interacción del feedback:', err.message);
  }

  return actualizada;
};
