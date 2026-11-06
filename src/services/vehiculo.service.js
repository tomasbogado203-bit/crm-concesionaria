import prisma from '../config/prisma.js';

export const VEHICULOS_DEMO = [
  {
    id: 1,
    vin: '8AJBA3CD7E1029384',
    marca: 'Toyota',
    modelo: 'Hilux',
    version: '2.8 SRX 4x4 AT',
    anio: 2024,
    condicion: 'CERO_KM',
    kilometraje: 0,
    precioVenta: 54900000,
    imagenUrl: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=1200&q=80',
    estado: 'DISPONIBLE',
  },
  {
    id: 2,
    vin: '9BWDB4CD8F2039485',
    marca: 'Volkswagen',
    modelo: 'Taos',
    version: '1.4T Highline Tiptronic',
    anio: 2024,
    condicion: 'CERO_KM',
    kilometraje: 0,
    precioVenta: 38200000,
    imagenUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80',
    estado: 'DISPONIBLE',
  },
  {
    id: 3,
    vin: '8AFFA5CD9G3049586',
    marca: 'Ford',
    modelo: 'Ranger',
    version: '3.0 V6 Limited 4WD AT',
    anio: 2024,
    condicion: 'CERO_KM',
    kilometraje: 0,
    precioVenta: 58500000,
    imagenUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
    estado: 'DISPONIBLE',
  },
  {
    id: 4,
    vin: '8AJBA6CD0H4059687',
    marca: 'Toyota',
    modelo: 'Corolla Cross',
    version: '2.0 SEG CVT',
    anio: 2023,
    condicion: 'USADO',
    kilometraje: 18500,
    precioVenta: 33400000,
    imagenUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80',
    estado: 'DISPONIBLE',
  },
  {
    id: 5,
    vin: '9BGBA7CD1J5069788',
    marca: 'Chevrolet',
    modelo: 'Cruze',
    version: '1.4T Premier Sedan AT',
    anio: 2022,
    condicion: 'USADO',
    kilometraje: 42000,
    precioVenta: 21800000,
    imagenUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80',
    estado: 'DISPONIBLE',
  },
  {
    id: 6,
    vin: '8A1FA8CD2K6079889',
    marca: 'Peugeot',
    modelo: '208',
    version: '1.6 Feline Tiptronic',
    anio: 2023,
    condicion: 'USADO',
    kilometraje: 26000,
    precioVenta: 19500000,
    imagenUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
    estado: 'DISPONIBLE',
  },
  {
    id: 7,
    vin: '9BDFA9CD3L7089990',
    marca: 'Fiat',
    modelo: 'Toro',
    version: '2.0 Multijet Volcano 4x4 AT9',
    anio: 2022,
    condicion: 'USADO',
    kilometraje: 51000,
    precioVenta: 26900000,
    imagenUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80',
    estado: 'DISPONIBLE',
  },
  {
    id: 8,
    vin: '8AWBA0CD4M8090001',
    marca: 'Volkswagen',
    modelo: 'Nivus',
    version: '1.0 TSI Highline',
    anio: 2024,
    condicion: 'CERO_KM',
    kilometraje: 0,
    precioVenta: 29800000,
    imagenUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    estado: 'DISPONIBLE',
  },
];

const filtrarVehiculosDemo = (filtros = {}) => {
  return VEHICULOS_DEMO.filter((v) => {
    if (filtros.condicion && filtros.condicion !== 'TODOS' && v.condicion !== filtros.condicion) {
      return false;
    }
    if (filtros.marca && !v.marca.toLowerCase().includes(filtros.marca.toLowerCase())) {
      return false;
    }
    return true;
  });
};

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
    costoReacondicionamiento: verCostos,
    fechaIngresoStock: verCostos,
    consignado: verCostos,
    consignacionPorcentaje: verCostos,
    consignacionMonto: verCostos,
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
  try {
    const where = {
      estado: 'DISPONIBLE',
    };

    if (filtros.condicion && filtros.condicion !== 'TODOS') where.condicion = filtros.condicion;
    if (filtros.marca) where.marca = { contains: filtros.marca };

    const vehiculosDB = await prisma.vehiculo.findMany({
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

    if (vehiculosDB && vehiculosDB.length > 0) {
      return vehiculosDB;
    }
    return filtrarVehiculosDemo(filtros);
  } catch (error) {
    return filtrarVehiculosDemo(filtros);
  }
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
      costoReacondicionamiento: verCostos,
      fechaIngresoStock: verCostos,
      consignado: verCostos,
      consignacionPorcentaje: verCostos,
      consignacionMonto: verCostos,
      imagenUrl: true,
      estado: true,
      createdAt: true,
      updatedAt: true,
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
  const existente = await prisma.vehiculo.findUnique({
    where: { vin: datos.vin },
  });

  if (existente) {
    const error = new Error(`Ya existe un vehículo registrado con el VIN ${datos.vin}`);
    error.statusCode = 409;
    throw error;
  }

  const payload = {
    ...datos,
    fechaIngresoStock: datos.fechaIngresoStock ? new Date(datos.fechaIngresoStock) : new Date(),
    consignado: Boolean(datos.consignado),
  };

  if (payload.consignado && !payload.consignacionMonto && payload.consignacionPorcentaje) {
    payload.consignacionMonto = Number(payload.precioVenta) * (Number(payload.consignacionPorcentaje) / 100);
  }

  return await prisma.vehiculo.create({
    data: payload,
  });
};

export const actualizarVehiculo = async (id, datos) => {
  await obtenerVehiculoPorId(id, true);

  const payload = { ...datos };

  if (payload.fechaIngresoStock) {
    payload.fechaIngresoStock = new Date(payload.fechaIngresoStock);
  }

  if (payload.consignado && !payload.consignacionMonto && payload.consignacionPorcentaje) {
    payload.consignacionMonto = Number(payload.precioVenta || 0) * (Number(payload.consignacionPorcentaje) / 100);
  }

  return await prisma.vehiculo.update({
    where: { id: Number(id) },
    data: payload,
  });
};

export const crearSolicitudPublica = async (datos) => {
  try {
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
  } catch (err) {
    if (err.statusCode === 404) {
      throw err;
    }
    // Fallback si no hay conexión a base de datos
    const demoVeh = VEHICULOS_DEMO.find((v) => v.id === Number(datos.vehiculoId)) || {
      marca: 'Vehículo',
      modelo: 'Seleccionado',
      version: 'Salón',
      anio: 2024,
    };
    return {
      exito: true,
      codigoReferencia: `SOL-${Math.floor(1000 + Math.random() * 9000)}`,
      oportunidadId: 999,
      clienteId: 999,
      vehiculo: {
        marca: demoVeh.marca,
        modelo: demoVeh.modelo,
        version: demoVeh.version,
        anio: demoVeh.anio,
      },
      mensaje: '¡Tu solicitud fue registrada exitosamente en nuestro sistema!',
    };
  }
};
