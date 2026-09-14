import Link from "next/link";
import { listProducts } from "@/app/actions/product-actions";
import { getCurrentUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { ArrowRight, Beaker } from "lucide-react";

const EstadoClass: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  IN_REVIEW: "bg-amber-100 text-amber-800 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  OBSOLETE: "bg-zinc-200 text-zinc-700 border-zinc-300",
};

export default async function FormulacionesPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <ModulePlaceholder
        moduleName="Formulaciones"
        moduleKey="formulaciones"
        description="Inicie sesión para acceder a las formulaciones."
        roadmapWeek="Semana 3 — Productos & Fórmulas"
        icon={Beaker}
        plannedCapabilities={["Listado cruzado de productos, formulaciones y versiones vigentes."]}
      />
    );
  }

  const products = await listProducts();
  const productsWithForm = products.filter((p) => p.formulations.length > 0);

  if (productsWithForm.length === 0) {
    return (
      <ModulePlaceholder
        moduleName="Formulaciones"
        moduleKey="formulaciones"
        description="Aún no hay formulaciones registradas. Cree un producto y luego su primera versión de fórmula."
        roadmapWeek="Semana 3 — Productos & Fórmulas"
        icon={Beaker}
        plannedCapabilities={[
          "Maestro de productos terminados con formulación 1:1 (OQ-002).",
          "Versionamiento inmutable con workflow DRAFT → IN_REVIEW → APPROVED → OBSOLETE.",
          "Trazabilidad de aprobaciones con usuario y fecha (OQ-004 y OQ-005).",
        ]}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1F2933]">Formulaciones</h1>
        <p className="text-sm text-muted-foreground">
          Estado actual de las formulaciones de cada producto. Use la vista de detalle para crear versiones y registrar ingredientes.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {productsWithForm.map((p) => {
          const versions = p.formulations.flatMap((f) => f.versions);
          const vigente = versions.find((v) => v.estado === "APPROVED");
          const ultima = versions[0];
          return (
            <Card key={p.id} className="border-[#D3D8DE]">
              <CardHeader>
                <CardTitle className="text-base">{p.nombreComercial}</CardTitle>
                <p className="text-xs text-muted-foreground">{p.codigoInterno}</p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {versions.length} versión(es)
                  </span>
                  {vigente ? (
                    <Badge variant="outline" className={EstadoClass.APPROVED}>
                      Vigente v{vigente.numeroSecuencial}
                    </Badge>
                  ) : ultima ? (
                    <Badge variant="outline" className={EstadoClass[ultima.estado]}>
                      Última v{ultima.numeroSecuencial} · {ultima.estado}
                    </Badge>
                  ) : null}
                </div>
                <div className="flex justify-end">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/productos/${p.id}`}>
                      Ver detalle <ArrowRight className="ml-1 size-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
