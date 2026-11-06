import React, { useState, useEffect, useMemo } from 'react';
import {
  Car,
  Search,
  MessageCircle,
  Calculator,
  Calendar,
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
  Scale,
  Check,
  AlertCircle,
  RefreshCw,
  LayoutGrid,
  ListFilter,
  ArrowLeftRight,
  Tag,
  Gauge,
  Send,
  User,
  BadgePercent,
  ArrowUpRight,
  BadgeCheck,
} from 'lucide-react';
import { SimuladorFinancieroModal } from '../components/SimuladorFinancieroModal';

const API_BASE = 'http://localhost:3000';

// Función para calcular cuota estimada mensual (Sistema Francés, 50% financiado a 48 meses al 54% TNA)
export const calcularCuotaEstimada = (precioVenta, porcentajeFinanciar = 0.5, meses = 48, tna = 54) => {
  const capital = Number(precioVenta) * porcentajeFinanciar;
  if (!capital || capital <= 0) return 0;
  const r = tna / 100 / 12;
  const cuota = (capital * (r * Math.pow(1 + r, meses))) / (Math.pow(1 + r, meses) - 1);
  return Math.round(cuota);
};

export const CatalogoPublicoView = ({ onVolverLogin, usuarioLogueado, onVolverCRM }) => {
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);

  // Filtros y estados de vista
  const [busqueda, setBusqueda] = useState('');
  const [filtroCondicion, setFiltroCondicion] = useState('TODOS');
  const [filtroMarca, setFiltroMarca] = useState('TODAS');
  const [rangoPrecio, setRangoPrecio] = useState('TODOS'); // 'TODOS', 'HASTA_25M', '25M_45M', 'MAS_45M'
  const [orden, setOrden] = useState('PRECIO_ASC');
  const [vistaModo, setVistaModo] = useState('GRID'); // 'GRID' | 'LIST'

  // Comparador de vehículos (hasta 3)
  const [vehiculosComparar, setVehiculosComparar] = useState([]);
  const [mostrarModalComparador, setMostrarModalComparador] = useState(false);

  // Modales
  const [vehiculoSimular, setVehiculoSimular] = useState(null);
  const [vehiculoDetalle, setVehiculoDetalle] = useState(null);
  const [vehiculoTestDrive, setVehiculoTestDrive] = useState(null);
  const [vehiculoPermuta, setVehiculoPermuta] = useState(null);
  const [vehiculoConsulta, setVehiculoConsulta] = useState(null);

  // Estados de formularios y envío CRM
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const [respuestaCRM, setRespuestaCRM] = useState(null); // { codigoReferencia, vehiculo, mensaje }

  // Form Test Drive
  const [testDriveForm, setTestDriveForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    dni: '',
    fechaPreferencia: '',
    mensaje: '',
  });

  // Form Permuta / Toma de Usado
  const [permutaForm, setPermutaForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    permutaMarca: '',
    permutaModelo: '',
    permutaAnio: 2018,
    permutaKilometraje: 80000,
    mensaje: '',
  });

  // Form Consulta Rápida
  const [consultaForm, setConsultaForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    mensaje: '',
  });

  const cargarCatalogo = async () => {
    try {
      setCargando(true);
      setErrorCarga(null);
      const res = await fetch(`${API_BASE}/vehiculos/publico`);
      if (res.ok) {
        const data = await res.json();
        setVehiculos(data);
      } else {
        throw new Error('No se pudo cargar el inventario de salón');
      }
    } catch (err) {
      console.error('Error al cargar catálogo público:', err);
      setErrorCarga('No se pudo conectar con el catálogo en vivo. Verificá que el servidor esté activo.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCatalogo();
  }, []);

  // Marcas únicas disponibles para chips de filtrado
  const marcasDisponibles = useMemo(() => {
    const set = new Set();
    vehiculos.forEach((v) => {
      if (v.marca) set.add(v.marca.toUpperCase());
    });
    return Array.from(set).sort();
  }, [vehiculos]);

  // Manejo del comparador (máximo 3 unidades)
  const toggleCompararVehiculo = (v) => {
    const existe = vehiculosComparar.some((item) => item.id === v.id);
    if (existe) {
      setVehiculosComparar((prev) => prev.filter((item) => item.id !== v.id));
    } else {
      if (vehiculosComparar.length >= 3) {
        alert('Podés comparar un máximo de 3 vehículos simultáneamente.');
        return;
      }
      setVehiculosComparar((prev) => [...prev, v]);
    }
  };

  const limpiarComparador = () => {
    setVehiculosComparar([]);
  };

  // Enviar solicitud comercial al CRM (POST /vehiculos/publico/solicitud)
  const registrarSolicitudEnCRM = async (payload) => {
    setEnviandoSolicitud(true);
    try {
      const res = await fetch(`${API_BASE}/vehiculos/publico/solicitud`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar la solicitud');
      }

      setRespuestaCRM(data);
      return data;
    } catch (err) {
      alert(`Error al registrar en el sistema: ${err.message}`);
      return null;
    } finally {
      setEnviandoSolicitud(false);
    }
  };

  // Enviar Test Drive
  const handleEnviarTestDrive = async (e) => {
    e.preventDefault();
    if (!vehiculoTestDrive) return;

    const payload = {
      tipo: 'TEST_DRIVE',
      vehiculoId: vehiculoTestDrive.id,
      nombre: testDriveForm.nombre,
      telefono: testDriveForm.telefono,
      email: testDriveForm.email || undefined,
      dni: testDriveForm.dni || undefined,
      fechaPreferencia: testDriveForm.fechaPreferencia || undefined,
      mensaje: testDriveForm.mensaje || undefined,
    };

    const res = await registrarSolicitudEnCRM(payload);
    if (res) {
      // Dejar mensaje de confirmación con código de referencia
    }
  };

  // Enviar Permuta
  const handleEnviarPermuta = async (e) => {
    e.preventDefault();
    if (!vehiculoPermuta) return;

    const payload = {
      tipo: 'PERMUTA',
      vehiculoId: vehiculoPermuta.id,
      nombre: permutaForm.nombre,
      telefono: permutaForm.telefono,
      email: permutaForm.email || undefined,
      permutaMarca: permutaForm.permutaMarca,
      permutaModelo: permutaForm.permutaModelo,
      permutaAnio: Number(permutaForm.permutaAnio),
      permutaKilometraje: Number(permutaForm.permutaKilometraje),
      mensaje: permutaForm.mensaje || undefined,
    };

    const res = await registrarSolicitudEnCRM(payload);
    if (res) {
      // Confirmación mostrada
    }
  };

  // Enviar Consulta Directa
  const handleEnviarConsulta = async (e) => {
    e.preventDefault();
    if (!vehiculoConsulta) return;

    const payload = {
      tipo: 'CONSULTA',
      vehiculoId: vehiculoConsulta.id,
      nombre: consultaForm.nombre,
      telefono: consultaForm.telefono,
      email: consultaForm.email || undefined,
      mensaje: consultaForm.mensaje || undefined,
    };

    const res = await registrarSolicitudEnCRM(payload);
    if (res) {
      // Confirmación
    }
  };

  // Abrir WhatsApp con código de solicitud
  const abrirWhatsAppConCodigo = (codigoReferencia, vehiculo, tipoSolicitud = 'Consulta') => {
    const texto = encodeURIComponent(
      `¡Hola! Generé la solicitud *#${codigoReferencia}* (${tipoSolicitud}) desde el Salón Virtual.\n` +
      `Vehículo: *${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.version || ''} (${vehiculo.anio})*.\n` +
      `Quisiera continuar con el asesoramiento y confirmar los detalles. ¡Muchas gracias!`
    );
    window.open(`https://wa.me/5491123456789?text=${texto}`, '_blank');
  };

  // Abrir WhatsApp directo tradicional
  const handleConsultarWhatsAppDirecto = (v) => {
    const cuota = calcularCuotaEstimada(v.precioVenta);
    const texto = encodeURIComponent(
      `¡Hola! Estoy viendo el catálogo oficial y me interesa el *${v.marca} ${v.modelo} ${v.version} (${v.anio})* publicado a $${Number(v.precioVenta).toLocaleString('es-AR')}.\n` +
      `Vi que la cuota estimada ronda los $${cuota.toLocaleString('es-AR')}/mes. ¿Me podrían brindar asesoramiento comercial y disponibilidad de entrega inmediata?`
    );
    window.open(`https://wa.me/5491123456789?text=${texto}`, '_blank');
  };

  // Filtros combinados
  const vehiculosFiltrados = useMemo(() => {
    return vehiculos
      .filter((v) => {
        // Condición
        if (filtroCondicion !== 'TODOS' && v.condicion !== filtroCondicion) {
          return false;
        }

        // Marca
        if (filtroMarca !== 'TODAS' && v.marca?.toUpperCase() !== filtroMarca) {
          return false;
        }

        // Rango de precio
        const precio = Number(v.precioVenta);
        if (rangoPrecio === 'HASTA_25M' && precio > 25000000) return false;
        if (rangoPrecio === '25M_45M' && (precio < 25000000 || precio > 45000000)) return false;
        if (rangoPrecio === 'MAS_45M' && precio <= 45000000) return false;

        // Búsqueda libre
        if (busqueda.trim() !== '') {
          const query = busqueda.toLowerCase();
          const texto = `${v.marca} ${v.modelo} ${v.version} ${v.anio} ${v.vin || ''}`.toLowerCase();
          return texto.includes(query);
        }

        return true;
      })
      .sort((a, b) => {
        if (orden === 'PRECIO_ASC') return Number(a.precioVenta) - Number(b.precioVenta);
        if (orden === 'PRECIO_DESC') return Number(b.precioVenta) - Number(a.precioVenta);
        if (orden === 'ANIO_DESC') return b.anio - a.anio;
        if (orden === 'KM_ASC') return Number(a.kilometraje) - Number(b.kilometraje);
        return 0;
      });
  }, [vehiculos, filtroCondicion, filtroMarca, rangoPrecio, busqueda, orden]);

  const unidades0km = vehiculos.filter((v) => v.condicion === 'CERO_KM').length;
  const unidadesUsados = vehiculos.filter((v) => v.condicion === 'USADO').length;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 font-sans flex flex-col selection:bg-gray-900 selection:text-white pb-28">
      {/* Header Principal con Identidad de Marca Premium */}
      <header className="bg-white/95 backdrop-blur-md border-b border-zinc-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shadow-sm ring-1 ring-zinc-800">
              <Car className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-zinc-900 tracking-tight leading-none uppercase">
                  Auto Concesionaria
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[10px] font-bold tracking-wider uppercase border border-zinc-200">
                  Showroom Oficial
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-normal mt-1">
                Catálogo Digital de Unidades 0KM y Seminuevos Certificados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* WhatsApp Directo */}
            <a
              href="https://wa.me/5491123456789"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-800 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Comercial</span>
            </a>

            {/* Botón comparador en el header si hay vehículos seleccionados */}
            {vehiculosComparar.length > 0 && (
              <button
                onClick={() => setMostrarModalComparador(true)}
                className="px-3.5 py-2 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer animate-in fade-in"
              >
                <Scale className="w-4 h-4 text-blue-400" />
                <span>Comparar ({vehiculosComparar.length}/3)</span>
              </button>
            )}

            {/* Resumen de Inventario en Header */}
            <div className="hidden lg:flex items-center gap-2 text-xs">
              <div className="px-3 py-1.5 bg-zinc-50 border border-zinc-200/80 rounded-xl flex items-center gap-2">
                <span className="text-zinc-500 font-medium">Stock:</span>
                <span className="font-extrabold text-zinc-900">{vehiculos.length} unidades</span>
                <span className="text-zinc-300 font-light">|</span>
                <span className="text-zinc-600 font-semibold">{unidades0km} nuevos</span>
                <span className="text-zinc-400">·</span>
                <span className="text-zinc-600 font-semibold">{unidadesUsados} seminuevos</span>
              </div>
            </div>

            {/* Acceso CRM o Login */}
            {usuarioLogueado ? (
              <button
                onClick={onVolverCRM}
                className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-zinc-800 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border border-zinc-200/80"
              >
                <span>Volver al CRM ({usuarioLogueado.nombreCompleto?.split(' ')[0]})</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
              </button>
            ) : (
              <button
                onClick={onVolverLogin}
                className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-zinc-700 hover:text-zinc-900 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border border-zinc-200/80"
              >
                <LogIn className="w-3.5 h-3.5 text-zinc-500" />
                <span>Acceso Personal</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 3. Hero Section Profesional y Editorial */}
      <section className="border-b border-zinc-200/80 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,1),_rgba(244,244,245,0.96)_45%,_rgba(232,232,231,0.9))] pt-10 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-5">
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-zinc-950 tracking-[-0.04em] leading-[1.02]">
            Encontrá tu próximo vehículo con respaldo oficial
          </h2>

          <p className="text-sm sm:text-base text-zinc-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Conocé nuestro catálogo exclusivo con precios actualizados, cálculo de cuotas en tiempo real, tasación online de tu usado y reserva inmediata de test drive.
          </p>

          <div className="pt-2 max-w-3xl mx-auto">
            <div className="relative">
              <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-4" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por marca, modelo, versión o palabra clave (ej. Taos, Hilux, Ranger, Corolla...)"
                className="w-full pl-12 pr-12 py-3.5 bg-white/90 border border-zinc-300 rounded-2xl text-sm text-zinc-900 placeholder:text-zinc-400 shadow-[0_12px_30px_rgba(28,25,23,0.04)] focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-4 top-3.5 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto text-left">
            <div className="p-3 bg-white border border-zinc-200/80 rounded-2xl shadow-[0_10px_25px_rgba(24,24,27,0.03)] flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-zinc-900">Peritaje Integral</p>
                <p className="text-[11px] text-zinc-500">Documentación al día y revisión de 150 puntos.</p>
              </div>
            </div>

            <div className="p-3 bg-white border border-zinc-200/80 rounded-2xl shadow-[0_10px_25px_rgba(24,24,27,0.03)] flex items-start gap-2.5">
              <Calculator className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-zinc-900">Financiación Flexible</p>
                <p className="text-[11px] text-zinc-500">Créditos prendarios en cuotas fijas o UVA.</p>
              </div>
            </div>

            <div className="p-3 bg-white border border-zinc-200/80 rounded-2xl shadow-[0_10px_25px_rgba(24,24,27,0.03)] flex items-start gap-2.5">
              <ArrowLeftRight className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-zinc-900">Tomamos tu Usado</p>
                <p className="text-[11px] text-zinc-500">Tasación transparente como parte de pago.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Panel de Filtros Facetados Avanzados */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 w-full">
        <div className="space-y-4 pb-6 border-b border-gray-200/80">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Tabs de Condición */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
              {[
                { id: 'TODOS', label: 'Todos los Vehículos' },
                { id: 'CERO_KM', label: '0KM Nuevos' },
                { id: 'USADO', label: 'Seminuevos Certificados' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFiltroCondicion(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    filtroCondicion === tab.id
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'bg-white text-zinc-700 hover:text-zinc-900 border border-zinc-200/80 hover:bg-zinc-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Controles de vista y orden */}
            <div className="flex items-center gap-3 self-end lg:self-auto">
              {/* Selector de Rango de Precio */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 font-medium hidden sm:inline">Precio:</span>
                <select
                  value={rangoPrecio}
                  onChange={(e) => setRangoPrecio(e.target.value)}
                  className="bg-white border border-gray-200 text-xs font-semibold text-gray-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-900 cursor-pointer shadow-2xs"
                >
                  <option value="TODOS">Cualquier Precio</option>
                  <option value="HASTA_25M">Hasta $25.000.000</option>
                  <option value="25M_45M">$25.000.000 a $45.000.000</option>
                  <option value="MAS_45M">Más de $45.000.000</option>
                </select>
              </div>

              {/* Selector de Orden */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 font-medium hidden sm:inline">Orden:</span>
                <select
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                  className="bg-white border border-gray-200 text-xs font-semibold text-gray-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-900 cursor-pointer shadow-2xs"
                >
                  <option value="PRECIO_ASC">Precio: Menor a Mayor</option>
                  <option value="PRECIO_DESC">Precio: Mayor a Menor</option>
                  <option value="ANIO_DESC">Año: Más recientes</option>
                  <option value="KM_ASC">Kilometraje: Menor a Mayor</option>
                </select>
              </div>

              {/* Botón Grid vs List */}
              <div className="bg-white border border-gray-200/80 rounded-xl p-0.5 flex items-center shadow-2xs">
                <button
                  onClick={() => setVistaModo('GRID')}
                  title="Vista en Cuadrícula"
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    vistaModo === 'GRID' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setVistaModo('LIST')}
                  title="Vista en Lista Detallada"
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    vistaModo === 'LIST' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <ListFilter className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Chips de Marcas */}
          {marcasDisponibles.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 scrollbar-none">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">
                Marca:
              </span>
              <button
                onClick={() => setFiltroMarca('TODAS')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                  filtroMarca === 'TODAS'
                    ? 'bg-gray-800 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Todas ({vehiculos.length})
              </button>
              {marcasDisponibles.map((marca) => {
                const totalMarca = vehiculos.filter((v) => v.marca?.toUpperCase() === marca).length;
                return (
                  <button
                    key={marca}
                    onClick={() => setFiltroMarca(marca)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                      filtroMarca === marca
                        ? 'bg-gray-900 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {marca} ({totalMarca})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumen de Resultados */}
        <div className="pt-4 flex items-center justify-between text-xs text-gray-500">
          <span>
            Mostrando <strong>{vehiculosFiltrados.length}</strong> de <strong>{vehiculos.length}</strong> vehículos
            disponibles para entrega
          </span>

          {(busqueda || filtroCondicion !== 'TODOS' || filtroMarca !== 'TODAS' || rangoPrecio !== 'TODOS') && (
            <button
              onClick={() => {
                setBusqueda('');
                setFiltroCondicion('TODOS');
                setFiltroMarca('TODAS');
                setRangoPrecio('TODOS');
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Restablecer todos los filtros</span>
            </button>
          )}
        </div>

        {/* Renderizado de Vehículos (Cargando / Vacío / Grid / List) */}
        <div className="pt-6">
          {cargando ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-500 text-sm font-medium">Sincronizando inventario con el CRM...</p>
            </div>
          ) : errorCarga ? (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center max-w-lg mx-auto space-y-3">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
              <h3 className="text-base font-bold text-red-900">Error al consultar el catálogo</h3>
              <p className="text-xs text-red-700">{errorCarga}</p>
              <button
                onClick={cargarCatalogo}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Reintentar carga
              </button>
            </div>
          ) : vehiculosFiltrados.length === 0 ? (
            <div className="bg-white border border-gray-200/80 rounded-3xl p-16 text-center shadow-xs space-y-3 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto text-gray-500">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">No encontramos vehículos con los filtros aplicados</h3>
              <p className="text-xs text-gray-500">
                Probá modificando el término de búsqueda, seleccionando otra marca o ampliando el rango de precios.
              </p>
              <button
                onClick={() => {
                  setBusqueda('');
                  setFiltroCondicion('TODOS');
                  setFiltroMarca('TODAS');
                  setRangoPrecio('TODOS');
                }}
                className="mt-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition cursor-pointer"
              >
                Ver todos los vehículos
              </button>
            </div>
          ) : vistaModo === 'GRID' ? (
            /* VISTA EN CUADRÍCULA (GRID) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {vehiculosFiltrados.map((v) => {
                const cuotaEstimada = calcularCuotaEstimada(v.precioVenta);
                const estaEnComparador = vehiculosComparar.some((item) => item.id === v.id);

                return (
                  <div
                    key={v.id}
                    className="bg-white border border-gray-200/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl hover:border-gray-300 transition-all duration-300 flex flex-col justify-between group relative"
                  >
                    <div>
                      {/* Imagen con Badges y Check Comparador */}
                      <div
                        className="relative aspect-16/10 bg-gray-100 overflow-hidden cursor-pointer"
                        onClick={() => setVehiculoDetalle(v)}
                      >
                        {v.imagenUrl ? (
                          <img
                            src={v.imagenUrl}
                            alt={`${v.marca} ${v.modelo}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                            <Car className="w-12 h-12 stroke-[1.5]" />
                            <span className="text-[10px] mt-1 font-medium">Foto oficial en salón</span>
                          </div>
                        )}

                        {/* Badge Condición */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                          <span
                            className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xs border ${
                              v.condicion === 'CERO_KM'
                                ? 'bg-emerald-600 text-white border-emerald-500'
                                : 'bg-blue-600 text-white border-blue-500'
                            }`}
                          >
                            {v.condicion === 'CERO_KM'
                              ? '0 KM · NUEVO'
                              : `${Number(v.kilometraje).toLocaleString('es-AR')} KM`}
                          </span>
                        </div>

                        {/* Botón flotante para Agregar al Comparador */}
                        <div className="absolute top-3 right-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCompararVehiculo(v);
                            }}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1 shadow-md cursor-pointer ${
                              estaEnComparador
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-white/90 backdrop-blur-md text-gray-700 hover:bg-white hover:text-gray-900'
                            }`}
                            title={estaEnComparador ? 'Quitar del comparador' : 'Agregar para comparar especificaciones'}
                          >
                            <Scale className="w-3.5 h-3.5" />
                            <span>{estaEnComparador ? 'Comparando' : '+ Comparar'}</span>
                          </button>
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
                          <span className="font-extrabold uppercase tracking-wider text-[11px] text-gray-400">
                            {v.marca}
                          </span>
                          <span className="font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md font-bold text-[10px]">
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

                        {/* Precio de Lista */}
                        <div className="pt-2 border-t border-gray-100 flex items-baseline justify-between">
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                              Precio Contado
                            </span>
                            <span className="text-xl font-black text-gray-900 tracking-tight">
                              ${Number(v.precioVenta).toLocaleString('es-AR')}
                            </span>
                          </div>
                        </div>

                        {/* Pill de Cuota Estimada Mensual */}
                        <div
                          onClick={() => setVehiculoSimular(v)}
                          className="mt-2 p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70 rounded-xl flex items-center justify-between transition cursor-pointer group/cuota"
                          title="Hacé click para abrir el Simulador Financiero oficial"
                        >
                          <div className="flex items-center gap-1.5 text-emerald-900">
                            <BadgePercent className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-[11px] font-bold">Cuota estimada desde:</span>
                          </div>
                          <span className="text-xs font-black text-emerald-700 group-hover/cuota:underline">
                            ${cuotaEstimada.toLocaleString('es-AR')} / mes
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones para el Visitante */}
                    <div className="p-4 pt-0 space-y-2">
                      {/* Botón WhatsApp */}
                      <button
                        onClick={() => handleConsultarWhatsAppDirecto(v)}
                        className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Consultar por WhatsApp</span>
                      </button>

                      {/* Botones Secundarios: Test Drive, Permuta, Simular */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => setVehiculoTestDrive(v)}
                          className="py-2 px-1 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-700 rounded-xl text-[11px] font-semibold transition flex flex-col items-center justify-center gap-1 cursor-pointer"
                          title="Agendar prueba de manejo vinculada al CRM"
                        >
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-[10px]">Test Drive</span>
                        </button>

                        <button
                          onClick={() => setVehiculoPermuta(v)}
                          className="py-2 px-1 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-700 rounded-xl text-[11px] font-semibold transition flex flex-col items-center justify-center gap-1 cursor-pointer"
                          title="Entregá tu auto usado como parte de pago"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5 text-purple-600" />
                          <span className="text-[10px]">Permuta</span>
                        </button>

                        <button
                          onClick={() => setVehiculoSimular(v)}
                          className="py-2 px-1 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-700 rounded-xl text-[11px] font-semibold transition flex flex-col items-center justify-center gap-1 cursor-pointer"
                          title="Simulador de crédito prendario bancario"
                        >
                          <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[10px]">Simulador</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* VISTA EN LISTA (LIST) */
            <div className="bg-white border border-gray-200/80 rounded-3xl divide-y divide-gray-100 overflow-hidden shadow-xs">
              {vehiculosFiltrados.map((v) => {
                const cuotaEstimada = calcularCuotaEstimada(v.precioVenta);
                const estaEnComparador = vehiculosComparar.some((item) => item.id === v.id);

                return (
                  <div
                    key={v.id}
                    className="p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-gray-50/80 transition"
                  >
                    {/* Imagen y Datos Principales */}
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div
                        className="w-28 h-20 rounded-2xl bg-gray-100 overflow-hidden shrink-0 relative cursor-pointer"
                        onClick={() => setVehiculoDetalle(v)}
                      >
                        {v.imagenUrl ? (
                          <img
                            src={v.imagenUrl}
                            alt={v.modelo}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Car className="w-6 h-6" />
                          </div>
                        )}
                        <span
                          className={`absolute top-1 left-1 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase text-white ${
                            v.condicion === 'CERO_KM' ? 'bg-emerald-600' : 'bg-blue-600'
                          }`}
                        >
                          {v.condicion === 'CERO_KM' ? '0KM' : 'Usado'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">{v.marca}</span>
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                            Año {v.anio}
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium">
                            {v.condicion === 'CERO_KM'
                              ? 'Nuevo a estrenar'
                              : `${Number(v.kilometraje).toLocaleString('es-AR')} km`}
                          </span>
                        </div>
                        <h4
                          onClick={() => setVehiculoDetalle(v)}
                          className="text-base font-extrabold text-gray-900 hover:text-blue-600 cursor-pointer"
                        >
                          {v.marca} {v.modelo}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-1">{v.version}</p>
                      </div>
                    </div>

                    {/* Precios y Financiación */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 pt-2 md:pt-0 border-gray-100">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">Precio Contado</span>
                        <span className="text-lg font-black text-gray-900">
                          ${Number(v.precioVenta).toLocaleString('es-AR')}
                        </span>
                      </div>
                      <button
                        onClick={() => setVehiculoSimular(v)}
                        className="text-[11px] text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-lg mt-1 cursor-pointer transition"
                      >
                        Cuota desde ${cuotaEstimada.toLocaleString('es-AR')}/mes
                      </button>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      <button
                        onClick={() => toggleCompararVehiculo(v)}
                        className={`p-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          estaEnComparador
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                        title={estaEnComparador ? 'Quitar de la comparativa' : 'Agregar al comparador'}
                      >
                        <Scale className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setVehiculoTestDrive(v)}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        Test Drive
                      </button>

                      <button
                        onClick={() => handleConsultarWhatsAppDirecto(v)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Consultar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* DOCK / BANDEJA FLOTANTE INFERIOR DE COMPARACIÓN */}
      {vehiculosComparar.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-3xl bg-[#18181b] text-white rounded-3xl p-3 px-5 shadow-2xl border border-gray-700 flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3 overflow-hidden">
              {vehiculosComparar.map((item) => (
                <div
                  key={item.id}
                  className="w-10 h-10 rounded-xl border-2 border-gray-900 bg-gray-800 overflow-hidden shrink-0 relative group"
                >
                  <img
                    src={
                      item.imagenUrl ||
                      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=300&q=80'
                    }
                    alt={item.modelo}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => toggleCompararVehiculo(item)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition"
                    title="Eliminar de la comparación"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-extrabold text-white">
                {vehiculosComparar.length} {vehiculosComparar.length === 1 ? 'vehículo listo' : 'vehículos listos'} para
                comparar
              </p>
              <p className="text-[10px] text-gray-400">Podés sumar hasta 3 unidades lado a lado</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={limpiarComparador}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition cursor-pointer"
            >
              Vaciar
            </button>

            <button
              onClick={() => setMostrarModalComparador(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              <span>Ver Tabla Comparativa</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer Profesional */}
      <footer className="mt-auto border-t border-zinc-200 bg-white py-12 px-4 sm:px-6 lg:px-8 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1">
            <p className="font-extrabold text-sm text-zinc-900">Concesionaria Oficial · Red Comercial Automotriz</p>
            <p className="text-zinc-500 max-w-md">
              Venta de unidades 0KM y seminuevos certificados con peritaje mecánico oficial, garantía escrita y financiación prendaria bancaria.
            </p>
          </div>

          <div className="flex items-center gap-6 text-zinc-600 font-medium">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-zinc-400" />
              <span>Línea Directa: (011) 4000-8800</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Lunes a Sábados 9:00 a 19:30</span>
            </span>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL 1: COMPARADOR DE VEHÍCULOS LADO A LADO                              */}
      {/* ========================================================================= */}
      {mostrarModalComparador && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto border border-gray-200 relative flex flex-col max-h-[92vh]">
            {/* Header del Modal */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Comparativa Técnica y Financiera</h3>
                  <p className="text-xs text-gray-500">
                    Analizá precios, cuotas estimadas y especificaciones frente a frente
                  </p>
                </div>
              </div>

              <button
                onClick={() => setMostrarModalComparador(false)}
                className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido Tabla Comparativa */}
            <div className="overflow-x-auto p-6">
              {vehiculosComparar.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No seleccionaste ningún vehículo para comparar.</p>
                </div>
              ) : (
                <div className="min-w-[650px]">
                  {/* Fila de Tarjetas Superiores */}
                  <div className="grid grid-cols-4 gap-4 pb-6 border-b border-gray-200">
                    <div className="flex flex-col justify-end text-xs font-bold text-gray-400 uppercase tracking-wider pb-2">
                      Vehículo / Versión
                    </div>

                    {vehiculosComparar.map((v) => (
                      <div key={v.id} className="space-y-3 bg-gray-50 p-4 rounded-2xl relative border border-gray-100">
                        <button
                          onClick={() => toggleCompararVehiculo(v)}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white text-gray-400 hover:text-red-600 shadow-xs flex items-center justify-center transition cursor-pointer"
                          title="Quitar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        <div className="aspect-16/10 rounded-xl overflow-hidden bg-gray-200">
                          <img
                            src={
                              v.imagenUrl ||
                              'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=600&q=80'
                            }
                            alt={v.modelo}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-blue-600 uppercase block">{v.marca}</span>
                          <h4 className="text-sm font-extrabold text-gray-900 leading-tight">
                            {v.marca} {v.modelo}
                          </h4>
                          <p className="text-[11px] text-gray-500 line-clamp-1">{v.version}</p>
                        </div>
                      </div>
                    ))}

                    {/* Espacios vacíos si son menos de 3 */}
                    {Array.from({ length: 3 - vehiculosComparar.length }).map((_, i) => (
                      <div
                        key={i}
                        className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-6 text-gray-400 text-center"
                      >
                        <Car className="w-8 h-8 opacity-40 mb-2" />
                        <span className="text-xs font-medium">Podés agregar otro auto del catálogo</span>
                      </div>
                    ))}
                  </div>

                  {/* Fila: Precio Contado */}
                  <div className="grid grid-cols-4 gap-4 py-4 border-b border-gray-100 items-center">
                    <div className="text-xs font-bold text-gray-500">Precio de Contado</div>
                    {vehiculosComparar.map((v) => (
                      <div key={v.id} className="text-sm font-black text-gray-900">
                        ${Number(v.precioVenta).toLocaleString('es-AR')}
                      </div>
                    ))}
                  </div>

                  {/* Fila: Cuota Mensual Estimada */}
                  <div className="grid grid-cols-4 gap-4 py-4 border-b border-gray-100 items-center bg-emerald-50/50 -mx-2 px-2 rounded-xl">
                    <div className="text-xs font-bold text-emerald-900">Cuota Estimada (48m)</div>
                    {vehiculosComparar.map((v) => (
                      <div key={v.id} className="text-sm font-black text-emerald-700">
                        ${calcularCuotaEstimada(v.precioVenta).toLocaleString('es-AR')} / mes
                      </div>
                    ))}
                  </div>

                  {/* Fila: Condición */}
                  <div className="grid grid-cols-4 gap-4 py-4 border-b border-gray-100 items-center">
                    <div className="text-xs font-bold text-gray-500">Condición</div>
                    {vehiculosComparar.map((v) => (
                      <div key={v.id}>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            v.condicion === 'CERO_KM'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {v.condicion === 'CERO_KM' ? '0 KM · Nuevo' : 'Usado Seleccionado'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Fila: Año de Fabricación */}
                  <div className="grid grid-cols-4 gap-4 py-4 border-b border-gray-100 items-center">
                    <div className="text-xs font-bold text-gray-500">Año de Fabricación</div>
                    {vehiculosComparar.map((v) => (
                      <div key={v.id} className="text-xs font-semibold text-gray-800">
                        {v.anio}
                      </div>
                    ))}
                  </div>

                  {/* Fila: Kilometraje */}
                  <div className="grid grid-cols-4 gap-4 py-4 border-b border-gray-100 items-center">
                    <div className="text-xs font-bold text-gray-500">Kilometraje Real</div>
                    {vehiculosComparar.map((v) => (
                      <div key={v.id} className="text-xs font-semibold text-gray-800">
                        {v.condicion === 'CERO_KM' ? '0 KM' : `${Number(v.kilometraje).toLocaleString('es-AR')} km`}
                      </div>
                    ))}
                  </div>

                  {/* Fila: Botones de Acción Directa */}
                  <div className="grid grid-cols-4 gap-4 pt-6 items-center">
                    <div className="text-xs font-bold text-gray-400">Acciones Disponibles</div>
                    {vehiculosComparar.map((v) => (
                      <div key={v.id} className="space-y-2">
                        <button
                          onClick={() => {
                            setMostrarModalComparador(false);
                            setVehiculoSimular(v);
                          }}
                          className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Simular Cuotas</span>
                        </button>

                        <button
                          onClick={() => {
                            setMostrarModalComparador(false);
                            handleConsultarWhatsAppDirecto(v);
                          }}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SIMULADOR FINANCIERO OFICIAL (Prendario Fijo / UVA / Plan)      */}
      {/* ========================================================================= */}
      {vehiculoSimular && (
        <SimuladorFinancieroModal
          vehiculo={vehiculoSimular}
          onClose={() => setVehiculoSimular(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: FICHA TÉCNICA Y DETALLES DEL VEHÍCULO                           */}
      {/* ========================================================================= */}
      {vehiculoDetalle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setVehiculoDetalle(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition cursor-pointer"
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
                  <Car className="w-16 h-16 stroke-[1.5]" />
                </div>
              )}
              <span
                className={`absolute bottom-3 left-3 text-xs font-extrabold px-3 py-1 rounded-full uppercase text-white shadow-xs ${
                  vehiculoDetalle.condicion === 'CERO_KM' ? 'bg-emerald-600' : 'bg-blue-600'
                }`}
              >
                {vehiculoDetalle.condicion === 'CERO_KM' ? '0 KM · Sin Rodar' : 'Usado Certificado'}
              </span>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {vehiculoDetalle.marca}
                  </span>
                  <h3 className="text-xl font-extrabold text-gray-900">
                    {vehiculoDetalle.marca} {vehiculoDetalle.modelo}
                  </h3>
                  <p className="text-xs text-gray-500">{vehiculoDetalle.version}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                    Precio Contado
                  </span>
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
                  <span className="text-gray-400 block text-[11px]">Kilometraje</span>
                  <strong className="text-gray-900 font-semibold">
                    {vehiculoDetalle.condicion === 'CERO_KM'
                      ? '0 KM'
                      : `${Number(vehiculoDetalle.kilometraje).toLocaleString('es-AR')} KM`}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Garantía Mecánica</span>
                  <strong className="text-emerald-700 font-semibold">Oficial de Agencia</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Documentación</span>
                  <strong className="text-emerald-700 font-semibold">Lista para Transferir</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Toma de Usados</span>
                  <strong className="text-gray-900 font-semibold">Aceptamos Permuta</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Cuota Estimada</span>
                  <strong className="text-emerald-700 font-bold">
                    ${calcularCuotaEstimada(vehiculoDetalle.precioVenta).toLocaleString('es-AR')} / mes
                  </strong>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-2">
                <button
                  onClick={() => {
                    setVehiculoDetalle(null);
                    setVehiculoSimular(vehiculoDetalle);
                  }}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <span>Simular Financiación</span>
                </button>

                <button
                  onClick={() => {
                    setVehiculoDetalle(null);
                    setVehiculoTestDrive(vehiculoDetalle);
                  }}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Solicitar Test Drive</span>
                </button>

                <button
                  onClick={() => {
                    setVehiculoDetalle(null);
                    handleConsultarWhatsAppDirecto(vehiculoDetalle);
                  }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Consultar WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: SOLICITAR TEST DRIVE (CONEXIÓN AUTOMÁTICA AL CRM)                */}
      {/* ========================================================================= */}
      {vehiculoTestDrive && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => {
                setVehiculoTestDrive(null);
                setRespuestaCRM(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 shadow-2xs">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Solicitar Prueba de Manejo (Test Drive)</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Vehículo seleccionado:{' '}
                <strong>
                  {vehiculoTestDrive.marca} {vehiculoTestDrive.modelo} {vehiculoTestDrive.version}
                </strong>
              </p>
            </div>

            {respuestaCRM ? (
              <div className="p-5 rounded-2xl bg-emerald-50 text-emerald-900 text-xs space-y-3 text-center border border-emerald-200">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-emerald-950">¡Solicitud Registrada en el CRM!</h4>
                  <p className="text-xs text-emerald-800 mt-1 font-medium">
                    Código de Referencia:{' '}
                    <span className="font-mono font-black text-sm bg-white px-2 py-0.5 rounded-md border border-emerald-300">
                      {respuestaCRM.codigoReferencia}
                    </span>
                  </p>
                  <p className="text-[11px] text-gray-600 mt-2">
                    Un asesor comercial ha recibido tus datos y agendó la prueba de manejo en el sistema.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() =>
                      abrirWhatsAppConCodigo(
                        respuestaCRM.codigoReferencia,
                        respuestaCRM.vehiculo,
                        'Turno de Test Drive'
                      )
                    }
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Confirmar Turno en WhatsApp</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEnviarTestDrive} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre y Apellido *</label>
                  <input
                    type="text"
                    required
                    value={testDriveForm.nombre}
                    onChange={(e) => setTestDriveForm({ ...testDriveForm, nombre: e.target.value })}
                    placeholder="Ej. Juan Pérez"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp / Teléfono *</label>
                    <input
                      type="tel"
                      required
                      value={testDriveForm.telefono}
                      onChange={(e) => setTestDriveForm({ ...testDriveForm, telefono: e.target.value })}
                      placeholder="+54 9 11 1234-5678"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">DNI (Para el seguro)</label>
                    <input
                      type="text"
                      value={testDriveForm.dni}
                      onChange={(e) => setTestDriveForm({ ...testDriveForm, dni: e.target.value })}
                      placeholder="Ej. 38123456"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email (Opcional)</label>
                  <input
                    type="email"
                    value={testDriveForm.email}
                    onChange={(e) => setTestDriveForm({ ...testDriveForm, email: e.target.value })}
                    placeholder="juan@ejemplo.com"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Día y horario de preferencia</label>
                  <input
                    type="text"
                    value={testDriveForm.fechaPreferencia}
                    onChange={(e) => setTestDriveForm({ ...testDriveForm, fechaPreferencia: e.target.value })}
                    placeholder="Ej. Este sábado por la mañana o viernes a las 16hs"
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
                    disabled={enviandoSolicitud}
                    className="px-4 py-2 bg-[#18181b] hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {enviandoSolicitud ? (
                      <span>Registrando...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Agendar en el CRM</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: COTIZADOR DE PERMUTA / TOMA DE USADO (CONEXIÓN AL CRM)           */}
      {/* ========================================================================= */}
      {vehiculoPermuta && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => {
                setVehiculoPermuta(null);
                setRespuestaCRM(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3 shadow-2xs">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Entregá tu Auto en Parte de Pago</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Vehículo a comprar:{' '}
                <strong>
                  {vehiculoPermuta.marca} {vehiculoPermuta.modelo} (${Number(vehiculoPermuta.precioVenta).toLocaleString('es-AR')})
                </strong>
              </p>
            </div>

            {respuestaCRM ? (
              <div className="p-5 rounded-2xl bg-purple-50 text-purple-900 text-xs space-y-3 text-center border border-purple-200">
                <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-purple-950">¡Propuesta de Tasación Recibida!</h4>
                  <p className="text-xs text-purple-800 mt-1 font-medium">
                    Código de Referencia:{' '}
                    <span className="font-mono font-black text-sm bg-white px-2 py-0.5 rounded-md border border-purple-300">
                      {respuestaCRM.codigoReferencia}
                    </span>
                  </p>
                  <p className="text-[11px] text-gray-600 mt-2">
                    El perito tasador oficial analizará tu vehículo para enviarte una cotización formal.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() =>
                      abrirWhatsAppConCodigo(
                        respuestaCRM.codigoReferencia,
                        respuestaCRM.vehiculo,
                        'Tasación de Permuta'
                      )
                    }
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Continuar Cotización en WhatsApp</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEnviarPermuta} className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                  <span className="text-[11px] font-extrabold text-gray-500 uppercase block">
                    Datos de tu Auto Usado Actual
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Marca *</label>
                      <input
                        type="text"
                        required
                        value={permutaForm.permutaMarca}
                        onChange={(e) => setPermutaForm({ ...permutaForm, permutaMarca: e.target.value })}
                        placeholder="Ej. Chevrolet"
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Modelo *</label>
                      <input
                        type="text"
                        required
                        value={permutaForm.permutaModelo}
                        onChange={(e) => setPermutaForm({ ...permutaForm, permutaModelo: e.target.value })}
                        placeholder="Ej. Cruze LTZ"
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Año *</label>
                      <input
                        type="number"
                        min="2000"
                        max="2026"
                        required
                        value={permutaForm.permutaAnio}
                        onChange={(e) => setPermutaForm({ ...permutaForm, permutaAnio: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Kilometraje aprox. *</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={permutaForm.permutaKilometraje}
                        onChange={(e) => setPermutaForm({ ...permutaForm, permutaKilometraje: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-0.5">Tu Nombre y Apellido *</label>
                    <input
                      type="text"
                      required
                      value={permutaForm.nombre}
                      onChange={(e) => setPermutaForm({ ...permutaForm, nombre: e.target.value })}
                      placeholder="Ej. Laura Fernández"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-0.5">WhatsApp / Celular *</label>
                    <input
                      type="tel"
                      required
                      value={permutaForm.telefono}
                      onChange={(e) => setPermutaForm({ ...permutaForm, telefono: e.target.value })}
                      placeholder="+54 9 11 9876-5432"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setVehiculoPermuta(null)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={enviandoSolicitud}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {enviandoSolicitud ? (
                      <span>Cotizando...</span>
                    ) : (
                      <>
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        <span>Solicitar Tasación Online</span>
                      </>
                    )}
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
