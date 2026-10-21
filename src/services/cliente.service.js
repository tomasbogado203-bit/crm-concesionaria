import prisma from '../config/prisma.js';

export const listarClientes = async () => {
  return await prisma.contacto.findMany({
    where: {
      snActivo: true,
      roles: {
        some: {
          rol: {
            descripcionRol: 'Cliente',
          },
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

export const obtenerClientePorId = async (id) => {
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

export const actualizarCliente = async (id, datosActualizados) => {
  await obtenerClientePorId(id);

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

export const eliminarCliente = async (id) => {
  await obtenerClientePorId(id);

  // Baja lógica (Soft delete): snActivo = false
  return await prisma.contacto.update({
    where: { id: Number(id) },
    data: { snActivo: false },
  });
};

export const registrarInteraccion = async (clienteId, { canal, resumen }, usuarioId) => {
  await obtenerClientePorId(clienteId);

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

