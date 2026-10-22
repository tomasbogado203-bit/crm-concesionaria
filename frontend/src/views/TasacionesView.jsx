import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import {
  Wrench,
  Plus,
  Car,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  CheckSquare,
  ShieldCheck,
  Search,
  DollarSign,
  ArrowRight,
  Warehouse,
  Gauge,
  X,
} from 'lucide-react';

export const TasacionesView = () => {
  const [tasaciones, setTasaciones] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [modalSolicitar, setModalSolicitar] = useState(false);
  const [modalPeritaje, setModalPeritaje] = useState(null);
  const [modalResolver, setModalResolver] = useState(null);

  // Form Solicitar
  const [clienteId, setClienteId] = useState('');
  const [dominio, setDominio] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [version, setVersion] = useState('');
  const [anio, setAnio] = useState(new Date().getFullYear() - 5);
  const [kilometraje, setKilometraje] = useState('');
  const [combustible, setCombustible] = useState('NAFTA');
  const [detallesIniciales, setDetallesIniciales] = useState('');
  const [guardandoSolicitud, setGuardandoSolicitud] = useState(false);

  // Form Peritaje
  const [estadoCarroceria, setEstadoCarroceria] = useState('BUENO');
  const [estadoPintura, setEstadoPintura] = useState('BUENO');
  const [estadoMecanica, setEstadoMecanica] = useState('BUENO');
  const [estadoCubiertas, setEstadoCubiertas] = useState('BUENO');
  const [detallesPeritaje, setDetallesPeritaje] = useState('');
  const [valorTasado, setValorTasado] = useState('');
  const [guardandoPeritaje, setGuardandoPeritaje] = useState(false);

  // Form Resolver
  const [decision, setDecision] = useState('APROBADA');
  const [valorAceptado, setValorAceptado] = useState('');
  const [ingresarAStock, setIngresarAStock] = useState(true);
  const [guardandoResolucion, setGuardandoResolucion] = useState(false);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [tasas, clis] = await Promise.all([
        apiFetch('/tasaciones'),
        apiFetch('/clientes').catch(() => []),
      ]);
      setTasaciones(tasas);
      setClientes(clis);
    } catch (err) {
      console.error('Error cargando tasaciones:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleSolicitar = async (e) => {
    e.preventDefault();
    setGuardandoSolicitud(true);
    try {
      await apiFetch('/tasaciones', {
        method: 'POST',
        body: JSON.stringify({
          clienteId: Number(clienteId),
          dominio,
          marca,
          modelo,
          version,
          anio: Number(anio),
          kilometraje: Number(kilometraje),
          combustible,
          detallesPeritaje: detallesIniciales,
        }),
      });

      setModalSolicitar(false);
      // Reset
      setClienteId('');
      setDominio('');
      setMarca('');
      setModelo('');
      setVersion('');
      setKilometraje('');
      setDetallesIniciales('');
      cargarDatos();
    } catch (err) {
      alert(err.message || 'Error al solicitar tasación');
    } finally {
      setGuardandoSolicitud(false);
    }
  };

  const handlePeritaje = async (e) => {
    e.preventDefault();
    if (!modalPeritaje) return;
    setGuardandoPeritaje(true);
    try {
      await apiFetch(`/tasaciones/${modalPeritaje.id}/peritaje`, {
        method: 'PATCH',
        body: JSON.stringify({
          estadoCarroceria,
          estadoPintura,
          estadoMecanica,
          estadoCubiertas,
          detallesPeritaje,
          valorTasado: Number(valorTasado),
        }),
      });

      setModalPeritaje(null);
      cargarDatos();
    } catch (err) {
      alert(err.message || 'Error al guardar peritaje');
    } finally {
      setGuardandoPeritaje(false);
    }
  };

  const handleResolver = async (e) => {
    e.preventDefault();
    if (!modalResolver) return;
    setGuardandoResolucion(true);
    try {
      await apiFetch(`/tasaciones/${modalResolver.id}/resolver`, {
        method: 'PATCH',
        body: JSON.stringify({
          estado: decision,
          valorAceptado: decision === 'APROBADA' ? Number(valorAceptado) : null,
          ingresarAStock: decision === 'APROBADA' ? ingresarAStock : false,
        }),
      });

      setModalResolver(null);
      cargarDatos();
    } catch (err) {
      alert(err.message || 'Error al procesar resolución');
    } finally {
      setGuardandoResolucion(false);
    }
  };

  const abrirModalPeritaje = (t) => {
    setModalPeritaje(t);
    setEstadoCarroceria(t.estadoCarroceria || 'BUENO');
    setEstadoPintura(t.estadoPintura || 'BUENO');
    setEstadoMecanica(t.estadoMecanica || 'BUENO');
    setEstadoCubiertas(t.estadoCubiertas || 'BUENO');
    setDetallesPeritaje(t.detallesPeritaje || '');
    setValorTasado(t.valorTasado ? Number(t.valorTasado) : '');
  };

  const abrirModalResolver = (t) => {
    setModalResolver(t);
    setDecision('APROBADA');
    setValorAceptado(t.valorTasado ? Number(t.valorTasado) : '');
    setIngresarAStock(true);
  };

  // Filtrado
  const tasacionesFiltradas = tasaciones.filter((t) => {
    const coincideEstado =
      filtroEstado === 'TODOS'
        ? true
        : filtroEstado === 'PENDIENTES'
        ? t.estado === 'SOLICITADA' || t.estado === 'EN_PERITAJE'
        : filtroEstado === 'APROBADAS'
        ? t.estado === 'APROBADA' || t.estado === 'INGRESADO_STOCK'
        : t.estado === filtroEstado;

    const query = busqueda.toLowerCase();
    const nombreCliente = `${t.cliente?.nombres || ''} ${t.cliente?.apellido || ''} ${t.cliente?.razonSocial || ''}`.toLowerCase();
    const auto = `${t.marca} ${t.modelo} ${t.dominio}`.toLowerCase();

    return coincideEstado && (auto.includes(query) || nombreCliente.includes(query));
  });

  // Métricas
  const total = tasaciones.length;
  const pendientes = tasaciones.filter((t) => t.estado === 'SOLICITADA' || t.estado === 'EN_PERITAJE').length;
  const enStock = tasaciones.filter((t) => t.estado === 'INGRESADO_STOCK').length;
  const montoPermutas = tasaciones
    .filter((t) => t.estado === 'APROBADA' || t.estado === 'INGRESADO_STOCK')
    .reduce((acc, curr) => acc + Number(curr.valorAceptado || curr.valorTasado || 0), 0);

  const renderBadgeCalidad = (calidad) => {
    switch (calidad) {
      case 'EXCELENTE':
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">Excelente</span>;
      case 'BUENO':
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">Bueno</span>;
      case 'REGULAR':
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">Regular</span>;
      case 'MALO':
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded">Malo</span>;
      default:
        return <span className="text-slate-500 text-xs">-</span>;
    }
  };

  const renderBadgeEstado = (estado) => {
    switch (estado) {
      case 'SOLICITADA':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">
            <Clock className="w-3.5 h-3.5" /> Pendiente de Peritaje
          </span>
        );
      case 'EN_PERITAJE':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg">
            <Wrench className="w-3.5 h-3.5" /> Peritado (Listo para Decisión)
          </span>
        );
      case 'APROBADA':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5" /> Valor Aceptado
          </span>
        );
      case 'INGRESADO_STOCK':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg shadow-sm">
            <Warehouse className="w-3.5 h-3.5" /> En Stock Usados
          </span>
        );
      case 'RECHAZADA':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg">
            <XCircle className="w-3.5 h-3.5" /> Rechazada
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-400" />
            Tasaciones e Inspección de Usados (Permutas)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestión técnica de peritajes para vehículos tomados en parte de pago e ingreso automático al stock de usados.
          </p>
        </div>

        <button
          onClick={() => setModalSolicitar(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Solicitud de Tasación</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Total Evaluaciones</span>
            <Car className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{cargando ? '...' : total}</p>
          <p className="text-[11px] text-slate-500 mt-1">Vehículos de clientes peritados</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Pendientes de Resolución</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{cargando ? '...' : pendientes}</p>
          <p className="text-[11px] text-slate-500 mt-1">En proceso de cotización</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Incorporados al Catálogo</span>
            <Warehouse className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-400">{cargando ? '...' : enStock}</p>
          <p className="text-[11px] text-slate-500 mt-1">Autos usados en stock disponible</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Monto Total en Permutas</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {cargando ? '...' : `$${montoPermutas.toLocaleString('es-AR')}`}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Valor de toma acordado con clientes</p>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['TODOS', 'PENDIENTES', 'APROBADAS', 'RECHAZADA'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFiltroEstado(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filtroEstado === tab
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab === 'TODOS'
                ? 'Todos'
                : tab === 'PENDIENTES'
                ? 'Pendientes / En Peritaje'
                : tab === 'APROBADAS'
                ? 'Aprobadas / En Stock'
                : 'Rechazadas'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por auto, patente o cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Lista de Tasaciones */}
      {cargando ? (
        <div className="p-12 text-center text-slate-500 text-sm">Cargando tasaciones y permutas...</div>
      ) : tasacionesFiltradas.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
          <Car className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-white">No se encontraron tasaciones</p>
          <p className="text-xs text-slate-500 mt-1">
            Iniciá una nueva solicitud de tasación para peritar el usado de un cliente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {tasacionesFiltradas.map((t) => {
            const nombreCliente = t.cliente
              ? t.cliente.tipoPersona === 'FISICA'
                ? `${t.cliente.nombres} ${t.cliente.apellido || ''}`
                : t.cliente.razonSocial || t.cliente.nombres
              : 'Cliente';

            return (
              <div
                key={t.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition"
              >
                {/* Cabecera Tarjeta */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-950 text-amber-400 border border-slate-800 rounded">
                        {t.dominio}
                      </span>
                      <h3 className="font-bold text-base text-white">
                        {t.marca} {t.modelo} {t.version ? `(${t.version})` : ''}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                      <span>Año: <strong>{t.anio}</strong></span>
                      <span>•</span>
                      <span>Km: <strong>{t.kilometraje.toLocaleString('es-AR')} km</strong></span>
                      <span>•</span>
                      <span>Combustible: <strong>{t.combustible}</strong></span>
                    </p>
                  </div>
                  <div>{renderBadgeEstado(t.estado)}</div>
                </div>

                {/* Cliente y Vendedor */}
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold">
                      {nombreCliente[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">{nombreCliente}</p>
                      <p className="text-[11px] text-slate-500">
                        {t.cliente?.telefono || t.cliente?.email || 'Sin contacto directo'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Vendedor</span>
                    <span className="text-slate-300 font-medium">{t.usuario?.nombreUsuario || 'Asignado'}</span>
                  </div>
                </div>

                {/* Peritaje Técnico de 4 Puntos */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Inspección Técnica de Peritaje
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">Carrocería</span>
                      {renderBadgeCalidad(t.estadoCarroceria)}
                    </div>
                    <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">Pintura</span>
                      {renderBadgeCalidad(t.estadoPintura)}
                    </div>
                    <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">Mecánica</span>
                      {renderBadgeCalidad(t.estadoMecanica)}
                    </div>
                    <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">Cubiertas</span>
                      {renderBadgeCalidad(t.estadoCubiertas)}
                    </div>
                  </div>
                  {t.detallesPeritaje && (
                    <p className="text-xs text-slate-400 bg-slate-950/30 p-2.5 rounded-lg border border-slate-800/40 italic">
                      "{t.detallesPeritaje}"
                    </p>
                  )}
                </div>

                {/* Valores Económicos y Acciones */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">
                      {t.estado === 'APROBADA' || t.estado === 'INGRESADO_STOCK'
                        ? 'Valor Acordado de Permuta'
                        : 'Valor Estimado / Tasado'}
                    </span>
                    <span className="text-base font-bold text-emerald-400">
                      {t.valorAceptado
                        ? `$${Number(t.valorAceptado).toLocaleString('es-AR')}`
                        : t.valorTasado
                        ? `$${Number(t.valorTasado).toLocaleString('es-AR')}`
                        : 'Pendiente de tasación'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {t.estado === 'SOLICITADA' && (
                      <button
                        onClick={() => abrirModalPeritaje(t)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Cargar Peritaje</span>
                      </button>
                    )}

                    {t.estado === 'EN_PERITAJE' && (
                      <button
                        onClick={() => abrirModalResolver(t)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Aprobar / Resolver</span>
                      </button>
                    )}

                    {(t.estado === 'APROBADA' || t.estado === 'INGRESADO_STOCK') && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Operación Concluida
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Solicitar Tasación */}
      {modalSolicitar && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-400" />
                Nueva Solicitud de Tasación
              </h3>
              <button onClick={() => setModalSolicitar(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSolicitar} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Cliente Solicitante *</label>
                <select
                  required
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Seleccione un cliente registrado...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.tipoPersona === 'FISICA' ? `${c.nombres} ${c.apellido || ''}` : c.razonSocial} (DNI/CUIT: {c.numeroDni})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Patente / Dominio *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: AA123BB o AB123CD"
                    value={dominio}
                    onChange={(e) => setDominio(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Año de Fabricación *</label>
                  <input
                    type="number"
                    required
                    min={1990}
                    max={new Date().getFullYear() + 1}
                    value={anio}
                    onChange={(e) => setAnio(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Marca *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Ford, Volkswagen, Toyota"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Modelo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Focus, Gol Trend, Corolla"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Versión</label>
                  <input
                    type="text"
                    placeholder="Ej: 1.6 SE Plus"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Kilometraje *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="Ej: 85000"
                    value={kilometraje}
                    onChange={(e) => setKilometraje(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Combustible</label>
                  <select
                    value={combustible}
                    onChange={(e) => setCombustible(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="NAFTA">Nafta</option>
                    <option value="DIESEL">Diésel</option>
                    <option value="GNC">GNC</option>
                    <option value="HIBRIDO">Híbrido</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Observaciones Iniciales</label>
                <textarea
                  rows={2}
                  placeholder="Detalles provistos por el cliente, estado de papeles, titularidad..."
                  value={detallesIniciales}
                  onChange={(e) => setDetallesIniciales(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 custom-scrollbar"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalSolicitar(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoSolicitud}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-600/30 transition"
                >
                  {guardandoSolicitud ? 'Guardando...' : 'Crear Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Peritaje Técnico */}
      {modalPeritaje && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-blue-400" />
                  Peritaje Técnico de Inspección
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Vehículo: <strong>{modalPeritaje.marca} {modalPeritaje.modelo}</strong> ({modalPeritaje.dominio})
                </p>
              </div>
              <button onClick={() => setModalPeritaje(null)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePeritaje} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Estado Carrocería</label>
                  <select
                    value={estadoCarroceria}
                    onChange={(e) => setEstadoCarroceria(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="EXCELENTE">Excelente (Sin golpes)</option>
                    <option value="BUENO">Bueno (Desgaste habitual)</option>
                    <option value="REGULAR">Regular (Bollos / Rayones)</option>
                    <option value="MALO">Malo (Golpe estructural)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Estado Pintura</label>
                  <select
                    value={estadoPintura}
                    onChange={(e) => setEstadoPintura(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="EXCELENTE">Excelente (Original)</option>
                    <option value="BUENO">Bueno</option>
                    <option value="REGULAR">Regular (Repintado parcial)</option>
                    <option value="MALO">Malo (Quemada / Saltada)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Mecánica / Motor</label>
                  <select
                    value={estadoMecanica}
                    onChange={(e) => setEstadoMecanica(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="EXCELENTE">Excelente (Sin pérdidas ni ruidos)</option>
                    <option value="BUENO">Bueno (Mantenimiento al día)</option>
                    <option value="REGULAR">Regular (Requiere service)</option>
                    <option value="MALO">Malo (Fallas mayores)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Cubiertas / Neumáticos</label>
                  <select
                    value={estadoCubiertas}
                    onChange={(e) => setEstadoCubiertas(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="EXCELENTE">Excelente (&gt; 80% vida útil)</option>
                    <option value="BUENO">Bueno (50% vida útil)</option>
                    <option value="REGULAR">Regular (Próximo a cambio)</option>
                    <option value="MALO">Malo (Desgastadas)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Valuación Propuesta de Toma ($ ARS) *
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="Ej: 14500000"
                    value={valorTasado}
                    onChange={(e) => setValorTasado(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Valor de referencia según tabla y condición técnica.</p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Informe y Detalle Técnico</label>
                <textarea
                  rows={3}
                  placeholder="Detallar reparaciones requeridas para reacondicionamiento comercial..."
                  value={detallesPeritaje}
                  onChange={(e) => setDetallesPeritaje(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 custom-scrollbar"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalPeritaje(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoPeritaje}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-600/30 transition"
                >
                  {guardandoPeritaje ? 'Guardando...' : 'Guardar Peritaje'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Aprobar / Resolver Tasación */}
      {modalResolver && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-emerald-400" />
                  Resolución de Permuta Comercial
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Vehículo: <strong>{modalResolver.marca} {modalResolver.modelo}</strong> ({modalResolver.dominio})
                </p>
              </div>
              <button onClick={() => setModalResolver(null)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolver} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Decisión Comercial</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecision('APROBADA')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      decision === 'APROBADA'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-600/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aprobar Permuta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision('RECHAZADA')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      decision === 'RECHAZADA'
                        ? 'bg-rose-600/20 border-rose-500 text-rose-400 shadow-md shadow-rose-600/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Rechazar Toma</span>
                  </button>
                </div>
              </div>

              {decision === 'APROBADA' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Valor Final de Toma Acordado ($ ARS) *
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        required
                        min={1}
                        value={valorAceptado}
                        onChange={(e) => setValorAceptado(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Este monto se computará como crédito / pago en la oportunidad o factura del cliente.
                    </p>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="ingresarAStock"
                      checked={ingresarAStock}
                      onChange={(e) => setIngresarAStock(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-0 bg-slate-900 border-slate-700"
                    />
                    <label htmlFor="ingresarAStock" className="text-xs text-slate-300 cursor-pointer">
                      <strong>Ingresar automáticamente al catálogo de usados:</strong> El vehículo se dará de alta
                      en stock como <span className="text-emerald-400 font-semibold">DISPONIBLE</span> con precio sugerido
                      de reventa del 25% sobre el valor de toma.
                    </label>
                  </div>
                </>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalResolver(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoResolucion}
                  className={`px-4 py-2 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md transition ${
                    decision === 'APROBADA'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  }`}
                >
                  {guardandoResolucion ? 'Procesando...' : 'Confirmar Decisión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
