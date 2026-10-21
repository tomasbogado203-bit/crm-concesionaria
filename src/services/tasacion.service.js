import prisma from '../config/prisma.js';

export const listarTasaciones = async (usuarioId, esAdminOTasador = false) => {
  const where = {};
  if (!esAdminOTasador && usuarioId) {
    where.usuarioId = Number(usuarioId);
  }

  return await prisma.tasacion.findMany({
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
      usuario: {
        select: {
          id: true,
          nombreUsuario: true,
        },
      },
      oportunidad: {
        select: {
          id: true,
          etapa: true,
          montoEstimado: true,
          vehiculo: {
            select: {
              id: true,
              marca: true,
              modelo: true,
              version: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const solicitarTasacion = async (datos, usuarioId) => {
  // 1. Validar cliente activo
  const cliente = await prisma.contacto.findFirst({
    where: { id: datos.clienteId, snActivo: true },
  });

  if (!cliente) {
    const error = new Error('Cliente no encontrado o inactivo');
    error.statusCode = 404;
    throw error;
  }

  // 2. Si se asocia a oportunidad, verificarla
  if (datos.oportunidadId) {
    const op = await prisma.oportunidad.findUnique({
      where: { id: datos.oportunidadId },
    });
    if (!op) {
      const error = new Error('Oportunidad vinculada no encontrada');
      error.statusCode = 404;
      throw error;
    }
  }

  // 3. Crear solicitud de tasación
  const nuevaTasacion = await prisma.tasacion.create({
    data: {
      clienteId: datos.clienteId,
      usuarioId: Number(usuarioId),
      oportunidadId: datos.oportunidadId || null,
      dominio: datos.dominio.toUpperCase().trim(),
      marca: datos.marca.trim(),
      modelo: datos.modelo.trim(),
      version: datos.version?.trim() || null,
      anio: Number(datos.anio),
      kilometraje: Number(datos.kilometraje),
      combustible: datos.combustible || 'NAFTA',
      detallesPeritaje: datos.detallesPeritaje || null,
      estado: 'SOLICITADA',
    },
    include: {
      cliente: true,
      usuario: true,
      oportunidad: true,
    },
  });

  // 4. Registrar en la cronología 360° de interacciones
  try {
    await prisma.interaccion.create({
      data: {
        clienteId: datos.clienteId,
        usuarioId: Number(usuarioId),
        canal: 'VISITA_SALON',
        resumen: `[Tasación Solicitada] Usado para permuta: ${nuevaTasacion.marca} ${nuevaTasacion.modelo} (${nuevaTasacion.dominio}) - Año ${nuevaTasacion.anio}`,
      },
    });
  } catch (err) {
    console.warn('No se pudo registrar la interacción de tasación:', err.message);
  }

  return nuevaTasacion;
};

export const registrarPeritaje = async (id, datos, usuarioId) => {
  const tasacion = await prisma.tasacion.findUnique({
    where: { id: Number(id) },
  });

  if (!tasacion) {
    const error = new Error('Solicitud de tasación no encontrada');
    error.statusCode = 404;
    throw error;
  }

  if (tasacion.estado === 'INGRESADO_STOCK') {
    const error = new Error('Esta tasación ya concluyó y el vehículo fue ingresado al stock');
    error.statusCode = 400;
    throw error;
  }

  const actualizada = await prisma.tasacion.update({
    where: { id: Number(id) },
    data: {
      estadoCarroceria: datos.estadoCarroceria,
      estadoPintura: datos.estadoPintura,
      estadoMecanica: datos.estadoMecanica,
      estadoCubiertas: datos.estadoCubiertas,
      detallesPeritaje: datos.detallesPeritaje || tasacion.detallesPeritaje,
      valorTasado: datos.valorTasado,
      estado: 'EN_PERITAJE',
    },
    include: {
      cliente: true,
      usuario: true,
    },
  });

  // Registrar interacción de peritaje
  try {
    await prisma.interaccion.create({
      data: {
        clienteId: tasacion.clienteId,
        usuarioId: Number(usuarioId),
        canal: 'VISITA_SALON',
        resumen: `[Peritaje Técnico Realizado] ${tasacion.marca} ${tasacion.modelo} (${tasacion.dominio}). Valuación propuesta: $${Number(datos.valorTasado).toLocaleString('es-AR')}`,
      },
    });
  } catch (err) {
    console.warn('No se pudo registrar la interacción del peritaje:', err.message);
  }

  return actualizada;
};

export const resolverTasacion = async (id, datos, usuarioId) => {
  const tasacion = await prisma.tasacion.findUnique({
    where: { id: Number(id) },
  });

  if (!tasacion) {
    const error = new Error('Solicitud de tasación no encontrada');
    error.statusCode = 404;
    throw error;
  }

  if (tasacion.estado === 'INGRESADO_STOCK') {
    const error = new Error('La permuta ya fue aceptada e ingresada previamente');
    error.statusCode = 400;
    throw error;
  }

  if (datos.estado === 'RECHAZADA') {
    const rechazada = await prisma.tasacion.update({
      where: { id: Number(id) },
      data: { estado: 'RECHAZADA' },
      include: { cliente: true, usuario: true },
    });

    try {
      await prisma.interaccion.create({
        data: {
          clienteId: tasacion.clienteId,
          usuarioId: Number(usuarioId),
          canal: 'VISITA_SALON',
          resumen: `[Tasación Rechazada] No se acordó valor de toma para ${tasacion.marca} ${tasacion.modelo} (${tasacion.dominio})`,
        },
      });
    } catch (err) {}

    return rechazada;
  }

  // Estado APROBADA
  const valorFinalAceptado = datos.valorAceptado || tasacion.valorTasado;
  if (!valorFinalAceptado) {
    const error = new Error('Debe especificar o contar con un valor de toma para aprobar la tasación');
    error.statusCode = 400;
    throw error;
  }

  let vehiculoIdCreado = null;
  let nuevoEstado = 'APROBADA';

  // Si se marcó para ingresar automáticamente al stock de usados de la concesionaria
  if (datos.ingresarAStock) {
    nuevoEstado = 'INGRESADO_STOCK';
    const nuevoVehiculo = await prisma.vehiculo.create({
      data: {
        vin: `PERMUTA-${tasacion.dominio}-${Date.now().toString().slice(-4)}`,
        marca: tasacion.marca,
        modelo: tasacion.modelo,
        version: tasacion.version || 'Base',
        anio: tasacion.anio,
        kilometraje: tasacion.kilometraje,
        condicion: 'USADO',
        costoCompra: valorFinalAceptado,
        precioVenta: Math.round(Number(valorFinalAceptado) * 1.25), // 25% de margen estimado de reventa
        estado: 'DISPONIBLE',
      },
    });
    vehiculoIdCreado = nuevoVehiculo.id;
  }

  const aprobada = await prisma.tasacion.update({
    where: { id: Number(id) },
    data: {
      estado: nuevoEstado,
      valorAceptado: valorFinalAceptado,
      vehiculoIngresadoId: vehiculoIdCreado,
    },
    include: {
      cliente: true,
      usuario: true,
    },
  });

  // Registrar interacción de aprobación e ingreso
  try {
    await prisma.interaccion.create({
      data: {
        clienteId: tasacion.clienteId,
        usuarioId: Number(usuarioId),
        canal: 'VISITA_SALON',
        resumen: `[Tasación Aprobada] ${tasacion.marca} ${tasacion.modelo} (${tasacion.dominio}) aceptado en permuta por $${Number(valorFinalAceptado).toLocaleString('es-AR')}${datos.ingresarAStock ? ' (Ingresado al stock de Usados)' : ''}`,
      },
    });
  } catch (err) {}

  return aprobada;
};
