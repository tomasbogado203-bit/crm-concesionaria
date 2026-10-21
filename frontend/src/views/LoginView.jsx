import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Car, Lock, Mail, User, ArrowRight, ShieldCheck, Sparkles, Building2 } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Decorative blurred background shapes */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10 backdrop-blur-xl">
        {/* Logo and title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-blue-500/25 mb-3">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">AUTO CRM</h1>
          <p className="text-xs text-slate-400 mt-1">Concesionaria Oficial · Acceso al Sistema</p>
        </div>

        {/* Tab Switcher: Iniciar Sesión vs Registrarse */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setModo('LOGIN');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              modo === 'LOGIN'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
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
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              modo === 'REGISTRO'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {/* MODO 1: Formulario de Login */}
        {modo === 'LOGIN' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vendedor@concesionaria.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              <span>{cargando ? 'Iniciando sesión...' : 'Ingresar al CRM'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* MODO 2: Formulario de Registro */
          <form onSubmit={handleRegistro} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre *</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Lucas"
                    className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Apellido</label>
                <input
                  type="text"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  placeholder="Benítez"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Institucional *</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={emailReg}
                  onChange={(e) => setEmailReg(e.target.value)}
                  placeholder="lucas@concesionaria.com"
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña (mínimo 8 caracteres) *</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={passwordReg}
                  onChange={(e) => setPasswordReg(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Perfil / Puesto en la Concesionaria</label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="VENDEDOR">Vendedor / Asesor Comercial</option>
                <option value="FACTURADOR">Facturador / Caja y Administración</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer mt-2"
            >
              <span>{cargando ? 'Creando cuenta...' : 'Crear Cuenta y Acceder'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Quick login helper for demo */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Accesos de Demostración:
          </p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => loginRapido('carlos@concesionaria.com', 'Password123')}
              className="w-full text-left px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between group transition"
            >
              <div>
                <p className="font-semibold text-white group-hover:text-blue-400 transition">Carlos Vendedor</p>
                <p className="text-[10px] text-slate-500">carlos@concesionaria.com</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                VENDEDOR
              </span>
            </button>

            <button
              type="button"
              onClick={() => loginRapido('facturador@concesionaria.com', 'Password123')}
              className="w-full text-left px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between group transition"
            >
              <div>
                <p className="font-semibold text-white group-hover:text-emerald-400 transition">Ana Facturación</p>
                <p className="text-[10px] text-slate-500">facturador@concesionaria.com</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                FACTURADOR
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
