import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Bell } from 'lucide-react';

export const Navbar = ({ titulo }) => {
  const { usuario } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">{titulo}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Sucursal Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
          <Building2 className="w-3.5 h-3.5 text-blue-400" />
          <span>Sucursal: <strong className="text-white">{usuario?.sucursal || 'Central'}</strong></span>
        </div>

        {/* Notifications Icon (Mock) */}
        <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
