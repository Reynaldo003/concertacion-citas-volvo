// src/App.jsx
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageSquareText,
  Phone,
  Search,
  UserRound,
  Sparkles,
  ArrowRight,
} from "lucide-react";

import { crearCita } from "./lib/citasApi";

// ─── CONSTANTES ──────────────────────────────────────────────────────────────
const AGENCIAS = ["Volvo"];

const VEHICULOS = [
  "EX30",
  "EX40",
  "EC40",
  "EX90",
  "XC60",
  "XC90",
  "XC60 Black Edition",
  "XC90 Black Edition",
  "Seminuevos",
  "Avalúo",
];

const FUENTE = [
  "Facebook",
  "WhatsApp",
  "Volvo-Concesionarios",
  "Llamada Entrante",
  "Prospección",
  "Cartera",
  "Eternización de crédito",
  "Remarketing",
  "Base de Datos",
  "Ubicación",
  "Piso",
  "Referido",
];

const TIPOS_CITA = [
  "Digital",
  "Tradicional",
  "Evento",
  "Remarketing",
];

const ASESORES = [
  "Enrique Vazquez Islas",
  "Ricardo Platas",
  "Verónica Del Rayo Galindo León",
  "Julio Camacho Barragán",
  "Fernanda Romero Aguilar",
];

