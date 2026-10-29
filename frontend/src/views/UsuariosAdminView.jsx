import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Target,
  Receipt,
  Wrench,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  Mail,
  Lock,
  User,
  AlertCircle,
  X,
  Filter,
} from 'lucide-react';

const ROL_CONFIG = {
  ADMIN: {
    nombre: 'Administrador',
    badge: 'bg-zinc-900 text-white border-zinc-900',
    icon: ShieldCheck,
  },
  VENDEDOR: {
    nombre: 'Vendedor',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Target,
  },
  FACTURADOR: {
    nombre: 'Facturador',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Receipt,
  },
  TASADOR: {
    nombre: 'Tasador',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Wrench,
  },
};

export const UsuariosAdminView = () => {
  const { usuario: usuarioLogueado } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('TODOS');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [errorModal, setErrorModal] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  // Formulario nuevo usuario
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    rol: 'VENDEDOR',
    sucursal: 'Central',
  });

  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const data = await apiFetch('/auth/usuarios');
      setUsuarios(data);
    } catch (err) {
      console.error('Error al cargar lista de usuarios:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setErrorModal(null);
    setProcesando(true);

    try {
      await apiFetch('/auth/usuarios', {
        method: 'POST',
        body: JSON.stringify(nuevoUsuario),
      });

      setMensajeExito(`Colaborador ${nuevoUsuario.nombre} dado de alta con éxito`);
      setModalAbierto(false);
      setNuevoUsuario({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        rol: 'VENDEDOR',
        sucursal: 'Central',
      });
      cargarUsuarios();

      setTimeout(() => setMensajeExito(null), 4000);
    } catch (err) {
      setErrorModal(err.message || 'Error al crear el colaborador');
    } finally {
      setProcesando(false);
    }
  };

  const toggleEstadoUsuario = async (u) => {
    if (u.id === usuarioLogueado?.id) {
      alert('No podés desactivar tu propia cuenta de Administrador activa.');
      return;
    }

    const accion = u.snActivo ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Estás seguro de que querés ${accion} el acceso de ${u.nombreUsuario}?`)) {
      return;
    }

    try {
      await apiFetch(`/auth/usuarios/${u.id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ snActivo: !u.snActivo }),
      });
      setMensajeExito(`Cuenta de ${u.nombreUsuario} ${u.snActivo ? 'desactivada' : 'reactivada'} correctamente.`);
      cargarUsuarios();
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (err) {
      alert(err.message || 'Error al actualizar estado del usuario');
    }
  };

  // Filtrado
  const usuariosFiltrados = usuarios.filter((u) => {
    const texto = `${u.nombreUsuario} ${u.mail} ${u.contacto?.nombres || ''} ${u.contacto?.apellido || ''}`.toLowerCase();
    const coincideBusqueda = texto.includes(busqueda.toLowerCase());

    const coincideRol =
      filtroRol === 'TODOS' ||
      u.rol === filtroRol ||
      (u.perfiles && u.perfiles.includes(filtroRol));

    const coincideEstado =
      filtroEstado === 'TODOS' ||
      (filtroEstado === 'ACTIVO' && u.snActivo) ||
      (filtroEstado === 'INACTIVO' && !u.snActivo);

    return coincideBusqueda && coincideRol && coincideEstado;
  });

  // Métricas
  const totalUsuarios = usuarios.length;
  const totalVendedores = usuarios.filter((u) => u.perfiles?.includes('VENDEDOR') || u.rol === 'VENDEDOR').length;
  const totalFacturadores = usuarios.filter((u) => u.perfiles?.includes('FACTURADOR') || u.rol === 'FACTURADOR').length;
  const totalAdmins = usuarios.filter((u) => u.perfiles?.includes('ADMIN') || u.rol === 'ADMIN').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Gestión de Personal y Cuentas</h1>
          <p className="text-xs text-gray-500 mt-1">
            Administración centralizada de usuarios de la concesionaria. El registro público se encuentra bloqueado por seguridad.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorModal(null);
            setModalAbierto(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#18181b] hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Colaborador</span>
        </button>
      </div>

      {/* Banner de Éxito */}
      {mensajeExito && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{mensajeExito}</span>
          </div>
          <button onClick={() => setMensajeExito(null)} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Métricas KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Equipo</span>
            <div className="w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2 tracking-tight">{totalUsuarios}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Usuarios registrados</p>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Vendedores</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Target className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2 tracking-tight">{totalVendedores}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Fuerza comercial de ventas</p>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Facturación</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2 tracking-tight">{totalFacturadores}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Caja y emisión fiscal</p>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Administradores</span>
            <div className="w-7 h-7 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2 tracking-tight">{totalAdmins}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Acceso total y configuración</p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-3.5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, correo o usuario..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Filtro Rol */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="bg-transparent text-xs text-gray-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="TODOS">Todos los Roles</option>
              <option value="VENDEDOR">Vendedor</option>
              <option value="FACTURADOR">Facturador</option>
              <option value="ADMIN">Administrador</option>
              <option value="TASADOR">Tasador</option>
            </select>
          </div>

          {/* Filtro Estado */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="bg-transparent text-xs text-gray-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="ACTIVO">Solo Activos</option>
              <option value="INACTIVO">Solo Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-[#f8f9fa] border-b border-gray-200/80 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Colaborador</th>
                <th className="py-3 px-4">Correo Institucional</th>
                <th className="py-3 px-4">Puesto / Rol</th>
                <th className="py-3 px-4">Sucursal</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    Cargando listado de colaboradores...
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    No se encontraron colaboradores con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((u) => {
                  const nombreCompleto = u.contacto
                    ? `${u.contacto.nombres} ${u.contacto.apellido || ''}`.trim()
                    : u.nombreUsuario;
                  const iniciales = nombreCompleto
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  const rolClave = u.perfiles?.[0] || u.rol || 'VENDEDOR';
                  const configRol = ROL_CONFIG[rolClave] || ROL_CONFIG.VENDEDOR;
                  const IconoRol = configRol.icon;
                  const esAdminActual = u.id === usuarioLogueado?.id;

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                            {iniciales}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{nombreCompleto}</p>
                            <p className="text-[11px] text-gray-400 font-mono">@{u.nombreUsuario}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span>{u.mail}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${configRol.badge}`}
                        >
                          <IconoRol className="w-3 h-3" />
                          {configRol.nombre}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-gray-700">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          {u.sucursal || 'Central'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.snActivo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {esAdminActual ? (
                          <span className="text-[11px] text-gray-400 italic">Sesión actual</span>
                        ) : (
                          <button
                            onClick={() => toggleEstadoUsuario(u)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                              u.snActivo
                                ? 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'
                                : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {u.snActivo ? 'Desactivar' : 'Reactivar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Alta de Colaborador */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#18181b] text-white flex items-center justify-center shadow-xs">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 tracking-tight">Dar de Alta Colaborador</h3>
                  <p className="text-[11px] text-gray-500">Crear cuenta interna para vendedor, facturador o admin</p>
                </div>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorModal && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorModal}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleCrearUsuario} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={nuevoUsuario.nombre}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
                    placeholder="Tomás"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Apellido</label>
                  <input
                    type="text"
                    value={nuevoUsuario.apellido}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, apellido: e.target.value })}
                    placeholder="Bogado"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Correo Institucional *</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={nuevoUsuario.email}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
                    placeholder="colaborador@concesionaria.com"
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Contraseña Inicial *</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={nuevoUsuario.password}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Rol / Puesto *</label>
                  <select
                    value={nuevoUsuario.rol}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
                  >
                    <option value="VENDEDOR">Vendedor Comercial</option>
                    <option value="FACTURADOR">Facturador / Caja</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="TASADOR">Tasador de Usados</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Sucursal Asignada</label>
                  <select
                    value={nuevoUsuario.sucursal}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, sucursal: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
                  >
                    <option value="Central">Sucursal Central</option>
                    <option value="Norte">Sucursal Norte</option>
                    <option value="Sur">Sucursal Sur</option>
                    <option value="Oeste">Sucursal Oeste</option>
                  </select>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="px-5 py-2 bg-[#18181b] hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {procesando ? 'Creando cuenta...' : 'Guardar y Habilitar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
