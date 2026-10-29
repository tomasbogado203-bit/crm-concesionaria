import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import {
  Users,
  Plus,
  Search,
  Building2,
  User,
  Phone,
  Mail,
  MessageSquare,
  X,
  Download,
  Send,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Bot,
  Zap,
} from 'lucide-react';
import { exportToCSV } from '../utils/exportCsv';

// Helper para formatear número para WhatsApp
const normalizarNumeroWhatsApp = (numero) => {
  if (!numero) return '';
  let limpio = numero.replace(/\D/g, '');
  // Si empieza con 0, sacarlo (ej: 0376... -> 376...)
  if (limpio.startsWith('0')) limpio = limpio.substring(1);
  // Si no tiene código de país (Argentina 549), agregarlo si tiene 10 dígitos
  if (limpio.length === 10) {
    limpio = '549' + limpio;
  } else if (limpio.startsWith('54') && !limpio.startsWith('549')) {
    limpio = '549' + limpio.substring(2);
  }
  return limpio;
};

// Plantillas de correo preconfiguradas
const PLANTILLAS_CORREO = [
  {
    id: 'BIENVENIDA',
    titulo: 'Bienvenida e Interés',
    asunto: '¡Gracias por contactar a Auto CRM Concesionaria!',
    mensaje:
      'Hola {NOMBRE},\n\nMuchas gracias por tu interés en nuestros vehículos. Muy pronto un asesor comercial especializado se pondrá en contacto para brindarte atención personalizada y resolver todas tus dudas.\n\nSaludos cordiales,\nEquipo de Ventas - Auto CRM',
  },
  {
    id: 'COTIZACION',
    titulo: 'Ficha y Opciones de Financiación',
    asunto: 'Propuesta Comercial y Financiación de Vehículo',
    mensaje:
      'Hola {NOMBRE},\n\nTe adjuntamos información de los modelos disponibles y las opciones de crédito prendario / permuta disponibles este mes para facilitarte la compra de tu próximo auto.\n\nQuedamos a tu disposición para coordinar una reunión.\n\nSaludos cordiales,\nAuto CRM Concesionaria',
  },
  {
    id: 'TEST_DRIVE',
    titulo: 'Invitación a Test Drive',
    asunto: 'Invitación exclusiva: Viví la experiencia de manejo',
    mensaje:
      'Hola {NOMBRE},\n\nTe invitamos a visitar nuestro salón comercial para realizar una prueba de manejo (Test Drive) sin compromiso en la unidad que estás buscando.\n\nConfirmamos tu disponibilidad y te reservamos un turno exclusivo.\n\nSaludos cordiales,\nEquipo Comercial',
  },
  {
    id: 'LIBRE',
    titulo: 'Mensaje Personalizado',
    asunto: 'Consulta desde Concesionaria Oficial',
    mensaje: '',
  },
];

// Plantillas de WhatsApp
const PLANTILLAS_WHATSAPP = [
  {
    id: 'SALUDO',
    titulo: 'Saludo Inicial',
    texto:
      'Hola {NOMBRE}, ¿cómo estás? Te escribo de la Concesionaria Oficial por tu consulta. ¿En qué vehículo estás interesado/a?',
  },
  {
    id: 'TEST_DRIVE',
    titulo: 'Coordinar Test Drive',
    texto:
      'Hola {NOMBRE}, tenemos unidades disponibles para que vengas a hacer una prueba de manejo hoy o mañana. ¿Te gustaría coordinar un turno?',
  },
  {
    id: 'FINANCIACION',
    titulo: 'Oferta y Financiación',
    texto:
      'Hola {NOMBRE}, tenemos tasas preferenciales y tomamos tu usado como parte de pago. Avisame y te armo una propuesta a medida.',
  },
];

