import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Eye } from "lucide-react";

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

const EstadoVersionBadgeClass: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  IN_REVIEW: "bg-amber-100 text-amber-800 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  OBSOLETE: "bg-zinc-200 text-zinc-700 border-zinc-300",
};

export function ProductsTable({ products }: ProductsTableProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {products.map((p) => {
        const presentations = p.presentations.filter((x) => x.isActive);
        const versions = p.formulations.flatMap((f) => f.versions);
        const vigente = versions.find((v) => v.estado === "APPROVED");
        const ultima = versions[0];
        return (
          <Card key={p.id} className="border-[#D3D8DE]">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold text-[#1F2933]">
                  {p.nombreComercial}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {p.codigoInterno} · {CategoryLabels[p.categoriaProducto] ?? p.categoriaProducto}
                </p>
              </div>
              <Badge
                variant="outline"
                className={p.isActive
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-zinc-200 bg-zinc-100 text-zinc-600"}
              >
                {p.isActive ? "Activo" : "Inactivo"}
              </Badge>
              {p.nombreComercial.toLowerCase().startsWith("demo") ? (
                <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5">
                  Demo
                </span>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {p.descripcion ? (
                <p className="text-muted-foreground line-clamp-2">{p.descripcion}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {presentations.slice(0, 4).map((pres) => (
                  <Badge key={pres.id} variant="outline" className="border-[#D3D8DE] bg-[#F5F7FA] text-[#1F2933]">
                    {fmtGrams(pres.gramajeNeto)}
                    {pres.unidadesPorEmpaque ? ` × ${pres.unidadesPorEmpaque}` : ""}
                  </Badge>
                ))}
                {presentations.length > 4 ? (
                  <Badge variant="outline" className="border-[#D3D8DE] bg-[#F5F7FA] text-[#1F2933]">
                    +{presentations.length - 4}
                  </Badge>
                ) : null}
                {presentations.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Sin presentaciones registradas.</span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Package className="size-4 text-[#1C4378]" />
                <span className="text-xs text-muted-foreground">
                  {versions.length === 0
                    ? "Sin versiones"
                    : vigente
                      ? `Versión vigente v${vigente.numeroSecuencial}`
                      : ultima
                        ? `Última v${ultima.numeroSecuencial}`
                        : "Sin versiones"}
                </span>
                {ultima ? (
                  <Badge
                    variant="outline"
                    className={EstadoVersionBadgeClass[ultima.estado] ?? "bg-slate-100 text-slate-700 border-slate-200"}
                  >
                    {ultima.estado}
                  </Badge>
                ) : null}
              </div>
              <div className="flex justify-end pt-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/productos/${p.id}`}>
                    <Eye className="mr-1 size-4" /> Ver detalle
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