const FORM_INICIAL = {
  agencia: "Volvo",
  nombre: "",
  telefono: "",
  auto_interes: "",
  fecha_hora_cita: "",
  tipo_cita: "",
  fuente_prospeccion: "",
  asesor_piso: "",
  comentarios: "",
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function cls(...clases) {
  return clases.filter(Boolean).join(" ");
}

function texto(valor) {
  return String(valor ?? "").trim();
}

function soloNumeros(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

function normalizarBusqueda(valor) {
  return texto(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function obtenerAsesorValido(valor) {
  const asesorBuscado = normalizarBusqueda(valor);
  if (!asesorBuscado) return null;
  return ASESORES.find((asesor) => {
    return normalizarBusqueda(asesor) === asesorBuscado;
  }) || null;
}

function esAsesorValido(valor) {
  return Boolean(obtenerAsesorValido(valor));
}

function validarTelefono(valor) {
  const telefono = soloNumeros(valor);
  if (telefono.length === 10) return true;
  if (telefono.length === 12 && telefono.startsWith("52")) return true;
  return false;
}

function normalizarTelefonoMx(valor) {
  const telefono = soloNumeros(valor);
  if (telefono.length === 10) return `52${telefono}`;
  if (telefono.length === 12 && telefono.startsWith("52")) return telefono;
  return "";
}

function mensajeTelefono(valor) {
  const telefono = soloNumeros(valor);
  if (!telefono) return "Captura un teléfono numérico.";
  if (telefono.length < 10) return "El teléfono debe tener mínimo 10 dígitos.";
  if (telefono.length === 11) return "Usa 10 dígitos o 52 + 10 dígitos.";
  if (telefono.length === 12 && !telefono.startsWith("52")) {
    return "Si tiene 12 dígitos debe iniciar con 52.";
  }
  if (telefono.length > 12) return "Máximo 12 dígitos.";
  return "Teléfono inválido.";
}

function normalizarPayload(form) {
  const asesorValido = obtenerAsesorValido(form.asesor_piso);
  return {
    agencia: texto(form.agencia),
    nombre: texto(form.nombre).toUpperCase(),
    telefono: normalizarTelefonoMx(form.telefono),
    auto_interes: texto(form.auto_interes),
    fecha_hora_cita: texto(form.fecha_hora_cita),
    tipo_cita: texto(form.tipo_cita),
    fuente_prospeccion: texto(form.fuente_prospeccion),
    asesor_piso: asesorValido || "",
    comentarios: texto(form.comentarios),
  };
}

function obtenerErrores(form) {
  const errores = {};
  if (!texto(form.agencia)) errores.agencia = "Selecciona el dealer.";
  if (!texto(form.nombre)) errores.nombre = "Captura el nombre del cliente.";
  if (!validarTelefono(form.telefono)) errores.telefono = mensajeTelefono(form.telefono);
  if (!texto(form.auto_interes)) errores.auto_interes = "Selecciona el Volvo de interés.";
  if (!texto(form.fecha_hora_cita)) errores.fecha_hora_cita = "Selecciona fecha y hora.";
  if (!texto(form.fuente_prospeccion)) errores.fuente_prospeccion = "Selecciona la fuente.";
  if (!texto(form.tipo_cita)) errores.tipo_cita = "Selecciona el tipo de cita.";
  if (!texto(form.asesor_piso)) {
    errores.asesor_piso = "Selecciona el asesor de piso.";
  } else if (!esAsesorValido(form.asesor_piso)) {
    errores.asesor_piso = "Selecciona un asesor válido de la lista.";
  }
  return errores;
}

// ─── COMPONENTES REUTILIZABLES (estilo formal) ─────────────────────────────
function Campo({ label, requerido, error, ayuda, children, className = "" }) {
  return (
    <div className={cls("min-w-0", className)}>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}
        {requerido && <span className="ml-1 text-amber-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {ayuda && !error && <p className="mt-1 text-xs text-gray-400">{ayuda}</p>}
    </div>
  );
}

function Input({ error, className = "", ...props }) {
  return (
    <input
      {...props}
      className={cls(
        "h-12 w-full rounded-xl border-2 bg-white px-4 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-[#1a2a3a] focus:shadow-[0_0_0_4px_rgba(26,42,58,0.08)]",
        error ? "border-red-300 focus:border-red-400" : "border-gray-200 hover:border-gray-300",
        className
      )}
    />
  );
}

function Select({ error, children, className = "", ...props }) {
  return (
    <select
      {...props}
      className={cls(
        "h-12 w-full rounded-xl border-2 bg-white px-4 pr-10 text-sm text-gray-800 outline-none transition-all appearance-none cursor-pointer focus:border-[#1a2a3a] focus:shadow-[0_0_0_4px_rgba(26,42,58,0.08)]",
        error ? "border-red-300" : "border-gray-200 hover:border-gray-300",
        className
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 1rem center",
      }}
    >
      {children}
    </select>
  );
}

function Textarea({ error, className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={cls(
        "min-h-[92px] w-full resize-none rounded-xl border-2 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-[#1a2a3a] focus:shadow-[0_0_0_4px_rgba(26,42,58,0.08)]",
        error ? "border-red-300" : "border-gray-200 hover:border-gray-300",
        className
      )}
    />
  );
}

// ─── AsesorAutocomplete (adaptado al nuevo estilo) ──────────────────────
function AsesorAutocomplete({ value, onChange, error }) {
  const [abierto, setAbierto] = useState(false);

  const opciones = useMemo(() => {
    const q = normalizarBusqueda(value);
    if (!q) return ASESORES.slice(0, 8);
    return ASESORES.filter((asesor) => {
      return normalizarBusqueda(asesor).includes(q);
    }).slice(0, 8);
  }, [value]);

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={value}
          error={error}
          onFocus={() => setAbierto(true)}
          onBlur={() => {
            window.setTimeout(() => setAbierto(false), 120);
          }}
          onChange={(e) => {
            onChange(e.target.value);
            setAbierto(true);
          }}
          placeholder="Buscar asesor..."
          className="pl-10"
        />
      </div>

      {abierto && (
        <div className="absolute left-0 right-0 z-30 mt-1.5 max-h-52 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
          {opciones.length === 0 ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setAbierto(false)}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-gray-400 hover:bg-gray-50"
            >
              Sin coincidencias. Selecciona un asesor de la lista.
            </button>
          ) : null}

          {opciones.map((asesor) => (
            <button
              key={asesor}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(asesor);
                setAbierto(false);
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              {asesor}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────
export default function App() {
  const [form, setForm] = useState(FORM_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [guardado, setGuardado] = useState(false);

  const errores = useMemo(() => obtenerErrores(form), [form]);
  const hayErrores = Object.keys(errores).length > 0;

  function updateField(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setGuardado(false);
  }

  function error(campo) {
    return mostrarErrores ? errores[campo] : "";
  }

  async function enviarFormulario(e) {
    e.preventDefault();

    setMostrarErrores(true);
    setMensaje("");
    setGuardado(false);

    const erroresActuales = obtenerErrores(form);

    if (Object.keys(erroresActuales).length > 0) {
      setMensaje(Object.values(erroresActuales)[0]);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setEnviando(true);

      await crearCita(normalizarPayload(form));

      setGuardado(true);
      setMensaje("✅ Cita guardada correctamente.");
      setForm(FORM_INICIAL);
      setMostrarErrores(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
      setMensaje(error.message || "No fue posible guardar la cita.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-8 px-4">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/60"
        >
          {/* ═══ HEADER — estilo VOLVO ═══ */}
          <div className="relative overflow-hidden bg-[#1a2a3a] px-8 py-6 md:px-12 md:py-8">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-amber-400/5 blur-2xl" />

            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
               <h1
                  className="text-5xl font-extralight tracking-[0.6em] text-white uppercase"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  VOLVO
                </h1>
               <p
                  className="text-xs font-light uppercase tracking-[0.25em] text-white"
                  style={{
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
                  }}
                >
                  REGISTRO DE CITAS
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-5 py-2.5 backdrop-blur">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium text-white/80">
                  Automotriz R&amp;R
                </span>
              </div>
            </div>
          </div>

          {/* ═══ SUBHEADER ═══ */}
          <div className="border-b border-gray-100 bg-gray-50/50 px-8 py-4 md:px-12">
            <p className="text-sm text-gray-600">
              Registra una nueva cita con el prospecto.
            </p>
          </div>

          {/* ═══ MENSAJE ═══ */}
          {mensaje && (
            <div
              className={cls(
                "mx-8 mt-6 rounded-xl border px-5 py-3.5 text-sm font-medium md:mx-12",
                guardado
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              )}
            >
              {mensaje}
            </div>
          )}

          {/* ═══ FORMULARIO ═══ */}
          <form onSubmit={enviarFormulario} className="p-6 md:p-10">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Dealer */}
              <Campo label="Dealer" requerido error={error("agencia")}>
                <Select
                  value={form.agencia}
                  error={error("agencia")}
                  onChange={(e) => updateField("agencia", e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {AGENCIAS.map((agencia) => (
                    <option key={agencia} value={agencia}>
                      {agencia}
                    </option>
                  ))}
                </Select>
              </Campo>

              {/* Nombre del cliente */}
              <Campo label="Nombre del cliente" requerido error={error("nombre")}>
                <Input
                  value={form.nombre}
                  error={error("nombre")}
                  onChange={(e) => {
                    updateField("nombre", e.target.value.toUpperCase());
                  }}
                  placeholder="NOMBRE COMPLETO"
                />
              </Campo>

              {/* Teléfono */}
              <Campo
                label="Teléfono"
                requerido
                error={error("telefono")}
                ayuda="10 dígitos o 52 + 10 dígitos."
              >
                <Input
                  value={form.telefono}
                  error={error("telefono")}
                  onChange={(e) => {
                    updateField("telefono", soloNumeros(e.target.value).slice(0, 12));
                  }}
                  inputMode="numeric"
                  placeholder="2711234567"
                />
              </Campo>

              {/* Volvo de sus sueños */}
              <Campo label="Volvo de sus sueños" requerido error={error("auto_interes")}>
                <Select
                  value={form.auto_interes}
                  error={error("auto_interes")}
                  onChange={(e) => updateField("auto_interes", e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {VEHICULOS.map((vehiculo) => (
                    <option key={vehiculo} value={vehiculo}>
                      {vehiculo}
                    </option>
                  ))}
                </Select>
              </Campo>

              {/* Fecha y hora */}
              <Campo label="Fecha y hora" requerido error={error("fecha_hora_cita")}>
                <Input
                  type="datetime-local"
                  value={form.fecha_hora_cita}
                  error={error("fecha_hora_cita")}
                  onChange={(e) => updateField("fecha_hora_cita", e.target.value)}
                />
              </Campo>

              {/* Tipo de cita */}
              <Campo label="Tipo de cita" requerido error={error("tipo_cita")}>
                <Select
                  value={form.tipo_cita}
                  error={error("tipo_cita")}
                  onChange={(e) => updateField("tipo_cita", e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {TIPOS_CITA.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </Select>
              </Campo>

              {/* Fuente */}
              <Campo label="Fuente" requerido error={error("fuente_prospeccion")}>
                <Select
                  value={form.fuente_prospeccion}
                  error={error("fuente_prospeccion")}
                  onChange={(e) => updateField("fuente_prospeccion", e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {FUENTE.map((opcion) => (
                    <option key={opcion} value={opcion}>
                      {opcion}
                    </option>
                  ))}
                </Select>
              </Campo>

              {/* Asesor de piso */}
              <Campo label="Asesor de piso" requerido error={error("asesor_piso")}>
                <AsesorAutocomplete
                  value={form.asesor_piso}
                  error={error("asesor_piso")}
                  onChange={(valor) => updateField("asesor_piso", valor)}
                />
              </Campo>

              {/* Comentarios (ocupa 2 columnas) */}
              <Campo label="Comentarios" className="sm:col-span-2 lg:col-span-3">
                <Textarea
                  value={form.comentarios}
                  onChange={(e) => updateField("comentarios", e.target.value)}
                  placeholder="Notas adicionales de la cita..."
                />
              </Campo>
            </div>

            {/* ═══ FOOTER — Botón guardar ═══ */}
            <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl bg-gray-50/80 px-6 py-4 md:flex-row">
              <p className="text-sm text-gray-500">
                {mostrarErrores && hayErrores
                  ? `⚠️ ${Object.values(errores)[0]}`
                  : "📋 Revisa los datos y guarda la cita."}
              </p>
              <button
                type="submit"
                disabled={enviando}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1a2a3a] px-8 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#2a3a4a] hover:shadow-lg hover:shadow-[#1a2a3a]/20 disabled:opacity-60 md:w-auto"
              >
                {enviando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    Guardar cita
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}