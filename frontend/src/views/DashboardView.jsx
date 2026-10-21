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
  Sparkles,
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
      titulo: 'Contactos y Leads',
      valor: metricas.clientes,
      icono: Users,
      color: 'from-blue-600 to-indigo-600',
      modulo: 'Contactos',
    },
    {
      titulo: 'Autos Disponibles',
      valor: metricas.vehiculos,
      icono: Car,
      color: 'from-emerald-600 to-teal-600',
      modulo: 'Catálogo de Vehículos',
    },
    {
      titulo: 'Oportunidades Activas',
      valor: metricas.oportunidades,
      icono: Target,
      color: 'from-violet-600 to-purple-600',
      modulo: 'Ventas y Oportunidades',
    },
    {
      titulo: 'Pipeline en Negociación',
      valor: `$${metricas.montoTotal.toLocaleString('es-AR')}`,
      icono: DollarSign,
      color: 'from-amber-600 to-orange-600',
      modulo: 'Ventas y Oportunidades',
    },
  ];

  // Estado 1: Dashboard vacío al inicio para ahorrar 100% de la carga del servidor
  if (!mostrarMetricas) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="max-w-md w-full bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-sm space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center mx-auto text-white shadow-xl shadow-blue-500/20">
            <Car className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">AUTO CRM</h2>
            <p className="text-xs text-slate-400 mt-1">Concesionaria Oficial · Sistema Comercial</p>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-semibold">
                Hola, {usuario?.nombreCompleto || 'Usuario'} 👋
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                {usuario?.perfiles?.[0] || 'Vendedor'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Panel de inicio disponible. Seleccioná cualquiera de tus módulos autorizados en el <strong>menú lateral izquierdo</strong> para comenzar.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2.5">
            <button
              onClick={cargarDatos}
              disabled={cargando}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 border border-slate-700 shadow-sm cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span>{cargando ? 'Consultando datos...' : 'Cargar Métricas y KPIs en Vivo'}</span>
            </button>
            <span className="text-[10px] text-slate-500">
              Modo ahorro de recursos activo: no se realizan consultas a la base de datos hasta que las solicites.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Estado 2: Dashboard con métricas cargadas a demanda
  return (
    <div className="p-8 space-y-8">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/20 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" /> Desempeño Comercial
          </span>
          <h2 className="text-xl font-bold text-white mt-1">Panel de Control de la Concesionaria</h2>
          <p className="text-xs text-slate-400 mt-0.5">Métricas actualizadas bajo demanda desde MySQL.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={cargarDatos}
            disabled={cargando}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
            title="Refrescar métricas"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin text-blue-400' : ''}`} />
            <span>Refrescar</span>
          </button>
          <button
            onClick={() => onNavigate('Contactos')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 transition flex items-center gap-1.5"
          >
            <span>Ver Clientes</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigate('Ventas y Oportunidades')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
          >
            <span>Tablero Kanban</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigate('Pruebas de Manejo (Test Drives)')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
          >
            <span>Test Drives</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigate('Tasaciones y Permutas')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/30 transition flex items-center gap-1.5"
          >
            <span>Tasaciones</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
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
              className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 hover:shadow-xl hover:shadow-slate-950/50 transition cursor-pointer group"
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

      {/* Info card regarding business logic */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-400" />
          Reglas de Negocio Implementadas en esta versión
        </h3>
        <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
          <li><strong>Party Model de la Pizarra:</strong> Los contactos centralizan tanto personas físicas como jurídicas (DNI o CUIT).</li>
          <li><strong>Bloqueo automático de stock:</strong> Al mover una oportunidad a <span className="text-amber-400 font-semibold">RESERVADO</span>, el vehículo se bloquea automáticamente en el catálogo para evitar ventas duplicadas.</li>
          <li><strong>Liberación de stock:</strong> Si una oportunidad pasa a <span className="text-rose-400 font-semibold">PERDIDA</span>, el auto vuelve a quedar <span className="text-emerald-400 font-semibold">DISPONIBLE</span>.</li>
          <li><strong>Seguridad de Menús:</strong> El menú lateral responde dinámicamente a los permisos registrados en la base de datos MySQL.</li>
        </ul>
      </div>
    </div>
  );
};
