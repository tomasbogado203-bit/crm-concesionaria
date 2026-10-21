# 🚗 CRM Concesionaria Oficial — Sistema de Gestión Comercial Automotriz
> **Proyecto II — INCADE**  
> Solución integral para concesionarias oficiales de vehículos 0km y usados, basada en el **Party Model unificado** y control de acceso por roles (**RBAC estricto**).

---

## 📋 Descripción del Proyecto

Este CRM automotriz fue diseñado e implementado para digitalizar y automatizar el ciclo de vida comercial completo de una concesionaria:
desde la captación del lead y la prueba de manejo (Test Drive), pasando por la cotización y permuta del auto usado del cliente, hasta la facturación fiscal oficial (con CAE de AFIP) y cobranza multimedio (efectivo, banco, crédito prendario y permutas).

---

## 🏛️ Arquitectura y Modelo de la Cátedra (INCADE)

El sistema implementa con rigor académico la arquitectura definida en la cátedra:

1. **Party Model Unificado (`contactos` ➔ `usuarios`)**:
   - Una única entidad central `contactos` gestiona tanto a personas físicas (DNI) como jurídicas (CUIT).
   - Relación `1 a (0..1)` con `usuarios`: solo aquellos contactos que sean empleados o administradores poseen credenciales de acceso al sistema.
   - Clasificación mediante relación N:M (`contactos_roles`: Cliente, Proveedor, Empleado).

2. **Matriz de Seguridad RBAC Dinámica (`Perfil ➔ Menú ➔ Programa PRG`)**:
   - Cada perfil (`VENDEDOR`, `FACTURADOR`, `TASADOR`, `ADMIN`) tiene asignados menús y programas de acción específicos en la tabla `perfiles_menus_prg`.
   - **Menú reactivo en el frontend**: El sidebar y los accesos de la interfaz se construyen dinámicamente según la respuesta del backend (`GET /auth/menu`), impidiendo accesos no autorizados a nivel API y UI.

3. **Reglas de Negocio Automatizadas**:
   - **Bloqueo de Stock en Pipeline**: Cuando una oportunidad comercial avanza a etapa `RESERVADO`, el vehículo queda bloqueado en el catálogo para evitar ventas duplicadas.
   - **Liberación de Stock**: Si la oportunidad pasa a `PERDIDA`, el vehículo se libera automáticamente quedando `DISPONIBLE`.
   - **Facturación y Salida**: Al emitir la factura fiscal, la oportunidad pasa a `GANADA` y el vehículo a `VENDIDO`.
   - **Toma de Permutas a Catálogo**: Al aprobar el peritaje técnico de un vehículo usado, se incorpora directamente al inventario de vehículos con su costo de toma y margen comercial de reventa.
   - **Historial 360° de Contactos**: Cada test drive, interacción, llamada o peritaje se audita en la cronología de `interacciones` del cliente.

---

## 📦 Módulos del Sistema

| Módulo | Descripción | Perfiles Principales |
|---|---|---|
| **Dashboard** | Métricas comerciales en tiempo real, KPIs de stock, oportunidades activas y facturación. | Todos |
| **Contactos** | Gestión unificada de personas físicas y empresas con ficha 360° y cronología de interacciones. | Vendedor, Admin |
| **Catálogo de Vehículos** | Gestión de unidades 0km y usados. Control estricto de visibilidad de costos de compra según perfil. | Todos |
| **Ventas y Oportunidades** | Embudo comercial en tablero Kanban drag-and-drop con bloqueo automático de vehículos. | Vendedor, Admin |
| **Pruebas de Manejo (Test Drives)** | Agendamiento de pruebas, control de licencias de conducir y registro de feedback con calificación (★). | Vendedor, Admin |
| **Tasaciones y Permutas** | Inspección técnica de usados de 4 puntos (carrocería, pintura, motor, neumáticos) e ingreso automático a stock. | Tasador, Vendedor, Admin |
| **Facturación y Caja** | Emisión de Facturas A/B/C y Recibos con CAE AFIP simulado, y caja multimedio (efectivo, permuta, prendario, transferencias). | Facturador, Admin |

---

## 🛠️ Stack Tecnológico

### Backend
- **Node.js** (v20+ / ES Modules)
- **Express.js** (API REST modular)
- **Prisma ORM** (Modelado relacional y migraciones tipadas)
- **MySQL** (Base de datos relacional)
- **Zod** (Validación de esquemas y payloads de entrada)
- **JWT + Bcrypt** (Autenticación sin estado y hash de contraseñas)

### Frontend
- **React 19**
- **Vite** (Bundler ultrarrápido)
- **Tailwind CSS v4** (Diseño moderno, responsivo y modo oscuro corporativo)
- **Lucide Icons** (Iconografía limpia y estandarizada)

---

## 🚀 Instalación y Puesta en Marcha

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/crm-concesionaria.git
cd crm-concesionaria
```

### 2. Configurar variables de entorno
Crear un archivo `.env` en la raíz del proyecto (o copiar desde `.env.example`):
```env
PORT=3000
DATABASE_URL="mysql://root:root@localhost:3306/crm_concesionaria_db"
JWT_SECRET="secreto_super_seguro_para_jwt_cambiar_en_produccion"
NODE_ENV="development"
CORS_ORIGIN="*"
```

### 3. Instalar dependencias
```bash
# Dependencias del Backend
npm install

# Dependencias del Frontend
cd frontend
npm install
cd ..
```

### 4. Sincronizar Base de Datos y Cargar Datos Maestros
Asegurate de tener MySQL iniciado (puerto 3306). Luego ejecutá:
```bash
# Crear las 18 entidades y relaciones en MySQL
npx prisma db push

# Cargar roles, perfiles, menú dinámico, permisos PRG, vehículos y usuarios de prueba
node prisma/seed.js
```

### 5. Iniciar Servidores de Desarrollo
En una terminal:
```bash
# Iniciar API Backend en http://localhost:3000
npm run dev
```

En otra terminal:
```bash
# Iniciar Frontend Web en http://localhost:5173
cd frontend
npm run dev
```

Abrí tu navegador en **`http://localhost:5173`**.

---

## 🔑 Credenciales de Demostración

La pantalla de Login cuenta con **botones de acceso rápido de 1-click** para alternar entre perfiles:

| Perfil | Email | Contraseña | Capacidades |
|---|---|---|---|
| **Vendedor** | `carlos@concesionaria.com` | `Password123` | Leads, Kanban, Catálogo, Test Drives y Tasaciones. |
| **Facturador** | `facturador@concesionaria.com` | `Password123` | Emisión fiscal de facturas, cobranzas multimedio y recibos. |
| **Administrador** | `admin@concesionaria.com` | `Password123` | Control total del sistema y configuración de seguridad. |

---

## 👥 Autores
- **Proyecto II — INCADE**
- Desarrollo de Sistemas / Aplicaciones Comerciales
