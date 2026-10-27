import { crearEquipo, listarCategorias } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const $form = document.querySelector("#form-equipo");
const $selectCategoria = document.querySelector("#categoria_id");
const $btnGuardar = document.querySelector("#btn-guardar");

export const iniciarFormulario = ({ alGuardar }) => {
  // 1. Cargar categorías en el select
  listarCategorias()
    .then((respuesta) => {
      const categorias = respuesta.data || [];
      categorias.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = cat.nombre;
        $selectCategoria.appendChild(option);
      });
    })
    .catch(() => {
      mostrarMensaje("error", "No se pudieron cargar las categorías.");
    });

  // 2. Envío del formulario
  $form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    // Limpiar errores anteriores
    $form.querySelectorAll("[data-error]").forEach((p) => {
      p.textContent = "";
    });
    $form.querySelectorAll("[aria-invalid]").forEach((el) => {
      el.removeAttribute("aria-invalid");
    });

    const formData = new FormData($form);

    const datos = {
      codigo: formData.get("codigo"),
      nombre: formData.get("nombre"),
      categoria_id: Number(formData.get("categoria_id")),
      fecha_adquisicion: formData.get("fecha_adquisicion"),
      costo_interno: Number(formData.get("costo_interno")),
    };

    $btnGuardar.disabled = true;
    $btnGuardar.textContent = "Guardando…";

    try {
      const creado = await crearEquipo(datos);

      $form.reset();
      mostrarMensaje("exito", `Equipo ${creado.data?.codigo || datos.codigo} registrado.`);
      alGuardar();
    } catch (error) {
      if (error.status === 422 && error.datos?.errors) {
        // Errores por campo
        Object.entries(error.datos.errors).forEach(([campo, mensajes]) => {
          const $error = $form.querySelector(`[data-error="${campo}"]`);
          const $campo = $form.querySelector(`[name="${campo}"]`);

          if ($error) {
            $error.textContent = Array.isArray(mensajes) ? mensajes[0] : mensajes;
          }
          if ($campo) {
            $campo.setAttribute("aria-invalid", "true");
          }
        });
      } else {
        mostrarMensaje("error", error.message || "No se pudo registrar el equipo.");
      }
    } finally {
      $btnGuardar.disabled = false;
      $btnGuardar.textContent = "Guardar";
    }
  });
};