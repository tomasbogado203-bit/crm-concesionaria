import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('crm_token'));
  const [usuario, setUsuario] = useState(() => {
    const saved = localStorage.getItem('crm_usuario');
    return saved ? JSON.parse(saved) : null;
  });
  const [menus, setMenus] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarMenus = async () => {
    try {
      const data = await apiFetch('/auth/menu');
      setMenus(data);
    } catch (err) {
      console.error('Error cargando menús:', err);
    }
  };

  useEffect(() => {
    if (token) {
      cargarMenus().finally(() => setCargando(false));
    } else {
      setCargando(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem('crm_token', res.token);
    localStorage.setItem('crm_usuario', JSON.stringify(res.usuario));
    setToken(res.token);
    setUsuario(res.usuario);

    // Cargar menús del usuario inmediatamente
    const menuRes = await apiFetch('/auth/menu', {
      headers: { Authorization: `Bearer ${res.token}` },
    });
    setMenus(menuRes);

    return res;
  };

  const registro = async (datosRegistro) => {
    await apiFetch('/auth/registro', {
      method: 'POST',
      body: JSON.stringify(datosRegistro),
    });

    // Iniciar sesión automáticamente tras el registro exitoso
    return await login(datosRegistro.email, datosRegistro.password);
  };

  const logout = () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_usuario');
    setToken(null);
    setUsuario(null);
    setMenus([]);
  };

  return (
    <AuthContext.Provider value={{ token, usuario, menus, login, registro, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  return (
    ctx || {
      token: null,
      usuario: null,
      menus: [],
      cargando: false,
      login: () => {},
      logout: () => {},
      registro: () => {},
    }
  );
};

