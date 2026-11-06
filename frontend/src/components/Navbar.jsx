import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import {
  Building2,
  Bell,
  Search,
  Calculator,
  Clock,
  Wrench,
  Target,
  Check,
  ArrowUpRight,
  X,
  Inbox,
  User,
  LogOut,
  Car,
  Eye,
} from 'lucide-react';
import { SimuladorFinancieroModal } from './SimuladorFinancieroModal';

export const Navbar = ({ titulo, onNavigate, onAbrirModoPublico }) => {
  const { usuario, logout } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [leidas, setLeidas] = useState([]);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [userMenuAbierto, setUserMenuAbierto] = useState(false);
  const [simuladorAbierto, setSimuladorAbierto] = useState(false);
  const menuRef = useRef(null);
  const userMenuRef = useRef(null);

  // Consulta alertas operativas activas
  const cargarAlertas = async () => {
    try {
      const [testDrives, tasaciones, oportunidades] = await Promise.all([
        apiFetch('/test-drives').catch(() => []),
        apiFetch('/tasaciones').catch(() => []),
        apiFetch('/oportunidades').catch(() => []),
      ]);

      const lista = [];

      // 1. Alertas de Test Drives
      testDrives
        .filter((td) => td.estado === 'PROGRAMADO')
        .slice(0, 3)
        .forEach((td) => {
          lista.push({
            id: `td-${td.id}`,
            modulo: 'Test Drive',
            icono: Clock,
            color: 'text-blue-600 bg-blue-50 border-blue-200',
            titulo: 'Turno de Test Drive',
            detalle: `${td.cliente?.nombres} ${td.cliente?.apellido || ''} · ${td.vehiculo?.marca} ${td.vehiculo?.modelo}`,
            tiempo: new Date(td.fechaHora).toLocaleDateString('es-AR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }),
          });
        });

      // 2. Alertas de Tasaciones pendientes
      tasaciones
        .filter((t) => t.estado === 'PENDIENTE_PERITAJE' || t.estado === 'PENDIENTE_APROBACION')
        .slice(0, 3)
        .forEach((t) => {
          lista.push({
            id: `tas-${t.id}`,
            modulo: 'Tasaciones y Permutas',
            icono: Wrench,
            color: 'text-amber-600 bg-amber-50 border-amber-200',
            titulo: t.estado === 'PENDIENTE_PERITAJE' ? 'Peritaje Pendiente' : 'Aprobación de Valor',
            detalle: `${t.marca} ${t.modelo} (${t.dominio}) · ${t.cliente?.nombres || 'Cliente'}`,
            tiempo: 'Acción requerida',
          });
        });

      // 3. Alertas de Oportunidades en RESERVADO
      oportunidades
        .filter((o) => o.etapa === 'RESERVADO')
        .slice(0, 3)
        .forEach((o) => {
          lista.push({
            id: `opo-${o.id}`,
            modulo: 'Ventas y Oportunidades',
            icono: Target,
            color: 'text-purple-600 bg-purple-50 border-purple-200',
            titulo: 'Unidad Reservada en Pizarra',
            detalle: `${o.cliente?.nombres} · $${Number(o.montoEstimado).toLocaleString('es-AR')}`,
            tiempo: 'Stock retenido',
          });
        });

      setNotificaciones(lista);
    } catch (err) {
      console.warn('No se pudieron sincronizar las notificaciones:', err);
    }
  };

  useEffect(() => {
    cargarAlertas();
    const interval = setInterval(cargarAlertas, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAbierto(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const noLeidas = notificaciones.filter((n) => !leidas.includes(n.id));

  const marcarTodasLeidas = () => {
    setLeidas(notificaciones.map((n) => n.id));
  };

  const handleClickNotificacion = (n) => {
    setLeidas((prev) => [...prev, n.id]);
    setMenuAbierto(false);
    if (onNavigate && n.modulo) {
      onNavigate(n.modulo);
    }
  };

  return (
    <>
      <header className="h-16 border-b border-gray-200/80 bg-white/70 backdrop-blur-md px-6 flex items-center justify-between shrink-0 relative z-40 font-sans">
        {/* Breadcrumb Navigation matching the design */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-gray-400">Dashboard</span>
          <span className="text-gray-300 font-semibold">&gt;</span>
          <h2 className="font-bold text-gray-900 tracking-tight">{titulo}</h2>
        </div>

        {/* Right Tools Area */}
        <div className="flex items-center gap-3">
          {/* Quick Search Bar with shortcut */}
          <div className="hidden sm:flex items-center gap-2 bg-white border border-gray-200/90 rounded-xl px-3 py-1.5 text-xs text-gray-400 w-52 lg:w-64 shadow-2xs">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent text-gray-800 placeholder-gray-400 text-xs focus:outline-none w-full"
            />
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200 shrink-0">
              ⌘ K
            </kbd>
          </div>

          {/* Quick Simulator Tool */}
          <button
            onClick={() => setSimuladorAbierto(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-semibold transition cursor-pointer shadow-2xs"
            title="Simulador de Crédito Prendario"
          >
            <Calculator className="w-3.5 h-3.5 text-gray-500" />
            <span>Simulador</span>
          </button>

          {/* Quick Showroom Link */}
          {onAbrirModoPublico && (
            <button
              onClick={onAbrirModoPublico}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition cursor-pointer shadow-2xs"
              title="Abrir vista pública del salón / Modo Totem para clientes"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Salón Clientes</span>
            </button>
          )}

          {/* Notifications Bell */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition cursor-pointer shadow-2xs relative"
              title="Notificaciones operativas del sistema"
            >
              <Bell className="w-4 h-4" />
              {noLeidas.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
              )}
            </button>

            {/* Dropdown Menu */}
            {menuAbierto && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Centro de Alertas
                    </span>
                    {noLeidas.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-900 text-white">
                        {noLeidas.length} nuevas
                      </span>
                    )}
                  </div>
                  {noLeidas.length > 0 && (
                    <button
                      onClick={marcarTodasLeidas}
                      className="text-[11px] text-gray-500 hover:text-gray-900 flex items-center gap-1 transition cursor-pointer font-medium"
                    >
                      <Check className="w-3 h-3" />
                      <span>Marcar leídas</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 custom-scrollbar">
                  {notificaciones.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs">
                      No hay alertas operativas pendientes en este momento.
                    </div>
                  ) : (
                    notificaciones.map((n) => {
                      const Icon = n.icono;
                      const esLeida = leidas.includes(n.id);

                      return (
                        <div
                          key={n.id}
                          onClick={() => handleClickNotificacion(n)}
                          className={`p-3.5 hover:bg-gray-50 transition cursor-pointer flex items-start gap-3 ${
                            esLeida ? 'opacity-60' : 'bg-white'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${n.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-gray-900 truncate">{n.titulo}</p>
                              <span className="text-[10px] text-gray-400 whitespace-nowrap">{n.tiempo}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{n.detalle}</p>
                            <span className="inline-flex items-center gap-1 text-[10px] text-gray-900 font-semibold mt-1">
                              <span>Ir a {n.modulo.split(' ')[0]}</span>
                              <ArrowUpRight className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Avatar Circle & Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuAbierto(!userMenuAbierto)}
              className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-2xs hover:bg-black transition cursor-pointer"
              title="Opciones de cuenta"
            >
              {usuario?.nombreCompleto?.[0] || 'U'}
            </button>

            {userMenuAbierto && (
              <div className="absolute right-0 top-12 w-64 bg-white border border-gray-200/90 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 font-sans">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {usuario?.nombreCompleto || 'Usuario'}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">{usuario?.email}</p>
                  <div className="mt-1.5 inline-block px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-semibold text-gray-700 uppercase">
                    {usuario?.perfiles?.[0] || 'Colaborador'}
                  </div>
                </div>

                <div className="p-1.5 space-y-0.5">
                  {onAbrirModoPublico && (
                    <button
                      onClick={() => {
                        setUserMenuAbierto(false);
                        onAbrirModoPublico();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                    >
                      <Car className="w-4 h-4 text-gray-500" />
                      <span>Ver Salón de Clientes</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setUserMenuAbierto(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Financial Simulator Modal */}
      {simuladorAbierto && (
        <SimuladorFinancieroModal onClose={() => setSimuladorAbierto(false)} />
      )}
    </>
  );
};