export const ContactosView = () => {
  const [contactos, setContactos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  // Modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalInteraccion, setModalInteraccion] = useState(null);
  const [modalEmail, setModalEmail] = useState(null); // Contacto seleccionado para email
  const [modalWhatsApp, setModalWhatsApp] = useState(null); // Contacto seleccionado para WhatsApp

  // Notificaciones
  const [notificacion, setNotificacion] = useState(null);

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

  // Formulario interacción general
  const [canal, setCanal] = useState('WHATSAPP');
  const [resumenInteraccion, setResumenInteraccion] = useState('');
  const [guardandoInteraccion, setGuardandoInteraccion] = useState(false);

  // Formulario modal Email
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState('BIENVENIDA');
  const [asuntoEmail, setAsuntoEmail] = useState('');
  const [cuerpoEmail, setCuerpoEmail] = useState('');
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [errorEmail, setErrorEmail] = useState(null);

  // Formulario modal WhatsApp
  const [plantillaWaSeleccionada, setPlantillaWaSeleccionada] = useState('SALUDO');
  const [mensajeWhatsApp, setMensajeWhatsApp] = useState('');

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

  const mostrarNotificacion = (tipo, mensaje) => {
    setNotificacion({ tipo, mensaje });
    setTimeout(() => setNotificacion(null), 4500);
  };

  // Abrir modal de Email y cargar plantilla inicial
  const abrirModalEmail = (c) => {
    const nombreCliente = c.tipoPersona === 'JURIDICA' ? (c.razonSocial || c.nombres) : c.nombres;
    const plantilla = PLANTILLAS_CORREO[0];
    setModalEmail(c);
    setPlantillaSeleccionada('BIENVENIDA');
    setAsuntoEmail(plantilla.asunto);
    setCuerpoEmail(plantilla.mensaje.replace('{NOMBRE}', nombreCliente));
    setErrorEmail(null);
  };

  const cambiarPlantillaEmail = (id) => {
    setPlantillaSeleccionada(id);
    const p = PLANTILLAS_CORREO.find((item) => item.id === id);
    if (p && modalEmail) {
      const nombreCliente =
        modalEmail.tipoPersona === 'JURIDICA'
          ? (modalEmail.razonSocial || modalEmail.nombres)
          : modalEmail.nombres;
      setAsuntoEmail(p.asunto);
      setCuerpoEmail(p.mensaje.replace(/{NOMBRE}/g, nombreCliente));
    }
  };

  // Abrir modal WhatsApp
  const abrirModalWhatsApp = (c) => {
    const nombreCliente = c.tipoPersona === 'JURIDICA' ? (c.razonSocial || c.nombres) : c.nombres;
    const plantilla = PLANTILLAS_WHATSAPP[0];
    setModalWhatsApp(c);
    setPlantillaWaSeleccionada('SALUDO');
    setMensajeWhatsApp(plantilla.texto.replace('{NOMBRE}', nombreCliente));
  };

  const cambiarPlantillaWhatsApp = (id) => {
    setPlantillaWaSeleccionada(id);
    const p = PLANTILLAS_WHATSAPP.find((item) => item.id === id);
    if (p && modalWhatsApp) {
      const nombreCliente =
        modalWhatsApp.tipoPersona === 'JURIDICA'
          ? (modalWhatsApp.razonSocial || modalWhatsApp.nombres)
          : modalWhatsApp.nombres;
      setMensajeWhatsApp(p.texto.replace(/{NOMBRE}/g, nombreCliente));
    }
  };

  // Enviar mensaje por WhatsApp y registrar interacción automáticamente
  const dispararWhatsApp = async (registrarBitacora = true) => {
    if (!modalWhatsApp || !modalWhatsApp.telefono) return;

    const numLimpio = normalizarNumeroWhatsApp(modalWhatsApp.telefono);
    const textoCodificado = encodeURIComponent(mensajeWhatsApp);
    const url = `https://wa.me/${numLimpio}?text=${textoCodificado}`;

    // Abrir WhatsApp en nueva pestaña
    window.open(url, '_blank');

    if (registrarBitacora) {
      try {
        await apiFetch(`/clientes/${modalWhatsApp.id}/interacciones`, {
          method: 'POST',
          body: JSON.stringify({
            canal: 'WHATSAPP',
            resumen: `Mensaje WhatsApp enviado: "${mensajeWhatsApp}"`,
          }),
        });
        mostrarNotificacion('exito', 'Chat de WhatsApp iniciado y registrado en la bitácora del cliente');
      } catch (err) {
        console.error('Error registrando interacción de WhatsApp:', err);
      }
    }

    setModalWhatsApp(null);
  };

  // Enviar correo vía API / Automatización N8N
  const handleEnviarCorreo = async (e) => {
    e.preventDefault();
    if (!modalEmail) return;

    setErrorEmail(null);
    setEnviandoEmail(true);

    try {
      await apiFetch(`/clientes/${modalEmail.id}/enviar-correo`, {
        method: 'POST',
        body: JSON.stringify({
          asunto: asuntoEmail,
          mensaje: cuerpoEmail,
          plantilla: plantillaSeleccionada,
        }),
      });

      mostrarNotificacion(
        'exito',
        `Correo procesado para ${modalEmail.email}. Si N8N está activo, la automatización disparará el envío.`
      );
      setModalEmail(null);
    } catch (err) {
      setErrorEmail(err.message || 'Error al enviar el correo');
    } finally {
      setEnviandoEmail(false);
    }
  };

  // Abrir cliente de correo tradicional (mailto)
  const abrirMailto = () => {
    if (!modalEmail || !modalEmail.email) return;
    const mailtoUrl = `mailto:${modalEmail.email}?subject=${encodeURIComponent(
      asuntoEmail
    )}&body=${encodeURIComponent(cuerpoEmail)}`;
    window.open(mailtoUrl, '_blank');
  };

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
      setNombre('');
      setApellido('');
      setRazonSocial('');
      setDocumento('');
      setTelefono('');
      setEmail('');
      mostrarNotificacion('exito', 'Contacto creado exitosamente en el padrón');
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
      mostrarNotificacion('exito', 'Seguimiento registrado en la bitácora 360 del cliente');
    } catch (err) {
      alert(err.message || 'Error al registrar interacción');
    } finally {
      setGuardandoInteraccion(false);
    }
  };

  const contactosFiltrados = contactos.filter((c) => {
    const q = busqueda.toLowerCase();
    const nombreCompleto = `${c.nombres} ${c.apellido || ''} ${c.razonSocial || ''}`.toLowerCase();
    return (
      nombreCompleto.includes(q) ||
      (c.numeroDni && c.numeroDni.includes(q)) ||
      (c.telefono && c.telefono.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  const handleExportarCSV = () => {
    const data = contactosFiltrados.map((c) => ({
      ID: c.id,
      Tipo_Persona: c.tipoPersona,
      Nombre_RazonSocial:
        c.tipoPersona === 'JURIDICA' ? c.razonSocial : `${c.nombres} ${c.apellido || ''}`.trim(),
      Documento_DNI_CUIT: c.numeroDni || '',
      Telefono: c.telefono || '',
      Email: c.email || '',
      Fecha_Alta: c.fechaCreacion ? new Date(c.fechaCreacion).toLocaleDateString('es-AR') : '',
    }));
    exportToCSV('padron_contactos_clientes', data);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Banner de Notificación */}
      {notificacion && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-xs transition-all ${
            notificacion.tipo === 'exito'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notificacion.tipo === 'exito' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{notificacion.mensaje}</span>
          </div>
          <button
            onClick={() => setNotificacion(null)}
            className="text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Padrón de Contactos y Clientes</h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-200">
              <Zap className="w-3 h-3 text-violet-600" /> N8N Automation Ready
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Gestión de prospectos con botones directos para WhatsApp, envío de correos y automatización con N8N.
          </p>
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
          placeholder="Buscar por nombre, apellido, razón social, DNI o teléfono..."
          className="w-full bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
      </div>

      {/* Table Container */}
      <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f9fa] border-b border-gray-200/80 text-gray-400 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-4">Nombre / Razón Social</th>
                <th className="py-3.5 px-4">DNI / CUIT</th>
                <th className="py-3.5 px-4">Contacto Directo</th>
                <th className="py-3.5 px-4">Rol</th>
                <th className="py-3.5 px-4 text-right">Acciones Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">
                    Cargando contactos...
                  </td>
                </tr>
              ) : contactosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">
                    No se encontraron contactos registrados.
                  </td>
                </tr>
              ) : (
                contactosFiltrados.map((c) => {
                  const nombreDisplay =
                    c.tipoPersona === 'JURIDICA'
                      ? c.razonSocial || c.nombres
                      : `${c.nombres} ${c.apellido || ''}`.trim();
                  const tieneTelefono = Boolean(c.telefono);
                  const tieneEmail = Boolean(c.email);

                  return (
                    <tr key={c.id} className="hover:bg-gray-50/80 transition">
                      {/* Tipo */}
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

                      {/* Nombre */}
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        {c.tipoPersona === 'JURIDICA' ? (
                          <div>
                            <p className="font-semibold text-gray-900">{c.razonSocial}</p>
                            <p className="text-[11px] text-gray-500">Contacto: {c.nombres}</p>
                          </div>
                        ) : (
                          <span className="font-semibold">{nombreDisplay}</span>
                        )}
                      </td>

                      {/* Documento */}
                      <td className="py-3.5 px-4 text-gray-600 font-mono text-[11px]">
                        {c.numeroDni || 'S/D'}
                      </td>

                      {/* Contacto Directo */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          {tieneTelefono ? (
                            <button
                              onClick={() => abrirModalWhatsApp(c)}
                              className="group flex items-center gap-1.5 text-gray-700 hover:text-emerald-700 transition cursor-pointer text-left"
                              title="Click para abrir WhatsApp con este contacto"
                            >
                              <div className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition border border-emerald-200 shrink-0">
                                <MessageSquare className="w-3 h-3" />
                              </div>
                              <span className="font-mono text-[11px] group-hover:underline">
                                {c.telefono}
                              </span>
                            </button>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">Sin teléfono</span>
                          )}

                          {tieneEmail ? (
                            <button
                              onClick={() => abrirModalEmail(c)}
                              className="group flex items-center gap-1.5 text-gray-600 hover:text-blue-700 transition cursor-pointer text-left"
                              title="Click para enviar correo a este contacto"
                            >
                              <div className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition border border-blue-200 shrink-0">
                                <Mail className="w-3 h-3" />
                              </div>
                              <span className="text-[11px] group-hover:underline">{c.email}</span>
                            </button>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">Sin correo</span>
                          )}
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                          {c.roles?.[0]?.rol?.descripcionRol || 'Cliente'}
                        </span>
                      </td>

                      {/* Acciones Rápidas */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Botón WhatsApp */}
                          <button
                            onClick={() => abrirModalWhatsApp(c)}
                            disabled={!tieneTelefono}
                            className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition inline-flex items-center gap-1.5 shadow-2xs ${
                              tieneTelefono
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 cursor-pointer'
                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                            }`}
                            title={tieneTelefono ? 'Abrir chat de WhatsApp' : 'Contacto sin número de teléfono'}
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>WhatsApp</span>
                          </button>

                          {/* Botón Enviar Correo */}
                          <button
                            onClick={() => abrirModalEmail(c)}
                            disabled={!tieneEmail}
                            className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition inline-flex items-center gap-1.5 shadow-2xs ${
                              tieneEmail
                                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 cursor-pointer'
                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                            }`}
                            title={tieneEmail ? 'Enviar correo electrónico' : 'Contacto sin dirección de email'}
                          >
                            <Mail className="w-3.5 h-3.5 text-blue-600" />
                            <span>Email</span>
                          </button>

                          {/* Botón Seguimiento Bitácora */}
                          <button
                            onClick={() => setModalInteraccion(c)}
                            className="px-2.5 py-1 rounded-xl bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium border border-gray-200 transition inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            title="Registrar llamada, visita a salón u otra nota"
                          >
                            <Phone className="w-3 h-3 text-gray-500" />
                            <span>Seguimiento</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Enviar Correo (Automatización N8N y Correo Directo) */}
      {modalEmail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shadow-xs">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 tracking-tight">Redactar Correo al Cliente</h3>
                  <p className="text-[11px] text-gray-500">Conexión con automatización N8N y bitácora del CRM</p>
                </div>
              </div>
              <button
                onClick={() => setModalEmail(null)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorEmail && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorEmail}</span>
              </div>
            )}

            {/* Datos del Destinatario */}
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 mb-4 flex items-center justify-between text-xs">
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-semibold block">Destinatario</span>
                <span className="font-semibold text-gray-900">
                  {modalEmail.tipoPersona === 'JURIDICA'
                    ? modalEmail.razonSocial || modalEmail.nombres
                    : `${modalEmail.nombres} ${modalEmail.apellido || ''}`.trim()}
                </span>
              </div>
              <div className="text-right font-mono text-gray-600 text-[11px] bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                {modalEmail.email}
              </div>
            </div>

            {/* Plantillas Rápidas */}
            <div className="mb-4">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Plantilla Rápida
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PLANTILLAS_CORREO.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => cambiarPlantillaEmail(p.id)}
                    className={`py-1.5 px-2.5 text-xs rounded-xl border text-left transition cursor-pointer font-medium ${
                      plantillaSeleccionada === p.id
                        ? 'bg-[#18181b] border-[#18181b] text-white shadow-xs'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {p.titulo}
                  </button>
                ))}
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleEnviarCorreo} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Asunto *</label>
                <input
                  type="text"
                  required
                  value={asuntoEmail}
                  onChange={(e) => setAsuntoEmail(e.target.value)}
                  placeholder="Asunto del correo..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Cuerpo del Mensaje *</label>
                <textarea
                  rows="5"
                  required
                  value={cuerpoEmail}
                  onChange={(e) => setCuerpoEmail(e.target.value)}
                  placeholder="Escribí el contenido del correo..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 custom-scrollbar"
                ></textarea>
              </div>

              {/* Banner N8N */}
              <div className="p-3 bg-violet-50/70 border border-violet-200 rounded-xl text-[11px] text-violet-800 flex items-start gap-2">
                <Bot className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Al enviar, el sistema registra la interacción como <strong>EMAIL</strong> y notifica al webhook de{' '}
                  <strong>N8N</strong> para la automatización de la entrega.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={abrirMailto}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition cursor-pointer"
                  title="Abrir tu aplicación de correo local (Outlook/Gmail) con estos datos"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir en mi correo (mailto)</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalEmail(null)}
                    className="px-3.5 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={enviandoEmail}
                    className="px-4 py-2 bg-[#18181b] hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{enviandoEmail ? 'Despachando...' : 'Enviar y Registrar'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: WhatsApp Directo */}
      {modalWhatsApp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-xs">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 tracking-tight">Iniciar Conversación por WhatsApp</h3>
                  <p className="text-[11px] text-gray-500">Apertura directa con saludo preconfigurado</p>
                </div>
              </div>
              <button
                onClick={() => setModalWhatsApp(null)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Datos del contacto */}
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 mb-4 flex items-center justify-between text-xs">
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-semibold block">Cliente</span>
                <span className="font-semibold text-gray-900">
                  {modalWhatsApp.tipoPersona === 'JURIDICA'
                    ? modalWhatsApp.razonSocial || modalWhatsApp.nombres
                    : `${modalWhatsApp.nombres} ${modalWhatsApp.apellido || ''}`.trim()}
                </span>
              </div>
              <div className="font-mono text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                +{normalizarNumeroWhatsApp(modalWhatsApp.telefono)}
              </div>
            </div>

            {/* Plantillas de WhatsApp */}
            <div className="mb-4">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Mensaje Sugerido
              </label>
              <div className="flex flex-col gap-1.5">
                {PLANTILLAS_WHATSAPP.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => cambiarPlantillaWhatsApp(p.id)}
                    className={`py-1.5 px-3 text-xs rounded-xl border text-left transition cursor-pointer ${
                      plantillaWaSeleccionada === p.id
                        ? 'bg-emerald-600 border-emerald-600 text-white font-medium shadow-xs'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {p.titulo}
                  </button>
                ))}
              </div>
            </div>

            {/* Texto del mensaje */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Contenido a Enviar</label>
              <textarea
                rows="4"
                value={mensajeWhatsApp}
                onChange={(e) => setMensajeWhatsApp(e.target.value)}
                placeholder="Escribí el mensaje para WhatsApp..."
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalWhatsApp(null)}
                className="px-3.5 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => dispararWhatsApp(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Abrir WhatsApp y Registrar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Registrar Interacción / Seguimiento */}
      {modalInteraccion && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200/80 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-sm font-bold text-gray-900">Registrar Seguimiento Comercial</h3>
              <button
                onClick={() => setModalInteraccion(null)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4">
              Cliente:{' '}
              <strong className="text-gray-900">
                {modalInteraccion.nombres}{' '}
                {modalInteraccion.apellido || modalInteraccion.razonSocial}
              </strong>
            </p>

            <form onSubmit={handleCrearInteraccion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Canal de Contacto
                </label>
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
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Resumen de la Conversación
                </label>
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

      {/* MODAL 4: Nuevo Contacto */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <h3 className="text-base font-bold text-gray-900">Alta de Nuevo Contacto</h3>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorForm && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorForm}
              </div>
            )}

            <form onSubmit={handleCrearContacto} className="space-y-4">
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
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Razón Social *
                  </label>
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
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Apellido *
                    </label>
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
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Teléfono *
                  </label>
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Correo Electrónico
                </label>
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
    </div>
  );
};
