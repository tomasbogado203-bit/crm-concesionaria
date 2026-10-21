const API_BASE = 'http://localhost:3000';

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('crm_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('crm_token');
      localStorage.removeItem('crm_usuario');
    }
    const errorMsg = data.error || (data.detalles ? data.detalles.map(d => `${d.campo}: ${d.mensaje}`).join(', ') : 'Error en la petición');
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }


  return data;
};
