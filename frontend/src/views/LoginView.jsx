import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Car, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginView = ({ onVerCatalogoPublico }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión. Verifique sus credenciales.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col justify-center items-center p-4 relative overflow-hidden text-gray-900 font-sans">
      {/* Decorative ambient subtle background blur */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-gray-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-gray-200/50 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-gray-200/80 rounded-3xl shadow-xl p-8 relative z-10">
        {/* Minimalist logo and title */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-[#18181b] text-white flex items-center justify-center shadow-xs mb-3">
            <Car className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AUTO CRM</h1>
          <p className="text-xs text-gray-500 mt-0.5">Concesionaria Oficial · Portal de Colaboradores</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {/* Formulario de Login */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Correo Institucional o Usuario
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@concesionaria.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700">Contraseña</label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-2.5 px-4 bg-[#18181b] hover:bg-black text-white text-sm font-semibold rounded-xl shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer mt-2"
          >
            <span>{cargando ? 'Verificando credenciales...' : 'Ingresar al Sistema'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Acceso directo al Catálogo Público para Visitantes */}
        {onVerCatalogoPublico && (
          <div className="mt-5 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500 mb-2">¿Sos cliente o visitás la concesionaria?</p>
            <button
              type="button"
              onClick={onVerCatalogoPublico}
              className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Car className="w-4 h-4 text-emerald-600" />
              <span>Explorar Catálogo de Vehículos (Showroom Oficial)</span>
            </button>
          </div>
        )}

        {/* Aviso de seguridad y política de registro */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex items-start gap-3 bg-gray-50/70 p-3.5 rounded-2xl">
          <ShieldCheck className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-gray-500 leading-relaxed">
            <span className="font-semibold text-gray-700">Acceso restringido:</span> El registro público se encuentra cerrado por políticas de seguridad. Las altas de vendedores, facturadores y personal administrativo son otorgadas únicamente por el Administrador de cada concesionaria.
          </p>
        </div>
      </div>
    </div>
  );
};
