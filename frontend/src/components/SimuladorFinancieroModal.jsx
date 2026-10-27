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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white border border-gray-200/80 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-800">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">
                Simulador Financiero Prendario
              </h3>
              <p className="text-xs text-gray-500">
                Cotización oficial de cuotas, tasas y plan de pago para operaciones comerciales.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#18181b] hover:bg-black text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Imprimir presupuesto para el cliente"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Presupuesto</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Heading (only visible in print) */}
        <div className="hidden print:block p-8 border-b border-gray-300 text-gray-900">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black tracking-wider uppercase">AUTO CRM · CONCESIONARIA OFICIAL</h1>
              <p className="text-xs text-gray-600 mt-1">División Créditos y Financiaciones Prendarias</p>
              <p className="text-xs text-gray-500">CUIT: 30-71458923-4 · Casa Central</p>
            </div>
            <div className="text-right text-xs">
              <p className="font-bold">PRESUPUESTO COMERCIAL Nº {Math.floor(100000 + Math.random() * 900000)}</p>
              <p className="text-gray-500">Fecha: {new Date().toLocaleDateString('es-AR')}</p>
              <p className="text-gray-600 font-semibold text-rose-600">Validez: 7 días corridos</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs bg-white text-gray-900">
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-7 space-y-4 print:col-span-12">
            {vehiculo && (
              <div className="p-3.5 bg-gray-50/70 border border-gray-200 rounded-xl flex items-center justify-between print:bg-gray-100 print:border-gray-300">
                <div className="flex items-center gap-2.5">
                  <Car className="w-4 h-4 text-gray-700" />
                  <div>
                    <span className="font-bold text-gray-900 block text-xs">
                      {vehiculo.marca} {vehiculo.modelo} {vehiculo.version}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Año: {vehiculo.anio} · VIN: {vehiculo.vin} · {vehiculo.condicion === 'CERO_KM' ? '0 Kilómetro' : 'Usado Seleccionado'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-gray-900">
                  ${Number(precioVehiculo).toLocaleString('es-AR')}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 print:grid-cols-2">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Precio de Lista de la Unidad ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={precioVehiculo}
                  onChange={(e) => setPrecioVehiculo(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-mono text-gray-900 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 print:border-gray-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Anticipo en Efectivo ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={anticipoEfectivo}
                  onChange={(e) => setAnticipoEfectivo(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-mono text-emerald-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 print:border-gray-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 print:grid-cols-2">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Toma de Usado en Permuta ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={valorPermuta}
                  onChange={(e) => setValorPermuta(Number(e.target.value))}
                  placeholder="0 (si entrega auto usado)"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-mono text-amber-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 print:border-gray-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Plazo de Financiación
                </label>
                <select
                  value={cuotas}
                  onChange={(e) => setCuotas(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer print:border-gray-300"
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
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Línea Financiera / Entidad Bancaria
              </label>
              <select
                value={lineaSeleccionada}
                onChange={(e) => setLineaSeleccionada(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer print:border-gray-300"
              >
                {Object.entries(LINEAS_CREDITO).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.nombre} · TNA {item.tna}% (CFT {item.cft}%)
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-500 mt-1 italic print:text-gray-600">
                {linea.descripcion}
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Cobertura de Seguro Obligatorio Prendario
              </label>
              <select
                value={seguroSeleccionado}
                onChange={(e) => setSeguroSeleccionado(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer print:border-gray-300"
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
            <div className="bg-gray-50/70 border border-gray-200 rounded-2xl p-5 space-y-4 print:bg-white print:border-gray-300">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block font-mono">
                Resumen de la Simulación
              </span>

              {/* Monthly Quote Highlight */}
              <div className="p-4 rounded-xl bg-[#18181b] text-white text-center shadow-xs">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Cuota Mensual Estimada
                </span>
                <p className="text-3xl font-extrabold text-white font-mono mt-1">
                  ${cuotaTotalMensual.toLocaleString('es-AR')}
                </p>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  {cuotas} cuotas fijas · Incluye cuota pura + seguro vehicular
                </span>
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-2 text-[11px] pt-2 border-t border-gray-200 print:border-gray-300">
                <div className="flex justify-between text-gray-600">
                  <span>Precio Lista:</span>
                  <span className="font-mono text-gray-900 font-semibold">${Number(precioVehiculo).toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Entrega Inicial (Anticipo + Permuta):</span>
                  <span className="font-mono text-emerald-700 font-semibold">-${entregaTotal.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-gray-700 font-semibold border-t border-gray-200 pt-1.5 print:border-gray-300">
                  <span>Capital Neto a Financiar:</span>
                  <span className="font-mono text-gray-900 font-bold">${saldoAFinanciar.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>TNA / CFT:</span>
                  <span className="font-mono text-gray-800">{linea.tna}% / {linea.cft}%</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Seguro ({seguroSeleccionado === 'TODO_RIESGO' ? 'Todo Riesgo' : 'Terceros'}):</span>
                  <span className="font-mono text-gray-800">${seguro.costo.toLocaleString('es-AR')}/mes</span>
                </div>
                <div className="flex justify-between text-gray-700 border-t border-gray-200 pt-1.5 print:border-gray-300 font-bold">
                  <span>Total Inversión Proyectada:</span>
                  <span className="font-mono text-gray-900">${inversionTotal.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>

            {/* Print Signatures (visible only in print) */}
            <div className="hidden print:block pt-12 space-y-12">
              <div className="grid grid-cols-2 gap-12 text-center text-xs">
                <div className="border-t border-gray-400 pt-2">
                  <p className="font-bold">Firma del Asesor Comercial</p>
                  <p className="text-gray-500">Concesionaria Oficial</p>
                </div>
                <div className="border-t border-gray-400 pt-2">
                  <p className="font-bold">Conformidad del Cliente</p>
                  <p className="text-gray-500">Aceptación de Presupuesto</p>
                </div>
              </div>
            </div>

            {/* Disclaimer & Buttons */}
            <div className="space-y-3 print:hidden">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-[10px] text-gray-500 flex items-start gap-2">
                <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <span>
                  Los valores son estimaciones simuladas sujetas a aprobación crediticia definitiva del banco emisor y verificación registral del solicitante.
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 px-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-semibold transition cursor-pointer text-xs shadow-2xs"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 py-2 px-4 bg-[#18181b] hover:bg-black text-white rounded-xl font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 text-xs shadow-xs"
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
