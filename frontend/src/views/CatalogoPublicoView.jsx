import React, { useState, useEffect } from 'react';
import {
  Car,
  Search,
  MessageCircle,
  Calculator,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Filter,
  X,
  Phone,
  Clock,
  ChevronRight,
  SlidersHorizontal,
  LogIn,
} from 'lucide-react';
import { SimuladorFinancieroModal } from '../components/SimuladorFinancieroModal';

const API_BASE = 'http://localhost:3000';

export const CatalogoPublicoView = ({ onVolverLogin, usuarioLogueado, onVolverCRM }) => {
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCondicion, setFiltroCondicion] = useState('TODOS');
  const [orden, setOrden] = useState('PRECIO_ASC');

  // Modales
  const [vehiculoSimular, setVehiculoSimular] = useState(null);
  const [vehiculoDetalle, setVehiculoDetalle] = useState(null);
  const [vehiculoTestDrive, setVehiculoTestDrive] = useState(null);

  // Form Solicitar Test Drive
  const [nombreSolicitante, setNombreSolicitante] = useState('');
  const [telefonoSolicitante, setTelefonoSolicitante] = useState('');
  const [mensajeSolicitud, setMensajeSolicitud] = useState('');
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);

  const cargarCatalogo = async () => {
    try {
      setCargando(true);
      const res = await fetch(`${API_BASE}/vehiculos/publico`);
      if (res.ok) {
        const data = await res.json();
        setVehiculos(data);
      }
    } catch (err) {
      console.error('Error al cargar catálogo público:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCatalogo();
  }, []);

  const handleConsultarWhatsApp = (v) => {
    const texto = encodeURIComponent(
      `¡Hola! Estoy viendo el catálogo online de la concesionaria y me interesa el ${v.marca} ${v.modelo} ${v.version} (${v.anio}) publicado a $${Number(v.precioVenta).toLocaleString('es-AR')}. ¿Me podrían brindar más información sobre disponibilidad y financiación?`
    );
    window.open(`https://wa.me/5491123456789?text=${texto}`, '_blank');
  };

  const handleEnviarSolicitudTestDrive = (e) => {
    e.preventDefault();
    const v = vehiculoTestDrive;
    const texto = encodeURIComponent(
      `¡Hola! Mi nombre es ${nombreSolicitante} (Tel: ${telefonoSolicitante}). Quisiera solicitar un turno para probar el vehículo ${v.marca} ${v.modelo} ${v.version} (${v.anio}). ${mensajeSolicitud ? 'Comentarios: ' + mensajeSolicitud : ''}`
    );
    window.open(`https://wa.me/5491123456789?text=${texto}`, '_blank');
    setSolicitudEnviada(true);
    setTimeout(() => {
      setVehiculoTestDrive(null);
      setSolicitudEnviada(false);
      setNombreSolicitante('');
      setTelefonoSolicitante('');
      setMensajeSolicitud('');
    }, 2000);
  };

  // Filtrado y orden
  const vehiculosFiltrados = vehiculos
    .filter((v) => {
      if (filtroCondicion !== 'TODOS' && v.condicion !== filtroCondicion) {
        return false;
      }
      if (busqueda.trim() !== '') {
        const query = busqueda.toLowerCase();
        const texto = `${v.marca} ${v.modelo} ${v.version} ${v.anio}`.toLowerCase();
        return texto.includes(query);
      }
      return true;
    })
    .sort((a, b) => {
      if (orden === 'PRECIO_ASC') return Number(a.precioVenta) - Number(b.precioVenta);
      if (orden === 'PRECIO_DESC') return Number(b.precioVenta) - Number(a.precioVenta);
      if (orden === 'ANIO_DESC') return b.anio - a.anio;
      return 0;
    });

  const unidades0km = vehiculos.filter((v) => v.condicion === 'CERO_KM').length;
  const unidadesUsados = vehiculos.filter((v) => v.condicion === 'USADO').length;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 font-sans flex flex-col">
      {/* Top Banner Informativo */}
      <div className="bg-[#18181b] text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-gray-200">Salón Oficial de Ventas & Stock en Vivo</span>
          <span className="text-gray-500 hidden sm:inline">|</span>
          <span className="text-gray-400 hidden sm:inline">Lunes a Sábados 9:00 a 19:30 hs</span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://wa.me/5491123456789"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium transition cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp Asesor: +54 9 11 2345-6789</span>
          </a>

          {usuarioLogueado ? (
            <button
              onClick={onVolverCRM}
              className="ml-2 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <span>Volver al CRM ({usuarioLogueado.nombreCompleto?.split(' ')[0]})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={onVolverLogin}
              className="ml-2 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-gray-300 hover:text-white text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <LogIn className="w-3 h-3" />
              <span>Acceso Personal</span>
            </button>
          )}
        </div>
      </div>

      {/* Header Principal */}
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-30 shadow-2xs backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#18181b] text-white flex items-center justify-center shadow-xs">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-gray-900 tracking-tight leading-tight">
                CONCESIONARIA OFICIAL
              </h1>
              <p className="text-[11px] text-gray-500 font-medium">
                Catálogo Digital de Salón · Unidades 0KM y Seleccionados
              </p>
            </div>
          </div>

          {/* Mini Resumen de Stock */}
          <div className="hidden md:flex items-center gap-4 text-xs">
            <div className="px-3 py-1.5 bg-gray-50 border border-gray-200/80 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-gray-500 font-medium">0 Kilómetros:</span>
              <span className="font-bold text-gray-900">{unidades0km} disponibles</span>
            </div>
            <div className="px-3 py-1.5 bg-gray-50 border border-gray-200/80 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-500 font-medium">Usados Certificados:</span>
              <span className="font-bold text-gray-900">{unidadesUsados} disponibles</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner Limpio */}
      <section className="bg-linear-to-b from-white to-gray-50 border-b border-gray-200/80 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Vehículos verificados con entrega inmediata y documentación al día</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Encontrá tu próximo vehículo
          </h2>

          <p className="text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Revisá nuestro catálogo con fotos reales, precios de lista actualizados, cotizador de créditos prendarios y solicitud de prueba de manejo online.
          </p>

          {/* Barra de Búsqueda y Filtros Rápidos */}
          <div className="pt-4 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por marca, modelo o versión (ej. Toyota, Taos, Ranger...)"
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Barra de Filtros y Orden */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200/80">
          {/* Tabs Condición */}
          <div className="flex items-center gap-2">
            {[
              { id: 'TODOS', label: 'Todos' },
              { id: 'CERO_KM', label: '0 Kilómetros' },
              { id: 'USADO', label: 'Usados Seleccionados' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFiltroCondicion(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  filtroCondicion === tab.id
                    ? 'bg-[#18181b] text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200/80 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Selector de Orden */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Ordenar por:
            </span>
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="bg-white border border-gray-200 text-xs font-semibold text-gray-800 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-900 cursor-pointer shadow-2xs"
            >
              <option value="PRECIO_ASC">Precio: Menor a Mayor</option>
              <option value="PRECIO_DESC">Precio: Mayor a Menor</option>
              <option value="ANIO_DESC">Año: Más recientes primero</option>
            </select>
          </div>
        </div>

        {/* Grid de Vehículos */}
        <div className="pt-6">
          {cargando ? (
            <div className="py-20 text-center text-gray-500 text-sm">
              Cargando catálogo en vivo...
            </div>
          ) : vehiculosFiltrados.length === 0 ? (
            <div className="bg-white border border-gray-200/80 rounded-3xl p-16 text-center shadow-xs space-y-3 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto text-gray-500">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">No encontramos vehículos con ese criterio</h3>
              <p className="text-xs text-gray-500">
                Probá cambiando la búsqueda o seleccionando otro filtro de condición.
              </p>
              <button
                onClick={() => {
                  setBusqueda('');
                  setFiltroCondicion('TODOS');
                }}
                className="mt-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition cursor-pointer"
              >
                Ver todos los vehículos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {vehiculosFiltrados.map((v) => (
                <div
                  key={v.id}
                  className="bg-white border border-gray-200/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl hover:border-gray-300 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Imagen Principal con Badge */}
                    <div className="relative aspect-16/10 bg-gray-100 overflow-hidden cursor-pointer" onClick={() => setVehiculoDetalle(v)}>
                      {v.imagenUrl ? (
                        <img
                          src={v.imagenUrl}
                          alt={`${v.marca} ${v.modelo}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                          <Car className="w-12 h-12 stroke-[1.5]" />
                          <span className="text-[10px] mt-1 font-medium">Foto oficial en salón</span>
                        </div>
                      )}

                      {/* Badge de Condición */}
                      <div className="absolute top-3 left-3">
                        <span
                          className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs border ${
                            v.condicion === 'CERO_KM'
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : 'bg-blue-600 text-white border-blue-500'
                          }`}
                        >
                          {v.condicion === 'CERO_KM' ? '0 KM · NUEVO' : `${Number(v.kilometraje).toLocaleString('es-AR')} KM`}
                        </span>
                      </div>

                      {/* Badge Entrega Inmediata */}
                      <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Entrega Inmediata</span>
                      </div>
                    </div>

                    {/* Información del Vehículo */}
                    <div className="p-5 space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="font-semibold uppercase tracking-wider text-[11px] text-gray-400">
                          {v.marca}
                        </span>
                        <span className="font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                          Año {v.anio}
                        </span>
                      </div>

                      <h3
                        onClick={() => setVehiculoDetalle(v)}
                        className="text-base font-extrabold text-gray-900 tracking-tight leading-snug group-hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        {v.marca} {v.modelo}
                      </h3>

                      <p className="text-xs text-gray-500 line-clamp-1">{v.version}</p>

                      <div className="pt-2 border-t border-gray-100">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                          Precio de Lista Contado
                        </span>
                        <span className="text-xl font-black text-gray-900 tracking-tight">
                          ${Number(v.precioVenta).toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botones de Acción para el Visitante */}
                  <div className="p-4 pt-0 space-y-2">
                    {/* Botón WhatsApp Principal */}
                    <button
                      onClick={() => handleConsultarWhatsApp(v)}
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Consultar por WhatsApp</span>
                    </button>

                    {/* Botones Secundarios: Simular y Test Drive */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setVehiculoSimular(v)}
                        className="py-2 px-2 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-700 rounded-xl text-[11px] font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Calcular cuotas estimadas"
                      >
                        <Calculator className="w-3.5 h-3.5 text-gray-500" />
                        <span>Simular Cuotas</span>
                      </button>

                      <button
                        onClick={() => setVehiculoTestDrive(v)}
                        className="py-2 px-2 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-700 rounded-xl text-[11px] font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Probar en calle"
                      >
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        <span>Test Drive</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Público */}
      <footer className="mt-auto border-t border-gray-200 bg-white py-12 px-4 sm:px-6 lg:px-8 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1">
            <p className="font-bold text-sm text-gray-900">Concesionaria Oficial · Auto CRM</p>
            <p className="text-gray-500">
              Venta de unidades 0km multimarca, usados seleccionados con peritaje mecánico y financiación bancaria prendaria.
            </p>
          </div>

          <div className="flex items-center gap-6 text-gray-600 font-medium">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span>Tel: (011) 4000-8800</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>Lun a Sáb 9:00 a 19:30</span>
            </span>
          </div>
        </div>
      </footer>

      {/* MODAL 1: Simular Financiación */}
      {vehiculoSimular && (
        <SimuladorFinancieroModal
          vehiculo={vehiculoSimular}
          onClose={() => setVehiculoSimular(null)}
        />
      )}

      {/* MODAL 2: Ficha Técnica Detallada */}
      {vehiculoDetalle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setVehiculoDetalle(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Foto grande en modal */}
            <div className="aspect-16/9 bg-gray-100 relative">
              {vehiculoDetalle.imagenUrl ? (
                <img
                  src={vehiculoDetalle.imagenUrl}
                  alt={vehiculoDetalle.modelo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                  <Car className="w-16 h-16" />
                </div>
              )}
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{vehiculoDetalle.marca}</span>
                  <h3 className="text-xl font-extrabold text-gray-900">{vehiculoDetalle.marca} {vehiculoDetalle.modelo}</h3>
                  <p className="text-xs text-gray-500">{vehiculoDetalle.version}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Precio de Contado</span>
                  <span className="text-2xl font-black text-gray-900">
                    ${Number(vehiculoDetalle.precioVenta).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Especificaciones */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-2xl text-xs border border-gray-100">
                <div>
                  <span className="text-gray-400 block text-[11px]">Año de Fabricación</span>
                  <strong className="text-gray-900 font-semibold">{vehiculoDetalle.anio}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Condición</span>
                  <strong className="text-gray-900 font-semibold">
                    {vehiculoDetalle.condicion === 'CERO_KM' ? '0 KM (Nuevo)' : 'Usado Seleccionado'}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Kilometraje</span>
                  <strong className="text-gray-900 font-semibold">
                    {vehiculoDetalle.condicion === 'CERO_KM' ? '0 KM' : `${Number(vehiculoDetalle.kilometraje).toLocaleString('es-AR')} KM`}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Garantía</span>
                  <strong className="text-emerald-700 font-semibold">Oficial de Agencia</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Documentación</span>
                  <strong className="text-emerald-700 font-semibold">Lista para transferir</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Toma de Usados</span>
                  <strong className="text-gray-900 font-semibold">Aceptamos Permuta</strong>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setVehiculoDetalle(null);
                    setVehiculoSimular(vehiculoDetalle);
                  }}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Simular Financiación</span>
                </button>

                <button
                  onClick={() => {
                    setVehiculoDetalle(null);
                    handleConsultarWhatsApp(vehiculoDetalle);
                  }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Consultar por WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Solicitar Test Drive */}
      {vehiculoTestDrive && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setVehiculoTestDrive(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 shadow-2xs">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Solicitar Prueba de Manejo</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Vehículo seleccionado: <strong>{vehiculoTestDrive.marca} {vehiculoTestDrive.modelo} {vehiculoTestDrive.version}</strong>
              </p>
            </div>

            {solicitudEnviada ? (
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p>¡Redirigiendo a WhatsApp para confirmar tu turno!</p>
              </div>
            ) : (
              <form onSubmit={handleEnviarSolicitudTestDrive} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tu Nombre y Apellido *</label>
                  <input
                    type="text"
                    required
                    value={nombreSolicitante}
                    onChange={(e) => setNombreSolicitante(e.target.value)}
                    placeholder="Juan Pérez"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Número de Teléfono / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={telefonoSolicitante}
                    onChange={(e) => setTelefonoSolicitante(e.target.value)}
                    placeholder="+54 9 11 1234-5678"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Días u horarios de tu preferencia</label>
                  <textarea
                    rows="2"
                    value={mensajeSolicitud}
                    onChange={(e) => setMensajeSolicitud(e.target.value)}
                    placeholder="Preferentemente días de semana por la tarde..."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setVehiculoTestDrive(null)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#18181b] hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Continuar por WhatsApp</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
