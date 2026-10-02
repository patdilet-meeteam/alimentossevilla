"use client";

import { useState } from "react";
import { BookOpen, X, ArrowRight, ClipboardList, FlaskConical, Package, Wheat, ShieldCheck, CircleDollarSign, FileText, Users, History } from "lucide-react";

const flow = [
  {
    number: "1",
    title: "Revise las materias primas",
    icon: Wheat,
    module: "Ingredientes",
    detail: "Busque cada ingrediente por nombre, categoría o código SIESA. Abra el registro y revise sus datos y perfiles nutricionales. Si detecta duplicados, datos incompletos o un perfil que no corresponde, anote el ingrediente y el dato observado.",
    link: "/ingredientes",
    linkLabel: "Abrir Ingredientes",
  },
  {
    number: "2",
    title: "Ubique o registre el producto",
    icon: Package,
    module: "Productos & Presentaciones",
    detail: "Busque el producto terminado y revise código, categoría, estado y presentaciones (gramaje, porción y unidades por empaque). Administración e I+D pueden crear o editar productos. La formulación es común a las presentaciones del producto.",
    link: "/productos",
    linkLabel: "Abrir Productos",
  },
  {
    number: "3",
    title: "Revise la formulación y sus versiones",
    icon: FlaskConical,
    module: "Formulaciones",
    detail: "Desde el producto abra el detalle para consultar ingredientes, porcentajes y versiones. I+D puede trabajar sobre borradores, registrar ingredientes y enviar a revisión. Administración/Director Técnico puede aprobar o devolver una versión. Calidad y Finanzas consultan únicamente versiones aprobadas.",
    link: "/formulaciones",
    linkLabel: "Ver Formulaciones",
  },
  {
    number: "4",
    title: "Compruebe la preparación nutricional",
    icon: ShieldCheck,
    module: "Preparación Nutricional",
    detail: "Esta pantalla muestra si los ingredientes de formulaciones aprobadas tienen perfiles activos y señala ausencias o ambigüedades. Use el enlace del producto para revisar el detalle y los cálculos disponibles. Esta pantalla no calcula el reporte. Los umbrales pueden consultarse; solo Administración puede guardar una nueva versión.",
    link: "/normativa",
    linkLabel: "Abrir Preparación Nutricional",
  },
  {
    number: "5",
    title: "Revise los costos cuando corresponda",
    icon: CircleDollarSign,
    module: "Costos",
    detail: "Administración carga manualmente el archivo mensual de costos, revisa advertencias y aplica una importación válida. Luego se consulta el costo directo de formulaciones aprobadas. I+D, Calidad y Finanzas pueden consultar. La carga no se conecta directamente a SIESA.",
    link: "/costos",
    linkLabel: "Abrir Costos",
  },
  {
    number: "6",
    title: "Consulte la ficha técnica preliminar",
    icon: FileText,
    module: "Documentos Técnicos",
    detail: "Revise las fichas disponibles para productos con formulación aprobada, sus ingredientes y alérgenos. Administración e I+D pueden guardar un snapshot preliminar e imprimir la previsualización cuando la fuente lo permite. La ficha no es oficial y el cálculo nutricional continúa en cotejo técnico.",
    link: "/documentos",
    linkLabel: "Abrir Documentos Técnicos",
  },
];

const modules = [
  { title: "Dashboard", icon: ClipboardList, text: "Resumen de los módulos y del alcance disponible para el perfil conectado." },
  { title: "Usuarios", icon: Users, text: "Administración consulta cuentas y cambia roles o estados de acceso." },
  { title: "Auditoría", icon: History, text: "Administración consulta eventos y cambios registrados en el sistema." },
];

export function UserGuide() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-[#1C4378]/20 px-3 py-2 text-xs font-medium text-[#1C4378] transition-colors hover:bg-[#1C4378]/5 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        aria-haspopup="dialog"
      >
        <BookOpen className="h-4 w-4" />
        <span className="hidden sm:inline">Guía de uso</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-guide-title"
            className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-slate-50 shadow-2xl dark:bg-slate-950"
          >
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#1C4378] dark:text-[#6FC7DA]">Alimentos Sevilla · Preentrega</p>
                <h2 id="user-guide-title" className="mt-1 text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">Guía de uso: flujo de revisión</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Siga los pasos en orden para revisar un producto desde sus materias primas hasta su ficha técnica.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Cerrar guía">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="space-y-8 p-5 sm:p-8">
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-[#1C4378] dark:text-[#6FC7DA]" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">Flujo recomendado, paso a paso</h3>
                </div>
                <div className="space-y-3">
                  {flow.map((step) => {
                    const Icon = step.icon;
                    return (
                      <article key={step.number} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[2.5rem_1fr] sm:p-5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1C4378] text-sm font-semibold text-white">{step.number}</div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Icon className="h-4 w-4 text-[#1C4378] dark:text-[#6FC7DA]" />
                            <h4 className="font-semibold text-slate-900 dark:text-white">{step.title}</h4>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{step.module}</span>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{step.detail}</p>
                          <a href={step.link} onClick={() => setOpen(false)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1C4378] hover:underline dark:text-[#6FC7DA]">{step.linkLabel}<ArrowRight className="h-3.5 w-3.5" /></a>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">Otros módulos</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  {modules.map((module) => {
                    const Icon = module.icon;
                    return <article key={module.title} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white"><Icon className="h-4 w-4 text-[#1C4378] dark:text-[#6FC7DA]" />{module.title}</div><p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{module.text}</p></article>;
                  })}
                </div>
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                  <h3 className="font-semibold text-blue-950 dark:text-blue-100">¿Qué puedo hacer con mi perfil?</h3>
                  <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-blue-900 dark:text-blue-200">
                    <li><strong>Administrador:</strong> administra el sistema, aprueba formulaciones, gestiona costos, parámetros, usuarios y auditoría.</li>
                    <li><strong>I+D:</strong> edita ingredientes, productos y borradores; ejecuta cálculos y revisa/imprime documentos preliminares.</li>
                    <li><strong>Calidad:</strong> consulta módulos y versiones aprobadas; no modifica ni imprime documentos.</li>
                    <li><strong>Finanzas / Consulta:</strong> consulta módulos, costos y formulaciones aprobadas.</li>
                  </ul>
                  <p className="mt-2 text-xs text-blue-800 dark:text-blue-300">La matriz es provisional para esta preentrega. Si necesita otra acción, repórtela como observación.</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                  <h3 className="font-semibold">Alcance y cómo reportar hallazgos</h3>
                  <p className="mt-2 text-sm leading-relaxed">Esta versión es para revisión. El resultado nutricional sigue en validación técnica contra los Excel confirmados y las fichas son preliminares, no oficiales. Para reportar un problema, indique módulo, producto, perfil usado, pasos, qué esperaba y qué ocurrió. Envíelo a la persona que coordinó su acceso; esta guía no guarda comentarios.</p>
                </div>
              </section>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
