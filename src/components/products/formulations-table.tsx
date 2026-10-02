"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, CheckCircle2, CircleDashed, Clock3, Search, SlidersHorizontal } from "lucide-react";

export interface FormulationListEntry {
  id: string;
  name: string;
  code: string;
  category: string;
  versions: Array<{ number: number; status: string }>;
  approvedVersion: number | null;
  latestVersion: { number: number; status: string } | null;
}

const statusLabel: Record<string, string> = { DRAFT: "Borrador", IN_REVIEW: "En revisión", APPROVED: "Aprobada", OBSOLETE: "Obsoleta" };
const statusStyle: Record<string, string> = {
  DRAFT: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  IN_REVIEW: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  OBSOLETE: "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export function FormulationsTable({ entries, categoryLabels, reviewCount }: { entries: FormulationListEntry[]; categoryLabels: Record<string, string>; reviewCount: number }) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState("ALL");
  const categories = useMemo(() => [...new Set(entries.map((entry) => entry.category))].sort((a, b) => (categoryLabels[a] ?? a).localeCompare(categoryLabels[b] ?? b, "es")), [entries, categoryLabels]);
  const [category, setCategory] = useState("ALL");
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("es");
    return entries.filter((entry) => {
      const matchesQuery = !needle || `${entry.name} ${entry.code}`.toLocaleLowerCase("es").includes(needle);
      const matchesCategory = category === "ALL" || entry.category === category;
      const matchesState = state === "ALL" || entry.latestVersion?.status === state || (state === "APPROVED" && entry.approvedVersion !== null);
      return matchesQuery && matchesCategory && matchesState;
    });
  }, [entries, query, category, state]);

  return (
    <section className="space-y-3" aria-label="Listado de formulaciones">
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[minmax(15rem,1fr)_auto] sm:items-center sm:p-4">
        <label className="relative min-w-0">
          <span className="sr-only">Buscar formulaciones</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar producto o código…" className="h-10 border-slate-200 pl-9 dark:border-slate-700" />
        </label>
        <div className="flex gap-2">
          <label className="relative min-w-0 flex-1 sm:w-44 sm:flex-none">
            <span className="sr-only">Filtrar por categoría</span><SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 w-full appearance-none rounded-md border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-[#1C4378] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><option value="ALL">Todas las categorías</option>{categories.map((item) => <option key={item} value={item}>{categoryLabels[item] ?? item}</option>)}</select>
          </label>
          <label className="min-w-0 flex-1 sm:w-40 sm:flex-none">
            <span className="sr-only">Filtrar por estado de versión</span>
            <select value={state} onChange={(event) => setState(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-[#1C4378] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><option value="ALL">Todos los estados</option><option value="APPROVED">Aprobadas</option><option value="DRAFT">Borradores</option><option value="IN_REVIEW">En revisión{reviewCount ? ` (${reviewCount})` : ""}</option><option value="OBSOLETE">Obsoletas</option></select>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400"><span>{filtered.length} de {entries.length} productos</span>{query || category !== "ALL" || state !== "ALL" ? <button type="button" className="font-medium text-[#1C4378] hover:underline dark:text-[#6FC7DA]" onClick={() => { setQuery(""); setCategory("ALL"); setState("ALL"); }}>Limpiar filtros</button> : null}</div>

      {filtered.length ? <div className="space-y-2">
        {filtered.map((entry) => {
          const latest = entry.latestVersion;
          const isApproved = entry.approvedVersion !== null;
          const displayStatus = isApproved ? "APPROVED" : latest?.status;
          return (
            <article key={entry.id} className="group rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 sm:px-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-[#1C4378] dark:bg-slate-800 dark:text-[#6FC7DA]"><CircleDashed className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-semibold text-slate-900 dark:text-white">{entry.name}</h2>{displayStatus ? <Badge variant="outline" className={statusStyle[displayStatus] ?? statusStyle.DRAFT}>{statusLabel[displayStatus] ?? displayStatus}</Badge> : null}</div>
                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400"><span className="font-mono">{entry.code}</span><span className="px-1.5 text-slate-300">·</span>{categoryLabels[entry.category] ?? entry.category}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 dark:border-slate-800 sm:min-w-[15rem] sm:border-l sm:border-t-0 sm:px-5 sm:pt-0">
                  <div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Versiones</p><p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">{entry.versions.length} registradas</p></div>
                  <div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Vigente</p><p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-800 dark:text-slate-200">{isApproved ? <><CheckCircle2 className="h-4 w-4 text-emerald-600" />v{entry.approvedVersion}</> : latest?.status === "IN_REVIEW" ? <><Clock3 className="h-4 w-4 text-amber-600" />En revisión</> : <span className="text-slate-500">Sin aprobación</span>}</p></div>
                </div>
                <Button asChild variant="outline" size="sm" className="h-9 shrink-0 border-slate-200 text-[#1C4378] hover:bg-blue-50 hover:text-[#1C4378] dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><Link href={`/productos/${entry.id}`}>Ver versiones<ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
              </div>
            </article>
          );
        })}
      </div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800"><Search className="h-5 w-5" /></div><h2 className="mt-4 font-semibold text-slate-900 dark:text-white">No encontramos formulaciones</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pruebe con otro nombre, código, categoría o estado.</p><button type="button" className="mt-3 text-sm font-medium text-[#1C4378] hover:underline dark:text-[#6FC7DA]" onClick={() => { setQuery(""); setCategory("ALL"); setState("ALL"); }}>Limpiar filtros</button></div>}
    </section>
  );
}
