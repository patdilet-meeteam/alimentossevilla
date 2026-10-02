import { listProducts } from "@/app/actions/product-actions";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/roles";
import { ProductsTable } from "@/components/products/products-table";
import { ProductCreateButton } from "@/components/products/product-create-button";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ClipboardList, Package } from "lucide-react";

export default async function ProductosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const products = await listProducts();
  const canWrite = hasRole(user.role, ["ADMIN", "R_AND_D"]);
  const clientProducts = products.map((product) => ({
    ...product,
    presentations: product.presentations.map((presentation) => ({
      ...presentation,
      gramajeNeto: presentation.gramajeNeto.toString(),
    })),
  }));
  const activeProducts = products.filter((product) => product.isActive).length;
  const approvedProducts = products.filter((product) =>
    product.formulations.some((formulation) =>
      formulation.versions.some((version) => version.estado === "APPROVED")
    )
  ).length;

  if (products.length === 0) {
    return (
      <div className="space-y-7">
        <ProductsHeader count={products.length} active={activeProducts} approved={approvedProducts} canWrite={canWrite} />
        <Card className="border-[#D3D8DE]">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="rounded-full bg-slate-100 p-3 text-[#1C4378]">
              <Package className="size-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h2 className="font-medium text-slate-900">Aún no hay productos</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                {canWrite
                  ? "Cree el primer producto para registrar presentaciones y formular sus ingredientes."
                  : "No hay productos registrados para consultar. Solicite acceso al equipo administrador."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <ProductsHeader count={products.length} active={activeProducts} approved={approvedProducts} canWrite={canWrite} />
      <ProductsTable products={clientProducts} canWrite={canWrite} />
    </div>
  );
}

function ProductsHeader({ count, active, approved, canWrite }: { count: number; active: number; approved: number; canWrite: boolean }) {
  return (
    <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-5 border-b border-slate-100 bg-gradient-to-r from-white via-white to-sky-50/80 px-5 py-5 dark:border-slate-800 dark:from-slate-900 dark:to-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1C4378] text-white shadow-sm shadow-blue-950/15">
            <Package className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1C4378] dark:text-[#6FC7DA]">Catálogo maestro</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Productos</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-300">Administre productos terminados y consulte sus presentaciones y formulaciones.</p>
          </div>
        </div>
        {canWrite ? <ProductCreateButton /> : null}
      </div>
      <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
        <div className="px-4 py-3.5 sm:px-7"><p className="text-xl font-semibold text-slate-900 dark:text-white">{count}</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Productos registrados</p></div>
        <div className="px-4 py-3.5 sm:px-7"><p className="flex items-center gap-1.5 text-xl font-semibold text-slate-900 dark:text-white"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{active}</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Productos activos</p></div>
        <div className="px-4 py-3.5 sm:px-7"><p className="flex items-center gap-1.5 text-xl font-semibold text-slate-900 dark:text-white"><ClipboardList className="h-4 w-4 text-[#1C4378] dark:text-[#6FC7DA]" />{approved}</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Con formulación aprobada</p></div>
      </div>
    </header>
  );
}
