import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { ContactosView } from './views/ContactosView';
import { OportunidadesView } from './views/OportunidadesView';
import { VehiculosView } from './views/VehiculosView';
import { FacturacionView } from './views/FacturacionView';
import { TestDrivesView } from './views/TestDrivesView';
import { TasacionesView } from './views/TasacionesView';
import { UsuariosAdminView } from './views/UsuariosAdminView';
import { Construction, ShieldAlert } from 'lucide-react';

const MODULO_ALIASES = {
  'Catálogo e Inventario': 'Catálogo de Vehículos',
  'Padrón de Contactos': 'Contactos',
  'Facturación y Cobranzas': 'Facturación y Caja',
  'Test Drives (Pruebas)': 'Pruebas de Manejo (Test Drives)',
  'Tasaciones de Usados': 'Tasaciones y Permutas',
};

const MainLayout = () => {
  const { token, usuario, menus, cargando } = useAuth();
  const [vistaActiva, setVistaActivaState] = useState('Dashboard');

  const setVistaActiva = (modulo) => {
    setVistaActivaState(MODULO_ALIASES[modulo] || modulo);
  };

  // Si se cierra sesión, resetear la vista activa a Dashboard
  useEffect(() => {
    if (!token) {
      setVistaActiva('Dashboard');
    }
  }, [token]);

  // Protección de rutas: si se cambia de usuario y la vista previa no está autorizada, resetear a Dashboard
  useEffect(() => {
    if (menus && menus.length > 0) {
      const nombresAutorizados = menus.map((m) => m.nombre);
      const puedeVerGestion =
        usuario?.perfiles?.includes('ADMIN') || nombresAutorizados.includes('Configuración y Seguridad');

      const permitida =
        vistaActiva === 'Dashboard' ||
        nombresAutorizados.includes(vistaActiva) ||
        ((vistaActiva === 'Gestión de Personal' || vistaActiva === 'Configuración y Seguridad') && puedeVerGestion);

      if (!permitida) {
        setVistaActiva('Dashboard');
      }
    }
  }, [usuario?.id, menus, vistaActiva]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center text-gray-500 text-sm">
        Cargando CRM Concesionaria...
      </div>
    );
  }

  if (!token) {
    return <LoginView />;
  }

  const renderVista = () => {
    // Control estricto de acceso RBAC: validar si el menú pertenece a los módulos autorizados del perfil
    const nombresAutorizados = menus.map((m) => m.nombre);
    const puedeVerGestion =
      usuario?.perfiles?.includes('ADMIN') || nombresAutorizados.includes('Configuración y Seguridad');

    const esAutorizado =
      vistaActiva === 'Dashboard' ||
      nombresAutorizados.includes(vistaActiva) ||
      ((vistaActiva === 'Gestión de Personal' || vistaActiva === 'Configuración y Seguridad') && puedeVerGestion);

    if (!esAutorizado) {
      return (
        <div className="p-12 flex flex-col items-center justify-center text-center text-gray-500 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shadow-xs">
            <ShieldAlert className="w-8 h-8 text-rose-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900">Módulo No Autorizado: {vistaActiva}</h3>
            <p className="text-xs max-w-md text-gray-500">
              Según la matriz de permisos RBAC, tu perfil actual (<strong>{usuario?.perfiles?.[0] || 'Colaborador'}</strong>) no
              cuenta con autorización para acceder a este módulo.
            </p>
          </div>
          <button
            onClick={() => setVistaActiva('Dashboard')}
            className="px-4 py-2 bg-[#18181b] hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            Volver al Dashboard
          </button>
        </div>
      );
    }

    switch (vistaActiva) {
      case 'Dashboard':
        return <DashboardView onNavigate={(modulo) => setVistaActiva(modulo)} />;
      case 'Contactos':
        return <ContactosView />;
      case 'Ventas y Oportunidades':
        return <OportunidadesView />;
      case 'Catálogo de Vehículos':
        return <VehiculosView />;
      case 'Pruebas de Manejo (Test Drives)':
        return <TestDrivesView />;
      case 'Tasaciones y Permutas':
        return <TasacionesView />;
      case 'Facturación y Caja':
        return <FacturacionView />;
      case 'Gestión de Personal':
      case 'Configuración y Seguridad':
        return <UsuariosAdminView />;
      default:
        return (
          <div className="p-12 flex flex-col items-center justify-center text-center text-gray-500 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-xs">
              <Construction className="w-7 h-7 text-gray-700" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Módulo: {vistaActiva}</h3>
            <p className="text-xs max-w-sm text-gray-500">
              Este módulo se encuentra en proceso de implementación.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#f0f2f5] text-gray-900 overflow-hidden font-sans">
      <Sidebar vistaActiva={vistaActiva} setVistaActiva={setVistaActiva} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar titulo={vistaActiva} onNavigate={setVistaActiva} />
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#f0f2f5]">
          {renderVista()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
