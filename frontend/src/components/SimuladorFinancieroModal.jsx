import React, { useState } from 'react';
import {
  Calculator,
  X,
  Printer,
  DollarSign,
  ShieldCheck,
  Calendar,
  Car,
  FileCheck,
  Info,
} from 'lucide-react';

const LINEAS_CREDITO = {
  PRENDARIO_FIJO: {
    nombre: 'Crédito Prendario Tasa Fija en Pesos',
    tna: 54.0,
    cft: 68.5,
    descripcion: 'Cuotas fijas y en pesos durante todo el período del contrato.',
  },
  PRENDARIO_UVA: {
    nombre: 'Crédito Prendario UVA + Tasa Preferencial',
    tna: 11.5,
    cft: 14.8,
    descripcion: 'Tasa reducida con capital ajustable según índice UVA BCRA.',
  },
  PLAN_AHORRO: {
    nombre: 'Plan Directo de Fábrica / Concesionaria (70/30)',
    tna: 0.0,
    cft: 10.0,
    descripcion: 'Sin interés bancario directo. Incluye 10% gastos administrativos prorrateados.',
  },
};

const SEGUROS = {
  TERCEROS_COMPLETO: {
    nombre: 'Terceros Completo Premium (Granizo, Cristales y Robo)',
    costo: 48000,
  },
  TODO_RIESGO: {
    nombre: 'Todo Riesgo con Franquicia Fija',
    costo: 78000,
  },
  BASICO: {
    nombre: 'Responsabilidad Civil y Destrucción Total',
    costo: 28000,
  },
};

