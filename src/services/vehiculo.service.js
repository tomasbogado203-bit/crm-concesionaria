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
    estado: true,
    createdAt: true,
  };

  return await prisma.vehiculo.findMany({
    where,
    select,
    orderBy: { createdAt: 'desc' },
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
