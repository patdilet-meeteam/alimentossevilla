import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { Wheat } from "lucide-react";

export default function IngredientesPage() {
  return (
    <ModulePlaceholder
      moduleName="Ingredientes & Materias Primas"
      moduleKey="ingredientes"
      description="Catálogo centralizado de materias primas, composición nutricional y mapeo con códigos SIESA."
      roadmapWeek="Semana 2 — Levantamiento & Catálogo"
      icon={Wheat}
      plannedCapabilities={[
        "Administración del maestro de materias primas y aditivos alimentarios.",
        "Almacenamiento de perfiles nutricionales basados en muestras oficiales del Banco Nutricional.",
        "Asociación obligatoria de código de materia prima SIESA para costeo futuro.",
        "Gestión de alérgenos, origen y especificaciones técnicas de proveedores.",
        "Historial y trazabilidad de cambios en la composición nutricional por ingrediente.",
      ]}
    />
  );
}
