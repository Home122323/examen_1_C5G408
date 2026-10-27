import { request } from './api.js';

export async function listarEquipos({ page = 1, perPage = 10, q = '', estado = '' } = {}) {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('per_page', perPage);
  if (q) params.set('q', q);
  if (estado) params.set('estado', estado);

  return request(`/equipos?${params.toString()}`);
}

export async function listarCategorias() {
  return request('/categorias');
}

export async function crearEquipo(datos) {
  return request('/equipos', {
    method: 'POST',
    body: datos,
  });
}

export async function eliminarEquipo(id) {
  return request(`/equipos/${id}`, {
    method: 'DELETE',
  });
}