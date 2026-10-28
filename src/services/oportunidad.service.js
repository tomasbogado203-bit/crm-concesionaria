import prisma from '../config/prisma.js';

/**
 * Matriz formal de transiciones de etapa válidas para el pipeline de CRM (Clase 7)
 */
export const TRANSICIONES_PERMITIDAS = {
  PROSPECTO: ['TEST_DRIVE', 'NEGOCIACION', 'RESERVADO', 'PERDIDA'],
  TEST_DRIVE: ['NEGOCIACION', 'RESERVADO', 'PERDIDA', 'PROSPECTO'],
  NEGOCIACION: ['TEST_DRIVE', 'RESERVADO', 'GANADA', 'PERDIDA'],
  RESERVADO: ['GANADA', 'PERDIDA', 'NEGOCIACION'],
  GANADA: [], // Etapa terminal cerrada (venta concluida)
  PERDIDA: ['PROSPECTO', 'NEGOCIACION'], // Reapertura comercial de lead
};

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
      transiciones: {
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const crearOportunidad = async (datos, usuarioId) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Validar cliente activo
    const cliente = await tx.contacto.findFirst({
      where: { id: datos.clienteId, snActivo: true },
    });

    if (!cliente) {
      const error = new Error('Cliente no encontrado o inactivo');
      error.statusCode = 404;
      throw error;
    }

    // 2. Validar vehículo
    const vehiculo = await tx.vehiculo.findUnique({
      where: { id: datos.vehiculoId },
    });

    if (!vehiculo) {
      const error = new Error('Vehículo no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // 409 Conflict si el vehículo ya no está disponible
    if (vehiculo.estado === 'VENDIDO') {
      const error = new Error('Conflicto de stock: El vehículo ya fue vendido');
      error.statusCode = 409;
      throw error;
    }

    const etapaInicial = datos.etapa || 'PROSPECTO';

    if (etapaInicial === 'RESERVADO' && vehiculo.estado === 'RESERVADO') {
      const error = new Error('Conflicto de stock: El vehículo ya se encuentra reservado por otra operación');
      error.statusCode = 409;
      throw error;
    }

    // 3. Crear oportunidad comercial
    const nuevaOportunidad = await tx.oportunidad.create({
      data: {
        clienteId: datos.clienteId,
        vehiculoId: datos.vehiculoId,
        usuarioId: Number(usuarioId),
        etapa: etapaInicial,
        montoEstimado: datos.montoEstimado,
      },
      include: {
        cliente: true,
        vehiculo: true,
      },
    });

    // 4. Registrar en la tabla de transiciones de etapa (auditoría formal)
    await tx.transicionEtapa.create({
      data: {
        oportunidadId: nuevaOportunidad.id,
        etapaOrigen: etapaInicial,
        etapaDestino: etapaInicial,
        usuarioId: Number(usuarioId),
        motivo: 'Apertura de oportunidad comercial en CRM',
      },
    });

    // Si se crea directo en estado RESERVADO, bloquea el auto en stock
    if (etapaInicial === 'RESERVADO') {
      await tx.vehiculo.update({
        where: { id: datos.vehiculoId },
        data: { estado: 'RESERVADO' },
      });
    }

    return nuevaOportunidad;
  });
};

