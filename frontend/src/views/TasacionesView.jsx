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
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">Excelente</span>;
      case 'BUENO':
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">Bueno</span>;
      case 'REGULAR':
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">Regular</span>;
      case 'MALO':
        return <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded-full">Malo</span>;
      default:
        return <span className="text-gray-400 text-xs">-</span>;
    }
  };

  const renderBadgeEstado = (estado) => {
    switch (estado) {
      case 'SOLICITADA':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
            <Clock className="w-3.5 h-3.5" /> Pendiente de Peritaje
          </span>
        );
      case 'EN_PERITAJE':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
            <Wrench className="w-3.5 h-3.5" /> Peritado (Listo para Decisión)
          </span>
        );
      case 'APROBADA':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Valor Aceptado
          </span>
        );
      case 'INGRESADO_STOCK':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 rounded-full">
            <Warehouse className="w-3.5 h-3.5" /> En Stock Usados
          </span>
        );
      case 'RECHAZADA':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded-full">
            <XCircle className="w-3.5 h-3.5" /> Rechazada
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Tasación y Peritaje de Usados (Permutas)</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Inspección mecánica, estimación de cotización de mercado e ingreso directo a inventario de ocasión.
          </p>
        </div>

        <button
          onClick={() => setModalSolicitar(true)}
          className="px-4 py-2 bg-[#18181b] hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Solicitud de Tasación</span>
        </button>
      </div>

      {/* Métricas Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block font-medium">Total Solicitadas</span>
            <span className="text-lg font-bold text-gray-900">{total}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block font-medium">Por Peritar / Decidir</span>
            <span className="text-lg font-bold text-amber-700">{pendientes}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block font-medium">Ingresadas al Stock</span>
            <span className="text-lg font-bold text-purple-700">{enStock}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block font-medium">Capital Tomado en Permutas</span>
            <span className="text-lg font-bold text-emerald-600 font-mono">
              ${(montoPermutas / 1000000).toFixed(1)}M
            </span>
          </div>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 p-1 rounded-xl w-full sm:w-auto">
          {['TODOS', 'PENDIENTES', 'APROBADAS', 'RECHAZADAS'].map((f) => (
            <button
              key={f}
              onClick={() => setFiltroEstado(f)}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filtroEstado === f
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {f === 'TODOS'
                ? 'Todas'
                : f === 'PENDIENTES'
                ? 'En Proceso'
                : f === 'APROBADAS'
                ? 'Aceptadas / Stock'
                : 'Rechazadas'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5 bg-white border border-gray-200/90 rounded-xl px-3 py-2 w-full sm:w-72 shadow-2xs">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por auto, patente o cliente..."
            className="w-full bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Grid de Tasaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {cargando ? (
          <p className="text-xs text-gray-500 col-span-2">Cargando peritajes y tasaciones...</p>
        ) : tasacionesFiltradas.length === 0 ? (
          <div className="col-span-2 bg-white border border-gray-200/80 rounded-2xl p-12 text-center text-gray-500 shadow-xs">
            No se encontraron tasaciones con los filtros indicados.
          </div>
        ) : (
          tasacionesFiltradas.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-gray-200/80 rounded-2xl p-5 space-y-4 hover:shadow-md hover:border-gray-300 transition flex flex-col justify-between shadow-xs"
            >
              <div className="space-y-3">
                {/* Header Card */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900">
                        {t.marca} {t.modelo}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 font-mono font-bold text-[11px] text-gray-800 border border-gray-200">
                        {t.dominio}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t.version || 'Base'} · Año {t.anio} · {Number(t.kilometraje).toLocaleString('es-AR')} km · {t.combustible}
                    </p>
                  </div>
                  {renderBadgeEstado(t.estado)}
                </div>

                {/* Cliente */}
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                  <span>Titular: <strong>{t.cliente?.nombres} {t.cliente?.apellido || t.cliente?.razonSocial}</strong></span>
                  <span className="text-gray-400">· DNI: {t.cliente?.numeroDni}</span>
                </div>

                {/* Checklist Peritaje Técnico */}
                <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                  <div className="bg-gray-50/70 border border-gray-100 rounded-xl p-2 space-y-1">
                    <span className="text-[10px] text-gray-400 block font-semibold">Carrocería</span>
                    {renderBadgeCalidad(t.estadoCarroceria)}
                  </div>
                  <div className="bg-gray-50/70 border border-gray-100 rounded-xl p-2 space-y-1">
                    <span className="text-[10px] text-gray-400 block font-semibold">Pintura</span>
                    {renderBadgeCalidad(t.estadoPintura)}
                  </div>
                  <div className="bg-gray-50/70 border border-gray-100 rounded-xl p-2 space-y-1">
                    <span className="text-[10px] text-gray-400 block font-semibold">Mecánica</span>
                    {renderBadgeCalidad(t.estadoMecanica)}
                  </div>
                  <div className="bg-gray-50/70 border border-gray-100 rounded-xl p-2 space-y-1">
                    <span className="text-[10px] text-gray-400 block font-semibold">Cubiertas</span>
                    {renderBadgeCalidad(t.estadoCubiertas)}
                  </div>
                </div>

                {/* Observaciones técnicas */}
                {t.detallesPeritaje && (
                  <p className="text-xs text-gray-600 italic bg-gray-50/60 p-2.5 rounded-xl border border-gray-100">
                    "{t.detallesPeritaje}"
                  </p>
                )}

                {/* Precios y Ofertas */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 border border-gray-100 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Valor Tasación Técnica</span>
                    <span className="font-bold text-gray-800 text-sm font-mono">
                      {t.valorTasado ? `$${Number(t.valorTasado).toLocaleString('es-AR')}` : 'Sin tasar'}
                    </span>
                  </div>
                  {t.valorAceptado && (
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-700 uppercase tracking-wider block font-semibold">Valor Definitivo Tomado</span>
                      <span className="font-extrabold text-emerald-600 text-base font-mono">
                        ${Number(t.valorAceptado).toLocaleString('es-AR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                {(t.estado === 'SOLICITADA' || t.estado === 'EN_PERITAJE') && (
                  <button
                    onClick={() => abrirModalPeritaje(t)}
                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <Wrench className="w-3.5 h-3.5 text-gray-500" />
                    <span>{t.estado === 'SOLICITADA' ? 'Cargar Peritaje' : 'Modificar Peritaje'}</span>
                  </button>
                )}

                {t.estado === 'EN_PERITAJE' && (
                  <button
                    onClick={() => abrirModalResolver(t)}
                    className="px-4 py-1.5 rounded-xl bg-[#18181b] hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Tomar Decisión Comercial</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL 1: Solicitar Tasación */}
      {modalSolicitar && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-gray-200/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative my-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-sm font-bold text-gray-900">Solicitud de Tasación para Permuta</h3>
              <button onClick={() => setModalSolicitar(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSolicitar} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Cliente Propietario *</label>
                <select
                  required
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
                >
                  <option value="">Seleccione un cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombres} {c.apellido || c.razonSocial} (DNI/CUIT: {c.numeroDni})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Dominio / Patente *</label>
                  <input
                    type="text"
                    required
                    value={dominio}
                    onChange={(e) => setDominio(e.target.value.toUpperCase())}
                    placeholder="AF123CD"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Año de Fabricación *</label>
                  <input
                    type="number"
                    required
                    value={anio}
                    onChange={(e) => setAnio(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Marca *</label>
                  <input
                    type="text"
                    required
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    placeholder="Volkswagen"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Modelo *</label>
                  <input
                    type="text"
                    required
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    placeholder="Gol Trend"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Versión</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="Trendline 1.6 5P"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Kilometraje *</label>
                  <input
                    type="number"
                    required
                    value={kilometraje}
                    onChange={(e) => setKilometraje(e.target.value)}
                    placeholder="75000"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de Combustible</label>
                <select
                  value={combustible}
                  onChange={(e) => setCombustible(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
                >
                  <option value="NAFTA">Nafta</option>
                  <option value="DIESEL">Diésel</option>
                  <option value="GNC">Nafta / GNC</option>
                  <option value="HIBRIDO">Híbrido</option>
                  <option value="ELECTRICO">100% Eléctrico</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Detalles y Estado General manifestado por el Cliente
                </label>
                <textarea
                  rows="2"
                  value={detallesIniciales}
                  onChange={(e) => setDetallesIniciales(e.target.value)}
                  placeholder="Único dueño, services al día, pequeño roce en paragolpe trasero..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalSolicitar(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoSolicitud}
                  className="px-4 py-2 bg-[#18181b] hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {guardandoSolicitud ? 'Registrando...' : 'Generar Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Cargar Peritaje Técnico */}
      {modalPeritaje && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-gray-200/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative my-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-sm font-bold text-gray-900">Informe de Peritaje Técnico Mecánico</h3>
              <button onClick={() => setModalPeritaje(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4">
              Unidad: <strong className="text-gray-900">{modalPeritaje.marca} {modalPeritaje.modelo} ({modalPeritaje.dominio})</strong>
            </p>

            <form onSubmit={handlePeritaje} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Estado Carrocería</label>
                  <select
                    value={estadoCarroceria}
                    onChange={(e) => setEstadoCarroceria(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
                  >
                    <option value="EXCELENTE">Excelente (Sin golpes)</option>
                    <option value="BUENO">Bueno (Desgaste normal)</option>
                    <option value="REGULAR">Regular (Bollos menores)</option>
                    <option value="MALO">Malo (Golpe estructural)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Estado Pintura</label>
                  <select
                    value={estadoPintura}
                    onChange={(e) => setEstadoPintura(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
                  >
                    <option value="EXCELENTE">Excelente (Original)</option>
                    <option value="BUENO">Bueno (Rayas superficiales)</option>
                    <option value="REGULAR">Regular (Piezas repintadas)</option>
                    <option value="MALO">Malo (Laca quemada / óxido)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Estado Mecánica</label>
                  <select
                    value={estadoMecanica}
                    onChange={(e) => setEstadoMecanica(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
                  >
                    <option value="EXCELENTE">Excelente (Sin ruidos / fugas)</option>
                    <option value="BUENO">Bueno (Próximo a service)</option>
                    <option value="REGULAR">Regular (Tren del. / embrague)</option>
                    <option value="MALO">Malo (Falla grave motor/caja)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Estado Cubiertas</label>
                  <select
                    value={estadoCubiertas}
                    onChange={(e) => setEstadoCubiertas(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
                  >
                    <option value="EXCELENTE">Excelente (+80% dibujo)</option>
                    <option value="BUENO">Bueno (50% dibujo)</option>
                    <option value="REGULAR">Regular (Llegando al testigo)</option>
                    <option value="MALO">Malo (Para cambiar urgente)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Dictamen Pericial y Detalles Técnicos *
                </label>
                <textarea
                  rows="3"
                  required
                  value={detallesPeritaje}
                  onChange={(e) => setDetallesPeritaje(e.target.value)}
                  placeholder="Detallar condiciones encontradas durante el testeo y elevación..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Valor Estimado de Tasación Comercial ($) *
                </label>
                <input
                  type="number"
                  required
                  value={valorTasado}
                  onChange={(e) => setValorTasado(e.target.value)}
                  placeholder="14500000"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 font-mono focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalPeritaje(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoPeritaje}
                  className="px-4 py-2 bg-[#18181b] hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {guardandoPeritaje ? 'Guardando...' : 'Guardar Peritaje'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Decisión Comercial / Resolver */}
      {modalResolver && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200/80 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-sm font-bold text-gray-900">Decisión Comercial de Toma</h3>
              <button onClick={() => setModalResolver(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4">
              Resolver negociación con <strong className="text-gray-900">{modalResolver.cliente?.nombres}</strong> por su <strong className="text-gray-900">{modalResolver.marca} {modalResolver.modelo}</strong>.
            </p>

            <form onSubmit={handleResolver} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Resolución</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecision('APROBADA')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      decision === 'APROBADA'
                        ? 'bg-[#18181b] border-[#18181b] text-white shadow-xs'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Aceptar Permuta
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('RECHAZADA')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      decision === 'RECHAZADA'
                        ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" /> Rechazar
                  </button>
                </div>
              </div>

              {decision === 'APROBADA' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Monto Definitivo Acordado con el Cliente ($) *
                    </label>
                    <input
                      type="number"
                      required
                      value={valorAceptado}
                      onChange={(e) => setValorAceptado(e.target.value)}
                      placeholder="14000000"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 font-mono focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Valor tasado por el perito: ${Number(modalResolver.valorTasado || 0).toLocaleString('es-AR')}
                    </p>
                  </div>

                  <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="stockCheck"
                      checked={ingresarAStock}
                      onChange={(e) => setIngresarAStock(e.target.checked)}
                      className="w-4 h-4 rounded text-gray-900 focus:ring-gray-900 border-gray-300"
                    />
                    <label htmlFor="stockCheck" className="text-xs text-gray-700 cursor-pointer">
                      <strong>Dar de alta automáticamente en el catálogo de stock de Usados</strong>
                      <span className="block text-[10px] text-gray-500">
                        Crea el registro de vehículo listo para la venta y exhibición.
                      </span>
                    </label>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalResolver(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoResolucion}
                  className="px-4 py-2 bg-[#18181b] hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {guardandoResolucion ? 'Procesando...' : 'Confirmar Resolución'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
