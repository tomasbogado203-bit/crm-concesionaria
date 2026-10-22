import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { Users, Plus, Search, Building2, User, Phone, Mail, FileText, CheckCircle2, MessageSquare, X, Download } from 'lucide-react';
import { exportToCSV } from '../utils/exportCsv';

export const ContactosView = () => {
  const [contactos, setContactos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalInteraccion, setModalInteraccion] = useState(null); // contactoId

  // Formulario nuevo contacto
  const [tipoPersona, setTipoPersona] = useState('FISICA');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState(null);

  // Formulario interaccion
  const [canal, setCanal] = useState('WHATSAPP');
  const [resumenInteraccion, setResumenInteraccion] = useState('');
  const [guardandoInteraccion, setGuardandoInteraccion] = useState(false);

  const cargarContactos = async () => {
    try {
      setCargando(true);
      const data = await apiFetch('/clientes');
      setContactos(data);
    } catch (err) {
      console.error('Error cargando contactos:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarContactos();
  }, []);

  const handleCrearContacto = async (e) => {
    e.preventDefault();
    setErrorForm(null);
    setGuardando(true);

    try {
      await apiFetch('/clientes', {
        method: 'POST',
        body: JSON.stringify({
          tipoPersona,
          nombre,
          apellido: tipoPersona === 'FISICA' ? apellido : undefined,
          razonSocial: tipoPersona === 'JURIDICA' ? razonSocial : undefined,
          documento,
          telefono,
          email: email || undefined,
        }),
      });

      setModalAbierto(false);
      // Reset form
      setNombre('');
      setApellido('');
      setRazonSocial('');
      setDocumento('');
      setTelefono('');
      setEmail('');
      cargarContactos();
    } catch (err) {
      setErrorForm(err.message || 'Error al guardar contacto');
    } finally {
      setGuardando(false);
    }
  };

  const handleCrearInteraccion = async (e) => {
    e.preventDefault();
    if (!modalInteraccion) return;
    setGuardandoInteraccion(true);

    try {
      await apiFetch(`/clientes/${modalInteraccion.id}/interacciones`, {
        method: 'POST',
        body: JSON.stringify({
          canal,
          resumen: resumenInteraccion,
        }),
      });

      setModalInteraccion(null);
      setResumenInteraccion('');
      alert('Interacción registrada en la bitácora del cliente');
    } catch (err) {
      alert(err.message || 'Error al registrar interacción');
    } finally {
      setGuardandoInteraccion(false);
    }
  };

  const contactosFiltrados = contactos.filter((c) => {
    const q = busqueda.toLowerCase();
    const nombreCompleto = `${c.nombres} ${c.apellido || ''} ${c.razonSocial || ''}`.toLowerCase();
    return nombreCompleto.includes(q) || (c.numeroDni && c.numeroDni.includes(q));
  });

  const handleExportarCSV = () => {
    const data = contactosFiltrados.map((c) => ({
      ID: c.id,
      Tipo_Persona: c.tipoPersona,
      Nombre_RazonSocial: c.tipoPersona === 'JURIDICA' ? c.razonSocial : `${c.nombres} ${c.apellido || ''}`.trim(),
      Documento_DNI_CUIT: c.numeroDni || '',
      Telefono: c.telefono || '',
      Email: c.email || '',
      Fecha_Alta: c.fechaCreacion ? new Date(c.fechaCreacion).toLocaleDateString('es-AR') : '',
    }));
    exportToCSV('padron_contactos_clientes', data);
  };

  return (
    <div className="p-8 space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Padrón de Contactos y Clientes</h2>
          <p className="text-xs text-slate-400 mt-0.5">Gestión unificada de prospectos, compradores y empresas.</p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExportarCSV}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            title="Descargar padrón en formato CSV para Excel"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => setModalAbierto(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Contacto</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 w-full max-w-md">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, apellido, razón social o DNI..."
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Tipo</th>
                <th className="py-3.5 px-4 font-semibold">Nombre / Razón Social</th>
                <th className="py-3.5 px-4 font-semibold">DNI / CUIT</th>
                <th className="py-3.5 px-4 font-semibold">Contacto</th>
                <th className="py-3.5 px-4 font-semibold">Rol</th>
                <th className="py-3.5 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {cargando ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">Cargando contactos...</td>
                </tr>
              ) : contactosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">No se encontraron contactos registrados.</td>
                </tr>
              ) : (
                contactosFiltrados.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4">
                      {c.tipoPersona === 'JURIDICA' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold">
                          <Building2 className="w-3 h-3" /> Jurídica
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                          <User className="w-3 h-3" /> Física
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white">
                      {c.tipoPersona === 'JURIDICA' ? (
                        <div>
                          <p className="font-semibold text-white">{c.razonSocial}</p>
                          <p className="text-[11px] text-slate-400">Contacto: {c.nombres}</p>
                        </div>
                      ) : (
                        `${c.nombres} ${c.apellido || ''}`
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                      {c.numeroDni || 'S/D'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <p className="text-slate-300 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-500" /> {c.telefono || 'Sin teléfono'}
                        </p>
                        {c.email && (
                          <p className="text-slate-500 flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-600" /> {c.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        {c.roles?.[0]?.rol?.descripcionRol || 'Cliente'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setModalInteraccion(c)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-medium border border-slate-700 transition inline-flex items-center gap-1"
                        title="Registrar llamada o mensaje"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Seguimiento</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Contacto */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="text-base font-bold text-white">Alta de Nuevo Contacto</h3>
              <button onClick={() => setModalAbierto(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorForm && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {errorForm}
              </div>
            )}

            <form onSubmit={handleCrearContacto} className="space-y-4">
              {/* Selector Tipo Persona */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setTipoPersona('FISICA')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition flex items-center justify-center gap-1.5 ${
                    tipoPersona === 'FISICA'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <User className="w-3.5 h-3.5" /> Persona Física
                </button>
                <button
                  type="button"
                  onClick={() => setTipoPersona('JURIDICA')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition flex items-center justify-center gap-1.5 ${
                    tipoPersona === 'JURIDICA'
                      ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" /> Persona Jurídica
                </button>
              </div>

              {tipoPersona === 'JURIDICA' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Razón Social *</label>
                  <input
                    type="text"
                    required
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    placeholder="Transportes San Martín S.R.L."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {tipoPersona === 'JURIDICA' ? 'Nombre Apoderado *' : 'Nombre *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Juan"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                {tipoPersona === 'FISICA' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Apellido *</label>
                    <input
                      type="text"
                      required
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      placeholder="Pérez"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {tipoPersona === 'JURIDICA' ? 'CUIT *' : 'DNI *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    placeholder={tipoPersona === 'JURIDICA' ? '30-71234567-8' : '38123456'}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono *</label>
                  <input
                    type="text"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="3764123456"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@gmail.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
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
                  {guardando ? 'Guardando...' : 'Crear Contacto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Interacción */}
      {modalInteraccion && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white">Registrar Seguimiento Comercial</h3>
              <button onClick={() => setModalInteraccion(null)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Cliente: <strong className="text-white">{modalInteraccion.nombres} {modalInteraccion.apellido || modalInteraccion.razonSocial}</strong>
            </p>

            <form onSubmit={handleCrearInteraccion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Canal de Contacto</label>
                <select
                  value={canal}
                  onChange={(e) => setCanal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="LLAMADA">Llamada Telefónica</option>
                  <option value="VISITA_SALON">Visita al Salón</option>
                  <option value="EMAIL">Correo Electrónico</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Resumen de la Conversación</label>
                <textarea
                  rows="3"
                  required
                  value={resumenInteraccion}
                  onChange={(e) => setResumenInteraccion(e.target.value)}
                  placeholder="Detallar lo acordado con el cliente..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalInteraccion(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoInteraccion}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 disabled:opacity-50"
                >
                  {guardandoInteraccion ? 'Guardando...' : 'Guardar Interacción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
