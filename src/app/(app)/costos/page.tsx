import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { CircleDollarSign } from "lucide-react";

export default function CostosPage() {
  return (
    <ModulePlaceholder
      moduleName="Costos de Formulación"
      moduleKey="costos"
      description="Importación mensual de archivos de costos de materias primas y costeo teórico de formulaciones por código SIESA."
      roadmapWeek="Semana 5 — Costos & Finanzas"
      icon={CircleDollarSign}
      plannedCapabilities={[
        "Importador estructurado para archivos mensuales de costos contables.",
        "Cruce automático y validación de materias primas por código SIESA (sin integración API directa).",
        "Cálculo de costo estándar por kilogramo de emulsión/pasta y por presentación comercial.",
        "Análisis de sensibilidad y variación histórica de costos de insumos.",
        "Detección y gestión de alertas ante códigos SIESA no asociados.",
      ]}
    />
  );
}
