import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Car, Lock, Mail, User, ArrowRight, ShieldCheck, KeyRound, Building2 } from 'lucide-react';

export const LoginView = () => {
  const { login, registro } = useAuth();
  const [modo, setModo] = useState('LOGIN'); // 'LOGIN' | 'REGISTRO'

  // Estados Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estados Registro
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [emailReg, setEmailReg] = useState('');
  const [passwordReg, setPasswordReg] = useState('');
  const [rol, setRol] = useState('VENDEDOR');

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await registro({
        nombre,
        apellido,
        email: emailReg,
        password: passwordReg,
        rol,
      });
    } catch (err) {
      setError(err.message || 'Error al registrar usuario');
    } finally {
      setCargando(false);
    }
  };

  const loginRapido = async (testEmail, testPass) => {
    setEmail(testEmail);
    setPassword(testPass);
    setError(null);
    setCargando(true);
    try {
      await login(testEmail, testPass);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col justify-center items-center p-4 relative overflow-hidden text-gray-900">
      {/* Decorative ambient subtle background blur */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-gray-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-gray-200/50 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-gray-200/80 rounded-3xl shadow-xl p-8 relative z-10">
        {/* Minimalist logo and title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#18181b] text-white flex items-center justify-center shadow-xs mb-3">
            <Car className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AUTO CRM</h1>
          <p className="text-xs text-gray-500 mt-0.5">Concesionaria Oficial · Portal Comercial</p>
        </div>

        {/* Tab Switcher: Iniciar Sesión vs Registrarse */}
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 mb-6">
          <button
            type="button"
            onClick={() => {
              setModo('LOGIN');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              modo === 'LOGIN'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setModo('REGISTRO');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              modo === 'REGISTRO'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {/* MODO 1: Formulario de Login */}
        {modo === 'LOGIN' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vendedor@concesionaria.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Contraseña</label>
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
              className="w-full py-2.5 px-4 bg-[#18181b] hover:bg-black text-white text-sm font-semibold rounded-xl shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              <span>{cargando ? 'Iniciando sesión...' : 'Ingresar al Sistema'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* MODO 2: Formulario de Registro */
          <form onSubmit={handleRegistro} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre *</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Lucas"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Apellido</label>
                <input
                  type="text"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  placeholder="Benítez"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Correo Institucional *</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={emailReg}
                  onChange={(e) => setEmailReg(e.target.value)}
                  placeholder="lucas@concesionaria.com"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Contraseña (mínimo 8 caracteres) *</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={passwordReg}
                  onChange={(e) => setPasswordReg(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Perfil / Puesto en la Concesionaria</label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
              >
                <option value="VENDEDOR">Vendedor / Asesor Comercial</option>
                <option value="FACTURADOR">Facturador / Caja y Administración</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-2.5 px-4 bg-[#18181b] hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer mt-2"
            >
              <span>{cargando ? 'Creando cuenta...' : 'Crear Cuenta y Acceder'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Quick login helper for demo */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-gray-700" />
            Cuentas de Acceso Preconfiguradas:
          </p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => loginRapido('admin@concesionaria.com', 'Password123')}
              className="w-full text-left px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs text-gray-700 flex items-center justify-between group transition cursor-pointer shadow-2xs"
            >
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-black transition">Administrador General</p>
                <p className="text-[10px] text-gray-500">admin@concesionaria.com</p>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                ADMIN
              </span>
            </button>

            <button
              type="button"
              onClick={() => loginRapido('carlos@concesionaria.com', 'Password123')}
              className="w-full text-left px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs text-gray-700 flex items-center justify-between group transition cursor-pointer shadow-2xs"
            >
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-black transition">Carlos Vendedor</p>
                <p className="text-[10px] text-gray-500">carlos@concesionaria.com</p>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                VENDEDOR
              </span>
            </button>

            <button
              type="button"
              onClick={() => loginRapido('facturador@concesionaria.com', 'Password123')}
              className="w-full text-left px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs text-gray-700 flex items-center justify-between group transition cursor-pointer shadow-2xs"
            >
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-black transition">Ana Facturación</p>
                <p className="text-[10px] text-gray-500">facturador@concesionaria.com</p>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                FACTURADOR
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
