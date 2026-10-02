"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Package, Search, SlidersHorizontal } from "lucide-react";

export interface ProductRow {
  id: string;
  codigoInterno: string;
  nombreComercial: string;
  categoriaProducto: string;
  descripcion: string | null;
  isActive: boolean;
  presentations: Array<{
    id: string;
    gramajeNeto: { toString(): string } | number | string;
    unidadesPorEmpaque: number | null;
    isActive: boolean;
  }>;
  formulations: Array<{
    id: string;
    versions: Array<{
      id: string;
      numeroSecuencial: number;
      estado: string;
    }>;
  }>;
}

interface ProductsTableProps {
  products: ProductRow[];
  canWrite: boolean;
}

function fmtGrams(value: ProductRow["presentations"][number]["gramajeNeto"]): string {
  if (value == null) return "—";
  const n = typeof value === "object" && "toString" in value ? Number(value.toString()) : Number(value);
  return Number.isFinite(n) ? `${n.toLocaleString("es-CO", { maximumFractionDigits: 2 })} g` : "—";
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

const StateStyles: Record<string, string> = {
  DRAFT: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  IN_REVIEW: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  OBSOLETE: "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export function ProductsTable({ products }: ProductsTableProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.categoriaProducto))].sort((a, b) => (CategoryLabels[a] ?? a).localeCompare(CategoryLabels[b] ?? b, "es")),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    return products.filter((product) => {
      const matchesQuery = !normalizedQuery || `${product.nombreComercial} ${product.codigoInterno}`.toLocaleLowerCase("es").includes(normalizedQuery);
      const matchesCategory = category === "ALL" || product.categoriaProducto === category;
      const matchesStatus = status === "ALL" || (status === "ACTIVE" ? product.isActive : !product.isActive);
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [products, query, category, status]);

  return (
    <section className="space-y-3" aria-label="Catálogo de productos">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:p-4">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Buscar productos</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o código…" className="h-10 border-slate-200 pl-9 dark:border-slate-700" />
        </label>
        <div className="flex gap-2">
          <label className="relative min-w-0 flex-1 sm:w-44 sm:flex-none">
            <span className="sr-only">Filtrar por categoría</span>
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 w-full appearance-none rounded-md border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-[#1C4378] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <option value="ALL">Todas las categorías</option>
              {categories.map((item) => <option key={item} value={item}>{CategoryLabels[item] ?? item}</option>)}
            </select>
          </label>
          <label className="min-w-0 flex-1 sm:w-36 sm:flex-none">
            <span className="sr-only">Filtrar por estado</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-[#1C4378] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
            </select>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400">
        <span>{filteredProducts.length} de {products.length} productos</span>
        {(query || category !== "ALL" || status !== "ALL") ? <button type="button" className="font-medium text-[#1C4378] hover:underline dark:text-[#6FC7DA]" onClick={() => { setQuery(""); setCategory("ALL"); setStatus("ALL"); }}>Limpiar filtros</button> : null}
      </div>

      {filteredProducts.length ? (
        <div className="space-y-2">
          {filteredProducts.map((product) => {
            const presentations = product.presentations.filter((item) => item.isActive);
            const versions = product.formulations.flatMap((formulation) => formulation.versions);
            const currentVersion = versions.find((version) => version.estado === "APPROVED");
            const latestVersion = versions[0];
            const displayedVersion = currentVersion ?? latestVersion;

            return (
              <article key={product.id} className="group rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 sm:px-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#1C4378] dark:bg-slate-800 dark:text-[#6FC7DA]">
                      <Package className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate font-semibold text-slate-900 dark:text-white">{product.nombreComercial}</h2>
                        <Badge variant="outline" className={product.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200" : "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}>{product.isActive ? "Activo" : "Inactivo"}</Badge>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400"><span className="font-mono">{product.codigoInterno}</span><span className="px-1.5 text-slate-300">·</span>{CategoryLabels[product.categoriaProducto] ?? product.categoriaProducto}</p>
                      {product.descripcion ? <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{product.descripcion}</p> : null}
                    </div>
                  </div>

                  <div className="grid gap-3 border-t border-slate-100 pt-3 dark:border-slate-800 sm:min-w-[16rem] sm:max-w-[22rem] sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                    <div>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Presentaciones</p>
                      <div className="flex flex-wrap gap-1.5">
                        {presentations.length ? presentations.slice(0, 4).map((presentation) => <span key={presentation.id} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">{fmtGrams(presentation.gramajeNeto)}{presentation.unidadesPorEmpaque ? ` × ${presentation.unidadesPorEmpaque}` : ""}</span>) : <span className="text-xs text-slate-500">Sin presentaciones activas</span>}
                        {presentations.length > 4 ? <span className="rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-500 dark:bg-slate-800">+{presentations.length - 4}</span> : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Formulación</span>
                      {displayedVersion ? <><span className="font-medium text-slate-700 dark:text-slate-200">{currentVersion ? `Vigente v${currentVersion.numeroSecuencial}` : `Última v${latestVersion?.numeroSecuencial}`}</span><Badge variant="outline" className={StateStyles[displayedVersion.estado] ?? StateStyles.DRAFT}>{displayedVersion.estado === "APPROVED" ? "Aprobada" : displayedVersion.estado === "IN_REVIEW" ? "En revisión" : displayedVersion.estado === "OBSOLETE" ? "Obsoleta" : "Borrador"}</Badge></> : <span className="text-slate-500 dark:text-slate-400">Sin versiones</span>}
                    </div>
                  </div>

                  <Button asChild variant="outline" size="sm" className="h-9 shrink-0 border-slate-200 text-[#1C4378] hover:bg-blue-50 hover:text-[#1C4378] dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                    <Link href={`/productos/${product.id}`}><Eye className="mr-1.5 h-4 w-4" />Ver ficha</Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800"><Search className="h-5 w-5" /></div>
          <h2 className="mt-4 font-semibold text-slate-900 dark:text-white">No encontramos productos</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pruebe otro nombre, código o combinación de filtros.</p>
          <button type="button" className="mt-3 text-sm font-medium text-[#1C4378] hover:underline dark:text-[#6FC7DA]" onClick={() => { setQuery(""); setCategory("ALL"); setStatus("ALL"); }}>Limpiar búsqueda y filtros</button>
        </div>
      )}
    </section>
  );
}
