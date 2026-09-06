const BASE_URL = 'http://localhost:4000';

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Solo tratamos el 401 como "sesión expirada" si YA había un token —
  // un login con credenciales incorrectas también responde 401, y ese caso
  // debe mostrarse como error normal, no forzar una redirección.
  if (res.status === 401 && token) {
    setToken(null);
    window.location.href = '/login';
    return;
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Error ${res.status}`);
  return body;
}
