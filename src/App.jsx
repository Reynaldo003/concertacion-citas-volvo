// src/App.jsx
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarCheck2,
  CalendarDays,
  CarFront,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Layers3,
  Loader2,
  MessageSquareText,
  Phone,
  Search,
  Tag,
  UserRound,
} from "lucide-react";
import { crearCita } from "./lib/citasApi";

const AGENCIAS = ["Volvo"];
const VEHICULOS = [
  "EX30", "EX40", "EC40", "EX90", "XC40", "XC60", "XC90",
  "XC60 Black Edition", "XC90 Black Edition", "Polestar", "Seminuevos", "Avalúo",
];
const FUENTE = [
  "Facebook", "WhatsApp", "Volvo-Concesionarios", "Llamada Entrante",
  "Prospección", "Cartera", "Eternización de crédito", "Remarketing",
  "Base de Datos", "Ubicación", "Piso", "Referido",
];
const TIPOS_CITA = [
  "Digital", "Tradicional", "Evento", "Remarketing", "Prueba de manejo", "Entrega de unidad",
];
const ASESORES = [
  "Enrique Vazquez Islas", "Ricardo Platas", "Verónica Del Rayo Galindo León",
  "Julio Camacho Barragán", "Fernanda Romero Aguilar",
  "Zaira Vanessa Hernández Gómez", "Carlos Bautista Camacho",
  "Iván López Montero", "Roberto Juárez",
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
  return texto(valor).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function obtenerAsesorValido(valor) {
  return ASESORES.find((asesor) => normalizarBusqueda(asesor) === normalizarBusqueda(valor)) || null;
}

function validarTelefono(valor) {
  const telefono = soloNumeros(valor);
  return telefono.length === 10 || (telefono.length === 12 && telefono.startsWith("52"));
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
  if (telefono.length === 12 && !telefono.startsWith("52")) return "Si tiene 12 dígitos debe iniciar con 52.";
  if (telefono.length > 12) return "Máximo 12 dígitos.";
  return "Teléfono inválido.";
}

function normalizarPayload(form) {
  return {
    agencia: texto(form.agencia),
    nombre: texto(form.nombre).toUpperCase(),
    telefono: normalizarTelefonoMx(form.telefono),
    auto_interes: texto(form.auto_interes),
    fecha_hora_cita: texto(form.fecha_hora_cita),
    tipo_cita: texto(form.tipo_cita),
    fuente_prospeccion: texto(form.fuente_prospeccion),
    asesor_piso: obtenerAsesorValido(form.asesor_piso) || "",
    comentarios: texto(form.comentarios),
  };
}

function obtenerErrores(form) {
  const errores = {};
  if (!texto(form.agencia)) errores.agencia = "Selecciona el distribuidor.";
  if (!texto(form.nombre)) errores.nombre = "Captura el nombre del cliente.";
  if (!validarTelefono(form.telefono)) errores.telefono = mensajeTelefono(form.telefono);
  if (!texto(form.auto_interes)) errores.auto_interes = "Selecciona el Volvo de interés.";
  if (!texto(form.fecha_hora_cita)) errores.fecha_hora_cita = "Selecciona fecha y hora.";
  if (!texto(form.tipo_cita)) errores.tipo_cita = "Selecciona el tipo de cita.";
  if (!texto(form.fuente_prospeccion)) errores.fuente_prospeccion = "Selecciona la fuente.";
  if (!texto(form.asesor_piso)) {
    errores.asesor_piso = "Selecciona el asesor de piso.";
  } else if (!obtenerAsesorValido(form.asesor_piso)) {
    errores.asesor_piso = "Selecciona un asesor válido de la lista.";
  }
  return errores;
}

function Campo({ id, label, icono: Icono, requerido, error, ayuda, children, className = "" }) {
  return (
    <div className={cls("min-w-0", className)}>
      <label htmlFor={id} className="mb-2 flex items-center gap-2.5 text-xs font-extrabold uppercase tracking-tight text-[#141414] sm:text-[13px]">
        <Icono className="h-5 w-5 shrink-0 stroke-[2.4]" aria-hidden="true" />
        <span>{label}{requerido && <span className="ml-1 text-[#c7a48c]">*</span>}</span>
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
      {ayuda && !error && <p className="mt-1.5 text-xs font-medium text-[#484848]">{ayuda}</p>}
    </div>
  );
}

const ESTILO_CAMPO = "h-12 w-full min-w-0 rounded-xl border bg-white/85 px-4 text-[15px] text-[#222] shadow-sm outline-none transition placeholder:text-[#787878] focus:border-[#6c645e] focus:ring-2 focus:ring-[#a89b91]/20";

function Input({ error, className = "", ...props }) {
  return (
    <input
      {...props}
      aria-invalid={Boolean(error)}
      className={cls(ESTILO_CAMPO, error ? "border-red-400" : "border-[#d8d6d4] hover:border-[#aaa6a2]", className)}
    />
  );
}

function Select({ error, children, ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        aria-invalid={Boolean(error)}
        className={cls(ESTILO_CAMPO, "cursor-pointer appearance-none pr-11", error ? "border-red-400" : "border-[#d8d6d4] hover:border-[#aaa6a2]")}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#292929]" aria-hidden="true" />
    </div>
  );
}

function Textarea({ error, ...props }) {
  return (
    <textarea
      {...props}
      aria-invalid={Boolean(error)}
      className={cls(ESTILO_CAMPO, "min-h-24 resize-y py-3", error ? "border-red-400" : "border-[#d8d6d4] hover:border-[#aaa6a2]")}
    />
  );
}

function AsesorAutocomplete({ id, value, onChange, error }) {
  const [abierto, setAbierto] = useState(false);
  const opciones = useMemo(() => {
    const busqueda = normalizarBusqueda(value);
    return ASESORES.filter((asesor) => normalizarBusqueda(asesor).includes(busqueda)).slice(0, 8);
  }, [value]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-4 z-10 h-4 w-4 text-[#484848]" aria-hidden="true" />
      <Input
        id={id}
        value={value}
        error={error}
        autoComplete="off"
        placeholder="Buscar asesor..."
        className="pl-11"
        onFocus={() => setAbierto(true)}
        onBlur={() => window.setTimeout(() => setAbierto(false), 150)}
        onChange={(e) => {
          onChange(e.target.value);
          setAbierto(true);
        }}
      />
      {abierto && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-52 overflow-y-auto rounded-xl border border-[#e3dfdc] bg-white p-1.5 shadow-xl">
          {opciones.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-500">Sin coincidencias. Selecciona un asesor de la lista.</p>
          ) : (
            opciones.map((asesor) => (
              <button
                key={asesor}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(asesor);
                  setAbierto(false);
                }}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#292929] hover:bg-[#f3f0ed] focus:bg-[#f3f0ed]"
              >
                {asesor}
              </button>
            ))
          )}
        </div>
      )}
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
  const primerError = Object.values(errores)[0];

  function updateField(campo, valor) {
    setForm((anterior) => ({ ...anterior, [campo]: valor }));
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
    <main className="relative min-h-screen overflow-hidden bg-[#f5f3f1] text-[#191919]">
      {/* Imagen decorativa. Guardar el archivo en public/fondo-volvo.webp */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[680px] bg-cover bg-[position:65%_top] bg-no-repeat"
        style={{ backgroundImage: "url('/fondo-volvo.png')" }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[680px] bg-gradient-to-r from-[#f7f5f3]/95 via-[#f7f5f3]/70 to-[#f7f5f3]/20" />
      <div className="pointer-events-none absolute inset-x-0 top-[370px] h-[310px] bg-gradient-to-b from-transparent to-[#f5f3f1]" />

      <div className="relative mx-auto max-w-[1480px] px-4 pb-12 pt-6 sm:px-7 sm:pt-8 lg:px-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4 sm:gap-7">
            <span className="font-serif text-[23px] font-bold tracking-[0.36em] text-black sm:text-[30px]">VOLVO</span>
            <span className="h-8 w-px shrink-0 bg-[#8a827c]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#313131] sm:text-[13px] sm:tracking-[0.16em]">Registro de citas</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#dcd7d3]/65 px-4 py-2 text-xs font-bold text-[#191919] backdrop-blur-sm sm:text-sm">
            <CarFront className="h-5 w-5" aria-hidden="true" />
            Automotriz R&amp;R
          </div>
        </header>

        <section className="mb-8 mt-12 sm:mb-9 sm:mt-14">
          <h1 className="text-3xl font-light tracking-tight sm:text-5xl lg:text-[54px]">
            Concertación de <span className="font-semibold text-[#a19186]">Citas</span>
          </h1>
          <p className="mt-2 text-sm font-medium text-[#4d4b49] sm:text-lg">Registre una nueva cita con el prospecto.</p>
          <div className="mt-4 h-1 w-20 rounded-full bg-[#a19186] sm:w-24" />
        </section>

        <section className="rounded-[26px] border border-white/80 bg-white/90 p-5 shadow-[0_20px_55px_rgba(55,45,39,0.16)] backdrop-blur-xl sm:p-8 lg:p-10">
          {mensaje && (
            <div
              role={guardado ? "status" : "alert"}
              className={cls(
                "mb-7 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium",
                guardado ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-700"
              )}
            >
              {guardado ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
              {mensaje}
            </div>
          )}

          <form onSubmit={enviarFormulario} noValidate>
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              <Campo id="agencia" label="Distribuidor" icono={Building2} requerido error={error("agencia")}>
                <Select id="agencia" value={form.agencia} error={error("agencia")} onChange={(e) => updateField("agencia", e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {AGENCIAS.map((agencia) => <option key={agencia} value={agencia}>{agencia}</option>)}
                </Select>
              </Campo>

              <Campo id="nombre" label="Nombre del cliente" icono={UserRound} requerido error={error("nombre")}>
                <Input
                  id="nombre"
                  value={form.nombre}
                  error={error("nombre")}
                  onChange={(e) => updateField("nombre", e.target.value)}
                  placeholder="Nombre completo"
                  autoComplete="name"
                />
              </Campo>

              <Campo id="telefono" label="Teléfono" icono={Phone} requerido error={error("telefono")} ayuda="10 dígitos o 52 + 10 dígitos.">
                <Input
                  id="telefono"
                  type="tel"
                  value={form.telefono}
                  error={error("telefono")}
                  onChange={(e) => updateField("telefono", soloNumeros(e.target.value).slice(0, 12))}
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="2711234567"
                />
              </Campo>

              <Campo id="auto_interes" label="Volvo de sus sueños" icono={CarFront} requerido error={error("auto_interes")}>
                <Select id="auto_interes" value={form.auto_interes} error={error("auto_interes")} onChange={(e) => updateField("auto_interes", e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {VEHICULOS.map((vehiculo) => <option key={vehiculo} value={vehiculo}>{vehiculo}</option>)}
                </Select>
              </Campo>

              <Campo id="fecha_hora_cita" label="Fecha y hora" icono={CalendarDays} requerido error={error("fecha_hora_cita")}>
                <Input
                  id="fecha_hora_cita"
                  type="datetime-local"
                  value={form.fecha_hora_cita}
                  error={error("fecha_hora_cita")}
                  onChange={(e) => updateField("fecha_hora_cita", e.target.value)}
                />
              </Campo>

              <Campo id="tipo_cita" label="Tipo de cita" icono={Tag} requerido error={error("tipo_cita")}>
                <Select id="tipo_cita" value={form.tipo_cita} error={error("tipo_cita")} onChange={(e) => updateField("tipo_cita", e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {TIPOS_CITA.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                </Select>
              </Campo>

              <Campo id="fuente_prospeccion" label="Fuente" icono={Layers3} requerido error={error("fuente_prospeccion")}>
                <Select id="fuente_prospeccion" value={form.fuente_prospeccion} error={error("fuente_prospeccion")} onChange={(e) => updateField("fuente_prospeccion", e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {FUENTE.map((fuente) => <option key={fuente} value={fuente}>{fuente}</option>)}
                </Select>
              </Campo>

              <Campo id="asesor_piso" label="Asesor de piso" icono={Search} requerido error={error("asesor_piso")}>
                <AsesorAutocomplete id="asesor_piso" value={form.asesor_piso} error={error("asesor_piso")} onChange={(valor) => updateField("asesor_piso", valor)} />
              </Campo>

              <Campo id="comentarios" label="Comentarios" icono={MessageSquareText} className="sm:col-span-2 lg:col-span-3">
                <Textarea
                  id="comentarios"
                  value={form.comentarios}
                  onChange={(e) => updateField("comentarios", e.target.value)}
                  placeholder="Notas adicionales de la cita..."
                />
              </Campo>
            </div>

            <div className="mt-8 flex flex-col items-start justify-between gap-5 border-t border-[#e9e5e2] pt-6 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3 text-sm font-medium text-[#303030]">
                {mostrarErrores && primerError ? <AlertCircle className="h-5 w-5 shrink-0 text-red-600" /> : <ClipboardCheck className="h-5 w-5 shrink-0" />}
                <span>{mostrarErrores && primerError ? primerError : "Revisa los datos y guarda la cita."}</span>
              </div>
              <button
                type="submit"
                disabled={enviando}
                className="inline-flex w-full items-center justify-center gap-4 rounded-full bg-[#191919] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-black/15 transition hover:bg-[#37312d] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[270px]"
              >
                {enviando ? (
                  <><Loader2 className="h-5 w-5 animate-spin" />Guardando...</>
                ) : (
                  <><CalendarCheck2 className="h-5 w-5" />Guardar cita<ArrowRight className="h-5 w-5" /></>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
