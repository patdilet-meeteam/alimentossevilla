import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { ShieldCheck } from "lucide-react";

export default function NormativaPage() {
  return (
    <ModulePlaceholder
      moduleName="Cálculo Nutricional & Parámetros Regulatorios"
      moduleKey="normativa"
      description="Motor de cálculo nutricional, límites de advertencia frontal, sellos octagonales y valores diarios de referencia."
      roadmapWeek="Semana 4 — Motor Nutricional & Normativa"
      icon={ShieldCheck}
      plannedCapabilities={[
        "Cálculo automatizado de nutrientes obligatorios por 100g y por tamaño de porción.",
        "Evaluación de umbrales regulatorios para sellos de advertencia frontal (Sodio, Grasas, Azúcares).",
        "Reglas oficiales de redondeo y formato normativo para tablas de información nutricional.",
        "Parametrización de resoluciones sanitarias vigentes y factores de conversión energética.",
        "Verificación de declaraciones y claims nutricionales ('Buena fuente de...', 'Excelente fuente de...').",
      ]}
    />
  );
}
