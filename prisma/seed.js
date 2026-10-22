import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[INFO] Inicializando datos maestros y matriz de permisos...');

  // 1. Roles de Contacto (Clasificación comercial)
  const rolesContacto = ['Cliente', 'Proveedor', 'Empleado'];
  for (const rolDesc of rolesContacto) {
    await prisma.rol.upsert({
      where: { descripcionRol: rolDesc },
      update: {},
      create: { descripcionRol: rolDesc },
    });
  }
  console.log('[OK] Roles de contacto creados.');

  // 2. Perfiles de Usuario
  const perfilesData = [
    { nombre: 'ADMIN', desc: 'Acceso total y configuración del sistema' },
    { nombre: 'VENDEDOR', desc: 'Atención a clientes, oportunidades, catálogo y test drives' },
    { nombre: 'FACTURADOR', desc: 'Emisión de facturas fiscales, cobranzas y clientes' },
    { nombre: 'TASADOR', desc: 'Peritaje e inspección de vehículos usados' },
  ];

  const perfilesMap = {};
  for (const p of perfilesData) {
    const perfil = await prisma.perfil.upsert({
      where: { nombrePerfil: p.nombre },
      update: { descripcion: p.desc },
      create: { nombrePerfil: p.nombre, descripcion: p.desc },
    });
    perfilesMap[p.nombre] = perfil;
  }
  console.log('[OK] Perfiles del sistema registrados.');

  // 3. Estructura de Menús y Programas de Acción (PRG)
  const estructuraMenus = [
    {
      nombre: 'Dashboard',
      orden: 1,
      programas: [
        { codigo: 'DASHBOARD_VENTAS', desc: 'Métricas comerciales y tareas del día' },
        { codigo: 'DASHBOARD_GERENCIAL', desc: 'KPIs globales de facturación y ranking' },
      ],
    },
    {
      nombre: 'Contactos',
      orden: 2,
      programas: [
        { codigo: 'CONTACTO_LISTAR', desc: 'Listar contactos y clientes' },
        { codigo: 'CONTACTO_CREAR', desc: 'Alta de persona física o jurídica' },
        { codigo: 'CONTACTO_EDITAR', desc: 'Modificar datos de contacto' },
        { codigo: 'CONTACTO_ELIMINAR', desc: 'Baja lógica de contacto' },
        { codigo: 'INTERACCION_REGISTRAR', desc: 'Registrar llamadas o mensajes de WhatsApp' },
      ],
    },
    {
      nombre: 'Ventas y Oportunidades',
      orden: 3,
      programas: [
        { codigo: 'VENTAS_KANBAN_VER', desc: 'Ver tablero Kanban del embudo de ventas' },
        { codigo: 'VENTAS_LEAD_CREAR', desc: 'Crear nueva oportunidad de venta' },
        { codigo: 'VENTAS_CAMBIAR_ETAPA', desc: 'Mover oportunidad de etapa comercial' },
        { codigo: 'VENTAS_REASIGNAR', desc: 'Reasignar vendedor de una oportunidad' },
      ],
    },
    {
      nombre: 'Catálogo de Vehículos',
      orden: 4,
      programas: [
        { codigo: 'AUTO_CATALOGO_VER', desc: 'Consultar stock disponible y precios de lista' },
        { codigo: 'AUTO_COSTOS_VER', desc: 'Ver costo de compra interno y márgenes' },
        { codigo: 'AUTO_CREAR', desc: 'Alta de nuevo vehículo 0km o Usado' },
        { codigo: 'AUTO_EDITAR', desc: 'Editar precio de venta o estado del vehículo' },
      ],
    },
    {
      nombre: 'Pruebas de Manejo (Test Drives)',
      orden: 5,
      programas: [
        { codigo: 'TESTDRIVE_AGENDAR', desc: 'Agendar cita de prueba de manejo' },
        { codigo: 'TESTDRIVE_FEEDBACK', desc: 'Cargar resultado y opinión del cliente' },
      ],
    },
    {
      nombre: 'Tasaciones y Permutas',
      orden: 6,
      programas: [
        { codigo: 'TASACION_LISTAR_PEND', desc: 'Ver solicitudes pendientes de tasación' },
        { codigo: 'TASACION_PERITAR', desc: 'Cargar informe de inspección y estado del usado' },
        { codigo: 'TASACION_APROBAR_VALOR', desc: 'Aprobar valor de toma para permuta' },
      ],
    },
    {
      nombre: 'Facturación y Caja',
      orden: 7,
      programas: [
        { codigo: 'FACT_VENTAS_EMITIR', desc: 'Emitir Factura A/B/C o Recibo Oficial' },
        { codigo: 'FACT_VENTAS_ANULAR', desc: 'Anular factura o emitir nota de crédito' },
        { codigo: 'FACT_VENTAS_LISTAR', desc: 'Consultar historial de facturas emitidas' },
        { codigo: 'COBRO_REGISTRAR', desc: 'Registrar pago (Efectivo, Transf., Cheque, Permuta)' },
        { codigo: 'COBRO_CONSULTAR_SALDO', desc: 'Consultar saldo pendiente de la venta' },
      ],
    },
    {
      nombre: 'Configuración y Seguridad',
      orden: 8,
      programas: [
        { codigo: 'USUARIOS_ADMIN', desc: 'Gestionar usuarios del sistema y credenciales' },
        { codigo: 'ROLES_PERMISOS_ADMIN', desc: 'Configurar perfiles, menús y permisos PRG' },
      ],
    },
  ];

  // Mapas para almacenar referencias
  const prgsMap = {}; // codigo -> { prgId, menuId }

  for (const mData of estructuraMenus) {
    let menu = await prisma.menu.findFirst({
      where: { nombreMenu: mData.nombre },
    });

    if (!menu) {
      menu = await prisma.menu.create({
        data: {
          nombreMenu: mData.nombre,
          orden: mData.orden,
        },
      });
    }

    for (const pData of mData.programas) {
      const prg = await prisma.programaAccion.upsert({
        where: { codigoPrg: pData.codigo },
        update: { descripcion: pData.desc, menuId: menu.id },
        create: {
          codigoPrg: pData.codigo,
          descripcion: pData.desc,
          menuId: menu.id,
        },
      });
      prgsMap[pData.codigo] = { prgId: prg.id, menuId: menu.id };
    }
  }
  console.log('✅ Menús y programas de acción (PRG) registrados.');

  // 4. Matriz de Asignación: Perfil -> Menú -> PRG
  const matrizPermisos = {
    VENDEDOR: [
      'DASHBOARD_VENTAS',
      'CONTACTO_LISTAR',
      'CONTACTO_CREAR',
      'CONTACTO_EDITAR',
      'INTERACCION_REGISTRAR',
      'VENTAS_KANBAN_VER',
      'VENTAS_LEAD_CREAR',
      'VENTAS_CAMBIAR_ETAPA',
      'AUTO_CATALOGO_VER',
      'TESTDRIVE_AGENDAR',
      'TESTDRIVE_FEEDBACK',
      'TASACION_LISTAR_PEND',
      'TASACION_PERITAR',
      'TASACION_APROBAR_VALOR',
    ],
    FACTURADOR: [
      'CONTACTO_LISTAR',
      'CONTACTO_CREAR',
      'CONTACTO_EDITAR',
      'AUTO_CATALOGO_VER',
      'FACT_VENTAS_EMITIR',
      'FACT_VENTAS_ANULAR',
      'FACT_VENTAS_LISTAR',
      'COBRO_REGISTRAR',
      'COBRO_CONSULTAR_SALDO',
    ],
    TASADOR: [
      'AUTO_CATALOGO_VER',
      'TASACION_LISTAR_PEND',
      'TASACION_PERITAR',
      'TASACION_APROBAR_VALOR',
    ],
    ADMIN: Object.keys(prgsMap), // Admin tiene acceso a todos los PRG
  };

  for (const [nombrePerfil, codigosPrg] of Object.entries(matrizPermisos)) {
    const perfil = perfilesMap[nombrePerfil];
    if (!perfil) continue;

    for (const codigo of codigosPrg) {
      const item = prgsMap[codigo];
      if (!item) continue;

      await prisma.perfilMenuPrg.upsert({
        where: {
          perfilId_menuId_prgId: {
            perfilId: perfil.id,
            menuId: item.menuId,
            prgId: item.prgId,
          },
        },
        update: {},
        create: {
          perfilId: perfil.id,
          menuId: item.menuId,
          prgId: item.prgId,
        },
      });
    }
  }
  console.log('[OK] Matriz de permisos vinculada en perfiles_menus_prg con éxito.');

  // 5. Vincular al usuario vendedor de prueba (carlos@concesionaria.com) con el perfil VENDEDOR
  const usuarioCarlos = await prisma.usuario.findUnique({
    where: { mail: 'carlos@concesionaria.com' },
  });

  if (usuarioCarlos && perfilesMap['VENDEDOR']) {
    await prisma.perfilUsuario.upsert({
      where: {
        usuarioId_perfilId: {
          usuarioId: usuarioCarlos.id,
          perfilId: perfilesMap['VENDEDOR'].id,
        },
      },
      update: {},
      create: {
        usuarioId: usuarioCarlos.id,
        perfilId: perfilesMap['VENDEDOR'].id,
      },
    });
    console.log('[OK] Perfil VENDEDOR asignado al usuario Carlos.');
  }

  console.log('[OK] Seed completo finalizado correctamente.');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