export const cambiarEtapa = async (id, nuevaEtapa, usuarioId, esAdmin = false, motivoPerdida = null) => {
  return await prisma.$transaction(async (tx) => {
    const oportunidad = await tx.oportunidad.findUnique({
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

    const etapaActual = oportunidad.etapa;

    // Si es idéntica, retornar sin alteración
    if (etapaActual === nuevaEtapa) {
      return oportunidad;
    }

    // Validar contra la matriz de transiciones permitidas
    const transicionesValidas = TRANSICIONES_PERMITIDAS[etapaActual] || [];
    if (!transicionesValidas.includes(nuevaEtapa)) {
      const error = new Error(
        `Transición no permitida: no es posible pasar de '${etapaActual}' a '${nuevaEtapa}'`
      );
      error.statusCode = 409; // HTTP 409 Conflict solicitado por la cátedra
      throw error;
    }

    // Reglas de negocio y consistencia de inventario de vehículos
    if (nuevaEtapa === 'RESERVADO') {
      if (oportunidad.vehiculo.estado === 'VENDIDO') {
        const error = new Error('Conflicto: El vehículo ya se encuentra vendido');
        error.statusCode = 409;
        throw error;
      }

      if (oportunidad.vehiculo.estado === 'RESERVADO') {
        const otraReserva = await tx.oportunidad.findFirst({
          where: {
            vehiculoId: oportunidad.vehiculoId,
            etapa: 'RESERVADO',
            id: { not: oportunidad.id },
          },
        });
        if (otraReserva) {
          const error = new Error('Conflicto: El vehículo ya está reservado por otra oportunidad activa');
          error.statusCode = 409;
          throw error;
        }
      }

      await tx.vehiculo.update({
        where: { id: oportunidad.vehiculoId },
        data: { estado: 'RESERVADO' },
      });
    } else if (nuevaEtapa === 'GANADA') {
      if (oportunidad.vehiculo.estado === 'VENDIDO') {
        const error = new Error('Conflicto: El vehículo ya fue marcado como vendido');
        error.statusCode = 409;
        throw error;
      }

      await tx.vehiculo.update({
        where: { id: oportunidad.vehiculoId },
        data: { estado: 'VENDIDO' },
      });
    } else if (['PERDIDA', 'PROSPECTO', 'TEST_DRIVE', 'NEGOCIACION'].includes(nuevaEtapa)) {
      // Liberar vehículo si sale de reserva o si se cancela
      if (etapaActual === 'RESERVADO') {
        await tx.vehiculo.update({
          where: { id: oportunidad.vehiculoId },
          data: { estado: 'DISPONIBLE' },
        });
      }
    }

    // Registrar en la tabla transiciones_etapa (Clase 7)
    await tx.transicionEtapa.create({
      data: {
        oportunidadId: oportunidad.id,
        etapaOrigen: etapaActual,
        etapaDestino: nuevaEtapa,
        usuarioId: Number(usuarioId),
        motivo: nuevaEtapa === 'PERDIDA' ? motivoPerdida || 'Sin motivo especificado' : null,
      },
    });

    // Actualizar la oportunidad
    return await tx.oportunidad.update({
      where: { id: Number(id) },
      data: {
        etapa: nuevaEtapa,
        motivoPerdida: nuevaEtapa === 'PERDIDA' ? motivoPerdida || 'Sin motivo especificado' : null,
      },
      include: {
        cliente: true,
        vehiculo: true,
        transiciones: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
  });
};

export const registrarSenia = async (id, datos, usuarioId, esAdmin = false) => {
  return await prisma.$transaction(async (tx) => {
    const oportunidad = await tx.oportunidad.findUnique({
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

    if (oportunidad.vehiculo.estado === 'VENDIDO') {
      const error = new Error('Conflicto: El vehículo ya fue vendido');
      error.statusCode = 409;
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
    await tx.vehiculo.update({
      where: { id: oportunidad.vehiculoId },
      data: { estado: 'RESERVADO' },
    });

    // 2. Registrar la transición de etapa si no estaba ya reservada
    if (oportunidad.etapa !== 'RESERVADO') {
      await tx.transicionEtapa.create({
        data: {
          oportunidadId: oportunidad.id,
          etapaOrigen: oportunidad.etapa,
          etapaDestino: 'RESERVADO',
          usuarioId: Number(usuarioId),
          motivo: `Reserva con seña de $${montoSenia.toLocaleString('es-AR')} (${nroReciboSenia})`,
        },
      });
    }

    // 3. Registrar en la bitácora del cliente la interacción automática
    await tx.interaccion.create({
      data: {
        clienteId: oportunidad.clienteId,
        usuarioId: Number(usuarioId),
        canal: 'VISITA_SALON',
        resumen: `Seña registrada para el vehículo ${oportunidad.vehiculo.marca} ${oportunidad.vehiculo.modelo} (${oportunidad.vehiculo.vin}). Monto recibido: $${montoSenia.toLocaleString('es-AR')} vía ${datos.metodoPago || 'TRANSFERENCIA'}. Recibo Nº ${nroReciboSenia}. Vencimiento de reserva: ${fechaVencimiento.toLocaleDateString('es-AR')}.`,
      },
    });

    // 4. Actualizar la oportunidad con los datos de la reserva
    return await tx.oportunidad.update({
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
  });
};
