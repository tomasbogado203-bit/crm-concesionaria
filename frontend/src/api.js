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
    if (response.status === 401) {
      localStorage.removeItem('crm_token');
      localStorage.removeItem('crm_usuario');
    }

    // Priorizar los detalles específicos de validación (Zod) si existen
    const detallesMsg =
      data.detalles && Array.isArray(data.detalles) && data.detalles.length > 0
        ? data.detalles.map((d) => `${d.campo ? d.campo + ': ' : ''}${d.mensaje}`).join(', ')
        : null;

    const errorMsg = detallesMsg || data.error || 'Error en la petición';
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
};
