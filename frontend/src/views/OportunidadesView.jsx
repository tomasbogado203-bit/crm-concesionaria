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
  BadgeDollarSign,
  Printer,
  Calendar,
  Clock,
  ShieldCheck,
  FileText,
} from 'lucide-react';

const ETAPAS = [
  { id: 'PROSPECTO', label: '1. Prospecto', color: 'border-gray-200 bg-gray-100/70 text-gray-800' },
  { id: 'TEST_DRIVE', label: '2. Test Drive', color: 'border-blue-200/70 bg-blue-50/40 text-blue-900' },
  { id: 'NEGOCIACION', label: '3. Negociación', color: 'border-indigo-200/70 bg-indigo-50/40 text-indigo-900' },
  { id: 'RESERVADO', label: '4. Reservado', color: 'border-amber-200/70 bg-amber-50/40 text-amber-900' },
  { id: 'GANADA', label: '5. Ganada', color: 'border-emerald-200/70 bg-emerald-50/40 text-emerald-900' },
  { id: 'PERDIDA', label: '6. Perdida', color: 'border-rose-200/70 bg-rose-50/40 text-rose-900' },
];

export const OportunidadesView = () => {
  const [oportunidades, setOportunidades] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalNueva, setModalNueva] = useState(false);
  const [columnaArrastre, setColumnaArrastre] = useState(null);
  const [idArrastrado, setIdArrastrado] = useState(null);

  // Modales de Seña
  const [modalSenia, setModalSenia] = useState(null); // Oportunidad a señar
  const [modalRecibo, setModalRecibo] = useState(null); // Oportunidad para ver/imprimir recibo

  // Form nueva oportunidad
  const [clienteId, setClienteId] = useState('');
  const [vehiculoId, setVehiculoId] = useState('');
  const [montoEstimado, setMontoEstimado] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Form Registrar Seña
  const [montoSenia, setMontoSenia] = useState('');
  const [metodoPagoSenia, setMetodoPagoSenia] = useState('TRANSFERENCIA');
  const [comprobantePagoSenia, setComprobantePagoSenia] = useState('');
  const [diasVigencia, setDiasVigencia] = useState(3);
  const [observacionesReserva, setObservacionesReserva] = useState('');
  const [guardandoSenia, setGuardandoSenia] = useState(false);

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
    // Si se mueve a RESERVADO y aún no tiene seña registrada, abrimos el modal de Seña
    const targetOp = oportunidades.find((o) => o.id === Number(id));
    if (nuevaEtapa === 'RESERVADO' && targetOp && !targetOp.montoSenia) {
      abrirModalSenia(targetOp);
      return;
    }

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

  const abrirModalSenia = (op) => {
    setModalSenia(op);
    // Sugerir por defecto el 5% de seña mínima
    const sugerido = Math.round(Number(op.montoEstimado) * 0.05);
    setMontoSenia(sugerido);
    setMetodoPagoSenia('TRANSFERENCIA');
    setComprobantePagoSenia('');
    setDiasVigencia(3);
    setObservacionesReserva('Reserva ad referéndum. Congela precio de la unidad durante la vigencia de la reserva.');
  };

  const handleRegistrarSenia = async (e) => {
    e.preventDefault();
    if (!modalSenia) return;
    setGuardandoSenia(true);

    try {
      const fechaVto = new Date(Date.now() + diasVigencia * 24 * 60 * 60 * 1000);
      const res = await apiFetch(`/oportunidades/${modalSenia.id}/senia`, {
        method: 'POST',
        body: JSON.stringify({
          montoSenia: Number(montoSenia),
          metodoPago: metodoPagoSenia,
          comprobantePago: comprobantePagoSenia || undefined,
          fechaVencimiento: fechaVto.toISOString(),
          observaciones: observacionesReserva || undefined,
        }),
      });

      const opActualizada = res.oportunidad;
      setModalSenia(null);
      await cargarDatos();
      // Abrir automáticamente el recibo para impresión
      setModalRecibo(opActualizada);
    } catch (err) {
      alert(err.message || 'Error al registrar la seña');
    } finally {
      setGuardandoSenia(false);
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
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Embudo Comercial y Reservas</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Gestión de prospectos, señas formales de stock con bloqueo de chasis y emisión de recibos.
          </p>
        </div>

        <button
          onClick={() => setModalNueva(true)}
          className="px-4 py-2 bg-[#18181b] hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
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
                isOver ? 'ring-2 ring-gray-900 scale-[1.02] bg-white border-gray-400 shadow-md' : ''
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-200/80">
                <span className="text-xs font-bold tracking-wide">{etapa.label}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-700 shadow-2xs">
                  {items.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 flex-1 flex flex-col">
                {items.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-gray-300/80 rounded-xl flex items-center justify-center text-[11px] text-gray-400 text-center p-2 bg-white/40">
                    Soltá acá para mover a {etapa.label}
                  </div>
                ) : (
                  items.map((op) => (
                    <div
                      key={op.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, op.id)}
                      className="p-3.5 bg-white border border-gray-200/80 rounded-xl shadow-xs transition-all space-y-2.5 relative group cursor-grab active:cursor-grabbing hover:border-gray-300 hover:shadow-md"
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5">
                          <GripVertical className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700 transition" />
                          #{op.id}
                        </span>
                        <span className="text-xs font-extrabold text-emerald-600 font-mono">
                          ${Number(op.montoEstimado).toLocaleString('es-AR')}
                        </span>
                      </div>

                      {/* Customer & Vehicle Info */}
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 truncate">
                          <User className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          {op.cliente?.nombres} {op.cliente?.apellido || op.cliente?.razonSocial}
                        </p>
                        <p className="text-[11px] text-gray-500 flex items-center gap-1.5 truncate">
                          <Car className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {op.vehiculo?.marca} {op.vehiculo?.modelo} ({op.vehiculo?.anio})
                        </p>
                      </div>

                      {/* State Badges & Seña Info */}
                      {op.etapa === 'RESERVADO' && (
                        <div className="space-y-2">
                          <div className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10px] space-y-1">
                            <div className="flex items-center justify-between font-bold">
                              <span className="flex items-center gap-1">
                                <Lock className="w-3 h-3 text-amber-600" />
                                <span>Chasis Bloqueado</span>
                              </span>
                              {op.montoSenia && (
                                <span className="font-mono text-emerald-700">
                                  Seña: ${Number(op.montoSenia).toLocaleString('es-AR')}
                                </span>
                              )}
                            </div>

                            {op.fechaVencimientoReserva && (
                              <p className="text-[9px] text-amber-700 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-500" />
                                Vence: {new Date(op.fechaVencimientoReserva).toLocaleDateString('es-AR')}
                              </p>
                            )}
                          </div>

                          {/* Botón Ver Recibo si ya tiene seña */}
                          {op.montoSenia ? (
                            <button
                              type="button"
                              onClick={() => setModalRecibo(op)}
                              className="w-full py-1.5 px-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition shadow-2xs cursor-pointer"
                            >
                              <Printer className="w-3 h-3 text-gray-500" />
                              <span>Recibo de Seña Oficial</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => abrirModalSenia(op)}
                              className="w-full py-1.5 px-2 bg-[#18181b] hover:bg-black text-white rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition shadow-xs cursor-pointer"
                            >
                              <BadgeDollarSign className="w-3 h-3" />
                              <span>Cargar Datos de Seña</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Botón rápido señar si está en Negociación, Test Drive o Prospecto */}
                      {op.etapa !== 'RESERVADO' && op.etapa !== 'GANADA' && op.etapa !== 'PERDIDA' && (
                        <button
                          type="button"
                          onClick={() => abrirModalSenia(op)}
                          className="w-full py-1 px-2 bg-amber-50/80 hover:bg-amber-100 text-amber-800 border border-amber-200/60 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                          title="El cliente desea señar el auto para reservarlo"
                        >
                          <BadgeDollarSign className="w-3 h-3 text-amber-600" />
                          <span>Señar Auto</span>
                        </button>
                      )}

                      {op.etapa === 'GANADA' && (
                        <div className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Venta cerrada exitosa
                        </div>
                      )}

                      {op.etapa === 'PERDIDA' && (
                        <div className="px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-semibold flex items-center gap-1">
                          <X className="w-3 h-3" /> Negociación perdida
                        </div>
                      )}

                      {/* Direct Dropdown Changer */}
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-gray-400 uppercase font-semibold">Mover:</span>
                          <select
                            value={op.etapa}
                            onChange={(e) => moverEtapa(op.id, e.target.value)}
                            className="w-full text-[10px] bg-white border border-gray-200 text-gray-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-900 cursor-pointer shadow-2xs"
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

      {/* MODAL 1: Nueva Oportunidad */}
      {modalNueva && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200/80 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-sm font-bold text-gray-900">Nueva Oportunidad Comercial</h3>
              <button onClick={() => setModalNueva(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearOportunidad} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Seleccionar Cliente *</label>
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

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Vehículo en Stock *</label>
                <select
                  required
                  value={vehiculoId}
                  onChange={(e) => {
                    setVehiculoId(e.target.value);
                    const v = vehiculos.find((x) => x.id === Number(e.target.value));
                    if (v) setMontoEstimado(v.precioVenta);
                  }}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
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
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Monto de la Oferta ($) *</label>
                <input
                  type="number"
                  required
                  value={montoEstimado}
                  onChange={(e) => setMontoEstimado(e.target.value)}
                  placeholder="32000000"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalNueva(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 bg-[#18181b] hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {guardando ? 'Creando...' : 'Crear Oportunidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Registrar Seña y Bloquear Unidad */}
      {modalSenia && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <BadgeDollarSign className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-gray-900">Registrar Seña y Bloquear Vehículo</h3>
              </div>
              <button onClick={() => setModalSenia(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumen Auto & Cliente */}
            <div className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-200/80 space-y-1.5 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Adquirente:</span>
                <span className="font-semibold text-gray-900">
                  {modalSenia.cliente?.nombres} {modalSenia.cliente?.apellido || modalSenia.cliente?.razonSocial}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Unidad:</span>
                <span className="font-semibold text-gray-900">
                  {modalSenia.vehiculo?.marca} {modalSenia.vehiculo?.modelo} ({modalSenia.vehiculo?.anio})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">VIN / Chasis:</span>
                <span className="font-mono text-gray-800">{modalSenia.vehiculo?.vin}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-200/60">
                <span className="text-gray-500 font-semibold">Precio Total de Venta:</span>
                <span className="font-mono font-bold text-gray-900">
                  ${Number(modalSenia.montoEstimado).toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            <form onSubmit={handleRegistrarSenia} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Monto de la Seña ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    max={Number(modalSenia.montoEstimado)}
                    value={montoSenia}
                    onChange={(e) => setMontoSenia(e.target.value)}
                    placeholder="1000000"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    Saldo restante: ${Math.max(0, Number(modalSenia.montoEstimado) - Number(montoSenia || 0)).toLocaleString('es-AR')}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Medio de Cobro *
                  </label>
                  <select
                    value={metodoPagoSenia}
                    onChange={(e) => setMetodoPagoSenia(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
                  >
                    <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                    <option value="EFECTIVO">Efectivo en Caja</option>
                    <option value="CHEQUE">Cheque / eCheq</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nº Comprobante / Transf.
                  </label>
                  <input
                    type="text"
                    value={comprobantePagoSenia}
                    onChange={(e) => setComprobantePagoSenia(e.target.value)}
                    placeholder="Ej: Transf #994821"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Plazo de Caducidad de la Reserva
                  </label>
                  <select
                    value={diasVigencia}
                    onChange={(e) => setDiasVigencia(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
                  >
                    <option value={3}>72 Horas Hábiles (Estándar)</option>
                    <option value={5}>5 Días Hábiles</option>
                    <option value={7}>7 Días Corridos (Semanal)</option>
                    <option value={14}>14 Días (Aprobación Crédito)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Cláusulas y Observaciones de la Reserva
                </label>
                <textarea
                  rows="2"
                  value={observacionesReserva}
                  onChange={(e) => setObservacionesReserva(e.target.value)}
                  placeholder="Detalles de la seña, condiciones de reintegro o congelamiento de valor..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalSenia(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoSenia}
                  className="px-4 py-2 bg-[#18181b] hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{guardandoSenia ? 'Registrando...' : 'Confirmar Seña y Bloquear Unidad'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Boleto de Reserva / Recibo Oficial de Seña Imprimible */}
      {modalRecibo && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-gray-200/80 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-6">
            {/* Modal Controls Header (Hidden in Print) */}
            <div className="p-4 px-6 border-b border-gray-100 flex items-center justify-between bg-white print:hidden">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Boleto Oficial de Reserva de Unidad
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-[#18181b] hover:bg-black text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Boleto de Seña</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalRecibo(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Formal Receipt Document */}
            <div className="p-6 md:p-8 space-y-5 text-xs bg-white text-gray-900 print:bg-white print:text-black">
              {/* Header Box */}
              <div className="border border-gray-200 print:border-gray-400 rounded-2xl p-4 bg-gray-50/50 print:bg-white flex justify-between items-start">
                <div>
                  <h2 className="font-black text-base text-gray-900 print:text-black tracking-tight">
                    AUTO CRM CONCESIONARIA S.A.
                  </h2>
                  <p className="text-[11px] text-gray-500 print:text-gray-600 mt-0.5">
                    Concesionaria Oficial · Venta de 0km y Usados Seleccionados
                  </p>
                  <p className="text-[10px] text-gray-400 print:text-gray-600 mt-1.5">
                    Casa Central: Av. Automotor 4500, Posadas, Misiones<br />
                    CUIT: 30-71458923-4 · IVA Responsable Inscripto
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px] uppercase block mb-1">
                    Boleto de Reserva
                  </span>
                  <p className="font-mono text-xs font-bold text-gray-900 print:text-black">
                    Nº {modalRecibo.nroReciboSenia || `RES-${modalRecibo.id}-0001`}
                  </p>
                  <p className="text-[11px] text-gray-500 print:text-gray-600">
                    Fecha: {new Date(modalRecibo.updatedAt || Date.now()).toLocaleDateString('es-AR')}
                  </p>
                  {modalRecibo.fechaVencimientoReserva && (
                    <p className="text-[10px] font-semibold text-rose-600 print:text-black">
                      Vence: {new Date(modalRecibo.fechaVencimientoReserva).toLocaleDateString('es-AR')}
                    </p>
                  )}
                </div>
              </div>

              {/* Customer Info Box */}
              <div className="border border-gray-200 print:border-gray-400 rounded-xl p-3.5 bg-gray-50/50 print:bg-white grid grid-cols-2 gap-4 text-[11px]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 print:text-gray-600 block">
                    Adquirente / Solicitante:
                  </span>
                  <p className="font-bold text-gray-900 print:text-black text-xs">
                    {modalRecibo.cliente?.nombres} {modalRecibo.cliente?.apellido || modalRecibo.cliente?.razonSocial}
                  </p>
                  <p className="text-gray-500 print:text-gray-600 mt-0.5">
                    DNI / CUIT: <strong className="text-gray-800 print:text-black font-mono">{modalRecibo.cliente?.numeroDni}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-gray-400 print:text-gray-600 block">
                    Contacto:
                  </span>
                  <p className="text-gray-700 print:text-black">{modalRecibo.cliente?.telefono || 'Sin teléfono'}</p>
                  <p className="text-gray-500 print:text-gray-600">{modalRecibo.cliente?.email || 'Sin correo'}</p>
                </div>
              </div>

              {/* Reserved Vehicle Details Box */}
              <div className="border border-gray-200 print:border-gray-400 rounded-xl p-4 space-y-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 print:text-gray-600 block">
                  Unidad Automotor Reservada (Bloqueo Exclusivo de Chasis):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Marca / Modelo:</span>
                    <strong className="text-gray-900 print:text-black">{modalRecibo.vehiculo?.marca} {modalRecibo.vehiculo?.modelo}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Versión / Año:</span>
                    <strong className="text-gray-900 print:text-black">{modalRecibo.vehiculo?.version || 'Base'} ({modalRecibo.vehiculo?.anio})</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Número de Chasis (VIN):</span>
                    <span className="font-mono font-bold text-gray-800 print:text-black">{modalRecibo.vehiculo?.vin}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Condición:</span>
                    <span className="font-semibold text-gray-700 print:text-black">
                      {modalRecibo.vehiculo?.condicion === 'CERO_KM' ? '0 Kilómetro' : 'Usado Seleccionado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <div className="border border-gray-200 print:border-gray-400 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 print:bg-gray-200 border-b border-gray-200 text-gray-600 print:text-black text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="p-2.5">Concepto Económico</th>
                      <th className="p-2.5">Medio / Referencia</th>
                      <th className="p-2.5 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 print:divide-gray-300">
                    <tr>
                      <td className="p-2.5 font-medium text-gray-900 print:text-black">
                        Precio Total Pactado de la Unidad
                      </td>
                      <td className="p-2.5 text-gray-500">Valor de Lista / Operación</td>
                      <td className="p-2.5 text-right font-mono font-bold text-gray-900 print:text-black">
                        ${Number(modalRecibo.montoEstimado).toLocaleString('es-AR')}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/40 print:bg-white">
                      <td className="p-2.5 font-bold text-emerald-800 print:text-black flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Seña Percibida a Cuenta de Precio</span>
                      </td>
                      <td className="p-2.5 font-medium text-gray-600 print:text-black">
                        {modalRecibo.metodoPagoSenia || 'TRANSFERENCIA'} {modalRecibo.comprobantePagoSenia ? `(${modalRecibo.comprobantePagoSenia})` : ''}
                      </td>
                      <td className="p-2.5 text-right font-mono font-extrabold text-emerald-700 print:text-black">
                        -${Number(modalRecibo.montoSenia || 0).toLocaleString('es-AR')}
                      </td>
                    </tr>
                    <tr className="bg-gray-50/70 print:bg-white font-bold">
                      <td className="p-2.5 text-gray-800 print:text-black">
                        Saldo Restante a Integrar al Retiro
                      </td>
                      <td className="p-2.5 text-gray-500">Contado / Prendario / Permuta</td>
                      <td className="p-2.5 text-right font-mono text-base font-black text-gray-900 print:text-black">
                        ${Math.max(0, Number(modalRecibo.montoEstimado) - Number(modalRecibo.montoSenia || 0)).toLocaleString('es-AR')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Legal Clauses */}
              <div className="p-3 bg-gray-50/70 print:bg-white border border-gray-200 print:border-gray-400 rounded-xl text-[10px] text-gray-600 print:text-black space-y-1 leading-relaxed">
                <p className="font-bold text-gray-800 print:text-black">Cláusulas de Reserva y Condiciones Comerciales:</p>
                <p>
                  1. El presente documento certifica la recepción del importe en concepto de seña para la reserva ad referéndum de la unidad detallada precedentemente, bloqueando su comercialización a terceros.
                </p>
                <p>
                  2. La presente reserva tendrá una validez de <strong>72 horas hábiles</strong> contadas a partir de su emisión (Vencimiento: {new Date(modalRecibo.fechaVencimientoReserva || Date.now() + 3 * 86400000).toLocaleDateString('es-AR')}). Vencido dicho plazo sin que el adquirente complete la documentación o integración del saldo, la concesionaria podrá dar de baja la reserva liberando la unidad.
                </p>
                {modalRecibo.observacionesReserva && (
                  <p className="font-medium text-gray-800 print:text-black italic">
                    Observaciones adicionales: "{modalRecibo.observacionesReserva}"
                  </p>
                )}
              </div>

              {/* Signature Areas */}
              <div className="pt-8 grid grid-cols-2 gap-12 text-center text-xs">
                <div className="border-t border-gray-400 pt-2 space-y-0.5">
                  <p className="font-bold text-gray-900 print:text-black">Por la Concesionaria</p>
                  <p className="text-[10px] text-gray-500 print:text-gray-600">Firma y Sello Comercial</p>
                </div>
                <div className="border-t border-gray-400 pt-2 space-y-0.5">
                  <p className="font-bold text-gray-900 print:text-black">Conformidad del Adquirente</p>
                  <p className="text-[10px] text-gray-500 print:text-gray-600">Firma y Aclaración</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
