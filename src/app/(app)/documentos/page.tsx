import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { FileText } from "lucide-react";

export default function DocumentosPage() {
  return (
    <ModulePlaceholder
      moduleName="Documentación Técnica & Textos Legales"
      moduleKey="documentos"
      description="Generación estandarizada de Fichas Técnicas de Producto, Textos Legales de Rotulado y tablas nutricionales."
      roadmapWeek="Semana 6 — Documentos & Cierre"
      icon={FileText}
      plannedCapabilities={[
        "Generación automática de Fichas Técnicas de Producto basadas en la formulación y normativa vigentes.",
        "Elaboración estandarizada del documento 'Textos Legales' para registro y aprobación sanitaria.",
        "Listado descendente de ingredientes y advertencia de alérgenos por formulación.",
        "Control de versiones de los documentos emitidos e historial de descargas.",
        "Exportación de datos estructurados para el equipo de diseño del empaque final (arte fuera de alcance).",
      ]}
    />
  );
}
