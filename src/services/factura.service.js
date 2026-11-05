import prisma from '../config/prisma.js';

const accesoFacturaUsuario = (usuarioId) => ({
  OR: [
    { usuarioId: Number(usuarioId) },
    {
      cliente: {
        OR: [
          { oportunidades: { some: { usuarioId: Number(usuarioId) } } },
          { interacciones: { some: { usuarioId: Number(usuarioId) } } },
        ],
      },
    },
  ],
});

export const listarFacturas = async (usuarioId, esAdmin = false) => {
  const where = {};

  if (!esAdmin && usuarioId) {
    where.OR = accesoFacturaUsuario(usuarioId).OR;
  }

  return await prisma.factura.findMany({
    where,
    include: {
      cliente: {
        select: {
          id: true,
          nombres: true,
          apellido: true,
          razonSocial: true,
          numeroDni: true,
          tipoPersona: true,
        },
      },
      usuario: {
        select: {
          id: true,
          nombreUsuario: true,
        },
      },
      detalles: {
        include: {
          vehiculo: true,
        },
      },
      pagos: true,
    },
    orderBy: { fechaEmision: 'desc' },
  });
};

export const obtenerFacturaPorId = async (id, usuarioId = null, esAdmin = false) => {
  const facturaBase = await prisma.factura.findUnique({
    where: { id: Number(id) },
  });

  if (!facturaBase) {
    const error = new Error('Factura no encontrada');
    error.statusCode = 404;
    throw error;
  }

  if (!esAdmin && usuarioId) {
    const facturaAccesible = await prisma.factura.findFirst({
      where: {
        id: Number(id),
        ...accesoFacturaUsuario(usuarioId),
      },
    });

    if (!facturaAccesible) {
      const error = new Error('Acceso denegado: no tiene permisos sobre esta factura');
      error.statusCode = 403;
      throw error;
    }
  }

  const factura = await prisma.factura.findUnique({
    where: { id: Number(id) },
    include: {
      cliente: true,
      usuario: {
        select: {
          id: true,
          nombreUsuario: true,
        },
      },
      detalles: {
        include: {
          vehiculo: true,
        },
      },
      pagos: {
        orderBy: { fechaPago: 'desc' },
      },
    },
  });

  if (!factura) {
    const error = new Error('Factura no encontrada');
    error.statusCode = 404;
    throw error;
  }

  const totalPagado = factura.pagos.reduce((acc, p) => acc + Number(p.monto), 0);
  const saldoPendiente = Math.max(0, Number(factura.total) - totalPagado);

  return {
    ...factura,
    totalPagado,
    saldoPendiente,
  };
};

export const emitirFactura = async (datos, usuarioId) => {
  // 1. Validar cliente
  const cliente = await prisma.contacto.findFirst({
    where: { id: datos.clienteId, snActivo: true },
  });

  if (!cliente) {
    const error = new Error('Cliente no encontrado o inactivo');
    error.statusCode = 404;
    throw error;
  }

  // 2. Calcular número correlativo de comprobante
  const conteoFacturas = await prisma.factura.count();
  const siguienteNro = String(conteoFacturas + 1).padStart(8, '0');
  const puntoVenta = datos.puntoVenta || '0001';

  // 3. Generar CAE AFIP simulado (14 dígitos)
  const caeSimulado = `74${Math.floor(100000000000 + Math.random() * 900000000000)}`;

  // 4. Calcular total de los ítems
  const detallesCalculados = datos.items.map((it) => {
    const cantidad = it.cantidad || 1;
    const subtotal = cantidad * it.precioUnitario;
    return {
      vehiculoId: it.vehiculoId || null,
      descripcion: it.descripcion,
      cantidad,
      precioUnitario: it.precioUnitario,
      subtotal,
    };
  });

  const total = detallesCalculados.reduce((acc, it) => acc + it.subtotal, 0);

  // 5. Transacción atómica de emisión fiscal y actualización de stock
  return await prisma.$transaction(async (tx) => {
    // Validar conflicto de inventario para cada vehículo
    for (const item of detallesCalculados) {
      if (item.vehiculoId) {
        const vehiculo = await tx.vehiculo.findUnique({ where: { id: item.vehiculoId } });
        if (vehiculo && vehiculo.estado === 'VENDIDO') {
          const error = new Error(`Conflicto de stock: El vehículo ${vehiculo.marca} ${vehiculo.modelo} ya fue vendido`);
          error.statusCode = 409;
          throw error;
        }
      }
    }

    const nuevaFactura = await tx.factura.create({
      data: {
        oportunidadId: datos.oportunidadId || null,
        clienteId: datos.clienteId,
        usuarioId: Number(usuarioId),
        tipoComprobante: datos.tipoComprobante || 'FACTURA_B',
        puntoVenta,
        numeroComprobante: siguienteNro,
        caeAfip: caeSimulado,
        total,
        estado: 'EMITIDA',
        detalles: {
          create: detallesCalculados,
        },
      },
      include: {
        cliente: true,
        detalles: true,
      },
    });

    // Si viene de una oportunidad, marcarla como GANADA, registrar transición e imputar la seña
    if (datos.oportunidadId) {
      const op = await tx.oportunidad.findUnique({ where: { id: datos.oportunidadId } });
      if (op && op.etapa !== 'GANADA') {
        await tx.transicionEtapa.create({
          data: {
            oportunidadId: op.id,
            etapaOrigen: op.etapa,
            etapaDestino: 'GANADA',
            usuarioId: Number(usuarioId),
            motivo: `Facturación fiscal emitida (Comprobante Nº ${puntoVenta}-${siguienteNro} con CAE ${caeSimulado})`,
          },
        });
      }

      await tx.oportunidad.update({
        where: { id: datos.oportunidadId },
        data: { etapa: 'GANADA' },
      });

      // Imputar automáticamente la seña como pago inicial de la factura si existía
      if (op && op.montoSenia && Number(op.montoSenia) > 0) {
        await tx.pagoCobro.create({
          data: {
            facturaId: nuevaFactura.id,
            metodoPago: op.metodoPagoSenia || 'TRANSFERENCIA',
            monto: op.montoSenia,
            nroComprobante: op.comprobantePagoSenia ? `Seña previa: ${op.comprobantePagoSenia}` : `Seña Boleto ${op.nroReciboSenia || ''}`,
          },
        });
      }
    }

    // Para cada vehículo facturado, marcarlo como VENDIDO en stock
    for (const item of detallesCalculados) {
      if (item.vehiculoId) {
        await tx.vehiculo.update({
          where: { id: item.vehiculoId },
          data: { estado: 'VENDIDO' },
        });
      }
    }

    return nuevaFactura;
  });
};

