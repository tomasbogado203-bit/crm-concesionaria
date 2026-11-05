import prisma from '../config/prisma.js';

const relacionUsuarioCliente = (usuarioId) => ({
  OR: [
    { oportunidades: { some: { usuarioId: Number(usuarioId) } } },
    { interacciones: { some: { usuarioId: Number(usuarioId) } } },
    { facturas: { some: { usuarioId: Number(usuarioId) } } },
    { tasaciones: { some: { usuarioId: Number(usuarioId) } } },
  ],
});

export const listarClientes = async (usuarioId, esAdmin = false) => {
  const where = {
    snActivo: true,
    roles: {
      some: {
        rol: {
          descripcionRol: 'Cliente',
        },
      },
    },
  };

  if (!esAdmin && usuarioId) {
    where.OR = relacionUsuarioCliente(usuarioId).OR;
  }

  return await prisma.contacto.findMany({
    where,
    include: {
      roles: {
        include: {
          rol: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const crearCliente = async (datosCliente) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Obtener o crear el rol comercial 'Cliente'
    let rolCliente = await tx.rol.findUnique({
      where: { descripcionRol: 'Cliente' },
    });

    if (!rolCliente) {
      rolCliente = await tx.rol.create({
        data: { descripcionRol: 'Cliente' },
      });
    }

    // 2. Crear el contacto con su rol asignado
    const nuevoContacto = await tx.contacto.create({
      data: {
        tipoPersona: datosCliente.tipoPersona || 'FISICA',
        nombres: datosCliente.nombre,
        apellido: datosCliente.apellido || null,
        razonSocial: datosCliente.razonSocial || null,
        numeroDni: datosCliente.documento,
        email: datosCliente.email || null,
        telefono: datosCliente.telefono,
        snActivo: true,
        roles: {
          create: {
            rolId: rolCliente.id,
          },
        },
      },
      include: {
        roles: {
          include: {
            rol: true,
          },
        },
      },
    });

    return nuevoContacto;
  });
};

export const obtenerClientePorId = async (id, usuarioId = null, esAdmin = false) => {
  const clienteActual = await prisma.contacto.findFirst({
    where: { id: Number(id) },
  });

  if (!clienteActual) {
    const error = new Error('Cliente no encontrado');
    error.statusCode = 404;
    throw error;
  }

  if (!esAdmin && usuarioId) {
    const clienteAccesible = await prisma.contacto.findFirst({
      where: {
        id: Number(id),
        ...relacionUsuarioCliente(usuarioId),
      },
    });

    if (!clienteAccesible) {
      const error = new Error('Acceso denegado: no tiene permisos sobre este cliente');
      error.statusCode = 403;
      throw error;
    }
  }

  const cliente = await prisma.contacto.findFirst({
    where: {
      id: Number(id),
    },
    include: {
      roles: {
        include: { rol: true },
      },
      interacciones: {
        include: { usuario: { select: { nombreUsuario: true } } },
        orderBy: { fecha: 'desc' },
      },
      oportunidades: {
        include: { vehiculo: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!cliente) {
    const error = new Error('Cliente no encontrado');
    error.statusCode = 404;
    throw error;
  }

  return cliente;
};

export const actualizarCliente = async (id, datosActualizados, usuarioId = null, esAdmin = false) => {
  await obtenerClientePorId(id, usuarioId, esAdmin);

  const datosPrisma = {};
  if (datosActualizados.nombre !== undefined) datosPrisma.nombres = datosActualizados.nombre;
  if (datosActualizados.apellido !== undefined) datosPrisma.apellido = datosActualizados.apellido;
  if (datosActualizados.razonSocial !== undefined) datosPrisma.razonSocial = datosActualizados.razonSocial;
  if (datosActualizados.documento !== undefined) datosPrisma.numeroDni = datosActualizados.documento;
  if (datosActualizados.email !== undefined) datosPrisma.email = datosActualizados.email;
  if (datosActualizados.telefono !== undefined) datosPrisma.telefono = datosActualizados.telefono;
  if (datosActualizados.direccion !== undefined) datosPrisma.direccion = datosActualizados.direccion;
  if (datosActualizados.snActivo !== undefined) datosPrisma.snActivo = datosActualizados.snActivo;

  return await prisma.contacto.update({
    where: { id: Number(id) },
    data: datosPrisma,
  });
};

export const eliminarCliente = async (id, usuarioId = null, esAdmin = false) => {
  await obtenerClientePorId(id, usuarioId, esAdmin);

  // Baja lógica (Soft delete): snActivo = false
  return await prisma.contacto.update({
    where: { id: Number(id) },
    data: { snActivo: false },
  });
};

export const registrarInteraccion = async (clienteId, { canal, resumen }, usuarioId, esAdmin = false) => {
  await obtenerClientePorId(clienteId, usuarioId, esAdmin);

  return await prisma.interaccion.create({
    data: {
      clienteId: Number(clienteId),
      usuarioId: Number(usuarioId),
      canal,
      resumen,
    },
    include: {
      usuario: {
        select: { nombreUsuario: true },
      },
    },
  });
};

export const enviarCorreoACliente = async (clienteId, { asunto, mensaje, plantilla }, usuarioId, esAdmin = false) => {
  const cliente = await obtenerClientePorId(clienteId, usuarioId, esAdmin);

  if (!cliente.email) {
    const error = new Error('El contacto no posee una dirección de correo electrónico registrada');
    error.statusCode = 400;
    throw error;
  }

  // 1. Registrar automáticamente en la bitácora de interacciones
  const interaccion = await prisma.interaccion.create({
    data: {
      clienteId: Number(clienteId),
      usuarioId: Number(usuarioId),
      canal: 'EMAIL',
      resumen: `Email enviado [${asunto}]: ${mensaje.length > 120 ? mensaje.substring(0, 120) + '...' : mensaje}`,
    },
    include: {
      usuario: {
        select: { nombreUsuario: true },
      },
    },
  });

  // 2. Disparar webhook de N8N en segundo plano si está configurado (no bloquea al usuario)
  const n8nWebhookUrl = process.env.N8N_EMAIL_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
  if (n8nWebhookUrl && process.env.NODE_ENV !== 'test') {
    const nombreCliente = cliente.tipoPersona === 'JURIDICA'
      ? (cliente.razonSocial || cliente.nombres)
      : `${cliente.nombres} ${cliente.apellido || ''}`.trim();

    fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        evento: 'EMAIL_CLIENTE',
        clienteId: cliente.id,
        nombreCliente,
        emailCliente: cliente.email,
        telefonoCliente: cliente.telefono || '',
        asunto,
        mensaje,
        plantilla: plantilla || 'PERSONALIZADO',
        fecha: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(3000),
    }).catch((err) => {
      console.error('[N8N Webhook] Error llamando a N8N para envío de email:', err.message);
    });
  }

  return {
    mensaje: 'Correo procesado y registrado en la bitácora de interacciones',
    interaccion,
  };
};
