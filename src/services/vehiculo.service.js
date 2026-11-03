import prisma from '../config/prisma.js';

export const listarVehiculos = async (filtros = {}, verCostos = false) => {
  const where = {};

  if (filtros.condicion) where.condicion = filtros.condicion;
  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.marca) where.marca = { contains: filtros.marca };

  const select = {
    id: true,
    vin: true,
    marca: true,
    modelo: true,
    version: true,
    anio: true,
    condicion: true,
    kilometraje: true,
    precioVenta: true,
    costoCompra: verCostos,
    imagenUrl: true,
    estado: true,
    createdAt: true,
  };

  return await prisma.vehiculo.findMany({
    where,
    select,
    orderBy: { createdAt: 'desc' },
  });
};

export const listarCatalogoPublico = async (filtros = {}) => {
  const where = {
    estado: 'DISPONIBLE',
  };

  if (filtros.condicion && filtros.condicion !== 'TODOS') where.condicion = filtros.condicion;
  if (filtros.marca) where.marca = { contains: filtros.marca };

  return await prisma.vehiculo.findMany({
    where,
    select: {
      id: true,
      vin: true,
      marca: true,
      modelo: true,
      version: true,
      anio: true,
      condicion: true,
      kilometraje: true,
      precioVenta: true,
      imagenUrl: true,
      estado: true,
    },
    orderBy: [{ condicion: 'asc' }, { precioVenta: 'asc' }],
  });
};

export const obtenerVehiculoPorId = async (id, verCostos = false) => {
  const vehiculo = await prisma.vehiculo.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      vin: true,
      marca: true,
      modelo: true,
      version: true,
      anio: true,
      condicion: true,
      kilometraje: true,
      precioVenta: true,
      costoCompra: verCostos,
      imagenUrl: true,
      estado: true,
      createdAt: true,
      oportunidades: {
        select: {
          id: true,
          etapa: true,
          montoEstimado: true,
          cliente: { select: { nombres: true, apellido: true, razonSocial: true } },
        },
      },
    },
  });

  if (!vehiculo) {
    const error = new Error('Vehículo no encontrado');
    error.statusCode = 404;
    throw error;
  }

  return vehiculo;
};

export const crearVehiculo = async (datos) => {
  const existeVin = await prisma.vehiculo.findUnique({
    where: { vin: datos.vin },
  });

  if (existeVin) {
    const error = new Error('Ya existe un vehículo registrado con ese número de VIN/Chasis');
    error.statusCode = 409;
    throw error;
  }

  return await prisma.vehiculo.create({
    data: datos,
  });
};

export const actualizarVehiculo = async (id, datos) => {
  await obtenerVehiculoPorId(id, true);

  return await prisma.vehiculo.update({
    where: { id: Number(id) },
    data: datos,
  });
};

