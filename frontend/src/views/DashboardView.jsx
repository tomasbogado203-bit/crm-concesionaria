import React, { useState } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Car,
  Target,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  BarChart3,
  RotateCcw,
  Shield,
  Activity,
} from 'lucide-react';

export const DashboardView = ({ onNavigate }) => {
  const { usuario } = useAuth();
  const [mostrarMetricas, setMostrarMetricas] = useState(false);
  const [metricas, setMetricas] = useState({
    clientes: 0,
    vehiculos: 0,
    oportunidades: 0,
    montoTotal: 0,
  });
  const [cargando, setCargando] = useState(false);

  // Carga únicamente a demanda cuando el usuario lo solicita explícitamente
  const cargarDatos = async () => {
    setCargando(true);
    setMostrarMetricas(true);
    try {
      const [clientes, vehiculos, oportunidades] = await Promise.all([
        apiFetch('/clientes').catch(() => []),
        apiFetch('/vehiculos').catch(() => []),
        apiFetch('/oportunidades').catch(() => []),
      ]);

      const monto = oportunidades.reduce((acc, curr) => acc + Number(curr.montoEstimado || 0), 0);

      setMetricas({
        clientes: clientes.length,
        vehiculos: vehiculos.filter((v) => v.estado === 'DISPONIBLE').length,
        oportunidades: oportunidades.length,
        montoTotal: monto,
      });
    } catch (err) {
      console.error('Error cargando métricas:', err);
    } finally {
      setCargando(false);
    }
  };

  const cards = [
    {
      titulo: 'Contactos Registrados',
      valor: metricas.clientes,
      icono: Users,
      color: 'from-blue-600 to-indigo-600',
      modulo: 'Contactos',
    },
    {
      titulo: 'Vehículos en Stock',
      valor: metricas.vehiculos,
      icono: Car,
      color: 'from-emerald-600 to-teal-600',
      modulo: 'Catálogo de Vehículos',
    },
    {
      titulo: 'Oportunidades en Curso',
      valor: metricas.oportunidades,
      icono: Target,
      color: 'from-violet-600 to-purple-600',
      modulo: 'Ventas y Oportunidades',
    },
    {
      titulo: 'Pipeline Total Estimado',
      valor: `$${metricas.montoTotal.toLocaleString('es-AR')}`,
      icono: DollarSign,
      color: 'from-amber-600 to-orange-600',
      modulo: 'Ventas y Oportunidades',
    },
  ];

  // Estado 1: Dashboard optimizado al inicio para evitar sobrecarga del servidor y latencia
  if (!mostrarMetricas) {
    return (
      <div className="min-h-[82vh] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="max-w-lg w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md space-y-6">
          {/* Header Status & Brand Monogram */}
          <div className="flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700/80 text-[11px] font-medium text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Sistema Operativo · Conexión En Línea</span>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center shadow-lg shadow-black/40">
              <Car className="w-8 h-8 text-blue-400" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">AUTO CRM CONCESIONARIA</h2>
              <p className="text-xs text-slate-400 mt-0.5">Plataforma Integral de Gestión Comercial y Postventa</p>
            </div>
          </div>

          {/* User & Role Details */}
          <div className="p-4 bg-slate-950/80 border border-slate-800/90 rounded-xl text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block">Usuario Activo</span>
                <span className="text-sm font-semibold text-white">
                  {usuario?.nombreCompleto || 'Usuario del Sistema'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wide">
                  {usuario?.perfiles?.[0] || 'Vendedor'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-800/80 pt-2">
              Seleccione un módulo en el menú lateral izquierdo para acceder a sus funciones operativas autorizadas.
            </p>
          </div>

          {/* Action to query metrics */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2.5">
            <button
              onClick={cargarDatos}
              disabled={cargando}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-60"
            >
              <BarChart3 className="w-4 h-4 text-blue-200" />
              <span>{cargando ? 'Consultando métricas en base de datos...' : 'Cargar Indicadores y KPIs en Tiempo Real'}</span>
            </button>
            <p className="text-[11px] text-slate-500">
              Inicio optimizado: consultas diferidas a la base de datos para máxima velocidad de respuesta.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Estado 2: Dashboard con métricas cargadas a demanda
  return (
    <div className="p-8 space-y-8">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" /> Desempeño Comercial
          </span>
          <h2 className="text-xl font-bold text-white mt-1">Panel de Control de la Concesionaria</h2>
          <p className="text-xs text-slate-400 mt-0.5">Indicadores consolidados desde la base de datos MySQL.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={cargarDatos}
            disabled={cargando}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            title="Refrescar métricas"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin text-blue-400' : ''}`} />
            <span>Refrescar</span>
          </button>
          <button
            onClick={() => onNavigate('Contactos')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
          >
            <span>Clientes</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button
            onClick={() => onNavigate('Ventas y Oportunidades')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
          >
            <span>Tablero Kanban</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button
            onClick={() => onNavigate('Pruebas de Manejo (Test Drives)')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
          >
            <span>Test Drives</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button
            onClick={() => onNavigate('Tasaciones y Permutas')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
          >
            <span>Tasaciones</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c, i) => {
          const Icon = c.icono;
          return (
            <div
              key={i}
              onClick={() => onNavigate(c.modulo)}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 hover:shadow-xl hover:shadow-slate-950/50 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-slate-400">{c.titulo}</span>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${c.color} flex items-center justify-center shadow-md`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {cargando ? '...' : c.valor}
              </div>
              <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1 group-hover:text-blue-400 transition">
                <span>Acceder al módulo</span>
                <ArrowUpRight className="w-3 h-3" />
              </p>
            </div>
          );
        })}
      </div>

      {/* Corporate Business Rules Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-2.5 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-400" />
          Reglas de Negocio Implementadas
        </h3>
        <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside leading-relaxed">
          <li><strong>Party Model Centralizado:</strong> Los contactos unifican personas físicas y jurídicas (DNI o CUIT) con perfil 360°.</li>
          <li><strong>Reserva Automática de Unidades:</strong> Al avanzar una oportunidad a estado <span className="text-amber-400 font-semibold">RESERVADO</span>, el vehículo se bloquea automáticamente en el catálogo para prevenir duplicaciones.</li>
          <li><strong>Restitución de Stock:</strong> Si una oportunidad concluye como <span className="text-rose-400 font-semibold">PERDIDA</span>, la unidad retorna a estado <span className="text-emerald-400 font-semibold">DISPONIBLE</span>.</li>
          <li><strong>Control de Accesos RBAC:</strong> La navegación y permisos de acción se aplican dinámicamente según la matriz registrada en la base de datos MySQL.</li>
        </ul>
      </div>
    </div>
  );
};
