import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import {
  Clock,
  Plus,
  Car,
  User,
  Star,
  CheckCircle2,
  XCircle,
  Calendar,
  FileCheck,
  X,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

export const TestDrivesView = () => {
  const [testDrives, setTestDrives] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Modales
  const [modalAgendar, setModalAgendar] = useState(false);
  const [modalFeedback, setModalFeedback] = useState(null); // test drive seleccionado

  // Form Agendar
  const [clienteId, setClienteId] = useState('');
  const [vehiculoId, setVehiculoId] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [licenciaConducir, setLicenciaConducir] = useState('');
  const [guardandoTurno, setGuardandoTurno] = useState(false);

  // Form Feedback
  const [calificacion, setCalificacion] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [estadoFeedback, setEstadoFeedback] = useState('COMPLETADO');
  const [guardandoFeedback, setGuardandoFeedback] = useState(false);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [tds, clis, vehs] = await Promise.all([
        apiFetch('/test-drives'),
        apiFetch('/clientes').catch(() => []),
        apiFetch('/vehiculos').catch(() => []),
      ]);

      setTestDrives(tds);
      setClientes(clis);
      setVehiculos(vehs.filter((v) => v.estado === 'DISPONIBLE' || v.estado === 'RESERVADO'));
    } catch (err) {
      console.error('Error cargando test drives:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleAgendar = async (e) => {
    e.preventDefault();
    setGuardandoTurno(true);

    try {
      await apiFetch('/test-drives', {
        method: 'POST',
        body: JSON.stringify({
          clienteId: Number(clienteId),
          vehiculoId: Number(vehiculoId),
          fechaHora: new Date(fechaHora).toISOString(),
          licenciaConducir,
        }),
      });

      setModalAgendar(false);
      setClienteId('');
      setVehiculoId('');
      setFechaHora('');
      setLicenciaConducir('');
      cargarDatos();
    } catch (err) {
      alert(err.message || 'Error al programar prueba de manejo');
    } finally {
      setGuardandoTurno(false);
    }
  };

  const handleGuardarFeedback = async (e) => {
    e.preventDefault();
    if (!modalFeedback) return;
    setGuardandoFeedback(true);

    try {
      await apiFetch(`/test-drives/${modalFeedback.id}/feedback`, {
        method: 'PATCH',
        body: JSON.stringify({
          estado: estadoFeedback,
          feedback,
          calificacion: Number(calificacion),
        }),
      });

      setModalFeedback(null);
      setFeedback('');
      setCalificacion(5);
      cargarDatos();
    } catch (err) {
      alert(err.message || 'Error al registrar feedback');
    } finally {
      setGuardandoFeedback(false);
    }
  };

  const programados = testDrives.filter((t) => t.estado === 'PROGRAMADO').length;
  const completados = testDrives.filter((t) => t.estado === 'COMPLETADO').length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Pruebas de Manejo (Test Drives)</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Agenda de demostración vehicular, validación de licencias y feedback comercial.
          </p>
        </div>

        <button
          onClick={() => setModalAgendar(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar Test Drive</span>
        </button>
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Turnos Pendientes</span>
            <span className="text-lg font-bold text-white">{programados}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Pruebas Realizadas</span>
            <span className="text-lg font-bold text-white">{completados}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Calificación Promedio</span>
            <span className="text-lg font-bold text-white">4.9 / 5.0</span>
          </div>
        </div>
      </div>

      {/* Grid of Test Drives */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cargando ? (
          <p className="text-xs text-slate-500 col-span-3">Cargando agenda de pruebas...</p>
        ) : testDrives.length === 0 ? (
          <div className="col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            No hay pruebas de manejo agendadas todavía. Hacé clic en "Agendar Test Drive" para crear la primera.
          </div>
        ) : (
          testDrives.map((td) => (
            <div
              key={td.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    Turno #{td.id}
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      td.estado === 'PROGRAMADO'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : td.estado === 'COMPLETADO'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {td.estado}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{new Date(td.fechaHora).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })} hs</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-white font-medium truncate">
                    <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{td.cliente?.nombres} {td.cliente?.apellido || td.cliente?.razonSocial}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 truncate">
                    <Car className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{td.vehiculo?.marca} {td.vehiculo?.modelo} {td.vehiculo?.version}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-800">
                    <FileCheck className="w-3 h-3 text-slate-600 shrink-0" />
                    <span>Licencia: {td.licenciaConducir}</span>
                  </div>
                </div>

                {/* Feedback preview if completed */}
                {td.estado === 'COMPLETADO' && (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-1">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(td.calificacion || 5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                      <span className="text-[10px] text-emerald-400 font-bold ml-1">({td.calificacion}/5)</span>
                    </div>
                    {td.feedback && (
                      <p className="text-[11px] text-slate-300 italic">"{td.feedback}"</p>
                    )}
                  </div>
                )}
              </div>

              {/* Action */}
              {td.estado === 'PROGRAMADO' && (
                <button
                  onClick={() => setModalFeedback(td)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Cargar Feedback y Concluir</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* MODAL 1: Agendar Test Drive */}
      {modalAgendar && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-400" />
                Programar Cita de Test Drive
              </h3>
              <button onClick={() => setModalAgendar(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAgendar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Cliente Solicitante *</label>
                <select
                  required
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Seleccione el cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombres} {c.apellido || c.razonSocial} (DNI/CUIT: {c.numeroDni})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Vehículo a Probar *</label>
                <select
                  required
                  value={vehiculoId}
                  onChange={(e) => setVehiculoId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Seleccione la unidad en stock...</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} {v.version} ({v.anio})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha y Hora del Turno *</label>
                <input
                  type="datetime-local"
                  required
                  value={fechaHora}
                  onChange={(e) => setFechaHora(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Número de Licencia de Conducir (Verificación Legal) *
                </label>
                <input
                  type="text"
                  required
                  value={licenciaConducir}
                  onChange={(e) => setLicenciaConducir(e.target.value)}
                  placeholder="Ej: B1-38123456"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAgendar(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoTurno}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 disabled:opacity-50"
                >
                  {guardandoTurno ? 'Guardando...' : 'Confirmar Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Cargar Feedback */}
      {modalFeedback && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                Registrar Feedback del Test Drive
              </h3>
              <button onClick={() => setModalFeedback(null)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarFeedback} className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs">
                <p className="text-slate-400">
                  Cliente: <strong className="text-white">{modalFeedback.cliente?.nombres} {modalFeedback.cliente?.apellido}</strong>
                </p>
                <p className="text-slate-400">
                  Auto: <strong className="text-white">{modalFeedback.vehiculo?.marca} {modalFeedback.vehiculo?.modelo}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Resultado de la Cita</label>
                <select
                  value={estadoFeedback}
                  onChange={(e) => setEstadoFeedback(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="COMPLETADO">Completado con Éxito</option>
                  <option value="CANCELADO">Cliente no se presentó / Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Satisfacción del Cliente</label>
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCalificacion(star)}
                      className="p-1 text-slate-600 hover:text-amber-400 transition"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= calificacion ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-white ml-2">{calificacion} de 5</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Conclusiones y Opinión del Cliente *
                </label>
                <textarea
                  rows="3"
                  required
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Ej: Le gustó la insonorización y la caja automática. Solicitó cotización final con seguro..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalFeedback(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoFeedback}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/30 disabled:opacity-50"
                >
                  {guardandoFeedback ? 'Guardando...' : 'Guardar Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
