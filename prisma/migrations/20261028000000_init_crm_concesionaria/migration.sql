-- CreateTable
CREATE TABLE `contactos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo_persona` ENUM('FISICA', 'JURIDICA') NOT NULL DEFAULT 'FISICA',
    `apellido` VARCHAR(191) NULL,
    `nombres` VARCHAR(191) NOT NULL,
    `razon_social` VARCHAR(191) NULL,
    `numero_dni` VARCHAR(191) NOT NULL,
    `fecha_naci` DATETIME(3) NULL,
    `sexo` ENUM('M', 'F', 'OTRO', 'NO_APLICA') NULL DEFAULT 'NO_APLICA',
    `sn_activo` BOOLEAN NOT NULL DEFAULT true,
    `telefono` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `direccion` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_contacto` INTEGER NOT NULL,
    `nombre_usuario` VARCHAR(191) NOT NULL,
    `mail` VARCHAR(191) NOT NULL,
    `contrasena` VARCHAR(191) NOT NULL,
    `suc` VARCHAR(191) NULL,
    `sn_activo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_id_contacto_key`(`id_contacto`),
    UNIQUE INDEX `usuarios_nombre_usuario_key`(`nombre_usuario`),
    UNIQUE INDEX `usuarios_mail_key`(`mail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descripcion_rol` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `roles_descripcion_rol_key`(`descripcion_rol`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contactos_roles` (
    `id_contacto` INTEGER NOT NULL,
    `id_rol` INTEGER NOT NULL,

    PRIMARY KEY (`id_contacto`, `id_rol`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perfiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_perfil` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,

    UNIQUE INDEX `perfiles_nombre_perfil_key`(`nombre_perfil`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perfiles_usuarios` (
    `id_usuario` INTEGER NOT NULL,
    `id_perfil` INTEGER NOT NULL,

    PRIMARY KEY (`id_usuario`, `id_perfil`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `menus` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `menu_padre_id` INTEGER NULL,
    `nombre_menu` VARCHAR(191) NOT NULL,
    `orden` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `programas_acciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `menu_id` INTEGER NOT NULL,
    `codigo_prg` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `programas_acciones_codigo_prg_key`(`codigo_prg`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perfiles_menus_prg` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_perfil` INTEGER NOT NULL,
    `id_menu` INTEGER NOT NULL,
    `id_prg` INTEGER NOT NULL,

    UNIQUE INDEX `perfiles_menus_prg_id_perfil_id_menu_id_prg_key`(`id_perfil`, `id_menu`, `id_prg`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehiculos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vin` VARCHAR(191) NOT NULL,
    `marca` VARCHAR(191) NOT NULL,
    `modelo` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `anio` INTEGER NOT NULL,
    `condicion` ENUM('CERO_KM', 'USADO') NOT NULL DEFAULT 'CERO_KM',
    `kilometraje` INTEGER NOT NULL DEFAULT 0,
    `precio_venta` DECIMAL(12, 2) NOT NULL,
    `costo_compra` DECIMAL(12, 2) NULL,
    `estado` ENUM('DISPONIBLE', 'RESERVADO', 'VENDIDO') NOT NULL DEFAULT 'DISPONIBLE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `vehiculos_vin_key`(`vin`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oportunidades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_contacto` INTEGER NOT NULL,
    `id_usuario` INTEGER NOT NULL,
    `id_vehiculo` INTEGER NOT NULL,
    `etapa` ENUM('PROSPECTO', 'TEST_DRIVE', 'NEGOCIACION', 'RESERVADO', 'GANADA', 'PERDIDA') NOT NULL DEFAULT 'PROSPECTO',
    `monto_estimado` DECIMAL(12, 2) NOT NULL,
    `motivo_perdida` VARCHAR(191) NULL,
    `nro_recibo_senia` VARCHAR(191) NULL,
    `monto_senia` DECIMAL(12, 2) NULL,
    `metodo_pago_senia` ENUM('EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'PRENDARIO', 'PERMUTA') NULL,
    `comprobante_pago_senia` VARCHAR(191) NULL,
    `fecha_vencimiento_reserva` DATETIME(3) NULL,
    `observaciones_reserva` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transiciones_etapa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_oportunidad` INTEGER NOT NULL,
    `etapa_origen` ENUM('PROSPECTO', 'TEST_DRIVE', 'NEGOCIACION', 'RESERVADO', 'GANADA', 'PERDIDA') NOT NULL,
    `etapa_destino` ENUM('PROSPECTO', 'TEST_DRIVE', 'NEGOCIACION', 'RESERVADO', 'GANADA', 'PERDIDA') NOT NULL,
    `id_usuario` INTEGER NOT NULL,
    `motivo` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `facturas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_oportunidad` INTEGER NULL,
    `id_contacto` INTEGER NOT NULL,
    `id_usuario` INTEGER NOT NULL,
    `tipo_comprobante` ENUM('FACTURA_A', 'FACTURA_B', 'FACTURA_C', 'RECIBO') NOT NULL DEFAULT 'FACTURA_B',
    `punto_venta` VARCHAR(191) NOT NULL,
    `numero_comprobante` VARCHAR(191) NOT NULL,
    `cae_afip` VARCHAR(191) NULL,
    `fecha_emision` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `total` DECIMAL(12, 2) NOT NULL,
    `estado` ENUM('EMITIDA', 'PAGADA', 'ANULADA') NOT NULL DEFAULT 'EMITIDA',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detalles_factura` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_factura` INTEGER NOT NULL,
    `id_vehiculo` INTEGER NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `cantidad` INTEGER NOT NULL DEFAULT 1,
    `precio_unitario` DECIMAL(12, 2) NOT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagos_cobros` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_factura` INTEGER NOT NULL,
    `metodo_pago` ENUM('EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'PRENDARIO', 'PERMUTA') NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `fecha_pago` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `nro_comprobante` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `interacciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_contacto` INTEGER NOT NULL,
    `id_usuario` INTEGER NOT NULL,
    `canal` ENUM('WHATSAPP', 'LLAMADA', 'VISITA_SALON', 'EMAIL') NOT NULL,
    `resumen` TEXT NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tareas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `id_contacto` INTEGER NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `fecha_vencimiento` DATETIME(3) NOT NULL,
    `estado` ENUM('PENDIENTE', 'COMPLETADA') NOT NULL DEFAULT 'PENDIENTE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pruebas_manejo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_contacto` INTEGER NOT NULL,
    `id_usuario` INTEGER NOT NULL,
    `id_vehiculo` INTEGER NOT NULL,
    `fecha_hora` DATETIME(3) NOT NULL,
    `licencia_conducir` VARCHAR(191) NOT NULL,
    `estado` ENUM('PROGRAMADO', 'COMPLETADO', 'CANCELADO') NOT NULL DEFAULT 'PROGRAMADO',
    `feedback` TEXT NULL,
    `calificacion` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tasaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_contacto` INTEGER NOT NULL,
    `id_usuario` INTEGER NOT NULL,
    `id_oportunidad` INTEGER NULL,
    `dominio` VARCHAR(191) NOT NULL,
    `marca` VARCHAR(191) NOT NULL,
    `modelo` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NULL,
    `anio` INTEGER NOT NULL,
    `kilometraje` INTEGER NOT NULL,
    `combustible` VARCHAR(191) NULL DEFAULT 'NAFTA',
    `estadoCarroceria` VARCHAR(191) NULL DEFAULT 'BUENO',
    `estadoPintura` VARCHAR(191) NULL DEFAULT 'BUENO',
    `estadoMecanica` VARCHAR(191) NULL DEFAULT 'BUENO',
    `estadoCubiertas` VARCHAR(191) NULL DEFAULT 'BUENO',
    `detalles_peritaje` TEXT NULL,
    `valor_tasado` DECIMAL(12, 2) NULL,
    `valor_aceptado` DECIMAL(12, 2) NULL,
    `estado` ENUM('SOLICITADA', 'EN_PERITAJE', 'APROBADA', 'RECHAZADA', 'INGRESADO_STOCK') NOT NULL DEFAULT 'SOLICITADA',
    `id_vehiculo_ingresado` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_id_contacto_fkey` FOREIGN KEY (`id_contacto`) REFERENCES `contactos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contactos_roles` ADD CONSTRAINT `contactos_roles_id_contacto_fkey` FOREIGN KEY (`id_contacto`) REFERENCES `contactos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contactos_roles` ADD CONSTRAINT `contactos_roles_id_rol_fkey` FOREIGN KEY (`id_rol`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perfiles_usuarios` ADD CONSTRAINT `perfiles_usuarios_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perfiles_usuarios` ADD CONSTRAINT `perfiles_usuarios_id_perfil_fkey` FOREIGN KEY (`id_perfil`) REFERENCES `perfiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `menus` ADD CONSTRAINT `menus_menu_padre_id_fkey` FOREIGN KEY (`menu_padre_id`) REFERENCES `menus`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `programas_acciones` ADD CONSTRAINT `programas_acciones_menu_id_fkey` FOREIGN KEY (`menu_id`) REFERENCES `menus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perfiles_menus_prg` ADD CONSTRAINT `perfiles_menus_prg_id_perfil_fkey` FOREIGN KEY (`id_perfil`) REFERENCES `perfiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perfiles_menus_prg` ADD CONSTRAINT `perfiles_menus_prg_id_menu_fkey` FOREIGN KEY (`id_menu`) REFERENCES `menus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perfiles_menus_prg` ADD CONSTRAINT `perfiles_menus_prg_id_prg_fkey` FOREIGN KEY (`id_prg`) REFERENCES `programas_acciones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oportunidades` ADD CONSTRAINT `oportunidades_id_contacto_fkey` FOREIGN KEY (`id_contacto`) REFERENCES `contactos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oportunidades` ADD CONSTRAINT `oportunidades_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oportunidades` ADD CONSTRAINT `oportunidades_id_vehiculo_fkey` FOREIGN KEY (`id_vehiculo`) REFERENCES `vehiculos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transiciones_etapa` ADD CONSTRAINT `transiciones_etapa_id_oportunidad_fkey` FOREIGN KEY (`id_oportunidad`) REFERENCES `oportunidades`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transiciones_etapa` ADD CONSTRAINT `transiciones_etapa_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `facturas_id_oportunidad_fkey` FOREIGN KEY (`id_oportunidad`) REFERENCES `oportunidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `facturas_id_contacto_fkey` FOREIGN KEY (`id_contacto`) REFERENCES `contactos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `facturas_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_factura` ADD CONSTRAINT `detalles_factura_id_factura_fkey` FOREIGN KEY (`id_factura`) REFERENCES `facturas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_factura` ADD CONSTRAINT `detalles_factura_id_vehiculo_fkey` FOREIGN KEY (`id_vehiculo`) REFERENCES `vehiculos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos_cobros` ADD CONSTRAINT `pagos_cobros_id_factura_fkey` FOREIGN KEY (`id_factura`) REFERENCES `facturas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interacciones` ADD CONSTRAINT `interacciones_id_contacto_fkey` FOREIGN KEY (`id_contacto`) REFERENCES `contactos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interacciones` ADD CONSTRAINT `interacciones_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tareas` ADD CONSTRAINT `tareas_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tareas` ADD CONSTRAINT `tareas_id_contacto_fkey` FOREIGN KEY (`id_contacto`) REFERENCES `contactos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pruebas_manejo` ADD CONSTRAINT `pruebas_manejo_id_contacto_fkey` FOREIGN KEY (`id_contacto`) REFERENCES `contactos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pruebas_manejo` ADD CONSTRAINT `pruebas_manejo_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pruebas_manejo` ADD CONSTRAINT `pruebas_manejo_id_vehiculo_fkey` FOREIGN KEY (`id_vehiculo`) REFERENCES `vehiculos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasaciones` ADD CONSTRAINT `tasaciones_id_contacto_fkey` FOREIGN KEY (`id_contacto`) REFERENCES `contactos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasaciones` ADD CONSTRAINT `tasaciones_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasaciones` ADD CONSTRAINT `tasaciones_id_oportunidad_fkey` FOREIGN KEY (`id_oportunidad`) REFERENCES `oportunidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

