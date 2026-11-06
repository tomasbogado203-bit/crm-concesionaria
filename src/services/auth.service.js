import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

export const registrarUsuario = async ({
  nombre,
  email,
  password,
  apellido = '',
  sucursal = 'Central',
  comisionPorcentaje = 0,
  rol: rolSolicitado,
}) => {
  // El registro público/externo NUNCA puede asignar roles privilegiados.
  // Cualquier intento de definir ADMIN queda degradado a VENDEDOR en el servidor.
  const rol = 'VENDEDOR';
  if (rolSolicitado && String(rolSolicitado).toUpperCase() === 'ADMIN') {
    // Se ignora el valor entrante y se fuerza la asignación mínima segura.
  }

  // Verificar si ya existe usuario por mail o nombre de usuario
  const usuarioExistente = await prisma.usuario.findFirst({
    where: {
      OR: [{ mail: email }, { nombreUsuario: email.split('@')[0] }],
    },
  });

  if (usuarioExistente) {
    const error = new Error('El correo electrónico o nombre de usuario ya está registrado');
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Crear Contacto y Usuario en una sola transacción atómica (Patrón Party Model)
  return await prisma.$transaction(async (tx) => {
    // 1. Crear la ficha de persona en Contactos
    const nuevoContacto = await tx.contacto.create({
      data: {
        tipoPersona: 'FISICA',
        nombres: nombre,
        apellido: apellido || null,
        numeroDni: 'S/D',
        email: email,
        snActivo: true,
      },
    });

    // 2. Buscar perfil asignable
    const perfilObj = await tx.perfil.findFirst({ where: { nombrePerfil: rol } });

    // 3. Crear las credenciales en Usuarios vinculado al Contacto y Perfil
    const nuevoUsuario = await tx.usuario.create({
      data: {
        contactoId: nuevoContacto.id,
        nombreUsuario: email.split('@')[0],
        mail: email,
        password: hashedPassword,
        sucursal: sucursal,
        comisionPorcentaje: Number(comisionPorcentaje || 0),
        snActivo: true,
        ...(perfilObj ? { perfiles: { create: { perfilId: perfilObj.id } } } : {}),
      },
      select: {
        id: true,
        contactoId: true,
        nombreUsuario: true,
        mail: true,
        sucursal: true,
        comisionPorcentaje: true,
        contacto: {
          select: {
            id: true,
            nombres: true,
            apellido: true,
          },
        },
        createdAt: true,
      },
    });

    return nuevoUsuario;
  });
};

export const crearUsuarioPorAdmin = async ({
  nombre,
  apellido = '',
  email,
  password,
  sucursal = 'Central',
  comisionPorcentaje = 0,
  rol = 'VENDEDOR',
}) => {
  const usuarioExistente = await prisma.usuario.findFirst({
    where: {
      OR: [{ mail: email }, { nombreUsuario: email.split('@')[0] }],
    },
  });

  if (usuarioExistente) {
    const error = new Error('El correo electrónico o nombre de usuario ya está registrado');
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return await prisma.$transaction(async (tx) => {
    const nuevoContacto = await tx.contacto.create({
      data: {
        tipoPersona: 'FISICA',
        nombres: nombre,
        apellido: apellido || null,
        numeroDni: 'S/D',
        email: email,
        snActivo: true,
      },
    });

    const perfilObj =
      (await tx.perfil.findFirst({ where: { nombrePerfil: rol } })) ||
      (await tx.perfil.findFirst({ where: { nombrePerfil: 'VENDEDOR' } }));

    const nuevoUsuario = await tx.usuario.create({
      data: {
        contactoId: nuevoContacto.id,
        nombreUsuario: email.split('@')[0],
        mail: email,
        password: hashedPassword,
        sucursal: sucursal,
        comisionPorcentaje: Number(comisionPorcentaje || 0),
        snActivo: true,
        ...(perfilObj ? { perfiles: { create: { perfilId: perfilObj.id } } } : {}),
      },
      select: {
        id: true,
        contactoId: true,
        nombreUsuario: true,
        mail: true,
        sucursal: true,
        comisionPorcentaje: true,
        contacto: {
          select: {
            id: true,
            nombres: true,
            apellido: true,
          },
        },
        createdAt: true,
      },
    });

    return {
      id: nuevoUsuario.id,
      contactoId: nuevoUsuario.contactoId,
      nombreUsuario: nuevoUsuario.nombreUsuario,
      mail: nuevoUsuario.mail,
      sucursal: nuevoUsuario.sucursal,
      comisionPorcentaje: nuevoUsuario.comisionPorcentaje ? Number(nuevoUsuario.comisionPorcentaje) : 0,
      snActivo: true,
      contacto: nuevoUsuario.contacto,
      perfiles: [rol],
      rol: rol,
      createdAt: nuevoUsuario.createdAt,
    };
  });
};

export const listarUsuarios = async () => {
  const usuarios = await prisma.usuario.findMany({
    include: {
      contacto: true,
      perfiles: {
        include: {
          perfil: true,
        },
      },
    },
    orderBy: {
      id: 'asc',
    },
  });

  return usuarios.map((u) => {
    const roles = (u.perfiles || []).map((p) => p.perfil.nombrePerfil);
    return {
      id: u.id,
      contactoId: u.contactoId,
      nombreUsuario: u.nombreUsuario,
      mail: u.mail,
      sucursal: u.sucursal || 'Central',
      comisionPorcentaje: u.comisionPorcentaje ? Number(u.comisionPorcentaje) : 0,
      snActivo: u.snActivo,
      createdAt: u.createdAt,
      contacto: u.contacto
        ? {
            id: u.contacto.id,
            nombres: u.contacto.nombres,
            apellido: u.contacto.apellido,
            email: u.contacto.email,
            telefono: u.contacto.telefono,
          }
        : null,
      perfiles: roles,
      rol: roles.length > 0 ? roles[0] : 'VENDEDOR',
    };
  });
};

export const cambiarEstadoUsuario = async (usuarioId, { snActivo } = {}, adminId) => {
  if (usuarioId === adminId) {
    const error = new Error('No es posible modificar el estado de tu propia cuenta de Administrador');
    error.statusCode = 400;
    throw error;
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
  });

  if (!usuario) {
    const error = new Error('Usuario no encontrado');
    error.statusCode = 404;
    throw error;
  }

  const nuevoEstado = typeof snActivo === 'boolean' ? snActivo : !usuario.snActivo;

  const actualizado = await prisma.usuario.update({
    where: { id: usuarioId },
    data: { snActivo: nuevoEstado },
    include: {
      contacto: true,
      perfiles: {
        include: {
          perfil: true,
        },
      },
    },
  });

  const roles = (actualizado.perfiles || []).map((p) => p.perfil.nombrePerfil);

  return {
    id: actualizado.id,
    nombreUsuario: actualizado.nombreUsuario,
    mail: actualizado.mail,
    sucursal: actualizado.sucursal,
    comisionPorcentaje: actualizado.comisionPorcentaje ? Number(actualizado.comisionPorcentaje) : 0,
    snActivo: actualizado.snActivo,
    perfiles: roles,
    rol: roles.length > 0 ? roles[0] : 'VENDEDOR',
  };
};

export const iniciarSesion = async ({ email, password }) => {
  const usuario = await prisma.usuario.findFirst({
    where: {
      OR: [{ mail: email }, { nombreUsuario: email }],
    },
    include: {
      contacto: true,
      perfiles: {
        include: {
          perfil: true,
        },
      },
    },
  });

  if (!usuario || !usuario.snActivo) {
    const error = new Error('Credenciales inválidas o usuario inactivo');
    error.statusCode = 401;
    throw error;
  }

  const passwordValido = await bcrypt.compare(password, usuario.password);

  if (!passwordValido) {
    const error = new Error('Credenciales inválidas');
    error.statusCode = 401;
    throw error;
  }

  const perfilesNombres = usuario.perfiles.map((p) => p.perfil.nombrePerfil);
  const perfilIds = usuario.perfiles.map((p) => p.perfilId ?? p.perfil?.id).filter(Boolean);

  const permisosMatrix = perfilIds.length
    ? await prisma.perfilMenuPrg.findMany({
        where: { perfilId: { in: perfilIds } },
        select: {
          prg: {
            select: {
              codigoPrg: true,
            },
          },
        },
      })
    : [];

  const permisosUsuario = [...new Set(permisosMatrix.map((permiso) => permiso.prg.codigoPrg))];

  const token = jwt.sign(
    {
      id: usuario.id,
      contactoId: usuario.contactoId,
      nombre: `${usuario.contacto.nombres} ${usuario.contacto.apellido || ''}`.trim(),
      email: usuario.mail,
      perfiles: perfilesNombres,
      permisos: permisosUsuario,
    },
    process.env.JWT_SECRET || 'secreto_default',
    { expiresIn: '8h' }
  );

  return {
    token,
    usuario: {
      id: usuario.id,
      contactoId: usuario.contactoId,
      nombreUsuario: usuario.nombreUsuario,
      nombreCompleto: `${usuario.contacto.nombres} ${usuario.contacto.apellido || ''}`.trim(),
      email: usuario.mail,
      sucursal: usuario.sucursal,
      comisionPorcentaje: usuario.comisionPorcentaje ? Number(usuario.comisionPorcentaje) : 0,
      perfiles: perfilesNombres,
    },
  };
};

export const obtenerMenuUsuario = async (usuarioId) => {
  // 1. Obtener perfiles del usuario
  const perfilesUsuario = await prisma.perfilUsuario.findMany({
    where: { usuarioId },
    select: { perfilId: true },
  });

  const perfilIds = perfilesUsuario.map((p) => p.perfilId);

  // Si no tiene perfiles, menú vacío
  if (perfilIds.length === 0) {
    return [];
  }

  // 2. Buscar todas las asignaciones perfil_menu_prg
  const permisos = await prisma.perfilMenuPrg.findMany({
    where: {
      perfilId: { in: perfilIds },
    },
    include: {
      menu: true,
      prg: true,
    },
  });

  // 3. Estructurar menús jerárquicos agrupados con sus PRG únicos
  const menusMap = new Map();

  for (const item of permisos) {
    const { menu, prg } = item;
    if (!menusMap.has(menu.id)) {
      menusMap.set(menu.id, {
        id: menu.id,
        nombre: menu.nombreMenu,
        orden: menu.orden,
        menuPadreId: menu.menuPadreId,
        programas: [],
      });
    }

    const menuObj = menusMap.get(menu.id);
    if (!menuObj.programas.some((p) => p.codigo === prg.codigoPrg)) {
      menuObj.programas.push({
        codigo: prg.codigoPrg,
        descripcion: prg.descripcion,
      });
    }
  }

  return Array.from(menusMap.values()).sort((a, b) => a.orden - b.orden);
};
