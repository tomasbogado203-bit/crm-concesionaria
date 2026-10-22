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
          <h2 className="text-xl font-bold text-white tracking-tight">Facturación Electrónica y Cobranzas</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Emisión de comprobantes con CAE AFIP y gestión de cobros multiforma (contado, prendario, permuta).
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {tabActivo === 'EMITIDAS' && facturas.length > 0 && (
            <button
              onClick={handleExportarCSV}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              title="Descargar libro de IVA Ventas en formato CSV para Excel"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Exportar CSV</span>
            </button>
          )}

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setTabActivo('EMITIDAS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                tabActivo === 'EMITIDAS'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Libro de Ventas ({facturas.length})
            </button>
            <button
              onClick={() => setTabActivo('PENDIENTES')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                tabActivo === 'PENDIENTES'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Listas para Facturar</span>
              {oportunidadesGanadas.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                  {oportunidadesGanadas.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: Facturas Emitidas */}
      {tabActivo === 'EMITIDAS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Comprobante</th>
                  <th className="py-3.5 px-4 font-semibold">CAE AFIP</th>
                  <th className="py-3.5 px-4 font-semibold">Cliente</th>
                  <th className="py-3.5 px-4 font-semibold">Fecha</th>
                  <th className="py-3.5 px-4 font-semibold">Total</th>
                  <th className="py-3.5 px-4 font-semibold">Cobrado / Saldo</th>
                  <th className="py-3.5 px-4 font-semibold">Estado</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cargando ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-500">Cargando comprobantes...</td>
                  </tr>
                ) : facturas.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-500">
                      No hay facturas emitidas aún. Pasa a la pestaña "Listas para Facturar" para emitir la primera.
                    </td>
                  </tr>
                ) : (
                  facturas.map((f) => {
                    const cobrado = f.pagos?.reduce((acc, p) => acc + Number(p.monto), 0) || 0;
                    const saldo = Math.max(0, Number(f.total) - cobrado);

                    return (
                      <tr key={f.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          <span className="text-blue-400">{f.tipoComprobante}</span> {f.puntoVenta}-{f.numeroComprobante}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                          {f.caeAfip || 'Sin CAE'}
                        </td>
                        <td className="py-3.5 px-4 text-white font-medium">
                          {f.cliente?.nombres} {f.cliente?.apellido || f.cliente?.razonSocial}
                          <span className="block text-[10px] text-slate-500 font-mono">DNI/CUIT: {f.cliente?.numeroDni}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(f.fechaEmision).toLocaleDateString('es-AR')}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white font-mono">
                          ${Number(f.total).toLocaleString('es-AR')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-emerald-400 font-bold block">${cobrado.toLocaleString('es-AR')}</span>
                          {saldo > 0 ? (
                            <span className="text-amber-400 text-[10px] font-medium">Resta: ${saldo.toLocaleString('es-AR')}</span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">Saldado (100%)</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {f.estado === 'PAGADA' ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                              PAGADA
                            </span>
                          ) : f.estado === 'EMITIDA' ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                              PENDIENTE COBRO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
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
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition flex items-center gap-1 shadow-sm"
                              >
                                <DollarSign className="w-3.5 h-3.5" /> Cobrar
                              </button>
                            )}
                            <button
                              onClick={() => setModalDetalle(f)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                            >
                              Ver
                            </button>
                            {f.estado !== 'ANULADA' && (
                              <button
                                onClick={() => handleAnular(f.id)}
                                className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
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
            <div className="col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              No hay oportunidades reservadas ni ganadas pendientes de emisión.
            </div>
          ) : (
            oportunidadesGanadas.map((op) => (
              <div
                key={op.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Oportunidad #{op.id} ({op.etapa})
                  </span>
                  <span className="text-sm font-extrabold text-emerald-400 font-mono">
                    ${Number(op.montoEstimado).toLocaleString('es-AR')}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">
                    {op.cliente?.nombres} {op.cliente?.apellido || op.cliente?.razonSocial}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Vehículo: <strong className="text-slate-200">{op.vehiculo?.marca} {op.vehiculo?.modelo}</strong> ({op.vehiculo?.anio})
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">VIN: {op.vehiculo?.vin}</p>
                </div>

                <button
                  onClick={() => setModalEmitir(op)}
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Emitir Factura de Venta</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL 1: Emitir Factura */}
      {modalEmitir && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Emisión de Factura Fiscal Electrónica
              </h3>
              <button onClick={() => setModalEmitir(null)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEmitirFactura} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Comprobante</label>
                <select
                  value={tipoComprobante}
                  onChange={(e) => setTipoComprobante(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="FACTURA_B">Factura B (Consumidor Final / DNI)</option>
                  <option value="FACTURA_A">Factura A (Responsable Inscripto / CUIT)</option>
                  <option value="FACTURA_C">Factura C</option>
                  <option value="RECIBO">Recibo Oficial de Seña / Boleto</option>
                </select>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Cliente:</span>
                  <span className="text-white font-medium">{modalEmitir.cliente?.nombres} {modalEmitir.cliente?.apellido || modalEmitir.cliente?.razonSocial}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Vehículo:</span>
                  <span className="text-white">{modalEmitir.vehiculo?.marca} {modalEmitir.vehiculo?.modelo}</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                  <span className="font-bold">Total a Facturar:</span>
                  <span className="text-emerald-400 font-extrabold font-mono">${Number(modalEmitir.montoEstimado).toLocaleString('es-AR')}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Se solicitará CAE de 14 dígitos automáticamente a AFIP y el vehículo quedará bloqueado como VENDIDO.</span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalEmitir(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEmision}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 disabled:opacity-50"
                >
                  {guardandoEmision ? 'Generando CAE...' : 'Emitir Factura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Imputar Cobranza / Pago */}
      {modalCobro && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Registrar Cobro en Caja
              </h3>
              <button onClick={() => setModalCobro(null)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegistrarPago} className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Factura:</span>
                  <span className="text-white font-bold">{modalCobro.tipoComprobante} {modalCobro.puntoVenta}-{modalCobro.numeroComprobante}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Factura:</span>
                  <span className="text-white font-mono">${Number(modalCobro.total).toLocaleString('es-AR')}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Medio de Pago</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="TRANSFERENCIA">Transferencia Bancaria / CBU</option>
                  <option value="EFECTIVO">Efectivo en Caja</option>
                  <option value="PRENDARIO">Crédito Prendario Bancario</option>
                  <option value="PERMUTA">Toma de Auto Usado en Permuta</option>
                  <option value="CHEQUE">Cheque de Pago Diferido / Certificado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Monto a Imputar ($) *</label>
                <input
                  type="number"
                  required
                  value={montoCobro}
                  onChange={(e) => setMontoCobro(e.target.value)}
                  placeholder="Monto exacto..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nro. de Operación / Comprobante / Patente del Usado
                </label>
                <input
                  type="text"
                  value={nroComprobante}
                  onChange={(e) => setNroComprobante(e.target.value)}
                  placeholder="Ej: Transf #998821, o Patente AE123CD"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalCobro(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoCobro}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/30 disabled:opacity-50"
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
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-6">
            {/* Modal Controls Header (Hidden in Print) */}
            <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Comprobante Electrónico AFIP Oficial
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Comprobante</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalDetalle(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Formal Invoice Sheet */}
            <div className="p-6 md:p-8 space-y-6 text-xs bg-slate-900 print:bg-white print:text-black">
              {/* Header Box */}
              <div className="border border-slate-800 print:border-slate-400 rounded-2xl p-4 bg-slate-950/50 print:bg-white relative">
                {/* Central Letter Badge */}
                <div className="absolute left-1/2 -top-3 transform -translate-x-1/2 w-10 h-10 bg-slate-900 print:bg-white border-2 border-slate-700 print:border-slate-800 rounded-xl flex flex-col items-center justify-center text-center shadow-md">
                  <span className="font-black text-sm text-white print:text-black leading-none">
                    {modalDetalle.tipoComprobante?.endsWith('A') ? 'A' : 'B'}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 print:text-slate-600 leading-none">
                    {modalDetalle.tipoComprobante?.endsWith('A') ? 'COD. 01' : 'COD. 06'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div>
                    <h2 className="font-black text-base text-white print:text-black tracking-tight">
                      AUTO CRM CONCESIONARIA S.A.
                    </h2>
                    <p className="text-[11px] text-slate-400 print:text-slate-600 mt-0.5">
                      Venta de Vehículos 0km y Usados Seleccionados
                    </p>
                    <p className="text-[10px] text-slate-500 print:text-slate-600 mt-2">
                      Casa Central: Av. Automotor 4500, Posadas, Misiones<br />
                      IVA Responsable Inscripto
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <p className="font-bold text-sm text-white print:text-black uppercase">
                      {modalDetalle.tipoComprobante?.replace('_', ' ')}
                    </p>
                    <p className="font-mono text-xs font-bold text-blue-400 print:text-black">
                      Nº {modalDetalle.puntoVenta}-{modalDetalle.numeroComprobante}
                    </p>
                    <p className="text-[11px] text-slate-400 print:text-slate-600">
                      Fecha: {new Date(modalDetalle.fechaEmision).toLocaleDateString('es-AR')}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 print:text-slate-600">
                      CUIT: 30-71458923-4 · IIBB: 901-238491-0
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Box */}
              <div className="border border-slate-800 print:border-slate-400 rounded-xl p-3.5 bg-slate-950/40 print:bg-white grid grid-cols-2 gap-4 text-[11px]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 print:text-slate-600 block">
                    Adquirente / Cliente:
                  </span>
                  <p className="font-bold text-white print:text-black text-xs">
                    {modalDetalle.cliente?.nombres} {modalDetalle.cliente?.apellido || modalDetalle.cliente?.razonSocial}
                  </p>
                  <p className="text-slate-400 print:text-slate-600 mt-0.5">
                    DNI / CUIT: <strong className="text-slate-300 print:text-black font-mono">{modalDetalle.cliente?.numeroDni}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 print:text-slate-600 block">
                    Condición Comercial:
                  </span>
                  <p className="text-slate-300 print:text-black">
                    {modalDetalle.cliente?.tipoPersona === 'JURIDICA' ? 'IVA Responsable Inscripto' : 'IVA Consumidor Final'}
                  </p>
                  <p className="text-slate-400 print:text-slate-600 mt-0.5">
                    Condición de Venta: Contado / Financiado
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-800 print:border-slate-400 rounded-xl overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-950 print:bg-slate-100 border-b border-slate-800 print:border-slate-400 text-slate-400 print:text-slate-700 uppercase text-[9px] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Cant.</th>
                      <th className="py-2.5 px-3">Descripción de la Unidad / Concepto</th>
                      <th className="py-2.5 px-3 text-right">Precio Unitario</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 print:divide-slate-300">
                    {modalDetalle.detalles?.map((d) => (
                      <tr key={d.id}>
                        <td className="py-2.5 px-3 font-mono">{d.cantidad}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-200 print:text-black">
                          {d.descripcion}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300 print:text-black">
                          ${Number(d.precioUnitario).toLocaleString('es-AR')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white print:text-black">
                          ${Number(d.subtotal).toLocaleString('es-AR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Payments & Totals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cashier Payment Breakdown */}
                <div className="p-3.5 bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-400 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-slate-700 block">
                    Medios de Pago Imputados en Caja:
                  </span>
                  {modalDetalle.pagos?.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">Sin cobros registrados en caja.</p>
                  ) : (
                    <div className="space-y-1.5 text-[11px]">
                      {modalDetalle.pagos?.map((p) => (
                        <div key={p.id} className="flex justify-between items-center text-slate-300 print:text-slate-800">
                          <span>
                            <strong className="text-blue-400 print:text-slate-900">{p.metodoPago}</strong>
                            {p.nroComprobante && ` (${p.nroComprobante})`}
                          </span>
                          <span className="font-mono font-bold text-emerald-400 print:text-slate-900">
                            +${Number(p.monto).toLocaleString('es-AR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Totals Summary */}
                <div className="p-3.5 bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-400 rounded-xl space-y-2">
                  {(() => {
                    const cobrado = modalDetalle.pagos?.reduce((acc, p) => acc + Number(p.monto), 0) || 0;
                    const saldo = Math.max(0, Number(modalDetalle.total) - cobrado);
                    return (
                      <>
                        <div className="flex justify-between text-slate-400 print:text-slate-700 text-[11px]">
                          <span>Importe Total:</span>
                          <span className="font-mono font-bold text-white print:text-black">
                            ${Number(modalDetalle.total).toLocaleString('es-AR')}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400 print:text-slate-700 text-[11px]">
                          <span>Total Cancelado en Caja:</span>
                          <span className="font-mono font-bold text-emerald-400 print:text-slate-900">
                            ${cobrado.toLocaleString('es-AR')}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-xs pt-2 border-t border-slate-800 print:border-slate-300">
                          <span className="text-white print:text-black">Saldo Remanente:</span>
                          <span className={`font-mono ${saldo === 0 ? 'text-emerald-400 print:text-emerald-700' : 'text-amber-400 print:text-amber-700'}`}>
                            {saldo === 0 ? 'Saldado (100%)' : `$${saldo.toLocaleString('es-AR')}`}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* AFIP CAE Footer Box */}
              <div className="border border-slate-800 print:border-slate-400 rounded-xl p-4 bg-slate-950/70 print:bg-white flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg p-1.5 flex items-center justify-center text-slate-950 shadow">
                    <QrCode className="w-9 h-9" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-white print:text-black block">
                      Comprobante Autorizado por AFIP
                    </span>
                    <p className="text-[10px] text-slate-400 print:text-slate-600">
                      Régimen de Facturación Electrónica RG 4291
                    </p>
                  </div>
                </div>

                <div className="text-right text-[11px] font-mono space-y-0.5">
                  <p className="text-slate-400 print:text-slate-700">
                    CAE Nº: <strong className="text-blue-400 print:text-black">{modalDetalle.caeAfip || '32849102847192'}</strong>
                  </p>
                  <p className="text-slate-500 print:text-slate-600 text-[10px]">
                    Fecha de Vto. de CAE: {new Date(new Date(modalDetalle.fechaEmision).getTime() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
