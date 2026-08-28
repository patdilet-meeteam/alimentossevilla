import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ModulePlaceholderProps {
  moduleName: string;
  moduleKey: string;
  description: string;
  roadmapWeek: string;
  plannedCapabilities: string[];
  icon: React.ComponentType<{ className?: string }>;
}

export function ModulePlaceholder({
  moduleName,
  description,
  roadmapWeek,
  plannedCapabilities,
  icon: Icon,
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header card */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-lg bg-white dark:bg-slate-900 border shadow-xs">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {moduleName}
              </h2>
              <Badge variant="secondary" className="font-mono text-xs">
                {roadmapWeek}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">Volver al Dashboard</Link>
          </Button>
        </div>
      </div>

      {/* Main Notice */}
      <Alert variant="info">
        <Info className="h-4 w-4" />
        <AlertTitle className="font-semibold">
          Etapa de Levantamiento & Diseño en Progreso
        </AlertTitle>
        <AlertDescription className="mt-1">
          Este módulo será habilitado durante las siguientes etapas del proyecto.
          Para garantizar el rigor técnico y no inventar reglas de negocio ni fórmulas prematuras,
          la lógica específica se implementará tras la confirmación de criterios normativos y reglas funcionales en las mesas técnicas.
        </AlertDescription>
      </Alert>

      {/* Capabilities Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Capacidades Planificadas para este Módulo
            </CardTitle>
            <CardDescription>
              Alcance funcional previsto en la hoja de ruta de implementación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {plannedCapabilities.map((cap, index) => (
                <li key={index} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                  <span>{cap}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Estado de Definición y Gobernanza
            </CardTitle>
            <CardDescription>
              Trazabilidad con el catálogo de decisiones y preguntas abiertas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <p>
              El modelo conceptual correspondiente a este módulo se encuentra registrado en el documento maestro{" "}
              <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                docs/DOMAIN.md
              </code>
              .
            </p>
            <p>
              Cualquier regla de cálculo pendiente de confirmación formal está documentada como{" "}
              <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                OPEN QUESTION
              </code>{" "}
              en el repositorio para evitar supuestos no validados.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
