import { getCurrentUser } from "@/lib/auth/session";
import { RoleLabels } from "@/lib/auth/roles";
import { getRecentAuditEvents } from "@/lib/audit/audit-service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wheat,
  Package,
  FlaskConical,
  CircleDollarSign,
  ShieldCheck,
  FileText,
  Users,
  History,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface ModuleCard {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  scope: string;
  status: string;
  week: string;
}

const moduleCards: ModuleCard[] = [
  {
    title: "Ingredientes & Materias Primas",
    href: "/ingredientes",
    icon: Wheat,
    scope: "Gestión de catálogo de materias primas, perfiles nutricionales y asociación con códigos SIESA.",
    status: "Semana 2",
    week: "Semana 2",
  },
  {
    title: "Productos & Presentaciones",
    href: "/productos",
    icon: Package,
    scope: "Catálogo de productos terminados, presentaciones comerciales, gramajes y porciones de referencia.",
    status: "Semana 3",
    week: "Semana 3",
  },
  {
    title: "Formulaciones & Recetas",
    href: "/formulaciones",
    icon: FlaskConical,
    scope: "Estructura de fórmulas, control de versiones, rendimientos de proceso y trazabilidad técnica.",
    status: "Semana 3",
    week: "Semana 3",
  },
  {
    title: "Cálculo Nutricional & Sellos",
    href: "/normativa",
    icon: ShieldCheck,
    scope: "Motor de cálculo normativo, límites de advertencia frontal y parámetros regulatorios.",
    status: "Semana 4",
    week: "Semana 4",
  },
  {
    title: "Costos de Formulación",
    href: "/costos",
    icon: CircleDollarSign,
    scope: "Carga mensual de costos de materias primas, cruce por código SIESA y costeo de batch.",
    status: "Semana 5",
    week: "Semana 5",
  },
  {
    title: "Documentos Técnicos",
    href: "/documentos",
    icon: FileText,
    scope: "Generación de Fichas Técnicas, Textos Legales y rotulado normativo oficial.",
    status: "Semana 6",
    week: "Semana 6",
  },
  {
    title: "Gestión de Usuarios",
    href: "/usuarios",
    icon: Users,
    scope: "Administración de accesos, cuentas y perfiles según la matriz de roles corporativa.",
    status: "Operativo",
    week: "Foundation",
  },
  {
    title: "Auditoría & Trazabilidad",
    href: "/auditoria",
    icon: History,
    scope: "Registro inmutable de eventos de seguridad y cambios en entidades del sistema.",
    status: "Operativo",
    week: "Foundation",
  },
];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const recentEvents = await getRecentAuditEvents(5);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-slate-900 text-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Layers className="w-64 h-64 text-blue-400" />
        </div>

        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-900/60 text-blue-200 border-blue-700/50 text-[11px]">
              Fase Actual: Semana 2 — Catálogo de Ingredientes
            </Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Bienvenido, {user?.name}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Ha ingresado con el perfil de{" "}
            <span className="font-semibold text-white">
              {user ? RoleLabels[user.role] : "Usuario"}
            </span>
            . Esta plataforma centraliza la gestión técnica, perfiles nutricionales, formulaciones y cumplimiento normativo de Alimentos Sevilla S.A.S.
          </p>
        </div>
      </div>

      {/* Quick Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-slate-900 border shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Etapa Contractual
            </CardDescription>
            <CardTitle className="text-base font-semibold">
              Semana 2 de 6
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Catálogo de materias primas, perfiles nutricionales y código SIESA (SPEC-002).
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Foundation Operativa
            </CardDescription>
            <CardTitle className="text-base font-semibold text-emerald-700 dark:text-emerald-400">
              Activa & Segura
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Autenticación server-side, 4 roles base y bitácora de auditoría habilitada.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              Gobernanza de Reglas
            </CardDescription>
            <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Kick-Off Funcional
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              18 preguntas abiertas documentadas en <code className="text-[11px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">docs/OPEN-QUESTIONS.md</code>.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modules Grid */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Módulos del Sistema
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Acceso a las áreas funcionales de la plataforma y su estado de disponibilidad
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {moduleCards.map((m) => {
            const Icon = m.icon;
            const isOperational = m.status === "Operativo";

            return (
              <Link
                key={m.href}
                href={m.href}
                className="group flex flex-col justify-between p-5 rounded-lg bg-white dark:bg-slate-900 border hover:border-blue-500/50 hover:shadow-md transition-all duration-150"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-950/50 dark:group-hover:text-blue-400 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge
                      variant={isOperational ? "success" : "secondary"}
                      className="text-[10px] font-medium"
                    >
                      {m.status}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                      {m.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {m.scope}
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                  <span>Acceder al área</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Audit Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Actividad Reciente del Sistema
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Últimos eventos registrados en la bitácora transversal de auditoría
            </p>
          </div>
          <Link
            href="/auditoria"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
          >
            <span>Ver toda la bitácora</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <Card className="bg-white dark:bg-slate-900 border shadow-xs">
          <CardContent className="p-0">
            {recentEvents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No hay eventos registrados en la bitácora todavía.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {evt.action}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 ml-2">
                          en {evt.entity} {evt.entityId ? `(#${evt.entityId})` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 sm:text-right">
                      <span>{evt.actorEmail || "Sistema"}</span>
                      <span className="text-[11px] font-mono">
                        {formatDate(evt.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
