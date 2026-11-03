import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import {
  Car,
  Plus,
  Search,
  Tag,
  CheckCircle2,
  AlertCircle,
  XCircle,
  X,
  Download,
  Calculator,
  Eye,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { exportToCSV } from '../utils/exportCsv';
import { SimuladorFinancieroModal } from '../components/SimuladorFinancieroModal';

const FOTOS_PRESET = [
  { nombre: 'SUV', url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80' },
  { nombre: 'Pick-up', url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80' },
  { nombre: 'Sedán', url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80' },
  { nombre: 'Hatchback', url: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80' },
  { nombre: 'Coupé', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80' },
];

export const VehiculosView = ({ onVerModoPublico }) => {
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroCondicion, setFiltroCondicion] = useState('TODOS');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [vehiculoSimular, setVehiculoSimular] = useState(null);

  // Form nuevo vehiculo
  const [vin, setVin] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [version, setVersion] = useState('');
  const [anio, setAnio] = useState(2024);
  const [condicion, setCondicion] = useState('CERO_KM');
  const [kilometraje, setKilometraje] = useState(0);
  const [precioVenta, setPrecioVenta] = useState('');
  const [costoCompra, setCostoCompra] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargarVehiculos = async () => {
    try {
      setCargando(true);
      const data = await apiFetch('/vehiculos');
      setVehiculos(data);
    } catch (err) {
      console.error('Error cargando vehiculos:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarVehiculos();
  }, []);

  const handleCrearVehiculo = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await apiFetch('/vehiculos', {
        method: 'POST',
        body: JSON.stringify({
          vin,
          marca,
          modelo,
          version,
          anio: Number(anio),
          condicion,
          kilometraje: Number(kilometraje),
          precioVenta: Number(precioVenta),
          costoCompra: costoCompra ? Number(costoCompra) : undefined,
          imagenUrl: imagenUrl.trim() || undefined,
          estado: 'DISPONIBLE',
        }),
      });

      setModalAbierto(false);
      setVin('');
      setMarca('');
      setModelo('');
      setVersion('');
      setPrecioVenta('');
      setCostoCompra('');
      setImagenUrl('');
      cargarVehiculos();
    } catch (err) {
      alert(err.message || 'Error al dar de alta el vehículo');
    } finally {
      setGuardando(false);
    }
  };

  const vehiculosFiltrados = vehiculos.filter((v) => {
    if (filtroCondicion === 'TODOS') return true;
    return v.condicion === filtroCondicion;
  });

  const handleExportarCSV = () => {
    const data = vehiculosFiltrados.map((v) => ({
      ID: v.id,
      VIN_Chasis: v.vin,
      Marca: v.marca,
      Modelo: v.modelo,
      Version: v.version || '',
      Año: v.anio,
      Condicion: v.condicion === 'CERO_KM' ? '0 KM' : 'Usado',
      Kilometraje: v.kilometraje,
      Precio_Venta: v.precioVenta,
      Costo_Compra: v.costoCompra || 0,
      Estado: v.estado,
    }));
    exportToCSV('inventario_vehiculos', data);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Catálogo e Inventario de Stock</h2>
          <p className="text-xs text-gray-500 mt-0.5">Control de unidades 0km y usados disponibles en salón y depósito con soporte fotográfico.</p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {onVerModoPublico && (
            <button
              onClick={onVerModoPublico}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-2xs"
              title="Abrir la pantalla pública del catálogo para clientes o modo totem"
            >
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Ver Salón Público (Visitantes)</span>
            </button>
          )}

          <button
            onClick={handleExportarCSV}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-2xs"
            title="Descargar planilla CSV para Excel"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => setModalAbierto(true)}
            className="px-4 py-2 bg-[#18181b] hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ingresar Vehículo</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        {['TODOS', 'CERO_KM', 'USADO'].map((f) => (
          <button
            key={f}
            onClick={() => setFiltroCondicion(f)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filtroCondicion === f
                ? 'bg-[#18181b] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {f === 'TODOS' ? 'Todos los Vehículos' : f === 'CERO_KM' ? '0 Kilómetros' : 'Usados Seleccionados'}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cargando ? (
          <p className="text-xs text-gray-500 col-span-3">Cargando inventario...</p>
        ) : vehiculosFiltrados.length === 0 ? (
          <div className="col-span-3 bg-white border border-gray-200/80 rounded-2xl p-12 text-center text-gray-500 shadow-xs">
            No hay vehículos que coincidan con el filtro seleccionado.
          </div>
        ) : (
          vehiculosFiltrados.map((v) => (
            <div
              key={v.id}
              className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-gray-300 transition flex flex-col justify-between group"
            >
              <div>
                {/* Imagen del Vehículo */}
                <div className="relative aspect-16/9 bg-gray-100 overflow-hidden">
                  {v.imagenUrl ? (
                    <img
                      src={v.imagenUrl}
                      alt={`${v.marca} ${v.modelo}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                      <Car className="w-10 h-10" />
                      <span className="text-[10px] mt-1 font-medium">Sin imagen</span>
                    </div>
                  )}

                  {/* Badges superiores sobre la imagen */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs ${
                      v.condicion === 'CERO_KM'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}>
                      {v.condicion === 'CERO_KM' ? '0 KM' : `${v.kilometraje.toLocaleString()} KM`}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs ${
                      v.estado === 'DISPONIBLE'
                        ? 'bg-emerald-500/90 text-white'
                        : v.estado === 'RESERVADO'
                        ? 'bg-amber-500 text-white animate-pulse'
                        : 'bg-gray-800 text-white'
                    }`}>
                      {v.estado}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 tracking-tight">{v.marca} {v.modelo}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{v.version} · Año {v.anio}</p>
                  </div>

                  <div className="bg-gray-50/70 p-3 rounded-xl space-y-1.5 text-[11px] font-mono border border-gray-100">
                    <div className="flex justify-between text-gray-500">
                      <span>Chasis / VIN:</span>
                      <span className="text-gray-800 font-semibold">{v.vin}</span>
                    </div>
                    {v.costoCompra && (
                      <div className="flex justify-between text-indigo-600 font-medium">
                        <span>Costo compra:</span>
                        <span>${Number(v.costoCompra).toLocaleString('es-AR')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Precio de Lista</span>
                  <span className="text-base font-extrabold text-gray-900">
                    ${Number(v.precioVenta).toLocaleString('es-AR')}
                  </span>
                </div>

                <button
                  onClick={() => setVehiculoSimular(v)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="Simular crédito prendario y cuotas"
                >
                  <Calculator className="w-3.5 h-3.5 text-gray-500" />
                  <span>Simular Cuotas</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Nuevo Vehiculo */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-sm font-bold text-gray-900">Ingresar Vehículo al Stock</h3>
              <button onClick={() => setModalAbierto(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearVehiculo} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Marca *</label>
                  <input
                    type="text"
                    required
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    placeholder="Toyota"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Modelo *</label>
                  <input
                    type="text"
                    required
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    placeholder="Corolla"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Versión *</label>
                  <input
                    type="text"
                    required
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="XEI 2.0 CVT"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
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
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Condición *</label>
                  <select
                    value={condicion}
                    onChange={(e) => setCondicion(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
                  >
                    <option value="CERO_KM">0 KM (Nuevo)</option>
                    <option value="USADO">Usado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Kilometraje</label>
                  <input
                    type="number"
                    disabled={condicion === 'CERO_KM'}
                    value={condicion === 'CERO_KM' ? 0 : kilometraje}
                    onChange={(e) => setKilometraje(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Número de Chasis / VIN (17 caracteres) *</label>
                <input
                  type="text"
                  required
                  maxLength={17}
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  placeholder="8AJBA3FS0N0123456"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-mono text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Precio de Venta ($) *</label>
                  <input
                    type="number"
                    required
                    value={precioVenta}
                    onChange={(e) => setPrecioVenta(e.target.value)}
                    placeholder="32000000"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-mono text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Costo de Compra ($)</label>
                  <input
                    type="number"
                    value={costoCompra}
                    onChange={(e) => setCostoCompra(e.target.value)}
                    placeholder="26000000"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-mono text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
              </div>

              {/* Fotografía del Vehículo */}
              <div className="space-y-1.5 p-3 bg-gray-50/70 border border-gray-100 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-gray-700">
                    Fotografía / Imagen del Vehículo
                  </label>
                  <span className="text-[10px] text-gray-400">Opcional o presets</span>
                </div>

                <input
                  type="url"
                  value={imagenUrl}
                  onChange={(e) => setImagenUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />

                {/* Presets rápidos de fotos */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-gray-500 font-medium mr-1">Presets:</span>
                  {FOTOS_PRESET.map((p) => (
                    <button
                      key={p.nombre}
                      type="button"
                      onClick={() => setImagenUrl(p.url)}
                      className="px-2 py-0.5 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-[10px] font-semibold text-gray-700 transition cursor-pointer shadow-2xs"
                    >
                      + {p.nombre}
                    </button>
                  ))}
                  {imagenUrl && (
                    <button
                      type="button"
                      onClick={() => setImagenUrl('')}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer ml-auto"
                    >
                      Limpiar foto
                    </button>
                  )}
                </div>

                {/* Vista previa de imagen */}
                {imagenUrl && (
                  <div className="mt-2 relative aspect-16/9 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                    <img
                      src={imagenUrl}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-md">
                      Vista previa de fotografía
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 bg-[#18181b] hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {guardando ? 'Guardando...' : 'Dar de Alta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Simulador Financiero Prendario */}
      {vehiculoSimular && (
        <SimuladorFinancieroModal
          vehiculo={vehiculoSimular}
          onClose={() => setVehiculoSimular(null)}
        />
      )}
    </div>
  );
};