export const crearSolicitudPublica = async (datos) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Validar existencia del vehículo
    const vehiculo = await tx.vehiculo.findUnique({
      where: { id: Number(datos.vehiculoId) },
    });

    if (!vehiculo) {
      const error = new Error('Vehículo no encontrado');
      error.statusCode = 404;
      throw error;
    }

    // 2. Asignar usuario vendedor disponible
    let usuarioAsignado = await tx.usuario.findFirst({
      where: {
        snActivo: true,
        perfiles: { some: { perfil: { nombrePerfil: 'VENDEDOR' } } },
      },
    });

    if (!usuarioAsignado) {
      usuarioAsignado = await tx.usuario.findFirst({ where: { snActivo: true } });
    }

    const usuarioId = usuarioAsignado?.id || 1;

    // 3. Obtener o crear rol 'Cliente'
    let rolCliente = await tx.rol.findUnique({
      where: { descripcionRol: 'Cliente' },
    });
    if (!rolCliente) {
      rolCliente = await tx.rol.create({
        data: { descripcionRol: 'Cliente' },
      });
    }

    // 4. Buscar o crear Contacto
    let contacto = null;
    if (datos.dni && datos.dni !== 'WEB-LEAD') {
      contacto = await tx.contacto.findFirst({
        where: { numeroDni: datos.dni },
      });
    }
    if (!contacto && datos.telefono) {
      contacto = await tx.contacto.findFirst({
        where: { telefono: datos.telefono },
      });
    }

    if (!contacto) {
      const nombreCompleto = (datos.nombre || '').trim();
      const partes = nombreCompleto.split(' ');
      const nombres = partes[0] || 'Cliente';
      const apellido = datos.apellido || (partes.length > 1 ? partes.slice(1).join(' ') : 'Web');

      contacto = await tx.contacto.create({
        data: {
          tipoPersona: 'FISICA',
          nombres,
          apellido,
          numeroDni: datos.dni || `WEB-${Date.now().toString().slice(-6)}`,
          telefono: datos.telefono,
          email: datos.email || null,
          snActivo: true,
          roles: {
            create: {
              rolId: rolCliente.id,
            },
          },
        },
      });
    }

    // 5. Crear Oportunidad comercial
    const etapaInicial = datos.tipo === 'TEST_DRIVE' ? 'TEST_DRIVE' : 'PROSPECTO';
    const nuevaOportunidad = await tx.oportunidad.create({
      data: {
        clienteId: contacto.id,
        usuarioId,
        vehiculoId: vehiculo.id,
        etapa: etapaInicial,
        montoEstimado: vehiculo.precioVenta,
      },
    });

    // Auditoría de transición formal de etapa
    await tx.transicionEtapa.create({
      data: {
        oportunidadId: nuevaOportunidad.id,
        etapaOrigen: etapaInicial,
        etapaDestino: etapaInicial,
        usuarioId,
        motivo: `Ingreso desde Salón Virtual Web (${datos.tipo})`,
      },
    });

    // 6. Si es TEST_DRIVE, registrar prueba de manejo
    if (datos.tipo === 'TEST_DRIVE') {
      const fechaCita = datos.fechaPreferencia ? new Date(datos.fechaPreferencia) : new Date(Date.now() + 24 * 60 * 60 * 1000);
      await tx.pruebaManejo.create({
        data: {
          clienteId: contacto.id,
          usuarioId,
          vehiculoId: vehiculo.id,
          fechaHora: isNaN(fechaCita.getTime()) ? new Date() : fechaCita,
          licenciaConducir: datos.dni || 'A-VERIFICAR',
          estado: 'PROGRAMADO',
          feedback: datos.mensaje || 'Solicitud generada desde el Salón Virtual',
        },
      });
    }

    // 7. Si es PERMUTA, registrar solicitud de tasación técnica
    if (datos.tipo === 'PERMUTA' && datos.permutaMarca) {
      await tx.tasacion.create({
        data: {
          clienteId: contacto.id,
          usuarioId,
          oportunidadId: nuevaOportunidad.id,
          dominio: 'WEB-S/D',
          marca: datos.permutaMarca,
          modelo: datos.permutaModelo || 'S/D',
          anio: Number(datos.permutaAnio) || new Date().getFullYear(),
          kilometraje: Number(datos.permutaKilometraje) || 0,
          estado: 'SOLICITADA',
          detallesPeritaje: `Permuta propuesta en Salón Virtual para compra de ${vehiculo.marca} ${vehiculo.modelo}`,
        },
      });
    }

    // 8. Registrar en historial de interacciones 360
    await tx.interaccion.create({
      data: {
        clienteId: contacto.id,
        usuarioId,
        canal: 'VISITA_SALON',
        resumen: `[Salón Virtual Online] Solicitud de ${datos.tipo}: Interés en ${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.version}). Contacto: ${datos.nombre} (Tel: ${datos.telefono}). ${datos.mensaje ? 'Nota: ' + datos.mensaje : ''}`,
      },
    });

    const codigoReferencia = `SOL-${String(nuevaOportunidad.id).padStart(4, '0')}`;

    return {
      exito: true,
      codigoReferencia,
      oportunidadId: nuevaOportunidad.id,
      clienteId: contacto.id,
      vehiculo: {
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        version: vehiculo.version,
        anio: vehiculo.anio,
      },
      mensaje: '¡Tu solicitud fue registrada exitosamente en nuestro sistema!',
    };
  });
};
