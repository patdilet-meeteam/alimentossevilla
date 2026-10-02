import Link from "next/link";
import { listProducts } from "@/app/actions/product-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormulationsTable } from "@/components/products/formulations-table";
import { ArrowRight, CheckCircle2, ClipboardList, FlaskConical, PackagePlus } from "lucide-react";

export default async function FormulacionesPage() {
  const products = await listProducts();
  const productsWithForm = products.filter((product) => product.formulations.length > 0);
  const entries = productsWithForm.map((product) => {
    const versions = product.formulations.flatMap((formulation) => formulation.versions);
    const current = versions.find((version) => version.estado === "APPROVED");
    const latest = versions[0] ?? null;
    return {
      id: product.id,
      name: product.nombreComercial,
      code: product.codigoInterno,
      category: product.categoriaProducto,
      versions: versions.map((version) => ({ number: version.numeroSecuencial, status: version.estado })),
      approvedVersion: current?.numeroSecuencial ?? null,
      latestVersion: latest ? { number: latest.numeroSecuencial, status: latest.estado } : null,
    };
  });
  const totalVersions = entries.reduce((total, product) => total + product.versions.length, 0);
  const approvedCount = entries.filter((product) => product.approvedVersion !== null).length;
  const reviewCount = entries.filter((product) => product.latestVersion?.status === "IN_REVIEW").length;
  const categoryLabels: Record<string, string> = { SALCHICHA: "Salchicha", CHORIZO: "Chorizo", JAMON: "Jamón", MORTADELA: "Mortadela", TOCINETA: "Tocineta", PERRO_CALIENTE: "Perro caliente", OTRO: "Otro" };

  return (
    <div className="space-y-7">
      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-5 border-b border-slate-100 bg-gradient-to-r from-white via-white to-violet-50/70 px-5 py-5 dark:border-slate-800 dark:from-slate-900 dark:to-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1C4378] text-white shadow-sm"><FlaskConical className="h-6 w-6" aria-hidden="true" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1C4378] dark:text-[#6FC7DA]">Control de versiones</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Formulaciones</h1>
              <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-300">Consulte el avance y estado de las recetas por producto.</p>
            </div>
          </div>
          <Button asChild variant="outline" className="justify-center border-slate-200 text-[#1C4378] dark:border-slate-700 dark:text-slate-200">
            <Link href="/productos"><PackagePlus className="mr-2 h-4 w-4" />Ir a Productos</Link>
          </Button>
        </div>
        <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
          <div className="px-4 py-3.5 sm:px-7"><p className="flex items-center gap-1.5 text-xl font-semibold text-slate-900 dark:text-white"><ClipboardList className="h-4 w-4 text-[#1C4378] dark:text-[#6FC7DA]" />{entries.length}</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Productos con fórmula</p></div>
          <div className="px-4 py-3.5 sm:px-7"><p className="text-xl font-semibold text-slate-900 dark:text-white">{totalVersions}</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Versiones registradas</p></div>
          <div className="px-4 py-3.5 sm:px-7"><p className="flex items-center gap-1.5 text-xl font-semibold text-slate-900 dark:text-white"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{approvedCount}</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Con versión aprobada</p></div>
        </div>
      </header>

      {entries.length === 0 ? (
        <Card className="border-dashed border-slate-300 dark:border-slate-700">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-[#1C4378] dark:bg-slate-800 dark:text-[#6FC7DA]"><FlaskConical className="h-6 w-6" /></div>
            <div><h2 className="font-semibold text-slate-900 dark:text-white">Todavía no hay formulaciones</h2><p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">Las formulaciones se crean desde el detalle de cada producto.</p></div>
            <Button asChild><Link href="/productos">Ir al catálogo de productos<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </CardContent>
        </Card>
      ) : (
        <FormulationsTable entries={entries} categoryLabels={categoryLabels} reviewCount={reviewCount} />
      )}
      <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs leading-relaxed text-blue-900 dark:border-blue-950 dark:bg-blue-950/30 dark:text-blue-200">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Una versión aprobada es la vigente para consulta. Las versiones en borrador o revisión son visibles según el perfil asignado; Calidad y Finanzas consultan únicamente versiones aprobadas.</p>
      </div>
    </div>
  );
}
