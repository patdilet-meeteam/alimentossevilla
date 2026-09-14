import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductById } from "@/app/actions/product-actions";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProductVersionPanel } from "@/components/products/product-version-panel";

interface PageProps {
  params: Promise<{ id: string }>;
}

const CategoryLabels: Record<string, string> = {
  SALCHICHA: "Salchicha",
  CHORIZO: "Chorizo",
  JAMON: "Jamón",
  MORTADELA: "Mortadela",
  TOCINETA: "Tocineta",
  PERRO_CALIENTE: "Perro caliente",
  OTRO: "Otro",
};

export default async function ProductoDetallePage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) notFound();

  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const canWrite = hasRole(user.role, ["ADMIN", "R_AND_D"]);
  const canApprove = hasRole(user.role, ["ADMIN", "QUALITY"]);
  const canReject = hasRole(user.role, ["ADMIN"]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/productos" aria-label="Volver al listado">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-[#1F2933]">{product.nombreComercial}</h1>
          <p className="text-sm text-muted-foreground">
            {product.codigoInterno} · {CategoryLabels[product.categoriaProducto] ?? product.categoriaProducto}
          </p>
        </div>
        <Badge
          variant="outline"
          className={product.isActive
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 ml-auto"
            : "border-zinc-200 bg-zinc-100 text-zinc-600 ml-auto"}
        >
          {product.isActive ? "Activo" : "Inactivo"}
        </Badge>
      </div>

      {product.descripcion ? (
        <p className="text-sm text-muted-foreground">{product.descripcion}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-[#D3D8DE]">
          <CardHeader>
            <CardTitle className="text-base">Presentaciones comerciales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {product.presentations.length === 0 ? (
              <p className="text-muted-foreground">Sin presentaciones registradas.</p>
            ) : (
              product.presentations.map((pres) => (
                <div
                  key={pres.id}
                  className="flex items-center justify-between rounded-md border border-[#D3D8DE] px-3 py-2"
                >
                  <div>
                    <div className="font-medium text-[#1F2933]">
                      {Number(pres.gramajeNeto.toString()).toLocaleString("es-CO", { maximumFractionDigits: 2 })} g
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pres.unidadesPorEmpaque ? `${pres.unidadesPorEmpaque} unid/empaque` : "—"}
                      {pres.porcionDeclarada
                        ? ` · porción ${Number(pres.porcionDeclarada.toString()).toLocaleString("es-CO", { maximumFractionDigits: 1 })} g`
                        : ""}
                      {pres.porcionPorEnvase
                        ? ` · ${Number(pres.porcionPorEnvase.toString()).toLocaleString("es-CO", { maximumFractionDigits: 2 })} porciones/envase`
                        : ""}
                    </div>
                  </div>
                  <Badge variant="outline" className={pres.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-zinc-100 text-zinc-600"}>
                    {pres.isActive ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <ProductVersionPanel
          productId={product.id}
          formulations={product.formulations.map((f) => ({
            id: f.id,
            baseCalculo: f.baseCalculo.toString(),
            rendimientoEsperado: f.rendimientoEsperado?.toString() ?? null,
            versions: f.versions.map((v) => ({
              id: v.id,
              numeroSecuencial: v.numeroSecuencial,
              estado: v.estado,
              aprobadaEn: v.aprobadaEn ? v.aprobadaEn.toISOString() : null,
              aprobadaPor: v.aprobadaPor ? { name: v.aprobadaPor.name, email: v.aprobadaPor.email } : null,
              ingredients: v.ingredients.map((fi) => ({
                id: fi.id,
                porcentaje: fi.porcentajeParticipacion.toString(),
                ingredient: { id: fi.ingredient.id, name: fi.ingredient.name, siesaCode: fi.ingredient.siesaCode, category: String(fi.ingredient.category) },
              })),
            })),
          }))}
          canWrite={canWrite}
          canApprove={canApprove}
          canReject={canReject}
        />
      </div>
    </div>
  );
}
