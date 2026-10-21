import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Target,
  Car,
  Clock,
  Wrench,
  Receipt,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

const ICON_MAP = {
  Dashboard: LayoutDashboard,
  Contactos: Users,
  'Ventas y Oportunidades': Target,
  'Catálogo de Vehículos': Car,
  'Pruebas de Manejo (Test Drives)': Clock,
  'Tasaciones y Permutas': Wrench,
  'Facturación y Caja': Receipt,
  'Configuración y Seguridad': Settings,
};

export const Sidebar = ({ vistaActiva, setVistaActiva }) => {
  const { usuario, menus, logout } = useAuth();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Car className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-base text-white tracking-wide">AUTO CRM</h1>
          <p className="text-xs text-blue-400 font-medium">Concesionaria Oficial</p>
        </div>
      </div>

      {/* Dynamic Navigation list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Módulos Autorizados
        </div>

        {menus.map((m) => {
          const Icon = ICON_MAP[m.nombre] || LayoutDashboard;
          const isActive = vistaActiva === m.nombre;

          return (
            <button
              key={m.id}
              onClick={() => setVistaActiva(m.nombre)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                <span>{m.nombre}</span>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform ${
                  isActive ? 'rotate-90 text-white' : 'opacity-0 group-hover:opacity-100 text-slate-500'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-blue-400">
            {usuario?.nombreCompleto?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{usuario?.nombreCompleto}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                {usuario?.perfiles?.[0] || 'Vendedor'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-600/20 border border-rose-500/20 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
