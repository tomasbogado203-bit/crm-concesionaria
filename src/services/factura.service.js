import prisma from '../config/prisma.js';

export const listarFacturas = async () => {
  return await prisma.factura.findMany({
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

export const obtenerFacturaPorId = async (id) => {
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

  // 5. Transacción de emisión fiscal
  return await prisma.$transaction(async (tx) => {
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

    // Si viene de una oportunidad, marcarla como GANADA
    if (datos.oportunidadId) {
      await tx.oportunidad.update({
        where: { id: datos.oportunidadId },
        data: { etapa: 'GANADA' },
      });
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

export const registrarPago = async (facturaId, { metodoPago, monto, nroComprobante }) => {
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
    const error = new Error('No se pueden imputar pagos a una factura anulada');
    error.statusCode = 400;
    throw error;
  }

  // Registrar el pago
  return await prisma.$transaction(async (tx) => {
    const nuevoPago = await tx.pagoCobro.create({
      data: {
        facturaId: Number(facturaId),
        metodoPago,
        monto,
        nroComprobante: nroComprobante || null,
      },
    });

    // Calcular si la factura queda totalmente cancelada
    const totalPagadoPrevio = factura.pagos.reduce((acc, p) => acc + Number(p.monto), 0);
    const nuevoTotalPagado = totalPagadoPrevio + Number(monto);

    if (nuevoTotalPagado >= Number(factura.total)) {
      await tx.factura.update({
        where: { id: Number(facturaId) },
        data: { estado: 'PAGADA' },
      });
    }

    return nuevoPago;
  });
};

export const anularFactura = async (id) => {
  const factura = await prisma.factura.findUnique({
    where: { id: Number(id) },
    include: { detalles: true },
  });

  if (!factura) {
    const error = new Error('Factura no encontrada');
    error.statusCode = 404;
    throw error;
  }

  if (factura.estado === 'ANULADA') {
    const error = new Error('La factura ya se encuentra anulada');
    error.statusCode = 400;
    throw error;
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Cambiar estado de factura
    const facturaAnulada = await tx.factura.update({
      where: { id: Number(id) },
      data: { estado: 'ANULADA' },
    });

    // 2. Liberar vehículos asociados de vuelta a DISPONIBLE
    for (const item of factura.detalles) {
      if (item.vehiculoId) {
        await tx.vehiculo.update({
          where: { id: item.vehiculoId },
          data: { estado: 'DISPONIBLE' },
        });
      }
    }

    return facturaAnulada;
  });
};
