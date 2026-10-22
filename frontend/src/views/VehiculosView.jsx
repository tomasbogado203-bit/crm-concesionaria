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
} from 'lucide-react';
import { exportToCSV } from '../utils/exportCsv';
import { SimuladorFinancieroModal } from '../components/SimuladorFinancieroModal';

export const VehiculosView = () => {
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
          <h2 className="text-xl font-bold text-white tracking-tight">Catálogo e Inventario de Stock</h2>
          <p className="text-xs text-slate-400 mt-0.5">Control de unidades 0km y usados disponibles en salón y depósito.</p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExportarCSV}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            title="Descargar planilla CSV para Excel"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => setModalAbierto(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ingresar Vehículo</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {['TODOS', 'CERO_KM', 'USADO'].map((f) => (
          <button
            key={f}
            onClick={() => setFiltroCondicion(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filtroCondicion === f
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {f === 'TODOS' ? 'Todos los Vehículos' : f === 'CERO_KM' ? '0 Kilómetros' : 'Usados Seleccionados'}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cargando ? (
          <p className="text-xs text-slate-500 col-span-3">Cargando inventario...</p>
        ) : vehiculosFiltrados.length === 0 ? (
          <p className="text-xs text-slate-500 col-span-3">No hay vehículos que coincidan con el filtro.</p>
        ) : (
          vehiculosFiltrados.map((v) => (
            <div
              key={v.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    v.condicion === 'CERO_KM'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {v.condicion === 'CERO_KM' ? '0 KM' : `${v.kilometraje.toLocaleString()} KM`}
                  </span>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    v.estado === 'DISPONIBLE'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : v.estado === 'RESERVADO'
                      ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {v.estado}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">{v.marca} {v.modelo}</h3>
                  <p className="text-xs text-slate-400">{v.version} · Año {v.anio}</p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl space-y-1 text-[11px] font-mono border border-slate-800/80">
                  <div className="flex justify-between text-slate-500">
                    <span>Chasis / VIN:</span>
                    <span className="text-slate-300">{v.vin}</span>
                  </div>
                  {v.costoCompra && (
                    <div className="flex justify-between text-purple-400">
                      <span>Costo compra:</span>
                      <span>${Number(v.costoCompra).toLocaleString('es-AR')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Precio de Lista</span>
                  <span className="text-base font-extrabold text-white">
                    ${Number(v.precioVenta).toLocaleString('es-AR')}
                  </span>
                </div>

                <button
                  onClick={() => setVehiculoSimular(v)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Simular crédito prendario y cuotas"
                >
                  <Calculator className="w-3.5 h-3.5 text-blue-400" />
                  <span>Simular Cuotas</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Nuevo Vehiculo */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white">Ingresar Vehículo al Stock</h3>
              <button onClick={() => setModalAbierto(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearVehiculo} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Marca *</label>
                  <input
                    type="text"
                    required
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    placeholder="Toyota"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Modelo *</label>
                  <input
                    type="text"
                    required
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    placeholder="Corolla"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Versión *</label>
                  <input
                    type="text"
                    required
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="XEI 2.0 CVT"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Año de Fabricación *</label>
                  <input
                    type="number"
                    required
                    value={anio}
                    onChange={(e) => setAnio(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Condición *</label>
                  <select
                    value={condicion}
                    onChange={(e) => setCondicion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="CERO_KM">0 KM (Nuevo)</option>
                    <option value="USADO">Usado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kilometraje</label>
                  <input
                    type="number"
                    disabled={condicion === 'CERO_KM'}
                    value={condicion === 'CERO_KM' ? 0 : kilometraje}
                    onChange={(e) => setKilometraje(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 disabled:opacity-40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Número de Chasis / VIN (17 caracteres) *</label>
                <input
                  type="text"
                  required
                  maxLength={17}
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  placeholder="8AJBA3FS0N0123456"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Precio de Venta ($) *</label>
                  <input
                    type="number"
                    required
                    value={precioVenta}
                    onChange={(e) => setPrecioVenta(e.target.value)}
                    placeholder="32000000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Costo de Compra ($)</label>
                  <input
                    type="number"
                    value={costoCompra}
                    onChange={(e) => setCostoCompra(e.target.value)}
                    placeholder="26000000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 disabled:opacity-50"
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
