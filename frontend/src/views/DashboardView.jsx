import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Car,
  Users,
  Target,
  Receipt,
  Clock,
  Wrench,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const DashboardView = ({ onNavigate }) => {
  const { usuario } = useAuth();
  const esAdmin = usuario?.perfiles?.includes('ADMIN');

  const modulos = [
    {
      titulo: 'Catálogo de Vehículos',
      descripcion: 'Inventario de 0km y usados disponibles en salón y depósito.',
      modulo: 'Catálogo de Vehículos',
      icono: Car,
    },
    {
      titulo: 'Padrón de Contactos',
      descripcion: 'Gestión unificada de prospectos, clientes particulares y empresas.',
      modulo: 'Contactos',
      icono: Users,
    },
    {
      titulo: 'Embudo de Oportunidades',
      descripcion: 'Seguimiento comercial en tablero Kanban por etapas.',
      modulo: 'Ventas y Oportunidades',
      icono: Target,
    },
    {
      titulo: 'Facturación Electrónica',
      descripcion: 'Emisión con CAE AFIP y administración de cobranzas.',
      modulo: 'Facturación y Caja',
      icono: Receipt,
    },
    {
      titulo: 'Test Drive',
      descripcion: 'Agenda de demostraciones, validación de licencias y coordinación comercial.',
      modulo: 'Test Drive',
      icono: Clock,
    },
    {
      titulo: 'Tasaciones y Permutas',
      descripcion: 'Peritaje técnico mecánico e ingreso de usados a stock.',
      modulo: 'Tasaciones y Permutas',
      icono: Wrench,
    },
    ...(esAdmin
      ? [
          {
            titulo: 'Gestión de Personal',
            descripcion: 'Alta de nuevos usuarios, vendedores y control de accesos.',
            modulo: 'Gestión de Personal',
            icono: ShieldCheck,
          },
        ]
      : []),
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header sobrio y liviano */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Hola, {usuario?.nombreCompleto || 'Usuario'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Panel de inicio limpio. Seleccioná una sección del menú lateral o usá los accesos a continuación.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Sesión activa · {usuario?.rol || 'Operador'}
          </span>
        </div>
      </div>

      {/* Accesos directos limpios y funcionales */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
          Accesos Directos a Módulos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modulos.map((m, idx) => {
            const Icono = m.icono;
            return (
              <button
                key={idx}
                onClick={() => onNavigate(m.modulo)}
                className="bg-white hover:bg-gray-50/80 border border-gray-200/80 hover:border-gray-300 rounded-2xl p-5 text-left shadow-xs transition-all group flex flex-col justify-between cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-[#18181b] group-hover:text-white text-gray-800 flex items-center justify-center transition-colors shadow-2xs">
                    <Icono className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-black">
                      {m.titulo}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {m.descripcion}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-600 group-hover:text-gray-900">
                  <span>Ingresar</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
