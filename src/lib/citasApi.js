// src/lib/citasApi.js
import { http } from "./apiClient";

function limpiarTexto(valor) {
  return String(valor ?? "").trim();
}

function soloNumeros(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

function normalizarTelefonoMx(valor) {
  const telefono = soloNumeros(valor);

  if (telefono.length === 10) {
    return `52${telefono}`;
  }

  if (telefono.length === 12 && telefono.startsWith("52")) {
    return telefono;
  }

  return "";
}

export async function crearCita(respuestas) {
  const payload = {
    nombre: limpiarTexto(respuestas.nombre).toUpperCase(),
    telefono: normalizarTelefonoMx(respuestas.telefono),
    correo: "",

    agencia: limpiarTexto(respuestas.agencia),
    auto_interes: limpiarTexto(respuestas.auto_interes),
    fecha_hora_cita: limpiarTexto(respuestas.fecha_hora_cita) || null,

    tipo_cita: "Tradicional",
    fuente_prospeccion: limpiarTexto(respuestas.fuente_prospeccion),
    asesor_piso: limpiarTexto(respuestas.asesor_piso),
    comentarios: limpiarTexto(respuestas.comentarios),
  };

  return http("/citas/api/citas/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
