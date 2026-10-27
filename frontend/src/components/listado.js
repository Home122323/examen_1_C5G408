import { listarEquipos, eliminarEquipo } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const POR_PAGINA = 6;

const $lista = document.querySelector("#lista-equipos");
const $plantilla = document.querySelector("#tpl-equipo");
const $resumen = document.querySelector("#resumen");
const $paginaActual = document.querySelector("#pagina-actual");
const $btnAnterior = document.querySelector("#btn-anterior");
const $btnSiguiente = document.querySelector("#btn-siguiente");

let paginaActual = 1;
let ultimaPagina = 1;

// YA IMPLEMENTADO — "2026-09-15" -> "15 set 2026"
export const formatearFecha = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es-CR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const cargarPagina = async (pagina = 1) => {
  $lista.setAttribute("aria-busy", "true");

  try {
    const respuesta = await listarEquipos({
      page: pagina,
      perPage: POR_PAGINA,
    });

    const equipos = respuesta.data;
    const meta = respuesta.meta;

    paginaActual = meta.current_page;
    ultimaPagina = meta.last_page;

    $lista.innerHTML = "";

    if (equipos.length === 0) {
      const vacio = document.createElement("li");
      vacio.className = "vacio";
      vacio.textContent = "No hay equipos registrados.";
      $lista.appendChild(vacio);
    } else {
      equipos.forEach((equipo) => {
        const nodo = $plantilla.content.cloneNode(true);
        const li = nodo.querySelector("li");

        li.dataset.id = equipo.id;

        nodo.querySelector(".codigo").textContent = equipo.codigo;
        nodo.querySelector(".nombre").textContent = equipo.nombre;
        nodo.querySelector(".categoria").textContent = equipo.categoria?.nombre ?? "";
        nodo.querySelector(".fecha").textContent = formatearFecha(equipo.fecha_adquisicion);

        const $estado = nodo.querySelector(".estado");
        $estado.textContent = equipo.estado;
        $estado.dataset.estado = equipo.estado;

        $lista.appendChild(nodo);
      });
    }

    // Resumen: "Mostrando 1–6 de 25"
    const from = meta.from ?? 0;
    const to = meta.to ?? 0;
    const total = meta.total ?? 0;
    $resumen.textContent = `Mostrando ${from}–${to} de ${total}`;

    // Página actual
    $paginaActual.textContent = `Página ${meta.current_page} de ${meta.last_page}`;

    // Botones
    $btnAnterior.disabled = meta.current_page <= 1;
    $btnSiguiente.disabled = meta.current_page >= meta.last_page;
  } catch (error) {
    mostrarMensaje("error", error.message || "No se pudo cargar el listado.");
  } finally {
    $lista.removeAttribute("aria-busy");
  }
};

const alHacerClicEnLista = async (evento) => {
  const boton = evento.target.closest(".btn-eliminar");
  if (!boton) return;

  const li = boton.closest("li");
  const id = li?.dataset.id;
  if (!id) return;

  if (!confirm("¿Seguro que desea eliminar este equipo?")) return;

  try {
    await eliminarEquipo(id);
    mostrarMensaje("exito", "Equipo eliminado.");

    // Si era el último de la página y no es la primera, retrocedemos
    const quedanEnPagina = $lista.querySelectorAll("li:not(.vacio)").length - 1;
    if (quedanEnPagina <= 0 && paginaActual > 1) {
      await cargarPagina(paginaActual - 1);
    } else {
      await cargarPagina(paginaActual);
    }
  } catch (error) {
    if (error.status === 409) {
      mostrarMensaje("error", error.datos?.mensaje || "No se puede eliminar este equipo.");
    } else {
      mostrarMensaje("error", "No se pudo eliminar el equipo.");
    }
  }
};

export const iniciarListado = () => {
  $lista.addEventListener("click", alHacerClicEnLista);

  $btnAnterior.addEventListener("click", () => {
    if (paginaActual > 1) cargarPagina(paginaActual - 1);
  });

  $btnSiguiente.addEventListener("click", () => {
    if (paginaActual < ultimaPagina) cargarPagina(paginaActual + 1);
  });

  cargarPagina(1);
};