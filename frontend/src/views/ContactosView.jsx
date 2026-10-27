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
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Padrón de Contactos y Clientes</h2>
          <p className="text-xs text-gray-500 mt-0.5">Gestión unificada de prospectos, compradores y empresas.</p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExportarCSV}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-2xs"
            title="Descargar padrón en formato CSV para Excel"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => setModalAbierto(true)}
            className="px-4 py-2 bg-[#18181b] hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Contacto</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white border border-gray-200/90 rounded-xl px-3.5 py-2 w-full max-w-md shadow-2xs">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, apellido, razón social o DNI..."
          className="w-full bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
      </div>

      {/* Table Container */}
      <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-4">Nombre / Razón Social</th>
                <th className="py-3.5 px-4">DNI / CUIT</th>
                <th className="py-3.5 px-4">Contacto</th>
                <th className="py-3.5 px-4">Rol</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">Cargando contactos...</td>
                </tr>
              ) : contactosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">No se encontraron contactos registrados.</td>
                </tr>
              ) : (
                contactosFiltrados.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3.5 px-4">
                      {c.tipoPersona === 'JURIDICA' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold">
                          <Building2 className="w-3 h-3" /> Jurídica
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                          <User className="w-3 h-3" /> Física
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-900">
                      {c.tipoPersona === 'JURIDICA' ? (
                        <div>
                          <p className="font-semibold text-gray-900">{c.razonSocial}</p>
                          <p className="text-[11px] text-gray-500">Contacto: {c.nombres}</p>
                        </div>
                      ) : (
                        `${c.nombres} ${c.apellido || ''}`
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 font-mono text-[11px]">
                      {c.numeroDni || 'S/D'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <p className="text-gray-700 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-gray-400" /> {c.telefono || 'Sin teléfono'}
                        </p>
                        {c.email && (
                          <p className="text-gray-500 flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-gray-400" /> {c.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                        {c.roles?.[0]?.rol?.descripcionRol || 'Cliente'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setModalInteraccion(c)}
                        className="px-2.5 py-1 rounded-xl bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium border border-gray-200 transition inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                        title="Registrar llamada o mensaje"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <h3 className="text-base font-bold text-gray-900">Alta de Nuevo Contacto</h3>
              <button onClick={() => setModalAbierto(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorForm && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorForm}
              </div>
            )}

            <form onSubmit={handleCrearContacto} className="space-y-4">
              {/* Selector Tipo Persona */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setTipoPersona('FISICA')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    tipoPersona === 'FISICA'
                      ? 'bg-[#18181b] border-[#18181b] text-white shadow-xs'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <User className="w-3.5 h-3.5" /> Persona Física
                </button>
                <button
                  type="button"
                  onClick={() => setTipoPersona('JURIDICA')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    tipoPersona === 'JURIDICA'
                      ? 'bg-[#18181b] border-[#18181b] text-white shadow-xs'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" /> Persona Jurídica
                </button>
              </div>

              {tipoPersona === 'JURIDICA' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Razón Social *</label>
                  <input
                    type="text"
                    required
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    placeholder="Transportes San Martín S.R.L."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {tipoPersona === 'JURIDICA' ? 'Nombre Apoderado *' : 'Nombre *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Juan"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
                {tipoPersona === 'FISICA' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Apellido *</label>
                    <input
                      type="text"
                      required
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      placeholder="Pérez"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {tipoPersona === 'JURIDICA' ? 'CUIT *' : 'DNI *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    placeholder={tipoPersona === 'JURIDICA' ? '30-71234567-8' : '38123456'}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Teléfono *</label>
                  <input
                    type="text"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="3764123456"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@gmail.com"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
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
                  {guardando ? 'Guardando...' : 'Crear Contacto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Interacción */}
      {modalInteraccion && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200/80 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-sm font-bold text-gray-900">Registrar Seguimiento Comercial</h3>
              <button onClick={() => setModalInteraccion(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4">
              Cliente: <strong className="text-gray-900">{modalInteraccion.nombres} {modalInteraccion.apellido || modalInteraccion.razonSocial}</strong>
            </p>

            <form onSubmit={handleCrearInteraccion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Canal de Contacto</label>
                <select
                  value={canal}
                  onChange={(e) => setCanal(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
                >
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="LLAMADA">Llamada Telefónica</option>
                  <option value="VISITA_SALON">Visita al Salón</option>
                  <option value="EMAIL">Correo Electrónico</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Resumen de la Conversación</label>
                <textarea
                  rows="3"
                  required
                  value={resumenInteraccion}
                  onChange={(e) => setResumenInteraccion(e.target.value)}
                  placeholder="Detallar lo acordado con el cliente..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalInteraccion(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoInteraccion}
                  className="px-4 py-2 bg-[#18181b] hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
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
