import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import {
  Receipt,
  Plus,
  Search,
  DollarSign,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  X,
  ArrowRight,
  ShieldCheck,
  Ban,
  Printer,
  Download,
  QrCode,
  Building2,
} from 'lucide-react';
import { exportToCSV } from '../utils/exportCsv';

export const FacturacionView = () => {
  const [facturas, setFacturas] = useState([]);
  const [oportunidadesGanadas, setOportunidadesGanadas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [tabActivo, setTabActivo] = useState('EMITIDAS'); // 'EMITIDAS' | 'PENDIENTES'
  const [modalCobro, setModalCobro] = useState(null); // Factura seleccionada para cobrar
  const [modalDetalle, setModalDetalle] = useState(null);

  // Form Cobro
  const [metodoPago, setMetodoPago] = useState('TRANSFERENCIA');
  const [montoCobro, setMontoCobro] = useState('');
  const [nroComprobante, setNroComprobante] = useState('');
  const [guardandoCobro, setGuardandoCobro] = useState(false);

  // Form Emitir Factura directa
  const [modalEmitir, setModalEmitir] = useState(null); // Oportunidad a facturar
  const [tipoComprobante, setTipoComprobante] = useState('FACTURA_B');
  const [guardandoEmision, setGuardandoEmision] = useState(false);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [facts, opos] = await Promise.all([
        apiFetch('/facturas'),
        apiFetch('/oportunidades').catch(() => []),
      ]);

      setFacturas(facts);
      // Oportunidades ganadas que aún no tengan factura
      const facturadasOpoIds = facts.map((f) => f.oportunidadId).filter(Boolean);
      const pendientes = opos.filter(
        (o) => (o.etapa === 'GANADA' || o.etapa === 'RESERVADO') && !facturadasOpoIds.includes(o.id)
      );
      setOportunidadesGanadas(pendientes);
    } catch (err) {
      console.error('Error cargando facturas:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleEmitirFactura = async (e) => {
    e.preventDefault();
    if (!modalEmitir) return;
    setGuardandoEmision(true);

    try {
      await apiFetch('/facturas', {
        method: 'POST',
        body: JSON.stringify({
          oportunidadId: modalEmitir.id,
          clienteId: modalEmitir.clienteId,
          tipoComprobante,
          puntoVenta: '0001',
          items: [
            {
              vehiculoId: modalEmitir.vehiculoId,
              descripcion: `Vehículo ${modalEmitir.vehiculo?.marca} ${modalEmitir.vehiculo?.modelo} ${modalEmitir.vehiculo?.version} (Chasis: ${modalEmitir.vehiculo?.vin})`,
              cantidad: 1,
              precioUnitario: Number(modalEmitir.montoEstimado),
            },
          ],
        }),
      });

      setModalEmitir(null);
      setTabActivo('EMITIDAS');
      cargarDatos();
    } catch (err) {
      alert(err.message || 'Error al emitir factura');
    } finally {
      setGuardandoEmision(false);
    }
  };

  const handleRegistrarPago = async (e) => {
    e.preventDefault();
    if (!modalCobro) return;
    setGuardandoCobro(true);

    try {
      await apiFetch(`/facturas/${modalCobro.id}/pagos`, {
        method: 'POST',
        body: JSON.stringify({
          metodoPago,
          monto: Number(montoCobro),
          nroComprobante: nroComprobante || undefined,
        }),
      });

      setModalCobro(null);
      setMontoCobro('');
      setNroComprobante('');
      cargarDatos();
    } catch (err) {
      alert(err.message || 'Error al registrar cobro');
    } finally {
      setGuardandoCobro(false);
    }
  };

  const handleAnular = async (id) => {
    if (!window.confirm('¿Seguro que deseas anular esta factura fiscal? El vehículo regresará automáticamente al stock disponible.')) {
      return;
    }
    try {
      await apiFetch(`/facturas/${id}/anular`, { method: 'PATCH' });
      cargarDatos();
    } catch (err) {
      alert(err.message || 'Error al anular factura');
    }
  };

  const handleExportarCSV = () => {
    const data = facturas.map((f) => {
      const cobrado = f.pagos?.reduce((acc, p) => acc + Number(p.monto), 0) || 0;
      const saldo = Math.max(0, Number(f.total) - cobrado);
      return {
        Comprobante: `${f.tipoComprobante} ${f.puntoVenta}-${f.numeroComprobante}`,
        CAE_AFIP: f.caeAfip || 'Sin CAE',
        Cliente: `${f.cliente?.nombres || ''} ${f.cliente?.apellido || f.cliente?.razonSocial || ''}`.trim(),
        DNI_CUIT: f.cliente?.numeroDni || '',
        Fecha_Emision: new Date(f.fechaEmision).toLocaleDateString('es-AR'),
        Total: f.total,
        Cobrado: cobrado,
        Saldo: saldo,
        Estado: f.estado,
      };
    });
    exportToCSV('libro_iva_ventas_facturas', data);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Facturación Electrónica y Cobranzas</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Emisión de comprobantes con CAE AFIP y gestión de cobros multiforma (contado, prendario, permuta).
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {tabActivo === 'EMITIDAS' && facturas.length > 0 && (
            <button
              onClick={handleExportarCSV}
              className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-2xs"
              title="Descargar libro de IVA Ventas en formato CSV para Excel"
            >
              <Download className="w-4 h-4 text-gray-500" />
              <span>Exportar CSV</span>
            </button>
          )}

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 p-1 rounded-xl">
            <button
              onClick={() => setTabActivo('EMITIDAS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                tabActivo === 'EMITIDAS'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Libro de Ventas ({facturas.length})
            </button>
            <button
              onClick={() => setTabActivo('PENDIENTES')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                tabActivo === 'PENDIENTES'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>Listas para Facturar</span>
              {oportunidadesGanadas.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#18181b] text-white font-bold text-[10px] flex items-center justify-center">
                  {oportunidadesGanadas.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: Facturas Emitidas */}
      {tabActivo === 'EMITIDAS' && (
        <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Comprobante</th>
                  <th className="py-3.5 px-4">CAE AFIP</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Cobrado / Saldo</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cargando ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-gray-500">Cargando comprobantes...</td>
                  </tr>
                ) : facturas.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-gray-500">
                      No hay facturas emitidas aún. Pasa a la pestaña "Listas para Facturar" para emitir la primera.
                    </td>
                  </tr>
                ) : (
                  facturas.map((f) => {
                    const cobrado = f.pagos?.reduce((acc, p) => acc + Number(p.monto), 0) || 0;
                    const saldo = Math.max(0, Number(f.total) - cobrado);

                    return (
                      <tr key={f.id} className="hover:bg-gray-50/80 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                          <span className="text-gray-900">{f.tipoComprobante}</span> {f.puntoVenta}-{f.numeroComprobante}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-gray-500">
                          {f.caeAfip || 'Sin CAE'}
                        </td>
                        <td className="py-3.5 px-4 text-gray-900 font-medium">
                          {f.cliente?.nombres} {f.cliente?.apellido || f.cliente?.razonSocial}
                          <span className="block text-[10px] text-gray-400 font-mono">DNI/CUIT: {f.cliente?.numeroDni}</span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          {new Date(f.fechaEmision).toLocaleDateString('es-AR')}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-900 font-mono">
                          ${Number(f.total).toLocaleString('es-AR')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-emerald-600 font-bold block">${cobrado.toLocaleString('es-AR')}</span>
                          {saldo > 0 ? (
                            <span className="text-amber-700 text-[10px] font-medium">Resta: ${saldo.toLocaleString('es-AR')}</span>
                          ) : (
                            <span className="text-gray-400 text-[10px]">Saldado (100%)</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {f.estado === 'PAGADA' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                              PAGADA
                            </span>
                          ) : f.estado === 'EMITIDA' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                              PENDIENTE COBRO
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold">
                              ANULADA
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {f.estado !== 'ANULADA' && f.estado !== 'PAGADA' && (
                              <button
                                onClick={() => {
                                  setModalCobro(f);
                                  setMontoCobro(saldo);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#18181b] hover:bg-black text-white text-[11px] font-semibold transition flex items-center gap-1 shadow-xs cursor-pointer"
                              >
                                <DollarSign className="w-3.5 h-3.5" /> Cobrar
                              </button>
                            )}
                            <button
                              onClick={() => setModalDetalle(f)}
                              className="px-2.5 py-1 rounded-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-[11px] transition shadow-2xs cursor-pointer"
                            >
                              Ver
                            </button>
                            {f.estado !== 'ANULADA' && (
                              <button
                                onClick={() => handleAnular(f.id)}
                                className="p-1 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition cursor-pointer"
                                title="Anular factura y devolver vehículo a stock"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
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
      )}

      {/* TAB 2: Oportunidades Listas para Facturar */}
      {tabActivo === 'PENDIENTES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {oportunidadesGanadas.length === 0 ? (
            <div className="col-span-3 bg-white border border-gray-200/80 rounded-2xl p-12 text-center text-gray-500 shadow-xs">
              No hay oportunidades reservadas ni ganadas pendientes de emisión.
            </div>
          ) : (
            oportunidadesGanadas.map((op) => (
              <div
                key={op.id}
                className="bg-white border border-gray-200/80 rounded-2xl p-5 space-y-4 hover:shadow-md hover:border-gray-300 transition flex flex-col justify-between shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Oportunidad #{op.id} ({op.etapa})
                    </span>
                    <span className="text-sm font-extrabold text-emerald-600 font-mono">
                      ${Number(op.montoEstimado).toLocaleString('es-AR')}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      {op.cliente?.nombres} {op.cliente?.apellido || op.cliente?.razonSocial}
                    </h3>
                    <p className="text-xs text-gray-500">DNI/CUIT: {op.cliente?.numeroDni}</p>
                  </div>

                  <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 text-xs text-gray-600 space-y-1">
                    <p className="font-semibold text-gray-900">{op.vehiculo?.marca} {op.vehiculo?.modelo}</p>
                    <p className="text-[11px] text-gray-500">{op.vehiculo?.version} · {op.vehiculo?.anio}</p>
                    <p className="text-[10px] font-mono text-gray-400">VIN: {op.vehiculo?.vin}</p>
                  </div>
                </div>

                <button
                  onClick={() => setModalEmitir(op)}
                  className="w-full py-2 bg-[#18181b] hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Emitir Factura AFIP</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL 1: Emitir Factura */}
      {modalEmitir && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200/80 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-sm font-bold text-gray-900">Emitir Comprobante Fiscal Oficial</h3>
              <button onClick={() => setModalEmitir(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4">
              Facturar venta de <strong className="text-gray-900">{modalEmitir.vehiculo?.marca} {modalEmitir.vehiculo?.modelo}</strong> para <strong className="text-gray-900">{modalEmitir.cliente?.nombres} {modalEmitir.cliente?.apellido || modalEmitir.cliente?.razonSocial}</strong>.
            </p>

            <form onSubmit={handleEmitirFactura} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tipo de Comprobante</label>
                <select
                  value={tipoComprobante}
                  onChange={(e) => setTipoComprobante(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
                >
                  <option value="FACTURA_B">Factura B (Consumidor Final)</option>
                  <option value="FACTURA_A">Factura A (Responsable Inscripto / Empresa)</option>
                </select>
              </div>

              <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 space-y-1 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Punto de Venta:</span>
                  <span className="font-mono font-bold text-gray-800">0001 (Web Service Electrónico)</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Total a Facturar:</span>
                  <span className="font-mono font-bold text-emerald-600">${Number(modalEmitir.montoEstimado).toLocaleString('es-AR')}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalEmitir(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEmision}
                  className="px-4 py-2 bg-[#18181b] hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{guardandoEmision ? 'Generando CAE...' : 'Emitir Factura AFIP'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Registrar Cobro */}
      {modalCobro && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200/80 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-sm font-bold text-gray-900">Registrar Cobranza</h3>
              <button onClick={() => setModalCobro(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4">
              Cobro para comprobante <strong className="text-gray-900">{modalCobro.tipoComprobante} {modalCobro.puntoVenta}-{modalCobro.numeroComprobante}</strong>.
            </p>

            <form onSubmit={handleRegistrarPago} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Método de Cobro</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
                >
                  <option value="TRANSFERENCIA">Transferencia Bancaria / CBU</option>
                  <option value="EFECTIVO">Efectivo en Caja</option>
                  <option value="CREDITO_PRENDARIO">Crédito Prendario Bancario</option>
                  <option value="PERMUTA_USADO">Permuta (Toma de Auto Usado)</option>
                  <option value="CHEQUE">Cheque / eCheq</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Monto Recibido ($) *</label>
                <input
                  type="number"
                  required
                  value={montoCobro}
                  onChange={(e) => setMontoCobro(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Nº Comprobante / Referencia (Opcional)
                </label>
                <input
                  type="text"
                  value={nroComprobante}
                  onChange={(e) => setNroComprobante(e.target.value)}
                  placeholder="Ej: Transf #998821, o Patente AE123CD"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalCobro(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoCobro}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {guardandoCobro ? 'Procesando...' : 'Confirmar Cobro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Comprobante Fiscal Oficial Imprimible */}
      {modalDetalle && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-gray-200/80 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-6">
            {/* Modal Controls Header (Hidden in Print) */}
            <div className="p-4 px-6 border-b border-gray-100 flex items-center justify-between bg-white print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-gray-700" />
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Comprobante Electrónico AFIP Oficial
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-[#18181b] hover:bg-black text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Comprobante</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalDetalle(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Formal Invoice Sheet */}
            <div className="p-6 md:p-8 space-y-6 text-xs bg-white text-gray-900 print:bg-white print:text-black">
              {/* Header Box */}
              <div className="border border-gray-200 print:border-gray-400 rounded-2xl p-4 bg-gray-50/50 print:bg-white relative">
                {/* Central Letter Badge */}
                <div className="absolute left-1/2 -top-3 transform -translate-x-1/2 w-10 h-10 bg-white print:bg-white border-2 border-gray-300 print:border-gray-800 rounded-xl flex flex-col items-center justify-center text-center shadow-xs">
                  <span className="font-black text-sm text-gray-900 print:text-black leading-none">
                    {modalDetalle.tipoComprobante?.endsWith('A') ? 'A' : 'B'}
                  </span>
                  <span className="text-[8px] font-bold text-gray-500 print:text-gray-600 leading-none">
                    {modalDetalle.tipoComprobante?.endsWith('A') ? 'COD. 01' : 'COD. 06'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div>
                    <h2 className="font-black text-base text-gray-900 print:text-black tracking-tight">
                      AUTO CRM CONCESIONARIA S.A.
                    </h2>
                    <p className="text-[11px] text-gray-500 print:text-gray-600 mt-0.5">
                      Venta de Vehículos 0km y Usados Seleccionados
                    </p>
                    <p className="text-[10px] text-gray-400 print:text-gray-600 mt-2">
                      Casa Central: Av. Automotor 4500, Posadas, Misiones<br />
                      IVA Responsable Inscripto
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <p className="font-bold text-sm text-gray-900 print:text-black uppercase">
                      {modalDetalle.tipoComprobante?.replace('_', ' ')}
                    </p>
                    <p className="font-mono text-xs font-bold text-gray-900 print:text-black">
                      Nº {modalDetalle.puntoVenta}-{modalDetalle.numeroComprobante}
                    </p>
                    <p className="text-[11px] text-gray-500 print:text-gray-600">
                      Fecha: {new Date(modalDetalle.fechaEmision).toLocaleDateString('es-AR')}
                    </p>
                    <p className="text-[10px] font-mono text-gray-500 print:text-gray-600">
                      CUIT: 30-71458923-4 · IIBB: 901-238491-0
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Box */}
              <div className="border border-gray-200 print:border-gray-400 rounded-xl p-3.5 bg-gray-50/50 print:bg-white grid grid-cols-2 gap-4 text-[11px]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 print:text-gray-600 block">
                    Adquirente / Cliente:
                  </span>
                  <p className="font-bold text-gray-900 print:text-black text-xs">
                    {modalDetalle.cliente?.nombres} {modalDetalle.cliente?.apellido || modalDetalle.cliente?.razonSocial}
                  </p>
                  <p className="text-gray-500 print:text-gray-600 mt-0.5">
                    DNI / CUIT: <strong className="text-gray-800 print:text-black font-mono">{modalDetalle.cliente?.numeroDni}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-gray-400 print:text-gray-600 block">
                    Condición de Venta:
                  </span>
                  <p className="font-bold text-gray-900 print:text-black">Contado / Prendario</p>
                  <p className="text-gray-500 print:text-gray-600 mt-0.5">IVA: Consumidor Final</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full border border-gray-200 print:border-gray-400 rounded-xl overflow-hidden text-left">
                <thead className="bg-gray-50 print:bg-gray-200 border-b border-gray-200 print:border-gray-400 text-gray-600 print:text-black text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="p-2.5">Descripción del Vehículo</th>
                    <th className="p-2.5 text-center">Cant.</th>
                    <th className="p-2.5 text-right">Precio Unit.</th>
                    <th className="p-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 print:divide-gray-300">
                  {modalDetalle.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-medium text-gray-900 print:text-black">{it.descripcion}</td>
                      <td className="p-2.5 text-center text-gray-600 print:text-black">{it.cantidad}</td>
                      <td className="p-2.5 text-right font-mono text-gray-700 print:text-black">
                        ${Number(it.precioUnitario).toLocaleString('es-AR')}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-gray-900 print:text-black">
                        ${(it.cantidad * Number(it.precioUnitario)).toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals & CAE AFIP Footer */}
              <div className="border border-gray-200 print:border-gray-400 rounded-xl p-4 bg-gray-50/50 print:bg-white grid grid-cols-2 items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-white border border-gray-300 rounded-lg flex items-center justify-center p-1">
                    <QrCode className="w-12 h-12 text-gray-900" />
                  </div>
                  <div className="text-[10px] space-y-0.5">
                    <p className="font-bold text-gray-900 print:text-black">CAE: {modalDetalle.caeAfip || '84129502918274'}</p>
                    <p className="text-gray-500 print:text-gray-600">Vto. CAE: {new Date(Date.now() + 10 * 86400000).toLocaleDateString('es-AR')}</p>
                    <p className="text-gray-400 print:text-gray-600">Comprobante Autorizado AFIP</p>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-xs text-gray-500">
                    <span>Importe Neto Gravado: </span>
                    <span className="font-mono text-gray-800">${(Number(modalDetalle.total) / 1.21).toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    <span>IVA 21%: </span>
                    <span className="font-mono text-gray-800">${(Number(modalDetalle.total) - (Number(modalDetalle.total) / 1.21)).toFixed(2)}</span>
                  </div>
                  <div className="text-base font-black text-gray-900 print:text-black pt-1 border-t border-gray-200">
                    TOTAL: ${Number(modalDetalle.total).toLocaleString('es-AR')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
