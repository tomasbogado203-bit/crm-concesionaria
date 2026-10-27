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
  ChevronsUpDown,
  ChevronRight,
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

const CATEGORIAS = [
  {
    titulo: 'Main Menu',
    modulos: ['Dashboard', 'Catálogo de Vehículos', 'Ventas y Oportunidades'],
  },
  {
    titulo: 'Customers',
    modulos: ['Contactos', 'Pruebas de Manejo (Test Drives)', 'Tasaciones y Permutas'],
  },
  {
    titulo: 'Management',
    modulos: ['Facturación y Caja', 'Configuración y Seguridad'],
  },
];

export const Sidebar = ({ vistaActiva, setVistaActiva }) => {
  const { usuario, menus, logout } = useAuth();

  const menuNombres = menus.map((m) => m.nombre);

  return (
    <aside className="w-64 bg-[#f8f9fa] border-r border-gray-200/80 flex flex-col h-screen select-none shrink-0 font-sans">
      {/* Top Brand Selector Card */}
      <div className="p-4 border-b border-gray-200/80">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Car className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Agency</span>
              <span className="text-xs font-bold text-gray-900 tracking-tight">Auto CRM Team</span>
            </div>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>

      {/* Navigation List Grouped by Sections */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
        {CATEGORIAS.map((cat, idx) => {
          // Filtra según los permisos asignados al usuario
          const modulosVisibles = cat.modulos.filter((nombre) => menuNombres.includes(nombre));
          if (modulosVisibles.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                {cat.titulo}
              </div>

              {modulosVisibles.map((nombre) => {
                const Icon = ICON_MAP[nombre] || LayoutDashboard;
                const isActive = vistaActiva === nombre;

                return (
                  <button
                    key={nombre}
                    onClick={() => setVistaActiva(nombre)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                      isActive
                        ? 'bg-white shadow-xs border border-gray-200/90 text-gray-900 font-semibold'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/40 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
                      <span>{nombre}</span>
                    </div>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Bottom User Profile Card */}
      <div className="p-3 border-t border-gray-200/80 bg-[#f8f9fa]">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
              {usuario?.nombreCompleto?.[0] || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate leading-tight">
                {usuario?.nombreCompleto || 'Usuario'}
              </p>
              <p className="text-[10px] text-gray-500 truncate mt-0.5 font-medium">
                {usuario?.perfiles?.[0] || 'Sales Operator'}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Cerrar Sesión"
            className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
