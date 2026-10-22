import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import {
  Building2,
  Bell,
  ChevronRight,
  Activity,
  Calculator,
  Clock,
  Wrench,
  Target,
  Check,
  ArrowUpRight,
  X,
} from 'lucide-react';
import { SimuladorFinancieroModal } from './SimuladorFinancieroModal';

export const Navbar = ({ titulo, onNavigate }) => {
  const { usuario } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [leidas, setLeidas] = useState([]);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [simuladorAbierto, setSimuladorAbierto] = useState(false);
  const menuRef = useRef(null);

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
            modulo: 'Pruebas de Manejo (Test Drives)',
            icono: Clock,
            color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
            titulo: 'Test Drive Programado',
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
            color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
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
            color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
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
    const interval = setInterval(cargarAlertas, 60000); // Actualiza cada 1 min
    return () => clearInterval(interval);
  }, []);

  // Cierra el menú al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAbierto(false);
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
      <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0 relative z-40">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500 uppercase tracking-wider">AUTO CRM</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <h2 className="text-sm font-bold text-white tracking-tight">{titulo}</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Financial Simulator Button */}
          <button
            onClick={() => setSimuladorAbierto(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
            title="Simulador de Crédito Prendario y Cuotas"
          >
            <Calculator className="w-3.5 h-3.5 text-blue-400" />
            <span>Simulador Cuotas</span>
          </button>

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

          {/* Interactive Notifications Center */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition cursor-pointer relative"
              title="Notificaciones operativas del sistema"
            >
              <Bell className="w-4 h-4" />
              {noLeidas.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
              )}
            </button>

            {/* Dropdown Menu */}
            {menuAbierto && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Centro de Alertas
                    </span>
                    {noLeidas.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {noLeidas.length} nuevas
                      </span>
                    )}
                  </div>
                  {noLeidas.length > 0 && (
                    <button
                      onClick={marcarTodasLeidas}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      <span>Marcar leídas</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
                  {notificaciones.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
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
                          className={`p-3.5 hover:bg-slate-800/50 transition cursor-pointer flex items-start gap-3 ${
                            esLeida ? 'opacity-60' : 'bg-slate-950/30'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${n.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-white truncate">{n.titulo}</p>
                              <span className="text-[10px] text-slate-500 whitespace-nowrap">{n.tiempo}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{n.detalle}</p>
                            <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 font-semibold mt-1">
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
        </div>
      </header>

      {/* Global Financial Simulator Modal */}
      {simuladorAbierto && (
        <SimuladorFinancieroModal onClose={() => setSimuladorAbierto(false)} />
      )}
    </>
  );
};
