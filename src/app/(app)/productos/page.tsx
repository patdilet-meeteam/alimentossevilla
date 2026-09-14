import { listProducts } from "@/app/actions/product-actions";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/roles";
import { ProductsTable } from "@/components/products/products-table";
import { ProductCreateButton } from "@/components/products/product-create-button";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { Package } from "lucide-react";

export default async function ProductosPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <ModulePlaceholder
        moduleName="Productos & Presentaciones Comerciales"
        moduleKey="productos"
        description="Inicie sesión para acceder al catálogo de productos terminados."
        roadmapWeek="Semana 3 — Productos & Fórmulas"
        icon={Package}
        plannedCapabilities={["Catálogo maestro de productos terminados."]}
      />
    );
  }

  const products = await listProducts();
  const canWrite = hasRole(user.role, ["ADMIN", "R_AND_D"]);

  if (products.length === 0) {
    return (
      <ModulePlaceholder
        moduleName="Productos & Presentaciones Comerciales"
        moduleKey="productos"
        description="Aún no hay productos cargados. Cree el primero para empezar a registrar formulaciones."
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

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1F2933]">
            Productos &amp; Presentaciones
          </h1>
          <p className="text-sm text-muted-foreground">
            Catálogo maestro de productos terminados de Alimentos Sevilla.
          </p>
        </div>
        {canWrite ? <ProductCreateButton /> : null}
      </header>
      <ProductsTable products={products} canWrite={canWrite} />
    </div>
  );
}