export const SimuladorFinancieroModal = ({ vehiculo, onClose }) => {
  const precioInicial = vehiculo?.precioVenta ? Number(vehiculo.precioVenta) : 25000000;

  const [precioVehiculo, setPrecioVehiculo] = useState(precioInicial);
  const [anticipoEfectivo, setAnticipoEfectivo] = useState(Math.round(precioInicial * 0.3));
  const [valorPermuta, setValorPermuta] = useState(0);
  const [cuotas, setCuotas] = useState(36);
  const [lineaSeleccionada, setLineaSeleccionada] = useState('PRENDARIO_FIJO');
  const [seguroSeleccionado, setSeguroSeleccionado] = useState('TERCEROS_COMPLETO');

  // Cálculos financieros
  const entregaTotal = Number(anticipoEfectivo || 0) + Number(valorPermuta || 0);
  const saldoAFinanciar = Math.max(0, Number(precioVehiculo) - entregaTotal);

  const linea = LINEAS_CREDITO[lineaSeleccionada];
  const seguro = SEGUROS[seguroSeleccionado];

  // Cálculo de cuota pura
  let cuotaPura = 0;
  if (saldoAFinanciar > 0 && cuotas > 0) {
    if (linea.tna > 0) {
      const r = linea.tna / 100 / 12; // tasa mensual
      cuotaPura = (saldoAFinanciar * (r * Math.pow(1 + r, cuotas))) / (Math.pow(1 + r, cuotas) - 1);
    } else {
      // Tasa 0 con gastos adm
      cuotaPura = (saldoAFinanciar * 1.1) / cuotas;
    }
  }

  const cuotaTotalMensual = Math.round(cuotaPura + seguro.costo);
  const totalFinanciado = Math.round(cuotaTotalMensual * cuotas);
  const inversionTotal = entregaTotal + totalFinanciado;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Simulador Financiero Prendario
              </h3>
              <p className="text-xs text-slate-400">
                Cotización oficial de cuotas, tasas y plan de pago para operaciones comerciales.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Imprimir presupuesto para el cliente"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Imprimir Presupuesto</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Heading (only visible in print) */}
        <div className="hidden print:block p-8 border-b border-slate-300 text-slate-900">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black tracking-wider uppercase">AUTO CRM · CONCESIONARIA OFICIAL</h1>
              <p className="text-xs text-slate-600 mt-1">División Créditos y Financiaciones Prendarias</p>
              <p className="text-xs text-slate-500">CUIT: 30-71458923-4 · Casa Central</p>
            </div>
            <div className="text-right text-xs">
              <p className="font-bold">PRESUPUESTO COMERCIAL Nº {Math.floor(100000 + Math.random() * 900000)}</p>
              <p className="text-slate-500">Fecha: {new Date().toLocaleDateString('es-AR')}</p>
              <p className="text-slate-500 font-semibold text-rose-600">Validez: 7 días corridos</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-7 space-y-4 print:col-span-12">
            {vehiculo && (
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between print:bg-slate-100 print:border-slate-300">
                <div className="flex items-center gap-2.5">
                  <Car className="w-4 h-4 text-blue-400 print:text-slate-800" />
                  <div>
                    <span className="font-bold text-white print:text-slate-900 block text-xs">
                      {vehiculo.marca} {vehiculo.modelo} {vehiculo.version}
                    </span>
                    <span className="text-[10px] text-slate-400 print:text-slate-600">
                      Año: {vehiculo.anio} · VIN: {vehiculo.vin} · {vehiculo.condicion === 'CERO_KM' ? '0 Kilómetro' : 'Usado Seleccionado'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-blue-400 print:text-slate-900">
                  ${Number(precioVehiculo).toLocaleString('es-AR')}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 print:grid-cols-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 print:text-slate-700">
                  Precio de Lista de la Unidad ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={precioVehiculo}
                  onChange={(e) => setPrecioVehiculo(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-white text-xs focus:outline-none focus:border-blue-500 print:bg-white print:border-slate-300 print:text-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 print:text-slate-700">
                  Anticipo en Efectivo ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={anticipoEfectivo}
                  onChange={(e) => setAnticipoEfectivo(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-emerald-400 text-xs focus:outline-none focus:border-blue-500 print:bg-white print:border-slate-300 print:text-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 print:grid-cols-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 print:text-slate-700">
                  Toma de Usado en Permuta ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={valorPermuta}
                  onChange={(e) => setValorPermuta(Number(e.target.value))}
                  placeholder="0 (si entrega auto usado)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-amber-400 text-xs focus:outline-none focus:border-blue-500 print:bg-white print:border-slate-300 print:text-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 print:text-slate-700">
                  Plazo de Financiación
                </label>
                <select
                  value={cuotas}
                  onChange={(e) => setCuotas(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 print:bg-white print:border-slate-300 print:text-black"
                >
                  <option value={12}>12 Cuotas Mensuales (1 año)</option>
                  <option value={18}>18 Cuotas Mensuales</option>
                  <option value={24}>24 Cuotas Mensuales (2 años)</option>
                  <option value={36}>36 Cuotas Mensuales (3 años)</option>
                  <option value={48}>48 Cuotas Mensuales (4 años)</option>
                  <option value={60}>60 Cuotas Mensuales (5 años)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 print:text-slate-700">
                Línea Financiera / Entidad Bancaria
              </label>
              <select
                value={lineaSeleccionada}
                onChange={(e) => setLineaSeleccionada(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 print:bg-white print:border-slate-300 print:text-black"
              >
                {Object.entries(LINEAS_CREDITO).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.nombre} · TNA {item.tna}% (CFT {item.cft}%)
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1 italic print:text-slate-600">
                {linea.descripcion}
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 print:text-slate-700">
                Cobertura de Seguro Obligatorio Prendario
              </label>
              <select
                value={seguroSeleccionado}
                onChange={(e) => setSeguroSeleccionado(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 print:bg-white print:border-slate-300 print:text-black"
              >
                {Object.entries(SEGUROS).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.nombre} · +${item.costo.toLocaleString('es-AR')}/mes
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Column: Financial Results Summary */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4 print:col-span-12">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 print:bg-slate-50 print:border-slate-300">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block print:text-slate-700">
                Resumen de la Simulación
              </span>

              {/* Monthly Quote Highlight */}
              <div className="p-4 rounded-xl bg-gradient-to-tr from-blue-900/30 to-indigo-900/20 border border-blue-500/30 text-center print:bg-white print:border-slate-400">
                <span className="text-[10px] font-semibold text-blue-400 print:text-slate-700 uppercase tracking-wider block">
                  Cuota Mensual Estimada
                </span>
                <p className="text-3xl font-extrabold text-white print:text-slate-900 font-mono mt-1">
                  ${cuotaTotalMensual.toLocaleString('es-AR')}
                </p>
                <span className="text-[10px] text-slate-400 print:text-slate-600 mt-1 block">
                  {cuotas} cuotas fijas · Incluye cuota pura + seguro vehicular
                </span>
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-2 text-[11px] pt-2 border-t border-slate-800 print:border-slate-300">
                <div className="flex justify-between text-slate-400 print:text-slate-700">
                  <span>Precio Lista:</span>
                  <span className="font-mono text-white print:text-slate-900">${Number(precioVehiculo).toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-slate-400 print:text-slate-700">
                  <span>Entrega Inicial (Anticipo + Permuta):</span>
                  <span className="font-mono text-emerald-400 print:text-slate-900">-${entregaTotal.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-slate-400 print:text-slate-700 font-semibold border-t border-slate-800/60 pt-1.5 print:border-slate-300">
                  <span>Capital Neto a Financiar:</span>
                  <span className="font-mono text-blue-400 print:text-slate-900">${saldoAFinanciar.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-slate-400 print:text-slate-700">
                  <span>TNA / CFT:</span>
                  <span className="font-mono text-slate-300 print:text-slate-800">{linea.tna}% / {linea.cft}%</span>
                </div>
                <div className="flex justify-between text-slate-400 print:text-slate-700">
                  <span>Seguro ({seguroSeleccionado === 'TODO_RIESGO' ? 'Todo Riesgo' : 'Terceros'}):</span>
                  <span className="font-mono text-slate-300 print:text-slate-800">${seguro.costo.toLocaleString('es-AR')}/mes</span>
                </div>
                <div className="flex justify-between text-slate-400 print:text-slate-700 border-t border-slate-800/60 pt-1.5 print:border-slate-300 font-bold">
                  <span>Total Inversión Proyectada:</span>
                  <span className="font-mono text-white print:text-slate-900">${inversionTotal.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>

            {/* Print Signatures (visible only in print) */}
            <div className="hidden print:block pt-12 space-y-12">
              <div className="grid grid-cols-2 gap-12 text-center text-xs">
                <div className="border-t border-slate-400 pt-2">
                  <p className="font-bold">Firma del Asesor Comercial</p>
                  <p className="text-slate-500">Concesionaria Oficial</p>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <p className="font-bold">Conformidad del Cliente</p>
                  <p className="text-slate-500">Aceptación de Presupuesto</p>
                </div>
              </div>
            </div>

            {/* Disclaimer & Buttons */}
            <div className="space-y-3 print:hidden">
              <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-[10px] text-slate-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Los valores son estimaciones simuladas sujetas a aprobación crediticia definitiva del banco emisor y verificación registral del solicitante.
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition cursor-pointer text-xs"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 text-xs shadow-md shadow-blue-600/30"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