export const registrarPago = async (facturaId, datos, usuarioId = null, esAdmin = false) => {
  await obtenerFacturaPorId(facturaId, usuarioId, esAdmin);

  const factura = await prisma.factura.findUnique({
    where: { id: Number(facturaId) },
    include: { pagos: true },
  });

  if (!factura) {
    const error = new Error('Factura no encontrada');
    error.statusCode = 404;
    throw error;
  }

  if (factura.estado === 'ANULADA') {
    const error = new Error('No se pueden registrar pagos en una factura anulada');
    error.statusCode = 409;
    throw error;
  }

  const montoNuevo = Number(datos.monto);
  const totalPagadoPrevio = factura.pagos.reduce((acc, p) => acc + Number(p.monto), 0);
  const totalFactura = Number(factura.total);

  if (totalPagadoPrevio + montoNuevo > totalFactura) {
    const error = new Error(
      `El monto ingresado ($${montoNuevo}) supera el saldo pendiente ($${totalFactura - totalPagadoPrevio})`
    );
    error.statusCode = 400;
    throw error;
  }

  return await prisma.$transaction(async (tx) => {
    const pago = await tx.pagoCobro.create({
      data: {
        facturaId: Number(facturaId),
        metodoPago: datos.metodoPago,
        monto: montoNuevo,
        nroComprobante: datos.nroComprobante || null,
      },
    });

    const nuevoTotalPagado = totalPagadoPrevio + montoNuevo;
    if (nuevoTotalPagado >= totalFactura) {
      await tx.factura.update({
        where: { id: Number(facturaId) },
        data: { estado: 'PAGADA' },
      });
    }

    return pago;
  });
};

export const anularFactura = async (id, usuarioId = null, esAdmin = false) => {
  await obtenerFacturaPorId(id, usuarioId, esAdmin);

  const factura = await prisma.factura.findUnique({
    where: { id: Number(id) },
    include: { detalles: true, pagos: true },
  });

  if (!factura) {
    const error = new Error('Factura no encontrada');
    error.statusCode = 404;
    throw error;
  }

  if (factura.estado === 'ANULADA') {
    const error = new Error('La factura ya está anulada');
    error.statusCode = 409;
    throw error;
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Cambiar estado de la factura a ANULADA
    const facturaAnulada = await tx.factura.update({
      where: { id: Number(id) },
      data: { estado: 'ANULADA' },
    });

    // 2. Liberar vehículos asociados para que vuelvan a estar DISPONIBLES
    for (const detalle of factura.detalles) {
      if (detalle.vehiculoId) {
        await tx.vehiculo.update({
          where: { id: detalle.vehiculoId },
          data: { estado: 'DISPONIBLE' },
        });
      }
    }

    return facturaAnulada;
  });
};
