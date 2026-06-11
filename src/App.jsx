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
} from "lucide-react";

import { crearCita } from "./lib/citasApi";
import fondo3 from "./assets/fondo3.jpeg";

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

  if (telefono.length === 10) {
    return `52${telefono}`;
  }

  if (telefono.length === 12 && telefono.startsWith("52")) {
    return telefono;
  }

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

function Campo({ label, icono: Icono, requerido, error, ayuda, children, className = "" }) {
  return (
    <div className={cls("min-w-0", className)}>
      <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-white/65">
        {Icono ? <Icono className="h-3 w-3 shrink-0 text-white/45" /> : null}

        <span className="truncate">
          {label}
          {requerido ? <b className="ml-0.5 text-red-200">*</b> : null}
        </span>
      </label>

      {children}

      {error ? (
        <p className="mt-1 line-clamp-2 text-[10px] font-bold leading-tight text-red-200">
          {error}
        </p>
      ) : ayuda ? (
        <p className="mt-1 truncate text-[10px] leading-tight text-white/45">
          {ayuda}
        </p>
      ) : null}
    </div>
  );
}

function Input({ error, className = "", ...props }) {
  return (
    <input
      {...props}
      className={cls(
        "h-8 w-full lg:w-40 rounded-lg border bg-white/10 px-2.5 text-xs font-bold text-white outline-none transition placeholder:text-white/35",
        "scheme-dark",
        error
          ? "border-red-200 ring-1 ring-red-300/20"
          : "border-white/10 focus:border-white/40 focus:ring-1 focus:ring-white/10",
        props.disabled ? "cursor-not-allowed opacity-50" : "",
        className,
      )}
    />
  );
}

function Select({ error, children, className = "", ...props }) {
  return (
    <select
      {...props}
      className={cls(
        "h-8 w-full lg:w-40 rounded-lg border bg-[#0b1b54]/95 px-2.5 text-xs font-bold text-white outline-none transition",
        error
          ? "border-red-200 ring-1 ring-red-300/20"
          : "border-white/10 focus:border-white/40 focus:ring-1 focus:ring-white/10",
        className,
      )}
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
        "min-h-[52px] w-full resize-none rounded-lg border bg-white/10 px-2.5 py-2 text-xs font-bold text-white outline-none transition placeholder:text-white/35",
        error
          ? "border-red-200 ring-1 ring-red-300/20"
          : "border-white/10 focus:border-white/40 focus:ring-1 focus:ring-white/10",
        className,
      )}
    />
  );
}

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
    <div className="relative w-full lg:w-40">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-white/45" />

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
          className="pl-7"
        />
      </div>

      {abierto ? (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-[#07122f] p-1 shadow-2xl">
          {opciones.length === 0 ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setAbierto(false)}
              className="block w-full rounded-md px-2 py-1.5 text-left text-[11px] font-semibold text-white/70 hover:bg-white/10"
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
              className="block w-full rounded-md px-2 py-1.5 text-left text-[11px] font-bold text-white hover:bg-white/10"
            >
              {asesor}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

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
      setMensaje("Cita guardada correctamente.");
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
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(44,91,187,0.24),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.10),_transparent_28%)]" />
        <div className="absolute left-[-12%] top-[-8%] h-72 w-72 rounded-full bg-[#2A63FF]/10 blur-3xl" />
        <div className="absolute bottom-[-12%] right-[-10%] h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(6,16,45,0.96),rgba(11,31,94,0.92),rgba(7,16,38,0.98))]" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl lg:max-w-[950px] items-center justify-center px-2 py-3 sm:px-4 sm:py-4 lg:px-5">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative w-full overflow-hidden rounded-2xl border border-[#131E5C]/10 p-2.5 shadow-[0_30px_80px_-25px_rgba(19,30,92,0.14)] sm:p-4"
          style={{
            backgroundImage: `url(${fondo3})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="absolute inset-0 bg-[#071126]/30" />

          <div className="relative z-10">
            <header className="mb-3 flex flex-col items-center justify-center gap-2 text-center">
              <div className="flex flex-col items-center text-center">
                <div className="mb-1 flex justify-center">
                  <span className="inline-flex items-center rounded-full border border-white/50 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-white">
                    Automotriz R&amp;R · Volvo
                  </span>
                </div>

                <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  Registro de citas
                </h1>
              </div>
            </header>

            {mensaje ? (
              <div
                className={cls(
                  "mb-2.5 rounded-lg border px-3 py-2 text-xs font-bold",
                  guardado
                    ? "border-emerald-200/30 bg-emerald-400/15 text-emerald-100"
                    : "border-red-200/30 bg-red-400/15 text-red-100",
                )}
              >
                {mensaje}
              </div>
            ) : null}

            <form onSubmit={enviarFormulario}>
              <div className="rounded-2xl border border-white/10 p-2.5 backdrop-blur-xs sm:p-3">
                <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  <Campo label="Dealer" icono={Building2} requerido error={error("agencia")}>
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

                  <Campo
                    label="Nombre del cliente"
                    icono={UserRound}
                    requerido
                    error={error("nombre")}
                  >
                    <Input
                      value={form.nombre}
                      error={error("nombre")}
                      onChange={(e) => {
                        updateField("nombre", e.target.value.toUpperCase());
                      }}
                      placeholder="NOMBRE COMPLETO"
                    />
                  </Campo>

                  <Campo
                    label="Teléfono"
                    icono={Phone}
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

                  <Campo
                    label="Volvo de sus sueños"
                    icono={CarFront}
                    requerido
                    error={error("auto_interes")}
                  >
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

                  <Campo
                    label="Fecha y hora"
                    icono={Clock3}
                    requerido
                    error={error("fecha_hora_cita")}
                  >
                    <Input
                      type="datetime-local"
                      value={form.fecha_hora_cita}
                      error={error("fecha_hora_cita")}
                      onChange={(e) => updateField("fecha_hora_cita", e.target.value)}
                    />
                  </Campo>

                  <Campo
                    label="Tipo de cita"
                    icono={CalendarDays}
                    requerido
                    error={error("tipo_cita")}
                  >
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

                  <Campo
                    label="Fuente"
                    icono={MessageSquareText}
                    requerido
                    error={error("fuente_prospeccion")}
                  >
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

                  <Campo
                    label="Asesor de piso"
                    icono={Search}
                    requerido
                    error={error("asesor_piso")}
                    className="sm:col-span-1"
                  >
                    <AsesorAutocomplete
                      value={form.asesor_piso}
                      error={error("asesor_piso")}
                      onChange={(valor) => updateField("asesor_piso", valor)}
                    />
                  </Campo>

                  <Campo
                    label="Comentarios"
                    icono={CalendarDays}
                    className="sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2"
                  >
                    <Textarea
                      value={form.comentarios}
                      onChange={(e) => updateField("comentarios", e.target.value)}
                      placeholder="Notas adicionales de la cita..."
                      className="lg:w-full"
                    />
                  </Campo>
                </div>

                <div className="mt-3 flex flex-col gap-2 rounded-xl border border-white/10 bg-[#06122f]/80 p-2.5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold text-white/70">
                    {mostrarErrores && hayErrores
                      ? Object.values(errores)[0]
                      : "Revisa los datos y guarda la cita."}
                  </p>

                  <button
                    type="submit"
                    disabled={enviando}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-black text-[#131E5C] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {enviando ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Guardar cita
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}