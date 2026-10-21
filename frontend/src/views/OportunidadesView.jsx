import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import {
  Target,
  Plus,
  Car,
  User,
  GripVertical,
  X,
  Lock,
  CheckCircle2,
  AlertTriangle,
  MoveRight,
} from 'lucide-react';

const ETAPAS = [
  { id: 'PROSPECTO', label: '1. Prospecto', color: 'border-slate-800 bg-slate-900/40 text-slate-300' },
  { id: 'TEST_DRIVE', label: '2. Test Drive', color: 'border-blue-500/30 bg-blue-950/20 text-blue-400' },
  { id: 'NEGOCIACION', label: '3. Negociación', color: 'border-indigo-500/30 bg-indigo-950/20 text-indigo-400' },
  { id: 'RESERVADO', label: '4. Reservado', color: 'border-amber-500/30 bg-amber-950/20 text-amber-400' },
  { id: 'GANADA', label: '5. Ganada', color: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400' },
  { id: 'PERDIDA', label: '6. Perdida', color: 'border-rose-500/30 bg-rose-950/20 text-rose-400' },
];

export const OportunidadesView = () => {
  const [oportunidades, setOportunidades] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalNueva, setModalNueva] = useState(false);
  const [columnaArrastre, setColumnaArrastre] = useState(null);
  const [idArrastrado, setIdArrastrado] = useState(null);

  // Form nueva oportunidad
  const [clienteId, setClienteId] = useState('');
  const [vehiculoId, setVehiculoId] = useState('');
  const [montoEstimado, setMontoEstimado] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [opos, clis, vehs] = await Promise.all([
        apiFetch('/oportunidades'),
        apiFetch('/clientes').catch(() => []),
        apiFetch('/vehiculos').catch(() => []),
      ]);
      setOportunidades(opos);
      setClientes(clis);
      setVehiculos(vehs);
    } catch (err) {
      console.error('Error cargando oportunidades:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCrearOportunidad = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await apiFetch('/oportunidades', {
        method: 'POST',
        body: JSON.stringify({
          clienteId: Number(clienteId),
          vehiculoId: Number(vehiculoId),
          montoEstimado: Number(montoEstimado),
          etapa: 'PROSPECTO',
        }),
      });

      setModalNueva(false);
      setClienteId('');
      setVehiculoId('');
      setMontoEstimado('');
      cargarDatos();
    } catch (err) {
      alert(err.message || 'Error al crear oportunidad');
    } finally {
      setGuardando(false);
    }
  };

  const moverEtapa = async (id, nuevaEtapa) => {
    // Optimistic UI update
    setOportunidades((prev) =>
      prev.map((op) => (op.id === Number(id) ? { ...op, etapa: nuevaEtapa } : op))
    );

    try {
      await apiFetch(`/oportunidades/${id}/etapa`, {
        method: 'PATCH',
        body: JSON.stringify({ etapa: nuevaEtapa }),
      });
      cargarDatos();
    } catch (err) {
      alert(err.message || 'No se pudo cambiar de etapa');
      cargarDatos();
    }
  };

  // Drag and Drop
  const handleDragStart = (e, id) => {
    setIdArrastrado(id);
    e.dataTransfer.setData('text/plain', String(id));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, etapaId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (columnaArrastre !== etapaId) {
      setColumnaArrastre(etapaId);
    }
  };

  const handleDragLeave = () => {
    setColumnaArrastre(null);
  };

  const handleDrop = async (e, nuevaEtapa) => {
    e.preventDefault();
    e.stopPropagation();
    setColumnaArrastre(null);

    const oportunidadId = e.dataTransfer.getData('text/plain') || idArrastrado;
    setIdArrastrado(null);

    if (oportunidadId) {
      moverEtapa(oportunidadId, nuevaEtapa);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Embudo Comercial (Tablero Kanban)</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Arrastrá y soltá las tarjetas libremente entre cualquiera de las columnas, o usá el selector directo.
          </p>
        </div>

        <button
          onClick={() => setModalNueva(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Oportunidad</span>
        </button>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start pb-4">
        {ETAPAS.map((etapa) => {
          const items = oportunidades.filter((o) => o.etapa === etapa.id);
          const isOver = columnaArrastre === etapa.id;

          return (
            <div
              key={etapa.id}
              onDragOver={(e) => handleDragOver(e, etapa.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, etapa.id)}
              className={`rounded-2xl border p-4 flex flex-col gap-3 min-h-[550px] transition-all duration-150 ${etapa.color} ${
                isOver ? 'ring-2 ring-blue-500 scale-[1.02] bg-blue-900/30 border-blue-400' : ''
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-xs font-bold tracking-wide">{etapa.label}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {items.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 flex-1 flex flex-col">
                {items.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-slate-800/60 rounded-xl flex items-center justify-center text-[11px] text-slate-500 text-center p-2">
                    Soltá acá para mover a {etapa.label}
                  </div>
                ) : (
                  items.map((op) => (
                    <div
                      key={op.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, op.id)}
                      className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl shadow-lg transition-all space-y-2.5 relative group cursor-grab active:cursor-grabbing hover:border-slate-600 hover:shadow-xl hover:shadow-blue-500/10"
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                          <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition" />
                          #{op.id}
                        </span>
                        <span className="text-xs font-extrabold text-emerald-400">
                          ${Number(op.montoEstimado).toLocaleString('es-AR')}
                        </span>
                      </div>

                      {/* Customer & Vehicle Info */}
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-white flex items-center gap-1.5 truncate">
                          <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          {op.cliente?.nombres} {op.cliente?.apellido || op.cliente?.razonSocial}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                          <Car className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          {op.vehiculo?.marca} {op.vehiculo?.modelo} ({op.vehiculo?.anio})
                        </p>
                      </div>

                      {/* State Badges */}
                      {op.etapa === 'RESERVADO' && (
                        <div className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Auto bloqueado en stock
                        </div>
                      )}
                      {op.etapa === 'GANADA' && (
                        <div className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Venta cerrada exitosa
                        </div>
                      )}
                      {op.etapa === 'PERDIDA' && (
                        <div className="px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-semibold flex items-center gap-1">
                          <X className="w-3 h-3" /> Negociación perdida
                        </div>
                      )}

                      {/* Direct Dropdown Changer */}
                      <div className="pt-2 border-t border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-500 uppercase font-semibold">Mover:</span>
                          <select
                            value={op.etapa}
                            onChange={(e) => moverEtapa(op.id, e.target.value)}
                            className="w-full text-[10px] bg-slate-950 border border-slate-800 text-slate-200 rounded px-1.5 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            {ETAPAS.map((et) => (
                              <option key={et.id} value={et.id}>
                                {et.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nueva Oportunidad */}
      {modalNueva && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white">Nueva Oportunidad Comercial</h3>
              <button onClick={() => setModalNueva(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearOportunidad} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Seleccionar Cliente *</label>
                <select
                  required
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Seleccione un cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombres} {c.apellido || c.razonSocial} (DNI/CUIT: {c.numeroDni})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Vehículo en Stock *</label>
                <select
                  required
                  value={vehiculoId}
                  onChange={(e) => {
                    setVehiculoId(e.target.value);
                    const v = vehiculos.find((x) => x.id === Number(e.target.value));
                    if (v) setMontoEstimado(v.precioVenta);
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Seleccione un vehículo...</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} {v.version} ({v.anio}) - ${Number(v.precioVenta).toLocaleString('es-AR')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Monto de la Oferta ($) *</label>
                <input
                  type="number"
                  required
                  value={montoEstimado}
                  onChange={(e) => setMontoEstimado(e.target.value)}
                  placeholder="32000000"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalNueva(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 disabled:opacity-50"
                >
                  {guardando ? 'Creando...' : 'Crear Oportunidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
