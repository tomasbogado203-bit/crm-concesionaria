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
  Shield,
  Edit2,
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

const COMPANIAS_ASEGURADORAS = [
  'La Segunda Seguros',
  'San Cristóbal Seguros',
  'Federación Patronal',
  'Seguros Rivadavia',
  'Sancor Seguros',
  'Zurich / Allianz',
  'Otra Aseguradora',
];

const PLANES_COBERTURA = {
  TERCEROS_COMPLETO: {
    nombre: 'Terceros Completo Premium (Granizo, Cristales y Robo)',
    costoSugerido: 48000,
  },
  TODO_RIESGO: {
    nombre: 'Todo Riesgo con Franquicia Fija',
    costoSugerido: 78000,
  },
  BASICO: {
    nombre: 'Responsabilidad Civil y Destrucción Total',
    costoSugerido: 28000,
  },
  PERSONALIZADO: {
    nombre: 'Cobertura Especial / A Medida',
    costoSugerido: 50000,
  },
};

export const SimuladorFinancieroModal = ({ vehiculo, onClose }) => {
  const precioInicial = vehiculo?.precioVenta ? Number(vehiculo.precioVenta) : 25000000;

  const [precioVehiculo, setPrecioVehiculo] = useState(precioInicial);
  const [anticipoEfectivo, setAnticipoEfectivo] = useState(Math.round(precioInicial * 0.3));
  const [valorPermuta, setValorPermuta] = useState(0);
  const [cuotas, setCuotas] = useState(36);
  const [lineaSeleccionada, setLineaSeleccionada] = useState('PRENDARIO_FIJO');

  // Estados de Aseguradora y Cobertura (100% editables)
  const [aseguradora, setAseguradora] = useState('La Segunda Seguros');
  const [aseguradoraOtra, setAseguradoraOtra] = useState('');
  const [tipoCobertura, setTipoCobertura] = useState('TERCEROS_COMPLETO');
  const [costoSeguroMensual, setCostoSeguroMensual] = useState(48000);

  // Cálculos financieros
  const entregaTotal = Number(anticipoEfectivo || 0) + Number(valorPermuta || 0);
  const saldoAFinanciar = Math.max(0, Number(precioVehiculo) - entregaTotal);

  const linea = LINEAS_CREDITO[lineaSeleccionada];
  const costoSeguro = Number(costoSeguroMensual || 0);
  const aseguradoraFinal = aseguradora === 'Otra Aseguradora' ? (aseguradoraOtra || 'Aseguradora Externa') : aseguradora;

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

  const cuotaTotalMensual = Math.round(cuotaPura + costoSeguro);
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
                Planificación de cuotas, seguro prendario y opciones de permuta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 print:p-0 print:gap-4">
          {/* Left Column: Configuration Controls */}
          <div className="lg:col-span-7 space-y-4 print:col-span-12">
            {/* Target Vehicle Preview Card */}
            {vehiculo && (
              <div className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700 shadow-2xs">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-gray-900">
                      {vehiculo.marca} {vehiculo.modelo} ({vehiculo.anio})
                    </h4>
                    <p className="text-[10px] text-gray-500">
                      VIN: {vehiculo.vin} · {vehiculo.version}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Precio Lista
                  </span>
                  <span className="text-xs font-bold text-gray-900 font-mono">
                    ${Number(precioVehiculo).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            )}

            {/* Inputs: Price & Down Payment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Precio de la Unidad ($)
                </label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    value={precioVehiculo}
                    onChange={(e) => setPrecioVehiculo(Number(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 print:border-gray-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Anticipo en Efectivo ($)
                </label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    value={anticipoEfectivo}
                    onChange={(e) => setAnticipoEfectivo(Number(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 print:border-gray-300"
                  />
                </div>
              </div>
            </div>

            {/* Permuta (Used Trade-in) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Toma de Usado en Permuta ($)
                </label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    placeholder="0 si no entrega usado"
                    value={valorPermuta || ''}
                    onChange={(e) => setValorPermuta(Number(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 print:border-gray-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Plazo de Financiación (Meses)
                </label>
                <select
                  value={cuotas}
                  onChange={(e) => setCuotas(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer print:border-gray-300"
                >
                  <option value={12}>12 Cuotas (1 año)</option>
                  <option value={24}>24 Cuotas (2 años)</option>
                  <option value={36}>36 Cuotas (3 años)</option>
                  <option value={48}>48 Cuotas (4 años)</option>
                  <option value={60}>60 Cuotas (5 años)</option>
                </select>
              </div>
            </div>

            {/* Credit Line Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Línea Financiera y Entidad Bancaria
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

            {/* SEGURO OBLIGATORIO PRENDARIO (100% Configurable y Editable) */}
            <div className="bg-gray-50/60 border border-gray-200 rounded-2xl p-3.5 space-y-3 print:bg-white print:border-gray-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <label className="text-[11px] font-semibold text-gray-800">
                    Seguro Obligatorio Prendario
                  </label>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">Editable en tiempo real</span>
              </div>

              {/* Selector de Plan y Costo */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-7">
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">
                    Plan / Tipo de Cobertura
                  </label>
                  <select
                    value={tipoCobertura}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTipoCobertura(val);
                      if (PLANES_COBERTURA[val]) {
                        setCostoSeguroMensual(PLANES_COBERTURA[val].costoSugerido);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 cursor-pointer print:border-gray-300"
                  >
                    {Object.entries(PLANES_COBERTURA).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">
                    Prima Mensual ($/mes)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={costoSeguroMensual}
                      onChange={(e) => setCostoSeguroMensual(Number(e.target.value) || 0)}
                      title="Podés editar el valor exacto cotizado por la aseguradora"
                      className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-gray-900 print:border-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Selector de Compañía Aseguradora */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">
                    Compañía Aseguradora Conveniada
                  </label>
                  <select
                    value={aseguradora}
                    onChange={(e) => setAseguradora(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 cursor-pointer print:border-gray-300"
                  >
                    {COMPANIAS_ASEGURADORAS.map((cia) => (
                      <option key={cia} value={cia}>
                        {cia}
                      </option>
                    ))}
                  </select>
                </div>

                {aseguradora === 'Otra Aseguradora' ? (
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-0.5">
                      Nombre de la Aseguradora
                    </label>
                    <input
                      type="text"
                      value={aseguradoraOtra}
                      onChange={(e) => setAseguradoraOtra(e.target.value)}
                      placeholder="Ej: Mapfre, Allianz, etc."
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 print:border-gray-300"
                    />
                  </div>
                ) : (
                  <div className="flex items-center text-[10px] text-gray-500 italic pt-4">
                    <span>Póliza obligatoria endosada a favor de la entidad acreedora prendaria.</span>
                  </div>
                )}
              </div>
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
                  {cuotas} cuotas fijas · Incluye cuota pura + seguro ({aseguradoraFinal})
                </span>
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-2 text-[11px] pt-2 border-t border-gray-200 print:border-gray-300">
                <div className="flex justify-between text-gray-600">
                  <span>Precio Lista:</span>
                  <span className="font-mono text-gray-900 font-semibold">
                    ${Number(precioVehiculo).toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Entrega Inicial (Anticipo + Permuta):</span>
                  <span className="font-mono text-emerald-700 font-semibold">
                    -${entregaTotal.toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700 font-semibold border-t border-gray-200 pt-1.5 print:border-gray-300">
                  <span>Capital Neto a Financiar:</span>
                  <span className="font-mono text-gray-900 font-bold">
                    ${saldoAFinanciar.toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>TNA / CFT:</span>
                  <span className="font-mono text-gray-800">
                    {linea.tna}% / {linea.cft}%
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Seguro ({aseguradoraFinal}):</span>
                  <span className="font-mono text-gray-800 font-semibold">
                    ${costoSeguro.toLocaleString('es-AR')}/mes
                  </span>
                </div>
                <div className="flex justify-between text-gray-700 border-t border-gray-200 pt-1.5 print:border-gray-300 font-bold">
                  <span>Total Inversión Proyectada:</span>
                  <span className="font-mono text-gray-900">
                    ${inversionTotal.toLocaleString('es-AR')}
                  </span>
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
                  <span>Imprimir Presupuesto</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
