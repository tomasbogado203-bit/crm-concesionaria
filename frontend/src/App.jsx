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
import { Construction, ShieldAlert } from 'lucide-react';

const MainLayout = () => {
  const { token, usuario, menus, cargando } = useAuth();
  const [vistaActiva, setVistaActiva] = useState('Dashboard');

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
      if (vistaActiva !== 'Dashboard' && !nombresAutorizados.includes(vistaActiva)) {
        setVistaActiva('Dashboard');
      }
    }
  }, [usuario?.id, menus, vistaActiva]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
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
    const esAutorizado = vistaActiva === 'Dashboard' || nombresAutorizados.includes(vistaActiva);

    if (!esAutorizado) {
      return (
        <div className="p-12 flex flex-col items-center justify-center text-center text-slate-500 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-lg shadow-rose-500/10">
            <ShieldAlert className="w-8 h-8 text-rose-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Módulo No Autorizado: {vistaActiva}</h3>
            <p className="text-xs max-w-md text-slate-400">
              Según la matriz de permisos RBAC, tu perfil actual (<strong>{usuario?.perfiles?.[0] || 'Usuario'}</strong>) no
              cuenta con autorización para acceder a este módulo.
            </p>
          </div>
          <button
            onClick={() => setVistaActiva('Dashboard')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 transition"
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
      default:
        return (
          <div className="p-12 flex flex-col items-center justify-center text-center text-slate-500 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <Construction className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-base font-bold text-white">Módulo: {vistaActiva}</h3>
            <p className="text-xs max-w-sm text-slate-400">
              Este módulo forma parte de la fase 2.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar vistaActiva={vistaActiva} setVistaActiva={setVistaActiva} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar titulo={vistaActiva} />
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950">
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
