import { API_URL, TIMEOUT_MS } from './config.js';
import { ErrorApi } from './errores.js';
import { olvidarSesion } from './auth.js';

/**
 * Cliente HTTP único para toda la aplicación.
 */
export async function request(ruta, opciones = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers = {
    Accept: 'application/json',
    ...opciones.headers,
  };

  const token = localStorage.getItem('token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (opciones.body && typeof opciones.body === 'object') {
    headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(opciones.body);
  }

  try {
    const response = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      if (response.status === 401) {
        olvidarSesion();
        window.location.reload();
        return;
      }

      let datos = null;
      try {
        datos = await response.json();
      } catch {
        // si no viene JSON, dejamos datos en null
      }

      throw new ErrorApi(response.status, datos);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}