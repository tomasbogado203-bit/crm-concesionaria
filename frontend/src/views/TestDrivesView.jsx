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
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Pruebas de Manejo (Test Drives)</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Agenda de demostración vehicular, validación de licencias y feedback comercial.
          </p>
        </div>

        <button
          onClick={() => setModalAgendar(true)}
          className="px-4 py-2 bg-[#18181b] hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar Test Drive</span>
        </button>
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block font-medium">Turnos Pendientes</span>
            <span className="text-lg font-bold text-gray-900">{programados}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block font-medium">Pruebas Realizadas</span>
            <span className="text-lg font-bold text-gray-900">{completados}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block font-medium">Calificación Promedio</span>
            <span className="text-lg font-bold text-gray-900">4.9 / 5.0</span>
          </div>
        </div>
      </div>

      {/* Grid of Test Drives */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cargando ? (
          <p className="text-xs text-gray-500 col-span-3">Cargando agenda de pruebas...</p>
        ) : testDrives.length === 0 ? (
          <div className="col-span-3 bg-white border border-gray-200/80 rounded-2xl p-12 text-center text-gray-500 shadow-xs">
            No hay pruebas de manejo agendadas todavía. Hacé clic en "Agendar Test Drive" para crear la primera.
          </div>
        ) : (
          testDrives.map((td) => (
            <div
              key={td.id}
              className="bg-white border border-gray-200/80 rounded-2xl p-5 space-y-4 hover:shadow-md hover:border-gray-300 transition flex flex-col justify-between shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-mono">
                    Turno #{td.id}
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      td.estado === 'PROGRAMADO'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : td.estado === 'COMPLETADO'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {td.estado}
                  </span>
                </div>

                {/* Cliente */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-500" />
                    {td.cliente?.nombres} {td.cliente?.apellido || td.cliente?.razonSocial}
                  </h3>
                  <p className="text-xs text-gray-500">Tel: {td.cliente?.telefono || 'No informado'}</p>
                </div>

                {/* Vehículo */}
                <div className="p-3 bg-gray-50/70 border border-gray-100 rounded-xl space-y-1 text-xs">
                  <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-gray-500" />
                    {td.vehiculo?.marca} {td.vehiculo?.modelo} ({td.vehiculo?.anio})
                  </p>
                  <p className="text-[11px] text-gray-500 font-mono">VIN: {td.vehiculo?.vin}</p>
                </div>

                {/* Info Horario y Licencia */}
                <div className="text-xs text-gray-600 space-y-1">
                  <p className="flex items-center gap-1.5 font-medium text-gray-800">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    {new Date(td.fechaHora).toLocaleString('es-AR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                  {td.licenciaConducir && (
                    <p className="flex items-center gap-1.5 text-gray-500">
                      <FileCheck className="w-3.5 h-3.5 text-gray-400" />
                      Licencia: {td.licenciaConducir}
                    </p>
                  )}
                </div>

                {/* Feedback preview if completed */}
                {td.estado === 'COMPLETADO' && (
                  <div className="bg-emerald-50/60 border border-emerald-100 p-2.5 rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      {'★'.repeat(td.calificacion || 5)}
                      <span className="text-[10px] text-emerald-800 font-semibold ml-1">
                        ({td.calificacion}/5)
                      </span>
                    </div>
                    {td.feedback && (
                      <p className="text-[11px] text-emerald-900 italic">"{td.feedback}"</p>
                    )}
                  </div>
                )}
              </div>

              {/* Botón acción si está programado */}
              {td.estado === 'PROGRAMADO' && (
                <button
                  onClick={() => setModalFeedback(td)}
                  className="w-full py-2 bg-[#18181b] hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Registrar Calificación & Feedback</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* MODAL 1: Agendar Test Drive */}
      {modalAgendar && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200/80 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-sm font-bold text-gray-900">Agendar Turno de Manejo</h3>
              <button onClick={() => setModalAgendar(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAgendar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Cliente Solicitante *</label>
                <select
                  required
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
                >
                  <option value="">Seleccione un cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombres} {c.apellido || c.razonSocial} (DNI: {c.numeroDni})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Vehículo para Demostración *</label>
                <select
                  required
                  value={vehiculoId}
                  onChange={(e) => setVehiculoId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
                >
                  <option value="">Seleccione un vehículo disponible...</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} {v.version} ({v.anio})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Fecha y Hora Programada *</label>
                <input
                  type="datetime-local"
                  required
                  value={fechaHora}
                  onChange={(e) => setFechaHora(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Número de Licencia de Conducir (Opcional)
                </label>
                <input
                  type="text"
                  value={licenciaConducir}
                  onChange={(e) => setLicenciaConducir(e.target.value)}
                  placeholder="B1 - Vence 12/2027"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalAgendar(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoTurno}
                  className="px-4 py-2 bg-[#18181b] hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {guardandoTurno ? 'Programando...' : 'Confirmar Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Feedback & Calificación */}
      {modalFeedback && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200/80 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-sm font-bold text-gray-900">Resultado del Test Drive</h3>
              <button onClick={() => setModalFeedback(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4">
              Prueba realizada a <strong className="text-gray-900">{modalFeedback.cliente?.nombres} {modalFeedback.cliente?.apellido || modalFeedback.cliente?.razonSocial}</strong> en <strong className="text-gray-900">{modalFeedback.vehiculo?.marca} {modalFeedback.vehiculo?.modelo}</strong>.
            </p>

            <form onSubmit={handleGuardarFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Estado Final</label>
                <select
                  value={estadoFeedback}
                  onChange={(e) => setEstadoFeedback(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
                >
                  <option value="COMPLETADO">Completado con Éxito</option>
                  <option value="CANCELADO">Cancelado / No se presentó</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Calificación del Cliente (1 al 5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCalificacion(num)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        calificacion >= num
                          ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-2xs'
                          : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      ★ {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Comentarios y Feedback del Cliente
                </label>
                <textarea
                  rows="3"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Le gustó la respuesta del motor y la insonorización, consultará financiación..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalFeedback(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoFeedback}
                  className="px-4 py-2 bg-[#18181b] hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
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
