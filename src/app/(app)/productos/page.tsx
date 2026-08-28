import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { Package } from "lucide-react";

export default function ProductosPage() {
  return (
    <ModulePlaceholder
      moduleName="Productos & Presentaciones Comerciales"
      moduleKey="productos"
      description="Catálogo de productos terminados, líneas comerciales, formatos de empaque y tamaños de porción."
      roadmapWeek="Semana 3 — Productos & Fórmulas"
      icon={Package}
      plannedCapabilities={[
        "Catálogo maestro de productos terminados clasificados por categoría industrial.",
        "Manejo de múltiples presentaciones comerciales (empaques, gramajes netos y unidades por bulto).",
        "Configuración del tamaño de porción declarada y número de porciones por envase.",
        "Asociación de denominaciones comerciales y textos de rotulado.",
        "Trazabilidad de fichas y formulaciones asociadas a cada presentación.",
      ]}
    />
  );
}
