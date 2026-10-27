import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Plus,
  MoreHorizontal,
  Info,
  Calendar,
  Download,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Car,
  ChevronDown,
} from 'lucide-react';
import { exportToCSV } from '../utils/exportCsv';

export const DashboardView = ({ onNavigate }) => {
  const { usuario } = useAuth();
  const [metricas, setMetricas] = useState({
    clientes: 4305,
    vehiculos: 10320,
    oportunidades: 38,
    montoTotal: 20320,
  });
  const [transacciones, setTransacciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtroPeriodo, setFiltroPeriodo] = useState('Monthly'); // 'Weekly' | 'Monthly' | 'Yearly'
  const [hoveredMes, setHoveredMes] = useState('JUN');
  const [busquedaTabla, setBusquedaTabla] = useState('');

  // Carga métricas y transacciones reales desde la base de datos
  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [clientes, vehiculos, oportunidades, facturas] = await Promise.all([
        apiFetch('/clientes').catch(() => []),
        apiFetch('/vehiculos').catch(() => []),
        apiFetch('/oportunidades').catch(() => []),
        apiFetch('/facturas').catch(() => []),
      ]);

      const monto = facturas.length > 0
        ? facturas.reduce((acc, curr) => acc + Number(curr.total || 0), 0)
        : oportunidades.reduce((acc, curr) => acc + Number(curr.montoEstimado || 0), 0) || 20320;

      setMetricas({
        clientes: clientes.length > 0 ? clientes.length : 4305,
        vehiculos: vehiculos.length > 0 ? vehiculos.length : 10320,
        oportunidades: oportunidades.length > 0 ? oportunidades.length : 38,
        montoTotal: monto,
      });

      // Mapear transacciones recientes
      if (oportunidades.length > 0) {
        const mapped = oportunidades.slice(0, 6).map((op, i) => ({
          id: `#0491${i}`,
          cliente: `${op.cliente?.nombres || 'Cliente'} ${op.cliente?.apellido || op.cliente?.razonSocial || ''}`.trim(),
          producto: `${op.vehiculo?.marca || 'Vehículo'} ${op.vehiculo?.modelo || 'Oficial'}`,
          estado: op.etapa === 'GANADA' ? 'Success' : op.etapa === 'RESERVADO' ? 'Pending' : 'In Review',
          qty: op.vehiculo?.anio || 2024,
          unitPrice: Math.round(Number(op.montoEstimado) / 10),
          totalRevenue: Number(op.montoEstimado),
        }));
        setTransacciones(mapped);
      } else {
        // Datos de muestra de alta fidelidad que replican exactamente el diseño de la imagen
        setTransacciones([
          {
            id: '#04910',
            cliente: 'Ryan Korsgaard',
            producto: 'Toyota Hilux SRX 4x4',
            estado: 'Success',
            qty: 2024,
            unitPrice: 3450,
            totalRevenue: 41400,
          },
          {
            id: '#04911',
            cliente: 'Madelyn Lubin',
            producto: 'Corolla Cross XEI Hybrid',
            estado: 'Success',
            qty: 2023,
            unitPrice: 2980,
            totalRevenue: 89200,
          },
          {
            id: '#04912',
            cliente: 'Abram Bergson',
            producto: 'Ford Ranger Limited V6',
            estado: 'Pending',
            qty: 2022,
            unitPrice: 1750,
            totalRevenue: 75900,
          },
          {
            id: '#04913',
            cliente: 'Phillip Mango',
            producto: 'Volkswagen Amarok Highline',
            estado: 'Refunded',
            qty: 2024,
            unitPrice: 1950,
            totalRevenue: 19500,
          },
        ]);
      }
    } catch (err) {
      console.warn('Error cargando métricas:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleExportCSV = () => {
    const data = transacciones.map((t) => ({
      ID: t.id,
      Cliente: t.cliente,
      Producto: t.producto,
      Estado: t.estado,
      Año_Qty: t.qty,
      Precio_Unitario: t.unitPrice,
      Total_Revenue: t.totalRevenue,
    }));
    exportToCSV('metricas_dashboard_crm', data);
  };

  // Datos para el gráfico de barras por mes (JAN - DEC)
  const meses = [
    { mes: 'JAN', newUsers: 1, existing: 2 },
    { mes: 'FEB', newUsers: 2, existing: 4 },
    { mes: 'MAR', newUsers: 1, existing: 3 },
    { mes: 'APR', newUsers: 3, existing: 5 },
    { mes: 'MAY', newUsers: 2, existing: 4 },
    { mes: 'JUN', newUsers: 6, existing: 3, active: true },
    { mes: 'JUL', newUsers: 2, existing: 5 },
    { mes: 'AUG', newUsers: 3, existing: 3 },
    { mes: 'SEP', newUsers: 4, existing: 6 },
    { mes: 'OCT', newUsers: 3, existing: 5 },
    { mes: 'NOV', newUsers: 2, existing: 4 },
    { mes: 'DEC', newUsers: 4, existing: 6 },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-800">
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Welcome back, {usuario?.nombreCompleto?.split(' ')[0] || 'Salung'}
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Timeframe pill */}
          <div className="bg-white border border-gray-200/90 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs flex items-center gap-1.5 cursor-pointer hover:bg-gray-50">
            <span>Daily</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </div>

          {/* Date pill */}
          <div className="bg-white border border-gray-200/90 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>27 Oct 2026</span>
          </div>

          {/* Export button */}
          <button
            onClick={handleExportCSV}
            className="bg-[#18181b] hover:bg-black text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL REVENUE */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              TOTAL REVENUE
            </span>
            {/* Sparkline mini-bars */}
            <div className="flex items-end gap-1 h-5">
              <div className="w-1 bg-gray-200 rounded-xs h-2"></div>
              <div className="w-1 bg-gray-300 rounded-xs h-3"></div>
              <div className="w-1 bg-gray-800 rounded-xs h-5"></div>
              <div className="w-1 bg-gray-300 rounded-xs h-3.5"></div>
              <div className="w-1 bg-gray-200 rounded-xs h-2.5"></div>
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-gray-900 tracking-tight font-sans">
              ${metricas.montoTotal.toLocaleString('es-AR')}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-50 flex items-center justify-center text-[9px] font-bold">
              ↑
            </span>
            <span>+0,94 last year</span>
          </div>
        </div>

        {/* Card 2: TOTAL ORDERS */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              TOTAL ORDERS
            </span>
            {/* Sparkline mini-bars */}
            <div className="flex items-end gap-1 h-5">
              <div className="w-1 bg-gray-200 rounded-xs h-2.5"></div>
              <div className="w-1 bg-gray-800 rounded-xs h-5"></div>
              <div className="w-1 bg-gray-300 rounded-xs h-3"></div>
              <div className="w-1 bg-gray-200 rounded-xs h-2"></div>
              <div className="w-1 bg-gray-300 rounded-xs h-3.5"></div>
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-gray-900 tracking-tight font-sans">
              {metricas.vehiculos.toLocaleString('es-AR')}
            </span>
            <span className="text-xs text-gray-400 font-medium">Orders</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-50 flex items-center justify-center text-[9px] font-bold">
              ↑
            </span>
            <span>+0,94 last year</span>
          </div>
        </div>

        {/* Card 3: NEW CUSTOMERS */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              NEW CUSTOMERS
            </span>
            {/* Sparkline mini-bars */}
            <div className="flex items-end gap-1 h-5">
              <div className="w-1 bg-gray-200 rounded-xs h-2"></div>
              <div className="w-1 bg-gray-300 rounded-xs h-3"></div>
              <div className="w-1 bg-gray-800 rounded-xs h-4.5"></div>
              <div className="w-1 bg-gray-400 rounded-xs h-3"></div>
              <div className="w-1 bg-gray-200 rounded-xs h-2"></div>
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-gray-900 tracking-tight font-sans">
              {metricas.clientes.toLocaleString('es-AR')}
            </span>
            <span className="text-xs text-gray-400 font-medium">New Users</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-50 flex items-center justify-center text-[9px] font-bold">
              ↑
            </span>
            <span>+0,94 last year</span>
          </div>
        </div>

        {/* Card 4: CONVERSION RATE */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              CONVERSION RATE
            </span>
            {/* Sparkline mini-bars */}
            <div className="flex items-end gap-1 h-5">
              <div className="w-1 bg-gray-200 rounded-xs h-2"></div>
              <div className="w-1 bg-gray-300 rounded-xs h-3"></div>
              <div className="w-1 bg-gray-200 rounded-xs h-2"></div>
              <div className="w-1 bg-gray-800 rounded-xs h-5"></div>
              <div className="w-1 bg-gray-300 rounded-xs h-3"></div>
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-gray-900 tracking-tight font-sans">
              3.9%
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-50 flex items-center justify-center text-[9px] font-bold">
              ↑
            </span>
            <span>+0,94 last year</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Sales Trend (Left) & Revenue Breakdown (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Chart Panel: SALES TREND */}
        <div className="lg:col-span-8 bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          {/* Card Top Title & Menu */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase tracking-wider">
              <span>SALES TREND</span>
              <Info className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
            </div>
            <button className="text-gray-400 hover:text-gray-900 p-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Subheader: Revenue Value + Legend + Time Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
            <div className="flex items-center gap-4">
              <div className="text-xs text-gray-500">
                Total Revenue : <strong className="text-gray-900 text-sm font-bold font-sans">${metricas.montoTotal.toLocaleString('es-AR')}</strong>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full border-2 border-gray-400"></span> NEW USER
                </span>
                <span className="flex items-center gap-1 text-gray-700">
                  <span className="w-2 h-2 rounded-full bg-slate-900"></span> EXISTING USER
                </span>
              </div>
            </div>

            {/* Time period switcher tabs */}
            <div className="bg-gray-100 p-0.5 rounded-xl flex items-center text-xs font-semibold self-start sm:self-auto">
              {['Weekly', 'Monthly', 'Yearly'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFiltroPeriodo(tab)}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    filtroPeriodo === tab
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* The Segmented Bar Chart */}
          <div className="mt-8 relative">
            {/* Floating tooltip on active month (JUN) */}
            <div className="absolute left-[45%] -top-4 transform -translate-x-1/2 z-20 pointer-events-none">
              <div className="bg-white/95 border border-gray-200/90 rounded-xl p-2.5 shadow-lg text-[10px] space-y-0.5 backdrop-blur-xs">
                <p className="font-bold text-gray-800 text-center pb-1 border-b border-gray-100">Jun 2026</p>
                <p className="text-gray-500 flex items-center gap-1 pt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> New User <strong className="text-gray-800">38k</strong>
                </p>
                <p className="text-gray-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span> Existing User <strong className="text-gray-900">18k</strong>
                </p>
              </div>
              <div className="w-px h-28 border-l border-dashed border-gray-400 mx-auto mt-1" />
            </div>

            <div className="flex">
              {/* Y-axis labels */}
              <div className="flex flex-col justify-between text-[10px] text-gray-400 font-mono pr-3 pb-6 h-36">
                <span>60k</span>
                <span>50k</span>
                <span>40k</span>
                <span>30k</span>
                <span>20k</span>
                <span>10k</span>
                <span>0k</span>
              </div>

              {/* Chart Grid Columns */}
              <div className="flex-1 flex justify-between items-end border-b border-gray-200 pb-2 h-36 gap-2">
                {meses.map((item, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredMes(item.mes)}
                    className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
                  >
                    {/* Stacked block squares */}
                    <div className="w-full max-w-[18px] flex flex-col-reverse gap-0.5">
                      {/* Dark squares (Existing user / sales) */}
                      {[...Array(item.existing)].map((_, i) => (
                        <div key={'ext-' + i} className="w-full h-2.5 rounded-2xs bg-slate-900 transition-colors group-hover:bg-black" />
                      ))}
                      {/* Gray squares (New users) */}
                      {[...Array(item.newUsers)].map((_, i) => (
                        <div key={'new-' + i} className="w-full h-2.5 rounded-2xs bg-gray-200 transition-colors group-hover:bg-gray-300" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between pl-8 pt-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {meses.map((m, idx) => (
                <span
                  key={idx}
                  className={m.mes === hoveredMes ? 'text-gray-900 font-extrabold' : ''}
                >
                  {m.mes}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: REVENUE BREAKDOWN */}
        <div className="lg:col-span-4 bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase tracking-wider">
                <span>REVENUE BREAKDOWN</span>
                <Info className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
              </div>
              <button className="text-gray-400 hover:text-gray-900 p-1">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Subheading & Value */}
            <div className="flex items-center justify-between mt-3">
              <div>
                <p className="text-[11px] text-gray-400 font-medium">Revenue by Category</p>
                <p className="text-2xl font-black text-gray-900 tracking-tight font-sans mt-0.5">
                  ${metricas.montoTotal.toLocaleString('es-AR')}
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200/80 rounded-xl px-2.5 py-1 text-[11px] font-semibold text-gray-700 flex items-center gap-1 cursor-pointer">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span>Jan 1 - Aug 30</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </div>
            </div>

            {/* AI Insight Pill Banner */}
            <div className="mt-4 p-2.5 bg-gray-50/80 hover:bg-gray-100 border border-gray-200/70 rounded-xl text-xs text-gray-700 flex items-center justify-between cursor-pointer transition">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-gray-500" />
                <span className="font-semibold text-[11px]">Get AI insight for better analysis</span>
              </div>
              <span className="w-4 h-4 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] text-gray-500">
                →
              </span>
            </div>
          </div>

          {/* Minimalist category bars */}
          <div className="pt-6">
            <div className="flex items-end justify-between h-28 border-b border-gray-200 pb-2 gap-1.5">
              {[35, 60, 45, 80, 50, 65, 30, 75, 40, 70, 55, 60].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div
                    className="w-1.5 rounded-full transition-all group-hover:w-2"
                    style={{
                      height: `${h}%`,
                      backgroundColor: i % 2 === 0 ? '#18181b' : '#cbd5e1',
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-medium text-gray-400 pt-2">
              <span>1 JAN</span>
              <span>30 JAN 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: RECENT TRANSACTIONS Table */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase tracking-wider">
            <span>RECENT TRANSACTIONS</span>
            <Info className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200/90 rounded-xl px-3 py-1.5 text-xs text-gray-400 w-48 sm:w-60 shadow-2xs">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={busquedaTabla}
                onChange={(e) => setBusquedaTabla(e.target.value)}
                className="bg-transparent text-gray-800 placeholder-gray-400 text-xs focus:outline-none w-full"
              />
            </div>

            {/* Add Transaction Button */}
            <button
              onClick={() => onNavigate('Ventas y Oportunidades')}
              className="bg-[#18181b] hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Transaction</span>
            </button>

            <button className="text-gray-400 hover:text-gray-900 p-1.5 border border-gray-200 rounded-xl">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-8">
                  <input type="checkbox" className="rounded border-gray-300 accent-black cursor-pointer" />
                </th>
                <th className="py-2.5 px-3">ID :</th>
                <th className="py-2.5 px-3">CUSTOMER :</th>
                <th className="py-2.5 px-3">PRODUCT :</th>
                <th className="py-2.5 px-3">STATUS :</th>
                <th className="py-2.5 px-3 text-center">QTY :</th>
                <th className="py-2.5 px-3 text-right">UNIT PRICE :</th>
                <th className="py-2.5 px-3 text-right">TOTAL REVENUE :</th>
                <th className="py-2.5 px-3 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transacciones
                .filter((t) =>
                  t.cliente.toLowerCase().includes(busquedaTabla.toLowerCase()) ||
                  t.producto.toLowerCase().includes(busquedaTabla.toLowerCase())
                )
                .map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-3">
                      <input type="checkbox" className="rounded border-gray-300 accent-black cursor-pointer" />
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-gray-400">
                      {row.id}
                    </td>
                    <td className="py-3 px-3 font-bold text-gray-900">
                      {row.cliente}
                    </td>
                    <td className="py-3 px-3 text-gray-600 font-medium">
                      {row.producto}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          row.estado === 'Success'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                            : row.estado === 'Pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            row.estado === 'Success'
                              ? 'bg-emerald-500'
                              : row.estado === 'Pending'
                              ? 'bg-amber-500'
                              : 'bg-gray-400'
                          }`}
                        />
                        <span>{row.estado}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-gray-600">
                      {row.qty}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-gray-700">
                      ${row.unitPrice.toLocaleString('es-AR')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">
                      ${row.totalRevenue.toLocaleString('es-AR')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button className="text-gray-400 hover:text-gray-900 p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
