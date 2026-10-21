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
} from 'lucide-react';

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

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setTabActivo('EMITIDAS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              tabActivo === 'EMITIDAS'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Libro de Ventas ({facturas.length})
          </button>
          <button
            onClick={() => setTabActivo('PENDIENTES')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
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

      {/* MODAL 3: Ver Comprobante y Cobros */}
      {modalDetalle && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white">Detalle de Comprobante Fiscal</h3>
              <button onClick={() => setModalDetalle(null)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between font-bold text-white">
                  <span>{modalDetalle.tipoComprobante} {modalDetalle.puntoVenta}-{modalDetalle.numeroComprobante}</span>
                  <span className="text-emerald-400">${Number(modalDetalle.total).toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                  <span>CAE AFIP: {modalDetalle.caeAfip}</span>
                  <span>{new Date(modalDetalle.fechaEmision).toLocaleDateString()}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-300 mb-2">Ítems Facturados:</h4>
                <div className="space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px]">
                  {modalDetalle.detalles?.map((d) => (
                    <div key={d.id} className="flex justify-between text-slate-300">
                      <span>{d.descripcion} (x{d.cantidad})</span>
                      <span className="font-mono text-white">${Number(d.subtotal).toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-300 mb-2">Historial de Cobros Imputados:</h4>
                {modalDetalle.pagos?.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">No registra pagos todavía.</p>
                ) : (
                  <div className="space-y-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px]">
                    {modalDetalle.pagos?.map((p) => (
                      <div key={p.id} className="flex justify-between items-center text-slate-300">
                        <span>
                          <strong className="text-blue-400">{p.metodoPago}</strong>
                          {p.nroComprobante && ` (${p.nroComprobante})`}
                        </span>
                        <span className="font-mono text-emerald-400 font-bold">
                          +${Number(p.monto).toLocaleString('es-AR')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
