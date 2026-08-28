import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { FlaskConical } from "lucide-react";

export default function FormulacionesPage() {
  return (
    <ModulePlaceholder
      moduleName="Formulaciones & Recetas"
      moduleKey="formulaciones"
      description="Creación, versionamiento inmutable, balance de ingredientes y factores de rendimiento de proceso."
      roadmapWeek="Semana 3 — Formulaciones & Versionamiento"
      icon={FlaskConical}
      plannedCapabilities={[
        "Composición porcentual y en peso (batch base) de materias primas por producto.",
        "Versionamiento inmutable con trazabilidad histórica (v1, v2, v3...).",
        "Control de mermas, pérdidas de humedad y rendimientos térmicos de proceso.",
        "Simulación de cambios de ingredientes y sustitución de materias primas.",
        "Workflow de revisión y aprobación técnica (según confirmación del Kick-Off).",
      ]}
    />
  );
}
