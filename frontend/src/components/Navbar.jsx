import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Bell, ChevronRight, Activity } from 'lucide-react';

export const Navbar = ({ titulo }) => {
  const { usuario } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-slate-500 uppercase tracking-wider">AUTO CRM</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <h2 className="text-sm font-bold text-white tracking-tight">{titulo}</h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Live System Connectivity Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-[11px]">En línea · MySQL Activo</span>
        </div>

        {/* Sucursal Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
          <Building2 className="w-3.5 h-3.5 text-blue-400" />
          <span>Sucursal: <strong className="text-white">{usuario?.sucursal || 'Central'}</strong></span>
        </div>

        {/* Notifications Icon (Mock) */}
        <button
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition cursor-pointer"
          title="Notificaciones del sistema"
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
