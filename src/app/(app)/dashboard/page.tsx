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
    status: "Disponible",
    week: "Catálogo",
  },
  {
    title: "Productos & Presentaciones",
    href: "/productos",
    icon: Package,
    scope: "Catálogo de productos terminados, presentaciones comerciales, gramajes y porciones de referencia.",
    status: "Disponible",
    week: "Productos",
  },
  {
    title: "Formulaciones & Recetas",
    href: "/formulaciones",
    icon: FlaskConical,
    scope: "Estructura de fórmulas, control de versiones, rendimientos de proceso y trazabilidad técnica.",
    status: "Disponible",
    week: "Formulaciones",
  },
  {
    title: "Cálculo Nutricional & Sellos",
    href: "/normativa",
    icon: ShieldCheck,
    scope: "Motor de cálculo normativo, límites de advertencia frontal y parámetros regulatorios.",
    status: "Semana 4",
    week: "Sem. 4",
  },
  {
    title: "Costos de Formulación",
    href: "/costos",
    icon: CircleDollarSign,
    scope: "Carga mensual de costos de materias primas, cruce por código SIESA y costeo de batch.",
    status: "Disponible",
    week: "Costos",
  },
  {
    title: "Documentos Técnicos",
    href: "/documentos",
    icon: FileText,
    scope: "Generación de Fichas Técnicas, Textos Legales y rotulado normativo oficial.",
    status: "Semana 6",
    week: "Sem. 6",
  },
  {
    title: "Gestión de Usuarios",
    href: "/usuarios",
    icon: Users,
    scope: "Administración de accesos, cuentas y perfiles según la matriz de roles corporativa.",
    status: "Disponible",
    week: "Accesos",
  },
  {
    title: "Auditoría & Trazabilidad",
    href: "/auditoria",
    icon: History,
    scope: "Registro inmutable de eventos de seguridad y cambios en entidades del sistema.",
    status: "Disponible",
    week: "Trazabilidad",
  },
];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const recentEvents = await getRecentAuditEvents(5);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-[#1C4378] text-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Layers className="w-64 h-64 text-[#6FC7DA]" />
        </div>

        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-[#6FC7DA]/20 text-[#DDF7FC] border-[#6FC7DA]/50 text-[11px]">
              Fase Actual: Semana 4 — Costos de Formulación
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
              <Wheat className="w-3.5 h-3.5 text-[#1C4378]" />
              Etapa Contractual
            </CardDescription>
            <CardTitle className="text-base font-semibold">
              Semana 4 de 6
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Costos de formulación: importación mensual, cruce SIESA y costeo de batch.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-[#1C4378]" />
              Productos y formulaciones
            </CardDescription>
            <CardTitle className="text-base font-semibold text-[#1C4378] dark:text-[#6FC7DA]">
              Recetas y versiones
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Productos, presentaciones y control de versiones de cada formulación.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#1C4378]" />
              Trazabilidad y acceso
            </CardDescription>
            <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Usuarios y auditoría
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Administración de accesos por rol y registro de cambios relevantes del sistema.
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
            const isOperational = m.status === "Disponible";

            return (
              <Link
                key={m.href}
                href={m.href}
                className="group flex flex-col justify-between p-5 rounded-lg bg-white dark:bg-slate-900 border hover:border-[#6FC7DA] hover:shadow-md transition-all duration-150"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-[#6FC7DA]/20 group-hover:text-[#1C4378] dark:group-hover:bg-[#1C4378]/50 dark:group-hover:text-[#6FC7DA] transition-colors">
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
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-[#1C4378] transition-colors">
                      {m.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {m.scope}
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex items-center text-xs font-medium text-[#1C4378] dark:text-[#6FC7DA] group-hover:translate-x-1 transition-transform">
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
            className="text-xs font-medium text-[#1C4378] hover:text-[#6FC7DA] dark:text-[#6FC7DA] flex items-center gap-1"
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
                      <span className="w-2 h-2 rounded-full bg-[#1C4378] shrink-0" />
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
